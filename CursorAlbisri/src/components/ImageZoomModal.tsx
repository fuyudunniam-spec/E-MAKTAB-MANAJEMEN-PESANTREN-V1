import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { ZoomIn, ZoomOut, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageZoomModalProps {
  src: string;
  alt: string;
  children: React.ReactNode;
}

export function ImageZoomModal({ src, alt, children }: ImageZoomModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(1);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const resetZoom = () => setScale(1);

  const handleClose = () => {
    setIsOpen(false);
    resetZoom();
  };

  return (
    <>
      <div 
        onClick={() => setIsOpen(true)} 
        className="cursor-zoom-in"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setIsOpen(true)}
      >
        {children}
      </div>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl w-full h-[90vh] p-0 overflow-hidden bg-background/95 backdrop-blur-sm">
          <VisuallyHidden>
            <DialogTitle>{alt}</DialogTitle>
          </VisuallyHidden>
          
          {/* Controls */}
          <div className="absolute top-4 right-4 z-50 flex gap-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
              className="h-8 w-8"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={handleZoomIn}
              disabled={scale >= 3}
              className="h-8 w-8"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Zoom level indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-background/80 px-3 py-1 rounded-full text-sm text-muted-foreground">
            {Math.round(scale * 100)}%
          </div>

          {/* Image container with scrollable area */}
          <div className="w-full h-full overflow-auto flex items-center justify-center p-8">
            <img
              src={src}
              alt={alt}
              className="max-w-none transition-transform duration-200"
              style={{ transform: `scale(${scale})` }}
              onClick={(e) => {
                e.stopPropagation();
                if (scale < 2) handleZoomIn();
                else handleZoomOut();
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}