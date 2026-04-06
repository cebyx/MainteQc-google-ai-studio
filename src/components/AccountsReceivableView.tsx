import React, { useState, useMemo } from 'react';
import { useApp } from '../AppContext';
import { 
  Search, Filter, Download, Mail, Phone, 
  DollarSign, Clock, AlertCircle, CheckCircle2,
  ChevronRight, ArrowUpRight, User, FileText,
  Calendar, PieChart, BarChart3, Plus
} from 'lucide-react';
import { motion } from 'motion/react';
import { format, differenceInDays } from 'date-fns';
import { Invoice, PaymentRecord, Client } from '../types';

const AccountsReceivableView: React.FC = () => {
  const { invoices, paymentRecords, clients } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unpaid' | 'overdue' | 'paid'>('all');

  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const { recordPayment } = useApp();

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
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setSelectedInvoice(inv);
                          setShowRecordPayment(true);
                        }}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Record Payment"
                      >
                        <DollarSign className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Mail className="w-4 h-4" />
                      </button>
                    </div>
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

      {/* Record Payment Modal */}
      {showRecordPayment && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Record Payment</h2>
              <button onClick={() => setShowRecordPayment(false)} className="text-gray-400 hover:text-gray-600">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              await recordPayment({
                invoiceId: selectedInvoice.id,
                clientId: selectedInvoice.clientId,
                ticketId: selectedInvoice.ticketId,
                amount: parseFloat(formData.get('amount') as string),
                currency: 'USD',
                method: formData.get('method') as any,
                status: 'completed',
                transactionId: formData.get('transactionId') as string,
                notes: formData.get('notes') as string
              });
              setShowRecordPayment(false);
            }} className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Invoice #{selectedInvoice.id.slice(-6)}</p>
                <p className="text-lg font-bold text-gray-900">Balance: ${(selectedInvoice.balanceRemaining ?? selectedInvoice.total).toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount *</label>
                <input 
                  name="amount" 
                  type="number" 
                  step="0.01" 
                  required 
                  defaultValue={selectedInvoice.balanceRemaining ?? selectedInvoice.total}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                <select name="method" required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="credit_card">Credit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="check">Check</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID / Reference</label>
                <input name="transactionId" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea name="notes" rows={2} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowRecordPayment(false)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700">
                  Record Payment
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
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
