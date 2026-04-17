import React, { useState, useEffect, useCallback } from 'react';
import { BrandDiscovery, LogoAssistantData, BrandStrategy, AppNotification, LogoNounGroup } from '../types';
import { Card, Button } from './UI';
import { brandService } from '../services/brandService';
import { pdfService } from '../services/pdfService';
import { Sparkles, Lightbulb, Layers, FolderTree, ImageIcon, Loader, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';


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
      const brandName = discovery.brandNameLogo || discovery.registeredName || 'BrandForge Project';
      pdfService.exportLogo(data, discovery, brandName);
      
      addNotification({
        title: 'Strategy Ready',
        type: 'success',
        message: 'Your Logo Strategy Blueprint has been constructed successfully.',
        link: 'step:logo'
      });
    } catch (err) {
      console.error('PDF Service Error:', err);
      addNotification({
        title: 'Generation Failed',
        type: 'error',
        message: 'The PDF service encountered an error. Please try again.',
        link: 'step:logo'
      });
    }
  }, [data, discovery.registeredName, discovery.brandNameLogo, addNotification]);

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

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const evaluateDensity = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("[evaluateDensity] Triggered! File count:", e.target.files?.length);
    const file = e.target.files?.[0];
    if (!file) {
      console.log("[evaluateDensity] No file selected, aborting.");
      return;
    }

    console.log(`[evaluateDensity] File selected: ${file.name} (${file.size} bytes)`);

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = async (event) => {
      console.log("[evaluateDensity] reader.onload fired!");
      const base64 = event.target?.result as string;
      
      setLoading(prev => ({ ...prev, density: true }));
      addNotification({
        title: 'Analyzing Propositional Density',
        type: 'info',
        message: 'Evaluating the visual-to-semantic ratio of your logo...',
        link: 'step:logo'
      });
      
      try {
        console.log("[evaluateDensity] Calling brandService.evaluatePropositionalDensity...");
        const feedback = await brandService.evaluatePropositionalDensity(discovery, strategy, base64);
        console.log("[evaluateDensity] Raw feedback received:", feedback);
        setData(prev => ({ ...prev, densityFeedback: feedback }));
        addNotification({
          title: 'Density Analysis Complete',
          type: 'success',
          message: `Propositional Density scored at ${feedback.densityScore}.`,
          link: 'step:logo'
        });
      } catch (err: any) {
        console.error("[evaluateDensity] Analysis failed with error:", err);
        addNotification({
          title: 'Analysis Failed',
          type: 'error',
          message: err.message || 'Unable to evaluate the logo.',
          link: 'step:logo'
        });
      } finally {
        console.log("[evaluateDensity] Clearing loading state and resetting input.");
        setLoading(prev => ({ ...prev, density: false }));
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    
    // Fallback if reader fails
    reader.onerror = () => {
      console.error("[evaluateDensity] reader.onerror fired. Could not load file.");
      addNotification({
        title: 'File Read Failed',
        type: 'error',
        message: 'Could not read the uploaded image.',
        link: 'step:logo'
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    console.log("[evaluateDensity] Initiating reader.readAsDataURL...");
    reader.readAsDataURL(file);
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

      <Card title="Propositional Density Check" icon={ImageIcon}>
        <div className="space-y-[var(--space-gap)]">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Upload your logo to evaluate its visual-to-semantic ratio (Pd).</p>
            <div>
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                onChange={evaluateDensity} 
                className="hidden"
                disabled={loading.density}
              />
              <Button 
                disabled={loading.density} 
                size="sm" 
                variant="secondary" 
                onClick={() => fileInputRef.current?.click()}
              >
                {loading.density ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upload Logo'}
              </Button>
            </div>
          </div>

          {data.densityFeedback && (
            <div className="mt-4 p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-sm font-bold text-slate-700">Density Score (Pd)</span>
                <span className={cn(
                  "text-lg font-black",
                  data.densityFeedback.densityScore > 1 ? "text-green-600" : "text-amber-500"
                )}>
                  {data.densityFeedback.densityScore.toFixed(2)}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-2">Surface (Pv)</h4>
                  <ul className="list-disc pl-4 space-y-1">
                    {data.densityFeedback.surfaceElements.map((el, i) => (
                      <li key={i} className="text-sm text-slate-600">{el}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-2">Semantic (Ps)</h4>
                  <ul className="list-disc pl-4 space-y-1">
                    {data.densityFeedback.semanticMeanings.map((el, i) => (
                      <li key={i} className="text-sm text-brand-700">{el}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="pt-3 border-t border-slate-200">
                <h4 className="text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-2">AI Rationale</h4>
                <p className="text-sm text-slate-700 leading-relaxed">{data.densityFeedback.rationale}</p>
              </div>
            </div>
          )}
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
