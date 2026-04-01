import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserPlus, 
  Mail, 
  Shield, 
  CheckCircle2, 
  AlertCircle,
  Save,
  Trash2,
  ChevronDown
} from 'lucide-react';
import { useApp } from '../../AppContext';
import { ClientMember, ClientAccount } from '../../types';

interface ClientMembersPanelProps {
  member?: ClientMember;
  onClose: () => void;
}

const ClientMembersPanel: React.FC<ClientMembersPanelProps> = ({ member, onClose }) => {
  const { clientAccount, createClientMember, updateClientMemberRole, removeClientMember } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<ClientMember>>(
    member || {
      clientId: '',
      role: 'member',
      status: 'invited'
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientAccount) return;

    if (!formData.clientId || !formData.role) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (member) {
        await updateClientMemberRole(member.id, formData.role as any);
      } else {
        await createClientMember({
          ...formData as Omit<ClientMember, 'id' | 'accountId' | 'addedAt'>,
          accountId: clientAccount.id
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save team member.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!member || !window.confirm('Are you sure you want to remove this member from your team?')) return;
    
    setLoading(true);
    try {
      await removeClientMember(member.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove team member.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">
            {member ? 'Edit Team Member' : 'Invite Team Member'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Member Email or User ID *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  disabled={!!member}
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  placeholder="Enter email or user ID"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
              {!member && (
                <p className="text-xs text-gray-500">
                  Enter the email address or user ID of the person you'd like to invite to your team.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Role *</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none"
                >
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {member && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-between">
                  <span className="text-sm text-gray-700 capitalize font-medium">{member.status}</span>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <CheckCircle2 className={`w-4 h-4 ${member.status === 'active' ? 'text-green-500' : 'text-gray-300'}`} />
                    <span>{member.status === 'active' ? 'Active' : 'Pending'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          {member && member.role !== 'owner' && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>Remove Member</span>
            </button>
          )}
          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-lg shadow-primary/20"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              <span>{member ? 'Update Role' : 'Send Invite'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientMembersPanel;
