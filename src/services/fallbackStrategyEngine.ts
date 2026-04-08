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
  description: string;
  jungianModel: string;
  traits: string[];
  inPractice: string;
  keywords: string[]; // used for matching
}

const ARCHETYPES: ArchetypeData[] = [
  {
    name: 'Creator',
    description: 'The Creator archetype is driven by a desire to produce something of enduring value. They believe that if it can be imagined, it can be made.',
    jungianModel: 'The Creator represents the archetypal artist within us — the drive to express vision and bring new things into existence.',
    traits: ['Innovative', 'Imaginative', 'Expressive', 'Original', 'Visionary'],
    inPractice: 'The brand communicates through bold design, original content, and an emphasis on craft and quality in every touchpoint.',
    keywords: ['innovative', 'creative', 'expressive', 'design', 'art', 'build', 'craft', 'original', 'technology', 'software', 'identity-driven']
  },
  {
    name: 'Caregiver',
    description: 'The Caregiver archetype is motivated by generosity and a desire to protect and care for others.',
    jungianModel: 'The Caregiver embodies the nurturing parent — selfless, compassionate, and devoted to the well-being of others.',
    traits: ['Compassionate', 'Nurturing', 'Generous', 'Supportive', 'Trustworthy'],
    inPractice: 'The brand prioritizes customer well-being, offers exceptional support, and communicates with warmth and empathy.',
    keywords: ['care', 'health', 'support', 'nurture', 'protect', 'safe', 'medical', 'wellness', 'help', 'comfort']
  },
  {
    name: 'Ruler',
    description: 'The Ruler archetype seeks to create order and structure. They lead with authority, responsibility, and a desire for lasting impact.',
    jungianModel: 'The Ruler represents the sovereign within — the drive for control, stability, and leadership that creates order from chaos.',
    traits: ['Authoritative', 'Commanding', 'Refined', 'Decisive', 'Responsible'],
    inPractice: 'The brand positions itself as the industry leader, uses polished visuals, and communicates with confidence and exclusivity.',
    keywords: ['luxury', 'premium', 'prestige', 'leader', 'authority', 'exclusive', 'elite', 'royal', 'heritage', 'legacy']
  },
  {
    name: 'Hero',
    description: 'The Hero archetype is driven to prove their worth through courageous action and determination.',
    jungianModel: 'The Hero represents the warrior archetype — the inner drive to rise, compete, and triumph against adversity.',
    traits: ['Bold', 'Courageous', 'Determined', 'Inspiring', 'Competitive'],
    inPractice: 'The brand inspires action, showcases achievements, and positions customers as capable of overcoming challenges.',
    keywords: ['bold', 'impact', 'performance', 'strong', 'fast', 'efficient', 'achieve', 'sports', 'fitness', 'empower']
  },
  {
    name: 'Explorer',
    description: 'The Explorer archetype yearns for discovery, freedom, and the thrill of new experiences.',
    jungianModel: 'The Explorer embodies the wanderer archetype — the search for authenticity and meaning through new experiences.',
    traits: ['Adventurous', 'Independent', 'Ambitious', 'Pioneering', 'Authentic'],
    inPractice: 'The brand encourages discovery, uses expansive imagery, and promises new possibilities and self-discovery.',
    keywords: ['travel', 'adventure', 'explore', 'discover', 'freedom', 'journey', 'outdoor', 'experience', 'tourism', 'destination']
  },
  {
    name: 'Sage',
    description: 'The Sage archetype seeks truth, knowledge, and understanding. They believe that wisdom is the path to true power.',
    jungianModel: 'The Sage represents the wise mentor — the pursuit of truth, knowledge, and enlightenment through careful analysis.',
    traits: ['Wise', 'Analytical', 'Knowledgeable', 'Thoughtful', 'Expert'],
    inPractice: 'The brand leads with data, thought leadership, educational content, and positions itself as the trusted authority.',
    keywords: ['consulting', 'education', 'knowledge', 'expert', 'research', 'data', 'analytics', 'wisdom', 'professional']
  },
  {
    name: 'Magician',
    description: 'The Magician archetype transforms visions into reality. They create extraordinary experiences that feel almost magical.',
    jungianModel: 'The Magician represents the shaman archetype — the ability to transform consciousness and create new realities.',
    traits: ['Visionary', 'Transformative', 'Charismatic', 'Catalytic', 'Inspiring'],
    inPractice: 'The brand promises transformation, uses aspirational messaging, and creates experiences that feel elevated and special.',
    keywords: ['transform', 'magic', 'vision', 'innovation', 'tech-driven', 'disrupt', 'unforgettable', 'extraordinary']
  },
  {
    name: 'Everyman',
    description: 'The Everyman archetype believes in belonging, connection, and the dignity of every person.',
    jungianModel: 'The Everyman represents the common person — the desire for connection, equality, and shared human experience.',
    traits: ['Relatable', 'Down-to-earth', 'Honest', 'Friendly', 'Genuine'],
    inPractice: 'The brand uses approachable language, inclusive imagery, and positions itself as accessible to everyone.',
    keywords: ['friendly', 'approachable', 'accessible', 'affordable', 'community', 'everyone', 'simple', 'honest', 'real', 'unifying', 'belonging', 'connection', 'hub']
  },
  {
    name: 'Lover',
    description: 'The Lover archetype is driven by passion, intimacy, and the pursuit of beauty and connection.',
    jungianModel: 'The Lover represents the passionate self — the pursuit of intimacy, pleasure, and aesthetic beauty.',
    traits: ['Passionate', 'Sensual', 'Warm', 'Intimate', 'Elegant'],
    inPractice: 'The brand uses rich, sensory language and visuals, creating emotional connections and premium aesthetic experiences.',
    keywords: ['passion', 'beauty', 'fashion', 'style', 'elegant', 'romance', 'luxury', 'aesthetic', 'apparel']
  },
  {
    name: 'Jester',
    description: 'The Jester archetype lives to enjoy the moment and lighten the world with humor and spontaneity.',
    jungianModel: 'The Jester represents the trickster archetype — the desire to live joyfully and bring laughter to others.',
    traits: ['Playful', 'Humorous', 'Energetic', 'Spontaneous', 'Entertaining'],
    inPractice: 'The brand uses humor, bold colors, and irreverent messaging to stand out and make customers smile.',
    keywords: ['playful', 'vibrant', 'fun', 'entertainment', 'media', 'gaming', 'social', 'lively', 'energetic']
  },
  {
    name: 'Innocent',
    description: 'The Innocent archetype seeks happiness, goodness, and simplicity. They want to do things the right way.',
    jungianModel: 'The Innocent represents the child archetype — the belief in goodness, optimism, and a better world.',
    traits: ['Optimistic', 'Pure', 'Honest', 'Simple', 'Trustworthy'],
    inPractice: 'The brand communicates with simplicity, transparency, and a positive, wholesome tone across all channels.',
    keywords: ['natural', 'organic', 'simple', 'clean', 'pure', 'sustainable', 'wholesome', 'green', 'eco']
  },
  {
    name: 'Outlaw',
    description: 'The Outlaw archetype breaks conventions and disrupts the status quo to create radical change.',
    jungianModel: 'The Outlaw represents the rebel archetype — the refusal to conform and the desire to overturn what isn\'t working.',
    traits: ['Rebellious', 'Disruptive', 'Bold', 'Revolutionary', 'Unconventional'],
    inPractice: 'The brand challenges industry norms, uses edgy visuals, and positions itself as the bold alternative.',
    keywords: ['disrupt', 'rebel', 'bold', 'revolution', 'unconventional', 'alternative', 'edgy', 'break', 'change']
  }
];

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
  { color: 'Deep Navy', hex: '#1B2A4A', meaning: 'Trust, authority, and professionalism', application: 'Primary brand color, headers, and backgrounds', industries: ['technology', 'fintech', 'consulting', 'professional'], feels: ['professional', 'corporate', 'trustworthy'] },
  { color: 'Royal Blue', hex: '#2563EB', meaning: 'Innovation, reliability, and confidence', application: 'Call-to-actions, links, and accent elements', industries: ['technology', 'software', 'saas', 'fintech'], feels: ['modern', 'innovative', 'tech-driven'] },
  { color: 'Emerald Green', hex: '#059669', meaning: 'Growth, vitality, and prosperity', application: 'Success states, sustainability messaging', industries: ['agriculture', 'energy', 'healthcare', 'natural'], feels: ['natural', 'organic', 'sustainable'] },
  { color: 'Rich Gold', hex: '#D4A843', meaning: 'Prestige, excellence, and premium quality', application: 'Premium accents, awards, and luxury elements', industries: ['luxury', 'fashion', 'real estate', 'hospitality'], feels: ['luxury', 'premium', 'heritage', 'royal'] },
  { color: 'Crimson Red', hex: '#DC2626', meaning: 'Energy, passion, and urgency', application: 'Call-to-actions, highlights, and emphasis', industries: ['food', 'sports', 'entertainment', 'media'], feels: ['bold', 'impact', 'vibrant'] },
  { color: 'Warm Orange', hex: '#EA580C', meaning: 'Enthusiasm, creativity, and warmth', application: 'Secondary accents and engagement elements', industries: ['education', 'marketing', 'e-commerce'], feels: ['friendly', 'playful', 'approachable'] },
  { color: 'Soft Lavender', hex: '#7C3AED', meaning: 'Creativity, wisdom, and sophistication', application: 'Brand differentiation and creative elements', industries: ['beauty', 'wellness', 'creative', 'tech'], feels: ['creative', 'expressive', 'modern'] },
  { color: 'Teal', hex: '#0D9488', meaning: 'Balance, clarity, and refreshment', application: 'Information design and calming elements', industries: ['healthcare', 'wellness', 'education'], feels: ['clean', 'minimal', 'trustworthy'] },
  { color: 'Charcoal', hex: '#1F2937', meaning: 'Sophistication, strength, and elegance', application: 'Typography, backgrounds, and structural elements', industries: ['all'], feels: ['professional', 'modern', 'minimal', 'corporate'] },
  { color: 'Warm White', hex: '#FAF5F0', meaning: 'Clarity, openness, and simplicity', application: 'Backgrounds, whitespace, and breathing room', industries: ['all'], feels: ['clean', 'minimal', 'simple'] },
  { color: 'Rose Pink', hex: '#E11D48', meaning: 'Compassion, care, and femininity', application: 'Highlights, care-oriented messaging', industries: ['healthcare', 'beauty', 'fashion', 'non-profit'], feels: ['friendly', 'approachable', 'caring'] },
  { color: 'Forest Green', hex: '#166534', meaning: 'Stability, nature, and reliability', application: 'Foundation elements and eco-messaging', industries: ['agriculture', 'outdoor', 'sustainability'], feels: ['natural', 'organic', 'heritage'] },
];

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

