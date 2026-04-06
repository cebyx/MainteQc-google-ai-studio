import React, { useState } from 'react';
import { 
  Package, Search, Filter, Plus, Edit2, Trash2, 
  ArrowUpRight, ArrowDownRight, History, Users, 
  AlertTriangle, CheckCircle2, XCircle, MoreVertical,
  Truck, PackageCheck, RefreshCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../AppContext';
import { InventoryItem, TechnicianStock, StockMovement } from '../../types';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

export const AdminInventoryView: React.FC = () => {
  const { 
    inventoryItems, 
    technicianStock, 
    stockMovements, 
    technicians,
    createInventoryItem,
    updateInventoryItem,
    transferStockToTechnician,
    adjustTechnicianStock
  } = useApp();

  const [activeTab, setActiveTab] = useState<'catalog' | 'tech-stock' | 'movements'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedTech, setSelectedTech] = useState<string>('all');

  // Stats
  const totalItems = inventoryItems.length;
  const lowStockItems = technicianStock.filter(s => s.quantity <= s.minThreshold).length;
  const recentMovements = stockMovements.slice(0, 5);

  const filteredItems = inventoryItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTechStock = technicianStock.filter(stock => {
    const techMatches = selectedTech === 'all' || stock.technicianId === selectedTech;
    const item = inventoryItems.find(i => i.id === stock.itemId);
    const itemMatches = item?.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       item?.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return techMatches && itemMatches;
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-500 text-sm">Control master catalog, technician stock, and movements.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
          <button 
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Truck className="w-4 h-4" />
            <span>Transfer Stock</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-gray-500">Master Catalog</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-gray-900">{totalItems}</span>
            <span className="text-xs text-gray-400">Unique SKUs</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-gray-500">Low Stock Alerts</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-gray-900">{lowStockItems}</span>
            <span className="text-xs text-amber-500 font-medium">Action Required</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <RefreshCcw className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-gray-500">Recent Movements</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-gray-900">{stockMovements.length}</span>
            <span className="text-xs text-gray-400">Last 30 days</span>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50/50 px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-1 p-1 bg-gray-200/50 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('catalog')}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                activeTab === 'catalog' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              Master Catalog
            </button>
            <button
              onClick={() => setActiveTab('tech-stock')}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                activeTab === 'tech-stock' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              Technician Stock
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                activeTab === 'movements' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              Movements
            </button>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'tech-stock' && (
              <select
                value={selectedTech}
                onChange={(e) => setSelectedTech(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">All Technicians</option>
                {technicians.map(tech => (
                  <option key={tech.id} value={tech.id}>{tech.fullName}</option>
                ))}
              </select>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search inventory..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'catalog' && (
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">
                  <th className="px-6 py-4">Item Details</th>
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Unit</th>
                  <th className="px-6 py-4">Base Price</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="text-xs text-gray-500 line-clamp-1">{item.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">{item.sku}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.unit}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">${item.basePrice.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 text-xs font-medium rounded-full",
                        item.status === 'active' ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      )}>
                        {item.status || 'active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => {
                          setSelectedItem(item);
                          setIsEditModalOpen(true);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'tech-stock' && (
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">
                  <th className="px-6 py-4">Technician</th>
                  <th className="px-6 py-4">Item</th>
                  <th className="px-6 py-4">Quantity</th>
                  <th className="px-6 py-4">Threshold</th>
                  <th className="px-6 py-4">Last Restocked</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTechStock.map((stock) => {
                  const tech = technicians.find(t => t.id === stock.technicianId);
                  const item = inventoryItems.find(i => i.id === stock.itemId);
                  const isLow = stock.quantity <= stock.minThreshold;

                  return (
                    <tr key={stock.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold uppercase">
                            {tech?.fullName.charAt(0)}
                          </div>
                          <div className="text-sm font-medium text-gray-900">{tech?.fullName}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{item?.name}</div>
                        <div className="text-xs text-gray-500">{item?.sku}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-sm font-bold",
                            isLow ? "text-amber-600" : "text-gray-900"
                          )}>
                            {stock.quantity}
                          </span>
                          {isLow && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{stock.minThreshold}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {stock.lastRestockedAt ? format(new Date(stock.lastRestockedAt), 'MMM d, yyyy') : 'Never'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => {
                            // Open adjustment modal
                          }}
                          className="px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {activeTab === 'movements' && (
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Item</th>
                  <th className="px-6 py-4">Technician</th>
                  <th className="px-6 py-4">Delta</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stockMovements.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {format(new Date(movement.timestamp), 'MMM d, h:mm a')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 w-fit",
                        movement.type === 'restock' ? "bg-green-100 text-green-700" :
                        movement.type === 'issue' ? "bg-blue-100 text-blue-700" :
                        movement.type === 'adjustment' ? "bg-amber-100 text-amber-700" :
                        "bg-gray-100 text-gray-700"
                      )}>
                        {movement.type === 'restock' && <ArrowUpRight className="w-3 h-3" />}
                        {movement.type === 'issue' && <ArrowDownRight className="w-3 h-3" />}
                        {movement.type.charAt(0).toUpperCase() + movement.type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{movement.itemName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{movement.technicianName}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-sm font-bold",
                        movement.quantityDelta > 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {movement.quantityDelta > 0 ? `+${movement.quantityDelta}` : movement.quantityDelta}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{movement.reason}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{movement.createdByName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Modal (Simplified for brevity) */}
      <AnimatePresence>
        {(isAddModalOpen || isEditModalOpen) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">
                  {isEditModalOpen ? 'Edit Inventory Item' : 'Add New Inventory Item'}
                </h3>
                <button 
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                    setSelectedItem(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XCircle className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              <form className="p-6 space-y-4" onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const itemData = {
                  name: formData.get('name') as string,
                  sku: formData.get('sku') as string,
                  category: formData.get('category') as string,
                  unit: formData.get('unit') as string,
                  basePrice: parseFloat(formData.get('basePrice') as string),
                  description: formData.get('description') as string,
                  status: (formData.get('status') as 'active' | 'inactive') || 'active'
                };

                if (isEditModalOpen && selectedItem) {
                  updateInventoryItem(selectedItem.id, itemData);
                } else {
                  createInventoryItem(itemData);
                }

                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
                setSelectedItem(null);
              }}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Item Name</label>
                    <input 
                      name="name"
                      defaultValue={selectedItem?.name}
                      required
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">SKU</label>
                    <input 
                      name="sku"
                      defaultValue={selectedItem?.sku}
                      required
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Category</label>
                    <select 
                      name="category"
                      defaultValue={selectedItem?.category}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="Electrical">Electrical</option>
                      <option value="Plumbing">Plumbing</option>
                      <option value="HVAC">HVAC</option>
                      <option value="Hardware">Hardware</option>
                      <option value="Tools">Tools</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Unit</label>
                    <input 
                      name="unit"
                      defaultValue={selectedItem?.unit || 'Each'}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Base Price</label>
                    <input 
                      name="basePrice"
                      type="number"
                      step="0.01"
                      defaultValue={selectedItem?.basePrice}
                      required
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Description</label>
                    <textarea 
                      name="description"
                      defaultValue={selectedItem?.description}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setIsEditModalOpen(false);
                      setSelectedItem(null);
                    }}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                  >
                    {isEditModalOpen ? 'Save Changes' : 'Add Item'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transfer Modal */}
      <AnimatePresence>
        {isTransferModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Transfer Stock to Technician</h3>
                <button 
                  onClick={() => setIsTransferModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XCircle className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              <form className="p-6 space-y-4" onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const techId = formData.get('technicianId') as string;
                const itemId = formData.get('itemId') as string;
                const quantity = parseInt(formData.get('quantity') as string);

                transferStockToTechnician(techId, itemId, quantity);
                setIsTransferModalOpen(false);
              }}>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Select Technician</label>
                  <select 
                    name="technicianId"
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Choose a technician...</option>
                    {technicians.map(tech => (
                      <option key={tech.id} value={tech.id}>{tech.fullName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Select Item</label>
                  <select 
                    name="itemId"
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Choose an item...</option>
                    {inventoryItems.filter(i => i.status === 'active').map(item => (
                      <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Quantity</label>
                  <input 
                    name="quantity"
                    type="number"
                    min="1"
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsTransferModalOpen(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                  >
                    Transfer Stock
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
