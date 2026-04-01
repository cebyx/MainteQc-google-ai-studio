import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Wrench, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  MoreVertical,
  Play,
  Pause,
  RefreshCw,
  ChevronRight,
  Filter,
  Search
} from 'lucide-react';
import { useApp } from '../../AppContext';
import { MaintenancePlan, Client, Property } from '../../types';
import { format, isBefore, addDays, isAfter } from 'date-fns';

const RecurringWorkQueue: React.FC = () => {
  const { maintenancePlans, clients, properties, generateRecurringTicket, loading } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'due' | 'upcoming' | 'overdue'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const now = new Date();
  const nextWeek = addDays(now, 7);

  const categorizedPlans = maintenancePlans.filter(plan => plan.status === 'active').map(plan => {
    const dueDate = new Date(plan.nextDueDate);
    let status: 'due' | 'upcoming' | 'overdue' = 'upcoming';
    
    if (isBefore(dueDate, now)) {
      status = 'overdue';
    } else if (isBefore(dueDate, nextWeek)) {
      status = 'due';
    }
    
    return { ...plan, queueStatus: status };
  });

  const filteredPlans = categorizedPlans.filter(plan => {
    const matchesSearch = 
      plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || plan.queueStatus === filter;
    return matchesSearch && matchesFilter;
  });

  const handleGenerate = async (plan: MaintenancePlan) => {
    setProcessingId(plan.id);
    try {
      await generateRecurringTicket(plan.id);
      // Success - logic handled in context
    } catch (err) {
      console.error('Failed to generate ticket:', err);
      alert('Failed to generate ticket. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.fullName || 'Unknown Client';
  };

  const getPropertyNickname = (propertyId: string) => {
    return properties.find(p => p.id === propertyId)?.nickname || 'Unknown Property';
  };

  const getQueueStatusColor = (status: string) => {
    switch (status) {
      case 'overdue': return 'bg-red-100 text-red-700 border-red-200';
      case 'due': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'upcoming': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recurring Work Queue</h1>
          <p className="text-gray-500">Review and generate tickets for upcoming maintenance plans.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold border border-red-200">
            {categorizedPlans.filter(p => p.queueStatus === 'overdue').length} Overdue
          </div>
          <div className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold border border-amber-200">
            {categorizedPlans.filter(p => p.queueStatus === 'due').length} Due Soon
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search plans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            >
              <option value="all">All Upcoming</option>
              <option value="overdue">Overdue Only</option>
              <option value="due">Due Soon Only</option>
              <option value="upcoming">Future Only</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredPlans.length > 0 ? (
            filteredPlans.map((plan) => (
              <div key={plan.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-gray-50 transition-colors group">
                <div className="flex-1 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl border ${getQueueStatusColor(plan.queueStatus)}`}>
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900">{plan.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getQueueStatusColor(plan.queueStatus)}`}>
                          {plan.queueStatus}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2">{plan.description}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-medium truncate">{getClientName(plan.clientId)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-medium truncate">{getPropertyNickname(plan.propertyId)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-medium">Due: {format(new Date(plan.nextDueDate), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-medium capitalize">{plan.frequency}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleGenerate(plan)}
                    disabled={processingId === plan.id}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    {processingId === plan.id ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 fill-current" />
                    )}
                    <span>Generate Ticket</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-gray-500">
              <Zap className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 mb-1">Queue is Empty</h3>
              <p className="text-sm">No recurring maintenance plans are currently due for generation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecurringWorkQueue;
