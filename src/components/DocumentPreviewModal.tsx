import React from 'react';
import { Quote, Invoice, ServiceSummary, BrandSettings, AuthorizationRecord, PaymentRecord, ReminderEvent } from '../types';
import { X, Download, Printer, Send, FileText, CheckCircle2, AlertCircle, ShieldCheck, DollarSign, Bell, Calendar, User, Clock, Info, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'quote' | 'invoice' | 'summary' | 'authorization' | 'payment' | 'reminder';
  data: Quote | Invoice | ServiceSummary | AuthorizationRecord | PaymentRecord | ReminderEvent;
  brand: BrandSettings;
  onExport?: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  type,
  data,
  brand,
  onExport
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
    onExport?.();
  };

  const renderQuote = (quote: Quote) => (
    <div className="space-y-8 p-8 bg-white text-gray-900" id="printable-document">
      <div className="flex justify-between items-start border-b pb-8">
        <div>
          {brand.logo && <img src={brand.logo} alt={brand.companyName} className="h-12 mb-4 object-contain" referrerPolicy="no-referrer" />}
          <h1 className="text-2xl font-bold uppercase tracking-tighter">Quote</h1>
          <p className="text-sm text-gray-500">#{quote.id.slice(-8).toUpperCase()}</p>
        </div>
        <div className="text-right space-y-1">
          <p className="font-bold">{brand.companyName}</p>
          <p className="text-sm text-gray-500">{brand.address}</p>
          <p className="text-sm text-gray-500">{brand.phone}</p>
          <p className="text-sm text-gray-500">{brand.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Quote For</h3>
          <p className="font-bold">Ticket #{quote.ticketId.slice(-6)}</p>
          <p className="text-sm text-gray-500">Date: {new Date(quote.createdAt).toLocaleDateString()}</p>
          <p className="text-sm text-gray-500">Status: {quote.status.toUpperCase()}</p>
        </div>
      </div>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-900">
            <th className="py-4 text-xs font-bold uppercase">Description</th>
            <th className="py-4 text-xs font-bold uppercase text-right">Qty</th>
            <th className="py-4 text-xs font-bold uppercase text-right">Rate</th>
            <th className="py-4 text-xs font-bold uppercase text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {quote.lineItems.map((item, idx) => (
            <tr key={idx} className="border-b border-gray-100">
              <td className="py-4 text-sm">{item.description}</td>
              <td className="py-4 text-sm text-right">{item.quantity}</td>
              <td className="py-4 text-sm text-right">${item.rate.toFixed(2)}</td>
              <td className="py-4 text-sm text-right font-medium">${item.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span>${quote.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Tax</span>
            <span>${quote.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total</span>
            <span>${quote.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {quote.notes && (
        <div className="pt-8 border-t">
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Notes</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{quote.notes}</p>
        </div>
      )}

      <div className="pt-12 text-center text-xs text-gray-400">
        <p>Thank you for your business!</p>
        <p>{brand.tagline}</p>
      </div>
    </div>
  );

  const renderInvoice = (invoice: Invoice) => (
    <div className="space-y-8 p-8 bg-white text-gray-900" id="printable-document">
      <div className="flex justify-between items-start border-b pb-8">
        <div>
          {brand.logo && <img src={brand.logo} alt={brand.companyName} className="h-12 mb-4 object-contain" referrerPolicy="no-referrer" />}
          <h1 className="text-2xl font-bold uppercase tracking-tighter">Invoice</h1>
          <p className="text-sm text-gray-500">#{invoice.id.slice(-8).toUpperCase()}</p>
        </div>
        <div className="text-right space-y-1">
          <p className="font-bold">{brand.companyName}</p>
          <p className="text-sm text-gray-500">{brand.address}</p>
          <p className="text-sm text-gray-500">{brand.phone}</p>
          <p className="text-sm text-gray-500">{brand.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Bill To</h3>
          <p className="font-bold">Ticket #{invoice.ticketId.slice(-6)}</p>
          <p className="text-sm text-gray-500">Date: {new Date(invoice.createdAt).toLocaleDateString()}</p>
          <p className="text-sm text-gray-500">Due Date: {new Date(invoice.dueDate).toLocaleDateString()}</p>
        </div>
        <div className="text-right">
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Payment Status</h3>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase ${
            invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 
            invoice.status === 'overdue' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {invoice.status === 'paid' ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
            {invoice.status}
          </div>
        </div>
      </div>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-900">
            <th className="py-4 text-xs font-bold uppercase">Description</th>
            <th className="py-4 text-xs font-bold uppercase text-right">Qty</th>
            <th className="py-4 text-xs font-bold uppercase text-right">Rate</th>
            <th className="py-4 text-xs font-bold uppercase text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lineItems.map((item, idx) => (
            <tr key={idx} className="border-b border-gray-100">
              <td className="py-4 text-sm">{item.description}</td>
              <td className="py-4 text-sm text-right">{item.quantity}</td>
              <td className="py-4 text-sm text-right">${item.rate.toFixed(2)}</td>
              <td className="py-4 text-sm text-right font-medium">${item.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span>${invoice.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Tax</span>
            <span>${invoice.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total</span>
            <span>${invoice.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {invoice.notes && (
        <div className="pt-8 border-t">
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Notes</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{invoice.notes}</p>
        </div>
      )}

      <div className="pt-12 text-center text-xs text-gray-400">
        <p>Thank you for your business!</p>
        <p>{brand.tagline}</p>
      </div>
    </div>
  );

  const renderSummary = (summary: ServiceSummary) => (
    <div className="space-y-8 p-8 bg-white text-gray-900" id="printable-document">
      <div className="flex justify-between items-start border-b pb-8">
        <div>
          {brand.logo && <img src={brand.logo} alt={brand.companyName} className="h-12 mb-4 object-contain" referrerPolicy="no-referrer" />}
          <h1 className="text-2xl font-bold uppercase tracking-tighter">Service Summary</h1>
          <p className="text-sm text-gray-500">Ticket #{summary.ticketId.slice(-6)}</p>
        </div>
        <div className="text-right space-y-1">
          <p className="font-bold">{brand.companyName}</p>
          <p className="text-sm text-gray-500">Completed By: {summary.completedByName}</p>
          <p className="text-sm text-gray-500">Date: {new Date(summary.completionTimestamp).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="space-y-6">
        <section>
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Executive Summary</h3>
          <p className="text-sm text-gray-700 leading-relaxed">{summary.summary}</p>
        </section>

        <section>
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Work Performed</h3>
          <p className="text-sm text-gray-700 leading-relaxed">{summary.workPerformed}</p>
        </section>

        {summary.materialsUsed && summary.materialsUsed.length > 0 && (
          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Materials & Parts</h3>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-2 text-xs font-bold uppercase">Item</th>
                  <th className="py-2 text-xs font-bold uppercase text-right">Qty</th>
                </tr>
              </thead>
              <tbody>
                {summary.materialsUsed.map((m, idx) => (
                  <tr key={idx} className="border-b border-gray-50">
                    <td className="py-2 text-sm">{m.description}</td>
                    <td className="py-2 text-sm text-right">{m.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <section className="grid grid-cols-2 gap-8 pt-6 border-t">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Follow-up Required</h3>
            <p className="text-sm font-bold">{summary.followUpNeeded ? 'YES' : 'NO'}</p>
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Recommended Next Steps</h3>
            <p className="text-sm text-gray-700">{summary.recommendedNextSteps || 'None'}</p>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Client Notes</h3>
          <p className="text-sm text-gray-700 italic">"{summary.clientVisibleNotes}"</p>
        </section>
      </div>

      <div className="pt-12 text-center text-xs text-gray-400">
        <p>This is an official service record from {brand.companyName}</p>
      </div>
    </div>
  );

  const renderAuthorization = (auth: AuthorizationRecord) => (
    <div className="space-y-8 p-8 bg-white text-gray-900" id="printable-document">
      <div className="flex justify-between items-start border-b pb-8">
        <div>
          {brand.logo && <img src={brand.logo} alt={brand.companyName} className="h-12 mb-4 object-contain" referrerPolicy="no-referrer" />}
          <h1 className="text-2xl font-bold uppercase tracking-tighter">Work Authorization</h1>
          <p className="text-sm text-gray-500">Record ID: {auth.id.slice(-8).toUpperCase()}</p>
        </div>
        <div className="text-right space-y-1">
          <p className="font-bold">{brand.companyName}</p>
          <p className="text-sm text-gray-500">Date: {new Date(auth.timestamp).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-indigo-900 text-sm">Authorization Type: {auth.type.replace('_', ' ').toUpperCase()}</h3>
            <p className="text-xs text-indigo-700 mt-1">This document serves as a digital record of approval for the specified work or quote.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Related Record</h3>
            <p className="text-sm font-bold">{(auth as any).quoteId ? `Quote #${(auth as any).quoteId.slice(-6)}` : `Ticket #${auth.ticketId.slice(-6)}`}</p>
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Status</h3>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
              auth.status === 'authorized' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'
            }`}>
              {auth.status}
            </span>
          </div>
        </div>

        <div className="pt-8 border-t">
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Digital Signature</h3>
          <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 border-dashed text-center">
            <p className="font-serif text-2xl italic text-gray-800 mb-2">{auth.signatureName}</p>
            <div className="w-48 h-px bg-gray-300 mx-auto mb-2" />
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Digitally Signed on {new Date(auth.timestamp).toLocaleString()}</p>
          </div>
        </div>

        {auth.notes && (
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Authorization Notes</h3>
            <p className="text-sm text-gray-600 italic">"{auth.notes}"</p>
          </div>
        ) || null}
      </div>

      <div className="pt-12 text-center text-xs text-gray-400">
        <p>This authorization is legally binding and stored securely in the MainteQc system.</p>
      </div>
    </div>
  );

  const renderPayment = (payment: PaymentRecord) => (
    <div className="space-y-8 p-8 bg-white text-gray-900" id="printable-document">
      <div className="flex justify-between items-start border-b pb-8">
        <div>
          {brand.logo && <img src={brand.logo} alt={brand.companyName} className="h-12 mb-4 object-contain" referrerPolicy="no-referrer" />}
          <h1 className="text-2xl font-bold uppercase tracking-tighter">Payment Receipt</h1>
          <p className="text-sm text-gray-500">Transaction ID: {payment.id.slice(-8).toUpperCase()}</p>
        </div>
        <div className="text-right space-y-1">
          <p className="font-bold">{brand.companyName}</p>
          <p className="text-sm text-gray-500">Date: {new Date(payment.timestamp).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-12 bg-green-50 rounded-3xl border border-green-100">
        <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-green-600/20">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-green-900">${payment.amount.toFixed(2)}</h2>
        <p className="text-green-700 font-medium mt-1">Payment Successful</p>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Payment Method</h3>
            <p className="text-sm font-bold capitalize">{payment.method.replace('_', ' ')}</p>
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Reference</h3>
            <p className="text-sm font-mono">{payment.reference || 'N/A'}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Related Invoice</h3>
            <p className="text-sm font-bold">Invoice #{payment.invoiceId.slice(-6)}</p>
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Status</h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200 uppercase tracking-wider">
              {payment.status}
            </span>
          </div>
        </div>
      </div>

      {payment.notes && (
        <div className="pt-8 border-t">
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Payment Notes</h3>
          <p className="text-sm text-gray-600">{payment.notes}</p>
        </div>
      ) || null}

      <div className="pt-12 text-center text-xs text-gray-400">
        <p>Thank you for your payment!</p>
        <p>A copy of this receipt has been saved to your records center.</p>
      </div>
    </div>
  );

  const renderReminder = (reminder: ReminderEvent) => (
    <div className="space-y-8 p-8 bg-white text-gray-900" id="printable-document">
      <div className="flex justify-between items-start border-b pb-8">
        <div>
          {brand.logo && <img src={brand.logo} alt={brand.companyName} className="h-12 mb-4 object-contain" referrerPolicy="no-referrer" />}
          <h1 className="text-2xl font-bold uppercase tracking-tighter">Reminder Notice</h1>
          <p className="text-sm text-gray-500">Notice ID: {reminder.id.slice(-8).toUpperCase()}</p>
        </div>
        <div className="text-right space-y-1">
          <p className="font-bold">{brand.companyName}</p>
          <p className="text-sm text-gray-500">Sent Date: {new Date(reminder.timestamp).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl flex gap-4">
        <div className="p-3 bg-amber-100 rounded-xl h-fit">
          <Bell className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <h3 className="font-bold text-amber-900 text-lg">Action Required: {reminder.type.replace('_', ' ').toUpperCase()}</h3>
          <p className="text-sm text-amber-700 mt-1">This is a formal reminder regarding an outstanding action on your account.</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Subject</h3>
            <p className="text-sm font-bold">{reminder.invoiceId ? `Invoice #${reminder.invoiceId.slice(-6)}` : `Quote #${reminder.targetId.slice(-6)}`}</p>
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Notice Type</h3>
            <p className="text-sm font-bold capitalize">{reminder.type.replace('_', ' ')}</p>
          </div>
        </div>

        <div className="pt-8 border-t">
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Message Details</h3>
          <div className="p-6 bg-gray-50 rounded-xl border border-gray-100 min-h-[100px]">
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{reminder.notes || 'No additional notes provided.'}</p>
          </div>
        </div>
      </div>

      <div className="pt-12 text-center text-xs text-gray-400">
        <p>If you have already addressed this matter, please disregard this notice.</p>
        <p>Contact us at {brand.phone} if you have any questions.</p>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl bg-gray-50 shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-xl">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Document Preview</h2>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">{type}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600 flex items-center gap-2 px-4"
                title="Print / PDF"
              >
                <Printer className="h-5 w-5" />
                <span className="text-sm font-bold">Print / PDF</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 sm:p-12 bg-gray-100">
            <div className="max-w-3xl mx-auto shadow-xl rounded-sm overflow-hidden">
              {type === 'quote' && renderQuote(data as Quote)}
              {type === 'invoice' && renderInvoice(data as Invoice)}
              {type === 'summary' && renderSummary(data as ServiceSummary)}
              {type === 'authorization' && renderAuthorization(data as AuthorizationRecord)}
              {type === 'payment' && renderPayment(data as PaymentRecord)}
              {type === 'reminder' && renderReminder(data as ReminderEvent)}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t bg-white flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-8 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold shadow-lg active:scale-95 transition-transform flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Record
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
