import { createContext, useContext, useState } from 'react'
import { supabase } from '../lib/supabase'
import { sanitizeShortText, sanitizeEmail, sanitizeUrl, sanitizeText, sanitizeArray } from '../lib/sanitize'

const MetalinkContext = createContext(null)

function sanitizeClientData(data) {
  if (!data || typeof data !== 'object') return {}
  const out = {}
  for (const [key, val] of Object.entries(data)) {
    if (Array.isArray(val)) {
      out[key] = sanitizeArray(val)
    } else if (typeof val === 'string') {
      if (key === 'website') out[key] = sanitizeUrl(val) || val.trim().slice(0, 2048)
      else if (['businessName', 'industry'].includes(key)) out[key] = sanitizeShortText(val)
      else out[key] = sanitizeText(val)
    } else {
      out[key] = val
    }
  }
  return out
}

export function MetalinkProvider({ children }) {
  const [clients, setClients] = useState([])
  const [activeClient, setActiveClient] = useState(null)

  async function fetchClients() {
    const { data, error } = await supabase
      .from('metalink_clients')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setClients(data)
    return data || []
  }

  async function fetchClientById(id) {
    if (!id || typeof id !== 'string') return null
    const { data, error } = await supabase
      .from('metalink_clients')
      .select('*')
      .eq('id', id)
      .single()
    return error ? null : data
  }

  function selectClient(client) {
    setActiveClient(client)
  }

  async function createNewClient(name, email) {
    const cleanName = sanitizeShortText(name)
    const cleanEmail = sanitizeEmail(email) || sanitizeShortText(email)
    if (!cleanName) return null

    const { data, error } = await supabase
      .from('metalink_clients')
      .insert({ name: cleanName, email: cleanEmail, data: { businessName: cleanName } })
      .select()
      .single()
    if (error) return null
    setClients(prev => [data, ...prev])
    setActiveClient(data)
    return data
  }

  async function deleteClient(id) {
    if (!id || typeof id !== 'string') return
    await supabase.from('metalink_clients').delete().eq('id', id)
    if (activeClient?.id === id) setActiveClient(null)
    const { data } = await supabase
      .from('metalink_clients')
      .select('*')
      .order('created_at', { ascending: false })
    setClients(data || [])
  }

  async function saveOnboardingResponse(clientId, question, answer) {
    if (!clientId || typeof clientId !== 'string') return
    const cleanQuestion = sanitizeText(question, 500)
    const cleanAnswer = sanitizeText(
      Array.isArray(answer) ? answer.join(', ') : String(answer ?? ''),
      2000
    )
    await supabase.from('metalink_onboarding_responses').insert({
      client_id: clientId,
      question: cleanQuestion,
      answer: cleanAnswer,
    })
  }

  async function saveClientOverview(clientId, overview, fullData) {
    if (!clientId || typeof clientId !== 'string') return
    const cleanOverview = sanitizeText(overview, 5000)
    const clean = sanitizeClientData(fullData)

    const { error } = await supabase
      .from('metalink_clients')
      .update({
        overview: cleanOverview,
        onboarding_complete: true,
        data: clean,
        name: sanitizeShortText(clean.businessName || ''),
        business_name: sanitizeShortText(clean.businessName || ''),
        industry: sanitizeShortText(clean.industry || ''),
        updated_at: new Date().toISOString(),
      })
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

  async function fetchChatMessages(clientId) {
    if (!clientId || typeof clientId !== 'string') return []
    const { data, error } = await supabase
      .from('metalink_chat_messages')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true })
    return error ? [] : (data || [])
  }

  async function saveChatMessage(clientId, role, content) {
    if (!clientId || typeof clientId !== 'string') return
    const cleanRole = role === 'assistant' ? 'assistant' : 'user'
    const cleanContent = sanitizeText(content, 4000)
    await supabase.from('metalink_chat_messages').insert({
      client_id: clientId,
      role: cleanRole,
      content: cleanContent,
    })
  }

  async function saveChatSummary(clientId, summary, selectedAngles) {
    if (!clientId || typeof clientId !== 'string') return
    const cleanSummary = sanitizeText(summary, 3000)
    const { error } = await supabase
      .from('metalink_clients')
      .update({
        chat_summary: cleanSummary,
        selected_angles: selectedAngles || [],
        updated_at: new Date().toISOString(),
      })
      .eq('id', clientId)
    if (!error) {
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, chat_summary: cleanSummary, selected_angles: selectedAngles || [] } : c))
      if (activeClient?.id === clientId) {
        setActiveClient(prev => ({ ...prev, chat_summary: cleanSummary, selected_angles: selectedAngles || [] }))
      }
    }
  }

  async function saveGeneratedAds(clientId, ads) {
    if (!clientId || typeof clientId !== 'string' || !ads?.length) return
    const rows = ads.map(ad => ({
      client_id: clientId,
      angle: sanitizeShortText(ad.angle || ''),
      primary_text: sanitizeText(ad.primaryText || '', 4000),
      headline: sanitizeShortText(ad.headline || ''),
      description: sanitizeText(ad.description || '', 500),
      creative_brief: sanitizeText(ad.creativeBrief || '', 1000),
    }))
    await supabase.from('metalink_generated_ads').insert(rows)
  }

  async function fetchGeneratedAds(clientId) {
    if (!clientId || typeof clientId !== 'string') return []
    const { data, error } = await supabase
      .from('metalink_generated_ads')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(20)
    return error ? [] : (data || [])
  }

  async function fetchAdPerformance(clientId) {
    if (!clientId || typeof clientId !== 'string') return []
    const { data, error } = await supabase
      .from('metalink_ad_performance')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
    return error ? [] : (data || [])
  }

  async function saveAdPerformance(clientId, entry) {
    if (!clientId || typeof clientId !== 'string') return null
    const cleanDescription = sanitizeText(entry?.description || '', 1000)
    if (!cleanDescription) return null
    const row = {
      client_id: clientId,
      description: cleanDescription,
      angle_or_hook: sanitizeShortText(entry?.angleOrHook || ''),
      result: ['won', 'lost', 'mixed'].includes(entry?.result) ? entry.result : 'mixed',
      metric_type: sanitizeShortText(entry?.metricType || ''),
      metric_value: sanitizeShortText(entry?.metricValue || ''),
      lesson: sanitizeText(entry?.lesson || '', 1000),
    }
    const { data, error } = await supabase.from('metalink_ad_performance').insert(row).select().single()
    return error ? null : data
  }

  async function deleteAdPerformance(id) {
    if (!id || typeof id !== 'string') return
    await supabase.from('metalink_ad_performance').delete().eq('id', id)
  }

  return (
    <MetalinkContext.Provider value={{
      clients, activeClient,
      fetchClients, fetchClientById, selectClient, deleteClient, createNewClient,
      saveOnboardingResponse, saveClientOverview,
      fetchChatMessages, saveChatMessage, saveChatSummary,
      saveGeneratedAds, fetchGeneratedAds,
      fetchAdPerformance, saveAdPerformance, deleteAdPerformance,
    }}>
      {children}
    </MetalinkContext.Provider>
  )
}

export function useMetalink() {
  return useContext(MetalinkContext)
}
