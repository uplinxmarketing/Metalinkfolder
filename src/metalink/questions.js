export const INDUSTRY_OPTIONS = [
  'E-commerce / DTC', 'SaaS / Tech', 'Coaching / Consulting',
  'Local Service Business', 'Real Estate', 'Health / Wellness / Fitness',
  'Beauty / Skincare', 'Finance / Insurance', 'Education / Courses',
  'Home Services', 'Professional Services', 'Nonprofit', 'Other',
]

export const CTA_OPTIONS = [
  'Book a call', 'Shop Now', 'Learn More', 'Sign Up',
  'Send Message', 'Download', 'Get Quote',
]

export const AD_BUDGET_OPTIONS = [
  'Under $1,000/mo', '$1,000 - $5,000/mo', '$5,000 - $15,000/mo',
  '$15,000 - $50,000/mo', '$50,000+/mo',
]

export const BRAND_TONE_OPTIONS = [
  'Bold', 'Playful', 'Premium', 'Minimal', 'Corporate',
  'Edgy', 'Warm', 'Direct', 'Luxury', 'Friendly', 'Urgent', 'Trustworthy',
]

export const BRAND_COLORS = [
  '#1A1A1F', '#FFFFFF', '#3A5AFB', '#E7A33E', '#F43F5E', '#8B5CF6',
  '#10B981', '#EC4899', '#F97316', '#06B6D4', '#6366F1', '#1E293B',
]

// Sections order: business -> audience -> offer -> proof -> brand
// 18 question screens total, comfortably over the 15-question minimum,
// plus one required file upload (PDF / Word / image).
export const QUESTIONS = [
  // BUSINESS
  {
    id: 'businessName',
    section: 'business',
    label: "What's the business or brand name?",
    type: 'text',
    placeholder: 'e.g. Northline Supplements',
  },
  {
    id: 'website',
    section: 'business',
    label: 'Website or Meta page URL?',
    type: 'text',
    placeholder: 'https://...',
    optional: true,
  },
  {
    id: 'industry',
    section: 'business',
    label: 'Which industry fits best?',
    type: 'single',
    options: INDUSTRY_OPTIONS,
  },
  {
    id: 'productDescription',
    section: 'business',
    label: 'What do you sell, and what problem does it solve?',
    type: 'textarea',
    placeholder: 'Describe the product or service, and the specific problem it solves for the buyer.',
  },

  // AUDIENCE
  {
    id: 'targetAudience',
    section: 'audience',
    label: 'Who is the dream customer?',
    type: 'textarea',
    placeholder: 'Age, role, situation, where they hang out. Be specific: "new moms, 28-38, first apartment, budget-conscious."',
  },
  {
    id: 'painPoints',
    section: 'audience',
    label: 'Their biggest pain points or frustrations?',
    type: 'textarea',
    placeholder: 'What do they complain about? What keeps them up at night?',
  },
  {
    id: 'competitors',
    section: 'audience',
    label: 'Any competitors running ads you admire (or want to beat)?',
    type: 'text',
    placeholder: 'Names or links',
    optional: true,
  },

  // OFFER
  {
    id: 'transformation',
    section: 'offer',
    label: 'What is the transformation? Use a real number.',
    type: 'textarea',
    placeholder: 'e.g. "From 3 leads a month to 20", "Lose 15lbs in 8 weeks"',
  },
  {
    id: 'differentiator',
    section: 'offer',
    label: 'What makes you different from every other option, including doing nothing?',
    type: 'textarea',
    placeholder: 'Your unique promise. Why this over any competitor.',
  },
  {
    id: 'priceOffer',
    section: 'offer',
    label: 'Price / offer structure?',
    type: 'text',
    placeholder: 'e.g. $97 one-time, $500/mo, 3-month minimum',
  },
  {
    id: 'dealValue',
    section: 'offer',
    label: 'Average order value or deal size?',
    type: 'text',
    placeholder: 'e.g. $85 AOV, $3,000 average deal',
    optional: true,
  },

  // PROOF
  {
    id: 'socialProof',
    section: 'proof',
    label: 'Any real numbers, reviews, or case studies to lean on?',
    type: 'textarea',
    placeholder: 'Real results, testimonial quotes, review counts, media mentions',
    optional: true,
  },
  {
    id: 'mainObjection',
    section: 'proof',
    label: 'What is the #1 reason people hesitate or say no?',
    type: 'text',
    placeholder: 'e.g. "I tried something like this before and it didn\'t work"',
  },
  {
    id: 'cta',
    section: 'proof',
    label: 'What should the ad push people to do?',
    type: 'single',
    options: CTA_OPTIONS,
  },
  {
    id: 'adBudget',
    section: 'proof',
    label: 'Monthly ad budget range?',
    type: 'single',
    options: AD_BUDGET_OPTIONS,
  },

  // BRAND
  {
    id: 'brandTone',
    section: 'brand',
    label: 'How should the ads sound? Pick all that fit.',
    type: 'multi',
    options: BRAND_TONE_OPTIONS,
  },
  {
    id: 'brandColors',
    section: 'brand',
    label: 'Brand colors?',
    type: 'colors',
    options: BRAND_COLORS,
    optional: true,
  },
  {
    id: 'brandFiles',
    section: 'brand',
    label: 'Upload a brand deck, product photos, or reference — PDF, Word, or image.',
    type: 'files',
    accept: 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,image/webp',
    maxFiles: 8,
    maxSizeMB: 10,
    required: true,
    helpText: 'At least one file is required — brand guide, past creative, product shots, or anything that shows what you sell.',
  },
]

export const SECTION_META = {
  business: { icon: '◎', name: 'The Business', color: '#3A5AFB' },
  audience: { icon: '◆', name: 'The Audience', color: '#262F46' },
  offer: { icon: '✦', name: 'The Offer', color: '#A07E3A' },
  proof: { icon: '✓', name: 'Proof & Objections', color: '#2D7A4F' },
  brand: { icon: '◐', name: 'Brand Assets', color: '#B9342F' },
}

export const SECTIONS_ORDER = ['business', 'audience', 'offer', 'proof', 'brand']
