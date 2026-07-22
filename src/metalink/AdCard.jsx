import { useState } from 'react'
import { AD_ANGLES } from './adAngles.js'

async function downloadImage(url, filename) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    const objUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objUrl
    a.download = filename
    a.click()
    URL.revokeObjectURL(objUrl)
  } catch {
    // Fallback: open in a new tab so the user can save manually.
    window.open(url, '_blank', 'noopener')
  }
}

const C = {
  surface: '#FFFFFF',
  surface2: '#FAF7F1',
  border: '#E0DAD0',
  borderMed: 'rgba(26,26,31,0.16)',
  text: '#1A1A1F',
  textMuted: '#5E5C58',
  textDim: '#9B9690',
  success: '#2D7A4F',
  successBg: 'rgba(45,122,79,0.08)',
  successBorder: 'rgba(45,122,79,0.30)',
  warn: '#A07E3A',
  warnBg: 'rgba(160,126,58,0.06)',
}

const MOTION = { fast: '130ms cubic-bezier(0.4, 0, 0.2, 1)' }

function CopyBtn({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  return (
    <button
      onClick={copy}
      style={{
        padding: '4px 11px', borderRadius: 6,
        border: `1px solid ${copied ? C.successBorder : C.border}`,
        background: copied ? C.successBg : 'transparent',
        color: copied ? C.success : C.textDim,
        fontSize: 11, fontFamily: "'DM Sans', sans-serif",
        fontWeight: 600, cursor: 'pointer',
        transition: `all ${MOTION.fast}`, whiteSpace: 'nowrap', flexShrink: 0,
      }}
      onMouseEnter={e => { if (!copied) { e.currentTarget.style.borderColor = C.borderMed; e.currentTarget.style.color = C.textMuted } }}
      onMouseLeave={e => { if (!copied) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textDim } }}
    >
      {copied ? '✓ Copied' : label}
    </button>
  )
}

function FieldBlock({ label, value, bold }) {
  return (
    <div style={{
      padding: '12px 14px',
      background: C.surface2,
      border: `1px solid ${C.border}`,
      borderRadius: 8,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 7,
      }}>
        <span style={{
          fontSize: 10, fontFamily: "'Archivo', sans-serif",
          fontWeight: 800, letterSpacing: '0.08em',
          color: C.textDim, textTransform: 'uppercase',
        }}>
          {label}
        </span>
        <CopyBtn text={value} />
      </div>
      <div style={{
        fontSize: 13, fontFamily: "'DM Sans', sans-serif",
        color: C.text, lineHeight: 1.55,
        fontWeight: bold ? 700 : 400,
      }}>
        {value}
      </div>
    </div>
  )
}

