import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AkademikKelasService, KelasMaster } from '@/modules/akademik/services/akademikKelas.service';
import { AkademikAgendaService, AkademikAgenda } from '@/modules/akademik/services/akademikAgenda.service';
import { AkademikPloatingService, SantriLite } from '@/modules/akademik/services/akademikPloating.service';
import { AbsensiMadin, AbsensiMadinService } from '@/modules/akademik/services/absensiMadin.service';
import { CalendarDays, CheckCircle2, Loader2, UserCheck, UserMinus, Users } from 'lucide-react';
import { toast } from 'sonner';

interface RekapSantri {
  santri_id: string;
  nama: string;
  hadir: number;
  izin: number;
  sakit: number;
  dispen: number;
  alfa: number;
  totalPertemuan: number;
  persentase: number;
}

interface AgendaStat {
  id: string | null;
  nama: string;
  pengajar?: string | null;
  mapel?: string | null;
  kitab?: string | null;
  hari?: string | null;
  jam_mulai?: string | null;
  jam_selesai?: string | null;
  frekuensi?: string | null;
  totalPertemuan: number;
  totalHadir: number;
  totalCatatan: number;
}

interface SummaryStat {
  totalSantri: number;
  totalAgenda: number;
  totalPertemuan: number;
  rataKehadiran: number;
  totalHadir: number;
  totalAlfa: number;
}

interface KelasDetailDialogProps {
  open: boolean;
  kelasId?: string;
  kelasName?: string;
  onClose: () => void;
}

const statusMap = ['Hadir', 'Izin', 'Sakit', 'Dispen', 'Alfa'] as const;

