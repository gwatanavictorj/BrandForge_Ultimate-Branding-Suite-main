/**
 * Strategic Data Constants
 * 
 * Central source of truth for all brand strategy related data models,
 * archetype definitions, color psychologies, and industry templates.
 */

// ─── ARCHETYPE INTERFACES ──────────────────────────────────────────

export interface ArchetypeData {
  name: string;
  group: 'Spirituality' | 'Legacy' | 'Connection' | 'Structure';
  innerNeed: string;
  description: string;
  jungianModel: string;
  goal: string;
  fear: string;
  weakness: string;
  talent: string;
  traits: string[];
  inPractice: { label: string; content: string }[];
  keywords: string[]; // Standard traits
  identityMarkers: string[]; // High-potency Jungian signals
}

// ─── ARCHETYPE DATABASE ───────────────────────────────────────────

export const STRATEGIC_WEIGHTS = {
  MISSION_VISION: 3.0,
  STRATEGIC_GAP: 2.5,
  CORE_VALUES: 2.0,
  BRAND_FEEL: 1.0
};

export const ARCHETYPES: ArchetypeData[] = [
  {
    name: 'Creator',
    group: 'Structure',
    innerNeed: 'Innovation',
    description: 'The Creator archetype is driven by a desire to produce something of enduring value. They believe that if it can be imagined, it can be made.',
    jungianModel: 'Innovation & Structure: The Creator represents the archetypal artist — the drive to express vision and bring new things into existence.',
    goal: 'To create things of enduring value and realize a unique vision.',
    fear: 'Being mediocre or having a vision that fails to materialize.',
    weakness: 'Perfectionism and creating impractical solutions.',
    talent: 'Creativity, imagination, and the ability to turn concepts into reality.',
    traits: ['Innovative', 'Imaginative', 'Expressive', 'Original', 'Visionary'],
    inPractice: [
      { label: 'Innovation', content: 'Constantly push boundaries and create original solutions.' },
      { label: 'Quality', content: 'Focus on superior craft and enduring value.' }
    ],
    keywords: ['innovation', 'creative', 'expressive', 'design', 'art', 'build', 'craft', 'original', 'technology', 'software', 'architect', 'modular'],
    identityMarkers: ['invention', 'imagination', 'visionary', 'artistic', 'prototype', 'creator', 'masterpiece', 'blueprint', 'sculpt']
  },
  {
    name: 'Caregiver',
    group: 'Structure',
    innerNeed: 'Service',
    description: 'The Caregiver archetype is motivated by generosity and a desire to protect and care for others.',
    jungianModel: 'Service & Structure: The Caregiver embodies the nurturing parent — selfless, compassionate, and devoted to well-being.',
    goal: 'To connect with others and provide support through genuine service.',
    fear: 'Being isolated or unable to help those in need.',
    weakness: 'Self-sacrifice to the point of burnout or losing individuality.',
    talent: 'Compassion, generosity, and strong interpersonal skills.',
    traits: ['Compassionate', 'Nurturing', 'Generous', 'Supportive', 'Trustworthy'],
    inPractice: [
      { label: 'Support', content: 'Provide unwavering care and protection for the audience.' },
      { label: 'Empathy', content: 'Listen deeply and respond with genuine warmth.' }
    ],
    keywords: ['service', 'care', 'health', 'support', 'nurture', 'protect', 'safe', 'medical', 'wellness', 'help', 'comfort', 'hospitality', 'foundation'],
    identityMarkers: ['altruism', 'generosity', 'protection', 'parental', 'devoted', 'empathy', 'well-being', 'sanctuary', 'guardian']
  },
  {
    name: 'Ruler',
    group: 'Structure',
    innerNeed: 'Control',
    description: 'The Ruler archetype seeks to create order and structure. They lead with authority, responsibility, and a desire for lasting impact.',
    jungianModel: 'Control & Structure: The Ruler represents the sovereign — the drive for stability and leadership that creates order.',
    goal: 'To create a prosperous, successful family or community.',
    fear: 'Chaos; being overthrown or losing control.',
    weakness: 'Authoritarianism; unable to delegate.',
    talent: 'Responsibility, leadership, and organization.',
    traits: ['Authoritative', 'Commanding', 'Refined', 'Decisive', 'Responsible'],
    inPractice: [
      { label: 'Leadership', content: 'Lead with authority and create clear structure.' },
      { label: 'Excellence', content: 'Maintain the highest standards of quality and conduct.' }
    ],
    keywords: ['control', 'luxury', 'premium', 'prestige', 'leader', 'authority', 'exclusive', 'elite', 'royal', 'heritage', 'legacy', 'governance', 'stability'],
    identityMarkers: ['sovereign', 'dominance', 'empire', 'stability', 'organization', 'leadership', 'power', 'prestige', 'throne']
  },
  {
    name: 'Hero',
    group: 'Legacy',
    innerNeed: 'Mastery',
    description: 'The Hero archetype is driven to prove their worth through courageous action and determination.',
    jungianModel: 'Mastery & Legacy: The Hero represents the warrior — the inner drive to rise, compete, and triumph against adversity.',
    goal: 'To improve the world through courageous acts.',
    fear: 'Being perceived as weak, vulnerable, or a "chicken".',
    weakness: 'Arrogance; always needing a battle to fight.',
    talent: 'Competence and courage.',
    traits: ['Bold', 'Courageous', 'Determined', 'Inspiring', 'Competitive'],
    inPractice: [
      { label: 'Mastery', content: 'Excel through discipline and determined effort.' },
      { label: 'Inspiration', content: 'Inspire others through bold, courageous action.' }
    ],
    keywords: ['mastery', 'bold', 'impact', 'performance', 'strong', 'fast', 'efficient', 'achieve', 'sports', 'fitness', 'empower', 'resilient', 'brave'],
    identityMarkers: ['warrior', 'triumph', 'strength', 'discipline', 'heroic', 'combat', 'victory', 'olympian', 'valiance']
  },
  {
    name: 'Explorer',
    group: 'Spirituality',
    innerNeed: 'Freedom',
    description: 'The Explorer archetype yearns for discovery, freedom, and the thrill of new experiences.',
    jungianModel: 'Freedom & Spirituality: The Explorer embodies the wanderer — the search for authenticity and meaning through discovery.',
    goal: 'To experience a better, more authentic, more fulfilling life.',
    fear: 'Getting trapped, conformity, and inner emptiness.',
    weakness: 'Aimless wandering, becoming a misfit.',
    talent: 'Autonomy, ambition, and being true to one\'s soul.',
    traits: ['Adventurous', 'Independent', 'Ambitious', 'Pioneering', 'Authentic'],
    inPractice: [
      { label: 'Discovery', content: 'Seek new horizons and authentic experiences.' },
      { label: 'Freedom', content: 'Encourage independence and self-discovery.' }
    ],
    keywords: ['freedom', 'travel', 'adventure', 'explore', 'discover', 'journey', 'outdoor', 'experience', 'tourism', 'frontier', 'pioneer'],
    identityMarkers: ['wanderer', 'discovery', 'authenticity', 'pioneer', 'unbound', 'destination', 'remote', 'pilgrimage', 'horizon']
  },
  {
    name: 'Sage',
    group: 'Spirituality',
    innerNeed: 'Understanding',
    description: 'The Sage archetype seeks truth, knowledge, and understanding. They believe that wisdom is the path to true power.',
    jungianModel: 'Understanding & Spirituality: The Sage represents the wise mentor — the pursuit of truth and knowledge through analysis.',
    goal: 'To use intelligence and analysis to understand the world.',
    fear: 'Being duped, misled—or ignorance.',
    weakness: 'Can study matters forever and never act.',
    talent: 'Wisdom, intelligence, and analytical skills.',
    traits: ['Wise', 'Analytical', 'Knowledgeable', 'Thoughtful', 'Expert'],
    inPractice: [
      { label: 'Truth', content: 'Deliver deep insights grounded in truth and knowledge.' },
      { label: 'Mentorship', content: 'Guide others with wisdom and thoughtful analysis.' }
    ],
    keywords: ['understanding', 'consulting', 'education', 'knowledge', 'expert', 'research', 'data', 'analytics', 'wisdom', 'science', 'theory'],
    identityMarkers: ['mentor', 'truth', 'analysis', 'cognition', 'guru', 'scholar', 'philosophy', 'objective', 'oracle']
  },
  {
    name: 'Magician',
    group: 'Legacy',
    innerNeed: 'Power',
    description: 'The Magician archetype transforms visions into reality. They create extraordinary experiences that feel almost magical.',
    jungianModel: 'Power & Legacy: The Magician represents the shaman — the ability to transform consciousness and create new realities.',
    goal: 'To make dreams come true.',
    fear: 'Unintended negative consequences.',
    weakness: 'Becoming manipulative or using power for selfish gain.',
    talent: 'Finding win-win solutions; seeing things from far off.',
    traits: ['Visionary', 'Charismatic', 'Inventive', 'Transformational', 'Aspirational'],
    inPractice: [
      { label: 'Transformation', content: 'Create extraordinary changes that feel magical.' },
      { label: 'Vision', content: 'Transform ambitious visions into tangible reality.' }
    ],
    keywords: ['transformation', 'visionary', 'future', 'change', 'wonder', 'miracle', 'extraordinary', 'inspire', 'alchemy', 'tech', 'digital'],
    identityMarkers: ['shaman', 'alchemy', 'catalyst', 'extraordinary', 'transformation', 'metamorphosis', 'wonder', 'metempirical']
  },
  {
    name: 'Everyman',
    group: 'Connection',
    innerNeed: 'Belonging',
    description: 'The Everyman archetype believes in belonging, connection, and the dignity of every person.',
    jungianModel: 'Belonging & Connection: The Everyman represents the common person — the desire for equality and shared human experience.',
    goal: 'To belong; to be part of the community.',
    fear: 'To be left out or to stand out from the crowd.',
    weakness: 'Losing one\'s self in an effort to blend in or for the sake of a superficial connection.',
    talent: 'Realism, empathy, and lack of pretense.',
    traits: ['Relatable', 'Down-to-earth', 'Honest', 'Friendly', 'Genuine'],
    inPractice: [
      { label: 'Connection', content: 'Build genuine relationships based on shared experience.' },
      { label: 'Equality', content: 'Treat everyone with dignity and approachable honesty.' }
    ],
    keywords: ['belonging', 'connection', 'friendly', 'approachable', 'accessible', 'affordable', 'community', 'everyone', 'simple', 'honest', 'solidarity'],
    identityMarkers: ['neighbor', 'solidarity', 'belonging', 'democracy', 'realist', 'humility', 'inclusion', 'community']
  },
  {
    name: 'Lover',
    group: 'Connection',
    innerNeed: 'Intimacy',
    description: 'The Lover archetype is driven by passion, intimacy, and the pursuit of beauty and connection.',
    jungianModel: 'Intimacy & Connection: The Lover represents the passionate self — the pursuit of pleasure and aesthetic beauty.',
    goal: 'To be in a relationship with the people, work, and surroundings they love.',
    fear: 'Being alone, a wallflower, unwanted, unloved.',
    weakness: 'Desire to please others at the risk of losing own identity.',
    talent: 'Passion, gratitude, appreciation, and commitment.',
    traits: ['Passionate', 'Sensual', 'Warm', 'Intimate', 'Elegant'],
    inPractice: [
      { label: 'Intimacy', content: 'Foster deep, passionate connections through beauty.' },
      { label: 'Aesthetics', content: 'Pursue visual and experiential elegance in all things.' }
    ],
    keywords: ['intimacy', 'passion', 'beauty', 'fashion', 'style', 'elegant', 'romance', 'luxury', 'aesthetic', 'partnership'],
    identityMarkers: ['romance', 'seduction', 'beauty', 'passion', 'devotion', 'sensuality', 'elegance', 'intimacy']
  },
  {
    name: 'Jester',
    group: 'Connection',
    innerNeed: 'Enjoyment',
    description: 'The Jester archetype lives to enjoy the moment and lighten the world with humor and spontaneity.',
    jungianModel: 'Enjoyment & Connection: The Jester represents the trickster — the desire to live joyfully and bring laughter.',
    goal: 'To have a great time and lighten up the world.',
    fear: 'Being bored or boring others.',
    weakness: 'Frivolity, wasting time.',
    talent: 'Joy, humor, and spontaneous energy.',
    traits: ['Playful', 'Humorous', 'Energetic', 'Spontaneous', 'Entertaining'],
    inPractice: [
      { label: 'Joy', content: 'Bring laughter and delight to every interaction.' },
      { label: 'Presence', content: 'Live in the moment with irreverent, playful energy.' }
    ],
    keywords: ['enjoyment', 'playful', 'vibrant', 'fun', 'entertainment', 'media', 'gaming', 'social', 'lively', 'energetic', 'joy'],
    identityMarkers: ['trickster', 'joyous', 'laughter', 'irreverent', 'spontaneous', 'celebration', 'fun-loving', 'carnival']
  },
  {
    name: 'Innocent',
    group: 'Spirituality',
    innerNeed: 'Safety',
    description: 'The Innocent archetype seeks happiness, goodness, and simplicity. They want to do things the right way.',
    jungianModel: 'Safety & Spirituality: The Innocent represents the child — the belief in goodness, optimism, and a better world.',
    goal: 'To be happy.',
    fear: 'To be punished for doing something bad or wrong.',
    weakness: 'Boring for all their naive innocence.',
    talent: 'Faith and optimism.',
    traits: ['Optimistic', 'Simple', 'Honest', 'Humble', 'Trustworthy'],
    inPractice: [
      { label: 'Safety', content: 'Create a sense of security through honest simplicity.' },
      { label: 'Goodness', content: 'Promote optimism and a wholesome vision of the future.' }
    ],
    keywords: ['safety', 'goodness', 'simple', 'trust', 'honest', 'purity', 'nature', 'wholesome', 'optimism', 'joy'],
    identityMarkers: ['child', 'purity', 'optimism', 'simplicity', 'wholesome', 'goodness', 'safety', 'eden']
  },
  {
    name: 'Outlaw',
    group: 'Legacy',
    innerNeed: 'Liberation',
    description: 'The Outlaw archetype (or Rebel) seeks to disrupt the status quo and liberate themselves or others from constraints.',
    jungianModel: 'Liberation & Legacy: The Outlaw represents the disruptor — the drive to break rules and enact revolutionary change.',
    goal: 'To overturn what is not working.',
    fear: 'Being powerless or ineffectual.',
    weakness: 'Crossing over to the dark side, crime.',
    talent: 'Outrageousness, radical freedom.',
    traits: ['Rebellious', 'Disruptive', 'Bold', 'Authentic', 'Raw'],
    inPractice: [
      { label: 'Liberation', content: 'Challenge the status quo and break restrictive rules.' },
      { label: 'Disruption', content: 'Lead with bold, raw, and authentic revolutionary change.' }
    ],
    keywords: ['rebel', 'disrupt', 'revolution', 'freedom', 'bold', 'raw', 'authentic', 'break', 'rules', 'alternative'],
    identityMarkers: ['rebel', 'revolutionary', 'iconoclast', 'disruptor', 'radical', 'liberation', 'dark-horse', 'misfit']
  }
];

