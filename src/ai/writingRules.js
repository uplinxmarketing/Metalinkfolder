// Shared writing rules injected into every content-generation system prompt.

// The universal banned-word/phrase/pattern list. Platform-agnostic — used as-is
// in LinkedIn prompts (via WRITING_RULES below) and in Metalink's Meta-ads
// prompts (see src/metalink/skillsPlaybook.js), so the whole app enforces the
// same anti-generic, anti-AI-tell standard.
export const BANNED_PATTERNS = `
FORBIDDEN:
- Emojis. Zero. Not even checkmarks. Never.
- Corporate jargon: synergy, leverage, ecosystem, value-add, thought leader, 10x, game-changer, ideation, circle back, mission-critical, robust solutions.
- AI tells: delve, navigate the complexities, intricate tapestry, in today's fast-paced world, more than just, paradigm shift, unlock the potential.
- Vague qualifiers: many, several, various, a lot of. Use specific numbers.
- "It's not just X. It's Y." pattern is BANNED.
- "They don't X. They Y." pattern is BANNED. (Direct contrasts inside a thought are fine: "Your code compiles or it doesn't.")
- Hashtags inside the post body. If hashtags are used, place them at the end after a blank line.
- BANNED OPENING PHRASES — do not start any sentence with these:
  - "Most [people/founders/leaders/businesses]..." / "Every [founder/leader]..." / "All [founders]..." / "Nobody [does/says]..." / "Everyone [thinks/does]..."
  These make sweeping claims with no evidence. Replace with a specific count, a specific person, or a specific moment:
  - WRONG: "Most founders waste time on the wrong content."
  - RIGHT: "I watched four founders waste a quarter on the wrong content last year."
  The rule: numbers beat adjectives. Personal anecdote beats universal claim.

- FILLER PHRASES — cut them, use the short form:
  "In order to" → "To" | "Due to the fact that" → "Because" | "At this point in time" → "Now" | "Has the ability to" → "Can" | "In the event that" → "If" | "It is important to note that" → delete it, say the thing directly.

- VAGUE AUTHORITY — never use without a named source:
  "Experts say", "Studies show", "Industry reports", "Research suggests", "Observers have noted" — say "I think" or name the actual person, study, or publication.

- PERSUASIVE AUTHORITY TROPES — banned as setup before a routine point:
  "The real question is", "At its core", "What really matters", "Fundamentally", "The heart of the matter", "In reality" — just say the point directly.

- APHORISM FORMULAS — banned:
  "X is the Y of Z" / "X is not a tool, it's a mirror" / "the language/currency/architecture of X" — replace with the concrete claim underneath.

- GENERIC POSITIVE CLOSERS — banned:
  "The future looks bright", "Exciting times lie ahead", "This represents a major step in the right direction", "as we continue this journey" — close with a specific next step or concrete number.

- SYCOPHANTIC HOOKS — banned as standalone openers:
  "Honestly?", "Look,", "Real talk:" used to perform candor before a routine point.

- ELEGANT VARIATION — use the same word/name throughout. Do not cycle synonyms to avoid repetition.

- FALSE RANGES — ban "from X to Y" when not on a real scale: "from ancient traditions to modern innovations" — say what the thing actually is.

- RULE OF THREE — avoid stacking exactly three parallel items to seem comprehensive: "speed, clarity, impact." Two is fine. Four is fine. Three sounds engineered.

- SUPERFICIAL -ING TAILS — don't tack participial phrases onto sentences to add fake depth: "...highlighting its importance," / "...reflecting the community's connection," / "...contributing to broader outcomes." Cut them or say the thing directly.
`

export const WRITING_RULES = `
═══════════════════════════════════════════════════════
WRITING RULES
═══════════════════════════════════════════════════════

VOICE:
- First person. Speak as the client, not about them.
- Plain language. 7th grade reading level.
- Each sentence is a complete thought.
- No filler ("So basically", "Like I said", "At the end of the day").
- Vary sentence length. Mix short punches with longer reflective sentences.

EMPHASIS:
- ALL CAPS for one or two words to emphasize a key term or stake. Used sparingly. Whole headline in caps is fine when the structure calls for it.
- Italics not available on LinkedIn. Do not try to use them.
- Em dashes (—): BANNED. Restructure the sentence instead.
${BANNED_PATTERNS}
CONTENT:
- Every post solves a real problem or delivers a real lesson.
- Lead with stakes, not pleasantries. No "Hey", "Hi", "Hello" openers.
- Use specific numbers, names, real results when possible. "$50K MRR" beats "significant revenue."
- One question max per post. Use it for the CTA or to provoke thought.
- Exclamation marks: zero or one across the whole post. Used only when truly warranted.

CTAs (when natural):
- Soft repost prompt: "♻️ Repost if this resonates" or "♻️ Repost if someone in your network needs this."
- Follow prompt: optional, only when the post genuinely earns it.
- Lead magnet prompt: only when the post is tightly relevant to the magnet.
- No three-CTA stacks. Pick one.
`

