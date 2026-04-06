import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Shield,
  Building2,
  Mail
} from 'lucide-react';
import { useApp } from '../../AppContext';
import { ClientInvitation } from '../../types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

interface InviteAcceptanceViewProps {
  token: string;
  onComplete: () => void;
}

const InviteAcceptanceView: React.FC<InviteAcceptanceViewProps> = ({ token, onComplete }) => {
  const { activateClientMember, currentUser, clientAccounts } = useApp();
  const [invitation, setInvitation] = useState<ClientInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        const q = query(collection(db, 'clientInvitations'), where('token', '==', token), where('status', '==', 'pending'));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          setError('This invitation link is invalid or has already been used.');
          return;
        }

        setInvitation({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as ClientInvitation);
      } catch (err) {
        setError('Failed to load invitation details.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  const handleAccept = async () => {
    setProcessing(true);
    setError(null);
    try {
      await activateClientMember(token);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-500">Verifying invitation...</p>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="max-w-md mx-auto mt-12 p-8 bg-white rounded-2xl shadow-xl border border-gray-100 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Invitation Error</h2>
        <p className="text-gray-600 mb-8">{error || 'Something went wrong.'}</p>
        <button
          onClick={onComplete}
          className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const account = clientAccounts.find(a => a.id === invitation.accountId);

  return (
    <div className="max-w-xl mx-auto mt-12 p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <UserPlus className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Team Invitation</h2>
        <p className="text-gray-600">
          You've been invited to join <span className="font-bold text-primary">{account?.name || 'an organization'}</span> on MainteQc.
        </p>
      </div>

      <div className="space-y-6 mb-8">
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Building2 className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Organization</div>
              <div className="font-bold text-gray-900">{account?.name || 'MainteQc Client'}</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Shield className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Role</div>
              <div className="font-bold text-gray-900 capitalize">{invitation.role}</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Mail className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Invited Email</div>
              <div className="font-bold text-gray-900">{invitation.email}</div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3">
          <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            By accepting this invitation, you will gain access to this organization's properties, service requests, and records according to your assigned role.
          </div>
        </div>
      </div>

      <button
        onClick={handleAccept}
        disabled={processing}
        className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {processing ? (
          <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <span>Accept Invitation & Join Team</span>
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
      
      <p className="text-center text-xs text-gray-400 mt-6">
        Logged in as: <span className="font-medium">{currentUser.email}</span>
      </p>
    </div>
  );
};

export default InviteAcceptanceView;
