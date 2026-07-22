import { useState, useEffect, useRef, useMemo } from 'react'
import { QUESTIONS, SECTION_META, SECTIONS_ORDER } from './questions'
import { useMetalink } from './MetalinkContext'
import FileUploadField from '../onboarding/FileUploadField'
import { buildBrandIntel } from '../onboarding/fileIntelligence'

const C = {
  bg: '#F3EFE9',
  surface: '#FFFFFF',
  surfaceLight: '#FAF7F1',
  surfaceHover: '#EFEAE2',
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
  success: '#2D7A4F',
  successMuted: 'rgba(45, 122, 79, 0.10)',
  error: '#B9342F',
  errorBg: 'rgba(185, 52, 47, 0.06)',
}

const CSS = `
  @keyframes mlSlideInRight { from{transform:translateX(40px);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes mlSlideInLeft  { from{transform:translateX(-40px);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes mlFadeUp       { from{transform:translateY(24px);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes mlFadeIn       { from{opacity:0} to{opacity:1} }
  .ml-fwd  { animation: mlSlideInRight 380ms cubic-bezier(0.22,1,0.36,1) both }
  .ml-back { animation: mlSlideInLeft  380ms cubic-bezier(0.22,1,0.36,1) both }
  .ml-up   { animation: mlFadeUp       460ms cubic-bezier(0.22,1,0.36,1) both }
`

function Btn({ children, onClick, disabled, ghost, full, size = 'md' }) {
  const [hov, setHov] = useState(false)
  const pad = size === 'lg' ? '15px 36px' : size === 'sm' ? '8px 16px' : '12px 24px'
  const fs = size === 'lg' ? 16 : size === 'sm' ? 13 : 15
  return (
    <button
      onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        padding: pad, borderRadius: 10,
        border: ghost ? `1px solid ${C.border}` : 'none',
        background: disabled
          ? 'rgba(38,47,70,0.18)'
          : ghost ? (hov ? C.surfaceHover : 'transparent')
          : (hov ? C.accentHover : C.accent),
        color: disabled ? C.textDim : ghost ? C.textMuted : C.textInverse,
        fontSize: fs, fontWeight: 700, fontFamily: "'Archivo', sans-serif",
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: '120ms ease', opacity: disabled ? 0.5 : 1,
        width: full ? '100%' : undefined,
        letterSpacing: '-0.01em',
      }}
    >{children}</button>
  )
}

function TextInput({ placeholder, onSubmit, disabled, defaultValue, multiline }) {
  const [val, setVal] = useState(defaultValue || '')
  const [focused, setFocused] = useState(false)
  const ref = useRef(null)
  useEffect(() => { setTimeout(() => ref.current?.focus(), 80) }, [])
  useEffect(() => { setVal(defaultValue || '') }, [defaultValue])

  function submit() { if (val.trim() && !disabled) onSubmit(val.trim()) }

  const sharedStyle = {
    width: '100%', boxSizing: 'border-box',
    padding: '18px 20px', borderRadius: 12,
    background: focused ? C.surface : C.surfaceLight,
    border: `1.5px solid ${focused ? C.interactive : C.border}`,
    color: C.text, fontSize: 18, fontFamily: "'DM Sans', sans-serif",
    lineHeight: 1.5, outline: 'none',
    boxShadow: focused ? `0 0 0 4px ${C.interactiveGlow}` : 'none',
    transition: '120ms ease', opacity: disabled ? 0.6 : 1,
  }

  return (
    <div style={{ position: 'relative' }}>
      {multiline ? (
        <textarea
          ref={ref} value={val} disabled={disabled} rows={4}
          onChange={e => setVal(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          placeholder={placeholder} style={{ ...sharedStyle, resize: 'vertical' }}
        />
      ) : (
        <input
          ref={ref} value={val} disabled={disabled} type="text"
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submit() } }}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          placeholder={placeholder} style={sharedStyle}
        />
      )}
      <div style={{ marginTop: 14 }}>
        <Btn onClick={submit} disabled={!val.trim() || disabled}>Continue -&gt;</Btn>
      </div>
    </div>
  )
}

