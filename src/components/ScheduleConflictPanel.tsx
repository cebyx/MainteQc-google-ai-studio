import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, AlertCircle, Info, X, Calendar, Clock, User } from 'lucide-react';
import { ScheduleConflict } from '../types';
import { format, parseISO } from 'date-fns';

interface ScheduleConflictPanelProps {
  conflicts: ScheduleConflict[];
  onClose?: () => void;
}

export const ScheduleConflictPanel: React.FC<ScheduleConflictPanelProps> = ({ conflicts, onClose }) => {
  if (conflicts.length === 0) return null;

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-50 border-red-100 text-red-800';
      case 'medium': return 'bg-orange-50 border-orange-100 text-orange-800';
      default: return 'bg-blue-50 border-blue-100 text-blue-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'medium': return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          Schedule Conflicts ({conflicts.length})
        </h3>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {conflicts.map((conflict, idx) => (
            <motion.div
              key={`${conflict.type}-${idx}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`p-3 rounded-xl border flex gap-3 ${getSeverityStyles(conflict.severity)}`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {getSeverityIcon(conflict.severity)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight">{conflict.description}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {conflict.technicianId && (
                    <div className="flex items-center gap-1 text-[10px] opacity-70">
                      <User className="w-3 h-3" />
                      <span>Tech ID: {conflict.technicianId.slice(-6)}</span>
                    </div>
                  )}
                  {conflict.affectedIds && conflict.affectedIds.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] opacity-70">
                      <Calendar className="w-3 h-3" />
                      <span>Affected: {conflict.affectedIds.map(id => `#${id.slice(-6)}`).join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
