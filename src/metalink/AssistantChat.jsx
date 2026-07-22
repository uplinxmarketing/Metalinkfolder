import { useState, useRef, useEffect } from 'react'
import { askAssistant } from './assistantAgent.js'

const C = {
  bg: '#F3EFE9',
  surface: '#FFFFFF',
  surface2: '#FAF7F1',
  border: '#E0DAD0',
  text: '#1A1A1F',
  textMuted: '#5E5C58',
  textDim: '#9B9690',
  textInverse: '#F3EFE9',
  accent: '#262F46',
  accentHover: '#3A4661',
  interactive: '#3A5AFB',
  interactiveGlow: 'rgba(58, 90, 251, 0.18)',
  error: '#B9342F',
  errorBg: 'rgba(185, 52, 47, 0.06)',
}

const SUGGESTIONS = [
  'Write 3 scroll-stopping hooks for a premium coffee subscription',
  'What campaign objective and budget should a new $2k/mo client start with?',
  'Give me 5 ad angles for a B2B lead-gen offer',
  'Rewrite this headline to be more specific: "Grow your business fast"',
]

function Bubble({ role, content }) {
  const isUser = role === 'user'
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      <div style={{
        maxWidth: '80%',
        padding: '13px 16px',
        borderRadius: 14,
        background: isUser ? C.accent : C.surface,
        color: isUser ? C.textInverse : C.text,
        border: isUser ? 'none' : `1px solid ${C.border}`,
        fontSize: 15, lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif",
        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        boxShadow: isUser ? 'none' : '0 1px 2px rgba(26,26,31,0.04)',
      }}>
        {content}
      </div>
    </div>
  )
}

export default function AssistantChat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const scrollRef = useRef(null)
  const taRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  async function send(text) {
    const content = (text ?? input).trim()
    if (!content || busy) return
    setError('')
    setInput('')
    const next = [...messages, { role: 'user', content }]
    setMessages(next)
    setBusy(true)
    try {
      const reply = await askAssistant(messages, content)
      setMessages([...next, { role: 'assistant', content: reply }])
    } catch (e) {
      setError(e?.message || 'The assistant could not respond.')
      setMessages(next)
    } finally {
      setBusy(false)
      setTimeout(() => taRef.current?.focus(), 40)
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const empty = messages.length === 0

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: 'calc(100vh - 58px)', maxWidth: 820, margin: '0 auto', width: '100%',
    }}>
      {/* Scrollable conversation */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '28px 20px 12px' }}>
        {empty ? (
          <div style={{ textAlign: 'center', paddingTop: '8vh' }}>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic',
              fontSize: 40, color: C.text, marginBottom: 10,
            }}>METALINK Assistant</div>
            <p style={{ fontSize: 15, color: C.textMuted, fontFamily: "'DM Sans', sans-serif", marginBottom: 32 }}>
              Your Meta ads strategist and copywriter. Ask anything.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, maxWidth: 620, margin: '0 auto' }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => send(s)} style={{
                  textAlign: 'left', padding: '14px 16px', borderRadius: 12,
                  background: C.surface, border: `1px solid ${C.border}`,
                  color: C.text, fontSize: 13.5, lineHeight: 1.5,
                  fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
                  transition: 'border-color 130ms ease, box-shadow 130ms ease',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.interactive; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.interactiveGlow}` }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = 'none' }}
                >{s}</button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {messages.map((m, i) => <Bubble key={i} role={m.role} content={m.content} />)}
            {busy && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '13px 16px', borderRadius: 14, background: C.surface,
                  border: `1px solid ${C.border}`, color: C.textDim,
                  fontSize: 14, fontFamily: "'DM Sans', sans-serif",
                }}>
                  Thinking<span style={{ animation: 'mlDots 1.2s infinite' }}>…</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div style={{
          margin: '0 20px 8px', padding: '10px 14px', borderRadius: 10,
          background: C.errorBg, border: `1px solid ${C.error}`,
          color: C.error, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
        }}>{error}</div>
      )}

      {/* Composer */}
      <div style={{ padding: '10px 20px 22px' }}>
        <div style={{
          display: 'flex', gap: 10, alignItems: 'flex-end',
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 16, padding: '10px 10px 10px 16px',
          boxShadow: '0 2px 10px rgba(26,26,31,0.05)',
        }}>
          <textarea
            ref={taRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Message the assistant…  (Enter to send, Shift+Enter for a new line)"
            rows={1}
            autoFocus
            style={{
              flex: 1, resize: 'none', border: 'none', outline: 'none',
              background: 'transparent', color: C.text,
              fontSize: 15, lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif",
              maxHeight: 160, padding: '6px 0',
            }}
            onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px' }}
          />
          <button
            onClick={() => send()}
            disabled={busy || !input.trim()}
            style={{
              flexShrink: 0, padding: '10px 18px', borderRadius: 11,
              background: busy || !input.trim() ? 'rgba(38,47,70,0.25)' : C.accent,
              border: 'none', color: C.textInverse,
              fontSize: 14, fontWeight: 700, fontFamily: "'Archivo', sans-serif",
              cursor: busy || !input.trim() ? 'not-allowed' : 'pointer',
              transition: 'background 130ms ease',
            }}
          >Send</button>
        </div>
        <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: C.textDim, fontFamily: "'DM Sans', sans-serif" }}>
          Runs on Groq. Responses can be imperfect — verify anything critical.
        </div>
      </div>
      <style>{'@keyframes mlDots { 0%,20%{opacity:0.2} 50%{opacity:1} 100%{opacity:0.2} }'}</style>
    </div>
  )
}
