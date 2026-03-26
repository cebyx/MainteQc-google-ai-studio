import React from 'react';
import { useApp } from '../AppContext';
import { cn } from '../lib/utils';
import { 
  ClipboardCheck, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp,
  ArrowRight,
  Users,
  HardHat,
  FileText,
  Plus
} from 'lucide-react';
import { StatusBadge, UrgencyBadge } from './Badges';
import { formatCurrency, formatDate } from '../lib/utils';

const StatCard: React.FC<{ title: string; value: string | number; icon: any; color: string; trend?: string }> = ({ title, value, icon: Icon, color, trend }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
        <h3 className="mt-1 text-2xl font-bold text-gray-900">{value}</h3>
        {trend && (
          <p className="mt-1 flex items-center text-xs text-emerald-600">
            <TrendingUp className="mr-1 h-3 w-3" />
            {trend} from last week
          </p>
        )}
      </div>
      <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", color)}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  </div>
);

export const AdminDashboard: React.FC<{ setActiveTab: (tab: string) => void }> = ({ setActiveTab }) => {
  const { tickets, clients, technicians, invoices } = useApp();

  const pendingCount = tickets.filter(t => t.status === 'pending_review').length;
  const activeCount = tickets.filter(t => ['in_progress', 'on_the_way', 'arrived'].includes(t.status)).length;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayJobs = tickets.filter(t => t.scheduledDate === todayStr).length;
  const unpaidRevenue = invoices.filter(i => i.status !== 'paid').reduce((acc, inv) => acc + inv.total, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Pending Review" 
          value={pendingCount} 
          icon={AlertCircle} 
          color="bg-amber-500" 
          trend="+2"
        />
        <StatCard 
          title="Active Jobs" 
          value={activeCount} 
          icon={Clock} 
          color="bg-blue-600" 
        />
        <StatCard 
          title="Today's Schedule" 
          value={todayJobs} 
          icon={ClipboardCheck} 
          color="bg-indigo-600" 
        />
        <StatCard 
          title="Unpaid Revenue" 
          value={formatCurrency(unpaidRevenue)} 
          icon={FileText} 
          color="bg-emerald-600" 
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Requests */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-4">
            <h3 className="font-bold text-gray-900">Recent Service Requests</h3>
            <button onClick={() => setActiveTab('dispatch')} className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="divide-y divide-gray-100 overflow-x-auto">
            {tickets.slice(0, 5).map((ticket) => (
              <div key={ticket.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <UrgencyBadge urgency={ticket.urgency} />
                    <StatusBadge status={ticket.status} />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 truncate">{ticket.title}</h4>
                  <p className="text-xs text-gray-500 truncate">{ticket.clientName} • {ticket.propertyNickname}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-medium text-gray-900">{formatDate(ticket.createdAt)}</div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-tighter">{ticket.category}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions & Stats */}
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setActiveTab('dispatch')} className="flex flex-col items-center justify-center gap-2 rounded-lg border border-gray-100 bg-gray-50 p-4 transition-all hover:bg-blue-50 hover:border-blue-200 group">
                <Plus className="h-6 w-6 text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-gray-700">New Ticket</span>
              </button>
              <button onClick={() => setActiveTab('clients')} className="flex flex-col items-center justify-center gap-2 rounded-lg border border-gray-100 bg-gray-50 p-4 transition-all hover:bg-blue-50 hover:border-blue-200 group">
                <Users className="h-6 w-6 text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-gray-700">Add Client</span>
              </button>
              <button onClick={() => setActiveTab('dispatch')} className="flex flex-col items-center justify-center gap-2 rounded-lg border border-gray-100 bg-gray-50 p-4 transition-all hover:bg-blue-50 hover:border-blue-200 group">
                <HardHat className="h-6 w-6 text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-gray-700">Dispatch</span>
              </button>
              <button onClick={() => setActiveTab('billing')} className="flex flex-col items-center justify-center gap-2 rounded-lg border border-gray-100 bg-gray-50 p-4 transition-all hover:bg-blue-50 hover:border-blue-200 group">
                <FileText className="h-6 w-6 text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-gray-700">Invoicing</span>
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Team Availability</h3>
            <div className="space-y-4">
              {technicians.map(tech => (
                <div key={tech.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                      {tech.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{tech.fullName}</div>
                      <div className="text-[10px] text-gray-500 uppercase">{tech.specialties.join(', ')}</div>
                    </div>
                  </div>
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    tech.status === 'available' ? "bg-emerald-500" : tech.status === 'busy' ? "bg-amber-500" : "bg-gray-300"
                  )}></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
