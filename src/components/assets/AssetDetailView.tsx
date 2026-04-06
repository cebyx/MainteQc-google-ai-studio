import React, { useState, useMemo } from 'react';
import { useApp } from '../../AppContext';
import { 
  Box, 
  ChevronLeft, 
  Settings, 
  FileText, 
  History, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  MapPin,
  Calendar,
  User,
  Download,
  Plus,
  ExternalLink,
  ClipboardCheck,
  Zap,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';
import { Asset, Ticket, AssetComplianceRecord, AssetInspectionRecord, AssetDocument } from '../../types';
import { AssetEditorModal } from './AssetEditorModal';

interface AssetDetailViewProps {
  assetId: string;
  onBack: () => void;
}

export const AssetDetailView: React.FC<AssetDetailViewProps> = ({ assetId, onBack }) => {
  const { 
    assets, 
    properties, 
    clients, 
    tickets, 
    assetComplianceRecords, 
    assetInspectionRecords, 
    assetDocuments,
    role 
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'compliance' | 'documents'>('overview');
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const asset = useMemo(() => assets.find(a => a.id === assetId), [assets, assetId]);
  const property = useMemo(() => properties.find(p => p.id === asset?.propertyId), [properties, asset]);
  const client = useMemo(() => clients.find(c => c.id === asset?.clientId), [clients, asset]);
  
  const assetTickets = useMemo(() => 
    tickets.filter(t => t.assetId === assetId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  [tickets, assetId]);

  const complianceRecords = useMemo(() => 
    assetComplianceRecords.filter(r => r.assetId === assetId).sort((a, b) => b.dueDate.localeCompare(a.dueDate)),
  [assetComplianceRecords, assetId]);

  const inspectionRecords = useMemo(() => 
    assetInspectionRecords.filter(r => r.assetId === assetId).sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
  [assetInspectionRecords, assetId]);

  const documents = useMemo(() => 
    assetDocuments.filter(d => d.assetId === assetId).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)),
  [assetDocuments, assetId]);

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Box className="h-16 w-16 text-gray-200 mb-4" />
        <h2 className="text-xl font-black text-gray-900">Asset Not Found</h2>
        <button onClick={onBack} className="mt-4 text-blue-600 font-bold hover:underline">
          Back to Registry
        </button>
      </div>
    );
  }

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
    <div className="space-y-6">
      {/* Breadcrumbs & Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 bg-white rounded-xl border border-gray-100 text-gray-400 hover:text-gray-600 transition-all shadow-sm"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Asset Details</span>
              <span className="text-gray-300">•</span>
              <span className="text-xs font-bold text-gray-400">{asset.assetType}</span>
            </div>
            <h2 className="text-2xl font-black text-gray-900">{asset.label}</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {role === 'ADMIN' && (
            <button 
              onClick={() => setIsEditorOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all shadow-sm"
            >
              <Settings className="h-4 w-4" />
              Edit Asset
            </button>
          )}
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
            <Plus className="h-4 w-4" />
            New Ticket
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Info Cards */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-gray-900 uppercase tracking-wider text-xs">Current Status</h3>
              <div className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase border tracking-wider",
                getStatusColor(asset.status)
              )}>
                {asset.status.replace('_', ' ')}
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <MapPin className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Location</p>
                  <p className="text-sm font-bold text-gray-700">{asset.locationWithinProperty}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Property / Client</p>
                  <p className="text-sm font-bold text-gray-700">{property?.nickname || 'Unknown'}</p>
                  <p className="text-[10px] text-gray-500 font-medium">{client?.fullName || 'Unknown'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Specs */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-black text-gray-900 uppercase tracking-wider text-xs mb-6">Technical Specs</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Manufacturer</span>
                <span className="text-sm font-black text-gray-700">{asset.manufacturer}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Model</span>
                <span className="text-sm font-black text-gray-700">{asset.model}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Serial</span>
                <span className="text-sm font-mono font-black text-gray-700">{asset.serialNumber}</span>
              </div>
              {Object.entries(asset.metadata || {}).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">{key}</span>
                  <span className="text-sm font-black text-gray-700">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Tabs & Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Navigation */}
          <div className="flex items-center gap-2 p-1.5 bg-gray-100/50 rounded-2xl w-fit">
            {[
              { id: 'overview', label: 'Overview', icon: Box },
              { id: 'history', label: 'Service History', icon: History },
              { id: 'compliance', label: 'Compliance', icon: ShieldCheck },
              { id: 'documents', label: 'Documents', icon: FileText },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all",
                  activeTab === tab.id 
                    ? "bg-white text-blue-600 shadow-sm" 
                    : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 min-h-[400px]">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-wider mb-1">Total Tickets</p>
                    <p className="text-2xl font-black text-blue-700">{assetTickets.length}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                    <p className="text-[10px] font-black text-green-400 uppercase tracking-wider mb-1">Last Inspection</p>
                    <p className="text-sm font-black text-green-700">
                      {inspectionRecords[0]?.timestamp ? new Date(inspectionRecords[0].timestamp).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-wider mb-1">Next Compliance</p>
                    <p className="text-sm font-black text-purple-700">
                      {complianceRecords[0]?.dueDate ? new Date(complianceRecords[0].dueDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h4 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    Recent Activity
                  </h4>
                  <div className="space-y-4">
                    {assetTickets.slice(0, 3).map(ticket => (
                      <div 
                        key={ticket.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-xl shadow-sm">
                            <ClipboardCheck className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{ticket.title}</p>
                            <p className="text-[10px] text-gray-500 font-medium">#{ticket.id.slice(-6)} • {new Date(ticket.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-600 transition-all" />
                      </div>
                    ))}
                    {assetTickets.length === 0 && (
                      <p className="text-center py-8 text-gray-400 text-sm font-medium italic">No recent activity recorded.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                {assetTickets.map(ticket => (
                  <div 
                    key={ticket.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg",
                        ticket.status === 'completed' ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                      )}>
                        {ticket.status === 'completed' ? '✓' : '!'}
                      </div>
                      <div>
                        <h5 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{ticket.title}</h5>
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                          <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span className="capitalize">{ticket.status.replace('_', ' ')}</span>
                          <span>•</span>
                          <span>{ticket.assignedTechnicianName || 'Unassigned'}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-600 transition-all" />
                  </div>
                ))}
                {assetTickets.length === 0 && (
                  <div className="text-center py-12">
                    <History className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium italic">No service history found for this asset.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'compliance' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-gray-900">Compliance & Certifications</h4>
                  {role === 'ADMIN' && (
                    <button className="text-xs font-black text-blue-600 hover:underline flex items-center gap-1">
                      <Plus className="h-3 w-3" />
                      Add Record
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  {complianceRecords.map(record => (
                    <div key={record.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-blue-600" />
                          <span className="font-bold text-gray-900">{record.recordType}</span>
                        </div>
                        <div className={cn(
                          "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider",
                          record.outcome === 'passed' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        )}>
                          {record.outcome}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="text-gray-400 font-bold uppercase tracking-wider mb-1">Issued</p>
                          <p className="text-gray-700 font-black">{new Date(record.completedDate || record.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 font-bold uppercase tracking-wider mb-1">Expires</p>
                          <p className="text-gray-700 font-black">{new Date(record.dueDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {complianceRecords.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                      <ShieldCheck className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium italic">No compliance records found.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-gray-900">Asset Documentation</h4>
                  <button className="text-xs font-black text-blue-600 hover:underline flex items-center gap-1">
                    <Plus className="h-3 w-3" />
                    Upload
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documents.map(doc => (
                    <a 
                      key={doc.id}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-blue-50 transition-all group border border-transparent hover:border-blue-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl shadow-sm group-hover:text-blue-600 transition-colors">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{doc.title}</p>
                          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{doc.type}</p>
                        </div>
                      </div>
                      <Download className="h-4 w-4 text-gray-300 group-hover:text-blue-600 transition-all" />
                    </a>
                  ))}
                  {documents.length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <FileText className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium italic">No documents uploaded for this asset.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AssetEditorModal 
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        asset={asset}
      />
    </div>
  );
};
