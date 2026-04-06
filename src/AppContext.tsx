import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserRole, Client, Technician, BrandSettings, Ticket, Property, Quote, Invoice, Message, 
  ActivityEvent, Attachment, MaterialUsed, ServiceSummary, ClientAccount, ClientMember, 
  MaintenancePlan, RecurringGenerationLog, ApprovalRecord, PaymentRecord, ClientInvitation, ReminderEvent, AuthorizationRecord
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
  updateInvoiceStatus: (id: string, status: Invoice['status'], paymentMethod?: string) => Promise<void>;
  updateCurrentUserProfile: (updates: any) => Promise<void>;
  createClient: (client: Omit<Client, 'id'>) => Promise<void>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  createTechnician: (tech: Omit<Technician, 'id'>) => Promise<void>;
  updateTechnician: (id: string, updates: Partial<Technician>) => Promise<void>;
  createProperty: (property: Omit<Property, 'id'>) => Promise<void>;
  updateProperty: (id: string, updates: Partial<Property>) => Promise<void>;
  logActivity: (activity: Omit<ActivityEvent, 'id' | 'timestamp'>) => Promise<void>;
  createNotification: (ticketId: string, recipientId: string, recipientRole: UserRole, text: string) => Promise<void>;
  createSystemMessage: (ticketId: string, recipientId: string, recipientRole: UserRole, text: string) => Promise<void>;
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
  activateClientMember: (invitationToken: string) => Promise<void>;
  deactivateClientMember: (memberId: string) => Promise<void>;
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
      await addDoc(collection(db, 'quotes'), newQuote);
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
        await createNotification(quote.ticketId, quote.clientId, 'CLIENT', `A new quote for $${quote.total.toFixed(2)} has been sent for your review.`);
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
      const existingInvoice = invoices.find(i => i.id === invoice.ticketId); // Wait, invoice.id is usually ticketId in some models, but here it's a separate doc.
      // Let's check by ticketId
      const existingInvoiceByTicket = invoices.find(i => i.ticketId === invoice.ticketId);
      if (existingInvoiceByTicket) {
        throw new Error('An invoice already exists for this ticket.');
      }

      const newInvoice = {
        ...invoice,
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, 'invoices'), newInvoice);
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
        await createNotification(invoice.ticketId, invoice.clientId, 'CLIENT', `A new invoice for $${invoice.total.toFixed(2)} is now available.`);
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

  const createNotification = async (ticketId: string, recipientId: string, recipientRole: UserRole, text: string) => {
    // Legacy support, now uses createSystemMessage
    return createSystemMessage(ticketId, recipientId, recipientRole, text);
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
        await createNotification(id, ticket.clientId, 'CLIENT', `Your appointment for ticket #${id.slice(-6)} has been rescheduled to ${date} at ${time}.`);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tickets/${id}`);
    }
  };

  const assignTechnician = async (id: string, techId: string, techName: string) => {
    try {
      await updateDoc(doc(db, 'tickets', id), { assignedTechnicianId: techId, assignedTechnicianName: techName });
      const ticket = tickets.find(t => t.id === id);
      if (ticket) {
        await logActivity({
          ticketId: id,
          clientId: ticket.clientId,
          type: 'technician_assigned',
          description: `Technician ${techName} assigned to ticket`,
          actorId: currentUser.id,
          actorName: currentUser.fullName,
          actorRole: role,
        });
        await createNotification(id, techId, 'TECHNICIAN', `You have been assigned to ticket #${id.slice(-6)}.`);
        await createNotification(id, ticket.clientId, 'CLIENT', `Technician ${techName} has been assigned to your ticket.`);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tickets/${id}`);
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
      
      await createNotification(
        'system',
        member.clientId,
        'CLIENT',
        `You have been invited to join the team for account #${member.accountId.slice(-6)}.`
      );

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

      // Mock Stripe Integration
      // In a real app, we would call Stripe API here
      console.log(`Simulating Stripe payment for ${payment.amount} ${payment.currency}...`);
      const isSuccessful = Math.random() > 0.05; // 95% success rate simulation

      if (!isSuccessful) {
        throw new Error('Payment processing failed. Please check your card details and try again.');
      }

      const newPayment: Omit<PaymentRecord, 'id'> = {
        ...payment,
        clientAccountId: clientAccount?.id || '',
        timestamp: new Date().toISOString(),
        recordedBy: currentUser.id,
        recordedByName: currentUser.fullName,
        recordedByRole: role,
        status: 'completed' as const,
        transactionId: payment.transactionId || `stripe_${Math.random().toString(36).substring(7)}`
      };
      const paymentRef = await addDoc(collection(db, 'paymentRecords'), newPayment);
      
      const paymentIds = [...(invoice.paymentIds || []), paymentRef.id];
      // We need to fetch the actual payment records to calculate the total paid
      // For now, we'll use the local state which might be slightly behind but usually okay
      const totalPaid = paymentIds.reduce((sum, pid) => {
        const p = paymentRecords.find(pr => pr.id === pid);
        return sum + (p?.amount || 0);
      }, payment.amount);

      const status = totalPaid >= invoice.total ? 'paid' : 'unpaid';
      await updateDoc(doc(db, 'invoices', invoice.id), { 
        paymentIds, 
        status,
        paidDate: status === 'paid' ? new Date().toISOString() : invoice.paidDate,
        paymentMethod: payment.method
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

  return (
    <AppContext.Provider value={{
      role, currentUser, brand, setBrand,
      clients, technicians, tickets, properties, quotes, invoices, messages, activities,
      attachments, materialsUsed, serviceSummaries,
      clientAccounts, clientAccount, clientMembers, clientInvitations, maintenancePlans, paymentRecords, approvalRecords, reminderEvents, authorizationRecords, recurringGenerationLog,
      loading,
      uploadAttachment, deleteAttachment, updateAttachmentVisibility,
      addMaterialUsed, updateMaterialUsed, deleteMaterialUsed,
      saveServiceSummary, updateServiceSummary,
      sendQuoteReminder, sendInvoiceReminder, updateCollectionsStatus, markDocumentAsViewed, markDocumentAsExported,
      createClientAccount, updateClientAccount, createClientMember, updateClientMemberRole, removeClientMember,
      inviteClientMember, activateClientMember, deactivateClientMember, getClientAccountPermissions,
      createMaintenancePlan, updateMaintenancePlan, deleteMaintenancePlan,
      recordPayment, listPaymentRecords, sendPaymentReminder, approveQuoteWithAuthorization, createWorkAuthorization, generateRecurringTicket,
      updateTicket, addTicket, addMessage, saveBrandSettings, createQuote, updateQuote, updateQuoteStatus, createInvoice, updateInvoice, updateInvoiceStatus, updateCurrentUserProfile,
      createClient, updateClient, createTechnician, updateTechnician, createProperty, updateProperty, logActivity, createNotification, createSystemMessage, approveTicket, rejectTicket, rescheduleTicket, assignTechnician,
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
