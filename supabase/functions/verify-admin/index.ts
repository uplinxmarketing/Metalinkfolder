// Self-contained on purpose (no ../_shared imports): this function is meant
// to be deployable straight from the Supabase dashboard's inline code editor,
// which only manages files within a single function's folder.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  // 'authorization' must be listed here — the Supabase gateway enforces this
  // during the CORS preflight before passing the request to the function.
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

async function signAdminToken(secret: string, ttlMs = 24 * 60 * 60 * 1000) {
  const expiresAt = Date.now() + ttlMs
  const payload = `${expiresAt}`
  const key = await hmacKey(secret)
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return { token: `${payload}.${toHex(sig)}`, expiresAt: new Date(expiresAt).toISOString() }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    let body: { password?: unknown }
    try {
      body = await req.json()
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { password } = body

    if (!password || typeof password !== 'string' || password.length === 0 || password.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Invalid request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const adminPassword = Deno.env.get('ADMIN_PASSWORD')
    const tokenSecret = Deno.env.get('ADMIN_TOKEN_SECRET')

    if (!adminPassword || !tokenSecret) {
      console.error('ADMIN_PASSWORD or ADMIN_TOKEN_SECRET secret is not set')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (password !== adminPassword) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Password correct — issue a signed, stateless session token (24h).
    // No DB writes needed: the token lives in the browser's sessionStorage
    // only, and any other edge function can verify its signature and
    // expiry on its own using the shared ADMIN_TOKEN_SECRET.
    const { token, expiresAt } = await signAdminToken(tokenSecret)

    return new Response(
      JSON.stringify({ token, expiresAt }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
