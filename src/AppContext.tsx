import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, Client, Technician, BrandSettings, Ticket, Property, Quote, Invoice, Message } from './types';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, doc, onSnapshot, setDoc, addDoc, updateDoc, getDoc, getDocs } from 'firebase/firestore';

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
  updateTicket: (id: string, updates: Partial<Ticket>) => void;
  addTicket: (ticket: Omit<Ticket, 'id' | 'createdAt'>) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp' | 'read'>) => void;
  saveBrandSettings: (brand: BrandSettings) => Promise<void>;
  createQuote: (quote: Omit<Quote, 'id' | 'createdAt'>) => Promise<void>;
  updateQuoteStatus: (id: string, status: Quote['status']) => Promise<void>;
  createInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => Promise<void>;
  updateInvoiceStatus: (id: string, status: Invoice['status'], paymentMethod?: string) => Promise<void>;
  updateCurrentUserProfile: (updates: any) => Promise<void>;
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
    const unsubQuotes = onSnapshot(collection(db, 'quotes'), (snapshot) => {
      const allQuotes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quote));
      if (role === 'ADMIN') {
        setQuotes(allQuotes);
      } else if (role === 'CLIENT') {
        setQuotes(allQuotes.filter(q => q.clientId === currentUser.id));
      } else {
        setQuotes([]);
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'quotes'));

    // Listen to Invoices
    const unsubInvoices = onSnapshot(collection(db, 'invoices'), (snapshot) => {
      const allInvoices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
      if (role === 'ADMIN') {
        setInvoices(allInvoices);
      } else if (role === 'CLIENT') {
        setInvoices(allInvoices.filter(i => i.clientId === currentUser.id));
      } else {
        setInvoices([]);
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'invoices'));

    // Listen to Tickets
    const unsubTickets = onSnapshot(collection(db, 'tickets'), (snapshot) => {
      const allTickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
      
      // Filter based on role
      if (role === 'ADMIN') {
        setTickets(allTickets);
      } else if (role === 'TECHNICIAN') {
        setTickets(allTickets.filter(t => t.assignedTechnicianId === currentUser.id));
      } else {
        setTickets(allTickets.filter(t => t.clientId === currentUser.id));
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'tickets'));

    // Listen to Properties
    const unsubProperties = onSnapshot(collection(db, 'properties'), (snapshot) => {
      const allProps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
      
      if (role === 'ADMIN' || role === 'TECHNICIAN') {
        setProperties(allProps);
      } else {
        setProperties(allProps.filter(p => p.clientId === currentUser.id));
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'properties'));

    // Listen to Messages
    const unsubMessages = onSnapshot(collection(db, 'messages'), (snapshot) => {
      const allMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      
      if (role === 'ADMIN') {
        setMessages(allMsgs);
      } else {
        setMessages(allMsgs.filter(m => m.senderId === currentUser.id || m.recipientId === currentUser.id));
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'messages'));

    return () => {
      unsubUsers();
      unsubBrand();
      unsubQuotes();
      unsubInvoices();
      unsubTickets();
      unsubProperties();
      unsubMessages();
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
      await updateDoc(doc(db, 'tickets', id), updates);
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
      await addDoc(collection(db, 'tickets'), newTicket);
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

  const saveBrandSettings = async (newBrand: BrandSettings) => {
    try {
      await setDoc(doc(db, 'brandSettings', 'main'), newBrand);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'brandSettings/main');
    }
  };

  const createQuote = async (quote: Omit<Quote, 'id' | 'createdAt'>) => {
    try {
      const newQuote = {
        ...quote,
        createdAt: new Date().toISOString(),
        sentDate: quote.status === 'sent' ? new Date().toISOString() : undefined,
      };
      await addDoc(collection(db, 'quotes'), newQuote);
      if (quote.status === 'sent') {
        updateTicket(quote.ticketId, { quoteStatus: 'sent' });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'quotes');
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
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `quotes/${id}`);
    }
  };

  const createInvoice = async (invoice: Omit<Invoice, 'id' | 'createdAt'>) => {
    try {
      const newInvoice = {
        ...invoice,
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, 'invoices'), newInvoice);
      if (invoice.status === 'unpaid') {
        updateTicket(invoice.ticketId, { invoiceStatus: 'unpaid' });
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

  return (
    <AppContext.Provider value={{
      role, currentUser, brand, setBrand,
      clients, technicians, tickets, properties, quotes, invoices, messages,
      updateTicket, addTicket, addMessage, saveBrandSettings, createQuote, updateQuoteStatus, createInvoice, updateInvoiceStatus, updateCurrentUserProfile, login, logout, isAuthReady
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
