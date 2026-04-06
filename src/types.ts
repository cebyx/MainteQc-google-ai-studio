
export type UserRole = 'ADMIN' | 'TECHNICIAN' | 'CLIENT';

export type JobStatus =
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'proposed'
  | 'scheduled'
  | 'on_the_way'
  | 'arrived'
  | 'in_progress'
  | 'waiting_on_parts'
  | 'completed'
  | 'cancelled'
  | 'unable_to_complete'
  | 'missed'
  | 'reschedule_requested';

export type AppointmentStatus = 'proposed' | 'confirmed' | 'reschedule_requested' | 'missed' | 'completed' | 'cancelled';

export interface BrandSettings {
  companyName: string;
  logo: string;
  accentColor: string;
  phone: string;
  email: string;
  businessHours: string;
  serviceCategories: string[];
  address: string;
  tagline: string;
}

export interface Client {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  companyName?: string;
  billingAddress: string;
  notes: string;
  status: 'active' | 'inactive';
  preferredContactMethod: 'email' | 'phone' | 'text';
  accountId?: string; // Link to ClientAccount
}

export interface Property {
  id: string;
  clientId: string;
  clientName: string;
  nickname: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  propertyType: 'residential' | 'commercial';
  accessInstructions: string;
  propertyNotes: string;
  petsOrOnsiteNotes: string;
  parkingNotes: string;
  gateOrEntryNotes: string;
}

export interface Technician {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  specialties: string[];
  status: 'available' | 'busy' | 'offline';
  notes: string;
  avatar?: string;
  rating?: number;
  completedJobs?: number;
  role?: UserRole;
}

export interface TechnicianAvailabilityRule {
  id: string;
  technicianId: string;
  dayOfWeek: number; // 0-6
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  enabled: boolean;
}

export interface BlockedSlot {
  id: string;
  technicianId: string;
  title: string;
  description: string;
  startTime: string; // ISO
  endTime: string; // ISO
  type: 'pto' | 'lunch' | 'break' | 'personal' | 'other';
}

