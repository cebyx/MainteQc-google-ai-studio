import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { User, Mail, Phone, MapPin, Shield, Wrench, CreditCard, Bell, Lock, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

export const ProfileView: React.FC = () => {
  const { currentUser, role } = useApp();
  const [showToast, setShowToast] = useState(false);

  const handleSave = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const sections = [
    { title: 'Personal Information', icon: User },
    { title: 'Contact Settings', icon: Bell },
    { title: 'Security', icon: Lock },
    { title: 'Billing & Payments', icon: CreditCard },
  ];

  return (
    <div className="max-w-4xl space-y-8 relative">
      {showToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-bold text-white shadow-xl animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          Profile updated successfully
        </div>
      )}

      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between rounded-3xl bg-white p-8 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-3xl shadow-inner">
            {currentUser.fullName.charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{currentUser.fullName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-widest">
                {role}
              </span>
              <span className="text-sm text-gray-500">{currentUser.email}</span>
            </div>
          </div>
        </div>
        <button 
          onClick={handleSave}
          className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-100 active:scale-95 transition-transform"
        >
          Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-2">
          {sections.map(s => (
            <button key={s.title} className={cn(
              "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all",
              s.title === 'Personal Information' ? "bg-blue-50 text-blue-700 font-bold" : "text-gray-600 hover:bg-gray-50"
            )}>
              <s.icon className="h-5 w-5" />
              <span className="text-sm">{s.title}</span>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2 space-y-6 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Full Name</label>
              <input type="text" className="w-full rounded-xl border-gray-200 text-sm" defaultValue={currentUser.fullName} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Email Address</label>
              <input type="email" className="w-full rounded-xl border-gray-200 text-sm" defaultValue={currentUser.email} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Phone Number</label>
              <input type="text" className="w-full rounded-xl border-gray-200 text-sm" defaultValue={currentUser.phone} />
            </div>
            {role === 'CLIENT' && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Billing Address</label>
                <textarea className="w-full rounded-xl border-gray-200 text-sm" rows={3} defaultValue={currentUser.billingAddress} />
              </div>
            )}
            {role === 'TECHNICIAN' && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Specialties</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {currentUser.specialties.map((s: string) => (
                    <span key={s} className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-100">
                      {s}
                    </span>
                  ))}
                  <button className="rounded-lg border border-dashed border-gray-300 px-3 py-1 text-xs font-bold text-gray-400 hover:border-blue-400 hover:text-blue-500">
                    + Add
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="pt-6 border-t border-gray-100 flex justify-end">
            <button 
              onClick={handleSave}
              className="rounded-xl bg-blue-600 px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-100 active:scale-95 transition-transform"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
