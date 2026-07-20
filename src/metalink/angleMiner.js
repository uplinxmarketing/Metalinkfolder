// Mega Angle Miner — replaces "pick from a menu of 20 templates" with
// "invent the angle only this client can own." Every angle is mined fresh
// from the client's actual brief through 10 distinct creative lenses, so
// the output is never a generic PAS/FOMO/Before-After label — it's a named,
// client-specific angle with a ready-to-use hook line.
import { callAI } from './aiClient.js'
import { BANNED_PATTERNS } from '../ai/writingRules.js'
import { GENERIC_AD_BAN_PROSE } from './adLinter.js'

const LENS_PALETTE = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4',
  '#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#0891b2',
]

const MEGA_ANGLE_SYSTEM = `You are an elite direct-response strategist whose entire job is finding the ONE ad angle nobody else in the market has thought to run. You do not pick from a template menu of "Problem-Agitate-Solution" or "FOMO" — those are commodity angles every competitor already runs. Your job is to mine the client's own brief for the specific, ownable angle only this business can claim.

MINING LENSES — use a mix across your angles, never the same lens more than twice:
1. THE NAMED ENEMY — find what's actually sabotaging this buyer. Not "the competition." A specific habit, belief, broken system, or industry lie.
2. THE BURIED MECHANISM — the unique "how it actually works" detail buried in the brief that no one else states out loud.
3. COST-OF-INACTION MATH — quantify, in the client's own numbers, exactly what waiting costs this buyer.
4. THE INSIDER CONFESSION — frame the angle as someone from inside the industry admitting a secret the industry doesn't want said.
5. CATEGORY REBELLION — position against the entire category or "the way it's normally done," not a single competitor.
6. UNLIKELY COMPARISON — reframe the problem or offer through a comparison to something totally unrelated that makes the stakes click instantly.
7. THE TRIGGER MOMENT — pinpoint the exact moment or event that makes someone ready to buy right now, and open there.
8. IDENTITY FLIP — sell who they're becoming, not who they are. Name the identity shift directly.
9. THE OVERLOOKED PROOF — find the single most surprising, specific proof point buried in the brief and build the whole angle around just that one detail.
10. THE UNCOMFORTABLE TRUTH — say the thing competitors are too polite or too scared to say about this market.

RULES:
- Every angle must be traceable to a specific fact in the client brief. If you could swap the product and the angle still works unchanged, it is not specific enough — throw it out and mine deeper.
- Invent a short, punchy NAME for each angle pulled from the client's own language — never label an angle with a generic template name (no "Problem-Agitate-Solution," no "FOMO," no "Before & After," no "Social Proof").
- The HOOK is the literal first line of the ad, ready to use as-is or sharpen further. It must pass with the sound off and stop a scroll.
- ${GENERIC_AD_BAN_PROSE}
${BANNED_PATTERNS}

OUTPUT FORMAT — exactly this, no extra text outside the blocks, no markdown:
===ANGLE_1===
NAME: [invented, specific angle name, 2-5 words]
LENS: [which of the 10 lenses above]
WHY: [1-2 sentences — the exact reason this lands for THIS client, citing a real detail from the brief]
HOOK: [the literal first line of the ad]
===END===

Repeat for all angles requested, each genuinely different from the others in lens, tone, and opening line.`

function buildUserMessage(context, count) {
  return `CLIENT BRIEF:\n${context.trim()}\n\nMine ${count} completely fresh, client-specific ad angles now. No lens should repeat more than twice across the set.`
}

function parseAngles(raw) {
  const angles = []
  const blocks = raw.split(/===ANGLE_\d+===/).filter(s => s.trim())
  for (const block of blocks) {
    const cleaned = block.replace(/===END===/g, '').trim()
    if (!cleaned) continue

    const nameMatch = cleaned.match(/NAME:\s*(.+)/)
    const lensMatch = cleaned.match(/LENS:\s*(.+)/)
    const whyMatch = cleaned.match(/WHY:\s*([\s\S]+?)(?=\nHOOK:)/)
    const hookMatch = cleaned.match(/HOOK:\s*([\s\S]+?)$/)

    if (nameMatch) {
      angles.push({
        name: nameMatch[1].trim(),
        tag: (lensMatch?.[1] || '').trim().toUpperCase(),
        brief: whyMatch?.[1]?.trim() || '',
        hook: hookMatch?.[1]?.trim() || '',
      })
    }
  }
  return angles.map((a, i) => ({
    ...a,
    id: `mined-${i}-${a.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}`,
    color: LENS_PALETTE[i % LENS_PALETTE.length],
  }))
}

export async function mineAngles(context, { count = 12 } = {}) {
  if (!context?.trim()) throw new Error('No campaign brief to mine angles from yet.')
  const userMessage = buildUserMessage(context, count)
  const text = await callAI({
    system: MEGA_ANGLE_SYSTEM,
    messages: [{ role: 'user', content: userMessage }],
    maxTokens: Math.min(6000, Math.max(1200, count * 220)),
  })
  const angles = parseAngles(text)
  if (angles.length === 0) throw new Error('No angles could be mined from the AI response.')
  return angles
}