export interface AppointmentRecord {
  id: string;
  ticketId: string;
  technicianId: string;
  clientId: string;
  startTime: string; // ISO
  endTime: string; // ISO
  status: AppointmentStatus;
  proposedBy: UserRole;
  confirmedAt?: string;
  rescheduleReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleConflict {
  id: string;
  type: 'overlap' | 'outside_availability' | 'overload' | 'travel_buffer_violation';
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedIds: string[]; // Ticket or Appointment IDs
  technicianId: string;
  date: string;
}

export interface DispatchSuggestion {
  technicianId: string;
  score: number;
  reasons: {
    type: 'specialty_match' | 'proximity' | 'availability' | 'load' | 'rating';
    text: string;
    positive: boolean;
  }[];
  suggestedSlot?: {
    startTime: string;
    endTime: string;
  };
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  status: JobStatus;
  clientId: string;
  clientName: string;
  propertyId: string;
  propertyNickname: string;
  serviceAddress: string;
  preferredDate: string;
  preferredTime: string;
  scheduledDate?: string;
  scheduledTime?: string;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  contactPreference: string;
  adminNotes: string;
  technicianNotes: string;
  completionNotes: string;
  quoteStatus?: 'none' | 'draft' | 'sent' | 'accepted' | 'declined';
  invoiceStatus?: 'none' | 'draft' | 'sent' | 'unpaid' | 'paid' | 'overdue';
  authorizationId?: string; // Link to AuthorizationRecord
  jobCosting?: JobCostSnapshot;
  createdAt: string;
  createdByEmail: string;
}

export interface Quote {
  id: string;
  ticketId: string;
  clientId: string;
  propertyId: string;
  status: 'draft' | 'sent' | 'accepted' | 'declined';
  lineItems: { description: string; quantity: number; rate: number; total: number }[];
  subtotal: number;
  tax: number;
  total: number;
  notes: string;
  createdAt: string;
  sentDate?: string;
  acceptedDate?: string;
  declinedDate?: string;
  reminderSentAt?: string;
  reminderCount?: number;
  viewedAt?: string;
  exportedAt?: string;
  approvalId?: string; // Link to ApprovalRecord
  authorizationId?: string; // Link to AuthorizationRecord
}

export interface Invoice {
  id: string;
  ticketId: string;
  clientId: string;
  propertyId: string;
  status: 'draft' | 'unpaid' | 'paid' | 'overdue';
  lineItems: { description: string; quantity: number; rate: number; total: number }[];
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number;
  balanceRemaining: number;
  dueDate: string;
  createdAt: string;
  paidDate?: string;
  paymentMethod?: string;
  notes: string;
  reminderSentAt?: string;
  reminderCount?: number;
  viewedAt?: string;
  exportedAt?: string;
  collectionsStatus?: 'none' | 'active' | 'resolved';
  agingBucket?: 'current' | '1-30' | '31-60' | '61-90' | '90+';
  paymentIds?: string[]; // Links to PaymentRecords
  authorizationId?: string; // Link to AuthorizationRecord
}

export interface Message {
  id: string;
  senderId: string;
  senderRole: UserRole;
  recipientId: string;
  recipientRole: UserRole;
  text: string;
  ticketId?: string;
  timestamp: string;
  read: boolean;
  isSystem?: boolean;
}

export interface ActivityEvent {
  id: string;
  ticketId: string;
  clientId: string;
  type: string;
  description: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  timestamp: string;
  metadata?: Record<string, any>;
}

export type AttachmentCategory = 
  | 'before_photo' 
  | 'after_photo' 
  | 'work_photo' 
  | 'invoice_attachment' 
  | 'quote_attachment' 
  | 'service_document' 
  | 'client_upload' 
  | 'technician_upload';

export interface Attachment {
  id: string;
  ticketId: string;
  uploadedById: string;
  uploadedByRole: UserRole;
  fileName: string;
  fileType: string;
  url: string;
  storagePath: string;
  category: AttachmentCategory;
  timestamp: string;
  visibility: 'internal' | 'client';
  isVisibleToClient: boolean; // Added for easier filtering
  viewedAt?: string;
  exportedAt?: string;
}

export interface MaterialUsed {
  id: string;
  ticketId: string;
  description: string;
  quantity: number;
  unitCost: number;
  total?: number; // Made optional for creation
  notes?: string;
  addedById: string;
  timestamp: string;
}

export interface ServiceSummary {
  id: string;
  ticketId: string;
  completedById: string;
  completedByName: string;
  completionTimestamp: string;
  timestamp: string; // Added for consistency with other records
  summary: string;
  workPerformed: string;
  followUpNeeded: boolean;
  recommendedNextSteps: string;
  clientVisibleNotes: string;
  internalNotes?: string;
  materialsUsed?: MaterialUsed[];
  isSharedWithClient: boolean; // Added for easier filtering
  viewedAt?: string;
  exportedAt?: string;
  sharedWithClientAt?: string;
}

export interface ClientAccount {
  id: string;
  name: string;
  ownerId: string; // Client ID of the owner
  createdAt: string;
  status: 'active' | 'suspended';
  settings?: Record<string, any>;
}

export interface ClientMember {
  id: string;
  accountId: string;
  clientId: string; // The user's client ID
  role: 'owner' | 'admin' | 'member' | 'viewer';
  addedAt: string;
  status: 'active' | 'invited' | 'deactivated';
}

export interface MaintenancePlan {
  id: string;
  clientId: string;
  propertyId: string;
  title: string;
  description: string;
  category: string;
  frequency: 'monthly' | 'quarterly' | 'semi-annual' | 'annual' | 'custom';
  intervalMonths?: number;
  status: 'active' | 'paused' | 'cancelled';
  nextDueDate: string;
  lastGeneratedDate?: string;
  assignedTechnicianId?: string;
  preferredTimeWindow?: string;
  pricePerVisit?: number;
  notes: string;
  createdAt: string;
}

export interface RecurringGenerationLog {
  id: string;
  planId: string;
  ticketId: string;
  generatedAt: string;
  status: 'success' | 'failed';
  error?: string;
}

export interface ClientInvitation {
  id: string;
  accountId: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  invitedBy: string; // User ID
  invitedAt: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  acceptedAt?: string;
  acceptedByClientId?: string; // The client ID that accepted it
  token: string;
}

export interface ReminderEvent {
  id: string;
  targetId: string; // quoteId or invoiceId
  invoiceId: string; // Added for easier lookup
  targetType: 'quote' | 'invoice';
  clientId: string;
  sentAt: string;
  timestamp: string; // Added for sorting and consistency
  sentBy: string; // User ID
  sentByName: string; // Added for display
  sentByRole: UserRole; // Added for display
  type: 'initial' | 'follow_up' | 'overdue' | 'collections';
  notes: string;
}

export interface ApprovalRecord {
  id: string;
  quoteId: string;
  ticketId: string;
  clientId: string;
  clientAccountId: string;
  approvedByUserId: string;
  approvedByName: string;
  status: 'approved' | 'declined';
  timestamp: string;
  notes: string;
  ipAddress?: string;
  userAgent?: string;
  signatureName?: string; // Typed name as signature
  authorizationType?: 'quote_approval' | 'work_order_authorization';
}

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  ticketId: string;
  clientId: string;
  clientAccountId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  method: 'credit_card' | 'bank_transfer' | 'check' | 'cash' | 'other' | 'online';
  transactionId?: string;
  reference?: string; // Added for reference/check number
  timestamp: string;
  notes: string;
  recordedBy: string; // User ID who recorded it
  recordedByName: string;
  recordedByRole: UserRole;
}

