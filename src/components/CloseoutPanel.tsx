import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { ClipboardCheck, Save, CheckCircle, AlertTriangle, Clock, User, FileText, Download, Loader2 } from 'lucide-react';
import { ServiceSummary, Ticket } from '../types';
import { cn, formatDate } from '../lib/utils';

interface CloseoutPanelProps {
  ticket: Ticket;
  allowEdit?: boolean;
}

export const CloseoutPanel: React.FC<CloseoutPanelProps> = ({ ticket, allowEdit = true }) => {
  const { serviceSummaries, saveServiceSummary, updateServiceSummary, role, currentUser } = useApp();
  const [isSaving, setIsSaving] = useState(false);
  const [summary, setSummary] = useState<Omit<ServiceSummary, 'id' | 'completionTimestamp' | 'completedById' | 'completedByName' | 'timestamp' | 'materialsUsed'>>({
    ticketId: ticket.id,
    summary: '',
    workPerformed: '',
    followUpNeeded: false,
    recommendedNextSteps: '',
    clientVisibleNotes: '',
    isSharedWithClient: true
  });

  const existingSummary = serviceSummaries.find(s => s.ticketId === ticket.id);

  useEffect(() => {
    if (existingSummary) {
      setSummary({
        ticketId: existingSummary.ticketId,
        summary: existingSummary.summary || '',
        workPerformed: existingSummary.workPerformed,
        followUpNeeded: existingSummary.followUpNeeded,
        recommendedNextSteps: existingSummary.recommendedNextSteps || '',
        clientVisibleNotes: existingSummary.clientVisibleNotes || '',
        isSharedWithClient: existingSummary.isSharedWithClient
      });
    }
  }, [existingSummary]);

  const handleSave = async () => {
    if (!summary.workPerformed) return;

    setIsSaving(true);
    try {
      if (existingSummary) {
        await updateServiceSummary(existingSummary.id, summary as Partial<ServiceSummary>);
      } else {
        await saveServiceSummary(summary as any);
      }
    } catch (error) {
      console.error("Failed to save summary", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!allowEdit && !existingSummary) {
    return (
      <div className="p-8 text-center border border-dashed rounded-xl bg-muted/20">
        <ClipboardCheck className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground italic">No service summary available for this ticket.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4" />
          Service Summary & Closeout
        </h3>
        
        {existingSummary && (
          <div className="flex items-center gap-2 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
            <CheckCircle className="w-3 h-3" />
            Completed {formatDate(existingSummary.completionTimestamp)}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block">Work Performed</label>
          <textarea 
            className="w-full text-sm p-3 border rounded-lg min-h-[120px] focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            placeholder="Describe exactly what was done during this visit..."
            value={summary.workPerformed}
            onChange={(e) => setSummary({ ...summary, workPerformed: e.target.value })}
            disabled={!allowEdit || isSaving}
          />
        </div>

        <div>
          <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block">Recommendations (Optional)</label>
          <textarea 
            className="w-full text-sm p-3 border rounded-lg min-h-[80px] focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            placeholder="Any future work or maintenance recommended?"
            value={summary.recommendedNextSteps}
            onChange={(e) => setSummary({ ...summary, recommendedNextSteps: e.target.value })}
            disabled={!allowEdit || isSaving}
          />
        </div>

        {allowEdit && (
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-dashed">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="clientVisible"
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                checked={summary.isSharedWithClient}
                onChange={(e) => setSummary({ ...summary, isSharedWithClient: e.target.checked })}
              />
              <label htmlFor="clientVisible" className="text-xs font-medium cursor-pointer">
                Share summary with client
              </label>
            </div>
            
            <button 
              onClick={handleSave}
              disabled={isSaving || !summary.workPerformed}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-primary/20"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {existingSummary ? 'Update Summary' : 'Complete Job & Save Summary'}
            </button>
          </div>
        )}

        {existingSummary && (
          <div className="p-4 bg-muted/20 rounded-xl border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Closeout Details</span>
              <button className="text-[10px] flex items-center gap-1 text-primary hover:underline">
                <Download className="w-3 h-3" />
                Download PDF Report
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Technician:</span>
                <span className="font-medium">{existingSummary.completedByName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Completed:</span>
                <span className="font-medium">{formatDate(existingSummary.completionTimestamp)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
