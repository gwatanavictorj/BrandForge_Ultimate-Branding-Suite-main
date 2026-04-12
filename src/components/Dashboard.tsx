import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { BrandProject, AppNotification, Task } from '../types';
import { Card, Button, Input } from './UI';
import { 
  Plus, 
  Folder, 
  Clock, 
  CheckCircle2, 
  MoreVertical, 
  LayoutGrid, 
  Users, 
  Calendar,
  Compass,
  Sparkles,
  Palette,
  FileText,
  X,
  BookOpen,
  Edit,
  Copy,
  Trash,
  List,
  User,
  HardDrive,
  Activity,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface Props {
  projects: BrandProject[];
  onSelectProject: (project: BrandProject) => void;
  onCreateProject: (name: string, client: string, tools: any[]) => void;
  onRenameProject?: (projectId: string, currentName: string) => void;
  onDuplicateProject?: (project: BrandProject) => void;
  onDeleteProject?: (projectId: string) => void;
  onRestoreProject: (id: string) => Promise<void>;
  onPermanentDeleteProject: (id: string) => Promise<void>;
  addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => Promise<void>;
}

export const Dashboard = ({ 
  projects, 
  onSelectProject, 
  onCreateProject, 
  onRenameProject, 
  onDuplicateProject, 
  onDeleteProject,
  onRestoreProject,
  onPermanentDeleteProject,
  addNotification
}: Props) => {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState<string | null>(null);
  const [userName, setUserName] = useState("Designer");

  useEffect(() => {
    const isNewUser = localStorage.getItem('brandforge_just_signed_up');
    if (isNewUser) {
      setGreeting("Welcome");
      localStorage.removeItem('brandforge_just_signed_up');
    } else {
      setGreeting("Welcome back");
    }
  }, []);

  useEffect(() => {
    if (user?.displayName) {
      setUserName(user.displayName);
    }
  }, [user]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'trash'>('active');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [projectToRename, setProjectToRename] = useState<{id: string, name: string} | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<{id: string, name: string} | null>(null);
  const [projectToPermanentDelete, setProjectToPermanentDelete] = useState<{id: string, name: string} | null>(null);
  const [projectDetails, setProjectDetails] = useState<BrandProject | null>(null);
  const [newProject, setNewProject] = useState({ name: '', client: '', tools: ['discovery', 'strategy', 'logo', 'system', 'guide'] });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('brandforge_dashboard_view') as 'grid' | 'list') || 'grid';
  });

  useEffect(() => {
    localStorage.setItem('brandforge_dashboard_view', viewMode);
  }, [viewMode]);

  React.useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const TOOL_OPTIONS = [
    { id: 'discovery', label: 'Brand Discovery', icon: Compass, desc: 'Intelligence Gathering' },
    { id: 'strategy', label: 'Brand Strategy', icon: BookOpen, desc: 'Archetypes & Narrative' },
    { id: 'logo', label: 'Logo Assistant', icon: Sparkles, desc: 'AI Brainstorming' },
    { id: 'system', label: 'Brand System', icon: Palette, desc: 'Visual Language' },
    { id: 'guide', label: 'Usage Guide', icon: FileText, desc: 'Documentation' },
  ];

  const activeProjects = projects.filter(p => !p.isDeleted);
  const trashedProjects = projects.filter(p => !!p.isDeleted);
  const allTasks = activeProjects.flatMap(p => p.tasks);
  const pendingTasks = allTasks.filter(t => !t.completed);
  
  const calculateProjectWeight = (project: BrandProject) => {
    let weight = 0.5; // Base weight (MB)
    if (project.discovery) weight += 1.2;
    if (project.strategy) weight += 2.4;
    if (project.logoAssistant) weight += 8.6;
    if (project.system) weight += 1.3;
    if (project.selectedTools.includes('guide')) weight += 1.1;
    
    // Add a tiny bit of random deterministic jitter based on name length
    const jitter = (project.name.length % 10) / 10;
    return (weight + jitter).toFixed(1);
  };

  const displayProjects = activeTab === 'active' ? activeProjects : trashedProjects;

  const handleRestoreAll = async () => {
    for (const p of trashedProjects) {
      await onRestoreProject(p.id);
    }
    addNotification({
      title: 'Bulk Restoration Successful',
      type: 'success',
      message: `Successfully restored ${trashedProjects.length} projects to your workspace.`
    });
  };

  const handleBatchRestore = async () => {
    for (const id of selectedIds) {
      await onRestoreProject(id);
    }
    addNotification({
      title: 'Projects Restored',
      type: 'success',
      message: `Successfully restored ${selectedIds.size} selected projects.`
    });
    setSelectedIds(new Set());
  };

  const handleBatchDelete = async () => {
    for (const id of selectedIds) {
      await onPermanentDeleteProject(id);
    }
    addNotification({
      title: 'Projects Deleted',
      type: 'info',
      message: `Permanently deleted ${selectedIds.size} projects.`
    });
    setSelectedIds(new Set());
  };

  console.log('Dashboard Render:', { 
    total: projects.length, 
    active: activeProjects.length, 
    trashed: trashedProjects.length,
    tab: activeTab 
  });

  return (
    <div className="space-y-[var(--space-section)]">
      {/* Welcome Section */}
      <div className="flex flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-left min-w-0 flex-1">
          <h2 className="h2 truncate">{greeting}, {userName}</h2>
          <p className="body truncate">You have {pendingTasks.length} pending tasks across {activeProjects.length} projects.</p>
        </div>
        <Button onClick={() => setShowNewModal(true)} size="lg" className="gap-2 shadow-brand-200 shrink-0">
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">New Project</span>
          <span className="sm:hidden text-xs">New</span>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-[var(--space-gap)]">
        <Card className="flex items-center gap-[var(--space-item)] p-[var(--space-gap)] text-left transition-all hover:bg-slate-50 rounded-[var(--radius-section)]">
          <div className="w-8 h-8 sm:w-12 sm:h-12 bg-brand-50 rounded-[var(--radius-control)] flex items-center justify-center text-brand-600 shrink-0">
            <Folder className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 flex flex-col">
            <div className="h2 leading-none">{activeProjects.length}</div>
            <div className="label mt-0.5 sm:mt-1">Active Projects</div>
          </div>
        </Card>
        <Card className="flex items-center gap-[var(--space-item)] p-[var(--space-gap)] text-left transition-all hover:bg-slate-50 rounded-[var(--radius-section)]">
          <div className="w-8 h-8 sm:w-12 sm:h-12 bg-emerald-50 rounded-[var(--radius-control)] flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 flex flex-col">
            <div className="h2 leading-none">{allTasks.filter(t => t.completed).length}</div>
            <div className="label mt-0.5 sm:mt-1">Tasks Completed</div>
          </div>
        </Card>
        <Card className="flex items-center gap-[var(--space-item)] p-[var(--space-gap)] text-left transition-all hover:bg-slate-50 rounded-[var(--radius-section)]">
          <div className="w-8 h-8 sm:w-12 sm:h-12 bg-amber-50 rounded-[var(--radius-control)] flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 flex flex-col">
            <div className="h2 leading-none">{pendingTasks.length}</div>
            <div className="label mt-0.5 sm:mt-1">Pending Tasks</div>
          </div>
        </Card>
      </div>

      {/* Projects List */}
      <div className="space-y-[var(--space-gap)]">
        <div className="flex flex-row items-center justify-between gap-[var(--space-gap)]">
          <div className="flex items-center bg-slate-100 p-1 rounded-[var(--radius-card)] shrink-0 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('active')}
              className={cn(
                "px-3 py-1.5 label rounded-[var(--radius-control)] transition-all cursor-pointer whitespace-nowrap flex items-center gap-2",
                activeTab === 'active' 
                  ? "bg-white text-brand-600 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              )}
            >
              Recent Projects
            </button>
            <button
              onClick={() => { setActiveTab('trash'); setSelectedIds(new Set()); }}
              className={cn(
                "px-3 py-1.5 label rounded-[var(--radius-control)] transition-all cursor-pointer whitespace-nowrap flex items-center gap-2",
                activeTab === 'trash' 
                  ? "bg-white text-slate-900 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <span>Trash</span>
              {trashedProjects.length > 0 && (
                <span className="w-4 h-4 bg-slate-200 text-slate-600 rounded-full text-[8px] flex items-center justify-center shrink-0">
                  {trashedProjects.length}
                </span>
              )}
            </button>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* View Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg mr-2">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  viewMode === 'grid' ? "bg-white text-brand-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  viewMode === 'list' ? "bg-white text-brand-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {activeTab === 'active' ? (
              <button
                onClick={() => {/* View All logic */}}
                className="label text-slate-400 hover:text-brand-600 transition-colors shrink-0"
              >
                View All
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <Button 
                  variant="secondary" 
                  size="micro"
                  className="uppercase tracking-widest"
                  onClick={handleRestoreAll}
                >
                  <RotateCcw className="w-2.5 h-2.5 mr-1" /> Restore
                </Button>
                <Button 
                  variant="secondary" 
                  size="micro"
                  className="uppercase tracking-widest text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  onClick={() => setShowBulkDeleteModal(true)}
                >
                  <Trash className="w-2.5 h-2.5 mr-1" /> Clear
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Selection Toolbar (Floating) */}
        <AnimatePresence>
          {activeTab === 'trash' && selectedIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-slate-900 text-white rounded-[24px] p-4 flex items-center justify-between shadow-2xl shadow-slate-200"
            >
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold ml-2">{selectedIds.size} projects selected</span>
                <div className="w-px h-4 bg-slate-700" />
                <button 
                  onClick={() => setSelectedIds(new Set())}
                  className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Deselect all
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost"
                  size="sm"
                  className="font-bold uppercase tracking-widest hover:bg-slate-800 text-white"
                  onClick={handleBatchRestore}
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-brand-400" /> Restore Selected
                </Button>
                <Button 
                  variant="ghost"
                  size="sm"
                  className="font-bold uppercase tracking-widest hover:bg-rose-900/30 text-rose-400"
                  onClick={handleBatchDelete}
                >
                  <Trash className="w-3.5 h-3.5 mr-1.5" /> Delete Selected
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className={cn(
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[var(--space-gap)]"
            : "flex flex-col gap-3"
        )}>
          {displayProjects.map(project => (
            <Card 
              key={project.id} 
              className={cn(
                "group transition-all p-0 relative overflow-visible",
                viewMode === 'grid' ? "rounded-[32px]" : "rounded-2xl",
                activeTab === 'active' ? "hover:border-brand-300 cursor-pointer" : "cursor-default",
                viewMode === 'list' && "hover:bg-slate-50/50"
              )} 
            >
              {viewMode === 'grid' ? (
                <>
                  {/* Clickable Area for Navigation */}
                  {activeTab === 'active' ? (
                    <div 
                      className="absolute inset-0 z-0" 
                      onClick={() => onSelectProject(project)}
                    />
                  ) : (
                    <div className="absolute top-0 left-0 w-12 h-12 flex items-center justify-center z-20 group-hover:bg-slate-50/50 rounded-tl-2xl transition-colors">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          id={`select-${project.id}`}
                          checked={selectedIds.has(project.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            const next = new Set(selectedIds);
                            if (next.has(project.id)) {
                              next.delete(project.id);
                            } else {
                              next.add(project.id);
                            }
                            setSelectedIds(next);
                          }}
                          className="peer w-5 h-5 rounded-md border-slate-200 text-brand-600 focus:ring-brand-500/20 cursor-pointer pointer-events-auto transition-all bg-white"
                        />
                        <div className="absolute inset-0 pointer-events-none border-2 border-transparent peer-checked:border-brand-600 rounded-md transition-all scale-110 opacity-0 peer-checked:opacity-100" />
                      </div>
                    </div>
                  )}
                  
                  <div className="p-[var(--space-card-p)] space-y-4 relative z-10 pointer-events-none">
                    <div className="flex items-start justify-between pointer-events-auto">
                      <div className={cn("flex-1 min-w-0", activeTab === 'trash' && "pl-10")}>
                        <h3 className="h3 truncate">{project.name}</h3>
                        <div className="flex items-center gap-1.5 caption mt-0.5">
                          <Users className="w-3.5 h-3.5" />
                          <span className="truncate">{project.client || 'Internal Project'}</span>
                        </div>
                      </div>
                      <div className="relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === project.id ? null : project.id);
                          }}
                          className="p-1 hover:bg-slate-100 rounded-md text-slate-400 cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        <AnimatePresence>
                          {openMenuId === project.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, originY: 0, originX: 1 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 py-1 z-50 fixed-inside-flow"
                            >
                              {activeTab === 'active' && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuId(null);
                                      setProjectDetails(project);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-[13px] font-medium text-slate-600 hover:bg-slate-50 hover:text-brand-600 flex items-center transition-colors"
                                  >
                                    <Eye className="w-3.5 h-3.5 mr-2" /> Details
                                  </button>
                                  {onRenameProject && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuId(null);
                                        setProjectToRename({ id: project.id, name: project.name });
                                      }}
                                      className="w-full text-left px-3 py-1.5 text-[13px] font-medium text-slate-600 hover:bg-slate-50 hover:text-brand-600 flex items-center transition-colors cursor-pointer"
                                    >
                                      <Edit className="w-3.5 h-3.5 mr-2" /> Rename
                                    </button>
                                  )}
                                  {onDuplicateProject && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuId(null);
                                        onDuplicateProject(project);
                                      }}
                                      className="w-full text-left px-3 py-1.5 text-[13px] font-medium text-slate-600 hover:bg-slate-50 hover:text-brand-600 flex items-center transition-colors cursor-pointer"
                                    >
                                      <Copy className="w-3.5 h-3.5 mr-2" /> Duplicate
                                    </button>
                                  )}
                                  <div className="h-px bg-slate-100 my-1 mx-2" />
                                  {onDeleteProject && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuId(null);
                                        setProjectToDelete({ id: project.id, name: project.name });
                                      }}
                                      className="w-full text-left px-3 py-1.5 text-[13px] font-medium text-slate-500 hover:bg-slate-50 hover:text-orange-600 flex items-center transition-colors"
                                    >
                                      <Trash className="w-3.5 h-3.5 mr-2" /> Move to Trash
                                    </button>
                                  )}
                                </>
                              )}
                              {activeTab === 'trash' && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuId(null);
                                      onRestoreProject(project.id);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-[13px] font-medium text-slate-600 hover:bg-slate-50 hover:text-brand-600 flex items-center transition-colors"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5 mr-2" /> Restore
                                  </button>
                                  <div className="h-px bg-slate-100 my-1 mx-2" />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuId(null);
                                      setProjectToPermanentDelete({ id: project.id, name: project.name });
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-[13px] font-medium text-rose-600 hover:bg-rose-50 flex items-center transition-colors"
                                  >
                                    <Trash className="w-3.5 h-3.5 mr-2" /> Delete Permanently
                                  </button>
                                </>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between caption mb-1.5">
                        <span>Progress</span>
                        <span className="font-bold text-brand-600">{project.tracking.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500" style={{ width: `${project.tracking.progress}%` }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      {project.selectedTools.map(tool => {
                        const Icon = TOOL_OPTIONS.find(t => t.id === tool)?.icon || Folder;
                        return (
                          <div key={tool} className="text-slate-400">
                            <Icon className="w-4 h-4" />
                          </div>
                        );
                      })}
                    </div>
                      <div className="flex items-center gap-1 caption">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(project.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div 
                  className="flex items-center gap-4 p-3 pr-4 group/list"
                  onClick={() => activeTab === 'active' && onSelectProject(project)}
                >
                  {/* Selection/Icon */}
                  <div className="flex items-center gap-3 shrink-0" onClick={e => e.stopPropagation()}>
                    {activeTab === 'trash' && (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(project.id)}
                        onChange={(e) => {
                          const next = new Set(selectedIds);
                          if (next.has(project.id)) next.delete(project.id);
                          else next.add(project.id);
                          setSelectedIds(next);
                        }}
                        className="w-4 h-4 rounded-md border-slate-200 text-brand-600"
                      />
                    )}
                    <div className={cn(
                      "w-10 h-10 flex items-center justify-center transition-all",
                      activeTab === 'active' ? "text-brand-600 group-hover/list:text-brand-700" : "text-slate-400"
                    )}>
                      <Folder className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex items-center gap-6">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{project.name}</h4>
                      <p className="text-[10px] font-medium text-slate-500 truncate">{project.client || 'Internal Project'}</p>
                    </div>

                    {/* Progress (Desktop) */}
                    <div className="hidden md:flex items-center gap-4 w-48">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500" style={{ width: `${project.tracking.progress}%` }} />
                      </div>
                      <span className="label-xs text-brand-600 w-8 text-right">{project.tracking.progress}%</span>
                    </div>

                    {/* Date (Desktop) */}
                    <div className="hidden lg:flex items-center gap-2 text-slate-400 w-28">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="label-xs">{new Date(project.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === project.id ? null : project.id);
                      }}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    
                    <AnimatePresence>
                      {openMenuId === project.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, originY: 0, originX: 1 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 py-1 z-50 fixed-inside-flow"
                        >
                          {activeTab === 'active' ? (
                            <>
                              <button onClick={() => { setOpenMenuId(null); setProjectDetails(project); }} className="w-full text-left px-3 py-1.5 text-[13px] font-medium text-slate-600 hover:bg-slate-50 flex items-center">
                                <Eye className="w-3.5 h-3.5 mr-2" /> Details
                              </button>
                              <button onClick={() => { setOpenMenuId(null); setProjectToRename({ id: project.id, name: project.name }); }} className="w-full text-left px-3 py-1.5 text-[13px] font-medium text-slate-600 hover:bg-slate-50 flex items-center">
                                <Edit className="w-3.5 h-3.5 mr-2" /> Rename
                              </button>
                              <button onClick={() => { setOpenMenuId(null); onDeleteProject?.(project.id); }} className="w-full text-left px-3 py-1.5 text-[13px] font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600 flex items-center border-t border-slate-50 mt-1 pt-2">
                                <Trash className="w-3.5 h-3.5 mr-2" /> Trash
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => { setOpenMenuId(null); onRestoreProject(project.id); }} className="w-full text-left px-3 py-1.5 text-[13px] font-medium text-slate-600 hover:bg-slate-50 flex items-center">
                                <RotateCcw className="w-3.5 h-3.5 mr-2" /> Restore
                              </button>
                              <button onClick={() => { setOpenMenuId(null); setProjectToPermanentDelete({ id: project.id, name: project.name }); }} className="w-full text-left px-3 py-1.5 text-[13px] font-medium text-rose-600 hover:bg-rose-50 flex items-center border-t border-slate-50 mt-1 pt-2">
                                <Trash className="w-3.5 h-3.5 mr-2" /> Delete
                              </button>
                            </>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </Card>
          ))}

          {displayProjects.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-200">
              <Folder className="w-12 h-12 text-slate-200 mb-4" />
              <p className="text-slate-400 font-medium">
                {activeTab === 'active' ? "No projects yet. Create your first one!" : "Trash is empty."}
              </p>
              {activeTab === 'active' && <Button variant="ghost" size="md" className="mt-4" onClick={() => setShowNewModal(true)}>Get Started</Button>}
            </div>
          )}
        </div>
      </div>

      {/* New Project Modal */}
      <AnimatePresence>
        {showNewModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 sm:p-8 space-y-6 sm:space-y-8 overflow-y-auto flex-1">
                <div className="flex items-center justify-between sticky top-0 bg-white pb-4 z-10">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900">Create New Project</h3>
                  <button onClick={() => setShowNewModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Project Name</label>
                      <Input 
                        placeholder="e.g. Acme Rebrand" 
                        value={newProject.name}
                        onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Client Name</label>
                      <Input 
                        placeholder="e.g. Acme Corp" 
                        value={newProject.client}
                        onChange={e => setNewProject({ ...newProject, client: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Select Tools</label>
                    <div className="grid grid-cols-1 gap-2">
                      {TOOL_OPTIONS.map(tool => (
                        <button
                          key={tool.id}
                          onClick={() => {
                            const tools = newProject.tools.includes(tool.id)
                              ? newProject.tools.filter(t => t !== tool.id)
                              : [...newProject.tools, tool.id];
                            setNewProject({ ...newProject, tools });
                          }}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                            newProject.tools.includes(tool.id)
                              ? "bg-brand-50 border-brand-200 text-brand-700"
                              : "border-slate-100 hover:border-slate-200 text-slate-500"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            newProject.tools.includes(tool.id) ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-400"
                          )}>
                            <tool.icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-bold">{tool.label}</div>
                            <div className="text-[10px] opacity-70">{tool.desc}</div>
                          </div>
                          {newProject.tools.includes(tool.id) && (
                            <CheckCircle2 className="w-4 h-4 ml-auto text-brand-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="secondary" size="md" onClick={() => setShowNewModal(false)}>Cancel</Button>
                  <Button 
                    disabled={!newProject.name || newProject.tools.length === 0}
                    size="md"
                    onClick={() => {
                      onCreateProject(newProject.name, newProject.client, newProject.tools);
                      setShowNewModal(false);
                      setNewProject({ name: '', client: '', tools: ['discovery', 'logo', 'system', 'guide'] });
                    }}
                    className="px-8"
                  >
                    Create Project
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Rename Project Modal */}
      <AnimatePresence>
        {projectToRename && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProjectToRename(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-slate-900">Rename Project</h3>
                  <button onClick={() => setProjectToRename(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Project Name</label>
                  <Input 
                    autoFocus
                    placeholder="Enter short name" 
                    value={projectToRename.name}
                    onChange={e => setProjectToRename({ ...projectToRename, name: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="secondary" size="md" onClick={() => setProjectToRename(null)}>Cancel</Button>
                  <Button 
                    disabled={!projectToRename.name.trim()}
                    size="md"
                    onClick={() => {
                      if (onRenameProject) {
                        onRenameProject(projectToRename.id, projectToRename.name);
                      }
                      setProjectToRename(null);
                    }}
                    className="px-6"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Project Details Modal */}
      <AnimatePresence>
        {projectDetails && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProjectDetails(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 space-y-8">
                {/* Modal Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 shadow-sm border border-brand-100">
                      <Folder className="w-7 h-7" />
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="text-2xl font-bold text-slate-900">{projectDetails.name}</h3>
                      <p className="text-sm font-medium text-slate-500">{projectDetails.client || 'Internal Project'}</p>
                    </div>
                  </div>
                  <button onClick={() => setProjectDetails(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all hover:rotate-90">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-400">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date Created</span>
                        <span className="text-sm font-bold text-slate-700">{new Date(projectDetails.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-400">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Modified</span>
                        <span className="text-sm font-bold text-slate-700">{new Date(projectDetails.tracking.lastUpdated).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Creator</span>
                        <span className="text-sm font-bold text-slate-700">{userName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-400">
                        <HardDrive className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resource Size</span>
                        <span className="text-sm font-bold text-slate-700">{calculateProjectWeight(projectDetails)} MB</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scope Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Shield className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">Project Scope & Capabilities</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {projectDetails.selectedTools.map(toolId => {
                      const tool = TOOL_OPTIONS.find(t => t.id === toolId);
                      if (!tool) return null;
                      const ToolIcon = tool.icon;
                      return (
                        <div key={toolId} className="px-3 py-2 bg-slate-100 rounded-xl flex items-center gap-2 border border-slate-200/50">
                          <ToolIcon className="w-3.5 h-3.5 text-brand-600" />
                          <span className="text-xs font-bold text-slate-700">{tool.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-widest">Current Progress</span>
                    </div>
                    <span className="text-sm font-black text-brand-600">{projectDetails.tracking.progress}%</span>
                  </div>
                  <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 p-1">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${projectDetails.tracking.progress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full shadow-[0_0_10px_rgba(var(--brand-500-rgb),0.3)]" 
                    />
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button variant="secondary" size="md" onClick={() => setProjectDetails(null)} className="px-6 font-bold">Close Details</Button>
                  <Button 
                    size="md" 
                    onClick={() => {
                      setProjectDetails(null);
                      onSelectProject(projectDetails);
                    }} 
                    className="px-8 font-bold"
                  >
                    Open Workspace
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Delete Project Modal */}
      <AnimatePresence>
        {projectToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProjectToDelete(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-2">
                  <Trash className="w-6 h-6" />
                </div>
                
                <h3 className="text-xl font-bold text-slate-900">Move to Trash?</h3>
                <p className="text-sm text-slate-500 pb-4">
                  Are you sure you want to move <strong className="text-slate-700">{projectToDelete.name}</strong> to the Trash? You can restore it later.
                </p>

                <div className="flex w-full gap-3">
                  <Button variant="secondary" size="md" className="flex-1" onClick={() => setProjectToDelete(null)}>Cancel</Button>
                  <Button 
                    size="md"
                    className="flex-1 bg-amber-600 hover:bg-amber-700 focus:ring-amber-200"
                    onClick={() => {
                      if (onDeleteProject) {
                        onDeleteProject(projectToDelete.id);
                      }
                      setProjectToDelete(null);
                    }}
                  >
                    Move to Trash
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Permanent Delete Modal */}
      <AnimatePresence>
        {projectToPermanentDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProjectToPermanentDelete(null)}
              className="absolute inset-0 bg-red-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-red-100"
            >
              <div className="p-8 flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-2">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                
                <h3 className="text-xl font-bold text-slate-900">Permanent Delete?</h3>
                <p className="text-sm text-slate-500 pb-4">
                  This will permanently delete <strong className="text-slate-700">{projectToPermanentDelete.name}</strong> and all its associated data. This action is irreversible.
                </p>

                <div className="flex w-full gap-3">
                  <Button variant="secondary" size="md" className="flex-1" onClick={() => setProjectToPermanentDelete(null)}>Cancel</Button>
                  <Button 
                    size="md"
                    className="flex-1 bg-red-600 hover:bg-red-700 focus:ring-red-200"
                    onClick={() => {
                      onPermanentDeleteProject(projectToPermanentDelete.id);
                      setProjectToPermanentDelete(null);
                    }}
                  >
                    Delete Forever
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Bulk Delete Confirm Modal */}
      <AnimatePresence>
        {showBulkDeleteModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBulkDeleteModal(false)}
              className="absolute inset-0 bg-red-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-red-50"
            >
              <div className="p-8 flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-2">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                
                <h3 className="text-xl font-bold text-slate-900">
                  {selectedIds.size > 0 ? `Delete ${selectedIds.size} projects?` : "Delete All Forever?"}
                </h3>
                <p className="text-sm text-slate-500 pb-4 text-pretty">
                  This will PERMANENTLY remove {selectedIds.size > 0 ? 'the selected' : 'ALL trashed'} projects and their associated data. This action cannot be reversed.
                </p>

                <div className="flex w-full gap-3">
                  <Button variant="secondary" className="flex-1" onClick={() => setShowBulkDeleteModal(false)}>Cancel</Button>
                  <Button 
                    className="flex-1 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-100"
                    onClick={async () => {
                      if (selectedIds.size > 0) {
                        await handleBatchDelete();
                      } else {
                        for (const p of trashedProjects) {
                          await onPermanentDeleteProject(p.id);
                        }
                        addNotification({
                          title: 'Trash Emptied',
                          type: 'info',
                          message: `Permanently deleted ${trashedProjects.length} items from the trash.`
                        });
                      }
                      setShowBulkDeleteModal(false);
                    }}
                  >
                    Delete Forever
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
