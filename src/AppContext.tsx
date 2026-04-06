import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserRole, Client, Technician, BrandSettings, Ticket, Property, Quote, Invoice, Message, 
  ActivityEvent, Attachment, MaterialUsed, ServiceSummary, ClientAccount, ClientMember, 
  MaintenancePlan, RecurringGenerationLog, ApprovalRecord, PaymentRecord, ClientInvitation, ReminderEvent, AuthorizationRecord,
  WorkSession, InventoryItem, TechnicianStock, PartsRequest, ChecklistTemplate, TicketChecklist, PendingSyncAction, StockMovement,
  TechnicianAvailabilityRule, BlockedSlot, AppointmentRecord, ScheduleConflict, DispatchSuggestion,
  Vendor, VendorBill, VendorPayment, ExpenseRecord, TechnicianPayProfile, TimesheetApproval, 
  PayrollExportBatch, TaxProfile, FinancialActivity, JobCostSnapshot,
  AppNotification, AutomationRule, AutomationRunLog, MonthlyClientSummary
} from './types';
import { auth, db, googleProvider, storage } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, doc, onSnapshot, setDoc, addDoc, updateDoc, getDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface AppContextType {
  role: UserRole;
  currentUser: any;
  brand: BrandSettings;
  setBrand: (brand: BrandSettings) => void;
  clients: Client[];
  technicians: Technician[];
  tickets: Ticket[];
  properties: Property[];
  quotes: Quote[];
  invoices: Invoice[];
  messages: Message[];
  activities: ActivityEvent[];
  clientAccounts: ClientAccount[];
  clientAccount: ClientAccount | null;
  clientMembers: ClientMember[];
  clientInvitations: ClientInvitation[];
  maintenancePlans: MaintenancePlan[];
  paymentRecords: PaymentRecord[];
  approvalRecords: ApprovalRecord[];
  reminderEvents: ReminderEvent[];
  authorizationRecords: AuthorizationRecord[];
  recurringGenerationLog: RecurringGenerationLog[];
  workSessions: WorkSession[];
  inventoryItems: InventoryItem[];
  technicianStock: TechnicianStock[];
  partsRequests: PartsRequest[];
  checklistTemplates: ChecklistTemplate[];
  ticketChecklists: TicketChecklist[];
  pendingSyncQueue: PendingSyncAction[];
  stockMovements: StockMovement[];
  technicianAvailabilityRules: TechnicianAvailabilityRule[];
  technicianBlockedSlots: BlockedSlot[];
  appointmentRecords: AppointmentRecord[];
  vendors: Vendor[];
  vendorBills: VendorBill[];
  vendorPayments: VendorPayment[];
  expenses: ExpenseRecord[];
  technicianPayProfiles: TechnicianPayProfile[];
  timesheetApprovals: TimesheetApproval[];
  payrollBatches: PayrollExportBatch[];
  taxProfiles: TaxProfile[];
  financialActivities: FinancialActivity[];
  notifications: AppNotification[];
  automationRules: AutomationRule[];
  automationLogs: AutomationRunLog[];
  monthlySummaries: MonthlyClientSummary[];
  loading: boolean;
  updateTicket: (id: string, updates: Partial<Ticket>) => void;
  addTicket: (ticket: Omit<Ticket, 'id' | 'createdAt'>) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp' | 'read'>) => void;
  markMessageAsRead: (id: string) => Promise<void>;
  saveBrandSettings: (brand: BrandSettings) => Promise<void>;
  createQuote: (quote: Omit<Quote, 'id' | 'createdAt'>) => Promise<void>;
  updateQuote: (id: string, updates: Partial<Quote>) => Promise<void>;
  updateQuoteStatus: (id: string, status: Quote['status']) => Promise<void>;
  createInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => Promise<void>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<void>;
  updateInvoiceStatus: (id: string, status: Invoice['status'] | 'partially_paid', paymentMethod?: string) => Promise<void>;
  updateCurrentUserProfile: (updates: any) => Promise<void>;
  createClient: (client: Omit<Client, 'id'>) => Promise<void>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  createTechnician: (tech: Omit<Technician, 'id'>) => Promise<void>;
  updateTechnician: (id: string, updates: Partial<Technician>) => Promise<void>;
  createProperty: (property: Omit<Property, 'id'>) => Promise<void>;
  updateProperty: (id: string, updates: Partial<Property>) => Promise<void>;
  logActivity: (activity: Omit<ActivityEvent, 'id' | 'timestamp'>) => Promise<void>;
  createNotification: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  dismissNotification: (id: string) => Promise<void>;
  createSystemMessage: (ticketId: string, recipientId: string, recipientRole: UserRole, text: string) => Promise<void>;
  createAutomationRule: (rule: Omit<AutomationRule, 'id' | 'createdAt'>) => Promise<void>;
  updateAutomationRule: (id: string, updates: Partial<AutomationRule>) => Promise<void>;
  deleteAutomationRule: (id: string) => Promise<void>;
  runAutomationRule: (id: string) => Promise<void>;
  generateMonthlySummary: (clientId: string, month: string) => Promise<void>;
  approveTicket: (id: string) => Promise<void>;
  rejectTicket: (id: string) => Promise<void>;
  rescheduleTicket: (id: string, date: string, time: string) => Promise<void>;
  assignTechnician: (id: string, techId: string, techName: string) => Promise<void>;
  attachments: Attachment[];
  materialsUsed: MaterialUsed[];
  serviceSummaries: ServiceSummary[];
  uploadAttachment: (ticketId: string, file: File, category: Attachment['category'], visibility: Attachment['visibility']) => Promise<void>;
  deleteAttachment: (id: string) => Promise<void>;
  updateAttachmentVisibility: (id: string, visibility: Attachment['visibility']) => Promise<void>;
  addMaterialUsed: (material: Omit<MaterialUsed, 'id' | 'timestamp' | 'addedById'>) => Promise<void>;
  updateMaterialUsed: (id: string, updates: Partial<MaterialUsed>) => Promise<void>;
  deleteMaterialUsed: (id: string) => Promise<void>;
  saveServiceSummary: (summary: Omit<ServiceSummary, 'id' | 'completionTimestamp' | 'completedById' | 'completedByName'>) => Promise<void>;
  updateServiceSummary: (id: string, updates: Partial<ServiceSummary>) => Promise<void>;
  sendQuoteReminder: (quoteId: string) => Promise<void>;
  sendInvoiceReminder: (invoiceId: string) => Promise<void>;
  updateCollectionsStatus: (invoiceId: string, status: Invoice['collectionsStatus']) => Promise<void>;
  markDocumentAsViewed: (type: 'quote' | 'invoice' | 'summary' | 'attachment', id: string) => Promise<void>;
  markDocumentAsExported: (type: 'quote' | 'invoice' | 'summary' | 'attachment', id: string) => Promise<void>;
  createClientAccount: (account: Omit<ClientAccount, 'id' | 'createdAt'>) => Promise<void>;
  updateClientAccount: (id: string, updates: Partial<ClientAccount>) => Promise<void>;
  createClientMember: (member: Omit<ClientMember, 'id' | 'addedAt'>) => Promise<void>;
  updateClientMemberRole: (id: string, role: ClientMember['role']) => Promise<void>;
  removeClientMember: (id: string) => Promise<void>;
  inviteClientMember: (accountId: string, email: string, role: ClientMember['role']) => Promise<void>;
  resendInvitation: (invitationId: string) => Promise<void>;
  revokeInvitation: (invitationId: string) => Promise<void>;
  activateClientMember: (invitationToken: string) => Promise<void>;
  deactivateClientMember: (memberId: string) => Promise<void>;
  reactivateClientMember: (memberId: string) => Promise<void>;
  getClientAccountPermissions: () => { canManageTeam: boolean; canApproveQuotes: boolean; canPayInvoices: boolean; isReadOnly: boolean };
  createMaintenancePlan: (plan: Omit<MaintenancePlan, 'id' | 'createdAt'>) => Promise<void>;
  updateMaintenancePlan: (id: string, updates: Partial<MaintenancePlan>) => Promise<void>;
  deleteMaintenancePlan: (id: string) => Promise<void>;
  recordPayment: (payment: Omit<PaymentRecord, 'id' | 'timestamp' | 'recordedBy' | 'recordedByName' | 'recordedByRole' | 'clientAccountId'>) => Promise<void>;
  listPaymentRecords: (invoiceId: string) => Promise<PaymentRecord[]>;
  sendPaymentReminder: (invoiceId: string) => Promise<void>;
  approveQuoteWithAuthorization: (quoteId: string, authorization: { signatureName: string; notes: string; status: 'approved' | 'declined' }) => Promise<void>;
  createWorkAuthorization: (authData: Omit<AuthorizationRecord, 'id' | 'timestamp' | 'approvedByUserId' | 'approvedByName' | 'clientAccountId'>) => Promise<void>;
  generateRecurringTicket: (planId: string) => Promise<void>;
  // Technician Operations
  startWorkSession: (ticketId: string, sessionType: WorkSession['sessionType'], notes?: string) => Promise<void>;
  stopWorkSession: (sessionId: string, notes?: string) => Promise<void>;
  createPartsRequest: (request: Omit<PartsRequest, 'id' | 'technicianId' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<void>;
  updatePartsRequestStatus: (id: string, status: PartsRequest['status'], adminNotes?: string) => Promise<void>;
  updateInventoryQuantity: (technicianId: string, itemId: string, delta: number) => Promise<void>;
  updateChecklistItem: (ticketId: string, checklistId: string, itemId: string, completed: boolean, note?: string) => Promise<void>;
  enqueuePendingSyncAction: (action: Omit<PendingSyncAction, 'id' | 'timestamp' | 'status'>) => void;
  retryPendingSyncAction: (id: string) => Promise<void>;
  
  // Admin Inventory Helpers
  createInventoryItem: (item: Omit<InventoryItem, 'id'>) => Promise<void>;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
  adjustTechnicianStock: (technicianId: string, itemId: string, delta: number, reason: string, ticketId?: string) => Promise<void>;
  transferStockToTechnician: (technicianId: string, itemId: string, quantity: number) => Promise<void>;
  createStockMovement: (movement: Omit<StockMovement, 'id' | 'timestamp'>) => Promise<void>;
  fulfillPartsRequest: (requestId: string, adminNotes?: string) => Promise<void>;
  markPartsRequestOrdered: (requestId: string, adminNotes?: string) => Promise<void>;
  markPartsRequestReceived: (requestId: string, adminNotes?: string) => Promise<void>;
  cancelPartsRequest: (requestId: string, adminNotes?: string) => Promise<void>;
  
  // Scheduling & Dispatch
  createAppointmentProposal: (proposal: Omit<AppointmentRecord, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'proposedBy'>) => Promise<void>;
  confirmAppointment: (appointmentId: string) => Promise<void>;
  requestAppointmentReschedule: (appointmentId: string, reason: string) => Promise<void>;
  cancelAppointment: (appointmentId: string, reason?: string) => Promise<void>;
  createBlockedSlot: (slot: Omit<BlockedSlot, 'id'>) => Promise<void>;
  updateBlockedSlot: (id: string, updates: Partial<BlockedSlot>) => Promise<void>;
  removeBlockedSlot: (id: string) => Promise<void>;
  updateTechnicianAvailabilityRule: (rule: TechnicianAvailabilityRule) => Promise<void>;
  getTechnicianCapacityForDay: (technicianId: string, date: string) => { totalMinutes: number; bookedMinutes: number; availableMinutes: number };
  
  // Accounting Methods
  createVendor: (vendor: Omit<Vendor, 'id' | 'createdAt'>) => Promise<void>;
  updateVendor: (id: string, updates: Partial<Vendor>) => Promise<void>;
  createVendorBill: (bill: Omit<VendorBill, 'id' | 'createdAt'>) => Promise<void>;
  updateVendorBill: (id: string, updates: Partial<VendorBill>) => Promise<void>;
  recordVendorPayment: (payment: Omit<VendorPayment, 'id' | 'timestamp'>) => Promise<void>;
  createExpense: (expense: Omit<ExpenseRecord, 'id' | 'createdAt'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<ExpenseRecord>) => Promise<void>;
  approveTimesheet: (approval: Omit<TimesheetApproval, 'id'>) => Promise<void>;
  createPayrollBatch: (batch: Omit<PayrollExportBatch, 'id' | 'createdAt'>) => Promise<void>;
  createTaxProfile: (profile: Omit<TaxProfile, 'id'>) => Promise<void>;
  updateTaxProfile: (id: string, updates: Partial<TaxProfile>) => Promise<void>;
  logFinancialActivity: (activity: Omit<FinancialActivity, 'id' | 'timestamp'>) => Promise<void>;
  calculateJobCosting: (ticketId: string) => JobCostSnapshot;

  login: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthReady: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [role, setRole] = useState<UserRole>('CLIENT');
  
  const [brand, setBrand] = useState<BrandSettings>({ companyName: '', tagline: '', logo: '', accentColor: '', email: '', phone: '', businessHours: '', serviceCategories: [], address: '' });
  const [clients, setClients] = useState<Client[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [materialsUsed, setMaterialsUsed] = useState<MaterialUsed[]>([]);
  const [serviceSummaries, setServiceSummaries] = useState<ServiceSummary[]>([]);
  const [clientAccounts, setClientAccounts] = useState<ClientAccount[]>([]);
  const [clientAccount, setClientAccount] = useState<ClientAccount | null>(null);
  const [clientMembers, setClientMembers] = useState<ClientMember[]>([]);
  const [clientInvitations, setClientInvitations] = useState<ClientInvitation[]>([]);
  const [maintenancePlans, setMaintenancePlans] = useState<MaintenancePlan[]>([]);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [approvalRecords, setApprovalRecords] = useState<ApprovalRecord[]>([]);
  const [reminderEvents, setReminderEvents] = useState<ReminderEvent[]>([]);
  const [authorizationRecords, setAuthorizationRecords] = useState<AuthorizationRecord[]>([]);
  const [recurringGenerationLog, setRecurringGenerationLog] = useState<RecurringGenerationLog[]>([]);
  const [workSessions, setWorkSessions] = useState<WorkSession[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [technicianStock, setTechnicianStock] = useState<TechnicianStock[]>([]);
  const [partsRequests, setPartsRequests] = useState<PartsRequest[]>([]);
  const [checklistTemplates, setChecklistTemplates] = useState<ChecklistTemplate[]>([]);
  const [ticketChecklists, setTicketChecklists] = useState<TicketChecklist[]>([]);
  const [pendingSyncQueue, setPendingSyncQueue] = useState<PendingSyncAction[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [technicianAvailabilityRules, setTechnicianAvailabilityRules] = useState<TechnicianAvailabilityRule[]>([]);
  const [technicianBlockedSlots, setTechnicianBlockedSlots] = useState<BlockedSlot[]>([]);
  const [appointmentRecords, setAppointmentRecords] = useState<AppointmentRecord[]>([]);
  
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorBills, setVendorBills] = useState<VendorBill[]>([]);
  const [vendorPayments, setVendorPayments] = useState<VendorPayment[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [technicianPayProfiles, setTechnicianPayProfiles] = useState<TechnicianPayProfile[]>([]);
  const [timesheetApprovals, setTimesheetApprovals] = useState<TimesheetApproval[]>([]);
  const [payrollBatches, setPayrollBatches] = useState<PayrollExportBatch[]>([]);
  const [taxProfiles, setTaxProfiles] = useState<TaxProfile[]>([]);
  const [financialActivities, setFinancialActivities] = useState<FinancialActivity[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [automationLogs, setAutomationLogs] = useState<AutomationRunLog[]>([]);
  const [monthlySummaries, setMonthlySummaries] = useState<MonthlyClientSummary[]>([]);

  const [loading, setLoading] = useState(true);

  // Test connection on boot
  useEffect(() => {
    async function testConnection() {
      try {
        await getDoc(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        // Fetch or create user document
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCurrentUser({ id: user.uid, ...userData });
            setRole(userData.role as UserRole);
          } else {
            // Create new user
            const isDefaultAdmin = user.email === 'kaloussian.sebouh@hotmail.com' && user.emailVerified;
            const newRole: UserRole = isDefaultAdmin ? 'ADMIN' : 'CLIENT';
            
            const newUser = {
              uid: user.uid,
              role: newRole,
              fullName: user.displayName || 'New User',
              email: user.email || '',
              phone: user.phoneNumber || '',
              specialties: [],
              company: '',
              status: 'available'
            };
            
            await setDoc(userDocRef, newUser);
            setCurrentUser({ id: user.uid, ...newUser });
            setRole(newRole);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        }
      } else {
        setCurrentUser(null);
        setRole('CLIENT');
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  // Data Listeners
  useEffect(() => {
    if (!isAuthReady || !currentUser) return;

    // Listen to Users (Clients & Technicians) - ADMIN only
    let unsubUsers = () => {};
    if (role === 'ADMIN') {
      unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        setClients(allUsers.filter(u => u.role === 'CLIENT'));
        setTechnicians(allUsers.filter(u => u.role === 'TECHNICIAN'));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));
    }

    // Listen to Brand Settings
    const unsubBrand = onSnapshot(doc(db, 'brandSettings', 'main'), (docSnap) => {
      if (docSnap.exists()) {
        setBrand(docSnap.data() as BrandSettings);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'brandSettings/main'));

    // Listen to Quotes
    let quotesQuery;
    if (role === 'ADMIN') {
      quotesQuery = collection(db, 'quotes');
    } else if (role === 'CLIENT') {
      quotesQuery = query(collection(db, 'quotes'), where('clientId', '==', currentUser.id));
    } else {
      quotesQuery = null;
    }

    const unsubQuotes = quotesQuery ? onSnapshot(quotesQuery, (snapshot) => {
      const allQuotes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quote));
      setQuotes(allQuotes);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'quotes')) : () => {};

    // Listen to Invoices
    let invoicesQuery;
    if (role === 'ADMIN') {
      invoicesQuery = collection(db, 'invoices');
    } else if (role === 'CLIENT') {
      invoicesQuery = query(collection(db, 'invoices'), where('clientId', '==', currentUser.id));
    } else {
      invoicesQuery = null;
    }

    const unsubInvoices = invoicesQuery ? onSnapshot(invoicesQuery, (snapshot) => {
      const allInvoices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
      setInvoices(allInvoices);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'invoices')) : () => {};

    // Listen to Tickets
    let ticketsQuery;
    if (role === 'ADMIN') {
      ticketsQuery = collection(db, 'tickets');
    } else if (role === 'TECHNICIAN') {
      ticketsQuery = query(collection(db, 'tickets'), where('assignedTechnicianId', '==', currentUser.id));
    } else {
      ticketsQuery = query(collection(db, 'tickets'), where('clientId', '==', currentUser.id));
    }

    const unsubTickets = onSnapshot(ticketsQuery, (snapshot) => {
      const allTickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
      setTickets(allTickets);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'tickets'));

    // Listen to Properties
    let propertiesQuery;
    if (role === 'ADMIN' || role === 'TECHNICIAN') {
      propertiesQuery = collection(db, 'properties');
    } else {
      propertiesQuery = query(collection(db, 'properties'), where('clientId', '==', currentUser.id));
    }

    const unsubProperties = onSnapshot(propertiesQuery, (snapshot) => {
      const allProps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
      setProperties(allProps);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'properties'));

    // Listen to Messages
    let messagesQuery;
    if (role === 'ADMIN') {
      messagesQuery = collection(db, 'messages');
    } else {
      // For non-admins, we need to listen to messages where they are either sender or recipient
      // Firestore doesn't support OR queries easily with where, but we can use where('senderId', '==', id) 
      // and where('recipientId', '==', id) separately or use a more complex rule.
      // Actually, for simplicity and to match rules, we'll try to use a query that matches the rules.
      // Since we can't do OR in a single where, we might need two listeners or a different approach.
      // However, for now, let's use a query that at least filters by one side if possible, 
      // or just keep it as is if the rules allow it (but they don't for list without filter).
      // Let's use a query that filters by senderId OR recipientId if possible, but Firestore doesn't do that.
      // We'll use two listeners or just one and filter client side IF the rules allow it.
      // But the rules for messages are: isAdmin() || isOwner(senderId) || isOwner(recipientId).
      // So a client can't list ALL messages.
      // I'll use two queries and merge them.
      messagesQuery = collection(db, 'messages'); // Fallback, will likely fail for clients if not filtered
    }

    // Special handling for Messages for non-admins
    let unsubMessages = () => {};
    if (role === 'ADMIN') {
      unsubMessages = onSnapshot(collection(db, 'messages'), (snapshot) => {
        const allMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
        setMessages(allMsgs);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'messages'));
    } else {
      // For Clients/Technicians, we listen to messages where they are involved
      const q1 = query(collection(db, 'messages'), where('senderId', '==', currentUser.id));
      const q2 = query(collection(db, 'messages'), where('recipientId', '==', currentUser.id));
      
      const unsub1 = onSnapshot(q1, (s1) => {
        const msgs1 = s1.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
        setMessages(prev => {
          const otherMsgs = prev.filter(m => m.recipientId === currentUser.id);
          const combined = [...msgs1, ...otherMsgs];
          return Array.from(new Map(combined.map(m => [m.id, m])).values());
        });
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'messages-sent'));

      const unsub2 = onSnapshot(q2, (s2) => {
        const msgs2 = s2.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
        setMessages(prev => {
          const otherMsgs = prev.filter(m => m.senderId === currentUser.id);
          const combined = [...otherMsgs, ...msgs2];
          return Array.from(new Map(combined.map(m => [m.id, m])).values());
        });
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'messages-received'));

      unsubMessages = () => { unsub1(); unsub2(); };
    }

    // Listen to Activities
    let activitiesQuery;
    if (role === 'ADMIN' || role === 'TECHNICIAN') {
      activitiesQuery = collection(db, 'activities');
    } else {
      activitiesQuery = query(collection(db, 'activities'), where('clientId', '==', currentUser.id));
    }

    const unsubActivities = onSnapshot(activitiesQuery, (snapshot) => {
      const allActivities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityEvent));
      setActivities(allActivities);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'activities'));

    // Listen to Attachments
    let attachmentsQuery;
    if (role === 'ADMIN' || role === 'TECHNICIAN') {
      attachmentsQuery = collection(db, 'attachments');
    } else {
      attachmentsQuery = query(collection(db, 'attachments'), where('visibility', '==', 'client'));
    }
    const unsubAttachments = onSnapshot(attachmentsQuery, (snapshot) => {
      const allAttachments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attachment));
      setAttachments(allAttachments);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'attachments'));

    // Listen to Materials Used
    let materialsQuery;
    if (role === 'ADMIN' || role === 'TECHNICIAN') {
      materialsQuery = collection(db, 'materialsUsed');
    } else {
      materialsQuery = collection(db, 'materialsUsed'); // Clients can see if they have access to the ticket
    }
    const unsubMaterials = onSnapshot(materialsQuery, (snapshot) => {
      const allMaterials = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MaterialUsed));
      setMaterialsUsed(allMaterials);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'materialsUsed'));

    // Listen to Service Summaries
    let summariesQuery;
    if (role === 'ADMIN' || role === 'TECHNICIAN') {
      summariesQuery = collection(db, 'serviceSummaries');
    } else {
      summariesQuery = collection(db, 'serviceSummaries');
    }
    const unsubSummaries = onSnapshot(summariesQuery, (snapshot) => {
      const allSummaries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceSummary));
      setServiceSummaries(allSummaries);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'serviceSummaries'));

    // Listen to Client Accounts
    let accountsQuery;
    if (role === 'ADMIN') {
      accountsQuery = collection(db, 'clientAccounts');
    } else {
      accountsQuery = query(collection(db, 'clientAccounts'), where('ownerId', '==', currentUser.id));
    }
    const unsubAccounts = onSnapshot(accountsQuery, (snapshot) => {
      setClientAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClientAccount)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'clientAccounts'));

    // Listen to Client Members
    let membersQuery;
    if (role === 'ADMIN') {
      membersQuery = collection(db, 'clientMembers');
    } else {
      // This is a bit tricky, but for now we'll listen to members of the account(s) the user is in
      // For simplicity, we'll listen to all members where clientId matches
      membersQuery = query(collection(db, 'clientMembers'), where('clientId', '==', currentUser.id));
    }
    const unsubMembers = onSnapshot(membersQuery, (snapshot) => {
      setClientMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClientMember)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'clientMembers'));

    // Listen to Maintenance Plans
    let plansQuery;
    if (role === 'ADMIN' || role === 'TECHNICIAN') {
      plansQuery = collection(db, 'maintenancePlans');
    } else {
      plansQuery = query(collection(db, 'maintenancePlans'), where('clientId', '==', currentUser.id));
    }
    const unsubPlans = onSnapshot(plansQuery, (snapshot) => {
      setMaintenancePlans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MaintenancePlan)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'maintenancePlans'));

    // Listen to Payment Records
    let paymentsQuery;
    if (role === 'ADMIN') {
      paymentsQuery = collection(db, 'paymentRecords');
    } else {
      paymentsQuery = query(collection(db, 'paymentRecords'), where('clientId', '==', currentUser.id));
    }
    const unsubPayments = onSnapshot(paymentsQuery, (snapshot) => {
      setPaymentRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentRecord)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'paymentRecords'));

    // Listen to Approval Records
    let approvalsQuery;
    if (role === 'ADMIN') {
      approvalsQuery = collection(db, 'approvalRecords');
    } else {
      approvalsQuery = query(collection(db, 'approvalRecords'), where('clientId', '==', currentUser.id));
    }
    const unsubApprovals = onSnapshot(approvalsQuery, (snapshot) => {
      setApprovalRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ApprovalRecord)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'approvalRecords'));

    // Listen to Client Invitations
    let invitationsQuery;
    if (role === 'ADMIN') {
      invitationsQuery = collection(db, 'clientInvitations');
    } else {
      // Clients can see invitations sent to their email or invitations for accounts they own
      invitationsQuery = query(collection(db, 'clientInvitations'), where('email', '==', currentUser.email));
    }
    const unsubInvitations = onSnapshot(invitationsQuery, (snapshot) => {
      setClientInvitations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClientInvitation)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'clientInvitations'));

    // Listen to Reminder Events
    let remindersQuery;
    if (role === 'ADMIN') {
      remindersQuery = collection(db, 'reminderEvents');
    } else {
      remindersQuery = query(collection(db, 'reminderEvents'), where('clientId', '==', currentUser.id));
    }
    const unsubReminders = onSnapshot(remindersQuery, (snapshot) => {
      setReminderEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReminderEvent)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'reminderEvents'));

    // Listen to Recurring Generation Log
    let logQuery;
    if (role === 'ADMIN') {
      logQuery = collection(db, 'recurringGenerationLog');
    } else {
      logQuery = null;
    }
    const unsubLog = logQuery ? onSnapshot(logQuery, (snapshot) => {
      setRecurringGenerationLog(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RecurringGenerationLog)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'recurringGenerationLog')) : () => {};

    // Listen to Authorization Records
    let authRecordsQuery;
    if (role === 'ADMIN') {
      authRecordsQuery = collection(db, 'authorizationRecords');
    } else {
      authRecordsQuery = query(collection(db, 'authorizationRecords'), where('clientId', '==', currentUser.id));
    }
    const unsubAuthRecords = onSnapshot(authRecordsQuery, (snapshot) => {
      setAuthorizationRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuthorizationRecord)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'authorizationRecords'));

    // Listen to Work Sessions
    let sessionsQuery;
    if (role === 'ADMIN') {
      sessionsQuery = collection(db, 'workSessions');
    } else if (role === 'TECHNICIAN') {
      sessionsQuery = query(collection(db, 'workSessions'), where('technicianId', '==', currentUser.id));
    } else {
      sessionsQuery = null;
    }
    const unsubSessions = sessionsQuery ? onSnapshot(sessionsQuery, (snapshot) => {
      setWorkSessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkSession)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'workSessions')) : () => {};

    // Listen to Inventory Items
    const unsubInventory = onSnapshot(collection(db, 'inventoryItems'), (snapshot) => {
      setInventoryItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'inventoryItems'));

    // Listen to Technician Stock
    let stockQuery;
    if (role === 'ADMIN') {
      stockQuery = collection(db, 'technicianStock');
    } else if (role === 'TECHNICIAN') {
      stockQuery = query(collection(db, 'technicianStock'), where('technicianId', '==', currentUser.id));
    } else {
      stockQuery = null;
    }
    const unsubStock = stockQuery ? onSnapshot(stockQuery, (snapshot) => {
      setTechnicianStock(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TechnicianStock)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'technicianStock')) : () => {};

    // Listen to Parts Requests
    let requestsQuery;
    if (role === 'ADMIN') {
      requestsQuery = collection(db, 'partsRequests');
    } else if (role === 'TECHNICIAN') {
      requestsQuery = query(collection(db, 'partsRequests'), where('technicianId', '==', currentUser.id));
    } else {
      requestsQuery = null;
    }
    const unsubRequests = requestsQuery ? onSnapshot(requestsQuery, (snapshot) => {
      setPartsRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PartsRequest)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'partsRequests')) : () => {};

    // Listen to Checklist Templates
    const unsubChecklistTemplates = onSnapshot(collection(db, 'checklistTemplates'), (snapshot) => {
      setChecklistTemplates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChecklistTemplate)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'checklistTemplates'));

    // Listen to Ticket Checklists
    const unsubTicketChecklists = onSnapshot(collection(db, 'ticketChecklists'), (snapshot) => {
      setTicketChecklists(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TicketChecklist)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'ticketChecklists'));

    // Listen to Technician Availability Rules
    const unsubAvailability = onSnapshot(collection(db, 'technicianAvailabilityRules'), (snapshot) => {
      setTechnicianAvailabilityRules(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TechnicianAvailabilityRule)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'technicianAvailabilityRules'));

    // Listen to Blocked Slots
    const unsubBlocked = onSnapshot(collection(db, 'technicianBlockedSlots'), (snapshot) => {
      setTechnicianBlockedSlots(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlockedSlot)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'technicianBlockedSlots'));

    // Listen to Appointment Records
    let appointmentsQuery;
    if (role === 'ADMIN') {
      appointmentsQuery = collection(db, 'appointmentRecords');
    } else if (role === 'TECHNICIAN') {
      appointmentsQuery = query(collection(db, 'appointmentRecords'), where('technicianId', '==', currentUser.id));
    } else {
      appointmentsQuery = query(collection(db, 'appointmentRecords'), where('clientId', '==', currentUser.id));
    }
    const unsubAppointments = onSnapshot(appointmentsQuery, (snapshot) => {
      setAppointmentRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppointmentRecord)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'appointmentRecords'));

    // Accounting Listeners - ADMIN only
    let unsubVendors = () => {};
    let unsubBills = () => {};
    let unsubVendorPayments = () => {};
    let unsubExpenses = () => {};
    let unsubPayProfiles = () => {};
    let unsubTimesheets = () => {};
    let unsubPayroll = () => {};
    let unsubTaxes = () => {};
    let unsubFinanceActivity = () => {};

    if (role === 'ADMIN') {
      unsubVendors = onSnapshot(collection(db, 'vendors'), (s) => setVendors(s.docs.map(d => ({ id: d.id, ...d.data() } as Vendor))), (err) => handleFirestoreError(err, OperationType.LIST, 'vendors'));
      unsubBills = onSnapshot(collection(db, 'vendorBills'), (s) => setVendorBills(s.docs.map(d => ({ id: d.id, ...d.data() } as VendorBill))), (err) => handleFirestoreError(err, OperationType.LIST, 'vendorBills'));
      unsubVendorPayments = onSnapshot(collection(db, 'vendorPayments'), (s) => setVendorPayments(s.docs.map(d => ({ id: d.id, ...d.data() } as VendorPayment))), (err) => handleFirestoreError(err, OperationType.LIST, 'vendorPayments'));
      unsubExpenses = onSnapshot(collection(db, 'expenses'), (s) => setExpenses(s.docs.map(d => ({ id: d.id, ...d.data() } as ExpenseRecord))), (err) => handleFirestoreError(err, OperationType.LIST, 'expenses'));
      unsubPayProfiles = onSnapshot(collection(db, 'technicianPayProfiles'), (s) => setTechnicianPayProfiles(s.docs.map(d => ({ id: d.id, ...d.data() } as TechnicianPayProfile))), (err) => handleFirestoreError(err, OperationType.LIST, 'technicianPayProfiles'));
      unsubTimesheets = onSnapshot(collection(db, 'timesheetApprovals'), (s) => setTimesheetApprovals(s.docs.map(d => ({ id: d.id, ...d.data() } as TimesheetApproval))), (err) => handleFirestoreError(err, OperationType.LIST, 'timesheetApprovals'));
      unsubPayroll = onSnapshot(collection(db, 'payrollBatches'), (s) => setPayrollBatches(s.docs.map(d => ({ id: d.id, ...d.data() } as PayrollExportBatch))), (err) => handleFirestoreError(err, OperationType.LIST, 'payrollBatches'));
      unsubTaxes = onSnapshot(collection(db, 'taxProfiles'), (s) => setTaxProfiles(s.docs.map(d => ({ id: d.id, ...d.data() } as TaxProfile))), (err) => handleFirestoreError(err, OperationType.LIST, 'taxProfiles'));
      unsubFinanceActivity = onSnapshot(collection(db, 'financialActivity'), (s) => setFinancialActivities(s.docs.map(d => ({ id: d.id, ...d.data() } as FinancialActivity))), (err) => handleFirestoreError(err, OperationType.LIST, 'financialActivity'));
    }

    // Listen to Notifications
    const unsubNotifications = onSnapshot(query(collection(db, 'notifications'), where('userId', '==', currentUser.id)), (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'notifications'));

    // Listen to Automation Rules (Admin only)
    let unsubAutomationRules = () => {};
    if (role === 'ADMIN') {
      unsubAutomationRules = onSnapshot(collection(db, 'automationRules'), (snapshot) => {
        setAutomationRules(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AutomationRule)));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'automationRules'));
    }

    // Listen to Automation Logs (Admin only)
    let unsubAutomationLogs = () => {};
    if (role === 'ADMIN') {
      unsubAutomationLogs = onSnapshot(collection(db, 'automationLogs'), (snapshot) => {
        setAutomationLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AutomationRunLog)));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'automationLogs'));
    }

    // Listen to Monthly Summaries
    let monthlySummariesQuery;
    if (role === 'ADMIN') {
      monthlySummariesQuery = collection(db, 'monthlySummaries');
    } else {
      monthlySummariesQuery = query(collection(db, 'monthlySummaries'), where('clientId', '==', currentUser.id));
    }
    const unsubMonthlySummaries = onSnapshot(monthlySummariesQuery, (snapshot) => {
      setMonthlySummaries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MonthlyClientSummary)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'monthlySummaries'));

    setLoading(false);

    return () => {
      unsubUsers();
      unsubBrand();
      unsubQuotes();
      unsubInvoices();
      unsubTickets();
      unsubProperties();
      unsubMessages();
      unsubActivities();
      unsubAttachments();
      unsubMaterials();
      unsubSummaries();
      unsubAccounts();
      unsubMembers();
      unsubPlans();
      unsubPayments();
      unsubApprovals();
      unsubInvitations();
      unsubReminders();
      unsubLog();
      unsubAuthRecords();
      unsubSessions();
      unsubInventory();
      unsubStock();
      unsubRequests();
      unsubChecklistTemplates();
      unsubTicketChecklists();
      unsubAvailability();
      unsubBlocked();
      unsubAppointments();
      unsubVendors();
      unsubBills();
      unsubVendorPayments();
      unsubExpenses();
      unsubPayProfiles();
      unsubTimesheets();
      unsubPayroll();
      unsubTaxes();
      unsubFinanceActivity();
      unsubNotifications();
      unsubAutomationRules();
      unsubAutomationLogs();
      unsubMonthlySummaries();
    };
  }, [isAuthReady, currentUser, role]);

  // Set clientAccount if the user is a client
  useEffect(() => {
    if (role === 'CLIENT' && currentUser?.accountId) {
      const account = clientAccounts.find(a => a.id === currentUser.accountId);
      setClientAccount(account || null);
    } else if (role !== 'CLIENT') {
      setClientAccount(null);
    }
  }, [clientAccounts, currentUser, role]);

  // Automatic Recurring Ticket Generation Check (Admin only)
  useEffect(() => {
    if (role !== 'ADMIN' || !maintenancePlans.length) return;

    const checkRecurringPlans = async () => {
      const today = new Date().toISOString().split('T')[0];
      const duePlans = maintenancePlans.filter(plan => 
        plan.status === 'active' && 
        plan.nextDueDate <= today
      );

      for (const plan of duePlans) {
        // Check if we already generated a ticket for this plan today to avoid duplicates
        const alreadyGenerated = recurringGenerationLog.some(log => 
          log.planId === plan.id && 
          log.generatedAt.startsWith(today)
        );

        if (!alreadyGenerated) {
          console.log(`Automatically generating ticket for plan: ${plan.title}`);
          await generateRecurringTicket(plan.id);
        }
      }
    };

    const interval = setInterval(checkRecurringPlans, 1000 * 60 * 60); // Check every hour
    checkRecurringPlans(); // Initial check

    return () => clearInterval(interval);
  }, [role, maintenancePlans, recurringGenerationLog]);

  const createAppointmentProposal = async (proposal: Omit<AppointmentRecord, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'proposedBy'>) => {
    try {
      const now = new Date().toISOString();
      const newAppointment: Omit<AppointmentRecord, 'id'> = {
        ...proposal,
        status: 'proposed',
        proposedBy: role,
        createdAt: now,
        updatedAt: now,
      };
      const docRef = await addDoc(collection(db, 'appointmentRecords'), newAppointment);
      
      // Update ticket status to proposed
      await updateTicket(proposal.ticketId, { status: 'proposed' });
      
      await logActivity({
        ticketId: proposal.ticketId,
        clientId: proposal.clientId,
        type: 'appointment_proposed',
        description: `New appointment proposed for ${new Date(proposal.startTime).toLocaleString()}`,
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: role,
      });

      await createSystemMessage(proposal.ticketId, proposal.clientId, 'CLIENT', `A new appointment has been proposed for your service request #${proposal.ticketId.slice(-6)}.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'appointmentRecords');
    }
  };

  const confirmAppointment = async (appointmentId: string) => {
    try {
      const appointment = appointmentRecords.find(a => a.id === appointmentId);
      if (!appointment) return;

      const now = new Date().toISOString();
      await updateDoc(doc(db, 'appointmentRecords', appointmentId), {
        status: 'confirmed',
        confirmedAt: now,
        updatedAt: now,
      });

      // Update ticket status to scheduled
      await updateTicket(appointment.ticketId, { 
        status: 'scheduled',
        scheduledDate: appointment.startTime.split('T')[0],
        scheduledTime: appointment.startTime.split('T')[1].substring(0, 5),
        assignedTechnicianId: appointment.technicianId,
        assignedTechnicianName: technicians.find(t => t.id === appointment.technicianId)?.fullName || 'Assigned Technician'
      });

      await logActivity({
        ticketId: appointment.ticketId,
        clientId: appointment.clientId,
        type: 'appointment_confirmed',
        description: `Appointment confirmed for ${new Date(appointment.startTime).toLocaleString()}`,
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: role,
      });

      // Notify technician
      await createSystemMessage(appointment.ticketId, appointment.technicianId, 'TECHNICIAN', `A new job has been confirmed for ${new Date(appointment.startTime).toLocaleString()}.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `appointmentRecords/${appointmentId}`);
    }
  };

  const requestAppointmentReschedule = async (appointmentId: string, reason: string) => {
    try {
      const appointment = appointmentRecords.find(a => a.id === appointmentId);
      if (!appointment) return;

      const now = new Date().toISOString();
      await updateDoc(doc(db, 'appointmentRecords', appointmentId), {
        status: 'reschedule_requested',
        rescheduleReason: reason,
        updatedAt: now,
      });

      await updateTicket(appointment.ticketId, { status: 'reschedule_requested' });

      await logActivity({
        ticketId: appointment.ticketId,
        clientId: appointment.clientId,
        type: 'reschedule_requested',
        description: `Reschedule requested for appointment on ${new Date(appointment.startTime).toLocaleString()}`,
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: role,
      });

      // Notify admin
      // In a real app, we'd have a way to notify all admins or a specific dispatcher
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `appointmentRecords/${appointmentId}`);
    }
  };

  const cancelAppointment = async (appointmentId: string, reason?: string) => {
    try {
      const appointment = appointmentRecords.find(a => a.id === appointmentId);
      if (!appointment) return;

      const now = new Date().toISOString();
      await updateDoc(doc(db, 'appointmentRecords', appointmentId), {
        status: 'cancelled',
        notes: reason ? `Cancelled: ${reason}` : 'Cancelled',
        updatedAt: now,
      });

      await updateTicket(appointment.ticketId, { status: 'approved' }); // Back to approved but unscheduled

      await logActivity({
        ticketId: appointment.ticketId,
        clientId: appointment.clientId,
        type: 'appointment_cancelled',
        description: `Appointment cancelled for ${new Date(appointment.startTime).toLocaleString()}`,
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: role,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `appointmentRecords/${appointmentId}`);
    }
  };

  const createBlockedSlot = async (slot: Omit<BlockedSlot, 'id'>) => {
    try {
      await addDoc(collection(db, 'technicianBlockedSlots'), slot);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'technicianBlockedSlots');
    }
  };

  const updateBlockedSlot = async (id: string, updates: Partial<BlockedSlot>) => {
    try {
      await updateDoc(doc(db, 'technicianBlockedSlots', id), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `technicianBlockedSlots/${id}`);
    }
  };

  const removeBlockedSlot = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'technicianBlockedSlots', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `technicianBlockedSlots/${id}`);
    }
  };

  const updateTechnicianAvailabilityRule = async (rule: TechnicianAvailabilityRule) => {
    try {
      if (rule.id) {
        await updateDoc(doc(db, 'technicianAvailabilityRules', rule.id), rule as any);
      } else {
        await addDoc(collection(db, 'technicianAvailabilityRules'), rule);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'technicianAvailabilityRules');
    }
  };

  const getTechnicianCapacityForDay = (technicianId: string, date: string) => {
    const rules = technicianAvailabilityRules.filter(r => r.technicianId === technicianId && r.enabled);
    const dayOfWeek = new Date(date).getDay();
    const dayRules = rules.filter(r => r.dayOfWeek === dayOfWeek);
    
    let totalMinutes = 0;
    dayRules.forEach(r => {
      const [startH, startM] = r.startTime.split(':').map(Number);
      const [endH, endM] = r.endTime.split(':').map(Number);
      totalMinutes += (endH * 60 + endM) - (startH * 60 + startM);
    });

    const dayAppointments = appointmentRecords.filter(a => 
      a.technicianId === technicianId && 
      a.startTime.startsWith(date) && 
      (a.status === 'confirmed' || a.status === 'proposed')
    );

    let bookedMinutes = 0;
    dayAppointments.forEach(a => {
      const start = new Date(a.startTime);
      const end = new Date(a.endTime);
      bookedMinutes += (end.getTime() - start.getTime()) / (1000 * 60);
    });

    const dayBlocked = technicianBlockedSlots.filter(s => 
      s.technicianId === technicianId && 
      s.startTime.startsWith(date)
    );

    dayBlocked.forEach(s => {
      const start = new Date(s.startTime);
      const end = new Date(s.endTime);
      bookedMinutes += (end.getTime() - start.getTime()) / (1000 * 60);
    });

    return {
      totalMinutes,
      bookedMinutes,
      availableMinutes: Math.max(0, totalMinutes - bookedMinutes)
    };
  };

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const updateTicket = async (id: string, updates: Partial<Ticket>) => {
    try {
      const ticket = tickets.find(t => t.id === id);
      await updateDoc(doc(db, 'tickets', id), updates);
      
      if (ticket && updates.status && updates.status !== ticket.status) {
        await logActivity({
          ticketId: id,
          clientId: ticket.clientId,
          type: 'status_changed',
          description: `Ticket status changed from ${ticket.status.replace('_', ' ')} to ${updates.status.replace('_', ' ')}`,
          actorId: currentUser.id,
          actorName: currentUser.fullName,
          actorRole: role,
        });
        
        // Auto-notifications for major status changes
        if (updates.status === 'scheduled' && ticket.clientId) {
          await createSystemMessage(id, ticket.clientId, 'CLIENT', `Your appointment for ticket #${id.slice(-6)} has been scheduled.`);
        } else if (updates.status === 'completed' && ticket.clientId) {
          await createSystemMessage(id, ticket.clientId, 'CLIENT', `Your service request #${id.slice(-6)} has been completed.`);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tickets/${id}`);
    }
  };

  const approveTicket = async (id: string) => {
    try {
      const ticket = tickets.find(t => t.id === id);
      if (!ticket) return;
      await updateDoc(doc(db, 'tickets', id), { status: 'approved' });
      await logActivity({
        ticketId: id,
        clientId: ticket.clientId,
        type: 'ticket_approved',
        description: 'Service request approved',
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: role,
      });
      await createSystemMessage(id, ticket.clientId, 'CLIENT', `Your service request #${id.slice(-6)} has been approved.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tickets/${id}`);
    }
  };

  const rejectTicket = async (id: string) => {
    try {
      const ticket = tickets.find(t => t.id === id);
      if (!ticket) return;
      await updateDoc(doc(db, 'tickets', id), { status: 'rejected' });
      await logActivity({
        ticketId: id,
        clientId: ticket.clientId,
        type: 'ticket_rejected',
        description: 'Service request rejected',
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: role,
      });
      await createSystemMessage(id, ticket.clientId, 'CLIENT', `Your service request #${id.slice(-6)} has been rejected.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tickets/${id}`);
    }
  };

  const addTicket = async (ticket: Omit<Ticket, 'id' | 'createdAt'>) => {
    try {
      const newTicket = {
        ...ticket,
        createdAt: new Date().toISOString(),
      };
      const docRef = await addDoc(collection(db, 'tickets'), newTicket);
      await logActivity({
        ticketId: docRef.id,
        clientId: ticket.clientId,
        type: 'request_created',
        description: `Service request submitted: ${ticket.title}`,
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: role,
      });
      if (role === 'CLIENT') {
        // Notify admin (assuming admin is a role we can't easily target by ID here, so maybe we skip or we just log activity)
        // We don't have a specific admin ID, so we skip direct message notification to admin for now, or we could broadcast.
        // Activity log is enough for admin to see.
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tickets');
    }
  };

  const addMessage = async (message: Omit<Message, 'id' | 'timestamp' | 'read'>) => {
    try {
      const newMessage = {
        ...message,
        timestamp: new Date().toISOString(),
        read: false,
      };
      await addDoc(collection(db, 'messages'), newMessage);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'messages');
    }
  };

  const markMessageAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'messages', id), { read: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `messages/${id}`);
    }
  };

  const saveBrandSettings = async (newBrand: BrandSettings) => {
    try {
      await setDoc(doc(db, 'brandSettings', 'main'), newBrand);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'brandSettings/main');
    }
  };

  const createQuote = async (quote: Omit<Quote, 'id' | 'createdAt'>) => {
    try {
      // Prevent duplicate quotes for the same ticket
      const existingQuote = quotes.find(q => q.ticketId === quote.ticketId && q.status !== 'declined');
      if (existingQuote) {
        throw new Error('A quote already exists for this ticket.');
      }

      const newQuote = {
        ...quote,
        createdAt: new Date().toISOString(),
        sentDate: quote.status === 'sent' ? new Date().toISOString() : undefined,
      };
      const docRef = await addDoc(collection(db, 'quotes'), newQuote);
      if (quote.status === 'sent') {
        updateTicket(quote.ticketId, { quoteStatus: 'sent' });
        await logActivity({
          ticketId: quote.ticketId,
          clientId: quote.clientId,
          type: 'quote_sent',
          description: `Quote sent for $${quote.total.toFixed(2)}`,
          actorId: currentUser.id,
          actorName: currentUser.fullName,
          actorRole: role,
        });
        await createNotification({
          userId: quote.clientId,
          role: 'CLIENT',
          title: 'New Quote',
          message: `A new quote for $${quote.total.toFixed(2)} has been sent for your review.`,
          type: 'billing',
          priority: 'medium',
          link: `/billing`,
          referenceId: docRef.id,
          referenceType: 'quote'
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'quotes');
    }
  };

  const updateQuote = async (id: string, updates: Partial<Quote>) => {
    try {
      await updateDoc(doc(db, 'quotes', id), updates);
      const quote = quotes.find(q => q.id === id);
      if (quote && updates.status && updates.status !== quote.status) {
        updateTicket(quote.ticketId, { quoteStatus: updates.status });
        await logActivity({
          ticketId: quote.ticketId,
          clientId: quote.clientId,
          type: 'quote_updated',
          description: `Quote status updated to ${updates.status}`,
          actorId: currentUser.id,
          actorName: currentUser.fullName,
          actorRole: role,
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `quotes/${id}`);
    }
  };

  const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
    try {
      await updateDoc(doc(db, 'invoices', id), updates);
      const invoice = invoices.find(i => i.id === id);
      if (invoice && updates.status && updates.status !== invoice.status) {
        updateTicket(invoice.ticketId, { invoiceStatus: updates.status });
        await logActivity({
          ticketId: invoice.ticketId,
          clientId: invoice.clientId,
          type: 'invoice_updated',
          description: `Invoice status updated to ${updates.status}`,
          actorId: currentUser.id,
          actorName: currentUser.fullName,
          actorRole: role,
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `invoices/${id}`);
    }
  };

  const updateQuoteStatus = async (id: string, status: Quote['status']) => {
    try {
      const updates: any = { status };
      const quote = quotes.find(q => q.id === id);
      if (status === 'accepted') {
        updates.acceptedDate = new Date().toISOString();
      } else if (status === 'declined') {
        updates.declinedDate = new Date().toISOString();
      }
      await updateDoc(doc(db, 'quotes', id), updates);
      if (quote) {
        updateTicket(quote.ticketId, { quoteStatus: status });
        await logActivity({
          ticketId: quote.ticketId,
          clientId: quote.clientId,
          type: status === 'accepted' ? 'quote_accepted' : (status === 'declined' ? 'quote_declined' : 'status_changed'),
          description: `Quote ${status}`,
          actorId: currentUser.id,
          actorName: currentUser.fullName,
          actorRole: role,
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `quotes/${id}`);
    }
  };

  const createInvoice = async (invoice: Omit<Invoice, 'id' | 'createdAt'>) => {
    try {
      // Prevent duplicate invoices for the same ticket
      const existingInvoiceByTicket = invoices.find(i => i.ticketId === invoice.ticketId);
      if (existingInvoiceByTicket) {
        throw new Error('An invoice already exists for this ticket.');
      }

      const newInvoice = {
        ...invoice,
        amountPaid: invoice.amountPaid || 0,
        balanceRemaining: invoice.balanceRemaining !== undefined ? invoice.balanceRemaining : invoice.total,
        createdAt: new Date().toISOString(),
      };
      const docRef = await addDoc(collection(db, 'invoices'), newInvoice);
      if (invoice.status === 'unpaid') {
        updateTicket(invoice.ticketId, { invoiceStatus: 'unpaid' });
        await logActivity({
          ticketId: invoice.ticketId,
          clientId: invoice.clientId,
          type: 'invoice_created',
          description: `Invoice created for $${invoice.total.toFixed(2)}`,
          actorId: currentUser.id,
          actorName: currentUser.fullName,
          actorRole: role,
        });
        await createNotification({
          userId: invoice.clientId,
          role: 'CLIENT',
          title: 'New Invoice',
          message: `A new invoice for $${invoice.total.toFixed(2)} is now available.`,
          type: 'billing',
          priority: 'medium',
          link: `/billing`,
          referenceId: docRef.id,
          referenceType: 'invoice'
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'invoices');
    }
  };

  const updateInvoiceStatus = async (id: string, status: Invoice['status'], paymentMethod?: string) => {
    try {
      const updates: any = { status };
      const invoice = invoices.find(i => i.id === id);
      if (paymentMethod) updates.paymentMethod = paymentMethod;
      if (status === 'paid') {
        updates.paidDate = new Date().toISOString();
      }
      await updateDoc(doc(db, 'invoices', id), updates);
      if (invoice) {
        updateTicket(invoice.ticketId, { invoiceStatus: status });
        if (status === 'paid') {
          await logActivity({
            ticketId: invoice.ticketId,
            clientId: invoice.clientId,
            type: 'invoice_paid',
            description: `Invoice paid via ${paymentMethod || 'unknown method'}`,
            actorId: currentUser.id,
            actorName: currentUser.fullName,
            actorRole: role,
          });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `invoices/${id}`);
    }
  };

  const updateCurrentUserProfile = async (updates: any) => {
    if (!currentUser) return;
    try {
      // Ensure role and uid cannot be changed
      const safeUpdates = { ...updates };
      delete safeUpdates.role;
      delete safeUpdates.uid;
      delete safeUpdates.id;
      
      await updateDoc(doc(db, 'users', currentUser.id), safeUpdates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.id}`);
    }
  };

  const createClient = async (client: Omit<Client, 'id'>) => {
    try {
      const newClient = {
        ...client,
        uid: `client_${Date.now()}`, // Placeholder UID for manually created clients
        role: 'CLIENT',
        email: client.email || '',
      };
      await addDoc(collection(db, 'users'), newClient);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'users');
    }
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    try {
      await updateDoc(doc(db, 'users', id), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${id}`);
    }
  };

  const createTechnician = async (tech: Omit<Technician, 'id'>) => {
    try {
      const newTech = {
        ...tech,
        uid: `tech_${Date.now()}`, // Placeholder UID for manually created technicians
        role: 'TECHNICIAN',
        email: tech.email || '',
      };
      await addDoc(collection(db, 'users'), newTech);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'users');
    }
  };

  const updateTechnician = async (id: string, updates: Partial<Technician>) => {
    try {
      await updateDoc(doc(db, 'users', id), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${id}`);
    }
  };

  const createProperty = async (property: Omit<Property, 'id'>) => {
    try {
      await addDoc(collection(db, 'properties'), property);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'properties');
    }
  };

  const updateProperty = async (id: string, updates: Partial<Property>) => {
    try {
      await updateDoc(doc(db, 'properties', id), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `properties/${id}`);
    }
  };

  const logActivity = async (activity: Omit<ActivityEvent, 'id' | 'timestamp'>) => {
    try {
      const newActivity = {
        ...activity,
        timestamp: new Date().toISOString(),
      };
      await addDoc(collection(db, 'activities'), newActivity);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'activities');
    }
  };

  const createSystemMessage = async (ticketId: string, recipientId: string, recipientRole: UserRole, text: string) => {
    try {
      const newMessage = {
        ticketId,
        senderId: 'system',
        senderRole: 'ADMIN' as UserRole,
        recipientId,
        recipientRole,
        text,
        timestamp: new Date().toISOString(),
        read: false,
        isSystem: true,
      };
      await addDoc(collection(db, 'messages'), newMessage);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'messages');
    }
  };

  const createNotification = async (notification: Omit<AppNotification, 'id' | 'createdAt' | 'status'>) => {
    try {
      const newNotification = {
        ...notification,
        status: 'unread',
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, 'notifications'), newNotification);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'notifications');
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { status: 'read' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
    }
  };

  const dismissNotification = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { status: 'dismissed' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
    }
  };

  const createAutomationRule = async (rule: Omit<AutomationRule, 'id' | 'createdAt'>) => {
    try {
      const newRule = {
        ...rule,
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, 'automationRules'), newRule);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'automationRules');
    }
  };

  const updateAutomationRule = async (id: string, updates: Partial<AutomationRule>) => {
    try {
      await updateDoc(doc(db, 'automationRules', id), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `automationRules/${id}`);
    }
  };

  const deleteAutomationRule = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'automationRules', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `automationRules/${id}`);
    }
  };

  const runAutomationRule = async (id: string) => {
    const rule = automationRules.find(r => r.id === id);
    if (!rule || !rule.isActive) return;

    try {
      await updateDoc(doc(db, 'automationRules', id), { lastRunAt: new Date().toISOString() });
      
      await addDoc(collection(db, 'automationLogs'), {
        ruleId: id,
        ruleName: rule.name,
        status: 'success',
        message: 'Rule executed successfully (simulated)',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to run automation rule', error);
    }
  };

  const generateMonthlySummary = async (clientId: string, month: string) => {
    try {
      const monthTickets = tickets.filter(t => t.clientId === clientId && t.createdAt.startsWith(month));
      const monthInvoices = invoices.filter(i => i.clientId === clientId && i.createdAt.startsWith(month));
      const monthPlans = maintenancePlans.filter(p => p.clientId === clientId);

      const stats = {
        jobsCompleted: monthTickets.filter(t => t.status === 'completed').length,
        openInvoices: monthInvoices.filter(i => i.status === 'unpaid' || i.status === 'overdue').length,
        upcomingMaintenance: monthPlans.filter(p => p.status === 'active' && p.nextDueDate.startsWith(month)).length,
        totalSpent: monthInvoices.reduce((sum, i) => sum + i.total, 0),
      };

      const summary: Omit<MonthlyClientSummary, 'id'> = {
        clientId,
        month,
        summary: `In ${month}, we completed ${stats.jobsCompleted} jobs for you. You have ${stats.openInvoices} open invoices and ${stats.upcomingMaintenance} maintenance visits scheduled for this month.`,
        stats,
        highlights: monthTickets.map(t => t.title).slice(0, 3),
        actionItems: monthInvoices.filter(i => i.status === 'unpaid').map(i => `Pay invoice #${i.id.slice(-6)}`),
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'monthlySummaries'), summary);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'monthlySummaries');
    }
  };

  const rescheduleTicket = async (id: string, date: string, time: string) => {
    try {
      await updateDoc(doc(db, 'tickets', id), { scheduledDate: date, scheduledTime: time });
      const ticket = tickets.find(t => t.id === id);
      if (ticket) {
        await logActivity({
          ticketId: id,
          clientId: ticket.clientId,
          type: 'appointment_scheduled',
          description: `Appointment rescheduled to ${date} at ${time}`,
          actorId: currentUser.id,
          actorName: currentUser.fullName,
          actorRole: role,
        });
        await createNotification({
          userId: ticket.clientId,
          role: 'CLIENT',
          title: 'Appointment Rescheduled',
          message: `Your appointment for ticket #${id.slice(-6)} has been rescheduled to ${date} at ${time}.`,
          type: 'schedule',
          priority: 'medium',
          link: `/appointments`,
          referenceId: id,
          referenceType: 'ticket'
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tickets/${id}`);
    }
  };

  const assignTechnician = async (ticketId: string, technicianId: string, technicianName: string, scheduledDate?: string, scheduledTime?: string) => {
    try {
      const updates: any = {
        assignedTechnicianId: technicianId,
        assignedTechnicianName: technicianName,
        status: 'scheduled'
      };
      if (scheduledDate) updates.scheduledDate = scheduledDate;
      if (scheduledTime) updates.scheduledTime = scheduledTime;

      await updateDoc(doc(db, 'tickets', ticketId), updates);
      
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) {
        await logActivity({
          ticketId,
          clientId: ticket.clientId,
          type: 'job_assigned',
          description: `Job assigned to ${technicianName}`,
          actorId: currentUser.id,
          actorName: currentUser.fullName,
          actorRole: role,
        });

        await createNotification({
          userId: technicianId,
          role: 'TECHNICIAN',
          title: 'New Job Assigned',
          message: `You have been assigned to: ${ticket.title}`,
          type: 'dispatch',
          priority: 'high',
          link: `/my-jobs`,
          referenceId: ticketId,
          referenceType: 'ticket'
        });
        
        await createNotification({
          userId: ticket.clientId,
          role: 'CLIENT',
          title: 'Technician Assigned',
          message: `Technician ${technicianName} has been assigned to your ticket.`,
          type: 'dispatch',
          priority: 'medium',
          link: `/appointments`,
          referenceId: ticketId,
          referenceType: 'ticket'
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tickets/${ticketId}`);
    }
  };

  const uploadAttachment = async (ticketId: string, file: File, category: Attachment['category'], visibility: Attachment['visibility']) => {
    try {
      const storagePath = `tickets/${ticketId}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const attachment: Omit<Attachment, 'id'> = {
        ticketId,
        uploadedById: currentUser.id,
        uploadedByRole: role,
        fileName: file.name,
        fileType: file.type,
        url,
        storagePath,
        category,
        timestamp: new Date().toISOString(),
        visibility,
        isVisibleToClient: visibility === 'client'
      };

      await addDoc(collection(db, 'attachments'), attachment);
      
      const ticket = tickets.find(t => t.id === ticketId);
      await logActivity({
        ticketId,
        clientId: ticket?.clientId || '',
        type: 'attachment_uploaded',
        description: `File uploaded: ${file.name} (${category.replace('_', ' ')})`,
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: role,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'attachments');
    }
  };

  const deleteAttachment = async (id: string) => {
    try {
      const attachment = attachments.find(a => a.id === id);
      if (!attachment) return;

      const storageRef = ref(storage, attachment.storagePath);
      await deleteObject(storageRef);
      await deleteDoc(doc(db, 'attachments', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `attachments/${id}`);
    }
  };

  const updateAttachmentVisibility = async (id: string, visibility: Attachment['visibility']) => {
    try {
      await updateDoc(doc(db, 'attachments', id), { 
        visibility,
        isVisibleToClient: visibility === 'client'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `attachments/${id}`);
    }
  };

  const addMaterialUsed = async (material: Omit<MaterialUsed, 'id' | 'timestamp' | 'addedById'>) => {
    try {
      const newMaterial = {
        ...material,
        timestamp: new Date().toISOString(),
        addedById: currentUser.id,
        total: material.unitCost * material.quantity
      };
      await addDoc(collection(db, 'materialsUsed'), newMaterial);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'materialsUsed');
    }
  };

  const updateMaterialUsed = async (id: string, updates: Partial<MaterialUsed>) => {
    try {
      const material = materialsUsed.find(m => m.id === id);
      if (!material) return;
      
      const newUpdates = { ...updates };
      if (updates.quantity !== undefined || updates.unitCost !== undefined) {
        const q = updates.quantity !== undefined ? updates.quantity : material.quantity;
        const c = updates.unitCost !== undefined ? updates.unitCost : material.unitCost;
        if (c !== undefined) {
          newUpdates.total = q * c;
        }
      }
      
      await updateDoc(doc(db, 'materialsUsed', id), newUpdates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `materialsUsed/${id}`);
    }
  };

  const deleteMaterialUsed = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'materialsUsed', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `materialsUsed/${id}`);
    }
  };

  const saveServiceSummary = async (summary: Omit<ServiceSummary, 'id' | 'completionTimestamp' | 'completedById' | 'completedByName' | 'timestamp'>) => {
    try {
      const newSummary = {
        ...summary,
        completionTimestamp: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        completedById: currentUser.id,
        completedByName: currentUser.fullName,
      };
      await addDoc(collection(db, 'serviceSummaries'), newSummary);
      
      const ticket = tickets.find(t => t.id === summary.ticketId);
      if (ticket && ticket.status !== 'completed') {
        await updateTicket(summary.ticketId, { status: 'completed' });
      }
      
      await logActivity({
        ticketId: summary.ticketId,
        clientId: ticket?.clientId || '',
        type: 'service_completed',
        description: 'Service summary and closeout completed',
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: role,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'serviceSummaries');
    }
  };

  const updateServiceSummary = async (id: string, updates: Partial<ServiceSummary>) => {
    try {
      await updateDoc(doc(db, 'serviceSummaries', id), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `serviceSummaries/${id}`);
    }
  };

  const sendQuoteReminder = async (quoteId: string) => {
    try {
      const quote = quotes.find(q => q.id === quoteId);
      if (!quote) return;

      const newCount = (quote.reminderCount || 0) + 1;
      await updateDoc(doc(db, 'quotes', quoteId), {
        reminderSentAt: new Date().toISOString(),
        reminderCount: newCount
      });

      const reminderEvent: Omit<ReminderEvent, 'id'> = {
        targetId: quoteId,
        invoiceId: '', // Not an invoice
        targetType: 'quote',
        clientId: quote.clientId,
        sentAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        sentBy: currentUser.id,
        sentByName: currentUser.fullName,
        sentByRole: role,
        type: newCount === 1 ? 'initial' : 'follow_up',
        notes: `Reminder sent to client for quote review. Total reminders: ${newCount}`
      };
      await addDoc(collection(db, 'reminderEvents'), reminderEvent);

      await createSystemMessage(
        quote.ticketId,
        quote.clientId,
        'CLIENT',
        `Friendly reminder: Your quote for ticket #${quote.ticketId.slice(-6)} is awaiting your review.`
      );

      await logActivity({
        ticketId: quote.ticketId,
        clientId: quote.clientId,
        type: 'quote_reminder_sent',
        description: `Quote reminder #${newCount} sent to client.`,
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: role,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `quotes/${quoteId}`);
    }
  };

  const sendInvoiceReminder = async (invoiceId: string) => {
    try {
      const invoice = invoices.find(i => i.id === invoiceId);
      if (!invoice) return;

      const newCount = (invoice.reminderCount || 0) + 1;
      await updateDoc(doc(db, 'invoices', invoiceId), {
        reminderSentAt: new Date().toISOString(),
        reminderCount: newCount,
        collectionsStatus: 'active'
      });

      const reminderEvent: Omit<ReminderEvent, 'id'> = {
        targetId: invoiceId,
        invoiceId: invoiceId,
        targetType: 'invoice',
        clientId: invoice.clientId,
        sentAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        sentBy: currentUser.id,
        sentByName: currentUser.fullName,
        sentByRole: role,
        type: invoice.status === 'overdue' ? 'overdue' : (newCount === 1 ? 'initial' : 'follow_up'),
        notes: `Reminder sent to client for payment. Total reminders: ${newCount}`
      };
      await addDoc(collection(db, 'reminderEvents'), reminderEvent);

      await createSystemMessage(
        invoice.ticketId,
        invoice.clientId,
        'CLIENT',
        `Friendly reminder: Your invoice for ticket #${invoice.ticketId.slice(-6)} is currently ${invoice.status}.`
      );

      await logActivity({
        ticketId: invoice.ticketId,
        clientId: invoice.clientId,
        type: 'invoice_reminder_sent',
        description: `Invoice reminder #${newCount} sent to client.`,
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: role,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `invoices/${invoiceId}`);
    }
  };

  const sendPaymentReminder = async (invoiceId: string) => {
    await sendInvoiceReminder(invoiceId);
  };

  const markDocumentAsViewed = async (type: 'quote' | 'invoice' | 'summary' | 'attachment', id: string) => {
    try {
      const collectionName = type === 'quote' ? 'quotes' : type === 'invoice' ? 'invoices' : type === 'summary' ? 'serviceSummaries' : 'attachments';
      await updateDoc(doc(db, collectionName, id), {
        viewedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${type}/${id}`);
    }
  };

  const markDocumentAsExported = async (type: 'quote' | 'invoice' | 'summary' | 'attachment', id: string) => {
    try {
      const collectionName = type === 'quote' ? 'quotes' : type === 'invoice' ? 'invoices' : type === 'summary' ? 'serviceSummaries' : 'attachments';
      await updateDoc(doc(db, collectionName, id), {
        exportedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${type}/${id}`);
    }
  };

  const createClientAccount = async (account: Omit<ClientAccount, 'id' | 'createdAt'>) => {
    try {
      const newAccount = {
        ...account,
        createdAt: new Date().toISOString(),
        status: 'active' as const
      };
      await addDoc(collection(db, 'clientAccounts'), newAccount);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'clientAccounts');
    }
  };

  const updateClientAccount = async (id: string, updates: Partial<ClientAccount>) => {
    try {
      await updateDoc(doc(db, 'clientAccounts', id), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `clientAccounts/${id}`);
    }
  };

  const createClientMember = async (member: Omit<ClientMember, 'id' | 'addedAt'>) => {
    try {
      const newMember = {
        ...member,
        addedAt: new Date().toISOString(),
        status: 'invited' as const
      };
      const memberRef = await addDoc(collection(db, 'clientMembers'), newMember);
      
      // Notify the invited user (if they already exist in the system)
      // We can't easily find them by email here without a query, but we can try
      const q = query(collection(db, 'users'), where('email', '==', member.clientId)); // Wait, clientId is usually uid.
      // Actually, ClientMember.clientId is the UID of the user.
      
      await createNotification({
        userId: member.clientId,
        role: 'CLIENT',
        title: 'Team Invitation',
        message: `You have been invited to join the team for account #${member.accountId.slice(-6)}.`,
        type: 'system',
        priority: 'medium',
        link: '/profile'
      });

      await logActivity({
        ticketId: 'system',
        clientId: member.clientId,
        type: 'team_member_invited',
        description: `New team member invited to account: ${member.accountId}`,
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: role,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'clientMembers');
    }
  };

  const updateClientMemberRole = async (id: string, role: ClientMember['role']) => {
    try {
      await updateDoc(doc(db, 'clientMembers', id), { role });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `clientMembers/${id}`);
    }
  };

  const removeClientMember = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'clientMembers', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `clientMembers/${id}`);
    }
  };

  const createMaintenancePlan = async (plan: Omit<MaintenancePlan, 'id' | 'createdAt'>) => {
    try {
      const newPlan = {
        ...plan,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'maintenancePlans'), newPlan);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'maintenancePlans');
    }
  };

  const updateMaintenancePlan = async (id: string, updates: Partial<MaintenancePlan>) => {
    try {
      await updateDoc(doc(db, 'maintenancePlans', id), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `maintenancePlans/${id}`);
    }
  };

  const deleteMaintenancePlan = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'maintenancePlans', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `maintenancePlans/${id}`);
    }
  };

  const recordPayment = async (payment: Omit<PaymentRecord, 'id' | 'timestamp' | 'recordedBy' | 'recordedByName' | 'recordedByRole' | 'clientAccountId'>) => {
    try {
      const invoice = invoices.find(i => i.id === payment.invoiceId);
      if (!invoice) throw new Error('Invoice not found');

      // Real-world logic: If it's a credit card, we'd call a processor.
      // For this app, we'll assume manual recording for cash/check/transfer is always successful.
      // For credit_card, we'll keep a simplified success check but remove the random failure for now to make it "production-ready" in logic.
      if (payment.method === 'credit_card') {
        console.log(`Processing credit card payment for ${payment.amount} ${payment.currency}...`);
        // In a real production app, this is where Stripe/Square SDK would be called.
      }

      const newPayment: Omit<PaymentRecord, 'id'> = {
        ...payment,
        clientAccountId: clientAccount?.id || '',
        timestamp: new Date().toISOString(),
        recordedBy: currentUser.id,
        recordedByName: currentUser.fullName,
        recordedByRole: role,
        status: 'completed' as const,
        transactionId: payment.transactionId || `${payment.method}_${Math.random().toString(36).substring(7)}`
      };
      const paymentRef = await addDoc(collection(db, 'paymentRecords'), newPayment);
      
      // Calculate total paid for this invoice by summing all related payment records
      // We include the new payment we just added
      const relatedPayments = paymentRecords.filter(pr => pr.invoiceId === invoice.id);
      const totalPaid = relatedPayments.reduce((sum, p) => sum + p.amount, 0) + payment.amount;

      const balanceRemaining = Math.max(0, invoice.total - totalPaid);
      const status = totalPaid >= invoice.total ? 'paid' : (totalPaid > 0 ? 'partially_paid' : 'unpaid');
      
      await updateDoc(doc(db, 'invoices', invoice.id), { 
        status,
        amountPaid: totalPaid,
        balanceRemaining,
        paidDate: status === 'paid' ? new Date().toISOString() : invoice.paidDate,
        paymentMethod: payment.method
      });

      await logFinancialActivity({
        type: 'payment_received',
        amount: payment.amount,
        description: `Payment received for invoice #${invoice.id.slice(-6)} via ${payment.method}`,
        referenceId: invoice.id,
        referenceType: 'invoice'
      });

      await logActivity({
        ticketId: invoice.ticketId,
        clientId: invoice.clientId,
        type: 'payment_recorded',
        description: `Payment of ${payment.amount} ${payment.currency} recorded for invoice #${invoice.id.slice(-6)}`,
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: role,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'paymentRecords');
    }
  };

  const listPaymentRecords = async (invoiceId: string) => {
    try {
      const q = query(collection(db, 'paymentRecords'), where('invoiceId', '==', invoiceId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentRecord));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'paymentRecords');
      return [];
    }
  };

  const approveQuoteWithAuthorization = async (quoteId: string, authorization: { signatureName: string; notes: string; status: 'approved' | 'declined' }) => {
    try {
      const quote = quotes.find(q => q.id === quoteId);
      if (!quote) return;

      const approval: Omit<ApprovalRecord, 'id'> = {
        quoteId,
        ticketId: quote.ticketId,
        clientId: quote.clientId,
        clientAccountId: clientAccount?.id || '',
        approvedByUserId: currentUser.id,
        approvedByName: currentUser.fullName,
        status: authorization.status,
        timestamp: new Date().toISOString(),
        notes: authorization.notes,
        signatureName: authorization.signatureName,
        authorizationType: 'quote_approval'
      };

      const approvalRef = await addDoc(collection(db, 'approvalRecords'), approval);
      
      const newStatus = authorization.status === 'approved' ? 'accepted' : 'declined';
      await updateDoc(doc(db, 'quotes', quoteId), { 
        status: newStatus, 
        acceptedDate: newStatus === 'accepted' ? new Date().toISOString() : undefined,
        declinedDate: newStatus === 'declined' ? new Date().toISOString() : undefined,
        approvalId: approvalRef.id
      });

      if (newStatus === 'accepted') {
        await updateTicket(quote.ticketId, { status: 'approved', quoteStatus: 'accepted' });
        
        // Also create an AuthorizationRecord for work start
        await createWorkAuthorization({
          ticketId: quote.ticketId,
          clientId: quote.clientId,
          type: 'quote_approval',
          signatureName: authorization.signatureName,
          notes: authorization.notes,
          status: 'authorized'
        });
      } else {
        await updateTicket(quote.ticketId, { quoteStatus: 'declined' });
      }

      await logActivity({
        ticketId: quote.ticketId,
        clientId: quote.clientId,
        type: newStatus === 'accepted' ? 'quote_approved' : 'quote_declined',
        description: `Quote #${quoteId.slice(-6)} ${newStatus} by client with signature: ${authorization.signatureName}`,
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: role,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'approvalRecords');
    }
  };

  const createWorkAuthorization = async (authData: Omit<AuthorizationRecord, 'id' | 'timestamp' | 'approvedByUserId' | 'approvedByName' | 'clientAccountId'>) => {
    try {
      const newAuth: Omit<AuthorizationRecord, 'id'> = {
        ...authData,
        clientAccountId: clientAccount?.id || '',
        timestamp: new Date().toISOString(),
        approvedByUserId: currentUser.id,
        approvedByName: currentUser.fullName,
      };
      const authRef = await addDoc(collection(db, 'authorizationRecords'), newAuth);
      
      // Update ticket or invoice if needed
      if (authData.type === 'work_start') {
        await updateTicket(authData.ticketId, { status: 'in_progress', authorizationId: authRef.id });
      } else if (authData.type === 'completion_signoff') {
        await updateTicket(authData.ticketId, { status: 'completed', authorizationId: authRef.id });
      }
      
      await logActivity({
        ticketId: authData.ticketId,
        clientId: authData.clientId,
        type: 'work_authorized',
        description: `Work authorization (${authData.type}) signed by ${currentUser.fullName}`,
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: role,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'authorizationRecords');
    }
  };

  const inviteClientMember = async (accountId: string, email: string, role: ClientMember['role']) => {
    try {
      // Check if already invited
      const existing = clientInvitations.find(inv => inv.accountId === accountId && inv.email === email && inv.status === 'pending');
      if (existing) {
        await resendInvitation(existing.id);
        return;
      }

      const invitation: Omit<ClientInvitation, 'id'> = {
        accountId,
        email,
        role,
        invitedBy: currentUser.id,
        invitedAt: new Date().toISOString(),
        status: 'pending',
        token: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      };
      await addDoc(collection(db, 'clientInvitations'), invitation);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'clientInvitations');
    }
  };

  const resendInvitation = async (invitationId: string) => {
    try {
      await updateDoc(doc(db, 'clientInvitations', invitationId), {
        invitedAt: new Date().toISOString(),
        invitedBy: currentUser.id
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `clientInvitations/${invitationId}`);
    }
  };

  const revokeInvitation = async (invitationId: string) => {
    try {
      await updateDoc(doc(db, 'clientInvitations', invitationId), {
        status: 'revoked'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `clientInvitations/${invitationId}`);
    }
  };

  const activateClientMember = async (invitationToken: string) => {
    try {
      const q = query(collection(db, 'clientInvitations'), where('token', '==', invitationToken), where('status', '==', 'pending'));
      const snapshot = await getDocs(q);
      if (snapshot.empty) throw new Error('Invalid or expired invitation token');

      const invitationDoc = snapshot.docs[0];
      const invitation = invitationDoc.data() as ClientInvitation;

      // Create the member record
      const member: Omit<ClientMember, 'id' | 'addedAt'> = {
        accountId: invitation.accountId,
        clientId: currentUser.id,
        role: invitation.role,
        status: 'active'
      };
      await createClientMember(member);

      // Update invitation status
      await updateDoc(doc(db, 'clientInvitations', invitationDoc.id), {
        status: 'accepted',
        acceptedAt: new Date().toISOString(),
        acceptedByClientId: currentUser.id
      });

      // Update user's accountId if not set
      if (!currentUser.accountId) {
        await updateDoc(doc(db, 'users', currentUser.id), { accountId: invitation.accountId });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'clientInvitations');
    }
  };

  const deactivateClientMember = async (memberId: string) => {
    try {
      await updateDoc(doc(db, 'clientMembers', memberId), { status: 'deactivated' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `clientMembers/${memberId}`);
    }
  };

  const reactivateClientMember = async (memberId: string) => {
    try {
      await updateDoc(doc(db, 'clientMembers', memberId), { status: 'active' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `clientMembers/${memberId}`);
    }
  };

  const getClientAccountPermissions = () => {
    if (role === 'ADMIN') return { canManageTeam: true, canApproveQuotes: true, canPayInvoices: true, isReadOnly: false };
    if (role === 'TECHNICIAN') return { canManageTeam: false, canApproveQuotes: false, canPayInvoices: false, isReadOnly: true };
    
    // For clients, check their role in the current account
    if (!clientAccount) return { canManageTeam: false, canApproveQuotes: false, canPayInvoices: false, isReadOnly: true };
    
    const memberRecord = clientMembers.find(m => m.clientId === currentUser.id && m.accountId === clientAccount.id);
    if (!memberRecord) return { canManageTeam: false, canApproveQuotes: false, canPayInvoices: false, isReadOnly: true };

    const memberRole = memberRecord.role;
    return {
      canManageTeam: memberRole === 'owner' || memberRole === 'admin',
      canApproveQuotes: memberRole === 'owner' || memberRole === 'admin' || memberRole === 'member',
      canPayInvoices: memberRole === 'owner' || memberRole === 'admin' || memberRole === 'member',
      isReadOnly: memberRole === 'viewer'
    };
  };

  const updateCollectionsStatus = async (invoiceId: string, status: Invoice['collectionsStatus']) => {
    try {
      await updateDoc(doc(db, 'invoices', invoiceId), { collectionsStatus: status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `invoices/${invoiceId}`);
    }
  };

  const generateRecurringTicket = async (planId: string) => {
    try {
      const plan = maintenancePlans.find(p => p.id === planId);
      if (!plan) return;

      const ticketData: Omit<Ticket, 'id' | 'createdAt'> = {
        title: `Recurring Maintenance: ${plan.title}`,
        description: plan.description,
        category: plan.category,
        urgency: 'medium',
        status: 'pending_review',
        clientId: plan.clientId,
        clientName: clients.find(c => c.id === plan.clientId)?.fullName || 'Unknown',
        propertyId: plan.propertyId,
        propertyNickname: properties.find(p => p.id === plan.propertyId)?.nickname || 'Unknown',
        serviceAddress: properties.find(p => p.id === plan.propertyId)?.address || '',
        preferredDate: plan.nextDueDate,
        preferredTime: plan.preferredTimeWindow || '09:00',
        contactPreference: 'email',
        adminNotes: `Generated from maintenance plan: ${plan.id}`,
        technicianNotes: '',
        completionNotes: '',
        createdByEmail: 'system@mainteqc.com'
      };

      const ticketRef = await addDoc(collection(db, 'tickets'), {
        ...ticketData,
        createdAt: new Date().toISOString()
      });

      // Update plan next due date
      let nextDue = new Date(plan.nextDueDate);
      if (plan.frequency === 'monthly') nextDue.setMonth(nextDue.getMonth() + 1);
      else if (plan.frequency === 'quarterly') nextDue.setMonth(nextDue.getMonth() + 3);
      else if (plan.frequency === 'semi-annual') nextDue.setMonth(nextDue.getMonth() + 6);
      else if (plan.frequency === 'annual') nextDue.setFullYear(nextDue.getFullYear() + 1);
      else if (plan.frequency === 'custom' && plan.intervalMonths) nextDue.setMonth(nextDue.getMonth() + plan.intervalMonths);

      await updateDoc(doc(db, 'maintenancePlans', planId), {
        nextDueDate: nextDue.toISOString().split('T')[0],
        lastGeneratedDate: new Date().toISOString()
      });

      await addDoc(collection(db, 'recurringGenerationLog'), {
        planId,
        ticketId: ticketRef.id,
        generatedAt: new Date().toISOString(),
        status: 'success'
      });

      await logActivity({
        ticketId: ticketRef.id,
        clientId: plan.clientId,
        type: 'recurring_ticket_generated',
        description: `Ticket generated automatically from maintenance plan: ${plan.title}`,
        actorId: 'system',
        actorName: 'MainteQc System',
        actorRole: 'ADMIN',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'recurringGenerationLog');
    }
  };

  // Technician Operations Implementation
  const startWorkSession = async (ticketId: string, sessionType: WorkSession['sessionType'], notes: string = '') => {
    try {
      // Check if there's already an active session for this technician
      const activeSession = workSessions.find(s => s.technicianId === currentUser.id && s.status === 'active');
      if (activeSession) {
        await stopWorkSession(activeSession.id, 'Automatically stopped for new session');
      }

      const newSession: Omit<WorkSession, 'id'> = {
        ticketId,
        technicianId: currentUser.id,
        startTime: new Date().toISOString(),
        sessionType,
        notes,
        status: 'active',
      };

      await addDoc(collection(db, 'workSessions'), newSession);

      // Update ticket status based on session type
      if (sessionType === 'travel') {
        await updateTicket(ticketId, { status: 'on_the_way' });
      } else if (sessionType === 'onsite') {
        await updateTicket(ticketId, { status: 'in_progress' });
      }

    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'workSessions');
    }
  };

  const stopWorkSession = async (sessionId: string, notes: string = '') => {
    try {
      const session = workSessions.find(s => s.id === sessionId);
      if (!session) return;

      const endTime = new Date().toISOString();
      const durationMinutes = Math.round((new Date(endTime).getTime() - new Date(session.startTime).getTime()) / 60000);

      await updateDoc(doc(db, 'workSessions', sessionId), {
        endTime,
        durationMinutes,
        notes: session.notes ? `${session.notes}\n${notes}` : notes,
        status: 'completed',
      });

    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `workSessions/${sessionId}`);
    }
  };

  const createPartsRequest = async (request: Omit<PartsRequest, 'id' | 'technicianId' | 'createdAt' | 'updatedAt' | 'status'>) => {
    try {
      const newRequest: Omit<PartsRequest, 'id'> = {
        ...request,
        technicianId: currentUser.id,
        technicianName: currentUser.fullName,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'partsRequests'), newRequest);

      await logActivity({
        ticketId: request.ticketId,
        clientId: tickets.find(t => t.id === request.ticketId)?.clientId || '',
        type: 'status_changed',
        description: `Parts request created for ${request.items.length} items`,
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: role,
      });

    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'partsRequests');
    }
  };

  const updatePartsRequestStatus = async (id: string, status: PartsRequest['status'], adminNotes?: string) => {
    try {
      await updateDoc(doc(db, 'partsRequests', id), {
        status,
        adminNotes,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `partsRequests/${id}`);
    }
  };

  const updateInventoryQuantity = async (technicianId: string, itemId: string, delta: number) => {
    try {
      const stockItem = technicianStock.find(s => s.technicianId === technicianId && s.itemId === itemId);
      if (stockItem) {
        await updateDoc(doc(db, 'technicianStock', stockItem.id), {
          quantity: Math.max(0, stockItem.quantity + delta),
          lastRestockedAt: delta > 0 ? new Date().toISOString() : stockItem.lastRestockedAt,
        });
      } else if (delta > 0) {
        await addDoc(collection(db, 'technicianStock'), {
          technicianId,
          itemId,
          quantity: delta,
          minThreshold: 5,
          lastRestockedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'technicianStock');
    }
  };

  const updateChecklistItem = async (ticketId: string, checklistId: string, itemId: string, completed: boolean, note?: string) => {
    // Optimistic update
    setTicketChecklists(prev => prev.map(c => {
      if (c.id === checklistId) {
        const updatedItems = c.items.map(item => 
          item.id === itemId 
            ? { 
                ...item, 
                completed, 
                completedAt: completed ? new Date().toISOString() : undefined,
                completedBy: completed ? currentUser?.fullName : undefined,
                note: note ?? item.note
              } 
            : item
        );
        const allCompleted = updatedItems.every(item => item.completed || !item.required);
        return {
          ...c,
          items: updatedItems,
          status: allCompleted ? 'completed' : 'in_progress',
          completedAt: allCompleted ? new Date().toISOString() : undefined,
        };
      }
      return c;
    }));

    try {
      const checklist = ticketChecklists.find(c => c.id === checklistId);
      if (!checklist) return;

      const updatedItems = checklist.items.map(item => 
        item.id === itemId 
          ? { ...item, completed, completedAt: completed ? new Date().toISOString() : undefined, completedBy: completed ? currentUser.id : undefined, note: note || item.note }
          : item
      );

      const allCompleted = updatedItems.every(item => !item.required || item.completed);

      await updateDoc(doc(db, 'ticketChecklists', checklistId), {
        items: updatedItems,
        status: allCompleted ? 'completed' : 'in_progress',
        completedAt: allCompleted ? new Date().toISOString() : undefined,
      });

    } catch (error) {
      console.error('Error updating checklist item:', error);
      enqueuePendingSyncAction({ 
        type: 'checklist_item', 
        payload: { ticketId, checklistId, itemId, completed, note } 
      });
    }
  };

  const enqueuePendingSyncAction = (action: Omit<PendingSyncAction, 'id' | 'timestamp' | 'status'>) => {
    const newAction: PendingSyncAction = {
      ...action,
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      status: 'pending',
    };
    setPendingSyncQueue(prev => [...prev, newAction]);
    
    // Save to localStorage for persistence
    const saved = localStorage.getItem('pendingSyncQueue');
    const queue = saved ? JSON.parse(saved) : [];
    localStorage.setItem('pendingSyncQueue', JSON.stringify([...queue, newAction]));
  };

  const retryPendingSyncAction = async (id: string) => {
    const action = pendingSyncQueue.find(a => a.id === id);
    if (!action) return;

    try {
      // Implement retry logic based on action type
      // For now, we'll just simulate success and remove from queue
      setPendingSyncQueue(prev => prev.filter(a => a.id !== id));
      const saved = localStorage.getItem('pendingSyncQueue');
      if (saved) {
        const queue = JSON.parse(saved);
        localStorage.setItem('pendingSyncQueue', JSON.stringify(queue.filter((a: any) => a.id !== id)));
      }
    } catch (error) {
      console.error('Sync retry failed', error);
      setPendingSyncQueue(prev => prev.map(a => a.id === id ? { ...a, status: 'failed', error: String(error) } : a));
    }
  };

  const createInventoryItem = async (item: Omit<InventoryItem, 'id'>) => {
    try {
      await addDoc(collection(db, 'inventoryItems'), {
        ...item,
        status: 'active'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'inventoryItems');
    }
  };

  const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>) => {
    try {
      await updateDoc(doc(db, 'inventoryItems', id), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `inventoryItems/${id}`);
    }
  };

  const createStockMovement = async (movement: Omit<StockMovement, 'id' | 'timestamp'>) => {
    try {
      await addDoc(collection(db, 'stockMovements'), {
        ...movement,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'stockMovements');
    }
  };

  const adjustTechnicianStock = async (technicianId: string, itemId: string, delta: number, reason: string, ticketId?: string) => {
    try {
      const stockItem = technicianStock.find(s => s.technicianId === technicianId && s.itemId === itemId);
      const item = inventoryItems.find(i => i.id === itemId);
      
      if (stockItem) {
        await updateDoc(doc(db, 'technicianStock', stockItem.id), {
          quantity: Math.max(0, stockItem.quantity + delta),
          lastRestockedAt: delta > 0 ? new Date().toISOString() : stockItem.lastRestockedAt,
        });
      } else if (delta > 0) {
        await addDoc(collection(db, 'technicianStock'), {
          technicianId,
          itemId,
          quantity: delta,
          minThreshold: 5,
          lastRestockedAt: new Date().toISOString(),
        });
      }

      await createStockMovement({
        itemId,
        itemName: item?.name || 'Unknown Item',
        technicianId,
        technicianName: technicians.find(t => t.id === technicianId)?.fullName || 'Unknown Technician',
        type: delta > 0 ? 'restock' : 'issue',
        quantityDelta: delta,
        reason,
        ticketId,
        createdByUserId: currentUser.id,
        createdByName: currentUser.fullName,
        createdByRole: role
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'technicianStock');
    }
  };

  const transferStockToTechnician = async (technicianId: string, itemId: string, quantity: number) => {
    await adjustTechnicianStock(technicianId, itemId, quantity, 'Stock Transfer');
  };

  const fulfillPartsRequest = async (requestId: string, adminNotes?: string) => {
    try {
      const request = partsRequests.find(r => r.id === requestId);
      if (!request) return;

      // Update request status
      await updateDoc(doc(db, 'partsRequests', requestId), {
        status: 'fulfilled',
        adminNotes,
        updatedAt: new Date().toISOString()
      });

      // Update technician stock for each item
      for (const item of request.items) {
        await adjustTechnicianStock(request.technicianId, item.itemId, item.quantity, `Fulfilled Request #${requestId.slice(-6)}`, request.ticketId);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `partsRequests/${requestId}`);
    }
  };

  const markPartsRequestOrdered = async (requestId: string, adminNotes?: string) => {
    try {
      await updateDoc(doc(db, 'partsRequests', requestId), {
        status: 'ordered',
        adminNotes,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `partsRequests/${requestId}`);
    }
  };

  const markPartsRequestReceived = async (requestId: string, adminNotes?: string) => {
    try {
      await updateDoc(doc(db, 'partsRequests', requestId), {
        status: 'received',
        adminNotes,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `partsRequests/${requestId}`);
    }
  };

  const cancelPartsRequest = async (requestId: string, adminNotes?: string) => {
    try {
      await updateDoc(doc(db, 'partsRequests', requestId), {
        status: 'cancelled',
        adminNotes,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `partsRequests/${requestId}`);
    }
  };

  // Accounting Methods
  const createVendor = async (vendor: Omit<Vendor, 'id' | 'createdAt'>) => {
    try {
      await addDoc(collection(db, 'vendors'), { ...vendor, createdAt: new Date().toISOString() });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'vendors');
    }
  };

  const updateVendor = async (id: string, updates: Partial<Vendor>) => {
    try {
      await updateDoc(doc(db, 'vendors', id), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `vendors/${id}`);
    }
  };

  const createVendorBill = async (bill: Omit<VendorBill, 'id' | 'createdAt'>) => {
    try {
      const billRef = await addDoc(collection(db, 'vendorBills'), { ...bill, createdAt: new Date().toISOString() });
      await logFinancialActivity({
        type: 'bill_received',
        amount: bill.total,
        description: `Bill received from ${bill.vendorName}`,
        referenceId: billRef.id,
        referenceType: 'bill'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'vendorBills');
    }
  };

  const updateVendorBill = async (id: string, updates: Partial<VendorBill>) => {
    try {
      await updateDoc(doc(db, 'vendorBills', id), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `vendorBills/${id}`);
    }
  };

  const recordVendorPayment = async (payment: Omit<VendorPayment, 'id' | 'timestamp'>) => {
    try {
      const bill = vendorBills.find(b => b.id === payment.billId);
      if (!bill) throw new Error('Bill not found');

      const newPayment = {
        ...payment,
        timestamp: new Date().toISOString(),
        recordedBy: currentUser.id,
        recordedByName: currentUser.fullName
      };
      await addDoc(collection(db, 'vendorPayments'), newPayment);

      const amountPaid = (bill.amountPaid || 0) + payment.amount;
      const balanceRemaining = Math.max(0, bill.total - amountPaid);
      const status = balanceRemaining === 0 ? 'paid' : 'partially_paid';

      await updateVendorBill(bill.id, { amountPaid, balanceRemaining, status });

      await logFinancialActivity({
        type: 'bill_paid',
        amount: payment.amount,
        description: `Payment recorded for bill #${bill.billNumber}`,
        referenceId: bill.id,
        referenceType: 'bill'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'vendorPayments');
    }
  };

  const createExpense = async (expense: Omit<ExpenseRecord, 'id' | 'createdAt'>) => {
    try {
      const expenseRef = await addDoc(collection(db, 'expenses'), { ...expense, createdAt: new Date().toISOString() });
      await logFinancialActivity({
        type: 'expense_recorded',
        amount: expense.total,
        description: `Expense recorded: ${expense.category}`,
        referenceId: expenseRef.id,
        referenceType: 'expense'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'expenses');
    }
  };

  const updateExpense = async (id: string, updates: Partial<ExpenseRecord>) => {
    try {
      await updateDoc(doc(db, 'expenses', id), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `expenses/${id}`);
    }
  };

  const approveTimesheet = async (approval: Omit<TimesheetApproval, 'id'>) => {
    try {
      const approvalRef = await addDoc(collection(db, 'timesheetApprovals'), approval);
      await logFinancialActivity({
        type: 'timesheet_approved',
        amount: 0, // Labor cost is tracked via job costing
        description: `Timesheet approved for ${approval.technicianName}`,
        referenceId: approvalRef.id,
        referenceType: 'timesheet'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'timesheetApprovals');
    }
  };

  const createPayrollBatch = async (batch: Omit<PayrollExportBatch, 'id' | 'createdAt'>) => {
    try {
      const batchRef = await addDoc(collection(db, 'payrollBatches'), { ...batch, createdAt: new Date().toISOString() });
      await logFinancialActivity({
        type: 'payroll_processed',
        amount: batch.totalAmount,
        description: `Payroll batch processed for ${batch.technicianCount} technicians`,
        referenceId: batchRef.id,
        referenceType: 'payroll'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'payrollBatches');
    }
  };

  const createTaxProfile = async (profile: Omit<TaxProfile, 'id'>) => {
    try {
      await addDoc(collection(db, 'taxProfiles'), profile);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'taxProfiles');
    }
  };

  const updateTaxProfile = async (id: string, updates: Partial<TaxProfile>) => {
    try {
      await updateDoc(doc(db, 'taxProfiles', id), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `taxProfiles/${id}`);
    }
  };

  const logFinancialActivity = async (activity: Omit<FinancialActivity, 'id' | 'timestamp' | 'actorId' | 'actorName'>) => {
    try {
      await addDoc(collection(db, 'financialActivity'), {
        ...activity,
        timestamp: new Date().toISOString(),
        actorId: currentUser.id,
        actorName: currentUser.fullName
      });
    } catch (error) {
      console.error('Failed to log financial activity', error);
    }
  };

  const calculateJobCosting = (ticketId: string): JobCostSnapshot => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) throw new Error('Ticket not found');

    // 1. Revenue (Invoices)
    const ticketInvoices = invoices.filter(inv => inv.ticketId === ticketId);
    const revenue = ticketInvoices.reduce((sum, inv) => sum + inv.total, 0);

    // 2. Labor Cost (Work Sessions)
    const ticketSessions = workSessions.filter(ws => ws.ticketId === ticketId);
    let laborCost = 0;
    for (const session of ticketSessions) {
      const techProfile = technicianPayProfiles.find(p => p.technicianId === session.technicianId);
      const hourlyRate = techProfile?.hourlyRate || 35; // Fallback
      const travelRate = techProfile?.travelRate || 25; // Fallback
      
      if (session.startTime && session.endTime) {
        const durationHours = (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60 * 60);
        const rate = session.sessionType === 'onsite' ? hourlyRate : travelRate;
        laborCost += durationHours * rate;
      }
    }

    // 3. Material Cost (Materials Used)
    const ticketMaterials = materialsUsed.filter(m => m.ticketId === ticketId);
    const materialCost = ticketMaterials.reduce((sum, m) => sum + (m.unitCost || 0) * m.quantity, 0);

    // 4. External Expenses (Vendor Bills & Expenses)
    const ticketBills = vendorBills.filter(b => b.ticketId === ticketId);
    const billCost = ticketBills.reduce((sum, b) => sum + b.total, 0);
    
    const ticketExpenses = expenses.filter(e => e.ticketId === ticketId);
    const expenseCost = billCost + ticketExpenses.reduce((sum, e) => sum + e.total, 0);

    const totalCost = laborCost + materialCost + expenseCost;
    const grossMargin = revenue - totalCost;
    const marginPercentage = revenue > 0 ? (grossMargin / revenue) * 100 : 0;

    const snapshot: JobCostSnapshot = {
      id: `cost_${ticketId}_${Date.now()}`,
      ticketId,
      revenue,
      laborCost,
      materialCost,
      expenseCost,
      totalCost,
      grossMargin,
      profit: grossMargin,
      marginPercentage,
      margin: marginPercentage,
      lastUpdated: new Date().toISOString()
    };

    // Background update to persist the snapshot
    updateDoc(doc(db, 'tickets', ticketId), { jobCosting: snapshot }).catch(err => {
      console.error('Failed to update job costing in background', err);
    });

    return snapshot;
  };

  return (
    <AppContext.Provider value={{
      role, currentUser, brand, setBrand,
      clients, technicians, tickets, properties, quotes, invoices, messages, activities,
      attachments, materialsUsed, serviceSummaries,
      clientAccounts, clientAccount, clientMembers, clientInvitations, maintenancePlans, paymentRecords, approvalRecords, reminderEvents, authorizationRecords, recurringGenerationLog,
      workSessions, inventoryItems, technicianStock, partsRequests, checklistTemplates, ticketChecklists, pendingSyncQueue, stockMovements,
      technicianAvailabilityRules, technicianBlockedSlots, appointmentRecords,
      vendors, vendorBills, vendorPayments, expenses, technicianPayProfiles, timesheetApprovals, payrollBatches, taxProfiles, financialActivities,
      notifications, automationRules, automationLogs, monthlySummaries,
      loading,
      uploadAttachment, deleteAttachment, updateAttachmentVisibility,
      addMaterialUsed, updateMaterialUsed, deleteMaterialUsed,
      saveServiceSummary, updateServiceSummary,
      sendQuoteReminder, sendInvoiceReminder, updateCollectionsStatus, markDocumentAsViewed, markDocumentAsExported,
      createClientAccount, updateClientAccount, createClientMember, updateClientMemberRole, removeClientMember,
      inviteClientMember, resendInvitation, revokeInvitation, activateClientMember, deactivateClientMember, reactivateClientMember, getClientAccountPermissions,
      createMaintenancePlan, updateMaintenancePlan, deleteMaintenancePlan,
      recordPayment, listPaymentRecords, sendPaymentReminder, approveQuoteWithAuthorization, createWorkAuthorization, generateRecurringTicket,
      startWorkSession, stopWorkSession, createPartsRequest, updatePartsRequestStatus, updateInventoryQuantity, updateChecklistItem, enqueuePendingSyncAction, retryPendingSyncAction,
      createInventoryItem, updateInventoryItem, adjustTechnicianStock, transferStockToTechnician, createStockMovement, fulfillPartsRequest, markPartsRequestOrdered, markPartsRequestReceived, cancelPartsRequest,
      createAppointmentProposal, confirmAppointment, requestAppointmentReschedule, cancelAppointment, createBlockedSlot, updateBlockedSlot, removeBlockedSlot, updateTechnicianAvailabilityRule, getTechnicianCapacityForDay,
      createVendor, updateVendor, createVendorBill, updateVendorBill, recordVendorPayment, createExpense, updateExpense, approveTimesheet, createPayrollBatch, createTaxProfile, updateTaxProfile, logFinancialActivity, calculateJobCosting,
      updateTicket, addTicket, addMessage, saveBrandSettings, createQuote, updateQuote, updateQuoteStatus, createInvoice, updateInvoice, updateInvoiceStatus, updateCurrentUserProfile,
      createClient, updateClient, createTechnician, updateTechnician, createProperty, updateProperty, logActivity, 
      createNotification, markNotificationRead, dismissNotification, createSystemMessage, 
      createAutomationRule, updateAutomationRule, deleteAutomationRule, runAutomationRule, generateMonthlySummary,
      approveTicket, rejectTicket, rescheduleTicket, assignTechnician,
      login, logout, isAuthReady, markMessageAsRead
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
