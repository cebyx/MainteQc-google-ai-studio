import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, Client, Technician, BrandSettings, Ticket, Property, Quote, Invoice, Message, ActivityEvent } from './types';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, doc, onSnapshot, setDoc, addDoc, updateDoc, getDoc, getDocs, query, where } from 'firebase/firestore';

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

    return () => {
      unsubUsers();
      unsubBrand();
      unsubQuotes();
      unsubInvoices();
      unsubTickets();
      unsubProperties();
      unsubMessages();
      unsubActivities();
    };
  }, [isAuthReady, currentUser, role]);

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

  return (
    <AppContext.Provider value={{
      role, currentUser, brand, setBrand,
      clients, technicians, tickets, properties, quotes, invoices, messages, activities,
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
