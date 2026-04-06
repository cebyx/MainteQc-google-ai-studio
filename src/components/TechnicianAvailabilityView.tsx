import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, Plus, Trash2, Edit2, CheckCircle2, XCircle, AlertCircle, User, Shield, Briefcase, Coffee, Plane, UserX } from 'lucide-react';
import { useApp } from '../AppContext';
import { Technician, TechnicianAvailabilityRule, BlockedSlot } from '../types';
import { format, parseISO, startOfToday, isAfter, isBefore, addDays } from 'date-fns';

export const TechnicianAvailabilityView: React.FC = () => {
  const { technicians, technicianAvailabilityRules, technicianBlockedSlots, updateTechnicianAvailabilityRule, createBlockedSlot, updateBlockedSlot, removeBlockedSlot } = useApp();
  const [selectedTechId, setSelectedTechId] = useState<string>(technicians[0]?.id || '');
  const [isAddingBlocked, setIsAddingBlocked] = useState(false);
  const [editingBlockedId, setEditingBlockedId] = useState<string | null>(null);
  const [newBlocked, setNewBlocked] = useState<Partial<BlockedSlot>>({
    type: 'pto',
    startTime: format(new Date(), "yyyy-MM-dd'T'09:00"),
    endTime: format(new Date(), "yyyy-MM-dd'T'17:00"),
    title: ''
  });

  const selectedTech = technicians.find(t => t.id === selectedTechId);
  const techRules = technicianAvailabilityRules.filter(r => r.technicianId === selectedTechId);
  const techBlocked = technicianBlockedSlots.filter(s => s.technicianId === selectedTechId);

  const daysOfWeek = [
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
    { id: 6, name: 'Saturday' },
    { id: 0, name: 'Sunday' }
  ];

  const handleToggleDay = async (dayOfWeek: number, enabled: boolean) => {
    const existingRule = techRules.find(r => r.dayOfWeek === dayOfWeek);
    await updateTechnicianAvailabilityRule({
      id: existingRule?.id,
      technicianId: selectedTechId,
      dayOfWeek,
      startTime: existingRule?.startTime || '09:00',
      endTime: existingRule?.endTime || '17:00',
      enabled
    });
  };

  const handleUpdateTime = async (dayOfWeek: number, field: 'startTime' | 'endTime', value: string) => {
    const existingRule = techRules.find(r => r.dayOfWeek === dayOfWeek);
    if (!existingRule) return;
    await updateTechnicianAvailabilityRule({
      ...existingRule,
      [field]: value
    });
  };

  const handleSaveBlocked = async () => {
    if (!newBlocked.title || !newBlocked.startTime || !newBlocked.endTime) return;
    
    if (editingBlockedId) {
      await updateBlockedSlot(editingBlockedId, newBlocked);
    } else {
      await createBlockedSlot({
        ...newBlocked as Omit<BlockedSlot, 'id'>,
        technicianId: selectedTechId
      });
    }
    
    setIsAddingBlocked(false);
    setEditingBlockedId(null);
    setNewBlocked({
      type: 'pto',
      startTime: format(new Date(), "yyyy-MM-dd'T'09:00"),
      endTime: format(new Date(), "yyyy-MM-dd'T'17:00"),
      title: ''
    });
  };

  const getBlockedIcon = (type: string) => {
    switch (type) {
      case 'pto': return <Plane className="w-4 h-4" />;
      case 'lunch': return <Coffee className="w-4 h-4" />;
      case 'break': return <Coffee className="w-4 h-4" />;
      case 'personal': return <User className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Technician Availability</h1>
          <p className="text-gray-500">Manage working hours and time off for your field team.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl shadow-sm border border-gray-100">
          <User className="w-4 h-4 text-gray-400 ml-2" />
          <select
            value={selectedTechId}
            onChange={(e) => setSelectedTechId(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 pr-8"
          >
            {technicians.map(tech => (
              <option key={tech.id} value={tech.id}>{tech.fullName}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Schedule */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                Weekly Working Hours
              </h2>
            </div>
            <div className="divide-y divide-gray-50">
              {daysOfWeek.map(day => {
                const rule = techRules.find(r => r.dayOfWeek === day.id);
                const isEnabled = rule?.enabled ?? false;

                return (
                  <div key={day.id} className={`p-4 flex items-center justify-between transition-colors ${isEnabled ? 'bg-white' : 'bg-gray-50/30'}`}>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleToggleDay(day.id, !isEnabled)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${isEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isEnabled ? 'left-7' : 'left-1'}`} />
                      </button>
                      <span className={`font-medium ${isEnabled ? 'text-gray-900' : 'text-gray-400'}`}>{day.name}</span>
                    </div>

                    <div className={`flex items-center gap-3 ${!isEnabled && 'opacity-30 pointer-events-none'}`}>
                      <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <input
                          type="time"
                          value={rule?.startTime || '09:00'}
                          onChange={(e) => handleUpdateTime(day.id, 'startTime', e.target.value)}
                          className="bg-transparent border-none p-0 text-sm font-medium focus:ring-0"
                        />
                      </div>
                      <span className="text-gray-400">to</span>
                      <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <input
                          type="time"
                          value={rule?.endTime || '17:00'}
                          onChange={(e) => handleUpdateTime(day.id, 'endTime', e.target.value)}
                          className="bg-transparent border-none p-0 text-sm font-medium focus:ring-0"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Blocked Time / PTO */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-500" />
                Blocked Time & PTO
              </h2>
              <button
                onClick={() => setIsAddingBlocked(true)}
                className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-blue-600"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <AnimatePresence mode="popLayout">
                {(isAddingBlocked || editingBlockedId) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-blue-900">{editingBlockedId ? 'Edit Blocked Slot' : 'Add Blocked Slot'}</h3>
                      <button onClick={() => { setIsAddingBlocked(false); setEditingBlockedId(null); }} className="text-blue-400 hover:text-blue-600">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Title (e.g. Dentist Appointment)"
                      value={newBlocked.title}
                      onChange={(e) => setNewBlocked({ ...newBlocked, title: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={newBlocked.type}
                        onChange={(e) => setNewBlocked({ ...newBlocked, type: e.target.value as any })}
                        className="px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="pto">PTO / Vacation</option>
                        <option value="lunch">Lunch Break</option>
                        <option value="personal">Personal</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-blue-700 uppercase">Starts</label>
                        <input
                          type="datetime-local"
                          value={newBlocked.startTime}
                          onChange={(e) => setNewBlocked({ ...newBlocked, startTime: e.target.value })}
                          className="px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-blue-700 uppercase">Ends</label>
                        <input
                          type="datetime-local"
                          value={newBlocked.endTime}
                          onChange={(e) => setNewBlocked({ ...newBlocked, endTime: e.target.value })}
                          className="px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleSaveBlocked}
                      className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors"
                    >
                      Save Blocked Time
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-3">
                {techBlocked.length === 0 ? (
                  <div className="text-center py-8">
                    <UserX className="w-12 h-12 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No blocked time scheduled.</p>
                  </div>
                ) : (
                  techBlocked
                    .sort((a, b) => parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime())
                    .map(slot => (
                      <div key={slot.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            slot.type === 'pto' ? 'bg-purple-100 text-purple-600' :
                            slot.type === 'lunch' ? 'bg-orange-100 text-orange-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {getBlockedIcon(slot.type)}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-900">{slot.title}</h4>
                            <p className="text-[10px] text-gray-500">
                              {format(parseISO(slot.startTime), 'MMM d, h:mm a')} - {format(parseISO(slot.endTime), 'h:mm a')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingBlockedId(slot.id!);
                              setNewBlocked(slot);
                            }}
                            className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeBlockedSlot(slot.id!)}
                            className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
