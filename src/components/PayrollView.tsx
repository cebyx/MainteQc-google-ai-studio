import React, { useState, useMemo } from 'react';
import { useApp } from '../AppContext';
import { 
  Plus, Search, Filter, MoreVertical, Download, 
  Users, Clock, DollarSign, Calendar, CheckCircle2,
  AlertCircle, Briefcase, User, ChevronRight,
  ArrowUpRight, FileText, Calculator, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, startOfWeek, endOfWeek, subWeeks, isWithinInterval } from 'date-fns';
import { Technician, WorkSession, TimesheetApproval, PayrollExportBatch } from '../types';

const PayrollView: React.FC = () => {
  const { 
    technicians, workSessions, timesheetApprovals, payrollBatches,
    approveTimesheet, createPayrollBatch, technicianPayProfiles, currentUser
  } = useApp();

  const [activeTab, setActiveTab] = useState<'review' | 'batches' | 'profiles'>('review');
  const [selectedWeek, setSelectedWeek] = useState(startOfWeek(new Date()));

  // Calculate hours for the selected week
  const weeklyStats = useMemo(() => {
    const stats: Record<string, { regular: number; travel: number; onsite: number; total: number; sessionIds: string[] }> = {};
    
    const weekStart = selectedWeek;
    const weekEnd = endOfWeek(selectedWeek);

    workSessions.forEach(session => {
      const sessionDate = new Date(session.startTime);
      if (isWithinInterval(sessionDate, { start: weekStart, end: weekEnd })) {
        if (!stats[session.technicianId]) {
          stats[session.technicianId] = { regular: 0, travel: 0, onsite: 0, total: 0, sessionIds: [] };
        }
        
        const duration = session.durationMinutes / 60;
        stats[session.technicianId].total += duration;
        stats[session.technicianId].sessionIds.push(session.id);
        
        if (session.sessionType === 'travel') stats[session.technicianId].travel += duration;
        else stats[session.technicianId].onsite += duration;
      }
    });

    return stats;
  }, [workSessions, selectedWeek]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll & Timesheets</h1>
          <p className="text-gray-500">Review work sessions, approve time, and export payroll</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button 
            onClick={() => setActiveTab('batches')}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Payroll Batch
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('review')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'review' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Timesheet Review
        </button>
        <button 
          onClick={() => setActiveTab('batches')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'batches' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Payroll Batches
        </button>
        <button 
          onClick={() => setActiveTab('profiles')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'profiles' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Pay Profiles
        </button>
      </div>

      {activeTab === 'review' && (
        <div className="space-y-6">
          {/* Week Selector */}
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSelectedWeek(subWeeks(selectedWeek, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <div className="text-center">
                <p className="text-sm font-bold text-gray-900">
                  {format(selectedWeek, 'MMM d')} - {format(endOfWeek(selectedWeek), 'MMM d, yyyy')}
                </p>
                <p className="text-xs text-gray-500">Current Pay Period</p>
              </div>
              <button 
                onClick={() => setSelectedWeek(new Date(selectedWeek.getTime() + 7 * 24 * 60 * 60 * 1000))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="flex gap-6">
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Total Hours</p>
                <p className="text-lg font-bold text-gray-900">
                  {Object.values(weeklyStats).reduce((sum, s) => sum + s.total, 0).toFixed(1)}h
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Est. Labor Cost</p>
                <p className="text-lg font-bold text-emerald-600">$4,230.50</p>
              </div>
            </div>
          </div>

          {/* Timesheet Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Technician</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Regular</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Travel</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Total Hours</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Est. Pay</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {technicians.map((tech) => {
                  const stats = weeklyStats[tech.id] || { regular: 0, travel: 0, onsite: 0, total: 0, sessionIds: [] };
                  const profile = technicianPayProfiles.find(p => p.technicianId === tech.id);
                  const estPay = stats.total * (profile?.hourlyRate || 25);
                  const approval = timesheetApprovals.find(a => 
                    a.technicianId === tech.id && 
                    format(new Date(a.startDate), 'yyyy-MM-dd') === format(selectedWeek, 'yyyy-MM-dd')
                  );

                  return (
                    <tr key={tech.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                            {tech.fullName.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">{tech.fullName}</span>
                            <span className="text-xs text-gray-500">{tech.role}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{stats.onsite.toFixed(1)}h</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{stats.travel.toFixed(1)}h</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">{stats.total.toFixed(1)}h</td>
                      <td className="px-6 py-4 text-sm font-bold text-emerald-600">${estPay.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={approval?.status || 'pending'} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => approveTimesheet({
                              technicianId: tech.id,
                              technicianName: tech.fullName,
                              startDate: format(selectedWeek, 'yyyy-MM-dd'),
                              endDate: format(endOfWeek(selectedWeek), 'yyyy-MM-dd'),
                              totalRegularHours: stats.onsite,
                              totalTravelHours: stats.travel,
                              totalOvertimeHours: 0,
                              totalPay: estPay,
                              status: 'approved',
                              approvedBy: currentUser.id,
                              approvedAt: new Date().toISOString(),
                              notes: '',
                              workSessionIds: stats.sessionIds
                            })}
                            className="px-3 py-1 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Approve
                          </button>
                          <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'batches' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {payrollBatches.map((batch) => (
            <div key={batch.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <Calculator className="w-6 h-6 text-emerald-600" />
                </div>
                <StatusBadge status={batch.status} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{batch.batchName}</h3>
              <p className="text-sm text-gray-500 mb-4">
                {format(new Date(batch.periodStart), 'MMM d')} - {format(new Date(batch.periodEnd), 'MMM d, yyyy')}
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-6 p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold">Total Pay</p>
                  <p className="text-lg font-bold text-gray-900">${batch.totalAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold">Employees</p>
                  <p className="text-lg font-bold text-gray-900">{batch.employeeCount}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                  View Details
                </button>
                <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg border border-gray-200">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {payrollBatches.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
              <Calculator className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500">No payroll batches exported yet.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'profiles' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Technician</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Hourly Rate</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Travel Rate</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Overtime</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Frequency</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {technicians.map((tech) => {
                const profile = technicianPayProfiles.find(p => p.technicianId === tech.id);
                return (
                  <tr key={tech.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{tech.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-bold">
                      ${profile?.hourlyRate || 25}.00/hr
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      ${profile?.travelRate || 15}.00/hr
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {profile?.overtimeRate ? `$${profile.overtimeRate}.00/hr` : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        {profile?.payFrequency || 'Weekly'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-bold">
                        Edit Profile
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    paid: 'bg-blue-50 text-blue-700 border-blue-100',
    pending: 'bg-amber-50 text-amber-700 border-amber-100',
    draft: 'bg-gray-50 text-gray-700 border-gray-100',
    exported: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    processed: 'bg-emerald-50 text-emerald-700 border-emerald-100'
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[status] || styles.pending}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default PayrollView;