const KelasDetailDialog: React.FC<KelasDetailDialogProps> = ({ open, kelasId, kelasName, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [kelas, setKelas] = useState<KelasMaster | null>(null);
  const [agenda, setAgenda] = useState<AkademikAgenda[]>([]);
  const [anggota, setAnggota] = useState<SantriLite[]>([]);
  const [absensi, setAbsensi] = useState<AbsensiMadin[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    const loadDetail = async () => {
      if (!open || !kelasId) {
        setKelas(null);
        setAgenda([]);
        setAnggota([]);
        setAbsensi([]);
        return;
      }
      setLoading(true);
      try {
        const [year, month] = selectedMonth.split('-').map(Number);
        const startDate = selectedMonth ? `${selectedMonth}-01` : undefined;
        const endDate =
          selectedMonth && year && month
            ? new Date(year, month, 0).toISOString().split('T')[0]
            : undefined;
        const [kelasDetail, agendaList, anggotaList, absensiList] = await Promise.all([
          AkademikKelasService.getKelasById(kelasId),
          AkademikAgendaService.listAgendaByKelas(kelasId, { aktifOnly: false }),
          AkademikPloatingService.listAnggota(kelasId),
          AbsensiMadinService.listAbsensiByKelas(kelasId, { startDate, endDate }),
        ]);
        setKelas(kelasDetail);
        setAgenda(agendaList);
        setAnggota(anggotaList);
        setAbsensi(absensiList);
      } catch (error: any) {
        toast.error(error.message || 'Gagal memuat detail kelas');
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [open, kelasId, selectedMonth]);

  const { rekapSantri, agendaStats, summary, riwayatPertemuan } = useMemo(() => {
    if (!anggota.length) {
      return {
        rekapSantri: [] as RekapSantri[],
        agendaStats: [] as AgendaStat[],
        riwayatPertemuan: [] as Array<{
          key: string;
          tanggal: string;
          agenda: string;
          pengajar?: string | null;
          mapel?: string | null;
          kitab?: string | null;
          materi?: string | null;
          counts: Record<(typeof statusMap)[number], number>;
        }>,
        summary: {
          totalSantri: 0,
          totalAgenda: agenda.length,
          totalPertemuan: 0,
          rataKehadiran: 0,
          totalHadir: 0,
          totalAlfa: 0,
        } as SummaryStat,
      };
    }

    const santriMap = new Map<string, RekapSantri>();
    anggota.forEach(s => {
      santriMap.set(s.id, {
        santri_id: s.id,
        nama: s.nama_lengkap,
        hadir: 0,
        izin: 0,
        sakit: 0,
        dispen: 0,
        alfa: 0,
        totalPertemuan: 0,
        persentase: 0,
      });
    });

    const agendaMap = new Map<string, AgendaStat>();
    agenda.forEach(a => {
      agendaMap.set(a.id, {
        id: a.id,
        nama: a.nama_agenda,
        pengajar: a.pengajar_nama || a.pengajar?.nama_lengkap || null,
        mapel: a.mapel_nama || a.mapel?.nama_mapel || null,
        kitab: a.kitab || null,
        hari: a.hari || null,
        jam_mulai: a.jam_mulai || null,
        jam_selesai: a.jam_selesai || null,
        frekuensi: a.frekuensi || null,
        totalPertemuan: 0,
        totalHadir: 0,
        totalCatatan: 0,
      });
    });

    const totalPertemuanSet = new Set<string>();
    let totalHadir = 0;
    let totalAlfa = 0;
    const pertemuanMap = new Map<
      string,
      {
        key: string;
        tanggal: string;
        agenda: string;
        pengajar?: string | null;
        mapel?: string | null;
        kitab?: string | null;
        materi?: string | null;
        counts: Record<(typeof statusMap)[number], number>;
      }
    >();

    absensi.forEach(row => {
      const santriSummary = santriMap.get(row.santri_id);
      if (santriSummary) {
        santriSummary.totalPertemuan += 1;
        switch (row.status) {
          case 'Hadir':
            santriSummary.hadir += 1;
            totalHadir += 1;
            break;
          case 'Izin':
            santriSummary.izin += 1;
            break;
          case 'Sakit':
            santriSummary.sakit += 1;
            break;
          case 'Dispen':
            santriSummary.dispen += 1;
            break;
          case 'Alfa':
            santriSummary.alfa += 1;
            totalAlfa += 1;
            break;
        }
      }

      const agendaKey = row.agenda_id || 'manual';
      const pertemuanKey = `${agendaKey}_${row.tanggal}`;
      totalPertemuanSet.add(pertemuanKey);

      const agendaSummary =
        agendaMap.get(row.agenda_id || '') ||
        agendaMap.get(agendaKey) ||
        (() => {
          const temp: AgendaStat = {
            id: null,
            nama: row.agenda?.nama_agenda || 'Input Manual',
            pengajar: row.agenda?.pengajar_nama || null,
            mapel: row.agenda?.mapel_nama || null,
            kitab: row.agenda?.kitab || null,
            hari: row.agenda?.hari || null,
            jam_mulai: row.agenda?.jam_mulai || null,
            jam_selesai: row.agenda?.jam_selesai || null,
            frekuensi: row.agenda?.frekuensi || null,
            totalPertemuan: 0,
            totalHadir: 0,
            totalCatatan: 0,
          };
          agendaMap.set(agendaKey, temp);
          return temp;
        })();

      if (agendaSummary) {
        agendaSummary.totalPertemuan += 1 / (anggota.length || 1);
        if (row.status === 'Hadir') {
          agendaSummary.totalHadir += 1;
        }
        if (row.materi) {
          agendaSummary.totalCatatan += 1;
        }
      }

      const historyEntry =
        pertemuanMap.get(pertemuanKey) ||
        (() => {
          const temp = {
            key: pertemuanKey,
            tanggal: row.tanggal,
            agenda: row.agenda?.nama_agenda || 'Input Manual',
            pengajar: row.agenda?.pengajar_nama || row.agenda?.pengajar?.nama_lengkap || null,
            mapel: row.agenda?.mapel_nama || row.agenda?.mapel?.nama_mapel || null,
            kitab: row.agenda?.kitab || null,
            materi: row.materi || null,
            counts: {
              Hadir: 0,
              Izin: 0,
              Sakit: 0,
              Dispen: 0,
              Alfa: 0,
            } as Record<(typeof statusMap)[number], number>,
          };
          pertemuanMap.set(pertemuanKey, temp);
          return temp;
        })();

      historyEntry.counts[row.status as (typeof statusMap)[number]] += 1;
      if (!historyEntry.materi && row.materi) {
        historyEntry.materi = row.materi;
      }
    });

    const rekapSantriArray = Array.from(santriMap.values()).map(item => ({
      ...item,
      persentase: item.totalPertemuan
        ? Math.round((item.hadir / item.totalPertemuan) * 1000) / 10
        : 0,
    }));

    const agendaStatsArray = Array.from(agendaMap.values()).map(item => {
      const totalPertemuanReal = Math.round(item.totalPertemuan);
      return {
        ...item,
        totalPertemuan: totalPertemuanReal,
      };
    });

    const riwayatPertemuanArray = Array.from(pertemuanMap.values()).sort(
      (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime(),
    );

    const totalPertemuan = totalPertemuanSet.size;
    const totalKehadiranPossible = rekapSantriArray.reduce(
      (acc, curr) => acc + curr.totalPertemuan,
      0,
    );
    const rataKehadiran =
      totalKehadiranPossible > 0 ? Math.round((totalHadir / totalKehadiranPossible) * 1000) / 10 : 0;

    return {
      rekapSantri: rekapSantriArray,
      agendaStats: agendaStatsArray,
      summary: {
        totalSantri: anggota.length,
        totalAgenda: agenda.length,
        totalPertemuan,
        rataKehadiran,
        totalHadir,
        totalAlfa,
      } as SummaryStat,
      riwayatPertemuan: riwayatPertemuanArray,
    };
  }, [anggota, absensi, agenda]);

  const formatJam = (value?: string | null) => {
    if (!value) return '';
    return value.slice(0, 5);
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Detail Kelas</DialogTitle>
          <DialogDescription>
            {kelasName || kelas?.nama_kelas || 'Informasi kelas dan rekap kehadiran'}
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex h-64 items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            Memuat data kelas...
          </div>
        ) : (
          <Tabs defaultValue="ringkasan" className="flex flex-col h-full">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="ringkasan">Ringkasan</TabsTrigger>
              <TabsTrigger value="agenda">Agenda</TabsTrigger>
              <TabsTrigger value="peserta">Peserta</TabsTrigger>
              <TabsTrigger value="riwayat">Riwayat</TabsTrigger>
            </TabsList>

            <TabsContent value="ringkasan" className="flex-1 overflow-hidden">
              <ScrollArea className="h-[420px] pr-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Info Kelas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Program</span>
                        <strong>{kelas?.program || '-'}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Tingkat</span>
                        <strong>{kelas?.tingkat || '-'}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Rombel</span>
                        <strong>{kelas?.rombel || '-'}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Tahun Ajaran</span>
                        <strong>{kelas?.tahun_ajaran || '-'}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Semester</span>
                        <strong>{kelas?.semester || '-'}</strong>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Statistik Umum</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          Total Santri
                        </div>
                        <strong>{summary.totalSantri}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CalendarDays className="w-4 h-4" />
                          Agenda Aktif
                        </div>
                        <strong>{summary.totalAgenda}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CheckCircle2 className="w-4 h-4" />
                          Pertemuan Tercatat
                        </div>
                        <strong>{summary.totalPertemuan}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <UserCheck className="w-4 h-4" />
                          Rata-rata Hadir
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                          {summary.rataKehadiran.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <UserMinus className="w-4 h-4" />
                          Total Alfa
                        </div>
                        <strong>{summary.totalAlfa}</strong>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="agenda" className="flex-1 overflow-hidden">
              <ScrollArea className="h-[420px] pr-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agenda</TableHead>
                      <TableHead>Hari / Jam</TableHead>
                      <TableHead>Pengajar</TableHead>
                      <TableHead>Mapel</TableHead>
                      <TableHead>Kitab</TableHead>
                      <TableHead className="text-right">Pertemuan</TableHead>
                      <TableHead className="text-right">Hadir</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agendaStats.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          Belum ada data agenda atau presensi
                        </TableCell>
                      </TableRow>
                    ) : (
                      agendaStats.map(row => (
                        <TableRow key={row.id || row.nama}>
                          <TableCell>
                            <div className="font-semibold">{row.nama}</div>
                            {row.totalCatatan > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {row.totalCatatan} catatan materi
                              </p>
                            )}
                            {row.frekuensi && (
                              <p className="text-xs text-muted-foreground capitalize">
                                Frekuensi: {row.frekuensi.toLowerCase()}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            {row.hari ? (
                              <div>
                                <div className="font-medium">{row.hari}</div>
                                {(row.jam_mulai || row.jam_selesai) && (
                                  <p className="text-xs text-muted-foreground">
                                    {formatJam(row.jam_mulai)}
                                    {row.jam_selesai ? ` - ${formatJam(row.jam_selesai)}` : ''}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>{row.pengajar || '-'}</TableCell>
                          <TableCell>{row.mapel || '-'}</TableCell>
                          <TableCell>{row.kitab || '-'}</TableCell>
                          <TableCell className="text-right">{row.totalPertemuan}</TableCell>
                          <TableCell className="text-right">{row.totalHadir}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="peserta" className="flex-1 overflow-hidden">
              <ScrollArea className="h-[420px] pr-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>Nama Santri</TableHead>
                      {statusMap.map(key => (
                        <TableHead key={key}>{key}</TableHead>
                      ))}
                      <TableHead>Total</TableHead>
                      <TableHead>Kehadiran</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rekapSantri.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                          Belum ada data kehadiran
                        </TableCell>
                      </TableRow>
                    ) : (
                      rekapSantri.map((row, idx) => (
                        <TableRow key={row.santri_id}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>
                            <div className="font-medium">{row.nama}</div>
                          </TableCell>
                          <TableCell>{row.hadir}</TableCell>
                          <TableCell>{row.izin}</TableCell>
                          <TableCell>{row.sakit}</TableCell>
                          <TableCell>{row.dispen}</TableCell>
                          <TableCell>{row.alfa}</TableCell>
                          <TableCell>{row.totalPertemuan}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{row.persentase.toFixed(1)}%</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="riwayat" className="flex-1 overflow-hidden">
              <div className="flex items-end gap-4 pb-4">
                <div className="space-y-1">
                  <Label>Filter Bulan</Label>
                  <Input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-44"
                  />
                </div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    const now = new Date();
                    setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
                  }}
                >
                  Bulan Ini
                </Button>
              </div>
              <ScrollArea className="h-[360px] pr-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Agenda</TableHead>
                      <TableHead>Pengajar</TableHead>
                      <TableHead>Mapel</TableHead>
                      <TableHead>Kitab</TableHead>
                      <TableHead>Materi</TableHead>
                      {statusMap.map(status => (
                        <TableHead key={status} className="text-right">
                          {status}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {riwayatPertemuan.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7 + statusMap.length} className="text-center text-muted-foreground">
                          Belum ada riwayat absensi pada rentang ini
                        </TableCell>
                      </TableRow>
                    ) : (
                      riwayatPertemuan.map((row, idx) => (
                        <TableRow key={row.key}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>
                            {new Date(row.tanggal).toLocaleDateString('id-ID', {
                              weekday: 'short',
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </TableCell>
                          <TableCell>{row.agenda}</TableCell>
                          <TableCell>{row.pengajar || '-'}</TableCell>
                          <TableCell>{row.mapel || '-'}</TableCell>
                          <TableCell>{row.kitab || '-'}</TableCell>
                          <TableCell className="max-w-xs whitespace-pre-wrap text-sm">
                            {row.materi || '-'}
                          </TableCell>
                          {statusMap.map(status => (
                            <TableCell key={status} className="text-right">
                              {row.counts[status] || 0}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default KelasDetailDialog;