function ChipInput({ options, multi, isColor, onSubmit, defaultValue }) {
  const [selected, setSelected] = useState(defaultValue || [])
  const [hov, setHov] = useState(null)
  const canSubmit = selected.length >= 1

  useEffect(() => { setSelected(defaultValue || []) }, [JSON.stringify(defaultValue)])

  function toggle(opt) {
    if (!multi) { onSubmit([opt]); return }
    setSelected(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt])
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: multi ? 20 : 0 }}>
        {options.map(opt => {
          const sel = selected.includes(opt)
          if (isColor) return (
            <button key={opt} onClick={() => toggle(opt)} title={opt} style={{
              width: 36, height: 36, borderRadius: '50%', background: opt,
              cursor: 'pointer', border: opt === '#FFFFFF' ? `1px solid ${C.border}` : 'none',
              outline: sel ? `3px solid ${C.interactive}` : `2px solid transparent`,
              outlineOffset: 3,
              transform: sel ? 'scale(1.12)' : 'scale(1)',
              transition: '120ms ease',
            }} />
          )
          return (
            <button key={opt}
              onClick={() => toggle(opt)}
              onMouseEnter={() => setHov(opt)} onMouseLeave={() => setHov(null)}
              style={{
                padding: '9px 16px', borderRadius: 9, fontSize: 14,
                fontFamily: "'DM Sans', sans-serif",
                background: sel ? C.accent : hov === opt ? C.surfaceHover : C.surfaceLight,
                border: `1.5px solid ${sel ? C.accent : C.border}`,
                color: sel ? C.textInverse : C.text,
                fontWeight: sel ? 600 : 400,
                cursor: 'pointer',
                transition: '120ms ease',
              }}
            >
              {sel && <span style={{ marginRight: 5, opacity: 0.8 }}>✓</span>}
              {opt}
            </button>
          )
        })}
      </div>
      {(multi || isColor) && (
        <Btn onClick={() => onSubmit(selected)} disabled={isColor ? false : !canSubmit}>
          {isColor ? 'Continue' : `Done${selected.length > 0 ? ` · ${selected.length}` : ''}`} -&gt;
        </Btn>
      )}
    </div>
  )
}

function WelcomeScreen({ name, onStart }) {
  return (
    <div className="ml-up" style={{ textAlign: 'center', padding: '48px 0' }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: C.accentMuted, border: `1px solid ${C.borderAccent}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 20,
        color: C.accent, margin: '0 auto 36px',
      }}>M</div>

      <h1 style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 52, fontWeight: 600, letterSpacing: '-0.025em',
        color: C.text, margin: '0 0 16px', lineHeight: 1.05,
      }}>
        Hello, {name}.
      </h1>

      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 17, color: C.textMuted, lineHeight: 1.55,
        margin: '0 0 40px',
      }}>
        A few minutes on your business, your customer, and your offer — then we build the campaign.
      </p>

      <Btn onClick={onStart} size="lg">Start -&gt;</Btn>

      <div style={{
        marginTop: 40, display: 'flex', gap: 24, justifyContent: 'center',
        alignItems: 'center', flexWrap: 'wrap',
      }}>
        {SECTIONS_ORDER.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, color: C.textDim }}>{SECTION_META[s].icon}</span>
            <span style={{ fontSize: 12, color: C.textDim, fontFamily: "'DM Sans', sans-serif" }}>
              {SECTION_META[s].name}
            </span>
            {i < SECTIONS_ORDER.length - 1 && (
              <span style={{ marginLeft: 12, color: C.border, fontSize: 10 }}>›</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function SectionIntroScreen({ sectionKey, questionCount, onStart }) {
  const m = SECTION_META[sectionKey]
  return (
    <div className="ml-up" style={{ textAlign: 'center', padding: '64px 0' }}>
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: m.color + '14', border: `1.5px solid ${m.color}28`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 30, color: m.color, margin: '0 auto 28px',
      }}>
        {m.icon}
      </div>
      <h2 style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 44, fontWeight: 600, letterSpacing: '-0.02em',
        color: C.text, margin: '0 0 10px',
      }}>
        {m.name}
      </h2>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 14, color: C.textDim, margin: '0 0 36px',
      }}>
        {questionCount} question{questionCount !== 1 ? 's' : ''}
      </p>
      <Btn onClick={onStart} size="lg">Go -&gt;</Btn>
    </div>
  )
}

function sectionSummaryTemplate(sec, answers) {
  switch (sec) {
    case 'business':
      return `${answers.businessName || 'The business'}${answers.industry ? ` — ${answers.industry}` : ''}. Here's the picture we're working from.`
    case 'audience':
      return `Targeting: ${(answers.targetAudience || 'your dream customer').slice(0, 140)}`
    case 'offer':
      return `The pitch: ${(answers.transformation || 'the transformation you deliver').slice(0, 140)}`
    case 'proof':
      return `Objection to beat: ${(answers.mainObjection || 'noted').slice(0, 120)}. CTA locked to "${answers.cta || 'your next step'}."`
    case 'brand':
      return "Brand assets received. You're all set — we'll take it from here."
    default:
      return 'Section complete.'
  }
}

function SectionSummaryScreen({ sectionKey, summaryText, isLast, nextSectionName, onContinue }) {
  const m = SECTION_META[sectionKey] || {}
  return (
    <div className="ml-up" style={{ maxWidth: 520, margin: '0 auto' }}>
      <div style={{
        background: C.surface, border: `1.5px solid ${C.border}`,
        borderRadius: 20, padding: '40px 36px',
        boxShadow: '0 8px 32px rgba(26,26,31,0.07)',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: C.successMuted, border: `1px solid ${C.success}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, marginBottom: 20, color: C.success,
        }}>✓</div>
        <div style={{
          fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.1em', color: C.textDim,
          fontFamily: "'Archivo', sans-serif", marginBottom: 4,
        }}>Done</div>
        <h3 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 30, fontWeight: 600, letterSpacing: '-0.01em',
          color: C.text, margin: '0 0 20px',
        }}>{m.name}</h3>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 15, lineHeight: 1.65, color: C.textMuted,
          margin: '0 0 28px',
        }}>{summaryText}</p>
        <Btn onClick={onContinue} full>
          {isLast ? 'Finish -&gt;' : `${nextSectionName} -&gt;`}
        </Btn>
      </div>
    </div>
  )
}

