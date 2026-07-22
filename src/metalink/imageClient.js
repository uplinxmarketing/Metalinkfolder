import { supabase } from '../lib/supabase'

function getAdminToken() {
  const token = sessionStorage.getItem('deeplinked_admin_token')
  const expiry = sessionStorage.getItem('deeplinked_admin_token_expires')
  if (!token || !expiry || new Date(expiry) <= new Date()) {
    throw new Error('Your session has expired. Refresh the page and log in again.')
  }
  return token
}

async function unwrapFunctionError(error) {
  const response = error?.context
  if (response && typeof response.json === 'function') {
    try {
      const body = await response.clone().json()
      if (body?.error) return body.error
    } catch {
      // response wasn't JSON — fall through
    }
  }
  return error?.message || 'Image request failed.'
}

// Routes image generation through the metalink-image edge function so the
// Hugging Face token never reaches the browser. Returns a public URL to the
// generated PNG (stored in the metalink-creatives bucket).
export async function generateImage(prompt) {
  const token = getAdminToken()
  const clean = String(prompt || '').trim().slice(0, 2000)
  if (!clean) throw new Error('Empty image prompt.')

  const { data, error } = await supabase.functions.invoke('metalink-image', {
    body: { token, prompt: clean },
  })
  if (error) {
    throw new Error(await unwrapFunctionError(error))
  }
  if (!data?.url) throw new Error(data?.error || 'No image was returned.')
  return data.url
}
