import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AkademikKelasService, KelasMaster } from '@/services/akademikKelas.service';
import { AkademikSemesterService, Semester } from '@/services/akademikSemester.service';
import { AkademikAgendaService, AkademikAgenda } from '@/services/akademikAgenda.service';
import { AkademikNilaiService, Nilai, NilaiInput, KehadiranSummary } from '@/services/akademikNilai.service';
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
import { BookOpen, Save, RefreshCw, CheckCircle2, XCircle, AlertCircle, Users, Search, GraduationCap } from 'lucide-react';

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

  const selectedKelas = classes.find(k => k.id === kelasId);
  const selectedAgendaObj = agendas.find(a => a.id === selectedAgendaId);

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

  const loadAgendas = useCallback(async (kelasIdParam?: string) => {
    try {
      if (!kelasIdParam) {
        setAgendas([]);
        return;
      }

      const list = await AkademikAgendaService.listAgenda(kelasIdParam);
      setAgendas(list.filter(a => a.aktif));
      
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
    if (kelasId) {
      loadAgendas(kelasId);
      loadAnggotaKelas(kelasId);
      loadNilai();
    }
  }, [kelasId, loadAgendas, loadAnggotaKelas, loadNilai]);

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

      // Validasi: jika kehadiran < 60%, tidak bisa input nilai
      if (kehadiran.persentase_kehadiran < 60) {
        toast.error(
          `Tidak dapat input nilai karena kehadiran kurang dari 60%. Kehadiran saat ini: ${kehadiran.persentase_kehadiran.toFixed(2)}%`
        );
        return;
      }

      // Set kehadiran di map
      setKehadiranMap((prev) => ({
        ...prev,
        [santri.id]: kehadiran,
      }));

      // Cek apakah sudah ada nilai
      const nilaiLama = getNilaiForSantri(santri.id, agenda.id);
      
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
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan nilai');
    } finally {
      setSaving(false);
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

  // Get status badge untuk kehadiran
  const getKehadiranBadge = (persentase: number) => {
    if (persentase >= 60) {
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Input Nilai
          </CardTitle>
          <CardDescription>
            Input nilai per santri per mata pelajaran dengan validasi kehadiran minimum 60%
          </CardDescription>
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
              Klik pada sel untuk input atau edit nilai. Kehadiran minimum 60% diperlukan untuk input nilai.
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
                                    disabled={loadingKehadiran || (kehadiranMap[santri.id] && kehadiranMap[santri.id].persentase_kehadiran < 60)}
                                    title={kehadiranMap[santri.id] && kehadiranMap[santri.id].persentase_kehadiran < 60 
                                      ? `Kehadiran kurang dari 60% (${kehadiranMap[santri.id].persentase_kehadiran.toFixed(2)}%)`
                                      : ''}
                                  >
                                    {nilai ? 'Edit' : 'Input'}
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
                              disabled={loadingKehadiran || !selectedAgendaObj || (kehadiran && kehadiran.persentase_kehadiran < 60)}
                              title={kehadiran && kehadiran.persentase_kehadiran < 60 
                                ? `Kehadiran kurang dari 60% (${kehadiran.persentase_kehadiran.toFixed(2)}%)`
                                : ''}
                            >
                              {nilai ? 'Edit' : 'Input'}
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
            <DialogTitle>Input Nilai</DialogTitle>
            <DialogDescription>
              Input nilai untuk {selectedSantri?.nama_lengkap} - {selectedAgenda?.nama_agenda}
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
                        {kehadiranMap[selectedSantri.id].persentase_kehadiran >= 60 ? (
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
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setNilaiDialogOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button onClick={handleSaveNilai} disabled={saving || !formData.nilai_angka}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Menyimpan...' : 'Simpan Nilai'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InputNilaiPage;