// ─── OFFICIAL STRATEGIC CATEGORIES ────────────────────────────────

export const INDUSTRIES = [
  "Technology / Software", "Fintech / Financial Services", "Healthcare / Medical", 
  "Education / EdTech", "Real Estate / Property", "Architecture, Engineering, and Construction",
  "Travel & Tourism", "E-commerce / Retail", "Logistics / Transportation", 
  "Agriculture / Agritech", "Media / Entertainment", "Marketing / Advertising", 
  "Consulting / Professional Services", "Energy / Utilities", "Manufacturing / Industrial", 
  "Non-profit / NGO", "Government / Public Sector", "Hospitality / Food Services", 
  "Fashion / Apparel", "Sports / Fitness", "Other"
];

export const STAGES = ["Idea stage", "MVP / Early stage", "Growing", "Established", "Scaling", "Other"];

export const DELIVERY_MODELS = [
  "Direct sales", "Agency", "Marketplace", "Subscription-based", "E-commerce", 
  "Freemium", "Franchise", "SaaS (Software as a Service)", "Brick-and-mortar retail", 
  "Consultancy", "Other"
];

export const BENEFITS = [
  "Saves time", "Saves money", "Convenience", "Reliability", 
  "Improved performance", "Comfort / ease", "Status / prestige", "Safety / security", "Other"
];

