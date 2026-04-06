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
  Plus,
  BarChart3,
  ShieldCheck,
  Zap,
  Package,
  ClipboardList,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  Box
} from 'lucide-react';
import { StatusBadge, UrgencyBadge } from './Badges';
import { formatCurrency, formatDate } from '../lib/utils';
import { ReminderCenter } from './CollectionsQueue';

const StatCard: React.FC<{ title: string; value: string | number; icon: any; color: string; trend?: string }> = ({ title, value, icon: Icon, color, trend }) => (
  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md group">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
        <h3 className="mt-1 text-2xl font-black text-gray-900 tracking-tight">{value}</h3>
        {trend && (
          <p className="mt-1 flex items-center text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
            <TrendingUp className="mr-1 h-3 w-3" />
            {trend}
          </p>
        )}
      </div>
      <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl group-hover:scale-110 transition-transform", color)}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  </div>
);

export const AdminDashboard: React.FC<{ setActiveTab: (tab: string) => void }> = ({ setActiveTab }) => {
  const { tickets, clients, technicians, invoices, quotes, partsRequests, technicianStock } = useApp();

  const pendingCount = tickets.filter(t => t.status === 'pending_review').length;
  const activeCount = tickets.filter(t => ['in_progress', 'on_the_way', 'arrived'].includes(t.status)).length;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayJobs = tickets.filter(t => t.scheduledDate === todayStr).length;
  const unpaidRevenue = invoices.filter(i => i.status !== 'paid').reduce((acc, inv) => acc + inv.total, 0);
  const pendingQuotesCount = quotes.filter(q => q.status === 'sent').length;
  const pendingApprovalsCount = quotes.filter(q => q.status === 'sent' && q.approvalId === undefined).length;
  
  const openPartsRequests = partsRequests.filter(r => ['pending', 'approved', 'ordered', 'received'].includes(r.status)).length;
  const lowStockAlerts = technicianStock.filter(s => s.quantity <= s.minThreshold).length;

  return (
    <div className="space-y-8">
      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Pending Approvals" 
          value={pendingApprovalsCount} 
          icon={AlertCircle} 
          color="bg-amber-500" 
          trend={pendingApprovalsCount > 0 ? "Action Needed" : undefined}
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

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Operational Intelligence */}
        <div className="lg:col-span-2 space-y-8">
          {/* Business Automation Alerts */}
          <ReminderCenter setActiveTab={setActiveTab} />

          {/* Recent Service Requests */}
          <div className="rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-50 bg-gray-50/30 px-6 py-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900 tracking-tight">Recent Service Requests</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Latest Activity</p>
              </div>
              <button 
                onClick={() => setActiveTab('dispatch')} 
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
              >
                View All <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="divide-y divide-gray-50 overflow-x-auto">
              {tickets.slice(0, 5).map((ticket) => (
                <div key={ticket.id} className="flex items-center gap-4 px-6 py-5 hover:bg-gray-50/50 transition-colors group cursor-pointer">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <UrgencyBadge urgency={ticket.urgency} />
                      <StatusBadge status={ticket.status} />
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{ticket.title}</h4>
                    <p className="text-xs text-gray-500 font-medium truncate">{ticket.clientName} • {ticket.propertyNickname}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-gray-900">{formatDate(ticket.createdAt)}</div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{ticket.category}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Back Office & Team */}
        <div className="space-y-8">
          {/* AI Insights Card */}
          <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm relative overflow-hidden group cursor-pointer" onClick={() => setActiveTab('ai-center')}>
            <Sparkles className="absolute -right-4 -top-4 h-24 w-24 text-blue-100 rotate-12 group-hover:scale-110 transition-transform" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-blue-600 rounded-xl">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-sm font-black text-gray-900 tracking-tight uppercase">AI Insights</h3>
              </div>
              <p className="text-xs text-blue-800 font-medium leading-relaxed mb-4">
                "3 recurring tickets flagged for potential consolidation. 12% increase in HVAC efficiency detected across portfolio."
              </p>
              <button className="flex items-center gap-1 text-[10px] font-black text-blue-600 uppercase tracking-widest">
                Go to AI Center <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Back Office Quick Actions */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 rounded-xl">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 tracking-tight uppercase">Back Office</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Admin Control</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setActiveTab('reports')} className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-gray-50 bg-gray-50/50 p-4 transition-all hover:bg-indigo-50 hover:border-indigo-100 group">
                <BarChart3 className="h-6 w-6 text-indigo-600 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Reports</span>
              </button>
              <button onClick={() => setActiveTab('billing')} className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-gray-50 bg-gray-50/50 p-4 transition-all hover:bg-emerald-50 hover:border-emerald-100 group">
                <FileText className="h-6 w-6 text-emerald-600 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Billing</span>
              </button>
              <button onClick={() => setActiveTab('records')} className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-gray-50 bg-gray-50/50 p-4 transition-all hover:bg-blue-50 hover:border-blue-100 group">
                <Zap className="h-6 w-6 text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Records</span>
              </button>
              <button onClick={() => setActiveTab('inventory')} className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-gray-50 bg-gray-50/50 p-4 transition-all hover:bg-amber-50 hover:border-amber-100 group relative">
                <Package className="h-6 w-6 text-amber-600 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Inventory</span>
                {lowStockAlerts > 0 && (
                  <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white ring-2 ring-white">
                    {lowStockAlerts}
                  </span>
                )}
              </button>
              <button onClick={() => setActiveTab('assets')} className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-gray-50 bg-gray-50/50 p-4 transition-all hover:bg-blue-50 hover:border-blue-100 group">
                <Box className="h-6 w-6 text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Assets</span>
              </button>
              <button onClick={() => setActiveTab('parts-requests')} className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-gray-50 bg-gray-50/50 p-4 transition-all hover:bg-purple-50 hover:border-purple-100 group relative">
                <ClipboardList className="h-6 w-6 text-purple-600 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Parts Req</span>
                {openPartsRequests > 0 && (
                  <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-purple-500 text-[8px] font-bold text-white ring-2 ring-white">
                    {openPartsRequests}
                  </span>
                )}
              </button>
              <button onClick={() => setActiveTab('purchasing')} className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-gray-50 bg-gray-50/50 p-4 transition-all hover:bg-red-50 hover:border-red-100 group">
                <AlertTriangle className="h-6 w-6 text-red-600 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Restock</span>
              </button>
              <button onClick={() => setActiveTab('clients')} className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-gray-50 bg-gray-50/50 p-4 transition-all hover:bg-amber-50 hover:border-amber-100 group">
                <Users className="h-6 w-6 text-amber-600 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Clients</span>
              </button>
            </div>
          </div>

          {/* Team Availability */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 rounded-xl">
                <HardHat className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 tracking-tight uppercase">Team Status</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Real-time Availability</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {technicians.map(tech => (
                <div key={tech.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700 font-black text-sm group-hover:scale-110 transition-transform">
                      {tech.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{tech.fullName}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider truncate max-w-[120px]">
                        {tech.specialties[0]}
                      </div>
                    </div>
                  </div>
                  <div className={cn(
                    "h-2.5 w-2.5 rounded-full ring-4 ring-white shadow-sm",
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

