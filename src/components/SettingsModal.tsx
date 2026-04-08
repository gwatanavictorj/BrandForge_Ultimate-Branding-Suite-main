import React, { useState, useRef } from 'react';
import { Card, Button, Input } from './UI';
import {
  X,
  Settings,
  Key,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Shield,
  Zap,
  Info,
  ChevronDown,
  User,
  Database,
  Palette,
  Download,
  Upload,
  Trash2,
  ExternalLink,
  Mail,
  ShieldCheck,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getAIKeys, saveAIKeys, AIProviderType, AIProvider } from '../services/aiProvider';
import { cn } from '../lib/utils';
import { useAuth } from '../AuthContext';
import { exportProjects, parseImportFile } from '../utils/dataManagement';
import { BrandProject, AppNotification } from '../types';

const PREDEFINED_AVATARS = [
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Mittens",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Nala",
  "https://api.dicebear.com/7.x/notionists/svg?seed=Snowball",
  "https://api.dicebear.com/7.x/open-peeps/svg?seed=Snuggles",
  "https://api.dicebear.com/7.x/personas/svg?seed=Bella",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=Luna",
  "https://api.dicebear.com/7.x/thumbs/svg?seed=Cleo",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Bandit",
  "https://api.dicebear.com/7.x/micah/svg?seed=Milo"
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
  projects?: BrandProject[];
  onImport?: (data: BrandProject[]) => void;
  addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => Promise<void>;
}

type SettingsCategory = 'general' | 'account' | 'ai' | 'data' | 'appearance';

