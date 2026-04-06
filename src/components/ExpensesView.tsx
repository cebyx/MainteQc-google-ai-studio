import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { 
  Plus, Search, Filter, MoreVertical, Download, 
  Receipt, DollarSign, Calendar, Tag, User, 
  Briefcase, CheckCircle2, Clock, AlertCircle,
  FileText, Image as ImageIcon, Trash2, Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ExpenseRecord } from '../types';

const ExpensesView: React.FC = () => {
  const { expenses, technicians, createExpense, updateExpense } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAddExpense, setShowAddExpense] = useState(false);

  const categories = ['Fuel', 'Vehicle', 'Tools', 'Office', 'Software', 'Subcontractor', 'Travel', 'Other'];

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exp.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || exp.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.total, 0);

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operating Expenses</h1>
          <p className="text-gray-500">Track and categorize business costs and reimbursements</p>
        </div>
        <button 
          onClick={() => setShowAddExpense(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Record Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-500">Total Expenses (Period)</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">${totalExpenses.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">Based on current filters</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-500">Pending Approval</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${expenses.filter(e => e.status === 'pending').reduce((s, e) => s + e.total, 0).toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">Technician submissions</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Receipt className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-500">Reimbursed This Month</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">$1,240.00</p>
          <p className="text-xs text-gray-400 mt-1">Paid to technicians</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select 
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Expense Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Entity</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredExpenses.map((exp) => (
              <tr key={exp.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{format(new Date(exp.date), 'MMM d, yyyy')}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium uppercase tracking-wider">
                    {exp.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">{exp.description}</span>
                    {exp.notes && <span className="text-xs text-gray-400 truncate max-w-[200px]">{exp.notes}</span>}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {exp.ticketId ? (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        <Briefcase className="w-3 h-3" />
                        Ticket #{exp.ticketId.slice(-4)}
                      </div>
                    ) : exp.technicianId ? (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                        <User className="w-3 h-3" />
                        {technicians.find(t => t.id === exp.technicianId)?.fullName || 'Technician'}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">General</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gray-900">
                  ${exp.total.toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={exp.status} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {exp.receiptUrl && (
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="View Receipt">
                        <ImageIcon className="w-4 h-4" />
                      </button>
                    )}
                    <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredExpenses.length === 0 && (
          <div className="text-center py-12">
            <Receipt className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">No expenses recorded for this period</p>
          </div>
        )}
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    reimbursed: 'bg-blue-50 text-blue-700 border-blue-100',
    pending: 'bg-amber-50 text-amber-700 border-amber-100',
    rejected: 'bg-rose-50 text-rose-700 border-rose-100'
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[status] || styles.pending}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default ExpensesView;
