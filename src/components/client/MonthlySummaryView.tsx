import React, { useState, useMemo } from 'react';
import { useApp } from '../../AppContext';
import { 
  FileText, 
  TrendingUp, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  Sparkles, 
  Zap, 
  Clock, 
  DollarSign, 
  Download,
  X,
  Plus,
  BarChart3,
  PieChart as PieChartIcon,
  LayoutGrid
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { MonthlyClientSummary } from '../../types';

export const MonthlySummaryView: React.FC = () => {
  const { 
    role, 
    currentUser, 
    monthlySummaries, 
    generateMonthlySummary 
  } = useApp();
  
  const [isGenerating, setIsGenerating] = useState(false);

  const sortedSummaries = useMemo(() => {
    return [...monthlySummaries].sort((a, b) => b.month.localeCompare(a.month));
  }, [monthlySummaries]);

  const handleGenerate = async () => {
    if (!currentUser?.id) return;
    setIsGenerating(true);
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    await generateMonthlySummary(currentUser.id, currentMonth);
    setIsGenerating(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-blue-600" />
            AI Monthly Service Summaries
          </h2>
          <p className="text-gray-500">Intelligent insights and performance metrics for your properties.</p>
        </div>
        {role === 'ADMIN' && (
          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className={cn(
              "flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200",
              isGenerating && "opacity-50 cursor-not-allowed"
            )}
          >
            {isGenerating ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            Generate Current Month
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {sortedSummaries.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="h-20 w-20 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">No summaries yet</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Your monthly AI-powered service summaries will appear here once they are generated.
            </p>
          </div>
        ) : (
          sortedSummaries.map((summary, i) => (
            <motion.div
              key={summary.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-3xl bg-white shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden"
            >
              {/* Summary Header */}
              <div className="p-8 border-b border-gray-50 bg-gradient-to-r from-blue-50/50 to-transparent flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest">AI Generated</span>
                    <span className="text-sm font-bold text-gray-400">{new Date(summary.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                  </div>
                  <h3 className="text-3xl font-black text-gray-900">Monthly Service Performance</h3>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all">
                  <Download className="h-4 w-4" />
                  Download PDF
                </button>
              </div>

              <div className="p-8 space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-green-100 text-green-600">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Jobs Done</span>
                    </div>
                    <div className="text-3xl font-black text-gray-900">{summary.stats.jobsCompleted}</div>
                    <div className="text-xs font-medium text-green-600 mt-1 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      +12% vs last month
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Open Invoices</span>
                    </div>
                    <div className="text-3xl font-black text-gray-900">{summary.stats.openInvoices}</div>
                    <div className="text-xs font-medium text-amber-600 mt-1">Requires attention</div>
                  </div>

                  <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Maintenance</span>
                    </div>
                    <div className="text-3xl font-black text-gray-900">{summary.stats.upcomingMaintenance}</div>
                    <div className="text-xs font-medium text-blue-600 mt-1">Scheduled visits</div>
                  </div>

                  <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                        <DollarSign className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Spend</span>
                    </div>
                    <div className="text-3xl font-black text-gray-900">${summary.stats.totalSpent.toLocaleString()}</div>
                    <div className="text-xs font-medium text-gray-500 mt-1">Across all properties</div>
                  </div>
                </div>

                {/* AI Summary Text */}
                <div className="p-6 rounded-2xl bg-blue-50 border border-blue-100 relative overflow-hidden">
                  <Sparkles className="absolute -right-4 -top-4 h-24 w-24 text-blue-100 rotate-12" />
                  <div className="relative">
                    <h4 className="text-lg font-bold text-blue-900 mb-2 flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      AI Insights Summary
                    </h4>
                    <p className="text-blue-800 leading-relaxed font-medium">
                      {summary.summary}
                    </p>
                  </div>
                </div>

                {/* Highlights & Action Items */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Service Highlights
                    </h4>
                    <ul className="space-y-3">
                      {summary.highlights.map((highlight, idx) => (
                        <li key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 shadow-sm">
                          <div className="h-6 w-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[10px] font-black">
                            {idx + 1}
                          </div>
                          <span className="text-sm font-medium text-gray-700">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      Recommended Actions
                    </h4>
                    <ul className="space-y-3">
                      {summary.actionItems.map((action, idx) => (
                        <li key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 shadow-sm">
                          <div className="h-6 w-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                            <ChevronRight className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