export const VALUES = [
  "Integrity", "Innovation", "Customer-centricity", "Excellence / Quality", 
  "Transparency", "Accountability", "Sustainability", "Collaboration / Teamwork", 
  "Empathy", "Reliability / Consistency", "Growth mindset", "Social impact", 
  "Inclusivity / Diversity", "Efficiency", "Other"
];

export const STRENGTHS = [
  "Affordable pricing", "Premium quality", "Strong brand reputation", 
  "Unique product/service offering", "Fast delivery / speed", "Excellent customer service", 
  "Innovation / technology-driven", "Wide product range", "Strong partnerships", 
  "Location advantage", "Convenience / accessibility", "Customization / personalization", 
  "Trust & reliability", "Strong online presence", "Scalability potential", "Other"
];

export const WEAKNESSES = [
  "Low brand awareness", "Limited budget / funding", "Weak online presence", 
  "Limited product/service range", "Poor customer retention", "Operational inefficiencies", 
  "Lack of skilled team", "High pricing (uncompetitive)", "Dependence on few customers", 
  "Weak distribution channels", "Slow delivery time", "Limited technology adoption", 
  "Poor brand positioning", "Regulatory challenges", "Other"
];

export const BRAND_FEELS = [
  "Heritage & Legacy", "Royal, Luxury & Prestige", "Modern, Minimal & Clean", 
  "Innovative & Tech-Driven", "Bold & High-Impact", "Friendly & Approachable", 
  "Playful & Vibrant", "Professional & Corporate", "Trustworthy & Reliable", 
  "Fast & Efficient", "Creative & Expressive", "Natural & Organic", "Other"
];

