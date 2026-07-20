import { useState, useEffect } from 'react'
import { useClient } from '../context/ClientContext'

// ── PALETTE ─────────────────────────────────────────────────────
export const C = {
  // ── BACKGROUNDS — warm gray, never sterile white ──────
  bg: '#F3EFE9',              // page bg — soft cream/warm gray
  surface: '#FFFFFF',          // card surface
  surfaceRaised: '#FAF7F1',    // raised card / modal
  surfaceHover: '#EFEAE2',     // hover state on surfaces
  surfaceLight: '#FAF7F1',     // legacy alias
  surfaceDark: '#1A1A1F',      // for inverted sections (rare)

  // ── BORDERS ───────────────────────────────────────────
  border: '#E0DAD0',           // hairline divider
  borderStrong: '#1A1A1F',     // emphasis border (deep ink on cream)
  borderAccent: 'rgba(38, 47, 70, 0.25)', // subtle accent border

  // ── TEXT — deep ink, NOT pure black ──────────────────
  text: '#1A1A1F',             // primary — feels considered, not harsh
  textMuted: '#5E5C58',         // muted — warm gray-brown
  textDim: '#9B9690',           // dim — quieter
  textInverse: '#F3EFE9',       // text on dark surfaces
  textSerifAccent: '#1A1A1F',   // for serif display moments

  // ── ACCENTS ───────────────────────────────────────────
  accent: '#262F46',           // deep midnight indigo
  accentHover: '#3A4661',
  accentMuted: 'rgba(38, 47, 70, 0.08)',
  accentGlow: 'rgba(38, 47, 70, 0.14)',
  accentText: '#F3EFE9',       // text on accent bg (warm cream)

  // Interactive: brighter blue for clear "click me" signals
  interactive: '#3A5AFB',
  interactiveHover: '#5772FF',
  interactiveMuted: 'rgba(58, 90, 251, 0.08)',
  interactiveGlow: 'rgba(58, 90, 251, 0.18)',

  // Warm gold for special moments only (badges, callouts) — used sparingly
  warmAccent: '#A07E3A',
  warmAccentMuted: 'rgba(160, 126, 58, 0.10)',

  // ── SEMANTIC (muted, never harsh on light bg) ────────
  success: '#2D7A4F',
  successMuted: 'rgba(45, 122, 79, 0.10)',
  warning: '#A6671E',
  warningMuted: 'rgba(166, 103, 30, 0.10)',
  error: '#B9342F',
  errorMuted: 'rgba(185, 52, 47, 0.10)',
  errorBg: 'rgba(185, 52, 47, 0.06)',

  // ── LEGACY ALIASES (preserve V3 names for unmigrated files) ──
  muted: '#5E5C58',
  dim: '#9B9690',
  purple: '#262F46',
  purpleLight: '#3A4661',
  purpleGlow: 'rgba(38, 47, 70, 0.14)',
  gradient: 'linear-gradient(135deg, #262F46 0%, #3A5AFB 100%)',
}

// ── MOTION TOKENS ────────────────────────────────────────────────
export const MOTION = {
  fast:   '120ms cubic-bezier(0.4, 0, 0.2, 1)',
  base:   '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow:   '320ms cubic-bezier(0.4, 0, 0.2, 1)',
  spring: '400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
}

// ── SPACING ──────────────────────────────────────────────────────
export const SPACE = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48, huge: 64,
}

// ── ELEVATION — softer shadows for light theme ────────────────────────────────────────────────────
export const ELEVATION = {
  flat: '0 1px 0 rgba(26, 26, 31, 0.04)',
  low:  '0 2px 8px rgba(26, 26, 31, 0.06), 0 0 0 1px rgba(26, 26, 31, 0.04)',
  mid:  '0 8px 24px rgba(26, 26, 31, 0.08), 0 0 0 1px rgba(26, 26, 31, 0.04)',
  high: '0 16px 40px rgba(26, 26, 31, 0.12), 0 0 0 1px rgba(38, 47, 70, 0.10)',
  glow: '0 0 0 4px rgba(58, 90, 251, 0.14)',
}

// ── SPINNER ──────────────────────────────────────────────────────
function Spinner({ color = C.text, size = 14 }) {
  return (
    <span style={{
      display: 'inline-block',
      width: size,
      height: size,
      border: `2px solid ${color}`,
      borderTopColor: 'transparent',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
      flexShrink: 0,
    }} />
  )
}

// ── COMPONENTS ───────────────────────────────────────────────────

export function PageTitle({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 40, animation: 'fadeIn 0.4s ease-out' }}>
      <h1 style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 44,
        fontWeight: 600,
        letterSpacing: '-0.015em',
        lineHeight: 1.1,
        color: C.text,
        margin: 0,
        marginBottom: subtitle ? 10 : 0,
      }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 16,
          fontWeight: 400,
          lineHeight: 1.5,
          color: C.textMuted,
          margin: 0,
          maxWidth: 640,
        }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

