import jsPDF from 'jspdf';
import { BrandDiscovery, BrandStrategy, LogoAssistantData } from '../types';

/**
 * Polymorphic PDF Service
 * Handles high-fidelity PDF generation for all BrandForge tools.
 * Uses the Translation Pattern to map tool-specific data to a shared layout engine.
 */

interface PDFOptions {
  brandName: string;
  filename: string;
}

class PDFLayoutEngine {
  doc: jsPDF;
  margin: number = 50;
  contentWidth: number;
  pageWidth: number;
  pageHeight: number;
  y: number;
  headerHeight: number = 35;
  footerHeight: number = 30;
  contentTop: number;
  brandName: string;
  currentSectionTitle: string = '';

  /**
   * Sanitizes text to prevent jspdf rendering errors with non-standard unicode.
   */
  private safeText(text: string | null | undefined): string {
    if (!text) return '';
    return text
      .replace(/[\u201C\u201D]/g, '"') // Smart double quotes
      .replace(/[\u2018\u2019]/g, "'") // Smart single quotes
      .replace(/[\u2013\u2014]/g, '-') // Em/En dashes
      .replace(/[^\x20-\x7E\s\u00A0-\u00FF]/g, '') // Keep printable ASCII and basic Latin-1 (accents), strip others
      .trim();
  }

  // --- DESIGN TOKENS ---
  public readonly FONT_MAIN = 'helvetica';
  
  // Colors (RGB) - NEUTRAL SCHEME
  public readonly CLR_TITLE = [15, 23, 42];   // Slate-900 (Deep Charcoal)
  public readonly CLR_BRAND = [51, 65, 85];   // Slate-700 (Neutral Accent)
  public readonly CLR_BODY  = [71, 85, 105];  // Slate-600
  public readonly CLR_LABEL = [100, 116, 139]; // Slate-500
  public readonly CLR_LINE  = [226, 232, 240]; // Slate-200
  public readonly CLR_MUTE  = [148, 163, 184]; // Slate-400

  // Vertical Rhythm & Alignment
  public readonly LH = 14;      
  public readonly GAP_S = 25;   
  public readonly GAP_I = 15;   
  public readonly GAP_P = 6;    

  constructor(options: PDFOptions) {
    this.doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.contentWidth = this.pageWidth - this.margin * 2;
    this.contentTop = this.margin + this.headerHeight;
    this.y = this.margin;
    this.brandName = options.brandName;
  }

  addHeaderFooter() {
    const doc = this.doc;
    const oldSize = doc.getFontSize();
    const oldColor = doc.getTextColor();
    const oldFont = doc.getFont();

    doc.setFont(this.FONT_MAIN, 'bold');
    doc.setFontSize(8);
    doc.setTextColor(this.CLR_MUTE[0], this.CLR_MUTE[1], this.CLR_MUTE[2]);
    
    const headerText = this.currentSectionTitle 
      ? `${this.brandName.toUpperCase()}  |  ${this.currentSectionTitle.toUpperCase()}`
      : this.brandName.toUpperCase();
      
    doc.text(this.safeText(headerText), this.margin, this.margin - 5);
    doc.setDrawColor(this.CLR_LINE[0], this.CLR_LINE[1], this.CLR_LINE[2]);
    doc.setLineWidth(0.5);
    doc.line(this.margin, this.margin + 5, this.pageWidth - this.margin, this.margin + 5);

    const pageNum = (doc as any).internal.getCurrentPageInfo().pageNumber;
    doc.setFont(this.FONT_MAIN, 'normal');
    doc.setFontSize(7);
    doc.setTextColor(this.CLR_MUTE[0], this.CLR_MUTE[1], this.CLR_MUTE[2]);
    doc.text('Strategic Intelligence Report | BrandForge Ultimate Branding Suite', this.margin, this.pageHeight - 25);
    doc.text(`Page ${pageNum}`, this.pageWidth - this.margin, this.pageHeight - 25, { align: 'right' });
    doc.line(this.margin, this.pageHeight - 35, this.pageWidth - this.margin, this.pageHeight - 35);

    // Restore State
    doc.setFont(this.FONT_MAIN, oldFont.fontStyle);
    doc.setFontSize(oldSize);
    doc.setTextColor(oldColor);
  }

  checkPage(needed: number) {
    const bottomLimit = this.pageHeight - this.margin - this.footerHeight;
    if (this.y + needed > bottomLimit) {
      this.doc.addPage();
      this.addHeaderFooter();
      this.y = this.contentTop;
      return true;
    }
    return false;
  }

