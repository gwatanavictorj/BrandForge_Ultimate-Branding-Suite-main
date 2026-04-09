import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BrandDiscovery, AppNotification } from '../types';
import { Card, Input, Textarea, Button } from './UI';
import { cn } from '../lib/utils';
import { 
  Target, Compass, Heart, Users, Rocket, FormInput, Loader2, 
  CheckCircle2, AlertCircle, Link as LinkIcon, LogIn, ChevronRight, 
  ArrowLeft, Mail, User, Briefcase, Phone, MapPin, Calendar, 
  Info, Shield, Zap, Star, AlertTriangle, Palette, Trophy, Clock, Sparkles,
  BookOpen, Layout
} from 'lucide-react';
import { brandService } from '../services/brandService';
import { motion, AnimatePresence } from 'motion/react';
import {
  INDUSTRIES, STAGES, DELIVERY_MODELS, BENEFITS, 
  VALUES, STRENGTHS, WEAKNESSES, BRAND_FEELS, EMOTIONAL_OUTCOMES,
  mapStrategicCategory
} from '../utils/mappingUtils';

interface Props {
  initialData?: BrandDiscovery;
  onUpdate?: (data: BrandDiscovery) => void;
  onComplete: (data: BrandDiscovery, nextStep?: 'dashboard' | 'strategy') => Promise<void>;
  addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => Promise<void>;
}

type ImportMethod = 'manual' | 'google';

interface GoogleForm {
  id: string;
  name: string;
  iconLink: string;
}

interface FormResponse {
  responseId: string;
  createTime: string;
  lastSubmittedTime: string;
  respondentEmail?: string;
}

// Constants moved to mappingUtils.ts


const PHASES = [
  { label: 'Details', step: 2 },
  { label: 'Profile', step: 3 },
  { label: 'Story', step: 4 },
  { label: 'Operations', step: 5 },
  { label: 'Foundation', step: 6 },
  { label: 'Identity', step: 7 },
  { label: 'Competition', step: 8 },
  { label: 'Project', step: 9 },
];

