import { useState } from 'react'
import { MetalinkProvider, useMetalink } from './MetalinkContext'
import MetalinkDashboard from './MetalinkDashboard'
import ChatPanel from './ChatPanel'
import MegaAngleSelector from './MegaAngleSelector.jsx'
import AdCard from './AdCard.jsx'
import { exportToCSV } from './adAgent.js'
import { generateCampaign, regenerateCreative } from './campaignAgent.js'
import { mineAngles } from './angleMiner.js'

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

const MOTION = { fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)' }

function MetalinkGate({ children }) {
  const [localAuthed, setLocalAuthed] = useState(() => {
    const token = sessionStorage.getItem('deeplinked_admin_token')
    const expiry = sessionStorage.getItem('deeplinked_admin_token_expires')
    if (!token || !expiry) return false
    return new Date(expiry) > new Date()
  })
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (localAuthed) return children

  async function submit(e) {
    e.preventDefault()
    if (!pw.trim()) return
    setLoading(true)
    setError('')
    try {
      const { supabase } = await import('../lib/supabase.js')
      const { data, error: fnError } = await supabase.functions.invoke('verify-admin', { body: { password: pw.trim() } })
      if (fnError || !data?.token) {
        setError('Access denied')
        setPw('')
      } else {
        const expires = data.expiresAt || new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
        sessionStorage.setItem('deeplinked_admin_token', data.token)
        sessionStorage.setItem('deeplinked_admin_token_expires', expires)
        setLocalAuthed(true)
      }
    } catch {
      setError('Connection error. Try again.')
      setPw('')
    } finally {
      setLoading(false)
    }
  }

  const loginBg = `${C.bg} radial-gradient(ellipse at top, rgba(58, 90, 251, 0.06) 0%, transparent 50%)`

  return (
    <div style={{ minHeight: '100vh', background: loginBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 16, padding: 40, width: 420, maxWidth: 420,
        boxShadow: '0 16px 40px rgba(26, 26, 31, 0.12), 0 0 0 1px rgba(38, 47, 70, 0.10)',
      }}>
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{
            display: 'inline-block',
            fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 32,
            fontStyle: 'italic', color: C.text, marginBottom: 4,
          }}>METALINK</div>
          <div style={{ fontSize: 14, color: C.textMuted, fontFamily: "'DM Sans', sans-serif", marginTop: 8 }}>
            Meta ads generator
          </div>
        </div>
        <form onSubmit={submit}>
          <input
            type="password"
            value={pw}
            onChange={e => { setPw(e.target.value.slice(0, 100)); setError('') }}
            placeholder="Password"
            autoFocus
            disabled={loading}
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 10, boxSizing: 'border-box',
              background: C.surface, border: `1px solid ${error ? C.error : C.border}`,
              color: C.text, fontSize: 15, fontFamily: "'DM Sans', sans-serif", outline: 'none',
              marginBottom: 12, opacity: loading ? 0.6 : 1,
              transition: `border-color ${MOTION.fast}, box-shadow ${MOTION.fast}`,
            }}
            onFocus={e => { e.target.style.borderColor = C.interactive; e.target.style.boxShadow = `0 0 0 4px ${C.interactiveGlow}` }}
            onBlur={e => { e.target.style.borderColor = error ? C.error : C.border; e.target.style.boxShadow = 'none' }}
          />
          {error && (
            <div style={{
              padding: '12px 14px', background: C.errorBg, border: `1px solid ${C.error}`,
              borderRadius: 10, color: C.error, fontSize: 13,
              fontFamily: "'DM Sans', sans-serif", marginBottom: 12,
            }}>{error}</div>
          )}
          <button
            type="submit"
            disabled={loading || !pw.trim()}
            style={{
              width: '100%', padding: 14, borderRadius: 10,
              cursor: loading || !pw.trim() ? 'not-allowed' : 'pointer',
              background: loading || !pw.trim() ? 'rgba(38, 47, 70, 0.3)' : C.accent,
              border: 'none', color: C.textInverse,
              fontSize: 15, fontWeight: 700, fontFamily: "'Archivo', sans-serif",
              opacity: loading || !pw.trim() ? 0.5 : 1,
              transition: `all ${MOTION.fast}`,
            }}
          >{loading ? 'Verifying...' : 'Enter →'}</button>
        </form>
      </div>
    </div>
  )
}

