// Condensed media-buying / campaign-setup operating rules — covers what
// Metalink never covered before: campaign objective selection, GEO
// targeting, audience/lookalike strategy, budget and the learning phase,
// creative format tradeoffs, retargeting segmentation, and A/B discipline.
// Feeds the strategy chat only (expandBrief/sendChatMessage) — the ad
// copywriter (adAgent.js) doesn't need CPM/targeting mechanics since none
// of it changes primary text, headline, or description.
export const MEDIA_BUYING_PLAYBOOK = `MEDIA BUYING & CAMPAIGN SETUP PLAYBOOK (agency operating rules):

CPM AND CAMPAIGN OBJECTIVE:
- Awareness/Reach objectives run the lowest CPM because Meta shows the ad broadly regardless of action likelihood.
- Engagement, Traffic, and Lead objectives run mid-range CPM — Meta narrows delivery toward people who take that specific action.
- Conversion/Sales objectives run the highest CPM because Meta narrows delivery to the smallest, most qualified slice of the audience.
- Match the objective to the actual money action. Using Traffic or Engagement as a cheap proxy for a Sales goal wastes spend on people unlikely to buy — pick the objective that maps directly to the real conversion (Sales for purchases, Leads for lead-gen).

LOWERING CPM THROUGH GEO EXPANSION:
- US/Canada-only targeting is the most expensive way to buy reach.
- If the offer isn't geographically restricted, expanding to other English-speaking, high-converting markets (UK, Australia, New Zealand) plus large European/LatAm markets (Germany, France, Italy, Spain, Brazil) widens the auction pool and drives CPM down without necessarily hurting conversion quality — recommend this whenever fulfillment isn't US-only.
- Always restrict expanded GEO to English-language accounts unless the client can actually serve/convert in the local language.
- Broader GEO can lower CTR (larger, less-primed pool) while still lowering overall CPA thanks to the CPM drop and added volume — that's an expected tradeoff, not a red flag.

AUDIENCE STRATEGY:
- First-party data is the strongest signal: upload the client's existing customer/lead list as a custom audience, then build a lookalike (0-3% for a tight match, up to 10% to widen reach).
- Layer in specific interests and job titles rather than leaving targeting fully automated — more relevant signal helps Meta find similar accounts, and stacking several relevant interests/job titles still nets a broader, lower-CPM audience than one narrow interest alone.
- For B2B offers, seed audiences from firmographic data where available (industry, job title/seniority, company size/revenue).
- Exclude Meta's Audience Network placement for performance campaigns — it reliably drags down conversion quality relative to Facebook/Instagram feed and story placements.

BUDGET AND THE LEARNING PHASE:
- Meta's delivery algorithm needs roughly 50 conversion events within about a 7-day window (ideally the first 24-48 hours) to exit the learning phase and stabilize delivery. Under-spending during this window prolongs an inefficient, expensive phase — it doesn't save money.
- Front-load budget early in a new campaign or major edit so the algorithm reaches that threshold fast, rather than trickling spend out over weeks.
- Avoid major campaign-setting edits once a campaign is mid-learning-phase — edits reset the clock.
- A CPA running roughly 50-60% above the target acquisition cost in the first stretch is normal and typically settles 40-60% lower once the campaign clears the learning phase — that's the signal to keep spending, not pull back.
- If a campaign shows no early traction after a meaningful number of impressions, killing it and testing a new variable (creative, audience, objective, or GEO) is more efficient than continuing to feed it.

CREATIVE FORMAT AND CTR:
- Average Meta ad CTR runs under 1%. Treat any format/hook combination performing near or below that as underperforming, not "normal."
- Video consistently outperforms static images on CTR and unlocks retargeting static can't: a "watched 25%+" audience for warm retargeting, and a "watched 80%+" audience as a stronger high-intent segment.
- Default to video for cold-traffic angles unless a specific angle (a single powerful before/after image, a screenshot-driven proof angle) is genuinely better served by static or carousel.
- Test hook/opening variations across multiple ads within the same ad set rather than running near-identical ads across separate ad sets targeting the same audience — separate ad sets on the same audience make a client's own ads compete against each other and raise CPM.

RETARGETING SEGMENTATION:
- Segment retargeting by intent, don't lump everyone into one audience: site visitors (light intent), engaged social users who clicked/watched significantly but didn't visit the site, cart/form abandoners (highest intent), and lookalikes of converters.
- Match message intensity to intent: cart/checkout abandoners get a direct, specific nudge naming what they left plus a real reason to finish; light-touch visitors get a softer reminder or a different angle entirely, not the same ad repeated.
- Cap retargeting frequency around 3-5x per week per person — more reads as stalking and burns budget on diminishing returns.

A/B TESTING DISCIPLINE:
- Change one variable at a time (headline, image/video, audience, or CTA) — changing several at once makes it impossible to attribute the result to any one change.
- Give a test 7-14 days and a real sample size before calling a winner.

LANDING PAGE FIT:
- The ad's promise and the landing page's headline/offer must match exactly — mismatched messaging between ad and page is one of the most common causes of drop-off after the click.
- Headline and primary CTA must be visible above the fold on mobile with no scrolling, since most Meta traffic is mobile.
- Page load speed and a frictionless path to the conversion action matter as much as the copy on the page.`
