import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  CheckCircle2, 
  Info, 
  AlertTriangle, 
  XCircle, 
  Trash2,
  Check,
  Clock
} from 'lucide-react';
import { cn } from '../lib/utils';
import { AppNotification } from '../types';

interface Props {
  notifications: AppNotification[];
  isOpen: boolean;
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
}

export const NotificationPopover = ({
  notifications,
  isOpen,
  onClose,
  onMarkRead,
  onMarkAllRead,
  onClearAll
}: Props) => {
  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-rose-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute right-8 top-16 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[70] overflow-hidden flex flex-col max-h-[500px]"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-brand-600 text-white text-[10px] font-black rounded-md">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={onMarkAllRead}
                  className="p-1.5 hover:bg-white rounded-md text-slate-400 hover:text-brand-600 transition-all"
                  title="Mark all as read"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button 
                  onClick={onClearAll}
                  className="p-1.5 hover:bg-white rounded-md text-slate-400 hover:text-rose-600 transition-all"
                  title="Clear all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {notifications.sort((a,b) => b.timestamp - a.timestamp).map((n) => (
                    <motion.div 
                      key={n.id}
                      initial={{ backgroundColor: n.read ? 'transparent' : '#f8fafc' }}
                      animate={{ backgroundColor: n.read ? 'transparent' : '#f8fafc' }}
                      className={cn(
                        "p-4 group flex gap-3 cursor-pointer hover:bg-slate-50 transition-colors",
                        !n.read && "bg-slate-50/80"
                      )}
                      onClick={() => onMarkRead(n.id)}
                    >
                      <div className="shrink-0 mt-0.5">{getIcon(n.type)}</div>
                      <div className="space-y-1 pr-4 relative">
                        <div className="text-xs font-bold text-slate-900 leading-tight">{n.title}</div>
                        <div className="text-[11px] text-slate-500 leading-relaxed font-medium line-clamp-2">{n.message}</div>
                        <div className="flex items-center gap-1 label-xs text-slate-400 pt-1">
                          <Clock className="w-3 h-3" />
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {!n.read && (
                          <div className="absolute top-0 -right-2 w-1.5 h-1.5 bg-brand-600 rounded-full" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center space-y-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                    <Bell className="w-6 h-6 text-slate-300" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-900">All caught up!</p>
                    <p className="text-[10px] text-slate-400 font-medium italic">No new notifications at this time.</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
