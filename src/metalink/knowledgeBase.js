// Single source of truth for the agency's ad-copywriting playbook. Both the
// strategy chat (chatAgent.js) and the ad writer (adAgent.js) import this
// instead of each concatenating their own copy of the same modules.
import { SKILLS_PLAYBOOK } from './skillsPlaybook.js'
import { PREMIUM_PRICING_PLAYBOOK } from './premiumPricingPlaybook.js'
import { AUDIENCE_TRUST_PLAYBOOK } from './audienceTrustPlaybook.js'
import { COPY_STRUCTURES_PLAYBOOK } from './copyStructures.js'
import { DIRECT_RESPONSE_MASTERCLASS } from './directResponseMasterclass.js'
import { HEADLINE_FORMULAS_PLAYBOOK } from './headlineFormulas.js'
import { VALUE_EQUATION_PLAYBOOK } from './valueEquationPlaybook.js'
import { SELLING_SYSTEM_PLAYBOOK } from './sellingSystemPlaybook.js'
import { BANNED_PATTERNS } from '../ai/writingRules.js'

export const CORE_PLAYBOOK = `${BANNED_PATTERNS}

${SKILLS_PLAYBOOK}

${PREMIUM_PRICING_PLAYBOOK}

${AUDIENCE_TRUST_PLAYBOOK}

${COPY_STRUCTURES_PLAYBOOK}

${DIRECT_RESPONSE_MASTERCLASS}

${HEADLINE_FORMULAS_PLAYBOOK}

${VALUE_EQUATION_PLAYBOOK}

${SELLING_SYSTEM_PLAYBOOK}`