const COMPETITOR_TEMPLATES: Record<string, { name: string; x: number; y: number }[]> = {
  'technology': [{ name: 'TechCorp Global', x: 75, y: 60 }, { name: 'InnovateTech', x: 55, y: 80 }, { name: 'DigitalFirst', x: 40, y: 45 }],
  'fintech': [{ name: 'PayStack', x: 70, y: 75 }, { name: 'Flutterwave', x: 65, y: 55 }, { name: 'Kuda Bank', x: 50, y: 65 }],
  'healthcare': [{ name: 'HealthPlus', x: 60, y: 70 }, { name: 'MedCare Pro', x: 45, y: 55 }, { name: 'WellLife', x: 70, y: 40 }],
  'education': [{ name: 'LearnHub', x: 55, y: 65 }, { name: 'EduTech Pro', x: 70, y: 50 }, { name: 'SkillForge', x: 40, y: 75 }],
  'real estate': [{ name: 'PropVest', x: 65, y: 70 }, { name: 'HomeBase', x: 50, y: 45 }, { name: 'UrbanNest', x: 75, y: 55 }],
  'e-commerce': [{ name: 'ShopEasy', x: 55, y: 60 }, { name: 'MarketPlace+', x: 70, y: 75 }, { name: 'QuickBuy', x: 40, y: 50 }],
  'default': [{ name: 'Market Leader A', x: 70, y: 65 }, { name: 'Competitor B', x: 50, y: 50 }, { name: 'Challenger C', x: 35, y: 70 }],
};

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────

