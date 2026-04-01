import React, { useState, useMemo } from 'react';
import { useApp } from '../AppContext';
import { Users, Mail, Phone, MapPin, ChevronRight, Plus, Search, X, Edit2, History, Calendar } from 'lucide-react';
import { Client, Ticket } from '../types';
import { cn, formatDate } from '../lib/utils';
import { StatusBadge } from './Badges';

export const ClientsListView: React.FC = () => {
  const { clients, properties, tickets, createClient, updateClient } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<Partial<Client>>({});
  const [historyClient, setHistoryClient] = useState<Client | null>(null);

  const clientHistory = useMemo(() => {
    if (!historyClient) return [];
    return tickets
      .filter(t => t.clientId === historyClient.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [historyClient, tickets]);

  const filteredClients = useMemo(() => {
    return clients.filter(c => 
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.companyName && c.companyName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [clients, searchQuery]);

  const openCreateModal = () => {
    setEditingClient(null);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      companyName: '',
      billingAddress: '',
      notes: '',
      status: 'active',
      preferredContactMethod: 'email'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFormData({ ...client });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.fullName || !formData.email) return;
    
    if (editingClient) {
      await updateClient(editingClient.id, formData);
    } else {
      await createClient(formData as Omit<Client, 'id'>);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-gray-900">Clients</h2>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-100 hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add New Client
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search clients by name, email, or company..." 
            className="h-11 w-full rounded-xl border-gray-200 pl-10 text-sm focus:ring-blue-500"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredClients.map(client => {
          const clientProps = properties.filter(p => p.clientId === client.id);
          const openTickets = tickets.filter(t => t.clientId === client.id && !['completed', 'cancelled', 'rejected', 'unable_to_complete'].includes(t.status));
          
          return (
            <div key={client.id} className="group relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-200">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                    {client.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{client.fullName}</h3>
                    <div className="text-xs text-gray-500">{client.companyName || 'Individual'}</div>
                  </div>
                </div>
                <button 
                  onClick={() => openEditModal(client)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 border-t border-gray-50 pt-4">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="truncate">{client.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Phone className="h-4 w-4 text-gray-400" />
                  {client.phone || 'No phone'}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="truncate">{client.billingAddress || 'No address'}</span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                    {clientProps.length} {clientProps.length === 1 ? 'Property' : 'Properties'}
                  </span>
                  {openTickets.length > 0 && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600 uppercase tracking-widest">
                      {openTickets.length} Open {openTickets.length === 1 ? 'Ticket' : 'Tickets'}
                    </span>
                  )}
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest",
                    client.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-600"
                  )}>
                    {client.status || 'Active'}
                  </span>
                </div>
                <button 
                  onClick={() => setHistoryClient(client)}
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  <History className="h-3 w-3" />
                  History
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
                {editingClient ? 'Edit Client' : 'Add New Client'}
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
                  disabled={!!editingClient}
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
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Company Name</label>
                <input 
                  type="text" 
                  className="w-full rounded-xl border-gray-200 text-sm" 
                  value={formData.companyName || ''}
                  onChange={e => setFormData({...formData, companyName: e.target.value})}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Billing Address</label>
                <input 
                  type="text" 
                  className="w-full rounded-xl border-gray-200 text-sm" 
                  value={formData.billingAddress || ''}
                  onChange={e => setFormData({...formData, billingAddress: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                <select 
                  className="w-full rounded-xl border-gray-200 text-sm"
                  value={formData.status || 'active'}
                  onChange={e => setFormData({...formData, status: e.target.value as any})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Preferred Contact</label>
                <select 
                  className="w-full rounded-xl border-gray-200 text-sm"
                  value={formData.preferredContactMethod || 'email'}
                  onChange={e => setFormData({...formData, preferredContactMethod: e.target.value as any})}
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="text">Text</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notes</label>
                <textarea 
                  className="w-full rounded-xl border-gray-200 text-sm" 
                  rows={3}
                  value={formData.notes || ''}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
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
                disabled={!formData.fullName || !formData.email}
                className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-100 hover:bg-blue-700 disabled:opacity-50"
              >
                {editingClient ? 'Save Changes' : 'Create Client'}
              </button>
            </div>
          </div>
        </div>
      )}

      {historyClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl max-h-[80vh] flex flex-col">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Service History</h3>
                <p className="text-sm text-gray-500">{historyClient.fullName}</p>
              </div>
              <button onClick={() => setHistoryClient(null)} className="rounded-full p-2 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
              {clientHistory.length > 0 ? (
                <div className="space-y-3">
                  {clientHistory.map(ticket => (
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
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 italic">
                  No service history found for this client.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

