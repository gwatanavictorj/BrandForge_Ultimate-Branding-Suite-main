/**
 * Fallback Brand Strategy Engine
 * 
 * Generates a complete BrandStrategy using rule-based logic, 
 * lookup tables, and deterministic mapping — no AI model required.
 */

import { BrandDiscovery, BrandStrategy } from '../types';
import { mapStrategicCategory } from '../utils/mappingUtils';

// ─── ARCHETYPE DATABASE ───────────────────────────────────────────

const STRATEGIC_WEIGHTS = {
  MISSION_VISION: 3.0,
  STRATEGIC_GAP: 2.5,
  CORE_VALUES: 2.0,
  BRAND_FEEL: 1.0
};

interface ArchetypeData {
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

const ARCHETYPES: ArchetypeData[] = [
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

export function getArchetypeByName(name: string): ArchetypeData | undefined {
  return ARCHETYPES.find(a => a.name.toLowerCase() === name.toLowerCase());
}


// --- HYGIENE & INDUSTRY BIAS SYSTEM ---

const HYGIENE_KEYWORDS = ['sustainable', 'integrity', 'quality', 'excellence', 'trust', 'service', 'professional', 'innovative', 'accountability', 'reliability'];

const INDUSTRY_CONTEXT_MAP: Record<string, string[]> = {
  'events': ['Magician', 'Jester', 'Everyman'],
  'culture': ['Magician', 'Explorer', 'Creator'],
  'industrial': ['Ruler', 'Explorer', 'Hero'],
  'tech': ['Magician', 'Creator', 'Sage'],
  'professional': ['Ruler', 'Sage'],
  'hospitality': ['Everyman', 'Caregiver', 'Lover'],
  'wellness': ['Caregiver', 'Innocent', 'Sage'],
  'luxury': ['Ruler', 'Lover']
};

// ─── COLOR PSYCHOLOGY DATABASE ────────────────────────────────────

interface ColorPalette {
  color: string;
  hex: string;
  meaning: string;
  application: string;
  industries: string[];
  feels: string[];
}

const COLOR_DATABASE: ColorPalette[] = [
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

const COLOR_WHEEL: Record<string, string[]> = {
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

const TYPOGRAPHY: Record<string, { primary: string; secondary: string }> = {
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

const MASLOW_MAP: { level: string; keywords: string[]; explanation: string; needType: string }[] = [
  { level: 'Self-Actualization', keywords: ['innovation', 'growth mindset', 'creativity', 'empowerment', 'inspired', 'self-expression', 'status', 'prestige'], explanation: 'The target customers are seeking personal fulfillment, creative expression, and the realization of their fullest potential.', needType: 'Self-Expression & Purpose' },
  { level: 'Esteem', keywords: ['excellence', 'premium', 'recognition', 'confidence', 'empowered', 'achievement', 'status', 'prestige', 'exclusive'], explanation: 'The target customers desire recognition, respect, and a sense of achievement — the brand validates their self-worth.', needType: 'Recognition & Achievement' },
  { level: 'Belonging', keywords: ['community', 'collaboration', 'connected', 'teamwork', 'inclusivity', 'belonging', 'social', 'diversity'], explanation: 'The target customers seek connection, belonging, and a sense of community — the brand makes them feel part of something meaningful.', needType: 'Social Connection & Community' },
  { level: 'Safety', keywords: ['security', 'reliability', 'trust', 'safe', 'protection', 'stability', 'consistent', 'accountability', 'transparency'], explanation: 'The target customers need assurance and stability — the brand provides a sense of security and dependability.', needType: 'Psychological Security' },
  { level: 'Survival', keywords: ['affordable', 'basic', 'essential', 'necessity', 'fundamental', 'survival'], explanation: 'The target customers are focused on meeting essential needs — the brand provides fundamental solutions they depend on.', needType: 'Essential Need Fulfillment' },
];

// ─── INDUSTRY COMPETITOR TEMPLATES ────────────────────────────────

const COMPETITOR_TEMPLATES: Record<string, { name: string; x: number; y: number; website: string; socials: { platform: string; url: string }[]; location: string; established: string }[]> = {
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

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────

function matchArchetype(discovery: BrandDiscovery): { primary: ArchetypeData; secondary: ArchetypeData; tertiary: ArchetypeData } {
  // 1. Segment Data into tiers of strategic intent
  const soulSource = [discovery.mission, discovery.problemSolving, discovery.differentiation, discovery.industry].join(' ').toLowerCase();
  const behaviorSource = [...(discovery.brandFeel || []), ...(discovery.coreValues || []), discovery.vision].join(' ').toLowerCase();
  const contextSource = discovery.industry.toLowerCase();

  const scores = ARCHETYPES.map(a => {
    let score = 0;

    // --- TIER 1: THE INNER NEED (SOUL) - 10X WEIGHT ---
    if (soulSource.includes(a.innerNeed.toLowerCase())) score += 150;
    
    // Identity Markers check (High potency Junigan signals)
    a.identityMarkers.forEach(im => {
      if (soulSource.includes(im.toLowerCase())) score += 25;
    });

    // --- TIER 2: INDUSTRY CONTEXTUAL BIAS ---
    Object.entries(INDUSTRY_CONTEXT_MAP).forEach(([key, list]) => {
      if (contextSource.includes(key) && list.includes(a.name)) {
        score += 50;
      }
    });

    // --- TIER 3: TEXTUAL ANALYSIS (IDENTITY VS NOISE) ---
    const allText = (soulSource + ' ' + behaviorSource).toLowerCase();
    
    a.keywords.forEach(k => {
      if (allText.includes(k.toLowerCase())) {
        const isHygiene = HYGIENE_KEYWORDS.includes(k.toLowerCase());
        score += isHygiene ? 0.5 : 2.5;
      }
    });

    return { archetype: a, score };
  }).sort((a, b) => b.score - a.score);

  return {
    primary: scores[0].archetype,
    secondary: scores[1]?.archetype || scores[0].archetype,
    tertiary: scores[2]?.archetype || scores[1]?.archetype || scores[0].archetype
  };
}

function matchMaslow(discovery: BrandDiscovery): typeof MASLOW_MAP[0] {
  const allText = [
    ...(discovery.customerBenefits || []),
    ...(discovery.coreValues || []),
    ...(discovery.customerEmotionalOutcome || []),
    discovery.mission, discovery.problemSolving
  ].filter(v => typeof v === 'string').join(' ').toLowerCase();

  const scores = MASLOW_MAP.map(m => ({
    level: m,
    score: m.keywords.reduce((s, k) => s + (allText.includes(k) ? 1 : 0), 0)
  })).sort((a, b) => b.score - a.score);

  return scores[0].level;
}

function selectColors(discovery: BrandDiscovery): { color: string; role: string; meaning: string; application: string }[] {
  const industry = (typeof discovery.industry === 'string' ? discovery.industry : '').toLowerCase();
  const feels = (discovery.brandFeel || []).filter(f => typeof f === 'string').map(f => f.toLowerCase());
  const userColorText = (discovery.colorSymbols || '').toLowerCase();
  
  // 1. Identify User Anchor Colors
  const anchors = COLOR_DATABASE.filter(c => 
    userColorText.includes(c.color.toLowerCase().split(' ')[0]) || 
    userColorText.includes(c.color.toLowerCase().split(' ')[1]) ||
    userColorText.includes(c.hex.toLowerCase())
  );

  // 2. Score remaining based on industry and feel
  const scored = COLOR_DATABASE.map(c => {
    let score = 0;
    if (userColorText.includes(c.color.toLowerCase().split(' ')[0])) score += 10;
    c.industries.forEach(ind => { if (industry.includes(ind)) score += 2; });
    c.feels.forEach(f => { if (feels.includes(f)) score += 1; });
    return { ...c, score };
  }).sort((a, b) => b.score - a.score);

  const picked: ColorPalette[] = [];
  
  // Always include anchors first
  anchors.forEach(a => { if (picked.length < 4) picked.push(a); });

  // 3. Fill with Complementary / Balanced choices
  scored.forEach(c => {
    if (picked.length >= 4) return;
    if (picked.find(p => p.hex === c.hex)) return;
    
    // Simple Contrast Check: Avoid picking too many dark/light colors together
    const isDark = (hex: string) => {
      const h = hex.replace('#', '');
      const r = parseInt(h.substring(0, 2), 16);
      const g = parseInt(h.substring(2, 4), 16);
      const b = parseInt(h.substring(4, 6), 16);
      return (r * 0.299 + g * 0.587 + b * 0.114) < 128;
    };

    const darkCount = picked.filter(p => isDark(p.hex)).length;
    const lightCount = picked.length - darkCount;

    if (isDark(c.hex) && darkCount >= 2) return; // Keep balance
    if (!isDark(c.hex) && lightCount >= 2) return; // Keep balance

    picked.push(c);
  });

  // Final fallback to ensure exactly 4 colors
  if (picked.length < 4) {
    COLOR_DATABASE.forEach(c => {
      if (picked.length < 4 && !picked.find(p => p.hex === c.hex)) picked.push(c);
    });
  }

  // Ensure exactly 4 by slicing if somehow exceeded
  const final4 = picked.slice(0, 4);

  return final4.map((c, i) => {
    // Definitive role assignment based on selection priority
    const role = i === 0 ? 'Primary' : i === 1 ? 'Secondary' : i === 2 ? 'Tertiary' : 'Accent';
    return {
      color: `${c.color} (${c.hex})`,
      role: role,
      meaning: c.meaning,
      application: c.application
    };
  });
}

function selectTypography(discovery: BrandDiscovery): string {
  const feels = (discovery.brandFeel || []).filter(f => typeof f === 'string').map(f => f.toLowerCase()).join(' ');
  
  if (feels.includes('luxury') || feels.includes('royal') || feels.includes('heritage')) return 'luxury';
  if (feels.includes('modern') || feels.includes('minimal') || feels.includes('clean')) return 'modern';
  if (feels.includes('bold') || feels.includes('impact')) return 'bold';
  if (feels.includes('creative') || feels.includes('expressive')) return 'creative';
  if (feels.includes('friendly') || feels.includes('approachable') || feels.includes('playful')) return 'friendly';
  if (feels.includes('professional') || feels.includes('corporate')) return 'professional';
  if (feels.includes('tech') || feels.includes('innovative')) return 'tech';
  
  return 'default';
}

function getCompetitors(discovery: BrandDiscovery): { name: string; x: number; y: number }[] {
  const manualIndustry = (discovery.industry === 'Other' && discovery.industryOther) ? discovery.industryOther : (discovery.industry || '');
  const industryValue = mapStrategicCategory(manualIndustry, 'industry');
  const industry = (industryValue || '').toLowerCase();
  for (const [key, comps] of Object.entries(COMPETITOR_TEMPLATES)) {
    if (industry.includes(key)) return comps;
  }
  return COMPETITOR_TEMPLATES['default'];
}

// ─── MAIN ENGINE ──────────────────────────────────────────────────

export function generateFallbackStrategy(rawDiscovery: BrandDiscovery): BrandStrategy {
  // Purge any "Other" glitch strings from the raw data before mapping
  const discovery: any = { ...rawDiscovery };
  Object.keys(discovery).forEach(key => {
    const val = discovery[key];
    if (Array.isArray(val)) {
      discovery[key] = val.filter(v => typeof v === 'string' && v.toLowerCase() !== 'other');
    } else if (typeof val === 'string' && val.toLowerCase() === 'other') {
      discovery[key] = '';
    }
  });

  const brandName = discovery.brandNameLogo || discovery.registeredName || 'The Brand';
  const { primary, secondary } = matchArchetype(discovery);
  const maslow = matchMaslow(discovery);
  const colors = selectColors(discovery);
  const typoKey = selectTypography(discovery);
  const typo = TYPOGRAPHY[typoKey] || TYPOGRAPHY['default'];
  const competitors = getCompetitors(discovery);

  const values = (discovery.coreValues || []).slice(0, 5).map(v => {
    const vStr = String(v || '');
    const mappedValue = mapStrategicCategory(vStr, 'values');
    return {
      name: mappedValue,
      description: `${brandName} is deeply committed to ${String(mappedValue || 'excellence').toLowerCase()}, which guides every decision and interaction with customers and stakeholders.`
    };
  });

  if (values.length === 0) {
    values.push(
      { name: 'Excellence', description: `${brandName} strives for excellence in everything it delivers.` },
      { name: 'Integrity', description: `${brandName} operates with transparency and honesty at its core.` },
      { name: 'Innovation', description: `${brandName} constantly seeks better ways to serve its customers.` }
    );
  }

  const manualIndustry = (discovery.industry === 'Other' && discovery.industryOther) ? discovery.industryOther : (discovery.industry || 'industry');
  const industryLabel = mapStrategicCategory(manualIndustry, 'industry');
  
  const manualStage = (discovery.stage === 'Other' && discovery.stageOther) ? discovery.stageOther : (discovery.stage || 'growing');
  const stageLabel = mapStrategicCategory(manualStage, 'stage');

  const strategy: BrandStrategy = {
    isFallback: true,
    overview: {
      whoWeAre: `${brandName} is a ${stageLabel} ${industryLabel} brand founded with a clear purpose: to solve real problems for real people. ${discovery.tagline ? `The brand motto — "${discovery.tagline}" — embodies this commitment.` : ''}`,
      whatWeDo: discovery.productsServices ? `${brandName} offers services ranging from:\n*${discovery.productsServices.split(',').map(s => s.trim()).join('\n*')}` : `${brandName} offers services ranging from:\n*Venue Rental (Corporate, Catering, Weddings, Birthdays)\n*Stage Events (Bands, Shows, Comedy)\n*Nightlife Location, Festival Space\n*Event Technology (Video Mapping)`,
      howWeDoIt: `Through ${(discovery.deliveryModel || []).filter(v => typeof v === 'string').join(', ') || 'direct engagement'}, ${brandName} ensures customers receive exceptional value at every touchpoint.`,
      whereWeAre: discovery.address || 'global'
    },

    foundation: {
      mission: discovery.mission ? `The mission of ${brandName} is to ${String(discovery.mission).charAt(0).toLowerCase() + String(discovery.mission).slice(1)}` : `The mission of ${brandName} is to empower individuals and organizations by providing best-in-class ${industryLabel} solutions that drive meaningful results.`,
      vision: discovery.vision ? `${brandName}'s vision is to ${String(discovery.vision).charAt(0).toLowerCase() + String(discovery.vision).slice(1)}` : `${brandName}'s vision is to become the most trusted and innovative ${industryLabel} brand, setting new standards for excellence and impact.`,
      philosophy: discovery.philosophy ? `${brandName}'s philosophy is rooted in the belief that ${String(discovery.philosophy).charAt(0).toLowerCase() + String(discovery.philosophy).slice(1)}` : `${brandName}'s philosophy is rooted in the belief that every interaction is an opportunity to create lasting value, combining purpose with precision.`
    },

    coreIdea: `${brandName} transforms ordinary gatherings into extraordinary, unforgettable cultural experiences, fostering connection and shaping the ${discovery.address ? 'city\'s' : 'industry\'s'} pulse.`,

    story: discovery.brandStory || (
      `The global ${industryLabel} is undergoing a profound shift, creating a significant demand for ${discovery.idealCustomers || 'visionary solutions'}. ` +
      `This evolution presents a unique opportunity for ${String((discovery.customerBenefits || ['excellence'])[0] || 'excellence').toLowerCase()} to gain the momentum and clarity needed to lead. ` +
      `However, standard approaches often lack the strategic depth required for long-term success. ` +
      `${brandName} was founded to provide the needed inspiration, tools, and models of impact to prepare its customers to take over the global marketplace.`
    ),

    audience: {
      groups: [
        {
          name: 'Primary Audience',
          description: discovery.idealCustomers || `Individuals and organizations in the ${industryLabel || 'target'} space seeking reliable solutions.`,
          needs: `${(discovery.customerBenefits || ['Quality service', 'Reliable solutions']).slice(0, 3).join(', ')}`,
          painPoints: discovery.problemSolving || 'Difficulty finding trustworthy, high-quality solutions in a crowded market.'
        },
        {
          name: 'Secondary Audience',
          description: `Decision-makers and stakeholders who evaluate ${discovery.industry || 'industry'} solutions based on value, trust, and long-term impact.`,
          needs: 'Proven track record, transparent pricing, and measurable results.',
          painPoints: 'Lack of differentiation among competitors and inconsistent quality standards.'
        }
      ],
      maslowLevel: maslow?.level || 'Self-Actualization',
      maslowExplanation: maslow?.explanation || 'The brand seeks to fulfill the customer\'s highest potential.',
      maslowNeedType: maslow?.needType || 'Purpose',
      narrative: `The ideal ${brandName} customer is someone who values ${String((discovery.customerEmotionalOutcome || ['quality', 'trust']).slice(0, 2).map(o => mapStrategicCategory(o, 'emotionalOutcome')).join(' and ')).toLowerCase()}. They have tried other solutions but found them lacking. When they discover ${brandName}, they feel ${String((discovery.customerEmotionalOutcome || ['confident', 'valued']).map(o => mapStrategicCategory(o, 'emotionalOutcome')).join(' and ')).toLowerCase()}. That is the transformation ${brandName} delivers.`
    },

    marketPosition: {
      axes: {
        x: `${(discovery.strengths || ['Innovation'])[0]} vs. Traditional Approach`,
        y: 'Premium Experience vs. Accessible Pricing'
      },
      quadrant: `${brandName} occupies the upper-right quadrant — combining ${String((discovery.strengths || ['Innovation'])[0] || 'innovation').toLowerCase()} with a premium customer experience.`,
      statement: `${brandName} is positioned as the ${String(primary.name || 'leader').toLowerCase()} brand in the ${discovery.industry || 'market'} space, distinguished by ${discovery.differentiation || 'its unique approach and unwavering commitment to quality'}.`,
      position: { x: 72, y: 68 },
      competitors: competitors,
      analysis: `In the ${discovery.industry || 'target'} landscape, ${brandName} differentiates through ${discovery.differentiation || (discovery.strengths || ['quality']).slice(0, 2).join(' and ')}. While competitors focus on standard offerings, ${brandName} occupies a unique position by combining ${String(primary.name || 'primary').toLowerCase()} energy with ${String(secondary.name || 'secondary').toLowerCase()} values.`,
      gapHighlight: `The market gap ${brandName} fills is the lack of brands that combine ${String((discovery.strengths || ['quality', 'affordability']).slice(0, 2).map(s => String(s || '').toLowerCase()).join(' and ')).toLowerCase()} — most competitors choose one or the other.`
    },

    archetype: {
      primary: {
        name: primary.name,
        innerNeed: primary.innerNeed,
        description: primary.description,
        jungianModel: primary.jungianModel,
        goal: 'To create things of enduring value and realize a unique vision.',
        fear: 'Being mediocre or having a vision that fails to materialize.',
        weakness: 'Perfectionism and creating impractical solutions.',
        talent: 'Creativity, imagination, and the ability to turn concepts into reality.',
        personalityNarrative: `As a ${primary.name}, ${brandName} follows a transformative and visionary sequence to seek and deliver innovation. At their core, ${brandName} is a catalyst for change and finds fulfillment in turning ambitious dreams into tangible results.`,
        archetypeStatement: `${brandName} is a ${primary.name} brand that exists to transform possibilities into reality by providing powerful tools and insight, helping users achieve meaningful change.`,
        traits: primary.traits,
        inPractice: [
          { label: 'Messaging', content: 'Focus on transformation, wonder, and the impossible made possible. Use inspiring and catalytic language.' },
          { label: 'Visuals', content: 'Use ethereal, dynamic, and high-contrast imagery that suggests movement, power, and evolution.' },
          { label: 'Interaction', content: 'The experience should feel effortless, intuitive, and almost magical in its ability to solve complex problems.' }
        ],
        strategicRationale: `${brandName}'s core identity is rooted in the ${primary.name} archetype, as it directly mirrors the brand's primary mission to ${discovery.mission || 'deliver excellence'}.`
      },
      secondary: {
        name: secondary.name,
        innerNeed: secondary.innerNeed,
        description: secondary.description,
        jungianModel: secondary.jungianModel,
        goal: 'To connect with others and provide support through genuine service.',
        fear: 'Being isolated or unable to help those in need.',
        weakness: 'Self-sacrifice to the point of burnout or losing individuality.',
        talent: 'Compassion, generosity, and strong interpersonal skills.',
        personalityNarrative: `As a ${secondary.name}, ${brandName} follows a nurturing and protective sequence to seek and deliver support. At their core, ${brandName} is a reliable guardian and finds fulfillment in fostering safety and well-being for all.`,
        archetypeStatement: `${brandName} is a ${secondary.name} brand that exists to support and protect its audience through reliable and thoughtful solutions, helping them feel secure and cared for.`,
        traits: secondary.traits,
        inPractice: [
          { label: 'Messaging', content: 'Focus on empathy, protection, and reliability. Use warm, reassuring, and inclusive language.' },
          { label: 'Visuals', content: 'Use soft lighting, gentle colors, and imagery that emphasizes connection, safety, and domestic comfort.' },
          { label: 'Interaction', content: 'The relationship should feel supportive, responsive, and genuinely cares for the individual\'s unique needs.' }
        ],
        strategicRationale: `The ${secondary.name} archetype provides a critical supporting layer, adding the necessary ${secondary.traits[0]?.toLowerCase()} flavor that completes the brand personality.`
      },
      tertiary: {
        name: 'The Explorer',
        innerNeed: 'Freedom',
        description: 'The archetype that represents the brand\'s market-specific ambition and its specialized competitive spirit.',
        jungianModel: 'Independence and Discovery',
        goal: 'To experience a better, more authentic, more fulfilling life.',
        fear: 'Getting trapped, conformity, and inner emptiness.',
        weakness: 'Aimless wandering and becoming a misfit.',
        talent: 'Autonomy, ambition, and being true to one\'s soul.',
        personalityNarrative: `As an Explorer, ${brandName} follows an adventurous and independent sequence to seek and deliver freedom. At their core, ${brandName} is a pioneer and finds fulfillment in discovering new horizons and authentic experiences.`,
        archetypeStatement: `${brandName} is an Explorer brand that exists to provide freedom and discovery through specialized insight, helping users experience a more authentic and fulfilling life.`,
        traits: ['Adventurous', 'Innovative', 'Boundless'],
        inPractice: [
          { label: 'Messaging', content: 'Focus on freedom, self-discovery, and breaking boundaries. Use daring, authentic, and evocative language.' },
          { label: 'Visuals', content: 'Use expansive landscapes, rugged textures, and imagery that suggests movement and the great outdoors.' },
          { label: 'Interaction', content: 'The experience should feel liberating, offering choices and paths that allow the user to define their own journey.' }
        ],
        strategicRationale: `The Explorer archetype acts as the brand's 'Aspirational Edge', driving the competitive spirit and market-specific ambition needed for long-term growth.`
      },
      behavior: {
        tone: {
          description: `${brandName}'s voice blends ${primary.traits[0]?.toLowerCase()} authority with ${secondary.traits[1]?.toLowerCase()} warmth, striking a balance that feels both competent and approachable.`,
          framework: `Lead with ${primary.traits[0]}, support with ${secondary.traits[1]}, always rooted in ${(discovery.coreValues || ['integrity'])[0]}.`,
          examples: [
            `"${brandName} does not just deliver — ${brandName} transforms the way customers experience ${discovery.industry || 'the industry'}."`,
            `"Built on ${(discovery.coreValues || ['trust'])[0]?.toLowerCase()}, powered by ${primary.traits[0]?.toLowerCase()}."`,
            `"Customer success is ${brandName}'s purpose. Together, something remarkable can be built."`
          ],
          useCases: [
            {
              category: 'marketing',
              platform: 'Social Media Hero',
              targetAudience: 'Primary Audience',
              contentTemplate: `Imagine a world where ${discovery.problemSolving || 'challenges'} are a thing of the past. With ${brandName}, we bring ${String(primary.traits[0] || 'innovative').toLowerCase()} innovation to your doorstep.`,
              guidelines: `Focus on the transformative power of ${primary.name} energy. Use active, inspiring verbs.`,
              archetypeSync: `Reflects the ${primary.name}'s visionary nature.`
            },
            {
              category: 'announcement',
              platform: 'Official Press Release',
              targetAudience: 'Industry Stakeholders',
              contentTemplate: `${brandName} is proud to announce a new milestone in our mission to ${discovery.mission || 'deliver excellence'}. This step reinforces our commitment to ${(discovery.coreValues || ['Integrity'])[0]}.`,
              guidelines: `Maintain a balance of ${primary.traits[0]} authority and ${secondary.traits[1]} warmth.`,
              archetypeSync: `Blends ${primary.name} leadership with ${secondary.name} depth.`
            },
            {
              category: 'acknowledgement',
              platform: 'Customer Success Email',
              targetAudience: 'New Customers',
              contentTemplate: `Welcome to the ${brandName} family. We are honored to support your journey towards ${String((discovery.customerBenefits || ['success'])[0] || 'success').toLowerCase()}.`,
              guidelines: `Lead with genuine ${secondary.traits[1]} warmth. Focus on the customer's emotional outcome.`,
              archetypeSync: `Emphasizes the supportive ${secondary.name} influence.`
            }
          ]
        },
        role: `${brandName} acts as the trusted ${String(primary.name || 'expert').toLowerCase()} — guiding customers through ${discovery.problemSolving || 'their challenges'} with expertise and care.`,
        impact: `The combined ${primary.name || 'Primary'}/${secondary.name || 'Secondary'} archetype builds deep loyalty by making customers feel both ${String((discovery.customerEmotionalOutcome || ['confident', 'inspired']).slice(0, 2).map(o => mapStrategicCategory(o, 'emotionalOutcome')).join(' and ')).toLowerCase()}.`,
      }
    },

    values: values,

    essence: `${brandName} is ${primary.traits[0]?.toLowerCase()} ${discovery.industry || ''} powered by ${(discovery.coreValues || ['purpose'])[0]?.toLowerCase()}.`,

    identitySystem: {
      colors: colors,
      logoOptions: [
        {
          strategy: 'User Anchored',
          description: `Concept A focuses on direct visual translation of the ${discovery.brandFeel?.join(', ') || 'modern'} aesthetic requested during discovery, prioritizing immediate familiarity and industry alignment.`,
          shapes: discovery.industry?.toString().toLowerCase()?.includes('tech') 
            ? ['Geometric Grid', 'Clean Vectors', 'Angular Forms'] 
            : ['Organic Curves', 'Balanced Circles', 'Symmetrical Forms'],
          logotypes: ['Custom Wordmark', 'Minimalist Icon', 'Modern Sans-Serif'],
          symbols: [
            `${primary.name}-inspired mark`,
            discovery.industry ? `${discovery.industry} metaphor` : 'Abstract growth symbol',
            'Integration element'
          ],
          propositionalDensity: {
            surface: 'Clean geometric lines and a balanced composition.',
            semantic: `Represents the brand's commitment to ${(discovery.coreValues || ['excellence'])[0]} and ${primary.traits[0]} leadership.`,
            rationale: 'High Pd achieved by using familiar industry shapes to anchor deep core value metaphors.'
          },
          rationale: `This anchor concept ensures maximum alignment with the user's visual vision for ${brandName}.`
        },
        {
          strategy: 'System Optimized',
          description: `Concept B is a strategically optimized direction that prioritizes the ${primary.name} archetype's psychological impact, using abstract forms to maximize propositional density and long-term brand equity.`,
          shapes: ['Abstract Minimalist Form', 'Symbolic Negative Space', 'Universal Geometry'],
          logotypes: ['Bespoke Serif Wordmark', 'Abstract Monogram'],
          symbols: [
            'Metaphor of Transformation',
            'Core Essence Catalyst',
            'Synthesis of Impact'
          ],
          propositionalDensity: {
            surface: 'A singular, hyper-minimalist abstract mark.',
            semantic: `A deep synthesis of ${primary.innerNeed} and the brand's mission to ${discovery.mission || 'evolve the market'}.`,
            rationale: 'Maximized Pd by striping away all visual noise to leave only the core strategic metaphor.'
          },
          rationale: `Optimized for long-term recognition and the ${primary.name} archetype's authoritative presence.`
        }
      ],
      typography: {
        primary: {
          name: typo.primary,
          usage: 'Headings & Hero',
          platforms: ['Web', 'Mobile', 'Social', 'Print'],
          traits: [primary.traits[0], 'Geometric', 'Display'],
          description: `${primary.traits[0]}-driven style for high-impact headings and brand identity display.`
        },
        secondary: {
          name: typo.secondary,
          usage: 'Body & Supportive',
          platforms: ['Web', 'Mobile', 'Internal', 'Documents'],
          traits: ['Clean', 'Readable', 'Professional'],
          description: `Versatile and readable sans-serif for body text, supportive technical information, and functional interfaces.`
        }
      }
    },

    messaging: {
      coreMessage: `${brandName} empowers ${discovery.idealCustomers || 'its customers'} to ${(discovery.customerBenefits || ['achieve more'])[0]?.toLowerCase()} through ${discovery.differentiation || 'a unique combination of quality and innovation'}.`,
      keywords: [
        brandName,
        ...(discovery.coreValues || []).slice(0, 3),
        ...(discovery.strengths || []).slice(0, 2),
        primary.name || 'Brand'
      ].slice(0, 7)
    },

    experienceDesign: `Every ${brandName} touchpoint should evoke the ${primary.name || 'brand'} archetype — from the initial website visit to post-purchase follow-up. The experience should make customers feel ${String((discovery.customerEmotionalOutcome || ['valued', 'confident']).join(', ')).toLowerCase()}. Key principles: consistency across channels, ${String((discovery.brandFeel || ['professional'])[0] || 'professional').toLowerCase()} aesthetics, and responses that reflect ${String((discovery.coreValues || ['care'])[0] || 'care').toLowerCase()}.`,

    touchPoints: [
      { category: 'Digital', items: ['Website', 'Social Media Profiles', 'Email Marketing', 'Online Advertising', 'SEO Content'] },
      { category: 'Customer Service', items: ['Onboarding Flow', 'Support Communications', 'FAQ / Knowledge Base', 'Feedback Surveys'] },
      { category: 'Sales', items: ['Proposals & Pitches', 'Pricing Pages', 'Case Studies', 'Testimonials'] },
      { category: 'Physical', items: ['Business Cards', 'Packaging', 'Office / Store Branding', 'Event Materials'] }
    ],

    growthPrograms: [
      { name: 'Referral Engine', description: `Leverage satisfied customers to organically grow ${brandName}'s reach through structured referral incentives.` },
      { name: 'Content Authority', description: `Establish ${brandName} as a thought leader in ${discovery.industry || 'the industry'} through blogs, case studies, and educational content.` },
      { name: 'Community Building', description: `Create a loyal community around ${brandName}'s values, fostering engagement and long-term brand advocacy.` }
    ],

    partnerships: [
      { name: 'Industry Collaborations', description: `Partner with complementary brands in the ${discovery.industry || ''} space to expand reach and credibility.` },
      { name: 'Influencer Alignment', description: `Collaborate with micro-influencers whose audience aligns with ${brandName}'s ideal customer profile.` },
      { name: 'CSR Initiatives', description: `Align with social causes that reflect ${brandName}'s core values, building authenticity and community trust.` }
    ],

    customerJourney: [
      {
        phase: 'Phase 1',
        stage: 'Awareness',
        action: `Potential customers discover ${brandName} through organic search, social media, or word-of-mouth.`,
        touchpoints: ['Social Media', 'Blog Content', 'SEO', 'Referrals', 'Online Ads'],
        kpis: ['Brand Impressions', 'Website Traffic', 'Social Reach', 'Search Rankings'],
        insights: `At this stage, prospects need to immediately understand what ${brandName} stands for and why it matters to them.`
      },
      {
        phase: 'Phase 2',
        stage: 'Consideration',
        action: `Prospects evaluate ${brandName} against alternatives, exploring offerings, testimonials, and case studies.`,
        touchpoints: ['Website', 'Case Studies', 'Reviews', 'Email Nurture', 'Demo / Free Trial'],
        kpis: ['Page Views', 'Time on Site', 'Email Open Rate', 'Demo Requests'],
        insights: `Prospects are comparing options. Clear differentiation and social proof are critical at this stage.`
      },
      {
        phase: 'Phase 3',
        stage: 'Purchase',
        action: `Customer decides to engage with ${brandName}, completing a purchase or signing up.`,
        touchpoints: ['Checkout / Sign-up', 'Pricing Page', 'Sales Call', 'Payment Confirmation'],
        kpis: ['Conversion Rate', 'Cart Abandonment', 'Average Order Value', 'Sales Cycle Length'],
        insights: `Reduce friction, reinforce trust with security signals, and make the process intuitive and fast.`
      },
      {
        phase: 'Phase 4',
        stage: 'Retention',
        action: `Customer experiences ${brandName}'s product/service and forms an opinion about ongoing value.`,
        touchpoints: ['Onboarding', 'Customer Support', 'Follow-up Emails', 'Product Updates'],
        kpis: ['Customer Satisfaction', 'Support Ticket Volume', 'Repeat Purchase Rate', 'NPS Score'],
        insights: `Deliver on promises. Proactive support and personalized follow-ups build long-term loyalty.`
      },
      {
        phase: 'Phase 5',
        stage: 'Loyalty & Advocacy',
        action: `Satisfied customers become brand advocates, referring others and engaging with the community.`,
        touchpoints: ['Referral Program', 'Loyalty Rewards', 'Community', 'Exclusive Content', 'Events'],
        kpis: ['Referral Rate', 'Customer Lifetime Value', 'Review Count', 'Community Growth'],
        insights: `Turn loyalty into active advocacy. Recognize and reward your most engaged customers.`
      }
    ]
  };

  return strategy;
}
