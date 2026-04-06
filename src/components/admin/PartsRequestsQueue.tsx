import React, { useState } from 'react';
import { 
  ClipboardList, Search, Filter, Clock, CheckCircle2, 
  XCircle, Truck, PackageCheck, AlertCircle, 
  MoreVertical, ExternalLink, MessageSquare, 
  Calendar, User, Tag, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../AppContext';
import { PartsRequest } from '../../types';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

export const PartsRequestsQueue: React.FC = () => {
  const { 
    partsRequests, 
    tickets, 
    inventoryItems,
    fulfillPartsRequest,
    markPartsRequestOrdered,
    markPartsRequestReceived,
    cancelPartsRequest,
    updatePartsRequestStatus
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PartsRequest['status'] | 'all'>('all');
  const [selectedRequest, setSelectedRequest] = useState<PartsRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  const filteredRequests = partsRequests.filter(request => {
    const statusMatches = statusFilter === 'all' || request.status === statusFilter;
    const searchMatches = 
      request.technicianName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return statusMatches && searchMatches;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getStatusBadge = (status: PartsRequest['status']) => {
    switch (status) {
      case 'pending': return { color: 'bg-amber-100 text-amber-700', icon: Clock, label: 'Pending Review' };
      case 'approved': return { color: 'bg-blue-100 text-blue-700', icon: CheckCircle2, label: 'Approved' };
      case 'ordered': return { color: 'bg-purple-100 text-purple-700', icon: Truck, label: 'Ordered' };
      case 'received': return { color: 'bg-indigo-100 text-indigo-700', icon: PackageCheck, label: 'Received' };
      case 'fulfilled': return { color: 'bg-green-100 text-green-700', icon: CheckCircle2, label: 'Fulfilled' };
      case 'rejected': return { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Rejected' };
      case 'cancelled': return { color: 'bg-gray-100 text-gray-700', icon: XCircle, label: 'Cancelled' };
      default: return { color: 'bg-gray-100 text-gray-700', icon: Clock, label: status };
    }
  };

  const handleAction = async (requestId: string, action: 'approve' | 'reject' | 'order' | 'receive' | 'fulfill' | 'cancel') => {
    switch (action) {
      case 'approve': await updatePartsRequestStatus(requestId, 'approved', adminNotes); break;
      case 'reject': await updatePartsRequestStatus(requestId, 'rejected', adminNotes); break;
      case 'order': await markPartsRequestOrdered(requestId, adminNotes); break;
      case 'receive': await markPartsRequestReceived(requestId, adminNotes); break;
      case 'fulfill': await fulfillPartsRequest(requestId, adminNotes); break;
      case 'cancel': await cancelPartsRequest(requestId, adminNotes); break;
    }
    setSelectedRequest(null);
    setAdminNotes('');
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parts Requests Queue</h1>
          <p className="text-gray-500 text-sm">Review and manage technician parts requests.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="ordered">Ordered</option>
            <option value="received">Received</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Requests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRequests.map((request) => {
          const status = getStatusBadge(request.status);
          const StatusIcon = status.icon;
          const ticket = tickets.find(t => t.id === request.ticketId);

          return (
            <motion.div
              key={request.id}
              layoutId={request.id}
              onClick={() => setSelectedRequest(request)}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <div className={cn("p-1.5 rounded-lg", status.color)}>
                    <StatusIcon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    REQ-{request.id.slice(-6)}
                  </span>
                </div>
                <div className={cn(
                  "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                  request.urgency === 'emergency' ? "bg-red-100 text-red-700" :
                  request.urgency === 'high' ? "bg-amber-100 text-amber-700" :
                  "bg-blue-100 text-blue-700"
                )}>
                  {request.urgency}
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-bold text-gray-900 line-clamp-1">
                      {request.items.map(i => i.name).join(', ')}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <User className="w-3 h-3" />
                      <span>{request.technicianName}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-gray-400">
                      {format(new Date(request.createdAt), 'MMM d')}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {format(new Date(request.createdAt), 'h:mm a')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                  <Tag className="w-3 h-3 text-gray-400 group-hover:text-blue-500" />
                  <div className="text-xs font-medium text-gray-600 group-hover:text-blue-700">
                    Ticket #{ticket?.id.slice(-6) || request.ticketId.slice(-6)}
                  </div>
                  <ExternalLink className="w-3 h-3 ml-auto text-gray-300 group-hover:text-blue-400" />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                  <div className="text-xs text-gray-500">
                    {request.items.length} item{request.items.length !== 1 ? 's' : ''}
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-blue-600">
                    <span>Manage</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-xl", getStatusBadge(selectedRequest.status).color)}>
                    {React.createElement(getStatusBadge(selectedRequest.status).icon, { className: "w-5 h-5" })}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Request REQ-{selectedRequest.id.slice(-6)}</h3>
                    <p className="text-xs text-gray-500">Submitted by {selectedRequest.technicianName} on {format(new Date(selectedRequest.createdAt), 'MMMM d, yyyy')}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedRequest(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XCircle className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Items Table */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Requested Items</h4>
                  <div className="border border-gray-100 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-4 py-2 font-semibold text-gray-600">Item</th>
                          <th className="px-4 py-2 font-semibold text-gray-600">Quantity</th>
                          <th className="px-4 py-2 font-semibold text-gray-600">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedRequest.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">{item.name}</div>
                              <div className="text-[10px] text-gray-400 font-mono">SKU: {item.itemId.slice(-8)}</div>
                            </td>
                            <td className="px-4 py-3 text-gray-600">{item.quantity}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs">Requested item</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Request Details</h4>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Urgency</span>
                        <span className={cn(
                          "font-bold uppercase",
                          selectedRequest.urgency === 'emergency' ? "text-red-600" :
                          selectedRequest.urgency === 'high' ? "text-amber-600" :
                          "text-blue-600"
                        )}>{selectedRequest.urgency}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Ticket</span>
                        <span className="font-medium text-gray-900">#{selectedRequest.ticketId.slice(-6)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Status</span>
                        <span className="font-medium text-gray-900">{getStatusBadge(selectedRequest.status).label}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Technician Notes</h4>
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-blue-500 mt-0.5" />
                        <p className="text-sm text-blue-800 italic">
                          "{selectedRequest.reason || 'No additional notes provided.'}"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Admin Actions */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Admin Actions & Notes</h4>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add internal notes for the technician or procurement team..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                    rows={3}
                  />
                  
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    {selectedRequest.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleAction(selectedRequest.id, 'approve')}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve Request</span>
                        </button>
                        <button 
                          onClick={() => handleAction(selectedRequest.id, 'reject')}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}

                    {selectedRequest.status === 'approved' && (
                      <button 
                        onClick={() => handleAction(selectedRequest.id, 'order')}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm font-medium"
                      >
                        <Truck className="w-4 h-4" />
                        <span>Mark as Ordered</span>
                      </button>
                    )}

                    {selectedRequest.status === 'ordered' && (
                      <button 
                        onClick={() => handleAction(selectedRequest.id, 'receive')}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
                      >
                        <PackageCheck className="w-4 h-4" />
                        <span>Mark as Received</span>
                      </button>
                    )}

                    {(selectedRequest.status === 'received' || selectedRequest.status === 'approved') && (
                      <button 
                        onClick={() => handleAction(selectedRequest.id, 'fulfill')}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Fulfill & Update Stock</span>
                      </button>
                    )}

                    {['pending', 'approved', 'ordered'].includes(selectedRequest.status) && (
                      <button 
                        onClick={() => handleAction(selectedRequest.id, 'cancel')}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors font-medium ml-auto"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Cancel Request</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
