import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  MoreVertical, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Search,
  Filter,
  Trash2,
  Settings
} from 'lucide-react';
import { useApp } from '../../AppContext';
import { ClientMember, ClientAccount } from '../../types';
import ClientMembersPanel from './ClientMembersPanel';

const ClientTeamView: React.FC = () => {
  const { 
    clientAccount, 
    clientMembers, 
    clientInvitations, 
    loading, 
    inviteClientMember, 
    resendInvitation, 
    revokeInvitation,
    clients,
    role: userRole
  } = useApp();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ClientMember | undefined>(undefined);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!clientAccount) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-gray-200 shadow-sm">
        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">No Client Account Found</h2>
        <p className="text-gray-500 max-w-md mx-auto">
          Your profile is not currently associated with a client account. Please contact support if you believe this is an error.
        </p>
      </div>
    );
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'admin': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'member': return 'bg-green-100 text-green-700 border-green-200';
      case 'viewer': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-200';
      case 'invited': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'deactivated': return 'bg-red-100 text-red-700 border-red-200';
      case 'accepted': return 'bg-green-100 text-green-700 border-green-200';
      case 'revoked': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'expired': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'invited':
      case 'pending': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'deactivated': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const accountOwner = clients.find(c => c.id === clientAccount.ownerId);
  const activeMembers = clientMembers.filter(m => m.status === 'active');
  const pendingInvites = clientInvitations.filter(inv => inv.accountId === clientAccount.id && inv.status === 'pending');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{clientAccount.name} Team</h1>
          <p className="text-gray-500">Manage your organization's members and their access levels.</p>
        </div>
        <button
          onClick={() => {
            setSelectedMember(undefined);
            setIsPanelOpen(true);
          }}
          className="flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Member</span>
        </button>
      </div>

      {/* Account Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Account Owner</div>
          <div className="font-bold text-gray-900 truncate">{accountOwner?.fullName || 'Unknown'}</div>
          <div className="text-xs text-gray-500 truncate">{accountOwner?.email || 'No email'}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Active Members</div>
          <div className="text-2xl font-bold text-gray-900">{activeMembers.length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Pending Invites</div>
          <div className="text-2xl font-bold text-gray-900">{pendingInvites.length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Account Status</div>
          <div className="mt-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadgeColor(clientAccount.status)}`}>
              {clientAccount.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Team Members</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{clientMembers.length} Members</span>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200">
              {clientMembers.map((member) => {
                const memberInfo = clients.find(c => c.id === member.clientId);
                return (
                  <div key={member.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                        {(memberInfo?.fullName || '??').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{memberInfo?.fullName || `Member ${member.clientId.substring(0, 4)}`}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getRoleBadgeColor(member.role)}`}>
                            {member.role}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Mail className="w-3 h-3" />
                            {memberInfo?.email || 'No email'}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            {getStatusIcon(member.status)}
                            <span className="capitalize">{member.status}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setSelectedMember(member);
                          setIsPanelOpen(true);
                        }}
                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                        title="Member Settings"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
              
              {pendingInvites.map((invitation) => (
                <div key={invitation.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group bg-amber-50/30">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold border border-amber-200">
                      {invitation.email.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{invitation.email}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getRoleBadgeColor(invitation.role)}`}>
                          {invitation.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Mail className="w-3 h-3" />
                          Invitation Sent
                        </div>
                        <div className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                          <Clock className="w-3 h-3" />
                          <span>Pending Acceptance</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => resendInvitation(invitation.id)}
                      className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                      title="Resend Invitation"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => revokeInvitation(invitation.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Revoke Invitation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {clientMembers.length === 0 && pendingInvites.length === 0 && (
                <div className="p-12 text-center">
                  <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500">No team members yet. Start by inviting someone!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Role Permissions
            </h3>
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-purple-50 border border-purple-100">
                <div className="font-bold text-purple-900 text-sm">Owner</div>
                <p className="text-xs text-purple-700 mt-1">Full access to account settings, billing, and team management.</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                <div className="font-bold text-blue-900 text-sm">Admin</div>
                <p className="text-xs text-blue-700 mt-1">Can manage team members, properties, and all service requests.</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                <div className="font-bold text-green-900 text-sm">Member</div>
                <p className="text-xs text-green-700 mt-1">Can create and view service requests for assigned properties.</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className="font-bold text-gray-900 text-sm">Viewer</div>
                <p className="text-xs text-gray-700 mt-1">Read-only access to service history and documents.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isPanelOpen && (
        <ClientMembersPanel
          member={selectedMember}
          onClose={() => setIsPanelOpen(false)}
        />
      )}
    </div>
  );
};

export default ClientTeamView;
