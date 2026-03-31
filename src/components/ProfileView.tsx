import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { User, Bell, Lock, CreditCard, CheckCircle2, X } from 'lucide-react';
import { cn } from '../lib/utils';

export const ProfileView: React.FC = () => {
  const { currentUser, role, updateCurrentUserProfile } = useApp();
  const [showToast, setShowToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: currentUser?.fullName || '',
    phone: currentUser?.phone || '',
    companyName: currentUser?.companyName || '',
    billingAddress: currentUser?.billingAddress || '',
    notes: currentUser?.notes || '',
    preferredContactMethod: currentUser?.preferredContactMethod || 'email',
    specialties: currentUser?.specialties || [],
  });
  
  const [newSpecialty, setNewSpecialty] = useState('');

  useEffect(() => {
    if (currentUser) {
      setFormData({
        fullName: currentUser.fullName || '',
        phone: currentUser.phone || '',
        companyName: currentUser.companyName || '',
        billingAddress: currentUser.billingAddress || '',
        notes: currentUser.notes || '',
        preferredContactMethod: currentUser.preferredContactMethod || 'email',
        specialties: currentUser.specialties || [],
      });
    }
  }, [currentUser]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateCurrentUserProfile(formData);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error("Failed to update profile", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSpecialty = () => {
    if (newSpecialty.trim() && !formData.specialties.includes(newSpecialty.trim())) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty.trim()]
      }));
      setNewSpecialty('');
    }
  };

  const handleRemoveSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter((s: string) => s !== specialty)
    }));
  };

  const sections = [
    { title: 'Personal Information', icon: User },
    // Removed fake sections that don't do anything
  ];

  if (!currentUser) return null;

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
            {currentUser.fullName?.charAt(0) || 'U'}
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
              <input 
                type="text" 
                className="w-full rounded-xl border-gray-200 text-sm" 
                value={formData.fullName} 
                onChange={e => setFormData({...formData, fullName: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Email Address (Read-only)</label>
              <input 
                type="email" 
                className="w-full rounded-xl border-gray-200 text-sm bg-gray-50 text-gray-500 cursor-not-allowed" 
                value={currentUser.email} 
                readOnly 
                disabled
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Phone Number</label>
              <input 
                type="text" 
                className="w-full rounded-xl border-gray-200 text-sm" 
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            
            {role === 'CLIENT' && (
              <>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Company Name</label>
                  <input 
                    type="text" 
                    className="w-full rounded-xl border-gray-200 text-sm" 
                    value={formData.companyName} 
                    onChange={e => setFormData({...formData, companyName: e.target.value})}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Billing Address</label>
                  <textarea 
                    className="w-full rounded-xl border-gray-200 text-sm" 
                    rows={3} 
                    value={formData.billingAddress} 
                    onChange={e => setFormData({...formData, billingAddress: e.target.value})}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Preferred Contact Method</label>
                  <select 
                    className="w-full rounded-xl border-gray-200 text-sm"
                    value={formData.preferredContactMethod}
                    onChange={e => setFormData({...formData, preferredContactMethod: e.target.value})}
                  >
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="text">Text Message</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Notes</label>
                  <textarea 
                    className="w-full rounded-xl border-gray-200 text-sm" 
                    rows={3} 
                    value={formData.notes} 
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
              </>
            )}
            
            {role === 'TECHNICIAN' && (
              <>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Specialties</label>
                  <div className="flex flex-wrap gap-2 mt-2 mb-3">
                    {formData.specialties.map((s: string) => (
                      <span key={s} className="flex items-center gap-1 rounded-lg bg-blue-50 pl-3 pr-2 py-1 text-xs font-bold text-blue-700 border border-blue-100">
                        {s}
                        <button onClick={() => handleRemoveSpecialty(s)} className="text-blue-400 hover:text-blue-700">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      className="flex-1 rounded-xl border-gray-200 text-sm" 
                      placeholder="Add a specialty..."
                      value={newSpecialty}
                      onChange={e => setNewSpecialty(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddSpecialty()}
                    />
                    <button 
                      onClick={handleAddSpecialty}
                      className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
                    >
                      Add
                    </button>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Notes</label>
                  <textarea 
                    className="w-full rounded-xl border-gray-200 text-sm" 
                    rows={3} 
                    value={formData.notes} 
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
              </>
            )}
          </div>
          <div className="pt-6 border-t border-gray-100 flex justify-end">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-xl bg-blue-600 px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-100 active:scale-95 transition-transform disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
