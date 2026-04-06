import React, { useState } from 'react';
import { useApp } from '../../AppContext';
import { 
  Zap, 
  Search, 
  MessageSquare, 
  Settings, 
  FileText, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  X,
  Plus,
  Play,
  Pause,
  Trash2,
  ChevronRight,
  Sparkles,
  BrainCircuit,
  Bot
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

export const AICenterView: React.FC = () => {
  const { 
    role, 
    tickets, 
    invoices, 
    quotes, 
    technicians, 
    automationRules, 
    automationLogs,
    createAutomationRule,
    updateAutomationRule,
    deleteAutomationRule,
    runAutomationRule
  } = useApp();
  
  const [activeSubTab, setActiveSubTab] = useState<'ask' | 'search' | 'insights' | 'automations' | 'summaries' | 'exceptions'>('ask');
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);

  const stats = [
    { label: 'AI Insights', value: '12', icon: BrainCircuit, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Active Automations', value: automationRules.filter(r => r.isActive).length.toString(), icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Exceptions Flagged', value: '3', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Time Saved (Est)', value: '42h', icon: Clock, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-blue-600" />
            AI Service OS Center
          </h2>
          <p className="text-gray-500">Intelligent operations, automations, and insights for your service business.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveSubTab('ask')}
            className={cn(
              "px-4 py-2 rounded-xl font-bold text-sm transition-all",
              activeSubTab === 'ask' ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            )}
          >
            Ask AI
          </button>
          <button 
            onClick={() => setActiveSubTab('automations')}
            className={cn(
              "px-4 py-2 rounded-xl font-bold text-sm transition-all",
              activeSubTab === 'automations' ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            )}
          >
            Automations
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-2 rounded-xl", stat.bg)}>
                <stat.icon className={cn("h-6 w-6", stat.color)} />
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Live</span>
            </div>
            <div className="text-3xl font-black text-gray-900">{stat.value}</div>
            <div className="text-sm font-medium text-gray-500">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive AI / Rules */}
        <div className="lg:col-span-2 space-y-6">
          {activeSubTab === 'ask' && (
            <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-blue-600" />
                  <span className="font-bold text-gray-900">AI Assistant Workspace</span>
                </div>
                <div className="flex gap-2">
                  <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-[10px] font-black uppercase">Grounded in Live Data</span>
                </div>
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl rounded-tl-none p-4 text-sm text-gray-800 max-w-[80%]">
                    Hello! I'm your MainteQC AI assistant. I can help you analyze your operations, find specific records, or suggest automations. 
                    <br /><br />
                    Try asking:
                    <ul className="mt-2 space-y-1 list-disc list-inside text-blue-600 font-medium">
                      <li>"Which invoices are at risk of going overdue?"</li>
                      <li>"Show me technicians with the highest workload this week."</li>
                      <li>"What are the most common parts used in the last 30 days?"</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Ask anything about your business..." 
                    className="w-full pl-4 pr-12 py-3 rounded-xl border-gray-200 bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Play className="h-4 w-4 fill-current" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'automations' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Automation Rules</h3>
                <button 
                  onClick={() => setIsRuleModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                >
                  <Plus className="h-4 w-4" />
                  New Rule
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {automationRules.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
                    <Zap className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-bold text-gray-900 mb-1">No automations yet</h4>
                    <p className="text-gray-500 mb-6">Create rules to automate notifications, follow-ups, and more.</p>
                    <button 
                      onClick={() => setIsRuleModalOpen(true)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
                    >
                      Create Your First Rule
                    </button>
                  </div>
                ) : (
                  automationRules.map(rule => (
                    <div key={rule.id} className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-3 rounded-xl", rule.isActive ? "bg-blue-50" : "bg-gray-50")}>
                          <Zap className={cn("h-6 w-6", rule.isActive ? "text-blue-600" : "text-gray-400")} />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{rule.name}</h4>
                          <p className="text-sm text-gray-500">{rule.description}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                              Trigger: {rule.trigger.type.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-600">
                              Action: {rule.action.type.replace('_', ' ')}
                            </span>
                            {rule.lastRunAt && (
                              <span className="text-[10px] font-medium text-gray-400">
                                Last run: {new Date(rule.lastRunAt).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => updateAutomationRule(rule.id, { isActive: !rule.isActive })}
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            rule.isActive ? "text-amber-600 hover:bg-amber-50" : "text-green-600 hover:bg-green-50"
                          )}
                          title={rule.isActive ? "Pause Rule" : "Activate Rule"}
                        >
                          {rule.isActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                        </button>
                        <button 
                          onClick={() => deleteAutomationRule(rule.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Rule"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Insights / Logs */}
        <div className="space-y-6">
          {/* AI Insights Panel */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-purple-600" />
              Live Insights
            </h3>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-amber-900">Collections Risk</div>
                    <p className="text-xs text-amber-700 mt-1">
                      3 invoices totaling $4,250 are more than 15 days overdue. Suggesting automated follow-up.
                    </p>
                    <button className="mt-2 text-xs font-bold text-amber-900 underline">View Invoices</button>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-blue-900">Efficiency Boost</div>
                    <p className="text-xs text-blue-700 mt-1">
                      Technician Mike has 4 jobs in the same area tomorrow. Suggesting optimized route.
                    </p>
                    <button className="mt-2 text-xs font-bold text-blue-900 underline">Optimize Route</button>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-purple-900">Maintenance Alert</div>
                    <p className="text-xs text-purple-700 mt-1">
                      5 recurring maintenance plans are due for ticket generation this week.
                    </p>
                    <button className="mt-2 text-xs font-bold text-purple-900 underline">Generate Tickets</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Automation Logs */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-500" />
              Automation Activity
            </h3>
            <div className="space-y-3">
              {automationLogs.slice(0, 5).map(log => (
                <div key={log.id} className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                  <div className={cn(
                    "h-2 w-2 rounded-full mt-1.5 shrink-0",
                    log.status === 'success' ? "bg-green-500" : "bg-red-500"
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-gray-900 truncate">{log.ruleName}</div>
                    <div className="text-[10px] text-gray-500">{log.message}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{new Date(log.timestamp).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
              {automationLogs.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4 italic">No recent activity</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rule Modal Placeholder */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900">Create Automation Rule</h3>
              <button onClick={() => setIsRuleModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="h-6 w-6 text-gray-400" />
              </button>
            </div>
            <form className="p-6 space-y-4" onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              createAutomationRule({
                name: formData.get('name') as string,
                description: formData.get('description') as string,
                trigger: { type: formData.get('trigger') as any, conditions: {} },
                action: { type: formData.get('action') as any, params: {} },
                isActive: true
              });
              setIsRuleModalOpen(false);
            }}>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Rule Name</label>
                <input name="name" required className="w-full px-4 py-2 rounded-xl border-gray-200 bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="e.g. Overdue Invoice Alert" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                <textarea name="description" className="w-full px-4 py-2 rounded-xl border-gray-200 bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="What does this rule do?" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Trigger</label>
                  <select name="trigger" className="w-full px-4 py-2 rounded-xl border-gray-200 bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <option value="invoice_overdue">Invoice Overdue</option>
                    <option value="quote_pending">Quote Pending</option>
                    <option value="parts_pending">Parts Pending</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="maintenance_due">Maintenance Due</option>
                    <option value="work_session_threshold">Work Session Threshold</option>
                    <option value="unassigned_ticket">Unassigned Ticket</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Action</label>
                  <select name="action" className="w-full px-4 py-2 rounded-xl border-gray-200 bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <option value="create_notification">Create Notification</option>
                    <option value="send_reminder">Send Reminder</option>
                    <option value="escalate_ticket">Escalate Ticket</option>
                    <option value="create_task">Create Task</option>
                  </select>
                </div>
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                  Create Rule
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
