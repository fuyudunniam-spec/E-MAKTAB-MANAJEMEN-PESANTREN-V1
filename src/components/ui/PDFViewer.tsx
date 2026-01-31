import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileText, Maximize2, Download, ExternalLink } from "lucide-react";

interface PDFViewerProps {
  pdfUrl: string;
  title: string;
}

export const PDFViewer = ({ pdfUrl, title }: PDFViewerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Check if it's a valid PDF URL
  const isPdfUrl = pdfUrl.toLowerCase().endsWith('.pdf') || 
                   pdfUrl.includes('pdf') || 
                   pdfUrl.startsWith('blob:');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <FileText className="w-4 h-4 mr-2" />
          Lihat Preview PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center justify-between pr-8">
            <span className="truncate">Preview: {title}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                asChild
                title="Buka di tab baru"
              >
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                asChild
                title="Download PDF"
              >
                <a href={pdfUrl} download>
                  <Download className="w-4 h-4" />
                </a>
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 px-4 pb-4 h-[calc(90vh-80px)]">
          {isPdfUrl ? (
            <iframe
              src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
              className="w-full h-full rounded-lg border"
              title={`Preview PDF: ${title}`}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-muted rounded-lg">
              <FileText className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center mb-4">
                Preview tidak tersedia dalam browser.<br />
                Klik tombol di bawah untuk melihat dokumen.
              </p>
              <Button asChild>
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Buka Dokumen
                </a>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
