import React, { useState, useMemo } from 'react';
import { useApp } from '../AppContext';
import { 
  TrendingUp, TrendingDown, DollarSign, PieChart, 
  BarChart3, Calendar, Download, Filter, 
  ArrowUpRight, ArrowDownRight, Calculator,
  FileText, Briefcase, Users, Activity
} from 'lucide-react';
import { motion } from 'motion/react';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, Cell, PieChart as RePieChart, Pie
} from 'recharts';

const FinancialReportsView: React.FC = () => {
  const { invoices, vendorBills, expenses, taxProfiles } = useApp();
  const [activeTab, setActiveTab] = useState<'pnl' | 'cashflow' | 'tax'>('pnl');
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(subMonths(new Date(), 5)),
    end: endOfMonth(new Date())
  });

  // Calculate P&L Data
  const pnlData = useMemo(() => {
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
        expenses: billExpenses + generalExpenses,
        profit: revenue - (billExpenses + generalExpenses)
      });
    }
    return months;
  }, [invoices, vendorBills, expenses]);

  const totalRevenue = pnlData.reduce((sum, m) => sum + m.revenue, 0);
  const totalExpenses = pnlData.reduce((sum, m) => sum + m.expenses, 0);
  const totalProfit = totalRevenue - totalExpenses;

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-500">Analyze business performance and financial health</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('pnl')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'pnl' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Profit & Loss
        </button>
        <button 
          onClick={() => setActiveTab('cashflow')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'cashflow' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Cash Flow
        </button>
        <button 
          onClick={() => setActiveTab('tax')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'tax' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Tax Summary
        </button>
      </div>

      {activeTab === 'pnl' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SummaryCard title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={<TrendingUp className="text-emerald-600" />} color="emerald" />
            <SummaryCard title="Total Expenses" value={`$${totalExpenses.toLocaleString()}`} icon={<TrendingDown className="text-rose-600" />} color="rose" />
            <SummaryCard title="Net Profit" value={`$${totalProfit.toLocaleString()}`} icon={<DollarSign className="text-blue-600" />} color="blue" />
          </div>

          {/* Profit Chart */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-6">Monthly Performance</h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pnlData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} tickFormatter={(val) => `$${val}`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(val: number) => [`$${val.toLocaleString()}`, '']}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue" />
                  <Bar dataKey="expenses" fill="#fb7185" radius={[4, 4, 0, 0]} name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Expense Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-6">Expense Categories</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={[
                        { name: 'Labor', value: 4500 },
                        { name: 'Materials', value: 3200 },
                        { name: 'Fuel', value: 1200 },
                        { name: 'Office', value: 800 },
                        { name: 'Other', value: 500 },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: number) => `$${val.toLocaleString()}`} />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-6">Top Revenue Sources</h3>
              <div className="space-y-4">
                {[
                  { name: 'HVAC Maintenance', value: 12400, percent: 45 },
                  { name: 'Plumbing Repairs', value: 8200, percent: 30 },
                  { name: 'Electrical Installs', value: 5400, percent: 20 },
                  { name: 'Other Services', value: 1350, percent: 5 },
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">{item.name}</span>
                      <span className="font-bold text-gray-900">${item.value.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${item.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tax' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-gray-900">Tax Liability Summary</h3>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">Q1 2026</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Sales Tax Collected</p>
                <p className="text-2xl font-bold text-gray-900">$4,230.50</p>
                <p className="text-xs text-gray-400 mt-1">From $52,881.25 in taxable sales</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Purchase Tax Paid</p>
                <p className="text-2xl font-bold text-gray-900">$1,120.20</p>
                <p className="text-xs text-gray-400 mt-1">From vendor bills and expenses</p>
              </div>
              <div className="p-6 bg-blue-600 rounded-xl text-white">
                <p className="text-sm opacity-80 mb-1">Estimated Net Tax Payable</p>
                <p className="text-3xl font-bold">$3,110.30</p>
                <button className="mt-4 w-full py-2 bg-white text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors">
                  Generate Remittance Report
                </button>
              </div>
            </div>
            
            <div className="space-y-6">
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Tax Rates Applied</h4>
              <div className="space-y-4">
                {taxProfiles.map(tax => (
                  <div key={tax.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{tax.name}</p>
                      <p className="text-xs text-gray-500">{tax.description || 'Standard Rate'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-blue-600">{tax.rate}%</p>
                      {tax.isDefault && <span className="text-[10px] font-bold text-emerald-600 uppercase">Default</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SummaryCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-50 border-emerald-100',
    rose: 'bg-rose-50 border-rose-100',
    blue: 'bg-blue-50 border-blue-100'
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${colorMap[color]} border`}>
          {icon}
        </div>
      </div>
      <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
};

export default FinancialReportsView;