export interface AuthorizationRecord {
  id: string;
  ticketId: string;
  clientId: string;
  clientAccountId: string;
  type: 'work_start' | 'completion_signoff' | 'quote_approval';
  timestamp: string;
  signatureName: string;
  approvedByUserId: string;
  approvedByName: string;
  notes: string;
  status: 'authorized' | 'revoked';
}

export interface WorkSession {
  id: string;
  ticketId: string;
  technicianId: string;
  startTime: string;
  endTime?: string;
  sessionType: 'travel' | 'onsite' | 'pause';
  notes: string;
  durationMinutes?: number;
  status: 'active' | 'completed';
  location?: { latitude: number; longitude: number };
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  basePrice: number;
  description: string;
  status: 'active' | 'inactive';
}

export interface TechnicianStock {
  id: string;
  technicianId: string;
  itemId: string;
  quantity: number;
  minThreshold: number;
  lastRestockedAt: string;
}

export interface PartsRequest {
  id: string;
  ticketId: string;
  technicianId: string;
  technicianName: string;
  items: { itemId: string; name: string; quantity: number }[];
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  reason: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'ordered' | 'received' | 'fulfilled' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  adminNotes?: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  technicianId?: string;
  technicianName?: string;
  type: 'adjustment' | 'transfer' | 'issue' | 'request_reserved' | 'request_fulfilled' | 'restock';
  quantityDelta: number;
  reason: string;
  ticketId?: string;
  partsRequestId?: string;
  createdByUserId: string;
  createdByName: string;
  createdByRole: string;
  timestamp: string;
}

export interface ChecklistItemTemplate {
  id: string;
  label: string;
  required: boolean;
  order: number;
}

export interface ChecklistTemplate {
  id: string;
  category: string; // matches ticket category
  title: string;
  items: ChecklistItemTemplate[];
}

export interface TicketChecklistItem {
  id: string;
  label: string;
  description?: string;
  required: boolean;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
  note?: string;
}

export interface TicketChecklist {
  id: string;
  ticketId: string;
  templateId: string;
  title: string;
  items: TicketChecklistItem[];
  completedAt?: string;
  status: 'in_progress' | 'completed';
}

