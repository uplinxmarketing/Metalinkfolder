import { useEffect, useState, useRef } from 'react'
import { useMetalink } from './MetalinkContext'

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
  accentMuted: 'rgba(38, 47, 70, 0.08)',
  gradient: 'linear-gradient(135deg, #262F46 0%, #3A5AFB 100%)',
  success: '#2D7A4F',
  successMuted: 'rgba(45, 122, 79, 0.10)',
  warn: '#A07E3A',
  warnMuted: 'rgba(160, 126, 58, 0.10)',
}

function AddClientModal({ onClose, onCreated }) {
  const { createNewClient } = useMetalink()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdClient, setCreatedClient] = useState(null)
  const [copied, setCopied] = useState(false)
  const nameRef = useRef(null)

  useEffect(() => { nameRef.current?.focus() }, [])

  const clientLink = createdClient
    ? `${window.location.origin}/metalink-client/${createdClient.id}`
    : null

  async function handleCreate(e) {
    e.preventDefault()
    if (!name.trim()) { setError('Business or client name is required.'); return }
    setLoading(true)
    setError('')
    const client = await createNewClient(name.trim(), email.trim())
    setLoading(false)
    if (!client) { setError('Failed to create client. Check your Supabase connection.'); return }
    setCreatedClient(client)
    onCreated(client)
  }

  async function copyLink() {
    if (!clientLink) return
    await navigator.clipboard.writeText(clientLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: 10, boxSizing: 'border-box',
    background: C.surface2, border: `1px solid ${C.border}`,
    color: C.text, fontSize: 14, fontFamily: 'DM Sans, sans-serif', outline: 'none',
  }
  const labelStyle = {
    fontSize: 11, color: C.textMuted, fontFamily: 'DM Sans, sans-serif',
    fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase',
    display: 'block', marginBottom: 8,
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(26, 26, 31, 0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 16, padding: '36px 40px', width: 440,
        boxShadow: '0 16px 40px rgba(26, 26, 31, 0.12)',
      }}>
        {!createdClient ? (
          <>
            <div style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 900, fontSize: 18, color: C.text, marginBottom: 6 }}>
              Add Client
            </div>
            <div style={{ fontSize: 13, color: C.textMuted, fontFamily: 'DM Sans, sans-serif', marginBottom: 28 }}>
              Creates a unique Meta ads onboarding link to send them.
            </div>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Business / Client Name</label>
                <input
                  ref={nameRef}
                  value={name}
                  onChange={e => { setName(e.target.value); setError('') }}
                  placeholder="e.g. Northline Supplements"
                  style={{ ...inputStyle, borderColor: error && !name.trim() ? '#ef4444' : C.border }}
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Email (optional)</label>
                <input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="client@email.com"
                  type="email"
                  style={inputStyle}
                />
              </div>
              {error && (
                <div style={{ color: '#ef4444', fontSize: 13, fontFamily: 'DM Sans, sans-serif', marginBottom: 16 }}>
                  {error}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={onClose} style={{
                  flex: 1, padding: '11px', borderRadius: 10, cursor: 'pointer',
                  background: 'transparent', border: `1px solid ${C.border}`,
                  color: C.textMuted, fontSize: 14, fontFamily: 'DM Sans, sans-serif',
                }}>Cancel</button>
                <button type="submit" disabled={loading} style={{
                  flex: 2, padding: '11px', borderRadius: 10,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  background: loading ? C.surface2 : C.accent,
                  border: '2px solid #0F0F0F', color: C.textInverse,
                  fontSize: 14, fontWeight: 600, fontFamily: 'DM Sans, sans-serif',
                  opacity: loading ? 0.6 : 1,
                }}>{loading ? 'Creating...' : 'Create Client'}</button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%', background: C.gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Archivo', sans-serif", fontWeight: 900, fontSize: 22, color: C.textInverse,
                margin: '0 auto 16px',
              }}>{(createdClient.name || 'C')[0].toUpperCase()}</div>
              <div style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 900, fontSize: 18, color: C.text, marginBottom: 4 }}>
                {createdClient.name} added
              </div>
              <div style={{ fontSize: 13, color: C.textMuted, fontFamily: 'DM Sans, sans-serif' }}>
                Send this link to start their onboarding.
              </div>
            </div>
            <div style={{
              background: C.surface2, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: '12px 14px', marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{ flex: 1, fontSize: 12, color: C.accent, fontFamily: 'DM Sans, sans-serif', wordBreak: 'break-all', lineHeight: 1.4 }}>
                {clientLink}
              </div>
              <button onClick={copyLink} style={{
                flexShrink: 0, padding: '7px 12px', borderRadius: 8, cursor: 'pointer',
                background: copied ? C.accentMuted : 'transparent',
                border: `1px solid ${copied ? C.accent : C.border}`,
                color: copied ? C.accent : C.textMuted,
                fontSize: 12, fontFamily: 'DM Sans, sans-serif',
              }}>{copied ? 'Copied!' : 'Copy'}</button>
            </div>
            <button onClick={onClose} style={{
              width: '100%', padding: '14px', borderRadius: 6, cursor: 'pointer',
              background: C.accent, border: '2px solid #0F0F0F', color: C.textInverse,
              fontSize: 15, fontWeight: 800, fontFamily: 'Archivo, sans-serif', letterSpacing: '-0.01em',
            }}>Done →</button>
          </>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ client }) {
  if (!client.onboarding_complete) {
    return <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: C.warnMuted, color: C.warn, fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>Awaiting onboarding</span>
  }
  if (!client.chat_summary) {
    return <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: C.accentMuted, color: C.accent, fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>Ready to chat</span>
  }
  return <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: C.successMuted, color: C.success, fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>Brief locked</span>
}

