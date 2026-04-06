import React, { useState, useEffect } from 'react';
import { useApp } from '../../AppContext';
import { 
  X, 
  Save, 
  Trash2, 
  Box, 
  MapPin, 
  Settings, 
  ShieldCheck,
  Tag,
  Info,
  Plus
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Asset } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

interface AssetEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset?: Asset;
}

export const AssetEditorModal: React.FC<AssetEditorModalProps> = ({ isOpen, onClose, asset }) => {
  const { createAsset, updateAsset, deleteAsset, properties, clients } = useApp();
  const [formData, setFormData] = useState<Partial<Asset>>({
    label: '',
    assetType: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    status: 'active',
    locationWithinProperty: '',
    propertyId: '',
    clientId: '',
    metadata: {}
  });

  useEffect(() => {
    if (asset) {
      setFormData(asset);
    } else {
      setFormData({
        label: '',
        assetType: '',
        manufacturer: '',
        model: '',
        serialNumber: '',
        status: 'active',
        locationWithinProperty: '',
        propertyId: '',
        clientId: '',
        metadata: {}
      });
    }
  }, [asset, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (asset) {
      await updateAsset(asset.id, formData);
    } else {
      await createAsset(formData as Omit<Asset, 'id' | 'createdAt'>);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (asset && window.confirm('Are you sure you want to delete this asset? This action cannot be undone.')) {
      await deleteAsset(asset.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                <Box className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-black text-gray-900">
                {asset ? 'Edit Asset' : 'Add New Asset'}
              </h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-400 uppercase tracking-wider ml-1">Asset Label</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="e.g. Main HVAC Unit"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-gray-400 uppercase tracking-wider ml-1">Asset Type</label>
                <div className="relative">
                  <Box className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={formData.assetType}
                    onChange={(e) => setFormData({ ...formData, assetType: e.target.value })}
                    placeholder="e.g. HVAC, Elevator, Generator"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-gray-400 uppercase tracking-wider ml-1">Manufacturer</label>
                <input
                  type="text"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-gray-400 uppercase tracking-wider ml-1">Model Number</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-gray-400 uppercase tracking-wider ml-1">Serial Number</label>
                <input
                  type="text"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-gray-400 uppercase tracking-wider ml-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-2.5 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-bold appearance-none"
                >
                  <option value="active">Active</option>
                  <option value="offline">Offline</option>
                  <option value="under_repair">Under Repair</option>
                  <option value="replacement_pending">Replacement Pending</option>
                  <option value="decommissioned">Decommissioned</option>
                </select>
              </div>
            </div>

            {/* Location & Ownership */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                Location & Ownership
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-wider ml-1">Property</label>
                  <select
                    required
                    value={formData.propertyId}
                    onChange={(e) => {
                      const prop = properties.find(p => p.id === e.target.value);
                      setFormData({ 
                        ...formData, 
                        propertyId: e.target.value,
                        clientId: prop?.clientId || ''
                      });
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-bold appearance-none"
                  >
                    <option value="">Select Property</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.nickname} ({p.address})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-wider ml-1">Location within Property</label>
                  <input
                    type="text"
                    value={formData.locationWithinProperty}
                    onChange={(e) => setFormData({ ...formData, locationWithinProperty: e.target.value })}
                    placeholder="e.g. Roof, Basement, Room 402"
                    className="w-full px-4 py-2.5 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Additional Metadata */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" />
                Technical Specifications
              </h3>
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-xs text-blue-700 font-medium mb-4">
                  Add custom technical details like voltage, capacity, installation date, etc.
                </p>
                
                <div className="space-y-3">
                  {Object.entries(formData.metadata || {}).map(([key, value]) => (
                    <div key={key} className="flex gap-2 items-center">
                      <div className="flex-1 px-3 py-2 rounded-lg bg-white border border-blue-100 text-xs font-bold text-gray-700">
                        {key}
                      </div>
                      <div className="flex-1 px-3 py-2 rounded-lg bg-white border border-blue-100 text-xs font-bold text-gray-700">
                        {String(value)}
                      </div>
                      <button 
                        type="button" 
                        onClick={() => {
                          const newMetadata = { ...formData.metadata };
                          delete newMetadata[key];
                          setFormData({ ...formData, metadata: newMetadata });
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  <div className="flex gap-2">
                    <input 
                      id="new-meta-key"
                      placeholder="Key (e.g. Voltage)" 
                      className="flex-1 px-3 py-2 rounded-lg border-gray-200 text-xs font-bold" 
                    />
                    <input 
                      id="new-meta-value"
                      placeholder="Value (e.g. 220V)" 
                      className="flex-1 px-3 py-2 rounded-lg border-gray-200 text-xs font-bold" 
                    />
                    <button 
                      type="button" 
                      onClick={() => {
                        const keyInput = document.getElementById('new-meta-key') as HTMLInputElement;
                        const valueInput = document.getElementById('new-meta-value') as HTMLInputElement;
                        if (keyInput.value && valueInput.value) {
                          setFormData({
                            ...formData,
                            metadata: {
                              ...formData.metadata,
                              [keyInput.value]: valueInput.value
                            }
                          });
                          keyInput.value = '';
                          valueInput.value = '';
                        }
                      }}
                      className="p-2 bg-white text-blue-600 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-100">
              {asset ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl font-bold text-sm transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Asset
                </button>
              ) : <div />}
              
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 text-gray-500 font-bold text-sm hover:text-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                >
                  <Save className="h-4 w-4" />
                  {asset ? 'Update Asset' : 'Create Asset'}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
