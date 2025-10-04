import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Download,
  Eye,
  Trash2,
  User,
  Clock,
  MessageSquare
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import DokumenPreview from './DokumenPreview';

interface DokumenData {
  id: string;
  kode_dokumen: string;
  nama_dokumen: string;
  url: string;
  mime: string;
  size: number;
  original_name: string;
  status_validasi: string;
  verifier?: string;
  tanggal_upload: string;
  catatan?: string;
  version: number;
  is_active: boolean;
}

interface VerifikasiHistory {
  id: string;
  action: string;
  performed_by: string;
  performed_at: string;
  old_status?: string;
  new_status?: string;
  catatan?: string;
}

interface DokumenVerifikasiProps {
  santriId: string;
  userRole?: string;
}

const DokumenVerifikasi: React.FC<DokumenVerifikasiProps> = ({
  santriId,
  userRole
}) => {
  const [documents, setDocuments] = useState<DokumenData[]>([]);
  const [verificationHistory, setVerificationHistory] = useState<VerifikasiHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<DokumenData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [verificationNote, setVerificationNote] = useState('');
  const [completeness, setCompleteness] = useState({
    total_required: 0,
    total_uploaded: 0,
    total_valid: 0,
    completeness_percentage: 0
  });

  const canVerify = userRole === 'admin';

  useEffect(() => {
    loadDocuments();
    loadCompleteness();
  }, [santriId]);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('dokumen_santri')
        .select('*')
        .eq('santri_id', santriId)
        .eq('is_active', true)
        .order('tanggal_upload', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Gagal memuat dokumen');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCompleteness = async () => {
    try {
      const { data, error } = await supabase
        .rpc('calculate_document_completeness', { santri_id_param: santriId });

      if (error) throw error;
      if (data && data.length > 0) {
        setCompleteness(data[0]);
      }
    } catch (error) {
      console.error('Error loading completeness:', error);
    }
  };

  const loadVerificationHistory = async (documentId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_document_verification_history', { dokumen_id_param: documentId });

      if (error) throw error;
      setVerificationHistory(data || []);
    } catch (error) {
      console.error('Error loading verification history:', error);
    }
  };

  const verifyDocument = async (documentId: string, status: string) => {
    try {
      const { data, error } = await supabase
        .rpc('verify_document', {
          dokumen_id: documentId,
          status_param: status,
          catatan_param: verificationNote || null
        });

      if (error) throw error;

      if (data.success) {
        toast.success('Dokumen berhasil diverifikasi');
        setVerificationNote('');
        loadDocuments();
        loadCompleteness();
      } else {
        toast.error(data.error || 'Gagal memverifikasi dokumen');
      }
    } catch (error) {
      console.error('Error verifying document:', error);
      toast.error('Gagal memverifikasi dokumen');
    }
  };

  const deleteDocument = async (documentId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus dokumen ini?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('dokumen_santri')
        .update({ is_active: false })
        .eq('id', documentId);

      if (error) throw error;

      toast.success('Dokumen berhasil dihapus');
      loadDocuments();
      loadCompleteness();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Gagal menghapus dokumen');
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Valid':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'Perlu Perbaikan':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'Tidak Valid':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="w-5 h-5" />;
    } else if (mimeType === 'application/pdf') {
      return <FileText className="w-5 h-5" />;
    }
    return <FileText className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Completeness Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Kelengkapan Dokumen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{completeness.total_required}</div>
              <div className="text-sm text-muted-foreground">Dibutuhkan</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{completeness.total_uploaded}</div>
              <div className="text-sm text-muted-foreground">Terupload</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completeness.total_valid}</div>
              <div className="text-sm text-muted-foreground">Valid</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{completeness.completeness_percentage}%</div>
              <div className="text-sm text-muted-foreground">Kelengkapan</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Dokumen Santri</CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Belum ada dokumen yang diupload</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(doc.status_validasi)}
                      {getFileIcon(doc.mime)}
                      <div>
                        <h4 className="font-medium">{doc.original_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {doc.kode_dokumen} • {formatFileSize(doc.size)} • v{doc.version}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Upload: {new Date(doc.tanggal_upload).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getStatusBadge(doc.status_validasi)}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDocument(doc);
                          setShowPreview(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Lihat
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(doc.url, '_blank')}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      
                      {canVerify && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDocument(doc);
                            loadVerificationHistory(doc.id);
                            setShowHistory(true);
                          }}
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Riwayat
                        </Button>
                      )}
                      
                      {canVerify && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteDocument(doc.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Hapus
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {doc.catatan && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Catatan:</strong> {doc.catatan}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Preview Modal */}
      {selectedDocument && (
        <DokumenPreview
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          documentId={selectedDocument.id}
          documentUrl={selectedDocument.url}
          mimeType={selectedDocument.mime}
          originalName={selectedDocument.original_name}
          statusValidasi={selectedDocument.status_validasi}
          version={selectedDocument.version}
          tanggalUpload={selectedDocument.tanggal_upload}
          catatan={selectedDocument.catatan}
          onVerify={verifyDocument}
          canVerify={canVerify}
        />
      )}

      {/* Verification History Modal */}
      {showHistory && selectedDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Riwayat Verifikasi</h3>
              <Button variant="ghost" onClick={() => setShowHistory(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              {verificationHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Belum ada riwayat verifikasi</p>
              ) : (
                verificationHistory.map((history) => (
                  <div key={history.id} className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4" />
                      <span className="font-medium">{history.performed_by}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(history.performed_at).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm">Status:</span>
                      {history.old_status && (
                        <>
                          <Badge variant="outline">{history.old_status}</Badge>
                          <span className="text-sm">→</span>
                        </>
                      )}
                      {history.new_status && (
                        <Badge>{history.new_status}</Badge>
                      )}
                    </div>
                    
                    {history.catatan && (
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {history.catatan}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DokumenVerifikasi;
