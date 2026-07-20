const MAX_TEXT_LENGTH = 2000
const MAX_SHORT_TEXT_LENGTH = 200
const MAX_EMAIL_LENGTH = 254
const MAX_URL_LENGTH = 2048

// Strips dangerous HTML tags only — does NOT HTML-encode normal punctuation.
// Supabase uses parameterized queries so SQL injection is already prevented.
const DANGEROUS_TAGS_RE = /<(script|iframe|object|embed|form|style|link|meta|base|applet|svg)[^>]*?>[\s\S]*?<\/\1>|<(script|iframe|object|embed|form|style|link|meta|base|applet|svg)[^>]*?\/?>|<!--[\s\S]*?-->/gi

function stripDangerousTags(str) {
  return str.replace(DANGEROUS_TAGS_RE, '')
}

/**
 * Decode HTML entities that may have been stored by the old escapeHtml()
 * implementation. Use this when displaying values written before the fix.
 */
export function decodeStoredEntities(value) {
  if (typeof value !== 'string') return ''
  return value
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

/**
 * Sanitize a general text field: trim, strip dangerous HTML tags, enforce max length.
 * Normal punctuation (apostrophes, quotes, slashes, etc.) is left untouched.
 */
export function sanitizeText(value, maxLength = MAX_TEXT_LENGTH) {
  if (typeof value !== 'string') return ''
  return stripDangerousTags(value.trim()).slice(0, maxLength)
}

/**
 * Sanitize a short text field (names, titles, etc.).
 */
export function sanitizeShortText(value) {
  return sanitizeText(value, MAX_SHORT_TEXT_LENGTH)
}

/**
 * Sanitize and validate an email address.
 * Returns the lowercased email if valid, or '' if invalid.
 */
export function sanitizeEmail(value) {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim().toLowerCase().slice(0, MAX_EMAIL_LENGTH)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  return emailRegex.test(trimmed) ? trimmed : ''
}

/**
 * Sanitize a URL: must be http/https, enforce max length.
 * Returns the URL if valid, or '' if invalid.
 */
export function sanitizeUrl(value) {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim().slice(0, MAX_URL_LENGTH)
  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return ''
    return trimmed
  } catch {
    // If it starts with linkedin.com, prepend https://
    if (trimmed.startsWith('linkedin.com') || trimmed.startsWith('www.linkedin.com')) {
      return sanitizeUrl('https://' + trimmed)
    }
    return ''
  }
}

/**
 * Check if a string is a valid email address.
 */
export function isValidEmail(value) {
  if (typeof value !== 'string' || !value.trim()) return false
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  return emailRegex.test(value.trim())
}

/**
 * Check if a string is a valid LinkedIn profile URL.
 * Accepts linkedin.com/in/... with or without https://
 */
export function isValidLinkedInUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return false
  const normalized = value.trim().startsWith('http') ? value.trim() : 'https://' + value.trim()
  try {
    const url = new URL(normalized)
    const host = url.hostname.replace(/^www\./, '')
    return host === 'linkedin.com' && url.pathname.startsWith('/in/')
  } catch {
    return false
  }
}

/**
 * Sanitize the admin password input before sending to Edge Function.
 * Strips control characters, limits to 100 chars.
 */
export function sanitizeAdminPassword(value) {
  if (typeof value !== 'string') return ''
  // Remove null bytes and ASCII control characters, limit length
  return value.replace(/[\x00-\x1F\x7F]/g, '').slice(0, 100)
}

/**
 * Sanitize an array of strings (for multi-select answers).
 */
export function sanitizeArray(values, maxItemLength = MAX_SHORT_TEXT_LENGTH) {
  if (!Array.isArray(values)) return []
  return values
    .filter(v => typeof v === 'string')
    .map(v => sanitizeText(v, maxItemLength))
    .filter(v => v.length > 0)
    .slice(0, 50) // max 50 items
}
