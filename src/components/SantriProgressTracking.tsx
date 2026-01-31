import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  BookOpen, 
  TrendingUp, 
  Award, 
  Flame, 
  Activity,
  Calendar,
  Target,
  BarChart3,
  GraduationCap
} from 'lucide-react';
import { SetoranHarianService } from '@/services/setoranHarian.service';
import { AkademikNilaiService, Nilai } from '@/services/akademikNilai.service';
import { AkademikKelasService } from '@/services/akademikKelas.service';
import { AkademikAgendaService } from '@/services/akademikAgenda.service';
import { AkademikSemesterService } from '@/services/akademikSemester.service';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ProgressProgramOption {
  value: 'TPQ' | 'Tahfid' | 'Tahsin';
  label: string;
}

interface SantriProgressTrackingProps {
  santriId: string;
  programOptions?: ProgressProgramOption[];
}

const SantriProgressTracking: React.FC<SantriProgressTrackingProps> = ({ santriId, programOptions }) => {
  const [loading, setLoading] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<'TPQ' | 'Tahfid' | 'Tahsin'>(programOptions?.[0]?.value ?? 'TPQ');
  const [progressData, setProgressData] = useState<{
    setoran_terakhir?: {
      tanggal: string;
      detail: string;
      nilai?: string;
      jenis_setoran?: 'Menambah' | 'Murajaah';
    } | null;
    total_setoran: number;
    last_30_days: number;
    menambah_30_days: number;
    murajaah_30_days: number;
    streak_harian: number;
    avg_kelancaran?: string;
    avg_tajwid?: string;
  } | null>(null);
  
  // State untuk nilai akademik Madin
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [kelasMadin, setKelasMadin] = useState<any | null>(null);
  const [jadwalKelas, setJadwalKelas] = useState<any[]>([]);
  const [nilaiPublished, setNilaiPublished] = useState<Nilai[]>([]);
  const [pertemuanList, setPertemuanList] = useState<any[]>([]);
  const [loadingAkademik, setLoadingAkademik] = useState(false);

  const loadProgress = async () => {
    if (!santriId) return;
    if (!selectedProgram) return;
    
    try {
      setLoading(true);
      const data = await SetoranHarianService.getProgressSantri(santriId, selectedProgram);
      setProgressData(data);
    } catch (e: any) {
      toast.error(e.message || 'Gagal memuat progress');
    } finally {
      setLoading(false);
    }
  };

  // Load semester dan set default
  const loadSemesters = async () => {
    try {
      const list = await AkademikSemesterService.listSemester();
      setSemesters(list);
      const aktif = list.find(s => s.is_aktif);
      if (aktif) {
        setSelectedSemesterId(aktif.id);
      } else if (list.length > 0) {
        setSelectedSemesterId(list[0].id);
      }
    } catch (e: any) {
      console.error('Error loading semesters:', e);
    }
  };

  // Load kelas Madin untuk santri pada semester terpilih
  const loadKelasMadin = async () => {
    if (!santriId || !selectedSemesterId) {
      setKelasMadin(null);
      setJadwalKelas([]);
      setNilaiPublished([]);
      return;
    }

    try {
      setLoadingAkademik(true);
      
      // Ambil kelas Madin dari enrollment
      const { data: enrollmentList, error: enrollmentError } = await supabase
        .from('kelas_anggota')
        .select(`
          kelas_id,
          kelas:kelas_id(
            id,
            nama_kelas,
            program,
            semester_id
          )
        `)
        .eq('santri_id', santriId)
        .eq('status', 'Aktif');

      if (enrollmentError) {
        throw enrollmentError;
      }

      // Cari kelas yang sesuai dengan semester dan program Madin
      const enrollmentData = (enrollmentList || []).find((enrollment: any) => {
        const kelas = enrollment.kelas;
        if (!kelas) return false;
        // Handle jika kelas adalah array (tidak seharusnya, tapi untuk safety)
        const kelasObj = Array.isArray(kelas) ? kelas[0] : kelas;
        return kelasObj && kelasObj.semester_id === selectedSemesterId && kelasObj.program === 'Madin';
      });

      if (enrollmentData && enrollmentData.kelas) {
        // Handle jika kelas adalah array (tidak seharusnya, tapi untuk safety)
        const kelas = Array.isArray(enrollmentData.kelas) ? enrollmentData.kelas[0] : enrollmentData.kelas;
        
        if (kelas && kelas.id) {
          setKelasMadin(kelas);

          // Load jadwal untuk kelas ini
          const agendas = await AkademikAgendaService.listAgenda({
            kelasId: kelas.id,
            semesterId: selectedSemesterId,
            aktifOnly: false,
          });
          setJadwalKelas(agendas);

          // Load pertemuan untuk mendapatkan tanggal & waktu
          const { AkademikPertemuanService } = await import('@/services/akademikPertemuan.service');
          const pertemuan = await AkademikPertemuanService.listPertemuan({
            kelasId: kelas.id,
          });
          setPertemuanList(pertemuan);

          // Load nilai published untuk santri ini pada kelas+semester
          try {
            const nilai = await AkademikNilaiService.listNilaiPublished(santriId, selectedSemesterId);
            // Filter hanya nilai untuk kelas ini
            const nilaiKelas = nilai.filter(n => n.kelas_id === kelas.id);
            setNilaiPublished(nilaiKelas);
          } catch (nilaiError: any) {
            // Jika error karena status_nilai tidak ada, set empty array
            console.warn('Error loading published nilai (mungkin kolom status_nilai belum ada):', nilaiError);
            setNilaiPublished([]);
          }
        } else {
          setKelasMadin(null);
          setJadwalKelas([]);
          setNilaiPublished([]);
          setPertemuanList([]);
        }
      } else {
        setKelasMadin(null);
        setJadwalKelas([]);
        setNilaiPublished([]);
        setPertemuanList([]);
      }
    } catch (e: any) {
      console.error('Error loading kelas Madin:', e);
      setKelasMadin(null);
      setJadwalKelas([]);
      setNilaiPublished([]);
      setPertemuanList([]);
    } finally {
      setLoadingAkademik(false);
    }
  };

  useEffect(() => {
    loadProgress();
    loadSemesters();
  }, [santriId]);

  useEffect(() => {
    loadKelasMadin();
  }, [santriId, selectedSemesterId]);

  useEffect(() => {
    if (programOptions && programOptions.length > 0) {
      setSelectedProgram(programOptions[0].value);
    }
  }, [programOptions?.map(option => option.value).join(',')]);

  if (loading && !progressData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Progress Setoran</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
        </CardContent>
      </Card>
    );
  }

  if (!progressData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Progress Setoran</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Belum ada data setoran</div>
        </CardContent>
      </Card>
    );
  }

  const totalAktivitas = progressData.menambah_30_days + progressData.murajaah_30_days;
  const rasioMenambah = totalAktivitas > 0 ? Math.round((progressData.menambah_30_days / totalAktivitas) * 100) : 0;
  const rasioMurajaah = totalAktivitas > 0 ? Math.round((progressData.murajaah_30_days / totalAktivitas) * 100) : 0;

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


  return (
    <div className="space-y-6">
      {/* Program Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Progress Setoran</CardTitle>
          <CardDescription>Tracking perkembangan setoran santri</CardDescription>
        </CardHeader>
        <CardContent>
          {programOptions && programOptions.length > 0 ? (
            <div className="mb-4">
              <Label>Program</Label>
              <Select value={selectedProgram} onValueChange={(v: any) => setSelectedProgram(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih program" />
                </SelectTrigger>
                <SelectContent>
                  {programOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Progress setoran menampilkan ringkasan terbaru santri.
            </p>
          )}
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Setoran</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressData.total_setoran}</div>
            <p className="text-xs text-muted-foreground">Semua waktu</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">30 Hari Terakhir</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressData.last_30_days}</div>
            <p className="text-xs text-muted-foreground">Setoran aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Streak Harian</CardTitle>
            <Flame className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressData.streak_harian}</div>
            <p className="text-xs text-muted-foreground">Hari berturut-turut</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Nilai</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {progressData.avg_kelancaran && progressData.avg_tajwid
                ? `${progressData.avg_kelancaran}/${progressData.avg_tajwid}`
                : '-'}
            </div>
            <p className="text-xs text-muted-foreground">Kelancaran/Tajwid</p>
          </CardContent>
        </Card>
      </div>

      {/* Detail Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Setoran Terakhir */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Setoran Terakhir
            </CardTitle>
            <CardDescription>Detail setoran terakhir santri</CardDescription>
          </CardHeader>
          <CardContent>
            {progressData.setoran_terakhir ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tanggal:</span>
                  <span className="font-medium">
                    {new Date(progressData.setoran_terakhir.tanggal).toLocaleDateString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Detail:</span>
                  <span className="font-medium">{progressData.setoran_terakhir.detail}</span>
                </div>
                {progressData.setoran_terakhir.jenis_setoran && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Jenis:</span>
                    <Badge variant={progressData.setoran_terakhir.jenis_setoran === 'Menambah' ? 'default' : 'secondary'}>
                      {progressData.setoran_terakhir.jenis_setoran}
                    </Badge>
                  </div>
                )}
                {progressData.setoran_terakhir.nilai && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Nilai:</span>
                    <span className="font-medium">{progressData.setoran_terakhir.nilai}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Belum ada setoran
              </div>
            )}
          </CardContent>
        </Card>

        {/* Aktivitas 30 Hari */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Aktivitas 30 Hari Terakhir
            </CardTitle>
            <CardDescription>Rasio Menambah vs Murajaah</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Menambah</span>
                  <span className="text-sm font-bold text-green-600">
                    {progressData.menambah_30_days} ({rasioMenambah}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${rasioMenambah}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Murajaah</span>
                  <span className="text-sm font-bold text-blue-600">
                    {progressData.murajaah_30_days} ({rasioMurajaah}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${rasioMurajaah}%` }}
                  />
                </div>
              </div>
              {totalAktivitas === 0 && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  Belum ada aktivitas dalam 30 hari terakhir
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rata-rata Nilai */}
      {(progressData.avg_kelancaran || progressData.avg_tajwid) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Rata-rata Nilai (30 Hari Terakhir)
            </CardTitle>
            <CardDescription>Berdasarkan penilaian kelancaran dan tajwid</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <span className="text-sm font-medium">Rata-rata Kelancaran:</span>
                {getNilaiBadge(progressData.avg_kelancaran)}
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <span className="text-sm font-medium">Rata-rata Tajwid:</span>
                {getNilaiBadge(progressData.avg_tajwid)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nilai Akademik Madin */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Nilai Akademik Madin
              </CardTitle>
              <CardDescription>Nilai published per semester</CardDescription>
            </div>
            {semesters.length > 0 && (
              <Select
                value={selectedSemesterId || ''}
                onValueChange={setSelectedSemesterId}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Pilih semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nama} {s.tahun_ajaran?.nama ? `• ${s.tahun_ajaran.nama}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loadingAkademik ? (
            <div className="text-center py-8 text-muted-foreground">Memuat data akademik...</div>
          ) : !kelasMadin ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada kelas Madin untuk term ini. Kelas akan muncul otomatis setelah santri diplotting.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header Kelas */}
              <div className="p-4 border rounded-lg bg-gray-50">
                <div className="font-semibold text-lg">
                  Kelas Madin: {kelasMadin.nama_kelas} — {semesters.find(s => s.id === selectedSemesterId)?.nama || '-'}
                </div>
              </div>

              {/* Tabel Jadwal & Nilai */}
              {jadwalKelas.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  Belum ada jadwal untuk kelas ini
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Kelas</TableHead>
                        <TableHead>Mapel</TableHead>
                        <TableHead>Tanggal & Waktu Pertemuan</TableHead>
                        <TableHead>Pengajar</TableHead>
                        <TableHead className="text-center">Nilai</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jadwalKelas.map((jadwal) => {
                        const nilai = nilaiPublished.find(n => n.agenda_id === jadwal.id);
                        // Ambil pertemuan untuk jadwal ini (ambil yang terakhir untuk contoh)
                        const pertemuanJadwal = pertemuanList.filter(p => p.agenda_id === jadwal.id);
                        const pertemuanTerakhir = pertemuanJadwal.length > 0 
                          ? pertemuanJadwal.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())[0]
                          : null;
                        
                        return (
                          <TableRow key={jadwal.id}>
                            <TableCell className="font-medium">
                              {kelasMadin?.nama_kelas || '-'}
                            </TableCell>
                            <TableCell className="font-medium">
                              {jadwal.mapel_nama || jadwal.nama_agenda || '-'}
                            </TableCell>
                            <TableCell>
                              {pertemuanTerakhir ? (
                                <div>
                                  <div className="text-sm font-medium">
                                    {new Date(pertemuanTerakhir.tanggal).toLocaleDateString('id-ID', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </div>
                                  {jadwal.jam_mulai && jadwal.jam_selesai && (
                                    <div className="text-xs text-muted-foreground">
                                      {jadwal.jam_mulai.substring(0, 5)} - {jadwal.jam_selesai.substring(0, 5)}
                                    </div>
                                  )}
                                  {pertemuanJadwal.length > 1 && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      ({pertemuanJadwal.length} pertemuan)
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div>
                                  <div className="text-sm">{jadwal.hari || '-'}</div>
                                  {jadwal.jam_mulai && jadwal.jam_selesai && (
                                    <div className="text-xs text-muted-foreground">
                                      {jadwal.jam_mulai.substring(0, 5)} - {jadwal.jam_selesai.substring(0, 5)}
                                    </div>
                                  )}
                                  <div className="text-xs text-muted-foreground mt-1">
                                    Belum ada pertemuan
                                  </div>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {jadwal.pengajar_nama || '-'}
                            </TableCell>
                            <TableCell className="text-center">
                              {nilai ? (
                                <div>
                                  <div className="font-medium">{nilai.nilai_angka !== null ? nilai.nilai_angka : '-'}</div>
                                  {nilai.nilai_huruf && (
                                    <Badge variant="outline" className="mt-1">{nilai.nilai_huruf}</Badge>
                                  )}
                                </div>
                              ) : (
                                <Badge variant="outline" className="text-gray-500">Belum dipublish</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SantriProgressTracking;

