import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { 
  Plus, 
  Calendar, 
  FileText, 
  MessageSquare, 
  ChevronRight,
  MapPin,
  Clock,
  History
} from 'lucide-react';
import { StatusBadge } from './Badges';
import { cn, formatDate } from '../lib/utils';
import { TicketDetail } from './TicketDetail';
import { Ticket } from '../types';

export const ClientDashboard: React.FC<{ setActiveTab: (tab: string) => void }> = ({ setActiveTab }) => {
  const { tickets, currentUser, properties } = useApp();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Filter records for this client
  const myTickets = tickets.filter(t => t.clientId === currentUser.id);
  const activeJobs = myTickets.filter(t => !['completed', 'cancelled', 'rejected'].includes(t.status));
  const completedJobs = myTickets.filter(t => t.status === 'completed');
  const myProperties = properties.filter(p => p.clientId === currentUser.id);

  return (
    <div className="space-y-6 pb-20">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white shadow-xl">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold">Hello, {currentUser.fullName.split(' ')[0]}!</h2>
          <p className="mt-1 text-blue-100 opacity-90">How can we help you today?</p>
          <button onClick={() => setActiveTab('request')} className="mt-6 flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-blue-700 shadow-lg transition-transform active:scale-95">
            <Plus className="h-5 w-5" />
            Request New Service
          </button>
        </div>
        <div className="absolute -right-8 -top-8 h-48 w-48 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-blue-400/20 blur-2xl"></div>
      </div>

      {/* Active Status */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Active Appointments */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Active Appointments
            </h3>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
              {activeJobs.length}
            </span>
          </div>

          <div className="space-y-3">
            {activeJobs.length > 0 ? (
              activeJobs.map(job => (
                <div 
                  key={job.id} 
                  onClick={() => setSelectedTicket(job)}
                  className="group relative rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.99] cursor-pointer"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <StatusBadge status={job.status} />
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{job.category}</div>
                  </div>
                  <h4 className="font-bold text-gray-900">{job.title}</h4>
                  <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {job.propertyNickname}
                    </div>
                    {job.scheduledDate && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(job.scheduledDate)}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                </div>
              ))
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-gray-100 p-8 text-center">
                <p className="text-sm text-gray-400">No active service requests.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links & Info */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setActiveTab('history')} className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50 group">
              <div className="rounded-xl bg-blue-100 p-3 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <History className="h-6 w-6" />
              </div>
              <span className="text-sm font-bold text-gray-700">History</span>
            </button>
            <button onClick={() => setActiveTab('billing')} className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50 group">
              <div className="rounded-xl bg-indigo-100 p-3 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <FileText className="h-6 w-6" />
              </div>
              <span className="text-sm font-bold text-gray-700">Billing</span>
            </button>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-bold text-gray-900">Your Properties</h3>
            <div className="space-y-3">
              {myProperties.map(prop => (
                <div key={prop.id} className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-white p-2 shadow-sm">
                      <MapPin className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{prop.nickname}</div>
                      <div className="text-[10px] text-gray-500 truncate max-w-[150px]">{prop.address}</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedTicket && (
        <TicketDetail 
          ticket={selectedTicket} 
          onClose={() => setSelectedTicket(null)} 
        />
      )}
    </div>
  );
};
