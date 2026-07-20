import { AD_ANGLES } from './adAngles.js'
import { CORE_PLAYBOOK } from './knowledgeBase.js'
import { callAI } from './aiClient.js'
import { enforceCleanCopy, GENERIC_AD_BAN_PROSE } from './adLinter.js'

const SYSTEM_PROMPT = `You are a world-class Meta (Facebook/Instagram) Ads copywriter and creative director specializing in cold-traffic direct response. Every ad you write stops the scroll and drives action.

CORE PHILOSOPHY:
- Sell transformation, not information. Lead with the specific outcome the buyer will achieve, not features or methods.
- Describe the client's problem better than they could describe it themselves. Mirror their exact frustrations, fears, and desires back at them — when they read it, they should think "how did you know?"
- Every ad must answer the unspoken question: "Why should I choose this over every other option available to me, including doing nothing?"
- Communicate the differentiator. What makes this unique, better, or more specific than the competition? What promise does no one else make?
- It's all about how you make them FEEL. Clients can't tell the difference between you and your competition until you show them the difference.
- Build 100% of each ad's message around the most powerful outcome. One message, one outcome, one CTA.
- Narrow specificity creates wider reach. The more specific the problem, audience, and result, the more people say "that's exactly me."
- Don't be transactional. View what you do at another level. Focus on the client, not the product.

META ADS WRITING RULES:
- Hook in first 2 lines. These show before "See More" in the feed. They must be impossible to scroll past.
- Speak directly to ONE specific person. Use "you" and "your."
- Hyper-specific language. "$2,400 in 30 days" beats "more money." "14 days" beats "quickly."
- Short paragraphs. 1-2 sentences each. White space is readability.
- One clear CTA at the very end. Never two.
- Primary text: 120-220 words. Conversational, punchy, human.
- Headline: 4-8 words. Benefit-first or curiosity-first. No weak verbs.
- Description: exactly 1 line, 8-15 words. Reinforce the key benefit or add urgency.
- No emojis. No hashtags inside the ad text.
- No corporate jargon: leverage, synergy, solutions, ecosystem, empower, transform, robust.
- No AI tells: delve, navigate, intricate, paradigm, tapestry, unlock potential, comprehensive.
- No em dashes. Restructure sentences instead.
- No "Most people..." or "Everyone knows..." openers. Use a specific count, a specific person, or a specific moment.
- No "It's not X, it's Y" or "Stop X, start Y" contrasts. Just say what it IS and what it DOES.
- No staccato triples: "Fast. Simple. Effective." Write in real sentences.

CREATIVE BRIEF RULES (for the CREATIVE_BRIEF field on each ad):
- Recommend one format: single image, video, or carousel. Default to video for cold-traffic angles — it consistently beats static on CTR and unlocks watch-time retargeting (25%+ watched = warm audience, 80%+ watched = high-intent audience) that static can't. Only recommend static or carousel when the angle is genuinely better served by it (e.g. a single before/after image, a screenshot-driven proof angle).
- Describe the actual visual direction: what's on screen, the shot/scene, who or what is shown, and how it supports the hook (not a vague mood word).
- Add one targeting/placement note where it's non-obvious: e.g. a placement that suits the format, a retargeting segment this angle is built for (site visitors vs. cart abandoners vs. engaged-but-not-visited), or an audience nuance beyond the angle itself.
- 2-3 sentences total. Concrete enough that a designer or media buyer could act on it without asking follow-up questions.

${GENERIC_AD_BAN_PROSE}

This app enforces the same anti-generic, anti-AI-tell standard across every writing surface. The following is the exact banned-pattern list used everywhere else in this app — it applies here too, word for word:
${CORE_PLAYBOOK}`

function buildUserMessage(source, angles) {
  const angleList = angles.map((a, i) =>
    `AD_${i + 1}: ${a.name} — ${a.brief}${a.hook ? `\n   Suggested hook to build from (sharpen it further, don't just copy it verbatim): "${a.hook}"` : ''}`
  ).join('\n')

  return `CAMPAIGN BRIEF:
${source.trim()}

---

Write ${angles.length} Facebook/Instagram ads, one per angle listed below. Each ad must be distinctly different in tone, structure, and opening. Do not repeat hooks or approaches across ads.

ANGLES:
${angleList}

OUTPUT FORMAT — follow exactly, no extra text outside the blocks:
===AD_1===
ANGLE: ${angles[0]?.name || 'Problem-Agitate-Solution'}
PRIMARY:
[primary text 120-220 words]
HEADLINE: [4-8 word headline]
DESCRIPTION: [8-15 word description]
CREATIVE_BRIEF: [2-3 sentences: format, visual direction, targeting/placement note]
===END===

===AD_2===
ANGLE: [next angle name]
PRIMARY:
[primary text]
HEADLINE: [headline]
DESCRIPTION: [description]
CREATIVE_BRIEF: [2-3 sentences]
===END===

Continue for all ${angles.length} ads, one per angle, in the order listed.`
}

function parseAds(raw) {
  const ads = []
  const blocks = raw.split(/===AD_\d+===/).filter(s => s.trim())
  for (const block of blocks) {
    const cleaned = block.replace(/===END===/g, '').trim()
    if (!cleaned) continue

    const angleMatch = cleaned.match(/ANGLE:\s*(.+)/)
    const primaryMatch = cleaned.match(/PRIMARY:\s*([\s\S]+?)(?=\nHEADLINE:)/)
    const headlineMatch = cleaned.match(/HEADLINE:\s*(.+)/)
    const descMatch = cleaned.match(/DESCRIPTION:\s*(.+)/)
    const briefMatch = cleaned.match(/CREATIVE_BRIEF:\s*([\s\S]+?)$/)

    if (angleMatch) {
      ads.push({
        angle: angleMatch[1].trim(),
        primaryText: primaryMatch?.[1]?.trim() || '',
        headline: headlineMatch?.[1]?.trim() || '',
        description: descMatch?.[1]?.trim() || '',
        creativeBrief: briefMatch?.[1]?.trim() || '',
      })
    }
  }
  return ads
}

export async function generateAds({ source, angles, onProgress }) {
  const chosenAngles = angles?.length ? angles : AD_ANGLES.slice(0, 10)
  const userMessage = buildUserMessage(source, chosenAngles)
  const maxTokens = Math.min(8000, Math.max(1500, chosenAngles.length * 480))

  onProgress?.(`Writing ${chosenAngles.length} ads...`)
  const text = await callAI({
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
    maxTokens,
  })

  const parsed = parseAds(text)
  if (parsed.length === 0) throw new Error('No ads could be parsed from the AI response.')

  const ads = parsed.map((ad, i) => ({
    ...ad,
    tag: chosenAngles[i]?.tag,
    color: chosenAngles[i]?.color,
  }))

  onProgress?.('Scanning for generic language...')
  return enforceCleanCopy(ads, source, onProgress)
}

export function exportToCSV(ads) {
  const header = ['Ad #', 'Angle', 'Primary Text', 'Headline', 'Description', 'Creative Brief']
  const rows = ads.map((ad, i) => [
    i + 1,
    ad.angle,
    ad.primaryText.replace(/"/g, '""'),
    ad.headline.replace(/"/g, '""'),
    ad.description.replace(/"/g, '""'),
    (ad.creativeBrief || '').replace(/"/g, '""'),
  ])
  const csv = [header, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'metalink-ads.csv'
  a.click()
  URL.revokeObjectURL(url)
}
