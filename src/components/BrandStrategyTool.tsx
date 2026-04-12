import React, { useState, useEffect, useRef } from 'react';
import { BrandDiscovery, BrandStrategy, AppNotification } from '../types';
import { Card, Button } from './UI';
import { cn } from '../lib/utils';
import { 
  Compass, 
  MessageSquare, 
  BookOpen, 
  Layers, 
  Loader2, 
  CheckCircle2, 
  RefreshCw, 
  Sparkles, 
  Users, 
  Target, 
  ShieldCheck, 
  Palette, 
  Megaphone, 
  Smile, 
  TrendingUp, 
  Map,
  ArrowRight,
  Info,
  Zap,
  Layout,
  Globe,
  Briefcase,
  Search,
  Eye,
  Settings,
  CreditCard,
  UserCheck,
  Award,
  Download,
  ChevronRight,
  X,
  AlertTriangle,
  AlertCircle,
  Type,
  Quote,
  Copy,
  Check,
  BarChart3,
  Lightbulb
} from 'lucide-react';
import { brandService } from '../services/brandService';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Props {
  discovery: BrandDiscovery;
  onUpdate?: (strategy: BrandStrategy) => void;
  onComplete: (strategy: BrandStrategy, nextStep?: 'dashboard' | 'logo') => Promise<void>;
  onModifyDiscovery?: () => void;
  initialData?: BrandStrategy;
  projectName?: string;
  clientName?: string;
  addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => Promise<void>;
}

