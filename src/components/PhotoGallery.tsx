import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { Image as ImageIcon, Camera, Maximize2, X, ChevronLeft, ChevronRight, Clock, User, Trash2 } from 'lucide-react';
import { Attachment } from '../types';
import { cn, formatDate } from '../lib/utils';

interface PhotoGalleryProps {
  ticketId: string;
  allowUpload?: boolean;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ ticketId, allowUpload = true }) => {
  const { attachments, deleteAttachment, role, currentUser } = useApp();
  const [selectedPhoto, setSelectedPhoto] = useState<Attachment | null>(null);

  const photos = attachments.filter(a => 
    a.ticketId === ticketId && 
    a.fileType.startsWith('image/') &&
    ['before_photo', 'work_photo', 'after_photo', 'technician_upload'].includes(a.category)
  );

  const beforePhotos = photos.filter(p => p.category === 'before_photo');
  const afterPhotos = photos.filter(p => p.category === 'after_photo');
  const otherPhotos = photos.filter(p => p.category !== 'before_photo' && p.category !== 'after_photo');

  const PhotoCard = ({ photo }: { photo: Attachment }) => (
    <div 
      className="relative group aspect-square rounded-xl overflow-hidden border bg-muted/20 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
      onClick={() => setSelectedPhoto(photo)}
    >
      <img 
        src={photo.url} 
        alt={photo.fileName} 
        className="w-full h-full object-cover transition-transform group-hover:scale-105"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <Maximize2 className="w-6 h-6 text-white" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-black/60 backdrop-blur-sm">
        <p className="text-[9px] text-white font-medium truncate uppercase tracking-wider">
          {photo.category.replace('_', ' ')}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Camera className="w-4 h-4" />
          Job Photos ({photos.length})
        </h3>
      </div>

      {photos.length === 0 ? (
        <div className="p-12 text-center border border-dashed rounded-2xl bg-muted/10">
          <ImageIcon className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground italic">No photos uploaded for this job yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Before/After Comparison if both exist */}
          {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground px-1">Before Photos</span>
                <div className="grid grid-cols-2 gap-2">
                  {beforePhotos.length > 0 ? (
                    beforePhotos.map(p => <PhotoCard key={p.id} photo={p} />)
                  ) : (
                    <div className="aspect-square rounded-xl border border-dashed flex items-center justify-center bg-muted/10">
                      <span className="text-[10px] text-muted-foreground italic">None</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground px-1">After Photos</span>
                <div className="grid grid-cols-2 gap-2">
                  {afterPhotos.length > 0 ? (
                    afterPhotos.map(p => <PhotoCard key={p.id} photo={p} />)
                  ) : (
                    <div className="aspect-square rounded-xl border border-dashed flex items-center justify-center bg-muted/10">
                      <span className="text-[10px] text-muted-foreground italic">None</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Other Photos */}
          {otherPhotos.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground px-1">General Job Photos</span>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {otherPhotos.map(p => <PhotoCard key={p.id} photo={p} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Photo Lightbox */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <button 
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="max-w-5xl w-full max-h-full flex flex-col items-center gap-4">
            <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden">
              <img 
                src={selectedPhoto.url} 
                alt={selectedPhoto.fileName} 
                className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="w-full max-w-2xl bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-white flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <span className="uppercase text-[10px] bg-primary px-1.5 py-0.5 rounded tracking-wider">
                    {selectedPhoto.category.replace('_', ' ')}
                  </span>
                  {selectedPhoto.fileName}
                </h4>
                <div className="flex items-center gap-4 text-[10px] text-white/60">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDate(selectedPhoto.timestamp)}</span>
                  <span className="flex items-center gap-1"><User className="w-3 h-3" /> Uploaded by {selectedPhoto.uploadedByRole}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a 
                  href={selectedPhoto.url} 
                  download 
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  title="Download"
                >
                  <ImageIcon className="w-5 h-5" />
                </a>
                {(role === 'ADMIN' || (role === 'TECHNICIAN' && selectedPhoto.uploadedById === currentUser.id)) && (
                  <button 
                    onClick={() => {
                      if (window.confirm('Delete this photo?')) {
                        deleteAttachment(selectedPhoto.id);
                        setSelectedPhoto(null);
                      }
                    }}
                    className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-500 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
