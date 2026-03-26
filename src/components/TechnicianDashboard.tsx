import React from 'react';
import { useApp } from '../AppContext';
import { 
  Calendar, 
  MapPin, 
  Phone, 
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { StatusBadge, UrgencyBadge } from './Badges';
import { cn, formatDate } from '../lib/utils';

export const TechnicianDashboard: React.FC = () => {
  const { tickets, currentUser } = useApp();

  // Filter jobs assigned to this technician
  const myJobs = tickets.filter(t => t.assignedTechnicianId === currentUser.id);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayJobs = myJobs.filter(t => t.scheduledDate === todayStr && t.status !== 'completed');
  const completedToday = myJobs.filter(t => t.scheduledDate === todayStr && t.status === 'completed').length;

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

      {/* Today's Jobs */}
      <div>
        <h3 className="mb-4 text-lg font-bold text-gray-900 flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          Today's Schedule
        </h3>
        
        <div className="space-y-4">
          {todayJobs.length > 0 ? (
            todayJobs.map((job) => (
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
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 shrink-0 text-gray-400" />
                    <div className="text-sm font-medium text-gray-900">{job.clientName}</div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-md shadow-blue-100 active:bg-blue-700">
                    Start Job
                  </button>
                  <button className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-600 active:bg-gray-100">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
              <div className="mb-3 rounded-full bg-gray-100 p-4">
                <CheckCircle2 className="h-8 w-8 text-gray-400" />
              </div>
              <h4 className="font-bold text-gray-900">All caught up!</h4>
              <p className="text-sm text-gray-500">No more jobs scheduled for today.</p>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming */}
      <div className="rounded-2xl bg-gray-900 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">Upcoming Jobs</h3>
          <button className="text-xs font-bold text-blue-400 uppercase tracking-widest">View All</button>
        </div>
        <div className="space-y-4">
          {myJobs.filter(t => t.scheduledDate !== todayStr && t.status !== 'completed').slice(0, 2).map(job => (
            <div key={job.id} className="flex items-center justify-between border-b border-white/10 pb-4 last:border-0 last:pb-0">
              <div>
                <div className="text-sm font-bold">{job.title}</div>
                <div className="text-xs text-gray-400">{formatDate(job.scheduledDate || '')} • {job.scheduledTime}</div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-500" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
