import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AkademikPertemuanService, KelasPertemuan, PertemuanStatus } from '@/services/akademikPertemuan.service';
import { AkademikKelasService, KelasMaster } from '@/services/akademikKelas.service';
import { AkademikAgendaService, AkademikAgenda } from '@/services/akademikAgenda.service';
import { AkademikSemesterService, Semester } from '@/services/akademikSemester.service';
import { AkademikPengajarService } from '@/services/akademikPengajar.service';
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
import { Calendar, Plus, Edit, Trash2, BookOpen, CheckCircle2, AlertCircle, Clock, Users, CalendarDays, Sparkles, CheckSquare, Square } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

type ProgramValue = 'Madin' | 'TPQ' | 'Tahfid' | 'Tahsin' | 'Semua';

const toDateInputValue = (date: Date) => date.toISOString().split('T')[0];

const startOfCurrentMonth = () => {
  const now = new Date();
  return toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1));
};

const endOfCurrentMonth = () => {
  const now = new Date();
  return toDateInputValue(new Date(now.getFullYear(), now.getMonth() + 1, 0));
};

interface PertemuanFormData {
  agenda_id: string;
  tanggal: string;
  status: PertemuanStatus;
  pengajar_nama?: string;
  materi?: string;
  catatan?: string;
}

const formatStatusBadge = (status: PertemuanStatus) => {
  switch (status) {
    case 'Berjalan':
      return <Badge className="bg-purple-100 text-purple-800">Berjalan</Badge>;
    case 'Selesai':
      return <Badge className="bg-emerald-100 text-emerald-800">Selesai</Badge>;
    case 'Batal':
      return <Badge className="bg-red-100 text-red-800">Batal</Badge>;
    case 'Tunda':
      return <Badge className="bg-orange-100 text-orange-800">Tunda</Badge>;
    default:
      return <Badge className="bg-blue-100 text-blue-800">Terjadwal</Badge>;
  }
};

const JurnalPertemuanPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPengajar = user?.role === 'pengajar' || user?.roles?.includes('pengajar');
  const [pengajarId, setPengajarId] = useState<string | null>(null);
  const [classes, setClasses] = useState<KelasMaster[]>([]);
  const [agendas, setAgendas] = useState<AkademikAgenda[]>([]);
  const [pertemuanList, setPertemuanList] = useState<KelasPertemuan[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | undefined>(undefined);
  const [kelasId, setKelasId] = useState<string>('all');
  const [agendaId, setAgendaId] = useState<string>('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPertemuan, setEditingPertemuan] = useState<KelasPertemuan | null>(null);
  const [formData, setFormData] = useState<PertemuanFormData>({
    agenda_id: '',
    tanggal: new Date().toISOString().split('T')[0],
    status: 'Terjadwal',
    pengajar_nama: '',
    materi: '',
    catatan: '',
  });
  const [quickEditDialog, setQuickEditDialog] = useState<{ open: boolean; pertemuan: KelasPertemuan | null }>({
    open: false,
    pertemuan: null,
  });
  const [quickEditTanggal, setQuickEditTanggal] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedPertemuanIds, setSelectedPertemuanIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('all'); // Format: 'YYYY-MM' atau 'all'

  const loadSemesters = useCallback(async () => {
    try {
      const list = await AkademikSemesterService.listSemester();
      setSemesters(list);
      // Set semester aktif sebagai default
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

  const loadClasses = useCallback(async (semesterId?: string) => {
    try {
      // Pastikan semesterId ada dan valid
      if (!semesterId) {
        setClasses([]);
        return;
      }

      // Verifikasi semester aktif
      const semester = semesters.find(s => s.id === semesterId);
      if (!semester) {
        setClasses([]);
        return;
      }

      let list: KelasMaster[];
      
      // Jika pengajar, hanya ambil kelas yang di-assign ke mereka
      if (isPengajar && pengajarId) {
        list = await AkademikKelasService.listKelasByPengajar(pengajarId, { semesterId });
      } else {
        list = await AkademikKelasService.listKelas();
      }
      
      // Filter kelas berdasarkan semester yang dipilih (hanya kelas dari semester tersebut)
      const filtered = list.filter(k => k.semester_id === semesterId);
      
      setClasses(filtered);
      
      // Reset kelasId jika kelas yang dipilih tidak ada lagi di filtered list
      if (kelasId !== 'all' && !filtered.some(k => k.id === kelasId)) {
        setKelasId('all');
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal memuat kelas');
      setClasses([]);
    }
  }, [kelasId, isPengajar, pengajarId, semesters]);

  const loadAgendas = useCallback(async (targetKelasId: string) => {
    try {
      let list: AkademikAgenda[];
      
      // Jika pengajar, hanya ambil agenda yang di-assign ke mereka
      if (isPengajar && pengajarId) {
        const allAgendas = await AkademikAgendaService.listAgendaByPengajar(pengajarId, { aktifOnly: false });
        
        // Jika kelas dipilih (bukan 'all'), filter hanya agenda untuk kelas tersebut
        if (targetKelasId && targetKelasId !== 'all') {
          list = allAgendas.filter(a => a.kelas_id === targetKelasId);
        } else {
          // Jika 'all', tampilkan semua agenda pengajar
          list = allAgendas;
        }
      } else {
        // Untuk admin/non-pengajar, hanya load jika kelas dipilih
        if (!targetKelasId || targetKelasId === 'all') {
      setAgendas([]);
      setAgendaId('all');
      return;
    }
        list = await AkademikAgendaService.listAgendaByKelas(targetKelasId, { aktifOnly: false });
      }
      
      setAgendas(list);
      if (list.length > 0) {
        // Jika agenda yang dipilih sebelumnya masih ada di list, pertahankan
        // Jika tidak, reset ke 'all'
        setAgendaId(prev => (prev !== 'all' && list.some(a => a.id === prev)) ? prev : 'all');
      } else {
        setAgendaId('all');
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal memuat agenda kelas');
      setAgendas([]);
      setAgendaId('all');
    }
  }, [isPengajar, pengajarId]);

  const loadPertemuan = useCallback(async () => {
    if (!selectedSemesterId) {
      setPertemuanList([]);
      return;
    }
    try {
      setLoading(true);
      const semester = semesters.find(s => s.id === selectedSemesterId);
      if (!semester) {
        setPertemuanList([]);
        return;
      }
      
      let data = await AkademikPertemuanService.listPertemuan({
        kelasId: kelasId && kelasId !== 'all' ? kelasId : undefined,
        agendaId: agendaId === 'all' ? undefined : agendaId,
        startDate: semester.tanggal_mulai,
        endDate: semester.tanggal_selesai,
      });
      
      // Filter pertemuan berdasarkan semester_id kelas
      // Hanya tampilkan pertemuan dari kelas yang memiliki semester_id sesuai dengan selectedSemesterId
      data = data.filter(p => {
        // Prioritas 1: Gunakan semester_id langsung dari kelas jika ada
        if (p.kelas?.semester_id) {
          return p.kelas.semester_id === selectedSemesterId;
        }
        
        // Prioritas 2: Jika kelasId sudah dipilih (bukan 'all'), pastikan kelas tersebut ada di filtered classes
        if (kelasId && kelasId !== 'all') {
          const kelas = classes.find(k => k.id === kelasId);
          if (!kelas || kelas.semester_id !== selectedSemesterId) {
            return false;
          }
          // Jika pertemuan memiliki kelas_id, pastikan sesuai dengan kelasId yang dipilih
          if (p.kelas_id && p.kelas_id !== kelasId) {
            return false;
          }
          return true;
        }
        
        // Prioritas 3: Jika kelasId adalah 'all', filter berdasarkan semester_id dari kelas di classes list
        if (p.kelas?.id) {
          const kelas = classes.find(k => k.id === p.kelas?.id);
          return kelas && kelas.semester_id === selectedSemesterId;
        }
        
        // Prioritas 4: Jika pertemuan memiliki kelas_id tapi tidak ada info kelas di response
        if (p.kelas_id) {
          const kelas = classes.find(k => k.id === p.kelas_id);
          return kelas && kelas.semester_id === selectedSemesterId;
        }
        
        // Jika tidak ada info kelas sama sekali, skip (kemungkinan data tidak lengkap)
        return false;
      });
      
      // Jika pengajar, filter hanya pertemuan yang terkait dengan agenda mereka
      if (isPengajar && pengajarId) {
        // Jika ada agenda yang sudah di-load, filter berdasarkan itu
        if (agendas.length > 0) {
          const agendaIds = agendas.map(a => a.id);
          data = data.filter(p => p.agenda_id && agendaIds.includes(p.agenda_id));
        } else {
          // Jika belum ada agenda, set empty untuk sementara
          // Agenda akan di-load kemudian dan pertemuan akan di-reload
          data = [];
        }
      }
      
      // Sort by tanggal ascending (pertemuan 1 hingga akhir)
      data.sort((a, b) => {
        const dateA = new Date(a.tanggal).getTime();
        const dateB = new Date(b.tanggal).getTime();
        return dateA - dateB;
      });
      
      setPertemuanList(data);
      // Reset selected items ketika data berubah
      setSelectedPertemuanIds(new Set());
    } catch (error: any) {
      toast.error(error.message || 'Gagal memuat daftar pertemuan');
      setPertemuanList([]);
    } finally {
      setLoading(false);
    }
  }, [selectedSemesterId, semesters, kelasId, agendaId, isPengajar, pengajarId, agendas, classes]);

  // Filter pertemuan berdasarkan bulan yang dipilih
  const filteredPertemuanList = useMemo(() => {
    if (selectedMonth === 'all') {
      return pertemuanList;
    }
    return pertemuanList.filter(p => {
      const pertemuanDate = new Date(p.tanggal);
      const pertemuanMonth = `${pertemuanDate.getFullYear()}-${String(pertemuanDate.getMonth() + 1).padStart(2, '0')}`;
      return pertemuanMonth === selectedMonth;
    });
  }, [pertemuanList, selectedMonth]);

  // Generate list bulan dari semester yang dipilih
  const availableMonths = useMemo(() => {
    if (!selectedSemesterId) return [];
    const semester = semesters.find(s => s.id === selectedSemesterId);
    if (!semester) return [];
    
    const months: Array<{ value: string; label: string }> = [];
    const startDate = new Date(semester.tanggal_mulai);
    const endDate = new Date(semester.tanggal_selesai);
    
    const current = new Date(startDate);
    current.setDate(1); // Set ke tanggal 1
    
    while (current <= endDate) {
      const monthValue = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = current.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      months.push({ value: monthValue, label: monthLabel });
      current.setMonth(current.getMonth() + 1);
    }
    
    return months;
  }, [selectedSemesterId, semesters]);

  useEffect(() => {
    loadSemesters();
  }, [loadSemesters]);

  useEffect(() => {
    if (selectedSemesterId && (!isPengajar || pengajarId)) {
      loadClasses(selectedSemesterId);
    } else {
      setClasses([]);
    }
  }, [selectedSemesterId, loadClasses, isPengajar, pengajarId]);

  useEffect(() => {
    // Untuk pengajar, load semua agenda mereka jika kelasId adalah 'all'
    // Untuk admin, hanya load jika kelasId dipilih
    if (isPengajar && pengajarId) {
      loadAgendas(kelasId);
    } else {
    if (kelasId && kelasId !== 'all') {
      loadAgendas(kelasId);
    } else {
      setAgendas([]);
      setAgendaId('all');
    }
    }
  }, [kelasId, loadAgendas, isPengajar, pengajarId]);

  useEffect(() => {
    if (selectedSemesterId && classes.length >= 0) {
      // Tunggu sebentar untuk memastikan classes dan agendas sudah di-load
      const timer = setTimeout(() => {
        loadPertemuan();
      }, 200);
      return () => clearTimeout(timer);
    } else if (!selectedSemesterId) {
      setPertemuanList([]);
    }
  }, [loadPertemuan, selectedSemesterId, classes.length]);

  // Reload pertemuan setelah agendas berubah (untuk pengajar)
  useEffect(() => {
    if (selectedSemesterId && isPengajar && pengajarId && agendas.length > 0) {
      loadPertemuan();
    }
  }, [agendas.length, selectedSemesterId, isPengajar, pengajarId, loadPertemuan]);

  const agendaLabel = (agenda: AkademikAgenda) => {
    // Prioritas: mapel > nama_agenda
    const displayName = agenda.mapel_nama || agenda.mapel?.nama_mapel || agenda.nama_agenda || 'Agenda';
    
    const meta: string[] = [];
    if (agenda.hari) meta.push(agenda.hari);
    if (agenda.jam_mulai) {
      const start = agenda.jam_mulai.slice(0, 5);
      const end = agenda.jam_selesai ? agenda.jam_selesai.slice(0, 5) : undefined;
      meta.push(end ? `${start} - ${end}` : start);
    }
    
    // Tampilkan nama agenda hanya jika berbeda dengan mapel
    const showAgendaName = (agenda.mapel_nama || agenda.mapel?.nama_mapel) && 
                           agenda.nama_agenda && 
                           agenda.nama_agenda !== (agenda.mapel_nama || agenda.mapel?.nama_mapel);
    
    if (showAgendaName) {
      return meta.length 
        ? `${displayName} (${agenda.nama_agenda}) — ${meta.join(' • ')}` 
        : `${displayName} (${agenda.nama_agenda})`;
    }
    
    return meta.length ? `${displayName} — ${meta.join(' • ')}` : displayName;
  };

  const handleOpenDialog = () => {
    // Hanya untuk tambah pertemuan baru, tidak untuk edit
    setEditingPertemuan(null);
    setFormData({
      agenda_id: agendaId && agendaId !== 'all' ? agendaId : agendas[0]?.id || '',
      tanggal: new Date().toISOString().split('T')[0],
      status: 'Terjadwal',
      pengajar_nama: '',
      materi: '',
      catatan: '',
    });
    setDialogOpen(true);
  };

  const handleSavePertemuan = async () => {
    if (!formData.agenda_id || !formData.tanggal) {
      toast.error('Agenda dan tanggal wajib diisi');
      return;
    }
    try {
      // Hanya untuk tambah pertemuan baru
      const agenda = agendas.find(a => a.id === formData.agenda_id);
      await AkademikPertemuanService.createPertemuan({
        agenda_id: formData.agenda_id,
        tanggal: formData.tanggal,
        status: 'Terjadwal',
        kelas_id: agenda?.kelas?.id || kelasId,
      });
      toast.success('Pertemuan ditambahkan');
      setDialogOpen(false);
      loadPertemuan();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan pertemuan');
    }
  };

  const handleDeletePertemuan = async (id: string) => {
    if (!confirm('Hapus pertemuan ini?')) return;
    try {
      await AkademikPertemuanService.deletePertemuan(id);
      toast.success('Pertemuan dihapus');
      loadPertemuan();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus pertemuan');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPertemuanIds.size === 0) {
      toast.error('Pilih pertemuan yang akan dihapus');
      return;
    }

    if (!confirm(`Hapus ${selectedPertemuanIds.size} pertemuan yang dipilih?`)) return;

    try {
      setBulkDeleting(true);
      const ids = Array.from(selectedPertemuanIds);
      let successCount = 0;
      let errorCount = 0;

      // Delete secara paralel dengan batasan
      const deletePromises = ids.map(async (id) => {
        try {
          await AkademikPertemuanService.deletePertemuan(id);
          successCount++;
        } catch (error: any) {
          console.error(`Error deleting pertemuan ${id}:`, error);
          errorCount++;
        }
      });

      await Promise.all(deletePromises);

      if (errorCount > 0) {
        toast.warning(`${successCount} pertemuan dihapus, ${errorCount} gagal`);
      } else {
        toast.success(`${successCount} pertemuan berhasil dihapus`);
      }

      setSelectedPertemuanIds(new Set());
      loadPertemuan();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus pertemuan');
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedPertemuanIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedPertemuanIds.size === filteredPertemuanList.length) {
      // Deselect all
      setSelectedPertemuanIds(new Set());
    } else {
      // Select all
      setSelectedPertemuanIds(new Set(filteredPertemuanList.map(p => p.id)));
    }
  };

  const handleGoToAbsensi = (pertemuan: KelasPertemuan) => {
    const params = new URLSearchParams();
    if (pertemuan.kelas?.id) params.set('kelasId', pertemuan.kelas.id);
    if (pertemuan.id) params.set('pertemuanId', pertemuan.id);
    if (pertemuan.agenda_id) params.set('agendaId', pertemuan.agenda_id);
    if (pertemuan.tanggal) params.set('tanggal', pertemuan.tanggal);
    navigate(`/akademik/presensi?${params.toString()}`);
  };

  const handleGoToSetoran = (pertemuan: KelasPertemuan) => {
    const params = new URLSearchParams();
    if (pertemuan.kelas?.program) params.set('program', pertemuan.kelas.program);
    if (pertemuan.tanggal) params.set('tanggal', pertemuan.tanggal);
    if (pertemuan.agenda_id) params.set('agendaId', pertemuan.agenda_id);
    navigate(`/akademik/setoran?${params.toString()}`);
  };

  // Quick action: Tandai selesai
  const handleQuickMarkSelesai = async (pertemuan: KelasPertemuan) => {
    if (pertemuan.status === 'Selesai') {
      toast.info('Pertemuan sudah selesai');
      return;
    }
    try {
      await AkademikPertemuanService.updatePertemuan(pertemuan.id, {
        status: 'Selesai',
      });
      toast.success('Pertemuan ditandai selesai');
      loadPertemuan();
    } catch (error: any) {
      toast.error(error.message || 'Gagal memperbarui status');
    }
  };

  // Quick action: Edit jadwal (hanya tanggal)
  const handleQuickEditJadwal = async (pertemuan: KelasPertemuan, newTanggal: string) => {
    try {
      await AkademikPertemuanService.updatePertemuan(pertemuan.id, {
        tanggal: newTanggal,
      });
      toast.success('Jadwal diperbarui');
      loadPertemuan();
    } catch (error: any) {
      toast.error(error.message || 'Gagal memperbarui jadwal');
    }
  };

  const handleOpenQuickEditJadwal = (pertemuan: KelasPertemuan) => {
    setQuickEditDialog({ open: true, pertemuan });
    setQuickEditTanggal(pertemuan.tanggal);
  };

  const handleSaveQuickEditJadwal = async () => {
    if (!quickEditDialog.pertemuan) return;
    await handleQuickEditJadwal(quickEditDialog.pertemuan, quickEditTanggal);
    setQuickEditDialog({ open: false, pertemuan: null });
  };

  const handleGeneratePertemuanOtomatis = async () => {
    if (!selectedSemesterId) {
      toast.error('Pilih semester terlebih dahulu');
      return;
    }

    try {
      setGenerating(true);
      const result = await AkademikPertemuanService.generatePertemuanOtomatis(
        selectedSemesterId,
        {
          kelasId: kelasId && kelasId !== 'all' ? kelasId : undefined,
          agendaId: agendaId === 'all' ? undefined : agendaId,
          overwrite: false, // Jangan overwrite yang sudah ada
        }
      );

      if (result.errors > 0) {
        toast.warning(
          `Generate selesai: ${result.created} dibuat, ${result.skipped} dilewati, ${result.errors} error`
        );
      } else {
        toast.success(
          `Generate selesai: ${result.created} pertemuan dibuat, ${result.skipped} sudah ada sebelumnya`
        );
      }

      setGenerateDialogOpen(false);
      // Reload daftar pertemuan
      await loadPertemuan();
    } catch (error: any) {
      toast.error(error.message || 'Gagal generate pertemuan otomatis');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Jurnal Pertemuan</h2>
          <p className="text-sm text-muted-foreground">Kelola dan catat pertemuan per agenda secara terpusat.</p>
        </div>
        <div className="flex gap-2">
          {selectedPertemuanIds.size > 0 && (
            <Button 
              variant="destructive" 
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Hapus {selectedPertemuanIds.size} Terpilih
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => setGenerateDialogOpen(true)}
            disabled={!selectedSemesterId || generating}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Otomatis
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Pertemuan
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter & Generate</CardTitle>
          <CardDescription>
            Jurnal pertemuan di-generate otomatis berdasarkan jadwal agenda kelas. 
            Pilih semester untuk melihat atau generate jurnal pertemuan.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div>
            <Label>Semester *</Label>
            <Select value={selectedSemesterId || ''} onValueChange={(value) => {
              setSelectedSemesterId(value);
              setSelectedMonth('all'); // Reset bulan saat semester berubah
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih semester" />
              </SelectTrigger>
              <SelectContent>
                {semesters.map(semester => (
                  <SelectItem key={semester.id} value={semester.id}>
                    {semester.nama} • {semester.tahun_ajaran?.nama || 'Tahun Ajaran'}
                    {semester.is_aktif && ' (Aktif)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSemesterId && (
              <p className="text-xs text-muted-foreground mt-1">
                {semesters.find(s => s.id === selectedSemesterId)?.tanggal_mulai && 
                  new Date(semesters.find(s => s.id === selectedSemesterId)!.tanggal_mulai).toLocaleDateString('id-ID')} — {' '}
                {semesters.find(s => s.id === selectedSemesterId)?.tanggal_selesai && 
                  new Date(semesters.find(s => s.id === selectedSemesterId)!.tanggal_selesai).toLocaleDateString('id-ID')}
              </p>
            )}
          </div>
          <div>
            <Label>Kelas (Opsional)</Label>
            <Select value={kelasId || 'all'} onValueChange={(value) => setKelasId(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Semua kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                {classes.map(k => (
                  <SelectItem key={k.id} value={k.id}>
                    {k.nama_kelas} {k.rombel ? `- ${k.rombel}` : ''} ({k.program})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Agenda (Opsional)</Label>
            <Select value={agendaId || 'all'} onValueChange={(value) => setAgendaId(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Semua agenda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Agenda</SelectItem>
                {agendas.map(agenda => (
                  <SelectItem key={agenda.id} value={agenda.id}>
                    {agendaLabel(agenda)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {kelasId === 'all' && (
              <p className="text-xs text-muted-foreground mt-1">
                Pilih kelas terlebih dahulu untuk melihat agenda
              </p>
            )}
          </div>
          <div>
            <Label>Bulan (Opsional)</Label>
            <Select value={selectedMonth || 'all'} onValueChange={(value) => setSelectedMonth(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Semua bulan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Bulan</SelectItem>
                {availableMonths.map(month => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pertemuan</CardTitle>
          <CardDescription>Ringkasan pertemuan berdasarkan filter yang dipilih.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Memuat pertemuan...</div>
          ) : filteredPertemuanList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {selectedMonth !== 'all' 
                ? 'Tidak ada pertemuan untuk bulan yang dipilih. Coba pilih bulan lain atau "Semua Bulan".'
                : 'Tidak ada pertemuan untuk filter ini. Klik "Tambah Pertemuan" untuk menjadwalkan.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <button
                        onClick={handleSelectAll}
                        className="flex items-center justify-center"
                        title={selectedPertemuanIds.size === filteredPertemuanList.length ? 'Deselect all' : 'Select all'}
                      >
                        {selectedPertemuanIds.size === filteredPertemuanList.length && filteredPertemuanList.length > 0 ? (
                          <CheckSquare className="w-4 h-4" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>No</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Agenda</TableHead>
                    <TableHead>Pengajar</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Materi</TableHead>
                    <TableHead>Catatan</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPertemuanList.map((pertemuan, index) => (
                    <TableRow key={pertemuan.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedPertemuanIds.has(pertemuan.id)}
                          onCheckedChange={() => handleToggleSelect(pertemuan.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {new Date(pertemuan.tanggal).toLocaleDateString('id-ID', {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short',
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {/* Nama agenda atau mapel dengan quick actions */}
                          <div className="flex items-center gap-2">
                            <div className="font-semibold flex-1">
                              {pertemuan.agenda?.mapel_nama || pertemuan.agenda?.mapel?.nama_mapel || pertemuan.agenda?.nama_agenda || '-'}
                            </div>
                            <div className="flex items-center gap-1">
                              {/* Quick action: Tandai Selesai */}
                              {pertemuan.status !== 'Selesai' && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => handleQuickMarkSelesai(pertemuan)}
                                  title="Tandai selesai"
                                >
                                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                                </Button>
                              )}
                              {/* Quick action: Absensi */}
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => handleGoToAbsensi(pertemuan)}
                                title="Input absensi"
                              >
                                <Users className="w-4 h-4 text-blue-600" />
                              </Button>
                              {/* Quick action: Edit Jadwal */}
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => handleOpenQuickEditJadwal(pertemuan)}
                                title="Edit jadwal (tanggal)"
                              >
                                <CalendarDays className="w-4 h-4 text-orange-600" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Tampilkan nama agenda hanya jika berbeda dengan mapel */}
                          {(pertemuan.agenda?.mapel_nama || pertemuan.agenda?.mapel?.nama_mapel) && 
                           pertemuan.agenda?.nama_agenda &&
                           pertemuan.agenda.nama_agenda !== (pertemuan.agenda.mapel_nama || pertemuan.agenda.mapel?.nama_mapel) && (
                            <p className="text-xs text-muted-foreground">
                              {pertemuan.agenda.nama_agenda}
                            </p>
                          )}
                          
                          {/* Info kelas jika berbeda dari filter */}
                          {pertemuan.kelas && (kelasId === 'all' || pertemuan.kelas.id !== kelasId) && (
                            <p className="text-xs text-primary font-medium">
                              {pertemuan.kelas.nama_kelas}
                              {pertemuan.kelas.rombel && ` - ${pertemuan.kelas.rombel}`}
                          </p>
                          )}
                          
                          {/* Jadwal (hari dan jam) */}
                        {pertemuan.agenda?.hari && (
                          <p className="text-xs text-muted-foreground">
                              {pertemuan.agenda.hari}
                            {pertemuan.agenda.jam_mulai
                                ? ` (${pertemuan.agenda.jam_mulai.slice(0, 5)} - ${
                                  pertemuan.agenda.jam_selesai
                                    ? pertemuan.agenda.jam_selesai.slice(0, 5)
                                    : 'Selesai'
                                })`
                              : ''}
                          </p>
                        )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {pertemuan.pengajar_nama || 
                         pertemuan.agenda?.pengajar_nama || 
                         pertemuan.agenda?.pengajar?.nama_lengkap || 
                         <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>{formatStatusBadge(pertemuan.status)}</TableCell>
                      <TableCell className="max-w-xs whitespace-pre-wrap text-sm">
                        {pertemuan.materi || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="max-w-xs whitespace-pre-wrap text-sm">
                        {pertemuan.catatan || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGoToSetoran(pertemuan)}
                          >
                            Setoran
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => handleDeletePertemuan(pertemuan.id)}
                            title="Hapus pertemuan"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Tambah Pertemuan Baru - Sederhana */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Pertemuan</DialogTitle>
            <DialogDescription>
              Tambahkan pertemuan baru untuk agenda kelas. Edit pertemuan menggunakan quick actions di tabel.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Agenda *</Label>
              <Select
                value={formData.agenda_id || undefined}
                onValueChange={(value) => setFormData({ ...formData, agenda_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih agenda" />
                </SelectTrigger>
                <SelectContent>
                  {agendas.map(agenda => (
                    <SelectItem key={agenda.id} value={agenda.id}>
                      {agendaLabel(agenda)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tanggal *</Label>
              <Input
                type="date"
                value={formData.tanggal}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSavePertemuan} disabled={!formData.agenda_id || !formData.tanggal}>
              Tambah Pertemuan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Quick Edit Jadwal */}
      <Dialog open={quickEditDialog.open} onOpenChange={(open) => setQuickEditDialog({ open, pertemuan: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Jadwal Pertemuan</DialogTitle>
            <DialogDescription>
              Ubah tanggal pertemuan. Agenda dan pengaturan lain tetap sama.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tanggal Baru *</Label>
              <Input
                type="date"
                value={quickEditTanggal}
                onChange={(e) => setQuickEditTanggal(e.target.value)}
              />
            </div>
            {quickEditDialog.pertemuan && (
              <div className="text-sm text-muted-foreground">
                <p>Agenda: {quickEditDialog.pertemuan.agenda?.mapel_nama || quickEditDialog.pertemuan.agenda?.nama_agenda || '-'}</p>
                <p>Tanggal lama: {new Date(quickEditDialog.pertemuan.tanggal).toLocaleDateString('id-ID')}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickEditDialog({ open: false, pertemuan: null })}>
              Batal
            </Button>
            <Button onClick={handleSaveQuickEditJadwal} disabled={!quickEditTanggal}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Generate Otomatis */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Pertemuan Otomatis</DialogTitle>
            <DialogDescription>
              <div className="space-y-2">
                <p>
                  Generate jurnal pertemuan secara otomatis berdasarkan <strong>jadwal agenda kelas</strong> yang sudah diatur di modul Master Kelas.
                </p>
                <p className="text-xs">
                  Sistem akan membaca agenda aktif dengan jadwal hari (Senin, Selasa, dll) dan membuat pertemuan untuk setiap hari yang sesuai dalam rentang tanggal agenda (dibatasi oleh semester).
                </p>
                <p className="text-xs text-amber-600">
                  ⚠️ Pastikan agenda kelas sudah diatur dengan benar: hari, tanggal mulai, dan tanggal selesai.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedSemesterId && (
              <div className="text-sm space-y-2">
                <p className="font-medium">Parameter Generate:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Semester: {semesters.find(s => s.id === selectedSemesterId)?.nama || '-'}</li>
                  <li>Kelas: {kelasId === 'all' ? 'Semua Kelas' : classes.find(k => k.id === kelasId)?.nama_kelas || '-'}</li>
                  <li>Agenda: {agendaId === 'all' ? 'Semua Agenda' : agendas.find(a => a.id === agendaId)?.nama_agenda || '-'}</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  Pertemuan yang sudah ada akan dilewati. Hanya agenda aktif dengan jadwal hari yang akan di-generate.
                </p>
                {kelasId === 'all' && classes.length > 0 && (
                  <p className="text-xs text-amber-600 mt-2 font-medium">
                    ⚠️ Akan generate untuk {classes.length} kelas. Proses ini mungkin memakan waktu.
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateDialogOpen(false)} disabled={generating}>
              Batal
            </Button>
            <Button onClick={handleGeneratePertemuanOtomatis} disabled={!selectedSemesterId || generating}>
              {generating ? 'Generating...' : 'Generate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JurnalPertemuanPage;


