import React from 'react';
import { useApp } from '../AppContext';
import { formatCurrency, formatDate } from '../lib/utils';
import { FileText, Send, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

export const BillingView: React.FC = () => {
  const { role, quotes, invoices } = useApp();

  const renderQuotes = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Quotes & Estimates</h3>
        {role === 'ADMIN' && (
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white">Create Quote</button>
        )}
      </div>
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
              <span className="text-xs text-gray-400">#{quote.id}</span>
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
                <button className="flex-1 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white">Accept</button>
                <button className="flex-1 rounded-xl border border-red-200 bg-red-50 py-2 text-xs font-bold text-red-600">Decline</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderInvoices = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Invoices</h3>
        {role === 'ADMIN' && (
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white">New Invoice</button>
        )}
      </div>
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
              <span className="text-xs text-gray-400">#{invoice.id}</span>
            </div>
            <div className="mb-4">
              <div className="text-2xl font-black text-gray-900">{formatCurrency(invoice.total)}</div>
              <div className="text-xs text-gray-500">Due: {formatDate(invoice.dueDate)}</div>
            </div>
            <div className="mt-6">
              {invoice.status === 'unpaid' && role === 'CLIENT' ? (
                <button className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-100">
                  Pay Now
                </button>
              ) : (
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  {invoice.status === 'paid' ? `Paid via ${invoice.paymentMethod}` : 'Awaiting Payment'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-12">
      {renderQuotes()}
      {renderInvoices()}
    </div>
  );
};
