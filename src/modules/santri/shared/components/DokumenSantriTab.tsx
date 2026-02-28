import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
  Loader2,
  Upload,
  Info,
  PenLine
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DocumentService } from '@/modules/santri/shared/services/document.service';
import DocumentPreviewDialog from '@/components/common/DocumentPreviewDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// --- Constants ---
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const UPLOAD_TIMEOUT = 120000;
const STORAGE_BUCKET = 'santri-documents';
const RELOAD_DELAY = 500;

const ALLOWED_FILE_TYPES = [
  'application/pdf', 'image/jpeg', 'image/jpg', 'image/png',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
] as const;

const EXCLUDED_DOCUMENTS = [
  'Surat Permohonan Bantuan', 'Surat Keterangan Sehat', 'KTP Orang Tua',
  'Akta Kematian Orang Tua', 'Surat Permohonan', 'Surat Keterangan Penghasilan',
  'Surat Keterangan Tidak Mampu', 'Sertifikat Prestasi', 'Raport',
  'Slip Gaji Orang Tua', 'Surat Keterangan', 'Dokumen Lainnya'
] as const;

const PSB_ALLOWED_DOCUMENTS = [
  'Pas Foto', 'Kartu Keluarga', 'Akta Kelahiran', 'KTP Wali Utama',
  'KTP Wali Pendamping', 'Ijazah', 'SKL', 'Transkrip Nilai',
  'Bukti Pembayaran Pendaftaran', 'SKTM', 'Akta Kematian Ayah', 'Akta Kematian Ibu'
] as const;

const DEFAULT_DOCUMENTS = [
  { jenis_dokumen: 'Pas Foto', label: 'Pas Foto', required: true },
  { jenis_dokumen: 'Kartu Keluarga', label: 'Kartu Keluarga', required: true }
] as const;

type VerificationStatus = 'Diverifikasi' | 'Belum Diverifikasi' | 'Ditolak';

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

