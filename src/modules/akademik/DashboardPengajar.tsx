import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AkademikPengajarService, PengajarJadwalHariIni, PengajarStats, PengajarPertemuanMingguIni } from '@/services/akademikPengajar.service';
import { AkademikPertemuanService, PertemuanStatus } from '@/services/akademikPertemuan.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Calendar,
  Clock,
  BookOpen,
  Users,
  CheckCircle2,
  PlayCircle,
  Square,
  AlertCircle,
  Loader2,
  ArrowRight,
  FileText,
} from 'lucide-react';

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

const formatTime = (time?: string | null) => {
  if (!time) return '-';
  return time.substring(0, 5); // HH:mm
};

const DashboardPengajar: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pengajarId, setPengajarId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [jadwalHariIni, setJadwalHariIni] = useState<PengajarJadwalHariIni[]>([]);
  const [stats, setStats] = useState<PengajarStats>({
    total_pertemuan_hari_ini: 0,
    pertemuan_berjalan: 0,
    pertemuan_selesai: 0,
    pertemuan_terjadwal: 0,
    pertemuan_belum_presensi: 0,
    pertemuan_belum_jurnal: 0,
  });
  const [pertemuanMingguIni, setPertemuanMingguIni] = useState<PengajarPertemuanMingguIni[]>([]);
  
  // Dialog states
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [selectedPertemuan, setSelectedPertemuan] = useState<PengajarJadwalHariIni | null>(null);
  const [materi, setMateri] = useState('');
  const [catatan, setCatatan] = useState('');

  // Load pengajar_id dari user_id
  useEffect(() => {
    const loadPengajarId = async () => {
      if (!user?.id) return;
      
      try {
        const id = await AkademikPengajarService.getPengajarIdByUserId(user.id);
        setPengajarId(id);
      } catch (error: any) {
        console.error('Error loading pengajar ID:', error);
        toast.error('Gagal memuat data pengajar');
      }
    };

    loadPengajarId();
  }, [user]);

  // Load data dashboard
  const loadDashboard = useCallback(async () => {
    if (!pengajarId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [jadwal, statsData, pertemuanMinggu] = await Promise.all([
        AkademikPengajarService.getJadwalHariIni(pengajarId),
        AkademikPengajarService.getStatsHariIni(pengajarId),
        AkademikPengajarService.getPertemuanMingguIni(pengajarId),
      ]);

      setJadwalHariIni(jadwal);
      setStats(statsData);
      setPertemuanMingguIni(pertemuanMinggu);
    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      toast.error(error.message || 'Gagal memuat dashboard pengajar');
    } finally {
      setLoading(false);
    }
  }, [pengajarId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleStartPertemuan = async () => {
    if (!selectedPertemuan) return;

    try {
      await AkademikPertemuanService.updatePertemuan(selectedPertemuan.pertemuan_id, {
        status: 'Berjalan',
        materi: materi || null,
        catatan: catatan || null,
      });

      toast.success('Pertemuan dimulai');
      setStartDialogOpen(false);
      setMateri('');
      setCatatan('');
      setSelectedPertemuan(null);
      loadDashboard();
    } catch (error: any) {
      toast.error(error.message || 'Gagal memulai pertemuan');
    }
  };

  const handleEndPertemuan = async () => {
    if (!selectedPertemuan) return;

    try {
      await AkademikPertemuanService.updatePertemuan(selectedPertemuan.pertemuan_id, {
        status: 'Selesai',
        catatan: catatan || null,
      });

      toast.success('Pertemuan selesai');
      setEndDialogOpen(false);
      setCatatan('');
      setSelectedPertemuan(null);
      loadDashboard();
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengakhiri pertemuan');
    }
  };

  const handleGoToPresensi = (pertemuan: PengajarJadwalHariIni) => {
    navigate(`/akademik/presensi?pertemuan_id=${pertemuan.pertemuan_id}&kelas_id=${pertemuan.kelas_id}`);
  };

  const handleGoToJurnal = (pertemuan: PengajarJadwalHariIni) => {
    navigate(`/akademik/jurnal?pertemuan_id=${pertemuan.pertemuan_id}`);
  };

  const tanggalHariIni = useMemo(() => {
    return new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  // Jika belum ada pengajar_id, tampilkan pesan
  if (!pengajarId && !loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 flex flex-col items-center justify-center gap-4">
            <AlertCircle className="w-12 h-12 text-orange-500" />
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Akun Belum Terhubung dengan Data Pengajar</h2>
              <p className="text-muted-foreground mb-4">
                Hubungi administrator untuk menghubungkan akun Anda dengan data pengajar.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Pengajar</h1>
          <p className="text-muted-foreground">Jadwal dan aktivitas mengajar hari ini - {tanggalHariIni}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/akademik/jurnal')}>
            <FileText className="w-4 h-4 mr-2" />
            Jurnal Pertemuan
          </Button>
          <Button variant="outline" onClick={() => navigate('/akademik/presensi')}>
            <Users className="w-4 h-4 mr-2" />
            Presensi Kelas
          </Button>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-10 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Memuat dashboard...
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pertemuan</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_pertemuan_hari_ini}</div>
                <p className="text-xs text-muted-foreground">Hari ini</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sedang Berjalan</CardTitle>
                <PlayCircle className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{stats.pertemuan_berjalan}</div>
                <p className="text-xs text-muted-foreground">Perlu diselesaikan</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Belum Presensi</CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.pertemuan_belum_presensi}</div>
                <p className="text-xs text-muted-foreground">Perlu input presensi</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Selesai</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{stats.pertemuan_selesai}</div>
                <p className="text-xs text-muted-foreground">Sudah selesai hari ini</p>
              </CardContent>
            </Card>
          </div>

          {/* Jadwal Hari Ini */}
          <Card>
            <CardHeader>
              <CardTitle>Jadwal Hari Ini</CardTitle>
              <CardDescription>Daftar pertemuan yang dijadwalkan untuk hari ini</CardDescription>
            </CardHeader>
            <CardContent>
              {jadwalHariIni.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Tidak ada jadwal pertemuan untuk hari ini</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Agenda</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Presensi</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jadwalHariIni.map((jadwal) => (
                      <TableRow key={jadwal.pertemuan_id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">
                              {formatTime(jadwal.jam_mulai)} - {formatTime(jadwal.jam_selesai)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{jadwal.nama_agenda}</div>
                          {jadwal.mapel_nama && (
                            <p className="text-xs text-muted-foreground">{jadwal.mapel_nama}</p>
                          )}
                          {jadwal.kitab && (
                            <p className="text-xs text-muted-foreground">Kitab: {jadwal.kitab}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{jadwal.nama_kelas}</div>
                          {jadwal.rombel && (
                            <p className="text-xs text-muted-foreground">Rombel {jadwal.rombel}</p>
                          )}
                          <p className="text-xs text-muted-foreground">{jadwal.program}</p>
                        </TableCell>
                        <TableCell>{formatStatusBadge(jadwal.status)}</TableCell>
                        <TableCell>
                          {jadwal.sudah_ada_presensi ? (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Sudah
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-orange-50 text-orange-700">
                              Belum
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {jadwal.status === 'Terjadwal' && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedPertemuan(jadwal);
                                  setStartDialogOpen(true);
                                }}
                              >
                                <PlayCircle className="w-4 h-4 mr-1" />
                                Mulai
                              </Button>
                            )}
                            {jadwal.status === 'Berjalan' && (
                              <>
                                {!jadwal.sudah_ada_presensi && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleGoToPresensi(jadwal)}
                                  >
                                    <Users className="w-4 h-4 mr-1" />
                                    Presensi
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPertemuan(jadwal);
                                    setEndDialogOpen(true);
                                  }}
                                >
                                  <Square className="w-4 h-4 mr-1" />
                                  Selesai
                                </Button>
                              </>
                            )}
                            {jadwal.status === 'Selesai' && !jadwal.sudah_ada_presensi && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleGoToPresensi(jadwal)}
                              >
                                <Users className="w-4 h-4 mr-1" />
                                Input Presensi
                              </Button>
                            )}
                            {jadwal.status !== 'Terjadwal' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleGoToJurnal(jadwal)}
                              >
                                <FileText className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Pertemuan Minggu Ini yang Perlu Action */}
          {pertemuanMingguIni.filter(p => p.perlu_action).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pertemuan Perlu Tindakan</CardTitle>
                <CardDescription>Pertemuan minggu ini yang masih perlu diselesaikan</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Agenda</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tindakan</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pertemuanMingguIni
                      .filter(p => p.perlu_action)
                      .slice(0, 5)
                      .map((item) => {
                        const pertemuan = item.pertemuan;
                        const agenda = pertemuan.agenda;
                        const kelas = pertemuan.kelas;

                        return (
                          <TableRow key={pertemuan.id}>
                            <TableCell>
                              {new Date(pertemuan.tanggal).toLocaleDateString('id-ID', {
                                weekday: 'short',
                                day: '2-digit',
                                month: 'short',
                              })}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{agenda?.nama_agenda || '-'}</div>
                              {agenda?.jam_mulai && (
                                <p className="text-xs text-muted-foreground">
                                  {formatTime(agenda.jam_mulai)} - {formatTime(agenda.jam_selesai)}
                                </p>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{kelas?.nama_kelas || '-'}</div>
                              <p className="text-xs text-muted-foreground">{kelas?.program || '-'}</p>
                            </TableCell>
                            <TableCell>{formatStatusBadge(pertemuan.status)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-orange-50 text-orange-700">
                                {item.action_type === 'start' && 'Mulai Pertemuan'}
                                {item.action_type === 'end' && 'Selesaikan Pertemuan'}
                                {item.action_type === 'presensi' && 'Input Presensi'}
                                {item.action_type === 'jurnal' && 'Update Jurnal'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (item.action_type === 'start') {
                                    navigate(`/akademik/jurnal?pertemuan_id=${pertemuan.id}`);
                                  } else if (item.action_type === 'presensi') {
                                    navigate(`/akademik/presensi?pertemuan_id=${pertemuan.id}&kelas_id=${pertemuan.kelas_id}`);
                                  } else {
                                    navigate(`/akademik/jurnal?pertemuan_id=${pertemuan.id}`);
                                  }
                                }}
                              >
                                <ArrowRight className="w-4 h-4 mr-1" />
                                Lanjutkan
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Dialog Start Pertemuan */}
      <Dialog open={startDialogOpen} onOpenChange={setStartDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mulai Pertemuan</DialogTitle>
            <DialogDescription>
              Mulai pertemuan untuk {selectedPertemuan?.nama_agenda} - {selectedPertemuan?.nama_kelas}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Materi yang Akan Diajarkan (Opsional)</Label>
              <Textarea
                placeholder="Contoh: Bab 1 - Pengenalan Tajwid"
                value={materi}
                onChange={(e) => setMateri(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Catatan (Opsional)</Label>
              <Textarea
                placeholder="Catatan tambahan..."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStartDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleStartPertemuan}>
              <PlayCircle className="w-4 h-4 mr-2" />
              Mulai Pertemuan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog End Pertemuan */}
      <Dialog open={endDialogOpen} onOpenChange={setEndDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selesaikan Pertemuan</DialogTitle>
            <DialogDescription>
              Selesaikan pertemuan untuk {selectedPertemuan?.nama_agenda} - {selectedPertemuan?.nama_kelas}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Catatan Akhir (Opsional)</Label>
              <Textarea
                placeholder="Catatan tentang pertemuan ini..."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                rows={3}
              />
            </div>
            {!selectedPertemuan?.sudah_ada_presensi && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  Presensi belum diinput. Pastikan untuk menginput presensi setelah menyelesaikan pertemuan.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEndDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleEndPertemuan}>
              <Square className="w-4 h-4 mr-2" />
              Selesaikan Pertemuan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardPengajar;



