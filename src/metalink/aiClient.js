import { supabase } from '../lib/supabase'

function getAdminToken() {
  const token = sessionStorage.getItem('deeplinked_admin_token')
  const expiry = sessionStorage.getItem('deeplinked_admin_token_expires')
  if (!token || !expiry || new Date(expiry) <= new Date()) {
    throw new Error('Your session has expired. Refresh the page and log in again.')
  }
  return token
}

// Supabase's FunctionsHttpError only exposes a generic "non-2xx status code"
// message — the actual reason (e.g. "Access denied", "Invalid system prompt")
// is in the raw response body on error.context. Unwrap it so failures are
// actionable instead of always showing the same unhelpful string.
async function unwrapFunctionError(error) {
  const response = error?.context
  if (response && typeof response.json === 'function') {
    try {
      const body = await response.clone().json()
      if (body?.error) return body.error
    } catch {
      // response wasn't JSON — fall through to the generic message
    }
  }
  return error?.message || 'AI request failed.'
}

// Routes every Metalink AI call through the metalink-ai edge function so the
// Anthropic/Groq API keys never reach the browser.
export async function callAI({ system, messages, maxTokens, model }) {
  const token = getAdminToken()
  const { data, error } = await supabase.functions.invoke('metalink-ai', {
    body: { token, system, messages, maxTokens, model },
  })
  if (error) {
    const reason = await unwrapFunctionError(error)
    const hint = reason === 'Access denied'
      ? 'Access denied — your session may be stale. Refresh the page and log in again.'
      : reason
    throw new Error(hint)
  }
  if (!data?.text) throw new Error(data?.error || 'Empty AI response.')
  return data.text
}
