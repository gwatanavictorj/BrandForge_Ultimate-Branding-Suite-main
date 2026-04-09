import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrandDiscovery, BrandStrategy, BrandSystem, LogoAssistantData, BrandProject, Task } from './types';
import { BrandDiscoveryForm } from './components/BrandDiscoveryForm';
import { BrandStrategyTool } from './components/BrandStrategyTool';
import { LogoAssistant } from './components/LogoAssistant';
import { BrandSystemDesigner } from './components/BrandSystemDesigner';
import { UsageGuideGenerator } from './components/UsageGuideGenerator';
import { Dashboard } from './components/Dashboard';
import { SettingsModal } from './components/SettingsModal';
import { Button } from './components/UI';
import { 
  Compass, 
  Sparkles, 
  Palette, 
  FileText, 
  ArrowLeft, 
  LayoutGrid,
  ChevronRight,
  Home,
  CheckCircle2,
  Clock,
  Settings,
  LogOut,
  Loader2,
  BookOpen,
  AlertTriangle,
  Bell,
  Menu,
  X,
  RefreshCw
} from 'lucide-react';
import { NotificationPopover } from './components/NotificationPopover';
import { AppNotification } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { useAuth } from './AuthContext';
import { db, OperationType, handleFirestoreError } from './firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc,
  deleteDoc,
  orderBy,
  batchImportProjects
} from './localDb';
import { exportProjects, parseImportFile } from './utils/dataManagement';
import { Download, Upload } from 'lucide-react';

type Step = 'dashboard' | 'discovery' | 'strategy' | 'logo' | 'system' | 'guide';

const ALL_STEPS: { id: Step; label: string; icon: any }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'discovery', label: 'Discovery', icon: Compass },
  { id: 'strategy', label: 'Brand Strategy', icon: BookOpen },
  { id: 'logo', label: 'Logo Assistant', icon: Sparkles },
  { id: 'system', label: 'Brand System', icon: Palette },
  { id: 'guide', label: 'Usage Guide', icon: FileText },
];

