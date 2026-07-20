import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { C, MOTION, Badge } from '../components/ToolPage'
import { extractTextFromPDF, analyzeImageWithGroq } from './fileIntelligence'

const DOCX_TYPES = [
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export default function FileUploadField({
  value = [],
  onChange,
  accept = 'application/pdf,image/png,image/jpeg,image/webp',
  maxFiles = 8,
  maxSizeMB = 10,
  clientId,
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dropHover, setDropHover] = useState(false)
  const inputRef = useRef(null)

  async function handleFiles(fileList) {
    setError('')
    const files = Array.from(fileList)
    if (value.length + files.length > maxFiles) {
      setError(`Max ${maxFiles} files total.`)
      return
    }
    const oversized = files.find(f => f.size > maxSizeMB * 1024 * 1024)
    if (oversized) {
      setError(`"${oversized.name}" is larger than ${maxSizeMB}MB.`)
      return
    }

    setUploading(true)
    const newEntries = []

    for (const file of files) {
      const key = `${Date.now()}_${file.name}`
      try {
        const path = `onboarding/${clientId || 'temp'}/${key}`
        const { data, error: upErr } = await supabase.storage
          .from('client-files')
          .upload(path, file, { cacheControl: '31536000', upsert: false })
        if (upErr) throw upErr

        const { data: urlData } = supabase.storage
          .from('client-files')
          .getPublicUrl(data.path)

        let extractedText = ''
        let analysis = null
        try {
          if (file.type === 'application/pdf') {
            extractedText = await extractTextFromPDF(file)
          } else if (DOCX_TYPES.includes(file.type)) {
            const { extractDocument } = await import('../repurpose-studio/documentExtractor')
            const doc = await extractDocument(file)
            extractedText = doc.text
          } else if (file.type.startsWith('image/')) {
            analysis = await analyzeImageWithGroq(urlData.publicUrl)
          }
        } catch (e) {
          console.error('Extraction failed (non-fatal):', e)
        }

        newEntries.push({
          name: file.name,
          url: urlData.publicUrl,
          path: data.path,
          type: file.type,
          sizeKB: Math.round(file.size / 1024),
          extractedText: extractedText.slice(0, 8000),
          analysis,
          uploadedAt: new Date().toISOString(),
        })
      } catch (e) {
        console.error('Upload failed:', e)
        setError(`Upload failed for "${file.name}". ${e.message || ''}`)
      }
    }

    onChange([...value, ...newEntries])
    setUploading(false)
  }

  function handleRemove(idx) {
    const file = value[idx]
    if (file?.path) {
      supabase.storage.from('client-files').remove([file.path]).catch(() => {})
    }
    onChange(value.filter((_, i) => i !== idx))
  }

  function handleDrop(e) {
    e.preventDefault()
    setDropHover(false)
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files)
  }

  return (
    <div style={{ width: '100%' }}>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDropHover(true) }}
        onDragLeave={() => setDropHover(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dropHover ? C.interactive : C.border}`,
          borderRadius: 12,
          padding: '36px 24px',
          textAlign: 'center',
          background: dropHover ? C.interactiveMuted : C.surface,
          cursor: 'pointer',
          transition: `all ${MOTION.fast}`,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Archivo', sans-serif", color: C.text, marginBottom: 6 }}>
          Drop files here or click to browse
        </div>
        <div style={{ fontSize: 13, color: C.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
          PDF, Word, PNG, JPG · up to {maxSizeMB}MB each · max {maxFiles} files
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          onChange={e => handleFiles(e.target.files)}
          style={{ display: 'none' }}
        />
      </div>

      {error && (
        <div style={{
          marginTop: 12, padding: '12px 14px', borderRadius: 10,
          background: C.errorBg, color: C.error,
          border: `1px solid ${C.error}`,
          fontSize: 13, fontFamily: "'DM Sans', sans-serif",
          animation: 'fadeIn 0.3s ease-out',
        }}>
          ⚠ {error}
        </div>
      )}

      {value.length > 0 && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {value.map((f, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px', background: C.surface,
              border: `1px solid ${C.border}`, borderRadius: 10,
              animation: 'fadeIn 0.3s ease-out',
            }}>
              <Badge color="accent">
                {f.type === 'application/pdf' ? 'PDF' : DOCX_TYPES.includes(f.type) ? 'DOC' : 'IMG'}
              </Badge>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 14, fontWeight: 600, color: C.text,
                  fontFamily: "'DM Sans', sans-serif",
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{f.name}</div>
                <div style={{ fontSize: 11, color: C.textMuted, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>
                  {f.sizeKB}KB
                  {f.extractedText && ' · text extracted'}
                  {f.analysis && ' · analyzed'}
                </div>
              </div>
              <button onClick={() => handleRemove(i)} style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: C.textDim, fontSize: 18, padding: 4, lineHeight: 1,
                transition: `color ${MOTION.fast}`,
              }}
                onMouseEnter={e => e.currentTarget.style.color = C.error}
                onMouseLeave={e => e.currentTarget.style.color = C.textDim}
              >×</button>
            </div>
          ))}
        </div>
      )}

      {uploading && (
        <div style={{ marginTop: 12, fontSize: 12, color: C.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
          Processing files (reading PDFs, analyzing images)…
        </div>
      )}
    </div>
  )
}