export interface PendingSyncAction {
  id: string;
  type: 'update_ticket' | 'add_note' | 'checklist_item' | 'part_used' | 'closeout';
  payload: any;
  timestamp: string;
  status: 'pending' | 'failed';
  error?: string;
}

export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  category: string; // e.g. 'Parts', 'Fuel', 'Subcontractor'
  status: 'active' | 'inactive';
  notes: string;
  createdAt: string;
}

export interface VendorBill {
  id: string;
  vendorId: string;
  vendorName: string;
  billNumber: string;
  status: 'draft' | 'received' | 'approved' | 'partially_paid' | 'paid' | 'void';
  lineItems: { description: string; quantity: number; rate: number; total: number; category: string }[];
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number;
  balanceRemaining: number;
  dueDate: string;
  billDate: string;
  createdAt: string;
  notes: string;
  purchaseOrderId?: string; // Link to PartsRequest or similar
  ticketId?: string; // If bill is job-specific
}

export interface VendorPayment {
  id: string;
  billId: string;
  vendorId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'check' | 'ach' | 'credit_card' | 'cash' | 'other';
  reference: string;
  notes: string;
  recordedBy: string;
  recordedByName: string;
  timestamp: string;
}

export interface ExpenseRecord {
  id: string;
  category: 'fuel' | 'vehicle' | 'tools' | 'office' | 'software' | 'payroll_adj' | 'subcontractor' | 'misc';
  amount: number;
  tax: number;
  total: number;
  date: string;
  description: string;
  vendorId?: string;
  ticketId?: string;
  propertyId?: string;
  technicianId?: string;
  notes: string;
  paymentSource: string;
  isRecurring: boolean;
  receiptUrl?: string;
  status: 'pending' | 'approved' | 'reimbursed' | 'void';
  createdAt: string;
}

export interface TechnicianPayProfile {
  id: string;
  technicianId: string;
  hourlyRate: number;
  travelRate: number;
  overtimeRate?: number;
  payPeriod: 'weekly' | 'bi-weekly' | 'monthly';
  payFrequency: 'weekly' | 'bi-weekly' | 'monthly';
  taxId?: string;
  status: 'active' | 'inactive';
}

export interface TimesheetApproval {
  id: string;
  technicianId: string;
  technicianName: string;
  startDate: string;
  endDate: string;
  totalRegularHours: number;
  totalTravelHours: number;
  totalOvertimeHours: number;
  totalPay: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  approvedBy?: string;
  approvedAt?: string;
  notes: string;
  workSessionIds: string[];
}

export interface PayrollExportBatch {
  id: string;
  batchName: string;
  periodStart: string;
  periodEnd: string;
  totalAmount: number;
  technicianCount: number;
  employeeCount: number;
  status: 'draft' | 'exported' | 'paid';
  createdAt: string;
  exportedAt?: string;
  notes: string;
}

export interface TaxProfile {
  id: string;
  name: string;
  rate: number; // percentage e.g. 8.5
  description: string;
  isDefault: boolean;
  status: 'active' | 'inactive';
}

export interface FinancialActivity {
  id: string;
  type: 'invoice_issued' | 'payment_received' | 'bill_received' | 'bill_paid' | 'expense_recorded' | 'stock_purchase' | 'timesheet_approved' | 'payroll_processed' | 'adjustment';
  amount: number;
  description: string;
  referenceId: string; // ID of the related invoice, bill, etc.
  referenceType: 'invoice' | 'bill' | 'payment' | 'expense' | 'timesheet' | 'payroll';
  timestamp: string;
  actorId: string;
  actorName: string;
}

export interface JobCostSnapshot {
  id: string;
  ticketId: string;
  revenue: number;
  laborCost: number;
  materialCost: number;
  expenseCost: number;
  totalCost: number;
  grossMargin: number;
  profit: number;
  marginPercentage: number;
  margin: number;
  lastUpdated: string;
}