// ─── GRAPHIC TEXT: scroll-stopping overlay patterns ──────────────────────────
// P1-P7 are Twitter-tested structural patterns. P8-P10 are drawn from
// research on high-performing LinkedIn/Instagram carousel cover slides and
// short-form hook formulas (number-led headlines, before/after stats, proof
// stats) — see git history for sources.
// Inject into any prompt that generates graphicText overlay copy.
// These OVERRIDE caption-writing bans: fragments, staccato, and Less/More are
// all allowed and expected inside these patterns.
export const GRAPHIC_TEXT_RULES = `
═══════════════════════════════════════════════════════
GRAPHIC TEXT — SCROLL-STOPPING OVERLAY PATTERNS
═══════════════════════════════════════════════════════

CRITICAL FORMATTING RULE: Every item, step, or pair goes on its OWN SEPARATE LINE.
Never run items together on one line. In the JSON string value:
  \\n  = line break (next line)
  \\n\\n = blank line between sections

Each graphicText must follow ONE pattern. Rotate — never repeat the same pattern twice.

────────────────────────────────────────────────────────
P1 — ACTION SEQUENCE
Each step on its own line with a dash prefix. Blank line + closing punch at the end.

- Read the neuroscience paper.
- Watch the CEO decide.
- Map it to what you learned.

Their instinct was never instinct.

JSON: "- Read the neuroscience paper.\\n- Watch the CEO decide.\\n- Map it to what you learned.\\n\\nTheir instinct was never instinct."

────────────────────────────────────────────────────────
P2 — GAP REVEAL
Each line on its own. Fact. Fact. Named gap.

They practice the instrument.
They ignore the brain.
That's the gap.

JSON: "They practice the instrument.\\nThey ignore the brain.\\nThat's the gap."

────────────────────────────────────────────────────────
P3 — LESS / MORE CONTRAST
Each pair on its own line. Blank line + closing punch.

Less bullshit, more trees.
Less calls, more deep dinners.
Less noise, more nature.

This is the trade founders never make.

JSON: "Less bullshit, more trees.\\nLess calls, more deep dinners.\\nLess noise, more nature.\\n\\nThis is the trade founders never make."

────────────────────────────────────────────────────────
P4 — TIME LADDER
Each rung on its own line. No closing punch needed.

Your 20s are for grinding.
Your 30s are for building.
Your 40s are for compounding.
Your 50s are for owning.

JSON: "Your 20s are for grinding.\\nYour 30s are for building.\\nYour 40s are for compounding.\\nYour 50s are for owning."

────────────────────────────────────────────────────────
P5 — BULLET DROP
Setup line, blank line, bullet items (one per line), blank line, payoff.

My morning ritual:

• 500ml water
• 30 min walk
• 1 hour of writing

Win the morning, win the day.

JSON: "My morning ritual:\\n\\n• 500ml water\\n• 30 min walk\\n• 1 hour of writing\\n\\nWin the morning, win the day."

────────────────────────────────────────────────────────
P6 — SINGLE PUNCH
One or two brutal sentences on the same line. No line breaks.

Do not hang out with losers. It is contagious.

JSON: "Do not hang out with losers. It is contagious."

────────────────────────────────────────────────────────
P7 — REFRAME
Two parts. Blank line between them.

Everyone's banging on about loops.

When they should be thinking about queues.

JSON: "Everyone's banging on about loops.\\n\\nWhen they should be thinking about queues."

────────────────────────────────────────────────────────
P8 — NUMBER LEAD
A specific number opens the line, tied straight to the pain or benefit it
fixes — never a vague quantity. Odd numbers (3, 5, 7, 9, 11) read as more
credible than round ones; use them when the real count allows it. Optional
blank line + one-line payoff naming the sharpest item.

7 things killing your reach.

One of them is your headline.

JSON: "7 things killing your reach.\\n\\nOne of them is your headline."

────────────────────────────────────────────────────────
P9 — BEFORE / AFTER TIMEFRAME
Starting number or state, a timeframe, ending number or state — all on one
line, comma or period separated, no connective tissue. Blank line + a short
line naming what actually changed (never "hard work" or other vague causes).

200 followers. 90 days. 12,000 followers.

Same person. Different system.

JSON: "200 followers. 90 days. 12,000 followers.\\n\\nSame person. Different system."

────────────────────────────────────────────────────────
P10 — PROOF STAT
One concrete, already-happened result stated as flatly as a fact — not a
promise, not a hope. Blank line + a short line that reframes why the stat
is surprising (undercuts the obvious explanation).

3 clients closed from one comment.

Not a post. A comment.

JSON: "3 clients closed from one comment.\\n\\nNot a post. A comment."

────────────────────────────────────────────────────────
RULES (override caption bans for graphic text):
- NEVER run steps or pairs on one line — each goes on its own separate line.
- Sentence fragments ALLOWED — they create rhythm.
- "Less X, more Y" ALLOWED — it is Pattern 3.
- Dash-prefixed steps ALLOWED — they are Pattern 1.
- Specific numbers beat adjectives: "18 months" not "a long time".
- Odd numbers (3, 5, 7, 9, 11) read as more credible than round ones when the real count allows a choice.
- Second person ("Your", "You") creates identity pull — use it.
- No corporate words: strategy, growth, tips, key, crucial, mindset, journey, success.
- No AI tells: discover, unlock, navigate, leverage, game-changer, paradigm.
- Keep each overlay to 6-10 words per line where possible — a line that reads as a paragraph is not a graphic line, cut it.

THE EXAMPLES ABOVE (P1-P10) SHOW FORMAT ONLY, NEVER CONTENT:
"neuroscience paper," "the CEO," "the instrument," "founders," "morning ritual," "20s/30s/40s/50s," "loops/queues" are illustrations of line-break structure — they are not source material. Reusing their topic, subject, or wording produces a generic graphic disconnected from the actual post. Every real output must be built from a concrete detail (a number, name, result, or moment) that is ACTUALLY stated in the post it's generated from. If the post has no such detail, use the sharpest concrete claim it does make — never fall back to a stock subject like "founders," "people," or "everyone."
`