export default function App() {
  const { user, signOut } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('dashboard');
  const [projects, setProjects] = useState<BrandProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [importData, setImportData] = useState<BrandProject[] | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const projectsRef = useRef<BrandProject[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const addNotification = useCallback(async (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    if (!user) return;
    const id = Math.random().toString(36).substr(2, 9);
    const notification: AppNotification = {
      ...n,
      id,
      timestamp: Date.now(),
      read: false
    };
    
    setNotifications(prev => [notification, ...prev]);
    try {
      await setDoc(doc(db, `users/${user.uid}/notifications`, id), notification);
    } catch (err) {
      console.warn('Failed to sync notification to Firestore', err);
    }
  }, [user]);

  const onMarkRead = async (id: string) => {
    if (!user) return;
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await updateDoc(doc(db, `users/${user.uid}/notifications`, id), { read: true });
    } catch (err) {}
  };

  const onMarkAllRead = async () => {
    if (!user) return;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    // Batch update would be better but for now:
    notifications.filter(n => !n.read).forEach(n => onMarkRead(n.id));
  };

  const onClearAll = async () => {
    if (!user) return;
    setNotifications([]);
    notifications.forEach(async (n) => {
      try {
        await deleteDoc(doc(db, `users/${user.uid}/notifications`, n.id));
      } catch (err) {}
    });
  };

  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  const activeProject = projects.find(p => p.id === activeProjectId);

  // Load projects from Firestore
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'projects'),
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => doc.data() as BrandProject);
      setProjects(projectsData);
      setLoading(false);
      setError(null);
    }, (error) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Quota exceeded')) {
        setError("Firestore usage quota exceeded. This usually resets every 24 hours. Please try again tomorrow.");
      } else {
        setError("Failed to load projects. Please check your connection.");
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    };
  }, [user]);

  // Load and sync notifications
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, `users/${user.uid}/notifications`),
      orderBy('timestamp', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as AppNotification);
      setNotifications(data);
    });
    return () => unsubscribe();
  }, [user]);

  const handleCreateProject = async (name: string, client: string, tools: any[]) => {
    if (!user) return;

    const projectId = Math.random().toString(36).substr(2, 9);
    const newProject: BrandProject = {
      id: projectId,
      ownerId: user.uid,
      name,
      client,
      selectedTools: tools,
      tasks: [
        { id: '1', title: 'Complete Brand Discovery', completed: false },
        { id: '2', title: 'Generate Logo Concepts', completed: false },
        { id: '3', title: 'Define Color Palette', completed: false },
      ],
      tracking: {
        progress: 0,
        status: 'planning',
        lastUpdated: Date.now()
      },
      createdAt: Date.now()
    };

    try {
      await setDoc(doc(db, 'projects', projectId), newProject);
      setActiveProjectId(projectId);
      setCurrentStep(tools[0] as Step);
      addNotification({
        type: 'success',
        title: 'Project Created',
        message: `Successfully initialized "${name}" for ${client}.`
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `projects/${projectId}`);
    }
  };

  const handleRenameProject = async (projectId: string, newName: string) => {
    if (!newName.trim()) return;
    try {
      await updateDoc(doc(db, 'projects', projectId), { name: newName });
    } catch (error) {
      setError(`Failed to rename project: ${error}`);
    }
  };

  const handleDuplicateProject = async (project: BrandProject) => {
    if (!user) return;
    const newProjectId = Math.random().toString(36).substr(2, 9);
    const newProject: BrandProject = {
      ...project,
      id: newProjectId,
      name: `${project.name} (Copy)`,
      createdAt: Date.now(),
      tracking: {
        ...project.tracking,
        lastUpdated: Date.now()
      }
    };
    try {
      await setDoc(doc(db, 'projects', newProjectId), newProject);
    } catch (error) {
      setError(`Failed to duplicate project: ${error}`);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await updateDoc(doc(db, 'projects', projectId), { 
        isDeleted: true,
        deletedAt: Date.now()
      });
      if (activeProjectId === projectId) {
        setActiveProjectId(null);
        setCurrentStep('dashboard');
      }
      addNotification({
        type: 'warning',
        title: 'Moved to Trash',
        message: `Project has been moved to trash. You can restore it later.`
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `projects/${projectId}`);
    }
  };

  const handleRestoreProject = async (projectId: string) => {
    try {
      await updateDoc(doc(db, 'projects', projectId), { 
        isDeleted: false,
        deletedAt: null
      });
      addNotification({
        type: 'success',
        title: 'Project Restored',
        message: `Project has been recovered from trash.`
      });
    } catch (error) {
      setError(`Failed to restore project: ${error}`);
    }
  };

  const handlePermanentDeleteProject = async (projectId: string) => {
    try {
      await deleteDoc(doc(db, 'projects', projectId));
    } catch (error) {
      setError(`Failed to permanently delete project: ${error}`);
    }
  };

  const updateProjectData = useCallback(async (data: Partial<BrandProject>, immediate = false) => {
    console.log('updateProjectData called', { activeProjectId, immediate });
    if (!activeProjectId || !user) {
      console.warn('Missing activeProjectId or user', { activeProjectId, user: !!user });
      return;
    }
    
    const project = projectsRef.current.find(p => p.id === activeProjectId);
    if (!project) {
      console.warn('Project not found in ref', { activeProjectId });
      return;
    }

    const updated = { ...project, ...data };
    
    // Update progress based on filled data
    let progress = 0;
    if (updated.discovery) progress += 20;
    if (updated.strategy) progress += 20;
    if (updated.logoAssistant) progress += 20;
    if (updated.system) progress += 20;
    if (updated.system && updated.discovery) progress += 20; // Guide ready
    updated.tracking.progress = Math.min(progress, 100);
    updated.tracking.lastUpdated = Date.now();

    const performUpdate = async () => {
      console.log('Performing Firestore update...');
      try {
        // Add a timeout to the Firestore update to prevent hanging
        const updatePromise = updateDoc(doc(db, 'projects', activeProjectId), updated as any);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Firestore update timed out')), 20000)
        );

        await Promise.race([updatePromise, timeoutPromise]);
        console.log('Firestore update successful');

        // Optimistically update local state
        setProjects(prev => prev.map(p => p.id === activeProjectId ? updated as BrandProject : p));
      } catch (error: any) {
        let errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Handle Quota Exceeded specifically
        if (errorMessage.includes('resource-exhausted') || errorMessage.includes('Quota exceeded')) {
          errorMessage = 'Daily database write quota reached. Your changes are saved locally but won\'t sync to the cloud until the quota resets (usually daily).';
          console.warn('[Firestore] Quota exceeded. Persistence paused.');
          
          // Still update local state so the app remains functional for the user
          setProjects(prev => prev.map(p => p.id === activeProjectId ? updated as BrandProject : p));
          
          if (immediate) {
            setError(`Firestore update failed: ${errorMessage}`);
          }
        } else if (errorMessage.includes('timed out')) {
          errorMessage = 'The update is taking longer than expected. This could be due to a slow connection or the daily write quota being reached. Your changes are saved locally and will sync when possible.';
          console.warn('[Firestore] Update timed out. Persistence will continue in background.');
          
          // Still update local state
          setProjects(prev => prev.map(p => p.id === activeProjectId ? updated as BrandProject : p));
          
          if (immediate) {
            setError(`Firestore update failed: ${errorMessage}`);
          }
        } else {
          console.error('Firestore update failed:', error);
          if (immediate) {
            setError(`Firestore update failed: ${errorMessage}`);
          }
        }
        
        handleFirestoreError(error, OperationType.UPDATE, `projects/${activeProjectId}`);
      }
    };

    if (immediate) {
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
      await performUpdate();
    } else {
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = setTimeout(performUpdate, 1000); // 1 second debounce
    }
  }, [activeProjectId, user]);

  // Keep track of the last active step within the project tracking
  useEffect(() => {
    if (activeProjectId && currentStep !== 'dashboard') {
      const project = projectsRef.current.find(p => p.id === activeProjectId);
      if (project && project.tracking?.lastActiveStep !== currentStep) {
        updateProjectData({
          tracking: { ...project.tracking, lastActiveStep: currentStep as string }
        });
      }
    }
  }, [currentStep, activeProjectId, updateProjectData]);

  // Close sidebar on step change (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [currentStep]);

  const filteredSteps = ALL_STEPS.filter(step => 
    step.id === 'dashboard' || (currentStep !== 'dashboard' && activeProject?.selectedTools.includes(step.id as any))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-brand-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-x-hidden">
      {/* Mobile Sidebar Backdrop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[55] md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 flex flex-col h-screen z-[60] shadow-2xl transition-transform duration-300 md:translate-x-0 md:static md:w-64 md:shadow-none md:z-50",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-500 rounded-[var(--radius-control)] flex items-center justify-center text-white shadow-brand-200">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <h3 className="h3">BrandForge</h3>
        </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="label text-slate-400 mb-4 ml-2">Main Menu</div>
          {filteredSteps.map((step) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            
            // Logic for locking tools within a project
            const isLocked = activeProject && (
              (step.id === 'strategy' && !activeProject.discovery) ||
              (step.id === 'logo' && !activeProject.strategy) ||
              (step.id === 'system' && !activeProject.strategy) ||
              (step.id === 'guide' && (!activeProject.strategy || !activeProject.system))
            ) && (step.id as string) !== 'dashboard';

            return (
              <button
                key={step.id}
                onClick={() => !isLocked && setCurrentStep(step.id)}
                disabled={isLocked}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2 rounded-[var(--radius-section)] transition-all text-left group relative cursor-pointer whitespace-nowrap",
                  isActive 
                    ? "bg-brand-600 text-white shadow-lg shadow-brand-200" 
                    : isLocked
                      ? "opacity-30 cursor-not-allowed"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400 group-hover:text-brand-500")} />
                <span className="font-medium text-xs">{step.label}</span>
                {isActive && (
                  <motion.div 
                    layoutId="active-pill"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                  />
                )}
              </button>
            );
          })}

        </nav>

        <div className="p-3 border-t border-slate-100 space-y-3">
          {activeProject && currentStep !== 'dashboard' && (
            <div className="bg-slate-50 rounded-[var(--radius-card)] p-3 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{activeProject.name}</span>
                <span className="text-brand-600">{activeProject.tracking.progress}%</span>
              </div>
              <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-500 transition-all duration-500" 
                  style={{ width: `${activeProject.tracking.progress}%` }}
                />
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2 px-2">
            <div className="w-8 h-8 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center text-brand-700 font-bold overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span>{user?.displayName?.charAt(0) || 'U'}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate">{user?.displayName || 'User'}</div>
              <div className="text-[10px] text-slate-500 truncate">{user?.email || ''}</div>
            </div>
            <button 
              onClick={() => setShowSettings(true)}
              className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors cursor-pointer"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button 
              onClick={() => signOut()}
              className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0 z-40">
          <div className="flex items-center gap-1.5 md:gap-4 min-w-0">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-slate-50 rounded-xl text-slate-500 md:hidden"
              aria-label="Toggle Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            {currentStep !== 'dashboard' && (
              <button 
                onClick={() => setCurrentStep('dashboard')}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            {(currentStep === 'dashboard' || currentStep === 'discovery') && (
              <h2 className={cn(
                "text-base md:text-lg font-bold text-slate-900 truncate",
                currentStep === 'dashboard' ? "ml-1" : "ml-0"
              )}>
                {ALL_STEPS.find(s => s.id === currentStep)?.label}
              </h2>
            )}
            {activeProject && currentStep !== 'dashboard' && (
              <span className="hidden sm:inline-block px-2 py-0.5 bg-brand-50 text-brand-600 rounded text-[10px] font-bold uppercase tracking-wider truncate max-w-[100px]">
                {activeProject.name}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
            {currentStep !== 'dashboard' && (
              <div className="flex items-center gap-1.5 md:gap-3">
                {currentStep === 'strategy' ? (
                  <div className="flex items-center gap-1.5 md:gap-3">
                    <Button 
                      variant="secondary" 
                      size="micro" 
                      className="md:h-9 md:px-5 md:text-sm text-brand-600 border-brand-100 hover:bg-brand-50"
                      onClick={() => window.dispatchEvent(new CustomEvent('brandforge:refine-strategy'))}
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                      <span className="hidden md:inline">Refine Strategy</span>
                      <span className="md:hidden">Refine</span>
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="micro" 
                      className="md:h-9 md:px-5 md:text-sm text-slate-500 border-slate-200"
                      onClick={() => window.dispatchEvent(new CustomEvent('brandforge:modify-discovery'))}
                    >
                      <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                      <span className="hidden md:inline">Modify Discovery</span>
                      <span className="md:hidden">Modify</span>
                    </Button>
                    <Button 
                      size="micro" 
                      className="md:h-9 md:px-5 md:text-sm bg-brand-600 text-white"
                      onClick={() => window.dispatchEvent(new CustomEvent('brandforge:approve-strategy'))}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      <span className="hidden md:inline">Approve Brand Strategy</span>
                      <span className="md:hidden">Approve</span>
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 md:gap-3">
                    <Button variant="secondary" size="micro" className="md:h-9 md:px-5 md:text-sm">Export</Button>
                    <Button size="micro" className="md:h-9 md:px-5 md:text-sm" onClick={() => updateProjectData({})}>Save</Button>
                  </div>
                )}
                <div className="hidden md:block h-8 w-px bg-slate-200 mx-1"></div>
              </div>
            )}

            <div className="flex items-center gap-3 relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={cn(
                  "p-2 hover:bg-slate-100 rounded-xl text-slate-400 relative transition-colors cursor-pointer",
                  showNotifications && "bg-slate-100 text-brand-600"
                )}
              >
                {notifications.filter(n => !n.read).length > 0 && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></div>
                )}
                <Bell className="w-5 h-5" />
              </button>
              <NotificationPopover 
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                notifications={notifications}
                onMarkRead={onMarkRead}
                onMarkAllRead={onMarkAllRead}
                onClearAll={onClearAll}
              />
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 p-[var(--space-gutter)]">
          <div className="max-w-screen-2xl mx-auto w-full">
            {error && (
              <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-[32px] flex items-center gap-3 text-rose-700">
                <AlertTriangle className="w-5 h-5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {currentStep === 'dashboard' && (
                  <Dashboard 
                    projects={projects} 
                    onSelectProject={project => {
                      setActiveProjectId(project.id);
                      setCurrentStep((project.tracking?.lastActiveStep as Step) || 'discovery');
                    }}
                    onCreateProject={handleCreateProject}
                    onRenameProject={handleRenameProject}
                    onDuplicateProject={handleDuplicateProject}
                    onDeleteProject={handleDeleteProject}
                    onRestoreProject={handleRestoreProject}
                    onPermanentDeleteProject={handlePermanentDeleteProject}
                    addNotification={addNotification}
                  />
                )}
                {currentStep === 'discovery' && activeProject && (
                  <BrandDiscoveryForm 
                    initialData={activeProject.discovery}
                    onUpdate={(data) => {
                      updateProjectData({ discovery: data });
                    }}
                    onComplete={async (data, nextStep) => {
                      addNotification({ 
                        title: 'Discovery Session Completed', 
                        type: 'success', 
                        message: `The foundation for ${activeProject.name} is ready for strategy generation.` 
                      });
                      await updateProjectData({ discovery: data }, true);
                      if (nextStep === 'dashboard') {
                        setCurrentStep('dashboard');
                      } else if (nextStep === 'strategy') {
                        setCurrentStep('strategy');
                      } else {
                        const nextTool = activeProject.selectedTools[activeProject.selectedTools.indexOf('discovery') + 1];
                        if (nextTool) setCurrentStep(nextTool as Step);
                        else setCurrentStep('dashboard');
                      }
                    }}
                    addNotification={addNotification}
                  />
                )}
                {currentStep === 'strategy' && activeProject?.discovery && (
                  <BrandStrategyTool 
                    discovery={activeProject.discovery}
                    initialData={activeProject.strategy}
                    projectName={activeProject.name}
                    clientName={activeProject.client}
                    onUpdate={(data) => {
                      updateProjectData({ strategy: data });
                    }}
                    onModifyDiscovery={() => setCurrentStep('discovery')}
                    onComplete={async (data, nextStep) => {
                      addNotification({ 
                        title: 'Strategic Pillars Generated', 
                        type: 'success', 
                        message: `Brand messaging and strategy for ${activeProject.name} have been finalized.` 
                      });
                      try {
                        await updateProjectData({ strategy: data }, true);
                      } catch (err) {
                        console.warn('Strategy save failed (likely quota), proceeding anyway:', err);
                      }
                      
                      if (nextStep === 'dashboard') {
                        setCurrentStep('dashboard');
                      } else if (nextStep === 'logo') {
                        setCurrentStep('logo');
                      } else {
                        const nextTool = activeProject.selectedTools[activeProject.selectedTools.indexOf('strategy') + 1];
                        if (nextTool) setCurrentStep(nextTool as Step);
                        else setCurrentStep('dashboard');
                      }
                    }}
                    addNotification={addNotification}
                  />
                )}
                {currentStep === 'logo' && activeProject?.strategy && (
                  <LogoAssistant 
                    discovery={activeProject.discovery!} 
                    strategy={activeProject.strategy}
                    initialData={activeProject.logoAssistant}
                    onUpdate={(data) => {
                      updateProjectData({ logoAssistant: data });
                    }}
                    onComplete={async (data) => {
                      addNotification({ 
                        title: 'Logo Direction Finalized', 
                        type: 'success', 
                        message: `Visual identity and logo concepts for ${activeProject.name} are ready.` 
                      });
                      await updateProjectData({ logoAssistant: data }, true);
                      const nextTool = activeProject.selectedTools[activeProject.selectedTools.indexOf('logo') + 1];
                      if (nextTool) setCurrentStep(nextTool as Step);
                    }} 
                    addNotification={addNotification}
                  />
                )}
                {currentStep === 'system' && activeProject?.strategy && (
                  <BrandSystemDesigner 
                    discovery={activeProject.discovery!} 
                    strategy={activeProject.strategy}
                    initialData={activeProject.system}
                    onUpdate={(data) => {
                      updateProjectData({ system: data });
                    }}
                    onComplete={async (data) => {
                      addNotification({ 
                        title: 'Brand System Deployed', 
                        type: 'success', 
                        message: `Colors, typography, and visual assets are now active.` 
                      });
                      await updateProjectData({ system: data }, true);
                      const nextTool = activeProject.selectedTools[activeProject.selectedTools.indexOf('system') + 1];
                      if (nextTool) setCurrentStep(nextTool as Step);
                    }} 
                    addNotification={addNotification}
                  />
                )}
                {currentStep === 'guide' && activeProject?.discovery && activeProject?.strategy && activeProject?.system && (
                  <UsageGuideGenerator 
                    discovery={activeProject.discovery} 
                    strategy={activeProject.strategy}
                    system={activeProject.system} 
                    addNotification={addNotification}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Import Confirmation Modal */}
      <AnimatePresence>
        {isImporting && importData && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden p-8 space-y-6"
            >
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mx-auto">
                <AlertTriangle className="w-8 h-8" />
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-slate-900">Restore Projects?</h3>
                <p className="text-pretty text-slate-500 text-sm">
                  You are about to import <span className="font-bold text-slate-900">{importData.length} projects</span>. 
                  This will REPLACE your current local library. This action cannot be undone.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Button 
                  onClick={() => {
                    batchImportProjects(importData);
                    setIsImporting(false);
                    setImportData(null);
                    setCurrentStep('dashboard');
                    window.location.reload(); // Force reload to refresh all tool states
                  }}
                  className="w-full py-4 bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-100"
                >
                  Overwrite Local Library
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    setIsImporting(false);
                    setImportData(null);
                  }}
                  className="w-full py-4"
                >
                  Cancel Import
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showSettings && (
          <SettingsModal 
            isOpen={showSettings} 
            onClose={() => setShowSettings(false)}
            projects={projects}
            onImport={(data) => {
              setProjects([...projects, ...data]);
              addNotification({ 
                title: 'Library Imported', 
                type: 'success', 
                message: `Successfully added ${data.length} projects to your local library.` 
              });
            }}
            onUpdate={() => {
              console.log('Settings updated');
            }}
            addNotification={addNotification}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
