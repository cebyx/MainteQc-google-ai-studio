import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { Ticket, JobStatus } from '../types';
import { STATUS_LABELS } from '../constants';
import { StatusBadge, UrgencyBadge } from './Badges';
import { Search, Filter, MoreVertical, Calendar, User, MapPin } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { TicketDetail } from './TicketDetail';

export const DispatchBoard: React.FC = () => {
  const { tickets } = useApp();
  const [view, setView] = useState<'board' | 'list'>('board');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const columns: JobStatus[] = ['pending_review', 'approved', 'scheduled', 'in_progress', 'waiting_on_parts'];

  const getTicketsByStatus = (status: JobStatus) => tickets.filter(t => t.status === status);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
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

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search tickets..." className="h-10 rounded-xl border-gray-200 pl-9 text-sm focus:ring-blue-500" />
          </div>
          <button className="flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 hover:bg-gray-50">
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>
      </div>

      {view === 'board' ? (
        <div className="flex gap-6 overflow-x-auto pb-6">
          {columns.map(status => (
            <div key={status} className="flex w-80 shrink-0 flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">
                  {STATUS_LABELS[status]}
                </h3>
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                  {getTicketsByStatus(status).length}
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-3 rounded-2xl bg-gray-100/50 p-3 min-h-[500px]">
                {getTicketsByStatus(status).map(ticket => (
                  <div 
                    key={ticket.id} 
                    onClick={() => setSelectedTicket(ticket)}
                    className="group relative cursor-pointer rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-blue-200"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <UrgencyBadge urgency={ticket.urgency} />
                      <button className="text-gray-300 hover:text-gray-600">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 line-clamp-2 mb-3">{ticket.title}</h4>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        <User className="h-3 w-3" />
                        <span className="truncate">{ticket.clientName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{ticket.propertyNickname}</span>
                      </div>
                      {ticket.scheduledDate && (
                        <div className="flex items-center gap-2 text-[10px] text-blue-600 font-bold">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(ticket.scheduledDate)} @ {ticket.scheduledTime}</span>
                        </div>
                      )}
                    </div>

                    {ticket.assignedTechnicianName && (
                      <div className="mt-3 flex items-center gap-2 border-t border-gray-50 pt-3">
                        <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-[8px] font-bold text-blue-700">
                          {ticket.assignedTechnicianName.charAt(0)}
                        </div>
                        <span className="text-[10px] font-medium text-gray-600">{ticket.assignedTechnicianName}</span>
                      </div>
                    )}
                  </div>
                ))}
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
              {tickets.map(ticket => (
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