export function Card({ children, style, hoverable, accent }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => hoverable && setHovered(true)}
      onMouseLeave={() => hoverable && setHovered(false)}
      style={{
        background: C.surface,
        border: `1px solid ${hovered ? C.borderStrong : C.border}`,
        borderRadius: 14,
        padding: 24,
        boxShadow: hovered ? ELEVATION.low : ELEVATION.flat,
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: `transform ${MOTION.base}, box-shadow ${MOTION.base}, border-color ${MOTION.fast}`,
        cursor: hoverable ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function PrimaryButton({ onClick, disabled, loading, children, style }) {
  const [pressed, setPressed] = useState(false)
  const [hovered, setHovered] = useState(false)
  const isDisabled = disabled || loading

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      onMouseEnter={() => !isDisabled && setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false) }}
      onMouseDown={() => !isDisabled && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        position: 'relative',
        padding: '14px 28px',
        background: isDisabled
          ? 'rgba(38, 47, 70, 0.3)'
          : hovered ? C.accentHover : C.accent,
        color: C.accentText,
        border: 'none',
        borderRadius: 10,
        fontFamily: "'Archivo', sans-serif",
        fontSize: 15,
        fontWeight: 700,
        letterSpacing: '-0.005em',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        transform: pressed ? 'translateY(1px) scale(0.99)' : hovered ? 'translateY(-1px)' : 'translateY(0) scale(1)',
        boxShadow: pressed
          ? '0 0 0 0 transparent'
          : hovered
            ? `0 6px 20px ${C.interactiveGlow}`
            : ELEVATION.low,
        transition: `all ${MOTION.fast}`,
        opacity: isDisabled ? 0.5 : 1,
        ...style,
      }}
    >
      {loading ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Spinner color={C.accentText} />
          {children}
        </span>
      ) : children}
    </button>
  )
}

export function SecondaryButton({ onClick, disabled, children, style }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '13px 24px',
        background: hovered ? C.surfaceHover : 'transparent',
        color: C.text,
        border: `1px solid ${C.borderStrong}`,
        borderRadius: 10,
        fontFamily: "'Archivo', sans-serif",
        fontSize: 14,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: `all ${MOTION.fast}`,
        ...style,
      }}
    >
      {children}
    </button>
  )
}

export function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 12px',
        background: copied ? C.successMuted : 'transparent',
        color: copied ? C.success : C.textMuted,
        border: `1px solid ${copied ? C.success : C.border}`,
        borderRadius: 8,
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        transition: `all ${MOTION.base}`,
      }}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

export function TextArea({ value, onChange, placeholder, rows = 6, style }) {
  const [focused, setFocused] = useState(false)
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: '100%',
        padding: '14px 16px',
        background: C.surface,
        color: C.text,
        border: `${focused ? '2px' : '1px'} solid ${focused ? C.interactive : C.border}`,
        borderRadius: 10,
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 15,
        lineHeight: 1.5,
        outline: 'none',
        resize: 'vertical',
        boxShadow: focused ? `0 0 0 4px ${C.interactiveGlow}` : 'none',
        transition: `all ${MOTION.fast}`,
        boxSizing: 'border-box',
        ...style,
      }}
    />
  )
}

export function Badge({ children, color }) {
  const palette = {
    accent:  { bg: C.accentMuted,       text: C.accent },
    info:    { bg: C.interactiveMuted,  text: C.interactive },
    success: { bg: C.successMuted,      text: C.success },
    warning: { bg: C.warningMuted,      text: C.warning },
    error:   { bg: C.errorMuted,        text: C.error },
  }
  const p = palette[color] || palette.info
  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 10px',
      background: p.bg,
      color: p.text,
      borderRadius: 6,
      fontSize: 11,
      fontWeight: 700,
      fontFamily: "'Archivo', sans-serif",
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
    }}>
      {children}
    </span>
  )
}

export function ContentHistory({ type }) {
  const { activeClient, fetchContentHistory } = useClient()
  const [items, setItems] = useState([])
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!expanded || !activeClient?.id) return
    setLoading(true)
    fetchContentHistory(type).then(data => {
      setItems(data)
      setLoading(false)
    })
  }, [expanded, activeClient?.id, type]) // eslint-disable-line

  if (!activeClient?.id) return null

  return (
    <div style={{ marginTop: 40 }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: C.textMuted, fontFamily: "'DM Sans', sans-serif", fontSize: 13,
          padding: 0, marginBottom: expanded ? 16 : 0,
          transition: `color ${MOTION.fast}`,
        }}
        onMouseEnter={e => e.currentTarget.style.color = C.text}
        onMouseLeave={e => e.currentTarget.style.color = C.textMuted}
      >
        <span style={{ fontSize: 9 }}>{expanded ? '▲' : '▼'}</span>
        Previously Generated
        {items.length > 0 && !loading && (
          <span style={{
            background: C.interactiveMuted, color: C.interactive,
            fontSize: 10, padding: '2px 7px', borderRadius: 8,
            fontFamily: "'Archivo', sans-serif", fontWeight: 700,
          }}>{items.length}</span>
        )}
      </button>

      {expanded && (
        <div>
          {loading && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              color: C.textMuted, fontFamily: "'DM Sans', sans-serif", fontSize: 13,
              padding: '12px 0',
            }}>
              <Spinner color={C.interactive} size={13} />
              <span>Loading history…</span>
            </div>
          )}

          {!loading && items.length === 0 && (
            <div style={{ color: C.textDim, fontSize: 13, fontFamily: "'DM Sans', sans-serif", padding: '12px 0' }}>
              No previous generations for this client.
            </div>
          )}

          {items.map(item => (
            <div key={item.id} style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 12, padding: 16, marginBottom: 10,
              animation: 'fadeIn 0.3s ease-out',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 11, color: C.textDim, fontFamily: "'DM Sans', sans-serif" }}>
                  {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <CopyButton text={item.content} />
              </div>
              <div style={{
                fontSize: 13, color: C.textMuted, fontFamily: "'DM Sans', sans-serif",
                lineHeight: 1.6, whiteSpace: 'pre-wrap',
                maxHeight: 140, overflowY: 'auto',
              }}>
                {item.content.length > 400 ? item.content.slice(0, 400) + '…' : item.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
