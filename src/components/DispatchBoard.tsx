import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { Ticket, JobStatus } from '../types';
import { STATUS_LABELS } from '../constants';
import { StatusBadge, UrgencyBadge } from './Badges';
import { Search, Filter, MoreVertical, Calendar, User, MapPin, Clipboard } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { TicketDetail } from './TicketDetail';

export const DispatchBoard: React.FC = () => {
  const { tickets, technicians, approveTicket, rejectTicket, assignTechnician, rescheduleTicket } = useApp();
  const [view, setView] = useState<'board' | 'list'>('board');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string | 'all'>('all');

  const columns: JobStatus[] = ['pending_review', 'approved', 'scheduled', 'in_progress', 'waiting_on_parts'];

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.propertyNickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.assignedTechnicianName && t.assignedTechnicianName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesUrgency = urgencyFilter === 'all' || t.urgency === urgencyFilter;

    return matchesSearch && matchesStatus && matchesUrgency;
  });

  const getTicketsByStatus = (status: JobStatus) => filteredTickets.filter(t => t.status === status);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-1 shadow-sm w-fit">
          <button 
            onClick={() => setView('board')}
            className={cn("rounded-md px-4 py-1.5 text-sm font-bold transition-all", view === 'board' ? "bg-blue-600 text-white shadow-md" : "text-gray-500 hover:text-gray-900")}
          >
            Board
          </button>
          <button 
            onClick={() => setView('list')}
            className={cn("rounded-md px-4 py-1.5 text-sm font-bold transition-all", view === 'list' ? "bg-blue-600 text-white shadow-md" : "text-gray-500 hover:text-gray-900")}
          >
            List
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search tickets, clients, properties..." 
              className="h-10 w-full rounded-xl border-gray-200 pl-9 text-sm focus:ring-blue-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            className="h-10 rounded-xl border-gray-200 text-sm font-medium focus:ring-blue-500"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
          >
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>

          <select 
            className="h-10 rounded-xl border-gray-200 text-sm font-medium focus:ring-blue-500"
            value={urgencyFilter}
            onChange={e => setUrgencyFilter(e.target.value)}
          >
            <option value="all">All Urgency</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="emergency">Emergency</option>
          </select>
        </div>
      </div>

      {view === 'board' ? (
        <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
          {columns.map(status => (
            <div key={status} className="flex w-80 shrink-0 flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <h3 className={cn(
                  "text-[10px] font-black uppercase tracking-[0.2em]",
                  status === 'pending_review' ? "text-amber-600" : "text-gray-500"
                )}>
                  {STATUS_LABELS[status]}
                </h3>
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold",
                  status === 'pending_review' ? "bg-amber-100 text-amber-700" : "bg-gray-200 text-gray-600"
                )}>
                  {getTicketsByStatus(status).length}
                </span>
              </div>

              <div className={cn(
                "flex flex-1 flex-col gap-3 rounded-2xl p-3 min-h-[600px] transition-colors",
                status === 'pending_review' ? "bg-amber-50/50 border border-amber-100" : "bg-gray-100/50 border border-transparent"
              )}>
                {getTicketsByStatus(status).map(ticket => (
                  <div 
                    key={ticket.id} 
                    onClick={() => setSelectedTicket(ticket)}
                    className="group relative cursor-pointer rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-lg hover:border-blue-300 hover:-translate-y-0.5"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <UrgencyBadge urgency={ticket.urgency} />
                      <div className="flex items-center gap-1">
                        {ticket.status === 'pending_review' && (
                          <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                        )}
                        <button className="text-gray-300 hover:text-gray-600 transition-colors">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <h4 className="text-sm font-bold text-gray-900 line-clamp-2 mb-3 group-hover:text-blue-600 transition-colors">
                      {ticket.title}
                    </h4>
                    
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        <User className="h-3.5 w-3.5 text-gray-400" />
                        <span className="truncate font-medium">{ticket.clientName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        <span className="truncate">{ticket.propertyNickname}</span>
                      </div>
                      {ticket.scheduledDate && (
                        <div className="flex items-center gap-2 text-[10px] text-blue-600 font-bold bg-blue-50 w-fit px-2 py-1 rounded-md">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{formatDate(ticket.scheduledDate)} @ {ticket.scheduledTime}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-3">
                      {ticket.assignedTechnicianName ? (
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-[8px] font-bold text-blue-700 border border-blue-200">
                            {ticket.assignedTechnicianName.charAt(0)}
                          </div>
                          <span className="text-[10px] font-bold text-gray-700">{ticket.assignedTechnicianName}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-600 italic">Unassigned</span>
                      )}
                      
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {ticket.status === 'pending_review' ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); approveTicket(ticket.id); }}
                            className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors"
                            title="Approve"
                          >
                            <User className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedTicket(ticket); }}
                            className="rounded-lg bg-blue-50 p-1.5 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors"
                            title="Dispatch"
                          >
                            <Calendar className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {getTicketsByStatus(status).length === 0 && (
                  <div className="flex flex-1 flex-col items-center justify-center text-center p-6 opacity-40">
                    <div className="h-12 w-12 rounded-full bg-gray-200 mb-2 flex items-center justify-center">
                      <Clipboard className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-xs font-bold text-gray-500">No tickets {STATUS_LABELS[status].toLowerCase()}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Ticket</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Client</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Status</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Technician</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Scheduled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTickets.map(ticket => (
                <tr key={ticket.id} onClick={() => setSelectedTicket(ticket)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{ticket.title}</div>
                    <div className="text-xs text-gray-400">#{ticket.id.slice(-4)} • {ticket.category}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-700">{ticket.clientName}</div>
                    <div className="text-xs text-gray-400">{ticket.propertyNickname}</div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-6 py-4">
                    {ticket.assignedTechnicianName ? (
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700">
                          {ticket.assignedTechnicianName.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-700">{ticket.assignedTechnicianName}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {ticket.scheduledDate ? (
                      <div className="text-xs font-medium text-gray-700">
                        {formatDate(ticket.scheduledDate)}
                        <div className="text-gray-400">{ticket.scheduledTime}</div>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Not scheduled</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedTicket && (
        <TicketDetail 
          ticket={selectedTicket} 
          onClose={() => setSelectedTicket(null)} 
        />
      )}
    </div>
  );
};
