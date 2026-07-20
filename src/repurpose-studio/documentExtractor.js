// Extracts plain text from PDF, DOCX, TXT, or MD files.
// Returns { text, wordCount, sourceType, fileName }

import * as pdfjsLib from 'pdfjs-dist'
import mammoth from 'mammoth'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href

const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15MB
const MAX_TEXT_LENGTH = 50000 // 50k chars

export async function extractDocument(file, onProgress) {
  if (!file) throw new Error('No file provided')
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Max 15MB. Yours is ${(file.size / 1024 / 1024).toFixed(1)}MB.`)
  }

  const name = file.name.toLowerCase()
  let text = ''
  let sourceType = ''

  if (name.endsWith('.pdf')) {
    sourceType = 'pdf'
    text = await extractFromPdf(file, onProgress)
  } else if (name.endsWith('.docx')) {
    sourceType = 'docx'
    text = await extractFromDocx(file, onProgress)
  } else if (name.endsWith('.txt')) {
    sourceType = 'txt'
    text = await extractFromText(file)
  } else if (name.endsWith('.md') || name.endsWith('.markdown')) {
    sourceType = 'markdown'
    text = await extractFromMarkdown(file)
  } else {
    throw new Error('Unsupported file type. Use PDF, DOCX, TXT, or MD.')
  }

  text = cleanExtractedText(text)
  if (!text || text.trim().length < 50) {
    throw new Error('Could not extract meaningful text. The file may be a scanned image, encrypted, or empty.')
  }

  if (text.length > MAX_TEXT_LENGTH) {
    text = text.slice(0, MAX_TEXT_LENGTH) + '\n\n[Document truncated — first 50,000 characters used]'
  }

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length
  return { text, wordCount, sourceType, fileName: file.name }
}

async function extractFromPdf(file, onProgress) {
  onProgress?.({ message: 'Reading PDF...' })
  const arrayBuf = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuf }).promise
  const numPages = pdf.numPages
  let fullText = ''

  for (let i = 1; i <= numPages; i++) {
    onProgress?.({ message: `Extracting page ${i} of ${numPages}...` })
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map(item => ('str' in item ? item.str : ''))
      .join(' ')
    fullText += pageText + '\n\n'
  }
  return fullText
}

async function extractFromDocx(file, onProgress) {
  onProgress?.({ message: 'Reading DOCX...' })
  const arrayBuf = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer: arrayBuf })
  return result.value || ''
}

async function extractFromText(file) {
  return await file.text()
}

async function extractFromMarkdown(file) {
  const raw = await file.text()
  return raw
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`{1,3}([^`]+)`{1,3}/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/!\[.*?\]\(.*?\)/g, '')
}

function cleanExtractedText(text) {
  if (!text) return ''
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/[​-‍﻿]/g, '')
    .trim()
}
