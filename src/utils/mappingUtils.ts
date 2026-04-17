import { 
  INDUSTRIES, STAGES, DELIVERY_MODELS, BENEFITS, 
  VALUES, STRENGTHS, WEAKNESSES, BRAND_FEELS, EMOTIONAL_OUTCOMES 
} from '../data/strategicData';

export { 
  INDUSTRIES, STAGES, DELIVERY_MODELS, BENEFITS, 
  VALUES, STRENGTHS, WEAKNESSES, BRAND_FEELS, EMOTIONAL_OUTCOMES 
};

const KEYWORD_MAPS: { [key: string]: { [key: string]: string[] } } = {
  industry: {
    "Travel & Tourism": ["travel", "galactic", "space", "trip", "tourism", "hotel", "resort", "airline", "exploration", "vacation", "journey"],
    "Fintech / Financial Services": ["bank", "money", "fintech", "finance", "crypto", "blockchain", "payment", "investment", "wealth", "trading"],
    "Healthcare / Medical": ["doctor", "hospital", "health", "medical", "nurse", "clinic", "therapy", "patient", "biomedical", "pharma"],
    "Education / EdTech": ["school", "learn", "course", "education", "tutor", "university", "academy", "training", "classroom", "student"],
    "Technology / Software": ["software", "app", "technology", "saas", "cloud", "digital", "developer", "hardware", "ai", "artificial intelligence", "coding"],
  },
  stage: {
    "Idea stage": ["sketch", "thought", "napkin", "concept", "imagining", "dreaming", "beginning", "startup", "founder", "garage", "thinking", "starting out"],
    "MVP / Early stage": ["pilot", "prototype", "testing", "beta", "launching", "beginning", "v1", "version 1"],
    "Growing": ["expanding", "momentum", "hiring", "traction", "sales", "revenue", "upward"],
    "Scaling": ["global", "expansion", "franchising", "mass", "exponential"],
    "Established": ["mature", "legacy", "long-standing", "authority", "market leader"]
  },
  deliveryModel: {
    "Direct sales": ["whatsapp", "dm", "social media", "direct", "person", "hand-to-hand"],
    "E-commerce": ["online", "web", "website", "shop", "digital storefront", "cart"],
    "SaaS (Software as a Service)": ["cloud", "portal", "platform", "dashboard", "online tool"],
    "Consultancy": ["advice", "guide", "teaching", "coaching", "session", "strategic"]
  },
  values: {
    "Integrity": ["real", "honest", "truth", "genuine", "ethical", "doing the right thing", "folks", "sincere", "transparent"],
    "Customer-centricity": ["user first", "people person", "client focused", "listening"],
    "Inclusivity / Diversity": ["for everyone", "all people", "global", "inclusive", "diverse"],
    "Social impact": ["better world", "giving back", "community", "charity"]
  },
  brandFeel: {
    "Royal, Luxury & Prestige": ["royalty", "kings", "queens", "premium", "exquisite", "high-end", "elite"],
    "Modern, Minimal & Clean": ["sharp", "minimal", "clean", "slick", "futuristic", "simple"],
    "Friendly & Approachable": ["warm", "hug", "friend", "kind", "easy", "down-to-earth"]
  },
  emotionalOutcome: {
    "Exclusive & Privileged": ["royalty", "vip", "special", "unique", "one of a kind", "elite"],
    "Safe & Secure": ["peace of mind", "protection", "no worries", "guaranteed"],
    "Excited & Inspired": ["pumped", "motivated", "ready to go", "inspired", "creative"]
  }
};

/**
 * Universal semantic mapper that resolves niche or manual 'Other' inputs 
 * to their closest professional strategic category.
 */
export function mapStrategicCategory(input: string, category: keyof typeof KEYWORD_MAPS): string {
  if (!input) return "Other";
  
  const lowerInput = input.toLowerCase();
  
  // 1. Direct match check
  const list = {
    industry: INDUSTRIES,
    stage: STAGES,
    deliveryModel: DELIVERY_MODELS,
    values: VALUES,
    brandFeel: BRAND_FEELS,
    emotionalOutcome: EMOTIONAL_OUTCOMES
  }[category];

  if (list) {
    for (const item of list) {
      if (lowerInput === item.toLowerCase()) return item;
    }
  }
  
  // 2. Keyword mapping
  const maps = KEYWORD_MAPS[category];
  if (maps) {
    for (const [officialTerm, keywords] of Object.entries(maps)) {
      if (keywords.some(kw => lowerInput.includes(kw))) {
        return officialTerm;
      }
    }
  }
  
  // 3. Fallback: If it's a professional phrase but doesn't match a silo, keep it
  return input;
}