function DoneScreen({ name }) {
  return (
    <div className="ml-up" style={{ textAlign: 'center', padding: '48px 0' }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16,
        background: C.successMuted, border: `1.5px solid ${C.success}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, margin: '0 auto 28px', color: C.success,
      }}>✓</div>
      <h2 style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 44, fontWeight: 600, letterSpacing: '-0.02em',
        color: C.text, margin: '0 0 14px',
      }}>All set{name ? `, ${name}` : ''}.</h2>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 16, color: C.textMuted, maxWidth: 380, margin: '0 auto',
      }}>
        Your campaign brief is in. Your agency will take it from here and follow up with the first round of ads.
      </p>
    </div>
  )
}

function QuestionScreen({ q, qNum, total, sectionMeta, direction, submitting, validationError, answersRef, onSubmit, onBack, fileAnswer, setFileAnswer, onFilesNext, clientId }) {
  const ph = q.placeholder || ''
  const prevAnswer = answersRef.current[q.id]
  const prevText = typeof prevAnswer === 'string' ? prevAnswer : ''
  const prevChips = Array.isArray(prevAnswer) ? prevAnswer : []
  const canSkipFiles = !q.required

  return (
    <div className={direction === 'backward' ? 'ml-back' : 'ml-fwd'}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 40 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 10px', borderRadius: 20,
          background: sectionMeta.color + '12',
          border: `1px solid ${sectionMeta.color}28`,
          fontSize: 12, fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif",
          color: sectionMeta.color,
        }}>{sectionMeta.icon} {sectionMeta.name}</span>
        <span style={{ fontSize: 12, color: C.textDim, fontFamily: "'DM Sans', sans-serif" }}>{qNum} / {total}</span>
      </div>

      <h2 style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 36, fontWeight: 600, letterSpacing: '-0.02em',
        color: C.text, margin: '0 0 28px', lineHeight: 1.15,
      }}>{q.label}</h2>

      <div style={{ marginBottom: 24 }}>
        {(q.type === 'text' || q.type === 'textarea') && (
          <TextInput
            placeholder={ph} onSubmit={onSubmit} disabled={submitting}
            defaultValue={prevText} multiline={q.type === 'textarea'}
          />
        )}

        {(q.type === 'single' || q.type === 'multi' || q.type === 'colors') && (
          <ChipInput
            options={q.options}
            multi={q.type === 'multi' || q.type === 'colors'}
            isColor={q.type === 'colors'}
            onSubmit={onSubmit}
            defaultValue={prevChips}
          />
        )}

        {q.type === 'files' && (
          <div>
            {q.helpText && (
              <p style={{ fontSize: 13, color: C.textDim, fontFamily: "'DM Sans', sans-serif", marginBottom: 12 }}>
                {q.helpText}
              </p>
            )}
            <FileUploadField
              value={fileAnswer} onChange={setFileAnswer}
              accept={q.accept} maxFiles={q.maxFiles} maxSizeMB={q.maxSizeMB}
              clientId={clientId}
            />
            <div style={{ marginTop: 14 }}>
              <Btn onClick={onFilesNext} disabled={submitting || (!canSkipFiles && fileAnswer.length === 0)}>
                {fileAnswer.length > 0
                  ? `Continue · ${fileAnswer.length} file${fileAnswer.length > 1 ? 's' : ''} ->`
                  : canSkipFiles ? 'Skip ->' : 'Upload at least 1 file to continue'}
              </Btn>
            </div>
          </div>
        )}
      </div>

      {validationError && (
        <div style={{
          padding: '10px 14px', borderRadius: 8, marginBottom: 16,
          background: C.errorBg, border: `1px solid ${C.error}`,
          color: C.error, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
        }}>{validationError}</div>
      )}

      {onBack && (
        <button onClick={onBack} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 13, color: C.textDim, fontFamily: "'DM Sans', sans-serif",
          padding: 0, textDecoration: 'underline', textDecorationColor: C.border,
        }}>← Back</button>
      )}
    </div>
  )
}

export default function MetalinkOnboarding({ clientId }) {
  const { saveOnboardingResponse, saveOnboardingState, saveClientOverview, fetchClientById } = useMetalink()

  const [screen, setScreen] = useState('welcome')
  const [animKey, setAnimKey] = useState(0)
  const [direction, setDirection] = useState('forward')
  const [qIdx, setQIdx] = useState(0)
  const [pendingSection, setPendingSection] = useState('business')
  const [summarySection, setSummarySection] = useState('business')
  const [submitting, setSubmitting] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [fileAnswer, setFileAnswer] = useState([])
  const [notFound, setNotFound] = useState(false)
  const [clientName, setClientName] = useState('')

  const answersRef = useRef({})
  const honeypotRef = useRef('')

  useEffect(() => {
    if (!clientId) return
    fetchClientById(clientId).then(client => {
      if (!client) { setNotFound(true); return }
      setClientName(client.name || '')

      // Already finished — nothing left to fill.
      if (client.onboarding_complete) { setScreen('done'); return }

      // Resume: rehydrate prior answers and jump to the first unfilled question.
      const state = client.onboarding_state
      const answers = state && typeof state.answers === 'object' ? state.answers : null
      if (answers && Object.keys(answers).length > 0) {
        answersRef.current = answers
        const progress = Number(state.progress) || 0
        if (progress >= QUESTIONS.length) {
          // Everything answered but never finalized — land on the last summary
          // so they can hit Finish.
          setSummarySection(SECTIONS_ORDER[SECTIONS_ORDER.length - 1])
          setScreen('section-summary')
        } else {
          const resumeIdx = Math.min(Math.max(0, progress), QUESTIONS.length - 1)
          setDirection('forward')
          setAnimKey(k => k + 1)
          setQIdx(resumeIdx)
          setScreen('question')
        }
      }
    })
  }, [clientId]) // eslint-disable-line

  const currentQ = QUESTIONS[qIdx]
  const currentSection = currentQ?.section || 'business'
  const sectionQs = useMemo(() => QUESTIONS.filter(q => q.section === currentSection), [currentSection])
  const qNum = sectionQs.findIndex(q => q.id === currentQ?.id) + 1
  const total = sectionQs.length
  const isLastInSection = qNum === total
  const isLastOverall = qIdx === QUESTIONS.length - 1
  const progress = ((qIdx + 1) / QUESTIONS.length) * 100

  function goTo(idx, dir = 'forward') {
    setDirection(dir); setAnimKey(k => k + 1); setQIdx(idx)
    setScreen('question'); setValidationError('')
  }

  function handleStart() { setPendingSection('business'); setScreen('section-intro') }
  function handleSectionStart() { goTo(QUESTIONS.findIndex(q => q.section === pendingSection)) }
  function handleBack() { if (qIdx > 0) goTo(qIdx - 1, 'backward') }

  async function submitAnswer(raw) {
    if (honeypotRef.current || submitting) return
    const q = QUESTIONS[qIdx]
    setValidationError('')
    setSubmitting(true)

    const display = Array.isArray(raw) ? raw.join(', ') : raw
    answersRef.current[q.id] = raw
    if (clientId) {
      saveOnboardingResponse(clientId, q.label, display).catch(console.error)
      // Persist full progress so reopening the link resumes at the next question.
      saveOnboardingState(clientId, answersRef.current, qIdx + 1).catch(console.error)
    }

    if (isLastInSection) {
      const sec = currentSection
      setSummarySection(sec); setScreen('section-summary')
    } else {
      goTo(qIdx + 1)
    }
    setSubmitting(false)
  }

  function handleFilesNext() {
    submitAnswer(fileAnswer)
    setFileAnswer([])
  }

  async function handleSummaryContinue() {
    const idx = SECTIONS_ORDER.indexOf(summarySection)
    if (idx === SECTIONS_ORDER.length - 1) {
      const fullData = { ...answersRef.current }
      const brandIntel = buildBrandIntel(fullData.brandFiles || [])
      if (brandIntel) fullData.brandIntel = brandIntel
      const overview = SECTIONS_ORDER.map(s => sectionSummaryTemplate(s, fullData)).join(' ')
      if (clientId) await saveClientOverview(clientId, overview, fullData).catch(console.error)
      setScreen('done')
    } else {
      const next = SECTIONS_ORDER[idx + 1]
      setPendingSection(next); setScreen('section-intro')
    }
  }

  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', fontFamily: "'DM Sans', sans-serif", color: C.textMuted }}>
          This onboarding link isn't valid, or the client was removed.
        </div>
      </div>
    )
  }

  const pendingSectionQCount = QUESTIONS.filter(q => q.section === pendingSection).length
  const summaryIsLast = SECTIONS_ORDER.indexOf(summarySection) === SECTIONS_ORDER.length - 1
  const summaryNextName = summaryIsLast ? null : SECTION_META[SECTIONS_ORDER[SECTIONS_ORDER.indexOf(summarySection) + 1]]?.name
  const firstName = (clientName || 'there').split(' ')[0]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.bg }}>
      <style>{CSS}</style>

      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 2, background: C.border, zIndex: 50 }}>
        {screen === 'question' && (
          <div style={{
            width: `${progress}%`, height: '100%',
            background: `linear-gradient(90deg, ${C.interactive}, ${C.accent})`,
            transition: 'width 500ms cubic-bezier(0.4,0,0.2,1)',
          }} />
        )}
      </div>

      <div style={{
        padding: '16px 24px',
        borderBottom: screen === 'question' ? `1px solid ${C.border}` : 'none',
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7,
          background: C.accentMuted, border: `1px solid ${C.borderAccent}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Cormorant Garamond', serif", fontWeight: 700,
          fontSize: 13, color: C.accent,
        }}>M</div>
        <span style={{
          fontFamily: "'Cormorant Garamond', serif", fontWeight: 500,
          fontSize: 15, fontStyle: 'italic', color: C.text,
        }}>METALINK</span>
        {screen === 'question' && (
          <span style={{ marginLeft: 'auto', fontSize: 11, color: C.textDim, fontFamily: "'DM Sans', sans-serif" }}>
            {qIdx + 1} / {QUESTIONS.length}
          </span>
        )}
      </div>

      <input type="text" name="website" tabIndex={-1} aria-hidden="true" autoComplete="off"
        onChange={e => { honeypotRef.current = e.target.value }}
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px 60px' }}>
        <div style={{ width: '100%', maxWidth: 560 }}>
          {screen === 'welcome' && <WelcomeScreen name={firstName} onStart={handleStart} />}
          {screen === 'section-intro' && (
            <SectionIntroScreen sectionKey={pendingSection} questionCount={pendingSectionQCount} onStart={handleSectionStart} />
          )}
          {screen === 'question' && currentQ && (
            <QuestionScreen
              key={animKey}
              q={currentQ} direction={direction}
              qNum={qNum} total={total}
              sectionMeta={SECTION_META[currentSection]}
              submitting={submitting} validationError={validationError}
              answersRef={answersRef} clientId={clientId}
              onSubmit={submitAnswer} onBack={qIdx > 0 ? handleBack : null}
              fileAnswer={fileAnswer} setFileAnswer={setFileAnswer} onFilesNext={handleFilesNext}
            />
          )}
          {screen === 'section-summary' && (
            <SectionSummaryScreen
              sectionKey={summarySection}
              summaryText={sectionSummaryTemplate(summarySection, answersRef.current)}
              isLast={summaryIsLast} nextSectionName={summaryNextName}
              onContinue={handleSummaryContinue}
            />
          )}
          {screen === 'done' && <DoneScreen name={firstName} />}
        </div>
      </div>
    </div>
  )
}
