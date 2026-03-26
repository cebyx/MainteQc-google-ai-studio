import React from 'react';
import { useApp } from '../AppContext';
import { MapPin, User, ChevronRight, Plus, Search, Home, Building } from 'lucide-react';

export const PropertiesListView: React.FC = () => {
  const { properties } = useApp();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-gray-900">Properties</h2>
        <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-100">
          <Plus className="h-4 w-4" />
          Add New Property
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Search properties by address or nickname..." className="h-11 w-full rounded-xl border-gray-200 pl-10 text-sm focus:ring-blue-500" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map(prop => (
          <div key={prop.id} className="group relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-200">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                {prop.propertyType === 'commercial' ? <Building className="h-5 w-5" /> : <Home className="h-5 w-5" />}
              </div>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                {prop.propertyType}
              </span>
            </div>

            <h3 className="font-bold text-gray-900 text-lg mb-1">{prop.nickname}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{prop.address}, {prop.city}</span>
            </div>

            <div className="space-y-3 border-t border-gray-50 pt-4">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <User className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{prop.clientName}</span>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Access</div>
                <div className="text-xs text-gray-600 line-clamp-1 italic">"{prop.accessInstructions}"</div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end">
              <button className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
                View History <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
