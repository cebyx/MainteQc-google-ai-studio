import React, { useState, useMemo } from 'react';
import { useApp } from '../../AppContext';
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Wrench, 
  Zap, 
  X,
  Trash2,
  ChevronRight,
  Filter,
  MoreVertical,
  Info,
  Calendar,
  ClipboardList,
  Package
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { AppNotification } from '../../types';

export const NotificationCenterView: React.FC<{ setActiveTab: (tab: string) => void }> = ({ setActiveTab }) => {
  const { 
    notifications, 
    markNotificationRead, 
    dismissNotification 
  } = useApp();
  
  const [filter, setFilter] = useState<'all' | 'unread' | 'billing' | 'schedule' | 'inventory'>('all');

  const filteredNotifications = useMemo(() => {
    let filtered = notifications;
    if (filter === 'unread') filtered = notifications.filter(n => n.status === 'unread');
    else if (filter === 'billing') filtered = notifications.filter(n => n.type === 'billing');
    else if (filter === 'schedule') filtered = notifications.filter(n => n.type === 'schedule');
    else if (filter === 'inventory') filtered = notifications.filter(n => n.type === 'stock' || n.type === 'parts');
    
    // Sort by date descending
    return [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notifications, filter]);

  const typeIcons = {
    billing: FileText,
    schedule: Calendar,
    dispatch: ClipboardList,
    inventory: Package,
    maintenance: Wrench,
    system: Zap,
    message: Bell
  };

  const typeColors = {
    billing: 'text-green-600 bg-green-50',
    schedule: 'text-blue-600 bg-blue-50',
    dispatch: 'text-purple-600 bg-purple-50',
    inventory: 'text-orange-600 bg-orange-50',
    maintenance: 'text-amber-600 bg-amber-50',
    system: 'text-red-600 bg-red-50',
    message: 'text-cyan-600 bg-cyan-50'
  };

  const priorityColors = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-red-100 text-red-700'
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Bell className="h-7 w-7 text-blue-600" />
            Notification Center
          </h2>
          <p className="text-gray-500">Stay updated with billing, scheduling, and system alerts.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => notifications.filter(n => n.status === 'unread').forEach(n => markNotificationRead(n.id))}
            className="px-4 py-2 bg-white text-gray-600 border border-gray-200 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all"
          >
            Mark all as read
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <button 
          onClick={() => setFilter('all')}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-bold transition-all",
            filter === 'all' ? "bg-gray-900 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          )}
        >
          All
        </button>
        <button 
          onClick={() => setFilter('unread')}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-bold transition-all",
            filter === 'unread' ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          )}
        >
          Unread ({notifications.filter(n => n.status === 'unread').length})
        </button>
        <button 
          onClick={() => setFilter('billing')}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-bold transition-all",
            filter === 'billing' ? "bg-green-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          )}
        >
          Billing
        </button>
        <button 
          onClick={() => setFilter('schedule')}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-bold transition-all",
            filter === 'schedule' ? "bg-purple-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          )}
        >
          Schedule
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <Bell className="h-16 w-16 text-gray-100 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900">All caught up!</h3>
              <p className="text-gray-500">No notifications found for this filter.</p>
            </div>
          ) : (
            filteredNotifications.map((notification, i) => {
              const Icon = typeIcons[notification.type as keyof typeof typeIcons] || Info;
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "group relative flex items-start gap-4 p-5 rounded-2xl border transition-all",
                    notification.status === 'unread' 
                      ? "bg-white border-blue-200 shadow-md shadow-blue-50" 
                      : "bg-gray-50/50 border-gray-100 opacity-75"
                  )}
                >
                  {notification.status === 'unread' && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-blue-600 rounded-r-full" />
                  )}
                  
                  <div className={cn("p-3 rounded-xl shrink-0", typeColors[notification.type as keyof typeof typeColors])}>
                    <Icon className="h-6 w-6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900 truncate">{notification.title}</h4>
                        <span className={cn("text-[10px] font-black uppercase px-2 py-0.5 rounded", priorityColors[notification.priority])}>
                          {notification.priority}
                        </span>
                      </div>
                      <span className="text-[10px] font-medium text-gray-400">
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{notification.message}</p>
                    
                    <div className="flex items-center gap-3 mt-4">
                      {notification.link && (
                        <button 
                          onClick={() => {
                            if (notification.status === 'unread') markNotificationRead(notification.id);
                            // Map link to tab
                            const tab = notification.link.replace('/', '') || 'dashboard';
                            setActiveTab(tab);
                          }}
                          className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                        >
                          View Details
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      )}
                      {notification.status === 'unread' && (
                        <button 
                          onClick={() => markNotificationRead(notification.id)}
                          className="text-xs font-bold text-gray-500 hover:text-gray-700"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => dismissNotification(notification.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Dismiss"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