function TopBar({ onHome }) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(243,239,233,0.92)', backdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${C.border}`,
      padding: '0 40px', height: 58,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <button onClick={onHome} style={{
        display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 0,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: C.accentMuted, border: `1px solid ${C.borderAccent}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 17, color: C.accent,
        }}>M</div>
        <span style={{
          fontFamily: "'Archivo', sans-serif", fontWeight: 900, fontSize: 14,
          letterSpacing: '-0.02em', color: C.text,
        }}>METALINK</span>
      </button>
      <a href="/" style={{
        fontSize: 12, color: C.textDim, fontFamily: "'DM Sans', sans-serif",
        textDecoration: 'none', padding: '6px 10px', borderRadius: 6,
      }}>← Home</a>
    </div>
  )
}

function GeneratingStep({ stage }) {
  return (
    <div style={{ minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        border: `3px solid ${C.border}`, borderTopColor: C.accent,
        animation: 'mlSpin 0.75s linear infinite',
      }} />
      <style>{'@keyframes mlSpin { to { transform: rotate(360deg) } }'}</style>
      <div style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 18, color: C.text }}>
        {stage || 'Writing your ads...'}
      </div>
    </div>
  )
}

function ResultsStep({ client, ads, onReset, onRegenerate }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, gap: 16 }}>
        <div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 34,
            color: C.text, margin: 0, letterSpacing: '-0.02em',
          }}>{ads.length} ads ready — {client?.name}</h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.textMuted, marginTop: 6 }}>
            Copy individually or export all to Meta Ads Manager via CSV.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <button onClick={() => exportToCSV(ads)} style={{
            padding: '10px 18px', borderRadius: 9, cursor: 'pointer',
            background: C.accentMuted, border: `1px solid ${C.borderAccent}`,
            color: C.accent, fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
          }}>Export CSV</button>
          <button onClick={onReset} style={{
            padding: '10px 18px', borderRadius: 9, cursor: 'pointer',
            background: 'transparent', border: `1px solid ${C.border}`,
            color: C.textMuted, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
          }}>Back to dashboard</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(460px, 1fr))', gap: 16 }}>
        {ads.map((ad, i) => <AdCard key={i} ad={ad} index={i} onRegenerate={onRegenerate} />)}
      </div>
    </div>
  )
}

function MetalinkShell() {
  const { activeClient, selectClient, saveGeneratedAds } = useMetalink()
  const [screen, setScreen] = useState('dashboard')
  const [ads, setAds] = useState([])
  const [error, setError] = useState('')
  const [genStage, setGenStage] = useState('')

  function handleOpenClient(client) {
    selectClient(client)
    setScreen(client.chat_summary ? 'angles' : 'chat')
  }

  function handleHome() {
    selectClient(null)
    setScreen('dashboard')
  }

  async function handleGenerate(angles) {
    setError('')
    setGenStage('Writing your ads...')
    setScreen('generating')
    try {
      const result = await generateCampaign({ source: activeClient.chat_summary, angles, onProgress: setGenStage })
      setAds(result)
      saveGeneratedAds(activeClient.id, result).catch(() => {})
      setScreen('results')
    } catch (e) {
      setError(e.message || 'Generation failed.')
      setScreen('angles')
    }
  }

  // Jasper-style one-click campaign: mine angles, auto-pick the top 8, write the
  // ads, then run the art-director + image agents — copy and creatives in one go.
  async function handleQuickGenerate(client) {
    setError('')
    selectClient(client)
    setScreen('generating')
    try {
      setGenStage('Mining unique angles for this client...')
      const mined = await mineAngles(client.chat_summary)
      const top = mined.slice(0, 8)
      const result = await generateCampaign({ source: client.chat_summary, angles: top, onProgress: setGenStage })
      setAds(result)
      saveGeneratedAds(client.id, result).catch(() => {})
      setScreen('results')
    } catch (e) {
      setError(e.message || 'Quick generate failed.')
      setScreen('dashboard')
    }
  }

  // Re-render a single ad's creative and update it in place.
  async function handleRegenerateCreative(index) {
    const ad = ads[index]
    if (!ad) return
    const url = await regenerateCreative(ad, activeClient?.chat_summary)
    setAds(prev => prev.map((a, i) => i === index ? { ...a, imageUrl: url, imageError: '' } : a))
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <TopBar onHome={handleHome} />
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '44px 40px 100px' }}>
        {screen === 'dashboard' && (
          <>
            {error && (
              <div style={{
                maxWidth: 900, margin: '0 auto 20px', padding: '12px 16px',
                background: C.errorBg, border: `1px solid ${C.error}`,
                borderRadius: 10, fontSize: 13, color: C.error, fontFamily: "'DM Sans', sans-serif",
              }}>{error}</div>
            )}
            <MetalinkDashboard onOpenClient={handleOpenClient} onQuickGenerate={handleQuickGenerate} />
          </>
        )}
        {screen === 'chat' && (
          <ChatPanel
            client={activeClient}
            onBack={handleHome}
            onFinalized={() => setScreen('angles')}
          />
        )}
        {screen === 'angles' && (
          <>
            {error && (
              <div style={{
                maxWidth: 900, margin: '0 auto 20px', padding: '12px 16px',
                background: C.errorBg, border: `1px solid ${C.error}`,
                borderRadius: 10, fontSize: 13, color: C.error, fontFamily: "'DM Sans', sans-serif",
              }}>{error}</div>
            )}
            <MegaAngleSelector
              client={activeClient}
              onBack={() => setScreen('chat')}
              onGenerate={handleGenerate}
            />
          </>
        )}
        {screen === 'generating' && <GeneratingStep stage={genStage} />}
        {screen === 'results' && (
          <ResultsStep client={activeClient} ads={ads} onReset={handleHome} onRegenerate={handleRegenerateCreative} />
        )}
      </div>
    </div>
  )
}

export default function MetalinkApp() {
  return (
    <MetalinkGate>
      <MetalinkProvider>
        <MetalinkShell />
      </MetalinkProvider>
    </MetalinkGate>
  )
}
