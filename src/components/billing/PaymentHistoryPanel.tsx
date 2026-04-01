import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle,
  FileText,
  Calendar,
  ArrowRight,
  MoreVertical,
  Download,
  Plus
} from 'lucide-react';
import { useApp } from '../../AppContext';
import { Invoice, PaymentRecord } from '../../types';
import { format } from 'date-fns';

interface PaymentHistoryPanelProps {
  invoice: Invoice;
  onClose: () => void;
}

const PaymentHistoryPanel: React.FC<PaymentHistoryPanelProps> = ({ invoice, onClose }) => {
  const { listPaymentRecords, recordPayment, loading: appLoading } = useApp();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [newPayment, setNewPayment] = useState({
    amount: invoice.total - (payments.reduce((sum, p) => sum + (p.status === 'completed' ? p.amount : 0), 0)),
    method: 'credit_card' as const,
    notes: ''
  });

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const records = await listPaymentRecords(invoice.id);
        setPayments(records);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load payment history.');
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, [invoice.id, listPaymentRecords]);

  const handleRecordPayment = async () => {
    if (newPayment.amount <= 0) {
      setError('Payment amount must be greater than zero.');
      return;
    }

    setLoading(true);
    try {
      await recordPayment({
        invoiceId: invoice.id,
        clientId: invoice.clientId,
        amount: newPayment.amount,
        currency: 'USD',
        method: newPayment.method,
        status: 'completed',
        notes: newPayment.notes
      });
      const updatedRecords = await listPaymentRecords(invoice.id);
      setPayments(updatedRecords);
      setIsAddingPayment(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-100';
      case 'pending': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'failed': return 'text-red-600 bg-red-50 border-red-100';
      case 'refunded': return 'text-gray-600 bg-gray-50 border-gray-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  const totalPaid = payments.reduce((sum, p) => sum + (p.status === 'completed' ? p.amount : 0), 0);
  const balanceRemaining = Math.max(0, invoice.total - totalPaid);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Payment History</h2>
              <p className="text-xs text-gray-500">Invoice #{invoice.id.substring(0, 8)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Invoice Total</div>
              <div className="text-xl font-bold text-gray-900">${invoice.total.toFixed(2)}</div>
            </div>
            <div className="p-4 bg-green-50 rounded-xl border border-green-100">
              <div className="text-xs text-green-600 uppercase font-bold tracking-wider mb-1">Total Paid</div>
              <div className="text-xl font-bold text-green-700">${totalPaid.toFixed(2)}</div>
            </div>
          </div>

          {balanceRemaining > 0 && !isAddingPayment && (
            <button
              onClick={() => setIsAddingPayment(true)}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Record New Payment</span>
            </button>
          )}

          {isAddingPayment && (
            <div className="p-4 bg-white border border-primary/20 rounded-xl space-y-4 shadow-sm ring-1 ring-primary/5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-sm">Record Payment</h3>
                <button onClick={() => setIsAddingPayment(false)} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({ ...newPayment, amount: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Method</label>
                  <select
                    value={newPayment.method}
                    onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  >
                    <option value="credit_card">Credit Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="check">Check</option>
                    <option value="cash">Cash</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleRecordPayment}
                disabled={loading}
                className="w-full bg-primary text-white py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Confirm Payment</span>
              </button>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              Transaction History
            </h3>
            
            {loading && !isAddingPayment ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : payments.length > 0 ? (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div key={payment.id} className="p-4 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition-shadow flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${getStatusColor(payment.status)}`}>
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">${payment.amount.toFixed(2)}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          <span>{payment.method}</span>
                          <span className="w-1 h-1 bg-gray-300 rounded-full" />
                          <span>{format(new Date(payment.timestamp), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-sm text-gray-500">No payment records found for this invoice.</p>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Payments are processed securely.</span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistoryPanel;
