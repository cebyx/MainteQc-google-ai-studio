import { JobStatus } from './types';

export const STATUS_LABELS: Record<JobStatus, string> = {
  pending_review: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
  scheduled: 'Scheduled',
  on_the_way: 'On the Way',
  arrived: 'Arrived',
  in_progress: 'In Progress',
  waiting_on_parts: 'Waiting on Parts',
  completed: 'Completed',
  cancelled: 'Cancelled',
  unable_to_complete: 'Unable to Complete',
};

export const STATUS_COLORS: Record<JobStatus, string> = {
  pending_review: 'bg-amber-100 text-amber-800 border-amber-200',
  approved: 'bg-blue-100 text-blue-800 border-blue-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  scheduled: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  on_the_way: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  arrived: 'bg-teal-100 text-teal-800 border-teal-200',
  in_progress: 'bg-blue-500 text-white border-blue-600',
  waiting_on_parts: 'bg-orange-100 text-orange-800 border-orange-200',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
  unable_to_complete: 'bg-rose-100 text-rose-800 border-rose-200',
};

export const SERVICE_CATEGORIES = [
  'Plumbing',
  'Electrical',
  'HVAC',
  'Handyman',
  'Appliance Repair',
  'Cleaning',
  'Landscaping',
  'Pest Control',
  'Other',
];

export const URGENCY_LEVELS = [
  { value: 'low', label: 'Low', color: 'text-gray-600' },
  { value: 'medium', label: 'Medium', color: 'text-blue-600' },
  { value: 'high', label: 'High', color: 'text-orange-600' },
  { value: 'emergency', label: 'Emergency', color: 'text-red-600 font-bold' },
];
