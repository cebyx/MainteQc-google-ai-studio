import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { Ticket, JobStatus } from '../types';
import { StatusBadge, UrgencyBadge } from './Badges';
import { 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  Clipboard, 
  MessageSquare,
  ChevronLeft,
  Wrench,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { formatDate, cn } from '../lib/utils';
import { STATUS_LABELS } from '../constants';

interface TicketDetailProps {
  ticket: Ticket;
  onClose: () => void;
}

const AdminTicketDetail: React.FC<{ ticket: Ticket; currentTicket: Ticket; editedTicket: Partial<Ticket>; handleChange: (f: keyof Ticket, v: any) => void; handleSave: () => void; handleStatusChange: (s: JobStatus) => void; onClose: () => void }> = ({ ticket, currentTicket, editedTicket, handleChange, handleSave, handleStatusChange, onClose }) => {
  const { technicians, approveTicket, rejectTicket } = useApp();
  
  const isPending = ticket.status === 'pending_review';
  
  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{ticket.title}</h3>
        <p className="text-gray-600 leading-relaxed">{ticket.description}</p>
      </section>

      {isPending && (
        <section className="rounded-2xl bg-amber-50 p-6 border border-amber-200">
          <h4 className="flex items-center gap-2 font-bold text-amber-900 mb-4">
            <AlertTriangle className="h-5 w-5" />
            Review Required
          </h4>
          <div className="flex gap-3">
            <button 
              onClick={() => approveTicket(ticket.id)}
              className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-colors"
            >
              Approve Request
            </button>
            <button 
              onClick={() => rejectTicket(ticket.id)}
              className="flex-1 rounded-xl bg-white border border-red-200 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
            >
              Reject Request
            </button>
          </div>
        </section>
      )}

      <section className="rounded-2xl bg-gray-50 p-6 border border-gray-200">
        <h4 className="flex items-center gap-2 font-bold text-gray-900 mb-4">
          <Clipboard className="h-5 w-5" />
          Dispatch & Scheduling
        </h4>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Schedule Date</label>
              <input 
                type="date" 
                className="w-full rounded-lg border-gray-200 text-sm" 
                value={currentTicket.scheduledDate || ''} 
                onChange={(e) => handleChange('scheduledDate', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Schedule Time</label>
              <input 
                type="time" 
                className="w-full rounded-lg border-gray-200 text-sm" 
                value={currentTicket.scheduledTime || ''} 
                onChange={(e) => handleChange('scheduledTime', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Assign Technician</label>
            <select 
              className="w-full rounded-lg border-gray-200 text-sm"
              value={currentTicket.assignedTechnicianId || ''}
              onChange={(e) => {
                const techId = e.target.value;
                const tech = technicians.find(t => t.id === techId);
                handleChange('assignedTechnicianId', techId);
                handleChange('assignedTechnicianName', tech?.fullName || '');
              }}
            >
              <option value="">Unassigned</option>
              {technicians.map(tech => (
                <option key={tech.id} value={tech.id}>{tech.fullName} ({tech.status})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Status</label>
            <select 
              className="w-full rounded-lg border-gray-200 text-sm"
              value={currentTicket.status}
              onChange={(e) => handleChange('status', e.target.value as JobStatus)}
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="pt-2">
            <button 
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white disabled:opacity-50 shadow-lg shadow-blue-100 hover:bg-blue-700 transition-colors"
              onClick={handleSave}
              disabled={Object.keys(editedTicket).length === 0}
            >
              Update Dispatch Details
            </button>
          </div>
        </div>
      </section>

      <div className="space-y-4">
        <div className="rounded-xl border border-gray-100 p-4">
          <h5 className="text-sm font-bold text-gray-900 mb-2">Technician Field Notes</h5>
          <textarea 
            className="w-full rounded-lg border-gray-200 text-sm" 
            placeholder="Add field notes..."
            value={currentTicket.technicianNotes || ''}
            onChange={(e) => handleChange('technicianNotes', e.target.value)}
            onBlur={handleSave}
          />
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/30 p-4">
          <h5 className="text-sm font-bold text-amber-900 mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Internal Admin Notes (Private)
          </h5>
          <textarea 
            className="w-full rounded-lg border-amber-200 text-sm bg-white" 
            placeholder="Add internal notes..."
            value={currentTicket.adminNotes || ''}
            onChange={(e) => handleChange('adminNotes', e.target.value)}
            onBlur={handleSave}
          />
        </div>
      </div>
    </div>
  );
};

const TechnicianTicketDetail: React.FC<{ ticket: Ticket; currentTicket: Ticket; handleChange: (f: keyof Ticket, v: any) => void; handleSave: () => void; handleStatusChange: (s: JobStatus) => void }> = ({ ticket, currentTicket, handleChange, handleSave, handleStatusChange }) => {
  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{ticket.title}</h3>
        <p className="text-gray-600 leading-relaxed">{ticket.description}</p>
      </section>

      <section className="rounded-2xl bg-blue-50 p-6 border border-blue-100">
        <h4 className="flex items-center gap-2 font-bold text-blue-900 mb-4">
          <Wrench className="h-5 w-5" />
          Field Status Controls
        </h4>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { status: 'on_the_way', label: 'On My Way' },
            { status: 'arrived', label: 'Arrived' },
            { status: 'in_progress', label: 'In Progress' },
            { status: 'waiting_on_parts', label: 'Waiting on Parts' },
            { status: 'completed', label: 'Completed' },
            { status: 'unable_to_complete', label: 'Unable to Complete' },
          ].map((btn) => (
            <button
              key={btn.status}
              onClick={() => handleStatusChange(btn.status as JobStatus)}
              className={cn(
                "rounded-xl border py-3 text-xs font-bold transition-all active:scale-95",
                ticket.status === btn.status
                  ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200"
                  : "bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:text-blue-600"
              )}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </section>

      <div className="space-y-4">
        <div className="rounded-xl border border-gray-100 p-4">
          <h5 className="text-sm font-bold text-gray-900 mb-2">Technician Field Notes</h5>
          <textarea 
            className="w-full rounded-lg border-gray-200 text-sm" 
            placeholder="Add field notes..."
            value={currentTicket.technicianNotes || ''}
            onChange={(e) => handleChange('technicianNotes', e.target.value)}
            onBlur={handleSave}
            rows={4}
          />
        </div>
        <div className="rounded-xl border border-gray-100 p-4">
          <h5 className="text-sm font-bold text-gray-900 mb-2">Completion Notes</h5>
          <textarea 
            className="w-full rounded-lg border-gray-200 text-sm" 
            placeholder="Add completion notes..."
            value={currentTicket.completionNotes || ''}
            onChange={(e) => handleChange('completionNotes', e.target.value)}
            onBlur={handleSave}
            rows={3}
          />
        </div>
      </div>
    </div>
  );
};

const ClientTicketDetail: React.FC<{ ticket: Ticket }> = ({ ticket }) => {
  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{ticket.title}</h3>
        <p className="text-gray-600 leading-relaxed">{ticket.description}</p>
      </section>

      {ticket.completionNotes && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <h5 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Completion Notes
          </h5>
          <p className="text-sm text-gray-600">{ticket.completionNotes}</p>
        </div>
      )}
    </div>
  );
};

export const TicketDetail: React.FC<TicketDetailProps> = ({ ticket, onClose }) => {
  const { role, updateTicket, rescheduleTicket, assignTechnician, activities, clients, properties, messages } = useApp();
  const [editedTicket, setEditedTicket] = useState<Partial<Ticket>>({});

  const ticketActivities = activities
    .filter(a => a.ticketId === ticket.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const client = clients.find(c => c.id === ticket.clientId);
  const property = properties.find(p => p.id === ticket.propertyId);
  const ticketMessages = messages.filter(m => m.ticketId === ticket.id);

  const handleStatusChange = (newStatus: JobStatus) => {
    updateTicket(ticket.id, { status: newStatus });
  };

  const handleSave = async () => {
    const updates = { ...editedTicket };
    
    if (updates.scheduledDate !== undefined || updates.scheduledTime !== undefined) {
      const newDate = updates.scheduledDate ?? ticket.scheduledDate ?? '';
      const newTime = updates.scheduledTime ?? ticket.scheduledTime ?? '';
      if (newDate || newTime) {
        await rescheduleTicket(ticket.id, newDate, newTime);
      }
      delete updates.scheduledDate;
      delete updates.scheduledTime;
    }

    if (updates.assignedTechnicianId !== undefined) {
      const newTechId = updates.assignedTechnicianId;
      const newTechName = updates.assignedTechnicianName ?? '';
      await assignTechnician(ticket.id, newTechId, newTechName);
      delete updates.assignedTechnicianId;
      delete updates.assignedTechnicianName;
    }

    if (Object.keys(updates).length > 0) {
      await updateTicket(ticket.id, updates);
    }
    
    setEditedTicket({});
  };

  const handleChange = (field: keyof Ticket, value: any) => {
    setEditedTicket(prev => ({ ...prev, [field]: value }));
  };

  const currentTicket = { ...ticket, ...editedTicket };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex h-full max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100">
              <ChevronLeft className="h-5 w-5 text-gray-500" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Ticket #{ticket.id.slice(-4)}</h2>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={ticket.status} />
                <UrgencyBadge urgency={ticket.urgency} />
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Created</div>
            <div className="text-sm font-medium">{formatDate(ticket.createdAt)}</div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Main Info */}
            <div className="lg:col-span-2">
              {role === 'ADMIN' && (
                <AdminTicketDetail 
                  ticket={ticket} 
                  currentTicket={currentTicket as Ticket} 
                  editedTicket={editedTicket} 
                  handleChange={handleChange} 
                  handleSave={handleSave} 
                  handleStatusChange={handleStatusChange} 
                  onClose={onClose}
                />
              )}
              {role === 'TECHNICIAN' && (
                <TechnicianTicketDetail 
                  ticket={ticket} 
                  currentTicket={currentTicket as Ticket} 
                  handleChange={handleChange} 
                  handleSave={handleSave} 
                  handleStatusChange={handleStatusChange} 
                />
              )}
              {role === 'CLIENT' && (
                <ClientTicketDetail ticket={ticket} />
              )}
            </div>

            {/* Sidebar Info */}
            <div className="space-y-6">
              {/* Customer Info (Hidden for Client) */}
              {role !== 'CLIENT' && (
                <div className="rounded-2xl border border-gray-100 p-5">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Customer</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {ticket.clientName.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{ticket.clientName}</div>
                        <div className="text-xs text-gray-500">Client ID: {ticket.clientId}</div>
                      </div>
                    </div>
                    <div className="space-y-2 pt-2">
                      {client?.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4 text-gray-400" />
                          {client.phone}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4 text-gray-400" />
                        {ticket.createdByEmail}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Property Info */}
              <div className="rounded-2xl border border-gray-100 p-5">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Service Location</h4>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-1 h-5 w-5 text-blue-600" />
                    <div>
                      <div className="text-sm font-bold text-gray-900">{ticket.propertyNickname}</div>
                      <div className="text-sm text-gray-500 leading-tight">{ticket.serviceAddress}</div>
                    </div>
                  </div>
                  {property?.accessInstructions && (
                    <div className="rounded-xl bg-gray-50 p-3">
                      <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Access Instructions</div>
                      <div className="text-xs text-gray-600 italic">"{property.accessInstructions}"</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline / Status */}
              <div className="rounded-2xl border border-gray-100 p-5">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Activity Timeline</h4>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {ticketActivities.length > 0 ? (
                    ticketActivities.map((activity, index) => (
                      <div key={activity.id} className="flex gap-3">
                        <div className="relative flex flex-col items-center">
                          <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                          {index !== ticketActivities.length - 1 && (
                            <div className="h-full w-0.5 bg-gray-100"></div>
                          )}
                        </div>
                        <div className="pb-4">
                          <div className="text-xs font-bold text-gray-900">{activity.description}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            {formatDate(activity.timestamp)} • {activity.actorName} ({activity.actorRole})
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-500 italic">No activity recorded yet.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <MessageSquare className="h-4 w-4" />
            <span>{ticketMessages.length} message{ticketMessages.length !== 1 ? 's' : ''} linked to this ticket</span>
          </div>
          <button 
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-6 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
