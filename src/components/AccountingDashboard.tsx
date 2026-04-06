import React, { useState, useMemo } from 'react';
import { useApp } from '../AppContext';
import { 
  TrendingUp, TrendingDown, DollarSign, Receipt, Users, FileText, 
  ArrowUpRight, ArrowDownRight, Calendar, Filter, Download, Plus,
  Briefcase, Calculator, PieChart, Activity, Clock
} from 'lucide-react';
import { motion } from 'motion/react';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, Cell, PieChart as RePieChart, Pie
} from 'recharts';

const AccountingDashboard: React.FC = () => {
  const { 
    invoices, vendorBills, expenses, financialActivities,
    calculateJobCosting, tickets
  } = useApp();

  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // Calculate KPIs
  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid' || inv.status === 'partially_paid')
    .reduce((sum, inv) => sum + (inv.amountPaid || inv.total), 0);

  const pendingRevenue = invoices
    .filter(inv => inv.status === 'unpaid' || inv.status === 'overdue' || inv.status === 'partially_paid')
    .reduce((sum, inv) => sum + (inv.balanceRemaining || inv.total), 0);

  const totalExpenses = vendorBills
    .filter(bill => bill.status === 'paid' || bill.status === 'partially_paid')
    .reduce((sum, bill) => sum + bill.amountPaid, 0) +
    expenses
    .filter(exp => exp.status === 'approved' || exp.status === 'reimbursed')
    .reduce((sum, exp) => sum + exp.total, 0);

  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const overdueInvoicesCount = invoices.filter(inv => inv.status === 'overdue').length;

  // Chart Data: Revenue vs Expenses over time (Last 6 months)
  const chartData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const revenue = invoices
        .filter(inv => inv.status === 'paid' && isWithinInterval(new Date(inv.createdAt), { start: monthStart, end: monthEnd }))
        .reduce((sum, inv) => sum + inv.total, 0);
        
      const billExpenses = vendorBills
        .filter(bill => bill.status === 'paid' && isWithinInterval(new Date(bill.createdAt), { start: monthStart, end: monthEnd }))
        .reduce((sum, bill) => sum + bill.total, 0);
        
      const generalExpenses = expenses
        .filter(exp => (exp.status === 'approved' || exp.status === 'reimbursed') && isWithinInterval(new Date(exp.createdAt), { start: monthStart, end: monthEnd }))
        .reduce((sum, exp) => sum + exp.total, 0);
        
      months.push({
        name: format(date, 'MMM'),
        revenue,
        expenses: billExpenses + generalExpenses
      });
    }
    return months;
  }, [invoices, vendorBills, expenses]);

  // Tax Liability Estimates
  const taxLiability = useMemo(() => {
    const salesTax = invoices.reduce((sum, inv) => {
      const tax = inv.tax || 0;
      return sum + tax;
    }, 0);
    return salesTax;
  }, [invoices]);

  // Top Profitable Jobs
  const profitableJobs = useMemo(() => {
    return tickets
      .filter(t => t.jobCosting && t.jobCosting.marginPercentage !== undefined)
      .sort((a, b) => (b.jobCosting?.marginPercentage || 0) - (a.jobCosting?.marginPercentage || 0))
      .slice(0, 3);
  }, [tickets]);

  const recentActivities = [...financialActivities]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Control Center</h1>
          <p className="text-gray-500">Real-time business performance and accounting overview</p>
        </div>
        <div className="flex gap-3">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          <button className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            Export Reports
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Total Revenue" 
          value={`$${totalRevenue.toLocaleString()}`}
          trend="YTD"
          trendUp={true}
          icon={<TrendingUp className="w-6 h-6 text-emerald-600" />}
          subValue={`$${pendingRevenue.toLocaleString()} pending`}
          color="emerald"
        />
        <KPICard 
          title="Total Expenses" 
          value={`$${totalExpenses.toLocaleString()}`}
          trend="YTD"
          trendUp={false}
          icon={<TrendingDown className="w-6 h-6 text-rose-600" />}
          subValue="Includes bills & payroll"
          color="rose"
        />
        <KPICard 
          title="Net Profit" 
          value={`$${netProfit.toLocaleString()}`}
          trend="YTD"
          trendUp={true}
          icon={<DollarSign className="w-6 h-6 text-blue-600" />}
          subValue={`${profitMargin.toFixed(1)}% margin`}
          color="blue"
        />
        <KPICard 
          title="Accounts Receivable" 
          value={`$${pendingRevenue.toLocaleString()}`}
          trend="Current"
          trendUp={true}
          icon={<Receipt className="w-6 h-6 text-amber-600" />}
          subValue={`${overdueInvoicesCount} invoices overdue`}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900">Revenue vs Expenses</h3>
            <div className="flex gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <span>Expenses</span>
              </div>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="expenses" stroke="#fb7185" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Financial Activity */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Recent Activity
          </h3>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => {
                const isIncome = ['invoice_issued', 'payment_received'].includes(activity.type);
                const isExpense = ['bill_received', 'bill_paid', 'expense_recorded', 'stock_purchase', 'payroll_processed'].includes(activity.type);
                
                return (
                  <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-gray-50 last:border-0">
                    <div className={`p-2 rounded-lg ${
                      isIncome ? 'bg-emerald-50 text-emerald-600' :
                      isExpense ? 'bg-rose-50 text-rose-600' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      {isIncome ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{activity.description}</p>
                      <p className="text-xs text-gray-500">{format(new Date(activity.timestamp), 'MMM d, h:mm a')}</p>
                    </div>
                    <div className={`text-sm font-bold ${
                      isIncome ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {isIncome ? '+' : '-'}${activity.amount.toLocaleString()}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Calculator className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No recent financial activity</p>
              </div>
            )}
          </div>
          <button className="w-full mt-6 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            View All Ledger Entries
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <QuickAction icon={<Plus className="w-4 h-4" />} label="New Bill" color="rose" onClick={() => {}} />
            <QuickAction icon={<Plus className="w-4 h-4" />} label="New Expense" color="amber" onClick={() => {}} />
            <QuickAction icon={<Users className="w-4 h-4" />} label="Add Vendor" color="blue" onClick={() => {}} />
            <QuickAction icon={<Briefcase className="w-4 h-4" />} label="Run Payroll" color="emerald" onClick={() => {}} />
          </div>
        </div>

        {/* Tax Summary */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Tax Liability</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Estimated Sales Tax</span>
              <span className="text-sm font-bold text-gray-900">${taxLiability.toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '65%' }} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Payroll Taxes</span>
              <span className="text-sm font-bold text-gray-900">${(totalExpenses * 0.15).toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '40%' }} />
            </div>
          </div>
        </div>

        {/* Job Costing Snapshot */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Top Profitable Jobs</h3>
          <div className="space-y-3">
            {profitableJobs.map(ticket => (
              <div key={ticket.id} className="flex justify-between items-center text-sm">
                <span className="text-gray-600 truncate mr-2">Ticket #{ticket.id.slice(-4)} - {ticket.title}</span>
                <span className="font-bold text-emerald-600">{Math.round(ticket.jobCosting?.marginPercentage || 0)}%</span>
              </div>
            ))}
            {profitableJobs.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No job costing data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const KPICard: React.FC<{ 
  title: string; 
  value: string; 
  trend: string; 
  trendUp: boolean; 
  icon: React.ReactNode;
  subValue: string;
  color: 'emerald' | 'rose' | 'blue' | 'amber';
}> = ({ title, value, trend, trendUp, icon, subValue, color }) => {
  const colorClasses = {
    emerald: 'bg-emerald-50 border-emerald-100',
    rose: 'bg-rose-50 border-rose-100',
    blue: 'bg-blue-50 border-blue-100',
    amber: 'bg-amber-50 border-amber-100'
  };

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[color]} border`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
          {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend}
        </div>
      </div>
      <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <p className="text-xs text-gray-400">{subValue}</p>
    </motion.div>
  );
};

const QuickAction: React.FC<{ icon: React.ReactNode; label: string; color: string; onClick?: () => void }> = ({ icon, label, color, onClick }) => {
  const colorMap: Record<string, string> = {
    rose: 'text-rose-600 bg-rose-50 hover:bg-rose-100',
    amber: 'text-amber-600 bg-amber-50 hover:bg-amber-100',
    blue: 'text-blue-600 bg-blue-50 hover:bg-blue-100',
    emerald: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
  };

  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-3 rounded-xl transition-colors ${colorMap[color]}`}
    >
      <div className="mb-2">{icon}</div>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
};

export default AccountingDashboard;