  addTitle(text: string) {
    this.checkPage(40);
    this.doc.setFont(this.FONT_MAIN, 'bold');
    this.doc.setFontSize(22);
    this.doc.setTextColor(this.CLR_TITLE[0], this.CLR_TITLE[1], this.CLR_TITLE[2]);
    this.doc.text(this.safeText(text), this.margin, this.y);
    this.y += 32;
  }

  addSubtitle(text: string) {
    this.checkPage(this.LH + this.GAP_I);
    this.doc.setFont(this.FONT_MAIN, 'bold');
    this.doc.setFontSize(11);
    this.doc.setTextColor(this.CLR_BRAND[0], this.CLR_BRAND[1], this.CLR_BRAND[2]);
    this.doc.text(this.safeText(text.toUpperCase()), this.margin, this.y);
    this.y += 18;
  }

  addBody(text: string | null | undefined) {
    if (!text) return;
    this.doc.setFont(this.FONT_MAIN, 'normal');
    this.doc.setFontSize(10);
    const safeStr = this.safeText(text);
    const lines = this.doc.splitTextToSize(safeStr, this.contentWidth);
    for (const line of lines) {
      this.checkPage(this.LH);
      // Re-assert font state in case checkPage added a header/footer which changed it
      this.doc.setFont(this.FONT_MAIN, 'normal');
      this.doc.setFontSize(10);
      this.doc.setTextColor(this.CLR_BODY[0], this.CLR_BODY[1], this.CLR_BODY[2]);
      
      this.doc.text(line, this.margin, this.y);
      this.y += this.LH;
    }
    this.y += this.GAP_P;
  }

  addSectionHeader(text: string) {
    this.currentSectionTitle = text;
    const isFirstPage = (this.doc as any).internal.getCurrentPageInfo().pageNumber === 1;
    if (!isFirstPage || this.y > this.margin + 50) {
      this.doc.addPage();
      this.addHeaderFooter();
      this.y = this.contentTop;
    }

    this.doc.setFont(this.FONT_MAIN, 'bold');
    this.doc.setFontSize(16);
    this.doc.setTextColor(this.CLR_TITLE[0], this.CLR_TITLE[1], this.CLR_TITLE[2]);
    this.doc.text(text.toUpperCase(), this.margin, this.y);
    this.y += 8;
    this.doc.setDrawColor(this.CLR_BRAND[0], this.CLR_BRAND[1], this.CLR_BRAND[2]);
    this.doc.setLineWidth(2);
    this.doc.line(this.margin, this.y, this.margin + 40, this.y);
    this.y += 22;
  }

  addBullet(label: string, value: string | null | undefined) {
    if (!value) return;
    this.doc.setFont(this.FONT_MAIN, 'bold');
    this.doc.setFontSize(10);
    this.doc.setTextColor(this.CLR_LABEL[0], this.CLR_LABEL[1], this.CLR_LABEL[2]);
    
    const displayLabel = label.trim() ? `${label}:` : '';
    const safePrefix = this.safeText(`• ${displayLabel} `);
    const labelWidth = this.doc.getTextWidth(safePrefix);
    
    this.checkPage(this.LH);
    this.doc.text(safePrefix, this.margin, this.y);
    
    this.doc.setFont(this.FONT_MAIN, 'normal');
    this.doc.setTextColor(this.CLR_BODY[0], this.CLR_BODY[1], this.CLR_BODY[2]);
    
    const safeBody = this.safeText(value);
    const firstLineLines = this.doc.splitTextToSize(safeBody, this.contentWidth - labelWidth);
    const firstLine = firstLineLines[0];
    
    this.doc.text(firstLine, this.margin + labelWidth, this.y);
    this.y += this.LH;
    
    const remainingText = safeBody.substring(firstLine.length).trim();
    if (remainingText) {
      const restLines = this.doc.splitTextToSize(remainingText, this.contentWidth);
      restLines.forEach((line: string) => {
        this.checkPage(this.LH);
        this.doc.setFont(this.FONT_MAIN, 'normal');
        this.doc.setFontSize(10);
        this.doc.setTextColor(this.CLR_BODY[0], this.CLR_BODY[1], this.CLR_BODY[2]);
        this.doc.text(line, this.margin, this.y);
        this.y += this.LH;
      });
    }
    this.y += 4;
  }