function matchArchetype(discovery: BrandDiscovery): { primary: ArchetypeData; secondary: ArchetypeData } {
  const allText = [
    discovery.industry, discovery.mission, discovery.vision,
    discovery.philosophy, discovery.problemSolving,
    ...(discovery.brandFeel || []),
    ...(discovery.coreValues || []),
    ...(discovery.strengths || []),
    ...(discovery.customerBenefits || []),
    discovery.differentiation || ''
  ].filter(Boolean).join(' ').toLowerCase();

  const scores = ARCHETYPES.map(a => ({
    archetype: a,
    score: a.keywords.reduce((s, k) => s + (allText.includes(k) ? 1 : 0), 0)
  })).sort((a, b) => b.score - a.score);

  return {
    primary: scores[0].archetype,
    secondary: scores[1]?.archetype || scores[0].archetype
  };
}

function matchMaslow(discovery: BrandDiscovery): typeof MASLOW_MAP[0] {
  const allText = [
    ...(discovery.customerBenefits || []),
    ...(discovery.coreValues || []),
    ...(discovery.customerEmotionalOutcome || []),
    discovery.mission, discovery.problemSolving
  ].join(' ').toLowerCase();

  const scores = MASLOW_MAP.map(m => ({
    level: m,
    score: m.keywords.reduce((s, k) => s + (allText.includes(k) ? 1 : 0), 0)
  })).sort((a, b) => b.score - a.score);

  return scores[0].level;
}

