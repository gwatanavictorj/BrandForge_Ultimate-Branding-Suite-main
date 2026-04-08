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
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getAIKeys, saveAIKeys, AIProviderType, AIProvider } from '../services/aiProvider';
import { cn } from '../lib/utils';
import { useAuth } from '../AuthContext';
import { exportProjects, parseImportFile } from '../utils/dataManagement';
import { BrandProject, AppNotification } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
  projects?: BrandProject[];
  onImport?: (data: BrandProject[]) => void;
  addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => Promise<void>;
}

type SettingsCategory = 'general' | 'ai' | 'data' | 'appearance';

export const SettingsModal = ({ isOpen, onClose, onUpdate, projects = [], onImport, addNotification }: Props) => {
  const { user, signOut } = useAuth();
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('general');
  const [keys, setKeys] = useState(getAIKeys());
  const [activeAIProvider, setActiveAIProvider] = useState<AIProviderType>(keys.activeProvider);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testError, setTestError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    { id: 'general', name: 'General', icon: User, color: 'text-brand-600', bgColor: 'bg-brand-50' },
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
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 20 }} 
        onClick={(e) => e.stopPropagation()} 
        className="relative w-[95%] max-w-[700px] bg-white rounded-3xl lg:rounded-[2.5rem] shadow-2xl overflow-hidden h-[75vh] min-h-[550px] max-h-[850px] flex flex-col md:flex-row"
      >

        {/* Sidebar Nav */}
        <div className="w-full md:w-64 bg-slate-50 border-r border-slate-100 p-6 lg:p-8 flex flex-col overflow-y-auto border-b md:border-b-0 shrink-0">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-100">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Settings</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configuration Suite</p>
            </div>
          </div>

          <nav className="space-y-1">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as SettingsCategory)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-2xl transition-all group",
                    isActive ? "bg-white shadow-sm ring-1 ring-slate-200" : "hover:bg-slate-200/50"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
                    isActive ? cat.bgColor + " " + cat.color : "bg-slate-200 text-slate-400 group-hover:bg-slate-300"
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={cn("text-xs font-bold", isActive ? "text-slate-900" : "text-slate-500")}>
                    {cat.name}
                  </span>
                </button>
              )
            })}
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-200">
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
          <div className="p-8 pb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">
              {CATEGORIES.find(c => c.id === activeCategory)?.name}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 pt-4">
            <AnimatePresence mode="wait">
              {activeCategory === 'general' && (
                <motion.div key="gen" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-8">
                  <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl bg-brand-100 flex items-center justify-center border-4 border-white shadow-sm overflow-hidden">
                        {user?.photoURL ? (
                          <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                        ) : <User className="w-10 h-10 text-brand-600" />}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xl font-bold text-slate-900">{user?.displayName || 'BrandForge User'}</h4>
                      <p className="text-sm text-slate-500 flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5" />
                        {user?.email}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-6 bg-brand-50 rounded-3xl border border-brand-100 space-y-3">
                      <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-brand-600">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <h5 className="font-bold text-brand-900">Security Mode</h5>
                      <p className="text-[10px] text-brand-700 leading-relaxed font-medium">Your session is encrypted and authenticated via Firebase. All platform tools are restricted to your verified identity.</p>
                    </div>
                    <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 space-y-3">
                      <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-600">
                        <ExternalLink className="w-5 h-5" />
                      </div>
                      <h5 className="font-bold text-indigo-900">App Version</h5>
                      <p className="text-[10px] text-indigo-700 leading-relaxed font-medium">BrandForge Suite v1.4.2 Enterprise. Running on secure local-cloud hybrid architecture.</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeCategory === 'ai' && (
                <motion.div key="ai" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-8">
                  <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl">
                    {AI_PROVIDERS.map(p => {
                      const Icon = p.icon;
                      const isActive = activeAIProvider === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => setActiveAIProvider(p.id as AIProviderType)}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all",
                            isActive ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                          )}
                        >
                          <Icon className={cn("w-3.5 h-3.5", isActive ? p.color : "text-slate-400")} />
                          {p.name.split(' (')[0]}
                        </button>
                      )
                    })}
                  </div>

                  {AI_PROVIDERS.map(p => activeAIProvider === p.id && (
                    <div key={p.id} className="space-y-6">
                      <div className="space-y-4">
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
                          <div className="space-y-1">
                            <h4 className="font-bold text-slate-900 flex items-center gap-2">
                              {p.name}
                              {(() => {
                                const isActive = keys.activeProvider === p.id && keys[p.id] && keys[p.id].length > 0;
                                const isConnecting = saveStatus === 'saving' && activeAIProvider === p.id;

                                if (isConnecting) return (
                                  <div className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[9px] font-bold uppercase tracking-wider animate-pulse">
                                    Connecting...
                                  </div>
                                );

                                if (isActive) return (
                                  <div className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold uppercase tracking-wider">
                                    Status: Active
                                  </div>
                                )

                                return (
                                  <div className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[9px] font-bold uppercase tracking-wider">
                                    Status: Inactive
                                  </div>
                                );
                              })()}
                            </h4>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">{p.description}</p>
                          </div>
                          {(keys.activeProvider === p.id || testStatus === 'success') && (
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                              testStatus === 'success' ? "bg-emerald-100 text-emerald-500 animate-pulse" : "bg-slate-900 text-white shadow-lg shadow-brand-100"
                            )}>
                              <ShieldCheck className="w-5 h-5" />
                            </div>
                          )}
                        </div>

                        {/* Provider Specific Billing Alert */}
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3 text-blue-700">
                          <Info className="w-5 h-5 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p className="text-[10px] leading-relaxed font-bold uppercase tracking-wider">Provider Billing Info</p>
                            <p className="text-[10px] leading-relaxed font-medium">
                              {p.id === 'openai' && (
                                <>OpenAI API usage is billed separately from ChatGPT Plus. Please check your balance at <a href="https://platform.openai.com/settings/organization/billing" target="_blank" className="underline font-bold hover:text-blue-900">platform.openai.com</a>.</>
                              )}
                              {p.id === 'gemini' && (
                                <>Google Gemini provides a generous free tier for developers. Check your limits and plans at <a href="https://aistudio.google.com/app/plan_management" target="_blank" className="underline font-bold hover:text-blue-900">aistudio.google.com</a>.</>
                              )}
                              {p.id === 'anthropic' && (
                                <>Anthropic API requires pre-purchased credits to operate. Manage your account at <a href="https://console.anthropic.com/settings/plans" target="_blank" className="underline font-bold hover:text-blue-900">console.anthropic.com</a>.</>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">API Secret Key</label>
                            <div className="relative group">
                              <Input
                                type="password"
                                placeholder={`Enter ${p.name} Key`}
                                value={keys[p.id]}
                                className="pr-12"
                                onChange={(e) => setKeys({ ...keys, [p.id]: e.target.value })}
                              />
                              {keys[p.id] && (
                                <button
                                  onClick={() => setKeys({ ...keys, [p.id]: '' })}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                  title="Clear Key"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Enterprise Model</label>
                            <div className="relative">
                              <select
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-brand-100 appearance-none"
                                value={keys.models[p.id]}
                                onChange={(e) => setKeys({ ...keys, models: { ...keys.models, [p.id]: e.target.value } })}
                              >
                                {p.models.map(m => <option key={m} value={m}>{m}</option>)}
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
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
                      {testError && <p className="text-[10px] text-rose-500 font-bold text-center px-4">{testError}</p>}
                    </div>
                  ))}
                </motion.div>
              )}

              {activeCategory === 'data' && (
                <motion.div key="data" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                  <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex items-start gap-4">
                    <Info className="w-5 h-5 text-amber-600 shrink-0 mt-1" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-amber-900 text-sm">Library Portability</h4>
                      <p className="text-[11px] text-amber-800 leading-relaxed opacity-80">Export your brand projects to a universal format for backup or migration to another workstation. Import previously saved files to restore your local strategy library.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="p-6 hover:shadow-lg transition-all border-slate-100 hover:border-brand-100 group cursor-pointer" onClick={() => exportProjects(projects)}>
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors mb-4">
                        <Download className="w-6 h-6" />
                      </div>
                      <h5 className="font-bold text-slate-900 mb-1">Export Library</h5>
                      <p className="text-[10px] text-slate-500">Download {projects.length} brand projects as a secure backup JSON file.</p>
                    </Card>

                    <Card className="p-6 hover:shadow-lg transition-all border-slate-100 hover:border-indigo-100 group cursor-pointer" onClick={handleImportClick}>
                      <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors mb-4">
                        <Upload className="w-6 h-6" />
                      </div>
                      <h5 className="font-bold text-slate-900 mb-1">Import Library</h5>
                      <p className="text-[10px] text-slate-500">Restore or merge brand projects from an external BrandForge export.</p>
                    </Card>
                  </div>

                  <div className="pt-6 border-t border-slate-100">
                    <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Critical Actions</h5>
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full text-rose-600 border-rose-100 hover:bg-rose-50 uppercase tracking-widest font-bold"
                    >
                      <Trash2 className="w-5 h-5" />
                      Wipe Local Strategy Cache
                    </Button>
                    <p className="text-[9px] text-slate-400 text-center mt-3 leading-normal px-8 italic font-medium">Wiping the cache will delete all local project data. Ensure you have exported a backup first.</p>
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
          </div>
        </div>
      </motion.div>
    </div>
  );
};
