// Zero-tolerance generic-language enforcement for Meta ad copy.
//
// The system prompt already tells the model not to use these phrases, but
// prompts get ignored under token pressure. This module checks the actual
// output after generation: any hit gets sent back for a targeted rewrite,
// and anything that survives that gets stripped outright — so "no generic
// words" is a guarantee, not a hope.
import { callAI } from './aiClient.js'

export const GENERIC_AD_PHRASES = [
  'unlock your potential', 'unlock the power of', 'take it to the next level', 'next level',
  'game changer', 'game-changer', 'game changing', 'game-changing',
  'life changing', 'life-changing', 'changing the game',
  'imagine if', 'imagine a world', 'picture this', 'in a world where',
  'are you tired of', 'tired of feeling', 'say goodbye to', 'kiss goodbye to',
  'look no further', 'introducing', "we're thrilled", 'we are excited to',
  'seamless', 'seamlessly', 'cutting-edge', 'cutting edge', 'state-of-the-art',
  'one-of-a-kind', 'one of a kind', 'revolutionize', 'revolutionary',
  'transform your life', 'elevate your', 'unleash your', 'unleash the',
  "don't miss out", 'dont miss out', 'miss out on this', 'act now', 'act fast',
  'limited time only', 'limited-time only', 'click the link below', 'click below',
  'link in bio', 'swipe up', 'tap the link',
  'guaranteed results', 'proven results', 'proven to work',
  'secret to', 'secret formula', 'hidden secret', 'little-known secret',
  'ultimate guide', 'the ultimate', 'world-class', 'best-in-class',
  'top-notch', 'top notch', 'unmatched', 'unrivaled', 'second to none',
  'leverage', 'synergy', 'ecosystem', 'holistic approach', 'robust solution',
  'empower you', 'empowering', 'embark on', 'delve into', 'navigate the',
  "in today's fast-paced", 'in todays fast-paced', 'paradigm shift', 'tapestry',
  'testament to', 'streamline your', 'boost your', 'skyrocket your',
  'thousands of people', 'millions of people', 'countless people',
]

const ESCAPED = GENERIC_AD_PHRASES.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
const CLICHE_SOURCE = `\\b(${ESCAPED.join('|')})\\b`

export const GENERIC_AD_BAN_PROSE = `NEVER use any of these worn-out ad phrases, in any form: ${GENERIC_AD_PHRASES.join(', ')}.`

function findHits(text) {
  if (!text) return []
  const hits = new Set()
  const re = new RegExp(CLICHE_SOURCE, 'gi')
  let m
  while ((m = re.exec(text))) hits.add(m[1].toLowerCase())
  return [...hits]
}

function stripHits(text) {
  if (!text) return text
  return text
    .replace(new RegExp(CLICHE_SOURCE, 'gi'), '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,!?])/g, '$1')
    .trim()
}

function scanAd(ad) {
  return {
    primaryText: findHits(ad.primaryText),
    headline: findHits(ad.headline),
    description: findHits(ad.description),
  }
}

async function rewriteAd(ad, hits, context) {
  const violations = [...new Set([...hits.primaryText, ...hits.headline, ...hits.description])]
  const system = `You are editing one Meta ad to remove specific banned generic phrases. Keep the angle, structure, length, and every other word identical — only rewrite the sentences containing the banned phrases, replacing them with something concrete and specific to this client. Do not introduce any other generic marketing cliche in their place.`
  const user = `CLIENT BRIEF:\n${context}\n\nAD TO FIX (angle: ${ad.angle}):\nPRIMARY: ${ad.primaryText}\nHEADLINE: ${ad.headline}\nDESCRIPTION: ${ad.description}\n\nBANNED PHRASES FOUND — rewrite only the parts containing these: ${violations.join(', ')}\n\nOutput in exactly this format, nothing else:\nPRIMARY: [fixed primary text]\nHEADLINE: [fixed headline]\nDESCRIPTION: [fixed description]`
  const text = await callAI({ system, messages: [{ role: 'user', content: user }], maxTokens: 700 })
  const primaryMatch = text.match(/PRIMARY:\s*([\s\S]+?)(?=\nHEADLINE:)/)
  const headlineMatch = text.match(/HEADLINE:\s*(.+)/)
  const descMatch = text.match(/DESCRIPTION:\s*(.+)/)
  return {
    ...ad,
    primaryText: primaryMatch?.[1]?.trim() || ad.primaryText,
    headline: headlineMatch?.[1]?.trim() || ad.headline,
    description: descMatch?.[1]?.trim() || ad.description,
  }
}

export async function enforceCleanCopy(ads, context, onProgress) {
  const scans = ads.map(scanAd)
  const flaggedIdx = scans
    .map((s, i) => (s.primaryText.length || s.headline.length || s.description.length ? i : -1))
    .filter(i => i >= 0)

  let result = ads
  if (flaggedIdx.length) {
    onProgress?.(`Rewriting ${flaggedIdx.length} ad${flaggedIdx.length > 1 ? 's' : ''} to cut generic language...`)
    result = [...ads]
    await Promise.all(flaggedIdx.map(async i => {
      try {
        result[i] = await rewriteAd(ads[i], scans[i], context)
      } catch {
        // fall through to the hard strip below — still guarantees no banned phrase survives
      }
    }))
  }

  // Hard guarantee: strip any surviving banned phrase outright, even if the
  // correction call failed or introduced a new one.
  return result.map(ad => ({
    ...ad,
    primaryText: stripHits(ad.primaryText),
    headline: stripHits(ad.headline),
    description: stripHits(ad.description),
  }))
}
