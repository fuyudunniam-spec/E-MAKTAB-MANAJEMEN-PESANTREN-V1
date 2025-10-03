import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Upload, 
  FileText, 
  Image, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  Download,
  Trash2,
  RefreshCw,
  Percent
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DocumentRequirement {
  kode: string;
  nama: string;
  kategori: 'wajib' | 'kondisional' | 'opsional';
  kondisi?: string;
  format: string;
}

interface DocumentFile {
  id?: string;
  kode_dokumen: string;
  nama_dokumen: string;
  url?: string;
  mime_type?: string;
  size?: number;
  original_name?: string;
  status_validasi: 'Valid' | 'Perlu Perbaikan' | 'Tidak Valid';
  verifier?: string;
  tanggal_upload?: string;
  catatan?: string;
  is_active: boolean;
}

interface UploadDokumenSantriProps {
  santriId: string;
  kategori: string;
  statusAnak: string;
  onUploadComplete?: () => void;
}

const UploadDokumenSantri: React.FC<UploadDokumenSantriProps> = ({
  santriId,
  kategori,
  statusAnak,
  onUploadComplete
}) => {
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<{[key: string]: boolean}>({});
  const [previewFile, setPreviewFile] = useState<DocumentFile | null>(null);
  const [verificationDialog, setVerificationDialog] = useState<DocumentFile | null>(null);
  const [verificationNote, setVerificationNote] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'Valid' | 'Perlu Perbaikan' | 'Tidak Valid'>('Valid');
  const [isLoading, setIsLoading] = useState(false);

  // Definisi dokumen berdasarkan kategori
  const getDocumentRequirements = (): DocumentRequirement[] => {
    const baseDocuments: DocumentRequirement[] = [
      { kode: 'PAS_FOTO', nama: 'Pas Foto', kategori: 'wajib', format: 'JPG/PNG' },
      { kode: 'AKTA_LAHIR', nama: 'Akta Kelahiran', kategori: 'wajib', format: 'PDF/JPG' },
      { kode: 'KARTU_KELUARGA', nama: 'Kartu Keluarga', kategori: 'wajib', format: 'PDF/JPG' }
    ];

    const conditionalDocuments: DocumentRequirement[] = [
      { 
        kode: 'AKTA_KEMATIAN_AYAH', 
        nama: 'Akta Kematian Ayah', 
        kategori: 'kondisional', 
        kondisi: 'yatim',
        format: 'PDF/JPG' 
      },
      { 
        kode: 'AKTA_KEMATIAN_IBU', 
        nama: 'Akta Kematian Ibu', 
        kategori: 'kondisional', 
        kondisi: 'piatu',
        format: 'PDF/JPG' 
      },
      { 
        kode: 'SKTM', 
        nama: 'Surat Keterangan Tidak Mampu', 
        kategori: 'kondisional', 
        kondisi: 'dhuafa',
        format: 'PDF/JPG' 
      }
    ];

    const optionalDocuments: DocumentRequirement[] = [
      { kode: 'IJAZAH', nama: 'Ijazah Terakhir', kategori: 'opsional', format: 'PDF/JPG' },
      { kode: 'TRANSKRIP', nama: 'Transkrip Nilai', kategori: 'opsional', format: 'PDF/JPG' },
      { kode: 'SERTIFIKAT', nama: 'Sertifikat Prestasi', kategori: 'opsional', format: 'PDF/JPG' }
    ];

    let requiredDocuments = [...baseDocuments];

    // Aturan berdasarkan kategori
    switch (kategori) {
      case 'Reguler':
        // Reguler: Pas Foto + (Akta Lahir ATAU KK)
        requiredDocuments = [
          { kode: 'PAS_FOTO', nama: 'Pas Foto', kategori: 'wajib', format: 'JPG/PNG' },
          { kode: 'AKTA_LAHIR_ATAU_KK', nama: 'Akta Lahir atau KK', kategori: 'wajib', format: 'PDF/JPG' }
        ];
        break;

      case 'Binaan Mukim':
        // Binaan Mukim: dokumen lengkap
        requiredDocuments = [
          { kode: 'PAS_FOTO_3X4', nama: 'Pas Foto 3x4', kategori: 'wajib', format: 'JPG/PNG' },
          { kode: 'PAS_FOTO_4X6', nama: 'Pas Foto 4x6', kategori: 'wajib', format: 'JPG/PNG' },
          { kode: 'AKTA_LAHIR', nama: 'Akta Kelahiran', kategori: 'wajib', format: 'PDF/JPG' },
          { kode: 'KARTU_KELUARGA', nama: 'Kartu Keluarga', kategori: 'wajib', format: 'PDF/JPG' },
          { kode: 'KTP_ORTU', nama: 'KTP Orang Tua/Wali Utama', kategori: 'wajib', format: 'PDF/JPG' },
          { kode: 'KTP_WALI_PENDA', nama: 'KTP Wali Pendamping', kategori: 'wajib', format: 'PDF/JPG' },
          { kode: 'SURAT_SEHAT', nama: 'Surat Keterangan Sehat', kategori: 'wajib', format: 'PDF/JPG' }
        ];
        break;

      case 'Binaan Non-Mukim':
        // Binaan Non-Mukim: dokumen dasar + KTP ortu
        requiredDocuments = [
          { kode: 'PAS_FOTO', nama: 'Pas Foto', kategori: 'wajib', format: 'JPG/PNG' },
          { kode: 'AKTA_LAHIR', nama: 'Akta Kelahiran', kategori: 'wajib', format: 'PDF/JPG' },
          { kode: 'KARTU_KELUARGA', nama: 'Kartu Keluarga', kategori: 'wajib', format: 'PDF/JPG' },
          { kode: 'KTP_ORTU', nama: 'KTP Orang Tua/Wali Utama', kategori: 'wajib', format: 'PDF/JPG' }
        ];
        break;
    }

    // Tambahkan dokumen kondisional berdasarkan status anak
    if (statusAnak && ['Yatim', 'Piatu', 'Yatim Piatu'].some(status => statusAnak.includes(status))) {
      if (statusAnak.includes('Yatim') || statusAnak.includes('Yatim Piatu')) {
        requiredDocuments.push(conditionalDocuments[0]); // Akta Kematian Ayah
      }
      if (statusAnak.includes('Piatu') || statusAnak.includes('Yatim Piatu')) {
        requiredDocuments.push(conditionalDocuments[1]); // Akta Kematian Ibu
      }
    }

    if (statusAnak && statusAnak.includes('Dhuafa')) {
      requiredDocuments.push(conditionalDocuments[2]); // SKTM
    }

    // Tambahkan dokumen opsional untuk semua kategori
    return [...requiredDocuments, ...optionalDocuments];
  };

  // Load dokumen yang sudah ada
  const loadDocuments = async () => {
    try {
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
    }
  };

  // Upload file
  const uploadFile = async (kodeDokumen: string, file: File) => {
    try {
      setUploadingFiles(prev => ({ ...prev, [kodeDokumen]: true }));

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `documents/santri/${santriId}/${kodeDokumen}/${fileName}`;

      // Upload ke Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Simpan metadata ke database
      const { error: dbError } = await supabase
        .from('dokumen_santri')
        .insert({
          santri_id: santriId,
          kode_dokumen: kodeDokumen,
          nama_dokumen: file.name,
          url: urlData.publicUrl,
          mime_type: file.type,
          size: file.size,
          original_name: file.name,
          status_validasi: 'Perlu Perbaikan',
          tanggal_upload: new Date().toISOString(),
          is_active: true
        });

      if (dbError) throw dbError;

      toast.success('Dokumen berhasil diupload');
      loadDocuments();
      onUploadComplete?.();

    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Gagal mengupload dokumen');
    } finally {
      setUploadingFiles(prev => ({ ...prev, [kodeDokumen]: false }));
    }
  };

  // Verifikasi dokumen
  const verifyDocument = async (docId: string) => {
    try {
      const { error } = await supabase
        .from('dokumen_santri')
        .update({
          status_validasi: verificationStatus,
          verifier: (await supabase.auth.getUser()).data.user?.id,
          catatan: verificationNote,
          tanggal_verifikasi: new Date().toISOString()
        })
        .eq('id', docId);

      if (error) throw error;

      // Log audit
      await supabase
        .from('dokumen_audit_log')
        .insert({
          dokumen_id: docId,
          action: 'verification',
          old_status: documents.find(d => d.id === docId)?.status_validasi,
          new_status: verificationStatus,
          notes: verificationNote,
          user_id: (await supabase.auth.getUser()).data.user?.id
        });

      toast.success('Dokumen berhasil diverifikasi');
      loadDocuments();
      setVerificationDialog(null);
      setVerificationNote('');
      setVerificationStatus('Valid');

    } catch (error) {
      console.error('Error verifying document:', error);
      toast.error('Gagal memverifikasi dokumen');
    }
  };

  // Hapus dokumen
  const deleteDocument = async (docId: string) => {
    try {
      const { error } = await supabase
        .from('dokumen_santri')
        .update({ is_active: false })
        .eq('id', docId);

      if (error) throw error;

      toast.success('Dokumen berhasil dihapus');
      loadDocuments();

    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Gagal menghapus dokumen');
    }
  };

  // Hitung kelengkapan dokumen
  const calculateCompleteness = () => {
    const requirements = getDocumentRequirements();
    const requiredDocs = requirements.filter(doc => doc.kategori === 'wajib' || doc.kategori === 'kondisional');
    const uploadedDocs = documents.filter(doc => doc.status_validasi === 'Valid');
    
    const uploadedCodes = new Set(uploadedDocs.map(doc => doc.kode_dokumen));
    const completedCount = requiredDocs.filter(doc => uploadedCodes.has(doc.kode)).length;
    
    return {
      completed: completedCount,
      total: requiredDocs.length,
      percentage: Math.round((completedCount / requiredDocs.length) * 100)
    };
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Valid':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'Perlu Perbaikan':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'Tidak Valid':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Valid':
        return 'bg-green-100 text-green-800';
      case 'Perlu Perbaikan':
        return 'bg-yellow-100 text-yellow-800';
      case 'Tidak Valid':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Preview file
  const previewDocument = (doc: DocumentFile) => {
    setPreviewFile(doc);
  };

  useEffect(() => {
    if (santriId) {
      loadDocuments();
    }
  }, [santriId]);

  const requirements = getDocumentRequirements();
  const completeness = calculateCompleteness();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Dokumen Santri
            </div>
            <Badge variant="outline">{kategori}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{completeness.percentage}%</div>
              <div className="text-sm text-gray-600">Kelengkapan Dokumen</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completeness.completed}</div>
              <div className="text-sm text-gray-600">Dokumen Lengkap</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{completeness.total}</div>
              <div className="text-sm text-gray-600">Total Diperlukan</div>
            </div>
          </div>
          
          <Progress value={completeness.percentage} className="w-full" />
          <p className="text-sm text-gray-600 mt-2">
            Status Anak: <Badge variant="secondary">{statusAnak || 'Belum ditentukan'}</Badge>
          </p>
        </CardContent>
      </Card>

      {/* Daftar Dokumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {requirements.map((req) => {
          const uploadedDoc = documents.find(doc => doc.kode_dokumen === req.kode);
          const isUploading = uploadingFiles[req.kode];

          return (
            <Card key={req.kode} className="relative">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>{req.nama}</span>
                  <Badge 
                    variant={req.kategori === 'wajib' ? 'destructive' : req.kategori === 'kondisional' ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    {req.kategori}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Status Dokumen */}
                {uploadedDoc ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(uploadedDoc.status_validasi)}
                      <Badge className={getStatusBadge(uploadedDoc.status_validasi)}>
                        {uploadedDoc.status_validasi}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 truncate">{uploadedDoc.original_name}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => previewDocument(uploadedDoc)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setVerificationDialog(uploadedDoc)}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verifikasi
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteDocument(uploadedDoc.id!)}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <FileText className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 mb-3">Belum diupload</p>
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 10 * 1024 * 1024) {
                            toast.error('Ukuran file maksimal 10MB');
                            return;
                          }
                          uploadFile(req.kode, file);
                        }
                      }}
                      disabled={isUploading}
                      className="text-xs"
                    />
                  </div>
                )}

                {/* Format Info */}
                <p className="text-xs text-gray-500 text-center">
                  Format: {req.format} (Max 10MB)
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Preview Dokumen</DialogTitle>
          </DialogHeader>
          {previewFile && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{previewFile.nama_dokumen}</h3>
                <Badge className={getStatusBadge(previewFile.status_validasi)}>
                  {previewFile.status_validasi}
                </Badge>
              </div>
              
              {previewFile.mime_type?.startsWith('image/') ? (
                <img 
                  src={previewFile.url} 
                  alt={previewFile.nama_dokumen}
                  className="max-w-full h-auto border rounded"
                />
              ) : (
                <iframe 
                  src={previewFile.url} 
                  className="w-full h-96 border rounded"
                  title={previewFile.nama_dokumen}
                />
              )}
              
              <div className="text-sm text-gray-600">
                <p>Ukuran: {(previewFile.size! / 1024 / 1024).toFixed(2)} MB</p>
                <p>Format: {previewFile.mime_type}</p>
                {previewFile.catatan && (
                  <p>Catatan: {previewFile.catatan}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Verification Dialog */}
      <Dialog open={!!verificationDialog} onOpenChange={() => setVerificationDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verifikasi Dokumen</DialogTitle>
          </DialogHeader>
          {verificationDialog && (
            <div className="space-y-4">
              <div>
                <Label>Status Validasi</Label>
                <Select value={verificationStatus} onValueChange={(value: any) => setVerificationStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Valid">Valid</SelectItem>
                    <SelectItem value="Perlu Perbaikan">Perlu Perbaikan</SelectItem>
                    <SelectItem value="Tidak Valid">Tidak Valid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Catatan</Label>
                <Textarea
                  value={verificationNote}
                  onChange={(e) => setVerificationNote(e.target.value)}
                  placeholder="Tambahkan catatan verifikasi..."
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setVerificationDialog(null)}>
                  Batal
                </Button>
                <Button onClick={() => verifyDocument(verificationDialog.id!)}>
                  Simpan Verifikasi
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UploadDokumenSantri;
