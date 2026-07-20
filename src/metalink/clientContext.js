// Composes everything known about one client into a single "CLIENT FILE"
// block: onboarding answers, brand assets pulled from uploaded files, and
// past ad performance. This is layered on top of CORE_PLAYBOOK (the static
// agency knowledge) in every AI call, so the model reasons from the
// specific client's real details, not just general copywriting theory.

export function buildSynopsis(data = {}) {
  const lines = []
  if (data.businessName) lines.push(`Business: ${data.businessName}${data.industry ? ` (${data.industry})` : ''}`)
  if (data.website) lines.push(`Site: ${data.website}`)
  if (data.productDescription) lines.push(`What they sell / problem solved: ${data.productDescription}`)
  if (data.targetAudience) lines.push(`Dream customer: ${data.targetAudience}`)
  if (data.painPoints) lines.push(`Pain points: ${data.painPoints}`)
  if (data.competitors) lines.push(`Competitors: ${data.competitors}`)
  if (data.transformation) lines.push(`Transformation / outcome: ${data.transformation}`)
  if (data.differentiator) lines.push(`Differentiator: ${data.differentiator}`)
  if (data.priceOffer) lines.push(`Price / offer: ${data.priceOffer}`)
  if (data.dealValue) lines.push(`Deal value: ${data.dealValue}`)
  if (data.socialProof) lines.push(`Proof: ${data.socialProof}`)
  if (data.mainObjection) lines.push(`Main objection: ${data.mainObjection}`)
  if (data.cta) lines.push(`CTA: ${data.cta}`)
  if (data.adBudget) lines.push(`Ad budget: ${data.adBudget}`)
  if (Array.isArray(data.brandTone) && data.brandTone.length) lines.push(`Brand tone: ${data.brandTone.join(', ')}`)
  return lines.join('\n')
}

export function buildBrandAssetsContext(data = {}) {
  const intel = data.brandIntel
  if (!intel) return ''
  const parts = []

  if (intel.pdfContent) {
    parts.push(`Brand document excerpts (ground truth for tone & messaging):\n${intel.pdfContent.slice(0, 4000)}`)
  }

  if (intel.referenceImages?.length) {
    const refs = intel.referenceImages
      .slice(0, 5)
      .map((r, i) => `Reference ${i + 1} (${r.type || 'image'}): ${r.summary || ''} | Style: ${r.visualStyle || ''} | Tone: ${r.tone || ''} | Insight: ${r.insights || ''}`)
      .join('\n')
    parts.push(`Brand reference images:\n${refs}`)
  }

  if (intel.aggregatedTones?.length) {
    parts.push(`Observed tone from references: ${intel.aggregatedTones.join(', ')}`)
  }
  if (intel.aggregatedColors?.length) {
    parts.push(`Brand colors observed in references: ${intel.aggregatedColors.join(', ')}`)
  }

  return parts.length ? `BRAND ASSETS:\n${parts.join('\n\n')}` : ''
}

export function buildPerformanceContext(entries = []) {
  if (!entries.length) return ''
  const lines = entries.map(e => {
    const bits = [`[${(e.result || 'mixed').toUpperCase()}] ${e.description}`]
    if (e.angle_or_hook) bits.push(`angle/hook: ${e.angle_or_hook}`)
    if (e.metric_value) bits.push(`${e.metric_type || 'metric'}: ${e.metric_value}`)
    if (e.lesson) bits.push(`lesson: ${e.lesson}`)
    return `- ${bits.join(' — ')}`
  })
  return `PAST AD PERFORMANCE FOR THIS CLIENT (learn from what already won or lost):\n${lines.join('\n')}`
}

export function buildClientFileContext(client, adPerformance = []) {
  const data = client?.data || {}
  const parts = [buildSynopsis(data)]
  const brand = buildBrandAssetsContext(data)
  if (brand) parts.push(brand)
  const perf = buildPerformanceContext(adPerformance)
  if (perf) parts.push(perf)
  return parts.filter(Boolean).join('\n\n')
}
