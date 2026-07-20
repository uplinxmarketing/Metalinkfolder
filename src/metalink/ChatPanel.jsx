import { useState, useEffect, useRef } from 'react'
import { useMetalink } from './MetalinkContext'
import { sendChatMessage, finalizeSummary, expandBrief } from './chatAgent'
import { buildSynopsis, buildClientFileContext } from './clientContext'

const C = {
  bg: '#F3EFE9',
  surface: '#FFFFFF',
  surface2: '#FAF7F1',
  border: '#E0DAD0',
  borderStrong: '#1A1A1F',
  borderAccent: 'rgba(38, 47, 70, 0.25)',
  text: '#1A1A1F',
  textMuted: '#5E5C58',
  textDim: '#9B9690',
  textInverse: '#F3EFE9',
  accent: '#262F46',
  accentHover: '#3A4661',
  accentMuted: 'rgba(38, 47, 70, 0.08)',
  interactive: '#3A5AFB',
  interactiveGlow: 'rgba(58, 90, 251, 0.18)',
  error: '#B9342F',
  errorBg: 'rgba(185, 52, 47, 0.06)',
}

function ResultTag({ result }) {
  const map = {
    won: { bg: 'rgba(45,122,79,0.1)', color: '#2D7A4F', label: 'WON' },
    lost: { bg: 'rgba(185,52,47,0.08)', color: '#B9342F', label: 'LOST' },
    mixed: { bg: 'rgba(160,126,58,0.1)', color: '#A07E3A', label: 'MIXED' },
  }
  const s = map[result] || map.mixed
  return (
    <span style={{
      fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 5,
      background: s.bg, color: s.color, fontFamily: "'Archivo', sans-serif",
      letterSpacing: '0.06em', flexShrink: 0,
    }}>{s.label}</span>
  )
}

