import * as pdfjsLib from 'pdfjs-dist'
import { sanitizeJsonString } from '../ai/textSanitizer'

pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs'

// PDF → plain text, up to first 30 pages
export async function extractTextFromPDF(file) {
  const buf = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise
  const maxPages = Math.min(pdf.numPages, 30)
  const chunks = []

  for (let p = 1; p <= maxPages; p++) {
    const page = await pdf.getPage(p)
    const content = await page.getTextContent()
    const text = content.items
      .map(it => ('str' in it ? it.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (text) chunks.push(text)
  }

  return chunks.join('\n\n')
}

// Image → structured analysis via Groq vision (free model)
export async function analyzeImageWithGroq(imageUrl) {
  const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY
  if (!GROQ_KEY) {
    console.warn('No GROQ key — skipping image analysis')
    return null
  }

  const system = `You analyze a brand reference image (a screenshot, post, banner, or design reference).
Output ONLY valid JSON, no preamble, no code fences.

Schema:
{
  "type": "post | banner | brand_guidelines | competitor | other",
  "summary": "2-3 sentence description of what this image shows",
  "visualStyle": "1 sentence describing the visual style (typography, colors, layout)",
  "tone": "1-3 words: bold, premium, playful, minimal, corporate, etc.",
  "colors": ["#hex1", "#hex2", "#hex3"],
  "keyMessage": "if there's text, summarize the message in one sentence; else empty string",
  "insights": "1-2 sentences describing what about this reference is worth emulating"
}`

  const body = {
    model: 'llama-3.2-90b-vision-preview',
    max_tokens: 600,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Analyze this brand reference image.' },
          { type: 'image_url', image_url: { url: imageUrl } },
        ],
      },
    ],
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      console.error('Groq vision error:', res.status, await res.text())
      return null
    }
    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content || ''
    try {
      return JSON.parse(sanitizeJsonString(raw))
    } catch {
      return { raw }
    }
  } catch (e) {
    console.error('Groq vision failed:', e)
    return null
  }
}

// Builds a compact brandIntel summary from uploaded files.
// Called once after onboarding submission to bake intel into clientData.
export function buildBrandIntel(files = []) {
  if (!files.length) return null

  const pdfTexts = files
    .filter(f => f.type === 'application/pdf' && f.extractedText)
    .map(f => `### From "${f.name}":\n${f.extractedText}`)
    .join('\n\n')

  const imageAnalyses = files
    .filter(f => f.type?.startsWith('image/') && f.analysis)
    .map(f => ({
      name: f.name,
      ...f.analysis,
    }))

  const allColors = imageAnalyses
    .flatMap(a => a.colors || [])
    .filter(Boolean)
  const uniqueColors = [...new Set(allColors)].slice(0, 8)

  const allTones = imageAnalyses
    .map(a => a.tone)
    .filter(Boolean)

  return {
    pdfContent: pdfTexts.slice(0, 12000),
    referenceImages: imageAnalyses,
    aggregatedColors: uniqueColors,
    aggregatedTones: allTones,
    fileCount: files.length,
    processedAt: new Date().toISOString(),
  }
}
