import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AkademikKelasService, KelasMasterInput } from '@/modules/akademik/services/akademikKelas.service';
import { AkademikAgendaService, AgendaHari } from '@/modules/akademik/services/akademikAgenda.service';
import { AkademikSemesterService, Semester } from '@/modules/akademik/services/akademikSemester.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, Search, X, Check, ChevronsUpDown, Archive, ArchiveRestore } from 'lucide-react';
import { AGENDA_HARI_OPTIONS } from '@/constants/akademik.constants';
import { cn } from '@/lib/utils';

interface AgendaFormItem {
  id: string;
  sourceId?: string;
  mapel_id?: string | null;
  pengajar_id?: string | null;
  hari: AgendaHari;
  jam_mulai: string;
  jam_selesai: string;
  lokasi?: string;
  catatan?: string;
  isNew?: boolean;
  aktif?: boolean;
}

const MasterKelasPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [kelas, setKelas] = useState<Array<any>>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);
  const [activeSemester, setActiveSemester] = useState<Semester | null>(null);

  // Form state
  const [kelasSheetOpen, setKelasSheetOpen] = useState(false);
  const [editingKelas, setEditingKelas] = useState<any | null>(null);
  const [kelasForm, setKelasForm] = useState({
    nama_kelas: '',
    tingkat: '',
    rombel: '',
    catatan: '',
  });

  // Agenda state
  const [agendaSheetOpen, setAgendaSheetOpen] = useState(false);
  const [selectedKelasForAgenda, setSelectedKelasForAgenda] = useState<any | null>(null);
  const [agendaItems, setAgendaItems] = useState<AgendaFormItem[]>([]);
  const [pengajarList, setPengajarList] = useState<Array<{ id: string; nama_lengkap: string }>>([]);
  const [mapelList, setMapelList] = useState<Array<{ id: string; nama_mapel: string }>>([]);
  const [savingAgenda, setSavingAgenda] = useState(false);
  const [agendaError, setAgendaError] = useState<string>('');
  const [showArchivedAgenda, setShowArchivedAgenda] = useState(false);

  // Quick add states
  const [quickAddMapelOpen, setQuickAddMapelOpen] = useState(false);
  const [quickAddPengajarOpen, setQuickAddPengajarOpen] = useState(false);
  const [quickAddMapelInput, setQuickAddMapelInput] = useState('');
  const [quickAddPengajarInput, setQuickAddPengajarInput] = useState('');
  const [quickAddContext, setQuickAddContext] = useState<{ itemId: string; type: 'mapel' | 'pengajar' } | null>(null);
  const [creatingMapel, setCreatingMapel] = useState(false);
  const [creatingPengajar, setCreatingPengajar] = useState(false);
  
  // State untuk searchable dropdown per item
  const [mapelSearchStates, setMapelSearchStates] = useState<Record<string, string>>({});
  const [pengajarSearchStates, setPengajarSearchStates] = useState<Record<string, string>>({});
  const [mapelOpenStates, setMapelOpenStates] = useState<Record<string, boolean>>({});
  const [pengajarOpenStates, setPengajarOpenStates] = useState<Record<string, boolean>>({});

  const loadSemesters = useCallback(async () => {
    try {
      const list = await AkademikSemesterService.listSemester();
      list.sort((a, b) => new Date(b.tanggal_mulai).getTime() - new Date(a.tanggal_mulai).getTime());
      setSemesters(list);
      
      const aktif = await AkademikSemesterService.getSemesterAktif().catch(() => null);
      setActiveSemester(aktif);
      if (aktif) {
        setSelectedSemesterId(aktif.id);
      } else if (list.length > 0) {
        setSelectedSemesterId(list[0].id);
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal memuat semester');
    }
  }, []);

  const loadKelas = useCallback(async () => {
    try {
      setLoading(true);
      const rows = await AkademikKelasService.listKelas();
      const filtered = selectedSemesterId 
        ? rows.filter(k => k.semester_id === selectedSemesterId)
        : rows;
      setKelas(filtered);
    } catch (e: any) {
      toast.error(e.message || 'Gagal memuat data kelas');
    } finally {
      setLoading(false);
    }
  }, [selectedSemesterId]);

  const loadPengajarAndMapel = useCallback(async () => {
    try {
      const [pengajar, mapel] = await Promise.all([
        AkademikAgendaService.listPengajar('Aktif'),
        AkademikAgendaService.listMapel({ program: 'Madin', status: 'Aktif' }),
      ]);
      setPengajarList(pengajar);
      setMapelList(mapel);
    } catch (error: any) {
      console.error('Error loading pengajar/mapel:', error);
    }
  }, []);

  // Reload pengajar and mapel when dialog closes (in case master data was updated)
  useEffect(() => {
    if (!quickAddMapelOpen && !quickAddPengajarOpen) {
      loadPengajarAndMapel();
    }
  }, [quickAddMapelOpen, quickAddPengajarOpen, loadPengajarAndMapel]);

  useEffect(() => { 
    loadSemesters();
    loadPengajarAndMapel();
  }, [loadSemesters, loadPengajarAndMapel]);

  useEffect(() => {
      loadKelas();
  }, [loadKelas]);

  const filteredKelas = useMemo(() => {
    if (!searchTerm) return kelas;
    const term = searchTerm.toLowerCase();
    return kelas.filter(k => 
      k.nama_kelas?.toLowerCase().includes(term) ||
      k.tingkat?.toLowerCase().includes(term) ||
      k.rombel?.toLowerCase().includes(term)
    );
  }, [kelas, searchTerm]);

  const handleOpenKelasForm = (kelasRow?: any) => {
    if (kelasRow) {
      setEditingKelas(kelasRow);
      setKelasForm({
        nama_kelas: kelasRow.nama_kelas || '',
        tingkat: kelasRow.tingkat || '',
        rombel: kelasRow.rombel || '',
        catatan: '',
      });
    } else {
      setEditingKelas(null);
      setKelasForm({
        nama_kelas: '',
        tingkat: '',
        rombel: '',
        catatan: '',
      });
    }
    setKelasSheetOpen(true);
  };

  const handleSaveKelas = async () => {
    if (!selectedSemesterId) {
      toast.error('Pilih semester terlebih dahulu');
      return;
    }
    if (!kelasForm.nama_kelas.trim()) {
      toast.error('Nama kelas wajib diisi');
      return;
    }

    try {
      const selectedSem = semesters.find(s => s.id === selectedSemesterId);
      if (!selectedSem) {
        toast.error('Semester tidak valid');
      return;
    }

      const payload: KelasMasterInput = {
        nama_kelas: kelasForm.nama_kelas.trim(),
        program: 'Madin', // Fixed untuk Madin saja sesuai spec
        tingkat: kelasForm.tingkat.trim() || undefined,
        rombel: kelasForm.rombel.trim() || undefined,
        semester_id: selectedSem.id,
        tahun_ajaran_id: selectedSem.tahun_ajaran_id,
        tahun_ajaran: selectedSem.tahun_ajaran?.nama || '',
        semester: selectedSem.nama,
        status: 'Aktif',
      };

      if (editingKelas) {
        await AkademikKelasService.updateKelas(editingKelas.id, payload);
        toast.success('Kelas berhasil diperbarui');
      } else {
        await AkademikKelasService.createKelas(payload);
        toast.success('Kelas berhasil dibuat');
      }

      setKelasSheetOpen(false);
      loadKelas();
    } catch (e: any) {
      toast.error(e.message || 'Gagal menyimpan kelas');
    }
  };

  const handleDeleteKelas = async (id: string) => {
    if (!confirm('Hapus kelas ini? Kelas dan keanggotaan akan ikut terhapus.')) return;
    try {
      await AkademikKelasService.deleteKelas(id);
      toast.success('Kelas dihapus');
      loadKelas();
    } catch (e: any) {
      toast.error(e.message || 'Gagal menghapus kelas');
    }
  };

  const handleOpenAgendaForm = async (kelasRow: any, forceShowArchived?: boolean) => {
    setSelectedKelasForAgenda(kelasRow);
    if (forceShowArchived !== undefined) {
      setShowArchivedAgenda(forceShowArchived);
    }
    try {
      // Get semester_id from kelas
      const kelasDetail = await AkademikKelasService.getKelasById(kelasRow.id);
      const semesterId = kelasDetail?.semester_id;
      
      const agendas = await AkademikAgendaService.listAgendaByKelas(kelasRow.id, { 
        aktifOnly: false,
        semesterId: semesterId || undefined
      });
      
      // Filter by aktif status based on toggle
      const currentShowArchived = forceShowArchived !== undefined ? forceShowArchived : showArchivedAgenda;
      const filteredAgendas = currentShowArchived 
        ? agendas 
        : agendas.filter(a => a.aktif);
      
      setAgendaItems(
        filteredAgendas.map(agenda => ({
          id: `agenda-${Date.now()}-${Math.random()}`,
          sourceId: agenda.id,
          mapel_id: agenda.mapel_id || null,
          pengajar_id: agenda.pengajar_id || null,
          hari: (agenda.hari as AgendaHari) || 'Senin',
          jam_mulai: agenda.jam_mulai?.slice(0, 5) || '',
          jam_selesai: agenda.jam_selesai?.slice(0, 5) || '',
          lokasi: agenda.lokasi || '',
          catatan: agenda.catatan || '',
          isNew: false,
          aktif: agenda.aktif,
        }))
      );
      setAgendaSheetOpen(true);
    } catch (e: any) {
      toast.error(e.message || 'Gagal memuat agenda');
    }
  };

  const handleAddAgendaItem = () => {
    setAgendaItems(prev => [...prev, {
      id: `agenda-${Date.now()}-${Math.random()}`,
      hari: 'Senin',
      jam_mulai: '',
      jam_selesai: '',
      lokasi: '',
      catatan: '',
      isNew: true,
    }]);
  };

  const handleRemoveAgendaItem = (id: string) => {
    setAgendaItems(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateAgendaItem = (id: string, field: keyof AgendaFormItem, value: any) => {
    setAgendaItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const generateAgendaName = (item: AgendaFormItem): string => {
    const mapel = mapelList.find(m => m.id === item.mapel_id);
    const pengajar = pengajarList.find(p => p.id === item.pengajar_id);
    const parts: string[] = [];
    if (mapel) parts.push(mapel.nama_mapel);
    if (item.hari) parts.push(item.hari);
    if (item.jam_mulai) parts.push(item.jam_mulai);
    return parts.join(' ') || 'Agenda';
  };

  const handleSaveAgenda = async () => {
    if (!selectedKelasForAgenda) return;
    setAgendaError('');

    // Get semester_id from kelas
    const kelasDetail = await AkademikKelasService.getKelasById(selectedKelasForAgenda.id);
    const semesterId = kelasDetail?.semester_id;

    // Validate
    for (const item of agendaItems) {
      if (!item.mapel_id || !item.hari || !item.jam_mulai || !item.jam_selesai) {
        setAgendaError('Mapel, Hari, Jam mulai, dan Jam selesai wajib diisi untuk semua jadwal');
        return;
      }
      if (item.jam_mulai >= item.jam_selesai) {
        setAgendaError('Jam selesai harus setelah jam mulai');
        return;
      }
    }

    // Check for duplicates (only for new items)
    if (semesterId) {
      const existingAgendas = await AkademikAgendaService.listAgendaByKelas(selectedKelasForAgenda.id, { 
        aktifOnly: false,
        semesterId 
      });
      
      for (const item of agendaItems) {
        if (!item.sourceId) { // Only check new items
          const duplicate = existingAgendas.find(a => 
            a.mapel_id === item.mapel_id &&
            a.hari === item.hari &&
            a.jam_mulai === item.jam_mulai &&
            a.jam_selesai === item.jam_selesai
          );
          if (duplicate) {
            setAgendaError(`Jadwal sudah ada: ${generateAgendaName(item)}`);
            return;
          }
        }
      }
    }

    setSavingAgenda(true);
    try {
      const kelasId = selectedKelasForAgenda.id;
      const currentIds = agendaItems
        .map(item => item.sourceId)
        .filter((id): id is string => Boolean(id));
      
      // Get existing agenda IDs to determine which to delete (only from same semester)
      const existingAgendas = await AkademikAgendaService.listAgendaByKelas(kelasId, { 
        aktifOnly: false,
        semesterId: semesterId || undefined
      });
      const existingIds = existingAgendas.map(a => a.id);
      const toDelete = existingIds.filter(id => !currentIds.includes(id));

      // Save/update agenda items
      await Promise.all([
        ...agendaItems.map(item => {
          const nama_agenda = generateAgendaName(item);
          const payload = {
            nama_agenda,
            mapel_id: item.mapel_id,
            pengajar_id: item.pengajar_id,
            hari: item.hari,
            jam_mulai: item.jam_mulai || null,
            jam_selesai: item.jam_selesai || null,
            lokasi: item.lokasi || null,
            catatan: item.catatan || null,
            jenis: 'Absensi' as const,
            frekuensi: 'Mingguan' as const,
            aktif: item.aktif !== undefined ? item.aktif : true,
          };
          if (item.sourceId) {
            return AkademikAgendaService.updateAgenda(item.sourceId, payload);
          }
          return AkademikAgendaService.createAgenda({
            kelas_id: kelasId,
            ...payload,
          });
        }),
        ...toDelete.map(id => AkademikAgendaService.deleteAgenda(id)),
      ]);

      toast.success('Jadwal berhasil disimpan');
      // Reload agenda list
      await handleOpenAgendaForm(selectedKelasForAgenda, showArchivedAgenda);
      loadKelas();
    } catch (e: any) {
      setAgendaError(e.message || 'Gagal menyimpan jadwal');
    } finally {
      setSavingAgenda(false);
    }
  };

  const handleQuickAddMapel = async () => {
    if (!quickAddMapelInput.trim()) {
      toast.error('Nama mapel wajib diisi');
      return;
    }

    setCreatingMapel(true);
    try {
      await AkademikAgendaService.createMapel({
        nama_mapel: quickAddMapelInput.trim(),
        program: 'Madin',
        status: 'Aktif',
      });
      
      // Reload mapel list
      const updatedMapel = await AkademikAgendaService.listMapel({ program: 'Madin', status: 'Aktif' });
      setMapelList(updatedMapel);
      
      // Auto-select newly created mapel
      if (quickAddContext && quickAddContext.type === 'mapel') {
        const newMapel = updatedMapel.find(m => m.nama_mapel === quickAddMapelInput.trim());
        if (newMapel) {
          handleUpdateAgendaItem(quickAddContext.itemId, 'mapel_id', newMapel.id);
        }
      }
      
      setQuickAddMapelOpen(false);
      setQuickAddMapelInput('');
      setQuickAddContext(null);
      toast.success('Mapel berhasil ditambahkan');
    } catch (e: any) {
      toast.error(e.message || 'Gagal menambahkan mapel');
    } finally {
      setCreatingMapel(false);
    }
  };

  const handleQuickAddPengajar = async () => {
    if (!quickAddPengajarInput.trim()) {
      toast.error('Nama pengajar wajib diisi');
      return;
    }

    setCreatingPengajar(true);
    try {
      await AkademikAgendaService.createPengajar({
        nama_lengkap: quickAddPengajarInput.trim(),
        status: 'Aktif',
      });
      
      // Reload pengajar list
      const updatedPengajar = await AkademikAgendaService.listPengajar('Aktif');
      setPengajarList(updatedPengajar);
      
      // Auto-select newly created pengajar
      if (quickAddContext && quickAddContext.type === 'pengajar') {
        const newPengajar = updatedPengajar.find(p => p.nama_lengkap === quickAddPengajarInput.trim());
        if (newPengajar) {
          handleUpdateAgendaItem(quickAddContext.itemId, 'pengajar_id', newPengajar.id);
        }
      }
      
      setQuickAddPengajarOpen(false);
      setQuickAddPengajarInput('');
      setQuickAddContext(null);
      toast.success('Pengajar berhasil ditambahkan');
    } catch (e: any) {
      toast.error(e.message || 'Gagal menambahkan pengajar');
    } finally {
      setCreatingPengajar(false);
    }
  };

  const selectedSemester = semesters.find(s => s.id === selectedSemesterId);

  return (
    <div className="space-y-4">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background border-b pb-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 flex items-center gap-4">
            <div className="w-[250px]">
              <Label>Term</Label>
              <Select
                value={selectedSemesterId || 'all'}
                onValueChange={(value) => setSelectedSemesterId(value === 'all' ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Term</SelectItem>
                  {semesters.map(sem => (
                    <SelectItem key={sem.id} value={sem.id}>
                      {sem.nama} • {sem.tahun_ajaran?.nama || '-'}
                      {sem.is_aktif && ' (Aktif)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 max-w-md">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari kelas..."
                  className="pl-8"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-7 w-7 p-0"
                    onClick={() => setSearchTerm('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
            </div>
            </div>
            </div>
          <div className="pt-6">
            <Button onClick={() => handleOpenKelasForm()} disabled={!selectedSemesterId}>
              <Plus className="w-4 h-4 mr-2" />
              Buat Kelas
            </Button>
          </div>
            </div>
            </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Kelas</TableHead>
              <TableHead>Tingkat</TableHead>
              <TableHead>Rombel</TableHead>
                  <TableHead>Anggota</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Memuat...
                    </TableCell>
              </TableRow>
            ) : filteredKelas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  {searchTerm ? 'Tidak ada kelas yang cocok' : 'Belum ada kelas'}
                    </TableCell>
              </TableRow>
            ) : (
              filteredKelas.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.nama_kelas}</TableCell>
                  <TableCell>{row.tingkat || '-'}</TableCell>
                  <TableCell>{row.rombel || '-'}</TableCell>
                  <TableCell>{row.jumlah_anggota || 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                        onClick={() => handleOpenAgendaForm(row)}
                        >
                        Jadwal
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                        onClick={() => handleOpenKelasForm(row)}
                        >
                        <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                        onClick={() => handleDeleteKelas(row.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
              ))
            )}
              </TableBody>
            </Table>
          </div>

      {/* Kelas Form Sheet */}
      <Sheet open={kelasSheetOpen} onOpenChange={setKelasSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editingKelas ? 'Edit Kelas' : 'Buat Kelas Baru'}</SheetTitle>
            <SheetDescription>
              {editingKelas ? 'Perbarui informasi kelas' : 'Buat kelas Madin baru untuk term yang dipilih'}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
                <div>
              <Label>Term *</Label>
              <Input
                value={selectedSemester ? `${selectedSemester.nama} • ${selectedSemester.tahun_ajaran?.nama || '-'}` : ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">Term ditentukan dari filter</p>
            </div>
              <div>
              <Label>Nama Kelas *</Label>
                <Input
                value={kelasForm.nama_kelas}
                onChange={(e) => setKelasForm(prev => ({ ...prev, nama_kelas: e.target.value }))}
                placeholder="Contoh: Madin I'dad A"
                />
              </div>
              <div>
              <Label>Tingkat/Level</Label>
                <Input
                value={kelasForm.tingkat}
                onChange={(e) => setKelasForm(prev => ({ ...prev, tingkat: e.target.value }))}
                placeholder="Contoh: I'dad, Wustho"
                />
              </div>
              <div>
              <Label>Rombel/Kode</Label>
                <Input
                value={kelasForm.rombel}
                onChange={(e) => setKelasForm(prev => ({ ...prev, rombel: e.target.value }))}
                  placeholder="Contoh: A, B, C"
                />
              </div>
              <div>
              <Label>Catatan</Label>
              <Textarea
                value={kelasForm.catatan}
                onChange={(e) => setKelasForm(prev => ({ ...prev, catatan: e.target.value }))}
                rows={3}
                placeholder="Catatan opsional"
              />
              </div>
              </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setKelasSheetOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveKelas}>
              Simpan
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Agenda Form Sheet */}
      <Sheet open={agendaSheetOpen} onOpenChange={setAgendaSheetOpen}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle>Kelola Jadwal</SheetTitle>
                <SheetDescription>
                  {selectedKelasForAgenda?.nama_kelas || 'Kelas'}
                </SheetDescription>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={showArchivedAgenda}
                  onCheckedChange={async (checked) => {
                    if (selectedKelasForAgenda) {
                      await handleOpenAgendaForm(selectedKelasForAgenda, checked);
                    } else {
                      setShowArchivedAgenda(checked);
                    }
                  }}
                  id="show-archived"
                />
                <Label htmlFor="show-archived" className="text-sm cursor-pointer">
                  Tampilkan arsip
                </Label>
              </div>
            </div>
          </SheetHeader>
          <div className="space-y-4 py-4">
            {agendaError && (
              <Alert variant="destructive">
                <AlertDescription>{agendaError}</AlertDescription>
              </Alert>
            )}
            {agendaItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada jadwal. Tambahkan jadwal baru.</p>
            ) : (
              agendaItems.map((item, index) => {
                const selectedMapel = mapelList.find(m => m.id === item.mapel_id);
                const selectedPengajar = pengajarList.find(p => p.id === item.pengajar_id);
                const mapelOpen = mapelOpenStates[item.id] || false;
                const pengajarOpen = pengajarOpenStates[item.id] || false;
                const mapelSearch = mapelSearchStates[item.id] || '';
                const pengajarSearch = pengajarSearchStates[item.id] || '';

                // Filter tanpa useMemo (dihitung langsung)
                const filteredMapel = mapelSearch
                  ? mapelList.filter(m => m.nama_mapel.toLowerCase().includes(mapelSearch.toLowerCase()))
                  : mapelList;

                const filteredPengajar = pengajarSearch
                  ? pengajarList.filter(p => p.nama_lengkap.toLowerCase().includes(pengajarSearch.toLowerCase()))
                  : pengajarList;

                const mapelNotFound = mapelSearch && !filteredMapel.some(m => m.nama_mapel.toLowerCase() === mapelSearch.toLowerCase());
                const pengajarNotFound = pengajarSearch && !filteredPengajar.some(p => p.nama_lengkap.toLowerCase() === pengajarSearch.toLowerCase());

                return (
                  <div key={item.id} className={`border rounded-lg p-4 space-y-4 ${item.aktif === false ? 'opacity-60 bg-muted/30' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">Jadwal #{index + 1}</div>
                        {item.aktif === false && (
                          <Badge variant="secondary" className="text-xs">
                            Arsip
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {item.sourceId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              try {
                                await AkademikAgendaService.updateAgenda(item.sourceId!, {
                                  aktif: !item.aktif
                                });
                                toast.success(`Jadwal ${item.aktif ? 'dinonaktifkan' : 'diaktifkan'}`);
                                if (selectedKelasForAgenda) {
                                  await handleOpenAgendaForm(selectedKelasForAgenda, showArchivedAgenda);
                                }
                              } catch (e: any) {
                                toast.error(e.message || 'Gagal mengubah status');
                              }
                            }}
                            title={item.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                          >
                            {item.aktif ? (
                              <Archive className="w-4 h-4" />
                            ) : (
                              <ArchiveRestore className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAgendaItem(item.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Mapel *</Label>
                        <Popover 
                          open={mapelOpen} 
                          onOpenChange={(open) => setMapelOpenStates(prev => ({ ...prev, [item.id]: open }))}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={mapelOpen}
                              className="w-full justify-between"
                            >
                              {selectedMapel ? selectedMapel.nama_mapel : 'Pilih mapel...'}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0">
                            <Command>
                              <CommandInput 
                                placeholder="Cari mapel..." 
                                value={mapelSearch}
                                onValueChange={(value) => setMapelSearchStates(prev => ({ ...prev, [item.id]: value }))}
                              />
                              <CommandList>
                                <CommandEmpty>
                                  {mapelNotFound ? (
                                    <div className="p-2">
                                      <Button
                                        variant="ghost"
                                        className="w-full justify-start"
                                        onClick={() => {
                                          setQuickAddContext({ itemId: item.id, type: 'mapel' });
                                          setQuickAddMapelInput(mapelSearch);
                                          setQuickAddMapelOpen(true);
                                          setMapelOpenStates(prev => ({ ...prev, [item.id]: false }));
                                        }}
                                      >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Tambah Mapel: {mapelSearch}
                                      </Button>
                                    </div>
                                  ) : (
                                    'Tidak ada mapel ditemukan'
                                  )}
                                </CommandEmpty>
                                <CommandGroup>
                                  {filteredMapel.map(mapel => (
                                    <CommandItem
                                      key={mapel.id}
                                      value={mapel.nama_mapel}
                                      onSelect={() => {
                                        handleUpdateAgendaItem(item.id, 'mapel_id', mapel.id);
                                        setMapelOpenStates(prev => ({ ...prev, [item.id]: false }));
                                        setMapelSearchStates(prev => ({ ...prev, [item.id]: '' }));
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          item.mapel_id === mapel.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {mapel.nama_mapel}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
              </div>
              <div>
                        <Label>Pengajar</Label>
                        <Popover 
                          open={pengajarOpen} 
                          onOpenChange={(open) => setPengajarOpenStates(prev => ({ ...prev, [item.id]: open }))}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={pengajarOpen}
                              className="w-full justify-between"
                            >
                              {item.pengajar_id === null ? 'Belum ditugaskan (TBA)' : selectedPengajar ? selectedPengajar.nama_lengkap : 'Pilih pengajar...'}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0">
                            <Command>
                              <CommandInput 
                                placeholder="Cari pengajar..." 
                                value={pengajarSearch}
                                onValueChange={(value) => setPengajarSearchStates(prev => ({ ...prev, [item.id]: value }))}
                              />
                              <CommandList>
                                <CommandEmpty>
                                  {pengajarNotFound ? (
                                    <div className="p-2">
                                      <Button
                                        variant="ghost"
                                        className="w-full justify-start"
                                        onClick={() => {
                                          setQuickAddContext({ itemId: item.id, type: 'pengajar' });
                                          setQuickAddPengajarInput(pengajarSearch);
                                          setQuickAddPengajarOpen(true);
                                          setPengajarOpenStates(prev => ({ ...prev, [item.id]: false }));
                                        }}
                                      >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Tambah Pengajar: {pengajarSearch}
                                      </Button>
                                    </div>
                                  ) : (
                                    'Tidak ada pengajar ditemukan'
                                  )}
                                </CommandEmpty>
                                <CommandGroup>
                                  <CommandItem
                                    value="tba"
                                    onSelect={() => {
                                      handleUpdateAgendaItem(item.id, 'pengajar_id', null);
                                      setPengajarOpenStates(prev => ({ ...prev, [item.id]: false }));
                                      setPengajarSearchStates(prev => ({ ...prev, [item.id]: '' }));
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        item.pengajar_id === null ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    Belum ditugaskan (TBA)
                                  </CommandItem>
                                  {filteredPengajar.map(pengajar => (
                                    <CommandItem
                                      key={pengajar.id}
                                      value={pengajar.nama_lengkap}
                                      onSelect={() => {
                                        handleUpdateAgendaItem(item.id, 'pengajar_id', pengajar.id);
                                        setPengajarOpenStates(prev => ({ ...prev, [item.id]: false }));
                                        setPengajarSearchStates(prev => ({ ...prev, [item.id]: '' }));
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          item.pengajar_id === pengajar.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {pengajar.nama_lengkap}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {item.pengajar_id === null && (
                          <p className="text-xs text-muted-foreground mt-1">Jadwal dapat disimpan tanpa pengajar</p>
                        )}
                      </div>
                      <div>
                        <Label>Hari *</Label>
                        <Select
                          value={item.hari}
                          onValueChange={(value) => handleUpdateAgendaItem(item.id, 'hari', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {AGENDA_HARI_OPTIONS.map(hari => (
                              <SelectItem key={hari} value={hari}>
                                {hari}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Lokasi</Label>
                        <Input
                          value={item.lokasi}
                          onChange={(e) => handleUpdateAgendaItem(item.id, 'lokasi', e.target.value)}
                          placeholder="Contoh: Masjid Besar"
                        />
                      </div>
                      <div>
                        <Label>Jam Mulai *</Label>
                        <Input
                          type="time"
                          value={item.jam_mulai}
                          onChange={(e) => handleUpdateAgendaItem(item.id, 'jam_mulai', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Jam Selesai *</Label>
                        <Input
                          type="time"
                          value={item.jam_selesai}
                          onChange={(e) => handleUpdateAgendaItem(item.id, 'jam_selesai', e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Catatan</Label>
                        <Textarea
                          value={item.catatan}
                          onChange={(e) => handleUpdateAgendaItem(item.id, 'catatan', e.target.value)}
                          rows={2}
                          placeholder="Catatan opsional"
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <Button variant="outline" onClick={handleAddAgendaItem} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Jadwal
            </Button>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => {
              setAgendaSheetOpen(false);
              setAgendaError('');
            }} disabled={savingAgenda}>
              Batal
            </Button>
            <Button onClick={handleSaveAgenda} disabled={savingAgenda}>
              {savingAgenda ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Quick Add Mapel Dialog */}
      <Dialog open={quickAddMapelOpen} onOpenChange={setQuickAddMapelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Mapel Baru</DialogTitle>
            <DialogDescription>
              Tambahkan mapel baru ke master data
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nama Mapel *</Label>
              <Input
                value={quickAddMapelInput}
                onChange={(e) => setQuickAddMapelInput(e.target.value)}
                placeholder="Contoh: Fiqih"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && quickAddMapelInput.trim()) {
                    handleQuickAddMapel();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setQuickAddMapelOpen(false);
              setQuickAddMapelInput('');
              setQuickAddContext(null);
            }} disabled={creatingMapel}>
              Batal
            </Button>
            <Button onClick={handleQuickAddMapel} disabled={creatingMapel || !quickAddMapelInput.trim()}>
              {creatingMapel ? 'Menambahkan...' : 'Tambah'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Add Pengajar Dialog */}
      <Dialog open={quickAddPengajarOpen} onOpenChange={setQuickAddPengajarOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Pengajar Baru</DialogTitle>
            <DialogDescription>
              Tambahkan pengajar baru ke master data
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nama Pengajar *</Label>
              <Input
                value={quickAddPengajarInput}
                onChange={(e) => setQuickAddPengajarInput(e.target.value)}
                placeholder="Contoh: Ust. Ahmad"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && quickAddPengajarInput.trim()) {
                    handleQuickAddPengajar();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Pengajar dapat ditambahkan tanpa akun login. Linking akun dapat dilakukan nanti.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setQuickAddPengajarOpen(false);
              setQuickAddPengajarInput('');
              setQuickAddContext(null);
            }} disabled={creatingPengajar}>
              Batal
            </Button>
            <Button onClick={handleQuickAddPengajar} disabled={creatingPengajar || !quickAddPengajarInput.trim()}>
              {creatingPengajar ? 'Menambahkan...' : 'Tambah'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MasterKelasPage;

