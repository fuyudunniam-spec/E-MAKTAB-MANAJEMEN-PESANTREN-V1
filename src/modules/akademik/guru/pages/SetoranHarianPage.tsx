import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SetoranHarianService, SetoranHarianInput, SetoranHarian } from '@/modules/akademik/services/setoranHarian.service';
import { AkademikAgendaService, AkademikAgenda } from '@/modules/akademik/services/akademikAgenda.service';
import { AkademikPloatingService } from '@/modules/akademik/services/akademikPloating.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, BookOpen, AlertTriangle, Clock, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DAFTAR_SURAT_AL_QURAN, SURAT_PENDEK_TPQ, IQRA_OPTIONS } from '@/constants/akademik.constants';
import { useLocation, useNavigate } from 'react-router-dom';

interface SantriOption {
  id: string;
  nama_lengkap: string;
  id_santri?: string;
}

type AgendaFilterValue = 'all' | 'manual' | string;

interface SetoranFormData {
  santri_id: string;
  status: 'Sudah Setor' | 'Tidak Setor' | 'Izin' | 'Sakit' | 'Hadir';
  jenis_setoran?: 'Menambah' | 'Murajaah';
  jenis_setoran_tpq?: 'Iqra' | 'Al-Quran';
  tambah_hafalan_surat?: boolean;
  iqra_jilid?: string;
  iqra_halaman_awal?: number;
  iqra_halaman_akhir?: number;
  surat?: string;
  ayat_awal?: number;
  ayat_akhir?: number;
  juz?: number;
  nilai_kelancaran?: string;
  nilai_tajwid?: string;
  catatan?: string;
  agenda_id?: string | null;
  waktu_setor?: string;
}

type HistoryFiltersState = {
  startDate: string;
  endDate: string;
  agendaId: AgendaFilterValue | 'all';
  status: 'all' | 'Sudah Setor' | 'Tidak Setor' | 'Izin' | 'Sakit' | 'Hadir';
  santriId: string;
  page: number;
};

const toDateTimeLocalValue = (iso?: string | null) => {
  if (!iso) return '';
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  } catch {
    return '';
  }
};

const fromDateTimeLocalValue = (value?: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
};

const nowLocalDateTime = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 16);
};

const formatWaktuSetor = (iso?: string | null) => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '-';
  }
};

const formatTanggal = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

const todayISO = () => new Date().toISOString().split('T')[0];

const startOfMonthISO = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
};

const SetoranHarianPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const historyPageSize = 20;
  const [program, setProgram] = useState<'TPQ' | 'Tahfid' | 'Tahsin'>('TPQ');
  const [tanggal, setTanggal] = useState<string>(todayISO());
  const [santriList, setSantriList] = useState<SantriOption[]>([]);
  const [setoranList, setSetoranList] = useState<any[]>([]);
  const [belumSetorList, setBelumSetorList] = useState<Array<{ id: string; nama_lengkap: string; id_santri?: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSetoran, setEditingSetoran] = useState<any | null>(null);
  const [agendaOptions, setAgendaOptions] = useState<AkademikAgenda[]>([]);
  const [selectedAgendaFilter, setSelectedAgendaFilter] = useState<AgendaFilterValue>('all');
  const [prefillParams, setPrefillParams] = useState<{ santriId: string; agendaId?: string | null } | null>(null);
  const [formData, setFormData] = useState<SetoranFormData>({
    santri_id: '',
    status: 'Sudah Setor',
    agenda_id: null,
    waktu_setor: nowLocalDateTime(),
  });
  const [activeTab, setActiveTab] = useState<'form' | 'riwayat'>('form');
  const [historyFilters, setHistoryFilters] = useState<HistoryFiltersState>({
    startDate: startOfMonthISO(),
    endDate: todayISO(),
    agendaId: 'all',
    status: 'all',
    santriId: 'all',
    page: 0,
  });
  const [historyData, setHistoryData] = useState<SetoranHarian[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySantriOptions, setHistorySantriOptions] = useState<SantriOption[]>([]);
  const historyStatusOptions = ['all', 'Sudah Setor', 'Tidak Setor', 'Izin', 'Sakit', 'Hadir'] as const;

  const updateHistoryFilters = useCallback((updates: Partial<HistoryFiltersState>) => {
    setHistoryFilters(prev => ({
      ...prev,
      ...updates,
      ...(updates.page !== undefined ? {} : { page: 0 }),
    }));
  }, []);

  const loadBelumSetor = useCallback(async () => {
    try {
      const belumSetor = await SetoranHarianService.getSantriBinaanMukimBelumSetor(tanggal);
      setBelumSetorList(belumSetor);
    } catch (e: any) {
      console.error('Error loading belum setor:', e);
    }
  }, [tanggal]);

  const loadHistorySantri = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('santri')
        .select('id, nama_lengkap, id_santri')
        .or('kategori.ilike.%Binaan Mukim%,kategori.ilike.%Binaan Non-Mukim%')
        .eq('status_santri', 'Aktif')
        .order('nama_lengkap');
      if (error) throw error;
      setHistorySantriOptions((data || []) as SantriOption[]);
    } catch (error) {
      console.error('Gagal memuat opsi santri riwayat', error);
    }
  }, []);

  const loadSantri = useCallback(async () => {
    try {
      setLoading(true);
      
      let candidates: SantriOption[] = [];
      let agendaKelasId: string | undefined;

      if (selectedAgendaFilter !== 'all' && selectedAgendaFilter !== 'manual') {
        const targetAgenda =
          agendaOptions.find(agenda => agenda.id === selectedAgendaFilter) ||
          (await AkademikAgendaService.listAgenda({ jenis: ['Setoran', 'Gabungan'] })).find(
            agenda => agenda.id === selectedAgendaFilter,
          );

        if (targetAgenda?.kelas?.id) {
          agendaKelasId = targetAgenda.kelas.id;
          const anggotaKelas = await AkademikPloatingService.listAnggota(targetAgenda.kelas.id);
          candidates = anggotaKelas
            .map(member => ({
              id: member.id,
              nama_lengkap: member.nama_lengkap,
              id_santri: member.id_santri || undefined,
            }))
            .sort((a, b) => a.nama_lengkap.localeCompare(b.nama_lengkap));
        }
      }

      if (candidates.length === 0) {
      const { data: allSantri, error } = await supabase
        .from('santri')
        .select('id, nama_lengkap, id_santri')
        .or('kategori.ilike.%Binaan Mukim%,kategori.ilike.%Binaan Non-Mukim%')
        .eq('status_santri', 'Aktif')
        .order('nama_lengkap');
      if (error) throw error;
        candidates = (allSantri || []) as SantriOption[];
      }

      const options =
        selectedAgendaFilter === 'all'
          ? undefined
          : {
              agendaId: selectedAgendaFilter === 'manual' ? null : selectedAgendaFilter,
            };
      const existing = await SetoranHarianService.listSetoran(program, tanggal, options);
      setSetoranList(existing);
      
      // Pastikan santri yang sudah punya setoran tetap muncul dalam dropdown
      const santriFromExisting = existing.map(item => ({
        id: item.santri?.id || item.santri_id,
        nama_lengkap: item.santri?.nama_lengkap || item.santri_id,
        id_santri: item.santri?.id_santri,
      }));
      const mergedMap = new Map<string, SantriOption>();
      [...candidates, ...santriFromExisting].forEach(item => {
        if (item?.id) mergedMap.set(item.id, item);
      });
      const mergedSantri = Array.from(mergedMap.values()).sort((a, b) =>
        a.nama_lengkap.localeCompare(b.nama_lengkap),
      );

      setSantriList(mergedSantri);

      await loadBelumSetor();
    } catch (e: any) {
      toast.error(e.message || 'Gagal memuat data setoran');
    } finally {
      setLoading(false);
    }
  }, [loadBelumSetor, program, selectedAgendaFilter, tanggal, agendaOptions]);

  const loadAgendaOptions = useCallback(async (currentProgram: 'TPQ' | 'Tahfid' | 'Tahsin') => {
    try {
      const agendas = await AkademikAgendaService.listAgenda({
        program: currentProgram,
        jenis: ['Setoran', 'Gabungan'],
      });
      setAgendaOptions(agendas);
      setSelectedAgendaFilter(prev => {
        if (prev !== 'all' && prev !== 'manual' && agendas.some(agenda => agenda.id === prev)) {
          return prev;
        }
        return agendas.length > 0 ? 'all' : 'manual';
      });
    } catch (e: any) {
      toast.error(e.message || 'Gagal memuat agenda setoran');
      setAgendaOptions([]);
      setSelectedAgendaFilter('manual');
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const agendaFilter =
        historyFilters.agendaId === 'all'
          ? undefined
          : historyFilters.agendaId === 'manual'
          ? null
          : historyFilters.agendaId;
      const statusFilter = historyFilters.status === 'all' ? undefined : historyFilters.status;
      const santriFilter = historyFilters.santriId === 'all' ? undefined : historyFilters.santriId;

      const result = await SetoranHarianService.listSetoranRiwayat(program, {
        startDate: historyFilters.startDate,
        endDate: historyFilters.endDate,
        agendaId: agendaFilter,
        status: statusFilter,
        santriId: santriFilter,
        page: historyFilters.page,
        pageSize: historyPageSize,
        order: 'desc',
      });
      setHistoryData(result.data);
      setHistoryTotal(result.total);
    } catch (e: any) {
      toast.error(e.message || 'Gagal memuat riwayat setoran');
    } finally {
      setHistoryLoading(false);
    }
  }, [historyFilters, historyPageSize, program]);

  useEffect(() => {
    loadAgendaOptions(program);
  }, [program, loadAgendaOptions]);

  useEffect(() => {
      loadSantri();
  }, [loadSantri]);

  useEffect(() => {
    loadHistorySantri();
  }, [loadHistorySantri]);

  useEffect(() => {
    if (historyFilters.agendaId !== 'all' && historyFilters.agendaId !== 'manual') {
      const exists = agendaOptions.some(agenda => agenda.id === historyFilters.agendaId);
      if (!exists) {
        updateHistoryFilters({ agendaId: 'all' });
      }
    }
  }, [agendaOptions, historyFilters.agendaId, updateHistoryFilters]);

  useEffect(() => {
    if (activeTab === 'riwayat') {
      loadHistory();
    }
  }, [activeTab, loadHistory]);

  useEffect(() => {
    updateHistoryFilters({ agendaId: 'all', santriId: 'all', page: 0 });
  }, [program, updateHistoryFilters]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryProgram = params.get('program');
    const queryTanggal = params.get('tanggal');
    const queryAgenda = params.get('agendaId');
    const querySantri = params.get('santriId');

    if (queryProgram && (queryProgram === 'TPQ' || queryProgram === 'Tahfid' || queryProgram === 'Tahsin')) {
      setProgram(queryProgram);
    }
    if (queryTanggal) {
      setTanggal(queryTanggal);
    }
    if (queryAgenda) {
      if (queryAgenda === 'manual') {
        setSelectedAgendaFilter('manual');
      } else if (queryAgenda === 'all') {
        setSelectedAgendaFilter('all');
      } else {
        setSelectedAgendaFilter(queryAgenda);
      }
    }
    if (querySantri) {
      setPrefillParams({
        santriId: querySantri,
        agendaId:
          queryAgenda === 'manual'
            ? null
            : queryAgenda && queryAgenda !== 'all'
            ? queryAgenda
            : undefined,
      });
    }
  }, [location.search]);

  useEffect(() => {
    if (prefillParams && santriList.length > 0) {
      const target = santriList.find(s => s.id === prefillParams.santriId);
      if (target) {
        const defaultAgenda =
          selectedAgendaFilter === 'all'
            ? agendaOptions[0]?.id ?? null
            : selectedAgendaFilter === 'manual'
            ? null
            : selectedAgendaFilter;
        setEditingSetoran(null);
        setFormData({
          santri_id: target.id,
          status: 'Sudah Setor',
          jenis_setoran: undefined,
          jenis_setoran_tpq: program === 'TPQ' ? undefined : undefined,
          tambah_hafalan_surat: false,
          agenda_id:
            prefillParams.agendaId !== undefined
              ? prefillParams.agendaId
              : defaultAgenda ?? null,
          waktu_setor: nowLocalDateTime(),
        });
        setDialogOpen(true);
      }
      setPrefillParams(null);
      navigate('/akademik/setoran', { replace: true });
    }
  }, [prefillParams, santriList, agendaOptions, selectedAgendaFilter, program, navigate]);

  const handleOpenDialog = (setoran?: any) => {
    if (setoran) {
      const jenisSetoranTPQ =
        setoran.iqra_halaman_awal || setoran.iqra_halaman_akhir
        ? 'Iqra' 
          : setoran.surat || setoran.juz
          ? 'Al-Quran'
          : undefined;
      
      const adaHafalanSurat = jenisSetoranTPQ === 'Iqra' && (setoran.surat || setoran.juz);
      
      setEditingSetoran(setoran);
      setFormData({
        santri_id: setoran.santri_id,
        status: setoran.status,
        jenis_setoran: setoran.jenis_setoran || undefined,
        jenis_setoran_tpq: program === 'TPQ' ? jenisSetoranTPQ : undefined,
        tambah_hafalan_surat: adaHafalanSurat || false,
        iqra_jilid: setoran.iqra_jilid || undefined,
        iqra_halaman_awal: setoran.iqra_halaman_awal || undefined,
        iqra_halaman_akhir: setoran.iqra_halaman_akhir || undefined,
        surat: setoran.surat || undefined,
        ayat_awal: setoran.ayat_awal || undefined,
        ayat_akhir: setoran.ayat_akhir || undefined,
        juz: setoran.juz || undefined,
        nilai_kelancaran: setoran.nilai_kelancaran || undefined,
        nilai_tajwid: setoran.nilai_tajwid || undefined,
        catatan: setoran.catatan || undefined,
        agenda_id: setoran.agenda_id ?? null,
        waktu_setor: toDateTimeLocalValue(setoran.waktu_setor),
      });
    } else {
      setEditingSetoran(null);
      const defaultAgenda =
        selectedAgendaFilter === 'all'
          ? agendaOptions[0]?.id ?? null
          : selectedAgendaFilter === 'manual'
          ? null
          : selectedAgendaFilter;

      setFormData({
        santri_id: '',
        status: 'Sudah Setor',
        jenis_setoran: undefined,
        jenis_setoran_tpq: undefined,
        tambah_hafalan_surat: false,
        agenda_id: defaultAgenda ?? null,
        waktu_setor: nowLocalDateTime(),
      });
    }
    setDialogOpen(true);
  };

  const handleSaveSetoran = async () => {
    if (!formData.santri_id) {
      toast.error('Pilih santri terlebih dahulu');
      return;
    }

    if ((formData.status === 'Sudah Setor' || formData.status === 'Hadir') && !formData.jenis_setoran) {
      toast.error('Pilih jenis aktivitas (Menambah atau Murajaah) terlebih dahulu');
      return;
    }

    if (
      program === 'TPQ' &&
      (formData.status === 'Sudah Setor' || formData.status === 'Hadir') &&
      !formData.jenis_setoran_tpq
    ) {
      toast.error('Pilih jenis setoran (Iqra\' atau Al-Quran) terlebih dahulu');
      return;
    }

    if (program === 'TPQ' && (formData.status === 'Sudah Setor' || formData.status === 'Hadir')) {
      if (formData.jenis_setoran_tpq === 'Iqra') {
        if (!formData.iqra_jilid) {
          toast.error('Pilih jilid Iqra\' terlebih dahulu');
          return;
        }
        if (!formData.iqra_halaman_awal || !formData.iqra_halaman_akhir) {
          toast.error('Isi halaman awal dan akhir untuk Iqra\'');
          return;
        }
        if (formData.tambah_hafalan_surat && !formData.surat) {
          toast.error('Pilih surat untuk hafalan surat pendek');
          return;
        }
      } else if (formData.jenis_setoran_tpq === 'Al-Quran') {
        if (!formData.surat && !formData.juz) {
          toast.error('Pilih surat atau isi juz untuk Al-Quran');
          return;
        }
      }
    }

    const agendaPayload =
      formData.agenda_id === undefined ? null : formData.agenda_id ?? null;
    const waktuSetorIso = fromDateTimeLocalValue(formData.waktu_setor) || undefined;

    try {
      const input: SetoranHarianInput = {
        santri_id: formData.santri_id,
        program,
        tanggal_setor: tanggal,
        status: formData.status,
        jenis_setoran:
          formData.status === 'Sudah Setor' || formData.status === 'Hadir'
            ? formData.jenis_setoran
            : undefined,
        agenda_id: agendaPayload,
        waktu_setor: waktuSetorIso,
        iqra_jilid:
          program === 'TPQ' && formData.jenis_setoran_tpq === 'Iqra'
            ? formData.iqra_jilid
            : undefined,
        iqra_halaman_awal:
          program === 'TPQ' && formData.jenis_setoran_tpq === 'Iqra'
            ? formData.iqra_halaman_awal
            : undefined,
        iqra_halaman_akhir:
          program === 'TPQ' && formData.jenis_setoran_tpq === 'Iqra'
            ? formData.iqra_halaman_akhir
            : undefined,
        surat:
          program === 'TPQ'
            ? formData.jenis_setoran_tpq === 'Iqra'
              ? formData.tambah_hafalan_surat
                ? formData.surat
                : undefined
              : formData.jenis_setoran_tpq === 'Al-Quran'
              ? formData.surat
              : undefined
            : formData.surat,
        ayat_awal:
          program === 'TPQ'
            ? formData.jenis_setoran_tpq === 'Iqra'
              ? formData.tambah_hafalan_surat
                ? formData.ayat_awal
                : undefined
              : formData.jenis_setoran_tpq === 'Al-Quran'
              ? formData.ayat_awal
              : undefined
            : formData.ayat_awal,
        ayat_akhir:
          program === 'TPQ'
            ? formData.jenis_setoran_tpq === 'Iqra'
              ? formData.tambah_hafalan_surat
                ? formData.ayat_akhir
                : undefined
              : formData.jenis_setoran_tpq === 'Al-Quran'
              ? formData.ayat_akhir
              : undefined
            : formData.ayat_akhir,
        juz:
          program === 'TPQ'
            ? formData.jenis_setoran_tpq === 'Iqra'
              ? formData.tambah_hafalan_surat
                ? formData.juz
                : undefined
              : formData.jenis_setoran_tpq === 'Al-Quran'
              ? formData.juz
              : undefined
            : formData.juz,
        nilai_kelancaran: formData.nilai_kelancaran,
        nilai_tajwid: formData.nilai_tajwid,
        catatan: formData.catatan,
      };

      if (editingSetoran) {
        await SetoranHarianService.updateSetoran(editingSetoran.id, input);
        toast.success('Setoran berhasil diperbarui');
      } else {
        await SetoranHarianService.createSetoran(input);
        toast.success('Setoran berhasil disimpan');
      }

      setDialogOpen(false);
      loadSantri();
    } catch (e: any) {
      toast.error(e.message || 'Gagal menyimpan setoran');
    }
  };

  const handleDeleteSetoran = async (id: string) => {
    if (!confirm('Hapus setoran ini?')) return;
    try {
      await SetoranHarianService.deleteSetoran(id);
      toast.success('Setoran dihapus');
      loadSantri();
      if (activeTab === 'riwayat') {
        await loadHistory();
      } else {
        setHistoryData(prev => prev.filter(item => item.id !== id));
        setHistoryTotal(prev => Math.max(0, prev - 1));
      }
    } catch (e: any) {
      toast.error(e.message || 'Gagal menghapus setoran');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Sudah Setor':
      case 'Hadir':
        return <Badge className="bg-green-100 text-green-800">Sudah Setor</Badge>;
      case 'Tidak Setor':
        return <Badge className="bg-red-100 text-red-800">Tidak Setor</Badge>;
      case 'Izin':
        return <Badge className="bg-yellow-100 text-yellow-800">Izin</Badge>;
      case 'Sakit':
        return <Badge className="bg-blue-100 text-blue-800">Sakit</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getNilaiBadge = (nilai?: string) => {
    if (!nilai) return <span className="text-muted-foreground">-</span>;
    switch (nilai) {
      case 'Mumtaz':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Mumtaz</Badge>;
      case 'Jayyid Jiddan':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Jayyid Jiddan</Badge>;
      case 'Jayyid':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Jayyid</Badge>;
      case 'Maqbul':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-300">Maqbul</Badge>;
      default:
        return <Badge variant="outline">{nilai}</Badge>;
    }
  };

  const stats = {
    sudahSetor: setoranList.filter(s => s.status === 'Sudah Setor' || s.status === 'Hadir').length,
    tidakSetor: setoranList.filter(s => s.status === 'Tidak Setor').length,
    izin: setoranList.filter(s => s.status === 'Izin').length,
    sakit: setoranList.filter(s => s.status === 'Sakit').length,
  };

  const formatAgendaLabel = useCallback((agenda: AkademikAgenda) => {
    const meta: string[] = [];
    if (agenda.hari) {
      meta.push(agenda.hari);
    }
    if (agenda.jam_mulai) {
      const start = agenda.jam_mulai.slice(0, 5);
      const end = agenda.jam_selesai ? agenda.jam_selesai.slice(0, 5) : undefined;
      meta.push(end ? `${start} - ${end}` : start);
    }
    return meta.length > 0 ? `${agenda.nama_agenda} — ${meta.join(' • ')}` : agenda.nama_agenda;
  }, []);

  const agendaFilterOptions = useMemo(() => {
    return [
      { label: 'Semua Agenda', value: 'all' as AgendaFilterValue },
      { label: 'Tanpa Agenda (Manual)', value: 'manual' as AgendaFilterValue },
      ...agendaOptions.map(agenda => ({
        label: formatAgendaLabel(agenda),
        value: agenda.id as AgendaFilterValue,
      })),
    ];
  }, [agendaOptions, formatAgendaLabel]);

  const historyStats = useMemo(() => {
    const summary = {
      total: historyData.length,
      sudah: 0,
      tidak: 0,
      izin: 0,
      sakit: 0,
      hadir: 0,
    };
    historyData.forEach(item => {
      switch (item.status) {
        case 'Sudah Setor':
          summary.sudah += 1;
          break;
        case 'Tidak Setor':
          summary.tidak += 1;
          break;
        case 'Izin':
          summary.izin += 1;
          break;
        case 'Sakit':
          summary.sakit += 1;
          break;
        case 'Hadir':
          summary.hadir += 1;
          break;
        default:
          break;
      }
    });
    return summary;
  }, [historyData]);

  const canPrevHistory = historyFilters.page > 0;
  const canNextHistory = (historyFilters.page + 1) * historyPageSize < historyTotal;
  const historyPageLabel =
    historyTotal === 0
      ? '0 / 0'
      : `${historyFilters.page + 1} / ${Math.max(1, Math.ceil(historyTotal / historyPageSize))}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Setoran Harian</h1>
            <p className="text-muted-foreground">Input dan rekap setoran harian santri</p>
        </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">Program</Label>
            <Select value={program} onValueChange={(value: 'TPQ' | 'Tahfid' | 'Tahsin') => setProgram(value)}>
              <SelectTrigger className="min-w-[120px]">
                <SelectValue placeholder="Program" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TPQ">TPQ</SelectItem>
                <SelectItem value="Tahfid">Tahfid</SelectItem>
                <SelectItem value="Tahsin">Tahsin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'form' | 'riwayat')} className="space-y-6">
          <TabsList className="w-fit">
            <TabsTrigger value="form">Input Harian</TabsTrigger>
            <TabsTrigger value="riwayat">Riwayat</TabsTrigger>
          </TabsList>
          <TabsContent value="form" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Filter</CardTitle>
                <CardDescription>Pilih tanggal dan agenda untuk input harian</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-4">
          <div>
            <Label>Tanggal</Label>
                  <Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
                </div>
                <div>
                  <Label>Agenda</Label>
                  <Select value={selectedAgendaFilter} onValueChange={(value) => setSelectedAgendaFilter(value as AgendaFilterValue)}>
                    <SelectTrigger><SelectValue placeholder="Pilih agenda" /></SelectTrigger>
                    <SelectContent>
                      {agendaFilterOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={loadSantri} variant="outline" className="w-full">
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {belumSetorList.length > 0 && (
        <Card className="border-yellow-500 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="w-5 h-5" />
              {belumSetorList.length} Santri Binaan Mukim Belum Setor Hari Ini
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Santri binaan mukim wajib setor setiap hari. Berikut daftar santri yang belum setor hari ini.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {belumSetorList.map(s => (
                <Badge key={s.id} variant="outline" className="text-yellow-800 border-yellow-600 bg-yellow-100">
                  {s.nama_lengkap} {s.id_santri ? `(${s.id_santri})` : ''}
                </Badge>
              ))}
            </div>
            <Button 
              variant="outline" 
              className="border-yellow-600 text-yellow-800 hover:bg-yellow-100"
              onClick={() => {
                       if (belumSetorList.length > 0) {
                        const defaultAgenda =
                          selectedAgendaFilter === 'all'
                            ? agendaOptions[0]?.id ?? null
                            : selectedAgendaFilter === 'manual'
                            ? null
                            : selectedAgendaFilter;

                         setFormData({
                           santri_id: belumSetorList[0].id,
                           status: 'Sudah Setor',
                           jenis_setoran: undefined,
                           jenis_setoran_tpq: undefined,
                           tambah_hafalan_surat: false,
                          agenda_id: defaultAgenda ?? null,
                          waktu_setor: nowLocalDateTime(),
                         });
                  setEditingSetoran(null);
                  setDialogOpen(true);
                }
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Setoran untuk Santri Ini
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-green-600">
                    <BookOpen className="w-5 h-5" />
                    <span className="text-2xl font-bold">{stats.sudahSetor}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Sudah Setor / Hadir</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-red-600">
                    <BookOpen className="w-5 h-5" />
                    <span className="text-2xl font-bold">{stats.tidakSetor}</span>
                  </div>
            <p className="text-xs text-muted-foreground">Tidak Setor</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-yellow-600">
                    <BookOpen className="w-5 h-5" />
                    <span className="text-2xl font-bold">{stats.izin}</span>
                  </div>
            <p className="text-xs text-muted-foreground">Izin</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-blue-600">
                    <BookOpen className="w-5 h-5" />
                    <span className="text-2xl font-bold">{stats.sakit}</span>
                  </div>
            <p className="text-xs text-muted-foreground">Sakit</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Daftar Setoran</CardTitle>
                    <CardDescription>
                      {program} • {new Date(tanggal).toLocaleDateString('id-ID')}
                    </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Setoran
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
          ) : setoranList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Belum ada setoran untuk tanggal ini</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Santri</TableHead>
                    <TableHead>ID Santri</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Jenis Aktivitas</TableHead>
                          <TableHead>Agenda</TableHead>
                          <TableHead>Waktu</TableHead>
                          {program === 'TPQ' && <TableHead>Iqra / Hafalan</TableHead>}
                    {(program === 'Tahfid' || program === 'Tahsin') && (
                      <>
                        <TableHead>Surat/Juz</TableHead>
                        <TableHead>Ayat</TableHead>
                      </>
                    )}
                    <TableHead>Nilai</TableHead>
                    <TableHead>Diinput Oleh</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {setoranList.map((setoran) => (
                    <TableRow key={setoran.id}>
                      <TableCell className="font-medium">
                        {setoran.santri?.nama_lengkap || '-'}
                      </TableCell>
                      <TableCell>{setoran.santri?.id_santri || '-'}</TableCell>
                      <TableCell>{getStatusBadge(setoran.status)}</TableCell>
                      <TableCell>
                        {setoran.jenis_setoran ? (
                          <Badge variant={setoran.jenis_setoran === 'Menambah' ? 'default' : 'secondary'}>
                            {setoran.jenis_setoran}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                            <TableCell>{setoran.agenda?.nama_agenda || 'Manual'}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                {formatWaktuSetor(setoran.waktu_setor)}
                              </div>
                            </TableCell>
                      {program === 'TPQ' && (
                        <TableCell>
                          {setoran.iqra_halaman_awal && setoran.iqra_halaman_akhir
                                  ? `Iqra' ${setoran.iqra_jilid ? `${setoran.iqra_jilid} ` : ''}Hlm. ${setoran.iqra_halaman_awal}-${setoran.iqra_halaman_akhir}${
                                      setoran.surat ? ` + ${setoran.surat}` : ''
                                    }`
                            : setoran.surat
                                  ? `${setoran.surat}${
                                      setoran.ayat_awal
                                        ? ` Ayat ${setoran.ayat_awal}-${setoran.ayat_akhir || setoran.ayat_awal}`
                                        : ''
                                    }${setoran.juz ? ` (Juz ${setoran.juz})` : ''}`
                            : '-'}
                        </TableCell>
                      )}
                      {(program === 'Tahfid' || program === 'Tahsin') && (
                        <>
                                <TableCell>{setoran.surat || (setoran.juz ? `Juz ${setoran.juz}` : '-')}</TableCell>
                          <TableCell>
                            {setoran.ayat_awal && setoran.ayat_akhir
                              ? `${setoran.ayat_awal}-${setoran.ayat_akhir}`
                              : '-'}
                          </TableCell>
                        </>
                      )}
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Kelancaran:</span>
                            {getNilaiBadge(setoran.nilai_kelancaran)}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Tajwid:</span>
                            {getNilaiBadge(setoran.nilai_tajwid)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {setoran.pengurus?.full_name || setoran.pengurus?.email || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(setoran)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteSetoran(setoran.id)}>
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
          </TabsContent>
          <TabsContent value="riwayat" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Filter Riwayat</CardTitle>
                <CardDescription>Atur rentang tanggal dan filter untuk rekap setoran</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-5">
                <div>
                  <Label>Tanggal Mulai</Label>
                  <Input
                    type="date"
                    value={historyFilters.startDate}
                    max={historyFilters.endDate}
                    onChange={(e) => updateHistoryFilters({ startDate: e.target.value || startOfMonthISO() })}
                  />
                </div>
                <div>
                  <Label>Tanggal Selesai</Label>
                  <Input
                    type="date"
                    value={historyFilters.endDate}
                    min={historyFilters.startDate}
                    onChange={(e) => updateHistoryFilters({ endDate: e.target.value || todayISO() })}
                  />
                </div>
                <div>
                  <Label>Agenda</Label>
                  <Select
                    value={historyFilters.agendaId}
                    onValueChange={(value) => updateHistoryFilters({ agendaId: value as HistoryFiltersState['agendaId'] })}
                  >
                    <SelectTrigger><SelectValue placeholder="Semua agenda" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Agenda</SelectItem>
                      <SelectItem value="manual">Tanpa Agenda (Manual)</SelectItem>
                      {agendaOptions.map(agenda => (
                        <SelectItem key={agenda.id} value={agenda.id}>
                          {formatAgendaLabel(agenda)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={historyFilters.status}
                    onValueChange={(value) => updateHistoryFilters({ status: value as HistoryFiltersState['status'] })}
                  >
                    <SelectTrigger><SelectValue placeholder="Semua status" /></SelectTrigger>
                    <SelectContent>
                      {historyStatusOptions.map(status => (
                        <SelectItem key={status} value={status}>
                          {status === 'all' ? 'Semua Status' : status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Santri</Label>
                  <Select
                    value={historyFilters.santriId}
                    onValueChange={(value) => updateHistoryFilters({ santriId: value })}
                  >
                    <SelectTrigger><SelectValue placeholder="Semua santri" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Santri</SelectItem>
                      {historySantriOptions.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.nama_lengkap} {s.id_santri ? `(${s.id_santri})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                          <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => loadHistory()}
                    disabled={historyLoading}
                  >
                    {historyLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    Muat Ulang
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Total</div>
                  <div className="text-2xl font-semibold">{historyStats.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Sudah Setor/Hadir</div>
                  <div className="text-2xl font-semibold text-green-600">{historyStats.sudah + historyStats.hadir}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Tidak Setor</div>
                  <div className="text-2xl font-semibold text-red-600">{historyStats.tidak}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Izin</div>
                  <div className="text-2xl font-semibold text-yellow-600">{historyStats.izin}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Sakit</div>
                  <div className="text-2xl font-semibold text-blue-600">{historyStats.sakit}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Riwayat Setoran</CardTitle>
                    <CardDescription>
                      {formatTanggal(historyFilters.startDate)} — {formatTanggal(historyFilters.endDate)}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="text-center py-8 text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memuat riwayat setoran...
                  </div>
                ) : historyData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Belum ada data setoran pada rentang ini.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Santri</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Jenis</TableHead>
                            <TableHead>Agenda</TableHead>
                            <TableHead>Waktu</TableHead>
                            <TableHead>Detail</TableHead>
                            <TableHead>Nilai</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {historyData.map(item => (
                            <TableRow key={item.id}>
                              <TableCell className="whitespace-nowrap">{formatTanggal(item.tanggal_setor)}</TableCell>
                              <TableCell>
                                <div className="font-medium">{item.santri?.nama_lengkap || '-'}</div>
                                <div className="text-xs text-muted-foreground">{item.santri?.id_santri || '-'}</div>
                              </TableCell>
                              <TableCell>{getStatusBadge(item.status)}</TableCell>
                              <TableCell>
                                {item.jenis_setoran ? (
                                  <Badge variant={item.jenis_setoran === 'Menambah' ? 'default' : 'secondary'}>
                                    {item.jenis_setoran}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>{item.agenda?.nama_agenda || 'Manual'}</TableCell>
                              <TableCell>{formatWaktuSetor(item.waktu_setor)}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {item.program === 'TPQ'
                                  ? item.iqra_halaman_awal && item.iqra_halaman_akhir
                                    ? `Iqra' ${item.iqra_jilid ? `${item.iqra_jilid} ` : ''}Hlm. ${item.iqra_halaman_awal}-${item.iqra_halaman_akhir}`
                                    : item.surat
                                    ? `${item.surat}${
                                        item.ayat_awal
                                          ? ` Ayat ${item.ayat_awal}-${item.ayat_akhir || item.ayat_awal}`
                                          : ''
                                      }${item.juz ? ` (Juz ${item.juz})` : ''}`
                                    : '-'
                                  : item.surat || (item.juz ? `Juz ${item.juz}` : '-') }
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Kelancaran:</span>
                                    {getNilaiBadge(item.nilai_kelancaran)}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Tajwid:</span>
                                    {getNilaiBadge(item.nilai_tajwid)}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(item)}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleDeleteSetoran(item.id)}>
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Menampilkan {(historyFilters.page * historyPageSize) + 1}-
                        {Math.min((historyFilters.page + 1) * historyPageSize, historyTotal)} dari {historyTotal} entri
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateHistoryFilters({ page: historyFilters.page - 1 })}
                          disabled={!canPrevHistory}
                        >
                          Sebelumnya
                        </Button>
                        <span className="text-sm text-muted-foreground">{historyPageLabel}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateHistoryFilters({ page: historyFilters.page + 1 })}
                          disabled={!canNextHistory}
                        >
                          Berikutnya
                        </Button>
                      </div>
                    </div>
            </div>
          )}
        </CardContent>
      </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSetoran ? 'Edit Setoran' : 'Tambah Setoran'}</DialogTitle>
            <DialogDescription>Input detail setoran untuk {program}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Santri *</Label>
              <Select
                value={formData.santri_id}
                onValueChange={(value) => setFormData({ ...formData, santri_id: value })}
                disabled={!!editingSetoran}
              >
                <SelectTrigger><SelectValue placeholder="Pilih santri" /></SelectTrigger>
                <SelectContent>
                  {santriList.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nama_lengkap} {s.id_santri ? `(${s.id_santri})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => {
                  setFormData(prev => ({
                    ...prev,
                    status: value,
                    jenis_setoran:
                      value === 'Sudah Setor' || value === 'Hadir' ? prev.jenis_setoran : undefined,
                  }));
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sudah Setor">Sudah Setor</SelectItem>
                  <SelectItem value="Tidak Setor">Tidak Setor</SelectItem>
                  <SelectItem value="Izin">Izin</SelectItem>
                  <SelectItem value="Sakit">Sakit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Agenda</Label>
                <Select
                  value={
                    formData.agenda_id === undefined || formData.agenda_id === null
                      ? 'manual'
                      : formData.agenda_id
                  }
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      agenda_id: value === 'manual' ? null : value,
                    })
                  }
                >
                  <SelectTrigger><SelectValue placeholder="Pilih agenda" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Tanpa Agenda (Manual)</SelectItem>
                    {agendaOptions.map(agenda => (
                      <SelectItem key={agenda.id} value={agenda.id}>
                        {formatAgendaLabel(agenda)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Waktu Setor</Label>
                <Input
                  type="datetime-local"
                  value={formData.waktu_setor || ''}
                  onChange={(e) => setFormData({ ...formData, waktu_setor: e.target.value })}
                />
              </div>
            </div>

            {(formData.status === 'Sudah Setor' || formData.status === 'Hadir') && (
              <div>
                <Label>Jenis Aktivitas *</Label>
                <Select
                  value={formData.jenis_setoran || undefined}
                  onValueChange={(value: 'Menambah' | 'Murajaah') =>
                    setFormData({ ...formData, jenis_setoran: value })
                  }
                >
                  <SelectTrigger><SelectValue placeholder="Pilih jenis aktivitas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Menambah">Menambah (Hafalan Baru)</SelectItem>
                    <SelectItem value="Murajaah">Murajaah (Pengulangan)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Menambah: Setor hafalan baru • Murajaah: Setor pengulangan hafalan yang sudah ada
                </p>
              </div>
            )}

            {program === 'TPQ' && (formData.status === 'Sudah Setor' || formData.status === 'Hadir') && (
              <>
                <div>
                  <Label>Jenis Setoran *</Label>
                  <Select
                    value={formData.jenis_setoran_tpq || ''}
                    onValueChange={(value: 'Iqra' | 'Al-Quran') =>
                      setFormData({
                        ...formData,
                        jenis_setoran_tpq: value,
                        tambah_hafalan_surat: false,
                        iqra_jilid: undefined,
                        iqra_halaman_awal: undefined,
                        iqra_halaman_akhir: undefined,
                        surat: undefined,
                        ayat_awal: undefined,
                        ayat_akhir: undefined,
                        juz: undefined,
                      })
                    }
                  >
                    <SelectTrigger><SelectValue placeholder="Pilih jenis setoran" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Iqra">Iqra'</SelectItem>
                      <SelectItem value="Al-Quran">Al-Quran</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.jenis_setoran_tpq === 'Iqra' && (
                  <>
                    <div>
                      <Label>Jilid Iqra' *</Label>
                      <Select
                        value={formData.iqra_jilid || ''}
                        onValueChange={(value) => setFormData({ ...formData, iqra_jilid: value })}
                      >
                        <SelectTrigger><SelectValue placeholder="Pilih jilid Iqra'" /></SelectTrigger>
                        <SelectContent>
                          {IQRA_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Halaman Awal *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={formData.iqra_halaman_awal || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              iqra_halaman_awal: parseInt(e.target.value) || undefined,
                            })
                          }
                          placeholder="Contoh: 1"
                        />
                      </div>
                      <div>
                        <Label>Halaman Akhir *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={formData.iqra_halaman_akhir || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              iqra_halaman_akhir: parseInt(e.target.value) || undefined,
                            })
                          }
                          placeholder="Contoh: 5"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 p-4 border rounded-lg bg-gray-50">
                      <input
                        type="checkbox"
                        id="tambah-hafalan"
                        checked={formData.tambah_hafalan_surat || false}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            tambah_hafalan_surat: e.target.checked,
                            surat: e.target.checked ? formData.surat : undefined,
                            ayat_awal: e.target.checked ? formData.ayat_awal : undefined,
                            ayat_akhir: e.target.checked ? formData.ayat_akhir : undefined,
                            juz: e.target.checked ? formData.juz : undefined,
                          })
                        }
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="tambah-hafalan" className="font-normal cursor-pointer">
                        Tambahkan Hafalan Surat Pendek (Al-Quran)
                      </Label>
                    </div>

                    {formData.tambah_hafalan_surat && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Surat *</Label>
                            <Select
                              value={formData.surat || ''}
                              onValueChange={(value) => setFormData({ ...formData, surat: value })}
                            >
                              <SelectTrigger><SelectValue placeholder="Pilih surat" /></SelectTrigger>
                              <SelectContent className="max-h-[220px]">
                                {SURAT_PENDEK_TPQ.map(surat => (
                                  <SelectItem key={surat} value={surat}>
                                    {surat}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Juz (Opsional)</Label>
                            <Input
                              type="number"
                              min="1"
                              max="30"
                              value={formData.juz || ''}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  juz: parseInt(e.target.value) || undefined,
                                })
                              }
                              placeholder="Juz"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Ayat Awal</Label>
                            <Input
                              type="number"
                              min="1"
                              value={formData.ayat_awal || ''}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  ayat_awal: parseInt(e.target.value) || undefined,
                                })
                              }
                              placeholder="Ayat awal"
                            />
                          </div>
                          <div>
                            <Label>Ayat Akhir</Label>
                            <Input
                              type="number"
                              min="1"
                              value={formData.ayat_akhir || ''}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  ayat_akhir: parseInt(e.target.value) || undefined,
                                })
                              }
                              placeholder="Ayat akhir"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}

                {formData.jenis_setoran_tpq === 'Al-Quran' && (
                  <>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                      <p className="text-sm text-blue-800">
                        <strong>Setoran Al-Quran:</strong> Input untuk setoran Al-Quran di luar Iqra'.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Surat *</Label>
                        <Select
                          value={formData.surat || ''}
                          onValueChange={(value) => setFormData({ ...formData, surat: value })}
                        >
                          <SelectTrigger><SelectValue placeholder="Pilih surat" /></SelectTrigger>
                          <SelectContent className="max-h-[260px]">
                            {DAFTAR_SURAT_AL_QURAN.map(surat => (
                              <SelectItem key={surat} value={surat}>
                                {surat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Juz (Opsional)</Label>
                        <Input
                          type="number"
                          min="1"
                          max="30"
                          value={formData.juz || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              juz: parseInt(e.target.value) || undefined,
                            })
                          }
                          placeholder="Juz"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Ayat Awal</Label>
                        <Input
                          type="number"
                          min="1"
                          value={formData.ayat_awal || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              ayat_awal: parseInt(e.target.value) || undefined,
                            })
                          }
                          placeholder="Ayat awal"
                        />
                      </div>
                      <div>
                        <Label>Ayat Akhir</Label>
                        <Input
                          type="number"
                          min="1"
                          value={formData.ayat_akhir || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              ayat_akhir: parseInt(e.target.value) || undefined,
                            })
                          }
                          placeholder="Ayat akhir"
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {(program === 'Tahfid' || program === 'Tahsin') && (formData.status === 'Sudah Setor' || formData.status === 'Hadir') && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Surat</Label>
                    <Select
                      value={formData.surat || ''}
                      onValueChange={(value) => setFormData({ ...formData, surat: value })}
                    >
                      <SelectTrigger><SelectValue placeholder="Pilih surat (opsional)" /></SelectTrigger>
                      <SelectContent className="max-h-[260px]">
                        {DAFTAR_SURAT_AL_QURAN.map(surat => (
                          <SelectItem key={surat} value={surat}>
                            {surat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Juz</Label>
                    <Input
                      type="number"
                      min="1"
                      max="30"
                      value={formData.juz || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          juz: parseInt(e.target.value) || undefined,
                        })
                      }
                      placeholder="Juz"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Ayat Awal</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.ayat_awal || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ayat_awal: parseInt(e.target.value) || undefined,
                        })
                      }
                      placeholder="Ayat awal"
                    />
                  </div>
                  <div>
                    <Label>Ayat Akhir</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.ayat_akhir || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ayat_akhir: parseInt(e.target.value) || undefined,
                        })
                      }
                      placeholder="Ayat akhir"
                    />
                  </div>
                </div>
              </>
            )}

            {(formData.status === 'Sudah Setor' || formData.status === 'Hadir') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nilai Kelancaran</Label>
                  <Select
                    value={formData.nilai_kelancaran || ''}
                    onValueChange={(value) => setFormData({ ...formData, nilai_kelancaran: value })}
                  >
                    <SelectTrigger><SelectValue placeholder="Pilih nilai (opsional)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Maqbul">Maqbul</SelectItem>
                      <SelectItem value="Jayyid">Jayyid</SelectItem>
                      <SelectItem value="Jayyid Jiddan">Jayyid Jiddan</SelectItem>
                      <SelectItem value="Mumtaz">Mumtaz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Nilai Tajwid</Label>
                  <Select
                    value={formData.nilai_tajwid || ''}
                    onValueChange={(value) => setFormData({ ...formData, nilai_tajwid: value })}
                  >
                    <SelectTrigger><SelectValue placeholder="Pilih nilai (opsional)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Maqbul">Maqbul</SelectItem>
                      <SelectItem value="Jayyid">Jayyid</SelectItem>
                      <SelectItem value="Jayyid Jiddan">Jayyid Jiddan</SelectItem>
                      <SelectItem value="Mumtaz">Mumtaz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div>
              <Label>Catatan</Label>
              <Textarea
                value={formData.catatan || ''}
                onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                placeholder="Catatan tambahan"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveSetoran}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SetoranHarianPage;


