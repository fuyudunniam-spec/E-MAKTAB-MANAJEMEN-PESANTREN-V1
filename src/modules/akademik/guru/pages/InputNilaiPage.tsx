import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AkademikKelasService, KelasMaster } from '@/modules/akademik/services/akademikKelas.service';
import { AkademikSemesterService, Semester } from '@/modules/akademik/services/akademikSemester.service';
import { AkademikAgendaService, AkademikAgenda } from '@/modules/akademik/services/akademikAgenda.service';
import { AkademikNilaiService, Nilai, NilaiInput, KehadiranSummary } from '@/modules/akademik/services/akademikNilai.service';
import { AkademikPengajarService } from '@/modules/akademik/services/akademikPengajar.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { BookOpen, Save, RefreshCw, CheckCircle2, XCircle, AlertCircle, Users, Search, GraduationCap, Lock, Unlock, Eye, Alert } from 'lucide-react';
import { Alert as AlertComponent, AlertDescription } from '@/components/ui/alert';

interface AnggotaKelas {
  id: string;
  nama_lengkap: string;
  id_santri?: string;
}

interface NilaiFormData {
  nilai_angka: number | null;
  nilai_huruf: string;
  nilai_deskripsi: string;
  catatan: string;
}

const InputNilaiPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const isPengajar = user?.role === 'pengajar' || user?.roles?.includes('pengajar');
  const [pengajarId, setPengajarId] = useState<string | null>(null);

  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | undefined>(undefined);
  const [classes, setClasses] = useState<KelasMaster[]>([]);
  const [kelasId, setKelasId] = useState<string>('');
  const [agendas, setAgendas] = useState<AkademikAgenda[]>([]);
  const [selectedAgendaId, setSelectedAgendaId] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Data nilai dan kehadiran
  const [nilaiList, setNilaiList] = useState<Nilai[]>([]);
  const [anggotaKelas, setAnggotaKelas] = useState<AnggotaKelas[]>([]);
  const [kehadiranMap, setKehadiranMap] = useState<Record<string, KehadiranSummary>>({});

  // Dialog input nilai
  const [nilaiDialogOpen, setNilaiDialogOpen] = useState(false);
  const [selectedSantri, setSelectedSantri] = useState<AnggotaKelas | null>(null);
  const [selectedAgenda, setSelectedAgenda] = useState<AkademikAgenda | null>(null);
  const [formData, setFormData] = useState<NilaiFormData>({
    nilai_angka: null,
    nilai_huruf: '',
    nilai_deskripsi: '',
    catatan: '',
  });
  const [saving, setSaving] = useState(false);
  const [loadingKehadiran, setLoadingKehadiran] = useState(false);

  // Status nilai untuk konteks kelas+term+jadwal
  const [statusNilai, setStatusNilai] = useState<'Draft' | 'Locked' | 'Published' | null>(null);
  const [kelasStatusNilai, setKelasStatusNilai] = useState<'Draft' | 'Locked' | 'Published' | 'Partial' | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [locking, setLocking] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishingBulk, setPublishingBulk] = useState(false);
  const [statusError, setStatusError] = useState<string>('');

  // Dialog konfirmasi
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'lock' | 'publish' | 'publishBulk' | null>(null);

  const selectedKelas = classes.find(k => k.id === kelasId);
  const selectedAgendaObj = agendas.find(a => a.id === selectedAgendaId);
  const isAdmin = user?.role === 'admin' || user?.roles?.includes('admin');
  const isStaff = user?.role === 'staff' || user?.roles?.includes('staff');
  const isAdminOrStaff = isAdmin || isStaff;

  // Load pengajar_id jika user adalah pengajar
  useEffect(() => {
    const loadPengajarId = async () => {
      if (!isPengajar || !user?.id) return;
      
      try {
        const id = await AkademikPengajarService.getPengajarIdByUserId(user.id);
        setPengajarId(id);
      } catch (error: any) {
        console.error('Error loading pengajar ID:', error);
      }
    };

    loadPengajarId();
  }, [isPengajar, user]);

  const loadSemesters = useCallback(async () => {
    try {
      const list = await AkademikSemesterService.listSemester();
      setSemesters(list);
      const aktif = list.find(s => s.is_aktif);
      if (aktif) {
        setSelectedSemesterId(aktif.id);
      } else if (list.length > 0) {
        setSelectedSemesterId(list[0].id);
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal memuat semester');
    }
  }, []);

  const loadClasses = useCallback(async (semesterId?: string) => {
    try {
      if (!semesterId) {
        setClasses([]);
        return;
      }

      const semester = semesters.find(s => s.id === semesterId);
      if (!semester) {
        setClasses([]);
        return;
      }

      let list: KelasMaster[];
      
      if (isPengajar && pengajarId) {
        list = await AkademikKelasService.listKelasByPengajar(pengajarId, { semesterId });
      } else {
        list = await AkademikKelasService.listKelas();
      }
      
      const filtered = list.filter(k => k.semester_id === semesterId);
      setClasses(filtered);
      
      if (filtered.length > 0 && !kelasId) {
        setKelasId(filtered[0].id);
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal memuat kelas');
    }
  }, [isPengajar, pengajarId, semesters, kelasId]);

  const loadAgendas = useCallback(async (kelasIdParam?: string, semesterIdParam?: string) => {
    try {
      if (!kelasIdParam || !semesterIdParam) {
        setAgendas([]);
        return;
      }

      // Filter agenda by kelas_id and semester_id
      const list = await AkademikAgendaService.listAgenda({
        kelasId: kelasIdParam,
        semesterId: semesterIdParam,
        aktifOnly: true
      });
      setAgendas(list);
      
      if (list.length > 0 && selectedAgendaId === 'all') {
        // Bisa set default agenda jika diperlukan
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal memuat agenda');
    }
  }, [selectedAgendaId]);

  const loadAnggotaKelas = useCallback(async (kelasIdParam?: string) => {
    try {
      if (!kelasIdParam) {
        setAnggotaKelas([]);
        return;
      }

      const { data, error } = await supabase
        .from('kelas_anggota')
        .select(`
          id,
          santri_id,
          santri:santri_id(id, nama_lengkap, id_santri)
        `)
        .eq('kelas_id', kelasIdParam)
        .eq('status', 'Aktif')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const anggota = (data || []).map((row: any) => ({
        id: row.santri?.id || row.santri_id,
        nama_lengkap: row.santri?.nama_lengkap || 'Tanpa Nama',
        id_santri: row.santri?.id_santri,
      }));

      setAnggotaKelas(anggota);
    } catch (error: any) {
      console.error('Error loading anggota kelas:', error);
      toast.error('Gagal memuat anggota kelas');
    }
  }, []);

  const loadKehadiran = useCallback(async (santriId: string) => {
    if (!kelasId || !selectedSemesterId) return null;

    try {
      setLoadingKehadiran(true);
      const kehadiran = await AkademikNilaiService.hitungPersentaseKehadiran(
        santriId,
        kelasId,
        selectedSemesterId
      );
      return kehadiran;
    } catch (error: any) {
      console.error('Error loading kehadiran:', error);
      return null;
    } finally {
      setLoadingKehadiran(false);
    }
  }, [kelasId, selectedSemesterId]);

  const loadNilai = useCallback(async () => {
    if (!kelasId || !selectedSemesterId) {
      setNilaiList([]);
      return;
    }

    try {
      setLoading(true);
      const list = await AkademikNilaiService.listNilai(kelasId, selectedSemesterId, {
        agendaId: selectedAgendaId !== 'all' ? selectedAgendaId : undefined,
      });
      setNilaiList(list);
    } catch (error: any) {
      toast.error(error.message || 'Gagal memuat nilai');
    } finally {
      setLoading(false);
    }
  }, [kelasId, selectedSemesterId, selectedAgendaId]);

  // Load status nilai untuk kelas+term (bulk) - untuk mode "all"
  const loadKelasStatusNilai = useCallback(async () => {
    if (!kelasId || !selectedSemesterId || selectedAgendaId !== 'all') {
      setKelasStatusNilai(null);
      return;
    }

    try {
      setLoadingStatus(true);
      setStatusError('');
      const status = await AkademikNilaiService.getStatusNilaiKelasTerm(kelasId, selectedSemesterId);
      setKelasStatusNilai(status);
    } catch (error: any) {
      console.error('Error loading kelas status nilai:', error);
      setStatusError('Gagal memuat status nilai kelas');
      setKelasStatusNilai(null);
    } finally {
      setLoadingStatus(false);
    }
  }, [kelasId, selectedSemesterId, selectedAgendaId]);

  // Load status nilai untuk konteks kelas+term+jadwal
  const loadStatusNilai = useCallback(async () => {
    if (!kelasId || !selectedSemesterId || !selectedAgendaId || selectedAgendaId === 'all') {
      setStatusNilai(null);
      return;
    }

    try {
      setLoadingStatus(true);
      setStatusError('');
      const list = await AkademikNilaiService.listNilai(kelasId, selectedSemesterId, {
        agendaId: selectedAgendaId,
      });
      
      // Tentukan status dengan fallback yang lebih robust
      // Jika semua nilai sudah Published, status = Published
      // Jika semua nilai sudah Locked (atau mix Locked/Published), status = Locked
      // Jika ada yang Draft atau belum ada nilai, status = Draft
      if (list.length === 0) {
        setStatusNilai('Draft');
      } else {
        // Check dengan fallback: jika status_nilai tidak ada, cek published_at/locked_at
        const allPublished = list.every(n => {
          if (n.status_nilai === 'Published') return true;
          if (!n.status_nilai && (n as any).published_at) return true;
          if (!n.status_nilai && (n as any).is_published) return true;
          return false;
        });
        const allLockedOrPublished = list.every(n => {
          if (n.status_nilai === 'Locked' || n.status_nilai === 'Published') return true;
          if (!n.status_nilai && ((n as any).locked_at || (n as any).is_locked)) return true;
          if (!n.status_nilai && ((n as any).published_at || (n as any).is_published)) return true;
          return false;
        });
        const hasDraft = list.some(n => {
          if (n.status_nilai === 'Draft' || !n.status_nilai) {
            // Jika tidak ada flag lain, berarti Draft
            if (!(n as any).published_at && !(n as any).is_published && !(n as any).locked_at && !(n as any).is_locked) {
              return true;
            }
          }
          return false;
        });
        
        if (allPublished) {
          setStatusNilai('Published');
        } else if (allLockedOrPublished && !hasDraft) {
          setStatusNilai('Locked');
        } else {
          setStatusNilai('Draft');
        }
      }
    } catch (error: any) {
      console.error('Error loading status nilai:', error);
      setStatusError('Gagal memuat status nilai');
      setStatusNilai(null);
    } finally {
      setLoadingStatus(false);
    }
  }, [kelasId, selectedSemesterId, selectedAgendaId]);

  // Load data saat filter berubah
  useEffect(() => {
    loadSemesters();
  }, [loadSemesters]);

  useEffect(() => {
    if (selectedSemesterId) {
      loadClasses(selectedSemesterId);
    }
  }, [selectedSemesterId, loadClasses]);

  useEffect(() => {
    if (kelasId && selectedSemesterId) {
      loadAgendas(kelasId, selectedSemesterId);
      loadAnggotaKelas(kelasId);
      loadNilai();
    }
  }, [kelasId, selectedSemesterId, loadAgendas, loadAnggotaKelas, loadNilai]);

  useEffect(() => {
    loadStatusNilai();
  }, [loadStatusNilai]);

  // Load kehadiran untuk semua santri saat anggota kelas berubah
  useEffect(() => {
    const loadAllKehadiran = async () => {
      if (!kelasId || !selectedSemesterId || anggotaKelas.length === 0) {
        return;
      }

      // Load kehadiran untuk semua santri
      const kehadiranPromises = anggotaKelas.map(async (santri) => {
        try {
          const kehadiran = await AkademikNilaiService.hitungPersentaseKehadiran(
            santri.id,
            kelasId,
            selectedSemesterId
          );
          return { santriId: santri.id, kehadiran };
        } catch (error) {
          console.error(`Error loading kehadiran for santri ${santri.id}:`, error);
          return null;
        }
      });

      const results = await Promise.all(kehadiranPromises);
      const newKehadiranMap: Record<string, KehadiranSummary> = {};
      
      results.forEach((result) => {
        if (result && result.kehadiran) {
          newKehadiranMap[result.santriId] = result.kehadiran;
        }
      });

      setKehadiranMap(newKehadiranMap);
    };

    loadAllKehadiran();
  }, [anggotaKelas, kelasId, selectedSemesterId]);

  // Filter anggota berdasarkan search term
  const filteredAnggota = useMemo(() => {
    if (!searchTerm) return anggotaKelas;
    const term = searchTerm.toLowerCase();
    return anggotaKelas.filter(
      (a) =>
        a.nama_lengkap.toLowerCase().includes(term) ||
        a.id_santri?.toLowerCase().includes(term)
    );
  }, [anggotaKelas, searchTerm]);

  // Get nilai untuk santri tertentu
  const getNilaiForSantri = (santriId: string, agendaId: string) => {
    return nilaiList.find((n) => n.santri_id === santriId && n.agenda_id === agendaId);
  };

  // Handle open dialog input nilai
  const handleOpenInputNilai = async (santri: AnggotaKelas, agenda: AkademikAgenda) => {
    if (!kelasId || !selectedSemesterId) {
      toast.error('Pilih kelas dan semester terlebih dahulu');
      return;
    }

    // Load kehadiran terlebih dahulu
    setLoadingKehadiran(true);
    try {
      const kehadiran = await loadKehadiran(santri.id);
      
      if (!kehadiran) {
        toast.error('Gagal memuat data kehadiran');
        return;
      }

      // P0: Validasi: jika kehadiran < 75%, tidak bisa input nilai (diubah dari 60% menjadi 75%)
      // Tapi jika nilai sudah locked/published, tetap bisa lihat (read-only)
      const nilaiLama = getNilaiForSantri(santri.id, agenda.id);
      const isLockedOrPublished = nilaiLama?.status_nilai === 'Locked' || nilaiLama?.status_nilai === 'Published';
      
      if (kehadiran.persentase_kehadiran < 75 && !isLockedOrPublished) {
        toast.error(
          `Tidak dapat input nilai karena kehadiran kurang dari 75%. Kehadiran saat ini: ${kehadiran.persentase_kehadiran.toFixed(2)}%`
        );
        return;
      }

      // Set kehadiran di map
      setKehadiranMap((prev) => ({
        ...prev,
        [santri.id]: kehadiran,
      }));
      
      setSelectedSantri(santri);
      setSelectedAgenda(agenda);
      setFormData({
        nilai_angka: nilaiLama?.nilai_angka || null,
        nilai_huruf: nilaiLama?.nilai_huruf || '',
        nilai_deskripsi: nilaiLama?.nilai_deskripsi || '',
        catatan: nilaiLama?.catatan || '',
      });
      setNilaiDialogOpen(true);
    } catch (error: any) {
      toast.error(error.message || 'Gagal memuat data kehadiran');
    } finally {
      setLoadingKehadiran(false);
    }
  };

  // Handle save nilai
  const handleSaveNilai = async () => {
    if (!selectedSantri || !selectedAgenda || !kelasId || !selectedSemesterId) {
      toast.error('Data tidak lengkap');
      return;
    }

    if (formData.nilai_angka === null || formData.nilai_angka < 0 || formData.nilai_angka > 100) {
      toast.error('Nilai angka harus antara 0-100');
      return;
    }

    setSaving(true);
    try {
      const input: NilaiInput = {
        santri_id: selectedSantri.id,
        kelas_id: kelasId,
        semester_id: selectedSemesterId,
        agenda_id: selectedAgenda.id,
        nilai_angka: formData.nilai_angka,
        nilai_huruf: formData.nilai_huruf,
        nilai_deskripsi: formData.nilai_deskripsi,
        catatan: formData.catatan,
      };

      await AkademikNilaiService.inputNilai(input);
      toast.success('Nilai berhasil disimpan');
      setNilaiDialogOpen(false);
      setSelectedSantri(null);
      setSelectedAgenda(null);
      setFormData({
        nilai_angka: null,
        nilai_huruf: '',
        nilai_deskripsi: '',
        catatan: '',
      });
      await loadNilai();
      await loadStatusNilai(); // Refresh status setelah save
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan nilai');
    } finally {
      setSaving(false);
    }
  };

  // Handle lock nilai
  const handleLockNilai = async () => {
    if (!kelasId || !selectedSemesterId || !selectedAgendaId || selectedAgendaId === 'all') {
      toast.error('Pilih kelas dan jadwal terlebih dahulu');
      return;
    }

    setLocking(true);
    setStatusError('');
    try {
      await AkademikNilaiService.lockNilai(kelasId, selectedSemesterId, selectedAgendaId);
      toast.success('Nilai berhasil dikunci');
      await loadNilai();
      await loadStatusNilai();
      setConfirmDialogOpen(false);
    } catch (error: any) {
      setStatusError(error.message || 'Gagal mengunci nilai');
      toast.error(error.message || 'Gagal mengunci nilai');
    } finally {
      setLocking(false);
    }
  };

  // Handle publish nilai
  const handlePublishNilai = async () => {
    if (!kelasId || !selectedSemesterId || !selectedAgendaId || selectedAgendaId === 'all') {
      toast.error('Pilih kelas dan jadwal terlebih dahulu');
      return;
    }

    setPublishing(true);
    setStatusError('');
    try {
      await AkademikNilaiService.publishNilai(kelasId, selectedSemesterId, selectedAgendaId);
      toast.success('Nilai berhasil dipublish');
      await loadNilai();
      await loadStatusNilai();
      setConfirmDialogOpen(false);
    } catch (error: any) {
      setStatusError(error.message || 'Gagal mempublish nilai');
      toast.error(error.message || 'Gagal mempublish nilai');
    } finally {
      setPublishing(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status: 'Draft' | 'Locked' | 'Published' | null) => {
    if (!status) return null;
    
    switch (status) {
      case 'Draft':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700">Draft</Badge>;
      case 'Locked':
        return <Badge className="bg-yellow-100 text-yellow-800">Locked</Badge>;
      case 'Published':
        return <Badge className="bg-green-100 text-green-800">Published</Badge>;
      default:
        return null;
    }
  };

  // Auto-convert nilai angka ke huruf dan deskripsi
  useEffect(() => {
    if (formData.nilai_angka !== null) {
      let huruf = '';
      let deskripsi = '';
      
      if (formData.nilai_angka >= 90) {
        huruf = 'A';
        deskripsi = 'Sangat Baik';
      } else if (formData.nilai_angka >= 80) {
        huruf = 'B';
        deskripsi = 'Baik';
      } else if (formData.nilai_angka >= 70) {
        huruf = 'C';
        deskripsi = 'Cukup';
      } else if (formData.nilai_angka >= 60) {
        huruf = 'D';
        deskripsi = 'Kurang';
      } else {
        huruf = 'E';
        deskripsi = 'Sangat Kurang';
      }

      setFormData((prev) => ({
        ...prev,
        nilai_huruf: huruf,
        nilai_deskripsi: deskripsi,
      }));
    }
  }, [formData.nilai_angka]);

  // Get status badge untuk kehadiran (P0: threshold 75%)
  const getKehadiranBadge = (persentase: number) => {
    if (persentase >= 75) {
      return <Badge className="bg-green-100 text-green-800">{persentase.toFixed(2)}%</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">{persentase.toFixed(2)}%</Badge>;
    }
  };

  // Get status badge untuk nilai
  const getNilaiBadge = (nilai: Nilai | undefined) => {
    if (!nilai || nilai.status_kelulusan === 'Belum Dinilai') {
      return <Badge className="bg-gray-100 text-gray-800">Belum Dinilai</Badge>;
    }
    if (nilai.status_kelulusan === 'Lulus') {
      return <Badge className="bg-green-100 text-green-800">Lulus</Badge>;
    }
    return <Badge className="bg-red-100 text-red-800">Tidak Lulus</Badge>;
  };

  // Computed status untuk display (selalu ada, tidak null)
  const computedStatus: 'Draft' | 'Locked' | 'Published' | 'Partial' | '—' = 
    selectedAgendaId === 'all' && kelasId && selectedSemesterId && kelasStatusNilai
      ? kelasStatusNilai
      : (selectedAgendaId !== 'all' && kelasId && selectedSemesterId && statusNilai)
      ? statusNilai
      : '—';

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Input Nilai
                <Badge variant="outline" className="ml-2 text-xs bg-blue-50 text-blue-700 border-blue-200">
                  UI: NILAI_WORKFLOW_V2
                </Badge>
              </CardTitle>
              <CardDescription>
                Input nilai per santri per mata pelajaran dengan validasi kehadiran minimum 75%
              </CardDescription>
            </div>
            {/* Badge status SELALU tampil */}
            <div className="flex items-center gap-2">
              {computedStatus !== '—' ? (
                computedStatus === 'Partial' ? (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-800">Partial (Beberapa Locked)</Badge>
                ) : (
                  getStatusBadge(computedStatus as 'Draft' | 'Locked' | 'Published')
                )
              ) : (
                <Badge variant="outline" className="bg-gray-50 text-gray-500">—</Badge>
              )}
            </div>
          </div>
          {statusError && (
            <AlertComponent variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{statusError}</AlertDescription>
            </AlertComponent>
          )}
          {/* Debug strip sementara */}
          <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono space-y-1">
            <div><strong>DEBUG:</strong></div>
            <div>Role: {isPengajar ? 'Pengajar' : isAdminOrStaff ? 'Admin/Staff' : 'Unknown'}</div>
            <div>selectedSemesterId: {selectedSemesterId || 'null'}</div>
            <div>kelasId: {kelasId || 'null'}</div>
            <div>selectedAgendaId: {selectedAgendaId || 'null'}</div>
            <div>computedStatus: {computedStatus}</div>
            <div>statusNilai (raw): {statusNilai || 'null'}</div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Semester</Label>
              <Select
                value={selectedSemesterId || ''}
                onValueChange={(value) => setSelectedSemesterId(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((semester) => (
                    <SelectItem key={semester.id} value={semester.id}>
                      {semester.nama} - {semester.tahun_ajaran?.nama || ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Kelas</Label>
              <Select value={kelasId} onValueChange={setKelasId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((kelas) => (
                    <SelectItem key={kelas.id} value={kelas.id}>
                      {kelas.nama_kelas} ({kelas.program})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Mata Pelajaran (Agenda)</Label>
              <Select value={selectedAgendaId} onValueChange={setSelectedAgendaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua mapel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Mapel</SelectItem>
                  {agendas.map((agenda) => (
                    <SelectItem key={agenda.id} value={agenda.id}>
                      {agenda.nama_agenda} {agenda.mapel_nama ? `(${agenda.mapel_nama})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search */}
          <div>
            <Label>Cari Santri</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Cari berdasarkan nama atau ID santri..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Aksi Lock/Publish - SELALU tampil */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {/* Helper text jika konteks belum lengkap */}
                {(!selectedSemesterId || !kelasId || selectedAgendaId === 'all') && (
                  <div className="space-y-1">
                    <Button variant="outline" disabled className="w-full sm:w-auto">
                      <Lock className="w-4 h-4 mr-2" />
                      Kunci Nilai
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      {!selectedSemesterId && !kelasId && selectedAgendaId === 'all'
                        ? 'Pilih semester, kelas, dan jadwal terlebih dahulu'
                        : !selectedSemesterId
                        ? 'Pilih semester terlebih dahulu'
                        : !kelasId
                        ? 'Pilih kelas terlebih dahulu'
                        : 'Pilih jadwal (bukan "Semua Mapel") terlebih dahulu'}
                    </p>
                  </div>
                )}

                {/* UI untuk konteks lengkap */}
                {selectedSemesterId && kelasId && selectedAgendaId !== 'all' && (
                  <>
                    {isPengajar && (
                      <>
                        {computedStatus === 'Draft' && (
                          <div className="space-y-2">
                            <Button
                              onClick={() => {
                                setConfirmAction('lock');
                                setConfirmDialogOpen(true);
                              }}
                              disabled={locking || loadingStatus}
                              className="w-full sm:w-auto"
                            >
                              <Lock className="w-4 h-4 mr-2" />
                              {locking ? 'Mengunci...' : 'Kunci Nilai'}
                            </Button>
                            <p className="text-xs text-muted-foreground">
                              Setelah dikunci, nilai tidak dapat diubah oleh pengajar
                            </p>
                          </div>
                        )}
                        {(computedStatus === 'Locked' || computedStatus === 'Published') && (
                          <div className="space-y-1">
                            <Button variant="outline" disabled className="w-full sm:w-auto">
                              <Lock className="w-4 h-4 mr-2" />
                              Nilai Sudah Dikunci
                            </Button>
                            <p className="text-xs text-muted-foreground">
                              {computedStatus === 'Locked' 
                                ? 'Nilai sudah dikunci. Menunggu admin/staff untuk publish.'
                                : 'Nilai sudah dipublish dan tampil di profil santri.'}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                    {isAdminOrStaff && (
                      <>
                        {computedStatus === 'Locked' && (
                          <div className="space-y-2">
                            <Button
                              onClick={() => {
                                setConfirmAction('publish');
                                setConfirmDialogOpen(true);
                              }}
                              disabled={publishing || loadingStatus}
                              className="w-full sm:w-auto"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              {publishing ? 'Mempublish...' : 'Publish Nilai'}
                            </Button>
                            <p className="text-xs text-muted-foreground">
                              Setelah dipublish, nilai akan tampil di profil santri
                            </p>
                          </div>
                        )}
                        {computedStatus === 'Draft' && (
                          <div className="space-y-1">
                            <Button variant="outline" disabled className="w-full sm:w-auto">
                              <Eye className="w-4 h-4 mr-2" />
                              Publish Nilai
                            </Button>
                            <p className="text-xs text-muted-foreground">
                              Menunggu pengajar mengunci nilai terlebih dahulu
                            </p>
                          </div>
                        )}
                        {computedStatus === 'Published' && (
                          <div className="space-y-1">
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Sudah dipublish
                            </Badge>
                            <p className="text-xs text-muted-foreground">
                              Nilai sudah tampil di profil santri
                            </p>
                          </div>
                        )}
                      </>
                    )}
                    {!isPengajar && !isAdminOrStaff && (
                      <div className="space-y-1">
                        <Button variant="outline" disabled className="w-full sm:w-auto">
                          <Lock className="w-4 h-4 mr-2" />
                          Kunci/Publish Nilai
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Hanya pengajar dan admin/staff yang dapat mengunci/mempublish nilai
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabel Nilai */}
      {!selectedSemesterId ? (
        <div className="text-center py-8 text-muted-foreground">Pilih semester terlebih dahulu</div>
      ) : !kelasId ? (
        <div className="text-center py-8 text-muted-foreground">Pilih kelas terlebih dahulu</div>
      ) : loading ? (
        <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
      ) : filteredAnggota.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">Tidak ada anggota kelas</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Daftar Nilai</CardTitle>
            <CardDescription>
              Klik pada sel untuk input atau edit nilai. Kehadiran minimum 75% diperlukan untuk input nilai.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Nama Santri</TableHead>
                    <TableHead>ID Santri</TableHead>
                    {selectedAgendaId === 'all' ? (
                      agendas.map((agenda) => (
                        <TableHead key={agenda.id} className="min-w-[150px]">
                          <div className="text-xs">{agenda.nama_agenda}</div>
                          <div className="text-xs text-muted-foreground">
                            {agenda.mapel_nama || '-'}
                          </div>
                        </TableHead>
                      ))
                    ) : selectedAgendaObj ? (
                      <>
                        <TableHead>Kehadiran</TableHead>
                        <TableHead>Nilai</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aksi</TableHead>
                      </>
                    ) : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAnggota.map((santri, index) => {
                    if (selectedAgendaId === 'all') {
                      // Tampilkan semua mapel dalam satu baris
                      return (
                        <TableRow key={santri.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{santri.nama_lengkap}</TableCell>
                          <TableCell>{santri.id_santri || '-'}</TableCell>
                          {agendas.map((agenda) => {
                            const nilai = getNilaiForSantri(santri.id, agenda.id);
                            return (
                              <TableCell key={agenda.id}>
                                <div className="space-y-1">
                                  {nilai ? (
                                    <>
                                      <div className="font-medium">
                                        {nilai.nilai_angka !== null ? nilai.nilai_angka : '-'}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {nilai.nilai_huruf || '-'}
                                      </div>
                                      <div className="text-xs">
                                        {getNilaiBadge(nilai)}
                                      </div>
                                    </>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">-</span>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full mt-2"
                                    onClick={() => handleOpenInputNilai(santri, agenda)}
                                    disabled={
                                      loadingKehadiran || 
                                      (kehadiranMap[santri.id] && kehadiranMap[santri.id].persentase_kehadiran < 75 && nilai?.status_nilai !== 'Locked' && nilai?.status_nilai !== 'Published') ||
                                      nilai?.status_nilai === 'Locked' ||
                                      nilai?.status_nilai === 'Published'
                                    }
                                    title={
                                      nilai?.status_nilai === 'Locked' || nilai?.status_nilai === 'Published'
                                        ? 'Nilai sudah dikunci/dipublish, tidak dapat diubah'
                                        : kehadiranMap[santri.id] && kehadiranMap[santri.id].persentase_kehadiran < 75 
                                        ? `Kehadiran kurang dari 75% (${kehadiranMap[santri.id].persentase_kehadiran.toFixed(2)}%)`
                                        : ''
                                    }
                                  >
                                    {nilai?.status_nilai === 'Locked' || nilai?.status_nilai === 'Published'
                                      ? 'Lihat'
                                      : nilai 
                                      ? 'Edit' 
                                      : 'Input'}
                                  </Button>
                                </div>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    } else {
                      // Tampilkan detail untuk satu mapel
                      const nilai = getNilaiForSantri(santri.id, selectedAgendaId);
                      const kehadiran = kehadiranMap[santri.id];
                      
                      return (
                        <TableRow key={santri.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{santri.nama_lengkap}</TableCell>
                          <TableCell>{santri.id_santri || '-'}</TableCell>
                          <TableCell>
                            {kehadiran ? (
                              <div className="space-y-1">
                                {getKehadiranBadge(kehadiran.persentase_kehadiran)}
                                <div className="text-xs text-muted-foreground">
                                  {kehadiran.total_hadir}/{kehadiran.total_pertemuan} pertemuan
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {nilai ? (
                              <div className="space-y-1">
                                <div className="font-medium">
                                  {nilai.nilai_angka !== null ? nilai.nilai_angka : '-'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {nilai.nilai_huruf || '-'}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>{getNilaiBadge(nilai)}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant={nilai ? 'outline' : 'default'}
                              onClick={() => selectedAgendaObj && handleOpenInputNilai(santri, selectedAgendaObj)}
                              disabled={
                                loadingKehadiran || 
                                !selectedAgendaObj || 
                                (kehadiran && kehadiran.persentase_kehadiran < 75 && nilai?.status_nilai !== 'Locked' && nilai?.status_nilai !== 'Published') ||
                                nilai?.status_nilai === 'Locked' ||
                                nilai?.status_nilai === 'Published'
                              }
                              title={
                                nilai?.status_nilai === 'Locked' || nilai?.status_nilai === 'Published'
                                  ? 'Nilai sudah dikunci/dipublish, tidak dapat diubah'
                                  : kehadiran && kehadiran.persentase_kehadiran < 75 
                                  ? `Kehadiran kurang dari 75% (${kehadiran.persentase_kehadiran.toFixed(2)}%)`
                                  : ''
                              }
                            >
                              {nilai?.status_nilai === 'Locked' || nilai?.status_nilai === 'Published'
                                ? 'Lihat'
                                : nilai 
                                ? 'Edit' 
                                : 'Input'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    }
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog Input Nilai */}
      <Dialog open={nilaiDialogOpen} onOpenChange={setNilaiDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedSantri && selectedAgenda && (getNilaiForSantri(selectedSantri.id, selectedAgenda.id)?.status_nilai === 'Locked' || getNilaiForSantri(selectedSantri.id, selectedAgenda.id)?.status_nilai === 'Published')
                ? 'Lihat Nilai'
                : 'Input Nilai'}
            </DialogTitle>
            <DialogDescription>
              {selectedSantri && selectedAgenda && (getNilaiForSantri(selectedSantri.id, selectedAgenda.id)?.status_nilai === 'Locked' || getNilaiForSantri(selectedSantri.id, selectedAgenda.id)?.status_nilai === 'Published')
                ? `Nilai untuk ${selectedSantri?.nama_lengkap || 'santri'} (sudah dikunci/dipublish)`
                : `Input nilai untuk ${selectedSantri?.nama_lengkap || 'santri'}`}
            </DialogDescription>
          </DialogHeader>

          {selectedSantri && kehadiranMap[selectedSantri.id] && (
            <div className="space-y-4">
              {/* Info Kehadiran */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Informasi Kehadiran</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Total Pertemuan</Label>
                      <div className="font-medium">{kehadiranMap[selectedSantri.id].total_pertemuan}</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Total Hadir</Label>
                      <div className="font-medium">{kehadiranMap[selectedSantri.id].total_hadir}</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Persentase Kehadiran</Label>
                      <div className="font-medium">
                        {getKehadiranBadge(kehadiranMap[selectedSantri.id].persentase_kehadiran)}
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Status</Label>
                      <div className="font-medium">
                        {kehadiranMap[selectedSantri.id].persentase_kehadiran >= 75 ? (
                          <Badge className="bg-green-100 text-green-800">Bisa Input Nilai</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">Tidak Bisa Input Nilai</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Form Input Nilai */}
              <div className="space-y-4">
                <div>
                  <Label>Nilai Angka (0-100) *</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.nilai_angka ?? ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        nilai_angka: e.target.value ? parseFloat(e.target.value) : null,
                      }))
                    }
                    placeholder="Masukkan nilai (0-100)"
                    disabled={saving || (selectedSantri && selectedAgenda && (getNilaiForSantri(selectedSantri.id, selectedAgenda.id)?.status_nilai === 'Locked' || getNilaiForSantri(selectedSantri.id, selectedAgenda.id)?.status_nilai === 'Published'))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nilai Huruf</Label>
                    <Input
                      value={formData.nilai_huruf}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, nilai_huruf: e.target.value }))
                      }
                      placeholder="A, B, C, D, E"
                      readOnly
                    />
                  </div>
                  <div>
                    <Label>Deskripsi</Label>
                    <Input
                      value={formData.nilai_deskripsi}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, nilai_deskripsi: e.target.value }))
                      }
                      placeholder="Sangat Baik, Baik, Cukup, dll"
                      readOnly
                    />
                  </div>
                </div>

                <div>
                  <Label>Catatan</Label>
                  <Textarea
                    value={formData.catatan}
                    onChange={(e) => setFormData((prev) => ({ ...prev, catatan: e.target.value }))}
                    placeholder="Catatan tambahan (opsional)"
                    rows={3}
                    disabled={saving || (selectedSantri && selectedAgenda && (getNilaiForSantri(selectedSantri.id, selectedAgenda.id)?.status_nilai === 'Locked' || getNilaiForSantri(selectedSantri.id, selectedAgenda.id)?.status_nilai === 'Published'))}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setNilaiDialogOpen(false)} disabled={saving}>
              {selectedSantri && selectedAgenda && (getNilaiForSantri(selectedSantri.id, selectedAgenda.id)?.status_nilai === 'Locked' || getNilaiForSantri(selectedSantri.id, selectedAgenda.id)?.status_nilai === 'Published')
                ? 'Tutup'
                : 'Batal'}
            </Button>
            {(!selectedSantri || !selectedAgenda || (getNilaiForSantri(selectedSantri.id, selectedAgenda.id)?.status_nilai !== 'Locked' && getNilaiForSantri(selectedSantri.id, selectedAgenda.id)?.status_nilai !== 'Published')) && (
              <Button onClick={handleSaveNilai} disabled={saving || !formData.nilai_angka}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Menyimpan...' : 'Simpan Nilai'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Lock/Publish */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction === 'lock' 
                ? 'Kunci Nilai' 
                : confirmAction === 'publishBulk'
                ? 'Publish Nilai Kelas'
                : 'Publish Nilai'}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === 'lock' ? (
                <>
                  Apakah Anda yakin ingin mengunci nilai untuk jadwal ini?
                  <br />
                  <br />
                  <strong>Catatan:</strong> Nilai kosong atau kehadiran &lt;75% akan otomatis menjadi D (60).
                  <br />
                  Setelah dikunci, nilai tidak dapat diubah oleh pengajar.
                </>
              ) : confirmAction === 'publishBulk' ? (
                <>
                  Apakah Anda yakin ingin mempublish semua nilai untuk seluruh mapel pada kelas ini?
                  <br />
                  <br />
                  <strong>Catatan:</strong> Semua mapel harus sudah dikunci terlebih dahulu.
                  <br />
                  Setelah dipublish, semua nilai akan tampil di profil santri.
                </>
              ) : (
                <>
                  Apakah Anda yakin ingin mempublish nilai untuk jadwal ini?
                  <br />
                  <br />
                  Setelah dipublish, nilai akan tampil di profil santri dan tidak dapat diubah.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              disabled={locking || publishing || publishingBulk}
            >
              Batal
            </Button>
            <Button
              onClick={
                confirmAction === 'lock' 
                  ? handleLockNilai 
                  : confirmAction === 'publishBulk'
                  ? handlePublishNilaiKelasTerm
                  : handlePublishNilai
              }
              disabled={locking || publishing || publishingBulk}
            >
              {locking || publishing || publishingBulk 
                ? 'Memproses...' 
                : confirmAction === 'lock' 
                ? 'Kunci' 
                : confirmAction === 'publishBulk'
                ? 'Publish Semua'
                : 'Publish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InputNilaiPage;

