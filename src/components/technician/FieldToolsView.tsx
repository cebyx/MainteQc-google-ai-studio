import React from 'react';
import { useApp } from '../../AppContext';
import { 
  Zap, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  ChevronRight,
  Play,
  Square,
  Pause,
  ClipboardCheck,
  Wrench
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';
import { format } from 'date-fns';

export const FieldToolsView: React.FC = () => {
  const { 
    workSessions, 
    tickets, 
    startWorkSession, 
    stopWorkSession,
    currentUser,
    ticketChecklists
  } = useApp();

  const activeSession = workSessions.find(s => s.technicianId === currentUser.id && s.status === 'active');
  const activeTicket = activeSession ? tickets.find(t => t.id === activeSession.ticketId) : null;

  const pendingChecklists = ticketChecklists.filter(c => 
    c.status !== 'completed' && 
    tickets.find(t => t.id === c.ticketId && t.assignedTechnicianId === currentUser.id)
  );

  return (
    <div className="space-y-6">
      {/* Active Session Status */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center",
              activeSession ? "bg-green-100 text-green-600 animate-pulse" : "bg-gray-100 text-gray-400"
            )}>
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Command Center</h2>
              <p className="text-sm text-gray-500">
                {activeSession ? `Active: ${activeSession.sessionType === 'travel' ? 'On Route' : 'On Site'}` : 'No active session'}
              </p>
            </div>
          </div>
          {activeSession && (
            <div className="text-right">
              <div className="text-2xl font-mono font-bold text-blue-600">
                {format(new Date(), 'HH:mm:ss')}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wider font-bold">Current Time</div>
            </div>
          )}
        </div>

        {activeSession ? (
          <div className="p-6 bg-blue-50/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Current Job</span>
                  <span className="h-1 w-1 rounded-full bg-blue-300"></span>
                  <span className="text-xs text-gray-500">#{activeTicket?.id.slice(-6)}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{activeTicket?.title}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    {activeTicket?.serviceAddress}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-gray-400" />
                    Started {format(new Date(activeSession.startTime), 'h:mm a')}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => stopWorkSession(activeSession.id)}
                  className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-100"
                >
                  <Square className="h-5 w-5 fill-current" />
                  Stop Session
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Play className="h-8 w-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Ready to start?</h3>
            <p className="text-gray-500 max-w-xs mx-auto mb-6">Start a travel or onsite session from your job list to track your progress.</p>
            <button className="text-blue-600 font-bold hover:underline">View My Jobs</button>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Checklists */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="h-5 w-5 text-blue-600" />
              <h2 className="font-bold text-gray-900">Active Checklists</h2>
            </div>
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">
              {pendingChecklists.length} Pending
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingChecklists.length > 0 ? (
              pendingChecklists.map(checklist => {
                const ticket = tickets.find(t => t.id === checklist.ticketId);
                const completedCount = checklist.items.filter(i => i.completed).length;
                const progress = (completedCount / checklist.items.length) * 100;

                return (
                  <div key={checklist.id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {checklist.title || 'Job Checklist'}
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-600 transition-all" />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                      <span className="font-medium text-gray-700">Ticket:</span> {ticket?.title}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold text-gray-400">
                        <span>Progress</span>
                        <span>{completedCount}/{checklist.items.length} Items</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          className="h-full bg-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-gray-500 italic text-sm">
                No active checklists for your current jobs.
              </div>
            )}
          </div>
        </section>

        {/* Quick Tools */}
        <section className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-3">
              <Wrench className="h-5 w-5 text-blue-600" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-gray-700">Report Issue</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                  <MapPin className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-gray-700">Find Nearby</span>
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg shadow-blue-100 p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold">Safety First</h3>
                <p className="text-xs text-blue-100">Always wear proper PPE on site.</p>
              </div>
            </div>
            <button className="w-full bg-white text-blue-600 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors">
              Review Safety Protocols
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
