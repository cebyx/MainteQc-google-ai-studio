import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { FileText, Download, Eye, Search, Filter, Calendar, CheckCircle, Clock, AlertCircle, FileCheck, FileWarning, FileMinus, ExternalLink, ShieldCheck, DollarSign, Bell, XCircle } from 'lucide-react';
import { Ticket, Quote, Invoice, ServiceSummary, Attachment } from '../types';
import { cn, formatDate } from '../lib/utils';
import { DocumentPreviewModal } from './DocumentPreviewModal';

export const DocumentsCenter: React.FC = () => {
  const { 
    tickets, quotes, invoices, serviceSummaries, attachments, 
    currentUser, role, brand, markDocumentAsViewed, markDocumentAsExported,
    authorizationRecords, paymentRecords, reminderEvents
  } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'quote' | 'invoice' | 'summary' | 'attachment' | 'authorization' | 'payment' | 'reminder'>('all');
  
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    type: 'quote' | 'invoice' | 'summary' | 'authorization' | 'payment' | 'reminder';
    data: any;
  }>({
    isOpen: false,
    type: 'quote',
    data: null
  });

  const isAdmin = role === 'ADMIN';
  const isTech = role === 'TECHNICIAN';

  const visibleQuotes = isAdmin ? quotes : quotes.filter(q => q.clientId === currentUser.id && q.status !== 'draft');
  const visibleInvoices = isAdmin ? invoices : invoices.filter(i => i.clientId === currentUser.id && i.status !== 'draft');
  const visibleSummaries = isAdmin || isTech ? serviceSummaries : serviceSummaries.filter(s => s.isSharedWithClient && tickets.find(t => t.id === s.ticketId)?.clientId === currentUser.id);
  const visibleAttachments = isAdmin || isTech ? attachments : attachments.filter(a => a.isVisibleToClient && tickets.find(t => t.id === a.ticketId)?.clientId === currentUser.id);
  const visibleAuthorizations = isAdmin ? authorizationRecords : authorizationRecords.filter(r => r.clientId === currentUser.id);
  const visiblePayments = isAdmin ? paymentRecords : paymentRecords.filter(p => p.clientId === currentUser.id);
  const visibleReminders = isAdmin ? reminderEvents : reminderEvents.filter(r => invoices.find(i => i.id === r.invoiceId)?.clientId === currentUser.id || quotes.find(q => q.id === r.targetId)?.clientId === currentUser.id);

  const allDocs = [
    ...visibleQuotes.map(q => ({ id: q.id, type: 'quote' as const, title: `Quote #${q.id.slice(-6)}`, date: q.createdAt, status: q.status, total: q.total, ticketId: q.ticketId, data: q })),
    ...visibleInvoices.map(i => ({ id: i.id, type: 'invoice' as const, title: `Invoice #${i.id.slice(-6)}`, date: i.createdAt, status: i.status, total: i.total, ticketId: i.ticketId, data: i })),
    ...visibleSummaries.map(s => ({ id: s.id, type: 'summary' as const, title: `Service Summary #${s.ticketId.slice(-6)}`, date: s.completionTimestamp, status: 'completed', ticketId: s.ticketId, total: undefined, data: s })),
    ...visibleAttachments.map(a => ({ id: a.id, type: 'attachment' as const, title: a.fileName, date: a.timestamp, status: 'uploaded', url: a.url, ticketId: a.ticketId, total: undefined, data: a })),
    ...visibleAuthorizations.map(r => ({ id: r.id, type: 'authorization' as const, title: `Authorization: ${r.type.replace('_', ' ')}`, date: r.timestamp, status: r.status, ticketId: r.ticketId, total: undefined, data: r })),
    ...visiblePayments.map(p => ({ id: p.id, type: 'payment' as const, title: `Payment: ${p.method.replace('_', ' ')}`, date: p.timestamp, status: p.status, ticketId: p.ticketId, total: p.amount, data: p })),
    ...visibleReminders.map(r => {
      const relatedTicketId = r.targetType === 'invoice' 
        ? invoices.find(i => i.id === r.targetId)?.ticketId 
        : quotes.find(q => q.id === r.targetId)?.ticketId;
      return { id: r.id, type: 'reminder' as const, title: `Reminder: ${r.type.replace('_', ' ')}`, date: r.timestamp, status: 'sent', ticketId: relatedTicketId || '', total: undefined, data: r };
    })
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredDocs = allDocs.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || doc.ticketId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || doc.type === filterType;
    return matchesSearch && matchesType;
  });

  const handlePreview = (doc: any) => {
    if (doc.type === 'attachment') {
      window.open(doc.url, '_blank');
      markDocumentAsViewed('attachment', doc.id);
      return;
    }
    
    setPreviewModal({
      isOpen: true,
      type: doc.type,
      data: doc.data
    });
    markDocumentAsViewed(doc.type, doc.id);
  };

  const handleDownload = (doc: any) => {
    if (doc.type === 'attachment') {
      const link = document.createElement('a');
      link.href = doc.url;
      link.download = doc.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      markDocumentAsExported('attachment', doc.id);
    } else {
      handlePreview(doc);
      // The modal has a print/download button that calls markDocumentAsExported
    }
  };

  const getStatusIcon = (type: string, status: string) => {
    if (status === 'paid' || status === 'accepted' || status === 'completed' || status === 'approved') return <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />;
    if (status === 'unpaid' || status === 'sent' || status === 'pending') return <Clock className="w-3.5 h-3.5 text-blue-500" />;
    if (status === 'declined' || status === 'overdue' || status === 'failed' || status === 'revoked') return <AlertCircle className="w-3.5 h-3.5 text-rose-500" />;
    return <FileText className="w-3.5 h-3.5 text-gray-400" />;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'quote': return <FileCheck className="w-4 h-4 text-blue-500" />;
      case 'invoice': return <FileWarning className="w-4 h-4 text-amber-500" />;
      case 'summary': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'attachment': return <FileMinus className="w-4 h-4 text-purple-500" />;
      case 'authorization': return <ShieldCheck className="w-4 h-4 text-indigo-500" />;
      case 'payment': return <DollarSign className="w-4 h-4 text-green-500" />;
      case 'reminder': return <Bell className="w-4 h-4 text-rose-500" />;
      default: return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Records Hub</h2>
          <p className="text-sm text-gray-500">Official service documents, quotes, and financial records.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by ID or name..."
              className="pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl w-full sm:w-64 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 overflow-x-auto max-w-[400px] no-scrollbar">
            {(['all', 'quote', 'invoice', 'summary', 'attachment', 'authorization', 'payment', 'reminder'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-lg transition-all capitalize whitespace-nowrap",
                  filterType === type ? "bg-gray-900 text-white shadow-sm" : "text-gray-500 hover:text-gray-900"
                )}
              >
                {type === 'all' ? 'All' : type === 'summary' ? 'Summaries' : type + 's'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filteredDocs.length === 0 ? (
          <div className="p-20 text-center border border-dashed border-gray-200 rounded-3xl bg-gray-50">
            <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">No documents found</h3>
            <p className="text-sm text-gray-500">Try adjusting your search or filters.</p>
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <div 
              key={`${doc.type}-${doc.id}`} 
              onClick={() => handlePreview(doc)}
              className="group flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                  {getTypeIcon(doc.type)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{doc.title}</h4>
                    {(doc.data as any).viewedAt && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase tracking-wider">Viewed</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-gray-400">
                    <span className="flex items-center gap-1 uppercase tracking-wider font-extrabold text-gray-500">
                      {doc.type}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(doc.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(doc.type, doc.status || '')}
                      <span className="capitalize font-bold">{doc.status || 'N/A'}</span>
                    </span>
                    {doc.total !== undefined && (
                      <span className="font-bold text-gray-900">
                        ${doc.total.toFixed(2)}
                      </span>
                    )}
                    <span className="text-gray-300">|</span>
                    <span className="font-medium">Ticket #{doc.ticketId?.slice(-6) || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => { e.stopPropagation(); handlePreview(doc); }}
                  className="p-2 hover:bg-blue-50 rounded-xl transition-colors text-gray-400 hover:text-blue-600"
                  title="Preview"
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDownload(doc); }}
                  className="p-2 hover:bg-blue-50 rounded-xl transition-colors text-gray-400 hover:text-blue-600"
                  title="Download / Export"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <DocumentPreviewModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal(prev => ({ ...prev, isOpen: false }))}
        type={previewModal.type}
        data={previewModal.data}
        brand={brand}
        onExport={() => markDocumentAsExported(previewModal.type as any, previewModal.data.id)}
      />
    </div>
  );
};
