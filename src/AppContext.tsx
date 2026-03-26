import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, Client, Technician, BrandSettings, Ticket, Property, Quote, Invoice, Message } from './types';
import { MOCK_BRAND, MOCK_CLIENTS, MOCK_TECHNICIANS, MOCK_TICKETS, MOCK_PROPERTIES, MOCK_QUOTES, MOCK_INVOICES, MOCK_MESSAGES } from './mockData';

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('ADMIN');
  const [brand, setBrand] = useState<BrandSettings>(MOCK_BRAND);
  const [clients] = useState<Client[]>(MOCK_CLIENTS);
  const [technicians] = useState<Technician[]>(MOCK_TECHNICIANS);
  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
  const [properties] = useState<Property[]>(MOCK_PROPERTIES);
  const [quotes] = useState<Quote[]>(MOCK_QUOTES);
  const [invoices] = useState<Invoice[]>(MOCK_INVOICES);
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);

  // Determine current user based on role for demo purposes
  const currentUser = role === 'ADMIN' 
    ? { id: 'admin', fullName: 'System Admin', email: 'admin@mainteqc.com' }
    : role === 'TECHNICIAN' 
      ? MOCK_TECHNICIANS[0] 
      : MOCK_CLIENTS[0];

  // Filter data based on role
  const filteredTickets = role === 'ADMIN' 
    ? tickets 
    : role === 'TECHNICIAN' 
      ? tickets.filter(t => t.assignedTechnicianId === currentUser.id)
      : tickets.filter(t => t.clientId === currentUser.id);

  const filteredProperties = role === 'ADMIN' || role === 'TECHNICIAN'
    ? properties
    : properties.filter(p => p.clientId === currentUser.id);

  const filteredQuotes = role === 'ADMIN' || role === 'TECHNICIAN'
    ? quotes
    : quotes.filter(q => q.clientId === currentUser.id);

  const filteredInvoices = role === 'ADMIN' || role === 'TECHNICIAN'
    ? invoices
    : invoices.filter(i => i.clientId === currentUser.id);

  const filteredMessages = role === 'ADMIN'
    ? messages
    : messages.filter(m => m.senderId === currentUser.id || m.recipientId === currentUser.id);

  const updateTicket = (id: string, updates: Partial<Ticket>) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const addTicket = (ticket: Omit<Ticket, 'id' | 'createdAt'>) => {
    const newTicket: Ticket = {
      ...ticket,
      id: `tk${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setTickets(prev => [newTicket, ...prev]);
  };

  const addMessage = (message: Omit<Message, 'id' | 'timestamp' | 'read'>) => {
    const newMessage: Message = {
      ...message,
      id: `m${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setMessages(prev => [...prev, newMessage]);
  };

  return (
    <AppContext.Provider value={{
      role, setRole, currentUser, brand, setBrand,
      clients, technicians, 
      tickets: filteredTickets, 
      properties: filteredProperties, 
      quotes: filteredQuotes, 
      invoices: filteredInvoices, 
      messages: filteredMessages,
      updateTicket, addTicket, addMessage
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
