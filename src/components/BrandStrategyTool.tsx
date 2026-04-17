import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrandDiscovery, BrandStrategy, AppNotification } from '../types';
import { pdfService } from '../services/pdfService';
import { Card, Button, Badge } from './UI';
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
import { brandService, normalizeBrandStrategy } from '../services/brandService';
import { motion, AnimatePresence } from 'motion/react';

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
  const journeyRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
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

  const alignStrategicArchitecture = useCallback(() => {
    if (!strategy) return;
    
    // Pro-Tier Segment Architecture
    const optimizedGroups = [
      {
        name: 'The Primary Pursuer',
        description: `Your core audience segment whose primary need is direct transformation through your ${discovery.industry || 'core'} solution.`,
        needs: discovery.customerBenefits?.join(', ') || 'Quality, reliability, and immediate results.',
        painPoints: discovery.problemSolving || 'Inconsistent quality and lack of specialized expertise in the current market.'
      },
      {
        name: 'The Value Evaluator',
        description: 'Strategic decision-makers who focus on ROI, long-term stability, and the measurable value of your delivery model.',
        needs: 'Proven track record, transparent reporting, and competitive pricing frameworks.',
        painPoints: 'Budget instability and risk of choosing unproven or non-scalable solutions.'
      },
      {
        name: 'The Brand Advocate',
        description: 'Long-term loyalists who align personally with your mission and drive organic community growth through word-of-mouth.',
        needs: 'Community belonging, recognition, and consistent alignment with your brand values.',
        painPoints: 'Feeling undervalued or disconnected from the brands they support regularly.'
      },
      {
        name: 'The Adjacent Explorer',
        description: `Emerging segments in related sectors who are beginning to face the ${discovery.problemSolving || 'challenges'} your brand solves best.`,
        needs: 'Innovative applications of your technology/service and approachable entry points.',
        painPoints: 'High barrier to entry and lack of awareness regarding advanced industry solutions.'
      }
    ];

    setStrategy({
      ...strategy,
      audience: {
        ...strategy.audience,
        groups: optimizedGroups
      }
    });

    addNotification({
      title: 'Framework Applied',
      type: 'success',
      message: 'Successfully deployed the specialized 4-Segment Target Architecture.',
      link: 'step:strategy'
    });
  }, [strategy, discovery, setStrategy, addNotification]);

  useEffect(() => {
    if (initialData) {
      const normalized = normalizeBrandStrategy(initialData);
      setStrategy(normalized);
    } else {
      generateStrategy();
    }
  }, [discovery]);

  const handleDownloadPDF = async () => {
    if (!strategy) return;
    setIsDownloading(true);
    try {
      const brandName = discovery.brandNameLogo || discovery.registeredName || 'The Brand';
      await pdfService.exportStrategy(strategy, brandName);
    } catch (err: any) {
      console.error('PDF generation error:', err);
      alert(`PDF generation encountered an issue: ${err.message || 'Unknown error'}. Standard browser print will be used instead.`);
      window.print();
    } finally {
      setIsDownloading(false);
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
              <div ref={journeyRef} className="flex gap-0 min-w-max pb-4">
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
                <div ref={mapRef} className="w-full aspect-video md:aspect-[21/9] relative bg-brand-50 rounded-[var(--radius-section)] border border-brand-200 overflow-hidden">
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

                      <div className="space-y-1">
                        <p className={cn("text-[10px] font-black uppercase tracking-widest", CategoryColors[useCase.category].split(' ')[1])}>
                          {useCase.category.toUpperCase()} WORKBENCH
                        </p>
                        <h5 className="text-xl font-bold text-slate-900">Application: {useCase.targetAudience}</h5>
                      </div>

                      <div className="relative p-6 bg-slate-50 rounded-2xl border border-slate-100/50 group/copy">
                        <p className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-line">
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