function selectColors(discovery: BrandDiscovery): { color: string; meaning: string; application: string }[] {
  const industry = (discovery.industry || '').toLowerCase();
  const feels = (discovery.brandFeel || []).map(f => f.toLowerCase());
  const allText = [...feels, industry].join(' ');

  // Score each color
  const scored = COLOR_DATABASE.map(c => {
    let score = 0;
    c.industries.forEach(ind => { if (allText.includes(ind)) score += 2; });
    c.feels.forEach(f => { if (allText.includes(f)) score += 1; });
    return { ...c, score };
  }).sort((a, b) => b.score - a.score);

  // Pick top 4 unique colors
  const picked = scored.slice(0, 4);
  return picked.map(c => ({
    color: `${c.color} (${c.hex})`,
    meaning: c.meaning,
    application: c.application
  }));
}

function selectTypography(discovery: BrandDiscovery): string {
  const feels = (discovery.brandFeel || []).map(f => f.toLowerCase()).join(' ');
  
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
  const industry = industryValue.toLowerCase();
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
    const mappedValue = mapStrategicCategory(v, 'values');
    return {
      name: mappedValue,
      description: `${brandName} is deeply committed to ${mappedValue.toLowerCase()}, which guides every decision and interaction with customers and stakeholders.`
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
      howWeDoIt: `Through ${(discovery.deliveryModel || []).join(', ') || 'direct engagement'}, ${brandName} ensures customers receive exceptional value at every touchpoint.`,
      whereWeAre: discovery.address || 'Operating globally with a focus on delivering local impact.'
    },

    foundation: {
      mission: discovery.mission ? `The mission of ${brandName} is to ${discovery.mission.charAt(0).toLowerCase() + discovery.mission.slice(1)}` : `The mission of ${brandName} is to empower individuals and organizations by providing best-in-class ${industryLabel} solutions that drive meaningful results.`,
      vision: discovery.vision ? `${brandName}'s vision is to ${discovery.vision.charAt(0).toLowerCase() + discovery.vision.slice(1)}` : `${brandName}'s vision is to become the most trusted and innovative ${industryLabel} brand, setting new standards for excellence and impact.`,
      philosophy: discovery.philosophy ? `${brandName}'s philosophy is rooted in the belief that ${discovery.philosophy.charAt(0).toLowerCase() + discovery.philosophy.slice(1)}` : `${brandName}'s philosophy is rooted in the belief that every interaction is an opportunity to create lasting value, combining purpose with precision.`
    },

    coreIdea: `${brandName} transforms ordinary gatherings into extraordinary, unforgettable cultural experiences, fostering connection and shaping the ${discovery.address ? 'city\'s' : 'industry\'s'} pulse.`,

    story: discovery.brandStory || (
      `The global ${industryLabel} is undergoing a profound shift, creating a significant demand for ${discovery.idealCustomers || 'visionary solutions'}. ` +
      `This evolution presents a unique opportunity for ${((discovery.customerBenefits || ['excellence'])[0] || 'excellence').toLowerCase()} to gain the momentum and clarity needed to lead. ` +
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
      narrative: `The ideal ${brandName} customer is someone who values ${(discovery.customerEmotionalOutcome || ['quality', 'trust']).slice(0, 2).map(o => mapStrategicCategory(o, 'emotionalOutcome')).join(' and ').toLowerCase()}. They have tried other solutions but found them lacking. When they discover ${brandName}, they feel ${(discovery.customerEmotionalOutcome || ['confident', 'valued']).map(o => mapStrategicCategory(o, 'emotionalOutcome')).join(' and ').toLowerCase()}. That is the transformation ${brandName} delivers.`
    },

    marketPosition: {
      axes: {
        x: `${(discovery.strengths || ['Innovation'])[0]} vs. Traditional Approach`,
        y: 'Premium Experience vs. Accessible Pricing'
      },
      quadrant: `${brandName} occupies the upper-right quadrant — combining ${(discovery.strengths || ['innovation'])[0]?.toLowerCase()} with a premium customer experience.`,
      statement: `${brandName} is positioned as the ${primary.name.toLowerCase()} brand in the ${discovery.industry || 'market'} space, distinguished by ${discovery.differentiation || 'its unique approach and unwavering commitment to quality'}.`,
      position: { x: 72, y: 68 },
      competitors: competitors,
      analysis: `In the ${discovery.industry || 'target'} landscape, ${brandName} differentiates through ${discovery.differentiation || (discovery.strengths || ['quality']).slice(0, 2).join(' and ')}. While competitors focus on standard offerings, ${brandName} occupies a unique position by combining ${primary.name.toLowerCase()} energy with ${secondary.name.toLowerCase()} values.`,
      gapHighlight: `The market gap ${brandName} fills is the lack of brands that combine ${(discovery.strengths || ['quality', 'affordability']).slice(0, 2).join(' and ').toLowerCase()} — most competitors choose one or the other.`
    },

    archetype: {
      primary: {
        name: primary.name,
        description: primary.description,
        jungianModel: primary.jungianModel,
        traits: primary.traits,
        inPractice: `For ${brandName}, the ${primary.name} archetype manifests through ${primary.inPractice.toLowerCase()}`
      },
      secondary: {
        name: secondary.name,
        description: secondary.description,
        jungianModel: secondary.jungianModel,
        traits: secondary.traits,
        inPractice: `As a secondary influence, the ${secondary.name} archetype gives ${brandName} an added dimension: ${secondary.inPractice.toLowerCase()}`
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
              contentTemplate: `Imagine a world where ${discovery.problemSolving || 'challenges'} are a thing of the past. With ${brandName}, we bring ${primary.traits[0].toLowerCase()} innovation to your doorstep.`,
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
              contentTemplate: `Welcome to the ${brandName} family. We are honored to support your journey towards ${(discovery.customerBenefits || ['success'])[0].toLowerCase()}.`,
              guidelines: `Lead with genuine ${secondary.traits[1]} warmth. Focus on the customer's emotional outcome.`,
              archetypeSync: `Emphasizes the supportive ${secondary.name} influence.`
            }
          ]
        },
        role: `${brandName} acts as the trusted ${primary.name.toLowerCase()} — guiding customers through ${discovery.problemSolving || 'their challenges'} with expertise and care.`,
        impact: `The combined ${primary.name}/${secondary.name} archetype builds deep loyalty by making customers feel both ${(discovery.customerEmotionalOutcome || ['confident', 'inspired']).slice(0, 2).join(' and ').toLowerCase()}.`
      }
    },

    values: values,

    essence: `${brandName} is ${primary.traits[0]?.toLowerCase()} ${discovery.industry || ''} powered by ${(discovery.coreValues || ['purpose'])[0]?.toLowerCase()}.`,

    identitySystem: {
      colors: colors,
      logoDirection: {
        description: `The visual identity for ${brandName} should embody the ${primary.name} archetype — ${primary.traits.slice(0, 2).join(' and ').toLowerCase()} in character, with a strong focus on ${(discovery.brandFeel || ['modernity'])[0]?.toLowerCase()}.`,
        shapes: discovery.industry?.toLowerCase()?.includes('tech') 
          ? ['Geometric Grid', 'Clean Vectors', 'Angular Forms'] 
          : ['Organic Curves', 'Balanced Circles', 'Symmetrical Forms'],
        logotypes: ['Custom Wordmark', 'Minimalist Icon', 'Modern Sans-Serif'],
        symbols: [
          `${primary.name}-inspired mark`,
          discovery.industry ? `${discovery.industry} metaphor` : 'Abstract growth symbol',
          'Integration element'
        ],
        rationale: `These visual choices directly support the ${primary.name} strategy of ${primary.traits[0]?.toLowerCase() || 'bold'} leadership and the brand's mission to ${(discovery.mission || 'deliver excellence').toLowerCase().slice(0, 50)}...`
      },
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
        primary.name
      ].slice(0, 7)
    },

    experienceDesign: `Every ${brandName} touchpoint should evoke the ${primary.name} archetype — from the initial website visit to post-purchase follow-up. The experience should make customers feel ${(discovery.customerEmotionalOutcome || ['valued', 'confident']).join(', ').toLowerCase()}. Key principles: consistency across channels, ${(discovery.brandFeel || ['professional'])[0]?.toLowerCase()} aesthetics, and responses that reflect ${(discovery.coreValues || ['care'])[0]?.toLowerCase()}.`,

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
