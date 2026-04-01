import React, { useState, useMemo } from 'react';
import { useApp } from '../AppContext';
import { MapPin, User, ChevronRight, Plus, Search, Home, Building, X, Edit2 } from 'lucide-react';
import { Property } from '../types';
import { cn } from '../lib/utils';

export const PropertiesListView: React.FC = () => {
  const { properties, clients, tickets, createProperty, updateProperty } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [selectedPropertyForHistory, setSelectedPropertyForHistory] = useState<Property | null>(null);
  const [formData, setFormData] = useState<Partial<Property>>({});

  const filteredProperties = useMemo(() => {
    return properties.filter(p => 
      p.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.clientName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [properties, searchQuery]);

  const openCreateModal = () => {
    setEditingProperty(null);
    setFormData({
      clientId: '',
      clientName: '',
      nickname: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      propertyType: 'residential',
      accessInstructions: '',
      propertyNotes: '',
      petsOrOnsiteNotes: '',
      parkingNotes: '',
      gateOrEntryNotes: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (property: Property) => {
    setEditingProperty(property);
    setFormData({ ...property });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.clientId || !formData.address || !formData.nickname) return;
    
    const client = clients.find(c => c.id === formData.clientId);
    if (!client) return;

    const propertyData = {
      ...formData,
      clientName: client.fullName
    };
    
    if (editingProperty) {
      await updateProperty(editingProperty.id, propertyData);
    } else {
      await createProperty(propertyData as Omit<Property, 'id'>);
    }
    setIsModalOpen(false);
  };

  const propertyTickets = useMemo(() => {
    if (!selectedPropertyForHistory) return [];
    return tickets.filter(t => t.propertyId === selectedPropertyForHistory.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [selectedPropertyForHistory, tickets]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-gray-900">Properties</h2>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-100 hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add New Property
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input 
          type="text" 
          placeholder="Search properties by address, nickname, or client..." 
          className="h-11 w-full rounded-xl border-gray-200 pl-10 text-sm focus:ring-blue-500"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProperties.map(prop => {
          const openTickets = tickets.filter(t => t.propertyId === prop.id && !['completed', 'cancelled', 'rejected', 'unable_to_complete'].includes(t.status));
          
          return (
            <div key={prop.id} className="group relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-200">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    {prop.propertyType === 'commercial' ? <Building className="h-5 w-5" /> : <Home className="h-5 w-5" />}
                  </div>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    {prop.propertyType}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => openEditModal(prop)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-gray-900 text-lg mb-1">{prop.nickname}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="truncate">{prop.address}, {prop.city}</span>
              </div>

              <div className="space-y-3 border-t border-gray-50 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{prop.clientName}</span>
                  </div>
                  {openTickets.length > 0 && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600 uppercase tracking-widest">
                      {openTickets.length} Open {openTickets.length === 1 ? 'Ticket' : 'Tickets'}
                    </span>
                  )}
                </div>
                {prop.accessInstructions && (
                  <div className="rounded-xl bg-gray-50 p-3">
                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Access</div>
                    <div className="text-xs text-gray-600 line-clamp-2 italic">"{prop.accessInstructions}"</div>
                  </div>
                )}
                <button 
                  onClick={() => setSelectedPropertyForHistory(prop)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-100 bg-gray-50/50 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  View History
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {editingProperty ? 'Edit Property' : 'Add New Property'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-2 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Client *</label>
                <select 
                  className="w-full rounded-xl border-gray-200 text-sm"
                  value={formData.clientId || ''}
                  onChange={e => setFormData({...formData, clientId: e.target.value})}
                  disabled={!!editingProperty}
                >
                  <option value="">Select a client...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.fullName} {c.companyName ? `(${c.companyName})` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nickname *</label>
                <input 
                  type="text" 
                  className="w-full rounded-xl border-gray-200 text-sm" 
                  value={formData.nickname || ''}
                  onChange={e => setFormData({...formData, nickname: e.target.value})}
                  placeholder="e.g. Main Office, Downtown Condo"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Street Address *</label>
                <input 
                  type="text" 
                  className="w-full rounded-xl border-gray-200 text-sm" 
                  value={formData.address || ''}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">City *</label>
                <input 
                  type="text" 
                  className="w-full rounded-xl border-gray-200 text-sm" 
                  value={formData.city || ''}
                  onChange={e => setFormData({...formData, city: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">State & Zip</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    className="w-1/3 rounded-xl border-gray-200 text-sm" 
                    placeholder="State"
                    value={formData.state || ''}
                    onChange={e => setFormData({...formData, state: e.target.value})}
                  />
                  <input 
                    type="text" 
                    className="w-2/3 rounded-xl border-gray-200 text-sm" 
                    placeholder="Zip"
                    value={formData.zip || ''}
                    onChange={e => setFormData({...formData, zip: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Property Type</label>
                <select 
                  className="w-full rounded-xl border-gray-200 text-sm"
                  value={formData.propertyType || 'residential'}
                  onChange={e => setFormData({...formData, propertyType: e.target.value as any})}
                >
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Access Instructions</label>
                <textarea 
                  className="w-full rounded-xl border-gray-200 text-sm" 
                  rows={2}
                  placeholder="Gate codes, key locations, etc."
                  value={formData.accessInstructions || ''}
                  onChange={e => setFormData({...formData, accessInstructions: e.target.value})}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notes</label>
                <textarea 
                  className="w-full rounded-xl border-gray-200 text-sm" 
                  rows={2}
                  value={formData.propertyNotes || ''}
                  onChange={e => setFormData({...formData, propertyNotes: e.target.value})}
                />
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
                disabled={!formData.clientId || !formData.address || !formData.nickname}
                className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-100 hover:bg-blue-700 disabled:opacity-50"
              >
                {editingProperty ? 'Save Changes' : 'Create Property'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {selectedPropertyForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Service History</h3>
                <p className="text-sm text-gray-500">{selectedPropertyForHistory.nickname} • {selectedPropertyForHistory.address}</p>
              </div>
              <button onClick={() => setSelectedPropertyForHistory(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="h-6 w-6 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {propertyTickets.length > 0 ? (
                propertyTickets.map(ticket => (
                  <div key={ticket.id} className="p-4 rounded-2xl border border-gray-100 hover:border-blue-100 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">#{ticket.id.slice(-6)}</span>
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                        ticket.status === 'completed' ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                      )}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">{ticket.title}</h4>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                      {ticket.scheduledDate && <span>Scheduled: {ticket.scheduledDate}</span>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500 italic">No service history for this property.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
