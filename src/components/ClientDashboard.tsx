import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { 
  Plus, 
  Calendar, 
  FileText, 
  MessageSquare, 
  ChevronRight,
  MapPin,
  Clock,
  History,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  FolderOpen
} from 'lucide-react';
import { StatusBadge } from './Badges';
import { cn, formatDate } from '../lib/utils';
import { TicketDetail } from './TicketDetail';
import { Ticket, Quote, Invoice, ActivityEvent, Message } from '../types';

export const ClientDashboard: React.FC<{ setActiveTab: (tab: string) => void }> = ({ setActiveTab }) => {
  const { tickets, currentUser, properties, quotes, invoices, activities, messages, attachments, serviceSummaries, maintenancePlans } = useApp();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Filter records for this client
  const myTickets = tickets.filter(t => t.clientId === currentUser.id);
  const activeJobs = myTickets.filter(t => !['completed', 'cancelled', 'rejected'].includes(t.status));
  const myProperties = properties.filter(p => p.clientId === currentUser.id);
  
  // Financials
  const pendingQuotes = quotes.filter(q => q.clientId === currentUser.id && q.status === 'sent');
  const unpaidInvoices = invoices.filter(i => i.clientId === currentUser.id && i.status === 'unpaid');
  const overdueInvoices = invoices.filter(i => i.clientId === currentUser.id && i.status === 'overdue');
  
  // Maintenance Plans
  const activePlans = maintenancePlans.filter(p => p.clientId === currentUser.id && p.status === 'active');
  const upcomingPlans = activePlans
    .filter(p => new Date(p.nextDueDate) > new Date())
    .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime())
    .slice(0, 3);
  
  // Recent Activity
  const myActivities = activities
    .filter(a => myTickets.some(t => t.id === a.ticketId))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  // Recent Messages
  const myMessages = messages
    .filter(m => m.senderId === currentUser.id || m.recipientId === currentUser.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 3);

  // Recent Documents
  const myAttachments = attachments
    .filter(a => myTickets.some(t => t.id === a.ticketId) && a.isVisibleToClient)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 3);

  const { assets } = useApp();
  const myAssets = assets.filter(a => a.clientId === currentUser.id);

  const mySummaries = serviceSummaries
    .filter(s => myTickets.some(t => t.id === s.ticketId) && s.isSharedWithClient)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6 pb-20">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white shadow-xl">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold">Hello, {currentUser.fullName.split(' ')[0]}!</h2>
          <p className="mt-1 text-blue-100 opacity-90">How can we help you today?</p>
          <div className="flex flex-wrap gap-3 mt-6">
            <button onClick={() => setActiveTab('request')} className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-blue-700 shadow-lg transition-transform active:scale-95">
              <Plus className="h-5 w-5" />
              Request New Service
            </button>
            <button onClick={() => setActiveTab('assets')} className="flex items-center gap-2 rounded-full bg-blue-500/30 backdrop-blur-md border border-white/20 px-6 py-3 text-sm font-bold text-white shadow-lg transition-transform active:scale-95">
              <FolderOpen className="h-5 w-5" />
              My Equipment ({myAssets.length})
            </button>
          </div>
        </div>
        <div className="absolute -right-8 -top-8 h-48 w-48 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-blue-400/20 blur-2xl"></div>
      </div>

      {/* Action Required / Financials */}
      {(pendingQuotes.length > 0 || unpaidInvoices.length > 0 || overdueInvoices.length > 0) && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {pendingQuotes.map(quote => (
            <div key={quote.id} className="flex items-center justify-between rounded-2xl border-2 border-amber-100 bg-amber-50 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-amber-100 p-2 text-amber-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-amber-900">Quote Review Required</div>
                  <div className="text-xs text-amber-700">Ticket #{quote.ticketId.slice(-4)} • ${quote.total.toFixed(2)}</div>
                </div>
              </div>
              <button 
                onClick={() => setActiveTab('billing')}
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-amber-700 active:scale-95 transition-all"
              >
                Review
              </button>
            </div>
          ))}
          {overdueInvoices.map(invoice => (
            <div key={invoice.id} className="flex items-center justify-between rounded-2xl border-2 border-red-100 bg-red-50 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-red-100 p-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-red-900">Overdue Invoice</div>
                  <div className="text-xs text-red-700">Ticket #{invoice.ticketId.slice(-4)} • ${invoice.total.toFixed(2)}</div>
                </div>
              </div>
              <button 
                onClick={() => setActiveTab('billing')}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-red-700 active:scale-95 transition-all"
              >
                Pay Now
              </button>
            </div>
          ))}
          {unpaidInvoices.map(invoice => (
            <div key={invoice.id} className="flex items-center justify-between rounded-2xl border-2 border-indigo-100 bg-indigo-50 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-indigo-100 p-2 text-indigo-600">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-indigo-900">Invoice Ready</div>
                  <div className="text-xs text-indigo-700">Ticket #{invoice.ticketId.slice(-4)} • ${invoice.total.toFixed(2)}</div>
                </div>
              </div>
              <button 
                onClick={() => setActiveTab('billing')}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition-all"
              >
                Pay Now
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Active Status */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Active Appointments */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Active Appointments
            </h3>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
              {activeJobs.length}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {activeJobs.length > 0 ? (
              activeJobs.map(job => (
                <div 
                  key={job.id} 
                  onClick={() => setSelectedTicket(job)}
                  className="group relative rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.99] cursor-pointer"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <StatusBadge status={job.status} />
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{job.category}</div>
                  </div>
                  <h4 className="font-bold text-gray-900 line-clamp-1">{job.title}</h4>
                  <div className="mt-3 flex flex-col gap-1 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {job.propertyNickname}
                    </div>
                    {job.scheduledDate && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(job.scheduledDate)} {job.scheduledTime}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                </div>
              ))
            ) : (
              <div className="col-span-full rounded-2xl border-2 border-dashed border-gray-100 p-8 text-center">
                <p className="text-sm text-gray-400">No active service requests.</p>
              </div>
            )}
          </div>

          {/* Upcoming Maintenance */}
          {upcomingPlans.length > 0 && (
            <div className="pt-4">
              <h3 className="mb-4 text-lg font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Upcoming Maintenance
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {upcomingPlans.map(plan => (
                  <div key={plan.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                        {plan.category}
                      </span>
                      <span className="text-xs font-bold text-gray-500 capitalize">{plan.frequency}</span>
                    </div>
                    <h4 className="font-bold text-gray-900">{plan.title}</h4>
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4 text-gray-400" />
                      Due: {formatDate(plan.nextDueDate)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="pt-4">
            <h3 className="mb-4 text-lg font-bold text-gray-900 flex items-center gap-2">
              <History className="h-5 w-5 text-blue-600" />
              Recent Activity
            </h3>
            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
              {myActivities.length > 0 ? (
                myActivities.map((activity, idx) => (
                  <div key={activity.id} className={cn(
                    "flex items-start gap-3 p-4",
                    idx !== myActivities.length - 1 && "border-b border-gray-50"
                  )}>
                    <div className="mt-1 rounded-full bg-blue-50 p-1.5 text-blue-600">
                      <CheckCircle2 className="h-3 w-3" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{activity.description}</div>
                      <div className="text-[10px] text-gray-400">{formatDate(activity.timestamp)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-sm text-gray-400">No recent activity.</div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Quick Links, Properties, Messages */}
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <button onClick={() => setActiveTab('history')} className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50 group">
              <div className="rounded-xl bg-blue-100 p-3 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <History className="h-6 w-6" />
              </div>
              <span className="text-sm font-bold text-gray-700">History</span>
            </button>
            <button onClick={() => setActiveTab('documents')} className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50 group">
              <div className="rounded-xl bg-amber-100 p-3 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <FolderOpen className="h-6 w-6" />
              </div>
              <span className="text-sm font-bold text-gray-700">Records</span>
            </button>
            <button onClick={() => setActiveTab('billing')} className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50 group">
              <div className="rounded-xl bg-indigo-100 p-3 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <FileText className="h-6 w-6" />
              </div>
              <span className="text-sm font-bold text-gray-700">Billing</span>
            </button>
          </div>

          {/* Recent Records */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-amber-600" />
                Recent Records
              </h3>
              <button onClick={() => setActiveTab('documents')} className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">View All</button>
            </div>
            <div className="space-y-3">
              {mySummaries.length > 0 || myAttachments.length > 0 ? (
                <>
                  {mySummaries.map(summary => (
                    <div key={summary.id} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                      <div className="rounded-lg bg-white p-2 shadow-sm text-amber-600">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="text-xs font-bold text-gray-900 truncate">Service Summary</div>
                        <div className="text-[10px] text-gray-500">Ticket #{summary.ticketId.slice(-4)}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300" />
                    </div>
                  ))}
                  {myAttachments.map(att => (
                    <div key={att.id} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                      <div className="rounded-lg bg-white p-2 shadow-sm text-blue-600">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="text-xs font-bold text-gray-900 truncate">{att.fileName}</div>
                        <div className="text-[10px] text-gray-500">{att.category}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300" />
                    </div>
                  ))}
                </>
              ) : (
                <div className="py-4 text-center text-xs text-gray-400">No recent records.</div>
              )}
            </div>
          </div>

          {/* Recent Messages */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                Messages
              </h3>
              <button onClick={() => setActiveTab('messages')} className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">View All</button>
            </div>
            <div className="space-y-3">
              {myMessages.length > 0 ? (
                myMessages.map(msg => (
                  <div key={msg.id} className="rounded-xl bg-gray-50 p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{msg.senderRole}</span>
                      <span className="text-[10px] text-gray-400">{formatDate(msg.timestamp)}</span>
                    </div>
                    <p className="text-xs text-gray-700 line-clamp-2">{msg.text}</p>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-gray-400">No recent messages.</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-bold text-gray-900">Your Properties</h3>
            <div className="space-y-3">
              {myProperties.map(prop => (
                <div key={prop.id} className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-white p-2 shadow-sm">
                      <MapPin className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{prop.nickname}</div>
                      <div className="text-[10px] text-gray-500 truncate max-w-[120px]">{prop.address}</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedTicket && (
        <TicketDetail 
          ticket={selectedTicket} 
          onClose={() => setSelectedTicket(null)} 
        />
      )}
    </div>
  );
};
