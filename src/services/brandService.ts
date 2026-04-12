import { BrandDiscovery, BrandStrategy, LogoNounGroup, ConceptSmush, LogoAssistantData } from "../types";
import { 
  INDUSTRIES, STAGES, DELIVERY_MODELS, BENEFITS, 
  VALUES, STRENGTHS, WEAKNESSES, BRAND_FEELS, EMOTIONAL_OUTCOMES 
} from "../utils/mappingUtils";
import { generateFallbackStrategy } from './fallbackStrategyEngine';
import { AIProvider, getAIKeys } from './aiProvider';

const getAI = () => {
  const settings = getAIKeys();
  return new AIProvider({
    provider: settings.activeProvider,
    apiKey: settings[settings.activeProvider],
    model: settings.models[settings.activeProvider]
  });
};

export const brandService = {
  async generateNouns(discovery: BrandDiscovery, strategy: BrandStrategy): Promise<LogoNounGroup> {
    const ai = getAI();
    const response = await ai.generateContent(
      `# ROLE
      You are a World-Class Brand Naming & Strategy Consultant. Your goal is to generate a list of 50 "Brand Nouns" (name-ready constructs) that are both linguistically powerful and visually sketchable.

      # BRAND DATA (PRIMARY)
      Name: ${discovery.brandNameLogo || discovery.registeredName}
      Industry: ${discovery.industry}
      Archetype: ${strategy.archetype.primary.name}
      Core Idea: ${strategy.coreIdea}
      Mission: ${strategy.foundation.mission}
      Values: ${strategy.values.map(v => v.name).join(", ")}
      Emotional Outcome: ${discovery.customerEmotionalOutcome.join(", ")}

      # THE Naming METHODOLOGY
      1. ROOT WORD BANK (SEMANTIC FOUNDATION): Extract core semantic markers from the data above based on Function, Benefit, Emotion, Industry, and Metaphor.
      2. MORPHOLOGICAL TRANSFORMATION: Expand roots using Prefixes (neo-, omni-, hyper-), Suffixes (-ly, -ify, -io, -ex), Alterations (connect -> connex), and Blending (travel + orbit -> Travorbit).
      3. STRUCTURAL PATTERNS: Use templates like [Verb]+[Noun], [Emotion]+[Object], [Metaphor]+[Tech suffix].
      4. THEMATIC TERRITORIES: Categorize into:
         - PREMIUM: Latin/Greek-inspired (High sophistication).
         - TECH-FORWARD: Abstract/Invented (Efficiency and disruption).
         - HUMAN-CENTRIC: Soft/Emotional (Approachable and caring).
         - BOLD/DISRUPTIVE: Sharp/Aggressive (Memorability).

      # MANDATORY VISUAL-NAMING BRIDGE
      Every noun generated MUST have a clear "Visual Anchor" (a sketchable core). 
      - If it's an invented word, it should semantically or phonetically evoke a physical object (e.g., 'Aquos' -> Water).
      - If it's a compound word, both parts should ideally be visual objects (e.g., 'HappyNest' -> Bird + Smile).

      # SCORING & CONSTRAINTS
      - Return only high-scoring candidates (Memorability, Pronunciation, Brand Fit).
      - Must be easy to pronounce globally (VCV patterns preferred).
      - Avoid industry clichés (No "-ify" if it's too common in the sector).
      - Return exactly 50 total nouns.

      Return a JSON object:
      {
        "realWords": [{"word": "word", "anchor": "visual anchor", "territory": "TerritoryName"}],
        "inventedWords": [{"word": "word", "anchor": "visual anchor", "territory": "TerritoryName"}],
        "compoundWords": [{"word": "word", "anchor": "visual anchor", "territory": "TerritoryName"}],
        "metaphoricalNouns": [{"word": "word", "anchor": "visual anchor", "territory": "TerritoryName"}],
        "abstractConstructs": [{"word": "word", "anchor": "visual anchor", "territory": "TerritoryName"}]
      }`,
      {
        type: "object",
        properties: {
          realWords: { type: "array", items: { type: "object", properties: { word: { type: "string" }, anchor: { type: "string" }, territory: { type: "string" } }, required: ["word", "anchor", "territory"] } },
          inventedWords: { type: "array", items: { type: "object", properties: { word: { type: "string" }, anchor: { type: "string" }, territory: { type: "string" } }, required: ["word", "anchor", "territory"] } },
          compoundWords: { type: "array", items: { type: "object", properties: { word: { type: "string" }, anchor: { type: "string" }, territory: { type: "string" } }, required: ["word", "anchor", "territory"] } },
          metaphoricalNouns: { type: "array", items: { type: "object", properties: { word: { type: "string" }, anchor: { type: "string" }, territory: { type: "string" } }, required: ["word", "anchor", "territory"] } },
          abstractConstructs: { type: "array", items: { type: "object", properties: { word: { type: "string" }, anchor: { type: "string" }, territory: { type: "string" } }, required: ["word", "anchor", "territory"] } }
        },
        required: ["realWords", "inventedWords", "compoundWords", "metaphoricalNouns", "abstractConstructs"]
      }
    );
    return JSON.parse(response || "{}");
  },

  async generateConceptSmushes(discovery: BrandDiscovery, strategy: BrandStrategy, nouns: LogoNounGroup): Promise<ConceptSmush[]> {
    const ai = getAI();
    const normalizedNouns = {
      realWords: nouns.realWords.map(n => typeof n === 'string' ? n : n.word),
      inventedWords: nouns.inventedWords.map(n => typeof n === 'string' ? n : n.word),
      compoundWords: nouns.compoundWords.map(n => typeof n === 'string' ? n : n.word),
      metaphoricalNouns: nouns.metaphoricalNouns.map(n => typeof n === 'string' ? n : n.word),
      abstractConstructs: nouns.abstractConstructs.map(n => typeof n === 'string' ? n : n.word),
    };

    const response = await ai.generateContent(
      `# ROLE
      You are a Senior Logo Designer specializing in the "Concept Smush" method. You take two disparate "Brand Nouns" (naming constructs) and merge them into a clever, minimalist logo mark.

      # TASK
      - Pair two nouns from the provided naming categories.
      - Describe the visual "Smush" (how the underlying visual anchors of these names merge).
      - Ensure the pairings reflect the ${strategy.archetype.primary.name} spirit and the brand idea: ${strategy.coreIdea}.
      - Total: 5 unique smushes.

      # LINGUISTIC NOUNS (INPUT)
      ${JSON.stringify(normalizedNouns)}

      # INSTRUCTIONS FOR LINGUISTIC SMUSHING
      - If a noun is an Invented Word (e.g., 'Aurex'), use its phonetic/semantic core (e.g., 'Gold/Sun') for the visual merge.
      - If it's a Compound Word (e.g., 'HappyNest'), you can use either or both parts.
      
      Return a JSON array of objects: 
      [{"pair": ["noun1", "noun2"], "description": "visual merging description"}]`,
      {
        type: "array",
        items: {
          type: "object",
          properties: {
            pair: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 2 },
            description: { type: "string" }
          },
          required: ["pair", "description"]
        }
      }
    );
    return JSON.parse(response || "[]");
  },

  async generateLogoConcepts(discovery: BrandDiscovery, strategy: BrandStrategy): Promise<string[]> {
    const ai = getAI();
    const response = await ai.generateContent(
      `Provide 3 expansive strategic logo design directions (titles + detailed visual rationale) based on:
      Archetype: ${strategy.archetype.primary.name}
      Logo Direction Prompt: ${strategy.identitySystem.logoDirection.description}
      Symbols to use: ${strategy.identitySystem.logoDirection.symbols?.join(', ')}
      
      These should be more descriptive, text-based strategic directions.`,
      {
        type: "array",
        items: { type: "string" }
      }
    );
    return JSON.parse(response || "[]");
  },

  async generateLogoVariations(discovery: BrandDiscovery, strategy: BrandStrategy): Promise<string[]> {
    const ai = getAI();
    const response = await ai.generateContent(
      `# ROLE
      You are a Logo Systems Designer specializing in adaptive brand identities. Your task is to define the specific LOGO VARIATIONS (lockups) this brand needs based on its primary touchpoints.

      # TASK
      - Analyze the brand's industry, products, and touchpoints.
      - Generate 6-8 specific logo lockups/variations required for a complete identity.
      - Each variation should include a TITLE and a brief USAGE RATIONALE tied to a touchpoint.
      - Constraints: Variations must be adaptive (e.g., 'Horizontal Lockup for Web Header', 'Icon Stick for Social Profile', 'Simplified Monotone for Merch').

      # BRAND DATA
      Industry: ${discovery.industry}
      Touchpoints: ${strategy.touchPoints.map(t => `${t.category}: ${t.items.join(", ")}`).join("; ")}
      Archetype: ${strategy.archetype.primary.name}
      
      Return a JSON array of strings: ["Variation Title: Usage Rationale"]`,
      {
        type: "array",
        items: { type: "string" }
      }
    );
    return JSON.parse(response || "[]");
  },

  async generateMockupHighlights(discovery: BrandDiscovery, strategy: BrandStrategy): Promise<string[]> {
    const ai = getAI();
    const response = await ai.generateContent(
      `# ROLE
      You are a Senior Brand Identity Designer. Your task is to suggest the most high-impact MOCKUP SCENARIOS for a professional brand presentation.

      # TASK
      - Analyze the industry, business model, and touchpoints.
      - Propose 6-8 specific, high-fidelity mockup types (e.g., 'Industrial Steel Signage', 'Premium Matte Packaging', 'Mobile UI with Glassmorphism').
      - Ensure they are directly relevant to ${discovery.industry} and the brand's archetype (${strategy.archetype.primary.name}).

      # BRAND DATA
      Industry: ${discovery.industry}
      Touchpoints: ${strategy.touchPoints.map(t => `${t.category}: ${t.items.join(", ")}`).join("; ")}
      Products/Services: ${discovery.productsServices}
      
      Return a JSON array of strings: ["Mockup Type"]`,
      {
        type: "array",
        items: { type: "string" }
      }
    );
    return JSON.parse(response || "[]");
  },

  async generateLogoInspiration(discovery: BrandDiscovery, strategy: BrandStrategy, data: LogoAssistantData): Promise<string> {
    const settings = getAIKeys();
    const config = {
      provider: settings.activeProvider,
      apiKey: settings[settings.activeProvider as keyof typeof settings] as string,
      model: settings.models[settings.activeProvider as keyof typeof settings] as string
    };
    
    const provider = new AIProvider(config);
    // Choose the best 'Smush' or Noun to lead the prompt
    const selectedSmush = data.selectedSmushIndex !== undefined ? data.smushes[data.selectedSmushIndex] : data.smushes[0];
    const leadConcept = selectedSmush?.description || 
                       `${data.nouns.realWords[0] || ''}, ${data.nouns.metaphoricalNouns[0] || ''}, ${data.nouns.inventedWords[0] || ''}`;
    
    const colors = strategy.identitySystem.colors.map(c => c.color).join(", ");
    const style = data.inspirationStyle || "Minimalist and Modern";

    // Optimized, concise prompt for Image Generators (DALL-E 3 and Pollinations)
    const prompt = `Professional logo design mockup for "${discovery.brandNameLogo || discovery.registeredName}". 
    Visual Theme: ${style}. 
    Concept: ${leadConcept}. 
    Palette: ${colors}. 
    Execution: Minimalist, vector-style, centered on clean background, professional lighting. 
    Archetype: ${strategy.archetype.primary.name}.`;

    try {
      const imageUrl = await provider.generateImage(prompt);
      if (!imageUrl) throw new Error("Generator returned empty URL");
      return imageUrl;
    } catch (e) {
      console.error("Brand Service Image Error:", e);
      return "";
    }
  },

  async generateUsageGuide(discovery: BrandDiscovery, strategy: BrandStrategy, system: any): Promise<string> {
    const ai = getAI();
    const response = await ai.generateContent(
      `Generate a comprehensive, professional Brand Usage Guide in Markdown format for:
      Name: ${discovery.brandNameLogo || discovery.registeredName}
      
      Strategic Foundation:
      - Mission: ${strategy.foundation.mission}
      - Vision: ${strategy.foundation.vision}
      - Core Idea: ${strategy.coreIdea}
      - Archetype: ${strategy.archetype.primary.name} (${strategy.archetype.secondary.name})
      
      Visual Identity:
      - Colors: ${strategy.identitySystem.colors.map(c => `${c.color} (${c.meaning})`).join(", ")}
      - Typography: ${system.typography.primary} — ${system.typography.primaryTraits[0]}-driven geometric style for high-impact headings and identity-focused display. | Secondary: ${system.typography.secondary} — Clean, readable, and professional sans-serif for body text and supportive technical information.
      - Logo Direction: ${strategy.identitySystem.logoDirection}
      
      The guide should include:
      1. Brand Introduction
      2. Core Strategy (Mission, Vision, Idea)
      3. Brand Voice & Archetype
      4. Visual Standards (Colors, Typography)
      5. Practical Do's and Don'ts for the Brand Identity.`
    );
    return response || "";
  },

  async extractDiscoveryData(text: string): Promise<BrandDiscovery> {
    const ai = getAI();
    const response = await ai.generateContent(
      `Extract brand discovery information from the following text. 
      If a piece of information is missing, provide an empty string for strings or an empty array for arrays. 
      DO NOT return null values.
      
      Text to analyze:
      "${text}"`,
      {
        type: "object",
        properties: {
          email: { type: "string" },
          fullName: { type: "string" },
          ownerTitle: { type: "string" },
          phone: { type: "string" },
          canContact: { type: "boolean" },
          registeredName: { type: "string" },
          tagline: { type: "string" },
          address: { type: "string" },
          dateEstablished: { type: "string" },
          industry: { type: "string" },
          stage: { type: "string" },
          mission: { type: "string" },
          vision: { type: "string" },
          philosophy: { type: "string" },
          problemSolving: { type: "string" },
          productsServices: { type: "string" },
          idealCustomers: { type: "string" },
          deliveryModel: { type: "array", items: { type: "string" } },
          customerBenefits: { type: "array", items: { type: "string" } },
          coreValues: { type: "array", items: { type: "string" } },
          strengths: { type: "array", items: { type: "string" } },
          weaknesses: { type: "array", items: { type: "string" } },
          brandNameLogo: { type: "string" },
          brandStory: { type: "string" },
          brandFeel: { type: "array", items: { type: "string" } },
          customerEmotionalOutcome: { type: "array", items: { type: "string" } },
          colorSymbols: { type: "string" },
          competitors: { type: "string" },
          competitorAnalysis: { type: "string" },
          differentiation: { type: "string" },
          deadline: { type: "string" },
          futurePlans: { type: "string" }
        }
      }
    );
    const parsed = JSON.parse(response || "{}");
    
    // Ensure no nulls in the final object
    const cleanValue = (val: any, fallback: any) => (val === null || val === undefined) ? fallback : val;

    return {
      email: cleanValue(parsed.email, ""),
      fullName: cleanValue(parsed.fullName, ""),
      ownerTitle: cleanValue(parsed.ownerTitle, ""),
      phone: cleanValue(parsed.phone, ""),
      canContact: cleanValue(parsed.canContact, true),
      registeredName: cleanValue(parsed.registeredName, ""),
      tagline: cleanValue(parsed.tagline, ""),
      address: cleanValue(parsed.address, ""),
      dateEstablished: cleanValue(parsed.dateEstablished, ""),
      industry: cleanValue(parsed.industry, ""),
      industryOther: "",
      stage: cleanValue(parsed.stage, ""),
      stageOther: "",
      mission: cleanValue(parsed.mission, ""),
      vision: cleanValue(parsed.vision, ""),
      philosophy: cleanValue(parsed.philosophy, ""),
      problemSolving: cleanValue(parsed.problemSolving, ""),
      productsServices: cleanValue(parsed.productsServices, ""),
      idealCustomers: cleanValue(parsed.idealCustomers, ""),
      deliveryModel: cleanValue(parsed.deliveryModel, []),
      deliveryModelOther: "",
      customerBenefits: cleanValue(parsed.customerBenefits, []),
      customerBenefitsOther: "",
      coreValues: cleanValue(parsed.coreValues, []),
      coreValuesOther: "",
      strengths: cleanValue(parsed.strengths, []),
      strengthsOther: "",
      weaknesses: cleanValue(parsed.weaknesses, []),
      weaknessesOther: "",
      brandNameLogo: cleanValue(parsed.brandNameLogo, ""),
      brandStory: cleanValue(parsed.brandStory, ""),
      brandFeel: cleanValue(parsed.brandFeel, []),
      brandFeelOther: "",
      customerEmotionalOutcome: cleanValue(parsed.customerEmotionalOutcome, []),
      customerEmotionalOutcomeOther: "",
      colorSymbols: cleanValue(parsed.colorSymbols, ""),
      competitors: cleanValue(parsed.competitors, ""),
      competitorAnalysis: cleanValue(parsed.competitorAnalysis, ""),
      differentiation: cleanValue(parsed.differentiation, ""),
      deadline: cleanValue(parsed.deadline, ""),
      futurePlans: cleanValue(parsed.futurePlans, ""),
      name: cleanValue(parsed.brandNameLogo || parsed.registeredName, ""),
      personality: (cleanValue(parsed.brandFeel, [])).join(", "),
      tone: "Professional"
    };
  },

  async generateBrandStrategy(discovery: BrandDiscovery, currentStrategy?: BrandStrategy, allowFallback = true): Promise<BrandStrategy> {
    const inputData = {
      brand_name: discovery.brandNameLogo || discovery.registeredName,
      tagline: discovery.tagline || "",
      industry: (discovery.industry === 'Other' && discovery.industryOther) ? discovery.industryOther : discovery.industry,
      category: (discovery.industry === 'Other' && discovery.industryOther) ? discovery.industryOther : discovery.industry,
      business_model: discovery.stage,
      stage: discovery.stage,
      mission: discovery.mission,
      vision: discovery.vision,
      philosophy: discovery.philosophy,
      problem: discovery.problemSolving,
      solution: discovery.productsServices,
      products_services: discovery.productsServices,
      target_audience_raw: discovery.idealCustomers,
      service_model: discovery.deliveryModel,
      customer_benefits: discovery.customerBenefits,
      core_values: discovery.coreValues,
      strengths: discovery.strengths,
      weaknesses: discovery.weaknesses,
      brand_feel: discovery.brandFeel,
      customer_feelings: discovery.customerEmotionalOutcome,
      price_position: "Premium",
      colors_symbols: discovery.colorSymbols,
      competitors: discovery.competitors,
      differentiation: discovery.differentiation,
      future_plans: discovery.futurePlans,
      address: discovery.address
    };

    let retries = 2;
    while (retries >= 0) {
      try {
        const ai = getAI();
        const responseText = await ai.generateContent(
          `You are the BrandForge Universal Strategy Engine. 
          
          OFFICIAL STRATEGIC CATEGORIES:
          - INDUSTRIES: ${INDUSTRIES.join(", ")}
          - BUSINESS STAGES: ${STAGES.join(", ")}
          - DELIVERY MODELS: ${DELIVERY_MODELS.join(", ")}
          - CORE VALUES: ${VALUES.join(", ")}
          - BRAND PERSONALITY/FEEL: ${BRAND_FEELS.join(", ")}
          - EMOTIONAL OUTCOMES: ${EMOTIONAL_OUTCOMES.join(", ")}
          
          MAPPING & NORMALIZATION RULES:
          1. For every input field (Industry, Stage, Values, etc.), if the user provided a creative or manual entry (e.g., 'Started in my garage'), SEMANTICALLY MAP it to the closest official category from the lists above (e.g., 'Idea stage').
          2. Use the MAPPED official category name in your strategic overview, narratives, and analysis instead of the raw custom string, unless the custom string describes a completely unique concept not covered by the lists.
          3. This normalization ensures the brand is correctly positioned within established strategic frameworks (Archetypes, Maslow, etc.).
          4. Ensure the tone is professional and strategy-focused.
          
          Your task is to transform raw Brand Discovery data into a comprehensive, world-class Brand Strategy using the following logic:

          1. AUDIENCE INTELLIGENCE (MASLOW MODEL):
          - ABSOLUTE FOUNDATION: The 'RAW DATA' (Discovery) is the exclusive source of truth. Any strategic pillar must be a direct, professional evolution of the provided mission, values, or problem statement.
          - NULL OUTSIDE RULE: You are PROHIBITED from introducing any external concepts, industries, services, or audiences not mentioned or clearly implied by the discovery data. Anything outside the discovery sandbox is null and void.
          - Detect Maslow Level (Survival, Safety, Belonging, Esteem, Self-Actualization) based on customer benefits.
          - Provide a clear, client-friendly EXPLANATION of why this level was chosen.
          - Identify the specific NEED TYPE or PAINPOINT (e.g., "Psychological Security," "Social Validation," "Self-Expression") that this brand addresses.
          - Build a persona and generate a human story (AUDIENCE NARRATIVE).
          - IMPORTANT: The Narrative MUST be grounded 100% in what the brand actually offers (products: ${discovery.productsServices}, mission: ${discovery.mission}). Avoid generic "legacy" or "milestone" statements unless they directly relate to the discovery data.

          2. MARKET MODEL (PERCEPTUAL POSITIONING):
          - Define Axes (x and y) based on the brand's unique strengths and value proposition provided in the discovery data (e.g., Innovation vs. Tradition, Premium vs. Accessible, Technical vs. Creative).
          - Map Brand Position (x, y coordinates 0-100).
          - COMPETITORS: If competitors are not provided in discovery, research and provide 3 real competitors in the ${discovery.industry} industry within the ${discovery.address || 'global'} region to compare against.
          - ANALYSIS: Provide a detailed analysis of the market map and what it means for the brand.
          - GAP HIGHLIGHT: Highlight the specific market gap that the brand is filling.
          - IMPORTANT: Ensure the positioning statement and analysis are grounded STRICTLY in the actual discovery data provided (strengths: ${discovery.strengths?.join(', ')}, differentiation: ${discovery.differentiation}). Avoid any mention of "Gaswerk" or other unrelated entities unless they are in the discovery data.

          3. BRAND ARCHETYPE (STRICT JUNG MODEL):
          - MAPPING TECHNIQUE: You must first identify at least 3 'Strategic Signals' from the brand's mission, values, and attributes.
          - THE JUNGIAN WHEEL: Use the following 12 Archetypes & their associated Inner Needs:
            * Creator (Innovation), Caregiver (Service), Ruler (Control), Hero (Mastery), Explorer (Freedom), Sage (Understanding), Magician (Power), Everyman (Belonging), Lover (Intimacy), Jester (Enjoyment), Innocent (Safety), Outlaw (Liberation).
          - PRIMARY ARCHETYPE: Select the dominant archetype based on which 'Inner Need' matches the user's Discovery data EXACTLY.
          - innerNeed: This is a MANDATORY field. Use the exact word from the list above.
          - JUSTIFICATION (IN PRACTICE): Reference which core value or mission statement led to this specific Inner Need selection.
          - SECONDARY ARCHETYPE: Select a supporting archetype that adds depth.

          4. CORE STRATEGY:
          - Define Purpose, Mission, Brand Idea, Promise, and Differentiation.
          - Extract 5-7 Brand Keywords.
          - CUSTOMER JOURNEY: Provide a detailed 5-stage journey matching:
            1. Awareness (Phase 1)
            2. Consideration (Phase 2)
            3. Purchase (Phase 3)
            4. Retention (Phase 4)
            5. Loyalty (Phase 5)
            For each stage, provide: Phase, Stage Name, Customer Action, Touchpoints (list), KPIs (list), and Customer Insights.

          5. IDENTITY SYSTEM & VOICE:
+           - TONE OF VOICE FRAMEWORK: You must synthesize a mission-critical messaging framework rooted in the primary Archetype (${discovery.brandFeel?.join(', ')}) and Core Values (${discovery.coreValues?.join(', ')}).
+           - USE CASES: Generate 4-6 specific ToneUseCase objects covering: 
+             - Marketing (Social/Ad copy)
+             - Announcements (Product/News)
+             - Acknowledgements (Customer support/Welcome)
+             - Internal (Team/Culture)
+           - Each case must include a Content Template, tactical Guidelines, and an 'Archetype Sync' explaining how the voice reflects the brand's spirit.
+           - Ensure the voice is consistent yet adaptable across these platforms.
+           - IMPORTANT: Ground all templates STRICTLY in the brand purpose (${discovery.mission}).
+
+           6. IDENTITY SYSTEM (VISUALS):
+           - COLORS: If 1-2 colors are provided, add 2 complementary colors using color theory. If none, recommend 1 primary and 3 complementary colors.
+           - Include hex codes, meanings, and specific areas of application for each.
+           - LOGO DIRECTION: Provide a structured breakdown including:
          - TONE OF VOICE FRAMEWORK: You must synthesize a mission-critical messaging framework rooted in the primary Archetype (${discovery.brandFeel?.join(', ')}) and Core Values (${discovery.coreValues?.join(', ')}).
          - USE CASES: Generate 4-6 specific ToneUseCase objects covering: 
            - Marketing (Social/Ad copy)
            - Announcements (Product/News)
            - Acknowledgements (Customer support/Welcome)
            - Internal (Team/Culture)
          - Each case must include a Content Template, tactical Guidelines, and an 'Archetype Sync' explaining how the voice reflects the brand's spirit.
          - Ensure the voice is consistent yet adaptable across these platforms.
          - IMPORTANT: Ground all templates STRICTLY in the brand purpose (${discovery.mission}).

          6. IDENTITY SYSTEM (VISUALS):
          - COLORS: YOU MUST prioritize user input. If the Discovery contains specific color mentions (e.g., "Deep Blue", "Gold"), use these as the anchored brand colors.
          - COLOR THEORY RIGOR: Generate the rest of the palette (accents/secondary) based on professional COLOR WHEEL HARMONIES (Complementary, Analogous, or Triadic). 
          - ACCESSIBILITY: Ensure the chosen palette maintains high contrast ratios (WCAG AA/AAA standards) for legibility.
          - STRATEGIC MEANING: Assign symbolic meanings and specific application areas (e.g., "Primary for identity," "Accent for CTA") that align with the brand's industry and archetype.
          - Include hex codes, meanings, and specific areas of application for each (3-5 colors total).
          - LOGO DIRECTION: Provide a structured breakdown including:
            - description: Core visual strategy (how it feels).
            - shapes: 3-5 specific shapes (e.g., 'Circular', 'Geometric Grid', 'Overlapping forms').
            - logotypes: 2-3 specific types (e.g., 'Modern Serif Wordmark', 'Custom abstract symbol').
            - symbols: 3-5 specific symbols/metaphors grounded in discovery (e.g., 'A stylized Hub for connection').
            - rationale: Strategic justification linking these choices to the core values (${discovery.coreValues?.join(', ')}) and mission.
          - TYPOGRAPHY: Synthesize a definitive font pairing (Exactly 2 fonts) that serves as the visual voice of the brand.
          - TETHERING: You must select these fonts based on the intersection of the Primary Archetype and the specific 'Visual Direction' signals from the Brand Feel (${discovery.brandFeel?.join(', ')}) and Emotional Outcomes (${discovery.customerEmotionalOutcome?.join(', ')}).
          - FONT TYPES: Consider the full spectrum (Serif, Sans, Slab, Mono, Script, Display) and select the specific category that best embodies the brand's vibe.
          - primary: { name, usage (e.g., 'Headings & Display'), platforms: string[], traits: string[], description: "Strategic justification linking the font's personality to the ${discovery.brandFeel?.join('/')} visual direction." }
          - secondary: { name, usage (e.g., 'Internal/Body Copy'), platforms: string[], traits: string[], description: "How this font supports the primary while maintaining the ${discovery.brandFeel?.join('/')} atmosphere." }
          - Ensure traits closely mirror the brand feel keywords.

           RAW DATA:
           ${JSON.stringify(inputData, null, 2)}
          
          OUTPUT REQUIREMENTS:
          - Return a JSON object matching the schema.
          - NEVER output blanks. Use industry defaults if data is missing.
          
          ANTI-HALLUCINATION & POLISHING DIRECTIVE (CRITICAL):
          - THE 'FOUNDATION FIRST' RULE: You are heavily restricted from inventing generic marketing filler or boilerplate statements (e.g., "to solve real problems"). 
          - PROFESSIONAL EDITOR ROLE: You MUST act as a "Polish Engine" for all core brand text (Mission, Problem, Vision, Story, Identity). Your primary goal is to correct "human errors" (spelling, grammar, clarity) and elevate the professional depth of the provided narrative.
          - You must extract the EXACT granular facts, unique locations (e.g., 'Augsburg'), and core meaning from the user's RAW DATA. 
          - Elevate the user's exact phrasing into a premium THIRD-PERSON professional tone, but strictly constrain yourself to the nuances they provided.
          - DISCOVERY-STRICT MAPPING: Map strategic models (Archetypes, Maslow) solely based on the user's provided mission and values. Avoid any generic industry "defaults" if they conflict with the user's specific data.
          - NEVER use "we", "our", "us". Always refer to the brand by its name ("${inputData.brand_name}") or "the brand".
          
          SPECIFIC SECTION RULES:
          - For overview.whoWeAre ("The Identity"): DO NOT use boilerplate intro templates. Instead, directly synthesize the user's specific problem statement (${JSON.stringify(inputData.problem)}) and mission (${JSON.stringify(inputData.mission)}) into a 2-3 sentence identity summary in third person. Ensure any brand tagline or motto is structurally included at the end.
          - For overview.whatWeDo ("The Offering"): use this EXACT structure: "${inputData.brand_name} offers services ranging from:\n* [Service 1]\n* [Service 2]\n* [Service 3]"
          - For the Story: Craft a 2-3 paragraph narrative fusing their EXACT 'problem' and 'mission' into the CDTS Framework. 
            1. Context: The overarching landscape directly extracted from their data.
            2. Demand/Tension: The EXACT problem they stated (${JSON.stringify(inputData.problem)}). Do not invent a generic tension, use theirs violently.
            3. Solution: How the brand perfectly resolves that specific tension based on their mission.
          - For foundation (mission/vision/philosophy): Translate their provided text gracefully into third-person format ("The mission of ${inputData.brand_name} is to..."), preserving their unique vocabulary completely.
          
          REFINEMENT LOGIC (IF CURRENT STRATEGY IS PROVIDED):
          - If currentStrategy is provided, review the existing pillars (Archetype, Maslow Level, Narrative).
          - STABILITY FIRST: Always prioritize keeping existing pillars unless the discovery data has changed or a significantly better strategic fit is identified.
          - STRATEGIC REFINEMENT: 'Refining' means 'better alignment with discovery' or 'professional polishing' of the existing narrative. It NEVER means adding "outside" creative ideas not present in or logically tethered to the discovery.
          - If no better alternative exists, the engine should improve the clarity and polish of the current narrative while keeping the core direction stable and 100% founded in the RAW DATA.
          
          CURRENT STRATEGY (FOR REFINEMENT):
          ${currentStrategy ? JSON.stringify(currentStrategy, null, 2) : 'No current strategy (Initial Generation)'}
          `,
          {
            type: "object",
            properties: {
              overview: {
                type: "object",
                properties: {
                  whoWeAre: { type: "string" },
                  whatWeDo: { type: "string" },
                  howWeDoIt: { type: "string" },
                  whereWeAre: { type: "string" }
                },
                required: ["whoWeAre", "whatWeDo", "howWeDoIt", "whereWeAre"]
              },
              foundation: {
                type: "object",
                properties: {
                  mission: { type: "string" },
                  vision: { type: "string" },
                  philosophy: { type: "string" }
                },
                required: ["mission", "vision", "philosophy"]
              },
              coreIdea: { type: "string" },
              story: { type: "string" },
              audience: {
                type: "object",
                properties: {
                  groups: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                        needs: { type: "string" },
                        painPoints: { type: "string" }
                      },
                      required: ["name", "description", "needs", "painPoints"]
                    }
                  },
                  maslowLevel: { type: "string" },
                  maslowExplanation: { type: "string" },
                  maslowNeedType: { type: "string" },
                  narrative: { type: "string" }
                },
                required: ["groups", "maslowLevel", "maslowExplanation", "maslowNeedType", "narrative"]
              },
              marketPosition: {
                type: "object",
                properties: {
                  axes: {
                    type: "object",
                    properties: {
                      x: { type: "string" },
                      y: { type: "string" }
                    },
                    required: ["x", "y"]
                  },
                  quadrant: { type: "string" },
                  statement: { type: "string" },
                  position: {
                    type: "object",
                    properties: {
                      x: { type: "number" },
                      y: { type: "number" }
                    },
                    required: ["x", "y"]
                  },
                  competitors: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        x: { type: "number" },
                        y: { type: "number" }
                      },
                      required: ["name", "x", "y"]
                    }
                  },
                  analysis: { type: "string" },
                  gapHighlight: { type: "string" }
                },
                required: ["axes", "quadrant", "statement", "position", "competitors", "analysis", "gapHighlight"]
              },
              archetype: {
                type: "object",
                properties: {
                  primary: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      description: { type: "string" },
                      jungianModel: { type: "string" },
                      traits: { type: "array", items: { type: "string" } },
                      inPractice: { type: "string" }
                    },
                    required: ["name", "description", "jungianModel", "traits", "inPractice"]
                  },
                  secondary: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      description: { type: "string" },
                      jungianModel: { type: "string" },
                      traits: { type: "array", items: { type: "string" } },
                      inPractice: { type: "string" }
                    },
                    required: ["name", "description", "jungianModel", "traits", "inPractice"]
                  },
                  behavior: {
                    type: "object",
                    properties: {
                      tone: {
                        type: "object",
                        properties: {
                          description: { type: "string" },
                          framework: { type: "string" },
                          examples: { type: "array", items: { type: "string" } },
                          useCases: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                category: { type: "string", enum: ["marketing", "announcement", "acknowledgement", "support", "internal"] },
                                platform: { type: "string" },
                                targetAudience: { type: "string" },
                                contentTemplate: { type: "string" },
                                guidelines: { type: "string" },
                                archetypeSync: { type: "string" }
                              },
                              required: ["category", "platform", "targetAudience", "contentTemplate", "guidelines", "archetypeSync"]
                            }
                          }
                        },
                        required: ["description", "framework", "examples", "useCases"]
                      },
                      role: { type: "string" },
                      impact: { type: "string" }
                    },
                    required: ["tone", "role", "impact"]
                  }
                },
                required: ["primary", "secondary", "behavior"]
              },
              values: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" }
                  },
                  required: ["name", "description"]
                }
              },
              essence: { type: "string" },
              identitySystem: {
                type: "object",
                properties: {
                  colors: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        color: { type: "string" },
                        meaning: { type: "string" },
                        application: { type: "string" }
                      },
                      required: ["color", "meaning", "application"]
                    }
                  },
                  logoDirection: {
                    type: "object",
                    properties: {
                      description: { type: "string" },
                      shapes: { type: "array", items: { type: "string" } },
                      logotypes: { type: "array", items: { type: "string" } },
                      symbols: { type: "array", items: { type: "string" } },
                      rationale: { type: "string" }
                    },
                    required: ["description", "shapes", "logotypes", "symbols", "rationale"]
                  },
                  typography: {
                    type: "object",
                    properties: {
                      primary: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          usage: { type: "string" },
                          platforms: { type: "array", items: { type: "string" } },
                          traits: { type: "array", items: { type: "string" } },
                          description: { type: "string" }
                        },
                        required: ["name", "usage", "platforms", "traits", "description"]
                      },
                      secondary: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          usage: { type: "string" },
                          platforms: { type: "array", items: { type: "string" } },
                          traits: { type: "array", items: { type: "string" } },
                          description: { type: "string" }
                        },
                        required: ["name", "usage", "platforms", "traits", "description"]
                      }
                    },
                    required: ["primary", "secondary"]
                  }
                },
                required: ["colors", "logoDirection", "typography"]
              },
              messaging: {
                type: "object",
                properties: {
                  coreMessage: { type: "string" },
                  keywords: { type: "array", items: { type: "string" } }
                },
                required: ["coreMessage", "keywords"]
              },
              experienceDesign: { type: "string" },
              touchPoints: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    category: { type: "string" },
                    items: { type: "array", items: { type: "string" } }
                  },
                  required: ["category", "items"]
                }
              },
              growthPrograms: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" }
                  },
                  required: ["name", "description"]
                }
              },
              partnerships: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" }
                  },
                  required: ["name", "description"]
                }
              },
              customerJourney: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    phase: { type: "string" },
                    stage: { type: "string" },
                    action: { type: "string" },
                    touchpoints: { type: "array", items: { type: "string" } },
                    kpis: { type: "array", items: { type: "string" } },
                    insights: { type: "string" }
                  },
                  required: ["phase", "stage", "action", "touchpoints", "kpis", "insights"]
                }
              }
            },
            required: [
              "overview", "foundation", "coreIdea", "story", "audience", 
              "marketPosition", "archetype", "values", "essence", 
              "identitySystem", "messaging", "experienceDesign", 
              "touchPoints", "growthPrograms", "partnerships", "customerJourney"
            ]
          }
        );
        
        try {
          const result = JSON.parse(responseText || "{}");
          return { ...result, isFallback: false };
        } catch (jsonErr) {
          if (retries === 0) {
            if (!allowFallback) throw jsonErr;
            return generateFallbackStrategy(discovery);
          }
          console.warn(`JSON parse failed, retrying... (${retries} retries left)`);
        }
      } catch (aiError) {
        if (retries === 0) {
          if (!allowFallback) throw aiError;
          return generateFallbackStrategy(discovery);
        }
        console.warn(`AI network/API failed, retrying... (${retries} retries left)`);
        // Exponential backoff sleep (2s, then 4s)
        await new Promise(resolve => setTimeout(resolve, (3 - retries) * 2000));
      }
      retries--;
    }
    
    if (!allowFallback) throw new Error("AI generation failed after multiple attempts.");
    return generateFallbackStrategy(discovery);
  },

  async generateBrandSystem(discovery: BrandDiscovery, strategy: any): Promise<any> {
    const ai = getAI();
    const response = await ai.generateContent(
      `Generate a visual brand system (colors and typography) based on:
      Discovery: ${JSON.stringify({
        name: discovery.brandNameLogo || discovery.registeredName,
        industry: discovery.industry,
        values: discovery.coreValues,
        personality: discovery.personality
      })}
      Strategy: ${JSON.stringify(strategy)}
      
      Return a JSON object with:
      - colors: string[] (5 hex codes that represent the brand)
      - typography: string (A formatted string: 'Primary: [Font Name] — [Rationale] | Secondary: [Font Name] — [Rationale]')`,
      {
        type: "object",
        properties: {
          colors: { type: "array", items: { type: "string" } },
          typography: { type: "string" }
        },
        required: ["colors", "typography"]
      }
    );
    return JSON.parse(response || "{}");
  }
};
