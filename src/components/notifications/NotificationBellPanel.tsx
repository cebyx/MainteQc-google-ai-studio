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
  ChevronRight,
  Info,
  Calendar,
  ClipboardList,
  Package,
  MoreVertical
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export const NotificationBellPanel: React.FC<{ setActiveTab: (tab: string) => void }> = ({ setActiveTab }) => {
  const { 
    notifications, 
    markNotificationRead, 
    dismissNotification 
  } = useApp();
  
  const [isOpen, setIsOpen] = useState(false);

  const unreadNotifications = useMemo(() => {
    return notifications.filter(n => n.status === 'unread').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notifications]);

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

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-all"
      >
        <Bell className="h-5 w-5" />
        {unreadNotifications.length > 0 && (
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 border border-white animate-pulse"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="font-black text-gray-900">Notifications</h3>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase">
                    {unreadNotifications.length} New
                  </span>
                  <button 
                    onClick={() => {
                      setActiveTab('notifications');
                      setIsOpen(false);
                    }}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    View All
                  </button>
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-50">
                {unreadNotifications.length === 0 ? (
                  <div className="p-12 text-center">
                    <Bell className="h-12 w-12 text-gray-100 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-400">No new notifications</p>
                  </div>
                ) : (
                  unreadNotifications.map((notification) => {
                    const Icon = typeIcons[notification.type as keyof typeof typeIcons] || Info;
                    return (
                      <div 
                        key={notification.id} 
                        className="p-4 hover:bg-gray-50 transition-all group relative"
                      >
                        <div className="flex gap-3">
                          <div className={cn("p-2 rounded-lg shrink-0 h-10 w-10 flex items-center justify-center", typeColors[notification.type as keyof typeof typeIcons])}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <h4 className="text-sm font-bold text-gray-900 truncate">{notification.title}</h4>
                              <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap ml-2">
                                {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{notification.message}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <button 
                                onClick={() => {
                                  markNotificationRead(notification.id);
                                  if (notification.link) {
                                    const tab = notification.link.replace('/', '') || 'dashboard';
                                    setActiveTab(tab);
                                  }
                                  setIsOpen(false);
                                }}
                                className="text-[10px] font-black text-blue-600 uppercase tracking-wider hover:underline"
                              >
                                View
                              </button>
                              <button 
                                onClick={() => markNotificationRead(notification.id)}
                                className="text-[10px] font-black text-gray-400 uppercase tracking-wider hover:text-gray-600"
                              >
                                Mark as read
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {unreadNotifications.length > 0 && (
                <div className="p-3 border-t border-gray-100 bg-gray-50/50 text-center">
                  <button 
                    onClick={() => {
                      unreadNotifications.forEach(n => markNotificationRead(n.id));
                      setIsOpen(false);
                    }}
                    className="text-xs font-bold text-gray-500 hover:text-gray-700"
                  >
                    Mark all as read
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
