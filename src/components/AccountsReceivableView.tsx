import React, { useState, useMemo } from 'react';
import { useApp } from '../AppContext';
import { 
  Search, Filter, Download, Mail, Phone, 
  DollarSign, Clock, AlertCircle, CheckCircle2,
  ChevronRight, ArrowUpRight, User, FileText,
  Calendar, PieChart, BarChart3
} from 'lucide-react';
import { motion } from 'motion/react';
import { format, differenceInDays } from 'date-fns';
import { Invoice, PaymentRecord, Client } from '../types';

const AccountsReceivableView: React.FC = () => {
  const { invoices, paymentRecords, clients } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unpaid' | 'overdue' | 'paid'>('all');

  // Calculate Aging Buckets
  const agingBuckets = useMemo(() => {
    const buckets = {
      current: 0,
      '1-30': 0,
      '31-60': 0,
      '61-90': 0,
      '90+': 0,
    };

    invoices.forEach(inv => {
      if (inv.status === 'paid') return;
      
      const balance = inv.balanceRemaining ?? inv.total;
      const daysOverdue = differenceInDays(new Date(), new Date(inv.dueDate));

      if (daysOverdue <= 0) buckets.current += balance;
      else if (daysOverdue <= 30) buckets['1-30'] += balance;
      else if (daysOverdue <= 60) buckets['31-60'] += balance;
      else if (daysOverdue <= 90) buckets['61-90'] += balance;
      else buckets['90+'] += balance;
    });

    return buckets;
  }, [invoices]);

  const totalAR = Object.values(agingBuckets).reduce((a, b) => a + b, 0);

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         inv.clientId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounts Receivable</h1>
          <p className="text-gray-500">Track incoming revenue and manage collections</p>
        </div>
        <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
          <Download className="w-4 h-4" />
          Export AR Aging
        </button>
      </div>

      {/* Aging Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <AgingCard label="Current" amount={agingBuckets.current} color="blue" />
        <AgingCard label="1-30 Days" amount={agingBuckets['1-30']} color="amber" />
        <AgingCard label="31-60 Days" amount={agingBuckets['31-60']} color="orange" />
        <AgingCard label="61-90 Days" amount={agingBuckets['61-90']} color="rose" />
        <AgingCard label="90+ Days" amount={agingBuckets['90+']} color="red" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4 items-center flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                placeholder="Search invoices or clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="unpaid">Unpaid</option>
              <option value="overdue">Overdue</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div className="text-sm text-gray-500 font-medium">
            Total Outstanding: <span className="text-gray-900 font-bold">${totalAR.toLocaleString()}</span>
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Client</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Due Date</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Balance</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredInvoices.map((inv) => {
              const client = clients.find(c => c.id === inv.clientId);
              const balance = inv.balanceRemaining ?? (inv.status === 'paid' ? 0 : inv.total);
              
              return (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">#{inv.id.slice(-6)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">{client?.fullName || 'Unknown Client'}</span>
                      <span className="text-xs text-gray-500">{client?.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{format(new Date(inv.dueDate), 'MMM d, yyyy')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    ${inv.total.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-bold ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      ${balance.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="px-6 py-4">
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Mail className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {filteredInvoices.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">No outstanding invoices found</p>
          </div>
        )}
      </div>
    </div>
  );
};

const AgingCard: React.FC<{ label: string; amount: number; color: 'blue' | 'amber' | 'orange' | 'rose' | 'red' }> = ({ label, amount, color }) => {
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    orange: 'border-orange-200 bg-orange-50 text-orange-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
    red: 'border-red-200 bg-red-50 text-red-700'
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]} shadow-sm`}>
      <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">{label}</p>
      <p className="text-xl font-bold">${amount.toLocaleString()}</p>
    </div>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    unpaid: 'bg-amber-50 text-amber-700 border-amber-100',
    overdue: 'bg-rose-50 text-rose-700 border-rose-100',
    draft: 'bg-gray-50 text-gray-700 border-gray-100'
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[status] || styles.unpaid}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default AccountsReceivableView;
