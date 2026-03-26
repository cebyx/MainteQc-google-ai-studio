import React from 'react';
import { useApp } from '../AppContext';
import { MessageSquare, Send, User, Shield, Wrench } from 'lucide-react';
import { cn, formatDate, formatTime } from '../lib/utils';

export const MessagesView: React.FC = () => {
  const { messages, currentUser, role, addMessage } = useApp();
  const [newMessage, setNewMessage] = React.useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    addMessage({
      senderId: currentUser.id,
      senderRole: role,
      recipientId: role === 'ADMIN' ? 'c1' : 'admin',
      recipientRole: role === 'ADMIN' ? 'CLIENT' : 'ADMIN',
      text: newMessage,
    });
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
            {role === 'ADMIN' ? 'C' : 'A'}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              {role === 'ADMIN' ? 'John Smith (Client)' : 'Support Center (Admin)'}
            </h3>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold uppercase tracking-widest">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              Online
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;
          return (
            <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
              <div className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                isMe ? "bg-blue-600 text-white rounded-tr-none" : "bg-gray-100 text-gray-800 rounded-tl-none"
              )}>
                {msg.text}
              </div>
              <div className="mt-1 flex items-center gap-1 text-[10px] text-gray-400">
                {formatTime(msg.timestamp)}
                {isMe && <span className="text-blue-400">Sent</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="border-t border-gray-100 p-4 bg-white">
        <div className="flex items-center gap-2">
          <input 
            type="text" 
            placeholder="Type a message..." 
            className="flex-1 rounded-full border-gray-200 bg-gray-50 px-6 py-3 text-sm focus:ring-blue-500"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button 
            type="submit"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-100 active:scale-95 transition-transform"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
};
