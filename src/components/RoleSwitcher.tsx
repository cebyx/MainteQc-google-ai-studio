import React from 'react';
import { useApp } from '../AppContext';
import { UserRole } from '../types';
import { Shield, Wrench, User, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

export const RoleSwitcher: React.FC = () => {
  const { role, setRole } = useApp();

  const roles: { id: UserRole; label: string; icon: any; description: string }[] = [
    { id: 'ADMIN', label: 'Admin', icon: Shield, description: 'Dispatch & Operations' },
    { id: 'TECHNICIAN', label: 'Technician', icon: Wrench, description: 'Field Workflow' },
    { id: 'CLIENT', label: 'Client', icon: User, description: 'Customer Portal' },
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="group relative">
        <button className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform hover:scale-110 active:scale-95">
          <ChevronRight className={cn("h-6 w-6 transition-transform", role && "rotate-180")} />
        </button>
        
        <div className="absolute bottom-full right-0 mb-4 hidden w-64 flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-2xl group-hover:flex">
          <div className="mb-1 px-2 text-xs font-bold uppercase tracking-wider text-gray-400">
            Switch Demo Role
          </div>
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => setRole(r.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors",
                role === r.id ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50 text-gray-700"
              )}
            >
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md",
                role === r.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"
              )}>
                <r.icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">{r.label}</div>
                <div className="text-[10px] opacity-70">{r.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