function CreativeBlock({ ad, index, color, onRegenerate }) {
  const [regenerating, setRegenerating] = useState(false)
  const [error, setError] = useState('')

  const hasImage = !!ad.imageUrl
  const showBlock = hasImage || ad.imageError || onRegenerate

  if (!showBlock) return null

  async function regen() {
    if (!onRegenerate || regenerating) return
    setRegenerating(true)
    setError('')
    try {
      await onRegenerate(index)
    } catch (e) {
      setError(e?.message || 'Could not generate image.')
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <div style={{
      border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden',
      background: C.surface2,
    }}>
      <div style={{ position: 'relative', aspectRatio: '1 / 1', background: '#EDE8E0' }}>
        {hasImage && (
          <img
            src={ad.imageUrl}
            alt={`Creative for ${ad.angle}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}
        {!hasImage && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20, textAlign: 'center',
            fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: C.textDim, lineHeight: 1.5,
          }}>
            {regenerating
              ? 'Generating creative...'
              : (ad.imageError || 'No creative yet.')}
          </div>
        )}
        {regenerating && hasImage && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: C.text, fontWeight: 600,
          }}>Regenerating...</div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '8px 10px', alignItems: 'center' }}>
        <span style={{
          fontSize: 10, fontFamily: "'Archivo', sans-serif", fontWeight: 800,
          letterSpacing: '0.08em', color: C.textDim, textTransform: 'uppercase',
        }}>Creative</span>
        <div style={{ flex: 1 }} />
        {hasImage && (
          <button
            onClick={() => downloadImage(ad.imageUrl, `metalink-ad-${index + 1}.png`)}
            style={{
              padding: '4px 11px', borderRadius: 6, border: `1px solid ${C.border}`,
              background: 'transparent', color: C.textDim, fontSize: 11,
              fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: 'pointer',
            }}
          >Download</button>
        )}
        {onRegenerate && (
          <button
            onClick={regen}
            disabled={regenerating}
            style={{
              padding: '4px 11px', borderRadius: 6, border: `1px solid ${color}44`,
              background: `${color}12`, color, fontSize: 11,
              fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
              cursor: regenerating ? 'not-allowed' : 'pointer', opacity: regenerating ? 0.6 : 1,
            }}
          >{hasImage ? 'Regenerate' : 'Generate'}</button>
        )}
      </div>
      {error && (
        <div style={{ padding: '0 10px 8px', fontSize: 11, color: '#B9342F', fontFamily: "'DM Sans', sans-serif" }}>
          {error}
        </div>
      )}
    </div>
  )
}

export default function AdCard({ ad, index, onRegenerate }) {
  const [expanded, setExpanded] = useState(false)

  const angleData = AD_ANGLES.find(a => a.name === ad.angle) || AD_ANGLES[index] || AD_ANGLES[0]
  const color = ad.color || angleData.color
  const tag = ad.tag || angleData.tag

  const fullAdText = `PRIMARY TEXT:\n${ad.primaryText}\n\nHEADLINE: ${ad.headline}\n\nDESCRIPTION: ${ad.description}${ad.creativeBrief ? `\n\nCREATIVE BRIEF:\n${ad.creativeBrief}` : ''}`
  const wordCount = ad.primaryText.trim().split(/\s+/).filter(Boolean).length

  const previewLines = ad.primaryText.split('\n').slice(0, 3).join('\n')
  const hasMore = ad.primaryText.split('\n').length > 3

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 13,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      transition: `border-color ${MOTION.fast}, box-shadow ${MOTION.fast}`,
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}30`; e.currentTarget.style.boxShadow = `0 0 0 1px ${color}18` }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = 'none' }}
    >
      {/* Top accent line */}
      <div style={{ height: 2, background: `linear-gradient(90deg, ${color}, ${color}44)` }} />

      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        background: `${color}06`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{
            fontSize: 10, fontFamily: "'Archivo', sans-serif",
            fontWeight: 800, letterSpacing: '0.07em',
            padding: '3px 8px', borderRadius: 5,
            background: `${color}18`, color: color, flexShrink: 0,
          }}>
            {tag}
          </span>
          <span style={{
            fontSize: 12, fontFamily: "'DM Sans', sans-serif",
            color: C.textMuted, fontWeight: 500,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {ad.angle}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: C.textDim, fontFamily: "'DM Sans', sans-serif" }}>
            #{index + 1} · {wordCount}w
          </span>
          <CopyBtn text={fullAdText} label="Copy all" />
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {/* Generated creative */}
        <CreativeBlock ad={ad} index={index} color={color} onRegenerate={onRegenerate} />

        {/* Primary text */}
        <div style={{
          padding: '13px 14px',
          background: C.surface2,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 8,
          }}>
            <span style={{
              fontSize: 10, fontFamily: "'Archivo', sans-serif",
              fontWeight: 800, letterSpacing: '0.08em',
              color: C.textDim, textTransform: 'uppercase',
            }}>
              Primary Text
            </span>
            <CopyBtn text={ad.primaryText} />
          </div>
          <div style={{
            fontSize: 13, fontFamily: "'DM Sans', sans-serif",
            color: C.text, lineHeight: 1.75, whiteSpace: 'pre-wrap',
          }}>
            {expanded ? ad.primaryText : previewLines}
          </div>
          {hasMore && (
            <button
              onClick={() => setExpanded(p => !p)}
              style={{
                marginTop: 8, background: 'transparent', border: 'none',
                cursor: 'pointer', fontSize: 11,
                fontFamily: "'DM Sans', sans-serif",
                color: color, fontWeight: 600, padding: 0,
              }}
            >
              {expanded ? 'Collapse' : 'Read full ad...'}
            </button>
          )}
        </div>

        <FieldBlock label="Headline" value={ad.headline} bold />
        <FieldBlock label="Description" value={ad.description} />

        {ad.creativeBrief && (
          <div style={{
            padding: '12px 14px',
            background: C.warnBg,
            border: `1px solid ${C.warn}30`,
            borderRadius: 8,
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 7,
            }}>
              <span style={{
                fontSize: 10, fontFamily: "'Archivo', sans-serif",
                fontWeight: 800, letterSpacing: '0.08em',
                color: C.warn, textTransform: 'uppercase',
              }}>
                Creative Brief
              </span>
              <CopyBtn text={ad.creativeBrief} />
            </div>
            <div style={{
              fontSize: 13, fontFamily: "'DM Sans', sans-serif",
              color: C.text, lineHeight: 1.55,
            }}>
              {ad.creativeBrief}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
