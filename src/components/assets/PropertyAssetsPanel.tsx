import React, { useState } from 'react';
import { useApp } from '../../AppContext';
import { 
  Box, 
  Plus, 
  ChevronRight, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Settings,
  Search
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Asset } from '../../types';
import { AssetEditorModal } from './AssetEditorModal';

interface PropertyAssetsPanelProps {
  propertyId: string;
  onSelectAsset: (id: string) => void;
}

export const PropertyAssetsPanel: React.FC<PropertyAssetsPanelProps> = ({ propertyId, onSelectAsset }) => {
  const { assets, role } = useApp();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');

  const propertyAssets = assets.filter(a => a.propertyId === propertyId);
  const filteredAssets = propertyAssets.filter(a => 
    a.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.assetType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: Asset['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-200';
      case 'offline': return 'bg-red-100 text-red-700 border-red-200';
      case 'under_repair': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'replacement_pending': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'decommissioned': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Box className="h-5 w-5 text-blue-600" />
          <h3 className="font-black text-gray-900 uppercase tracking-wider text-xs">Property Assets</h3>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-lg text-[10px] font-black tracking-wider">
            {propertyAssets.length}
          </span>
        </div>
        {role === 'ADMIN' && (
          <button 
            onClick={() => {
              setEditingAsset(undefined);
              setIsEditorOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-blue-700 transition-all shadow-sm"
          >
            <Plus className="h-3 w-3" />
            Add Asset
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        <input
          type="text"
          placeholder="Filter assets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs font-medium transition-all"
        />
      </div>

      <div className="space-y-2">
        {filteredAssets.map(asset => (
          <div 
            key={asset.id}
            className="group flex items-center justify-between p-3 bg-white rounded-2xl border border-gray-100 hover:border-blue-100 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                <Box className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
              </div>
              <div>
                <button 
                  onClick={() => onSelectAsset(asset.id)}
                  className="text-sm font-bold text-gray-900 hover:text-blue-600 transition-colors block text-left"
                >
                  {asset.label}
                </button>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{asset.assetType}</span>
                  <span className="text-gray-200">•</span>
                  <div className={cn(
                    "px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border",
                    getStatusColor(asset.status)
                  )}>
                    {asset.status.replace('_', ' ')}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => {
                  setEditingAsset(asset);
                  setIsEditorOpen(true);
                }}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              >
                <Settings className="h-3.5 w-3.5" />
              </button>
              <button 
                onClick={() => onSelectAsset(asset.id)}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {filteredAssets.length === 0 && (
          <div className="text-center py-8 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <Box className="h-8 w-8 text-gray-200 mx-auto mb-2" />
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider italic">No assets found</p>
          </div>
        )}
      </div>

      <AssetEditorModal 
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        asset={editingAsset}
      />
    </div>
  );
};