export const EMOTIONAL_OUTCOMES = [
  "Confident & Empowered", "Excited & Inspired", "Safe & Secure", 
  "Trusted & Confident", "Valued & Appreciated", "Happy & Delighted", 
  "Calm & Relaxed", "Connected & Understood", "Exclusive & Privileged", 
  "Curious & Engaged", "Satisfied & Fulfilled", "Motivated to Take Action", "Other"
];

// ─── HYGIENE & INDUSTRY BIAS ───────────────────────────────────────

export const HYGIENE_KEYWORDS = ['sustainable', 'integrity', 'quality', 'excellence', 'trust', 'service', 'professional', 'innovative', 'accountability', 'reliability'];

export const INDUSTRY_CONTEXT_MAP: Record<string, string[]> = {
  'events': ['Magician', 'Jester', 'Everyman'],
  'culture': ['Magician', 'Explorer', 'Creator'],
  'industrial': ['Ruler', 'Explorer', 'Hero'],
  'tech': ['Magician', 'Creator', 'Sage'],
  'professional': ['Ruler', 'Sage'],
  'hospitality': ['Everyman', 'Caregiver', 'Lover'],
  'wellness': ['Caregiver', 'Innocent', 'Sage'],
  'luxury': ['Ruler', 'Lover']
};

