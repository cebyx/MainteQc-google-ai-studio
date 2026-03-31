import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { formatCurrency, formatDate } from '../lib/utils';
import { FileText, Send, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

export const BillingView: React.FC = () => {
  const { role, quotes, invoices, clients, tickets, createQuote, updateQuoteStatus, createInvoice, updateInvoiceStatus, updateTicket } = useApp();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string>('');

  const handleCreateQuote = async () => {
    if (!selectedTicketId) return;
    const ticket = tickets.find(t => t.id === selectedTicketId);
    if (!ticket) return;
    
    setIsProcessing('create-quote');
    try {
      await createQuote({
        ticketId: ticket.id,
        clientId: ticket.clientId,
        propertyId: ticket.propertyId,
        status: 'sent',
        subtotal: 150.00,
        tax: 0,
        total: 150.00,
        notes: 'Initial quote',
        lineItems: [
          { description: 'Service Call', quantity: 1, rate: 50.00, total: 50.00 },
          { description: 'Labor (2 hrs)', quantity: 2, rate: 50.00, total: 100.00 }
        ]
      });
      setShowQuoteModal(false);
      setSelectedTicketId('');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleNewInvoice = async () => {
    if (!selectedTicketId) return;
    const ticket = tickets.find(t => t.id === selectedTicketId);
    if (!ticket) return;
    
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    setIsProcessing('create-invoice');
    try {
      await createInvoice({
        ticketId: ticket.id,
        clientId: ticket.clientId,
        propertyId: ticket.propertyId,
        status: 'unpaid',
        subtotal: 250.00,
        tax: 0,
        total: 250.00,
        dueDate: dueDate.toISOString(),
        paymentMethod: '',
        notes: 'Initial invoice',
        lineItems: [
          { description: 'Service Call', quantity: 1, rate: 50.00, total: 50.00 },
          { description: 'Labor (4 hrs)', quantity: 4, rate: 50.00, total: 200.00 }
        ]
      });
      setShowInvoiceModal(false);
      setSelectedTicketId('');
    } finally {
      setIsProcessing(null);
    }
  };

  const getEligibleQuoteTickets = () => {
    return tickets.filter(t => {
      const hasActiveQuote = quotes.some(q => q.ticketId === t.id && ['draft', 'sent', 'accepted'].includes(q.status));
      return !hasActiveQuote;
    });
  };

  const getEligibleInvoiceTickets = () => {
    return tickets.filter(t => {
      const hasActiveInvoice = invoices.some(i => i.ticketId === t.id && ['draft', 'sent', 'unpaid'].includes(i.status));
      // Focus on completed jobs or jobs that don't have an active invoice
      return !hasActiveInvoice && t.status === 'completed';
    });
  };

  const handleQuoteAction = async (id: string, status: 'accepted' | 'declined') => {
    setIsProcessing(`quote-${id}`);
    try {
      await updateQuoteStatus(id, status);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleInvoiceAction = async (id: string, status: 'paid', method: string) => {
    setIsProcessing(`invoice-${id}`);
    try {
      await updateInvoiceStatus(id, status, method);
    } finally {
      setIsProcessing(null);
    }
  };

  const renderQuotes = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Quotes & Estimates</h3>
        {role === 'ADMIN' && (
          <button 
            onClick={() => setShowQuoteModal(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white"
          >
            Create Quote
          </button>
        )}
      </div>
      {quotes.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500">No quotes found.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quotes.map(quote => (
            <div key={quote.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest",
                  quote.status === 'accepted' ? "bg-emerald-100 text-emerald-700" : 
                  quote.status === 'declined' ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                )}>
                  {quote.status}
                </div>
                <span className="text-xs text-gray-400">#{quote.id.slice(-6)}</span>
              </div>
              <div className="mb-4">
                <div className="text-2xl font-black text-gray-900">{formatCurrency(quote.total)}</div>
                <div className="text-xs text-gray-500">Estimate for Ticket #{quote.ticketId.slice(-4)}</div>
              </div>
              <div className="space-y-2 border-t border-gray-50 pt-4">
                {quote.lineItems.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-gray-600">{item.description}</span>
                    <span className="font-medium text-gray-900">{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>
              {role === 'CLIENT' && quote.status === 'sent' && (
                <div className="mt-6 flex gap-2">
                  <button 
                    onClick={() => handleQuoteAction(quote.id, 'accepted')}
                    disabled={isProcessing === `quote-${quote.id}`}
                    className="flex-1 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white disabled:opacity-50"
                  >
                    Accept
                  </button>
                  <button 
                    onClick={() => handleQuoteAction(quote.id, 'declined')}
                    disabled={isProcessing === `quote-${quote.id}`}
                    className="flex-1 rounded-xl border border-red-200 bg-red-50 py-2 text-xs font-bold text-red-600 disabled:opacity-50"
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderInvoices = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Invoices</h3>
        {role === 'ADMIN' && (
          <button 
            onClick={() => setShowInvoiceModal(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white"
          >
            New Invoice
          </button>
        )}
      </div>
      {invoices.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500">No invoices found.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {invoices.map(invoice => (
            <div key={invoice.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest",
                  invoice.status === 'paid' ? "bg-emerald-100 text-emerald-700" : 
                  invoice.status === 'overdue' ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                )}>
                  {invoice.status}
                </div>
                <span className="text-xs text-gray-400">#{invoice.id.slice(-6)}</span>
              </div>
              <div className="mb-4">
                <div className="text-2xl font-black text-gray-900">{formatCurrency(invoice.total)}</div>
                <div className="text-xs text-gray-500">Due: {formatDate(invoice.dueDate)}</div>
              </div>
              <div className="mt-6">
                {invoice.status === 'unpaid' && role === 'CLIENT' ? (
                  <button 
                    onClick={() => handleInvoiceAction(invoice.id, 'paid', 'Credit Card')}
                    disabled={isProcessing === `invoice-${invoice.id}`}
                    className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-100 disabled:opacity-50"
                  >
                    {isProcessing === `invoice-${invoice.id}` ? 'Processing...' : 'Pay Now'}
                  </button>
                ) : invoice.status === 'unpaid' && role === 'ADMIN' ? (
                  <button 
                    onClick={() => handleInvoiceAction(invoice.id, 'paid', 'Manual Entry')}
                    disabled={isProcessing === `invoice-${invoice.id}`}
                    className="w-full rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                  >
                    {isProcessing === `invoice-${invoice.id}` ? 'Processing...' : 'Mark as Paid'}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    {invoice.status === 'paid' ? `Paid via ${invoice.paymentMethod || 'Unknown'}` : 'Awaiting Payment'}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-12">
      {renderQuotes()}
      {renderInvoices()}

      {/* Quote Modal */}
      {showQuoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Create Quote</h3>
            <div className="mb-6">
              <label className="mb-2 block text-sm font-bold text-gray-700">Select Ticket</label>
              <select
                className="w-full rounded-xl border-gray-200 text-sm"
                value={selectedTicketId}
                onChange={(e) => setSelectedTicketId(e.target.value)}
              >
                <option value="">-- Choose a ticket --</option>
                {getEligibleQuoteTickets()
                  .map(t => (
                  <option key={t.id} value={t.id}>{t.title} ({clients.find(c => c.id === t.clientId)?.fullName || 'Unknown Client'})</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowQuoteModal(false); setSelectedTicketId(''); }}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateQuote}
                disabled={!selectedTicketId || isProcessing === 'create-quote'}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {isProcessing === 'create-quote' ? 'Creating...' : 'Create Quote'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Create Invoice</h3>
            <div className="mb-6">
              <label className="mb-2 block text-sm font-bold text-gray-700">Select Ticket</label>
              <select
                className="w-full rounded-xl border-gray-200 text-sm"
                value={selectedTicketId}
                onChange={(e) => setSelectedTicketId(e.target.value)}
              >
                <option value="">-- Choose a ticket --</option>
                {getEligibleInvoiceTickets()
                  .map(t => (
                  <option key={t.id} value={t.id}>{t.title} ({clients.find(c => c.id === t.clientId)?.fullName || 'Unknown Client'})</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowInvoiceModal(false); setSelectedTicketId(''); }}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleNewInvoice}
                disabled={!selectedTicketId || isProcessing === 'create-invoice'}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {isProcessing === 'create-invoice' ? 'Creating...' : 'Create Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
