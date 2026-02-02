import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  FileText, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  Download,
  Trash2,
  Loader2,
  Upload,
  Info,
  PenLine
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DocumentService } from '@/services/document.service';
import DocumentPreviewDialog from '@/components/common/DocumentPreviewDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// Constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const UPLOAD_TIMEOUT = 120000; // 2 minutes
const STORAGE_BUCKET = 'santri-documents';
const RELOAD_DELAY = 500; // ms

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
] as const;

const EXCLUDED_DOCUMENTS = [
  'Surat Permohonan Bantuan',
  'Surat Keterangan Sehat',
  'KTP Orang Tua',
  'Akta Kematian Orang Tua',
  'Surat Permohonan',
  'Surat Keterangan Penghasilan',
  'Surat Keterangan Tidak Mampu',
  'Sertifikat Prestasi',
  'Raport',
  'Slip Gaji Orang Tua',
  'Surat Keterangan',
  'Dokumen Lainnya'
] as const;

const PSB_ALLOWED_DOCUMENTS = [
  'Pas Foto',
  'Kartu Keluarga',
  'Akta Kelahiran',
  'KTP Wali Utama',
  'KTP Wali Pendamping',
  'Ijazah',
  'SKL',
  'Transkrip Nilai',
  'Bukti Pembayaran Pendaftaran',
  'SKTM',
  'Akta Kematian Ayah',
  'Akta Kematian Ibu'
] as const;

const DEFAULT_DOCUMENTS = [
  { jenis_dokumen: 'Pas Foto', label: 'Pas Foto', required: true },
  { jenis_dokumen: 'Kartu Keluarga', label: 'Kartu Keluarga', required: true }
] as const;

type VerificationStatus = 'Diverifikasi' | 'Belum Diverifikasi' | 'Ditolak';

interface DokumenSantriTabProps {
  santriId?: string;
  santriData: {
    status_sosial?: 'Yatim' | 'Piatu' | 'Yatim Piatu' | 'Dhuafa';
    nama_lengkap: string;
    kategori?: string;
  };
  isBantuanRecipient: boolean;
  mode?: 'view' | 'edit' | 'add';
  isPSB?: boolean;
}

interface DokumenItem {
  id?: string;
  jenis_dokumen: string;
  label: string;
  required: boolean;
  uploaded: boolean;
  status_verifikasi?: VerificationStatus;
  path_file?: string;
  nama_file?: string;
  created_at?: string;
  tipe_file?: string;
  ukuran_file?: number;
  description?: string;
}

