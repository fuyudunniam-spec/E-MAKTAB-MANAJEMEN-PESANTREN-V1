import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  Printer, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  X,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DocumentPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: {
    url?: string;
    name?: string;
    type?: string;
    size?: number;
  } | null;
}

const DocumentPreviewDialog: React.FC<DocumentPreviewDialogProps> = ({ 
  open, 
  onOpenChange, 
  file 
}) => {
  const [zoom, setZoom] = useState(100);

  if (!file) return null;

  const isPDF = file.type?.includes('pdf') || file.name?.toLowerCase().endsWith('.pdf');
  const isImage = file.type?.includes('image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name || '');
  
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handlePrint = () => {
    if (file.url) {
      const w = window.open(file.url);
      if (w) {
        w.print();
      }
    }
  };

  const fileSize = file.size 
    ? (file.size / 1024 / 1024).toFixed(2) + ' MB'
    : 'Unknown size';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0 bg-slate-50">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isPDF ? 'bg-red-50' : 'bg-blue-50'}`}>
              {isPDF ? <FileText className="w-5 h-5 text-red-600" /> : <ImageIcon className="w-5 h-5 text-blue-600" />}
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-slate-900 truncate max-w-md" title={file.name}>
                {file.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 flex items-center gap-2">
                <span>{fileSize}</span>
                <span>•</span>
                <span className="uppercase">{file.type?.split('/')[1] || 'FILE'}</span>
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 mr-2">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomOut} disabled={zoom <= 50}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-xs font-medium w-10 text-center">{zoom}%</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomIn} disabled={zoom >= 200}>
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
            
            <Button variant="outline" size="sm" className="h-8 gap-2" onClick={handlePrint} disabled={!file.url}>
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </Button>
            
            {file.url && (
              <Button variant="default" size="sm" className="h-8 gap-2 bg-slate-900 hover:bg-slate-800" asChild>
                <a href={file.url} download={file.name} target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download</span>
                </a>
              </Button>
            )}

            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 ml-2 text-slate-500 hover:text-slate-900">
                <X className="w-5 h-5" />
              </Button>
            </DialogClose>
          </div>
        </div>

        {/* Content Preview */}
        <div className="flex-1 overflow-auto bg-slate-200/50 relative flex items-center justify-center p-4">
          <div 
            className="bg-white shadow-lg transition-all duration-200 ease-in-out origin-top"
            style={{ 
              width: isPDF ? '100%' : 'auto', 
              height: isPDF ? '100%' : 'auto',
              maxWidth: isPDF ? 'none' : `${zoom}%`,
              transform: isPDF ? 'none' : undefined // Zoom handles image size directly
            }}
          >
            {isPDF ? (
              <iframe 
                src={file.url + '#toolbar=0'} 
                className="w-full h-full"
                title="PDF Preview"
              />
            ) : isImage ? (
              <img 
                src={file.url} 
                alt={file.name} 
                className="max-w-full h-auto object-contain"
                style={{ width: '100%' }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-10 text-slate-400">
                <FileText className="w-16 h-16 mb-4 opacity-50" />
                <p>Preview tidak tersedia untuk format file ini</p>
                <Button variant="link" asChild className="mt-2">
                  <a href={file.url} download>Download untuk melihat</a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreviewDialog;
