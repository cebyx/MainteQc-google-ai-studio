import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, Client, Technician, BrandSettings, Ticket, Property, Quote, Invoice, Message } from './types';
import { MOCK_BRAND, MOCK_QUOTES, MOCK_INVOICES } from './mockData';
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
  setRole: (role: UserRole) => void;
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
  
  const [brand, setBrand] = useState<BrandSettings>(MOCK_BRAND);
  const [clients, setClients] = useState<Client[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [quotes] = useState<Quote[]>(MOCK_QUOTES);
  const [invoices] = useState<Invoice[]>(MOCK_INVOICES);
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

    // Listen to Users (Clients & Technicians)
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setClients(allUsers.filter(u => u.role === 'CLIENT'));
      setTechnicians(allUsers.filter(u => u.role === 'TECHNICIAN'));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

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

  // Allow manual role switching for demo purposes (updates Firestore)
  const handleSetRole = async (newRole: UserRole) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.id), { role: newRole });
      setRole(newRole);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.id}`);
    }
  };

  return (
    <AppContext.Provider value={{
      role, setRole: handleSetRole, currentUser, brand, setBrand,
      clients, technicians, tickets, properties, quotes, invoices, messages,
      updateTicket, addTicket, addMessage, login, logout, isAuthReady
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
