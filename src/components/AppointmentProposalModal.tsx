import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Clock, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useApp } from '../AppContext';
import { Ticket, Technician } from '../types';
import { format, addHours, parseISO, isAfter, startOfToday } from 'date-fns';

interface AppointmentProposalModalProps {
  ticket: Ticket;
  onClose: () => void;
}

export const AppointmentProposalModal: React.FC<AppointmentProposalModalProps> = ({ ticket, onClose }) => {
  const { technicians, createAppointmentProposal, getTechnicianCapacityForDay } = useApp();
  const [selectedTechId, setSelectedTechId] = useState(ticket.assignedTechnicianId || '');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('09:00');
  const [duration, setDuration] = useState(2); // hours
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTech = technicians.find(t => t.id === selectedTechId);
  const capacity = selectedTechId ? getTechnicianCapacityForDay(selectedTechId, date) : 0;
  const capacityValue = typeof capacity === 'number' ? capacity : capacity.availableMinutes;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTechId) {
      setError('Please select a technician');
      return;
    }

    const startDateTime = `${date}T${startTime}:00`;
    const endDateTime = format(addHours(parseISO(startDateTime), duration), "yyyy-MM-dd'T'HH:mm:ss");

    if (!isAfter(parseISO(startDateTime), new Date())) {
      setError('Appointment must be in the future');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createAppointmentProposal({
        ticketId: ticket.id!,
        technicianId: selectedTechId,
        clientId: ticket.clientId,
        startTime: startDateTime,
        endTime: endDateTime,
        notes: notes || undefined
      });
      onClose();
    } catch (err) {
      setError('Failed to create proposal. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
      >
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div>
            <h3 className="font-bold text-gray-900">Propose Appointment</h3>
            <p className="text-xs text-gray-500">Ticket #{ticket.id?.slice(-6)}: {ticket.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <User className="w-3 h-3" /> Technician
            </label>
            <select
              value={selectedTechId}
              onChange={(e) => setSelectedTechId(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              required
            >
              <option value="">Select Technician</option>
              {technicians.map(tech => (
                <option key={tech.id} value={tech.id}>
                  {tech.fullName} ({tech.specialties?.join(', ') || 'General'})
                </option>
              ))}
            </select>
            {selectedTechId && (
              <div className="mt-1 flex items-center gap-1 text-[10px] text-gray-500">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                Remaining Capacity: <span className="font-bold text-gray-700">{capacityValue} mins</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Date
              </label>
              <input
                type="date"
                value={date}
                min={format(new Date(), 'yyyy-MM-dd')}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3" /> Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3" /> Estimated Duration (Hours)
            </label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              max="12"
              value={duration}
              onChange={(e) => setDuration(parseFloat(e.target.value))}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes for Client</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Please ensure someone is home to provide access..."
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none h-24 resize-none"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Proposal'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
