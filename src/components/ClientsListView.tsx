import React from 'react';
import { useApp } from '../AppContext';
import { Users, Mail, Phone, MapPin, ChevronRight, Plus, Search, Filter } from 'lucide-react';

export const ClientsListView: React.FC = () => {
  const { clients } = useApp();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-gray-900">Clients</h2>
        <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-100">
          <Plus className="h-4 w-4" />
          Add New Client
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search clients by name, email, or company..." className="h-11 w-full rounded-xl border-gray-200 pl-10 text-sm focus:ring-blue-500" />
        </div>
        <button className="flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 hover:bg-gray-50">
          <Filter className="h-4 w-4" />
          Filter
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {clients.map(client => (
          <div key={client.id} className="group relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-200">
            <div className="mb-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                {client.fullName.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{client.fullName}</h3>
                <div className="text-xs text-gray-500">{client.companyName || 'Individual'}</div>
              </div>
            </div>

            <div className="space-y-3 border-t border-gray-50 pt-4">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Mail className="h-4 w-4 text-gray-400" />
                {client.email}
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Phone className="h-4 w-4 text-gray-400" />
                {client.phone}
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="truncate">{client.billingAddress}</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex gap-2">
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 uppercase tracking-widest">2 Properties</span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Active</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
