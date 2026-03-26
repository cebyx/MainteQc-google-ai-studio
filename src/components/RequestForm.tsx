import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { SERVICE_CATEGORIES, URGENCY_LEVELS } from '../constants';
import { MapPin, Calendar, Clock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export const RequestForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { properties, currentUser, addTicket } = useApp();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    propertyId: '',
    category: '',
    title: '',
    description: '',
    urgency: 'medium',
    preferredDate: '',
    preferredTime: 'Morning',
    contactPreference: 'email',
  });

  const myProperties = properties.filter(p => p.clientId === currentUser.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedProperty = myProperties.find(p => p.id === formData.propertyId);
    
    addTicket({
      ...formData,
      urgency: formData.urgency as any,
      status: 'pending_review',
      clientId: currentUser.id,
      clientName: currentUser.fullName,
      propertyNickname: selectedProperty?.nickname || 'Unknown',
      serviceAddress: selectedProperty ? `${selectedProperty.address}, ${selectedProperty.city}, ${selectedProperty.state} ${selectedProperty.zip}` : '',
      adminNotes: '',
      technicianNotes: '',
      completionNotes: '',
      createdByEmail: currentUser.email,
    });
    
    setStep(3);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {step === 1 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Request Service</h2>
            <p className="text-gray-500">Tell us what needs attention.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Select Property</label>
              <div className="grid grid-cols-1 gap-3">
                {myProperties.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setFormData({ ...formData, propertyId: p.id })}
                    className={cn(
                      "flex items-center gap-4 rounded-2xl border p-4 text-left transition-all",
                      formData.propertyId === p.id 
                        ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" 
                        : "border-gray-200 hover:border-blue-300"
                    )}
                  >
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl",
                      formData.propertyId === p.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"
                    )}>
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{p.nickname}</div>
                      <div className="text-xs text-gray-500">{p.address}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Service Category</label>
              <select 
                className="w-full rounded-xl border-gray-200 p-3 text-sm focus:ring-blue-500"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="">Select a category...</option>
                {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <button
              disabled={!formData.propertyId || !formData.category}
              onClick={() => setStep(2)}
              className="w-full rounded-xl bg-blue-600 py-4 text-sm font-bold text-white shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none"
            >
              Continue
            </button>
          </div>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setStep(1)} className="text-sm font-bold text-blue-600">Back</button>
            <h2 className="text-xl font-bold text-gray-900">Issue Details</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Issue Title</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Leaking sink, No hot water"
                className="w-full rounded-xl border-gray-200 p-3 text-sm"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
              <textarea 
                required
                rows={4}
                placeholder="Please describe the problem in detail..."
                className="w-full rounded-xl border-gray-200 p-3 text-sm"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Urgency</label>
                <select 
                  className="w-full rounded-xl border-gray-200 p-3 text-sm"
                  value={formData.urgency}
                  onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                >
                  {URGENCY_LEVELS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Preferred Date</label>
                <input 
                  type="date" 
                  required
                  className="w-full rounded-xl border-gray-200 p-3 text-sm"
                  value={formData.preferredDate}
                  onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 py-4 text-sm font-bold text-white shadow-lg shadow-blue-200"
            >
              Submit Request
            </button>
          </form>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-12">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Request Submitted!</h2>
          <p className="mt-2 text-gray-500">We've received your request and will review it shortly.</p>
          
          <div className="mt-8 space-y-4 text-left rounded-2xl bg-gray-50 p-6">
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest">What happens next?</h4>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">1</div>
                <p className="text-sm text-gray-600">Our dispatch team reviews your request for urgency and technician availability.</p>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-500">2</div>
                <p className="text-sm text-gray-600">You'll receive a notification once an appointment is scheduled.</p>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-500">3</div>
                <p className="text-sm text-gray-600">A technician will be assigned and you can track their arrival in real-time.</p>
              </div>
            </div>
          </div>

          <button
            onClick={onSuccess}
            className="mt-8 flex items-center justify-center gap-2 mx-auto text-blue-600 font-bold hover:underline"
          >
            Back to Dashboard <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </div>
  );
};
