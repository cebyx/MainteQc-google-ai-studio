
export type UserRole = 'ADMIN' | 'TECHNICIAN' | 'CLIENT';

export type JobStatus =
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'scheduled'
  | 'on_the_way'
  | 'arrived'
  | 'in_progress'
  | 'waiting_on_parts'
  | 'completed'
  | 'cancelled'
  | 'unable_to_complete';

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

export interface ApprovalRecord {
  id: string;
  quoteId: string;
  ticketId: string;
  clientId: string;
  clientName: string;
  status: 'approved' | 'declined';
  timestamp: string;
  notes: string;
  ipAddress?: string;
  userAgent?: string;
  signatureName?: string; // Typed name as signature
}

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  clientId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  method: 'credit_card' | 'bank_transfer' | 'check' | 'cash' | 'other';
  transactionId?: string;
  timestamp: string;
  notes: string;
  recordedBy: string; // User ID who recorded it
}

export interface AuthorizationRecord {
  id: string;
  ticketId: string;
  clientId: string;
  type: 'work_start' | 'completion_signoff';
  timestamp: string;
  signatureName: string;
  notes: string;
}
