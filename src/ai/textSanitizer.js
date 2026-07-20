// Post-processes LLM output to enforce writing rules at the character level.
// This is a safety net — the system prompts should prevent these, but the
// sanitizer catches any that slip through.

export function sanitizeText(text) {
  if (!text || typeof text !== 'string') return text

  return text
    // Replace em dashes with periods (most common LLM tell)
    .replace(/\s*—\s*/g, '. ')
    // Replace en dashes with hyphens or periods depending on context
    .replace(/(\d)\s*–\s*(\d)/g, '$1-$2')  // numeric ranges keep hyphen
    .replace(/\s*–\s*/g, '. ')              // other en dashes become periods
    // Clean up any double periods created by the replacements
    .replace(/\.\s*\./g, '.')
    // Clean up any period immediately after a comma
    .replace(/,\s*\./g, '.')
    // Trim trailing spaces from each line
    .split('\n').map(line => line.trimEnd()).join('\n')
}

// For nested objects, walk all string fields
export function sanitizeObject(obj) {
  if (typeof obj === 'string') return sanitizeText(obj)
  if (Array.isArray(obj)) return obj.map(sanitizeObject)
  if (obj && typeof obj === 'object') {
    const result = {}
    for (const [k, v] of Object.entries(obj)) {
      result[k] = sanitizeObject(v)
    }
    return result
  }
  return obj
}

// Sanitizes LLM JSON output before JSON.parse: escapes raw control characters
// inside string values. The LLM sometimes outputs real newlines/tabs inside
// JSON strings instead of \n / \t escape sequences (more likely the longer
// and more detailed the generated text is), which breaks JSON.parse with
// errors like "Expected ',' or ']' after array element" — the newline
// prematurely ends what JSON.parse reads as the current line, desyncing the
// rest of the array/object structure. Any code that calls JSON.parse() on
// raw LLM output should run it through this first.
export function sanitizeJsonString(text) {
  let cleaned = text.replace(/```json|```/g, '').trim()

  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  if (firstBrace === -1 || lastBrace === -1) return cleaned
  cleaned = cleaned.slice(firstBrace, lastBrace + 1)

  let result = ''
  let inString = false
  let escaped = false

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i]
    const code = ch.charCodeAt(0)

    if (escaped) {
      result += ch
      escaped = false
      continue
    }

    if (ch === '\\') {
      result += ch
      escaped = true
      continue
    }

    if (ch === '"') {
      result += ch
      inString = !inString
      continue
    }

    if (inString && code < 0x20) {
      if (ch === '\n') result += '\\n'
      else if (ch === '\r') result += '\\r'
      else if (ch === '\t') result += '\\t'
      else if (ch === '\b') result += '\\b'
      else if (ch === '\f') result += '\\f'
      else result += '\\u' + code.toString(16).padStart(4, '0')
      continue
    }

    result += ch
  }

  return result
}
