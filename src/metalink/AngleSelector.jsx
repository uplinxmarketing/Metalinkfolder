import { useState } from 'react'
import { AD_ANGLES } from './adAngles'

const C = {
  surface: '#FFFFFF',
  surface2: '#FAF7F1',
  border: '#E0DAD0',
  text: '#1A1A1F',
  textMuted: '#5E5C58',
  textDim: '#9B9690',
  textInverse: '#F3EFE9',
  accent: '#262F46',
}

const MAX_ANGLES = 10

export default function AngleSelector({ client, onBack, onGenerate }) {
  const [selected, setSelected] = useState(() => AD_ANGLES.slice(0, MAX_ANGLES).map(a => a.id))

  function toggle(id) {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= MAX_ANGLES) return prev
      return [...prev, id]
    })
  }

  const chosenAngles = AD_ANGLES.filter(a => selected.includes(a.id))

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <button onClick={onBack} style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        fontSize: 13, color: C.textDim, fontFamily: "'DM Sans', sans-serif",
        marginBottom: 18,
      }}>← Back to brief</button>

      <h1 style={{
        fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 34,
        color: C.text, margin: '0 0 6px', letterSpacing: '-0.02em',
      }}>
        Pick your angles — {client?.name || 'Client'}
      </h1>
      <p style={{ fontSize: 14, color: C.textMuted, fontFamily: "'DM Sans', sans-serif", marginBottom: 26 }}>
        Choose up to {MAX_ANGLES}. One ad per angle.
      </p>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 10, marginBottom: 28,
      }}>
        {AD_ANGLES.map(a => {
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
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{
                  width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                  border: `1.5px solid ${sel ? a.color : C.border}`,
                  background: sel ? a.color : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, color: C.textInverse,
                }}>{sel && '✓'}</span>
                <span style={{
                  fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 10,
                  letterSpacing: '0.05em', color: a.color,
                }}>{a.tag}</span>
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 3 }}>
                {a.name}
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.textMuted, lineHeight: 1.4 }}>
                {a.brief}
              </div>
            </button>
          )
        })}
      </div>

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
          onClick={() => onGenerate(chosenAngles)}
          disabled={selected.length === 0}
          style={{
            padding: '12px 28px', borderRadius: 10,
            cursor: selected.length === 0 ? 'not-allowed' : 'pointer',
            background: selected.length === 0 ? 'rgba(38,47,70,0.25)' : C.accent,
            border: 'none', color: C.textInverse,
            fontSize: 14, fontWeight: 700, fontFamily: "'Archivo', sans-serif",
            opacity: selected.length === 0 ? 0.5 : 1,
          }}
        >
          Generate {selected.length || ''} Ad{selected.length !== 1 ? 's' : ''} →
        </button>
      </div>
    </div>
  )
}