// ─── COLOR PSYCHOLOGY ───────────────────────────────────────────────

export interface ColorPalette {
  color: string;
  hex: string;
  meaning: string;
  application: string;
  industries: string[];
  feels: string[];
}

export const COLOR_DATABASE: ColorPalette[] = [
  { color: 'Deep Navy', hex: '#1B2A4A', meaning: 'Trust, authority, and professionalism', application: 'Primary brand color', industries: ['technology', 'fintech', 'consulting', 'professional'], feels: ['professional', 'corporate', 'trustworthy'] },
  { color: 'Royal Blue', hex: '#2563EB', meaning: 'Innovation, reliability, and confidence', application: 'Primary or CTA', industries: ['technology', 'software', 'saas', 'fintech'], feels: ['modern', 'innovative', 'tech-driven'] },
  { color: 'Emerald Green', hex: '#059669', meaning: 'Growth, vitality, and prosperity', application: 'Primary or Sustainability accents', industries: ['agriculture', 'energy', 'healthcare', 'natural'], feels: ['natural', 'organic', 'sustainable'] },
  { color: 'Rich Gold', hex: '#D4A843', meaning: 'Prestige, excellence, and premium quality', application: 'Premium accents and luxury elements', industries: ['luxury', 'fashion', 'real estate', 'hospitality'], feels: ['luxury', 'premium', 'heritage', 'royal'] },
  { color: 'Crimson Red', hex: '#DC2626', meaning: 'Energy, passion, and urgency', application: 'Secondary accents and CTAs', industries: ['food', 'sports', 'entertainment', 'media'], feels: ['bold', 'impact', 'vibrant'] },
  { color: 'Warm Orange', hex: '#EA580C', meaning: 'Enthusiasm, creativity, and warmth', application: 'Secondary accents', industries: ['education', 'marketing', 'e-commerce'], feels: ['friendly', 'playful', 'approachable'] },
  { color: 'Soft Lavender', hex: '#7C3AED', meaning: 'Creativity, wisdom, and sophistication', application: 'Creative accents', industries: ['beauty', 'wellness', 'creative', 'tech'], feels: ['creative', 'expressive', 'modern'] },
  { color: 'Teal', hex: '#0D9488', meaning: 'Balance, clarity, and refreshment', application: 'Supportive elements', industries: ['healthcare', 'wellness', 'education'], feels: ['clean', 'minimal', 'trustworthy'] },
  { color: 'Charcoal', hex: '#1F2937', meaning: 'Sophistication and strength', application: 'Structural elements and typography', industries: ['all'], feels: ['professional', 'modern', 'minimal', 'corporate'] },
  { color: 'Midnight Black', hex: '#000000', meaning: 'Authority and ultra-luxury', application: 'Primary backgrounds and text', industries: ['luxury', 'fashion'], feels: ['premium', 'bold'] },
  { color: 'Pure White', hex: '#FFFFFF', meaning: 'Clarity and purity', application: 'Space and cleanliness', industries: ['all'], feels: ['clean', 'minimal'] },
];