  addSmallLabel(label: string, value: string | null | undefined) {
    if (!value) return;
    this.doc.setFont(this.FONT_MAIN, 'bold');
    this.doc.setFontSize(8);
    this.doc.setTextColor(this.CLR_MUTE[0], this.CLR_MUTE[1], this.CLR_MUTE[2]);
    
    const safeLabel = this.safeText(`${label.toUpperCase()}: `);
    const labelWidth = this.doc.getTextWidth(safeLabel);
    
    this.checkPage(12);
    this.doc.text(safeLabel, this.margin, this.y);
    
    this.doc.setFont(this.FONT_MAIN, 'normal');
    this.doc.setFontSize(9);
    this.doc.setTextColor(this.CLR_TITLE[0], this.CLR_TITLE[1], this.CLR_TITLE[2]);
    
    const safeVal = this.safeText(value);
    const firstLineLines = this.doc.splitTextToSize(safeVal, this.contentWidth - labelWidth);
    const firstLine = firstLineLines[0];
    
    this.doc.text(firstLine, this.margin + labelWidth, this.y);
    this.y += 12;
    
    const remainingText = safeVal.substring(firstLine.length).trim();
    if (remainingText) {
      const restLines = this.doc.splitTextToSize(remainingText, this.contentWidth);
      restLines.forEach((line: string) => {
        this.checkPage(12);
        this.doc.setFont(this.FONT_MAIN, 'normal');
        this.doc.setFontSize(9);
        this.doc.setTextColor(this.CLR_TITLE[0], this.CLR_TITLE[1], this.CLR_TITLE[2]);
        this.doc.text(line, this.margin, this.y);
        this.y += 12;
      });
    }
    this.y += 4;
  }

  hexToCMYK(hex: string): string {
    let r = 0, g = 0, b = 0;
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
      r = parseInt(cleanHex[0] + cleanHex[0], 16);
      g = parseInt(cleanHex[1] + cleanHex[1], 16);
      b = parseInt(cleanHex[2] + cleanHex[2], 16);
    } else if (cleanHex.length === 6) {
      r = parseInt(cleanHex.substring(0, 2), 16);
      g = parseInt(cleanHex.substring(2, 4), 16);
      b = parseInt(cleanHex.substring(4, 6), 16);
    }

    let c = 1 - (r / 255);
    let m = 1 - (g / 255);
    let y = 1 - (b / 255);
    let k = Math.min(c, Math.min(m, y));

    if (k === 1) return '0, 0, 0, 100';

    c = Math.round(((c - k) / (1 - k)) * 100);
    m = Math.round(((m - k) / (1 - k)) * 100);
    y = Math.round(((y - k) / (1 - k)) * 100);
    k = Math.round(k * 100);

    return `${c}, ${m}, ${y}, ${k}`;
  }

  addDivider() {
    this.checkPage(30);
    this.y += 10;
    this.doc.setDrawColor(this.CLR_LINE[0], this.CLR_LINE[1], this.CLR_LINE[2]);
    this.line(this.margin, this.y, this.pageWidth - this.margin, this.y);
    this.y += 20;
  }

  private line(x1: number, y1: number, x2: number, y2: number) {
    this.doc.line(x1, y1, x2, y2);
  }

  save(filename: string) {
    this.doc.save(filename);
  }
}