function ClientRow({ client, onOpen, onDelete, onQuickGenerate }) {
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [quickBusy, setQuickBusy] = useState(false)
  const mounted = useRef(true)
  useEffect(() => () => { mounted.current = false }, [])

  async function handleQuick(e) {
    e.stopPropagation()
    setQuickBusy(true)
    await onQuickGenerate(client)
    if (mounted.current) setQuickBusy(false)
  }

  async function copyLink(e) {
    e.stopPropagation()
    const link = `${window.location.origin}/metalink-client/${client.id}`
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleDelete(e) {
    e.stopPropagation()
    setDeleting(true)
    await onDelete(client.id)
    setDeleting(false)
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 18px', borderBottom: `1px solid ${C.border}`,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%', background: C.gradient,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Archivo', sans-serif", fontWeight: 900, fontSize: 14, color: C.textInverse, flexShrink: 0,
      }}>{(client.name || 'C')[0].toUpperCase()}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 14, color: C.text }}>
            {client.name || 'Unnamed client'}
          </span>
          <StatusBadge client={client} />
        </div>
        <div style={{ fontSize: 12, color: C.textDim, fontFamily: 'DM Sans, sans-serif', marginTop: 2 }}>
          {client.industry ? `${client.industry} · ` : ''}Added {new Date(client.created_at).toLocaleDateString()}
        </div>
      </div>

      <button onClick={copyLink} style={{
        padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
        background: copied ? C.accentMuted : 'transparent',
        border: `1px solid ${copied ? C.accent : C.border}`,
        color: copied ? C.accent : C.textMuted,
        fontSize: 12, fontFamily: 'DM Sans, sans-serif', flexShrink: 0,
      }}>{copied ? 'Copied!' : 'Copy Link'}</button>

      {client.chat_summary && (
        <button onClick={handleQuick} disabled={quickBusy} title="Mine angles and write ads in one click" style={{
          padding: '8px 14px', borderRadius: 8, cursor: quickBusy ? 'not-allowed' : 'pointer',
          background: C.gradient, border: 'none', color: C.textInverse,
          fontSize: 12, fontWeight: 700, fontFamily: 'Archivo, sans-serif', flexShrink: 0,
          opacity: quickBusy ? 0.6 : 1,
        }}>{quickBusy ? 'Working...' : '⚡ Quick Generate'}</button>
      )}

      <button onClick={() => onOpen(client)} disabled={!client.onboarding_complete} style={{
        padding: '8px 16px', borderRadius: 8,
        cursor: client.onboarding_complete ? 'pointer' : 'not-allowed',
        background: client.onboarding_complete ? C.accent : C.surface2,
        border: 'none', color: client.onboarding_complete ? C.textInverse : C.textDim,
        fontSize: 12, fontWeight: 700, fontFamily: 'Archivo, sans-serif', flexShrink: 0,
        opacity: client.onboarding_complete ? 1 : 0.6,
      }}>Open →</button>

      <button onClick={handleDelete} disabled={deleting} style={{
        padding: '8px 10px', borderRadius: 8, cursor: deleting ? 'not-allowed' : 'pointer',
        background: 'transparent', border: '1px solid rgba(239,68,68,0.3)',
        color: '#ef4444', fontSize: 12, fontFamily: 'DM Sans, sans-serif', flexShrink: 0,
        opacity: deleting ? 0.5 : 1,
      }}>{deleting ? '...' : 'Delete'}</button>
    </div>
  )
}

export default function MetalinkDashboard({ onOpenClient, onQuickGenerate }) {
  const { clients, fetchClients, deleteClient } = useMetalink()
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetchClients().finally(() => setLoading(false))
  }, []) // eslint-disable-line

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {showAddModal && (
        <AddClientModal onClose={() => setShowAddModal(false)} onCreated={() => {}} />
      )}

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32, gap: 20 }}>
        <div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 40,
            color: C.text, marginBottom: 8, lineHeight: 1.1, letterSpacing: '-0.015em',
          }}>METALINK</h1>
          <p style={{ fontSize: 15, color: C.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
            Meta ads clients, campaign briefs, and generated ads.
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} style={{
          padding: '12px 20px', borderRadius: 10, cursor: 'pointer',
          background: C.accent, border: '2px solid #0F0F0F',
          color: C.textInverse, fontSize: 13, fontFamily: 'Archivo, sans-serif',
          fontWeight: 800, flexShrink: 0, whiteSpace: 'nowrap',
        }}>+ Add Client</button>
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px 18px', fontSize: 13, color: C.textDim, fontFamily: 'DM Sans, sans-serif', textAlign: 'center' }}>
            Loading clients...
          </div>
        ) : clients.length === 0 ? (
          <div style={{ padding: '48px 18px', fontSize: 14, color: C.textDim, fontFamily: 'DM Sans, sans-serif', textAlign: 'center' }}>
            No clients yet. Add one to get their onboarding link.
          </div>
        ) : (
          clients.map(c => (
            <ClientRow key={c.id} client={c} onOpen={onOpenClient} onDelete={deleteClient} onQuickGenerate={onQuickGenerate} />
          ))
        )}
      </div>
    </div>
  )
}
