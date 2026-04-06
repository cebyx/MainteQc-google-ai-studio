import React, { useState, useMemo } from 'react';
import { useApp } from '../AppContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Briefcase, Users, 
  CheckCircle2, Clock, AlertCircle, Filter, Download, 
  Calendar, ArrowUpRight, ArrowDownRight, Target
} from 'lucide-react';
import { cn } from '../lib/utils';

export const ReportsDashboard: React.FC = () => {
  const { 
    tickets, quotes, invoices, technicians, clients, 
    maintenancePlans, approvalRecords, paymentRecords, reminderEvents,
    partsRequests, technicianStock, inventoryItems
  } = useApp();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Financial Metrics
  const financialStats = useMemo(() => {
    const paidInvoices = invoices.filter(i => i.status === 'paid');
    const unpaidInvoices = invoices.filter(i => i.status === 'unpaid');
    const overdueInvoices = invoices.filter(i => i.status === 'overdue');

    const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.total, 0);
    const outstandingRevenue = unpaidInvoices.reduce((sum, i) => sum + i.total, 0);
    const overdueRevenue = overdueInvoices.reduce((sum, i) => sum + i.total, 0);
    
    const totalPayments = paymentRecords.reduce((sum, p) => sum + p.amount, 0);

    return {
      totalRevenue,
      outstandingRevenue,
      overdueRevenue,
      totalPayments,
      paidCount: paidInvoices.length,
      unpaidCount: unpaidInvoices.length,
      overdueCount: overdueInvoices.length
    };
  }, [invoices, paymentRecords]);

  // Maintenance Plan Metrics
  const maintenanceStats = useMemo(() => {
    const activePlans = maintenancePlans.filter(p => p.status === 'active');
    const totalMonthlyValue = activePlans.reduce((sum, p) => {
      // Estimate monthly value based on frequency
      const freq = p.frequency;
      const cost = p.pricePerVisit || 0;
      if (freq === 'monthly') return sum + cost;
      if (freq === 'quarterly') return sum + (cost / 3);
      if (freq === 'semi-annual') return sum + (cost / 6);
      if (freq === 'annual') return sum + (cost / 12);
      return sum;
    }, 0);

    return {
      activeCount: activePlans.length,
      monthlyRecurringRevenue: totalMonthlyValue,
      totalPlans: maintenancePlans.length
    };
  }, [maintenancePlans]);

  // Approval Metrics
  const approvalStats = useMemo(() => {
    const totalApprovals = approvalRecords.length;
    const approvedCount = approvalRecords.filter(a => a.status === 'approved').length;
    const declinedCount = approvalRecords.filter(a => a.status === 'declined').length;
    
    const approvalRate = totalApprovals > 0 ? (approvedCount / totalApprovals) * 100 : 0;

    return {
      total: totalApprovals,
      approved: approvedCount,
      declined: declinedCount,
      rate: approvalRate
    };
  }, [approvalRecords]);

  // Quote Conversion
  const quoteStats = useMemo(() => {
    const sentQuotes = quotes.filter(q => q.status !== 'draft');
    const acceptedQuotes = quotes.filter(q => q.status === 'accepted');
    const conversionRate = sentQuotes.length > 0 ? (acceptedQuotes.length / sentQuotes.length) * 100 : 0;

    return {
      sent: sentQuotes.length,
      accepted: acceptedQuotes.length,
      conversionRate
    };
  }, [quotes]);

  // Reminder Metrics
  const reminderStats = useMemo(() => {
    const totalReminders = reminderEvents.length;
    const quoteReminders = reminderEvents.filter(r => r.targetType === 'quote').length;
    const invoiceReminders = reminderEvents.filter(r => r.targetType === 'invoice').length;

    return {
      total: totalReminders,
      quotes: quoteReminders,
      invoices: invoiceReminders
    };
  }, [reminderEvents]);

  // Inventory Metrics
  const inventoryStats = useMemo(() => {
    const totalRequests = partsRequests.length;
    const pendingRequests = partsRequests.filter(r => r.status === 'pending').length;
    const fulfilledRequests = partsRequests.filter(r => r.status === 'fulfilled').length;
    const fulfillmentRate = totalRequests > 0 ? (fulfilledRequests / totalRequests) * 100 : 0;

    const lowStockVans = new Set(technicianStock.filter(s => s.quantity <= s.minThreshold).map(s => s.technicianId)).size;
    const outOfStockItems = technicianStock.filter(s => s.quantity === 0).length;

    return {
      totalRequests,
      pendingRequests,
      fulfilledRequests,
      fulfillmentRate,
      lowStockVans,
      outOfStockItems
    };
  }, [partsRequests, technicianStock]);

  // Job Volume over time (mocking some data points based on real tickets)
  const jobVolumeData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = tickets.filter(t => t.createdAt.startsWith(dateStr)).length;
      return { name: date.toLocaleDateString('en-US', { weekday: 'short' }), jobs: count };
    }).reverse();
    return last7Days;
  }, [tickets]);

  // Revenue by Category
  const revenueByCategory = useMemo(() => {
    const categories: Record<string, number> = {};
    invoices.filter(i => i.status === 'paid').forEach(inv => {
      const ticket = tickets.find(t => t.id === inv.ticketId);
      const cat = ticket?.category || 'General';
      categories[cat] = (categories[cat] || 0) + inv.total;
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [invoices, tickets]);

  // Technician Performance
  const techPerformance = useMemo(() => {
    return technicians.map(tech => {
      const completedJobs = tickets.filter(t => t.assignedTechnicianId === tech.id && t.status === 'completed').length;
      const openJobs = tickets.filter(t => t.assignedTechnicianId === tech.id && t.status !== 'completed' && t.status !== 'cancelled').length;
      return {
        name: tech.fullName.split(' ')[0],
        completed: completedJobs,
        open: openJobs
      };
    }).sort((a, b) => b.completed - a.completed);
  }, [technicians, tickets]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Business Intelligence</h2>
          <p className="text-sm text-gray-500">Real-time operational and financial performance analytics.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1">
            {(['7d', '30d', '90d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-4 py-2 text-xs font-bold rounded-lg transition-all uppercase tracking-wider",
                  timeRange === range ? "bg-gray-900 text-white shadow-sm" : "text-gray-500 hover:text-gray-900"
                )}
              >
                {range}
              </button>
            ))}
          </div>
          <button className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600">
            <Download className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Revenue" 
          value={`$${financialStats.totalRevenue.toLocaleString()}`} 
          icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
          trend="+12.5%"
          trendUp={true}
          subtitle="Paid invoices to date"
        />
        <StatCard 
          title="Recurring Revenue" 
          value={`$${maintenanceStats.monthlyRecurringRevenue.toLocaleString()}/mo`} 
          icon={<Clock className="h-5 w-5 text-blue-600" />}
          trend={`${maintenanceStats.activeCount} active plans`}
          trendUp={true}
          subtitle="Estimated MRR"
        />
        <StatCard 
          title="Approval Rate" 
          value={`${approvalStats.rate.toFixed(1)}%`} 
          icon={<CheckCircle2 className="h-5 w-5 text-purple-600" />}
          trend={`${approvalStats.approved} approved`}
          trendUp={true}
          subtitle="Quote approvals"
        />
        <StatCard 
          title="Reminders Sent" 
          value={`${reminderStats.total}`} 
          icon={<AlertCircle className="h-5 w-5 text-amber-600" />}
          trend={`${reminderStats.invoices} invoices`}
          trendUp={true}
          subtitle="Follow-ups"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Job Volume Chart */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Job Volume</h3>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Last 7 Days</span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={jobVolumeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 600 }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f9fafb' }}
                />
                <Bar dataKey="jobs" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Category */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Revenue by Category</h3>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Distribution</span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {revenueByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  align="center"
                  iconType="circle"
                  wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 600 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Technician Productivity */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Technician Productivity</h3>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Completions vs Open</span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={techPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis type="number" axisLine={false} tickLine={false} hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#4b5563', fontWeight: 700 }}
                  width={80}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Bar dataKey="completed" name="Completed Jobs" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                <Bar dataKey="open" name="Open Jobs" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Aging Invoices */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Aging Invoices</h3>
            <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-bold uppercase tracking-wider">Requires Action</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Invoice</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Client</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Due Date</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.filter(i => i.status === 'overdue' || i.status === 'unpaid').slice(0, 5).map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-gray-900">#{inv.id.slice(-6).toUpperCase()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 font-medium">Ticket #{inv.ticketId.slice(-6)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">{new Date(inv.dueDate).toLocaleDateString()}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-gray-900">${inv.total.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                        inv.status === 'overdue' ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                      )}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quote Conversion List */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Pending Quotes</h3>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Follow-up</span>
          </div>
          <div className="p-4 space-y-4">
            {quotes.filter(q => q.status === 'sent').slice(0, 4).map(quote => (
              <div key={quote.id} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 hover:bg-blue-50 transition-colors cursor-pointer group">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Quote #{quote.id.slice(-6).toUpperCase()}</p>
                  <p className="text-[10px] text-gray-500 font-medium">Sent {new Date(quote.sentDate || quote.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">${quote.total.toFixed(2)}</p>
                  <p className="text-[10px] text-blue-600 font-bold uppercase tracking-tighter">Awaiting Decision</p>
                </div>
              </div>
            ))}
            {quotes.filter(q => q.status === 'sent').length === 0 && (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-400 italic">No pending quotes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: string;
  trendUp: boolean;
  subtitle: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, trendUp, subtitle }) => (
  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-gray-50 rounded-2xl group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className={cn(
        "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
        trendUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
      )}>
        {trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
        {trend}
      </div>
    </div>
    <div className="space-y-1">
      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</h4>
      <p className="text-2xl font-black text-gray-900 tracking-tight">{value}</p>
      <p className="text-[10px] text-gray-400 font-medium">{subtitle}</p>
    </div>
  </div>
);