export const COLOR_WHEEL: Record<string, string[]> = {
  'Blue': ['Orange', 'Gold', 'White'],
  'Navy': ['Gold', 'White', 'Cyan'],
  'Green': ['Purple', 'White', 'Beige'],
  'Red': ['Cyan', 'White', 'Gray'],
  'Orange': ['Blue', 'White', 'Navy'],
  'Purple': ['Green', 'Gold', 'White'],
  'Gold': ['Navy', 'Black', 'White'],
  'Black': ['Gold', 'White', 'Silver'],
  'White': ['Black', 'Navy', 'Red']
};

// ─── TYPOGRAPHY DATABASE ──────────────────────────────────────────

export const TYPOGRAPHY: Record<string, { primary: string; secondary: string }> = {
  'professional': { primary: 'Inter', secondary: 'Source Serif 4' },
  'modern': { primary: 'Outfit', secondary: 'Inter' },
  'luxury': { primary: 'Playfair Display', secondary: 'Lato' },
  'creative': { primary: 'Space Grotesk', secondary: 'DM Sans' },
  'friendly': { primary: 'Nunito', secondary: 'Open Sans' },
  'bold': { primary: 'Montserrat', secondary: 'Roboto' },
  'minimal': { primary: 'Inter', secondary: 'IBM Plex Sans' },
  'heritage': { primary: 'Cormorant Garamond', secondary: 'Lato' },
  'tech': { primary: 'JetBrains Mono', secondary: 'Inter' },
  'default': { primary: 'Inter', secondary: 'Source Sans 3' },
};

