import React, { useState, useMemo } from 'react';
import { useApp } from '../AppContext';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, User, AlertTriangle, CheckCircle2, MoreHorizontal, Plus, Shield, UserX } from 'lucide-react';
import { cn } from '../lib/utils';
import { StatusBadge } from './Badges';
import { TicketDetail } from './TicketDetail';
import { AppointmentProposalModal } from './AppointmentProposalModal';
import { ScheduleConflictPanel } from './ScheduleConflictPanel';
import { Ticket, Technician, AppointmentRecord, BlockedSlot, ScheduleConflict } from '../types';
import { format, parseISO, isSameDay, startOfDay, addHours, isWithinInterval, addMinutes, isBefore, isAfter, addDays, areIntervalsOverlapping } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export const ScheduleView: React.FC = () => {
  const { 
    tickets, technicians, appointmentRecords, technicianBlockedSlots, technicianAvailabilityRules,
    getTechnicianCapacityForDay 
  } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalTicket, setProposalTicket] = useState<Ticket | null>(null);

  const dateStr = format(currentDate, 'yyyy-MM-dd');
  
  const scheduledTickets = tickets.filter(t => t.scheduledDate === dateStr);
  const unscheduledTickets = tickets.filter(t => !t.scheduledDate && t.status !== 'completed' && t.status !== 'cancelled' && t.status !== 'rejected');
  
  const dayAppointments = appointmentRecords.filter(a => a.startTime.startsWith(dateStr));
  const dayBlockedSlots = technicianBlockedSlots.filter(s => s.startTime.startsWith(dateStr));

  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

  // Conflict Detection Logic
  const conflicts = useMemo(() => {
    const list: ScheduleConflict[] = [];
    
    technicians.forEach(tech => {
      const techApps = dayAppointments.filter(a => a.technicianId === tech.id && a.status !== 'cancelled');
      const techBlocked = dayBlockedSlots.filter(s => s.technicianId === tech.id);
      
      // Overlap check between appointments
      for (let i = 0; i < techApps.length; i++) {
        for (let j = i + 1; j < techApps.length; j++) {
          const a = techApps[i];
          const b = techApps[j];
          
          if (areIntervalsOverlapping(
            { start: parseISO(a.startTime), end: parseISO(a.endTime) },
            { start: parseISO(b.startTime), end: parseISO(b.endTime) }
          )) {
            list.push({
              id: `overlap-${a.id}-${b.id}`,
              type: 'overlap',
              severity: 'high',
              description: `Overlap detected for ${tech.fullName} between two appointments.`,
              technicianId: tech.id,
              affectedIds: [a.id, b.id],
              date: dateStr
            });
          }
        }

        // Overlap check with blocked slots
        techBlocked.forEach(slot => {
          if (areIntervalsOverlapping(
            { start: parseISO(techApps[i].startTime), end: parseISO(techApps[i].endTime) },
            { start: parseISO(slot.startTime), end: parseISO(slot.endTime) }
          )) {
            list.push({
              id: `blocked-${techApps[i].id}-${slot.id}`,
              type: 'overlap',
              severity: 'high',
              description: `${tech.fullName} has an appointment during blocked time: ${slot.title}`,
              technicianId: tech.id,
              affectedIds: [techApps[i].id],
              date: dateStr
            });
          }
        });
      }

      // Availability check
      const dayOfWeek = currentDate.getDay();
      const rule = technicianAvailabilityRules.find(r => r.technicianId === tech.id && r.dayOfWeek === dayOfWeek);
      
      if (rule && rule.enabled) {
        const workStart = parseISO(`${dateStr}T${rule.startTime}:00`);
        const workEnd = parseISO(`${dateStr}T${rule.endTime}:00`);
        
        techApps.forEach(app => {
          const appStart = parseISO(app.startTime);
          const appEnd = parseISO(app.endTime);
          
          if (isBefore(appStart, workStart) || isAfter(appEnd, workEnd)) {
            list.push({
              id: `outside-${app.id}`,
              type: 'outside_availability',
              severity: 'medium',
              description: `${tech.fullName} has an appointment outside working hours (${rule.startTime} - ${rule.endTime})`,
              technicianId: tech.id,
              affectedIds: [app.id],
              date: dateStr
            });
          }
        });
      } else if (techApps.length > 0) {
        list.push({
          id: `no-work-${tech.id}`,
          type: 'outside_availability',
          severity: 'high',
          description: `${tech.fullName} is not scheduled to work today but has appointments assigned.`,
          technicianId: tech.id,
          affectedIds: techApps.map(a => a.id),
          date: dateStr
        });
      }
    });

    return list;
  }, [dayAppointments, technicians, technicianAvailabilityRules, currentDate, dateStr]);

  const nextDay = () => {
    const next = addDays(currentDate, 1);
    setCurrentDate(next);
  };

  const prevDay = () => {
    const prev = addDays(currentDate, -1);
    setCurrentDate(prev);
  };

  const today = () => {
    setCurrentDate(new Date());
  };

  const getTechAppointmentsForHour = (techId: string, hour: number) => {
    const hourStart = parseISO(`${dateStr}T${hour.toString().padStart(2, '0')}:00:00`);
    const hourEnd = addMinutes(hourStart, 59);
    
    return dayAppointments.filter(a => {
      if (a.technicianId !== techId || a.status === 'cancelled') return false;
      const appStart = parseISO(a.startTime);
      const appEnd = parseISO(a.endTime);
      
      // Check if appointment overlaps with this hour
      return (isBefore(appStart, hourEnd) && isAfter(appEnd, hourStart));
    });
  };

  const getTechBlockedForHour = (techId: string, hour: number) => {
    const hourStart = parseISO(`${dateStr}T${hour.toString().padStart(2, '0')}:00:00`);
    const hourEnd = addMinutes(hourStart, 59);

    return dayBlockedSlots.filter(s => {
      if (s.technicianId !== techId) return false;
      const slotStart = parseISO(s.startTime);
      const slotEnd = parseISO(s.endTime);
      
      // Check if blocked slot overlaps with this hour
      return (isBefore(slotStart, hourEnd) && isAfter(slotEnd, hourStart));
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
          <div className="flex-1 overflow-auto scrollbar-hide">
            <div className="min-w-[1000px]">
              {/* Header with Technician Names */}
              <div className="flex border-b border-gray-200 bg-gray-50/50 sticky top-0 z-20 backdrop-blur-md">
                <div className="w-24 shrink-0 border-r border-gray-200 p-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  Time
                </div>
                <div className="flex flex-1 divide-x divide-gray-200">
                  {technicians.map(tech => {
                    const capacity = getTechnicianCapacityForDay(tech.id, dateStr);
                    const isWorking = technicianAvailabilityRules.some(r => r.technicianId === tech.id && r.dayOfWeek === currentDate.getDay() && r.enabled);
                    
                    const capacityValue = typeof capacity === 'number' ? capacity : capacity.availableMinutes;
                    const totalCapacity = typeof capacity === 'number' ? 480 : capacity.totalMinutes;

                    return (
                      <div key={tech.id} className="flex-1 p-4 min-w-[200px]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-black text-gray-900 uppercase tracking-wider truncate">{tech.fullName}</span>
                          {!isWorking && <UserX className="w-3 h-3 text-red-400" />}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full transition-all duration-500",
                                capacityValue > 240 ? "bg-emerald-500" : capacityValue > 60 ? "bg-amber-500" : "bg-red-500"
                              )}
                              style={{ width: `${Math.min(100, (capacityValue / totalCapacity) * 100)}%` }}
                            />
                          </div>
                          <span className="text-[8px] font-bold text-gray-400 uppercase">{capacityValue}m left</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots Grid */}
              <div className="relative">
                {hours.map(hour => (
                  <div key={hour} className="flex min-h-[100px] border-b border-gray-50 group">
                    <div className="w-24 shrink-0 border-r border-gray-200 p-4 text-center bg-gray-50/20 group-hover:bg-gray-50/50 transition-colors sticky left-0 z-10">
                      <span className="text-xs font-black text-gray-900">
                        {hour > 12 ? hour - 12 : hour} {hour >= 12 ? 'PM' : 'AM'}
                      </span>
                    </div>
                    
                    <div className="flex flex-1 divide-x divide-gray-100">
                      {technicians.map(tech => {
                        const hourApps = getTechAppointmentsForHour(tech.id, hour);
                        const hourBlocked = getTechBlockedForHour(tech.id, hour);
                        const isWorking = technicianAvailabilityRules.some(r => r.technicianId === tech.id && r.dayOfWeek === currentDate.getDay() && r.enabled);
                        
                        return (
                          <div key={tech.id} className={cn(
                            "flex-1 p-2 min-w-[200px] relative group/cell",
                            !isWorking && "bg-gray-50/50"
                          )}>
                            {hourApps.map(app => {
                              const ticket = tickets.find(t => t.id === app.ticketId);
                              if (!ticket) return null;
                              
                              return (
                                <motion.div 
                                  key={app.id}
                                  layoutId={app.id}
                                  onClick={() => setSelectedTicket(ticket)}
                                  className={cn(
                                    "mb-2 p-3 rounded-xl border shadow-sm cursor-pointer transition-all hover:shadow-md",
                                    app.status === 'confirmed' ? "bg-blue-50 border-blue-100 text-blue-900" : "bg-amber-50 border-amber-100 text-amber-900"
                                  )}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <h4 className="text-[10px] font-bold truncate pr-1">{ticket.title}</h4>
                                    {app.status === 'confirmed' ? <CheckCircle2 className="w-3 h-3 text-blue-500" /> : <Clock className="w-3 h-3 text-amber-500" />}
                                  </div>
                                  <div className="flex items-center gap-1 text-[8px] opacity-70">
                                    <MapPin className="w-2.5 h-2.5" />
                                    <span className="truncate">{ticket.serviceAddress}</span>
                                  </div>
                                </motion.div>
                              );
                            })}

                            {hourBlocked.map(slot => (
                              <div key={slot.id} className="mb-2 p-2 rounded-xl bg-gray-100 border border-gray-200 text-gray-500 flex items-center gap-2">
                                <Shield className="w-3 h-3" />
                                <span className="text-[10px] font-bold truncate">{slot.title}</span>
                              </div>
                            ))}

                            {hourApps.length === 0 && hourBlocked.length === 0 && isWorking && (
                              <div className="h-full w-full flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity">
                                <button className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors">
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 shrink-0 flex flex-col gap-6">
          {/* Conflicts Panel */}
          {conflicts.length > 0 && (
            <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-xl">
              <ScheduleConflictPanel conflicts={conflicts} />
            </div>
          )}

          {/* Unscheduled Sidebar */}
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl flex flex-col flex-1 overflow-hidden">
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
                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">#{ticket.id?.slice(-4)}</span>
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
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setProposalTicket(ticket);
                      setShowProposalModal(true);
                    }}
                    className="w-full rounded-lg bg-blue-600 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-sm hover:bg-blue-700 transition-colors"
                  >
                    Propose Slot
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

      {showProposalModal && proposalTicket && (
        <AppointmentProposalModal
          ticket={proposalTicket}
          onClose={() => {
            setShowProposalModal(false);
            setProposalTicket(null);
          }}
        />
      )}
    </div>
  );
};
