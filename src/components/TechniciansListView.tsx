import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { Search, Filter, Plus, User, Phone, Mail, MapPin, Star, Wrench, Circle } from 'lucide-react';
import { cn } from '../lib/utils';

export const TechniciansListView: React.FC = () => {
  const { technicians } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTechnicians = technicians.filter(tech => 
    tech.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tech.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tech.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Technicians</h1>
          <p className="text-gray-500 mt-1">Manage your field service team</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-xl active:scale-95">
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
        <button className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50">
          <Filter className="h-4 w-4" />
          Filters
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTechnicians.map((tech) => (
          <div key={tech.id} className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-200 cursor-pointer">
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
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Phone className="h-4 w-4 text-gray-400" />
                {tech.phone}
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Mail className="h-4 w-4 text-gray-400" />
                {tech.email}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <Wrench className="h-3.5 w-3.5" />
                Specialties
              </div>
              <div className="flex flex-wrap gap-2">
                {tech.specialties.map((specialty, idx) => (
                  <span key={idx} className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
        {filteredTechnicians.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">
            No technicians found matching your search.
          </div>
        )}
      </div>
    </div>
  );
};