// --- Sub-Component: DocumentCardItem ---
// Memindahkan useState ke sini agar tidak melanggar Rules of Hooks
const DocumentCardItem = ({
  dok,
  uploaded,
  isUploading,
  santriId,
  isAdminMode,
  onUpload,
  onPreview,
  onVerify,
  onDelete
}: {
  dok: DokumenItem;
  uploaded?: DokumenItem;
  isUploading: boolean;
  santriId?: string;
  isAdminMode: boolean;
  onUpload: (jenis: string, file: File) => void;
  onPreview: (dok: DokumenItem) => void;
  onVerify: (dok: DokumenItem) => void;
  onDelete: (id: string, path: string) => void;
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const showUpload = !uploaded?.uploaded || isEditMode;

  return (
    <div className="flex flex-col gap-2 p-4 border rounded-xl bg-white shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {dok.label}
          {dok.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {uploaded?.uploaded && (
          <Badge
            variant="outline"
            className={`gap-1 text-[10px] px-2 h-5 ${uploaded.status_verifikasi === 'Diverifikasi' ? 'bg-green-50 text-green-700 border-green-200' :
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
                className="w-full h-full cursor-pointer"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                disabled={isUploading || !santriId}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onUpload(dok.jenis_dokumen, file);
                    setIsEditMode(false);
                  }
                  e.target.value = '';
                }}
              />
            </div>
          )}
        </div>

        {uploaded?.uploaded && !isEditMode ? (
          <>
            <Button
              variant="default"
              className="bg-slate-800 hover:bg-slate-700 h-10 px-4"
              onClick={() => onPreview(uploaded)}
            >
              Lihat
            </Button>

            {isAdminMode ? (
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0 border-blue-200 text-blue-600 hover:bg-blue-50"
                onClick={() => onVerify(uploaded)}
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
                >
                  <PenLine className="w-4 h-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  onClick={() => onDelete(uploaded.id!, uploaded.path_file!)}
                  disabled={isUploading}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </>
        ) : (
          <Button
            className="bg-blue-600 hover:bg-blue-700 h-10 px-6 shrink-0 relative overflow-hidden"
            disabled={isUploading || !santriId}
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4 mr-2" /> Upload</>}
            <input
              type="file"
              className="absolute inset-0 opacity-0 cursor-pointer"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              disabled={isUploading || !santriId}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onUpload(dok.jenis_dokumen, file);
                  setIsEditMode(false);
                }
                e.target.value = '';
              }}
            />
          </Button>
        )}
      </div>
      <p className="text-[10px] text-slate-400">
        {uploaded?.uploaded ? `Size: ${(uploaded.ukuran_file ? (uploaded.ukuran_file / 1024).toFixed(0) : 0)} KB` : 'Format: PDF/JPG/PNG (Max 10MB)'}
      </p>
    </div>
  );
};

// --- Main Component ---
const DokumenSantriTab: React.FC<any> = ({
  santriId,
  santriData,
  isBantuanRecipient,
  mode = 'view',
  isPSB = false
}) => {
  const [dokumenList, setDokumenList] = useState<DokumenItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: string]: boolean }>({});
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [verificationDialog, setVerificationDialog] = useState<DokumenItem | null>(null);
  const [verificationNote, setVerificationNote] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('Diverifikasi');

  const isAdminMode = mode !== 'view';

  const normalizeJenisDokumen = (raw: string): string => {
    const lower = (raw || '').toLowerCase().trim();
    if (lower.includes('surat') && lower.includes('permohonan') && lower.includes('bantuan')) return 'Surat Permohonan Bantuan';
    if (lower.includes('ktp') && lower.includes('wali') && lower.includes('utama')) return 'KTP Wali Utama';
    if (lower.includes('ktp') && lower.includes('wali') && (lower.includes('pendamping'))) return 'KTP Wali Pendamping';
    if (lower.startsWith('sktm')) return 'SKTM';
    if (lower.includes('kartu keluarga') || lower === 'kk') return 'Kartu Keluarga';
    return raw?.trim() || 'Dokumen';
  };

  const loadDokumen = useCallback(async () => {
    try {
      setLoading(true);
      let data: any[] = [];
      if (santriId) {
        data = await DocumentService.getSantriDocuments(santriId);
      }

      const requirements = await DocumentService.getDocumentRequirements(
        santriData?.kategori || 'Reguler',
        santriData?.status_sosial || 'Lengkap',
        isBantuanRecipient
      );

      const allReqs = requirements.map(req => ({
        jenis_dokumen: normalizeJenisDokumen(req.jenis_dokumen),
        label: normalizeJenisDokumen(req.jenis_dokumen),
        required: req.is_required || false
      }));

      const merged = allReqs.map(req => {
        const uploaded = data?.find(d => normalizeJenisDokumen(d.jenis_dokumen) === req.jenis_dokumen);
        return { ...req, ...uploaded, uploaded: !!uploaded };
      });

      setDokumenList(merged);
    } catch (error) {
      toast.error('Gagal memuat dokumen');
    } finally {
      setLoading(false);
    }
  }, [santriId, santriData, isBantuanRecipient]);

  useEffect(() => { loadDokumen(); }, [loadDokumen]);

  const handleFileUpload = async (jenis: string, file: File) => {
    if (!santriId) return toast.error('Simpan data diri dulu');
    try {
      setUploadingFiles(p => ({ ...p, [jenis]: true }));
      const fileExt = file.name.split('.').pop();
      const filePath = `santri/${santriId}/${jenis}/${Date.now()}.${fileExt}`;

      const { error: upErr } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, file);
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from('dokumen_santri').insert({
        santri_id: santriId,
        jenis_dokumen: jenis,
        nama_file: file.name,
        path_file: filePath,
        ukuran_file: file.size,
        tipe_file: file.type,
        status_verifikasi: 'Belum Diverifikasi'
      });
      if (insErr) throw insErr;

      toast.success('Upload berhasil');
      loadDokumen();
    } catch (e) {
      toast.error('Gagal upload');
    } finally {
      setUploadingFiles(p => ({ ...p, [jenis]: false }));
    }
  };

  const handleFileDelete = async (id: string, path: string) => {
    try {
      await supabase.storage.from(STORAGE_BUCKET).remove([path]);
      await supabase.from('dokumen_santri').delete().eq('id', id);
      toast.success('Dihapus');
      loadDokumen();
    } catch (e) { toast.error('Gagal hapus'); }
  };

  const handlePreview = (dok: DokumenItem) => {
    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(dok.path_file!);
    setPreviewFile({ url: data.publicUrl, name: dok.nama_file, type: dok.tipe_file });
  };

  const handleVerify = async () => {
    if (!verificationDialog?.id) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('dokumen_santri').update({
        status_verifikasi: verificationStatus,
        catatan_verifikasi: verificationNote,
        verifikasi_oleh: user?.id
      }).eq('id', verificationDialog.id);
      toast.success('Verifikasi disimpan');
      setVerificationDialog(null);
      loadDokumen();
    } catch (e) { toast.error('Gagal verifikasi'); }
  };

  const stats = useMemo(() => {
    const required = dokumenList.filter(d => d.required);
    const uploadedReq = required.filter(d => d.uploaded).length;
    return {
      progress: dokumenList.length ? Math.round((dokumenList.filter(d => d.uploaded).length / dokumenList.length) * 100) : 0,
      requiredLeft: required.length - uploadedReq
    };
  }, [dokumenList]);

  return (
    <div className="space-y-6">
      <Card className="border-l-4 border-blue-500 p-6 flex justify-between items-center">
        <div className="flex gap-4">
          <div className="p-3 bg-blue-50 rounded-xl"><FileText className="w-8 h-8 text-blue-600" /></div>
          <div>
            <h2 className="text-lg font-bold">Pemberkasan Digital</h2>
            <p className="text-sm text-slate-500">Lengkapi dokumen sesuai ketentuan.</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium">Progress: {stats.progress}%</div>
          <Progress value={stats.progress} className="w-32 h-2 mt-1" />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {dokumenList.map((dok) => (
          <DocumentCardItem
            key={dok.jenis_dokumen}
            dok={dok}
            uploaded={dok}
            isUploading={!!uploadingFiles[dok.jenis_dokumen]}
            santriId={santriId}
            isAdminMode={isAdminMode}
            onUpload={handleFileUpload}
            onPreview={handlePreview}
            onVerify={(d) => setVerificationDialog(d)}
            onDelete={handleFileDelete}
          />
        ))}
      </div>

      <DocumentPreviewDialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)} file={previewFile} />

      {isAdminMode && verificationDialog && (
        <Dialog open={!!verificationDialog} onOpenChange={() => setVerificationDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Verifikasi {verificationDialog.label}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex gap-2">
                <Button variant={verificationStatus === 'Diverifikasi' ? 'default' : 'outline'} onClick={() => setVerificationStatus('Diverifikasi')}>Valid</Button>
                <Button variant={verificationStatus === 'Ditolak' ? 'destructive' : 'outline'} onClick={() => setVerificationStatus('Ditolak')}>Tolak</Button>
              </div>
              <Input placeholder="Catatan..." value={verificationNote} onChange={(e) => setVerificationNote(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={handleVerify}>Simpan</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default DokumenSantriTab;