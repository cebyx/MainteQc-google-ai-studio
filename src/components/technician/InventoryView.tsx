import React, { useState } from 'react';
import { useApp } from '../../AppContext';
import { 
  Package, 
  Search, 
  Plus, 
  Minus, 
  AlertTriangle, 
  History, 
  ArrowRight,
  Filter,
  ChevronRight,
  ShoppingCart,
  CheckCircle2,
  Clock,
  X
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

export const InventoryView: React.FC = () => {
  const { 
    inventoryItems, 
    technicianStock, 
    partsRequests, 
    currentUser,
    updateInventoryQuantity,
    createPartsRequest,
    tickets
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'stock' | 'requests'>('stock');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const myStock = technicianStock.filter(s => s.technicianId === currentUser.id);
  const myRequests = partsRequests.filter(r => r.technicianId === currentUser.id);

  const filteredStock = myStock.filter(stock => {
    const item = inventoryItems.find(i => i.id === stock.itemId);
    return item?.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           item?.sku.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const lowStockCount = myStock.filter(s => s.quantity <= s.minThreshold).length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Total Items</div>
            <div className="text-3xl font-black text-gray-900">{myStock.length}</div>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Package className="h-6 w-6" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Low Stock</div>
            <div className="text-3xl font-black text-orange-600">{lowStockCount}</div>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Pending Requests</div>
            <div className="text-3xl font-black text-blue-600">
              {myRequests.filter(r => r.status === 'pending').length}
            </div>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Clock className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex p-1 bg-gray-100 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('stock')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                activeTab === 'stock' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              My Van Stock
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                activeTab === 'requests' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              Parts Requests
            </button>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-xl border-gray-200 bg-gray-50 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button 
            onClick={() => setIsRequestModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
          >
            <Plus className="h-4 w-4" />
            Request Parts
          </button>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'stock' ? (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] uppercase tracking-wider font-bold text-gray-400">
                  <th className="px-6 py-4">Item Details</th>
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4">Quantity</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredStock.length > 0 ? (
                  filteredStock.map(stock => {
                    const item = inventoryItems.find(i => i.id === stock.itemId);
                    const isLow = stock.quantity <= stock.minThreshold;

                    return (
                      <tr key={stock.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                              <Package className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">{item?.name}</div>
                              <div className="text-xs text-gray-500">{item?.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-gray-500">{item?.sku}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => updateInventoryQuantity(currentUser.id, stock.itemId, -1)}
                              className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className={cn(
                              "text-lg font-bold w-8 text-center",
                              isLow ? "text-orange-600" : "text-gray-900"
                            )}>
                              {stock.quantity}
                            </span>
                            <button 
                              onClick={() => updateInventoryQuantity(currentUser.id, stock.itemId, 1)}
                              className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                              <AlertTriangle className="h-3 w-3" />
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                              <CheckCircle2 className="h-3 w-3" />
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-gray-400 hover:text-blue-600 transition-colors">
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                      No inventory items found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <div className="divide-y divide-gray-50">
              {myRequests.length > 0 ? (
                myRequests.map(request => (
                  <div key={request.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center",
                          request.status === 'pending' ? "bg-blue-50 text-blue-600" :
                          request.status === 'approved' ? "bg-green-50 text-green-600" :
                          request.status === 'rejected' ? "bg-red-50 text-red-600" :
                          "bg-gray-50 text-gray-600"
                        )}>
                          <ShoppingCart className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">Request #{request.id.slice(-6)}</div>
                          <div className="text-xs text-gray-500">Created {format(new Date(request.createdAt), 'MMM d, yyyy h:mm a')}</div>
                        </div>
                      </div>
                      <div className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                        request.status === 'pending' ? "bg-blue-100 text-blue-700" :
                        request.status === 'approved' ? "bg-green-100 text-green-700" :
                        request.status === 'rejected' ? "bg-red-100 text-red-700" :
                        "bg-gray-100 text-gray-700"
                      )}>
                        {request.status}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-2">Requested Items</div>
                        <div className="space-y-2">
                          {request.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <span className="text-gray-700 font-medium">{item.name}</span>
                              <span className="text-gray-500">Qty: {item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {request.adminNotes && (
                        <div>
                          <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-2">Admin Notes</div>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
                            "{request.adminNotes}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-gray-500 italic">
                  No parts requests found.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Request Modal Placeholder */}
      <AnimatePresence>
        {isRequestModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRequestModalOpen(false)}
              className="absolute inset-0 bg-black/50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">New Parts Request</h2>
                <button onClick={() => setIsRequestModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-500 italic">
                  This feature is coming soon. You will be able to select items from the master catalog and link them to specific tickets.
                </p>
                <div className="h-48 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400">
                  <Package className="h-12 w-12 opacity-20" />
                </div>
              </div>
              <div className="p-6 bg-gray-50 flex justify-end gap-3">
                <button 
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button 
                  disabled
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm opacity-50 cursor-not-allowed"
                >
                  Submit Request
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
