import React, { useState, useMemo } from 'react';
import { useApp } from '../../AppContext';
import { 
  Sparkles, 
  Zap, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  Package, 
  MapPin, 
  MessageSquare, 
  Bot,
  X,
  Play,
  ClipboardList
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export const TechnicianAssistantPanel: React.FC = () => {
  const { 
    role, 
    currentUser, 
    tickets, 
    partsRequests, 
    inventoryItems, 
    technicianStock 
  } = useApp();
  
  const [isOpen, setIsOpen] = useState(false);

  const technicianJobs = useMemo(() => {
    return tickets.filter(t => t.assignedTechnicianId === currentUser?.id && t.status !== 'completed');
  }, [tickets, currentUser]);

  const pendingParts = useMemo(() => {
    return partsRequests.filter(r => r.technicianId === currentUser?.id && r.status !== 'fulfilled');
  }, [partsRequests, currentUser]);

  const insights = useMemo(() => {
    const list = [];
    
    // 1. Next job
    const nextJob = technicianJobs.find(t => t.status === 'scheduled');
    if (nextJob) {
      list.push({
        type: 'next-job',
        title: 'Next Stop',
        message: `Your next job is at ${nextJob.serviceAddress}. Scheduled for today.`,
        icon: MapPin,
        color: 'text-blue-600',
        bg: 'bg-blue-50'
      });
    }

    // 2. Low stock
    const lowStock = technicianStock.filter(s => {
      const item = inventoryItems.find(i => i.id === s.itemId);
      // Use a default threshold if minQuantity is missing
      return s.quantity < 5;
    });
    if (lowStock.length > 0) {
      list.push({
        type: 'low-stock',
        title: 'Low Stock Alert',
        message: `You are low on ${lowStock.length} items in your truck. Consider restocking.`,
        icon: Package,
        color: 'text-amber-600',
        bg: 'bg-amber-50'
      });
    }

    // 3. Parts ready
    const readyParts = partsRequests.filter(r => r.technicianId === currentUser?.id && r.status === 'received');
    if (readyParts.length > 0) {
      list.push({
        type: 'parts-ready',
        title: 'Parts Ready',
        message: `${readyParts.length} parts requests are ready for pickup at the warehouse.`,
        icon: Zap,
        color: 'text-green-600',
        bg: 'bg-green-50'
      });
    }

    return list;
  }, [technicianJobs, technicianStock, inventoryItems, partsRequests, currentUser]);

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-blue-600 text-white shadow-2xl shadow-blue-300 flex items-center justify-center hover:bg-blue-700 transition-all z-40 group"
      >
        <Bot className="h-7 w-7 group-hover:scale-110 transition-transform" />
        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 border-2 border-white text-[10px] font-black flex items-center justify-center">
          {insights.length}
        </span>
      </button>

      {/* Assistant Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black">Field Assistant</h3>
                    <p className="text-xs text-blue-100 font-medium tracking-wide uppercase">AI Powered Insights</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Insights Section */}
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">Recommended Actions</h4>
                  {insights.length === 0 ? (
                    <div className="text-center py-10">
                      <CheckCircle2 className="h-12 w-12 text-green-100 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">You're all set! No urgent actions needed.</p>
                    </div>
                  ) : (
                    insights.map((insight, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all group"
                      >
                        <div className="flex items-start gap-4">
                          <div className={cn("p-3 rounded-xl shrink-0", insight.bg)}>
                            <insight.icon className={cn("h-6 w-6", insight.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-gray-900">{insight.title}</h5>
                            <p className="text-sm text-gray-600 mt-1">{insight.message}</p>
                            <button className="mt-3 text-xs font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                              Take Action
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="text-2xl font-black text-gray-900">{technicianJobs.length}</div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Open Jobs</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="text-2xl font-black text-gray-900">{pendingParts.length}</div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending Parts</div>
                  </div>
                </div>

                {/* Ask AI Input */}
                <div className="space-y-4 pt-6 border-t border-gray-100">
                  <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">Ask Assistant</h4>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="e.g. 'What parts do I need for my next job?'" 
                      className="w-full pl-4 pr-12 py-3 rounded-xl border-gray-200 bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium text-sm"
                    />
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <Play className="h-4 w-4 fill-current" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-[10px] font-bold hover:bg-gray-200 transition-colors">
                      Checklist items left?
                    </button>
                    <button className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-[10px] font-bold hover:bg-gray-200 transition-colors">
                      Last service notes?
                    </button>
                    <button className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-[10px] font-bold hover:bg-gray-200 transition-colors">
                      Job location?
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-3 text-gray-400">
                  <Bot className="h-5 w-5" />
                  <span className="text-xs font-medium italic">Grounded in your job data and inventory.</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
