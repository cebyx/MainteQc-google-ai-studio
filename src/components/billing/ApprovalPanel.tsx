import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  FileText, 
  User, 
  Calendar,
  ShieldCheck,
  PenTool,
  Clock,
  ArrowRight,
  Info
} from 'lucide-react';
import { useApp } from '../../AppContext';
import { Quote, ApprovalRecord } from '../../types';
import { format } from 'date-fns';

interface ApprovalPanelProps {
  quote: Quote;
  onClose: () => void;
}

const ApprovalPanel: React.FC<ApprovalPanelProps> = ({ quote, onClose }) => {
  const { approveQuoteWithAuthorization, loading } = useApp();
  const [error, setError] = useState<string | null>(null);
  const [signatureName, setSignatureName] = useState('');
  const [notes, setNotes] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);

  const handleApprove = async () => {
    if (!signatureName || !isAgreed) {
      setError('Please provide your signature and agree to the terms.');
      return;
    }

    try {
      await approveQuoteWithAuthorization(quote.id, {
        signatureName,
        notes,
        status: 'approved'
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve quote.');
    }
  };

  const handleDecline = async () => {
    if (!notes) {
      setError('Please provide a reason for declining the quote in the notes field.');
      return;
    }

    try {
      await approveQuoteWithAuthorization(quote.id, {
        signatureName: 'Declined by Client',
        notes,
        status: 'declined'
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline quote.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Quote Approval</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-bold mb-1">Review Quote Summary</p>
              <div className="flex justify-between mt-2">
                <span>Quote ID:</span>
                <span className="font-mono">{quote.id.substring(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-bold">${quote.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Full Name (Digital Signature) *</label>
              <div className="relative">
                <PenTool className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  placeholder="Type your full name to sign"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Notes / Comments</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes or feedback..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary/20"
              />
              <label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
                I have reviewed the quote and agree to the terms and conditions. I authorize the work to proceed as described.
              </label>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-4">
          <button
            onClick={handleDecline}
            disabled={loading}
            className="flex-1 px-4 py-2 text-red-600 font-medium hover:bg-red-50 rounded-lg transition-colors border border-red-100 disabled:opacity-50"
          >
            Decline Quote
          </button>
          <button
            onClick={handleApprove}
            disabled={loading || !isAgreed || !signatureName}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 shadow-lg shadow-green-600/20"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Approve & Authorize</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApprovalPanel;
