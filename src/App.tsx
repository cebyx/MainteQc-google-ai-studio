import React, { useState } from 'react';
import { AppProvider, useApp } from './AppContext';
import { Layout } from './components/Layout';
import { RoleSwitcher } from './components/RoleSwitcher';
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

const AppContent: React.FC = () => {
  const { role } = useApp();
  const [activeTab, setActiveTab] = useState(role === 'TECHNICIAN' ? 'today' : 'dashboard');

  // Reset tab when role changes to ensure valid tab for role
  React.useEffect(() => {
    setActiveTab(role === 'TECHNICIAN' ? 'today' : 'dashboard');
  }, [role]);

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
      {renderContent()}
      <RoleSwitcher />
    </Layout>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
