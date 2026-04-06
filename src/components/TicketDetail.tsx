import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { Ticket, JobStatus } from '../types';
import { StatusBadge, UrgencyBadge } from './Badges';
import { 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  Clipboard, 
  MessageSquare,
  ChevronLeft,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  ExternalLink,
  Paperclip,
  Package,
  Camera,
  ClipboardCheck,
  FileText,
  ShieldCheck,
  Signature
} from 'lucide-react';
import { formatDate, cn } from '../lib/utils';
import { STATUS_LABELS } from '../constants';
import { AttachmentsPanel } from './AttachmentsPanel';
import { PartsUsedPanel } from './PartsUsedPanel';
import { CloseoutPanel } from './CloseoutPanel';
import { PhotoGallery } from './PhotoGallery';

interface TicketDetailProps {
  ticket: Ticket;
  onClose: () => void;
}

const WorkAuthorizationPanel: React.FC<{ ticket: Ticket; allowSign: boolean }> = ({ ticket, allowSign }) => {
  const { authorizationRecords, approvalRecords, createWorkAuthorization, currentUser, role } = useApp();
  const [isSigning, setIsSigning] = useState<string | null>(null);
  const [signatureName, setSignatureName] = useState(currentUser?.fullName || '');
  const [notes, setNotes] = useState('');

  const ticketAuths = authorizationRecords.filter(a => a.ticketId === ticket.id);
  const ticketApprovals = approvalRecords.filter(a => a.ticketId === ticket.id);

  const handleSign = async (type: 'work_start' | 'completion_signoff') => {
    if (!signatureName) return;
    setIsSigning(type);
    try {
      await createWorkAuthorization({
        ticketId: ticket.id,
        clientId: ticket.clientId,
        type,
        signatureName,
        notes,
        status: 'authorized'
      });
      setNotes('');
    } finally {
      setIsSigning(null);
    }
  };

  const hasStartAuth = ticketAuths.some(a => a.type === 'work_start' || a.type === 'quote_approval');
  const hasCompletionAuth = ticketAuths.some(a => a.type === 'completion_signoff');

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h4 className="flex items-center gap-2 font-bold text-gray-900 mb-6">
        <ShieldCheck className="h-5 w-5 text-blue-600" />
        Authorization & Approvals
      </h4>

      <div className="space-y-6">
        {/* Existing Records */}
        {(ticketAuths.length > 0 || ticketApprovals.length > 0) && (
          <div className="space-y-3">
            {[...ticketAuths, ...ticketApprovals]
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .map((record, idx) => (
              <div key={idx} className="flex items-start gap-3 rounded-xl bg-gray-50 p-4 border border-gray-100">
                <div className="mt-1 rounded-full bg-blue-100 p-1.5 text-blue-600">
                  <Signature className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 uppercase tracking-tight">
                      {'type' in record ? record.type.replace('_', ' ') : 'Quote Approval'}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">{formatDate(record.timestamp)}</span>
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    Signed by <span className="font-bold text-gray-900">{record.signatureName}</span>
                  </div>
                  {record.notes && (
                    <div className="mt-2 text-xs italic text-gray-500 bg-white/50 p-2 rounded-lg border border-gray-100">
                      "{record.notes}"
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Signing UI for Clients */}
        {allowSign && (
          <div className="space-y-4 pt-4 border-t border-gray-100">
            {!hasStartAuth && ticket.status === 'approved' && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-5">
                <h5 className="text-sm font-bold text-blue-900 mb-3">Authorize Work Start</h5>
                <p className="text-xs text-blue-700 mb-4">Please sign below to authorize our team to begin work on this ticket.</p>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Type full name to sign"
                    className="w-full rounded-lg border-blue-200 text-sm focus:ring-blue-500"
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                  />
                  <textarea
                    placeholder="Optional notes..."
                    className="w-full rounded-lg border-blue-200 text-sm focus:ring-blue-500"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <button
                    onClick={() => handleSign('work_start')}
                    disabled={!signatureName || isSigning === 'work_start'}
                    className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-100 disabled:opacity-50"
                  >
                    {isSigning === 'work_start' ? 'Signing...' : 'Sign & Authorize Start'}
                  </button>
                </div>
              </div>
            )}

            {!hasCompletionAuth && ticket.status === 'completed' && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-5">
                <h5 className="text-sm font-bold text-emerald-900 mb-3">Work Completion Sign-off</h5>
                <p className="text-xs text-emerald-700 mb-4">Please sign below to acknowledge that the work has been completed to your satisfaction.</p>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Type full name to sign"
                    className="w-full rounded-lg border-emerald-200 text-sm focus:ring-emerald-500"
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                  />
                  <textarea
                    placeholder="Optional feedback..."
                    className="w-full rounded-lg border-emerald-200 text-sm focus:ring-emerald-500"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <button
                    onClick={() => handleSign('completion_signoff')}
                    disabled={!signatureName || isSigning === 'completion_signoff'}
                    className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-100 disabled:opacity-50"
                  >
                    {isSigning === 'completion_signoff' ? 'Signing...' : 'Sign & Complete Job'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

const AdminTicketDetail: React.FC<{ ticket: Ticket; currentTicket: Ticket; editedTicket: Partial<Ticket>; handleChange: (f: keyof Ticket, v: any) => void; handleSave: () => void; handleStatusChange: (s: JobStatus) => void; onClose: () => void }> = ({ ticket, currentTicket, editedTicket, handleChange, handleSave, handleStatusChange, onClose }) => {
  const { technicians, approveTicket, rejectTicket, quotes, invoices, createQuote, updateQuote, createInvoice, updateInvoice } = useApp();
  const [editingFinancial, setEditingFinancial] = useState<'quote' | 'invoice' | null>(null);
  
  const isPending = ticket.status === 'pending_review';
  const ticketQuote = quotes.find(q => q.ticketId === ticket.id);
  const ticketInvoice = invoices.find(i => i.ticketId === ticket.id);

  const handleAddLineItem = (type: 'quote' | 'invoice') => {
    const financial = type === 'quote' ? ticketQuote : ticketInvoice;
    if (!financial) return;

    const newItem = { description: '', quantity: 1, rate: 0, total: 0 };
    const newLineItems = [...financial.lineItems, newItem];
    const subtotal = newLineItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + tax;

    if (type === 'quote') {
      updateQuote(financial.id, { lineItems: newLineItems, subtotal, tax, total });
    } else {
      updateInvoice(financial.id, { lineItems: newLineItems, subtotal, tax, total });
    }
  };

  const handleUpdateLineItem = (type: 'quote' | 'invoice', index: number, field: string, value: any) => {
    const financial = type === 'quote' ? ticketQuote : ticketInvoice;
    if (!financial) return;

    const newLineItems = [...financial.lineItems];
    const item = { ...newLineItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'rate') {
      item.total = item.quantity * item.rate;
    }
    
    newLineItems[index] = item;
    const subtotal = newLineItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    if (type === 'quote') {
      updateQuote(financial.id, { lineItems: newLineItems, subtotal, tax, total });
    } else {
      updateInvoice(financial.id, { lineItems: newLineItems, subtotal, tax, total });
    }
  };

  const handleRemoveLineItem = (type: 'quote' | 'invoice', index: number) => {
    const financial = type === 'quote' ? ticketQuote : ticketInvoice;
    if (!financial) return;

    const newLineItems = financial.lineItems.filter((_, i) => i !== index);
    const subtotal = newLineItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    if (type === 'quote') {
      updateQuote(financial.id, { lineItems: newLineItems, subtotal, tax, total });
    } else {
      updateInvoice(financial.id, { lineItems: newLineItems, subtotal, tax, total });
    }
  };
  
  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-gray-900">{ticket.title}</h3>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category: {ticket.category}</span>
        </div>
        <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">{ticket.description}</p>
      </section>

      <div className="grid grid-cols-1 gap-8">
        <PhotoGallery ticketId={ticket.id} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <AttachmentsPanel ticketId={ticket.id} />
          <PartsUsedPanel ticketId={ticket.id} />
        </div>

        <CloseoutPanel ticket={ticket} />
        <WorkAuthorizationPanel ticket={ticket} allowSign={false} />
      </div>

      {isPending && (
        <section className="rounded-2xl bg-amber-50 p-6 border border-amber-200 shadow-sm">
          <h4 className="flex items-center gap-2 font-bold text-amber-900 mb-4">
            <AlertTriangle className="h-5 w-5" />
            Review Required
          </h4>
          <div className="flex gap-3">
            <button 
              onClick={() => approveTicket(ticket.id)}
              className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
            >
              Approve Request
            </button>
            <button 
              onClick={() => rejectTicket(ticket.id)}
              className="flex-1 rounded-xl bg-white border border-red-200 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-all active:scale-95"
            >
              Reject Request
            </button>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="rounded-2xl bg-gray-50 p-6 border border-gray-200">
          <h4 className="flex items-center gap-2 font-bold text-gray-900 mb-4">
            <Clipboard className="h-5 w-5 text-blue-600" />
            Dispatch & Scheduling
          </h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Date</label>
                <input 
                  type="date" 
                  className="w-full rounded-lg border-gray-200 text-sm focus:ring-blue-500" 
                  value={currentTicket.scheduledDate || ''} 
                  onChange={(e) => handleChange('scheduledDate', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Time</label>
                <input 
                  type="time" 
                  className="w-full rounded-lg border-gray-200 text-sm focus:ring-blue-500" 
                  value={currentTicket.scheduledTime || ''} 
                  onChange={(e) => handleChange('scheduledTime', e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Technician</label>
              <select 
                className="w-full rounded-lg border-gray-200 text-sm focus:ring-blue-500"
                value={currentTicket.assignedTechnicianId || ''}
                onChange={(e) => {
                  const techId = e.target.value;
                  const tech = technicians.find(t => t.id === techId);
                  handleChange('assignedTechnicianId', techId);
                  handleChange('assignedTechnicianName', tech?.fullName || '');
                }}
              >
                <option value="">Unassigned</option>
                {technicians.map(tech => (
                  <option key={tech.id} value={tech.id}>{tech.fullName} ({tech.status})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</label>
              <select 
                className="w-full rounded-lg border-gray-200 text-sm focus:ring-blue-500"
                value={currentTicket.status}
                onChange={(e) => handleChange('status', e.target.value as JobStatus)}
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="pt-2">
              <button 
                className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white disabled:opacity-50 shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
                onClick={handleSave}
                disabled={Object.keys(editedTicket).length === 0}
              >
                Update Dispatch
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-gray-50 p-6 border border-gray-200">
          <h4 className="flex items-center gap-2 font-bold text-gray-900 mb-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            Financials
          </h4>
          <div className="space-y-4">
            {/* Quote Section */}
            <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quote</span>
                  {ticketQuote && (
                    <button 
                      onClick={() => setEditingFinancial(editingFinancial === 'quote' ? null : 'quote')}
                      className="text-[10px] font-bold text-blue-600 hover:underline"
                    >
                      {editingFinancial === 'quote' ? 'Close Editor' : 'Edit Items'}
                    </button>
                  )}
                </div>
                <select 
                  className="text-[10px] font-bold border-none bg-gray-100 rounded-full px-2 py-0.5 focus:ring-0"
                  value={ticketQuote?.status || 'none'}
                  disabled={!ticketQuote}
                  onChange={(e) => ticketQuote && updateQuote(ticketQuote.id, { status: e.target.value as any })}
                >
                  <option value="none">NONE</option>
                  <option value="draft">DRAFT</option>
                  <option value="sent">SENT</option>
                  <option value="accepted">ACCEPTED</option>
                  <option value="declined">DECLINED</option>
                </select>
              </div>

              {ticketQuote ? (
                <div className="space-y-3">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-lg font-black text-gray-900">${ticketQuote.total.toFixed(2)}</div>
                      <div className="text-[10px] text-gray-400">Created {formatDate(ticketQuote.createdAt)}</div>
                    </div>
                  </div>

                  {editingFinancial === 'quote' && (
                    <div className="mt-4 space-y-3 border-t border-gray-50 pt-4">
                      {ticketQuote.lineItems.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                          <input 
                            className="col-span-6 rounded-lg border-gray-200 text-xs py-1"
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) => handleUpdateLineItem('quote', idx, 'description', e.target.value)}
                          />
                          <input 
                            type="number"
                            className="col-span-2 rounded-lg border-gray-200 text-xs py-1"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => handleUpdateLineItem('quote', idx, 'quantity', parseFloat(e.target.value))}
                          />
                          <input 
                            type="number"
                            className="col-span-3 rounded-lg border-gray-200 text-xs py-1"
                            placeholder="Rate"
                            value={item.rate}
                            onChange={(e) => handleUpdateLineItem('quote', idx, 'rate', parseFloat(e.target.value))}
                          />
                          <button 
                            onClick={() => handleRemoveLineItem('quote', idx)}
                            className="col-span-1 text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => handleAddLineItem('quote')}
                        className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800"
                      >
                        <Plus className="h-3 w-3" /> Add Item
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button 
                  onClick={() => createQuote({
                    ticketId: ticket.id,
                    clientId: ticket.clientId,
                    propertyId: ticket.propertyId,
                    status: 'draft',
                    lineItems: [],
                    subtotal: 0,
                    tax: 0,
                    total: 0,
                    notes: ''
                  })}
                  className="w-full rounded-xl border-2 border-dashed border-gray-100 py-4 text-xs font-bold text-gray-400 hover:border-blue-200 hover:text-blue-600 transition-all"
                >
                  + Create Draft Quote
                </button>
              )}
            </div>

            {/* Invoice Section */}
            <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Invoice</span>
                  {ticketInvoice && (
                    <button 
                      onClick={() => setEditingFinancial(editingFinancial === 'invoice' ? null : 'invoice')}
                      className="text-[10px] font-bold text-blue-600 hover:underline"
                    >
                      {editingFinancial === 'invoice' ? 'Close Editor' : 'Edit Items'}
                    </button>
                  )}
                </div>
                <select 
                  className="text-[10px] font-bold border-none bg-gray-100 rounded-full px-2 py-0.5 focus:ring-0"
                  value={ticketInvoice?.status || 'none'}
                  disabled={!ticketInvoice}
                  onChange={(e) => ticketInvoice && updateInvoice(ticketInvoice.id, { status: e.target.value as any })}
                >
                  <option value="none">NONE</option>
                  <option value="draft">DRAFT</option>
                  <option value="unpaid">UNPAID</option>
                  <option value="paid">PAID</option>
                  <option value="overdue">OVERDUE</option>
                </select>
              </div>

              {ticketInvoice ? (
                <div className="space-y-3">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-lg font-black text-gray-900">${ticketInvoice.total.toFixed(2)}</div>
                      <div className="text-[10px] text-gray-400">Due {formatDate(ticketInvoice.dueDate)}</div>
                    </div>
                  </div>

                  {editingFinancial === 'invoice' && (
                    <div className="mt-4 space-y-3 border-t border-gray-50 pt-4">
                      {ticketInvoice.lineItems.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                          <input 
                            className="col-span-6 rounded-lg border-gray-200 text-xs py-1"
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) => handleUpdateLineItem('invoice', idx, 'description', e.target.value)}
                          />
                          <input 
                            type="number"
                            className="col-span-2 rounded-lg border-gray-200 text-xs py-1"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => handleUpdateLineItem('invoice', idx, 'quantity', parseFloat(e.target.value))}
                          />
                          <input 
                            type="number"
                            className="col-span-3 rounded-lg border-gray-200 text-xs py-1"
                            placeholder="Rate"
                            value={item.rate}
                            onChange={(e) => handleUpdateLineItem('invoice', idx, 'rate', parseFloat(e.target.value))}
                          />
                          <button 
                            onClick={() => handleRemoveLineItem('invoice', idx)}
                            className="col-span-1 text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => handleAddLineItem('invoice')}
                        className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800"
                      >
                        <Plus className="h-3 w-3" /> Add Item
                      </button>
                      <div className="pt-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Due Date</label>
                        <input 
                          type="date"
                          className="w-full rounded-lg border-gray-200 text-xs py-1"
                          value={ticketInvoice.dueDate.split('T')[0]}
                          onChange={(e) => updateInvoice(ticketInvoice.id, { dueDate: new Date(e.target.value).toISOString() })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button 
                  onClick={() => createInvoice({
                    ticketId: ticket.id,
                    clientId: ticket.clientId,
                    propertyId: ticket.propertyId,
                    status: 'draft',
                    lineItems: [],
                    subtotal: 0,
                    tax: 0,
                    total: 0,
                    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    notes: ''
                  })}
                  className="w-full rounded-xl border-2 border-dashed border-gray-100 py-4 text-xs font-bold text-gray-400 hover:border-blue-200 hover:text-blue-600 transition-all"
                >
                  + Create Draft Invoice
                </button>
              )}
            </div>
          </div>
        </section>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-gray-100 p-4 bg-white shadow-sm">
          <h5 className="text-sm font-bold text-gray-900 mb-2">Technician Field Notes</h5>
          <textarea 
            className="w-full rounded-lg border-gray-200 text-sm focus:ring-blue-500" 
            placeholder="Add field notes..."
            value={currentTicket.technicianNotes || ''}
            onChange={(e) => handleChange('technicianNotes', e.target.value)}
            onBlur={handleSave}
            rows={3}
          />
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/30 p-4">
          <h5 className="text-sm font-bold text-amber-900 mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Internal Admin Notes (Private)
          </h5>
          <textarea 
            className="w-full rounded-lg border-amber-200 text-sm bg-white focus:ring-amber-500" 
            placeholder="Add internal notes..."
            value={currentTicket.adminNotes || ''}
            onChange={(e) => handleChange('adminNotes', e.target.value)}
            onBlur={handleSave}
            rows={3}
          />
        </div>
      </div>
    </div>
  );
};

const TechnicianTicketDetail: React.FC<{ ticket: Ticket; currentTicket: Ticket; handleChange: (f: keyof Ticket, v: any) => void; handleSave: () => void; handleStatusChange: (s: JobStatus) => void }> = ({ ticket, currentTicket, handleChange, handleSave, handleStatusChange }) => {
  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-gray-900">{ticket.title}</h3>
          <UrgencyBadge urgency={ticket.urgency} />
        </div>
        <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">{ticket.description}</p>
      </section>

      <section className="rounded-2xl bg-blue-50 p-6 border border-blue-100 shadow-sm">
        <h4 className="flex items-center gap-2 font-bold text-blue-900 mb-4">
          <Wrench className="h-5 w-5" />
          Field Status Controls
        </h4>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { status: 'on_the_way', label: 'On My Way' },
            { status: 'arrived', label: 'Arrived' },
            { status: 'in_progress', label: 'In Progress' },
            { status: 'waiting_on_parts', label: 'Waiting on Parts' },
            { status: 'completed', label: 'Completed' },
            { status: 'unable_to_complete', label: 'Unable to Complete' },
          ].map((btn) => (
            <button
              key={btn.status}
              onClick={() => handleStatusChange(btn.status as JobStatus)}
              className={cn(
                "rounded-xl border py-3 text-xs font-bold transition-all active:scale-95",
                ticket.status === btn.status
                  ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200"
                  : "bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:text-blue-600 shadow-sm"
              )}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8">
        <PhotoGallery ticketId={ticket.id} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <AttachmentsPanel ticketId={ticket.id} />
          <PartsUsedPanel ticketId={ticket.id} />
        </div>

        <CloseoutPanel ticket={ticket} />
        <WorkAuthorizationPanel ticket={ticket} allowSign={false} />
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-gray-100 p-4 bg-white shadow-sm">
          <h5 className="text-sm font-bold text-gray-900 mb-2">Technician Field Notes</h5>
          <textarea 
            className="w-full rounded-lg border-gray-200 text-sm focus:ring-blue-500" 
            placeholder="Add field notes (visible to admin)..."
            value={currentTicket.technicianNotes || ''}
            onChange={(e) => handleChange('technicianNotes', e.target.value)}
            onBlur={handleSave}
            rows={4}
          />
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/20 p-4 shadow-sm">
          <h5 className="text-sm font-bold text-emerald-900 mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Completion Summary (Visible to Client)
          </h5>
          <textarea 
            className="w-full rounded-lg border-emerald-200 text-sm bg-white focus:ring-emerald-500" 
            placeholder="Describe what was done for the client..."
            value={currentTicket.completionNotes || ''}
            onChange={(e) => handleChange('completionNotes', e.target.value)}
            onBlur={handleSave}
            rows={3}
          />
        </div>
      </div>
    </div>
  );
};

const ClientTicketDetail: React.FC<{ ticket: Ticket }> = ({ ticket }) => {
  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{ticket.title}</h3>
        <p className="text-gray-600 leading-relaxed">{ticket.description}</p>
      </section>

      <div className="grid grid-cols-1 gap-8">
        <PhotoGallery ticketId={ticket.id} allowUpload={false} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <AttachmentsPanel ticketId={ticket.id} allowUpload={false} />
          <PartsUsedPanel ticketId={ticket.id} allowEdit={false} />
        </div>

        <CloseoutPanel ticket={ticket} allowEdit={false} />
        <WorkAuthorizationPanel ticket={ticket} allowSign={true} />
      </div>

      {ticket.completionNotes && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <h5 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Completion Notes
          </h5>
          <p className="text-sm text-gray-600">{ticket.completionNotes}</p>
        </div>
      )}
    </div>
  );
};

export const TicketDetail: React.FC<TicketDetailProps> = ({ ticket, onClose }) => {
  const { role, updateTicket, rescheduleTicket, assignTechnician, activities, clients, properties, messages } = useApp();
  const [editedTicket, setEditedTicket] = useState<Partial<Ticket>>({});

  const ticketActivities = activities
    .filter(a => a.ticketId === ticket.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const client = clients.find(c => c.id === ticket.clientId);
  const property = properties.find(p => p.id === ticket.propertyId);
  const ticketMessages = messages.filter(m => m.ticketId === ticket.id);

  const handleStatusChange = (newStatus: JobStatus) => {
    updateTicket(ticket.id, { status: newStatus });
  };

  const handleSave = async () => {
    const updates = { ...editedTicket };
    
    if (updates.scheduledDate !== undefined || updates.scheduledTime !== undefined) {
      const newDate = updates.scheduledDate ?? ticket.scheduledDate ?? '';
      const newTime = updates.scheduledTime ?? ticket.scheduledTime ?? '';
      if (newDate || newTime) {
        await rescheduleTicket(ticket.id, newDate, newTime);
      }
      delete updates.scheduledDate;
      delete updates.scheduledTime;
    }

    if (updates.assignedTechnicianId !== undefined) {
      const newTechId = updates.assignedTechnicianId;
      const newTechName = updates.assignedTechnicianName ?? '';
      await assignTechnician(ticket.id, newTechId, newTechName);
      delete updates.assignedTechnicianId;
      delete updates.assignedTechnicianName;
    }

    if (Object.keys(updates).length > 0) {
      await updateTicket(ticket.id, updates);
    }
    
    setEditedTicket({});
  };

  const handleChange = (field: keyof Ticket, value: any) => {
    setEditedTicket(prev => ({ ...prev, [field]: value }));
  };

  const currentTicket = { ...ticket, ...editedTicket };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex h-full max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100">
              <ChevronLeft className="h-5 w-5 text-gray-500" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Ticket #{ticket.id.slice(-4)}</h2>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={ticket.status} />
                <UrgencyBadge urgency={ticket.urgency} />
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Created</div>
            <div className="text-sm font-medium">{formatDate(ticket.createdAt)}</div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Main Info */}
            <div className="lg:col-span-2">
              {role === 'ADMIN' && (
                <AdminTicketDetail 
                  ticket={ticket} 
                  currentTicket={currentTicket as Ticket} 
                  editedTicket={editedTicket} 
                  handleChange={handleChange} 
                  handleSave={handleSave} 
                  handleStatusChange={handleStatusChange} 
                  onClose={onClose}
                />
              )}
              {role === 'TECHNICIAN' && (
                <TechnicianTicketDetail 
                  ticket={ticket} 
                  currentTicket={currentTicket as Ticket} 
                  handleChange={handleChange} 
                  handleSave={handleSave} 
                  handleStatusChange={handleStatusChange} 
                />
              )}
              {role === 'CLIENT' && (
                <ClientTicketDetail ticket={ticket} />
              )}
            </div>

            {/* Sidebar Info */}
            <div className="space-y-6">
              {/* Customer Info (Hidden for Client) */}
              {role !== 'CLIENT' && (
                <div className="rounded-2xl border border-gray-100 p-5">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Customer</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {ticket.clientName.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{ticket.clientName}</div>
                        <div className="text-xs text-gray-500">Client ID: {ticket.clientId}</div>
                      </div>
                    </div>
                    <div className="space-y-2 pt-2">
                      {client?.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4 text-gray-400" />
                          {client.phone}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4 text-gray-400" />
                        {ticket.createdByEmail}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Property Info */}
              <div className="rounded-2xl border border-gray-100 p-5">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Service Location</h4>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-1 h-5 w-5 text-blue-600" />
                    <div>
                      <div className="text-sm font-bold text-gray-900">{ticket.propertyNickname}</div>
                      <div className="text-sm text-gray-500 leading-tight">{ticket.serviceAddress}</div>
                    </div>
                  </div>
                  {property?.accessInstructions && (
                    <div className="rounded-xl bg-gray-50 p-3">
                      <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Access Instructions</div>
                      <div className="text-xs text-gray-600 italic">"{property.accessInstructions}"</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline / Status */}
              <div className="rounded-2xl border border-gray-100 p-5">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Activity Timeline</h4>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {ticketActivities.length > 0 ? (
                    ticketActivities.map((activity, index) => (
                      <div key={activity.id} className="flex gap-3">
                        <div className="relative flex flex-col items-center">
                          <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                          {index !== ticketActivities.length - 1 && (
                            <div className="h-full w-0.5 bg-gray-100"></div>
                          )}
                        </div>
                        <div className="pb-4">
                          <div className="text-xs font-bold text-gray-900">{activity.description}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            {formatDate(activity.timestamp)} • {activity.actorName} ({activity.actorRole})
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-500 italic">No activity recorded yet.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <MessageSquare className="h-4 w-4" />
            <span>{ticketMessages.length} message{ticketMessages.length !== 1 ? 's' : ''} linked to this ticket</span>
          </div>
          <button 
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-6 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
