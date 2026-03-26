import React, { useState } from 'react';
import { AppProvider, useApp } from './AppContext';
import { Layout } from './components/Layout';
import { AdminDashboard } from './components/AdminDashboard';
import { TechnicianDashboard } from './components/TechnicianDashboard';
import { ClientDashboard } from './components/ClientDashboard';
import { DispatchBoard } from './components/DispatchBoard';
import { RequestForm } from './components/RequestForm';
import { BillingView } from './components/BillingView';
import { BrandSettingsView } from './components/BrandSettingsView';
import { MessagesView } from './components/MessagesView';
import { ClientsListView } from './components/ClientsListView';
import { PropertiesListView } from './components/PropertiesListView';
import { TechniciansListView } from './components/TechniciansListView';
import { ScheduleView } from './components/ScheduleView';
import { MyJobsView } from './components/MyJobsView';
import { AppointmentsListView } from './components/AppointmentsListView';
import { ServiceHistoryView } from './components/ServiceHistoryView';
import { ProfileView } from './components/ProfileView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Shield, Wrench, User, LogIn, LogOut } from 'lucide-react';

const AppContent: React.FC = () => {
  const { role, setRole, currentUser, login, logout, isAuthReady } = useApp();
  const [activeTab, setActiveTab] = useState(role === 'TECHNICIAN' ? 'today' : 'dashboard');

  // Reset tab when role changes to ensure valid tab for role
  React.useEffect(() => {
    setActiveTab(role === 'TECHNICIAN' ? 'today' : 'dashboard');
  }, [role]);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Welcome to MainteQC</h1>
          <p className="text-gray-500 mb-8">Please sign in to access your dashboard.</p>
          <button
            onClick={login}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl py-3 font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            <LogIn className="h-5 w-5" />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (role === 'ADMIN') {
      switch (activeTab) {
        case 'dashboard': return <AdminDashboard setActiveTab={setActiveTab} />;
        case 'dispatch': return <DispatchBoard />;
        case 'schedule': return <ScheduleView />;
        case 'clients': return <ClientsListView />;
        case 'properties': return <PropertiesListView />;
        case 'technicians': return <TechniciansListView />;
        case 'messages': return <MessagesView />;
        case 'billing': return <BillingView />;
        case 'brand': return <BrandSettingsView />;
        default: return <AdminDashboard setActiveTab={setActiveTab} />;
      }
    }
    
    if (role === 'TECHNICIAN') {
      switch (activeTab) {
        case 'today': return <TechnicianDashboard />;
        case 'my-jobs': return <MyJobsView />;
        case 'messages': return <MessagesView />;
        case 'profile': return <ProfileView />;
        default: return <TechnicianDashboard />;
      }
    }
    
    if (role === 'CLIENT') {
      switch (activeTab) {
        case 'dashboard': return <ClientDashboard setActiveTab={setActiveTab} />;
        case 'request': return <RequestForm onSuccess={() => setActiveTab('dashboard')} />;
        case 'appointments': return <AppointmentsListView setActiveTab={setActiveTab} />;
        case 'history': return <ServiceHistoryView />;
        case 'billing': return <BillingView />;
        case 'messages': return <MessagesView />;
        case 'profile': return <ProfileView />;
        default: return <ClientDashboard setActiveTab={setActiveTab} />;
      }
    }

    return null;
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="mb-6 flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Demo Role:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setRole('ADMIN')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-bold transition-all ${role === 'ADMIN' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Shield className="h-4 w-4" /> Admin
              </button>
              <button
                onClick={() => setRole('TECHNICIAN')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-bold transition-all ${role === 'TECHNICIAN' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Wrench className="h-4 w-4" /> Tech
              </button>
              <button
                onClick={() => setRole('CLIENT')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-bold transition-all ${role === 'CLIENT' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <User className="h-4 w-4" /> Client
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            Signed in as <span className="font-bold text-gray-900">{currentUser.fullName}</span>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-1 text-sm font-bold text-red-600 hover:text-red-700"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
      {renderContent()}
    </Layout>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
