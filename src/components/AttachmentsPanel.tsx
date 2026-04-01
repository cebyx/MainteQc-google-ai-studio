import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { Paperclip, X, Eye, EyeOff, Trash2, Download, FileText, Image as ImageIcon, Plus, Loader2 } from 'lucide-react';
import { Attachment, AttachmentCategory } from '../types';
import { cn, formatDate } from '../lib/utils';

interface AttachmentsPanelProps {
  ticketId: string;
  allowUpload?: boolean;
}

export const AttachmentsPanel: React.FC<AttachmentsPanelProps> = ({ ticketId, allowUpload = true }) => {
  const { attachments, uploadAttachment, deleteAttachment, updateAttachmentVisibility, role } = useApp();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<AttachmentCategory>('technician_upload');
  const [uploadVisibility, setUploadVisibility] = useState<'internal' | 'client'>('client');

  const ticketAttachments = attachments.filter(a => a.ticketId === ticketId);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await uploadAttachment(ticketId, file, uploadCategory, uploadVisibility);
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Paperclip className="w-4 h-4" />
          Attachments ({ticketAttachments.length})
        </h3>
        
        {allowUpload && (
          <div className="flex items-center gap-2">
            <select 
              className="text-xs border rounded p-1"
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value as AttachmentCategory)}
            >
              <option value="technician_upload">General Upload</option>
              <option value="before_photo">Before Photo</option>
              <option value="work_photo">Work Photo</option>
              <option value="after_photo">After Photo</option>
              <option value="service_document">Service Document</option>
            </select>
            
            <label className={cn(
              "flex items-center gap-1 text-xs bg-primary text-white px-2 py-1 rounded cursor-pointer hover:bg-primary/90 transition-colors",
              isUploading && "opacity-50 cursor-not-allowed"
            )}>
              {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              Upload
              <input 
                type="file" 
                className="hidden" 
                onChange={handleFileChange} 
                disabled={isUploading}
              />
            </label>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ticketAttachments.length === 0 ? (
          <p className="text-xs text-muted-foreground italic col-span-full py-4 text-center border border-dashed rounded-lg">
            No attachments yet.
          </p>
        ) : (
          ticketAttachments.map((attachment) => (
            <div 
              key={attachment.id} 
              className="flex items-center justify-between p-2 border rounded-lg bg-card hover:bg-accent/50 transition-colors group"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="p-1.5 bg-muted rounded">
                  {getFileIcon(attachment.fileType)}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-medium truncate max-w-[150px]" title={attachment.fileName}>
                    {attachment.fileName}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {attachment.category.replace('_', ' ')} • {formatDate(attachment.timestamp)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a 
                  href={attachment.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-1 hover:bg-muted rounded transition-colors"
                  title="View/Download"
                >
                  <Download className="w-3.5 h-3.5 text-muted-foreground" />
                </a>

                {(role === 'ADMIN' || role === 'TECHNICIAN') && (
                  <>
                    <button
                      onClick={() => updateAttachmentVisibility(attachment.id, attachment.visibility === 'client' ? 'internal' : 'client')}
                      className="p-1 hover:bg-muted rounded transition-colors"
                      title={attachment.visibility === 'client' ? "Visible to Client" : "Internal Only"}
                    >
                      {attachment.visibility === 'client' ? (
                        <Eye className="w-3.5 h-3.5 text-blue-500" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this attachment?')) {
                          deleteAttachment(attachment.id);
                        }
                      }}
                      className="p-1 hover:bg-muted rounded transition-colors text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
