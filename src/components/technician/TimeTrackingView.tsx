import React, { useState } from 'react';
import { useApp } from '../../AppContext';
import { 
  Clock, 
  Calendar, 
  Filter, 
  ChevronRight, 
  Play, 
  Square, 
  Pause, 
  MapPin, 
  Zap,
  History,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  BarChart3
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, subDays } from 'date-fns';

export const TimeTrackingView: React.FC = () => {
  const { 
    workSessions, 
    tickets, 
    currentUser,
    startWorkSession,
    stopWorkSession
  } = useApp();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');

  const mySessions = workSessions.filter(s => s.technicianId === currentUser.id);
  const activeSession = mySessions.find(s => s.status === 'active');

  const dailySessions = mySessions.filter(s => isSameDay(new Date(s.startTime), selectedDate));
  const totalMinutesToday = dailySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

  const weekStart = startOfWeek(new Date());
  const weekEnd = endOfWeek(new Date());
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const weeklyStats = daysInWeek.map(day => {
    const daySessions = mySessions.filter(s => isSameDay(new Date(s.startTime), day));
    return {
      day: format(day, 'EEE'),
      date: format(day, 'MMM d'),
      minutes: daySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0),
      isToday: isSameDay(day, new Date())
    };
  });

  const totalWeeklyMinutes = weeklyStats.reduce((acc, s) => acc + s.minutes, 0);

  return (
    <div className="space-y-6">
      {/* Active Session Card */}
      {activeSession && (
        <section className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg shadow-blue-100 p-6 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Clock className="h-32 w-32" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-100">Live Session</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-black mb-1">
                  {activeSession.sessionType === 'travel' ? 'On Route to Job' : 'On Site Working'}
                </h2>
                <div className="flex items-center gap-4 text-sm text-blue-100">
                  <div className="flex items-center gap-1.5">
                    <Zap className="h-4 w-4" />
                    {tickets.find(t => t.id === activeSession.ticketId)?.title}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    Started {format(new Date(activeSession.startTime), 'h:mm a')}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => stopWorkSession(activeSession.id)}
                className="bg-white text-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg shadow-blue-900/20 flex items-center gap-2"
              >
                <Square className="h-5 w-5 fill-current" />
                Stop Timer
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Today's Time</div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-black text-gray-900">{Math.floor(totalMinutesToday / 60)}h {totalMinutesToday % 60}m</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Weekly Total</div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-black text-blue-600">{Math.floor(totalWeeklyMinutes / 60)}h {totalWeeklyMinutes % 60}m</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Avg. Job Time</div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-black text-gray-900">1h 45m</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Efficiency</div>
          <div className="flex items-baseline gap-2 text-green-600">
            <div className="text-3xl font-black">94%</div>
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* History / Log */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History className="h-5 w-5 text-blue-600" />
                <h2 className="font-bold text-gray-900">Session History</h2>
              </div>
              <div className="flex p-1 bg-gray-100 rounded-xl">
                <button
                  onClick={() => setActiveTab('daily')}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                    activeTab === 'daily' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  Daily
                </button>
                <button
                  onClick={() => setActiveTab('weekly')}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                    activeTab === 'weekly' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  Weekly
                </button>
              </div>
            </div>

            <div className="divide-y divide-gray-50">
              {dailySessions.length > 0 ? (
                dailySessions.map(session => {
                  const ticket = tickets.find(t => t.id === session.ticketId);
                  return (
                    <div key={session.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center",
                          session.sessionType === 'travel' ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"
                        )}>
                          {session.sessionType === 'travel' ? <MapPin className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{ticket?.title || 'Unknown Job'}</div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(session.startTime), 'h:mm a')} - {session.endTime ? format(new Date(session.endTime), 'h:mm a') : 'Active'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-gray-900">
                          {session.durationMinutes ? `${Math.floor(session.durationMinutes / 60)}h ${session.durationMinutes % 60}m` : '--'}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                          {session.sessionType}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center text-gray-500 italic text-sm">
                  No sessions recorded for this day.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Weekly Chart / Summary */}
        <div className="space-y-6">
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-6 flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Weekly Overview
            </h2>
            <div className="space-y-4">
              {weeklyStats.map((stat, idx) => {
                const maxMinutes = 480; // 8 hours
                const percentage = Math.min((stat.minutes / maxMinutes) * 100, 100);

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className={cn("font-bold", stat.isToday ? "text-blue-600" : "text-gray-500")}>
                        {stat.day} ({stat.date})
                      </span>
                      <span className="text-gray-900 font-mono font-bold">
                        {Math.floor(stat.minutes / 60)}h {stat.minutes % 60}m
                      </span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        className={cn(
                          "h-full rounded-full",
                          stat.isToday ? "bg-blue-600" : "bg-blue-400"
                        )}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="bg-gray-900 rounded-2xl p-6 text-white">
            <h3 className="font-bold mb-2">Pro Tip</h3>
            <p className="text-sm text-gray-400 mb-4">
              Accurate time tracking helps us optimize routes and improve scheduling for everyone.
            </p>
            <button className="text-blue-400 text-sm font-bold hover:underline flex items-center gap-1">
              View Performance Report <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
