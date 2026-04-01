import React, { useMemo } from 'react';
import { useApp } from '../AppContext';
import { 
  Clock, AlertCircle, Send, CheckCircle2, 
  DollarSign, Calendar, User, Phone, 
  Mail, ArrowRight, History, Bell
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { Invoice, Quote } from '../types';

export const CollectionsQueue: React.FC = () => {
  const { invoices, quotes, sendInvoiceReminder, sendQuoteReminder, currentUser, role } = useApp();

  const overdueInvoices = useMemo(() => 
    invoices.filter(i => i.status === 'overdue' || i.status === 'unpaid')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
  [invoices]);

  const pendingQuotes = useMemo(() => 
    quotes.filter(q => q.status === 'sent')
    .sort((a, b) => new Date(a.sentDate || a.createdAt).getTime() - new Date(b.sentDate || b.createdAt).getTime()),
  [quotes]);

  const handleInvoiceReminder = async (id: string) => {
    if (confirm('Send a payment reminder to the client?')) {
      await sendInvoiceReminder(id);
    }
  };

  const handleQuoteReminder = async (id: string) => {
    if (confirm('Send a follow-up reminder for this quote?')) {
      await sendQuoteReminder(id);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Invoice Collections */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 rounded-2xl">
              <DollarSign className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Invoice Collections</h2>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Unpaid & Overdue</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold uppercase tracking-wider">
            {overdueInvoices.length} Items
          </span>
        </div>

        <div className="space-y-3">
          {overdueInvoices.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-gray-200 rounded-3xl bg-gray-50">
              <CheckCircle2 className="h-10 w-10 text-emerald-200 mx-auto mb-3" />
              <p className="text-sm text-gray-500 font-medium">All invoices are up to date!</p>
            </div>
          ) : (
            overdueInvoices.map(inv => (
              <div key={inv.id} className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Invoice #{inv.id.slice(-6)}</h4>
                      <span className={cn(
                        "px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                        inv.status === 'overdue' ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                      )}>
                        {inv.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">Ticket #{inv.ticketId.slice(-6)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-gray-900 tracking-tight">${inv.total.toFixed(2)}</p>
                    <p className={cn(
                      "text-[10px] font-bold uppercase tracking-widest",
                      new Date(inv.dueDate) < new Date() ? "text-rose-500" : "text-gray-400"
                    )}>
                      Due {formatDate(inv.dueDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      <Bell className="h-3 w-3" />
                      Reminders: {inv.reminderCount || 0}
                    </div>
                    {inv.reminderSentAt && (
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        <History className="h-3 w-3" />
                        Last: {new Date(inv.reminderSentAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => handleInvoiceReminder(inv.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold shadow-lg active:scale-95 transition-transform group-hover:bg-blue-600"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Send Reminder
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quote Follow-ups */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-2xl">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Quote Follow-ups</h2>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Awaiting Decision</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">
            {pendingQuotes.length} Items
          </span>
        </div>

        <div className="space-y-3">
          {pendingQuotes.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-gray-200 rounded-3xl bg-gray-50">
              <CheckCircle2 className="h-10 w-10 text-emerald-200 mx-auto mb-3" />
              <p className="text-sm text-gray-500 font-medium">No quotes currently pending.</p>
            </div>
          ) : (
            pendingQuotes.map(quote => (
              <div key={quote.id} className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Quote #{quote.id.slice(-6)}</h4>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                        Sent
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">Ticket #{quote.ticketId.slice(-6)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-gray-900 tracking-tight">${quote.total.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      Sent {formatDate(quote.sentDate || quote.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      <Bell className="h-3 w-3" />
                      Reminders: {quote.reminderCount || 0}
                    </div>
                    {quote.reminderSentAt && (
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        <History className="h-3 w-3" />
                        Last: {new Date(quote.reminderSentAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => handleQuoteReminder(quote.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold shadow-lg active:scale-95 transition-transform group-hover:bg-blue-600"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Follow Up
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export const ReminderCenter: React.FC = () => {
  const { tickets, quotes, invoices, serviceSummaries } = useApp();

  const alerts = useMemo(() => {
    const list: { id: string; type: string; title: string; description: string; severity: 'low' | 'medium' | 'high'; ticketId: string }[] = [];

    // Missing Assignment
    tickets.filter(t => t.status === 'approved' && !t.assignedTechnicianId).forEach(t => {
      list.push({
        id: `assign-${t.id}`,
        type: 'assignment',
        title: 'Missing Technician',
        description: `Ticket #${t.id.slice(-6)} is approved but not assigned.`,
        severity: 'high',
        ticketId: t.id
      });
    });

    // Overdue Invoices
    invoices.filter(i => i.status === 'overdue').forEach(i => {
      list.push({
        id: `invoice-${i.id}`,
        type: 'finance',
        title: 'Overdue Invoice',
        description: `Invoice #${i.id.slice(-6)} is overdue by $${i.total.toFixed(2)}.`,
        severity: 'high',
        ticketId: i.ticketId
      });
    });

    // Missing Service Summary
    tickets.filter(t => t.status === 'completed').forEach(t => {
      const hasSummary = serviceSummaries.some(s => s.ticketId === t.id);
      if (!hasSummary) {
        list.push({
          id: `summary-${t.id}`,
          type: 'ops',
          title: 'Missing Summary',
          description: `Ticket #${t.id.slice(-6)} is completed but missing closeout docs.`,
          severity: 'medium',
          ticketId: t.id
        });
      }
    });

    // Stale Quotes
    quotes.filter(q => q.status === 'sent').forEach(q => {
      const sentDate = new Date(q.sentDate || q.createdAt);
      const diffDays = Math.floor((new Date().getTime() - sentDate.getTime()) / (1000 * 3600 * 24));
      if (diffDays > 3) {
        list.push({
          id: `quote-${q.id}`,
          type: 'sales',
          title: 'Stale Quote',
          description: `Quote #${q.id.slice(-6)} sent ${diffDays} days ago with no response.`,
          severity: 'medium',
          ticketId: q.ticketId
        });
      }
    });

    return list;
  }, [tickets, invoices, serviceSummaries, quotes]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 rounded-2xl">
            <Bell className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Business Automation Alerts</h2>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Operational Intelligence</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase tracking-wider">
          {alerts.length} Active Alerts
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {alerts.length === 0 ? (
          <div className="col-span-full p-12 text-center border border-dashed border-gray-200 rounded-3xl bg-gray-50">
            <CheckCircle2 className="h-10 w-10 text-emerald-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">No operational alerts at this time.</p>
          </div>
        ) : (
          alerts.map(alert => (
            <div key={alert.id} className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex items-start gap-4 group cursor-pointer">
              <div className={cn(
                "p-3 rounded-2xl shrink-0 group-hover:scale-110 transition-transform",
                alert.severity === 'high' ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
              )}>
                {alert.severity === 'high' ? <AlertCircle className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-tight truncate">{alert.title}</h4>
                  <span className={cn(
                    "px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                    alert.severity === 'high' ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                  )}>
                    {alert.severity}
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-medium leading-relaxed mb-3">{alert.description}</p>
                <div className="flex items-center justify-end">
                  <button className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors">
                    View Ticket
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
