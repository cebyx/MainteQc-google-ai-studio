import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { Search, Filter, Calendar, MapPin, Clock, Plus } from 'lucide-react';
import { StatusBadge, UrgencyBadge } from './Badges';
import { formatDate, cn } from '../lib/utils';
import { TicketDetail } from './TicketDetail';
import { Ticket } from '../types';

export const AppointmentsListView: React.FC<{ setActiveTab: (tab: string) => void }> = ({ setActiveTab }) => {
  const { tickets, currentUser } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const myTickets = tickets.filter(t => t.clientId === currentUser.id);

  const filteredTickets = myTickets.filter(ticket => 
    ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.serviceAddress.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Appointments</h1>
          <p className="text-gray-500 mt-1">View your scheduled service visits</p>
        </div>
        <button onClick={() => setActiveTab('request')} className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-xl active:scale-95">
          <Plus className="h-4 w-4" />
          Request Service
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search appointments by title or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border-gray-200 pl-10 py-3 text-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <button className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50">
          <Filter className="h-4 w-4" />
          Filters
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTickets.map((ticket) => (
          <div 
            key={ticket.id} 
            onClick={() => setSelectedTicket(ticket)}
            className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-200 cursor-pointer flex flex-col"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <StatusBadge status={ticket.status} />
                <UrgencyBadge urgency={ticket.urgency} />
              </div>
              <span className="text-xs font-bold text-gray-400">#{ticket.id.slice(-4)}</span>
            </div>

            <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-2">{ticket.title}</h3>
            
            <div className="space-y-3 mb-6 flex-1">
              <div className="flex items-start gap-3 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{ticket.serviceAddress}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                <span>{ticket.scheduledDate ? formatDate(ticket.scheduledDate) : 'Unscheduled'}</span>
              </div>
              {ticket.scheduledTime && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                  <span>{ticket.scheduledTime}</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">{ticket.propertyNickname}</span>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider group-hover:underline">View Details</span>
            </div>
          </div>
        ))}
        {filteredTickets.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">
            No appointments found matching your search.
          </div>
        )}
      </div>

      {selectedTicket && (
        <TicketDetail ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
      )}
    </div>
  );
};
