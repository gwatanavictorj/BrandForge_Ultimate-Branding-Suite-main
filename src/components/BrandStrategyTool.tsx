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
  Lightbulb,
  Box,
  Instagram,
  Linkedin,
  MapPin,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { brandService } from '../services/brandService';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
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

// Technical Color Mapping Helper
const hexToCMYK = (hex: string): string => {
  let r = 0, g = 0, b = 0;
  const h = hex.replace('#', '');
  if (h.length === 3) {
    r = parseInt(h[0] + h[0], 16);
    g = parseInt(h[1] + h[1], 16);
    b = parseInt(h[2] + h[2], 16);
  } else if (h.length === 6) {
    r = parseInt(h.substring(0, 2), 16);
    g = parseInt(h.substring(2, 4), 16);
    b = parseInt(h.substring(4, 6), 16);
  }

  const rPrime = r / 255;
  const gPrime = g / 255;
  const bPrime = b / 255;

  const k = 1 - Math.max(rPrime, gPrime, bPrime);
  if (k === 1) return 'C:0 M:0 Y:0 K:100';

  const c = Math.round(((1 - rPrime - k) / (1 - k)) * 100);
  const m = Math.round(((1 - gPrime - k) / (1 - k)) * 100);
  const y = Math.round(((1 - bPrime - k) / (1 - k)) * 100);
  const kFinal = Math.round(k * 100);

  return `C:${c} M:${m} Y:${y} K:${kFinal}`;
};

const BASIC_COLORS: Record<string, [number, number, number]> = {
  'Black': [0, 0, 0], 'White': [255, 255, 255], 'Silver': [192, 192, 192], 'Gray': [128, 128, 128],
  'Red': [255, 0, 0], 'Maroon': [128, 0, 0], 'Orange': [255, 165, 0], 'Yellow': [255, 255, 0],
  'Green': [0, 128, 0], 'Lime': [0, 255, 0], 'Teal': [0, 128, 128], 'Cyan': [0, 255, 255],
  'Blue': [0, 0, 255], 'Navy': [0, 0, 128], 'Purple': [128, 0, 128], 'Magenta': [255, 0, 255],
  'Pink': [255, 192, 203], 'Gold': [255, 215, 0], 'Beige': [245, 245, 220], 'Brown': [165, 42, 42],
  'Azure': [240, 255, 255], 'Indigo': [75, 0, 130], 'Violet': [238, 130, 238], 'Emerald': [80, 200, 120]
};

