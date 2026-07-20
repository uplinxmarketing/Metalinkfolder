import { createContext, useContext, useState } from 'react'
import { supabase } from '../lib/supabase'
import { sanitizeShortText, sanitizeEmail, sanitizeUrl, sanitizeText, sanitizeArray } from '../lib/sanitize'

const ClientContext = createContext(null)

function sanitizeClientData(data) {
  if (!data || typeof data !== 'object') return {}
  const out = {}
  for (const [key, val] of Object.entries(data)) {
    if (Array.isArray(val)) {
      out[key] = sanitizeArray(val)
    } else if (typeof val === 'string') {
      if (key === 'email') out[key] = sanitizeEmail(val) || val.trim().slice(0, 254)
      else if (key === 'linkedinUrl') out[key] = sanitizeUrl(val) || val.trim().slice(0, 2048)
      else if (['fullName', 'jobTitle', 'company', 'industry'].includes(key)) out[key] = sanitizeShortText(val)
      else out[key] = sanitizeText(val)
    } else {
      out[key] = val
    }
  }
  return out
}

export function ClientProvider({ children }) {
  const [clientData, setClientData] = useState(() => {
    try {
      const saved = localStorage.getItem('deeplinked_client')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('deeplinked_history')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const [clients, setClients] = useState([])
  const [activeClient, setActiveClient] = useState(null)

  function updateClientData(data) {
    const updated = { ...clientData, ...data }
    setClientData(updated)
    localStorage.setItem('deeplinked_client', JSON.stringify(updated))
  }

  function addToHistory(entry) {
    const updated = [{ ...entry, timestamp: new Date().toISOString() }, ...history]
    setHistory(updated)
    localStorage.setItem('deeplinked_history', JSON.stringify(updated))
  }

  async function fetchClients() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setClients(data)
    return data || []
  }

  async function fetchClientById(id) {
    if (!id || typeof id !== 'string') return null
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()
    return error ? null : data
  }

  function selectClient(client) {
    setActiveClient(client)
    if (client?.data) {
      setClientData(client.data)
      localStorage.setItem('deeplinked_client', JSON.stringify(client.data))
    } else if (!client) {
      setClientData({})
      localStorage.removeItem('deeplinked_client')
    }
  }

  async function createNewClient(name, email) {
    const cleanName = sanitizeShortText(name)
    const cleanEmail = sanitizeEmail(email) || sanitizeShortText(email)

    if (!cleanName) return null

    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: cleanName,
        email: cleanEmail,
        data: { fullName: cleanName, email: cleanEmail },
      })
      .select()
      .single()
    if (error) { return null }
    setClients(prev => [data, ...prev])
    setActiveClient(data)
    setClientData(data.data || {})
    return data
  }

  async function deleteClient(id) {
    if (!id || typeof id !== 'string') return
    await supabase.from('clients').delete().eq('id', id)
    if (activeClient?.id === id) {
      setActiveClient(null)
      setClientData({})
      localStorage.removeItem('deeplinked_client')
    }
    const { data } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
    setClients(data || [])
  }

  async function saveClientToSupabase(data) {
    const clean = sanitizeClientData(data)
    const { data: inserted, error } = await supabase
      .from('clients')
      .insert({
        name: sanitizeShortText(clean.fullName || ''),
        email: sanitizeEmail(clean.email || '') || sanitizeShortText(clean.email || ''),
        linkedin_url: sanitizeUrl(clean.linkedinUrl || '') || '',
        industry: sanitizeShortText(clean.industry || ''),
        data: clean,
      })
      .select()
      .single()
    if (!error && inserted) setActiveClient(inserted)
    return inserted
  }

  async function saveOnboardingResponse(clientId, question, answer, aiSuggestion = '') {
    if (!clientId || typeof clientId !== 'string') return
    const cleanQuestion = sanitizeText(question, 500)
    const cleanAnswer = sanitizeText(
      Array.isArray(answer) ? answer.join(', ') : String(answer),
      2000
    )
    const cleanSuggestion = sanitizeText(aiSuggestion, 2000)

    await supabase.from('onboarding_responses').insert({
      client_id: clientId,
      question: cleanQuestion,
      answer: cleanAnswer,
      ai_suggestion: cleanSuggestion,
    })
  }

  async function saveClientOverview(clientId, overview, fullData) {
    if (!clientId || typeof clientId !== 'string') return
    const cleanOverview = sanitizeText(overview, 5000)
    const clean = sanitizeClientData(fullData)

    const updates = {
      overview: cleanOverview,
      onboarding_complete: true,
      data: clean,
      email: sanitizeEmail(clean.email || '') || sanitizeShortText(clean.email || ''),
      linkedin_url: sanitizeUrl(clean.linkedinUrl || '') || '',
      industry: sanitizeShortText(clean.industry || ''),
    }
    const cleanName = sanitizeShortText(clean.fullName || '')
    if (cleanName) updates.name = cleanName

    const { error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', clientId)
    if (!error) {
      setClients(prev => prev.map(c =>
        c.id === clientId ? { ...c, overview: cleanOverview, onboarding_complete: true, data: clean } : c
      ))
      if (activeClient?.id === clientId) {
        setActiveClient(prev => ({ ...prev, overview: cleanOverview, onboarding_complete: true, data: clean }))
      }
    }
  }

  async function saveGeneratedContent(type, content) {
    if (!activeClient?.id) return
    const cleanType = sanitizeShortText(type)
    const cleanContent = sanitizeText(content, 10000)
    await supabase.from('generated_content').insert({
      client_id: activeClient.id,
      type: cleanType,
      content: cleanContent,
    })
  }

  async function fetchContentHistory(type) {
    if (!activeClient?.id) return []
    const { data, error } = await supabase
      .from('generated_content')
      .select('*')
      .eq('client_id', activeClient.id)
      .eq('type', type)
      .order('created_at', { ascending: false })
      .limit(10)
    return error ? [] : (data || [])
  }

  async function fetchAllContent(clientId) {
    const id = clientId || activeClient?.id
    if (!id || typeof id !== 'string') return []
    const { data, error } = await supabase
      .from('generated_content')
      .select('*')
      .eq('client_id', id)
      .order('created_at', { ascending: false })
      .limit(50)
    return error ? [] : (data || [])
  }

  return (
    <ClientContext.Provider value={{
      clientData, updateClientData, history, addToHistory,
      clients, activeClient,
      fetchClients, fetchClientById, selectClient, deleteClient,
      createNewClient, saveClientToSupabase,
      saveOnboardingResponse, saveClientOverview,
      saveGeneratedContent, fetchContentHistory, fetchAllContent,
    }}>
      {children}
    </ClientContext.Provider>
  )
}

export function useClient() {
  return useContext(ClientContext)
}
