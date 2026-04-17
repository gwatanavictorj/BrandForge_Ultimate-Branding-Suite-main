/**
 * Fallback Brand Strategy Engine
 * 
 * Generates a complete BrandStrategy using rule-based logic, 
 * lookup tables, and deterministic mapping — no AI model required.
 */

import { BrandDiscovery, BrandStrategy } from '../types';
import { mapStrategicCategory } from '../utils/mappingUtils';
import { 
  ARCHETYPES, ArchetypeData, STRATEGIC_WEIGHTS, 
  COLOR_DATABASE, COLOR_WHEEL, TYPOGRAPHY, 
  MASLOW_MAP, COMPETITOR_TEMPLATES, 
  HYGIENE_KEYWORDS, INDUSTRY_CONTEXT_MAP,
  ColorPalette
} from '../data/strategicData';

/**
 * Helper to retrieve full archetype data by name
 */
export function getArchetypeByName(name: string): ArchetypeData | undefined {
  return ARCHETYPES.find(a => a.name === name);
}

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
