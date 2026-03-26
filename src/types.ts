
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
  sentDate?: string;
  acceptedDate?: string;
  declinedDate?: string;
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
  paidDate?: string;
  paymentMethod?: string;
  notes: string;
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
}
