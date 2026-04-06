import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { 
  Plus, Search, Filter, MoreVertical, Download, 
  ExternalLink, CheckCircle2, Clock, AlertCircle,
  Building2, Mail, Phone, MapPin, DollarSign,
  ChevronRight, ArrowLeft, Trash2, Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { Vendor, VendorBill } from '../types';

const AccountsPayableView: React.FC = () => {
  const { vendors, vendorBills, createVendor, updateVendor, createVendorBill, updateVendorBill, recordVendorPayment } = useApp();
  const [activeTab, setActiveTab] = useState<'bills' | 'vendors'>('bills');
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [showAddBill, setShowAddBill] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBills = vendorBills.filter(bill => 
    bill.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.billNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredVendors = vendors.filter(vendor => 
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounts Payable</h1>
          <p className="text-gray-500">Manage vendor relationships and outstanding bills</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => activeTab === 'bills' ? setShowAddBill(true) : setShowAddVendor(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {activeTab === 'bills' ? 'Record Bill' : 'Add Vendor'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('bills')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'bills' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Vendor Bills
        </button>
        <button 
          onClick={() => setActiveTab('vendors')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'vendors' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Vendors
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {activeTab === 'bills' ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Bill #</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBills.map((bill) => (
                <tr key={bill.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">{bill.billNumber || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{bill.vendorName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{format(new Date(bill.dueDate), 'MMM d, yyyy')}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-gray-900">${bill.total.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={bill.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredBills.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500">No bills found matching your search</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map((vendor) => (
            <motion.div 
              key={vendor.id}
              whileHover={{ y: -4 }}
              className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <StatusBadge status={vendor.status} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{vendor.name}</h3>
              <p className="text-sm text-gray-500 mb-4">{vendor.category || 'General Vendor'}</p>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  {vendor.email || 'No email'}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  {vendor.phone || 'No phone'}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{vendor.address || 'No address'}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                  View Bills
                </button>
                <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg border border-gray-200">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
          {filteredVendors.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
              <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500">No vendors found. Add your first vendor to get started.</p>
            </div>
          )}
        </div>
      )}

      {/* Modals would go here */}
    </div>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    pending: 'bg-amber-50 text-amber-700 border-amber-100',
    approved: 'bg-blue-50 text-blue-700 border-blue-100',
    overdue: 'bg-rose-50 text-rose-700 border-rose-100',
    cancelled: 'bg-gray-50 text-gray-700 border-gray-100',
    inactive: 'bg-gray-50 text-gray-700 border-gray-100'
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[status] || styles.pending}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default AccountsPayableView;
