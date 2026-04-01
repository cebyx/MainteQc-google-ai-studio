import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { 
  LayoutDashboard, 
  Calendar, 
  ClipboardList, 
  Users, 
  User,
  MapPin, 
  HardHat, 
  MessageSquare, 
  FileText, 
  Settings, 
  Menu, 
  X,
  Bell,
  LogOut,
  Search,
  Plus,
  BarChart3,
  Zap,
  Wrench,
  Clock
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarItemProps {
  icon: any;
  label: string;
  active?: boolean;
  onClick: () => void;
  collapsed?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, active, onClick, collapsed }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200",
      active 
        ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
        : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
    )}
  >
    <Icon className={cn("h-5 w-5 shrink-0", active ? "text-white" : "text-gray-500")} />
    {!collapsed && <span className="text-sm font-medium">{label}</span>}
  </button>
);

export const Layout: React.FC<{ children: React.ReactNode; activeTab: string; setActiveTab: (tab: string) => void }> = ({ children, activeTab, setActiveTab }) => {
  const { role, brand, currentUser } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const adminNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'dispatch', label: 'Dispatch', icon: ClipboardList },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'maintenance', label: 'Maintenance Plans', icon: Wrench },
    { id: 'recurring', label: 'Recurring Queue', icon: Clock },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'records', label: 'Records Hub', icon: Zap },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'properties', label: 'Properties', icon: MapPin },
    { id: 'technicians', label: 'Technicians', icon: HardHat },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'billing', label: 'Quotes & Invoices', icon: FileText },
    { id: 'brand', label: 'Brand Settings', icon: Settings },
  ];

  const techNav = [
    { id: 'today', label: 'Today', icon: Calendar },
    { id: 'my-jobs', label: 'My Jobs', icon: ClipboardList },
    { id: 'records', label: 'Records Hub', icon: Zap },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const clientNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'request', label: 'Request Service', icon: Plus },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'history', label: 'History', icon: ClipboardList },
    { id: 'team', label: 'My Team', icon: Users },
    { id: 'documents', label: 'Records Hub', icon: Zap },
    { id: 'billing', label: 'Billing', icon: FileText },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const navItems = role === 'ADMIN' ? adminNav : role === 'TECHNICIAN' ? techNav : clientNav;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-gray-900">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-gray-100 px-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xl">M</div>
            <span className="text-lg font-bold tracking-tight text-gray-900">{brand.companyName}</span>
          </div>
        </div>
        
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map((item) => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
            />
          ))}
        </nav>

        <div className="border-t border-gray-100 p-4">
          <div className="flex items-center gap-3 rounded-lg p-2">
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
              {currentUser.fullName.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="truncate text-sm font-semibold">{currentUser.fullName}</div>
              <div className="truncate text-xs text-gray-500">{role}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Nav */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-md"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-bold text-gray-900 lg:text-xl">
              {navItems.find(i => i.id === activeTab)?.label || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="h-9 w-64 rounded-full border-gray-200 bg-gray-50 pl-9 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500"></span>
            </button>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs lg:hidden">
              {currentUser.fullName.charAt(0)}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-white lg:hidden"
            >
              <div className="flex h-16 items-center justify-between border-b border-gray-100 px-6">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xl">M</div>
                  <span className="text-lg font-bold tracking-tight text-gray-900">{brand.companyName}</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-gray-500">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <nav className="space-y-1 p-4">
                {navItems.map((item) => (
                  <SidebarItem
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    active={activeTab === item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                  />
                ))}
              </nav>
              <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 p-4">
                <button className="flex w-full items-center gap-3 rounded-lg p-2 text-red-600 hover:bg-red-50">
                  <LogOut className="h-5 w-5" />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
