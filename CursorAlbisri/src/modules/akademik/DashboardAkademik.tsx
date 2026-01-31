// REDESIGNED Dashboard Akademik
// Menampilkan tabel KELAS dengan detail jadwal expandable (bukan tabel agenda campur)

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { FilterBar } from '@/components/dashboard/akademik/FilterBar';
import { KPIStatCard } from '@/components/dashboard/akademik/KPIStatCard';
import { TaskQueue, TaskItem } from '@/components/dashboard/akademik/TaskQueue';
import {
  Calendar,
  Users,
  CheckCircle2,
  UserCheck,
  FileText,
  ChevronDown,
  ChevronRight,
  Edit,
  Archive,
  ArchiveRestore,
  ClipboardList,
  GraduationCap,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, ChevronLeft, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Services
import { AkademikSemesterService, Semester } from '@/services/akademikSemester.service';
import { AkademikKelasService, KelasMaster } from '@/services/akademikKelas.service';
import { AkademikAgendaService, AkademikAgenda } from '@/services/akademikAgenda.service';
import { AkademikPertemuanService, KelasPertemuan } from '@/services/akademikPertemuan.service';
import { AkademikNilaiService, Nilai } from '@/services/akademikNilai.service';
import { supabase } from '@/integrations/supabase/client';

interface KelasTableRow {
  kelas: KelasMaster;
  jadwalAktif: number;
  pertemuanSelesaiPercent: number;
  presensiPercent: number;
  nilaiStatus: 'Draft' | 'Locked' | 'Published' | 'none';
  expanded?: boolean;
  jadwal?: JadwalDetail[];
}

interface JadwalDetail {
  agenda: AkademikAgenda;
  pertemuanSelesai: number;
  pertemuanTotal: number;
  presensiPercent: number;
  nilaiStatus: 'Draft' | 'Locked' | 'Published' | 'none';
}

const DashboardAkademik: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.roles?.includes('admin');
  const isStaff = user?.role === 'staff' || user?.roles?.includes('staff');
  const isAdminOrStaff = isAdmin || isStaff;

  // Filter state
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);
  const [domain, setDomain] = useState<string>('Madin'); // Madin atau Qur'an Progress

  // Data state
  const [loading, setLoading] = useState(false);
  const [kpiData, setKpiData] = useState({
    agendaAktif: 0,
    kelasAktif: 0,
    pertemuanSelesai: 0,
    presensiPercent: 0,
    nilaiPublishedPercent: 0,
    nilaiLockedPercent: 0,
  });
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [kelasTableData, setKelasTableData] = useState<KelasTableRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Dialog state untuk edit/nonaktifkan jadwal
  const [jadwalDialogOpen, setJadwalDialogOpen] = useState(false);
  const [editingJadwal, setEditingJadwal] = useState<AkademikAgenda | null>(null);
  const [deactivatingJadwal, setDeactivatingJadwal] = useState(false);
  const [activatingJadwal, setActivatingJadwal] = useState(false);
  const [generatingPertemuan, setGeneratingPertemuan] = useState<string | null>(null);

  // Load semesters and set default
  useEffect(() => {
    const loadSemesters = async () => {
      try {
        const allSemesters = await AkademikSemesterService.listSemester();
        setSemesters(allSemesters);
        
        // Set active semester as default
        const activeSemester = allSemesters.find(s => s.is_aktif) || allSemesters[0] || null;
        setSelectedSemester(activeSemester);
      } catch (error: any) {
        toast.error('Gagal memuat semester');
        console.error(error);
      }
    };
    loadSemesters();
  }, []);

  // Load dashboard data when filters change
  const loadDashboard = useCallback(async () => {
    if (!selectedSemester || domain !== 'Madin') return; // Hanya Madin untuk sekarang

    try {
      setLoading(true);

      // Get semester date range
      const semesterStart = selectedSemester.tanggal_mulai;
      const semesterEnd = selectedSemester.tanggal_selesai;

      // Filter kelas by semester
      const allKelas = await AkademikKelasService.listKelas();
      const kelasInSemester = allKelas.filter(k => k.semester_id === selectedSemester.id);
      
      // Filter by domain (Madin)
      const filteredKelas = kelasInSemester.filter(k => k.program === 'Madin');

      // Get kelas IDs
      const kelasIds = filteredKelas.map(k => k.id);
      if (kelasIds.length === 0) {
        setKpiData({
          agendaAktif: 0,
          kelasAktif: 0,
          pertemuanSelesai: 0,
          presensiPercent: 0,
          nilaiPublishedPercent: 0,
          nilaiLockedPercent: 0,
        });
        setTasks([]);
        setKelasTableData([]);
        return;
      }

      // Load agendas for these kelas
      const allAgendas = await AkademikAgendaService.listAgenda({
        aktifOnly: false, // Include all untuk hitung total
        semesterId: selectedSemester.id,
      });
      const agendasInSemester = allAgendas.filter(a => 
        a.kelas && kelasIds.includes(a.kelas.id)
      );
      const agendasAktif = agendasInSemester.filter(a => a.aktif !== false);

      // Load pertemuan for these kelas
      const allPertemuan = await AkademikPertemuanService.listPertemuan({
        startDate: semesterStart,
        endDate: semesterEnd,
      });
      const pertemuanInSemester = allPertemuan.filter(p => 
        p.kelas?.semester_id === selectedSemester.id
      );
      const pertemuanSelesai = pertemuanInSemester.filter(p => p.status === 'Selesai');

      // Load absensi for pertemuan selesai
      const pertemuanSelesaiIds = pertemuanSelesai.map(p => p.id).filter(Boolean) as string[];
      let absensiCount = 0;
      if (pertemuanSelesaiIds.length > 0) {
        const { count } = await supabase
          .from('absensi_madin')
          .select('id', { count: 'exact', head: true })
          .in('pertemuan_id', pertemuanSelesaiIds);
        absensiCount = count || 0;
      }

      // Calculate KPI
      const agendaAktif = agendasAktif.length;
      const kelasAktif = filteredKelas.length;
      const pertemuanSelesaiCount = pertemuanSelesai.length;
      
      // Calculate presensi percent
      let presensiPercent = 0;
      if (pertemuanSelesaiCount > 0) {
        const { data: absensiData } = await supabase
          .from('absensi_madin')
          .select('pertemuan_id')
          .in('pertemuan_id', pertemuanSelesaiIds);
        
        const pertemuanWithAbsensi = new Set((absensiData || []).map(a => a.pertemuan_id));
        const pertemuanWithAbsensiCount = pertemuanWithAbsensi.size;
        presensiPercent = (pertemuanWithAbsensiCount / pertemuanSelesaiCount) * 100;
      }

      // Load nilai untuk hitung status
      const nilaiList: Nilai[] = [];
      for (const kelas of filteredKelas) {
        try {
          const nilai = await AkademikNilaiService.listNilai(kelas.id, selectedSemester.id);
          nilaiList.push(...nilai);
        } catch (e) {
          // Skip if error
        }
      }
      
      // Hitung persentase nilai published dan locked
      const nilaiPublished = nilaiList.filter(n => n.status_nilai === 'Published');
      const nilaiLocked = nilaiList.filter(n => n.status_nilai === 'Locked');
      const nilaiPublishedPercent = nilaiList.length > 0 ? (nilaiPublished.length / nilaiList.length) * 100 : 0;
      const nilaiLockedPercent = nilaiList.length > 0 ? (nilaiLocked.length / nilaiList.length) * 100 : 0;

      setKpiData({
        agendaAktif,
        kelasAktif,
        pertemuanSelesai: pertemuanSelesaiCount,
        presensiPercent: Math.round(presensiPercent * 10) / 10,
        nilaiPublishedPercent: Math.round(nilaiPublishedPercent * 10) / 10,
        nilaiLockedPercent: Math.round(nilaiLockedPercent * 10) / 10,
      });

      // Build Task Queue
      const taskItems: TaskItem[] = [];
      
      // 1. Agenda belum generate pertemuan
      for (const agenda of agendasAktif) {
        const pertemuanForAgenda = pertemuanInSemester.filter(p => p.agenda_id === agenda.id);
        if (pertemuanForAgenda.length === 0) {
          taskItems.push({
            id: `agenda-no-pertemuan-${agenda.id}`,
            type: 'agenda_no_pertemuan',
            title: `Jadwal "${agenda.nama_agenda || agenda.mapel_nama || '-'}" belum memiliki pertemuan`,
            subtitle: `${agenda.kelas?.nama_kelas || '-'}`,
            actionLabel: 'Generate Pertemuan',
            actionPath: `/akademik/jurnal?agendaId=${agenda.id}`,
            priority: 'medium',
            disabled: selectedSemester.is_locked ?? false,
            disabledReason: selectedSemester.is_locked ? 'Semester terkunci' : undefined,
          });
        }
      }

      // 2. Pertemuan selesai tanpa presensi
      if (pertemuanSelesaiIds.length > 0) {
        const { data: absensiForPertemuan } = await supabase
          .from('absensi_madin')
          .select('pertemuan_id')
          .in('pertemuan_id', pertemuanSelesaiIds);
        
        const pertemuanWithAbsensi = new Set((absensiForPertemuan || []).map(a => a.pertemuan_id));
        
        for (const pertemuan of pertemuanSelesai) {
          if (pertemuan.id && !pertemuanWithAbsensi.has(pertemuan.id)) {
            taskItems.push({
              id: `pertemuan-no-presensi-${pertemuan.id}`,
              type: 'pertemuan_no_presensi',
              title: `Pertemuan "${pertemuan.agenda?.nama_agenda || pertemuan.agenda?.mapel_nama || '-'}" selesai tanpa presensi`,
              subtitle: `${pertemuan.kelas?.nama_kelas || '-'} • ${new Date(pertemuan.tanggal).toLocaleDateString('id-ID')}`,
              actionLabel: 'Isi Presensi',
              actionPath: `/akademik/pertemuan?tab=presensi&pertemuanId=${pertemuan.id}`,
              priority: 'high',
              disabled: selectedSemester.is_locked ?? false,
              disabledReason: selectedSemester.is_locked ? 'Semester terkunci' : undefined,
            });
          }
        }
      }

      // 3. Nilai belum dikunci (menunggu pengajar)
      for (const kelas of filteredKelas) {
        try {
          const nilai = await AkademikNilaiService.listNilai(kelas.id, selectedSemester.id);
          const nilaiDraft = nilai.filter(n => n.status_nilai === 'Draft' || !n.status_nilai);
          if (nilaiDraft.length > 0) {
            // Group by agenda
            const agendaIds = [...new Set(nilaiDraft.map(n => n.agenda_id).filter(Boolean))];
            for (const agendaId of agendaIds) {
              const agenda = agendasInSemester.find(a => a.id === agendaId);
              if (agenda) {
                taskItems.push({
                  id: `nilai-draft-${kelas.id}-${agendaId}`,
                  type: 'nilai_not_published',
                  title: `Nilai "${agenda.nama_agenda || agenda.mapel_nama || '-'}" belum dikunci`,
                  subtitle: `${kelas.nama_kelas} • Menunggu pengajar mengunci`,
                  actionLabel: 'Buka Nilai',
                  actionPath: `/akademik/nilai?kelasId=${kelas.id}&agendaId=${agendaId}&semesterId=${selectedSemester.id}`,
                  priority: 'medium',
                  disabled: selectedSemester.is_locked ?? false,
                  disabledReason: selectedSemester.is_locked ? 'Semester terkunci' : undefined,
                });
              }
            }
          }
        } catch (e) {
          // Skip
        }
      }

      // 4. Nilai terkunci tapi belum dipublish (hanya untuk Admin/Staff)
      if (isAdminOrStaff) {
        for (const kelas of filteredKelas) {
          try {
            const nilai = await AkademikNilaiService.listNilai(kelas.id, selectedSemester.id);
            const nilaiLocked = nilai.filter(n => n.status_nilai === 'Locked');
            if (nilaiLocked.length > 0) {
              const agendaIds = [...new Set(nilaiLocked.map(n => n.agenda_id).filter(Boolean))];
              for (const agendaId of agendaIds) {
                const agenda = agendasInSemester.find(a => a.id === agendaId);
                if (agenda) {
                  taskItems.push({
                    id: `nilai-locked-${kelas.id}-${agendaId}`,
                    type: 'nilai_not_published',
                    title: `Nilai "${agenda.nama_agenda || agenda.mapel_nama || '-'}" terkunci, belum dipublish`,
                    subtitle: `${kelas.nama_kelas} • Siap untuk publish`,
                    actionLabel: 'Publish Nilai',
                    actionPath: `/akademik/nilai?kelasId=${kelas.id}&agendaId=${agendaId}&semesterId=${selectedSemester.id}`,
                    priority: 'high',
                    disabled: selectedSemester.is_locked ?? false,
                    disabledReason: selectedSemester.is_locked ? 'Semester terkunci' : undefined,
                  });
                }
              }
            }
          } catch (e) {
            // Skip
          }
        }
      }

      // Sort tasks by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      taskItems.sort((a, b) => 
        (priorityOrder[a.priority || 'low']) - (priorityOrder[b.priority || 'low'])
      );
      setTasks(taskItems.slice(0, 20));

      // Build Kelas Table Data
      const kelasRows: KelasTableRow[] = [];
      
      for (const kelas of filteredKelas) {
        // Get jadwal untuk kelas ini
        const jadwalKelas = agendasInSemester.filter(a => a.kelas?.id === kelas.id);
        const jadwalAktif = jadwalKelas.filter(a => a.aktif !== false).length;

        // Calculate pertemuan percent untuk kelas
        const pertemuanKelas = pertemuanInSemester.filter(p => p.kelas_id === kelas.id);
        const pertemuanSelesaiKelas = pertemuanKelas.filter(p => p.status === 'Selesai');
        const pertemuanSelesaiPercent = pertemuanKelas.length > 0 
          ? (pertemuanSelesaiKelas.length / pertemuanKelas.length) * 100 
          : 0;

        // Calculate presensi percent untuk kelas
        let presensiPercentKelas = 0;
        if (pertemuanSelesaiKelas.length > 0) {
          const selesaiIds = pertemuanSelesaiKelas.map(p => p.id).filter(Boolean) as string[];
          if (selesaiIds.length > 0) {
            const { data: absensiData } = await supabase
              .from('absensi_madin')
              .select('pertemuan_id')
              .in('pertemuan_id', selesaiIds);
            
            const pertemuanWithAbsensi = new Set((absensiData || []).map(a => a.pertemuan_id));
            presensiPercentKelas = (pertemuanWithAbsensi.size / pertemuanSelesaiKelas.length) * 100;
          }
        }

        // Check nilai status untuk kelas (ambil status dominan)
        let nilaiStatusKelas: 'Draft' | 'Locked' | 'Published' | 'none' = 'none';
        try {
          const nilaiKelas = await AkademikNilaiService.listNilai(kelas.id, selectedSemester.id);
          if (nilaiKelas.length > 0) {
            const allPublished = nilaiKelas.every(n => n.status_nilai === 'Published');
            const allLockedOrPublished = nilaiKelas.every(n => 
              n.status_nilai === 'Locked' || n.status_nilai === 'Published'
            );
            if (allPublished) {
              nilaiStatusKelas = 'Published';
            } else if (allLockedOrPublished) {
              nilaiStatusKelas = 'Locked';
            } else {
              nilaiStatusKelas = 'Draft';
            }
          }
        } catch (e) {
          // Skip
        }

        // Build detail jadwal
        const jadwalDetail: JadwalDetail[] = [];
        for (const agenda of jadwalKelas) {
          const pertemuanForAgenda = pertemuanInSemester.filter(p => p.agenda_id === agenda.id);
          const pertemuanSelesaiCount = pertemuanForAgenda.filter(p => p.status === 'Selesai').length;
          const pertemuanTotal = pertemuanForAgenda.length;

          // Calculate presensi percent untuk jadwal
          let presensiPercentJadwal = 0;
          if (pertemuanSelesaiCount > 0) {
            const selesaiIds = pertemuanForAgenda
              .filter(p => p.status === 'Selesai')
              .map(p => p.id)
              .filter(Boolean) as string[];
            
            if (selesaiIds.length > 0) {
              const { data: absensiData } = await supabase
                .from('absensi_madin')
                .select('pertemuan_id')
                .in('pertemuan_id', selesaiIds);
              
              const pertemuanWithAbsensi = new Set((absensiData || []).map(a => a.pertemuan_id));
              presensiPercentJadwal = (pertemuanWithAbsensi.size / pertemuanSelesaiCount) * 100;
            }
          }

          // Check nilai status untuk jadwal
          let nilaiStatusJadwal: 'Draft' | 'Locked' | 'Published' | 'none' = 'none';
          try {
            const nilai = await AkademikNilaiService.listNilai(kelas.id, selectedSemester.id, {
              agendaId: agenda.id,
            });
            if (nilai.length > 0) {
              const allPublished = nilai.every(n => n.status_nilai === 'Published');
              const allLockedOrPublished = nilai.every(n => 
                n.status_nilai === 'Locked' || n.status_nilai === 'Published'
              );
              if (allPublished) {
                nilaiStatusJadwal = 'Published';
              } else if (allLockedOrPublished) {
                nilaiStatusJadwal = 'Locked';
              } else {
                nilaiStatusJadwal = 'Draft';
              }
            }
          } catch (e) {
            // Skip
          }

          jadwalDetail.push({
            agenda,
            pertemuanSelesai: pertemuanSelesaiCount,
            pertemuanTotal,
            presensiPercent: Math.round(presensiPercentJadwal * 10) / 10,
            nilaiStatus: nilaiStatusJadwal,
          });
        }

        kelasRows.push({
          kelas,
          jadwalAktif,
          pertemuanSelesaiPercent: Math.round(pertemuanSelesaiPercent * 10) / 10,
          presensiPercent: Math.round(presensiPercentKelas * 10) / 10,
          nilaiStatus: nilaiStatusKelas,
          expanded: false,
          jadwal: jadwalDetail,
        });
      }

      setKelasTableData(kelasRows);

    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      toast.error(error.message || 'Gagal memuat dashboard');
    } finally {
      setLoading(false);
    }
  }, [selectedSemester, domain, isAdminOrStaff]);

  // Load dashboard when filters change
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Handle filter changes
  const handleSemesterChange = (semesterId: string) => {
    const semester = semesters.find(s => s.id === semesterId) || null;
    setSelectedSemester(semester);
  };

  const handleDomainChange = (newDomain: string) => {
    setDomain(newDomain);
  };

  const handleReset = () => {
    const activeSemester = semesters.find(s => s.is_aktif) || semesters[0] || null;
    setSelectedSemester(activeSemester);
    setDomain('Madin');
  };

  // Toggle expand kelas
  const toggleExpandKelas = (kelasId: string) => {
    setKelasTableData(prev => prev.map(row => 
      row.kelas.id === kelasId 
        ? { ...row, expanded: !row.expanded }
        : row
    ));
  };

  // Handle edit jadwal
  const handleEditJadwal = (agenda: AkademikAgenda) => {
    setEditingJadwal(agenda);
    setJadwalDialogOpen(true);
  };

  // Handle nonaktifkan jadwal
  const handleDeactivateJadwal = async (agendaId: string) => {
    setDeactivatingJadwal(true);
    try {
      await AkademikAgendaService.updateAgenda(agendaId, { aktif: false });
      toast.success('Jadwal berhasil dinonaktifkan');
      await loadDashboard();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menonaktifkan jadwal');
    } finally {
      setDeactivatingJadwal(false);
    }
  };

  // Handle aktifkan jadwal
  const handleActivateJadwal = async (agendaId: string) => {
    setActivatingJadwal(true);
    try {
      await AkademikAgendaService.updateAgenda(agendaId, { aktif: true });
      toast.success('Jadwal berhasil diaktifkan');
      await loadDashboard();
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengaktifkan jadwal');
    } finally {
      setActivatingJadwal(false);
    }
  };

  // Handle generate pertemuan
  const handleGeneratePertemuan = async (agendaId: string) => {
    if (!selectedSemester) return;
    setGeneratingPertemuan(agendaId);
    try {
      const result = await AkademikPertemuanService.generatePertemuanOtomatis(selectedSemester.id, {
        agendaId,
      });
      toast.success(`Berhasil generate ${result.created} pertemuan`);
      await loadDashboard();
    } catch (error: any) {
      toast.error(error.message || 'Gagal generate pertemuan');
    } finally {
      setGeneratingPertemuan(null);
    }
  };

  // Filter dan pagination
  const filteredKelas = kelasTableData.filter(row => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      row.kelas.nama_kelas?.toLowerCase().includes(query) ||
      row.kelas.tingkat?.toLowerCase().includes(query) ||
      row.kelas.rombel?.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(filteredKelas.length / pageSize);
  const paginatedKelas = filteredKelas.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const isSemesterLocked = selectedSemester?.is_locked ?? false;

  // Get nilai badge
  const getNilaiBadge = (status: 'Draft' | 'Locked' | 'Published' | 'none') => {
    switch (status) {
      case 'Published':
        return <Badge variant="default" className="text-xs bg-green-100 text-green-800">Published</Badge>;
      case 'Locked':
        return <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">Locked</Badge>;
      case 'Draft':
        return <Badge variant="outline" className="text-xs">Draft</Badge>;
      default:
        return <Badge variant="outline" className="text-xs text-gray-400">—</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Filter Bar (Sticky) */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Semester Selector (Primary) */}
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  Semester/Term *
                </label>
                <Select
                  value={selectedSemester?.id || ''}
                  onValueChange={handleSemesterChange}
                  disabled={loading}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Pilih semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nama} • {s.tahun_ajaran?.nama || '-'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Domain Selector */}
              <div className="min-w-[150px]">
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  Domain
                </label>
                <Select value={domain} onValueChange={handleDomainChange} disabled={loading}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Madin">Madin</SelectItem>
                    <SelectItem value="Qur'an Progress">Qur'an Progress</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reset Button */}
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={loading}
                  className="h-9"
                >
                  <X className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              </div>

              {/* Status Badge */}
              {selectedSemester && (
                <div className="flex items-end">
                  <Badge
                    variant={isSemesterLocked ? 'destructive' : 'default'}
                    className="h-9 px-3 flex items-center"
                  >
                    {isSemesterLocked ? 'LOCKED' : 'ACTIVE'}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KPIStatCard
            title="Jadwal Aktif"
            value={kpiData.agendaAktif}
            icon={Calendar}
            variant="info"
            description="Term terpilih"
          />
          <KPIStatCard
            title="Kelas Aktif"
            value={kpiData.kelasAktif}
            icon={Users}
            variant="info"
            description="Term terpilih"
          />
          <KPIStatCard
            title="Pertemuan Selesai"
            value={kpiData.pertemuanSelesai}
            icon={CheckCircle2}
            variant="default"
            description="Status selesai"
          />
          <KPIStatCard
            title="Presensi Terisi"
            value={`${kpiData.presensiPercent.toFixed(1)}%`}
            icon={UserCheck}
            variant={kpiData.presensiPercent >= 75 ? 'success' : 'warning'}
            description="Dari pertemuan selesai"
          />
          <KPIStatCard
            title="Nilai Published"
            value={`${kpiData.nilaiPublishedPercent.toFixed(0)}%`}
            icon={FileText}
            variant="default"
            description="Nilai akhir"
          />
          <KPIStatCard
            title="Nilai Locked"
            value={`${kpiData.nilaiLockedPercent.toFixed(0)}%`}
            icon={GraduationCap}
            variant="default"
            description="Menunggu publish"
          />
        </div>

        {/* Task Queue Section */}
        <TaskQueue tasks={tasks} loading={loading} maxItems={20} />

        {/* Kelas Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-base font-semibold">Daftar Kelas</CardTitle>
                <CardDescription className="text-xs">
                  {filteredKelas.length} kelas ditemukan
                </CardDescription>
              </div>
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari kelas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8 text-gray-500">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span className="text-sm">Memuat...</span>
              </div>
            ) : paginatedKelas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">
                  {searchQuery ? 'Tidak ada kelas yang cocok dengan pencarian' : 'Tidak ada kelas'}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-200">
                        <TableHead className="text-xs font-medium text-gray-700 w-8"></TableHead>
                        <TableHead className="text-xs font-medium text-gray-700 min-w-[150px]">
                          Kelas
                        </TableHead>
                        <TableHead className="text-xs font-medium text-gray-700 text-center min-w-[100px]">
                          #Jadwal Aktif
                        </TableHead>
                        <TableHead className="text-xs font-medium text-gray-700 text-center min-w-[100px]">
                          Pertemuan Selesai%
                        </TableHead>
                        <TableHead className="text-xs font-medium text-gray-700 text-center min-w-[100px]">
                          Presensi%
                        </TableHead>
                        <TableHead className="text-xs font-medium text-gray-700 text-center min-w-[100px]">
                          Nilai
                        </TableHead>
                        <TableHead className="text-xs font-medium text-gray-700 text-right min-w-[100px]">
                          Aksi
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedKelas.map((row) => (
                        <React.Fragment key={row.kelas.id}>
                          <TableRow className="border-gray-100">
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleExpandKelas(row.kelas.id)}
                                className="h-6 w-6 p-0"
                              >
                                {row.expanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-sm text-gray-900">
                                {row.kelas.nama_kelas}
                              </div>
                              {row.kelas.tingkat && (
                                <div className="text-xs text-gray-500">{row.kelas.tingkat}</div>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="text-sm text-gray-700">{row.jadwalAktif}</div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="text-xs">
                                {row.pertemuanSelesaiPercent.toFixed(1)}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant={
                                  row.presensiPercent >= 75
                                    ? 'default'
                                    : row.presensiPercent >= 60
                                      ? 'secondary'
                                      : 'destructive'
                                }
                                className="text-xs"
                              >
                                {row.presensiPercent.toFixed(1)}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {getNilaiBadge(row.nilaiStatus)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleExpandKelas(row.kelas.id)}
                                className="h-7 text-xs"
                              >
                                Detail Jadwal
                              </Button>
                            </TableCell>
                          </TableRow>
                          {/* Expanded Jadwal Detail */}
                          {row.expanded && row.jadwal && row.jadwal.length > 0 && (
                            <TableRow className="bg-gray-50">
                              <TableCell colSpan={7} className="p-0">
                                <div className="p-4">
                                  <div className="text-xs font-medium text-gray-700 mb-2">
                                    Detail Jadwal ({row.jadwal.length} jadwal)
                                  </div>
                                  <div className="overflow-x-auto">
                                    <Table>
                                      <TableHeader>
                                        <TableRow className="border-gray-200">
                                          <TableHead className="text-xs font-medium text-gray-700 min-w-[150px]">
                                            Mapel
                                          </TableHead>
                                          <TableHead className="text-xs font-medium text-gray-700 min-w-[150px]">
                                            Pengajar
                                          </TableHead>
                                          <TableHead className="text-xs font-medium text-gray-700 min-w-[120px]">
                                            Hari/Jam
                                          </TableHead>
                                          <TableHead className="text-xs font-medium text-gray-700 min-w-[100px]">
                                            Lokasi
                                          </TableHead>
                                          <TableHead className="text-xs font-medium text-gray-700 text-center min-w-[80px]">
                                            Status
                                          </TableHead>
                                          <TableHead className="text-xs font-medium text-gray-700 text-center min-w-[100px]">
                                            Pertemuan
                                          </TableHead>
                                          <TableHead className="text-xs font-medium text-gray-700 text-center min-w-[100px]">
                                            Presensi%
                                          </TableHead>
                                          <TableHead className="text-xs font-medium text-gray-700 text-center min-w-[100px]">
                                            Nilai
                                          </TableHead>
                                          <TableHead className="text-xs font-medium text-gray-700 text-right min-w-[150px]">
                                            Aksi
                                          </TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {row.jadwal.map((jadwal) => (
                                          <TableRow key={jadwal.agenda.id} className="border-gray-100">
                                            <TableCell>
                                              <div className="font-medium text-sm text-gray-900">
                                                {jadwal.agenda.mapel_nama || jadwal.agenda.nama_agenda || '-'}
                                              </div>
                                            </TableCell>
                                            <TableCell>
                                              <div className="text-sm text-gray-700">
                                                {jadwal.agenda.pengajar_nama || '-'}
                                              </div>
                                            </TableCell>
                                            <TableCell>
                                              <div className="text-sm text-gray-700">
                                                {jadwal.agenda.hari || '-'}
                                              </div>
                                              {jadwal.agenda.jam_mulai && jadwal.agenda.jam_selesai && (
                                                <div className="text-xs text-gray-500">
                                                  {jadwal.agenda.jam_mulai.substring(0, 5)} - {jadwal.agenda.jam_selesai.substring(0, 5)}
                                                </div>
                                              )}
                                            </TableCell>
                                            <TableCell>
                                              <div className="text-sm text-gray-700">
                                                {jadwal.agenda.lokasi || '-'}
                                              </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                              {jadwal.agenda.aktif !== false ? (
                                                <Badge variant="default" className="text-xs">Aktif</Badge>
                                              ) : (
                                                <Badge variant="outline" className="text-xs">Arsip</Badge>
                                              )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                              <div className="text-sm text-gray-700">
                                                {jadwal.pertemuanSelesai} / {jadwal.pertemuanTotal}
                                              </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                              <Badge
                                                variant={
                                                  jadwal.presensiPercent >= 75
                                                    ? 'default'
                                                    : jadwal.presensiPercent >= 60
                                                      ? 'secondary'
                                                      : 'destructive'
                                                }
                                                className="text-xs"
                                              >
                                                {jadwal.presensiPercent.toFixed(1)}%
                                              </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                              {getNilaiBadge(jadwal.nilaiStatus)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                              <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                                                    Aksi
                                                  </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                  <DropdownMenuItem
                                                    onClick={() => handleEditJadwal(jadwal.agenda)}
                                                    disabled={isSemesterLocked}
                                                  >
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Edit Jadwal
                                                  </DropdownMenuItem>
                                                  {jadwal.agenda.aktif !== false ? (
                                                    <DropdownMenuItem
                                                      onClick={() => handleDeactivateJadwal(jadwal.agenda.id)}
                                                      disabled={isSemesterLocked || deactivatingJadwal}
                                                    >
                                                      <Archive className="h-4 w-4 mr-2" />
                                                      Nonaktifkan
                                                    </DropdownMenuItem>
                                                  ) : (
                                                    <DropdownMenuItem
                                                      onClick={() => handleActivateJadwal(jadwal.agenda.id)}
                                                      disabled={isSemesterLocked || activatingJadwal}
                                                    >
                                                      <ArchiveRestore className="h-4 w-4 mr-2" />
                                                      Aktifkan
                                                    </DropdownMenuItem>
                                                  )}
                                                  <DropdownMenuItem
                                                    onClick={() => navigate(`/akademik/pertemuan?tab=presensi&kelasId=${row.kelas.id}&agendaId=${jadwal.agenda.id}`)}
                                                  >
                                                    <ClipboardList className="h-4 w-4 mr-2" />
                                                    Buka Presensi
                                                  </DropdownMenuItem>
                                                  <DropdownMenuItem
                                                    onClick={() => navigate(`/akademik/nilai?kelasId=${row.kelas.id}&agendaId=${jadwal.agenda.id}&semesterId=${selectedSemester?.id}`)}
                                                  >
                                                    <GraduationCap className="h-4 w-4 mr-2" />
                                                    Buka Nilai
                                                  </DropdownMenuItem>
                                                  {jadwal.pertemuanTotal === 0 && (
                                                    <DropdownMenuItem
                                                      onClick={() => handleGeneratePertemuan(jadwal.agenda.id)}
                                                      disabled={isSemesterLocked || generatingPertemuan === jadwal.agenda.id}
                                                    >
                                                      <Calendar className="h-4 w-4 mr-2" />
                                                      {generatingPertemuan === jadwal.agenda.id ? 'Generating...' : 'Generate Pertemuan'}
                                                    </DropdownMenuItem>
                                                  )}
                                                </DropdownMenuContent>
                                              </DropdownMenu>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                    <div className="text-xs text-gray-600">
                      Halaman {currentPage} dari {totalPages} ({filteredKelas.length} kelas)
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="h-8"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="h-8"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog Edit Jadwal (simplified - redirect ke /akademik/kelas) */}
      <Dialog open={jadwalDialogOpen} onOpenChange={setJadwalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Jadwal</DialogTitle>
            <DialogDescription>
              Edit jadwal akan membuka halaman Kelola Jadwal
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJadwalDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={() => {
                if (editingJadwal) {
                  navigate(`/akademik/kelas?agendaId=${editingJadwal.id}`);
                }
                setJadwalDialogOpen(false);
              }}
            >
              Buka Halaman Kelola Jadwal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardAkademik;
