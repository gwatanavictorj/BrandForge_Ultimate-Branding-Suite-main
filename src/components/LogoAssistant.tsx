import React, { useState, useEffect, useCallback } from 'react';
import { BrandDiscovery, LogoAssistantData, BrandStrategy, AppNotification, LogoNounGroup } from '../types';
import { Card, Button } from './UI';
import { brandService } from '../services/brandService';
import { cn } from '../lib/utils';
import { Sparkles, Lightbulb, FolderTree, Layers, Loader2, Image as ImageIcon, Download } from 'lucide-react';
import jsPDF from 'jspdf';

interface Props {
  discovery: BrandDiscovery;
  strategy: BrandStrategy;
  initialData?: LogoAssistantData;
  onUpdate?: (data: LogoAssistantData) => void;
  onSave?: (data: LogoAssistantData) => Promise<void>;
  onComplete: (data: LogoAssistantData) => void;
  addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => Promise<void>;
}

export const LogoAssistant = ({ discovery, strategy, initialData, onUpdate, onSave, onComplete, addNotification }: Props) => {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [data, setData] = useState<LogoAssistantData>(() => {
    // Strategic Data Migration: Handle legacy projects with old 'array-based' or 'industry-based' noun structure
    if (initialData) {
      const isLegacyNounsArray = Array.isArray(initialData.nouns);
      const isLegacyNounsObject = initialData.nouns && 'industryIcons' in initialData.nouns;
      
      let finalNouns: LogoNounGroup;
      
      if (isLegacyNounsArray) {
        const arr = (initialData.nouns as unknown) as any[];
        finalNouns = {
          realWords: arr.slice(0, 10) || [],
          inventedWords: arr.slice(10, 20) || [],
          compoundWords: arr.slice(20, 30) || [],
          metaphoricalNouns: arr.slice(30, 40) || [],
          abstractConstructs: arr.slice(40) || []
        };
      } else if (isLegacyNounsObject) {
        const old = initialData.nouns as any;
        finalNouns = {
          realWords: old.industryIcons || [],
          metaphoricalNouns: old.metaphoricalSymbols || [],
          abstractConstructs: old.abstractGeometric || [],
          inventedWords: [],
          compoundWords: []
        };
      } else {
        finalNouns = initialData.nouns || { 
          realWords: [], inventedWords: [], compoundWords: [], metaphoricalNouns: [], abstractConstructs: [] 
        };
      }

      return {
        ...initialData,
        nouns: finalNouns,
        smushes: initialData.smushes || [],
        concepts: initialData.concepts || [],
        variations: initialData.variations || [],
        mockupHighlights: initialData.mockupHighlights || [],
        inspirationUrl: initialData.inspirationUrl || ''
      };
    }

    return {
      nouns: {
        realWords: [],
        inventedWords: [],
        compoundWords: [],
        metaphoricalNouns: [],
        abstractConstructs: []
      },
      smushes: [],
      concepts: [],
      variations: [],
      mockupHighlights: [],
      inspirationUrl: ''
    };
  });

  const isFirstRender = React.useRef(true);
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Auto-save whenever data changes (Debounced to save quota)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    if (onUpdate && data) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        onUpdate(data);
      }, 3000); // 3 second debounce
    }

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [data, onUpdate]);

  const handleManualSave = useCallback(async () => {
    const saveFn = onSave || onUpdate;
    if (!saveFn) return;
    
    window.dispatchEvent(new CustomEvent('brandforge:logo-save-status', { detail: 'saving' }));
    try {
      if (onSave) {
        await onSave(data);
      } else {
        await (onUpdate as any)(data);
      }
      window.dispatchEvent(new CustomEvent('brandforge:logo-save-status', { detail: 'saved' }));
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('brandforge:logo-save-status', { detail: 'idle' }));
      }, 2000);
    } catch (err) {
      window.dispatchEvent(new CustomEvent('brandforge:logo-save-status', { detail: 'idle' }));
    }
  }, [data, onUpdate, onSave]);

  const handleExportPDF = useCallback(() => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 50;
      const headerHeight = 35;
      const footerHeight = 30;
      const contentWidth = pageWidth - margin * 2;
      const contentTop = margin + headerHeight;
      const brandName = discovery.brandNameLogo || discovery.registeredName || 'BrandForge Project';
      let y = margin;

      // --- HELPERS ---
      const addHeaderFooter = () => {
        // Header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(brandName.toUpperCase(), margin, margin - 5);
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.setLineWidth(0.5);
        doc.line(margin, margin + 5, pageWidth - margin, margin + 5);

        // Footer
        const pageNum = (doc as any).internal.getCurrentPageInfo().pageNumber;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text('Generated by BrandForge Ultimate Branding Suite', margin, pageHeight - 25);
        doc.text(`Page ${pageNum}`, pageWidth - margin, pageHeight - 25, { align: 'right' });
        doc.line(margin, pageHeight - 35, pageWidth - margin, pageHeight - 35);
      };

      const checkPage = (needed: number) => {
        if (y + needed > pageHeight - margin - footerHeight) {
          doc.addPage();
          addHeaderFooter();
          y = contentTop;
        }
      };

      const addTitle = (text: string) => {
        checkPage(40);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(30, 41, 59); // slate-800
        doc.text(text, margin, y);
        y += 32;
      };

      const addSubtitle = (text: string) => {
        checkPage(25);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(37, 99, 235); // brand-blue
        doc.text(text.toUpperCase(), margin, y);
        y += 18;
      };

      const addBody = (text: string) => {
        if (!text) return;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105); // slate-600
        const lines = doc.splitTextToSize(text, contentWidth);
        for (const line of lines) {
          checkPage(14);
          doc.text(line, margin, y);
          y += 14;
        }
        y += 6;
      };

      const addBullet = (label: string, value: string) => {
        checkPage(14);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);
        doc.text(`• ${label}:`, margin, y);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        const xOffset = doc.getTextWidth(`• ${label}: `);
        const availableWidth = contentWidth - xOffset;
        const lines = doc.splitTextToSize(value, availableWidth);
        
        for (let i = 0; i < lines.length; i++) {
          if (i > 0) {
            checkPage(14);
            doc.text(lines[i], margin + xOffset, y);
          } else {
            doc.text(lines[i], margin + xOffset, y);
          }
          y += 14;
        }
      };

      const addDivider = () => {
        checkPage(30);
        y += 10;
        doc.setDrawColor(241, 245, 249); // slate-100
        doc.line(margin, y, pageWidth - margin, y);
        y += 24;
      };

      // --- COVER PAGE ---
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(3);
      doc.line(margin, 80, pageWidth - margin, 80);

      y = pageHeight * 0.35;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(32);
      doc.setTextColor(30, 41, 59);
      const titleLines = doc.splitTextToSize(brandName, contentWidth);
      titleLines.forEach((line: string) => {
        doc.text(line, pageWidth / 2, y, { align: 'center' });
        y += 40;
      });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(14);
      doc.setTextColor(100, 116, 139);
      doc.text('Logo Strategy Blueprint', pageWidth / 2, y, { align: 'center' });
      
      y += 100;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('PREPARED BY', pageWidth / 2, y, { align: 'center' });
      y += 16;
      doc.setFont('helvetica', 'normal');
      doc.text('BrandForge Intelligence Engine', pageWidth / 2, y, { align: 'center' });
      y += 24;
      doc.text(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), pageWidth / 2, y, { align: 'center' });

      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(3);
      doc.line(margin, pageHeight - 80, pageWidth - margin, pageHeight - 80);

      // --- CONTENT ---
      doc.addPage();
      addHeaderFooter();
      y = contentTop;

      addTitle('The Brand Noun Toolkit');
      addBody('A collection of 50 name-ready constructs and visual anchors categorized by linguistic territory.');
      y += 10;

      const categories = [
        { label: 'Real Words', items: data.nouns.realWords },
        { label: 'Invented Words', items: data.nouns.inventedWords },
        { label: 'Compound Words', items: data.nouns.compoundWords },
        { label: 'Metaphorical Nouns', items: data.nouns.metaphoricalNouns },
        { label: 'Abstract Constructs', items: data.nouns.abstractConstructs }
      ];

      categories.forEach(cat => {
        if (cat.items.length > 0) {
          addSubtitle(cat.label);
          cat.items.forEach(item => {
            const noun = typeof item === 'string' ? { word: item, anchor: '', territory: '' } : item;
            const label = noun.territory && noun.territory !== 'Normal' 
              ? `${noun.word} (${noun.territory})` 
              : noun.word;
            
            if (noun.anchor) {
              addBullet(label, noun.anchor);
            } else {
              addBody(noun.word);
            }
          });
          y += 10;
        }
      });

      addDivider();
      addTitle('Strategic Directions');
      addBody('Three expansive visual rationales tailored to the brand spirit and archetype.');
      y += 10;

      data.concepts.forEach((concept, i) => {
        addSubtitle(`Direction 0${i + 1}`);
        addBody(concept);
        y += 10;
      });

      if (data.smushes.length > 0) {
        addDivider();
        addTitle('Concept Smush Pairings');
        addBody('Clever visual pairings synthesized from the toolkit to create unique, memorable identity marks.');
        y += 10;

        data.smushes.forEach((smush, i) => {
          checkPage(40);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(30, 41, 59);
          doc.text(`${smush.pair[0]} + ${smush.pair[1]}`, margin, y);
          y += 16;
          addBody(smush.description);
          y += 8;
        });
      }

      if (data.variations.length > 0) {
        addDivider();
        addTitle('Adaptive Identity System');
        addBody('Essential logo lockups and functional touchpoints defined for professional brand handoff.'); y += 10;

        data.variations.forEach(v => {
          const [title, rationale] = v.split(':');
          addSubtitle(title.trim());
          addBody(rationale?.trim() || '');
          y += 8;
        });
      }

      if (data.mockupHighlights.length > 0) {
        addDivider();
        addTitle('Presentation Strategy');
        addBody('High-impact mockup scenarios recommended for showcasing the new identity in situ.');
        y += 10;

        data.mockupHighlights.forEach(m => {
          checkPage(20);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          doc.setTextColor(71, 85, 105);
          doc.text(`• ${m}`, margin, y);
          y += 16;
        });
      }

      doc.save(`${brandName.replace(/\s+/g, '_')}_Logo_Strategy.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      window.dispatchEvent(new CustomEvent('brandforge:logo-save-status', { detail: 'idle' }));
    }
  }, [data, discovery.registeredName, discovery.brandNameLogo]);

  // Use refs for stable event listeners to ensure they always have latest state
  const saveHandlerRef = React.useRef(handleManualSave);
  const exportHandlerRef = React.useRef(handleExportPDF);

  useEffect(() => {
    saveHandlerRef.current = handleManualSave;
    exportHandlerRef.current = handleExportPDF;
  }, [handleManualSave, handleExportPDF]);

  useEffect(() => {
    const onSaveEvent = () => saveHandlerRef.current();
    const onExportEvent = () => exportHandlerRef.current();

    window.addEventListener('brandforge:save-logo', onSaveEvent);
    window.addEventListener('brandforge:export-logo', onExportEvent);
    
    return () => {
      window.removeEventListener('brandforge:save-logo', onSaveEvent);
      window.removeEventListener('brandforge:export-logo', onExportEvent);
    };
  }, []);

  const generateNouns = async () => {
    setLoading(prev => ({ ...prev, nouns: true }));
    try {
      const nouns = await brandService.generateNouns(discovery, strategy);
      setData(prev => ({ ...prev, nouns }));
      addNotification({
        title: '50 Brand Nouns Ready',
        type: 'success',
        message: 'Categorized tangible nouns generated for your visual toolkit.',
        link: 'step:logo'
      });
    } catch (err: any) {
      addNotification({
        title: 'Noun Generation Failed',
        type: 'error',
        message: err.message || 'The AI was unable to generate brand metaphors.',
        link: 'step:logo'
      });
    } finally {
      setLoading(prev => ({ ...prev, nouns: false }));
    }
  };

  const generateSmushes = async () => {
    if (!data.nouns.realWords.length && !data.nouns.metaphoricalNouns.length) {
      addNotification({
        title: 'Action Required',
        type: 'warning',
        message: 'Please generate Brand Nouns first before exploring Smushes.',
        link: 'step:logo'
      });
      return;
    }
    setLoading(prev => ({ ...prev, smushes: true }));
    try {
      const smushes = await brandService.generateConceptSmushes(discovery, strategy, data.nouns);
      setData(prev => ({ 
        ...prev, 
        smushes,
        selectedSmushIndex: 0 // Auto-select the first one
      }));
      addNotification({
        title: 'Concept Smushes Ready',
        type: 'success',
        message: '5 clever logo pairings have been synthesized from your nouns.',
        link: 'step:logo'
      });
    } catch (err: any) {
      addNotification({
        title: 'Smush Generation Failed',
        type: 'error',
        message: err.message || 'Unable to pair visual concepts.',
        link: 'step:logo'
      });
    } finally {
      setLoading(prev => ({ ...prev, smushes: false }));
    }
  };

  const generateConcepts = async () => {
    setLoading(prev => ({ ...prev, concepts: true }));
    try {
      const concepts = await brandService.generateLogoConcepts(discovery, strategy);
      setData(prev => ({ ...prev, concepts }));
      addNotification({
        title: 'Logo Concepts Ready',
        type: 'success',
        message: 'Three strategic design directions have been developed.',
        link: 'step:logo'
      });
    } catch (err: any) {
      addNotification({
        title: 'Concept Generation Failed',
        type: 'error',
        message: err.message || 'The AI was unable to develop design directions.',
        link: 'step:logo'
      });
    } finally {
      setLoading(prev => ({ ...prev, concepts: false }));
    }
  };

  const generateInspiration = async () => {
    setLoading(prev => ({ ...prev, inspiration: true }));
    addNotification({
      title: 'Visual Engine Active',
      type: 'info',
      message: 'Synthesizing visual inspiration for your brand identity...',
      link: 'step:logo'
    });
    try {
      const url = await brandService.generateLogoInspiration(discovery, strategy, data);
      setData(prev => ({ ...prev, inspirationUrl: url }));
      addNotification({
        title: 'Visual Blueprint Ready',
        type: 'success',
        message: 'AI-powered visual inspiration is now available.',
        link: 'step:logo'
      });
    } catch (err: any) {
      addNotification({
        title: 'Visual Generation Failed',
        type: 'error',
        message: err.message || 'The AI was unable to generate visual inspiration.',
        link: 'step:logo'
      });
    } finally {
      setLoading(prev => ({ ...prev, inspiration: false }));
    }
  };

  const generateVariations = async () => {
    setLoading(prev => ({ ...prev, variations: true }));
    try {
      const vars = await brandService.generateLogoVariations(discovery, strategy);
      setData(prev => ({ ...prev, variations: vars }));
      addNotification({
        title: 'Adaptive System Defined',
        type: 'success',
        message: 'Logo variations and touchpoints have been tailored to your brand.',
        link: 'step:logo'
      });
    } catch (err: any) {
      addNotification({
        title: 'Variation Generation Failed',
        type: 'error',
        message: err.message || 'Unable to generate specialized variations.',
        link: 'step:logo'
      });
    } finally {
      setLoading(prev => ({ ...prev, variations: false }));
    }
  };

  const generateMockups = async () => {
    setLoading(prev => ({ ...prev, mockups: true }));
    try {
      const highlights = await brandService.generateMockupHighlights(discovery, strategy);
      setData(prev => ({ ...prev, mockupHighlights: highlights }));
      addNotification({
        title: 'Mockup Highlights Ready',
        type: 'success',
        message: 'High-impact presentation scenarios have been tailored to your brand.',
        link: 'step:logo'
      });
    } catch (err: any) {
      addNotification({
        title: 'Mockup Generation Failed',
        type: 'error',
        message: err.message || 'Unable to generate specialized mockup highlights.',
        link: 'step:logo'
      });
    } finally {
      setLoading(prev => ({ ...prev, mockups: false }));
    }
  };

  return (
    <div className="max-w-none mx-auto space-y-[var(--space-section)]">
      <div className="text-center space-y-[var(--space-item)]">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Logo Design Assistant</h2>
        <p className="text-sm sm:text-base text-slate-500">AI-powered brainstorming for your visual identity.</p>
      </div>

    <div className="w-full">
      <Card title="The Brand Noun Toolkit" icon={Sparkles}>
        <div className="space-y-[var(--space-gap)]">
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">50 name-ready constructs, each with a clear visual anchor — categorized by linguistic type.</p>
          
          <div className="flex flex-col gap-10">
            {[
              { label: 'Real Words', items: data.nouns.realWords, color: 'bg-blue-50 text-blue-700' },
              { label: 'Invented Words', items: data.nouns.inventedWords, color: 'bg-purple-50 text-purple-700' },
              { label: 'Compound Words', items: data.nouns.compoundWords, color: 'bg-indigo-50 text-indigo-700' },
              { label: 'Metaphorical Nouns', items: data.nouns.metaphoricalNouns, color: 'bg-brand-50 text-brand-700' },
              { label: 'Abstract Constructs', items: data.nouns.abstractConstructs, color: 'bg-slate-50 text-slate-700' }
            ].map((cat, idx) => (
              <div key={idx} className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">{cat.label}</h4>
                <div className="flex flex-wrap gap-2">
                  {cat.items.length > 0 ? cat.items.map((item, i) => {
                    const noun = typeof item === 'string' ? { word: item, anchor: 'Visual anchor pending...', territory: 'Normal' } : item;
                    const territoryColors: Record<string, string> = {
                      'Premium': 'border-amber-200 bg-amber-50/30 text-amber-900',
                      'Tech-Forward': 'border-cyan-200 bg-cyan-50/30 text-cyan-900',
                      'Human-Centric': 'border-rose-200 bg-rose-50/30 text-rose-900',
                      'Bold/Disruptive': 'border-orange-200 bg-orange-50/30 text-orange-900',
                    };
                    const territoryStyle = territoryColors[noun.territory] || 'border-slate-100 bg-slate-50/30 text-slate-600';

                    return (
                      <div 
                        key={i} 
                        className={cn(
                          "group relative flex flex-col items-start px-3 py-2 rounded-2xl border transition-all hover:shadow-sm",
                          territoryStyle
                        )}
                      >
                        <span className="text-xs font-bold leading-tight">{noun.word}</span>
                        <span className="label-xs text-slate-500 opacity-70 mt-0.5 line-clamp-1 italic font-medium">
                          {noun.anchor}
                        </span>
                        {noun.territory !== 'Normal' && (
                          <div className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-white border border-inherit text-[7px] font-black uppercase tracking-tighter shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            {noun.territory}
                          </div>
                        )}
                      </div>
                    );
                  }) : <span className="text-xs italic text-slate-300">No nouns generated yet...</span>}
                </div>
              </div>
            ))}
          </div>

          <Button 
            onClick={generateNouns} 
            disabled={loading.nouns} 
            size="lg"
            className="w-full"
          >
            {loading.nouns ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate 50 Brand Nouns'}
          </Button>
        </div>
      </Card>
    </div>

      <div className="w-full">
        <Card title="Concept Smush Explorations" icon={Lightbulb}>
          <div className="space-y-[var(--space-gap)]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-[var(--space-gap)]">
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">Clever pairings synthesized from your toolkit.</p>
              <Button onClick={generateSmushes} disabled={loading.smushes || !data.nouns.realWords.length} size="sm" className="w-full sm:w-auto">
                {loading.smushes ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Smush Concepts'}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[var(--space-gap)]">
              {data.smushes.length > 0 ? data.smushes.map((smush, i) => (
                <div 
                  key={i} 
                  onClick={() => setData(prev => ({ ...prev, selectedSmushIndex: i }))}
                  className={cn(
                    "group p-4 bg-white border rounded-[24px] transition-all duration-300 shadow-sm cursor-pointer",
                    data.selectedSmushIndex === i 
                      ? "border-brand-500 bg-brand-50/20 ring-2 ring-brand-500/10" 
                      : "border-slate-100 hover:border-brand-200 hover:shadow-md"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "px-2 py-1 border rounded-xl text-[10px] font-bold uppercase tracking-tighter transition-colors",
                        data.selectedSmushIndex === i ? "bg-brand-600 text-white border-brand-700" : "bg-slate-50 border-slate-100 text-slate-600"
                      )}>
                        {smush.pair[0]}
                      </span>
                      <span className="text-slate-300 font-light text-xs">+</span>
                      <span className={cn(
                        "px-2 py-1 border rounded-xl text-[10px] font-bold uppercase tracking-tighter transition-colors",
                        data.selectedSmushIndex === i ? "bg-brand-600 text-white border-brand-700" : "bg-slate-50 border-slate-100 text-slate-600"
                      )}>
                        {smush.pair[1]}
                      </span>
                    </div>
                    {data.selectedSmushIndex === i && (
                      <span className="label-xs text-brand-600 bg-brand-100 px-2 py-0.5 rounded-full">Selected</span>
                    )}
                  </div>
                  <p className={cn(
                    "text-sm leading-relaxed transition-colors",
                    data.selectedSmushIndex === i ? "text-brand-900 font-medium" : "text-slate-600"
                  )}>
                    {smush.description}
                  </p>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                    <Layers className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-xs text-slate-400 max-w-[200px]">Generate nouns first, then click "Smush Concepts" to see visual pairings.</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <Card title="Strategic Directions" icon={FolderTree}>
        <div className="space-y-[var(--space-gap)]">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Expansive visual rationales for your brand spirit.</p>
            <Button onClick={generateConcepts} disabled={loading.concepts} size="sm" variant="secondary">
              {loading.concepts ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate Directions'}
            </Button>
          </div>
          <div className="space-y-[var(--space-item)]">
            {data.concepts.map((concept, i) => (
              <div key={i} className="p-4 bg-brand-50/50 border border-brand-100 rounded-[24px] text-sm text-brand-900 leading-relaxed">
                {concept}
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card title="Visual Inspiration" icon={ImageIcon}>
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Generate AI-powered visual ideas for your logo.</p>
          
          <div className="space-y-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Choose Strategic Vibe</label>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              {[
                'Minimalist', '3D / Depth', 'Hand-drawn', 
                'Vintage', 'Geometric', 'Organic'
              ].map((vibe) => (
                <label
                  key={vibe}
                  className={cn(
                    "relative flex items-center gap-2 py-2 px-3 rounded-xl border transition-all cursor-pointer group shrink-0",
                    data.inspirationStyle === vibe 
                      ? "bg-brand-50 border-brand-200 shadow-sm" 
                      : "bg-white border-slate-100 hover:border-brand-100 hover:bg-slate-50/50"
                  )}
                >
                  <input
                    type="radio"
                    name="vibe-selection"
                    className="sr-only"
                    checked={data.inspirationStyle === vibe}
                    onChange={() => setData(prev => ({ ...prev, inspirationStyle: vibe }))}
                  />
                  <div className={cn(
                    "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                    data.inspirationStyle === vibe 
                      ? "border-brand-600 bg-brand-600" 
                      : "border-slate-300 bg-white group-hover:border-brand-300"
                  )}>
                    {data.inspirationStyle === vibe && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                    )}
                  </div>
                  <span className={cn(
                    "text-xs font-bold transition-colors",
                    data.inspirationStyle === vibe ? "text-brand-900" : "text-slate-600"
                  )}>
                    {vibe}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {data.inspirationUrl ? (
            <div className="relative group rounded-2xl overflow-hidden border border-slate-200">
              <img 
                src={data.inspirationUrl} 
                alt="Logo Inspiration" 
                className="w-full aspect-square object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button variant="secondary" size="micro" onClick={() => window.open(data.inspirationUrl)}>View Full</Button>
              </div>
            </div>
          ) : (
            <div className="aspect-square bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-[10px] text-center p-6 space-y-2 flex-col">
              <Sparkles className="w-8 h-8 text-slate-200" />
              <p>Pick a vibe and click generate to see strategy-driven sketches.</p>
            </div>
          )}

          <Button 
            onClick={generateInspiration} 
            disabled={loading.inspiration || !data.nouns.realWords.length} 
            size="md"
            className="w-full"
          >
            {loading.inspiration ? <Loader2 className="animate-spin" /> : 'Generate Visuals'}
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-section)]">
        <Card title="Adaptive Logo Variations" icon={Layers}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Essential lockups for your unique touchpoints.</p>
              <Button onClick={generateVariations} disabled={loading.variations} size="sm" variant="secondary">
                {loading.variations ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Define Variations'}
              </Button>
            </div>
            <div className="space-y-2">
              {data.variations.length > 0 ? (
                <ul className="space-y-3">
                  {data.variations.map((v, i) => {
                    const [title, rationale] = v.split(':');
                    return (
                      <li key={i} className="group p-3 bg-white border border-slate-100 rounded-xl hover:border-brand-100 transition-all">
                        <div className="text-[11px] font-bold text-slate-900 uppercase tracking-tight mb-1">{title}</div>
                        <div className="text-[10px] text-slate-500 leading-snug">{rationale}</div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="py-8 text-center border border-dashed border-slate-200 rounded-[24px]">
                  <p className="text-xs text-slate-400">Click define to see brand-specific variations.</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card title="Mockup Highlights" icon={Sparkles}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Strategic presentation scenarios for your industry.</p>
              <Button onClick={generateMockups} disabled={loading.mockups} size="sm" variant="secondary">
                {loading.mockups ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate Highlights'}
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-2 mt-4">
              {data.mockupHighlights.length > 0 ? data.mockupHighlights.map((item, i) => (
                <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-600 flex items-center justify-start px-4 uppercase tracking-tighter hover:bg-white hover:border-brand-200 transition-all cursor-default">
                  ✨ {item}
                </div>
              )) : (
                <div className="py-8 text-center border border-dashed border-slate-200 rounded-[24px]">
                  <p className="text-xs text-slate-400">Click generate to see project-specific mockups.</p>
                </div>
              )}
            </div>
            <p className="text-[10px] text-slate-400 italic mt-4 pt-4 border-t border-slate-50">
              Tip: Use high-quality PSD mockups with smart objects for the best results.
            </p>
          </div>
        </Card>
      </div>

      <Card title="File Management System" icon={FolderTree}>
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Recommended folder structure for professional handoff.</p>
          <div className="text-xs font-mono bg-slate-900 text-slate-300 p-4 rounded-xl space-y-1">
            <div>📁 01_Master_Logos</div>
            <div className="pl-4">📁 AI_Source</div>
            <div className="pl-4">📁 PDF_Vector</div>
            <div>📁 02_Web_Assets</div>
            <div className="pl-4">📁 PNG_Transparent</div>
            <div className="pl-4">📁 SVG_Web</div>
            <div>📁 03_Print_Assets</div>
            <div className="pl-4">📁 CMYK_EPS</div>
            <div>📄 Brand_Guidelines.pdf</div>
          </div>
        </div>
      </Card>

      <div className="flex justify-center pt-8">
        <Button 
          size="lg"
          className="px-12" 
          onClick={() => onComplete(data)}
        >
          Continue to Brand System
        </Button>
      </div>
    </div>
  );
};
