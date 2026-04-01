import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { StatusBadge } from './Badges';
import { TicketDetail } from './TicketDetail';
import { Ticket } from '../types';

export const ScheduleView: React.FC = () => {
  const { tickets, technicians, assignTechnician } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const scheduledTickets = tickets.filter(t => t.scheduledDate);
  const unscheduledTickets = tickets.filter(t => !t.scheduledDate && t.status !== 'completed' && t.status !== 'cancelled' && t.status !== 'rejected');

  const hours = Array.from({ length: 11 }, (_, i) => i + 8); // 8 AM to 6 PM

  const nextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const prevDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    setCurrentDate(prev);
  };

  const today = () => {
    setCurrentDate(new Date());
  };

  const getTicketsForHour = (hour: number) => {
    const dateStr = currentDate.toISOString().split('T')[0];
    return scheduledTickets.filter(t => {
      if (t.scheduledDate !== dateStr || !t.scheduledTime) return false;
      const tHour = parseInt(t.scheduledTime.split(':')[0], 10);
      return tHour === hour;
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dispatch Schedule</h1>
          <p className="text-gray-500 mt-1 font-medium">Manage daily appointments and technician assignments</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={today} className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-all">
            Today
          </button>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
            <button onClick={prevDay} className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors">
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <span className="w-40 text-center font-bold text-gray-900 text-sm">
              {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
            <button onClick={nextDay} className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors">
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Main Schedule */}
        <div className="flex-1 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl flex flex-col">
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className="min-w-[600px]">
              {/* Header */}
              <div className="flex border-b border-gray-200 bg-gray-50/50 sticky top-0 z-10 backdrop-blur-md">
                <div className="w-28 shrink-0 border-r border-gray-200 p-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  Time
                </div>
                <div className="flex-1 p-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  Scheduled Appointments
                </div>
              </div>

              {/* Time Slots */}
              <div className="divide-y divide-gray-100">
                {hours.map(hour => {
                  const hourTickets = getTicketsForHour(hour);
                  return (
                    <div key={hour} className="flex min-h-[140px] group">
                      <div className="w-28 shrink-0 border-r border-gray-200 p-6 text-center bg-gray-50/20 group-hover:bg-gray-50/50 transition-colors">
                        <span className="text-sm font-black text-gray-900">
                          {hour > 12 ? hour - 12 : hour} {hour >= 12 ? 'PM' : 'AM'}
                        </span>
                        <div className="text-[10px] font-bold text-gray-400 mt-1">
                          {hour}:00
                        </div>
                      </div>
                      <div className="flex-1 p-4 flex gap-4 overflow-x-auto scrollbar-hide">
                        {hourTickets.map(ticket => (
                          <div 
                            key={ticket.id} 
                            onClick={() => setSelectedTicket(ticket)}
                            className="min-w-[300px] max-w-[400px] shrink-0 rounded-2xl border border-blue-100 bg-blue-50/30 p-5 transition-all hover:bg-blue-50 hover:shadow-lg hover:border-blue-300 cursor-pointer flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-start justify-between mb-3">
                                <h4 className="font-bold text-blue-900 truncate pr-2 text-sm">{ticket.title}</h4>
                                <StatusBadge status={ticket.status} />
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-[10px] text-gray-600 font-medium">
                                  <User className="h-3.5 w-3.5 text-blue-400" />
                                  <span className="truncate">{ticket.clientName}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                  <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                  <span className="truncate">{ticket.serviceAddress}</span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between border-t border-blue-100/50 pt-3">
                              {ticket.assignedTechnicianName ? (
                                <div className="inline-flex items-center gap-2 rounded-xl bg-white px-2 py-1 text-[10px] font-bold text-gray-700 border border-blue-100 shadow-sm">
                                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                  {ticket.assignedTechnicianName}
                                </div>
                              ) : (
                                <span className="text-[10px] font-bold text-amber-600 italic">Unassigned</span>
                              )}
                              <button 
                                onClick={(e) => { e.stopPropagation(); setSelectedTicket(ticket); }}
                                className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                Reschedule
                              </button>
                            </div>
                          </div>
                        ))}
                        {hourTickets.length === 0 && (
                          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-100 rounded-2xl m-2 group-hover:border-gray-200 transition-colors">
                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Available Slot</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Unscheduled Sidebar */}
        <div className="w-80 shrink-0 flex flex-col gap-4">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Unscheduled</h3>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black text-amber-700">
                {unscheduledTickets.length}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
              {unscheduledTickets.map(ticket => (
                <div 
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="rounded-xl border border-gray-100 bg-gray-50 p-4 transition-all hover:border-blue-300 hover:bg-white hover:shadow-md cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">#{ticket.id.slice(-4)}</span>
                    <span className={cn(
                      "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                      ticket.urgency === 'high' || ticket.urgency === 'emergency' ? "bg-red-100 text-red-700" : "bg-gray-200 text-gray-600"
                    )}>
                      {ticket.urgency}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600">{ticket.title}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-3">
                    <User className="h-3 w-3" />
                    <span className="truncate">{ticket.clientName}</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedTicket(ticket); }}
                    className="w-full rounded-lg bg-blue-600 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-sm hover:bg-blue-700 transition-colors"
                  >
                    Schedule Now
                  </button>
                </div>
              ))}
              
              {unscheduledTickets.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center py-12 opacity-30">
                  <CalendarIcon className="h-12 w-12 text-gray-300 mb-2" />
                  <p className="text-xs font-bold text-gray-500">All caught up!</p>
                </div>
              )}
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
