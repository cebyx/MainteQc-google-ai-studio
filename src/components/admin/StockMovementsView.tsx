import React, { useState } from 'react';
import { 
  History, Search, Filter, ArrowUpRight, ArrowDownRight, 
  RefreshCcw, User, Package, Calendar, Download,
  AlertCircle, CheckCircle2, XCircle, MoreVertical,
  Truck, PackageCheck, AlertTriangle, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../AppContext';
import { StockMovement } from '../../types';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

export const StockMovementsView: React.FC = () => {
  const { stockMovements, technicians, inventoryItems } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<StockMovement['type'] | 'all'>('all');
  const [techFilter, setTechFilter] = useState<string>('all');

  const filteredMovements = stockMovements.filter(movement => {
    const typeMatches = typeFilter === 'all' || movement.type === typeFilter;
    const techMatches = techFilter === 'all' || movement.technicianId === techFilter;
    const searchMatches = 
      movement.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movement.technicianName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movement.reason.toLowerCase().includes(searchQuery.toLowerCase());
    return typeMatches && techMatches && searchMatches;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getMovementTypeBadge = (type: StockMovement['type']) => {
    switch (type) {
      case 'restock': return { color: 'bg-green-100 text-green-700', icon: ArrowUpRight, label: 'Restock' };
      case 'issue': return { color: 'bg-blue-100 text-blue-700', icon: ArrowDownRight, label: 'Issue' };
      case 'adjustment': return { color: 'bg-amber-100 text-amber-700', icon: AlertTriangle, label: 'Adjustment' };
      case 'transfer': return { color: 'bg-purple-100 text-purple-700', icon: Truck, label: 'Transfer' };
      case 'request_reserved': return { color: 'bg-indigo-100 text-indigo-700', icon: Package, label: 'Reservation' };
      case 'request_fulfilled': return { color: 'bg-emerald-100 text-emerald-700', icon: PackageCheck, label: 'Fulfillment' };
      default: return { color: 'bg-gray-100 text-gray-700', icon: Info, label: type };
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Movement History</h1>
          <p className="text-gray-500 text-sm">Full audit trail of all inventory changes and transfers.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search movements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full"
          />
        </div>
        <div className="flex items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Types</option>
            <option value="restock">Restock</option>
            <option value="issue">Issue</option>
            <option value="adjustment">Adjustment</option>
            <option value="transfer">Transfer</option>
            <option value="request_fulfillment">Fulfillment</option>
          </select>
          <select
            value={techFilter}
            onChange={(e) => setTechFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Technicians</option>
            {technicians.map(tech => (
              <option key={tech.id} value={tech.id}>{tech.fullName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Item Details</th>
                <th className="px-6 py-4">Technician</th>
                <th className="px-6 py-4">Quantity Change</th>
                <th className="px-6 py-4">Reason / Reference</th>
                <th className="px-6 py-4">Action By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMovements.map((movement) => {
                const typeInfo = getMovementTypeBadge(movement.type);
                const TypeIcon = typeInfo.icon;

                return (
                  <tr key={movement.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium">
                        {format(new Date(movement.timestamp), 'MMM d, yyyy')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(movement.timestamp), 'h:mm:ss a')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 w-fit",
                        typeInfo.color
                      )}>
                        <TypeIcon className="w-3 h-3" />
                        {typeInfo.label}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">{movement.itemName}</div>
                      <div className="text-xs text-gray-500 font-mono">ID: {movement.itemId.slice(-8)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold uppercase">
                          {movement.technicianName.charAt(0)}
                        </div>
                        <span className="text-sm text-gray-700">{movement.technicianName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn(
                        "text-sm font-black",
                        movement.quantityDelta > 0 ? "text-green-600" : 
                        movement.quantityDelta < 0 ? "text-red-600" : 
                        "text-gray-400"
                      )}>
                        {movement.quantityDelta > 0 ? `+${movement.quantityDelta}` : movement.quantityDelta}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 line-clamp-1">{movement.reason}</div>
                      {movement.ticketId && (
                        <div className="text-[10px] font-bold text-blue-600 uppercase mt-0.5">
                          Ticket #{movement.ticketId.slice(-6)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium">{movement.createdByName}</div>
                      <div className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">{movement.createdByRole}</div>
                    </td>
                  </tr>
                );
              })}
              {filteredMovements.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <History className="w-12 h-12 mb-2 opacity-20" />
                      <p className="text-sm font-medium">No movements found matching your filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
