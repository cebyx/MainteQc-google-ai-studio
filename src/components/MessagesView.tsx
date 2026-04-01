import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { MessageSquare, Send, User, Shield, Wrench, ChevronLeft, Search } from 'lucide-react';
import { cn, formatDate, formatTime } from '../lib/utils';
import { Ticket } from '../types';

export const MessagesView: React.FC = () => {
  const { messages, tickets, currentUser, role, addMessage } = useApp();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'system' | 'direct'>('all');

  // Group messages by ticketId
  const conversations = tickets.filter(t => 
    messages.some(m => m.ticketId === t.id) || 
    t.clientId === currentUser.id || 
    role === 'ADMIN' || 
    t.assignedTechnicianId === currentUser.id
  ).map(ticket => {
    const ticketMsgs = messages.filter(m => m.ticketId === ticket.id).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const lastMessage = ticketMsgs[ticketMsgs.length - 1];
    const unreadCount = ticketMsgs.filter(m => !m.read && m.recipientId === currentUser.id).length;
    const hasSystemMessages = ticketMsgs.some(m => m.isSystem);
    
    return {
      ticket,
      messages: ticketMsgs,
      lastMessage,
      unreadCount,
      hasSystemMessages
    };
  }).filter(c => {
    const matchesSearch = c.ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.ticket.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.lastMessage && c.lastMessage.text.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (filter === 'system') return matchesSearch && c.hasSystemMessages;
    if (filter === 'direct') return matchesSearch && c.messages.some(m => !m.isSystem);
    return matchesSearch;
  }).sort((a, b) => {
    const timeA = a.lastMessage ? new Date(a.lastMessage.timestamp).getTime() : new Date(a.ticket.createdAt).getTime();
    const timeB = b.lastMessage ? new Date(b.lastMessage.timestamp).getTime() : new Date(b.ticket.createdAt).getTime();
    return timeB - timeA;
  });

  const selectedConversation = conversations.find(c => c.ticket.id === selectedTicketId);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    const ticket = selectedConversation.ticket;
    
    // Determine recipient based on role
    let recipientId = '';
    let recipientRole: 'ADMIN' | 'CLIENT' | 'TECHNICIAN' = 'ADMIN';

    if (role === 'CLIENT') {
      recipientId = 'admin'; // Send to admin by default
      recipientRole = 'ADMIN';
    } else if (role === 'TECHNICIAN') {
      recipientId = 'admin'; // Techs talk to admin
      recipientRole = 'ADMIN';
    } else if (role === 'ADMIN') {
      // Admin replies to the client of the ticket
      recipientId = ticket.clientId;
      recipientRole = 'CLIENT';
    }

    addMessage({
      senderId: currentUser.id,
      senderRole: role,
      recipientId,
      recipientRole,
      text: newMessage,
      ticketId: ticket.id,
    });
    setNewMessage('');
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] max-w-6xl mx-auto rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      
      {/* Conversations List (Sidebar) */}
      <div className={cn(
        "flex flex-col border-r border-gray-100 bg-gray-50/30 w-full md:w-80 lg:w-96 shrink-0 transition-all",
        selectedTicketId ? "hidden md:flex" : "flex"
      )}>
        <div className="p-4 border-b border-gray-100 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Messages</h2>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button 
                onClick={() => setFilter('all')}
                className={cn("px-2 py-1 text-[10px] font-bold rounded-md transition-all", filter === 'all' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500")}
              >
                All
              </button>
              <button 
                onClick={() => setFilter('system')}
                className={cn("px-2 py-1 text-[10px] font-bold rounded-md transition-all", filter === 'system' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500")}
              >
                System
              </button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full rounded-xl border-gray-200 bg-gray-50 pl-10 pr-4 py-2 text-sm focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No conversations found.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {conversations.map(({ ticket, lastMessage, unreadCount }) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={cn(
                    "w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-start gap-3",
                    selectedTicketId === ticket.id ? "bg-blue-50/50" : ""
                  )}
                >
                  <div className="relative shrink-0 mt-1">
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center font-bold",
                      lastMessage?.isSystem ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                    )}>
                      {lastMessage?.isSystem ? <Shield className="h-5 w-5" /> : (role === 'CLIENT' ? 'A' : ticket.clientName.charAt(0))}
                    </div>
                    {unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 border-2 border-white flex items-center justify-center text-[8px] font-bold text-white">
                        {unreadCount}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-bold text-gray-900 truncate">
                        {lastMessage?.isSystem ? 'System Notification' : (role === 'CLIENT' ? 'Support Center' : ticket.clientName)}
                      </h4>
                      {lastMessage && (
                        <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                          {formatTime(lastMessage.timestamp)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-blue-600 truncate mb-1">
                      Ticket #{ticket.id.slice(-4)}: {ticket.title}
                    </p>
                    <p className={cn(
                      "text-xs truncate",
                      unreadCount > 0 ? "font-bold text-gray-900" : "text-gray-500"
                    )}>
                      {lastMessage ? lastMessage.text : 'No messages yet.'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col bg-white min-w-0 transition-all",
        !selectedTicketId ? "hidden md:flex" : "flex"
      )}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4 bg-white shadow-sm z-10">
              <button 
                onClick={() => setSelectedTicketId(null)}
                className="md:hidden rounded-full p-2 -ml-2 hover:bg-gray-100 text-gray-500"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                {role === 'CLIENT' ? 'A' : selectedConversation.ticket.clientName.charAt(0)}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-gray-900 truncate">
                  {role === 'CLIENT' ? 'Support Center' : selectedConversation.ticket.clientName}
                </h3>
                <p className="text-xs text-gray-500 truncate">
                  Ticket #{selectedConversation.ticket.id.slice(-4)}: {selectedConversation.ticket.title}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
              {selectedConversation.messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-50">
                  <MessageSquare className="h-12 w-12 text-gray-400" />
                  <p className="text-sm text-gray-500">No messages yet.<br/>Send a message to start the conversation.</p>
                </div>
              ) : (
                selectedConversation.messages.map((msg) => {
                  if (msg.isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center">
                        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2 text-center max-w-md shadow-sm">
                          <div className="flex items-center justify-center gap-2 text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">
                            <Shield className="h-3 w-3" />
                            System Notification
                          </div>
                          <p className="text-xs text-amber-900 font-medium">{msg.text}</p>
                          <span className="text-[9px] text-amber-500 mt-1 block">{formatTime(msg.timestamp)}</span>
                        </div>
                      </div>
                    );
                  }

                  const isMe = msg.senderId === currentUser.id;
                  return (
                    <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-[10px] font-bold text-gray-500">
                          {isMe ? 'You' : (msg.senderRole === 'ADMIN' ? 'Support' : msg.senderRole === 'TECHNICIAN' ? 'Technician' : 'Client')}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                      <div className={cn(
                        "max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                        isMe ? "bg-blue-600 text-white rounded-tr-none" : "bg-white border border-gray-100 text-gray-800 rounded-tl-none"
                      )}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="border-t border-gray-100 p-4 bg-white">
              <div className="flex items-center gap-2 max-w-4xl mx-auto">
                <input 
                  type="text" 
                  placeholder="Type a message..." 
                  className="flex-1 rounded-full border-gray-200 bg-gray-50 px-6 py-3 text-sm focus:ring-blue-500"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-100 active:scale-95 transition-transform disabled:opacity-50 disabled:shadow-none"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 bg-gray-50/30">
            <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-200">
              <MessageSquare className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Your Messages</h3>
              <p className="text-sm text-gray-500 mt-1">Select a conversation to view messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
