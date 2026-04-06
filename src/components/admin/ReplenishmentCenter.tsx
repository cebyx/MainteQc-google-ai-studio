import React, { useState } from 'react';
import { 
  AlertTriangle, Search, Filter, ArrowUpRight, 
  RefreshCcw, User, Package, Calendar, Download,
  CheckCircle2, XCircle, MoreVertical,
  Truck, PackageCheck, Info, TrendingDown,
  ShoppingCart, Plus, ArrowRight, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../AppContext';
import { TechnicianStock, InventoryItem } from '../../types';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

export const ReplenishmentCenter: React.FC = () => {
  const { 
    technicianStock, 
    inventoryItems, 
    technicians,
    transferStockToTechnician
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTech, setSelectedTech] = useState<string>('all');
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockTarget, setRestockTarget] = useState<{ techId: string, itemId: string } | null>(null);

  const lowStockItems = technicianStock.filter(stock => {
    const isLow = stock.quantity <= stock.minThreshold;
    const techMatches = selectedTech === 'all' || stock.technicianId === selectedTech;
    const item = inventoryItems.find(i => i.id === stock.itemId);
    const searchMatches = item?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item?.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return isLow && techMatches && searchMatches;
  }).sort((a, b) => a.quantity - b.quantity);

  const criticalItems = lowStockItems.filter(s => s.quantity === 0);
  const warningItems = lowStockItems.filter(s => s.quantity > 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Replenishment Center</h1>
          <p className="text-gray-500 text-sm">Identify and resolve technician stock shortages.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium">
            <ShoppingCart className="w-4 h-4" />
            <span>Bulk Restock</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-red-600">{criticalItems.length}</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Out of Stock</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-600">{warningItems.length}</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Below Threshold</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-blue-600">{technicians.length}</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Vans</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Shortage Alerts</h3>
          <div className="flex items-center gap-3">
            <select
              value={selectedTech}
              onChange={(e) => setSelectedTech(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="all">All Technicians</option>
              {technicians.map(tech => (
                <option key={tech.id} value={tech.id}>{tech.fullName}</option>
              ))}
            </select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64 bg-white"
              />
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {lowStockItems.map((stock) => {
            const tech = technicians.find(t => t.id === stock.technicianId);
            const item = inventoryItems.find(i => i.id === stock.itemId);
            const isCritical = stock.quantity === 0;

            return (
              <div key={stock.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    isCritical ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                  )}>
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">{item?.name}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <span className="font-mono">{item?.sku}</span>
                      <span>•</span>
                      <span className="font-medium text-blue-600">{tech?.fullName}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className={cn(
                      "text-lg font-black",
                      isCritical ? "text-red-600" : "text-amber-600"
                    )}>
                      {stock.quantity}
                    </div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Current</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-black text-gray-400">
                      {stock.minThreshold}
                    </div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Min</div>
                  </div>
                  <button 
                    onClick={() => {
                      setRestockTarget({ techId: stock.technicianId, itemId: stock.itemId });
                      setIsRestockModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm font-bold text-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Restock</span>
                  </button>
                </div>
              </div>
            );
          })}
          {lowStockItems.length === 0 && (
            <div className="px-6 py-12 text-center">
              <div className="flex flex-col items-center justify-center text-gray-400">
                <CheckCircle2 className="w-12 h-12 mb-2 text-green-500 opacity-50" />
                <p className="text-sm font-medium">All technician stock is above thresholds.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Restock Modal */}
      <AnimatePresence>
        {isRestockModalOpen && restockTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Restock Item</h3>
                <button 
                  onClick={() => setIsRestockModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XCircle className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              <form className="p-6 space-y-4" onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const quantity = parseInt(formData.get('quantity') as string);
                
                transferStockToTechnician(restockTarget.techId, restockTarget.itemId, quantity);
                setIsRestockModalOpen(false);
              }}>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-3">
                  <Package className="w-8 h-8 text-blue-600" />
                  <div>
                    <div className="text-sm font-bold text-blue-900">
                      {inventoryItems.find(i => i.id === restockTarget.itemId)?.name}
                    </div>
                    <div className="text-xs text-blue-700">
                      Restocking for {technicians.find(t => t.id === restockTarget.techId)?.fullName}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Restock Quantity</label>
                  <input 
                    name="quantity"
                    type="number"
                    min="1"
                    required
                    autoFocus
                    placeholder="Enter amount to add..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg font-bold"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsRestockModalOpen(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm font-bold"
                  >
                    Confirm Restock
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
