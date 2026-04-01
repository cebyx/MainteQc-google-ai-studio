import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { FileText, Download, Eye, Search, Filter, Calendar, CheckCircle, Clock, AlertCircle, FileCheck, FileWarning, FileMinus } from 'lucide-react';
import { Ticket, Quote, Invoice, ServiceSummary, Attachment } from '../types';
import { cn, formatDate } from '../lib/utils';

export const DocumentsCenter: React.FC = () => {
  const { tickets, quotes, invoices, serviceSummaries, attachments, currentUser, role } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'quote' | 'invoice' | 'summary' | 'attachment'>('all');

  const clientTickets = tickets.filter(t => t.clientId === currentUser.id);
  const ticketIds = clientTickets.map(t => t.id);

  const clientQuotes = quotes.filter(q => ticketIds.includes(q.ticketId));
  const clientInvoices = invoices.filter(i => ticketIds.includes(i.ticketId));
  const clientSummaries = serviceSummaries.filter(s => ticketIds.includes(s.ticketId) && s.isSharedWithClient);
  const clientAttachments = attachments.filter(a => ticketIds.includes(a.ticketId) && a.isVisibleToClient);

  const allDocs = [
    ...clientQuotes.map(q => ({ id: q.id, type: 'quote' as const, title: `Quote #${q.id.slice(-6)}`, date: q.createdAt, status: q.status, total: q.total, ticketId: q.ticketId })),
    ...clientInvoices.map(i => ({ id: i.id, type: 'invoice' as const, title: `Invoice #${i.id.slice(-6)}`, date: i.createdAt, status: i.status, total: i.total, ticketId: i.ticketId })),
    ...clientSummaries.map(s => ({ id: s.id, type: 'summary' as const, title: `Service Summary #${s.ticketId.slice(-6)}`, date: s.completionTimestamp, status: 'completed', ticketId: s.ticketId, total: undefined })),
    ...clientAttachments.map(a => ({ id: a.id, type: 'attachment' as const, title: a.fileName, date: a.timestamp, status: 'uploaded', url: a.url, ticketId: a.ticketId, total: undefined }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredDocs = allDocs.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || doc.type === filterType;
    return matchesSearch && matchesType;
  });

  const getStatusIcon = (type: string, status: string) => {
    if (status === 'paid' || status === 'accepted' || status === 'completed') return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
    if (status === 'unpaid' || status === 'sent') return <Clock className="w-3.5 h-3.5 text-blue-500" />;
    if (status === 'declined' || status === 'overdue') return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
    return <FileText className="w-3.5 h-3.5 text-muted-foreground" />;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'quote': return <FileCheck className="w-4 h-4 text-blue-500" />;
      case 'invoice': return <FileWarning className="w-4 h-4 text-orange-500" />;
      case 'summary': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'attachment': return <FileMinus className="w-4 h-4 text-purple-500" />;
      default: return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Records Center</h2>
          <p className="text-sm text-muted-foreground">Access all your service documents, quotes, and invoices.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search documents..."
              className="pl-9 pr-4 py-2 text-sm border rounded-lg w-full sm:w-64 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
          >
            <option value="all">All Types</option>
            <option value="quote">Quotes</option>
            <option value="invoice">Invoices</option>
            <option value="summary">Summaries</option>
            <option value="attachment">Files</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filteredDocs.length === 0 ? (
          <div className="p-20 text-center border border-dashed rounded-3xl bg-muted/10">
            <FileText className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No documents found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <div 
              key={`${doc.type}-${doc.id}`} 
              className="group flex items-center justify-between p-4 bg-card border rounded-2xl hover:shadow-md hover:border-primary/30 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-muted rounded-xl group-hover:bg-primary/10 transition-colors">
                  {getTypeIcon(doc.type)}
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold group-hover:text-primary transition-colors">{doc.title}</h4>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1 uppercase tracking-wider font-bold">
                      {doc.type}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(doc.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(doc.type, doc.status || '')}
                      <span className="capitalize">{doc.status || 'N/A'}</span>
                    </span>
                    {doc.total !== undefined && (
                      <span className="font-bold text-foreground">
                        ${doc.total.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-primary">
                  <Eye className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-primary">
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
