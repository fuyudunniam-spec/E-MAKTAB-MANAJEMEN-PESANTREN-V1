import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Plus, Download, Loader2, Calculator, FileText, ChevronDown, ChevronRight, X, Play, MoreVertical, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LayananSantriService, type PilarLayanan } from '@/modules/santri/shared/services/layananSantri.service';
import { MasterDataKeuanganService, type MasterPilarLayanan } from '@/modules/keuangan/services/masterDataKeuangan.service';
import { formatCurrency } from '@/utils/formatCurrency';
import { format, subMonths, startOfYear, endOfYear, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';

interface RealisasiLayananSantriTabProps {
  periode: string; // Format: "YYYY-MM"
  onPeriodeChange?: (periode: string) => void;
}

const RealisasiLayananSantriTab: React.FC<RealisasiLayananSantriTabProps> = ({
  periode,
  onPeriodeChange,
}) => {
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showRancanganDialog, setShowRancanganDialog] = useState(false);
  const [selectedPilar, setSelectedPilar] = useState<PilarLayanan | ''>('');
  const [nilaiPerSantri, setNilaiPerSantri] = useState('');
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingRancangan, setLoadingRancangan] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<'bulan_lalu' | '3_bulan' | '1_tahun' | 'custom'>('1_tahun');
  const [previewData, setPreviewData] = useState<{
    total: number;
    monthlyBreakdown: Array<{ month: string; amount: number; periode: string }>;
    daftarSantri?: Array<{
      santri_id: string;
      santri_nama: string;
      santri_nisn: string | null;
      total_nilai: number;
      jumlah_transaksi: number;
    }>;
  } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [generatingPeriode, setGeneratingPeriode] = useState<Map<string, PilarLayanan>>(new Map());
  const [periodikStatus, setPeriodikStatus] = useState<Map<string, Map<PilarLayanan, boolean>>>(new Map());
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<Map<string, Array<{
    periode: string;
    pilar: Record<string, number>; // Dynamic pilar columns
    total: number;
    // Backward compatibility
    pendidikan_formal?: number;
    pendidikan_pesantren?: number;
    asrama_konsumsi?: number;
    bantuan_langsung?: number;
  }>>>(new Map());
  const [loadingBreakdown, setLoadingBreakdown] = useState<Set<string>>(new Set());
  const [pilarList, setPilarList] = useState<MasterPilarLayanan[]>([]);
  const [pilarMap, setPilarMap] = useState<Map<string, string>>(new Map()); // Map kode -> nama

  // Parse periode untuk input
  const [year, month] = periode.split('-').map(Number);
  const [inputYear, setInputYear] = useState(year);
  const [inputMonth, setInputMonth] = useState(month);

  // Fetch pilar layanan dari master_data_keuangan (dinamis)
  useEffect(() => {
    const loadPilarLayanan = async () => {
      try {
        const pilarData = await MasterDataKeuanganService.getPilarLayanan(true); // aktifOnly = true
        setPilarList(pilarData);
        const map = new Map<string, string>();
        pilarData.forEach(pilar => {
          map.set(pilar.kode, pilar.nama);
        });
        setPilarMap(map);
      } catch (error) {
        console.error('Error loading pilar layanan:', error);
        // Fallback ke hardcoded jika error
        const fallbackPilar: MasterPilarLayanan[] = [
          { id: '', kode: 'pendidikan_formal', nama: 'Pendidikan Formal', deskripsi: '', urutan: 1, warna_badge: '', aktif: true, created_at: '', updated_at: '' },
          { id: '', kode: 'pendidikan_pesantren', nama: 'Pendidikan Pesantren', deskripsi: '', urutan: 2, warna_badge: '', aktif: true, created_at: '', updated_at: '' },
          { id: '', kode: 'asrama_konsumsi', nama: 'Asrama & Konsumsi', deskripsi: '', urutan: 3, warna_badge: '', aktif: true, created_at: '', updated_at: '' },
          { id: '', kode: 'bantuan_langsung', nama: 'Bantuan Langsung', deskripsi: '', urutan: 4, warna_badge: '', aktif: true, created_at: '', updated_at: '' },
        ];
        setPilarList(fallbackPilar);
        const map = new Map<string, string>();
        fallbackPilar.forEach(pilar => {
          map.set(pilar.kode, pilar.nama);
        });
        setPilarMap(map);
      }
    };
    loadPilarLayanan();
  }, []);

  // Fetch realisasi data
  const {
    data: realisasiData,
    isLoading: loadingRealisasi,
    refetch: refetchRealisasi,
  } = useQuery({
    queryKey: ['realisasi-layanan-santri', periode],
    queryFn: () => LayananSantriService.getRealisasiLayananSantri(periode),
  });

  // Fetch rancangan data
  const {
    data: rancanganData,
    isLoading: loadingRancanganData,
  } = useQuery({
    queryKey: ['rancangan-layanan-santri', periode],
    queryFn: () => LayananSantriService.getRancanganAnggaran(periode),
  });

  // Create rancangan map
  const rancanganMap = new Map<PilarLayanan, number>();
  if (rancanganData) {
    rancanganData.forEach(r => {
      rancanganMap.set(r.pilar_layanan, r.nilai_per_santri);
    });
  }

  const handleGenerateFromRealisasi = async () => {
    if (!selectedPilar) {
      toast.error('Pilih pilar layanan terlebih dahulu');
      return;
    }

    setLoadingGenerate(true);
    try {
      await LayananSantriService.generateLayananPeriodikDariRealisasi({
        periode,
        pilar_layanan: selectedPilar,
        sumber: 'realisasi',
      });
      toast.success(`Layanan periodik untuk ${pilarMap.get(selectedPilar) || selectedPilar} berhasil di-generate`);
      setShowGenerateDialog(false);
      setSelectedPilar('');
      refetchRealisasi();
    } catch (error: any) {
      console.error('Error generating layanan periodik:', error);
      toast.error(error.message || 'Gagal generate layanan periodik');
    } finally {
      setLoadingGenerate(false);
    }
  };

  const handleCreateRancangan = async () => {
    if (!selectedPilar || !nilaiPerSantri) {
      toast.error('Lengkapi semua field');
      return;
    }

    const nilai = parseFloat(nilaiPerSantri);
    if (isNaN(nilai) || nilai < 0) {
      toast.error('Nilai harus berupa angka positif');
      return;
    }

    setLoadingRancangan(true);
    try {
      await LayananSantriService.createRancanganAnggaran({
        periode,
        pilar_layanan: selectedPilar,
        nilai_per_santri: nilai,
      });
      toast.success(`Rancangan anggaran untuk ${pilarMap.get(selectedPilar) || selectedPilar} berhasil dibuat`);
      setShowRancanganDialog(false);
      setSelectedPilar('');
      setNilaiPerSantri('');
      refetchRealisasi();
    } catch (error: any) {
      console.error('Error creating rancangan:', error);
      toast.error(error.message || 'Gagal membuat rancangan anggaran');
    } finally {
      setLoadingRancangan(false);
    }
  };

  // Auto-update periode saat filter berubah
  useEffect(() => {
    const now = new Date();
    let newPeriode: string;
    
    switch (filterType) {
      case 'bulan_lalu':
        const lastMonth = subMonths(now, 1);
        newPeriode = format(lastMonth, 'yyyy-MM');
        break;
      case '3_bulan':
        newPeriode = format(now, 'yyyy-MM');
        break;
      case '1_tahun':
        newPeriode = format(now, 'yyyy-MM');
        break;
      case 'custom':
        newPeriode = `${inputYear}-${String(inputMonth).padStart(2, '0')}`;
        break;
      default:
        newPeriode = format(now, 'yyyy-MM');
    }
    
    if (onPeriodeChange && newPeriode !== periode) {
      onPeriodeChange(newPeriode);
    }
    // REVISI: Clear breakdown cache saat periode berubah agar data refresh
    setMonthlyBreakdown(new Map());
  }, [filterType, inputYear, inputMonth, periode]);

  // Fetch preview data saat dialog dibuka dan pilar dipilih
  useEffect(() => {
    if (showGenerateDialog && selectedPilar) {
      setLoadingPreview(true);
      const fetchPreview = async () => {
        try {
          const total = await LayananSantriService.getTotalPengeluaranPerPilar(periode, selectedPilar);
          const monthlyBreakdown = await LayananSantriService.getMonthlyBreakdownPerPilar(periode, selectedPilar, 3);
          
          // REVISI: Untuk bantuan_langsung dan pendidikan_formal, ambil daftar santri
          let daftarSantri: Array<{
            santri_id: string;
            santri_nama: string;
            santri_nisn: string | null;
            total_nilai: number;
            jumlah_transaksi: number;
          }> | undefined = undefined;

          if (selectedPilar === 'bantuan_langsung' || selectedPilar === 'pendidikan_formal') {
            daftarSantri = await LayananSantriService.getDaftarSantriUntukGenerate(
              periode,
              selectedPilar
            );
          }

          setPreviewData({ total, monthlyBreakdown, daftarSantri });
        } catch (error) {
          console.error('Error fetching preview:', error);
          setPreviewData(null);
        } finally {
          setLoadingPreview(false);
        }
      };
      fetchPreview();
    } else {
      setPreviewData(null);
    }
  }, [showGenerateDialog, selectedPilar, periode]);

  // Fungsi untuk load breakdown saat row di-expand
  // REVISI: Gunakan periode dari filter, bukan hardcoded 12 bulan
  const loadMonthlyBreakdown = async (santriId: string) => {
    const breakdownKey = `${santriId}-${periode}`;
    if (monthlyBreakdown.has(breakdownKey)) return; // Already loaded
    
    setLoadingBreakdown(new Set(loadingBreakdown).add(santriId));
    try {
      // REVISI: Gunakan periode dari filter waktu
      // Hitung range berdasarkan filterType
      const now = new Date();
      let startPeriode: string;
      let endPeriode: string = format(now, 'yyyy-MM');
      
      switch (filterType) {
        case 'bulan_lalu':
          const lastMonth = subMonths(now, 1);
          startPeriode = format(lastMonth, 'yyyy-MM');
          endPeriode = format(lastMonth, 'yyyy-MM');
          break;
        case '3_bulan':
          startPeriode = format(subMonths(now, 2), 'yyyy-MM');
          endPeriode = format(now, 'yyyy-MM');
          break;
        case '1_tahun':
          startPeriode = format(subMonths(now, 11), 'yyyy-MM');
          endPeriode = format(now, 'yyyy-MM');
          break;
        case 'custom':
          // Gunakan periode yang dipilih
          startPeriode = periode;
          endPeriode = periode;
          break;
        default:
          startPeriode = format(subMonths(now, 11), 'yyyy-MM');
          endPeriode = format(now, 'yyyy-MM');
      }
      
      const breakdown = await LayananSantriService.getMonthlyBreakdownPerSantri(
        santriId,
        startPeriode,
        endPeriode
      );
      
      const newMap = new Map(monthlyBreakdown);
      newMap.set(breakdownKey, breakdown);
      setMonthlyBreakdown(newMap);
    } catch (error) {
      console.error('Error loading monthly breakdown:', error);
      toast.error('Gagal memuat breakdown bulanan');
    } finally {
      const newSet = new Set(loadingBreakdown);
      newSet.delete(santriId);
      setLoadingBreakdown(newSet);
    }
  };

  const totalRencana = Array.from(rancanganMap.values()).reduce((sum, val) => sum + val, 0);
  const totalRealisasi = realisasiData?.reduce((sum, item) => sum + item.total, 0) || 0;
  const selisih = totalRealisasi - totalRencana;
  const selisihPercent = totalRencana > 0 ? (selisih / totalRencana) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header dengan filter periode */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Realisasi Layanan Santri Binaan</CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="filterType" className="text-sm">Filter:</Label>
                <Select value={filterType} onValueChange={(val) => setFilterType(val as any)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bulan_lalu">Bulan Lalu</SelectItem>
                    <SelectItem value="3_bulan">3 Bulan Terakhir</SelectItem>
                    <SelectItem value="1_tahun">1 Tahun Terakhir</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                {filterType === 'custom' && (
                  <>
                    <Label htmlFor="year" className="text-sm">Tahun:</Label>
                    <Input
                      id="year"
                      type="number"
                      value={inputYear}
                      onChange={(e) => setInputYear(parseInt(e.target.value) || new Date().getFullYear())}
                      className="w-20"
                      min={2020}
                      max={2100}
                    />
                    <Label htmlFor="month" className="text-sm">Bulan:</Label>
                    <Select value={String(inputMonth)} onValueChange={(val) => setInputMonth(parseInt(val))}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                          <SelectItem key={m} value={String(m)}>
                            {format(new Date(2000, m - 1, 1), 'MMMM', { locale: id })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchRealisasi()}
                disabled={loadingRealisasi}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loadingRealisasi ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowGenerateDialog(true)}
              className="flex items-center gap-2"
            >
              <Calculator className="w-4 h-4" />
              Generate dari Realisasi
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowRancanganDialog(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Input Rancangan Anggaran
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500 mb-1">Total Rencana</div>
            <div className="text-xl font-bold">{formatCurrency(totalRencana)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500 mb-1">Total Realisasi</div>
            <div className="text-xl font-bold">{formatCurrency(totalRealisasi)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500 mb-1">Selisih</div>
            <div className={`text-xl font-bold ${selisih >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(selisih)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500 mb-1">Persentase</div>
            <div className={`text-xl font-bold ${selisihPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {selisihPercent.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Santri Binaan Mukim</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRealisasi ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : realisasiData && realisasiData.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Santri</TableHead>
                    {/* Dynamic pilar columns */}
                    {pilarList.map(pilar => (
                      <TableHead key={pilar.kode} className="text-right">
                        {pilar.nama}
                      </TableHead>
                    ))}
                    <TableHead className="text-right font-bold">Total</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {realisasiData.map((item) => {
                    const isExpanded = expandedRows.has(item.santri_id);
                    
                    // Calculate total rencana from all pilar
                    const totalRencana = pilarList.reduce((sum, pilar) => {
                      return sum + (rancanganMap.get(pilar.kode) || 0);
                    }, 0);
                    
                    const selisihTotal = item.total - totalRencana;
                    
                    return (
                      <React.Fragment key={item.santri_id}>
                        <TableRow>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  const newExpanded = new Set(expandedRows);
                                  if (isExpanded) {
                                    newExpanded.delete(item.santri_id);
                                  } else {
                                    newExpanded.add(item.santri_id);
                                    loadMonthlyBreakdown(item.santri_id); // Load breakdown saat expand
                                  }
                                  setExpandedRows(newExpanded);
                                }}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                              <div>
                                <div className="font-medium">{item.santri_nama}</div>
                                {item.santri_nisn && (
                                  <div className="text-xs text-gray-500">NISN: {item.santri_nisn}</div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          {/* Dynamic pilar columns */}
                          {pilarList.map(pilar => {
                            const nilai = item.pilar[pilar.kode] || 0;
                            const rencana = rancanganMap.get(pilar.kode) || 0;
                            const selisih = nilai - rencana;
                            
                            return (
                              <TableCell key={pilar.kode} className="text-right">
                                <div className="space-y-1">
                                  <div className="font-medium">{formatCurrency(nilai)}</div>
                                  {isExpanded && (
                                    <div className="text-xs">
                                      <span className="text-gray-500">Rencana: </span>
                                      <span>{formatCurrency(rencana)}</span>
                                      {selisih !== 0 && (
                                        <span className={selisih >= 0 ? 'text-green-600' : 'text-red-600'}>
                                          {' '}({selisih >= 0 ? '+' : ''}{formatCurrency(selisih)})
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-right font-bold">
                            <div className="space-y-1">
                              <div>{formatCurrency(item.total)}</div>
                              {isExpanded && (
                                <div className="text-xs">
                                  <span className="text-gray-500">Rencana: </span>
                                  <span>{formatCurrency(totalRencana)}</span>
                                  {selisihTotal !== 0 && (
                                    <span className={selisihTotal >= 0 ? 'text-green-600' : 'text-red-600'}>
                                      {' '}({selisihTotal >= 0 ? '+' : ''}{formatCurrency(selisihTotal)})
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {/* Dynamic generate menu items for each pilar */}
                                  {pilarList.map(pilar => (
                                    <DropdownMenuItem
                                      key={pilar.kode}
                                      onClick={async () => {
                                        const pilarKey = `${periode}-${pilar.kode}`;
                                        setGeneratingPeriode(new Map(generatingPeriode).set(pilarKey, pilar.kode));
                                        try {
                                          await LayananSantriService.generateLayananPeriodikDariRealisasi({
                                            periode,
                                            pilar_layanan: pilar.kode,
                                            sumber: 'realisasi',
                                          });
                                          toast.success(`Layanan periodik ${pilar.nama} untuk ${periode} berhasil di-generate`);
                                          refetchRealisasi();
                                        } catch (error: any) {
                                          toast.error(error.message || 'Gagal generate');
                                        } finally {
                                          const newMap = new Map(generatingPeriode);
                                          newMap.delete(pilarKey);
                                          setGeneratingPeriode(newMap);
                                        }
                                      }}
                                    >
                                      <Play className="h-4 w-4 mr-2" />
                                      Generate {pilar.nama}
                                    </DropdownMenuItem>
                                  ))}
                                  <DropdownMenuItem
                                    onClick={async () => {
                                      try {
                                        // Delete all pilar periodik for this periode
                                        for (const pilar of pilarList) {
                                          await LayananSantriService.deletePeriodik(periode, pilar.kode);
                                        }
                                        toast.success(`Generate untuk ${periode} berhasil dibatalkan`);
                                        refetchRealisasi();
                                      } catch (error: any) {
                                        toast.error(error.message || 'Gagal batalkan');
                                      }
                                    }}
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    Batalkan Semua Generate
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                        {/* Expanded Row: Monthly Breakdown */}
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={pilarList.length + 2} className="bg-gray-50 p-4">
                              {loadingBreakdown.has(item.santri_id) ? (
                                <div className="flex items-center justify-center py-4">
                                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                  <span className="ml-2 text-sm text-gray-500">Memuat breakdown bulanan...</span>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  <div className="font-semibold text-sm text-gray-700 mb-2">
                                    Breakdown Bulanan - {item.santri_nama}
                                  </div>
                                  <div className="overflow-x-auto">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead className="w-32">Periode</TableHead>
                                          {/* Dynamic pilar columns */}
                                          {pilarList.map(pilar => (
                                            <TableHead key={pilar.kode} className="text-right">
                                              {pilar.nama}
                                            </TableHead>
                                          ))}
                                          <TableHead className="text-right font-bold">Total</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {monthlyBreakdown.get(`${item.santri_id}-${periode}`)?.map((monthData) => {
                                          const [year, month] = monthData.periode.split('-').map(Number);
                                          const monthName = format(new Date(year, month - 1, 1), 'MMMM yyyy', { locale: id });
                                          
                                          return (
                                            <TableRow key={monthData.periode}>
                                              <TableCell className="font-medium">{monthName}</TableCell>
                                              {/* Dynamic pilar columns */}
                                              {pilarList.map(pilar => {
                                                const nilai = monthData.pilar?.[pilar.kode] || 0;
                                                return (
                                                  <TableCell key={pilar.kode} className="text-right">
                                                    {nilai > 0 ? formatCurrency(nilai) : '-'}
                                                  </TableCell>
                                                );
                                              })}
                                              <TableCell className="text-right font-bold">
                                                {monthData.total > 0 ? (
                                                  <div className="flex items-center justify-end gap-2">
                                                    <span>{formatCurrency(monthData.total)}</span>
                                                    <Button 
                                                      variant="ghost" 
                                                      size="sm" 
                                                      className="h-6 w-6 p-0"
                                                      onClick={() => {
                                                        // TODO: Implement detail view
                                                        toast.info(`Rincian untuk ${monthName} - ${item.santri_nama}`);
                                                      }}
                                                      title="Lihat Rincian"
                                                    >
                                                      <Eye className="h-3 w-3 text-gray-500 hover:text-gray-700" />
                                                    </Button>
                                                  </div>
                                                ) : '-'}
                                              </TableCell>
                                            </TableRow>
                                          );
                                        }) || (
                                          <TableRow>
                                            <TableCell colSpan={pilarList.length + 2} className="text-center text-gray-500 py-4">
                                              Belum ada data untuk periode ini
                                            </TableCell>
                                          </TableRow>
                                        )}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Belum ada data realisasi untuk periode ini</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate Layanan Periodik dari Realisasi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Pilar Layanan</Label>
              <Select value={selectedPilar} onValueChange={(val) => setSelectedPilar(val as PilarLayanan)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih pilar layanan" />
                </SelectTrigger>
                <SelectContent>
                  {/* Dynamic pilar options */}
                  {pilarList.map(pilar => (
                    <SelectItem key={pilar.kode} value={pilar.kode}>
                      {pilar.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Preview Data */}
            {selectedPilar && (
              <div className="space-y-3">
                {loadingPreview ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-500">Memuat data preview...</span>
                  </div>
                ) : previewData ? (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">Total Pengeluaran ({periode}):</span>
                      <span className="text-lg font-bold text-blue-600">{formatCurrency(previewData.total)}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700">Rincian per Bulan (3 bulan terakhir):</div>
                      <div className="space-y-1">
                        {previewData.monthlyBreakdown.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm py-1 px-2 bg-white rounded border border-gray-200">
                            <span className="text-gray-600">{item.month}</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(item.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* REVISI: Tampilkan daftar santri untuk bantuan langsung dan pendidikan formal */}
                    {previewData.daftarSantri && previewData.daftarSantri.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-700">
                          Daftar Santri yang Akan Di-generate ({previewData.daftarSantri.length} santri):
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-1 border border-gray-200 rounded bg-white p-2">
                          {previewData.daftarSantri.map((santri) => (
                            <div key={santri.santri_id} className="flex items-center justify-between text-sm py-1 px-2 hover:bg-gray-50 rounded">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{santri.santri_nama}</div>
                                {santri.santri_nisn && (
                                  <div className="text-xs text-gray-500">NISN: {santri.santri_nisn}</div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-gray-900">{formatCurrency(santri.total_nilai)}</div>
                                <div className="text-xs text-gray-500">{santri.jumlah_transaksi} transaksi</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {previewData.daftarSantri && previewData.daftarSantri.length === 0 && (
                      <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-sm text-yellow-800">
                        Tidak ada transaksi keuangan dengan santri_id untuk kategori ini di periode {periode}.
                      </div>
                    )}
                    <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                      {selectedPilar === 'bantuan_langsung' || selectedPilar === 'pendidikan_formal' ? (
                        <span>
                          Sistem akan mengambil transaksi keuangan yang sudah memilih santri tertentu di periode {periode} dan membuat ledger layanan santri.
                        </span>
                      ) : (
                        <span>
                          Sistem akan menghitung total pengeluaran kategori terkait di periode {periode}, kemudian membagi rata ke semua santri binaan mukim aktif.
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 text-sm text-yellow-800">
                    Tidak ada data pengeluaran untuk periode ini.
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowGenerateDialog(false);
              setSelectedPilar('');
              setPreviewData(null);
            }}>
              Batal
            </Button>
            <Button onClick={handleGenerateFromRealisasi} disabled={loadingGenerate || !selectedPilar || !previewData || previewData.total === 0}>
              {loadingGenerate ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rancangan Dialog */}
      <Dialog open={showRancanganDialog} onOpenChange={setShowRancanganDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Input Rancangan Anggaran</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Pilar Layanan</Label>
              <Select value={selectedPilar} onValueChange={(val) => setSelectedPilar(val as PilarLayanan)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih pilar layanan" />
                </SelectTrigger>
                <SelectContent>
                  {/* Dynamic pilar options */}
                  {pilarList.map(pilar => (
                    <SelectItem key={pilar.kode} value={pilar.kode}>
                      {pilar.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nilai per Santri</Label>
              <Input
                type="number"
                value={nilaiPerSantri}
                onChange={(e) => setNilaiPerSantri(e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
            <div className="text-sm text-gray-500">
              Rancangan anggaran akan digunakan sebagai referensi untuk perencanaan layanan santri.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRancanganDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleCreateRancangan} disabled={loadingRancangan || !selectedPilar || !nilaiPerSantri}>
              {loadingRancangan ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RealisasiLayananSantriTab;


