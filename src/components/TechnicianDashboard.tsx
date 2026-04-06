import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { 
  Calendar, 
  MapPin, 
  Phone, 
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  History,
  Navigation,
  Zap,
  Package,
  ClipboardCheck,
  Play,
  Square
} from 'lucide-react';
import { StatusBadge, UrgencyBadge } from './Badges';
import { cn, formatDate } from '../lib/utils';
import { TicketDetail } from './TicketDetail';
import { Ticket, ActivityEvent, Message, WorkSession } from '../types';
import { motion } from 'motion/react';

export const TechnicianDashboard: React.FC = () => {
  const { 
    tickets, 
    currentUser, 
    activities, 
    messages, 
    updateTicket, 
    workSessions, 
    startWorkSession, 
    stopWorkSession,
    ticketChecklists
  } = useApp();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Filter jobs assigned to this technician
  const myJobs = tickets.filter(t => t.assignedTechnicianId === currentUser.id);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayJobs = myJobs.filter(t => t.scheduledDate === todayStr && t.status !== 'completed');
  const completedToday = myJobs.filter(t => t.scheduledDate === todayStr && t.status === 'completed').length;
  
  // Active session from AppContext
  const activeSession = workSessions.find(s => s.technicianId === currentUser.id && s.status === 'active');
  const activeJob = activeSession ? tickets.find(t => t.id === activeSession.ticketId) : null;
  
  // Next job (first job today that isn't active or completed)
  const nextJob = todayJobs.find(j => j.id !== activeJob?.id && j.status !== 'completed');

  // Pending Checklists
  const pendingChecklists = ticketChecklists.filter(c => 
    c.status !== 'completed' && 
    myJobs.some(t => t.id === c.ticketId)
  );
  const myActivities = activities
    .filter(a => myJobs.some(t => t.id === a.ticketId))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  // Recent Messages
  const myMessages = messages
    .filter(m => m.senderId === currentUser.id || m.recipientId === currentUser.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6 pb-20">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-blue-600 p-5 text-white shadow-lg shadow-blue-200">
          <div className="flex items-center justify-between">
            <Calendar className="h-6 w-6 opacity-80" />
            <span className="text-xs font-bold uppercase tracking-widest opacity-80">Today</span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black">{todayJobs.length}</div>
            <div className="text-xs font-medium opacity-90">Remaining Jobs</div>
          </div>
        </div>
        <div className="rounded-2xl bg-emerald-600 p-5 text-white shadow-lg shadow-emerald-200">
          <div className="flex items-center justify-between">
            <CheckCircle2 className="h-6 w-6 opacity-80" />
            <span className="text-xs font-bold uppercase tracking-widest opacity-80">Done</span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black">{completedToday}</div>
            <div className="text-xs font-medium opacity-90">Completed Today</div>
          </div>
        </div>
      </div>

      {/* Active Job Focus */}
      {activeSession && activeJob ? (
        <div className="relative overflow-hidden rounded-3xl bg-indigo-900 p-6 text-white shadow-xl">
          <div className="relative z-10">
            <div className="mb-4 flex items-center justify-between">
              <span className="flex items-center gap-1.5 rounded-full bg-indigo-500/30 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-100 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400"></span>
                {activeSession.sessionType === 'travel' ? 'Currently Traveling' : 'Currently On Site'}
              </span>
              <UrgencyBadge urgency={activeJob.urgency} />
            </div>
            <h2 className="text-xl font-bold">{activeJob.title}</h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-indigo-400" />
                <div className="text-sm">
                  <div className="font-bold">{activeJob.propertyNickname}</div>
                  <div className="text-indigo-200/70">{activeJob.serviceAddress}</div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button 
                onClick={() => setSelectedTicket(activeJob)}
                className="flex-1 rounded-xl bg-white py-3 text-sm font-bold text-indigo-900 shadow-lg transition-transform active:scale-95"
              >
                View Job Details
              </button>
              <button 
                onClick={() => stopWorkSession(activeSession.id)}
                className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-bold text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Square className="h-4 w-4 fill-current" />
                Stop Session
              </button>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeJob.serviceAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-800 text-white transition-colors hover:bg-indigo-700"
              >
                <Navigation className="h-5 w-5" />
              </a>
            </div>
          </div>
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl"></div>
        </div>
      ) : nextJob ? (
        <div className="rounded-3xl bg-white p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Navigation className="h-5 w-5 text-blue-600" />
              Next Stop
            </h3>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
              Scheduled: {nextJob.scheduledTime}
            </span>
          </div>
          <div className="flex items-start gap-4 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <div className="font-bold text-gray-900">{nextJob.title}</div>
              <div className="text-sm text-gray-500">{nextJob.serviceAddress}</div>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => startWorkSession(nextJob.id, 'travel')}
              className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
            >
              <Play className="h-4 w-4 fill-current" />
              Start Travel
            </button>
            <button 
              onClick={() => setSelectedTicket(nextJob)}
              className="px-6 border border-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors"
            >
              Details
            </button>
          </div>
        </div>
      ) : null}

      {/* Quick Tools Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center gap-2 hover:bg-blue-50 transition-colors group">
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Zap className="h-5 w-5" />
          </div>
          <span className="text-xs font-bold text-gray-700">Field Tools</span>
        </button>
        <button className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center gap-2 hover:bg-blue-50 transition-colors group">
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Package className="h-5 w-5" />
          </div>
          <span className="text-xs font-bold text-gray-700">Inventory</span>
        </button>
        <button className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center gap-2 hover:bg-blue-50 transition-colors group">
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <span className="text-xs font-bold text-gray-700">Checklists</span>
          {pendingChecklists.length > 0 && (
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500"></span>
          )}
        </button>
        <button className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center gap-2 hover:bg-blue-50 transition-colors group">
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Clock className="h-5 w-5" />
          </div>
          <span className="text-xs font-bold text-gray-700">Time Log</span>
        </button>
      </div>

      {/* Today's Jobs */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Today's Schedule
          </h3>
          
          <div className="space-y-4">
            {todayJobs.filter(j => j.id !== activeJob?.id).length > 0 ? (
              todayJobs.filter(j => j.id !== activeJob?.id).map((job) => (
                <div key={job.id} className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm active:scale-[0.98] transition-all">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UrgencyBadge urgency={job.urgency} />
                      <StatusBadge status={job.status} />
                    </div>
                    <div className="text-sm font-bold text-blue-600">{job.scheduledTime}</div>
                  </div>

                  <h4 className="text-lg font-bold text-gray-900 leading-tight mb-1">{job.title}</h4>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{job.description}</p>

                  <div className="space-y-2 border-t border-gray-50 pt-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                      <div className="text-sm">
                        <div className="font-bold text-gray-900">{job.propertyNickname}</div>
                        <div className="text-gray-500 leading-tight">{job.serviceAddress}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button onClick={() => setSelectedTicket(job)} className="flex-1 rounded-xl bg-white border border-gray-200 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all">
                      View Details
                    </button>
                    {!activeJob && (
                      <button 
                        onClick={() => updateTicket(job.id, { status: 'in_progress' })}
                        className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-md shadow-blue-100 active:scale-95 transition-all"
                      >
                        Start Job
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : !activeJob ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
                <div className="mb-3 rounded-full bg-gray-100 p-4">
                  <CheckCircle2 className="h-8 w-8 text-gray-400" />
                </div>
                <h4 className="font-bold text-gray-900">All caught up!</h4>
                <p className="text-sm text-gray-500">No more jobs scheduled for today.</p>
              </div>
            ) : todayJobs.length === 1 ? (
              <div className="rounded-2xl bg-gray-50 p-6 text-center text-sm text-gray-500">
                You are currently working on your only scheduled job for today.
              </div>
            ) : null}
          </div>

          {/* Recent Activity */}
          <div className="pt-4">
            <h3 className="mb-4 text-lg font-bold text-gray-900 flex items-center gap-2">
              <History className="h-5 w-5 text-blue-600" />
              Recent Activity
            </h3>
            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
              {myActivities.length > 0 ? (
                myActivities.map((activity, idx) => (
                  <div key={activity.id} className={cn(
                    "flex items-start gap-3 p-4",
                    idx !== myActivities.length - 1 && "border-b border-gray-50"
                  )}>
                    <div className="mt-1 rounded-full bg-blue-50 p-1.5 text-blue-600">
                      <CheckCircle2 className="h-3 w-3" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{activity.description}</div>
                      <div className="text-[10px] text-gray-400">{formatDate(activity.timestamp)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-sm text-gray-400">No recent activity.</div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Messages */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                Messages
              </h3>
            </div>
            <div className="space-y-3">
              {myMessages.length > 0 ? (
                myMessages.map(msg => (
                  <div key={msg.id} className="rounded-xl bg-gray-50 p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{msg.senderRole}</span>
                      <span className="text-[10px] text-gray-400">{formatDate(msg.timestamp)}</span>
                    </div>
                    <p className="text-xs text-gray-700 line-clamp-2">{msg.text}</p>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-gray-400">No recent messages.</div>
              )}
            </div>
          </div>

          {/* Upcoming */}
          <div className="rounded-2xl bg-gray-900 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Upcoming Jobs</h3>
            </div>
            <div className="space-y-4">
              {myJobs.filter(t => t.scheduledDate !== todayStr && t.status !== 'completed').slice(0, 3).map(job => (
                <div key={job.id} onClick={() => setSelectedTicket(job)} className="flex items-center justify-between border-b border-white/10 pb-4 last:border-0 last:pb-0 cursor-pointer hover:bg-white/5 p-2 -mx-2 rounded-lg transition-colors">
                  <div>
                    <div className="text-sm font-bold">{job.title}</div>
                    <div className="text-xs text-gray-400">{formatDate(job.scheduledDate || '')} • {job.scheduledTime}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                </div>
              ))}
              {myJobs.filter(t => t.scheduledDate !== todayStr && t.status !== 'completed').length === 0 && (
                <div className="text-xs text-gray-500 italic">No upcoming jobs.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedTicket && (
        <TicketDetail ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
      )}
    </div>
  );
};
