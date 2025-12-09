import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AkademikKelasService, KelasMaster } from '@/services/akademikKelas.service';
import { AkademikSemesterService, Semester } from '@/services/akademikSemester.service';
import { AkademikRapotService, Rapot } from '@/services/akademikRapot.service';
import { AkademikNilaiService, Nilai } from '@/services/akademikNilai.service';
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
import { FileText, RefreshCw, CheckCircle2, XCircle, AlertCircle, Search, GraduationCap, Download, Printer } from 'lucide-react';

const RapotPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const isPengajar = user?.role === 'pengajar' || user?.roles?.includes('pengajar');
  const [pengajarId, setPengajarId] = useState<string | null>(null);

  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | undefined>(undefined);
  const [classes, setClasses] = useState<KelasMaster[]>([]);
  const [kelasId, setKelasId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Data rapot dan nilai
  const [rapotList, setRapotList] = useState<Rapot[]>([]);
  const [nilaiList, setNilaiList] = useState<Nilai[]>([]);
  const [generating, setGenerating] = useState(false);

  // Dialog detail rapot
  const [rapotDialogOpen, setRapotDialogOpen] = useState(false);
  const [selectedRapot, setSelectedRapot] = useState<Rapot | null>(null);
  const [selectedRapotNilai, setSelectedRapotNilai] = useState<Nilai[]>([]);

  const selectedKelas = classes.find(k => k.id === kelasId);

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

  const loadRapot = useCallback(async () => {
    if (!kelasId || !selectedSemesterId) {
      setRapotList([]);
      return;
    }

    try {
      setLoading(true);
      const list = await AkademikRapotService.listRapot(kelasId, selectedSemesterId);
      setRapotList(list);
    } catch (error: any) {
      toast.error(error.message || 'Gagal memuat rapot');
    } finally {
      setLoading(false);
    }
  }, [kelasId, selectedSemesterId]);

  const loadNilai = useCallback(async () => {
    if (!kelasId || !selectedSemesterId) {
      setNilaiList([]);
      return;
    }

    try {
      const list = await AkademikNilaiService.listNilai(kelasId, selectedSemesterId);
      setNilaiList(list);
    } catch (error: any) {
      console.error('Error loading nilai:', error);
    }
  }, [kelasId, selectedSemesterId]);

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
      loadRapot();
      loadNilai();
    }
  }, [kelasId, loadRapot, loadNilai]);

  // Generate rapot untuk semua santri di kelas
  const handleGenerateRapot = async () => {
    if (!kelasId || !selectedSemesterId) {
      toast.error('Pilih kelas dan semester terlebih dahulu');
      return;
    }

    setGenerating(true);
    try {
      // Ambil semua anggota kelas
      const { data: anggotaData, error: anggotaError } = await supabase
        .from('kelas_anggota')
        .select('santri_id')
        .eq('kelas_id', kelasId)
        .eq('status', 'Aktif');

      if (anggotaError) throw anggotaError;

      const anggotaIds = (anggotaData || []).map((row: any) => row.santri_id);

      // Generate rapot untuk setiap santri
      let successCount = 0;
      let errorCount = 0;

      for (const santriId of anggotaIds) {
        try {
          await AkademikRapotService.generateRapot({
            santri_id: santriId,
            kelas_id: kelasId,
            semester_id: selectedSemesterId,
          });
          successCount++;
        } catch (error: any) {
          console.error(`Error generating rapot for santri ${santriId}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Berhasil generate rapot untuk ${successCount} santri`);
      }
      if (errorCount > 0) {
        toast.warning(`Gagal generate rapot untuk ${errorCount} santri`);
      }

      await loadRapot();
    } catch (error: any) {
      toast.error(error.message || 'Gagal generate rapot');
    } finally {
      setGenerating(false);
    }
  };

  // Handle open dialog detail rapot
  const handleOpenRapotDetail = async (rapot: Rapot) => {
    setSelectedRapot(rapot);
    
    // Load nilai untuk santri ini
    try {
      const nilai = await AkademikNilaiService.listNilai(kelasId, selectedSemesterId, {
        santriId: rapot.santri_id,
      });
      setSelectedRapotNilai(nilai);
    } catch (error: any) {
      console.error('Error loading nilai:', error);
      setSelectedRapotNilai([]);
    }
    
    setRapotDialogOpen(true);
  };

  // Filter rapot berdasarkan search term
  const filteredRapot = useMemo(() => {
    if (!searchTerm) return rapotList;
    const term = searchTerm.toLowerCase();
    return rapotList.filter(
      (r) =>
        r.santri?.nama_lengkap.toLowerCase().includes(term) ||
        r.santri?.id_santri?.toLowerCase().includes(term)
    );
  }, [rapotList, searchTerm]);

  // Get status badge untuk kelulusan
  const getKelulusanBadge = (status: string) => {
    switch (status) {
      case 'Lulus':
        return <Badge className="bg-green-100 text-green-800">Lulus</Badge>;
      case 'Tidak Lulus':
        return <Badge className="bg-red-100 text-red-800">Tidak Lulus</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Belum Dinilai</Badge>;
    }
  };

  // Get predikat badge
  const getPredikatBadge = (predikat?: string | null) => {
    if (!predikat) return <span className="text-muted-foreground">-</span>;
    
    if (predikat.includes('Sangat Memuaskan')) {
      return <Badge className="bg-blue-100 text-blue-800">{predikat}</Badge>;
    } else if (predikat.includes('Memuaskan')) {
      return <Badge className="bg-green-100 text-green-800">{predikat}</Badge>;
    } else if (predikat.includes('Cukup')) {
      return <Badge className="bg-yellow-100 text-yellow-800">{predikat}</Badge>;
    } else {
      return <Badge className="bg-orange-100 text-orange-800">{predikat}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Rapot
          </CardTitle>
          <CardDescription>
            Lihat dan kelola rapot per santri per semester
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-md">
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
            <Button
              onClick={handleGenerateRapot}
              disabled={generating || !kelasId || !selectedSemesterId}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Generating...' : 'Generate Rapot'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabel Rapot */}
      {!selectedSemesterId ? (
        <div className="text-center py-8 text-muted-foreground">Pilih semester terlebih dahulu</div>
      ) : !kelasId ? (
        <div className="text-center py-8 text-muted-foreground">Pilih kelas terlebih dahulu</div>
      ) : loading ? (
        <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
      ) : filteredRapot.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Tidak ada rapot. Klik "Generate Rapot" untuk membuat rapot.
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Daftar Rapot</CardTitle>
            <CardDescription>
              Klik pada baris untuk melihat detail rapot
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
                    <TableHead className="text-center">Total Mapel</TableHead>
                    <TableHead className="text-center">Lulus</TableHead>
                    <TableHead className="text-center">Tidak Lulus</TableHead>
                    <TableHead className="text-center">Rata-rata Nilai</TableHead>
                    <TableHead className="text-center">Kehadiran</TableHead>
                    <TableHead className="text-center">Predikat</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRapot.map((rapot, index) => (
                    <TableRow key={rapot.id} className="cursor-pointer" onClick={() => handleOpenRapotDetail(rapot)}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{rapot.santri?.nama_lengkap || '-'}</TableCell>
                      <TableCell>{rapot.santri?.id_santri || '-'}</TableCell>
                      <TableCell className="text-center">{rapot.total_mapel}</TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-green-100 text-green-800">{rapot.total_mapel_lulus}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-red-100 text-red-800">{rapot.total_mapel_tidak_lulus}</Badge>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {rapot.rata_rata_nilai > 0 ? rapot.rata_rata_nilai.toFixed(2) : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="space-y-1">
                          <Badge className={rapot.persentase_kehadiran_keseluruhan >= 60 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {rapot.persentase_kehadiran_keseluruhan.toFixed(2)}%
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            {rapot.total_hadir_keseluruhan}/{rapot.total_pertemuan_keseluruhan}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {getPredikatBadge(rapot.predikat)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getKelulusanBadge(rapot.status_kelulusan_semester)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenRapotDetail(rapot);
                          }}
                        >
                          Lihat Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog Detail Rapot */}
      <Dialog open={rapotDialogOpen} onOpenChange={setRapotDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Rapot</DialogTitle>
            <DialogDescription>
              Rapot untuk {selectedRapot?.santri?.nama_lengkap} - Semester {selectedRapot?.semester?.nama}
            </DialogDescription>
          </DialogHeader>

          {selectedRapot && (
            <div className="space-y-6">
              {/* Informasi Santri */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Informasi Santri</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Nama</Label>
                      <div className="font-medium">{selectedRapot.santri?.nama_lengkap || '-'}</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">ID Santri</Label>
                      <div className="font-medium">{selectedRapot.santri?.id_santri || '-'}</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Kelas</Label>
                      <div className="font-medium">{selectedRapot.kelas?.nama_kelas || '-'}</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Program</Label>
                      <div className="font-medium">{selectedRapot.kelas?.program || '-'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Statistik Keseluruhan */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Statistik Keseluruhan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Total Mapel</Label>
                      <div className="text-2xl font-bold">{selectedRapot.total_mapel}</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Lulus</Label>
                      <div className="text-2xl font-bold text-green-600">{selectedRapot.total_mapel_lulus}</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Tidak Lulus</Label>
                      <div className="text-2xl font-bold text-red-600">{selectedRapot.total_mapel_tidak_lulus}</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Rata-rata Nilai</Label>
                      <div className="text-2xl font-bold">{selectedRapot.rata_rata_nilai.toFixed(2)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Kehadiran */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Kehadiran</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Total Pertemuan</Label>
                      <div className="font-medium">{selectedRapot.total_pertemuan_keseluruhan}</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Total Hadir</Label>
                      <div className="font-medium">{selectedRapot.total_hadir_keseluruhan}</div>
                    </div>
                      <div>
                        <Label className="text-muted-foreground">Persentase Kehadiran</Label>
                        <div className="font-medium space-y-2">
                          <div>
                            {selectedRapot.persentase_kehadiran_keseluruhan >= 60 ? (
                              <Badge className="bg-green-100 text-green-800">
                                {selectedRapot.persentase_kehadiran_keseluruhan.toFixed(2)}%
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800">
                                {selectedRapot.persentase_kehadiran_keseluruhan.toFixed(2)}%
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detail Nilai per Mapel */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Detail Nilai per Mata Pelajaran</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedRapotNilai.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">Belum ada nilai</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mata Pelajaran</TableHead>
                          <TableHead className="text-center">Nilai Angka</TableHead>
                          <TableHead className="text-center">Nilai Huruf</TableHead>
                          <TableHead className="text-center">Kehadiran</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedRapotNilai.map((nilai) => (
                          <TableRow key={nilai.id}>
                            <TableCell>
                              {nilai.agenda?.nama_agenda || '-'}
                              {nilai.agenda?.mapel_nama && (
                                <div className="text-xs text-muted-foreground">
                                  {nilai.agenda.mapel_nama}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-center font-medium">
                              {nilai.nilai_angka !== null ? nilai.nilai_angka : '-'}
                            </TableCell>
                            <TableCell className="text-center">{nilai.nilai_huruf || '-'}</TableCell>
                            <TableCell className="text-center">
                              <div className="space-y-1">
                                <Badge className={nilai.persentase_kehadiran >= 60 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                  {nilai.persentase_kehadiran.toFixed(2)}%
                                </Badge>
                                <div className="text-xs text-muted-foreground">
                                  {nilai.total_hadir}/{nilai.total_pertemuan}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {getKelulusanBadge(nilai.status_kelulusan)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Status Kelulusan */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Status Kelulusan Semester</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground">Status</Label>
                      <div className="mt-2">
                        {getKelulusanBadge(selectedRapot.status_kelulusan_semester)}
                      </div>
                    </div>
                    {selectedRapot.predikat && (
                      <div>
                        <Label className="text-muted-foreground">Predikat</Label>
                        <div className="mt-2">
                          {getPredikatBadge(selectedRapot.predikat)}
                        </div>
                      </div>
                    )}
                    {selectedRapot.alasan_tidak_lulus_semester && (
                      <div>
                        <Label className="text-muted-foreground">Alasan Tidak Lulus</Label>
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm">
                          {selectedRapot.alasan_tidak_lulus_semester}
                        </div>
                      </div>
                    )}
                    {selectedRapot.catatan_wali_kelas && (
                      <div>
                        <Label className="text-muted-foreground">Catatan Wali Kelas</Label>
                        <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm whitespace-pre-wrap">
                          {selectedRapot.catatan_wali_kelas}
                        </div>
                      </div>
                    )}
                    {selectedRapot.catatan_kepala_sekolah && (
                      <div>
                        <Label className="text-muted-foreground">Catatan Kepala Sekolah</Label>
                        <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm whitespace-pre-wrap">
                          {selectedRapot.catatan_kepala_sekolah}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRapotDialogOpen(false)}>
              Tutup
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" />
              Cetak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RapotPage;

