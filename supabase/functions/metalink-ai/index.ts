// Server-side proxy for Metalink's chat/ad-generation calls. The Anthropic
// and Groq API keys live only as Supabase secrets here — never in the
// client bundle. Callers must present a valid signed admin session token
// (see verify-admin).
//
// Self-contained on purpose (no ../_shared imports): this function is meant
// to be deployable straight from the Supabase dashboard's inline code editor,
// which only manages files within a single function's folder.
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

const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')
const GROQ_KEY = Deno.env.get('GROQ_API_KEY')
const TOKEN_SECRET = Deno.env.get('ADMIN_TOKEN_SECRET')

const MAX_TOKENS_CAP = 8000
const MAX_MESSAGES = 60
const MAX_MESSAGE_CHARS = 20000
const MAX_SYSTEM_CHARS = 40000

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    let body: {
      token?: unknown
      system?: unknown
      messages?: unknown
      maxTokens?: unknown
      model?: unknown
    }
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

    const { system, messages, maxTokens, model } = body

    if (typeof system !== 'string' || system.length > MAX_SYSTEM_CHARS) {
      return new Response(JSON.stringify({ error: 'Invalid system prompt' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
      return new Response(JSON.stringify({ error: 'Invalid messages' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    for (const m of messages as unknown[]) {
      const msg = m as { role?: unknown; content?: unknown }
      if (!msg || typeof msg.content !== 'string' || msg.content.length > MAX_MESSAGE_CHARS ||
        (msg.role !== 'user' && msg.role !== 'assistant')) {
        return new Response(JSON.stringify({ error: 'Invalid message' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    const cappedMaxTokens = Math.min(Math.max(1, Number(maxTokens) || 900), MAX_TOKENS_CAP)
    const chosenModel = typeof model === 'string' && model.length > 0 && model.length <= 100
      ? model
      : 'claude-sonnet-5'
    const cleanMessages = (messages as { role: string; content: string }[]).map(m => ({ role: m.role, content: m.content }))

    if (ANTHROPIC_KEY) {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({ model: chosenModel, max_tokens: cappedMaxTokens, system, messages: cleanMessages }),
        })
        if (res.ok) {
          const data = await res.json()
          // Some models (e.g. claude-sonnet-5) can return a leading
          // "thinking" content block even without extended thinking being
          // requested, which has no .text field - blindly reading content[0]
          // picked that up and treated the real answer right after it as
          // empty, silently falling through to the Groq fallback below.
          const textBlock = (data.content as { type?: string; text?: string }[] | undefined)
            ?.find(b => b.type === 'text')
          const text = textBlock?.text?.trim() || ''
          if (text) {
            return new Response(JSON.stringify({ text, provider: 'anthropic' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }
        } else {
          console.error('Anthropic error:', res.status, await res.text())
        }
      } catch (e) {
        console.error('Anthropic request failed:', e)
      }
    }

    if (GROQ_KEY) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            max_tokens: cappedMaxTokens,
            messages: [{ role: 'system', content: system }, ...cleanMessages],
          }),
        })
        if (res.ok) {
          const data = await res.json()
          const text = data.choices?.[0]?.message?.content?.trim() || ''
          if (text) {
            return new Response(JSON.stringify({ text, provider: 'groq' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }
        } else {
          console.error('Groq error:', res.status, await res.text())
        }
      } catch (e) {
        console.error('Groq request failed:', e)
      }
    }

    return new Response(JSON.stringify({ error: 'No AI provider available or all providers failed.' }), {
      status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
