import { generateAds } from './adAgent.js'
import { callAI } from './aiClient.js'
import { generateImage } from './imageClient.js'

// Metalink's multi-agent campaign pipeline. One click runs the full chain:
//
//   1. Copywriter agent  (generateAds)      -> writes the ad copy per angle
//   2. Art director agent (writeImagePrompts)-> turns each ad into a visual concept
//   3. Image agent        (generateImage)    -> renders each concept via HF FLUX
//
// Every stage degrades gracefully: if the art director or image step fails
// (e.g. the HF token isn't set yet, or the free tier is rate-limited), the ads
// still come back with their copy — the image slot just shows a retry.

const ART_DIRECTOR_SYSTEM = `You are the art director for a Meta (Facebook/Instagram) ad agency. For each ad, you write ONE image-generation prompt for a text-to-image model (FLUX / Stable Diffusion) that produces a scroll-stopping ad creative.

RULES FOR EVERY PROMPT:
- Describe a single, striking visual scene that matches the ad's angle and emotion. Photographic or clean editorial illustration.
- Do NOT rely on the model rendering words or logos — these models render text badly. Describe the scene, subject, lighting, mood, composition, and color palette instead. Leave clean negative space where a headline could later be overlaid by a human.
- Be concrete and specific: subject, setting, camera angle, lighting, style, mood, color. 30-60 words.
- Match the product/service and audience. No generic stock-photo clichés (no "diverse team high-fiving", no "lightbulb ideas").
- Commercial, premium, high-conversion aesthetic. Think top-tier DTC brand.

OUTPUT FORMAT — exactly one line per ad, no extra text:
IMG_1: [prompt]
IMG_2: [prompt]
(continue for every ad, in order)`

function fallbackPrompt(ad) {
  const subject = ad.angle || 'premium product'
  return `High-end commercial photograph representing "${subject}", cinematic soft lighting, shallow depth of field, clean minimal composition with negative space, premium modern color palette, editorial advertising style, ultra sharp, high detail`
}

async function writeImagePrompts(ads, source) {
  const list = ads.map((ad, i) =>
    `AD_${i + 1} — Angle: ${ad.angle}\nHeadline: ${ad.headline}\nPrimary (excerpt): ${(ad.primaryText || '').slice(0, 300)}\nCreative brief: ${ad.creativeBrief || 'n/a'}`
  ).join('\n\n')

  const userMessage = `PRODUCT / CLIENT CONTEXT:\n${String(source || '').slice(0, 3000)}\n\n---\n\nWrite one image prompt for each of the ${ads.length} ads below.\n\n${list}`

  const text = await callAI({
    system: ART_DIRECTOR_SYSTEM,
    messages: [{ role: 'user', content: userMessage }],
    maxTokens: Math.min(4000, Math.max(600, ads.length * 120)),
  })

  // Parse "IMG_n: ..." lines back into an ordered array.
  const prompts = new Array(ads.length).fill('')
  const re = /IMG_(\d+):\s*(.+)/g
  let m
  while ((m = re.exec(text)) !== null) {
    const idx = Number(m[1]) - 1
    if (idx >= 0 && idx < ads.length) prompts[idx] = m[2].trim()
  }
  return prompts.map((p, i) => p || fallbackPrompt(ads[i]))
}

// Runs the image agent over every ad, sequentially (HF's free tier is
// rate-limited, so we avoid hammering it in parallel). Mutates each ad with
// imageUrl on success or imageError on failure. Never throws.
async function renderCreatives(ads, onProgress) {
  for (let i = 0; i < ads.length; i++) {
    onProgress?.(`Rendering creative ${i + 1} of ${ads.length}...`)
    try {
      ads[i].imageUrl = await generateImage(ads[i].imagePrompt)
      ads[i].imageError = ''
    } catch (e) {
      ads[i].imageError = e?.message || 'Image generation failed.'
    }
  }
  return ads
}

// Full one-click campaign: copy + visuals for every angle.
export async function generateCampaign({ source, angles, onProgress, withImages = true }) {
  const ads = await generateAds({ source, angles, onProgress })

  if (!withImages) return ads

  onProgress?.('Art director: designing the visuals...')
  let prompts
  try {
    prompts = await writeImagePrompts(ads, source)
  } catch {
    prompts = ads.map(fallbackPrompt)
  }
  ads.forEach((ad, i) => { ad.imagePrompt = prompts[i] })

  await renderCreatives(ads, onProgress)
  return ads
}

// Regenerate a single ad's creative (used by the "Regenerate" button). Returns
// the new image URL or throws so the caller can surface the error.
export async function regenerateCreative(ad, source) {
  let prompt = ad.imagePrompt
  if (!prompt) {
    try {
      const [p] = await writeImagePrompts([ad], source)
      prompt = p
    } catch {
      prompt = fallbackPrompt(ad)
    }
  }
  return generateImage(prompt)
}
