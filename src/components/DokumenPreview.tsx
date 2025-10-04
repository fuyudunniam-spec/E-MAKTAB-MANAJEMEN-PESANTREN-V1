import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  X, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  FileText, 
  Image as ImageIcon,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

interface DokumenPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentUrl: string;
  mimeType: string;
  originalName: string;
  statusValidasi: string;
  version?: number;
  tanggalUpload?: string;
  catatan?: string;
  onVerify?: (documentId: string, status: string, catatan?: string) => void;
  canVerify?: boolean;
}

const DokumenPreview: React.FC<DokumenPreviewProps> = ({
  isOpen,
  onClose,
  documentId,
  documentUrl,
  mimeType,
  originalName,
  statusValidasi,
  version,
  tanggalUpload,
  catatan,
  onVerify,
  canVerify = false
}) => {
  const [signedUrl, setSignedUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState(statusValidasi);
  const [verificationNote, setVerificationNote] = useState(catatan || '');

  useEffect(() => {
    if (isOpen && documentUrl) {
      generateSignedUrl();
    }
  }, [isOpen, documentUrl]);

  const generateSignedUrl = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Extract file path from URL
      const url = new URL(documentUrl);
      const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/santri-documents\/(.+)/);
      
      if (!pathMatch) {
        throw new Error('Invalid document URL');
      }

      const filePath = pathMatch[1];

      // Generate signed URL (valid for 1 hour)
      const { data, error: signError } = await supabase.storage
        .from('santri-documents')
        .createSignedUrl(filePath, 3600); // 1 hour

      if (signError) throw signError;

      setSignedUrl(data.signedUrl);
    } catch (error) {
      console.error('Error generating signed URL:', error);
      setError('Gagal memuat dokumen');
    } finally {
      setIsLoading(false);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = signedUrl || documentUrl;
    link.download = originalName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleVerify = (status: string) => {
    if (onVerify) {
      onVerify(documentId, status, verificationNote);
      setVerificationStatus(status);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Valid':
        return <Badge className="bg-green-100 text-green-800">Valid</Badge>;
      case 'Perlu Perbaikan':
        return <Badge className="bg-yellow-100 text-yellow-800">Perlu Perbaikan</Badge>;
      case 'Tidak Valid':
        return <Badge className="bg-red-100 text-red-800">Tidak Valid</Badge>;
      default:
        return <Badge variant="outline">Belum Diverifikasi</Badge>;
    }
  };

  const isImage = mimeType.startsWith('image/');
  const isPDF = mimeType === 'application/pdf';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isImage ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
              <span>{originalName}</span>
              {getStatusBadge(verificationStatus)}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full">
          {/* Document Info */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg mb-4">
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="font-medium">Versi:</span> {version || 1}
              </div>
              {tanggalUpload && (
                <div className="text-sm">
                  <span className="font-medium">Upload:</span> {new Date(tanggalUpload).toLocaleString()}
                </div>
              )}
              <div className="text-sm">
                <span className="font-medium">Ukuran:</span> {mimeType}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm" onClick={generateSignedUrl}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Viewer Controls */}
          {isImage && (
            <div className="flex items-center justify-between p-2 bg-muted rounded-lg mb-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleZoomOut}>
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium">{zoom}%</span>
                <Button variant="outline" size="sm" onClick={handleZoomIn}>
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleRotate}>
                  <RotateCw className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAnnotations(!showAnnotations)}
                >
                  {showAnnotations ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {showAnnotations ? 'Sembunyikan' : 'Tampilkan'} Anotasi
                </Button>
              </div>
            </div>
          )}

          {/* Document Viewer */}
          <div className="flex-1 bg-gray-50 rounded-lg overflow-hidden relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span>Memuat dokumen...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Alert className="max-w-md">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            )}

            {!isLoading && !error && signedUrl && (
              <>
                {isImage && (
                  <div className="h-full flex items-center justify-center p-4">
                    <img
                      src={signedUrl}
                      alt={originalName}
                      className="max-w-full max-h-full object-contain shadow-lg rounded"
                      style={{
                        transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                        transition: 'transform 0.3s ease'
                      }}
                    />
                    
                    {/* Annotations overlay */}
                    {showAnnotations && (
                      <div className="absolute top-4 left-4 right-4">
                        <div className="bg-black/50 text-white p-2 rounded text-sm">
                          <div className="flex items-center justify-between">
                            <span>Dokumen: {originalName}</span>
                            <span>Zoom: {zoom}%</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {isPDF && (
                  <iframe
                    src={signedUrl}
                    className="w-full h-full border-0"
                    title={originalName}
                  />
                )}

                {!isImage && !isPDF && (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600 mb-4">Preview tidak tersedia untuk tipe file ini</p>
                      <Button onClick={handleDownload}>
                        <Download className="w-4 h-4 mr-2" />
                        Download File
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Verification Section */}
          {canVerify && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-3">Verifikasi Dokumen</h4>
              
              <div className="flex items-center gap-4 mb-3">
                <Button
                  variant={verificationStatus === 'Valid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleVerify('Valid')}
                >
                  Valid
                </Button>
                <Button
                  variant={verificationStatus === 'Perlu Perbaikan' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleVerify('Perlu Perbaikan')}
                >
                  Perlu Perbaikan
                </Button>
                <Button
                  variant={verificationStatus === 'Tidak Valid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleVerify('Tidak Valid')}
                >
                  Tidak Valid
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Catatan Verifikasi:</label>
                <textarea
                  className="w-full p-2 border rounded-md text-sm"
                  rows={3}
                  value={verificationNote}
                  onChange={(e) => setVerificationNote(e.target.value)}
                  placeholder="Tambahkan catatan verifikasi (opsional)"
                />
              </div>
            </div>
          )}

          {/* Existing Notes */}
          {catatan && !canVerify && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium mb-2">Catatan Verifikasi:</h4>
              <p className="text-sm text-gray-700">{catatan}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DokumenPreview;