const DokumenSantriTab: React.FC<DokumenSantriTabProps> = ({
  santriId,
  santriData,
  isBantuanRecipient,
  mode = 'view',
  isPSB = false
}) => {
  const [dokumenList, setDokumenList] = useState<DokumenItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingFiles, setUploadingFiles] = useState<{[key: string]: boolean}>({});
  const [previewFile, setPreviewFile] = useState<{url: string, name: string, type: string, size?: number} | null>(null);
  const [verificationDialog, setVerificationDialog] = useState<DokumenItem | null>(null);
  const [verificationNote, setVerificationNote] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('Diverifikasi');
  
  const isAdminMode = mode !== 'view';

  useEffect(() => {
    loadDokumen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    santriId,
    santriData?.status_sosial,
    santriData?.kategori,
    isBantuanRecipient
  ]);

  const normalizeJenisDokumen = (raw: string): string => {
    const lower = (raw || '').toLowerCase().trim();
    if (lower.includes('surat') && lower.includes('permohonan') && lower.includes('bantuan')) return 'Surat Permohonan Bantuan';
    if (lower.includes('ktp') && lower.includes('wali') && lower.includes('utama')) return 'KTP Wali Utama';
    if (lower.includes('ktp') && lower.includes('wali') && (lower.includes('pendamping') || lower.includes('pendmpg'))) return 'KTP Wali Pendamping';
    if (lower.startsWith('sktm')) return 'SKTM';
    if (lower.includes('kartu keluarga') || lower === 'kk' || lower.includes('ktp/kk')) return 'Kartu Keluarga';
    if (lower.includes('akta kematian') && lower.includes('ayah')) return 'Akta Kematian Ayah';
    if (lower.includes('akta kematian') && lower.includes('ibu')) return 'Akta Kematian Ibu';
    return raw?.trim() || 'Dokumen';
  };

  const getDokumenRequirements = async (statusSosial: string, kategori: string, isBantuan: boolean) => {
    try {
      const requiredDocuments = await DocumentService.getDocumentRequirements(kategori, statusSosial, isBantuan);
      
      if (!requiredDocuments || requiredDocuments.length === 0) {
        return {
          minimal: DEFAULT_DOCUMENTS.map(doc => ({ ...doc })),
          khusus: [],
          pelengkap: []
        };
      }

      const seenJenis = new Set<string>();
      const dokumenList = requiredDocuments
        .map(doc => {
          const mappedJenis = normalizeJenisDokumen(doc.jenis_dokumen);
          
          // Strict filtering for PSB
          if (isPSB) {
            const isAllowed = PSB_ALLOWED_DOCUMENTS.some(allowed => 
              mappedJenis.toLowerCase().includes(allowed.toLowerCase()) || 
              allowed.toLowerCase().includes(mappedJenis.toLowerCase())
            );
            if (!isAllowed) return null;
          }

          if (EXCLUDED_DOCUMENTS.includes(mappedJenis as typeof EXCLUDED_DOCUMENTS[number])) return null;
          if (seenJenis.has(mappedJenis)) return null;
          seenJenis.add(mappedJenis);
          return {
            jenis_dokumen: mappedJenis,
            label: mappedJenis,
            required: doc.is_required || false,
            description: doc.deskripsi
          };
        })
        .filter(Boolean) as Array<{ jenis_dokumen: string; label: string; required: boolean; description?: string }>;

      const minimal = dokumenList.filter(d => d.required);
      const pelengkap = dokumenList.filter(d => !d.required);

      return { minimal, khusus: [], pelengkap };
    } catch (error) {
      return {
        minimal: DEFAULT_DOCUMENTS.map(doc => ({ ...doc })),
        khusus: [],
        pelengkap: []
      };
    }
  };

  const loadDokumen = async () => {
    try {
      setLoading(true);
      
      // If no santriId (draft mode), skip fetching uploaded docs and cleanup
      let data: any[] = [];
      if (santriId) {
        data = await DocumentService.getSantriDocuments(santriId);
        
        // Cleanup legacy
        await supabase.from('dokumen_santri').delete().eq('santri_id', santriId).in('jenis_dokumen', ['Surat Permohonan Bantuan', 'SKTM (Dhuafa)', 'KTP/KK']);
      }

      const requirements = await getDokumenRequirements(
        santriData?.status_sosial || 'Lengkap',
        santriData?.kategori || 'Reguler',
        isBantuanRecipient
      );

      if (!requirements) {
        setDokumenList([]);
        return;
      }

      const allDocs = [...(requirements.minimal || []), ...(requirements.khusus || []), ...(requirements.pelengkap || [])];
      
      // Filter out payment proof if NOT in PSB mode
      const filteredDocs = allDocs.filter(d => {
        if (d.jenis_dokumen === 'Bukti Pembayaran Pendaftaran') {
          return isPSB;
        }
        return true;
      });

      const mergedDocs = filteredDocs.map(req => {
        const uploaded = data?.find(d => normalizeJenisDokumen(d.jenis_dokumen) === req.jenis_dokumen);
        return {
          ...req,
          id: uploaded?.id,
          uploaded: !!uploaded,
          status_verifikasi: uploaded?.status_verifikasi,
          path_file: uploaded?.path_file,
          nama_file: uploaded?.nama_file,
          created_at: uploaded?.created_at,
          tipe_file: uploaded?.tipe_file,
          ukuran_file: uploaded?.ukuran_file
        };
      });

      setDokumenList(mergedDocs);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal memuat dokumen');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (jenisDokumen: string, file: File) => {
    if (!santriId) {
      toast.error('Mohon simpan Data Diri terlebih dahulu sebelum mengupload dokumen.');
      return;
    }

    if (uploadingFiles[jenisDokumen]) {
      toast.warning('Upload sedang berlangsung...');
      return;
    }

    let uploadedFilePath: string | null = null;
    try {
      const normalizedJenis = normalizeJenisDokumen(jenisDokumen);
      if (normalizedJenis === 'Surat Permohonan Bantuan') {
        toast.warning('Dokumen ini tidak lagi digunakan.');
        return;
      }
      
      setUploadingFiles(prev => ({ ...prev, [jenisDokumen]: true }));
      
      if (file.size > MAX_FILE_SIZE) throw new Error('File terlalu besar. Maksimal 10MB.');
      if (file.size === 0) throw new Error('File kosong.');
      if (!ALLOWED_FILE_TYPES.includes(file.type as typeof ALLOWED_FILE_TYPES[number])) throw new Error('Tipe file tidak didukung.');
      
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'pdf';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `santri/${santriId}/${normalizedJenis}/${fileName}`;
      uploadedFilePath = filePath;
      
      const uploadPromise = supabase.storage.from(STORAGE_BUCKET).upload(filePath, file, { cacheControl: '3600', upsert: false });
      const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Upload timeout.')), UPLOAD_TIMEOUT));

      const { error: uploadError } = await Promise.race([uploadPromise, timeoutPromise]);

      if (uploadError) {
        if (uploadedFilePath) await supabase.storage.from(STORAGE_BUCKET).remove([uploadedFilePath]).catch(() => {});
        throw uploadError;
      }

      const insertData = {
        santri_id: santriId,
        jenis_dokumen: normalizedJenis,
        nama_dokumen: normalizedJenis,
        nama_file: file.name,
        ukuran_file: file.size,
        tipe_file: file.type,
        path_file: filePath,
        status_verifikasi: 'Belum Diverifikasi' as VerificationStatus,
        is_editable_by_santri: true
      };
      
      const { error: insertError } = await supabase.from('dokumen_santri').insert(insertData);

      if (insertError) {
        if (uploadedFilePath) await supabase.storage.from(STORAGE_BUCKET).remove([uploadedFilePath]).catch(() => {});
        throw insertError;
      }

      toast.success('Dokumen berhasil diupload!');
      setTimeout(() => loadDokumen(), RELOAD_DELAY);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Gagal mengupload dokumen';
      toast.error(`Upload gagal: ${msg}`);
      if (uploadedFilePath) await supabase.storage.from(STORAGE_BUCKET).remove([uploadedFilePath]).catch(() => {});
    } finally {
      setUploadingFiles(prev => ({ ...prev, [jenisDokumen]: false }));
    }
  };

  const handleFileDelete = useCallback(async (dokumenId: string, pathFile: string) => {
    if (!dokumenId || !pathFile) return;
    try {
      setLoading(true);
      await supabase.storage.from(STORAGE_BUCKET).remove([pathFile]);
      const { error } = await supabase.from('dokumen_santri').delete().eq('id', dokumenId);
      if (error) throw error;
      toast.success('Dokumen dihapus');
      loadDokumen();
    } catch (error) {
      toast.error('Gagal menghapus dokumen');
    } finally {
      setLoading(false);
    }
  }, [loadDokumen]);

  const handlePreviewDocument = async (dokumen: DokumenItem) => {
    if (!dokumen.path_file) return;
    
    try {
      // Get public URL
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(dokumen.path_file);
      
      setPreviewFile({
        url: urlData.publicUrl,
        name: dokumen.nama_file || dokumen.label,
        type: dokumen.tipe_file || 'application/pdf',
        size: dokumen.ukuran_file
      });
    } catch (error) {
      console.error('Error getting preview URL:', error);
      toast.error('Gagal memuat preview dokumen');
    }
  };

  const handleVerifyDocument = useCallback(async (docId: string) => {
    if (!docId) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('dokumen_santri').update({
        status_verifikasi: verificationStatus,
        verifikasi_oleh: user?.id,
        catatan_verifikasi: verificationNote,
        updated_at: new Date().toISOString()
      }).eq('id', docId);

      if (error) throw error;
      toast.success('Verifikasi berhasil');
      loadDokumen();
      setVerificationDialog(null);
    } catch (error) {
      toast.error('Gagal verifikasi');
    }
  }, [verificationStatus, verificationNote, loadDokumen]);

  const { minimalDocs, khususDocs, pelengkapDocs, stats } = useMemo(() => {
    const minimal = dokumenList.filter(d => d.required);
    const khusus = dokumenList.filter(d => d.jenis_dokumen?.includes('Khusus'));
    const pelengkap = dokumenList.filter(d => !d.required);
    
    const countUploaded = (list: DokumenItem[]) => list.filter(d => d.uploaded && d.status_verifikasi !== 'Ditolak').length;
    const totalUploaded = dokumenList.filter(d => d.uploaded).length;
    
    return { 
      minimalDocs: minimal, 
      khususDocs: khusus, 
      pelengkapDocs: pelengkap,
      stats: {
        totalUploaded,
        totalVerified: dokumenList.filter(d => d.uploaded && d.status_verifikasi === 'Diverifikasi').length,
        totalPending: dokumenList.filter(d => d.uploaded && d.status_verifikasi === 'Belum Diverifikasi').length,
        totalRequired: minimal.length,
        totalUploadedRequired: countUploaded(minimal),
        progress: minimal.length + pelengkap.length > 0 ? Math.round((totalUploaded / (minimal.length + pelengkap.length)) * 100) : 0,
        isComplete: minimal.length > 0 && countUploaded(minimal) === minimal.length
      }
    };
  }, [dokumenList]);

  const renderDocCard = (dok: DokumenItem) => {
    const uploaded = dokumenList.find(d => d.jenis_dokumen === dok.jenis_dokumen);
    const isUploading = uploadingFiles[dok.jenis_dokumen];
    const [isEditMode, setIsEditMode] = useState(false);

    // If file is uploaded, default to view mode unless edit requested
    const showUpload = !uploaded?.uploaded || isEditMode;
    
    return (
      <div key={dok.jenis_dokumen} className="flex flex-col gap-2 p-4 border rounded-xl bg-white shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {dok.label}
            {dok.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {uploaded?.uploaded && (
            <Badge 
              variant="outline" 
              className={`gap-1 text-[10px] px-2 h-5 ${
                uploaded.status_verifikasi === 'Diverifikasi' ? 'bg-green-50 text-green-700 border-green-200' : 
                uploaded.status_verifikasi === 'Ditolak' ? 'bg-red-50 text-red-700 border-red-200' : 
                'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {uploaded.status_verifikasi === 'Diverifikasi' ? <CheckCircle className="w-3 h-3" /> : 
               uploaded.status_verifikasi === 'Ditolak' ? <XCircle className="w-3 h-3" /> : 
               <AlertCircle className="w-3 h-3" />}
              {uploaded.status_verifikasi === 'Diverifikasi' ? 'Valid' : uploaded.status_verifikasi === 'Ditolak' ? 'Ditolak' : 'Pending'}
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input 
              readOnly 
              value={uploaded?.uploaded ? (uploaded.nama_file || "File terupload") : ""} 
              placeholder={!santriId ? "Simpan Data Diri dulu..." : showUpload ? `Upload ${dok.label}...` : ""}
              className={`h-10 text-sm ${uploaded?.uploaded ? 'bg-slate-50 text-slate-700 font-medium' : 'bg-white'}`}
            />
            {showUpload && (
              <div className={`absolute inset-0 opacity-0 ${!santriId ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                <input
                  type="file"
                  className={`w-full h-full ${!santriId ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  disabled={isUploading || !santriId}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(dok.jenis_dokumen, file);
                      setIsEditMode(false);
                    }
                    e.target.value = '';
                  }}
                  title={!santriId ? "Simpan Data Diri terlebih dahulu" : ""}
                />
              </div>
            )}
          </div>

          {uploaded?.uploaded && !isEditMode ? (
            <>
              <Button 
                variant="default" 
                className="bg-slate-800 hover:bg-slate-700 h-10 px-4"
                onClick={() => handlePreviewDocument(uploaded)}
              >
                Lihat
              </Button>
              
              {isAdminMode ? (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0 border-blue-200 text-blue-600 hover:bg-blue-50"
                  onClick={() => setVerificationDialog(uploaded)}
                  title="Verifikasi"
                >
                  <CheckCircle className="w-4 h-4" />
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0 border-slate-200 text-slate-600 hover:bg-slate-50"
                    onClick={() => setIsEditMode(true)}
                    title="Ganti File"
                  >
                    <PenLine className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    onClick={() => handleFileDelete(uploaded.id!, uploaded.path_file!)}
                    disabled={isUploading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </>
          ) : (
            <>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 h-10 px-6 shrink-0 relative overflow-hidden"
                disabled={isUploading || !santriId}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </>
                )}
                <input
                  type="file"
                  className={`absolute inset-0 opacity-0 ${!santriId ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  disabled={isUploading || !santriId}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(dok.jenis_dokumen, file);
                      setIsEditMode(false);
                    }
                    e.target.value = '';
                  }}
                  title={!santriId ? "Simpan Data Diri terlebih dahulu" : ""}
                />
              </Button>
              {isEditMode && (
                 <Button
                   variant="ghost"
                   size="icon"
                   className="h-10 w-10 shrink-0"
                   onClick={() => setIsEditMode(false)}
                 >
                   <XCircle className="w-4 h-4 text-slate-400" />
                 </Button>
              )}
            </>
          )}
        </div>
        
        <p className="text-[10px] text-slate-400">
          {uploaded?.uploaded ? (
            <>Size: {(uploaded.ukuran_file ? (uploaded.ukuran_file / 1024).toFixed(0) : 0)} KB • Type: {uploaded.tipe_file?.split('/')[1]?.toUpperCase() || 'FILE'}</>
          ) : (
            'Format: PDF/JPG/PNG (Max 10MB)'
          )}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
        <div className="border-l-4 border-blue-500 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Pemberkasan Digital
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  {isAdminMode ? 'ADMIN' : 'DRAFT'}
                </Badge>
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Lengkapi berkas dan dokumen pendaftaran Anda sesuai ketentuan.
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-slate-900">
              Progress Kelengkapan
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={stats.progress} className="w-32 h-2" />
              <span className="text-sm font-bold text-blue-600">{stats.progress}%</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Info Alert */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3 text-blue-800">
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium">Panduan Upload Dokumen</p>
          <p className="mt-1 opacity-90">
            Pastikan dokumen yang diupload dapat terbaca dengan jelas. Dokumen wajib bertanda bintang (<span className="text-red-500">*</span>) harus diisi sebelum melakukan finalisasi data.
          </p>
        </div>
      </div>

      {/* Configuration Header */}
      <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg border shadow-sm">
              <PenLine className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Program & Kategori</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-medium text-slate-900">{santriData.kategori || 'Reguler'}</span>
                {santriData.status_sosial && (
                  <Badge variant="outline" className="bg-white">
                    {santriData.status_sosial}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {minimalDocs.map(renderDocCard)}
        {khususDocs.map(renderDocCard)}
        {pelengkapDocs.map(renderDocCard)}
      </div>

      {/* Validation Warning */}
      {stats.totalUploadedRequired < stats.totalRequired && (
         <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-4 rounded-lg border border-amber-200">
           <AlertCircle className="w-5 h-5 flex-shrink-0" />
           <p className="text-sm font-medium">
             Anda belum melengkapi {stats.totalRequired - stats.totalUploadedRequired} dokumen wajib.
           </p>
         </div>
      )}

      {/* Verification Dialog (Admin Only) */}
      {isAdminMode && verificationDialog && (
        <Dialog open={!!verificationDialog} onOpenChange={(open) => !open && setVerificationDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Verifikasi Dokumen</DialogTitle>
              <DialogDescription>{verificationDialog.label}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status Verifikasi</label>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant={verificationStatus === 'Diverifikasi' ? 'default' : 'outline'}
                    className={verificationStatus === 'Diverifikasi' ? 'bg-green-600 hover:bg-green-700' : ''}
                    onClick={() => setVerificationStatus('Diverifikasi')}
                  >
                    Valid / Sah
                  </Button>
                  <Button 
                    type="button" 
                    variant={verificationStatus === 'Ditolak' ? 'destructive' : 'outline'}
                    onClick={() => setVerificationStatus('Ditolak')}
                  >
                    Tolak / Salah
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Catatan (Opsional)</label>
                <Input 
                  placeholder="Contoh: Foto buram, Scan terpotong..." 
                  value={verificationNote}
                  onChange={(e) => setVerificationNote(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setVerificationDialog(null)}>Batal</Button>
              <Button onClick={() => handleVerifyDocument(verificationDialog.id!)}>Simpan Verifikasi</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <DocumentPreviewDialog 
        open={!!previewFile}
        onOpenChange={(open) => !open && setPreviewFile(null)}
        file={previewFile}
      />
    </div>
  );
};

export default DokumenSantriTab;
