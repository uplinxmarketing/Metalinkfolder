import { useEffect, useState } from 'react'
import { mineAngles } from './angleMiner.js'
import AngleSelector from './AngleSelector.jsx'

const C = {
  surface: '#FFFFFF',
  surface2: '#FAF7F1',
  border: '#E0DAD0',
  text: '#1A1A1F',
  textMuted: '#5E5C58',
  textDim: '#9B9690',
  textInverse: '#F3EFE9',
  accent: '#262F46',
  accentMuted: 'rgba(38, 47, 70, 0.08)',
  error: '#B9342F',
  errorBg: 'rgba(185, 52, 47, 0.06)',
}

const MAX_ANGLES = 10

function SkeletonGrid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10, marginBottom: 28 }}>
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} style={{
          height: 132, borderRadius: 12, background: C.surface2,
          border: `1px solid ${C.border}`, opacity: 0.6,
        }}>
          <style>{'@keyframes mlPulse { 0%,100% { opacity: 0.4 } 50% { opacity: 0.8 } }'}</style>
          <div style={{ width: '100%', height: '100%', animation: 'mlPulse 1.3s ease-in-out infinite', animationDelay: `${i * 70}ms` }} />
        </div>
      ))}
    </div>
  )
}

export default function MegaAngleSelector({ client, onBack, onGenerate }) {
  const [mode, setMode] = useState('mega')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [angles, setAngles] = useState([])
  const [selected, setSelected] = useState([])

  async function mine() {
    setLoading(true)
    setError('')
    try {
      const mined = await mineAngles(client?.chat_summary || '')
      setAngles(mined)
      setSelected(mined.slice(0, 8).map(a => a.id))
    } catch (e) {
      setError(e.message || 'Angle mining failed.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { mine() }, []) // eslint-disable-line

  function toggle(id) {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= MAX_ANGLES) return prev
      return [...prev, id]
    })
  }

  if (mode === 'classic') {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <button onClick={() => setMode('mega')} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          fontSize: 13, color: C.textDim, fontFamily: "'DM Sans', sans-serif", marginBottom: 18,
        }}>← Back to mined angles</button>
        <AngleSelector client={client} onBack={onBack} onGenerate={onGenerate} />
      </div>
    )
  }

  const chosen = angles.filter(a => selected.includes(a.id))

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <button onClick={onBack} style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        fontSize: 13, color: C.textDim, fontFamily: "'DM Sans', sans-serif", marginBottom: 18,
      }}>← Back to brief</button>

      <h1 style={{
        fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 34,
        color: C.text, margin: '0 0 6px', letterSpacing: '-0.02em',
      }}>
        Mega angles — {client?.name || 'Client'}
      </h1>
      <p style={{ fontSize: 14, color: C.textMuted, fontFamily: "'DM Sans', sans-serif", marginBottom: 20 }}>
        Mined fresh from this client's brief — not a generic template. Choose up to {MAX_ANGLES}.
      </p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 22, flexWrap: 'wrap' }}>
        <button onClick={mine} disabled={loading} style={{
          padding: '9px 16px', borderRadius: 9, cursor: loading ? 'not-allowed' : 'pointer',
          background: C.accentMuted, border: `1px solid ${C.border}`,
          color: C.accent, fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
          opacity: loading ? 0.6 : 1,
        }}>🎲 Mine 12 more angles</button>
        <button onClick={() => setMode('classic')} style={{
          padding: '9px 16px', borderRadius: 9, cursor: 'pointer',
          background: 'transparent', border: `1px solid ${C.border}`,
          color: C.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif",
        }}>Use classic angle library instead</button>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px', background: C.errorBg, border: `1px solid ${C.error}`,
          borderRadius: 10, fontSize: 13, color: C.error, fontFamily: "'DM Sans', sans-serif",
          marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <span>{error}</span>
          <button onClick={mine} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: C.error,
            fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", flexShrink: 0,
          }}>Retry</button>
        </div>
      )}

      {loading ? (
        <SkeletonGrid />
      ) : (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 10, marginBottom: 28,
        }}>
          {angles.map(a => {
            const sel = selected.includes(a.id)
            const blocked = !sel && selected.length >= MAX_ANGLES
            return (
              <button
                key={a.id}
                onClick={() => !blocked && toggle(a.id)}
                style={{
                  textAlign: 'left', padding: '14px 16px', borderRadius: 12,
                  background: sel ? `${a.color}10` : C.surface,
                  border: `1.5px solid ${sel ? a.color : C.border}`,
                  cursor: blocked ? 'not-allowed' : 'pointer',
                  opacity: blocked ? 0.4 : 1,
                  transition: '120ms ease',
                  display: 'flex', flexDirection: 'column', gap: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    border: `1.5px solid ${sel ? a.color : C.border}`,
                    background: sel ? a.color : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: C.textInverse,
                  }}>{sel && '✓'}</span>
                  <span style={{
                    fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 9,
                    letterSpacing: '0.05em', color: a.color,
                  }}>{a.tag}</span>
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 14, color: C.text }}>
                  {a.name}
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.textMuted, lineHeight: 1.4 }}>
                  {a.brief}
                </div>
                {a.hook && (
                  <div style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.text,
                    fontStyle: 'italic', lineHeight: 1.4, paddingTop: 4,
                    borderTop: `1px dashed ${C.border}`, marginTop: 2,
                  }}>
                    "{a.hook}"
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      <div style={{
        position: 'sticky', bottom: 20, background: C.surface2,
        border: `1px solid ${C.border}`, borderRadius: 12,
        padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12,
      }}>
        <span style={{ fontSize: 13, color: C.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
          {selected.length} / {MAX_ANGLES} angles selected
        </span>
        <button
          onClick={() => onGenerate(chosen)}
          disabled={selected.length === 0 || loading}
          style={{
            padding: '12px 28px', borderRadius: 10,
            cursor: selected.length === 0 || loading ? 'not-allowed' : 'pointer',
            background: selected.length === 0 || loading ? 'rgba(38,47,70,0.25)' : C.accent,
            border: 'none', color: C.textInverse,
            fontSize: 14, fontWeight: 700, fontFamily: "'Archivo', sans-serif",
            opacity: selected.length === 0 || loading ? 0.5 : 1,
          }}
        >
          Generate {selected.length || ''} Ad{selected.length !== 1 ? 's' : ''} →
        </button>
      </div>
    </div>
  )
}