function AdPerformancePanel({ entries, onAdd, onDelete }) {
  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState('')
  const [angleOrHook, setAngleOrHook] = useState('')
  const [result, setResult] = useState('won')
  const [metricType, setMetricType] = useState('')
  const [metricValue, setMetricValue] = useState('')
  const [lesson, setLesson] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!description.trim() || saving) return
    setSaving(true)
    await onAdd({
      description: description.trim(), angleOrHook: angleOrHook.trim(), result,
      metricType: metricType.trim(), metricValue: metricValue.trim(), lesson: lesson.trim(),
    })
    setDescription(''); setAngleOrHook(''); setMetricType(''); setMetricValue(''); setLesson(''); setResult('won')
    setSaving(false)
  }

  const inputStyle = {
    width: '100%', padding: '9px 11px', borderRadius: 8, boxSizing: 'border-box',
    background: C.surface, border: `1px solid ${C.border}`,
    color: C.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: 'none',
  }

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, marginBottom: 16, overflow: 'hidden' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.textDim, fontFamily: "'Archivo', sans-serif" }}>
          Past ad performance {entries.length ? `(${entries.length})` : '(optional)'}
        </span>
        <span style={{ fontSize: 12, color: C.textDim }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ padding: '0 16px 16px' }}>
          {entries.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {entries.map(e => (
                <div key={e.id} style={{
                  padding: '10px 12px', background: C.surface2, border: `1px solid ${C.border}`,
                  borderRadius: 8, display: 'flex', gap: 10, alignItems: 'flex-start',
                }}>
                  <ResultTag result={e.result} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: C.text, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>{e.description}</div>
                    <div style={{ fontSize: 11, color: C.textDim, fontFamily: "'DM Sans', sans-serif", marginTop: 3 }}>
                      {[e.angle_or_hook, e.metric_value ? `${e.metric_type || 'metric'}: ${e.metric_value}` : '', e.lesson ? `Lesson: ${e.lesson}` : ''].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <button onClick={() => onDelete(e.id)} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: C.textDim, fontSize: 14, padding: 2, flexShrink: 0, lineHeight: 1,
                  }}>×</button>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <textarea
              value={description} onChange={e => setDescription(e.target.value)}
              placeholder="What ad ran, what happened? e.g. 'UGC testimonial ad on the price-objection angle'"
              rows={2} style={{ ...inputStyle, resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={angleOrHook} onChange={e => setAngleOrHook(e.target.value)} placeholder="Angle / hook used (optional)" style={inputStyle} />
              <select value={result} onChange={e => setResult(e.target.value)} style={{ ...inputStyle, flexShrink: 0, width: 110 }}>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={metricType} onChange={e => setMetricType(e.target.value)} placeholder="Metric (e.g. ROAS, CTR)" style={inputStyle} />
              <input value={metricValue} onChange={e => setMetricValue(e.target.value)} placeholder="Value (e.g. 3.2x)" style={inputStyle} />
            </div>
            <input value={lesson} onChange={e => setLesson(e.target.value)} placeholder="Lesson learned (optional)" style={inputStyle} />
            <button type="submit" disabled={!description.trim() || saving} style={{
              padding: '9px', borderRadius: 8, cursor: (!description.trim() || saving) ? 'not-allowed' : 'pointer',
              background: C.accentMuted, border: `1px solid ${C.borderAccent}`, color: C.accent,
              fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
              opacity: (!description.trim() || saving) ? 0.5 : 1,
            }}>{saving ? 'Saving...' : '+ Add entry'}</button>
          </form>
        </div>
      )}
    </div>
  )
}

function Bubble({ role, content }) {
  const isAdmin = role === 'user'
  return (
    <div style={{ display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
      <div style={{
        maxWidth: '78%', padding: '11px 15px', borderRadius: 14,
        background: isAdmin ? C.accent : C.surface,
        color: isAdmin ? C.textInverse : C.text,
        border: isAdmin ? 'none' : `1px solid ${C.border}`,
        fontSize: 14, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.55,
        whiteSpace: 'pre-wrap',
      }}>
        {content}
      </div>
    </div>
  )
}

export default function ChatPanel({ client, onFinalized, onBack }) {
  const {
    fetchChatMessages, saveChatMessage, saveChatSummary,
    fetchAdPerformance, saveAdPerformance, deleteAdPerformance,
  } = useMetalink()
  const [messages, setMessages] = useState([])
  const [adPerformance, setAdPerformance] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [finalizing, setFinalizing] = useState(false)
  const [expanding, setExpanding] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)
  const scrollRef = useRef(null)
  const expandStartedRef = useRef(false)

  const synopsis = buildSynopsis(client?.data || {})
  const context = buildClientFileContext(client, adPerformance)

  useEffect(() => {
    if (!client?.id) return
    Promise.all([fetchChatMessages(client.id), fetchAdPerformance(client.id)]).then(async ([rows, perf]) => {
      setAdPerformance(perf)
      const existing = rows.map(r => ({ role: r.role, content: r.content }))
      setMessages(existing)
      setLoaded(true)

      if (existing.length === 0 && !expandStartedRef.current) {
        expandStartedRef.current = true
        setExpanding(true)
        setError('')
        try {
          const opening = await expandBrief(buildClientFileContext(client, perf))
          setMessages([{ role: 'assistant', content: opening }])
          saveChatMessage(client.id, 'assistant', opening).catch(() => {})
        } catch (e) {
          setError(e.message || 'Could not generate the opening brief.')
        } finally {
          setExpanding(false)
        }
      }
    })
  }, [client?.id]) // eslint-disable-line

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function handleAddPerformance(entry) {
    const saved = await saveAdPerformance(client.id, entry)
    if (saved) setAdPerformance(prev => [saved, ...prev])
  }

  async function handleDeletePerformance(id) {
    setAdPerformance(prev => prev.filter(e => e.id !== id))
    await deleteAdPerformance(id)
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || sending) return
    setError('')
    setInput('')
    setSending(true)
    const nextMessages = [...messages, { role: 'user', content: text }]
    setMessages(nextMessages)
    saveChatMessage(client.id, 'user', text).catch(() => {})

    try {
      const reply = await sendChatMessage(context, messages, text)
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      saveChatMessage(client.id, 'assistant', reply).catch(() => {})
    } catch (e) {
      setError(e.message || 'Chat request failed.')
    } finally {
      setSending(false)
    }
  }

  async function handleFinalize() {
    setFinalizing(true)
    setError('')
    try {
      const summary = await finalizeSummary(context, messages)
      await saveChatSummary(client.id, summary, [])
      onFinalized(summary)
    } catch (e) {
      setError(e.message || 'Could not finalize summary.')
    } finally {
      setFinalizing(false)
    }
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <button onClick={onBack} style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        fontSize: 13, color: C.textDim, fontFamily: "'DM Sans', sans-serif",
        marginBottom: 18,
      }}>← Back to dashboard</button>

      <h1 style={{
        fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 34,
        color: C.text, margin: '0 0 6px', letterSpacing: '-0.02em',
      }}>
        Lock the brief — {client?.name || 'Client'}
      </h1>
      <p style={{ fontSize: 14, color: C.textMuted, fontFamily: "'DM Sans', sans-serif", marginBottom: 24 }}>
        Chat with Claude to sharpen the campaign summary. When it's ready, finalize it and pick your angles.
      </p>

      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 14, marginBottom: 16, padding: '14px 16px',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.textDim, fontFamily: "'Archivo', sans-serif", marginBottom: 6 }}>
          Onboarding synopsis
        </div>
        <div style={{ fontSize: 12, color: C.textMuted, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, whiteSpace: 'pre-wrap', maxHeight: 110, overflowY: 'auto' }}>
          {synopsis || 'No onboarding data yet.'}
        </div>
      </div>

      <AdPerformancePanel
        entries={adPerformance}
        onAdd={handleAddPerformance}
        onDelete={handleDeletePerformance}
      />

      <div
        ref={scrollRef}
        style={{
          background: C.surface2, border: `1px solid ${C.border}`,
          borderRadius: 14, padding: 18, height: 380, overflowY: 'auto',
          marginBottom: 14,
        }}
      >
        {!loaded ? (
          <div style={{ fontSize: 13, color: C.textDim, fontFamily: "'DM Sans', sans-serif" }}>Loading conversation...</div>
        ) : expanding && messages.length === 0 ? (
          <div style={{ fontSize: 13, color: C.textDim, fontFamily: "'DM Sans', sans-serif" }}>
            Analyzing the client's brief and mapping angles that fit...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ fontSize: 13, color: C.textDim, fontFamily: "'DM Sans', sans-serif" }}>
            Ask about audience framing, offer clarity, or anything that feels thin — or just hit Finalize to use the synopsis as-is.
          </div>
        ) : (
          messages.map((m, i) => <Bubble key={i} role={m.role} content={m.content} />)
        )}
        {sending && <Bubble role="assistant" content="..." />}
      </div>

      {error && (
        <div style={{
          padding: '10px 14px', borderRadius: 8, marginBottom: 12,
          background: C.errorBg, border: `1px solid ${C.error}`,
          color: C.error, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
        }}>{error}</div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
          placeholder="Ask Claude about this brief..."
          disabled={sending || finalizing || expanding}
          style={{
            flex: 1, padding: '12px 16px', borderRadius: 10, boxSizing: 'border-box',
            background: C.surface, border: `1px solid ${C.border}`,
            color: C.text, fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none',
          }}
          onFocus={e => { e.target.style.borderColor = C.interactive; e.target.style.boxShadow = `0 0 0 3px ${C.interactiveGlow}` }}
          onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none' }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending || finalizing || expanding}
          style={{
            padding: '12px 22px', borderRadius: 10, cursor: 'pointer',
            background: C.accent, border: 'none', color: C.textInverse,
            fontSize: 14, fontWeight: 700, fontFamily: "'Archivo', sans-serif",
            opacity: (!input.trim() || sending || finalizing || expanding) ? 0.5 : 1,
          }}
        >Send</button>
      </div>

      <button
        onClick={handleFinalize}
        disabled={finalizing || sending || expanding}
        style={{
          width: '100%', padding: 14, borderRadius: 10, cursor: 'pointer',
          background: finalizing ? 'rgba(38,47,70,0.3)' : C.accent,
          border: 'none', color: C.textInverse,
          fontSize: 15, fontWeight: 700, fontFamily: "'Archivo', sans-serif",
          letterSpacing: '-0.01em', opacity: finalizing ? 0.6 : 1,
        }}
      >
        {finalizing ? 'Finalizing...' : 'Finalize summary & pick angles →'}
      </button>
    </div>
  )
}
