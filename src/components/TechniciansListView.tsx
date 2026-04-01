import React, { useState, useMemo } from 'react';
import { useApp } from '../AppContext';
import { Search, Plus, Phone, Mail, Wrench, Circle, X, Edit2, History, Calendar, MapPin, Users } from 'lucide-react';
import { Technician, Ticket } from '../types';
import { cn, formatDate } from '../lib/utils';
import { StatusBadge } from './Badges';

export const TechniciansListView: React.FC = () => {
  const { technicians, tickets, createTechnician, updateTechnician } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTech, setEditingTech] = useState<Technician | null>(null);
  const [formData, setFormData] = useState<Partial<Technician>>({});
  const [specialtyInput, setSpecialtyInput] = useState('');
  const [historyTech, setHistoryTech] = useState<Technician | null>(null);

  const techHistory = useMemo(() => {
    if (!historyTech) return [];
    return tickets
      .filter(t => t.assignedTechnicianId === historyTech.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [historyTech, tickets]);

  const filteredTechnicians = useMemo(() => {
    return technicians.filter(tech => 
      tech.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tech.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tech.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [technicians, searchTerm]);

  const openCreateModal = () => {
    setEditingTech(null);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      specialties: [],
      status: 'available'
    });
    setSpecialtyInput('');
    setIsModalOpen(true);
  };

  const openEditModal = (tech: Technician) => {
    setEditingTech(tech);
    setFormData({ ...tech });
    setSpecialtyInput('');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.fullName || !formData.email) return;
    
    if (editingTech) {
      await updateTechnician(editingTech.id, formData);
    } else {
      await createTechnician(formData as Omit<Technician, 'id'>);
    }
    setIsModalOpen(false);
  };

  const addSpecialty = () => {
    if (specialtyInput.trim() && !formData.specialties?.includes(specialtyInput.trim())) {
      setFormData({
        ...formData,
        specialties: [...(formData.specialties || []), specialtyInput.trim()]
      });
      setSpecialtyInput('');
    }
  };

  const removeSpecialty = (spec: string) => {
    setFormData({
      ...formData,
      specialties: formData.specialties?.filter(s => s !== spec) || []
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Technicians</h1>
          <p className="text-gray-500 mt-1">Manage your field service team</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-xl active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Add Technician
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search technicians by name, email, or specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border-gray-200 pl-10 py-3 text-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTechnicians.map((tech) => {
          const activeJobs = tickets.filter(t => t.assignedTechnicianId === tech.id && !['completed', 'cancelled', 'rejected', 'unable_to_complete'].includes(t.status));
          
          return (
            <div key={tech.id} className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-lg">
                    {tech.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{tech.fullName}</h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Circle className={cn(
                        "h-2 w-2 fill-current",
                        tech.status === 'available' ? "text-green-500" :
                        tech.status === 'busy' ? "text-amber-500" : "text-gray-400"
                      )} />
                      <span className="text-xs font-medium text-gray-500 capitalize">{tech.status}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => openEditModal(tech)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Phone className="h-4 w-4 text-gray-400" />
                  {tech.phone || 'No phone'}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="truncate">{tech.email}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <Wrench className="h-3.5 w-3.5" />
                    Specialties
                  </div>
                  <div className="flex items-center gap-2">
                    {activeJobs.length > 0 && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600 uppercase tracking-widest">
                        {activeJobs.length} Active {activeJobs.length === 1 ? 'Job' : 'Jobs'}
                      </span>
                    )}
                    <button 
                      onClick={() => setHistoryTech(tech)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="View Job History"
                    >
                      <History className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tech.specialties.map((specialty, idx) => (
                    <span key={idx} className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                      {specialty}
                    </span>
                  ))}
                  {tech.specialties.length === 0 && (
                    <span className="text-xs text-gray-400 italic">No specialties listed</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filteredTechnicians.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">
            No technicians found matching your search.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {editingTech ? 'Edit Technician' : 'Add New Technician'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-2 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name *</label>
                <input 
                  type="text" 
                  className="w-full rounded-xl border-gray-200 text-sm" 
                  value={formData.fullName || ''}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email *</label>
                <input 
                  type="email" 
                  className="w-full rounded-xl border-gray-200 text-sm" 
                  value={formData.email || ''}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  disabled={!!editingTech}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
                <input 
                  type="text" 
                  className="w-full rounded-xl border-gray-200 text-sm" 
                  value={formData.phone || ''}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                <select 
                  className="w-full rounded-xl border-gray-200 text-sm"
                  value={formData.status || 'available'}
                  onChange={e => setFormData({...formData, status: e.target.value as any})}
                >
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Specialties</label>
                <div className="flex gap-2 mb-2">
                  <input 
                    type="text" 
                    className="flex-1 rounded-xl border-gray-200 text-sm" 
                    placeholder="e.g. Plumbing, HVAC, Electrical"
                    value={specialtyInput}
                    onChange={e => setSpecialtyInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                  />
                  <button 
                    onClick={addSpecialty}
                    type="button"
                    className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-200"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.specialties?.map((spec, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-sm font-medium text-blue-700">
                      {spec}
                      <button onClick={() => removeSpecialty(spec)} className="text-blue-400 hover:text-blue-600">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={!formData.fullName || !formData.email}
                className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-100 hover:bg-blue-700 disabled:opacity-50"
              >
                {editingTech ? 'Save Changes' : 'Create Technician'}
              </button>
            </div>
          </div>
        </div>
      )}

      {historyTech && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl max-h-[80vh] flex flex-col">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Job History</h3>
                <p className="text-sm text-gray-500">{historyTech.fullName}</p>
              </div>
              <button onClick={() => setHistoryTech(null)} className="rounded-full p-2 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
              {techHistory.length > 0 ? (
                <div className="space-y-3">
                  {techHistory.map(ticket => (
                    <div key={ticket.id} className="rounded-xl border border-gray-100 p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-bold text-gray-900">{ticket.title}</div>
                        <StatusBadge status={ticket.status} />
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(ticket.createdAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {ticket.propertyNickname}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {ticket.clientName}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 italic">
                  No job history found for this technician.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