// ─── MASLOW MAPPING ───────────────────────────────────────────────

export const MASLOW_MAP: { level: string; keywords: string[]; explanation: string; needType: string }[] = [
  { level: 'Self-Actualization', keywords: ['innovation', 'growth mindset', 'creativity', 'empowerment', 'inspired', 'self-expression', 'status', 'prestige'], explanation: 'The target customers are seeking personal fulfillment, creative expression, and the realization of their fullest potential.', needType: 'Self-Expression & Purpose' },
  { level: 'Esteem', keywords: ['excellence', 'premium', 'recognition', 'confidence', 'empowered', 'achievement', 'status', 'prestige', 'exclusive'], explanation: 'The target customers desire recognition, respect, and a sense of achievement — the brand validates their self-worth.', needType: 'Recognition & Achievement' },
  { level: 'Belonging', keywords: ['community', 'collaboration', 'connected', 'teamwork', 'inclusivity', 'belonging', 'social', 'diversity'], explanation: 'The target customers seek connection, belonging, and a sense of community — the brand makes them feel part of something meaningful.', needType: 'Social Connection & Community' },
  { level: 'Safety', keywords: ['security', 'reliability', 'trust', 'safe', 'protection', 'stability', 'consistent', 'accountability', 'transparency'], explanation: 'The target customers need assurance and stability — the brand provides a sense of security and dependability.', needType: 'Psychological Security' },
  { level: 'Survival', keywords: ['affordable', 'basic', 'essential', 'necessity', 'fundamental', 'survival'], explanation: 'The target customers are focused on meeting essential needs — the brand provides fundamental solutions they depend on.', needType: 'Essential Need Fulfillment' },
];

// ─── INDUSTRY COMPETITOR TEMPLATES ────────────────────────────────