export const BrandStrategyTool = ({ discovery, onUpdate, onComplete, onModifyDiscovery, initialData, projectName, clientName, addNotification }: Props) => {
  const [loading, setLoading] = useState(!initialData);
  const [strategy, setStrategy] = useState<BrandStrategy | null>(initialData || null);
  const [error, setError] = useState<string | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [strategyError, setStrategyError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const renderRef = useRef(true);

  // Auto-save whenever strategy changes (Debounced to save quota)
  useEffect(() => {
    if (renderRef.current) {
      renderRef.current = false;
      return;
    }
    
    if (onUpdate && strategy) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        onUpdate(strategy);
      }, 3000); // 3 second debounce
    }

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [strategy, onUpdate]);

  const generateStrategy = async (isRefining = false, forceAI = false) => {
    setLoading(true);
    setError(null);
    setStrategyError(null);
    
    addNotification({
      title: isRefining ? 'Refining Strategy' : 'Universal Strategy Engine Active',
      type: 'info',
      message: 'Applying Maslow models and Jungian archetypes to your brand foundation.',
      link: 'step:strategy'
    });

    try {
      // If forceAI is true, we disable fallback to show the actual error to the user
      const data = await brandService.generateBrandStrategy(discovery, isRefining ? (strategy || undefined) : undefined, !forceAI);
      setStrategy(data);
      
      addNotification({
        title: 'Brand Blueprint Generated',
        type: 'success',
        message: `Successfully synthesized strategic pillars for ${discovery.brandNameLogo || discovery.name}.`,
        link: 'step:strategy'
      });
    } catch (err: any) {
      if (forceAI) {
        setStrategyError(err.message || 'AI generation failed. Please check your API usage limits and key.');
      } else {
        setError('Failed to generate brand strategy. Please try again.');
        console.error(err);
      }
      
      addNotification({
        title: 'AI Strategy Component Failed',
        type: 'error',
        message: err.message || 'The strategy engine encountered an unexpected error.',
        link: 'step:strategy'
      });
    } finally {
      setLoading(false);
    }
  };

  // Navbar bridge: Listen for requests from the global header
  useEffect(() => {
    const handleRefine = () => generateStrategy(true);
    const handleModify = () => onModifyDiscovery?.();
    const handleApprove = () => setShowCompleteModal(true); // Open the approval modal

    window.addEventListener('brandforge:refine-strategy', handleRefine);
    window.addEventListener('brandforge:modify-discovery', handleModify);
    window.addEventListener('brandforge:approve-strategy', handleApprove);
    
    return () => {
      window.removeEventListener('brandforge:refine-strategy', handleRefine);
      window.removeEventListener('brandforge:modify-discovery', handleModify);
      window.removeEventListener('brandforge:approve-strategy', handleApprove);
    };
  }, [discovery, onModifyDiscovery]); // Re-bind if props change

  const alignStrategicArchitecture = () => {
    if (!strategy || !onUpdate) return;
    
    const updatedStrategy = {
      ...strategy,
      audience: {
        ...strategy.audience,
        groups: [
          {
            name: 'Celebrants',
            description: 'Individuals planning milestone personal events including weddings, birthdays, and private anniversaries.',
            needs: 'Memorable experiences, seamless logistics, and high-quality venue aesthetics.',
            painPoints: 'High stress, fear of technical failure, and difficulty finding unique, reliable locations.'
          },
          {
            name: 'Corporate & Professional',
            description: 'Organizations and professional groups organizing seminars, team-building sessions, and corporate launches.',
            needs: 'Technical reliability, professional environment, and scalable catering/seating.',
            painPoints: 'Budget constraints, need for rigid schedules, and search for impressive yet functional spaces.'
          },
          {
            name: 'Entertainment & Nightlife',
            description: 'Promoters, performers, and groups planning parties, clubbing events, and live stage shows.',
            needs: 'Advanced AV/Video mapping tech, high-energy atmosphere, and festival-grade space.',
            painPoints: 'Inadequate tech support, restrictive sound limits, and lack of "vibe" in standard venues.'
          },
          {
            name: 'Cultural & Community Groups',
            description: 'Non-profits, local councils, and cultural organizations hosting community-focused gatherings or festivals.',
            needs: 'Accessibility, inclusive environments, and strong local connection.',
            painPoints: 'Affordability, complex permit requirements, and lack of large-scale community-safe spaces.'
          }
        ]
      }
    };
    
    setStrategy(updatedStrategy);
    onUpdate(updatedStrategy);
    
    addNotification({
      title: 'Strategy Aligned',
      type: 'success',
      message: 'Project audience segments updated to the 4-pillar event framework.',
      link: 'step:strategy'
    });
  };

  useEffect(() => {
    if (!initialData) {
      generateStrategy();
    }
  }, [discovery]);

  const handleFinalComplete = async (nextStep: 'dashboard' | 'logo') => {
    if (!strategy) return;
    setIsCompleting(true);
    try {
      // Don't block navigation on the save, but trigger it
      onComplete(strategy, nextStep);
    } catch (err) {
      console.error('Completion error:', err);
      setError('Failed to complete strategy approval. Please try again.');
      setShowCompleteModal(false);
    } finally {
      setIsCompleting(false);
    }
  };

  // Helper to render text that may contain bullet points
  const renderText = (text: string) => {
    if (!text) return 'N/A';
    
    // Detect any line starting with a bullet character ( -, * , • )
    const lines = text.split('\n');
    const hasBullets = lines.some(l => /^\s*[-*•]/.test(l));
    
    if (hasBullets) {
      const items: React.ReactNode[] = [];
      let currentPara: string[] = [];
      
      lines.forEach((line, i) => {
        // Match bullet character at start of line, with optional leading/trailing whitespace
        const bulletMatch = line.match(/^\s*[-*•]\s*(.*)/);
        if (bulletMatch) {
          if (currentPara.length > 0) {
            items.push(<p key={`p-${i}`} className="text-slate-600 leading-relaxed text-sm">{currentPara.join(' ')}</p>);
            currentPara = [];
          }
          items.push(
            <li key={`li-${i}`} className="flex items-start gap-3 group">
              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0 group-hover:scale-125 transition-transform shadow-sm" />
              <span className="text-slate-600 text-sm leading-relaxed">{bulletMatch[1]}</span>
            </li>
          );
        } else if (line.trim()) {
          currentPara.push(line.trim());
        }
      });
      
      if (currentPara.length > 0) {
        items.push(<p key="p-last" className="text-slate-600 leading-relaxed text-sm">{currentPara.join(' ')}</p>);
      }
      
      return (
        <div className="space-y-4">
          <ul className="space-y-2 pl-2">
            {items}
          </ul>
        </div>
      );
    }
    
    const paragraphs = text.split(/\n+/).filter(p => p.trim());
    return (
      <div className="space-y-4">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-slate-600 leading-relaxed text-sm">{p.trim()}</p>
        ))}
      </div>
    );
  };

  const handleDownloadPDF = async () => {
    if (!strategy) return;
    
    setIsDownloading(true);
    try {
      const brandName = discovery.brandNameLogo || discovery.registeredName || discovery.name || 'Brand';
      const pName = projectName || brandName;
      const cName = clientName || discovery.fullName || '';
      const location = discovery.address || strategy.overview.whereWeAre || '';
      const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 50;
      const headerHeight = 35;
      const footerHeight = 30;
      const contentWidth = pageWidth - margin * 2;
      const contentTop = margin + headerHeight;
      let y = contentTop;

      // Add header & footer to current page (skip cover page)
      const addHeaderFooter = () => {
        // Header: Project Title
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184);
        pdf.text(pName.toUpperCase(), margin, margin - 5);
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.5);
        pdf.line(margin, margin + 5, pageWidth - margin, margin + 5);

        // Footer: BrandForge branding + page number
        const pageNum = (pdf as any).internal.getCurrentPageInfo().pageNumber;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.setTextColor(148, 163, 184);
        pdf.text('Generated by BrandForge Ultimate Branding Suite', margin, pageHeight - 25);
        pdf.text(`Page ${pageNum}`, pageWidth - margin, pageHeight - 25, { align: 'right' });
        pdf.setDrawColor(226, 232, 240);
        pdf.line(margin, pageHeight - 35, pageWidth - margin, pageHeight - 35);
      };

      const checkPage = (needed: number) => {
        if (y + needed > pageHeight - margin - footerHeight) {
          pdf.addPage();
          addHeaderFooter();
          y = contentTop;
        }
      };

      const addTitle = (text: string, size = 22) => {
        checkPage(size + 20);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(size);
        pdf.setTextColor(30, 41, 59);
        pdf.text(text, margin, y);
        y += size + 12;
      };

      const addSubtitle = (text: string) => {
        checkPage(30);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(13);
        pdf.setTextColor(37, 99, 235);
        pdf.text(text.toUpperCase(), margin, y);
        y += 18;
      };

      const addBody = (text: string) => {
        if (!text) return;
        
        const lines = text.split('\n');
        const hasBullets = lines.some(l => /^\s*[-*•]/.test(l));

        if (hasBullets) {
          for (const line of lines) {
            const bulletMatch = line.match(/^\s*[-*•]\s*(.*)/);
            if (bulletMatch) {
              addBullet(bulletMatch[1].trim());
            } else if (line.trim()) {
              addBodyText(line.trim());
            }
          }
          y += 6;
          return;
        }
        
        addBodyText(text);
      };

      const addBodyText = (text: string) => {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(71, 85, 105);
        const lines = pdf.splitTextToSize(text, contentWidth);
        for (const line of lines) {
          checkPage(14);
          pdf.text(line, margin, y);
          y += 14;
        }
        y += 6;
      };

      const addBullet = (text: string) => {
        if (!text) return;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(71, 85, 105);
        const lines = pdf.splitTextToSize(text, contentWidth - 15);
        checkPage(14);
        pdf.text('•', margin, y);
        for (let i = 0; i < lines.length; i++) {
          if (i > 0) checkPage(14);
          pdf.text(lines[i], margin + 15, y);
          y += 14;
        }
      };

      const addSpacer = (h = 16) => { y += h; };
      
      const addDivider = () => {
        checkPage(20);
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.5);
        pdf.line(margin, y, pageWidth - margin, y);
        y += 16;
      };

      // ═══ COVER PAGE ═══
      // Decorative top line
      pdf.setDrawColor(37, 99, 235);
      pdf.setLineWidth(3);
      pdf.line(margin, 80, pageWidth - margin, 80);

      // Brand name (large)
      y = pageHeight * 0.30;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(36);
      pdf.setTextColor(30, 41, 59);
      const titleLines = pdf.splitTextToSize(brandName, contentWidth);
      for (const line of titleLines) {
        pdf.text(line, pageWidth / 2, y, { align: 'center' });
        y += 42;
      }
      
      // Subtitle
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(16);
      pdf.setTextColor(100, 116, 139);
      pdf.text('Brand Strategy Document', pageWidth / 2, y + 10, { align: 'center' });
      
      // Divider line
      y += 40;
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.5);
      pdf.line(pageWidth / 2 - 80, y, pageWidth / 2 + 80, y);
      y += 30;

      // Project details block
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139);
      
      if (cName) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(148, 163, 184);
        pdf.text('CLIENT', pageWidth / 2, y, { align: 'center' });
        y += 14;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(12);
        pdf.setTextColor(71, 85, 105);
        pdf.text(cName, pageWidth / 2, y, { align: 'center' });
        y += 24;
      }

      if (pName && pName !== brandName) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(148, 163, 184);
        pdf.text('PROJECT', pageWidth / 2, y, { align: 'center' });
        y += 14;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(12);
        pdf.setTextColor(71, 85, 105);
        pdf.text(pName, pageWidth / 2, y, { align: 'center' });
        y += 24;
      }

      if (location) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(148, 163, 184);
        pdf.text('LOCATION', pageWidth / 2, y, { align: 'center' });
        y += 14;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(12);
        pdf.setTextColor(71, 85, 105);
        const locLines = pdf.splitTextToSize(location, contentWidth - 100);
        for (const line of locLines) {
          pdf.text(line, pageWidth / 2, y, { align: 'center' });
          y += 16;
        }
        y += 8;
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(148, 163, 184);
      pdf.text('DATE', pageWidth / 2, y, { align: 'center' });
      y += 14;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(12);
      pdf.setTextColor(71, 85, 105);
      pdf.text(dateStr, pageWidth / 2, y, { align: 'center' });

      // Cover page footer
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(180, 190, 200);
      pdf.text('Generated by BrandForge Ultimate Branding Suite', pageWidth / 2, pageHeight - 40, { align: 'center' });
      pdf.setDrawColor(37, 99, 235);
      pdf.setLineWidth(3);
      pdf.line(margin, pageHeight - 60, pageWidth - margin, pageHeight - 60);

      // ═══ CONTENT PAGES ═══
      pdf.addPage();
      addHeaderFooter();
      y = contentTop;
      
      addTitle('Brand Overview');
      addSubtitle('Brand Story');
      addBody(strategy.story);
      addSubtitle('The Identity');
      addBody(strategy.overview.whoWeAre);
      addSubtitle('The Offering');
      addBody(strategy.overview.whatWeDo);
      addSubtitle('The Methodology');
      addBody(strategy.overview.howWeDoIt);
      addSubtitle('The Presence');
      addBody(strategy.overview.whereWeAre);

      addDivider();
      addTitle('Strategic Foundation');
      addSubtitle('Mission');
      addBody(strategy.foundation.mission);
      addSubtitle('Vision');
      addBody(strategy.foundation.vision);
      addSubtitle('Philosophy');
      addBody(strategy.foundation.philosophy);

      addDivider();
      addTitle('Core Idea');
      addBody(strategy.coreIdea);
      addSpacer();
      addSubtitle('Brand Story');
      addBody(strategy.story);

      addDivider();
      addTitle('Audience Intelligence');
      addSubtitle(`Maslow Level: ${strategy.audience.maslowLevel}`);
      addBody(strategy.audience.maslowExplanation);
      addSubtitle('Need Type');
      addBody(strategy.audience.maslowNeedType);
      addSpacer();
      for (const group of strategy.audience.groups) {
        addSubtitle(group.name);
        addBody(group.description);
        addBullet(`Needs: ${group.needs}`);
        addBullet(`Pain Points: ${group.painPoints}`);
        addSpacer(8);
      }
      addSubtitle('Audience Narrative');
      addBody(strategy.audience.narrative);

      addDivider();
      addTitle('Market Positioning');
      addSubtitle('Positioning Statement');
      addBody(strategy.marketPosition.statement);
      addSubtitle('Quadrant');
      addBody(strategy.marketPosition.quadrant);
      addSubtitle('Competitive Analysis');
      addBody(strategy.marketPosition.analysis);
      addSubtitle('Market Gap');
      addBody(strategy.marketPosition.gapHighlight);
      addSpacer();
      addSubtitle('Key Competitors');
      for (const comp of strategy.marketPosition.competitors) {
        addBullet(comp.name);
      }

      addDivider();
      addTitle('Brand Archetype');
      addSubtitle(`Primary: ${strategy.archetype.primary.name}`);
      addBody(strategy.archetype.primary.description);
      addBullet(`Traits: ${strategy.archetype.primary.traits.join(', ')}`);
      addBody(strategy.archetype.primary.inPractice);
      addSpacer();
      addSubtitle(`Secondary: ${strategy.archetype.secondary.name}`);
      addBody(strategy.archetype.secondary.description);
      addBullet(`Traits: ${strategy.archetype.secondary.traits.join(', ')}`);
      addBody(strategy.archetype.secondary.inPractice);
      addSpacer();
      addSpacer();
      addSubtitle('Brand Tone');
      addBody(strategy.archetype.behavior.tone.description);
      addSpacer(4);
      addSubtitle('Tone Framework');
      addBody(strategy.archetype.behavior.tone.framework || 'N/A');
      addSpacer(4);
      addSubtitle('Communication Examples');
      for (const ex of strategy.archetype.behavior.tone.examples) {
        addBullet(ex);
      }
      
      if (strategy.archetype.behavior.tone.useCases?.length > 0) {
        addSpacer();
        addSubtitle('Communication Templates (Messaging Workbench)');
        for (const useCase of strategy.archetype.behavior.tone.useCases) {
          checkPage(60);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(11);
          pdf.setTextColor(30, 41, 59);
          pdf.text(`${useCase.category.toUpperCase()}: ${useCase.platform} (${useCase.targetAudience})`, margin, y);
          y += 16;
          
          addBody(useCase.contentTemplate);
          addBullet(`Guidelines: ${useCase.guidelines}`);
          addBullet(`Archetype Sync: ${useCase.archetypeSync}`);
          addSpacer(12);
        }
      }


      addDivider();
      addTitle('Brand Values');
      for (const val of strategy.values) {
        addSubtitle(val.name);
        addBody(val.description);
      }

      addDivider();
      addTitle('Identity System');
      addSubtitle('Brand Essence');
      addBody(strategy.essence);
      addSpacer();
      addSubtitle('Color Palette');
      for (const color of strategy.identitySystem.colors) {
        addBullet(`${color.color} — ${color.meaning} (${color.application})`);
      }
      addSpacer();
      addSubtitle('Logo Direction');
      addBody(strategy.identitySystem.logoDirection.description);
      addSpacer(4);
      addSubtitle('Visual Rationale');
      addBody(strategy.identitySystem.logoDirection.rationale);
      addSubtitle('Primary Typeface');
      addBody(`${strategy.identitySystem.typography.primary.name} — ${strategy.identitySystem.typography.primary.usage}`);
      addBody(strategy.identitySystem.typography.primary.description);
      addSpacer();
      addSubtitle('Secondary Typeface');
      addBody(`${strategy.identitySystem.typography.secondary.name} — ${strategy.identitySystem.typography.secondary.usage}`);
      addBody(strategy.identitySystem.typography.secondary.description);

      addDivider();
      addTitle('Messaging Framework');
      addSubtitle('Core Message');
      addBody(strategy.messaging.coreMessage);
      addSubtitle('Brand Keywords');
      addBody(strategy.messaging.keywords.join('  •  '));

      addDivider();
      addTitle('Customer Journey');
      for (const stage of strategy.customerJourney) {
        addSubtitle(`${stage.phase}: ${stage.stage}`);
        addBody(stage.action);
        addBullet(`Touchpoints: ${stage.touchpoints.join(', ')}`);
        addBullet(`KPIs: ${stage.kpis.join(', ')}`);
        addBody(stage.insights);
        addSpacer(8);
      }

      addDivider();
      addTitle('Brand Touchpoints');
      for (const tp of strategy.touchPoints) {
        addSubtitle(tp.category);
        addBullet(tp.items.join(', '));
        addSpacer(8);
      }

      addDivider();
      addTitle('Growth & Partnerships');
      addSubtitle('Growth Programs');
      for (const prog of strategy.growthPrograms) {
        checkPage(40);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(30, 41, 59);
        pdf.text(prog.name, margin, y);
        y += 16;
        addBody(prog.description);
      }
      addSpacer();
      addSubtitle('Strategic Partnerships');
      for (const part of strategy.partnerships) {
        checkPage(40);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(30, 41, 59);
        pdf.text(part.name, margin, y);
        y += 16;
        addBody(part.description);
      }

      // File name: "ProjectName for ClientName"
      const safePName = pName.replace(/\s+/g, '_');
      const safeCName = cName ? `_for_${cName.replace(/\s+/g, '_')}` : '';
      pdf.save(`${safePName}${safeCName}_Brand_Strategy.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      if (confirm('PDF generation encountered an issue. Would you like to use your browser\'s Print to PDF instead?')) {
        window.print();
      }
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-12 h-12 text-brand-600 animate-spin" />
        <div className="text-center">
          <h3 className="text-xl font-bold text-slate-900">Universal Strategy Engine Active...</h3>
          <p className="text-slate-500">Applying Maslow models, Jungian archetypes, and market positioning logic.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 space-y-4">
        <div className="bg-rose-50 text-rose-600 p-6 rounded-2xl">
          <p className="font-medium">{error}</p>
        </div>
        <Button onClick={() => generateStrategy()} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
      </div>
    );
  }

  if (!strategy) return null;

  return (
    <div className="max-w-none mx-auto space-y-[var(--space-section)] pb-20 font-sans">
      <div ref={contentRef} className="space-y-[var(--space-section)] py-[var(--space-card-p)] px-[var(--space-item)] sm:px-[var(--space-card-p)] bg-slate-50 rounded-[var(--radius-section)]">
        <div className="text-center space-y-[var(--space-item)]">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Brand Strategy</h2>
          <p className="text-slate-500 text-sm sm:text-base">The strategic blueprint for your brand's evolution.</p>
        </div>

        {strategy.isFallback && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-amber-50 border border-amber-100 p-[var(--space-card-p)] rounded-[var(--radius-section)] flex flex-col items-center text-center gap-6 shadow-sm border-dashed"
          >
            <div className="flex flex-col items-center gap-4 max-w-2xl">
              <div className="p-4 bg-white rounded-2xl shadow-sm border border-amber-100">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-bold text-slate-900">Deep AI Analysis Momentarily Unavailable</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  To maintain your momentum, we've generated a foundational strategic framework. 
                  For a complete, high-fidelity AI analysis, click below to trigger the deep engine.
                </p>
              </div>
            </div>

            <div className="w-full max-w-xs space-y-3">
              <Button 
                onClick={() => generateStrategy(true, true)} 
                variant="secondary"
                disabled={loading}
                size="md"
                className="w-full bg-white border-amber-200 hover:bg-amber-500 hover:text-white hover:border-amber-500 text-amber-700 font-bold flex items-center justify-center gap-3 transition-all shadow-sm group"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-amber-400 text-amber-400 group-hover:fill-white group-hover:text-white transition-colors" />}
                <span className="text-sm uppercase tracking-widest">{loading ? 'Synthesizing...' : 'Regenerate Now'}</span>
              </Button>
              
              {strategyError && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[10px] text-rose-600 font-bold bg-white px-4 py-2 rounded-xl border border-rose-100 flex items-center justify-center gap-2 shadow-sm"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  {strategyError}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* 0. Brand Overview */}
      <section className="space-y-8">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <Info className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">Brand Overview</h3>
        </div>

        <div className="space-y-6">
          <Card title="Brand Story" className="border-none shadow-sm bg-white">
            <div className="text-slate-600 leading-relaxed text-sm">{renderText(strategy.story || '')}</div>
          </Card>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <Card title="The Identity" className="h-full border-none shadow-sm bg-white flex flex-col">
              {(() => {
                const text = strategy.overview?.whoWeAre || '';
                
                let desc = '';
                let mottoText = '';
                
                const blocks = text.split(/\n+/).filter(p => p.trim());
                const mottoBlockIdx = blocks.findIndex(p => /motto|tagline|slogan/i.test(p));
                
                if (mottoBlockIdx > 0) {
                  desc = blocks.slice(0, mottoBlockIdx).join('\n\n');
                  mottoText = blocks.slice(mottoBlockIdx).join('\n\n');
                } else if (mottoBlockIdx === 0) {
                  // The AI grouped everything into one block without paragraph spacing.
                  // Split it by sentence to find where the description ends and the motto begins.
                  const sentences = blocks[0].match(/[^.!?]+[.!?]+/g) || [blocks[0]];
                  const mottoSentIdx = sentences.findIndex(s => /motto|tagline|slogan/i.test(s));
                  
                  if (mottoSentIdx > 0) {
                    desc = sentences.slice(0, mottoSentIdx).join(' ').trim();
                    mottoText = sentences.slice(mottoSentIdx).join(' ').trim();
                  } else {
                    mottoText = blocks[0];
                    desc = blocks.slice(1).join('\n\n');
                  }
                }

                if (mottoText) {
                  const match = mottoText.match(/["'“](.*?)["'”]/);
                  const cleanMotto = match ? match[1] : mottoText.replace(/.*(?:motto|tagline|slogan)[^a-z]*/i, '').trim() || mottoText;

                  return (
                    <div className="flex flex-col h-full">
                      {desc && (
                        <div className="text-slate-600 leading-relaxed text-sm pb-3">
                          {renderText(desc)}
                        </div>
                      )}
                      <div className="pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Megaphone className="w-3 h-3 text-indigo-400" />
                          <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Brand Motto</h4>
                        </div>
                        <p className="text-indigo-900 font-medium italic text-base">"{cleanMotto}"</p>
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div className="text-slate-600 leading-relaxed text-sm">
                    {renderText(text)}
                  </div>
                );
              })()}
            </Card>
            <Card title="The Offering" className="h-full border-none shadow-sm bg-white overflow-hidden">
              <div className="flex flex-col gap-4">
                {(() => {
                  const rawText = strategy.overview?.whatWeDo || 'N/A';
                  if (rawText === 'N/A') return <p className="text-slate-400 italic">No services defined.</p>;
                  
                  const cleanText = rawText.replace(/.*offers services ranging from:?\s*/i, '').trim();
                  const items = cleanText
                    .split(/[,;]|\.(?=[A-Z])/)
                    .map(s => s.trim())
                    .filter(s => s.length > 5);

                  if (items.length === 0) return <p className="text-slate-600 leading-relaxed text-sm">{rawText}</p>;

                  return (
                    <div className="pt-1">
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {discovery.brandNameLogo || discovery.name || 'The brand'} emerges to address a critical need{discovery.address ? ` in ${discovery.address}` : ''}: the absence of a truly modern, flexible, and identity-driven destination capable of unifying diverse people and cultures. 
                        By specializing in {items.slice(0, 4).join(', ').toLowerCase()}, the brand creates a vibrant hub where culture, music, and individuals connect, transforming ordinary moments into unforgettable experiences. {discovery.brandNameLogo || discovery.name || 'The brand'} is "{discovery.tagline || 'Your Strategic Partner'}".
                      </p>
                    </div>
                  );
                })()}
              </div>
            </Card>
            <Card title="The Methodology" className="h-full border-none shadow-sm bg-white">
              <div className="text-slate-600 leading-relaxed text-sm">{renderText(strategy.overview?.howWeDoIt || '')}</div>
            </Card>
            <Card title="The Presence" className="h-full border-none shadow-sm bg-white">
              <div className="text-slate-600 leading-relaxed text-sm">{renderText(strategy.overview?.whereWeAre || '')}</div>
            </Card>
          </div>
        </div>
      </section>

      {/* 1. The Core Essence Hero */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[var(--radius-section)] bg-slate-900 p-6 sm:p-10 text-white shadow-lg"
      >
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            Strategic North Star
          </div>
          <div className="space-y-4 max-w-4xl w-full">
            <h3 className="text-xl sm:text-3xl md:text-4xl font-medium tracking-tight leading-snug text-slate-50">
              {strategy.coreIdea}
            </h3>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <div className="w-8 h-px bg-indigo-500/50 hidden sm:block" />
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-light italic">
                "{strategy.essence}"
              </p>
              <div className="w-8 h-px bg-indigo-500/50 hidden sm:block" />
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col gap-[var(--space-section)]">
        {/* Pillar 1: The Brand Soul */}
        <section className="space-y-[var(--space-gap)]">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-[var(--space-item)]">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <BookOpen className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">The Brand Soul</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--space-gap)]">
            <Card title="Mission" className="h-full border-none shadow-sm bg-white">
              <p className="text-slate-600 leading-relaxed text-sm">{strategy.foundation?.mission || 'N/A'}</p>
            </Card>
            <Card title="Vision" className="h-full border-none shadow-sm bg-white">
              <p className="text-slate-600 leading-relaxed text-sm">{strategy.foundation?.vision || 'N/A'}</p>
            </Card>
            <Card title="Philosophy" className="h-full border-none shadow-sm bg-white">
              <p className="text-slate-600 leading-relaxed text-sm">{strategy.foundation?.philosophy || 'N/A'}</p>
            </Card>
          </div>

          <Card title="Core Values" className="border-none shadow-sm bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--space-gap)]">
              {strategy.values?.map((value, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                    {i + 1}
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-slate-900">{value.name}</h5>
                    <p className="text-sm text-slate-600 leading-relaxed">{value.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* Pillar 2: Audience & Experience */}
        <section className="space-y-[var(--space-gap)]">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-[var(--space-item)]">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Audience & Experience</h3>
          </div>

          <div className="space-y-8">
            {/* 1. Maslow Level */}
            <Card title="Psychological Driver (Maslow Level)" className="border-none shadow-sm bg-white">
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                <div className="flex-shrink-0 w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Layers className="w-12 h-12 text-emerald-600" />
                </div>
                <div className="space-y-4 flex-1 text-center md:text-left">
                  <div className="space-y-1">
                    <p className="text-3xl font-bold text-slate-900">{strategy.audience?.maslowLevel || 'N/A'}</p>
                    <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest">Primary Human Need</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                    <div className="flex items-center gap-2 text-slate-700">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <h4 className="text-xs font-bold uppercase tracking-widest">Need Type & Painpoint</h4>
                    </div>
                    <p className="text-lg font-medium text-slate-800">{strategy.audience?.maslowNeedType || 'N/A'}</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{strategy.audience?.maslowExplanation || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* 2. Audience Narrative */}
            <Card title="Audience Narrative" className="border-none shadow-sm bg-white">
              <div className="relative p-8 bg-slate-900 rounded-[25px] overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                  <MessageSquare className="w-24 h-24 text-white" />
                </div>
                <div className="relative z-10 space-y-4">
                  <p className="text-2xl font-light text-slate-200 leading-relaxed italic">
                    "{strategy.audience?.narrative || 'N/A'}"
                  </p>
                  <div className="pt-4 border-t border-slate-800">
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">The Human Story</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* 3. Target Audience Groups */}
            <Card title="Target Audience Segments" className="border-none shadow-sm bg-white">
              {(discovery.industry?.toLowerCase().includes('event') || discovery.industry?.toLowerCase().includes('venue') || discovery.industry?.toLowerCase().includes('entertainment')) && 
               strategy.audience?.groups?.length !== 4 && (
                <div className="mb-8 p-6 bg-brand-50 border border-brand-100 rounded-[20px] flex items-center justify-between gap-6">
                  <div className="flex items-center gap-4 text-brand-700">
                    <Sparkles className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium leading-relaxed">
                      We've identified a specialized **4-Segment Architecture** tailored for event environments ($ Celebrants, Corporate, Nightlife, and Cultural Groups $).
                    </p>
                  </div>
                  <Button 
                    onClick={alignStrategicArchitecture}
                    className="shrink-0 bg-brand-600 hover:bg-brand-700"
                    size="sm"
                  >
                    Apply Framework
                  </Button>
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
                {strategy.audience?.groups?.map((group, i) => (
                  <motion.div 
                    key={i} 
                    whileHover={{ y: -2 }}
                    className="p-[var(--space-card-p)] rounded-[25px] bg-white border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all space-y-[var(--space-gap)] flex flex-col group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1.5 flex-1 pr-4">
                        <h5 className="text-2xl font-bold text-slate-900 leading-tight group-hover:text-brand-600 transition-colors">
                          {group.name}
                        </h5>
                        <p className="text-slate-500 text-sm leading-relaxed font-medium">
                          {group.description}
                        </p>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1 font-mono">
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Segment</span>
                        <span className="text-3xl font-light text-slate-200 tracking-tighter">0{i + 1}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 border-t border-slate-100 flex-1">
                      <div className="space-y-4 relative pr-4">
                        <div className="absolute right-0 top-0 bottom-0 w-px bg-slate-50 hidden sm:block" />
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-500 transition-colors">
                            <Target className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Core Needs</span>
                        </div>
                        <p className="text-slate-600 text-[13px] leading-relaxed">
                          {group.needs}
                        </p>
                      </div>

                      <div className="space-y-4 pl-0 sm:pl-2">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400 group-hover:bg-rose-50 group-hover:text-rose-500 transition-colors">
                            <Info className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pain Points</span>
                        </div>
                        <p className="text-slate-600 text-[13px] leading-relaxed italic">
                          {group.painPoints}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        {/* Pillar 2.5: Customer Journey (Moved here) */}
        <section className="space-y-8">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Customer Journey</h3>
          </div>

          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <div className="overflow-x-auto no-scrollbar scroll-smooth p-2">
              <div className="flex gap-0 min-w-max pb-4">
                {strategy.customerJourney?.map((item, i) => {
                  const Icons = [Eye, RefreshCw, CreditCard, Users, Award];
                  const Icon = Icons[i] || Sparkles;
                  const Colors = [
                    'bg-[#004d40]',
                    'bg-[#f4511e]',
                    'bg-[#1a237e]',
                    'bg-[#4db6ac]',
                    'bg-[#455a64]'
                  ];
                  const total = strategy.customerJourney.length;
                  const clipPath = i === 0 
                    ? 'polygon(0% 0%, 94% 0%, 100% 50%, 94% 100%, 0% 100%)'
                    : i === total - 1
                    ? 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 6% 50%)'
                    : 'polygon(0% 0%, 94% 0%, 100% 50%, 94% 100%, 0% 100%, 6% 50%)';
                  
                  return (
                    <div key={i} className="flex flex-col w-[280px] sm:w-[320px] shrink-0 first:ml-0 -ml-4 relative z-[10]">
                      {/* Header Segment */}
                      <div 
                        className={cn("px-4 py-3 text-left text-white flex flex-row items-center gap-3 h-[85px] shadow-sm", Colors[i])}
                        style={{ 
                          clipPath,
                          zIndex: total - i,
                          paddingLeft: i > 0 ? '55px' : '24px',
                          paddingRight: i < total - 1 ? '45px' : '24px'
                        }}
                      >
                        <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col min-w-0 pr-2">
                          <div className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-70 mb-0.5 truncate">{item.phase}</div>
                          <div className="text-[11px] sm:text-xs font-black uppercase tracking-wider leading-snug line-clamp-2">{item.stage}</div>
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="flex-1 bg-white border-x border-slate-50 p-6 space-y-8 pt-10">
                        {/* Action */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-slate-400">
                            <Zap className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Customer Action</span>
                          </div>
                          <p className="text-[13px] text-slate-700 leading-relaxed font-medium">
                            {item.action}
                          </p>
                        </div>

                        {/* Touchpoints */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-slate-400">
                            <Layers className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Touchpoints</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {item.touchpoints?.map((tp, j) => (
                              <span key={j} className="px-2 py-1 bg-slate-50 text-slate-600 rounded text-[11px] font-medium border border-slate-100">
                                {tp}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* KPIs */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-slate-400">
                            <BarChart3 className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Success Metrics</span>
                          </div>
                          <ul className="space-y-2">
                            {item.kpis?.map((kpi, j) => (
                              <li key={j} className="text-[12px] text-slate-600 flex items-start gap-2">
                                <span className="w-1 h-1 rounded-full bg-slate-300 mt-2 shrink-0" />
                                {kpi}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Insights */}
                        <div className="pt-6 border-t border-slate-50">
                          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 relative group">
                            <div className="absolute -top-2.5 left-4 bg-white px-2 flex items-center gap-1.5 text-brand-600">
                              <Lightbulb className="w-3 h-3" />
                              <span className="text-[9px] font-black uppercase tracking-widest">Insights</span>
                            </div>
                            <p className="text-[12px] text-slate-600 leading-relaxed italic pr-2">
                              "{item.insights}"
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </section>

        {/* Pillar 3: Market Positioning */}
        <section className="space-y-8">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Target className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Market Positioning</h3>
          </div>

          <div className="space-y-8">
            <Card title="Market Positioning Map" className="border-none shadow-sm bg-white">
              <div className="flex flex-col gap-12">
                <div className="w-full aspect-video md:aspect-[21/9] relative bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                  {/* Axes */}
                  <div className="absolute top-1/2 left-0 w-full h-px bg-slate-300" />
                  <div className="absolute top-0 left-1/2 w-px h-full bg-slate-300" />
                  
                  {/* Labels */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{strategy.marketPosition?.axes?.y || 'Y'} (+)</div>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{strategy.marketPosition?.axes?.y || 'Y'} (-)</div>
                  <div className="absolute top-1/2 left-4 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase tracking-widest rotate-90 origin-left">{strategy.marketPosition?.axes?.x || 'X'} (-)</div>
                  <div className="absolute top-1/2 right-4 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase tracking-widest -rotate-90 origin-right">{strategy.marketPosition?.axes?.x || 'X'} (+)</div>

                  {/* Competitors */}
                  {strategy.marketPosition?.competitors?.map((comp, i) => (
                    <motion.div 
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute w-3 h-3 bg-slate-400 rounded-full border-2 border-white shadow-sm z-10"
                      style={{ 
                        left: `${comp.x}%`, 
                        top: `${100 - comp.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] font-medium text-slate-500 border border-slate-100">
                        {comp.name}
                      </div>
                    </motion.div>
                  ))}

                  {/* Brand Marker */}
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute w-6 h-6 bg-amber-500 rounded-full border-4 border-white shadow-lg z-20"
                    style={{ 
                      left: `${strategy.marketPosition?.position?.x || 75}%`, 
                      top: `${100 - (strategy.marketPosition?.position?.y || 75)}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                  <div 
                    className="absolute bg-white px-3 py-1 rounded-lg shadow-md border border-slate-100 z-20 whitespace-nowrap"
                    style={{ 
                      left: `${strategy.marketPosition?.position?.x || 75}%`, 
                      top: `${100 - (strategy.marketPosition?.position?.y || 75)}%`,
                      transform: 'translate(12px, -12px)'
                    }}
                  >
                    <p className="text-[10px] font-bold text-slate-900">Your Brand</p>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-4xl font-black text-slate-100 uppercase tracking-tighter opacity-50">{strategy.marketPosition?.quadrant || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-amber-600 uppercase tracking-widest">Market Analysis</h4>
                    <div className="text-slate-600 leading-relaxed text-sm">{renderText(strategy.marketPosition?.analysis || '')}</div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-amber-600 uppercase tracking-widest">The Competitors</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {strategy.marketPosition?.competitors?.map((comp, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="font-bold text-slate-900 text-sm">{comp.name}</span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest">Direct Competitor</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-2 p-6 bg-amber-50 rounded-2xl border border-amber-100 space-y-3">
                    <div className="flex items-center gap-2 text-amber-700">
                      <Zap className="w-4 h-4" />
                      <h4 className="text-xs font-bold uppercase tracking-widest">The Strategic Gap</h4>
                    </div>
                    <p className="text-sm text-amber-900 font-medium leading-relaxed italic">"{strategy.marketPosition?.gapHighlight || 'N/A'}"</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Positioning Statement" className="border-none shadow-sm bg-white">
              <p className="text-xl font-medium text-slate-800 leading-relaxed text-center italic">
                "{strategy.marketPosition?.statement || 'N/A'}"
              </p>
            </Card>
          </div>
        </section>

        {/* Pillar 4: Brand Personality */}
        <section className="space-y-8">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Smile className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Brand Personality</h3>
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 rounded-[25px] bg-slate-900 text-white space-y-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded-full uppercase tracking-wider border border-amber-500/30">Primary Archetype</span>
                </div>
                <div className="space-y-2">
                  <h5 className="text-3xl font-bold text-amber-400">{strategy.archetype?.primary?.name || 'N/A'}</h5>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">{strategy.archetype?.primary?.jungianModel || 'N/A'}</p>
                </div>
                <p className="text-slate-300 leading-relaxed">{strategy.archetype?.primary?.description || 'N/A'}</p>
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <h6 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">In Practice</h6>
                  <p className="text-sm text-slate-400 leading-relaxed italic">"{strategy.archetype?.primary?.inPractice || 'N/A'}"</p>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {strategy.archetype?.primary?.traits?.map((trait, i) => (
                    <span key={i} className="px-3 py-1 bg-slate-800 text-slate-300 text-[10px] rounded-full border border-slate-700">{trait}</span>
                  ))}
                </div>
              </div>

              <div className="p-8 rounded-[32px] bg-white border border-slate-200 space-y-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full uppercase tracking-wider border border-slate-200">Secondary Archetype</span>
                </div>
                <div className="space-y-2">
                  <h5 className="text-3xl font-bold text-slate-900">{strategy.archetype?.secondary?.name || 'N/A'}</h5>
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">{strategy.archetype?.secondary?.jungianModel || 'N/A'}</p>
                </div>
                <p className="text-slate-600 leading-relaxed">{strategy.archetype?.secondary?.description || 'N/A'}</p>
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h6 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">In Practice</h6>
                  <p className="text-sm text-slate-500 leading-relaxed italic">"{strategy.archetype?.secondary?.inPractice || 'N/A'}"</p>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {strategy.archetype?.secondary?.traits?.map((trait, i) => (
                    <span key={i} className="px-3 py-1 bg-slate-50 text-slate-600 text-[10px] rounded-full border border-slate-200">{trait}</span>
                  ))}
                </div>
              </div>
            </div>

            <Card title="Brand Role & Impact" className="border-none shadow-sm bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-orange-600 uppercase tracking-widest">The Brand's Role</h4>
                  <p className="text-slate-700 leading-relaxed">{strategy.archetype?.behavior?.role || 'N/A'}</p>
                </div>
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-orange-600 uppercase tracking-widest">The Emotional Impact</h4>
                  <p className="text-slate-700 leading-relaxed">{strategy.archetype?.behavior?.impact || 'N/A'}</p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Pillar 5: Identity & Messaging */}
        <section className="space-y-8">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Palette className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Identity & Messaging</h3>
          </div>

          <div className="space-y-8">
            <Card title="Brand Identity System" className="border-none shadow-sm bg-white">
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {strategy.identitySystem?.colors?.map((c, i) => {
                    const hexMatch = c.color.match(/#[0-9A-Fa-f]{6}/);
                    const hex = hexMatch ? hexMatch[0] : '#CBD5E1'; // Fallback to slate-300
                    const colorName = c.color.split(' (')[0];

                    return (
                      <div key={i} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                        <div 
                          className="aspect-video rounded-xl shadow-inner border border-black/10 transition-transform hover:scale-[1.02]"
                          style={{ backgroundColor: hex }}
                        />
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <p className="text-sm font-bold text-slate-900">{colorName}</p>
                            <code className="label-xs font-mono text-slate-500 bg-slate-200/50 px-1.5 py-0.5 rounded tracking-normal"> {hex}</code>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-tight">{c.meaning}</p>
                          <div className="pt-2 border-t border-slate-200 mt-2">
                            <p className="label-xs text-slate-400">Application</p>
                            <p className="text-[10px] text-slate-600">{c.application}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-4">
                  {/* Typography Direction - Refined 2-Column Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[strategy.identitySystem.typography.primary, strategy.identitySystem.typography.secondary].map((typo, idx) => {
                      const isPrimary = idx === 0;
                      return (
                        <div key={idx} className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 space-y-8 flex flex-col">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                            <div className="flex items-center gap-3">
                              <span className={cn(
                                "px-3 py-1 rounded-md label-xs",
                                isPrimary ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-600"
                              )}>
                                {isPrimary ? 'Primary Typeface' : 'Secondary Typeface'}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-70">
                                {typo.usage}
                              </span>
                            </div>
                            <div className="p-1.5 bg-white rounded-lg shadow-sm border border-slate-100">
                              <Type className="w-4 h-4 text-slate-400" />
                            </div>
                          </div>

                          <div className="space-y-6 flex-1">
                            <div className="space-y-4">
                              <h6 className="text-4xl font-bold text-slate-900 tracking-tight">{typo.name}</h6>
                              <div className="flex flex-wrap gap-2">
                                {typo.traits.map((trait, i) => (
                                  <span key={i} className="px-2 py-1 bg-white text-slate-500 text-[10px] font-bold uppercase tracking-tight rounded-md border border-slate-200">
                                    {trait}
                                  </span>
                                ))}
                              </div>
                            </div>
                            
                            <p className="text-sm text-slate-600 leading-relaxed font-light">
                              {typo.description}
                            </p>
                          </div>

                          <div className="pt-6 border-t border-slate-200">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Application Platforms</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {typo.platforms.map((platform, i) => (
                                <span key={i} className="text-[11px] font-medium text-slate-500">
                                  {platform}{i < typo.platforms.length - 1 ? ' • ' : ''}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-8 bg-slate-50 rounded-[25px] border border-slate-100 space-y-8">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                          <Palette className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Visual Strategy</p>
                          <h4 className="text-xl font-bold text-slate-900">Logo Direction</h4>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <p className="text-lg text-slate-700 leading-relaxed font-light">
                        {strategy.identitySystem.logoDirection.description}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                        <div className="space-y-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recommended Shapes</p>
                          <div className="flex flex-wrap gap-2">
                            {strategy.identitySystem.logoDirection.shapes.map((s, i) => (
                              <span key={i} className="px-3 py-1.5 bg-white text-slate-600 text-xs font-medium rounded-lg border border-slate-200 shadow-sm">{s}</span>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logotypes</p>
                          <div className="flex flex-wrap gap-2">
                            {strategy.identitySystem.logoDirection.logotypes.map((l, i) => (
                              <span key={i} className="px-3 py-1.5 bg-white text-slate-600 text-xs font-medium rounded-lg border border-slate-200 shadow-sm">{l}</span>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Symbols & Metaphors</p>
                          <div className="flex flex-wrap gap-2">
                            {strategy.identitySystem.logoDirection.symbols.map((symbol, i) => (
                              <span key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg border border-indigo-100 shadow-sm">{symbol}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm mt-6">
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3">Strategic Rationale</p>
                        <p className="text-sm text-slate-600 leading-relaxed italic">
                          "{strategy.identitySystem.logoDirection.rationale}"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Pillar 6: Tone of Voice Framework */}
        <section className="space-y-8">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <MessageSquare className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Tone of Voice Framework</h3>
          </div>

          <div className="space-y-8">
            <div className="p-8 rounded-[25px] bg-indigo-900 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Quote className="w-32 h-32" />
              </div>
              <div className="relative z-10 space-y-6">
                <div className="space-y-2">
                   <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">The Voice Essence</span>
                   <h4 className="text-3xl font-bold leading-tight">{strategy.archetype?.behavior?.tone?.framework || 'N/A'}</h4>
                </div>
                <p className="text-indigo-100/80 text-lg leading-relaxed max-w-2xl font-light italic">
                  "{strategy.archetype?.behavior?.tone?.description || 'N/A'}"
                </p>
                <div className="flex flex-wrap gap-3 pt-4 border-t border-indigo-800">
                  {strategy.archetype?.behavior?.tone?.examples?.map((ex, i) => (
                    <div key={i} className="px-4 py-2 bg-white/10 rounded-xl text-xs font-medium border border-white/10">
                      {ex}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {strategy.archetype?.behavior?.tone?.useCases?.map((useCase, i) => {
                const Icons: Record<string, any> = {
                  marketing: Megaphone,
                  announcement: Sparkles,
                  acknowledgement: UserCheck,
                  support: MessageSquare,
                  internal: Users
                };
                const CategoryIcon = Icons[useCase.category] || Info;
                const CategoryColors: Record<string, string> = {
                  marketing: 'bg-rose-50 text-rose-600',
                  announcement: 'bg-amber-50 text-amber-600',
                  acknowledgement: 'bg-emerald-50 text-emerald-600',
                  support: 'bg-blue-50 text-blue-600',
                  internal: 'bg-slate-50 text-slate-600'
                };

                return (
                  <motion.div 
                    key={i}
                    whileHover={{ y: -4 }}
                    className="p-8 rounded-[25px] bg-white border border-slate-100 shadow-sm space-y-6 flex flex-col group hover:shadow-xl transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className={cn("p-2 rounded-lg", CategoryColors[useCase.category])}>
                        <CategoryIcon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400 group-hover:text-indigo-500 transition-colors">
                        {useCase.platform}
                      </span>
                    </div>

                    <div className="space-y-4 flex-1">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Context: {useCase.category}</p>
                        <h5 className="text-xl font-bold text-slate-900">For {useCase.targetAudience}</h5>
                      </div>

                      <div className="relative p-6 bg-slate-50 rounded-2xl border border-slate-100/50 group/copy">
                        <p className="text-sm text-slate-700 leading-relaxed font-medium">
                          {useCase.contentTemplate}
                        </p>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(useCase.contentTemplate);
                            addNotification({ title: 'Template Copied', type: 'info', message: 'Message template copied to clipboard.' });
                          }}
                          className="absolute top-4 right-4 p-2 bg-white rounded-lg shadow-sm border border-slate-100 opacity-0 group-hover/copy:opacity-100 transition-opacity hover:text-indigo-600"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="label-xs text-slate-400 leading-none">Guardrails</p>
                          <p className="text-[11px] text-slate-500 leading-tight">{useCase.guidelines}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="label-xs text-slate-400 leading-none">Archetype Sync</p>
                          <p className="text-[11px] text-slate-500 leading-tight italic">{useCase.archetypeSync}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Pillar 6.5: Core Messaging */}
        <section className="space-y-8">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <div className="p-2 bg-slate-100 rounded-lg">
              <MessageSquare className="w-6 h-6 text-slate-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Core Messaging</h3>
          </div>

          <Card title="Core Messaging Framework" className="border-none shadow-sm bg-white">
            <div className="space-y-4">
              <div className="p-6 bg-slate-900 text-white rounded-2xl">
                <p className="text-2xl font-bold leading-tight">{strategy.messaging?.coreMessage || 'N/A'}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {strategy.messaging?.keywords?.map((kw, i) => (
                  <span key={i} className="px-4 py-2 bg-slate-100 text-slate-600 text-sm font-medium rounded-full border border-slate-200">#{kw}</span>
                ))}
              </div>
            </div>
          </Card>
        </section>

        {/* Pillar 7: Touchpoints */}
        <section className="space-y-8">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Layers className="w-6 h-6 text-slate-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Brand Touchpoints</h3>
          </div>

          <Card className="border-none shadow-sm bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4">
              {strategy.touchPoints?.map((tp, i) => (
                <div key={i} className="space-y-4 p-6 rounded-2xl bg-slate-50 border border-slate-100">
                  <h5 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-l-4 border-indigo-500 pl-3">{tp.category}</h5>
                  <div className="grid grid-cols-2 gap-2">
                    {tp.items?.map((item, j) => (
                      <span key={j} className="px-3 py-1 bg-white text-slate-600 text-[10px] rounded-lg border border-slate-200 shadow-sm text-center flex items-center justify-center min-h-[32px]">{item}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* Pillar 8: Growth & Partnerships */}
        <section className="space-y-8">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Zap className="w-6 h-6 text-slate-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Growth & Partnerships</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card title="Growth Programs" className="border-none shadow-sm bg-white">
              <div className="space-y-4">
                {strategy.growthPrograms?.map((program, i) => (
                  <div key={i} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <h5 className="font-bold text-slate-900 text-lg">{program.name}</h5>
                    <p className="text-sm text-slate-600 leading-relaxed">{program.description}</p>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="Strategic Partnerships" className="border-none shadow-sm bg-white">
              <div className="space-y-4">
                {strategy.partnerships?.map((partner, i) => (
                  <div key={i} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <h5 className="font-bold text-slate-900 text-lg">{partner.name}</h5>
                    <p className="text-sm text-slate-600 leading-relaxed">{partner.description}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>
      </div>
      </div>



      <AnimatePresence>
        {showCompleteModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[25px] p-10 max-w-xl w-full shadow-2xl border border-slate-100 text-center space-y-8 relative"
            >
              <button
                onClick={() => setShowCompleteModal(false)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-24 h-24 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-3xl font-bold text-slate-900 tracking-tight">Strategy Approved!</h3>
                <p className="text-slate-500 text-lg leading-relaxed">
                  Your brand strategy has been finalized and saved. You're now ready to move into the visual identity phase.
                </p>
              </div>

              <div className="pt-4 flex flex-col items-center gap-4">
                <Button 
                  variant="secondary"
                  size="md"
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className="w-full border-slate-200 group label"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
                <button 
                  onClick={() => setShowCompleteModal(false)}
                  className="text-slate-400 hover:text-brand-600 font-bold text-xs uppercase tracking-widest transition-colors"
                >
                  Close & Review Strategy
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BrandStrategyTool;
