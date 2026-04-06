import React, { useState, useMemo } from 'react';
import { useApp } from '../../AppContext';
import { 
  Plus, 
  Search, 
  Filter, 
  Box, 
  ChevronRight, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  MoreVertical,
  Settings,
  FileText,
  History,
  ShieldCheck
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';
import { Asset } from '../../types';
import { AssetEditorModal } from './AssetEditorModal';

interface AssetRegistryViewProps {
  onSelectAsset: (id: string) => void;
}

export const AssetRegistryView: React.FC<AssetRegistryViewProps> = ({ onSelectAsset }) => {
  const { assets, properties, clients, role } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Asset['status'] | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | undefined>(undefined);

  const assetTypes = useMemo(() => {
    const types = new Set(assets.map(a => a.assetType));
    return ['all', ...Array.from(types)];
  }, [assets]);

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchesSearch = 
        asset.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.model.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
      const matchesType = typeFilter === 'all' || asset.assetType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [assets, searchQuery, statusFilter, typeFilter]);

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

  const getStatusIcon = (status: Asset['status']) => {
    switch (status) {
      case 'active': return <CheckCircle2 className="h-3 w-3" />;
      case 'offline': return <AlertTriangle className="h-3 w-3" />;
      case 'under_repair': return <Settings className="h-3 w-3" />;
      case 'replacement_pending': return <Clock className="h-3 w-3" />;
      case 'decommissioned': return <Box className="h-3 w-3" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Box className="h-7 w-7 text-blue-600" />
            Asset Registry
          </h2>
          <p className="text-gray-500">Manage and track all equipment and serviceable units across properties.</p>
        </div>
        {role === 'ADMIN' && (
          <button 
            onClick={() => {
              setEditingAsset(undefined);
              setIsEditorOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <Plus className="h-4 w-4" />
            Add Asset
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by label, serial, manufacturer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border-gray-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border-gray-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium appearance-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="offline">Offline</option>
            <option value="under_repair">Under Repair</option>
            <option value="replacement_pending">Replacement Pending</option>
            <option value="decommissioned">Decommissioned</option>
          </select>
        </div>
        <div className="relative">
          <Box className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border-gray-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium appearance-none"
          >
            {assetTypes.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Types' : type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredAssets.map((asset, i) => {
          const property = properties.find(p => p.id === asset.propertyId);
          const client = clients.find(c => c.id === asset.clientId);

          return (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2.5 rounded-xl bg-gray-50 group-hover:bg-blue-50 transition-colors")}>
                    <Box className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {asset.label}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">{asset.assetType} • {asset.manufacturer}</p>
                  </div>
                </div>
                <div className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black uppercase border tracking-wider",
                  getStatusColor(asset.status)
                )}>
                  {getStatusIcon(asset.status)}
                  {asset.status.replace('_', ' ')}
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-medium">Property</span>
                  <span className="text-gray-700 font-bold">{property?.nickname || 'Unknown'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-medium">Serial Number</span>
                  <span className="text-gray-700 font-mono font-bold">{asset.serialNumber}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-medium">Location</span>
                  <span className="text-gray-700 font-bold">{asset.locationWithinProperty}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-gray-50">
                <button 
                  onClick={() => onSelectAsset(asset.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold hover:bg-blue-50 hover:text-blue-600 transition-all"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Details
                </button>
                <button 
                  onClick={() => {
                    setEditingAsset(asset);
                    setIsEditorOpen(true);
                  }}
                  className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 hover:text-gray-600 transition-all"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          );
        })}

        {filteredAssets.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <Box className="h-12 w-12 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">No assets found</h3>
            <p className="text-gray-500">Try adjusting your search or filters.</p>
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