export const SettingsModal = ({ isOpen, onClose, onUpdate, projects = [], onImport, addNotification }: Props) => {
  const { user, signOut, updateUser } = useAuth();
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('general');
  const [keys, setKeys] = useState(getAIKeys());
  const [activeAIProvider, setActiveAIProvider] = useState<AIProviderType>(keys.activeProvider);
  
  // Account Form State
  const [accountState, setAccountState] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    photoURL: user?.photoURL || '',
    password: '',
    entityType: user?.entityType || 'freelancer',
    agencyName: user?.agencyName || '',
    discipline: user?.discipline || 'Brand Designer',
    customDiscipline: user?.customDiscipline || ''
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testError, setTestError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveAccount = async () => {
    setSaveStatus('saving');
    try {
      const payload: any = { ...accountState };
      if (!payload.password || payload.password.trim() === '') {
        delete payload.password;
      }
      
      await updateUser(payload);
      addNotification({
        title: 'Profile Updated',
        type: 'success',
        message: 'Your account settings have been synchronized.'
      });
      setTimeout(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }, 800);
    } catch (err: any) {
      addNotification({
        title: 'Update Failed',
        type: 'error',
        message: 'Could not sync account changes.'
      });
      setSaveStatus('idle');
    }
  };

  const handleAISave = () => {
    setSaveStatus('saving');
    const isCurrentlyActive = activeAIProvider === keys.activeProvider;

    // Toggle active provider: if already active, deactivate it (set to empty)
    // if not active, set it as the active one
    const newActiveProvider = isCurrentlyActive ? '' : activeAIProvider;

    const newKeys = { ...keys, activeProvider: newActiveProvider };
    saveAIKeys(newKeys);
    setKeys(newKeys);

    if (newActiveProvider === '') {
      addNotification({
        title: 'AI Service Disconnected',
        type: 'info',
        message: `${AI_PROVIDERS.find(p => p.id === activeAIProvider)?.name} has been deactivated.`
      });
    } else {
      addNotification({
        title: 'AI Service Activated',
        type: 'success',
        message: `${AI_PROVIDERS.find(p => p.id === activeAIProvider)?.name} is now your active strategy engine.`
      });
    }

    setTimeout(() => {
      setSaveStatus('saved');
      if (onUpdate) onUpdate();
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 800);
  };

  const handleAITest = async () => {
    const key = keys[activeAIProvider];
    if (!key || key.length < 5) {
      setTestStatus('error');
      setTestError('Please enter a valid API key first.');
      setTimeout(() => setTestStatus('idle'), 3000);
      return;
    }

    setTestStatus('testing');
    setTestError(null);

    try {
      const provider = new AIProvider({
        provider: activeAIProvider,
        apiKey: key,
        model: keys.models[activeAIProvider]
      });

      const response = await provider.generateContent("Respond with 'OK' if you can hear me.");

      if (response && response.length > 0) {
        setTestStatus('success');
        addNotification({
          title: 'Connection Healthy',
          type: 'success',
          message: `${AI_PROVIDERS.find(p => p.id === activeAIProvider)?.name} responded successfully.`
        });
        setTimeout(() => setTestStatus('idle'), 3000);
      } else {
        throw new Error("No response from AI provider.");
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestError(err.message || 'Connection failed. Check your key and network.');
      addNotification({
        title: 'Connection Failed',
        type: 'error',
        message: err.message || 'The AI service could not be reached.'
      });
      setTimeout(() => setTestStatus('idle'), 5000);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImport) {
      try {
        const data = await parseImportFile(file);
        onImport(data);
        onClose();
      } catch (err: any) {
        alert(err.message);
      }
    }
    e.target.value = '';
  };

  const CATEGORIES = [
    { id: 'general', name: 'General', icon: Settings, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
    { id: 'account', name: 'Account', icon: User, color: 'text-brand-600', bgColor: 'bg-brand-50' },
    { id: 'ai', name: 'AI Integrations', icon: Cpu, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
    { id: 'data', name: 'Data Management', icon: Database, color: 'text-amber-600', bgColor: 'bg-amber-50' },
    { id: 'appearance', name: 'Appearance', icon: Palette, color: 'text-rose-600', bgColor: 'bg-rose-50' },
  ];

  const AI_PROVIDERS = [
    { id: 'gemini', name: 'Google Gemini', icon: Zap, color: 'text-blue-600', bgColor: 'bg-blue-50', description: 'Advanced reasoning and massive context windows (up to 2M tokens).', models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash-8b'] },
    { id: 'openai', name: 'OpenAI (GPT)', icon: Cpu, color: 'text-emerald-600', bgColor: 'bg-emerald-50', description: 'Industry leading logic and multimodal capabilities.', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'] },
    { id: 'anthropic', name: 'Anthropic (Claude)', icon: Key, color: 'text-orange-600', bgColor: 'bg-orange-50', description: 'Human-centric reasoning with high nuance and safety.', models: ['claude-3-5-sonnet-20240620', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'] },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-0 md:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 20 }} 
        onClick={(e) => e.stopPropagation()} 
        className="relative w-full md:w-[95%] max-w-[700px] bg-white md:rounded-3xl lg:rounded-[2.5rem] shadow-2xl overflow-hidden h-full md:h-[75vh] md:min-h-[550px] md:max-h-[850px] flex flex-col md:flex-row"
      >

        {/* Mobile Global Header */}
        <div className="md:hidden flex items-center justify-between p-6 pb-2 bg-white border-b border-slate-50 shrink-0">
          <h3 className="text-xl font-bold text-slate-900">
            {CATEGORIES.find(c => c.id === activeCategory)?.name}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Nav */}
        <div className="w-full md:w-64 bg-slate-50 border-r border-slate-100 p-2 md:p-8 flex flex-col md:overflow-y-auto border-b md:border-b-0 shrink-0">
          <div className="hidden md:flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-100">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">Settings</h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Configuration</p>
            </div>
          </div>

          <nav className="grid grid-cols-5 md:flex md:flex-col gap-1 md:gap-1">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as SettingsCategory)}
                  className={cn(
                    "flex-shrink-0 md:w-full flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-1.5 md:p-3 rounded-xl md:rounded-2xl transition-all group text-center",
                    isActive ? "bg-white shadow-sm ring-1 ring-slate-200" : "hover:bg-slate-200/50"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 md:w-8 md:h-8 rounded-lg md:rounded-xl flex items-center justify-center transition-colors shrink-0",
                    isActive ? cat.bgColor + " " + cat.color : "bg-slate-200 text-slate-400 group-hover:bg-slate-300"
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={cn("text-[8px] md:text-xs font-bold leading-tight break-words", isActive ? "text-slate-900" : "text-slate-500")}>
                    {cat.name}
                  </span>
                </button>
              )
            })}
          </nav>

          <div className="hidden md:block mt-auto pt-6 border-t border-slate-200">
            <button
              onClick={() => { signOut(); onClose(); }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl text-rose-600 hover:bg-rose-50 transition-all font-bold text-xs"
            >
              <Trash2 className="w-4 h-4" />
              Sign Out Securely
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          <div className="hidden md:flex p-8 pb-4 items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">
              {CATEGORIES.find(c => c.id === activeCategory)?.name}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 pt-4">
            <AnimatePresence mode="wait">
               {activeCategory === 'general' && (
                <motion.div key="gen" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                  <div className="p-5 bg-brand-50 rounded-3xl border border-brand-100 flex items-start gap-4">
                    <Info className="w-5 h-5 text-brand-600 shrink-0 mt-1" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-brand-900 text-sm">General Preferences</h4>
                      <p className="text-[11px] text-brand-800 leading-relaxed opacity-80 font-medium">Manage global application behavior, security modes, and system-level version controls.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 bg-brand-50 rounded-3xl border border-brand-100 space-y-3">
                      <div className="w-9 h-9 bg-white rounded-xl shadow-sm flex items-center justify-center text-brand-600">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <h5 className="font-bold text-brand-900 text-sm">Security Mode</h5>
                      <p className="text-[10px] text-brand-700 leading-relaxed font-medium">Session encrypted via Firebase. Platform tools restricted to verified identity.</p>
                    </div>
                    <div className="p-5 bg-indigo-50 rounded-3xl border border-indigo-100 space-y-3">
                      <div className="w-9 h-9 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-600">
                        <ExternalLink className="w-5 h-5" />
                      </div>
                      <h5 className="font-bold text-indigo-900 text-sm">App Version</h5>
                      <p className="text-[10px] text-indigo-700 leading-relaxed font-medium">BrandForge Suite v1.4.2 Enterprise. Running on hybrid architecture.</p>
                    </div>
                  </div>
                </motion.div>
              )}

               {activeCategory === 'account' && (
                <motion.div key="acc" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-3">
                  {/* Identity Section */}
                  <div className="space-y-2">
                    <div className="flex gap-4 items-end">
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center w-full">Avatar</label>
                        <div className="relative group w-12 h-12 rounded-full overflow-hidden border-2 border-slate-200">
                          <img 
                            src={accountState.photoURL || PREDEFINED_AVATARS[0]} 
                            alt="Avatar" 
                            className="w-full h-full object-cover bg-slate-50 relative z-0" 
                          />
                          <button 
                            type="button"
                            onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                            className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-end pb-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-800">{accountState.displayName || 'Unnamed User'}</h3>
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-full uppercase tracking-widest">
                            {accountState.discipline}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 text-[9px] font-black rounded-full uppercase tracking-widest inline-flex items-center gap-1">
                            {accountState.entityType === 'agency' ? '🏢 Agency' : '🧑‍💻 Freelancer'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {showAvatarPicker && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        className="space-y-2 p-3 bg-slate-50 border border-slate-100 rounded-2xl"
                      >
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Select from library</label>
                        <div className="flex flex-wrap gap-2">
                          {PREDEFINED_AVATARS.map((url, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setAccountState({ ...accountState, photoURL: url });
                                setShowAvatarPicker(false);
                              }}
                              className={cn(
                                "w-8 h-8 rounded-full overflow-hidden border-2 transition-all p-0.5",
                                accountState.photoURL === url 
                                  ? "border-indigo-500 scale-110 shadow-md ring-2 ring-indigo-100" 
                                  : "border-slate-200 hover:border-indigo-300 hover:scale-105 bg-white"
                              )}
                            >
                              <img src={url} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover rounded-full" />
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Credentials Section */}
                  <div className="flex flex-col gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                      <div className="flex gap-1.5">
                        <Input 
                          value={accountState.email} 
                          onChange={(e) => setAccountState({ ...accountState, email: e.target.value })}
                          className="h-8 text-xs flex-1"
                          placeholder="email@example.com"
                        />
                        <Button onClick={handleSaveAccount} disabled={saveStatus === 'saving'} size="micro">Save</Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                      <div className="flex gap-1.5">
                        <Input 
                          type="password"
                          value={accountState.password} 
                          onChange={(e) => setAccountState({ ...accountState, password: e.target.value })}
                          className="h-8 text-xs flex-1"
                          placeholder="••••••••"
                        />
                        <Button onClick={handleSaveAccount} disabled={saveStatus === 'saving'} size="micro" className="bg-slate-800 hover:bg-slate-700">Save</Button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Profession Details</h4>
                    <div className="flex flex-col gap-2">
                      {/* Entity Selection */}
                      <div className="p-2 bg-slate-50 flex flex-col justify-start rounded-2xl border border-slate-100 gap-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Account Type</label>
                        <div className="flex items-center gap-3 overflow-x-auto">
                          {['freelancer', 'agency'].map(type => (
                            <div key={type} className="flex items-center gap-2 shrink-0">
                              <button 
                                onClick={() => setAccountState({ ...accountState, entityType: type as any })}
                                className="flex items-center gap-1.5 group cursor-pointer"
                              >
                                <div className={cn(
                                  "w-3 h-3 rounded-full border-2 flex items-center justify-center transition-all",
                                  accountState.entityType === type ? "border-brand-600 bg-brand-600" : "border-slate-300 group-hover:border-slate-400"
                                )}>
                                  {accountState.entityType === type && <div className="w-1 h-1 rounded-full bg-white" />}
                                </div>
                                <span className={cn("text-[10px] font-bold capitalize transition-colors", accountState.entityType === type ? "text-slate-900" : "text-slate-400 group-hover:text-slate-500")}>
                                  {type}
                                </span>
                              </button>
                              
                              <AnimatePresence mode="wait">
                                {type === 'agency' && accountState.entityType === 'agency' && (
                                  <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="overflow-hidden">
                                    <Input 
                                      value={accountState.agencyName}
                                      onChange={(e) => setAccountState({ ...accountState, agencyName: e.target.value })}
                                      className="h-6 text-[9px] w-28 bg-white" 
                                      placeholder="Agency Name..."
                                    />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Discipline Selection */}
                      <div className="p-2 bg-slate-50 flex flex-col justify-start rounded-2xl border border-slate-100 gap-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Primary Profession</label>
                        <div className="flex flex-wrap items-center gap-2">
                          {['Brand Designer', 'Brand Strategist', 'UX Designer', 'Other'].map(d => (
                            <div key={d} className="flex items-center gap-1.5">
                              <button
                                onClick={() => setAccountState({ ...accountState, discipline: d as any })}
                                className={cn(
                                  "px-2 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border",
                                  accountState.discipline === d 
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100" 
                                    : "bg-white text-slate-500 border-slate-100 hover:border-slate-200"
                                )}
                              >
                                {d}
                              </button>
                              <AnimatePresence mode="wait">
                                {d === 'Other' && accountState.discipline === 'Other' && (
                                  <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="overflow-hidden">
                                    <Input 
                                      value={accountState.customDiscipline}
                                      onChange={(e) => setAccountState({ ...accountState, customDiscipline: e.target.value })}
                                      className="h-6 text-[9px] w-24 bg-white border-slate-200" 
                                      placeholder="Specify..."
                                    />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Save Changes Button */}
                  <div className="pt-1">
                    <Button 
                      onClick={handleSaveAccount}
                      disabled={saveStatus === 'saving'}
                      size="sm"
                      className="w-full"
                    >
                      {saveStatus === 'saving' ? 'Synchronizing...' : 
                       saveStatus === 'saved' ? 'Account Updated' : 'Save Account Settings'}
                      {saveStatus === 'saved' ? <CheckCircle2 className="w-4 h-4 ml-2" /> : <ShieldCheck className="w-4 h-4 ml-2" />}
                    </Button>
                  </div>
                </motion.div>
              )}

              {activeCategory === 'ai' && (
                <motion.div key="ai" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                  <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl">
                    {AI_PROVIDERS.map(p => {
                      const Icon = p.icon;
                      const isActive = activeAIProvider === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => setActiveAIProvider(p.id as AIProviderType)}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[10px] font-bold transition-all",
                            isActive ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                          )}
                        >
                          <Icon className={cn("w-3 h-3", isActive ? p.color : "text-slate-400")} />
                          {p.name.split(' (')[0]}
                        </button>
                      )
                    })}
                  </div>

                  {AI_PROVIDERS.map(p => activeAIProvider === p.id && (
                    <div key={p.id} className="space-y-3">
                      <div className="space-y-2">
                        <div className="bg-slate-50 rounded-2xl p-2.5 border border-slate-100 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <h4 className="font-bold text-slate-900 flex items-center gap-2 text-xs">
                              {p.name}
                              {(() => {
                                const isActive = keys.activeProvider === p.id && keys[p.id] && keys[p.id].length > 0;
                                const isConnecting = saveStatus === 'saving' && activeAIProvider === p.id;

                                if (isConnecting) return (
                                  <div className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[8px] font-bold uppercase tracking-wider animate-pulse">
                                    Connecting...
                                  </div>
                                );

                                if (isActive) return (
                                  <div className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[8px] font-bold uppercase tracking-wider">
                                    Active
                                  </div>
                                )

                                return (
                                  <div className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[8px] font-bold uppercase tracking-wider">
                                    Inactive
                                  </div>
                                );
                              })()}
                            </h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">{p.description}</p>
                          </div>
                          {(keys.activeProvider === p.id || testStatus === 'success') && (
                            <div className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                              testStatus === 'success' ? "bg-emerald-100 text-emerald-500 animate-pulse" : "bg-slate-900 text-white shadow-lg shadow-brand-100"
                            )}>
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>



                        <div className="space-y-3">
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">API Secret Key</label>
                            <div className="relative group">
                              <Input
                                type="password"
                                placeholder={`Enter ${p.name} Key`}
                                value={keys[p.id]}
                                className="pr-12 h-9 text-xs"
                                onChange={(e) => setKeys({ ...keys, [p.id]: e.target.value })}
                              />
                              {keys[p.id] && (
                                <button
                                  onClick={() => setKeys({ ...keys, [p.id]: '' })}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                  title="Clear Key"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Enterprise Model</label>
                            <div className="relative">
                              <select
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-brand-100 appearance-none"
                                value={keys.models[p.id]}
                                onChange={(e) => setKeys({ ...keys, models: { ...keys.models, [p.id]: e.target.value } })}
                              >
                                {p.models.map(m => <option key={m} value={m}>{m}</option>)}
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {(() => {
                          const isActive = keys.activeProvider === activeAIProvider && keys[activeAIProvider]?.length > 0;
                          return (
                            <Button
                              onClick={handleAISave}
                              size="md"
                              className={cn(
                                "flex-1 transition-all",
                                isActive ? "bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-100 font-bold" : ""
                              )}
                              disabled={saveStatus === 'saving' || !keys[activeAIProvider]}
                            >
                              {saveStatus === 'saved' ? <CheckCircle2 className="w-4 h-4" /> : isActive ? <X className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                              {saveStatus === 'saving' ? 'Processing...' :
                                saveStatus === 'saved' ? 'Settings Resolved' :
                                  isActive ? 'Deactivate & Disconnect' : 'Save & Activate'}
                            </Button>
                          );
                        })()}
                        <Button
                          onClick={handleAITest}
                          disabled={testStatus === 'testing' || !keys[activeAIProvider]}
                          variant="secondary"
                          size="sm"
                          className={cn(
                            "font-bold uppercase tracking-wider",
                            testStatus === 'success' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                              testStatus === 'error' ? "bg-rose-50 text-rose-600 border-rose-100" :
                                "bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100"
                          )}
                        >
                          {testStatus === 'testing' ? <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> :
                            testStatus === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                          {testStatus === 'testing' ? 'Testing...' : testStatus === 'success' ? 'Alive' : 'Test Pulse'}
                        </Button>
                      </div>

                      {/* Provider Specific Billing Alert */}
                      <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3 text-blue-700">
                        <Info className="w-4 h-4 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <p className="text-[9px] leading-relaxed font-black uppercase tracking-widest">Billing Info</p>
                          <p className="text-[10px] leading-relaxed font-medium opacity-90">
                            {p.id === 'openai' && (
                              <>API billed separately from ChatGPT Plus. Manage at <a href="https://platform.openai.com/settings/organization/billing" target="_blank" className="underline font-bold hover:text-blue-900">platform.openai.com</a>.</>
                            )}
                            {p.id === 'gemini' && (
                              <>Generous free tier available for developers. Check limits at <a href="https://aistudio.google.com/app/plan_management" target="_blank" className="underline font-bold hover:text-blue-900">aistudio.google.com</a>.</>
                            )}
                            {p.id === 'anthropic' && (
                              <>Requires pre-purchased credits. Manage account at <a href="https://console.anthropic.com/settings/plans" target="_blank" className="underline font-bold hover:text-blue-900">console.anthropic.com</a>.</>
                            )}
                          </p>
                        </div>
                      </div>
                      {testError && <p className="text-[10px] text-rose-500 font-bold text-center px-4">{testError}</p>}
                    </div>
                  ))}
                </motion.div>
              )}

              {activeCategory === 'data' && (
                <motion.div key="data" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-amber-900 text-xs">Library Portability</h4>
                      <p className="text-[10px] text-amber-800 leading-tight opacity-90 font-medium">Export projects for backup. Import files to restore library.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Card className="p-4 hover:shadow-lg transition-all border-slate-100 hover:border-brand-100 group cursor-pointer" onClick={() => exportProjects(projects)}>
                      <div className="w-9 h-9 bg-white shadow-sm rounded-xl flex items-center justify-center text-slate-400 group-hover:text-brand-600 transition-colors mb-2">
                        <Download className="w-4 h-4" />
                      </div>
                      <h5 className="font-bold text-slate-900 mb-0.5 text-xs">Export Library</h5>
                      <p className="text-[9px] text-slate-500 font-medium leading-tight">Backup {projects.length} projects as JSON.</p>
                    </Card>

                    <Card className="p-4 hover:shadow-lg transition-all border-slate-100 hover:border-indigo-100 group cursor-pointer" onClick={handleImportClick}>
                      <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
                      <div className="w-9 h-9 bg-white shadow-sm rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors mb-2">
                        <Upload className="w-4 h-4" />
                      </div>
                      <h5 className="font-bold text-slate-900 mb-0.5 text-xs">Import Library</h5>
                      <p className="text-[9px] text-slate-500 font-medium leading-tight">Restore from external export.</p>
                    </Card>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Critical Actions</h5>
                    <Button
                      variant="secondary"
                      size="md"
                      className="w-full text-rose-600 border-rose-100 hover:bg-rose-50 uppercase tracking-widest font-black text-[10px] py-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Wipe Cache
                    </Button>
                    <p className="text-[8px] text-slate-400 text-center mt-2 leading-tight px-8 italic font-bold">Wiping cache deletes all data. Export a backup first.</p>
                  </div>
                </motion.div>
              )}

              {activeCategory === 'appearance' && (
                <motion.div key="app" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300">
                    <Palette className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-bold text-slate-900">Visionary Interface</h4>
                    <p className="text-xs text-slate-400 max-w-[280px] leading-relaxed">Advanced UI customisation, dark mode architectures, and brand-specific themes are arriving in the next major suite update.</p>
                  </div>
                  <div className="px-4 py-1.5 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 border border-slate-200">
                    EN ROUTE • V2.0
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mobile Sign Out */}
            <div className="md:hidden mt-10 pt-6 border-t border-slate-100">
              <button 
                onClick={() => { signOut(); onClose(); }}
                className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl text-rose-600 bg-rose-50 border border-rose-100 transition-all font-bold text-xs"
              >
                <Trash2 className="w-4 h-4" />
                Sign Out Securely
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
