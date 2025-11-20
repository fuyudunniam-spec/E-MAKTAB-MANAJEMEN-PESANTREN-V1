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
  BarChart3
} from 'lucide-react';
import { SetoranHarianService } from '@/services/setoranHarian.service';
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

  useEffect(() => {
    loadProgress();
  }, [santriId, selectedProgram]);

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
    </div>
  );
};

export default SantriProgressTracking;

