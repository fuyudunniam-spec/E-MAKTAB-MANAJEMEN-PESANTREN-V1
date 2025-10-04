import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
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
  url?: string;
  mime?: string;
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
      }
    ];

    const optionalDocuments: DocumentRequirement[] = [
      { kode: 'SKTM', nama: 'Surat Keterangan Tidak Mampu', kategori: 'opsional', format: 'PDF/JPG' },
      { kode: 'IJAZAH', nama: 'Ijazah Terakhir', kategori: 'opsional', format: 'PDF/JPG' },
      { kode: 'TRANSKRIP', nama: 'Transkrip Nilai', kategori: 'opsional', format: 'PDF/JPG' }
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
          { kode: 'PAS_FOTO', nama: 'Pas Foto', kategori: 'wajib', format: 'JPG/PNG' },
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
    if (statusAnak && ['Yatim', 'Piatu', 'Yatim Piatu'].includes(statusAnak)) {
      if (statusAnak === 'Yatim' || statusAnak === 'Yatim Piatu') {
        requiredDocuments.push(conditionalDocuments[0]); // Akta Kematian Ayah
      }
      if (statusAnak === 'Piatu' || statusAnak === 'Yatim Piatu') {
        requiredDocuments.push(conditionalDocuments[1]); // Akta Kematian Ibu
      }
    }

    // SKTM wajib untuk Dhuafa
    if (statusAnak === 'Dhuafa') {
      requiredDocuments.push({ kode: 'SKTM', nama: 'Surat Keterangan Tidak Mampu', kategori: 'wajib', format: 'PDF/JPG' });
    }

    // Tambahkan dokumen opsional untuk semua kategori (kecuali SKTM jika sudah wajib)
    const filteredOptionalDocs = optionalDocuments.filter(doc => 
      !(doc.kode === 'SKTM' && statusAnak === 'Dhuafa')
    );
    
    return [...requiredDocuments, ...filteredOptionalDocs];
  };

  // Load dokumen yang sudah ada
  const loadDocuments = async () => {
    try {
      console.log('Loading documents for santri:', santriId);
      const { data, error } = await supabase
        .from('dokumen_santri')
        .select('*')
        .eq('santri_id', santriId)
        .eq('is_active', true)
        .order('tanggal_upload', { ascending: false });

      console.log('Documents loaded:', { data, error });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      // Fix URLs for documents with old path format
      const fixedDocuments = (data || []).map(doc => fixDocumentUrl(doc));
      
      // Update database with fixed URLs if needed
      const documentsToUpdate = fixedDocuments.filter(doc => 
        doc.url && doc.url !== data?.find(original => original.id === doc.id)?.url
      );
      
      if (documentsToUpdate.length > 0) {
        console.log('Updating', documentsToUpdate.length, 'documents with fixed URLs');
        for (const doc of documentsToUpdate) {
          await supabase
            .from('dokumen_santri')
            .update({ url: doc.url })
            .eq('id', doc.id);
        }
      }
      
      setDocuments(fixedDocuments);
      console.log('Documents state updated:', fixedDocuments.length, 'documents');
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Gagal memuat dokumen');
    }
  };

  // Upload file
  const uploadFile = async (kodeDokumen: string, file: File) => {
    try {
      console.log('Starting upload for:', { kodeDokumen, fileName: file.name, fileSize: file.size, fileType: file.type });
      setUploadingFiles(prev => ({ ...prev, [kodeDokumen]: true }));

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('File terlalu besar. Maksimal 10MB');
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Format file tidak didukung. Gunakan PDF, JPG, atau PNG');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `santri/${santriId}/${kodeDokumen}/${fileName}`;

      console.log('Uploading to path:', filePath);

      // Upload ke Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('santri-documents')
        .upload(filePath, file);

      console.log('Upload result:', { uploadData, uploadError });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw new Error(`Upload gagal: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('santri-documents')
        .getPublicUrl(filePath);

      console.log('Public URL:', urlData.publicUrl);

      // Simpan metadata ke database
      const { error: dbError } = await supabase
        .from('dokumen_santri')
        .insert({
          santri_id: santriId,
          kode_dokumen: kodeDokumen,
          url: urlData.publicUrl,
          mime: file.type,
          size: file.size,
          original_name: file.name,
          status_validasi: 'Perlu Perbaikan',
          tanggal_upload: new Date().toISOString(),
          is_active: true
        });

      console.log('Database insert result:', { dbError });

      if (dbError) {
        console.error('Database error details:', dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }

      console.log('Upload completed successfully');
      toast.success('Dokumen berhasil diupload');
      loadDocuments();
      // Call callback to refresh parent component
      onUploadComplete?.();

    } catch (error) {
      console.error('Error uploading file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Gagal mengupload dokumen';
      toast.error(errorMessage);
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
          updated_at: new Date().toISOString()
        })
        .eq('id', docId);

      if (error) throw error;

      // Log audit
      const oldDoc = documents.find(d => d.id === docId);
      await supabase
        .from('dokumen_audit_log')
        .insert({
          dokumen_id: docId,
          action: 'verification',
          performed_by: (await supabase.auth.getUser()).data.user?.id,
          performed_at: new Date().toISOString(),
          old_values: oldDoc ? { status_validasi: oldDoc.status_validasi } : null,
          new_values: { 
            status_validasi: verificationStatus,
            catatan: verificationNote 
          }
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

  // Fix URL for documents with old path format
  const fixDocumentUrl = (doc: DocumentFile): DocumentFile => {
    if (!doc.url) return doc;
    
    try {
      // Parse the URL to get the file path
      const url = new URL(doc.url);
      const pathParts = url.pathname.split('/');
      
      // Find the index of 'santri-documents' in the path
      const bucketIndex = pathParts.indexOf('santri-documents');
      if (bucketIndex === -1 || bucketIndex >= pathParts.length - 1) {
        console.log('Invalid URL format:', doc.url);
        return doc;
      }
      
      // Get the file path after the bucket name
      let filePath = pathParts.slice(bucketIndex + 1).join('/');
      
      // If the path starts with 'documents/santri/', remove 'documents/' prefix
      // This handles the mismatch between URL path and actual storage path
      if (filePath.startsWith('documents/santri/')) {
        filePath = filePath.replace('documents/', '');
        console.log('Fixed file path:', filePath);
      }
      
      // Generate new URL with the correct path
      const { data: urlData } = supabase.storage
        .from('santri-documents')
        .getPublicUrl(filePath);
      
      console.log('Fixed URL:', { 
        original: doc.url, 
        filePath: filePath,
        new: urlData.publicUrl 
      });
      
      return { ...doc, url: urlData.publicUrl };
    } catch (error) {
      console.error('Error fixing URL:', error, doc.url);
      return doc;
    }
  };

  // Preview file
  const previewDocument = (doc: DocumentFile) => {
    console.log('Preview document:', doc);
    console.log('Document URL:', doc.url);
    const fixedDoc = fixDocumentUrl(doc);
    setPreviewFile(fixedDoc);
  };

  useEffect(() => {
    console.log('UploadDokumenSantri useEffect triggered:', { santriId, kategori, statusAnak });
    if (santriId) {
      loadDocuments();
    }
  }, [santriId, kategori, statusAnak]);

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
          <div className="text-sm text-gray-600 mt-2">
            Status Anak: <Badge variant="secondary">{statusAnak || 'Belum ditentukan'}</Badge>
          </div>
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
                        console.log('File input changed:', e.target.files);
                        const file = e.target.files?.[0];
                        if (file) {
                          console.log('File selected:', { name: file.name, size: file.size, type: file.type });
                          uploadFile(req.kode, file);
                        } else {
                          console.log('No file selected');
                        }
                        // Reset input value to allow selecting the same file again
                        e.target.value = '';
                      }}
                      disabled={uploadingFiles[req.kode]}
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
            <DialogDescription>
              Lihat dan verifikasi dokumen yang telah diupload
            </DialogDescription>
          </DialogHeader>
          {previewFile && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{previewFile.original_name}</h3>
                <Badge className={getStatusBadge(previewFile.status_validasi)}>
                  {previewFile.status_validasi}
                </Badge>
              </div>
              
              {/* Simple Preview - Just show file info and download link */}
              <div className="w-full border rounded-lg p-6 bg-gray-50">
                <div className="text-center space-y-4">
                  {previewFile.mime?.startsWith('image/') ? (
                    <Image className="w-16 h-16 mx-auto text-blue-500" />
                  ) : previewFile.mime === 'application/pdf' ? (
                    <FileText className="w-16 h-16 mx-auto text-red-500" />
                  ) : (
                    <FileText className="w-16 h-16 mx-auto text-gray-500" />
                  )}
                  
                  <div>
                    <p className="text-lg font-medium text-gray-900">{previewFile.original_name}</p>
                    <p className="text-sm text-gray-600">
                      {previewFile.mime === 'application/pdf' ? 'Dokumen PDF' : 
                       previewFile.mime?.startsWith('image/') ? 'File Gambar' : 
                       'Dokumen File'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Ukuran: {(previewFile.size! / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <a 
                      href={previewFile.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Buka di Tab Baru
                    </a>
                    <br />
                    <a 
                      href={previewFile.url} 
                      download={previewFile.original_name}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 hover:text-blue-700 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download File
                    </a>
                  </div>
                  
                  {previewFile.catatan && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">
                        <strong>Catatan:</strong> {previewFile.catatan}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-sm text-gray-600 space-y-2">
                <p>Ukuran: {(previewFile.size! / 1024 / 1024).toFixed(2)} MB</p>
                <p>Format: {previewFile.mime}</p>
                {previewFile.catatan && (
                  <p>Catatan: {previewFile.catatan}</p>
                )}
                <div className="pt-2">
                  <a 
                    href={previewFile.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 hover:text-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Buka di Tab Baru
                  </a>
                </div>
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
            <DialogDescription>
              Ubah status validasi dan tambahkan catatan untuk dokumen
            </DialogDescription>
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