export const COMPETITOR_TEMPLATES: Record<string, { name: string; x: number; y: number; website: string; socials: { platform: string; url: string }[]; location: string; established: string }[]> = {
  'technology': [
    { name: 'Nvidia', x: 75, y: 85, website: 'www.nvidia.com', socials: [{ platform: 'LinkedIn', url: 'https://linkedin.com/company/nvidia' }, { platform: 'X', url: 'https://x.com/nvidia' }], location: 'Santa Clara, CA', established: '1993' }, 
    { name: 'Microsoft Azure', x: 65, y: 75, website: 'azure.microsoft.com', socials: [{ platform: 'LinkedIn', url: 'https://linkedin.com/company/microsoft' }], location: 'Redmond, WA', established: '2010' }, 
    { name: 'Apple Cloud', x: 80, y: 65, website: 'www.apple.com/icloud', socials: [{ platform: 'Instagram', url: 'https://instagram.com/apple' }], location: 'Cupertino, CA', established: '2011' }
  ],
  'fintech': [
    { name: 'Stripe', x: 75, y: 80, website: 'www.stripe.com', socials: [{ platform: 'LinkedIn', url: 'https://linkedin.com/company/stripe' }, { platform: 'X', url: 'https://x.com/stripe' }], location: 'San Francisco, CA', established: '2010' }, 
    { name: 'Revolut', x: 65, y: 70, website: 'www.revolut.com', socials: [{ platform: 'Instagram', url: 'https://instagram.com/revolut' }], location: 'London, UK', established: '2015' }, 
    { name: 'Plaid', x: 55, y: 65, website: 'www.plaid.com', socials: [{ platform: 'LinkedIn', url: 'https://linkedin.com/company/plaid' }], location: 'San Francisco, CA', established: '2013' }
  ],
  'healthcare': [
    { name: 'Mayo Clinic', x: 80, y: 75, website: 'www.mayoclinic.org', socials: [{ platform: 'LinkedIn', url: '#' }], location: 'Rochester, MN', established: '1864' }, 
    { name: 'Pfizer', x: 70, y: 65, website: 'www.pfizer.com', socials: [{ platform: 'LinkedIn', url: '#' }], location: 'New York, NY', established: '1849' }, 
    { name: 'CVS Health', x: 60, y: 55, website: 'www.cvshealth.com', socials: [{ platform: 'X', url: '#' }], location: 'Woonsocket, RI', established: '1963' }
  ],
  'education': [
    { name: 'Coursera', x: 70, y: 75, website: 'www.coursera.org', socials: [{ platform: 'LinkedIn', url: '#' }], location: 'Mountain View, CA', established: '2012' }, 
    { name: 'Udemy', x: 55, y: 65, website: 'www.udemy.com', socials: [{ platform: 'Instagram', url: '#' }], location: 'San Francisco, CA', established: '2010' }, 
    { name: 'Khan Academy', x: 45, y: 80, website: 'www.khanacademy.org', socials: [{ platform: 'YouTube', url: '#' }], location: 'Mountain View, CA', established: '2008' }
  ],
  'real estate': [
    { name: 'Zillow', x: 75, y: 80, website: 'www.zillow.com', socials: [{ platform: 'Instagram', url: '#' }], location: 'Seattle, WA', established: '2006' }, 
    { name: 'CBRE Group', x: 85, y: 65, website: 'www.cbre.com', socials: [{ platform: 'LinkedIn', url: '#' }], location: 'Dallas, TX', established: '1906' }, 
    { name: 'Compass', x: 60, y: 70, website: 'www.compass.com', socials: [{ platform: 'LinkedIn', url: '#' }], location: 'New York, NY', established: '2012' }
  ],
  'e-commerce': [
    { name: 'Amazon', x: 85, y: 90, website: 'www.amazon.com', socials: [{ platform: 'LinkedIn', url: '#' }], location: 'Seattle, WA', established: '1994' }, 
    { name: 'Shopify', x: 75, y: 70, website: 'www.shopify.com', socials: [{ platform: 'X', url: '#' }], location: 'Ottawa, CA', established: '2006' }, 
    { name: 'Etsy', x: 40, y: 80, website: 'www.etsy.com', socials: [{ platform: 'Instagram', url: '#' }], location: 'Brooklyn, NY', established: '2005' }
  ],
  'events': [
    { name: 'Eventbrite', x: 75, y: 80, website: 'www.eventbrite.com', socials: [{ platform: 'LinkedIn', url: '#' }], location: 'San Francisco, CA', established: '2006' }, 
    { name: 'Cvent', x: 85, y: 65, website: 'www.cvent.com', socials: [{ platform: 'LinkedIn', url: '#' }], location: 'Tysons, VA', established: '1999' }, 
    { name: 'Bizzabo', x: 60, y: 70, website: 'www.bizzabo.com', socials: [{ platform: 'Instagram', url: '#' }], location: 'New York, NY', established: '2011' }
  ],
  'default': [
    { name: 'Industry Leader', x: 70, y: 65, website: 'www.market-leader.com', socials: [{ platform: 'LinkedIn', url: '#' }], location: 'Global HQ', established: '2005' }, 
    { name: 'Global Challenger', x: 50, y: 50, website: 'www.challenger-hub.io', socials: [{ platform: 'Instagram', url: '#' }], location: 'International Office', established: '2018' }, 
    { name: 'Digital Specialist', x: 35, y: 70, website: 'www.specialist-pro.com', socials: [{ platform: 'X', url: '#' }], location: 'Metropolitan Hub', established: '2021' }
  ],
};
