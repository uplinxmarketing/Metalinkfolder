// Server-side image generator for Metalink ad creatives. Calls Hugging Face's
// free serverless Inference API (FLUX.1-schnell by default), uploads the result
// to the public `metalink-creatives` Storage bucket using the service-role key,
// and returns a public URL. The HF token lives only as a Supabase secret here —
// never in the client bundle. Callers must present a valid signed admin session
// token (same scheme as metalink-ai / verify-admin).
//
// Self-contained on purpose (no ../_shared imports): deployable straight from
// the Supabase dashboard's inline editor.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

async function hmacKey(secret: string) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

function toHex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function verifyAdminToken(secret: string, token: unknown): Promise<boolean> {
  if (!token || typeof token !== 'string') return false
  const parts = token.split('.')
  if (parts.length !== 2) return false
  const [payload, sigHex] = parts

  const expiresAt = Number(payload)
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false

  const key = await hmacKey(secret)
  const expectedSig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  const expectedHex = toHex(expectedSig)

  if (expectedHex.length !== sigHex.length) return false
  let diff = 0
  for (let i = 0; i < expectedHex.length; i++) diff |= expectedHex.charCodeAt(i) ^ sigHex.charCodeAt(i)
  return diff === 0
}

const HF_TOKEN = Deno.env.get('HF_API_TOKEN')
const TOKEN_SECRET = Deno.env.get('ADMIN_TOKEN_SECRET')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const BUCKET = 'metalink-creatives'
const MAX_PROMPT_CHARS = 2000

// Ordered fallback: FLUX.1-schnell first (best free), then SDXL if FLUX is
// unavailable on the free tier. An env override wins if set.
const MODELS = [
  Deno.env.get('HF_IMAGE_MODEL') || 'black-forest-labs/FLUX.1-schnell',
  'stabilityai/stable-diffusion-xl-base-1.0',
].filter((m, i, a) => m && a.indexOf(m) === i)

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Calls one HF model. Returns image bytes on success, or throws with a reason.
// Handles the 503 "model is loading" cold-start by retrying once after the
// estimated wait.
async function generateWithModel(model: string, prompt: string): Promise<Uint8Array> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'image/png',
      },
      body: JSON.stringify({ inputs: prompt, parameters: {}, options: { wait_for_model: true } }),
    })

    if (res.ok) {
      const buf = await res.arrayBuffer()
      const bytes = new Uint8Array(buf)
      // HF sometimes returns a JSON error with a 200; a real PNG/JPEG starts
      // with non-ASCII magic bytes and is far larger than an error blob.
      if (bytes.length < 1000) {
        throw new Error(`Model ${model} returned an unexpectedly small response`)
      }
      return bytes
    }

    // Cold start: model is spinning up. Retry once.
    if (res.status === 503 && attempt === 0) {
      let wait = 8
      try {
        const body = await res.json()
        if (typeof body?.estimated_time === 'number') wait = Math.min(body.estimated_time, 20)
      } catch { /* ignore */ }
      await sleep(wait * 1000)
      continue
    }

    const errText = await res.text().catch(() => '')
    throw new Error(`HF ${model} error ${res.status}: ${errText.slice(0, 200)}`)
  }
  throw new Error(`Model ${model} did not become ready`)
}

async function uploadToStorage(bytes: Uint8Array): Promise<string> {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error('Storage not configured (missing SUPABASE_URL / SERVICE_ROLE_KEY)')
  }
  const path = `${crypto.randomUUID()}.png`
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'image/png',
      'x-upsert': 'true',
    },
    body: bytes,
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`Storage upload failed ${res.status}: ${t.slice(0, 200)}`)
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    let body: { token?: unknown; prompt?: unknown }
    try {
      body = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!TOKEN_SECRET) {
      console.error('ADMIN_TOKEN_SECRET secret is not set')
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!(await verifyAdminToken(TOKEN_SECRET, body.token))) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!HF_TOKEN) {
      return new Response(JSON.stringify({ error: 'Image generation is not configured. Set the HF_API_TOKEN secret in Supabase.' }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const prompt = typeof body.prompt === 'string' ? body.prompt.trim().slice(0, MAX_PROMPT_CHARS) : ''
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Missing image prompt' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let lastError = ''
    for (const model of MODELS) {
      try {
        const bytes = await generateWithModel(model, prompt)
        const url = await uploadToStorage(bytes)
        return new Response(JSON.stringify({ url, model }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e)
        console.error(lastError)
        // try next model
      }
    }

    return new Response(JSON.stringify({ error: `Image generation failed. ${lastError}` }), {
      status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
