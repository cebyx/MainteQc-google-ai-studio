import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { StatusBadge } from './Badges';
import { TicketDetail } from './TicketDetail';
import { Ticket } from '../types';

export const ScheduleView: React.FC = () => {
  const { tickets, technicians } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const scheduledTickets = tickets.filter(t => t.scheduledDate);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
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
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Schedule</h1>
          <p className="text-gray-500 mt-1">Daily dispatch calendar</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={today} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">
            Today
          </button>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-1">
            <button onClick={prevDay} className="rounded-lg p-1 hover:bg-gray-100">
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <span className="w-32 text-center font-bold text-gray-900">
              {currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <button onClick={nextDay} className="rounded-lg p-1 hover:bg-gray-100">
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="min-w-[800px]">
            {/* Header */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              <div className="w-24 shrink-0 border-r border-gray-200 p-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                Time
              </div>
              <div className="flex-1 p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Appointments
              </div>
            </div>

            {/* Time Slots */}
            <div className="divide-y divide-gray-100">
              {hours.map(hour => {
                const hourTickets = getTicketsForHour(hour);
                return (
                  <div key={hour} className="flex min-h-[100px]">
                    <div className="w-24 shrink-0 border-r border-gray-200 p-4 text-center">
                      <span className="text-sm font-bold text-gray-900">
                        {hour > 12 ? hour - 12 : hour} {hour >= 12 ? 'PM' : 'AM'}
                      </span>
                    </div>
                    <div className="flex-1 p-2 flex gap-2 overflow-x-auto">
                      {hourTickets.map(ticket => (
                        <div 
                          key={ticket.id} 
                          onClick={() => setSelectedTicket(ticket)}
                          className="min-w-[300px] max-w-[400px] shrink-0 rounded-xl border border-blue-100 bg-blue-50/50 p-4 transition-all hover:bg-blue-50 hover:shadow-md cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-bold text-blue-900 truncate pr-2">{ticket.title}</h4>
                            <StatusBadge status={ticket.status} />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="truncate">{ticket.clientName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span className="truncate">{ticket.serviceAddress}</span>
                            </div>
                            {ticket.assignedTechnicianName && (
                              <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-gray-700 border border-gray-200 shadow-sm">
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                {ticket.assignedTechnicianName}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {hourTickets.length === 0 && (
                        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-100 rounded-xl m-2">
                          <span className="text-sm font-medium text-gray-400">No appointments</span>
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

      {selectedTicket && (
        <TicketDetail 
          ticket={selectedTicket} 
          onClose={() => setSelectedTicket(null)} 
        />
      )}
    </div>
  );
};