export const BrandDiscoveryForm = ({ initialData, onUpdate, onComplete, addNotification }: Props) => {
  const [importMethod, setImportMethod] = useState<ImportMethod>('manual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(initialData ? 2 : 0); // 0 is Intro, 1-9 are sections
  const [highestStep, setHighestStep] = useState(initialData ? 9 : 0);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  
  const [data, setData] = useState<BrandDiscovery>(initialData || {
    email: '',
    fullName: '',
    ownerTitle: '',
    phone: '',
    canContact: true,
    registeredName: '',
    tagline: '',
    address: '',
    dateEstablished: '',
    industry: '',
    industryOther: '',
    stage: '',
    stageOther: '',
    mission: '',
    vision: '',
    philosophy: '',
    problemSolving: '',
    productsServices: '',
    idealCustomers: '',
    deliveryModel: [],
    deliveryModelOther: '',
    customerBenefits: [],
    customerBenefitsOther: '',
    coreValues: [],
    coreValuesOther: '',
    strengths: [],
    strengthsOther: '',
    weaknesses: [],
    weaknessesOther: '',
    brandNameLogo: '',
    brandStory: '',
    brandFeel: [],
    brandFeelOther: '',
    customerEmotionalOutcome: [],
    customerEmotionalOutcomeOther: '',
    colorSymbols: '',
    competitors: '',
    competitorAnalysis: '',
    differentiation: '',
    deadline: '',
    futurePlans: '',
    name: '',
    personality: '',
    tone: 'Professional'
  });

  const isFirstRender = useRef(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const [googleConnected, setGoogleConnected] = useState(false);
  const [forms, setForms] = useState<GoogleForm[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [formResponses, setFormResponses] = useState<FormResponse[]>([]);
  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchForms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/google/forms');
      const { forms } = await res.json();
      setForms(forms || []);
    } catch (err) {
      setError('Failed to fetch Google Forms');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/auth/status');
        const { connected } = await res.json();
        setGoogleConnected(connected);
        if (connected) fetchForms();
      } catch (err) {
        console.error('Failed to check auth status:', err);
      }
    };
    checkStatus();
  }, [fetchForms]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) return;
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        setGoogleConnected(true);
        fetchForms();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [fetchForms]);

  const handleConnectGoogle = async () => {
    try {
      const res = await fetch('/api/auth/google/url');
      const { url } = await res.json();
      window.open(url, 'google_oauth', 'width=600,height=700');
    } catch (err) {
      setError('Failed to get authentication URL');
    }
  };

  const handleDisconnectGoogle = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        setGoogleConnected(false);
        setForms([]);
        setSelectedFormId(null);
        setFormResponses([]);
        setSelectedResponseId(null);
      }
    } catch (err) {
      setError('Failed to disconnect Google account');
    } finally {
      setLoading(false);
    }
  };

  const fetchResponses = async (formId: string) => {
    setLoading(true);
    setSelectedFormId(formId);
    setFormResponses([]);
    try {
      const res = await fetch(`/api/google/forms/${formId}/responses`);
      const { responses } = await res.json();
      const sortedResponses = (responses || []).sort((a: FormResponse, b: FormResponse) => 
        new Date(b.lastSubmittedTime).getTime() - new Date(a.lastSubmittedTime).getTime()
      );
      setFormResponses(sortedResponses);
    } catch (err) {
      setError('Failed to fetch form responses');
    } finally {
      setLoading(false);
    }
  };

  // Local extraction fallback: direct field mapping + keyword matching
  const extractLocally = (answers: { title: string; value: string }[]): Partial<BrandDiscovery> => {
    const result: Partial<BrandDiscovery> = {};
    const lowerMap = answers.map(a => ({ title: a.title.toLowerCase(), value: a.value }));

    const find = (...keywords: string[]) => {
      const match = lowerMap.find(a => keywords.some(k => a.title.includes(k)));
      return match?.value || '';
    };

    const findAll = (...keywords: string[]) => {
      const match = find(...keywords);
      return match ? match.split(',').map(s => s.trim()).filter(Boolean) : [];
    };

    result.email = find('email', 'e-mail', 'mail');
    result.fullName = find('full name', 'your name', 'contact name', 'name of contact');
    result.ownerTitle = find('title', 'role', 'position', 'job title');
    result.phone = find('phone', 'mobile', 'tel', 'whatsapp', 'cell');
    result.registeredName = find('registered', 'business name', 'company name', 'brand name');
    result.tagline = find('tagline', 'motto', 'slogan');
    result.address = find('address', 'location', 'city', 'country', 'office');
    result.dateEstablished = find('date established', 'founded', 'start date', 'year');
    result.industry = find('industry', 'sector', 'field', 'niche');
    result.stage = find('stage', 'business stage', 'growth stage', 'phase');
    result.mission = find('mission');
    result.vision = find('vision');
    result.philosophy = find('philosophy', 'belief', 'principle');
    result.problemSolving = find('problem', 'challenge', 'pain point', 'gap');
    result.productsServices = find('product', 'service', 'offering', 'what do you offer', 'what you offer');
    result.idealCustomers = find('ideal customer', 'target audience', 'target market', 'who do you serve', 'who are you offering');
    result.deliveryModel = findAll('delivery model', 'how are you offering', 'business model', 'how do customers');
    result.customerBenefits = findAll('benefit', 'what benefits', 'customer gain');
    result.coreValues = findAll('core value', 'values', 'brand value', 'principle');
    result.strengths = findAll('strength', 'what do you do well', 'advantage');
    result.weaknesses = findAll('weakness', 'limitation', 'challenge', 'improve');
    result.brandNameLogo = find('brand name', 'logo name', 'name on logo', 'name for logo');
    result.brandStory = find('brand story', 'story behind', 'origin story', 'how did you start');
    result.brandFeel = findAll('brand feel', 'how should your brand feel', 'personality', 'brand personality');
    result.customerEmotionalOutcome = findAll('emotional', 'how should customers feel', 'customer feel');
    result.colorSymbols = find('color', 'colour', 'symbol', 'preferred color');
    result.competitors = find('competitor', 'competition', 'rival');
    result.competitorAnalysis = find('competitor analysis', 'competitive analysis');
    result.differentiation = find('differentiation', 'unique', 'what makes you different', 'stand out');
    result.deadline = find('deadline', 'timeline', 'when do you need');
    result.futurePlans = find('future', 'plans', 'innovation', 'next step', 'where do you see');

    // Derive extra fields
    result.name = result.brandNameLogo || result.registeredName || '';
    result.personality = (result.brandFeel || []).join(', ');
    result.tone = 'Professional';

    return result;
  };

  const handleSelectResponse = async (responseId: string) => {
    if (!selectedFormId) return;
    setLoading(true);
    setSelectedResponseId(responseId);
    setError(null);
    try {
      const res = await fetch(`/api/google/forms/${selectedFormId}/responses/${responseId}`);
      const { formattedAnswers } = await res.json();

      let extractedData: Partial<BrandDiscovery>;

      // Try Gemini AI extraction first
      try {
        const text = (formattedAnswers || []).map((a: any) => `${a.title}: ${a.value}`).join('\n');
        extractedData = await brandService.extractDiscoveryData(text);
      } catch (aiErr) {
        console.warn('Gemini extraction failed, falling back to local extraction:', aiErr);
        // Fallback: direct mapping + keyword matching
        extractedData = extractLocally(formattedAnswers || []);
      }

      // Normalization Layer: Ensure extracted Google Form data perfectly matches the UI options
      const normalizeStringField = (val: string | undefined, list: string[], mapType: any) => {
        if (!val) return { match: undefined, other: undefined };
        const mapped = mapStrategicCategory(val, mapType);
        if (list.includes(mapped)) return { match: mapped, other: undefined };
        if (list.includes('Other')) return { match: 'Other', other: val };
        return { match: undefined, other: val };
      };

      const normalizeArrayField = (arr: any[] | undefined, list: string[], mapType: any) => {
        if (!arr || !Array.isArray(arr)) return { matches: [], others: [] };
        const matches: string[] = [];
        const others: string[] = [];
        arr.forEach(val => {
          if (typeof val !== 'string') return;
          // Splitting is necessary if AI accidentally returned a single comma-joined string
          const parts = val.includes(',') ? val.split(',').map(s => s.trim()) : [val];
          parts.forEach(p => {
             const mapped = mapStrategicCategory(p, mapType);
             if (list.includes(mapped)) {
               if (!matches.includes(mapped)) matches.push(mapped);
             } else {
               if (!others.includes(p)) others.push(p);
             }
          });
        });
        if (others.length > 0 && list.includes('Other') && !matches.includes('Other')) {
          matches.push('Other');
        }
        return { matches, others };
      };

      if (extractedData.industry) {
        const res = normalizeStringField(extractedData.industry, INDUSTRIES, 'industry');
        if (res.match) extractedData.industry = res.match;
        if (res.other) extractedData.industryOther = res.other;
      }

      if (extractedData.stage) {
        const res = normalizeStringField(extractedData.stage, STAGES, 'stage');
        if (res.match) extractedData.stage = res.match;
        if (res.other) extractedData.stageOther = res.other;
      }

      const multiSelects = [
        { field: 'deliveryModel', list: DELIVERY_MODELS, type: 'deliveryModel' },
        { field: 'customerBenefits', list: BENEFITS, type: 'customerBenefits' },
        { field: 'coreValues', list: VALUES, type: 'values' },
        { field: 'strengths', list: STRENGTHS, type: 'strengths' },
        { field: 'weaknesses', list: WEAKNESSES, type: 'weaknesses' },
        { field: 'brandFeel', list: BRAND_FEELS, type: 'brandFeel' },
        { field: 'customerEmotionalOutcome', list: EMOTIONAL_OUTCOMES, type: 'emotionalOutcome' }
      ] as const;

      multiSelects.forEach(({ field, list, type }) => {
        const arr = extractedData[field as keyof BrandDiscovery] as string[] | undefined;
        if (arr && arr.length > 0) {
           const res = normalizeArrayField(arr, list, type);
           (extractedData as any)[field] = res.matches;
           const otherField = `${field}Other` as keyof BrandDiscovery;
           if (res.others.length > 0) {
             (extractedData as any)[otherField] = res.others.join(', ');
           }
        }
      });

      setData(prev => ({ ...prev, ...extractedData }));
      setSuccess(true);
      setImportMethod('manual');
      setCurrentStep(2); // Go to first section after import
      setHighestStep(9); // Unlock progress bar after import
    } catch (err) {
      setError('Failed to extract data from form response');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalComplete = async (nextStep: 'dashboard' | 'strategy') => {
    console.log('Final complete triggered:', nextStep);
    setIsCompleting(true);
    setError(null);
    try {
      await onComplete(data, nextStep);
      console.log('onComplete resolved successfully');
    } catch (err) {
      console.error('Completion error caught in form:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to complete discovery: ${errorMessage}`);
      setShowCompleteModal(false);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 9) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setHighestStep(prev => Math.max(prev, nextStep));
    }
    else setShowCompleteModal(true);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const toggleMultiSelect = (field: keyof BrandDiscovery, value: string, max?: number) => {
    const current = (data[field] as string[]) || [];
    if (current.includes(value)) {
      setData({ ...data, [field]: current.filter(v => v !== value) });
    } else {
      if (max && current.length >= max) return;
      setData({ ...data, [field]: [...current, value] });
    }
  };

  const validateEmail = (email: string) => {
    return email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 2: return validateEmail(data.email) && data.fullName;
      case 3: return data.registeredName && data.industry && data.stage;
      default: return true;
    }
  };

  const renderIntro = () => (
    <div className="text-center space-y-8 py-10">
      <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mx-auto text-brand-600">
        <Rocket className="w-10 h-10" />
      </div>
      <div className="space-y-4">
        <h2 className="text-4xl font-bold text-slate-900 tracking-tight">Let’s Build Your Brand Together 🚀</h2>
        <p className="text-slate-600 max-w-xl mx-auto leading-relaxed">
          We’ll guide you through a few simple questions to understand your business, your vision, and how you want your brand to feel.
        </p>
        <div className="flex items-center justify-center gap-6 text-sm text-slate-500 font-medium">
          <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> 5–8 minutes</span>
          <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Easy steps</span>
        </div>
      </div>
      <div className="flex justify-center">
        <Button onClick={() => setCurrentStep(1)} size="lg" className="shadow-xl shadow-brand-200">
          Start Discovery
        </Button>
      </div>
    </div>
  );

  const renderSection2 = () => (
    <Card title="Client Details" icon={User} className="w-full">
      <div className="space-y-[var(--space-gap)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--space-gap)]">
          <div>
            <label className="text-sm font-bold text-slate-700 mb-1 block">Email *</label>
            <p className="text-xs text-slate-500 mb-2">👉 Where should we send updates?</p>
            <Input 
              type="email"
              placeholder="your@email.com" 
              value={data.email}
              onChange={e => setData({ ...data, email: e.target.value })}
              className={cn(data.email && !validateEmail(data.email) && "border-rose-500")}
            />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-700 mb-1 block">Full Name</label>
            <p className="text-xs text-slate-500 mb-2">👉 Main contact name?</p>
            <Input 
              placeholder="John Doe" 
              value={data.fullName}
              onChange={e => setData({ ...data, fullName: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--space-gap)]">
          <div>
            <label className="text-sm font-bold text-slate-700 mb-1 block">Business Owner Title</label>
            <p className="text-xs text-slate-500 mb-2">👉 What’s your role?</p>
            <Input 
              placeholder="CEO / Founder" 
              value={data.ownerTitle}
              onChange={e => setData({ ...data, ownerTitle: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-700 mb-1 block">Phone Number</label>
            <p className="text-xs text-slate-500 mb-2">👉 Quick reach number?</p>
            <Input 
              type="tel"
              placeholder="+1 (555) 000-0000" 
              value={data.phone}
              onChange={e => setData({ ...data, phone: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-bold text-slate-700 mb-1 block">Can we contact you?</label>
          <p className="text-xs text-slate-500 mb-2">👉 Are you open to us reaching out via WhatsApp or SMS if needed?</p>
          <div className="flex gap-8 mt-3">
            {['Yes', 'No'].map(opt => (
              <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                  (opt === 'Yes' ? data.canContact : !data.canContact)
                    ? "border-brand-600 bg-brand-600"
                    : "border-slate-300 group-hover:border-brand-400"
                )}>
                  {(opt === 'Yes' ? data.canContact : !data.canContact) && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <input
                  type="radio"
                  className="hidden"
                  name="canContact"
                  checked={opt === 'Yes' ? data.canContact : !data.canContact}
                  onChange={() => setData({ ...data, canContact: opt === 'Yes' })}
                />
                <span className="text-sm font-medium text-slate-700">{opt}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );

  const renderSection3 = () => (
    <Card title="Brand Profile" icon={Briefcase} className="w-full">
      <div className="space-y-[var(--space-gap)]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-gap)]">
          <div>
            <label className="text-sm font-bold text-slate-700 mb-1 block">Registered Business Name</label>
            <p className="text-xs text-slate-500 mb-2">👉 Official business name?</p>
            <Input 
              placeholder="Acme Corp" 
              value={data.registeredName}
              onChange={e => setData({ ...data, registeredName: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-700 mb-1 block">Tagline / Motto (Optional)</label>
            <p className="text-xs text-slate-500 mb-2">👉 Slogan or tagline?</p>
            <Input 
              placeholder="e.g. Excellence in everything" 
              value={data.tagline}
              onChange={e => setData({ ...data, tagline: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-gap)]">
          <div>
            <label className="text-sm font-bold text-slate-700 mb-1 block">Business Address</label>
            <p className="text-xs text-slate-500 mb-2">👉 Business location?</p>
            <Input 
              placeholder="123 Main St, City, Country" 
              value={data.address}
              onChange={e => setData({ ...data, address: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-700 mb-1 block">Date Established</label>
            <p className="text-xs text-slate-500 mb-2">👉 Start date?</p>
            <Input 
              type="date"
              value={data.dateEstablished}
              onChange={e => setData({ ...data, dateEstablished: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-gap)]">
          <div>
            <label className="text-sm font-bold text-slate-700 mb-1 block">Industry *</label>
            <p className="text-xs text-slate-500 mb-2">👉 Best description?</p>
            <select 
              className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-brand-500/20"
              value={data.industry}
              onChange={e => setData({ ...data, industry: e.target.value })}
            >
              <option value="">Select an industry</option>
              {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
            </select>
            {data.industry === 'Other' && (
              <Input 
                placeholder="Specify industry..." 
                value={data.industryOther}
                onChange={e => setData({ ...data, industryOther: e.target.value })}
                className="mt-2"
              />
            )}
          </div>
          <div>
            <label className="text-sm font-bold text-slate-700 mb-1 block">Stage of Business *</label>
            <p className="text-xs text-slate-500 mb-2">👉 Current business stage?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STAGES.map(stage => (
                <button
                  key={stage}
                  onClick={() => setData({ ...data, stage })}
                  className={cn(
                    "p-3 sm:p-2 rounded-lg border text-xs font-medium transition-all text-left",
                    data.stage === stage
                      ? "bg-brand-600 border-brand-600 text-white cursor-pointer"
                      : "bg-white border-slate-200 text-slate-600 hover:border-brand-300 cursor-pointer"
                  )}
                >
                  {stage}
                </button>
              ))}
            </div>
            {data.stage === 'Other' && (
              <Input 
                placeholder="Specify stage..." 
                value={data.stageOther}
                onChange={e => setData({ ...data, stageOther: e.target.value })}
                className="mt-2"
              />
            )}
          </div>
        </div>
      </div>
    </Card>
  );

  const renderSection4 = () => (
    <Card title="Your Story" icon={BookOpen} className="w-full">
      <div className="space-y-6">
        <div>
          <label className="text-sm font-bold text-slate-700 mb-1 block">What is the mission of this Brand?</label>
          <p className="text-xs text-slate-500 mb-2">👉 Why does your business exist? What are you trying to achieve?</p>
          <Textarea 
            placeholder="e.g. We help small businesses access affordable logistics..." 
            value={data.mission}
            onChange={e => setData({ ...data, mission: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-bold text-slate-700 mb-1 block">What is the vision of this Brand?</label>
          <p className="text-xs text-slate-500 mb-2">👉 Where do you see your business in the future?</p>
          <Textarea 
            placeholder="e.g. To be the leading provider of..." 
            value={data.vision}
            onChange={e => setData({ ...data, vision: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-bold text-slate-700 mb-1 block">What is Your Brand Philosophy</label>
          <p className="text-xs text-slate-500 mb-2">👉 What core idea or belief drives how you do business?</p>
          <Textarea 
            placeholder="e.g. Quality over quantity..." 
            value={data.philosophy}
            onChange={e => setData({ ...data, philosophy: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-bold text-slate-700 mb-1 block">What Problem is your Business Solving?</label>
          <p className="text-xs text-slate-500 mb-2">👉 What gap did you notice that made you start this business?</p>
          <Textarea 
            placeholder="Describe the pain point..." 
            value={data.problemSolving}
            onChange={e => setData({ ...data, problemSolving: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-bold text-slate-700 mb-1 block">What service or products do you offer?</label>
          <p className="text-xs text-slate-500 mb-2">👉 What exactly do you provide to solve this problem?</p>
          <Textarea 
            placeholder="List your key offerings..." 
            value={data.productsServices}
            onChange={e => setData({ ...data, productsServices: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-bold text-slate-700 mb-1 block">Who are you offering the Services to?</label>
          <p className="text-xs text-slate-500 mb-2">👉 Who are your ideal customers?</p>
          <Textarea 
            placeholder="Describe your target audience..." 
            value={data.idealCustomers}
            onChange={e => setData({ ...data, idealCustomers: e.target.value })}
          />
        </div>
      </div>
    </Card>
  );

  const renderSection5 = () => (
    <Card title="How Your Business Works" icon={Zap} className="w-full">
      <div className="space-y-6">
        <div>
          <label className="text-sm font-bold text-slate-700 mb-1 block">How are you offering this service?</label>
          <p className="text-xs text-slate-500 mb-2">👉 How do customers access or buy from you?</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {DELIVERY_MODELS.map(model => (
              <button
                key={model}
                onClick={() => toggleMultiSelect('deliveryModel', model)}
                className={cn(
                  "p-2 rounded-xl border text-xs font-medium transition-all text-left flex items-center gap-2",
                  data.deliveryModel.includes(model)
                    ? "bg-brand-600 border-brand-600 text-white cursor-pointer"
                    : "bg-white border-slate-200 text-slate-600 hover:border-brand-300 cursor-pointer"
                )}
              >
                <div className={cn("w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0", data.deliveryModel.includes(model) ? "bg-white border-white" : "border-slate-300")}>
                  {data.deliveryModel.includes(model) && <CheckCircle2 className="w-2.5 h-2.5 text-brand-600" />}
                </div>
                <span className="truncate">{model}</span>
              </button>
            ))}
          </div>
          {data.deliveryModel.includes('Other') && (
            <Input 
              placeholder="Specify delivery model..." 
              value={data.deliveryModelOther}
              onChange={e => setData({ ...data, deliveryModelOther: e.target.value })}
              className="mt-2"
            />
          )}
        </div>
        <div>
          <label className="text-sm font-bold text-slate-700 mb-1 block">What benefits do you provide for your customers?</label>
          <p className="text-xs text-slate-500 mb-2">👉 What do customers gain from choosing you?</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {BENEFITS.map(benefit => (
              <button
                key={benefit}
                onClick={() => toggleMultiSelect('customerBenefits', benefit)}
                className={cn(
                  "p-2 rounded-xl border text-xs font-medium transition-all text-left flex items-center gap-2",
                  data.customerBenefits.includes(benefit)
                    ? "bg-brand-600 border-brand-600 text-white cursor-pointer"
                    : "bg-white border-slate-200 text-slate-600 hover:border-brand-300 cursor-pointer"
                )}
              >
                <div className={cn("w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0", data.customerBenefits.includes(benefit) ? "bg-white border-white" : "border-slate-300")}>
                  {data.customerBenefits.includes(benefit) && <CheckCircle2 className="w-2.5 h-2.5 text-brand-600" />}
                </div>
                <span className="truncate">{benefit}</span>
              </button>
            ))}
          </div>
          {data.customerBenefits.includes('Other') && (
            <Input 
              placeholder="Specify benefit..." 
              value={data.customerBenefitsOther}
              onChange={e => setData({ ...data, customerBenefitsOther: e.target.value })}
              className="mt-2"
            />
          )}
        </div>
      </div>
    </Card>
  );

  const renderSection6 = () => (
    <Card title="Your Brand Foundation" icon={Shield} className="w-full">
      <div className="space-y-6">
        <div>
          <label className="text-sm font-bold text-slate-700 mb-1 block">What are your Brand Core Values?</label>
          <p className="text-xs text-slate-500 mb-2">👉 What principles guide how your business operates?</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {VALUES.map(val => (
              <button
                key={val}
                onClick={() => toggleMultiSelect('coreValues', val)}
                className={cn(
                  "p-2 rounded-xl border text-xs font-medium transition-all text-left flex items-center gap-2",
                  data.coreValues.includes(val)
                    ? "bg-brand-600 border-brand-600 text-white cursor-pointer"
                    : "bg-white border-slate-200 text-slate-600 hover:border-brand-300 cursor-pointer"
                )}
              >
                <div className={cn("w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0", data.coreValues.includes(val) ? "bg-white border-white" : "border-slate-300")}>
                  {data.coreValues.includes(val) && <CheckCircle2 className="w-2.5 h-2.5 text-brand-600" />}
                </div>
                <span className="truncate">{val}</span>
              </button>
            ))}
          </div>
          {data.coreValues.includes('Other') && (
            <Input 
              placeholder="Specify value..." 
              value={data.coreValuesOther}
              onChange={e => setData({ ...data, coreValuesOther: e.target.value })}
              className="mt-2"
            />
          )}
        </div>
        <div>
          <label className="text-sm font-bold text-slate-700 mb-1 block">What are your Brand Strengths?</label>
          <p className="text-xs text-slate-500 mb-2">👉 What do you do really well?</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {STRENGTHS.map(str => (
              <button
                key={str}
                onClick={() => toggleMultiSelect('strengths', str)}
                className={cn(
                  "p-2 rounded-lg border text-xs font-medium transition-all text-left flex items-center gap-2",
                  data.strengths.includes(str)
                    ? "bg-brand-600 border-brand-600 text-white cursor-pointer"
                    : "bg-white border-slate-200 text-slate-600 hover:border-brand-300 cursor-pointer"
                )}
              >
                <div className={cn("w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0", data.strengths.includes(str) ? "bg-white border-white" : "border-slate-300")}>
                  {data.strengths.includes(str) && <CheckCircle2 className="w-2.5 h-2.5 text-brand-600" />}
                </div>
                <span className="truncate">{str}</span>
              </button>
            ))}
          </div>
          {data.strengths.includes('Other') && (
            <Input 
              placeholder="Specify strength..." 
              value={data.strengthsOther}
              onChange={e => setData({ ...data, strengthsOther: e.target.value })}
              className="mt-2"
            />
          )}
        </div>
        <div>
          <label className="text-sm font-bold text-slate-700 mb-1 block">What are your Weakness / Limitations?</label>
          <p className="text-xs text-slate-500 mb-2">👉 Where do you feel your business could improve?</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {WEAKNESSES.map(weak => (
              <button
                key={weak}
                onClick={() => toggleMultiSelect('weaknesses', weak)}
                className={cn(
                  "p-2 rounded-lg border text-xs font-medium transition-all text-left flex items-center gap-2",
                  data.weaknesses.includes(weak)
                    ? "bg-brand-600 border-brand-600 text-white cursor-pointer"
                    : "bg-white border-slate-200 text-slate-600 hover:border-brand-300 cursor-pointer"
                )}
              >
                <div className={cn("w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0", data.weaknesses.includes(weak) ? "bg-white border-white" : "border-slate-300")}>
                  {data.weaknesses.includes(weak) && <CheckCircle2 className="w-2.5 h-2.5 text-brand-600" />}
                </div>
                <span className="truncate">{weak}</span>
              </button>
            ))}
          </div>
          {data.weaknesses.includes('Other') && (
            <Input 
              placeholder="Specify weakness..." 
              value={data.weaknessesOther}
              onChange={e => setData({ ...data, weaknessesOther: e.target.value })}
              className="mt-2"
            />
          )}
        </div>
      </div>
    </Card>
  );

  const renderSection7 = () => (
    <Card title="Brand Identity" icon={Palette} className="w-full">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-bold text-slate-700 mb-1 block">What is your Brand Name?</label>
            <p className="text-xs text-slate-500 mb-2">👉 Logo appearance name?</p>
            <Input 
              placeholder="e.g. BRANDFORGE" 
              value={data.brandNameLogo}
              onChange={e => setData({ ...data, brandNameLogo: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-700 mb-1 block">Colour & Symbols</label>
            <p className="text-xs text-slate-500 mb-2">👉 Preferred colors or symbols?</p>
            <Input 
              placeholder="e.g. Blue for trust, Gold for premium..." 
              value={data.colorSymbols}
              onChange={e => setData({ ...data, colorSymbols: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-bold text-slate-700 mb-1 block">What is the meaning or story behind your Brand Name?</label>
          <p className="text-xs text-slate-500 mb-2">👉 Tell us the story or inspiration behind your name</p>
          <Textarea 
            placeholder="Tell us your story..." 
            value={data.brandStory}
            onChange={e => setData({ ...data, brandStory: e.target.value })}
            className="min-h-[80px]"
          />
        </div>
        <div>
          <label className="text-sm font-bold text-slate-700 mb-1 block">Brand Feel / Visual Direction (Select up to 4)</label>
          <p className="text-xs text-slate-500 mb-2">👉 How should your brand look and feel?</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {BRAND_FEELS.map(feel => (
              <button
                key={feel}
                onClick={() => toggleMultiSelect('brandFeel', feel, 4)}
                className={cn(
                  "p-2 rounded-lg border text-xs font-medium transition-all text-left flex items-center gap-2",
                  data.brandFeel.includes(feel)
                    ? "bg-brand-600 border-brand-600 text-white cursor-pointer"
                    : "bg-white border-slate-200 text-slate-600 hover:border-brand-300 cursor-pointer",
                  !data.brandFeel.includes(feel) && data.brandFeel.length >= 4 && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className={cn("w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0", data.brandFeel.includes(feel) ? "bg-white border-white" : "border-slate-300")}>
                  {data.brandFeel.includes(feel) && <CheckCircle2 className="w-2.5 h-2.5 text-brand-600" />}
                </div>
                <span className="truncate">{feel}</span>
              </button>
            ))}
          </div>
          {data.brandFeel.includes('Other') && (
            <Input 
              placeholder="Specify feel..." 
              value={data.brandFeelOther}
              onChange={e => setData({ ...data, brandFeelOther: e.target.value })}
              className="mt-2"
            />
          )}
        </div>
        <div>
          <label className="text-sm font-bold text-slate-700 mb-1 block">Emotional Experience (Select up to 4)</label>
          <p className="text-xs text-slate-500 mb-2">👉 How do you want your customers to feel?</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {EMOTIONAL_OUTCOMES.map(outcome => (
              <button
                key={outcome}
                onClick={() => toggleMultiSelect('customerEmotionalOutcome', outcome, 4)}
                className={cn(
                  "p-2 rounded-lg border text-xs font-medium transition-all text-left flex items-center gap-2",
                  data.customerEmotionalOutcome.includes(outcome)
                    ? "bg-brand-600 border-brand-600 text-white cursor-pointer"
                    : "bg-white border-slate-200 text-slate-600 hover:border-brand-300 cursor-pointer",
                  !data.customerEmotionalOutcome.includes(outcome) && data.customerEmotionalOutcome.length >= 4 && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className={cn("w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0", data.customerEmotionalOutcome.includes(outcome) ? "bg-white border-white" : "border-slate-300")}>
                  {data.customerEmotionalOutcome.includes(outcome) && <CheckCircle2 className="w-2.5 h-2.5 text-brand-600" />}
                </div>
                <span className="truncate">{outcome}</span>
              </button>
            ))}
          </div>
          {data.customerEmotionalOutcome.includes('Other') && (
            <Input 
              placeholder="Specify outcome..." 
              value={data.customerEmotionalOutcomeOther}
              onChange={e => setData({ ...data, customerEmotionalOutcomeOther: e.target.value })}
              className="mt-2"
            />
          )}
        </div>
      </div>
    </Card>
  );

  const renderSection8 = () => (
    <Card title="Competition" icon={Trophy} className="w-full">
      <div className="space-y-6">
        <div>
          <label className="text-sm font-bold text-slate-700 mb-1 block">Who are your competitors and why?</label>
          <p className="text-xs text-slate-500 mb-2">👉 List 2–3 competitors and why they are similar</p>
          <Textarea 
            placeholder="List them here..." 
            value={data.competitors}
            onChange={e => setData({ ...data, competitors: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-bold text-slate-700 mb-1 block">What are their Strengths and weaknesses?</label>
          <p className="text-xs text-slate-500 mb-2">👉 What do they do well—and where do they fall short?</p>
          <Textarea 
            placeholder="Analyze your competition..." 
            value={data.competitorAnalysis}
            onChange={e => setData({ ...data, competitorAnalysis: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-bold text-slate-700 mb-1 block">What makes you different from your competitors?</label>
          <p className="text-xs text-slate-500 mb-2">👉 Why should people choose you instead?</p>
          <Textarea 
            placeholder="Define your unique positioning..." 
            value={data.differentiation}
            onChange={e => setData({ ...data, differentiation: e.target.value })}
          />
        </div>
      </div>
    </Card>
  );

  const renderSection9 = () => (
    <Card title="Project Details" icon={Clock} className="w-full">
      <div className="space-y-6">
        <div>
          <label className="text-sm font-bold text-slate-700 mb-1 block">What is your deadline for this project?</label>
          <p className="text-xs text-slate-500 mb-2">👉 When would you like this completed?</p>
          <Input 
            type="date"
            value={data.deadline}
            onChange={e => setData({ ...data, deadline: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-bold text-slate-700 mb-1 block">Future Plans / Innovation</label>
          <p className="text-xs text-slate-500 mb-2">👉 Tell us anything coming soon we should consider</p>
          <Textarea 
            placeholder="Any new products or services planned?" 
            value={data.futurePlans}
            onChange={e => setData({ ...data, futurePlans: e.target.value })}
          />
        </div>
      </div>
    </Card>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 0: return renderIntro();
      case 1: return (
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-slate-900">Choose Import Method</h3>
            <p className="text-slate-500">How would you like to provide your brand details?</p>
          </div>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                setImportMethod('manual');
                setCurrentStep(2);
                setHighestStep(prev => Math.max(prev, 2));
              }}
              className={cn(
                "flex flex-col items-center gap-2 px-4 py-4 rounded-xl border transition-all font-medium w-36 text-center",
                importMethod === 'manual' 
                  ? "bg-brand-600 border-brand-600 text-white shadow-lg shadow-brand-200 cursor-pointer" 
                  : "bg-white border-slate-200 text-slate-600 hover:border-brand-300 cursor-pointer"
              )}
            >
              <FormInput className="w-6 h-6" />
              <span className="text-sm">Blank</span>
            </button>
            <button
              onClick={() => setImportMethod('google')}
              className={cn(
                "flex flex-col items-center gap-2 px-4 py-4 rounded-xl border transition-all font-medium w-36 text-center",
                importMethod === 'google' 
                  ? "bg-brand-600 border-brand-600 text-white shadow-lg shadow-brand-200 cursor-pointer" 
                  : "bg-white border-slate-200 text-slate-600 hover:border-brand-300 cursor-pointer"
              )}
            >
              <LinkIcon className="w-6 h-6" />
              <span className="text-sm leading-tight">Connect Google Form</span>
            </button>
          </div>

          {importMethod === 'google' && (
            <Card 
              title="Google Forms" 
              icon={LinkIcon} 
              className="max-w-md mx-auto"
              extra={googleConnected && (
                <button 
                  onClick={handleDisconnectGoogle}
                  className="text-[10px] font-bold text-rose-500 hover:text-rose-600 uppercase tracking-wider"
                >
                  Disconnect account
                </button>
              )}
            >
              {!googleConnected ? (
                <Button onClick={handleConnectGoogle} size="md" className="w-full">Connect Google</Button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {!selectedFormId ? 'Select a Form' : 'Select a Response'}
                    </h4>
                    {selectedFormId && (
                      <button 
                        onClick={() => setSelectedFormId(null)}
                        className="text-[10px] font-bold text-brand-600 hover:text-brand-700 uppercase tracking-wider flex items-center gap-1"
                      >
                        <ArrowLeft className="w-3 h-3" /> Back to Forms
                      </button>
                    )}
                  </div>
                  
                  {!selectedFormId ? (
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                      {forms.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-sm italic">
                          No forms found in your account
                        </div>
                      ) : (
                        forms.map(f => (
                          <button 
                            key={f.id} 
                            onClick={() => fetchResponses(f.id)} 
                            className="w-full text-left p-3 hover:bg-slate-50 rounded-xl border border-slate-100 text-sm truncate transition-colors flex items-center justify-between group"
                          >
                            <span className="font-medium text-slate-700">{f.name}</span>
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 transition-colors" />
                          </button>
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                      {formResponses.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-sm italic">
                          No responses found for this form
                        </div>
                      ) : (
                        formResponses.map(r => (
                          <button 
                            key={r.responseId} 
                            onClick={() => handleSelectResponse(r.responseId)} 
                            className="w-full text-left p-3 hover:bg-slate-50 rounded-xl border border-slate-100 text-xs truncate transition-colors flex items-center justify-between group"
                          >
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-700">{r.respondentEmail || 'Anonymous'}</span>
                              <span className="text-[10px] text-slate-400">Submitted {new Date(r.lastSubmittedTime).toLocaleString()}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 transition-colors" />
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}
        </div>
      );
      case 2: return renderSection2();
      case 3: return renderSection3();
      case 4: return renderSection4();
      case 5: return renderSection5();
      case 6: return renderSection6();
      case 7: return renderSection7();
      case 8: return renderSection8();
      case 9: return renderSection9();
      default: return null;
    }
  };

  return (
    <div className="w-full pb-20 px-0">
      <div className="max-w-6xl mx-auto space-y-[var(--space-gap)]">
      {currentStep >= 2 && currentStep <= 9 && (
        <div className="sticky top-0 z-30 bg-white/80 sm:bg-slate-50/95 backdrop-blur-md border-b border-slate-200 py-[var(--space-item)] mb-[var(--space-gap)] -mx-[var(--space-gutter)] px-[var(--space-gutter)]">
          <div className="max-w-6xl mx-auto">
            <div className="relative flex items-center justify-between w-full gap-1">
              {PHASES.map((phase, idx) => {
                const isCurrent = currentStep === phase.step;
                const isPast = currentStep > phase.step;
                const isLast = idx === PHASES.length - 1;
                const isAccessible = phase.step <= highestStep;
                
                return (
                  <React.Fragment key={idx}>
                    <div 
                      className={cn(
                        "flex items-center gap-1.5 md:gap-2 shrink-0 transition-opacity",
                        isAccessible && !isCurrent ? "cursor-pointer hover:opacity-70" : ""
                      )}
                      onClick={() => {
                        if (isAccessible && !isCurrent) {
                          setCurrentStep(phase.step);
                        }
                      }}
                    >
                      <div className={cn(
                        "w-4 h-4 shrink-0 rounded-lg flex items-center justify-center border transition-all duration-500 bg-white z-10",
                        isCurrent ? "border-brand-600 ring-2 ring-brand-50" : 
                        isPast ? "border-brand-600 bg-brand-600" : "border-slate-300"
                      )}>
                        {isPast ? (
                          <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                        ) : (
                          <div className={cn(
                            "w-1 h-1 rounded-full",
                            isCurrent ? "bg-brand-600" : "bg-slate-300"
                          )} />
                        )}
                      </div>
                      <p className={cn(
                        "text-[10px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap",
                        "hidden xl:block", // Only show labels on XL screens to ensure zero scroll on standard desktops (1024px) with sidebar
                        isCurrent ? "text-brand-600" : "text-slate-400"
                      )}>{phase.label}</p>
                    </div>
                    {!isLast && (
                      <div className="flex-1 min-w-[4px] md:min-w-[6px] lg:min-w-[12px] h-0.5 bg-slate-200 mx-0.5 lg:mx-1 relative">
                        {isPast && (
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            className="absolute inset-0 bg-brand-600"
                            transition={{ duration: 0.5 }}
                          />
                        )}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className={cn("max-w-5xl mx-auto", currentStep >= 2 && "mt-4 md:mt-8")}>
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-[32px] flex items-center gap-3 text-rose-700">
            <AlertTriangle className="w-5 h-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="w-full"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {currentStep > 0 && (
        <div className="mt-8 flex flex-row justify-between items-center gap-4 px-4 sm:px-0 py-6 sm:py-0">
          <Button variant="ghost" onClick={handleBack} size="md" className="flex-1 sm:flex-none gap-2 text-slate-500 text-[14px] font-bold uppercase tracking-wider whitespace-nowrap">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Button>
          <div className="flex flex-row items-center gap-4 sm:gap-6 flex-1 sm:flex-none justify-end">
            <Button 
              onClick={handleNext} 
              disabled={!isStepValid()}
              size="md"
              className="w-full sm:w-auto gap-2 bg-brand-600 text-white shadow-xl shadow-brand-100 group px-8 text-[14px] font-bold uppercase tracking-wider whitespace-nowrap"
            >
              {currentStep === 9 ? 'Finish' : 'Next'} 
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 text-brand-600 animate-spin mx-auto" />
            <p className="text-slate-900 font-bold">Processing brand intelligence...</p>
          </div>
        </div>
      )}

      {showCompleteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-6"
          >
            <div className="w-20 h-20 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-900">Discovery Complete!</h3>
              <p className="text-slate-500">Your brand intelligence has been captured. What would you like to do next?</p>
            </div>
            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => handleFinalComplete('strategy')}
                disabled={isCompleting}
                size="md"
                className="w-full py-6 text-sm gap-2 label"
              >
                {isCompleting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>
                    <BookOpen className="w-4 h-4" /> Go to Strategy Engine
                  </>
                )}
              </Button>
              <Button 
                variant="secondary"
                size="md"
                onClick={() => handleFinalComplete('dashboard')}
                disabled={isCompleting}
                className="w-full py-6 text-sm gap-2 label"
              >
                {isCompleting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>
                    <Layout className="w-4 h-4" /> Back to Dashboard
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
      </div>
    </div>
  );
};
