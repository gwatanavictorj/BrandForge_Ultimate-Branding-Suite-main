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