export const pdfService = {
  /**
   * Export Brand Strategy PDF
   */
  exportStrategy: (strategy: BrandStrategy, brandName: string) => {
    const engine = new PDFLayoutEngine({
      brandName: brandName || 'Brand Strategy',
      filename: `${(brandName || 'Brand').replace(/\s+/g, '_')}_Strategy_Blueprint.pdf`
    });

    const { doc } = engine;

    // --- COVER PAGE ---
    doc.setDrawColor(engine.CLR_BRAND[0], engine.CLR_BRAND[1], engine.CLR_BRAND[2]);
    doc.setLineWidth(3);
    doc.line(engine.margin, 80, engine.pageWidth - engine.margin, 80);

    engine.y = engine.pageHeight * 0.35;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(32);
    doc.setTextColor(engine.CLR_TITLE[0], engine.CLR_TITLE[1], engine.CLR_TITLE[2]);
    const titleLines = doc.splitTextToSize(engine.brandName || '', engine.contentWidth);
    titleLines.forEach((line: string) => {
      doc.text(line, engine.pageWidth / 2, engine.y, { align: 'center' });
      engine.y += 40;
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(engine.CLR_LABEL[0], engine.CLR_LABEL[1], engine.CLR_LABEL[2]);
    doc.text('Strategic Brand Blueprint', engine.pageWidth / 2, engine.y, { align: 'center' });
    
    engine.y += 100;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PREPARED BY', engine.pageWidth / 2, engine.y, { align: 'center' });
    engine.y += 16;
    doc.setFont('helvetica', 'normal');
    doc.text('BrandForge Intelligence Engine', engine.pageWidth / 2, engine.y, { align: 'center' });
    engine.y += 24;
    doc.text(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), engine.pageWidth / 2, engine.y, { align: 'center' });

    doc.setDrawColor(engine.CLR_BRAND[0], engine.CLR_BRAND[1], engine.CLR_BRAND[2]);
    doc.setLineWidth(3);
    doc.line(engine.margin, engine.pageHeight - 80, engine.pageWidth - engine.margin, engine.pageHeight - 80);

    // --- EXECUTIVE OVERVIEW ---
    engine.addSectionHeader('Executive Overview');
    engine.addSubtitle('Brand Essence');
    engine.addBody(strategy.essence);
    
    engine.addSubtitle('Who We Are');
    engine.addBody(strategy.overview?.whoWeAre);
    
    engine.addSubtitle('What We Do');
    engine.addBody(strategy.overview?.whatWeDo);
    
    engine.addSubtitle('The Brand Standard (Methodology)');
    engine.addBody(strategy.overview?.howWeDoIt);

    if (strategy.overview?.whereWeAre) {
      engine.addSubtitle('Presence & Reach');
      engine.addBody(strategy.overview.whereWeAre);
    }

    engine.addSectionHeader('Brand Soul');
    engine.addSubtitle('Mission');
    engine.addBody(strategy.foundation?.mission);
    engine.addSubtitle('Vision');
    engine.addBody(strategy.foundation?.vision);
    engine.addSubtitle('Philosophy');
    engine.addBody(strategy.foundation?.philosophy);

    if (strategy.values && strategy.values.length > 0) {
      engine.addSubtitle('Core Values');
      strategy.values.forEach(v => {
        engine.addBullet(v.name, v.description);
      });
    }

    // --- AUDIENCE & EXPERIENCE ---
    engine.addSectionHeader('Audience & Experience');
    if (strategy.audience?.maslowLevel) {
      engine.addSubtitle(`Maslow Hierarchy: ${strategy.audience.maslowLevel}`);
      engine.addBody(strategy.audience.maslowExplanation);
    }

    if (strategy.audience?.groups && strategy.audience.groups.length > 0) {
      engine.addSubtitle('Target Audience Segments');
      strategy.audience.groups.forEach(group => {
        engine.addSubtitle(`Segment: ${group.name}`);
        engine.addBody(group.description);
        engine.addBullet('Core Needs', group.needs);
        engine.addBullet('Pain Points', group.painPoints);
      });
    }

    if (strategy.audience?.narrative) {
      engine.addSubtitle('Experience Narrative');
      engine.addBody(strategy.audience.narrative);
    }

    // --- CUSTOMER JOURNEY ---
    if (strategy.customerJourney && strategy.customerJourney.length > 0) {
      engine.addSectionHeader('Customer Journey Map');
      
      strategy.customerJourney.forEach(step => {
        engine.addSubtitle(`${step.phase}: ${step.stage}`);
        engine.addBullet('Customer Action', step.action);
        engine.addBullet('Touchpoints', step.touchpoints?.join(', '));
        engine.addBullet('Success KPIs', step.kpis?.join(', '));
        if (step.insights) {
          engine.addSmallLabel('Insights', step.insights);
        }
      });
    }

    // --- PSYCHOLOGICAL PROFILE ---
    engine.addSectionHeader('Psychological Profile');
    
    const renderArchetype = (type: 'Primary' | 'Secondary' | 'Tertiary', data: any) => {
      if (!data || !data.name) return;
      engine.addSubtitle(`${type} Archetype: ${data.name}`);
      engine.addBody(data.personalityNarrative);
      engine.addSmallLabel('Model', data.jungianModel);
      engine.addSmallLabel('Goal', data.goal);
      engine.addSmallLabel('Fear', data.fear);
      engine.addSmallLabel('Talent', data.talent);
      
      if (data.traits) {
        engine.addSmallLabel('Traits', data.traits.join(' • '));
      }

      if (data.inPractice && data.inPractice.length > 0) {
        data.inPractice.forEach((p: any) => {
          engine.addBullet(p.label, p.content);
        });
      }
      
      engine.addSmallLabel('Rationale', data.strategicRationale);
      engine.addDivider();
    };

    renderArchetype('Primary', strategy.archetype?.primary);
    renderArchetype('Secondary', strategy.archetype?.secondary);
    renderArchetype('Tertiary', strategy.archetype?.tertiary);

    if (strategy.archetype?.behavior) {
      engine.addSectionHeader('Brand Behavior');
      engine.addSubtitle("The Brand's Role");
      engine.addBody(strategy.archetype.behavior.role);
      engine.addSubtitle('Emotional Impact');
      engine.addBody(strategy.archetype.behavior.impact);
    }

    // --- TONE OF VOICE ---
    engine.addSectionHeader('Tone of Voice Framework');
    engine.addSubtitle('Voice Essence');
    engine.addBody(strategy.archetype?.behavior?.tone?.framework);
    engine.addSubtitle('Voice Description');
    engine.addBody(strategy.archetype?.behavior?.tone?.description);
    
    if (strategy.archetype?.behavior?.tone?.examples) {
      engine.addSubtitle('Voice Examples');
      strategy.archetype.behavior.tone.examples.forEach(ex => engine.addBullet('Voice Spec', ex));
    }

    if (strategy.archetype?.behavior?.tone?.useCases && strategy.archetype.behavior.tone.useCases.length > 0) {
      engine.addSubtitle('Tone Use Cases (Platform Templates)');
      strategy.archetype.behavior.tone.useCases.forEach(uc => {
        engine.addSubtitle(`${uc.category.toUpperCase()} Workbench: ${uc.platform}`);
        engine.addSmallLabel('Audience', uc.targetAudience);
        engine.addBody(`Template: "${uc.contentTemplate}"`);
        engine.addSmallLabel('Guardrails', uc.guidelines);
        engine.addSmallLabel('Archetype Sync', uc.archetypeSync);
      });
    }

    // --- MARKET POSITIONING ---
    engine.addSectionHeader('Market Positioning');
    engine.addSubtitle('Competitive Positioning Statement');
    engine.addBody(strategy.marketPosition?.statement);
    
    engine.addSubtitle('Market Gap Analysis');
    engine.addBody(strategy.marketPosition?.analysis);
    
    if (strategy.marketPosition?.gapHighlight) {
      engine.addSubtitle('The Opportunity (Gap Highlight)');
      engine.addBody(strategy.marketPosition.gapHighlight);
    }

    if (strategy.marketPosition?.competitors && strategy.marketPosition.competitors.length > 0) {
      engine.addSubtitle('Competitive Landscape (Radar Data)');
      strategy.marketPosition.competitors.forEach(comp => {
        engine.addSubtitle(comp.name);
        if (comp.website) engine.addSmallLabel('Website', comp.website);
        if (comp.location) engine.addSmallLabel('Location', comp.location);
        if (comp.established) engine.addSmallLabel('Established', comp.established);
        if (comp.socials && comp.socials.length > 0) {
          engine.addSmallLabel('Socials', comp.socials.map(s => `${s.platform}: ${s.url}`).join(' | '));
        }
      });
    }

    // --- IDENTITY SYSTEM ---
    engine.addSectionHeader('Brand Identity System');
    
    if (strategy.identitySystem?.colors && strategy.identitySystem.colors.length > 0) {
      engine.addSubtitle('Strategic Color Palette');
      strategy.identitySystem.colors.forEach(c => {
        const hexMatch = (c.color || '').match(/#[0-9A-Fa-f]{3,6}/);
        const hex = hexMatch ? hexMatch[0] : '#000000';
        engine.addSubtitle(`${c.role}: ${c.color}`);
        engine.addSmallLabel('HEX', hex.toUpperCase());
        engine.addSmallLabel('CMYK', engine.hexToCMYK(hex));
        engine.addBullet('Meaning', c.meaning);
        engine.addBullet('Application', c.application);
      });
    }

    const renderTypo = (label: string, data: any) => {
      if (!data) return;
      engine.addSubtitle(`${label}: ${data.name}`);
      engine.addSmallLabel('Usage', data.usage);
      engine.addBody(data.description);
      engine.addSmallLabel('Traits', data.traits?.join(' • '));
      engine.addSmallLabel('Platforms', data.platforms?.join(', '));
    };

    if (strategy.identitySystem?.typography) {
      engine.addSectionHeader('Typography Direction');
      renderTypo('Primary Typeface', strategy.identitySystem.typography.primary);
      renderTypo('Secondary Typeface', strategy.identitySystem.typography.secondary);
    }

    if (strategy.identitySystem?.logoOptions && strategy.identitySystem.logoOptions.length > 0) {
      engine.addSectionHeader('Logo Strategic Directions');
      
      strategy.identitySystem.logoOptions.forEach(opt => {
        engine.addSubtitle(`${opt.strategy} Concept`);
        engine.addBody(opt.description);
        
        if (opt.propositionalDensity) {
          engine.addSubtitle('Propositional Density (Pd) Model');
          engine.addBullet('Surface (Pv)', opt.propositionalDensity.surface);
          engine.addBullet('Semantic (Ps)', opt.propositionalDensity.semantic);
          engine.addSmallLabel('Pd Rationale', opt.propositionalDensity.rationale);
        }

        engine.addSmallLabel('Visual Forms', opt.shapes?.join(', '));
        engine.addSmallLabel('Symbols', opt.symbols?.join(', '));
        engine.addSmallLabel('Rationale', opt.rationale);
      });
    }

    // --- MESSAGING & TOUCHPOINTS ---
    engine.addSectionHeader('Messaging & Touchpoints');
    engine.addSubtitle('Core Brand Narrative');
    engine.addBody(strategy.story);
    
    if (strategy.messaging?.coreMessage) {
      engine.addSubtitle('Core Messaging Framework');
      engine.addBody(strategy.messaging.coreMessage);
      if (strategy.messaging.keywords) {
        engine.addSmallLabel('Keywords', strategy.messaging.keywords.join(', '));
      }
    }

    if (strategy.touchPoints && strategy.touchPoints.length > 0) {
      engine.addSubtitle('Brand Touchpoints');
      strategy.touchPoints.forEach(tp => {
        engine.addBullet(tp.category, tp.items.join(', '));
      });
    }

    // --- GROWTH & EVOLUTION ---
    engine.addSectionHeader('Growth & Evolution');
    
    if (strategy.growthPrograms && strategy.growthPrograms.length > 0) {
      engine.addSubtitle('Growth Programs');
      strategy.growthPrograms.forEach(gp => engine.addBullet(gp.name, gp.description));
    }
    
    if (strategy.partnerships && strategy.partnerships.length > 0) {
      engine.addSubtitle('Strategic Partnerships');
      strategy.partnerships.forEach(sp => engine.addBullet(sp.name, sp.description));
    }

    if (strategy.experienceDesign) {
      engine.addSectionHeader('Brand Experience Design');
      engine.addBody(strategy.experienceDesign);
    }

    engine.save(`${(engine.brandName || 'Brand').replace(/\s+/g, '_')}_Strategy_Blueprint.pdf`);
  },

  /**
   * Export Brand Discovery PDF
   */
  exportDiscovery: (discovery: BrandDiscovery, brandName: string) => {
    const engine = new PDFLayoutEngine({
      brandName: brandName || discovery.registeredName || 'Brand Discovery',
      filename: `${(brandName || discovery.registeredName || 'Brand').replace(/\s+/g, '_')}_Discovery_Blueprint.pdf`
    });

    const { doc } = engine;

    // --- COVER PAGE ---
    doc.setDrawColor(engine.CLR_BRAND[0], engine.CLR_BRAND[1], engine.CLR_BRAND[2]);
    doc.setLineWidth(3);
    doc.line(engine.margin, 80, engine.pageWidth - engine.margin, 80);

    engine.y = engine.pageHeight * 0.35;
    doc.setFont(engine.FONT_MAIN, 'bold');
    doc.setFontSize(32);
    doc.setTextColor(engine.CLR_TITLE[0], engine.CLR_TITLE[1], engine.CLR_TITLE[2]);
    const titleLines = doc.splitTextToSize(engine.brandName || '', engine.contentWidth);
    titleLines.forEach((line: string) => {
      doc.text(line, engine.pageWidth / 2, engine.y, { align: 'center' });
      engine.y += 40;
    });

    doc.setFont(engine.FONT_MAIN, 'normal');
    doc.setFontSize(14);
    doc.setTextColor(engine.CLR_LABEL[0], engine.CLR_LABEL[1], engine.CLR_LABEL[2]);
    doc.text('Brand Discovery Blueprint', engine.pageWidth / 2, engine.y, { align: 'center' });
    
    engine.y += 100;
    doc.setFontSize(10);
    doc.setFont(engine.FONT_MAIN, 'bold');
    doc.text('PREPARED BY', engine.pageWidth / 2, engine.y, { align: 'center' });
    engine.y += 16;
    doc.setFont(engine.FONT_MAIN, 'normal');
    doc.text('BrandForge Intelligence Engine', engine.pageWidth / 2, engine.y, { align: 'center' });
    engine.y += 24;
    doc.text(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), engine.pageWidth / 2, engine.y, { align: 'center' });

    doc.setDrawColor(engine.CLR_BRAND[0], engine.CLR_BRAND[1], engine.CLR_BRAND[2]);
    doc.setLineWidth(3);
    doc.line(engine.margin, engine.pageHeight - 80, engine.pageWidth - engine.margin, engine.pageHeight - 80);

    // --- CONTENT ---
    const resolveOther = (val: string, otherVal?: string) => val === 'Other' && otherVal ? otherVal : val;
    const resolveListOther = (arr: string[] = [], otherVal?: string) => 
      arr.map(i => i === 'Other' && otherVal ? otherVal : i).filter(Boolean).join(', ');

    // Section 2: Client Details
    engine.addSectionHeader('Client Details');
    engine.addBullet('Email', discovery.email);
    engine.addBullet('Full Name', discovery.fullName);
    engine.addBullet('Business Owner Title', discovery.ownerTitle);
    engine.addBullet('Phone Number', discovery.phone);
    engine.addBullet('Can we contact you?', discovery.canContact ? 'Yes' : 'No');

    // Section 3: Brand Profile
    engine.addSectionHeader('Brand Profile');
    engine.addBullet('Registered Business Name', discovery.registeredName);
    engine.addBullet('Tagline / Motto', discovery.tagline);
    engine.addBullet('Business Address', discovery.address);
    engine.addBullet('Date Established', discovery.dateEstablished);
    engine.addBullet('Industry', resolveOther(discovery.industry, discovery.industryOther));
    engine.addBullet('Stage of Business', resolveOther(discovery.stage, discovery.stageOther));

    // Section 4: Your Story
    engine.addSectionHeader('Your Story');
    engine.addSubtitle('What is the mission of this Brand?');
    engine.addBody(discovery.mission);
    engine.addSubtitle('What is the vision of this Brand?');
    engine.addBody(discovery.vision);
    engine.addSubtitle('What is Your Brand Philosophy');
    engine.addBody(discovery.philosophy);
    engine.addSubtitle('What Problem is your Business Solving?');
    engine.addBody(discovery.problemSolving);
    engine.addSubtitle('What service or products do you offer?');
    engine.addBody(discovery.productsServices);
    engine.addSubtitle('Who are you offering the Services to?');
    engine.addBody(discovery.idealCustomers);

    // Section 5: How Your Business Works
    engine.addSectionHeader('How Your Business Works');
    engine.addSubtitle('How are you offering this service?');
    engine.addBody(resolveListOther(discovery.deliveryModel, discovery.deliveryModelOther));
    engine.addSubtitle('What benefits do you provide for your customers?');
    engine.addBody(resolveListOther(discovery.customerBenefits, discovery.customerBenefitsOther));

    // Section 6: Your Brand Foundation
    engine.addSectionHeader('Your Brand Foundation');
    engine.addSubtitle('What are your Brand Core Values?');
    engine.addBody(resolveListOther(discovery.coreValues, discovery.coreValuesOther));
    engine.addSubtitle('What are your Brand Strengths?');
    engine.addBody(resolveListOther(discovery.strengths, discovery.strengthsOther));
    engine.addSubtitle('What are your Weakness / Limitations?');
    engine.addBody(resolveListOther(discovery.weaknesses, discovery.weaknessesOther));

    // Section 7: Brand Identity
    engine.addSectionHeader('Brand Identity');
    engine.addBullet('What is your Brand Name?', discovery.brandNameLogo);
    engine.addBullet('Colour & Symbols', discovery.colorSymbols);
    engine.addSubtitle('What is the meaning or story behind your Brand Name?');
    engine.addBody(discovery.brandStory);
    engine.addSubtitle('Brand Feel / Visual Direction');
    engine.addBody(resolveListOther(discovery.brandFeel, discovery.brandFeelOther));
    engine.addSubtitle('Emotional Experience');
    engine.addBody(resolveListOther(discovery.customerEmotionalOutcome, discovery.customerEmotionalOutcomeOther));

    // Section 8: Competition
    engine.addSectionHeader('Competition');
    engine.addSubtitle('Who are your competitors and why?');
    engine.addBody(discovery.competitors);
    engine.addSubtitle('What are their Strengths and weaknesses?');
    engine.addBody(discovery.competitorAnalysis);
    engine.addSubtitle('What makes you different from your competitors?');
    engine.addBody(discovery.differentiation);

    // Section 9: Project Details
    engine.addSectionHeader('Project Details');
    engine.addBullet('What is your deadline for this project?', discovery.deadline);
    engine.addSubtitle('Future Plans / Innovation');
    engine.addBody(discovery.futurePlans);

    engine.save(`${(engine.brandName || 'Brand').replace(/\s+/g, '_')}_Discovery_Blueprint.pdf`);
  },

  /**
   * Export Logo Strategy PDF
   */
  exportLogo: (data: LogoAssistantData, discovery: BrandDiscovery, brandName: string) => {
    const engine = new PDFLayoutEngine({
      brandName: brandName || discovery.brandNameLogo || discovery.registeredName || 'BrandForge Project',
      filename: `${(brandName || discovery.brandNameLogo || discovery.registeredName || 'Brand').replace(/\s+/g, '_')}_Logo_Strategy.pdf`
    });

    const { doc } = engine;

    // --- COVER PAGE ---
    doc.setDrawColor(engine.CLR_BRAND[0], engine.CLR_BRAND[1], engine.CLR_BRAND[2]);
    doc.setLineWidth(3);
    doc.line(engine.margin, 80, engine.pageWidth - engine.margin, 80);

    engine.y = engine.pageHeight * 0.35;
    doc.setFont(engine.FONT_MAIN, 'bold');
    doc.setFontSize(32);
    doc.setTextColor(engine.CLR_TITLE[0], engine.CLR_TITLE[1], engine.CLR_TITLE[2]);
    const titleLines = doc.splitTextToSize(engine.brandName || '', engine.contentWidth);
    titleLines.forEach((line: string) => {
      doc.text(line, engine.pageWidth / 2, engine.y, { align: 'center' });
      engine.y += 40;
    });

    doc.setFont(engine.FONT_MAIN, 'normal');
    doc.setFontSize(14);
    doc.setTextColor(engine.CLR_LABEL[0], engine.CLR_LABEL[1], engine.CLR_LABEL[2]);
    doc.text('Logo Strategy Blueprint', engine.pageWidth / 2, engine.y, { align: 'center' });
    
    engine.y += 100;
    doc.setFontSize(10);
    doc.setFont(engine.FONT_MAIN, 'bold');
    doc.text('PREPARED BY', engine.pageWidth / 2, engine.y, { align: 'center' });
    engine.y += 16;
    doc.setFont(engine.FONT_MAIN, 'normal');
    doc.text('BrandForge Intelligence Engine', engine.pageWidth / 2, engine.y, { align: 'center' });
    engine.y += 24;
    doc.text(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), engine.pageWidth / 2, engine.y, { align: 'center' });

    doc.setDrawColor(engine.CLR_BRAND[0], engine.CLR_BRAND[1], engine.CLR_BRAND[2]);
    doc.setLineWidth(3);
    doc.line(engine.margin, engine.pageHeight - 80, engine.pageWidth - engine.margin, engine.pageHeight - 80);

    // --- CONTENT ---
    engine.addSectionHeader('Identity Foundation');
    engine.addTitle('The Brand Noun Toolkit');
    engine.addBody('A collection of 50 name-ready constructs and visual anchors categorized by linguistic territory.');

    const categories = [
      { label: 'Real Words', items: data.nouns.realWords },
      { label: 'Invented Words', items: data.nouns.inventedWords },
      { label: 'Compound Words', items: data.nouns.compoundWords },
      { label: 'Metaphorical Nouns', items: data.nouns.metaphoricalNouns },
      { label: 'Abstract Constructs', items: data.nouns.abstractConstructs }
    ];

    categories.forEach(cat => {
      if (cat.items.length > 0) {
        engine.addSubtitle(cat.label);
        cat.items.forEach(item => {
          const noun = typeof item === 'string' ? { word: item, anchor: '', territory: '' } : item;
          const label = (noun.territory && noun.territory !== 'Normal') 
            ? `${noun.word} (${noun.territory})` 
            : (noun.word || '');
          
          if (noun.anchor) {
            engine.addBullet(label, noun.anchor);
          } else if (noun.word) {
            engine.addBody(noun.word);
          }
        });
      }
    });

    engine.addSectionHeader('Strategic Directions');
    engine.addBody('Three expansive visual rationales tailored to the brand spirit and archetype.');

    data.concepts.forEach((concept, i) => {
      engine.addSubtitle(`Direction 0${i + 1}`);
      engine.addBody(concept);
    });

    if (data.smushes.length > 0) {
      engine.addSectionHeader('Concept Smush Pairings');
      engine.addBody('Clever visual pairings synthesized from the toolkit to create unique, memorable identity marks.');

      data.smushes.forEach((smush) => {
        engine.addSubtitle(`${smush.pair[0]} + ${smush.pair[1]}`);
        engine.addBody(smush.description);
      });
    }

    if (data.variations.length > 0) {
      engine.addSectionHeader('Adaptive Identity System');
      engine.addBody('Essential logo lockups and functional touchpoints defined for professional brand handoff.');

      data.variations.forEach(v => {
        const [title, rationale] = (v || '').split(':');
        engine.addSubtitle(title.trim());
        engine.addBody(rationale?.trim() || '');
      });
    }

    engine.save(`${(engine.brandName || 'Brand').replace(/\s+/g, '_')}_Logo_Strategy.pdf`);
  }
};