const getDescriptiveColorName = (hex: string): string => {
  let r = 0, g = 0, b = 0;
  const h = hex.replace('#', '');
  if (h.length === 3) {
    r = parseInt(h[0] + h[0], 16); g = parseInt(h[1] + h[1], 16); b = parseInt(h[2] + h[2], 16);
  } else if (h.length === 6) {
    r = parseInt(h.substring(0, 2), 16); g = parseInt(h.substring(2, 4), 16); b = parseInt(h.substring(4, 6), 16);
  }

  let minDist = Infinity;
  let closestName = 'Custom Color';

  for (const [name, [br, bg, bb]] of Object.entries(BASIC_COLORS)) {
    const dist = Math.sqrt(Math.pow(r - br, 2) + Math.pow(g - bg, 2) + Math.pow(b - bb, 2));
    if (dist < minDist) {
      minDist = dist;
      closestName = name;
    }
  }
  return closestName;
};

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

  const SECTOR_SEGMENTS: Record<string, { name: string; description: string; needs: string; painPoints: string }[]> = {
    'technology': [
      { name: 'Solo Technologists', description: 'Individual developers and creators building modular solutions.', needs: 'Performance, API flexibility, and documentation clarity.', painPoints: 'High integration costs and technical debt.' },
      { name: 'Scale-up Teams', description: 'Growing technical teams looking for collaborative infrastructure.', needs: 'Concurrency, security, and team management tools.', painPoints: 'Scaling bottlenecks and resource fragmentation.' },
      { name: 'Enterprise Architects', description: 'Decision-makers in large organizations seeking stable system integration.', needs: 'Compliance, high-availability, and cross-platform support.', painPoints: 'Inertia and complex legacy systems.' },
      { name: 'Developer Ecosystem', description: 'Open-source contributors and third-party integrators.', needs: 'Access, open standards, and community support.', painPoints: 'Vendor lock-in and opaque roadmaps.' }
    ],
    'fintech': [
      { name: 'Personal Wealth', description: 'Individuals seeking modern financial management and wealth growth.', needs: 'Intuitive UX, security, and low-latency transactions.', painPoints: 'Hidden fees and complex traditional banking.' },
      { name: 'SME Businesses', description: 'Small-to-medium enterprises requiring streamlined payment/treasury.', needs: 'Working capital, fast settlement, and accounting sync.', painPoints: 'Cashflow gaps and manual reconciliation.' },
      { name: 'Institutional Finance', description: 'Large-scale investors and funds needing high-volume infrastructure.', needs: 'Regulatory compliance, deep liquidity, and API trade execution.', painPoints: 'Latency and fragmented data sources.' },
      { name: 'Unbanked / Underbanked', description: 'Individuals in emerging markets seeking first-time digital access.', needs: 'Accessibility, mobile-first design, and trust elements.', painPoints: 'Lack of identification and high barrier to entry.' }
    ],
    'healthcare': [
      { name: 'Care Receivers', description: 'Patients and families seeking outcomes and comfort.', needs: 'Personalization, empathy, and clear health data access.', painPoints: 'Diagnostic delays and confusing billing.' },
      { name: 'Practitioners', description: 'Doctors, nurses, and clinicians focused on care delivery.', needs: 'Efficiency, integrated diagnostics, and reduced burnout.', painPoints: 'Administrative load and siloed data.' },
      { name: 'Health Administrators', description: 'Operation leaders optimizing costs and patient flow.', needs: 'Population health data, cost-efficiency, and tech adoption.', painPoints: 'Resource scarcity and compliance gravity.' },
      { name: 'Community Partners', description: 'Non-profits and local groups improving public health access.', needs: 'Collaboration, outreach data, and funding transparency.', painPoints: 'Systemic inequality and lack of infrastructure.' }
    ],
    'events': [
      { name: 'Celebrants', description: 'Individuals planning milestone personal events including weddings and birthdays.', needs: 'Memorable experiences, aesthetics, and seamless logistics.', painPoints: 'High stress and fear of technical failure.' },
      { name: 'Corporate & Professional', description: 'Organizations organizing seminars and team-building sessions.', needs: 'Technical reliability and professional environments.', painPoints: 'Budget constraints and rigid schedules.' },
      { name: 'Nightlife & Entertainment', description: 'Promoters planning parties and live stage shows.', needs: 'Advanced AV tech and high-energy atmosphere.', painPoints: 'Sound limits and lack of "vibe" in venues.' },
      { name: 'Cultural Groups', description: 'Non-profits hosting community-focused gatherings.', needs: 'Accessibility and inclusive environments.', painPoints: 'Affordability and complex permit requirements.' }
    ],
    'default': [
      { name: 'The Early Adopters', description: 'Forward-thinking users seeking the latest innovative solutions.', needs: 'Functionality, novelty, and premium access.', painPoints: 'Slow innovation and rigid traditional models.' },
      { name: 'Pragmatic Majority', description: 'Mass-market users seeking reliability and value for money.', needs: 'Proven results, customer support, and ease of use.', painPoints: 'High risk and low return on investment.' },
      { name: 'Industry Professionals', description: 'Experts requiring high-performance tools and deep integration.', needs: 'Sophistication, customization, and scalability.', painPoints: 'Generic solutions and lack of technical depth.' },
      { name: 'Aspirational Segment', description: 'Users looking for status and improvement through brand association.', needs: 'Quality, brand prestige, and emotional resonance.', painPoints: 'Inaccessibility and low quality perception.' }
    ]
  };

  const getIndustryKey = (industry?: string): string => {
    if (!industry) return 'default';
    const normalized = industry.toLowerCase();
    if (normalized.includes('tech') || normalized.includes('software')) return 'technology';
    if (normalized.includes('fin') || normalized.includes('bank') || normalized.includes('pay')) return 'fintech';
    if (normalized.includes('health') || normalized.includes('med')) return 'healthcare';
    if (normalized.includes('event') || normalized.includes('venue') || normalized.includes('host') || normalized.includes('entertainment')) return 'events';
    return 'default';
  };

  const alignStrategicArchitecture = () => {
    if (!strategy || !onUpdate) return;
    const key = getIndustryKey(discovery.industry);
    const groups = SECTOR_SEGMENTS[key] || SECTOR_SEGMENTS.default;
    
    const updatedStrategy = {
      ...strategy,
      audience: {
        ...strategy.audience,
        groups: groups
      }
    };
    
    setStrategy(updatedStrategy);
    onUpdate(updatedStrategy);
    
    addNotification({
      title: 'Audience Architecture Refined',
      type: 'success',
      message: `Strategic segments aligned with the ${key.charAt(0).toUpperCase() + key.slice(1)} industry standard.`,
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
      const location = discovery.address || strategy.overview?.whereWeAre || '';
      const industry = discovery.industry || 'General';
      const stage = discovery.stage || 'Exploration';
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

      const addHeaderFooter = () => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(113, 113, 122); // brand-500
        const headerText = `${String(pName).toUpperCase()}  |  ${String(industry).toUpperCase()} – ${String(stage).toUpperCase()}`;
        pdf.text(headerText, margin, margin - 5);
        pdf.setDrawColor(244, 244, 245); // brand-100
        pdf.setLineWidth(0.5);
        pdf.line(margin, margin + 5, pageWidth - margin, margin + 5);

        const pageNum = pdf.getNumberOfPages();
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.setTextColor(161, 161, 170); // brand-400
        pdf.text('BRANDFORGE STRATEGY BLUEPRINT', margin, pageHeight - 25);
        pdf.text(`Page ${pageNum}`, pageWidth - margin, pageHeight - 25, { align: 'right' });
        pdf.setDrawColor(244, 244, 245); // brand-100
        pdf.line(margin, pageHeight - 35, pageWidth - margin, pageHeight - 35);
      };

      const checkPage = (needed: number) => {
        if (y + needed > pageHeight - margin - footerHeight) {
          pdf.addPage();
          addHeaderFooter();
          y = contentTop;
          return true;
        }
        return false;
      };

      const addTitle = (text: string, size = 22) => {
        const hasBroken = checkPage(size + 40);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(size);
        pdf.setTextColor(9, 9, 11); // brand-950
        pdf.text(text, margin, y);
        y += size + 14;
      };

      const addSubtitle = (text: string) => {
        checkPage(30);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(39, 39, 42); // brand-800
        pdf.text(String(text).toUpperCase(), margin, y);
        
        // Consistent underline for subtitles to define sections
        pdf.setDrawColor(228, 228, 231); // brand-200
        pdf.setLineWidth(0.5);
        pdf.line(margin, y + 4, margin + 40, y + 4);
        
        y += 22;
      };

      const addBody = (text: string) => {
        if (!text) return;
        const lines = String(text).split('\n');
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
        pdf.setTextColor(63, 63, 70); // brand-700
        const lines = pdf.splitTextToSize(text, contentWidth);
        for (const line of lines) {
          checkPage(14);
          pdf.text(line, margin, y);
          y += 14;
        }
        y += 4;
      };

      const addBullet = (text: string) => {
        if (!text) return;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(63, 63, 70); // brand-700
        const lines = pdf.splitTextToSize(text, contentWidth - 20);
        checkPage(14);
        pdf.text('•', margin + 5, y);
        for (let i = 0; i < lines.length; i++) {
          if (i > 0) checkPage(14);
          pdf.text(lines[i], margin + 20, y);
          y += 14;
        }
      };

      const addSpacer = (h = 14) => { y += h; };
      
      const addDivider = () => {
        // Prevent adding divider if we are at the bottom of the page
        if (y > pageHeight - margin - 80) return;
        
        pdf.setDrawColor(244, 244, 245); // brand-100
        pdf.setLineWidth(0.8);
        pdf.line(margin, y + 4, pageWidth - margin, y + 4);
        y += 24;
      };

      const drawPositioningMap = (position: { x: number; y: number }, xLabel: string, yLabel: string) => {
        const size = 180;
        checkPage(size + 60);
        
        const centerX = margin + contentWidth / 2;
        const gridY = y + size / 2;
        
        // Labels
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(161, 161, 170);
        pdf.text(xLabel.toUpperCase(), centerX, y - 10, { align: 'center' });
        pdf.text(yLabel.toUpperCase(), margin + contentWidth, gridY + 3, { align: 'right' });
        
        // Grid Box
        pdf.setDrawColor(244, 244, 245);
        pdf.setLineWidth(1);
        pdf.rect(centerX - size/2, y, size, size);
        
        // Axis lines
        pdf.setDrawColor(212, 212, 216);
        pdf.line(centerX, y, centerX, y + size);
        pdf.line(centerX - size/2, gridY, centerX + size/2, gridY);
        
        // The Brand Point
        const posX = centerX - size/2 + (position.x / 100) * size;
        const posY = y + size - (position.y / 100) * size;
        
        pdf.setDrawColor(59, 130, 246);
        pdf.setFillColor(59, 130, 246);
        pdf.circle(posX, posY, 4, 'FD');
        
        pdf.setTextColor(24, 24, 27);
        pdf.setFontSize(9);
        pdf.text(brandName, posX + 8, posY + 3);
        
        y += size + 30;
      };

      // ═══ COVER PAGE ═══
      pdf.setDrawColor(24, 24, 27); // brand-900 (Professional Neutral)
      pdf.setLineWidth(3);
      pdf.line(margin, 80, pageWidth - margin, 80);

      y = pageHeight * 0.35;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(36);
      pdf.setTextColor(24, 24, 27); // brand-900
      const titleLines = pdf.splitTextToSize(brandName, contentWidth);
      for (const line of titleLines) {
        pdf.text(line, pageWidth / 2, y, { align: 'center' });
        y += 40;
      }
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(16);
      pdf.setTextColor(113, 113, 122); // brand-500
      pdf.text('Brand Strategy Blueprint', pageWidth / 2, y, { align: 'center' });
      
      y += 80;
      pdf.setFontSize(9);
      pdf.setTextColor(161, 161, 170); // brand-400
      pdf.text(`${industry.toUpperCase()}  |  ${stage.toUpperCase()}`, pageWidth / 2, y, { align: 'center' });
      y += 14;
      pdf.text(`Projected on ${dateStr}`, pageWidth / 2, y, { align: 'center' });

      if (cName) {
        y += 40;
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(113, 113, 122);
        pdf.text('FOR CLIENT', pageWidth / 2, y, { align: 'center' });
        y += 14;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(11);
        pdf.setTextColor(39, 39, 42); // brand-800
        pdf.text(cName, pageWidth / 2, y, { align: 'center' });
      }

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(212, 212, 216); // brand-300
      pdf.text('CONFIDENTIAL BRAND STRATEGY', pageWidth / 2, pageHeight - 60, { align: 'center' });
      pdf.setDrawColor(24, 24, 27); // brand-900
      pdf.setLineWidth(3);
      pdf.line(margin, pageHeight - 80, pageWidth - margin, pageHeight - 80);

      // ═══ CONTENT PAGES ═══
      pdf.addPage();
      addHeaderFooter();
      y = contentTop;
      
      addTitle('Brand Genesis');
      addSubtitle('Core Story');
      addBody(strategy.story || 'N/A');
      
      if (strategy.overview?.whoWeAre && strategy.overview.whoWeAre !== strategy.story) {
        addSubtitle('Strategic Identity');
        addBody(strategy.overview.whoWeAre);
      }
      addSubtitle('The Value Proposition');
      addBody(strategy.overview?.whatWeDo || 'N/A');
      addSubtitle('Operating Model');
      addBody(strategy.overview?.howWeDoIt || 'N/A');
      addSubtitle('Market Presence');
      addBody(strategy.overview?.whereWeAre || 'N/A');

      addDivider();
      addTitle('Brand Soul');
      addSubtitle('Purpose & Mission');
      addBody(strategy.foundation?.mission || 'N/A');
      addSubtitle('Strategic Vision');
      addBody(strategy.foundation?.vision || 'N/A');
      addSubtitle('Philosophy');
      addBody(strategy.foundation?.philosophy || 'N/A');
      addSubtitle('The Core Essence');
      addBody(strategy.essence || 'N/A');

      addDivider();
      addTitle('Audience Architecture');
      addSubtitle(`Segment Classification: ${strategy.audience?.maslowNeedType || 'N/A'}`);
      addBody(strategy.audience?.maslowExplanation || 'N/A');
      addSpacer();
      const audienceGroups = Array.isArray(strategy.audience?.groups) ? strategy.audience.groups : [];
      for (const group of audienceGroups) {
        addSubtitle(group.name || 'Segment');
        addBody(group.description || 'N/A');
        addBullet(`Needs: ${group.needs || 'N/A'}`);
        addBullet(`Pain Points: ${group.painPoints || 'N/A'}`);
        addSpacer(4);
      }

      addDivider();
      addTitle('Market Stance');
      addSubtitle('Comprehensive Market Analysis');
      addBody(strategy.marketPosition?.analysis || strategy.marketPosition?.statement || 'N/A');
      
      addSubtitle('Positioning Perceptual Map');
      drawPositioningMap(
        { x: strategy.marketPosition?.x ?? 50, y: strategy.marketPosition?.y ?? 50 },
        strategy.marketPosition?.xLabel || 'Traditional vs Modern',
        strategy.marketPosition?.yLabel || 'Value vs Premium'
      );

      addSubtitle('Quadrant Classification');
      addBody(strategy.marketPosition?.quadrant || 'N/A');
      addSubtitle('Strategic Gap Highlights');
      addBody(strategy.marketPosition?.gapHighlight || 'N/A');
      
      addSpacer();
      addSubtitle('Competitive Intelligence Landscape');
      const competitors = Array.isArray(strategy.marketPosition?.competitors) ? strategy.marketPosition.competitors : [];
      for (const comp of competitors) {
        if (!comp.name) continue;
        checkPage(80);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(24, 24, 27);
        pdf.text(String(comp.name).toUpperCase(), margin, y);
        y += 14;
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(113, 113, 122);
        if (comp.website && comp.website !== 'N/A') {
          pdf.text(`Digital Hub: ${comp.website}`, margin, y);
          y += 11;
        }
        if (comp.location) {
          pdf.text(`Geographic Anchor: ${comp.location}`, margin, y);
          y += 11;
        }
        if (comp.established) {
          pdf.text(`Market Tenure: Established ${comp.established}`, margin, y);
          y += 11;
        }
        addSpacer(6);
      }

      addDivider();
      addTitle('Brand Personality');
      
      // Primary
      if (strategy.archetype?.primary) {
        addSubtitle(`Primary Archetype: ${strategy.archetype.primary.name || 'N/A'}`);
        addBody(strategy.archetype.primary.description || 'N/A');
        addBullet(`Goal: ${strategy.archetype.primary.goal || 'N/A'}`);
        addBullet(`Fear: ${strategy.archetype.primary.fear || 'N/A'}`);
        addBullet(`Talent: ${strategy.archetype.primary.talent || 'N/A'}`);
        addBullet(`Weakness: ${strategy.archetype.primary.weakness || 'N/A'}`);
        addBullet(`Strategic Rationale: ${strategy.archetype.primary.strategicRationale || 'N/A'}`);
        addBullet(`Core Traits: ${(strategy.archetype.primary.traits || []).join(', ')}`);
        const primaryPractice = Array.isArray(strategy.archetype.primary.inPractice) ? strategy.archetype.primary.inPractice : [];
        for (const item of primaryPractice) {
          addBullet(`${item.label || 'Note'}: ${item.content || 'N/A'}`);
        }
        addSpacer();
      }

      // Secondary
      if (strategy.archetype?.secondary) {
        addSubtitle(`Secondary Influence: ${strategy.archetype.secondary.name || 'N/A'}`);
        addBody(strategy.archetype.secondary.description || 'N/A');
        addBullet(`Goal: ${strategy.archetype.secondary.goal || 'N/A'}`);
        addBullet(`Fear: ${strategy.archetype.secondary.fear || 'N/A'}`);
        addBullet(`Talent: ${strategy.archetype.secondary.talent || 'N/A'}`);
        addBullet(`Weakness: ${strategy.archetype.secondary.weakness || 'N/A'}`);
        addBullet(`Strategic Rationale: ${strategy.archetype.secondary.strategicRationale || 'N/A'}`);
        addBullet(`Complementary Traits: ${(strategy.archetype.secondary.traits || []).join(', ')}`);
        const secondaryPractice = Array.isArray(strategy.archetype.secondary.inPractice) ? strategy.archetype.secondary.inPractice : [];
        for (const item of secondaryPractice) {
          addBullet(`${item.label || 'Note'}: ${item.content || 'N/A'}`);
        }
        addSpacer();
      }

      // Tertiary
      if (strategy.archetype?.tertiary) {
        addSubtitle(`Tertiary Edge: ${strategy.archetype.tertiary.name || 'N/A'}`);
        addBody(strategy.archetype.tertiary.description || 'N/A');
        addBullet(`Goal: ${strategy.archetype.tertiary.goal || 'N/A'}`);
        addBullet(`Fear: ${strategy.archetype.tertiary.fear || 'N/A'}`);
        addBullet(`Talent: ${strategy.archetype.tertiary.talent || 'N/A'}`);
        addBullet(`Weakness: ${strategy.archetype.tertiary.weakness || 'N/A'}`);
        addBullet(`Strategic Rationale: ${strategy.archetype.tertiary.strategicRationale || 'N/A'}`);
        addBullet(`Traits: ${(strategy.archetype.tertiary.traits || []).join(', ')}`);
        const tertiaryPractice = Array.isArray(strategy.archetype.tertiary.inPractice) ? strategy.archetype.tertiary.inPractice : [];
        for (const item of tertiaryPractice) {
          addBullet(`${item.label || 'Note'}: ${item.content || 'N/A'}`);
        }
        addSpacer();
      }
      
      addDivider();
      addTitle('Communication Framework');
      addSubtitle('Primary Tone of Voice');
      addBody(strategy.archetype?.behavior?.tone?.description || 'N/A');
      addSubtitle('Tone Manifestation');
      addBody(strategy.archetype?.behavior?.tone?.framework || 'Consistent, professional delivery aligned with archetype traits.');
      addSubtitle('Voice Pillars (Examples)');
      const toneExamples = Array.isArray(strategy.archetype?.behavior?.tone?.examples) ? strategy.archetype.behavior.tone.examples : [];
      for (const ex of toneExamples) {
        addBullet(ex);
      }
      
      const useCases = Array.isArray(strategy.archetype?.behavior?.tone?.useCases) ? strategy.archetype.behavior.tone.useCases : [];
      if (useCases.length > 0) {
        addSpacer();
        addSubtitle('Messaging Workbench (Contextual Applications)');
        for (const useCase of useCases) {
          if (!useCase.category || !useCase.platform) continue;
          checkPage(60);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(10);
          pdf.setTextColor(24, 24, 27);
          pdf.text(`${String(useCase.category).toUpperCase()}: ${String(useCase.platform)}`, margin, y);
          y += 14;
          addBody(useCase.contentTemplate || 'N/A');
          addBullet(`Strategy: ${useCase.guidelines || 'N/A'}`);
          addSpacer(8);
        }
      }

      addDivider();
      addTitle('Identity System');
      addSubtitle('Visual Essence & Logo Strategy');
      
      const logoOptions = Array.isArray(strategy.identitySystem?.logoOptions) ? strategy.identitySystem.logoOptions : [];
      for (const opt of logoOptions) {
        checkPage(60);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(24, 24, 27);
        pdf.text(`${(String(opt.strategy || 'Concept')).toUpperCase()} CONCEPT`, margin, y);
        y += 14;
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(113, 113, 122);
        pdf.text('PROPOSITIONAL DENSITY ANALYSIS:', margin, y);
        y += 12;
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        addBullet(`Surface (Pv): ${opt.propositionalDensity?.surface || 'N/A'}`);
        addBullet(`Semantic (Ps): ${opt.propositionalDensity?.semantic || 'N/A'}`);
        addBullet(`Semantics: ${opt.propositionalDensity?.rationale || 'N/A'}`);
        
        addSpacer(4);
        addBullet(`Visual Language: ${(opt.shapes || []).join(', ')}`);
        addBullet(`Symbolic Nodes: ${(opt.symbols || []).join(', ')}`);
        addSpacer(12);
      }
      addSpacer();
      addSubtitle('Strategic Color Palette');
      const colors = Array.isArray(strategy.identitySystem?.colors) ? strategy.identitySystem.colors : [];
      for (let i = 0; i < colors.length; i++) {
        const color = colors[i];
        const hexMatch = (color.color || '').match(/#[0-9A-Fa-f]{3,6}/);
        const hex = hexMatch ? hexMatch[0] : '#CBD5E1';
        const extractedName = (color.color || '').replace(/ ?\(?#[0-9A-Fa-f]{3,6}\)?/, '').trim();
        const descriptiveName = getDescriptiveColorName(hex);
        
        // Correct role assignment for the PDF
        const role = color.role || (i === 0 ? 'Primary' : i === 1 ? 'Secondary' : i === 2 ? 'Tertiary' : 'Accent');
        const colorName = extractedName || `${role} Color (${descriptiveName})`;
        const cmyk = hexToCMYK(hex);
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(24, 24, 27); // brand-900
        checkPage(14);
        pdf.text(`${String(role).toUpperCase()}: ${String(colorName).toUpperCase()}`, margin + 15, y);
        y += 12;
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(113, 113, 122); // brand-500
        checkPage(12);
        pdf.text(`HEX: ${String(hex).toUpperCase()}  |  CMYK: ${String(cmyk)}`, margin + 15, y);
        y += 12;
        
        addBullet(`${color.meaning || 'N/A'} (${color.application || 'N/A'})`);
        addSpacer(4);
      }
      addSpacer();
      addSubtitle('Typography Configuration');
      addBullet(`Primary: ${strategy.identitySystem?.typography?.primary?.name || 'N/A'} — ${strategy.identitySystem?.typography?.primary?.usage || 'N/A'}`);
      addBullet(`Secondary: ${strategy.identitySystem?.typography?.secondary?.name || 'N/A'} — ${strategy.identitySystem?.typography?.secondary?.usage || 'N/A'}`);

      addDivider();
      addTitle('Customer Journey Blueprint');
      
      const journeyColors = [
        [0, 77, 64],   // Teal
        [244, 81, 30], // Orange
        [26, 35, 126], // Navy
        [77, 182, 172], // Mint
        [69, 90, 100]  // Slate
      ];

      const journeyStages = Array.isArray(strategy.customerJourney) ? strategy.customerJourney : [];
      for (let i = 0; i < journeyStages.length; i++) {
        const stage = journeyStages[i];
        const color = journeyColors[i % journeyColors.length];
        
        checkPage(120);
        
        // Stage Header with Color Block
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.rect(margin, y, 120, 20, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.text((String(stage.phase || 'STAGE')).toUpperCase(), margin + 10, y + 13);
        
        pdf.setTextColor(24, 24, 27);
        pdf.setFontSize(11);
        pdf.text((String(stage.stage || 'UNNAMED')).toUpperCase(), margin + 130, y + 14);
        
        y += 28;
        
        // Vertical connector line
        if (i < journeyStages.length - 1) {
          pdf.setDrawColor(color[0], color[1], color[2]);
          pdf.setLineWidth(1.5);
          pdf.line(margin + 60, y - 8, margin + 60, y + 80);
        }
        
        // Content
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(113, 113, 122);
        pdf.text('CUSTOMER ACTION', margin + 20, y);
        y += 12;
        addBody(stage.action || 'N/A');
        
        addSpacer(4);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.text('TOUCHPOINTS', margin + 20, y);
        y += 10;
        addBody((stage.touchpoints || []).join(' • ') || 'N/A');
        
        addSpacer(4);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.text('SUCCESS METRICS (KPIs)', margin + 20, y);
        y += 10;
        const kpis = Array.isArray(stage.kpis) ? stage.kpis : [];
        for(const kpi of kpis) {
          addBullet(kpi);
        }
        
        addSpacer(16);
      }

      addDivider();
      addTitle('Growth & Expansion');
      addSubtitle('Growth Programs');
      const growthPrograms = Array.isArray(strategy.growthPrograms) ? strategy.growthPrograms : [];
      for (const prog of growthPrograms) {
        checkPage(40);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(24, 24, 27);
        pdf.text(prog.name || 'Growth Program', margin, y);
        y += 12;
        addBody(prog.description || 'N/A');
      }
      addSpacer();
      addSubtitle('Strategic Alliances');
      const partnerships = Array.isArray(strategy.partnerships) ? strategy.partnerships : [];
      for (const part of partnerships) {
        checkPage(40);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(24, 24, 27);
        pdf.text(part.name || 'Partnership', margin, y);
        y += 12;
        addBody(part.description || 'N/A');
      }

      const safePName = pName.replace(/\s+/g, '_');
      const safeCName = cName ? `_for_${cName.replace(/\s+/g, '_')}` : '';
      pdf.save(`${safePName}${safeCName}_Strategy_Blueprint.pdf`);
    } catch (err: any) {
      console.error('PDF generation error:', err);
      alert(`PDF generation encountered an issue: ${err.message || 'Unknown error'}. Standard browser print will be used instead.`);
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-12 h-12 text-brand-600 animate-spin" />
        <div className="text-center">
          <h3 className="text-xl font-bold text-brand-900 font-display">Universal Strategy Engine Active...</h3>
          <p className="text-brand-500 body-sm">Applying Maslow models, Jungian archetypes, and market positioning logic.</p>
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
      <div ref={contentRef} className="space-y-[var(--space-section)] py-[var(--space-card-p)] px-[var(--space-item)] sm:px-[var(--space-card-p)] bg-brand-50/50 rounded-[var(--radius-section)]">
        <div className="text-center space-y-[var(--space-item)]">
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-900 tracking-tight font-display">Brand Strategy</h2>
          <p className="text-brand-500 text-sm sm:text-base">The strategic blueprint for your brand's evolution.</p>
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
                <h4 className="text-xl font-bold text-brand-900">Deep AI Analysis Momentarily Unavailable</h4>
                <p className="text-brand-600 text-sm leading-relaxed">
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
      <section className="space-y-[var(--space-gap)]">
        <div className="flex items-center gap-3 border-b border-brand-200 pb-[var(--space-item)]">
          <div className="p-2 bg-brand-50 rounded-[var(--radius-control)]">
            <Info className="w-5 h-5 text-brand-600" />
          </div>
          <h3 className="h2 py-1">Brand Overview</h3>
        </div>

        <div className="space-y-6">
          <Card title="Brand Story" className="border-none shadow-sm bg-white">
            <div className="text-brand-600 leading-relaxed text-sm">{renderText(strategy.story || '')}</div>
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
                        <div className="text-brand-600 leading-relaxed text-sm pb-3">
                          {renderText(desc)}
                        </div>
                      )}
                      <div className="pt-3 border-t border-brand-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Megaphone className="w-3 h-3 text-brand-500" />
                          <h4 className="label-xs">Brand Motto</h4>
                        </div>
                        <p className="text-brand-900 font-medium italic text-base">"{cleanMotto}"</p>
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div className="text-brand-600 leading-relaxed text-sm">
                    {renderText(text)}
                  </div>
                );
              })()}
            </Card>
            <Card title="The Offering" className="h-full border-none shadow-sm bg-white overflow-hidden">
              <div className="flex flex-col gap-4">
                {(() => {
                  const rawText = strategy.overview?.whatWeDo || 'N/A';
                  if (rawText === 'N/A') return <p className="text-brand-400 italic">No services defined.</p>;
                  
                  const cleanText = rawText.replace(/.*offers services ranging from:?\s*/i, '').trim();
                  const items = cleanText
                    .split(/[,;]|\.(?=[A-Z])/)
                    .map(s => s.trim())
                    .filter(s => s.length > 5);

                  if (items.length === 0) return <p className="text-brand-600 leading-relaxed text-sm">{rawText}</p>;

                  return (
                    <div className="pt-1">
                      <p className="text-sm text-brand-600 leading-relaxed">
                        {discovery.brandNameLogo || discovery.name || 'The brand'} emerges to address a critical need{discovery.address ? ` in ${discovery.address}` : ''}: the absence of a truly modern, flexible, and identity-driven destination capable of unifying diverse people and cultures. 
                        By specializing in {items.slice(0, 4).join(', ').toLowerCase()}, the brand creates a vibrant hub where culture, music, and individuals connect, transforming ordinary moments into unforgettable experiences. {discovery.brandNameLogo || discovery.name || 'The brand'} is "{discovery.tagline || 'Your Strategic Partner'}".
                      </p>
                    </div>
                  );
                })()}
              </div>
            </Card>
            <Card title="The Methodology" className="h-full border-none shadow-sm bg-white">
              <div className="text-brand-600 leading-relaxed text-sm">{renderText(strategy.overview?.howWeDoIt || '')}</div>
            </Card>
            <Card title="The Presence" className="h-full border-none shadow-sm bg-white">
              <div className="text-brand-600 leading-relaxed text-sm">{renderText(strategy.overview?.whereWeAre || '')}</div>
            </Card>
          </div>
        </div>
      </section>

      {/* 1. The Core Essence Hero */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[var(--radius-section)] bg-brand-950 p-6 sm:p-10 text-white shadow-lg"
      >
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-brand-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-brand-500/20 border border-brand-400/30 text-brand-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="label-xs text-brand-200">Strategic North Star</span>
          </div>
          <div className="space-y-4 max-w-4xl w-full">
            <h3 className="text-xl sm:text-3xl md:text-4xl font-medium tracking-tight leading-snug text-brand-50 font-display">
              {strategy.coreIdea}
            </h3>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <div className="w-8 h-px bg-brand-500/50 hidden sm:block" />
              <p className="text-base sm:text-lg text-brand-300 leading-relaxed font-light italic">
                "{strategy.essence}"
              </p>
              <div className="w-8 h-px bg-brand-500/50 hidden sm:block" />
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col gap-[var(--space-section)]">
        {/* Pillar 1: The Brand Soul */}
        <section className="space-y-[var(--space-gap)]">
          <div className="flex items-center gap-3 border-b border-brand-200 pb-[var(--space-item)]">
            <div className="p-2 bg-brand-50 rounded-[var(--radius-control)]">
              <BookOpen className="w-5 h-5 text-brand-600" />
            </div>
            <h3 className="h2 py-1">The Brand Soul</h3>
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
                <div key={i} className="flex gap-4 p-4 rounded-[var(--radius-card)] hover:bg-brand-50 transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-sm">
                    {i + 1}
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-brand-900">{value.name}</h5>
                    <p className="body-sm">{value.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* Pillar 2: Audience & Experience */}
        <section className="space-y-[var(--space-gap)]">
          <div className="flex items-center gap-3 border-b border-brand-200 pb-[var(--space-item)]">
            <div className="p-2 bg-brand-50 rounded-[var(--radius-control)]">
              <Users className="w-5 h-5 text-brand-600" />
            </div>
            <h3 className="h2 py-1">Audience & Experience</h3>
          </div>

          <div className="space-y-8">
            {/* 1. Maslow Level */}
            <Card title="Psychological Driver (Maslow Level)" className="border-none shadow-sm bg-white">
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                <div className="flex-shrink-0 w-24 h-24 rounded-full bg-brand-100 flex items-center justify-center">
                  <Layers className="w-10 h-10 text-brand-600" />
                </div>
                <div className="space-y-4 flex-1 text-center md:text-left">
                  <div className="space-y-1">
                    <p className="text-3xl font-bold text-brand-900">{strategy.audience?.maslowLevel || 'N/A'}</p>
                    <p className="label-xs text-brand-600">Primary Human Need</p>
                  </div>
                  <div className="p-6 bg-brand-50/50 rounded-[var(--radius-section)] border border-brand-100 space-y-3">
                    <div className="flex items-center gap-2 text-brand-700">
                      <ShieldCheck className="w-4 h-4 text-brand-500" />
                      <h4 className="label-xs">Need Type & Painpoint</h4>
                    </div>
                    <p className="text-lg font-medium text-brand-800">{strategy.audience?.maslowNeedType || 'N/A'}</p>
                    <p className="body-sm">{strategy.audience?.maslowExplanation || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* 2. Audience Narrative */}
            <Card title="Audience Narrative" className="border-none shadow-sm bg-white">
              <div className="relative p-6 bg-slate-900 rounded-[var(--radius-section)] overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <MessageSquare className="w-16 h-16 text-white" />
                </div>
                <div className="relative z-10 space-y-3">
                  <p className="text-base sm:text-lg font-light text-slate-300 leading-relaxed italic">
                    "{strategy.audience?.narrative || 'N/A'}"
                  </p>
                  <div className="pt-3 border-t border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">The Human Story</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* 3. Target Audience Groups */}
            <Card title="Target Audience Segments" className="border-none shadow-sm bg-white">
              {strategy.audience?.groups?.length !== 4 && (
                <div className="mb-8 p-6 bg-brand-50 border border-brand-100 rounded-[20px] flex items-center justify-between gap-6">
                  <div className="flex items-center gap-4 text-brand-700">
                    <Sparkles className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium leading-relaxed italic">
                      We've identified a specialized **Target Segment Architecture** tailored for your specific industry sector.
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
        <section className="space-y-[var(--space-gap)]">
          <div className="flex items-center gap-3 border-b border-brand-200 pb-[var(--space-item)]">
            <div className="p-2 bg-brand-50 rounded-[var(--radius-control)]">
              <TrendingUp className="w-5 h-5 text-brand-600" />
            </div>
            <h3 className="h2 py-1">Customer Journey</h3>
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
                      <div className="flex-1 bg-white border-x border-brand-50 p-6 space-y-[var(--space-gap)] pt-10">
                        {/* Action */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-brand-400">
                            <Zap className="w-3.5 h-3.5" />
                            <span className="label-xs">Customer Action</span>
                          </div>
                          <p className="text-[13px] text-slate-700 leading-relaxed font-medium">
                            {item.action}
                          </p>
                        </div>

                        {/* Touchpoints */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-brand-400">
                            <Layers className="w-3.5 h-3.5" />
                            <span className="label-xs">Touchpoints</span>
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
                        <div className="pt-6 border-t border-brand-50">
                          <div className="p-4 bg-brand-50/50 rounded-[var(--radius-card)] border border-brand-100 relative group">
                            <div className="absolute -top-2.5 left-4 bg-white px-2 flex items-center gap-1.5 text-brand-600">
                              <Lightbulb className="w-3 h-3" />
                              <span className="label-xs">Insights</span>
                            </div>
                            <p className="text-[12px] text-brand-600 leading-relaxed italic pr-2">
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
        <section className="space-y-[var(--space-gap)]">
          <div className="flex items-center gap-3 border-b border-brand-200 pb-[var(--space-item)]">
            <div className="p-2 bg-brand-50 rounded-[var(--radius-control)]">
              <Target className="w-5 h-5 text-brand-600" />
            </div>
            <h3 className="h2 py-1">Market Positioning</h3>
          </div>

          <div className="space-y-8">
            <Card title="Market Positioning Map" className="border-none shadow-sm bg-white">
              <div className="flex flex-col gap-12">
                <div className="w-full aspect-video md:aspect-[21/9] relative bg-brand-50 rounded-[var(--radius-section)] border border-brand-200 overflow-hidden">
                  {/* Axes */}
                  <div className="absolute top-1/2 left-0 w-full h-px bg-brand-300" />
                  <div className="absolute top-0 left-1/2 w-px h-full bg-brand-300" />
                  
                  {/* Labels */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 label-xs">{strategy.marketPosition?.axes?.y || 'Y'} (+)</div>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 label-xs">{strategy.marketPosition?.axes?.y || 'Y'} (-)</div>
                  <div className="absolute top-1/2 left-4 -translate-y-1/2 label-xs rotate-90 origin-left">{strategy.marketPosition?.axes?.x || 'X'} (-)</div>
                  <div className="absolute top-1/2 right-4 -translate-y-1/2 label-xs -rotate-90 origin-right">{strategy.marketPosition?.axes?.x || 'X'} (+)</div>

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
                    <p className="text-4xl font-black text-brand-900/5 uppercase tracking-tighter">{strategy.marketPosition?.quadrant || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-16">
                  {/* Part A: Market Analysis */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-amber-100" />
                      <h4 className="text-xs font-black text-amber-600 uppercase tracking-[0.2em] px-4 py-1.5 bg-amber-50 rounded-full border border-amber-100">
                        Strategic Market Analysis
                      </h4>
                      <div className="h-px flex-1 bg-amber-100" />
                    </div>
                    <div className="max-w-4xl mx-auto text-slate-600 leading-relaxed text-base text-center italic font-medium px-8">
                      {renderText(strategy.marketPosition?.analysis || '')}
                    </div>
                  </div>
                  
                  {/* Part B: Competitor Intelligence */}
                  <div className="space-y-8 pt-8 border-t border-brand-100">
                    <div className="flex items-center justify-between px-6">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-brand-900">Competitive Intelligence Landscape</h4>
                        <p className="text-[10px] text-brand-400 font-medium uppercase tracking-widest">Research-Led Benchmark Analysis</p>
                      </div>
                      <div className="px-3 py-1 bg-brand-50 text-brand-600 text-[10px] font-bold rounded-lg border border-brand-100">
                        {strategy.marketPosition?.competitors?.length || 0} Key Players Identified
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      {strategy.marketPosition?.competitors?.map((comp, i) => (
                        <div key={i} className="group p-6 bg-white rounded-[var(--radius-section)] border border-brand-100 shadow-sm hover:shadow-lg hover:border-brand-200 transition-all">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex-1 space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-xl font-bold text-brand-900 tracking-tight">{comp.name}</span>
                                <span className="px-3 py-1 bg-brand-50 text-brand-500 text-[10px] font-bold uppercase tracking-wider rounded-full border border-brand-100 italic">
                                  Direct Sector Competitor
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4 px-4 py-3 bg-brand-50/50 rounded-xl border border-brand-50">
                                  <div className="flex flex-col gap-2">
                                    <span className="text-[9px] font-black text-brand-300 uppercase tracking-widest">High-Fidelity Presence</span>
                                    {comp.website && comp.website !== 'N/A' ? (
                                      <a 
                                        href={comp.website.startsWith('http') ? comp.website : `https://${comp.website}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2.5 text-brand-600 hover:text-brand-900 transition-colors group/link"
                                      >
                                        <div className="p-2 bg-white rounded-lg shadow-sm border border-brand-100 group-hover/link:shadow-md transition-shadow">
                                          <Globe className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="text-xs font-bold underline underline-offset-4">{comp.website.replace(/^https?:\/\//, '')}</span>
                                          <span className="text-[8px] text-brand-400 font-medium">Official Digital Hub</span>
                                        </div>
                                        <ExternalLink className="w-3 h-3 opacity-40 group-hover/link:opacity-100 transition-opacity ml-auto" />
                                      </a>
                                    ) : (
                                      <div className="flex items-center gap-2.5 text-brand-300 opacity-60">
                                        <div className="p-2 bg-white rounded-lg border border-dashed border-brand-200">
                                          <Globe className="w-4 h-4 animate-pulse" />
                                        </div>
                                        <span className="text-xs font-medium italic">Scraping Live Website Data...</span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex flex-col gap-2 pt-2 border-t border-brand-100/50">
                                    <span className="text-[9px] font-black text-brand-300 uppercase tracking-widest">Intelligence Nodes</span>
                                    <div className="flex gap-3">
                                      {comp.socials && comp.socials.length > 0 ? (
                                        comp.socials.map((soc, si) => {
                                          let Icon = Globe;
                                          if (soc.platform.toLowerCase().includes('instagram')) Icon = Instagram;
                                          if (soc.platform.toLowerCase().includes('linkedin')) Icon = Linkedin;
                                          return (
                                            <a key={si} href={soc.url} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white rounded-xl text-brand-400 hover:bg-brand-900 hover:text-white transition-all shadow-sm border border-brand-100" title={soc.platform}>
                                              <Icon className="w-4 h-4" />
                                            </a>
                                          );
                                        })
                                      ) : (
                                        <div className="flex gap-3">
                                          <div className="p-2.5 bg-white rounded-xl text-brand-200 border border-dashed border-brand-100 opacity-50">
                                            <Instagram className="w-4 h-4" />
                                          </div>
                                          <div className="p-2.5 bg-white rounded-xl text-brand-200 border border-dashed border-brand-100 opacity-50">
                                            <Linkedin className="w-4 h-4" />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="space-y-4 px-4 py-3 bg-brand-50/50 rounded-xl border border-brand-50">
                                  <div className="flex flex-col gap-2">
                                    <span className="text-[9px] font-black text-brand-300 uppercase tracking-widest">Geographic Anchor</span>
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 bg-white rounded-lg shadow-sm border border-brand-100">
                                        <MapPin className="w-4 h-4 text-brand-500" />
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-xs text-brand-900 font-bold">
                                          {comp.location && !['Unknown', 'N/A', ''].includes(comp.location) ? comp.location : 'Strategic Regional Cluster'}
                                        </span>
                                        <span className="text-[8px] text-brand-400 font-medium uppercase tracking-[0.1em]">Verified Location</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex flex-col gap-2 pt-2 border-t border-brand-100/50">
                                    <span className="text-[9px] font-black text-brand-300 uppercase tracking-widest">Market Tenure</span>
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 bg-white rounded-lg shadow-sm border border-brand-100">
                                        <Calendar className="w-4 h-4 text-brand-500" />
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-xs text-brand-900 font-bold">
                                          {comp.established && !['N/A', 'Unknown', ''].includes(comp.established) ? `Established since ${comp.established}` : 'Founding Phase Identified'}
                                        </span>
                                        <span className="text-[8px] text-brand-400 font-medium uppercase tracking-[0.1em]">Operational Longevity</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strategic Gap Footer */}
                  <div className="p-8 bg-brand-900 rounded-[var(--radius-section)] text-white space-y-4 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-800 rounded-full -mr-16 -mt-16 opacity-50 blur-2xl" />
                    <div className="flex items-center gap-3 text-brand-400 relative z-10">
                      <Zap className="w-5 h-5" />
                      <h4 className="text-xs font-black uppercase tracking-[0.2em]">The Strategic Competitive Gap</h4>
                    </div>
                    <p className="text-lg text-brand-50 font-display italic leading-relaxed relative z-10 max-w-5xl">
                      "{strategy.marketPosition?.gapHighlight || 'N/A'}"
                    </p>
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
        <section className="space-y-[var(--space-gap)]">
          <div className="flex items-center gap-3 border-b border-brand-200 pb-[var(--space-item)]">
            <div className="p-2 bg-brand-50 rounded-[var(--radius-control)]">
              <Smile className="w-5 h-5 text-brand-600" />
            </div>
            <h3 className="h2 py-1">Brand Personality</h3>
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Primary Archetype (Core) */}
              <div className="p-8 rounded-[var(--radius-section)] bg-brand-900 text-white space-y-6 shadow-xl relative overflow-hidden flex flex-col h-full">
                <div className="absolute top-0 right-0 p-4">
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded-full uppercase tracking-wider border border-amber-500/30">The Core Identity</span>
                </div>
                <div className="space-y-2">
                  <h5 className="text-3xl font-bold text-amber-400 font-display">{strategy.archetype?.primary?.name || 'N/A'}</h5>
                  <p className="label-xs text-brand-400 uppercase tracking-widest font-bold opacity-80">{strategy.archetype?.primary?.jungianModel || 'N/A'}</p>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest">Goal</p>
                      <p className="text-[11px] text-brand-100 leading-relaxed">{strategy.archetype?.primary?.goal || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest">Fear</p>
                      <p className="text-[11px] text-brand-100 leading-relaxed">{strategy.archetype?.primary?.fear || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest">Weakness</p>
                      <p className="text-[11px] text-brand-100 leading-relaxed">{strategy.archetype?.primary?.weakness || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest">Talent</p>
                      <p className="text-[11px] text-brand-100 leading-relaxed">{strategy.archetype?.primary?.talent || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {strategy.archetype?.primary?.personalityNarrative && (
                  <p className="text-[11px] leading-relaxed text-brand-200 border-l border-amber-500/20 pl-4 py-0.5">
                    {strategy.archetype.primary.personalityNarrative}
                  </p>
                )}

                <div className="space-y-4 pt-4 border-t border-white/10 flex-grow">
                  <div className="space-y-4">
                    <h6 className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">In Practice</h6>
                    <div className="grid grid-cols-1 gap-4">
                      {Array.isArray(strategy.archetype?.primary?.inPractice) ? (
                        strategy.archetype.primary.inPractice.map((item, i) => (
                          <div key={i} className="space-y-1">
                            <p className="text-[9px] font-bold text-amber-500/60 uppercase tracking-widest">{item.label}</p>
                            <p className="text-[11px] text-brand-100/90 leading-relaxed">{item.content}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-brand-200 leading-relaxed italic opacity-60">Strategic data pending...</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {strategy.archetype?.primary?.traits?.map((trait, i) => (
                      <span key={i} className="px-2 py-0.5 bg-white/10 text-brand-100 text-[9px] font-bold rounded-full border border-white/10 uppercase tracking-tighter">{trait}</span>
                    ))}
                  </div>

                  {strategy.archetype?.primary?.strategicRationale && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-[9px] font-bold text-amber-500/60 uppercase tracking-widest mb-1.5">Strategic Rationale</p>
                      <p className="text-[11px] text-brand-200 leading-relaxed italic">
                        "{strategy.archetype.primary.strategicRationale}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Secondary Archetype (Support) */}
              <div className="p-8 rounded-[var(--radius-section)] bg-white border border-brand-200 space-y-6 shadow-sm relative overflow-hidden flex flex-col h-full">
                <div className="absolute top-0 right-0 p-4">
                  <span className="px-3 py-1 bg-brand-50 text-brand-500 text-[10px] font-bold rounded-full uppercase tracking-wider border border-brand-200">The Support</span>
                </div>
                <div className="space-y-2">
                  <h5 className="text-3xl font-bold text-brand-900 font-display">{strategy.archetype?.secondary?.name || 'N/A'}</h5>
                  <p className="label-xs text-brand-400 uppercase tracking-widest font-bold">{strategy.archetype?.secondary?.jungianModel || 'N/A'}</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-brand-500 uppercase tracking-widest">Goal</p>
                      <p className="text-[11px] text-brand-600 leading-relaxed">{strategy.archetype?.secondary?.goal || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-brand-500 uppercase tracking-widest">Fear</p>
                      <p className="text-[11px] text-brand-600 leading-relaxed">{strategy.archetype?.secondary?.fear || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-brand-500 uppercase tracking-widest">Weakness</p>
                      <p className="text-[11px] text-brand-600 leading-relaxed">{strategy.archetype?.secondary?.weakness || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-brand-500 uppercase tracking-widest">Talent</p>
                      <p className="text-[11px] text-brand-600 leading-relaxed">{strategy.archetype?.secondary?.talent || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {strategy.archetype?.secondary?.personalityNarrative && (
                  <p className="text-[11px] leading-relaxed text-brand-500 border-l border-brand-200 pl-4 py-0.5">
                    {strategy.archetype.secondary.personalityNarrative}
                  </p>
                )}

                <div className="space-y-4 pt-4 border-t border-brand-100 flex-grow">
                  <div className="space-y-4">
                    <h6 className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">In Practice</h6>
                    <div className="grid grid-cols-1 gap-4">
                      {Array.isArray(strategy.archetype?.secondary?.inPractice) ? (
                        strategy.archetype.secondary.inPractice.map((item, i) => (
                          <div key={i} className="space-y-1">
                            <p className="text-[9px] font-bold text-brand-500 uppercase tracking-widest">{item.label}</p>
                            <p className="text-[11px] text-brand-600 leading-relaxed">{item.content}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-brand-500 leading-relaxed italic opacity-60">Strategic data pending...</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {strategy.archetype?.secondary?.traits?.map((trait, i) => (
                      <span key={i} className="px-2 py-0.5 bg-brand-50 text-brand-600 text-[9px] font-bold rounded-full border border-brand-200 uppercase tracking-tighter">{trait}</span>
                    ))}
                  </div>

                  {strategy.archetype?.secondary?.strategicRationale && (
                    <div className="mt-4 pt-4 border-t border-brand-100">
                      <p className="text-[9px] font-bold text-brand-500 uppercase tracking-widest mb-1.5">Strategic Rationale</p>
                      <p className="text-[11px] text-brand-500 leading-relaxed italic">
                        "{strategy.archetype.secondary.strategicRationale}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tertiary Archetype (Edge) */}
              <div className="p-8 rounded-[var(--radius-section)] bg-indigo-50 border border-indigo-100 space-y-6 shadow-sm relative overflow-hidden flex flex-col h-full group hover:bg-indigo-100/50 transition-colors">
                <div className="absolute top-0 right-0 p-4">
                  <span className="px-3 py-1 bg-indigo-200/50 text-indigo-600 text-[10px] font-bold rounded-full uppercase tracking-wider border border-indigo-200/50">The Aspirational Edge</span>
                </div>
                <div className="space-y-2">
                  <h5 className="text-3xl font-bold text-indigo-900 font-display group-hover:text-indigo-700 transition-colors">{strategy.archetype?.tertiary?.name || 'N/A'}</h5>
                  <p className="label-xs text-indigo-400 uppercase tracking-widest font-bold">{strategy.archetype?.tertiary?.jungianModel || 'N/A'}</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Goal</p>
                      <p className="text-[11px] text-indigo-900/80 leading-relaxed">{strategy.archetype?.tertiary?.goal || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Fear</p>
                      <p className="text-[11px] text-indigo-900/80 leading-relaxed">{strategy.archetype?.tertiary?.fear || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Weakness</p>
                      <p className="text-[11px] text-indigo-900/80 leading-relaxed">{strategy.archetype?.tertiary?.weakness || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Talent</p>
                      <p className="text-[11px] text-indigo-900/80 leading-relaxed">{strategy.archetype?.tertiary?.talent || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {strategy.archetype?.tertiary?.personalityNarrative && (
                  <p className="text-[11px] leading-relaxed text-indigo-800/80 border-l border-indigo-200/50 pl-4 py-0.5">
                    {strategy.archetype.tertiary.personalityNarrative}
                  </p>
                )}

                <div className="space-y-4 pt-4 border-t border-indigo-200/50 flex-grow">
                  <div className="space-y-4">
                    <h6 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">In Practice</h6>
                    <div className="grid grid-cols-1 gap-4">
                      {Array.isArray(strategy.archetype?.tertiary?.inPractice) ? (
                        strategy.archetype.tertiary.inPractice.map((item, i) => (
                          <div key={i} className="space-y-1">
                            <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">{item.label}</p>
                            <p className="text-[11px] text-indigo-900/80 leading-relaxed">{item.content}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-indigo-900 leading-relaxed italic opacity-60">Strategic data pending...</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {strategy.archetype?.tertiary?.traits?.map((trait, i) => (
                      <span key={i} className="px-2 py-0.5 bg-white text-indigo-600 text-[9px] font-bold rounded-full border border-indigo-200/50 shadow-sm uppercase tracking-tighter">{trait}</span>
                    ))}
                  </div>

                  {strategy.archetype?.tertiary?.strategicRationale && (
                    <div className="mt-4 pt-4 border-t border-indigo-200/50">
                      <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest mb-1.5">Strategic Rationale</p>
                      <p className="text-[11px] text-indigo-900/80 leading-relaxed italic">
                        "{strategy.archetype.tertiary.strategicRationale}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Card className="border-none shadow-sm bg-white overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-brand-100">
                <div className="p-8 space-y-4 bg-brand-50/30">
                  <h4 className="label-xs text-brand-500">The Brand's Role</h4>
                  <p className="body text-brand-900 leading-relaxed">{strategy.archetype?.behavior?.role || 'N/A'}</p>
                </div>
                <div className="p-8 space-y-4">
                  <h4 className="label-xs text-brand-500">The Emotional Impact</h4>
                  <p className="body text-brand-900 leading-relaxed">{strategy.archetype?.behavior?.impact || 'N/A'}</p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Pillar 5: Identity & Messaging */}
        <section className="space-y-[var(--space-gap)]">
          <div className="flex items-center gap-3 border-b border-brand-200 pb-[var(--space-item)]">
            <div className="p-2 bg-brand-50 rounded-[var(--radius-control)]">
              <Palette className="w-5 h-5 text-brand-600" />
            </div>
            <h3 className="h2 py-1">Identity & Messaging</h3>
          </div>

          <div className="space-y-8">
            <Card title="Brand Identity System" className="border-none shadow-sm bg-white">
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(strategy.identitySystem?.colors || []).slice(0, 4).map((c, i) => {
                    const hexMatch = c.color.match(/#[0-9A-Fa-f]{3,6}/);
                    const hex = hexMatch ? hexMatch[0] : '#CBD5E1';
                    const extractedName = c.color.replace(/ ?\(?#[0-9A-Fa-f]{3,6}\)?/, '').trim();
                    const descriptiveName = getDescriptiveColorName(hex);
                    const colorName = extractedName || `${c.role || 'Brand'} Color (${descriptiveName})`;
                    const cmyk = hexToCMYK(hex);

                    // Role-based styling for the indicator badge
                    const role = c.role || (i === 0 ? 'Primary' : i === 1 ? 'Secondary' : i === 2 ? 'Tertiary' : 'Accent');
                    const badgeStyles = role === 'Primary' 
                      ? 'bg-brand-900 text-white border-brand-800'
                      : role === 'Tertiary'
                      ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                      : role === 'Accent'
                      ? 'bg-amber-100 text-amber-700 border-amber-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200';

                    return (
                      <div key={i} className="bg-brand-50 rounded-[var(--radius-section)] p-4 border border-brand-100 space-y-3 relative overflow-hidden group min-h-[320px] flex flex-col">
                        {/* Role Indicator Badge */}
                        <div className="absolute top-2 right-2 z-10">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border shadow-sm transition-transform group-hover:scale-105",
                            badgeStyles
                          )}>
                            {role}
                          </span>
                        </div>

                        <div 
                          className="aspect-video rounded-[var(--radius-card)] shadow-inner border border-black/10 transition-transform hover:scale-[1.02] shrink-0"
                          style={{ backgroundColor: hex }}
                        />
                        <div className="space-y-1 flex-1 flex flex-col justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-brand-900 truncate">{colorName}</p>
                            <div className="flex flex-col gap-1">
                              <div className="flex justify-between items-center bg-brand-100/50 px-2 py-1 rounded">
                                <span className="text-[9px] font-bold text-brand-400 uppercase">HEX</span>
                                <code className="text-[10px] font-mono text-brand-600 font-bold">{hex.toUpperCase()}</code>
                              </div>
                              <div className="flex justify-between items-center bg-brand-100/50 px-2 py-1 rounded">
                                <span className="text-[9px] font-bold text-brand-400 uppercase">CMYK</span>
                                <code className="text-[10px] font-mono text-brand-600 font-bold">{cmyk}</code>
                              </div>
                            </div>
                            {/* Psychological Meaning - Removed Truncation */}
                            <p className="text-[10px] text-brand-500 leading-relaxed pt-1.5">{c.meaning}</p>
                          </div>
                          
                          {/* Application Guidance - Removed Truncation */}
                          <div className="pt-3 border-t border-brand-200 mt-3 shrink-0">
                            <p className="label-xs text-brand-400 mb-1">Application</p>
                            <p className="text-[10px] text-brand-600 leading-normal">{c.application}</p>
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
                        <div key={idx} className="p-8 bg-brand-50 rounded-[var(--radius-section)] border border-brand-100 space-y-8 flex flex-col">
                          <div className="flex items-center justify-between border-b border-brand-200 pb-4">
                            <div className="flex items-center gap-3">
                              <span className={cn(
                                "px-3 py-1 rounded-md label-xs",
                                isPrimary ? "bg-brand-900 text-white" : "bg-brand-200 text-brand-700"
                              )}>
                                {isPrimary ? 'Primary Typeface' : 'Secondary Typeface'}
                              </span>
                              <span className="label-xs text-brand-400 opacity-70">
                                {typo.usage}
                              </span>
                            </div>
                            <div className="p-1.5 bg-white rounded-[var(--radius-control)] shadow-sm border border-brand-100">
                              <Type className="w-4 h-4 text-brand-400" />
                            </div>
                          </div>

                          <div className="space-y-6 flex-1">
                            <div className="space-y-4">
                              <h6 className="text-4xl font-bold text-brand-900 tracking-tight font-display">{typo.name}</h6>
                              <div className="flex flex-wrap gap-2">
                                {typo.traits.map((trait, i) => (
                                  <span key={i} className="px-2 py-1 bg-white text-brand-500 text-[10px] font-bold uppercase tracking-tight rounded-md border border-brand-200">
                                    {trait}
                                  </span>
                                ))}
                              </div>
                            </div>
                            
                            <p className="text-sm text-brand-600 leading-relaxed font-light">
                              {typo.description}
                            </p>
                          </div>

                          <div className="pt-6 border-t border-brand-200">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                              <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Application Platforms</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {typo.platforms.map((platform, j) => (
                                <span key={j} className="text-[11px] font-medium text-brand-500">
                                  {platform}{j < typo.platforms.length - 1 ? ' • ' : ''}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Logo Strategic Directions - Dual Pathway Grid */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-brand-200 pb-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-white rounded-xl shadow-sm border border-brand-100">
                          <Palette className="w-5 h-5 text-brand-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest leading-none mb-1">Visual Strategy</p>
                          <h4 className="text-xl font-bold text-brand-900">Logo Strategic Directions</h4>
                        </div>
                      </div>
                      <div className="hidden sm:block px-3 py-1 bg-brand-50 text-brand-600 text-[10px] font-bold uppercase tracking-tight rounded-md border border-brand-200">
                        {strategy.identitySystem.logoOptions?.length || 0} Options Optimized
                      </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      {(strategy.identitySystem.logoOptions || []).map((opt, i) => {
                        const isUserAnchored = opt.strategy === 'User Anchored';
                        return (
                          <div key={i} className="bg-white rounded-[20px] p-6 border border-brand-100 shadow-sm flex flex-col space-y-6 transition-all hover:border-brand-200">
                            <div className="flex items-center justify-between">
                              <span className={cn(
                                "px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border",
                                isUserAnchored ? "bg-brand-900 text-white border-brand-900" : "bg-indigo-50 text-indigo-700 border-indigo-100"
                              )}>
                                {opt.strategy} Concept
                              </span>
                              <div className="flex items-center gap-2">
                                <Box className="w-3.5 h-3.5 text-brand-400" />
                                <span className="text-[10px] font-bold text-brand-400 uppercase tracking-tighter">Pd Optimized</span>
                              </div>
                            </div>

                            <div className="space-y-4 flex-1">
                              <p className="text-sm text-brand-700 leading-relaxed font-light italic">
                                "{opt.description}"
                              </p>
                              
                              {/* Pd Model Analysis Section */}
                              <div className="bg-brand-50 rounded-xl p-4 border border-brand-100 space-y-4">
                                <div className="flex items-center gap-2 border-b border-brand-200/50 pb-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                                  <p className="text-[9px] font-bold text-brand-500 uppercase tracking-widest">Propositional Density (Pd) Model</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-brand-400 uppercase">Surface (Pv)</p>
                                    <p className="text-[10px] text-brand-600 leading-normal">{opt.propositionalDensity.surface}</p>
                                  </div>
                                  <div className="space-y-1 border-l border-brand-200/50 pl-4">
                                    <p className="text-[9px] font-bold text-brand-400 uppercase">Semantic (Ps)</p>
                                    <p className="text-[10px] text-brand-600 leading-normal">{opt.propositionalDensity.semantic}</p>
                                  </div>
                                </div>
                                <div className="pt-2">
                                  <p className="text-[9px] font-bold text-brand-400 uppercase mb-1">Pd Rationale</p>
                                  <p className="text-[10px] text-brand-500 leading-relaxed italic">{opt.propositionalDensity.rationale}</p>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-brand-100">
                              <div className="space-y-3">
                                <p className="label-xs text-brand-400 uppercase tracking-widest">Visual Forms</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {(opt.shapes || []).map((s, j) => (
                                    <span key={j} className="px-2 py-0.5 bg-brand-50 text-brand-600 text-[9px] font-medium rounded border border-brand-100">
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="space-y-3">
                                <p className="label-xs text-brand-400 uppercase tracking-widest">Strategic Symbols</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {(opt.symbols || []).map((s, j) => (
                                    <span key={j} className="px-2 py-0.5 bg-brand-900/5 text-brand-900/60 text-[9px] font-bold rounded border border-brand-900/10">
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            
                            <div className="pt-4">
                              <p className="label-xs text-brand-400 uppercase tracking-widest mb-2">Technical Rationale</p>
                              <p className="text-[11px] text-brand-600 leading-relaxed line-clamp-3">
                                {opt.rationale}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Pillar 6: Tone of Voice Framework */}
        <section className="space-y-[var(--space-gap)]">
          <div className="flex items-center gap-3 border-b border-brand-200 pb-[var(--space-item)]">
            <div className="p-2 bg-brand-50 rounded-[var(--radius-control)]">
              <MessageSquare className="w-5 h-5 text-brand-600" />
            </div>
            <h3 className="h2 py-1">Tone of Voice Framework</h3>
          </div>

          <div className="space-y-8">
            <div className="p-8 rounded-[var(--radius-section)] bg-brand-900 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Quote className="w-32 h-32" />
              </div>
              <div className="relative z-10 space-y-6">
                <div className="space-y-2">
                   <span className="label-xs text-brand-400">The Voice Essence</span>
                   <h4 className="text-3xl font-bold leading-tight font-display">{strategy.archetype?.behavior?.tone?.framework || 'N/A'}</h4>
                </div>
                <p className="text-brand-200 text-lg leading-relaxed max-w-2xl font-light italic">
                  "{strategy.archetype?.behavior?.tone?.description || 'N/A'}"
                </p>
                <div className="flex flex-wrap gap-3 pt-4 border-t border-brand-800">
                  {strategy.archetype?.behavior?.tone?.examples?.map((ex, i) => (
                    <div key={i} className="px-4 py-2 bg-white/10 rounded-[var(--radius-control)] text-xs font-medium border border-white/10">
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
        <section className="space-y-[var(--space-gap)]">
          <div className="flex items-center gap-3 border-b border-brand-200 pb-[var(--space-item)]">
            <div className="p-2 bg-brand-50 rounded-[var(--radius-control)]">
              <Layers className="w-5 h-5 text-brand-600" />
            </div>
            <h3 className="h2 py-1">Brand Touchpoints</h3>
          </div>

          <Card className="border-none shadow-sm bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4">
              {strategy.touchPoints?.map((tp, i) => (
                <div key={i} className="space-y-4 p-6 rounded-[var(--radius-card)] bg-brand-50 border border-brand-100">
                  <h5 className="label-xs text-brand-900 border-l-4 border-brand-600 pl-3">{tp.category}</h5>
                  <div className="grid grid-cols-2 gap-2">
                    {tp.items?.map((item, j) => (
                      <span key={j} className="px-3 py-1 bg-white text-brand-600 text-[10px] rounded-[var(--radius-control)] border border-brand-200 shadow-sm text-center flex items-center justify-center min-h-[32px]">{item}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* Pillar 8: Growth & Partnerships */}
        <section className="space-y-[var(--space-gap)]">
          <div className="flex items-center gap-3 border-b border-brand-200 pb-[var(--space-item)]">
            <div className="p-2 bg-brand-50 rounded-[var(--radius-control)]">
              <Zap className="w-5 h-5 text-brand-600" />
            </div>
            <h3 className="h2 py-1">Growth & Partnerships</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card title="Growth Programs" className="border-none shadow-sm bg-white">
              <div className="space-y-4">
                {strategy.growthPrograms?.map((program, i) => (
                  <div key={i} className="p-6 rounded-[var(--radius-card)] bg-brand-50 border border-brand-100 space-y-2">
                    <h5 className="font-bold text-brand-900 text-lg">{program.name}</h5>
                    <p className="body-sm">{program.description}</p>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="Strategic Partnerships" className="border-none shadow-sm bg-white">
              <div className="space-y-4">
                {strategy.partnerships?.map((partner, i) => (
                  <div key={i} className="p-6 rounded-[var(--radius-card)] bg-brand-50 border border-brand-100 space-y-2">
                    <h5 className="font-bold text-brand-900 text-lg">{partner.name}</h5>
                    <p className="body-sm">{partner.description}</p>
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
          <div className="fixed inset-0 bg-brand-950/40 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[var(--radius-section)] p-10 max-w-xl w-full shadow-2xl border border-brand-100 text-center space-y-8 relative"
            >
              <button
                onClick={() => setShowCompleteModal(false)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-brand-50 hover:bg-brand-100 flex items-center justify-center text-brand-400 hover:text-brand-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-24 h-24 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-3xl font-bold text-brand-900 tracking-tight font-display">Strategy Approved!</h3>
                <p className="body-lg text-brand-500">
                  Your brand strategy has been finalized and saved. You're now ready to move into the visual identity phase.
                </p>
              </div>

              <div className="pt-4 flex flex-col items-center gap-4">
                <Button 
                  variant="secondary"
                  size="md"
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className="w-full border-brand-200 group label"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
                <button 
                  onClick={() => setShowCompleteModal(false)}
                  className="text-brand-400 hover:text-brand-600 font-bold text-xs uppercase tracking-widest transition-colors"
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
