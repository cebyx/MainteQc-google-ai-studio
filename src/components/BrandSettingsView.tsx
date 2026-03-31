import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { Settings, Palette, Globe, Clock, ShieldCheck, Mail, Phone, MapPin, CheckCircle2 } from 'lucide-react';

export const BrandSettingsView: React.FC = () => {
  const { brand, setBrand, saveBrandSettings } = useApp();
  const [showToast, setShowToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveBrandSettings(brand);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error("Failed to save brand settings", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 relative">
      {showToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-bold text-white shadow-xl animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          Brand settings saved successfully
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <h3 className="text-lg font-bold text-gray-900">Company Identity</h3>
          <p className="text-sm text-gray-500">Manage your white-label branding and public information.</p>
        </div>
        <div className="lg:col-span-2 space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Company Name</label>
              <input 
                type="text" 
                className="w-full rounded-xl border-gray-200 text-sm" 
                value={brand.companyName}
                onChange={(e) => setBrand({ ...brand, companyName: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Tagline</label>
              <input 
                type="text" 
                className="w-full rounded-xl border-gray-200 text-sm" 
                value={brand.tagline}
                onChange={(e) => setBrand({ ...brand, tagline: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Support Email</label>
              <input 
                type="email" 
                className="w-full rounded-xl border-gray-200 text-sm" 
                value={brand.email}
                onChange={(e) => setBrand({ ...brand, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Support Phone</label>
              <input 
                type="text" 
                className="w-full rounded-xl border-gray-200 text-sm" 
                value={brand.phone}
                onChange={(e) => setBrand({ ...brand, phone: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <h3 className="text-lg font-bold text-gray-900">Visual Theme</h3>
          <p className="text-sm text-gray-500">Customize the look and feel of your client portal.</p>
        </div>
        <div className="lg:col-span-2 space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="h-24 w-24 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50">
              <img src={brand.logo} alt="Logo" className="h-full w-full object-cover" />
            </div>
            <button className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">
              Change Logo
            </button>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-3">Accent Color</label>
            <div className="flex items-center gap-4">
              <input 
                type="color" 
                className="h-10 w-20 rounded-lg border-0 p-0 cursor-pointer" 
                value={brand.accentColor}
                onChange={(e) => setBrand({ ...brand, accentColor: e.target.value })}
              />
              <span className="text-sm font-mono text-gray-500 uppercase">{brand.accentColor}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button className="rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-bold text-gray-700">Cancel</button>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-xl bg-blue-600 px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-100 active:scale-95 transition-transform disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Brand Settings'}
        </button>
      </div>
    </div>
  );
};
