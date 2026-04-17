export interface BrandDiscovery {
  // Section 2: Client Details
  email: string;
  fullName: string;
  ownerTitle: string;
  phone: string;
  canContact: boolean;

  // Section 3: Brand Profile
  registeredName: string;
  tagline?: string;
  address: string;
  dateEstablished: string;
  industry: string;
  industryOther?: string;
  stage: string;
  stageOther?: string;

  // Section 4: Your Story
  mission: string;
  vision: string;
  philosophy: string;
  problemSolving: string;
  productsServices: string;
  idealCustomers: string;

  // Section 5: How Your Business Works
  deliveryModel: string[];
  deliveryModelOther?: string;
  customerBenefits: string[];
  customerBenefitsOther?: string;

  // Section 6: Your Brand Foundation
  coreValues: string[];
  coreValuesOther?: string;
  strengths: string[];
  strengthsOther?: string;
  weaknesses: string[];
  weaknessesOther?: string;

  // Section 7: Brand Identity
  brandNameLogo: string;
  brandStory: string;
  brandFeel: string[];
  brandFeelOther?: string;
  customerEmotionalOutcome: string[];
  customerEmotionalOutcomeOther?: string;
  colorSymbols: string;

  // Section 8: Competition
  competitors: string;
  competitorAnalysis: string;
  differentiation: string;

  // Section 9: Project Details
  deadline: string;
  futurePlans: string;

  // Legacy/Compatibility fields (if needed by other tools)
  name: string; // Map from registeredName or brandNameLogo
  personality: string; // Map from brandFeel
  tone?: string;
}

export interface ToneUseCase {
  category: 'marketing' | 'announcement' | 'acknowledgement' | 'support' | 'internal';
  platform: string;
  targetAudience: string;
  contentTemplate: string;
  guidelines: string;
  archetypeSync: string;
}

export interface BrandStrategy {
  isFallback?: boolean;
  overview: {
    whoWeAre: string;
    whatWeDo: string;
    howWeDoIt: string;
    whereWeAre: string;
  };
  foundation: {
    mission: string;
    vision: string;
    philosophy: string;
  };
  coreIdea: string;
  story: string;
  audience: {
    groups: {
      name: string;
      description: string;
      needs: string;
      painPoints: string;
    }[];
    maslowLevel: string;
    maslowExplanation: string;
    maslowNeedType: string;
    narrative: string;
  };
  marketPosition: {
    axes: { x: string; y: string };
    quadrant: string;
    statement: string;
    position: { x: number; y: number };
    competitors: { 
      name: string; 
      x: number; 
      y: number;
      website?: string;
      socials?: { platform: string; url: string }[];
      location?: string;
      established?: string;
    }[];
    analysis: string;
    gapHighlight: string;
  };
  archetype: {
    primary: {
      name: string;
      innerNeed?: string;
      description: string;
      jungianModel: string;
      goal: string;
      fear: string;
      weakness: string;
      talent: string;
      personalityNarrative: string;
      archetypeStatement: string;
      traits: string[];
      inPractice: { label: string; content: string }[];
      strategicRationale: string;
    },
    secondary: {
      name: string;
      innerNeed?: string;
      description: string;
      jungianModel: string;
      goal: string;
      fear: string;
      weakness: string;
      talent: string;
      personalityNarrative: string;
      archetypeStatement: string;
      traits: string[];
      inPractice: { label: string; content: string }[];
      strategicRationale: string;
    },
    tertiary: {
      name: string;
      innerNeed?: string;
      description: string;
      jungianModel: string;
      goal: string;
      fear: string;
      weakness: string;
      talent: string;
      personalityNarrative: string;
      archetypeStatement: string;
      traits: string[];
      inPractice: { label: string; content: string }[];
      strategicRationale: string;
    };
    behavior: {
      tone: {
        description: string;
        framework: string;
        examples: string[];
        useCases: ToneUseCase[];
      };
      role: string;
      impact: string;
    };
  };
  values: {
    name: string;
    description: string;
  }[];
  essence: string;
  identitySystem: {
    colors: { color: string; role: string; meaning: string; application: string }[];
    logoOptions: {
      strategy: 'User Anchored' | 'System Optimized';
      description: string;
      shapes: string[];
      logotypes: string[];
      symbols: string[];
      propositionalDensity: {
        surface: string; // Pv: What it is visually
        semantic: string; // Ps: What it means strategically
        rationale: string; // The Pd argument
      };
      rationale: string;
    }[];
    typography: {
      primary: {
        name: string;
        usage: string;
        platforms: string[];
        traits: string[];
        description: string;
      };
      secondary: {
        name: string;
        usage: string;
        platforms: string[];
        traits: string[];
        description: string;
      };
    };
  };
  messaging: {
    coreMessage: string;
    keywords: string[];
  };
  experienceDesign: string;
  touchPoints: {
    category: string;
    items: string[];
  }[];
  growthPrograms: {
    name: string;
    description: string;
  }[];
  partnerships: {
    name: string;
    description: string;
  }[];
  customerJourney: {
    phase: string;
    stage: string;
    action: string;
    touchpoints: string[];
    kpis: string[];
    insights: string;
  }[];
}

export interface BrandSystem {
  colors: string[];
  typography: {
    primary: string;
    secondary: string;
  };
  logoUsage?: {
    clearSpace: string;
    minimumSize: string;
  };
  gridSpacing?: {
    columns: string;
    baseUnit: string;
  };
  imagery?: {
    style: string;
  };
  uiElements?: {
    borderRadius: string;
    shadows: string;
  };
}

export interface LogoNoun {
  word: string;
  anchor: string;
  territory: 'Premium' | 'Tech-Forward' | 'Human-Centric' | 'Bold/Disruptive' | string;
}

export interface LogoNounGroup {
  realWords: (string | LogoNoun)[];
  inventedWords: (string | LogoNoun)[];
  compoundWords: (string | LogoNoun)[];
  metaphoricalNouns: (string | LogoNoun)[];
  abstractConstructs: (string | LogoNoun)[];
}

export interface ConceptSmush {
  pair: [string, string];
  description: string;
}

export interface LogoAssistantData {
  nouns: LogoNounGroup;
  smushes: ConceptSmush[];
  selectedSmushIndex?: number;
  concepts: string[];
  variations: string[];
  mockupHighlights: string[];
  inspirationStyle?: string;
  inspirationUrl?: string;
  densityFeedback?: {
    surfaceElements: string[];
    semanticMeanings: string[];
    densityScore: number;
    rationale: string;
  };
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
}

export interface ProjectTracking {
  progress: number;
  status: 'planning' | 'in-progress' | 'review' | 'completed';
  lastUpdated: number;
  lastActiveStep?: string;
}

export interface AppNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  link?: string;
}

export interface BrandProject {
  id: string;
  ownerId: string;
  name: string;
  client?: string;
  discovery?: BrandDiscovery;
  strategy?: BrandStrategy;
  system?: BrandSystem;
  logoAssistant?: LogoAssistantData;
  tasks: Task[];
  tracking: ProjectTracking;
  selectedTools: ('discovery' | 'strategy' | 'logo' | 'system' | 'guide')[];
  createdAt: number;
  isDeleted?: boolean;
  deletedAt?: number;
}
