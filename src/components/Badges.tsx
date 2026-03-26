import React from 'react';
import { JobStatus } from '../types';
import { STATUS_LABELS, STATUS_COLORS } from '../constants';
import { cn } from '../lib/utils';

export const StatusBadge: React.FC<{ status: JobStatus; className?: string }> = ({ status, className }) => {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
      STATUS_COLORS[status],
      className
    )}>
      {STATUS_LABELS[status]}
    </span>
  );
};

export const UrgencyBadge: React.FC<{ urgency: string }> = ({ urgency }) => {
  const colors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    emergency: 'bg-red-100 text-red-700 animate-pulse',
  };

  return (
    <span className={cn(
      "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
      colors[urgency] || colors.low
    )}>
      {urgency}
    </span>
  );
};
