import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Plus,
  Minus,
  Users,
  RefreshCw,
  Eye,
  History,
  ArrowUpCircle,
  ArrowDownCircle,
  FileText,
  AlertCircle
} from "lucide-react";
import { TabunganSantriService, type TabunganStats } from '@/modules/santri/services/tabunganSantri.service';
import { SaldoTabunganSantri } from '@/types/tabungan.types';
import { useToast } from '@/hooks/use-toast';
import { FormSetorMassal } from '@/modules/santri/components/TabunganSantri/FormSetorMassal';
import { FormTarikMassal } from '@/modules/santri/components/TabunganSantri/FormTarikMassal';
import { FormSetor } from '../../components/TabunganSantri/FormSetor';
import { FormTarik } from '../../components/TabunganSantri/FormTarik';
import { RiwayatTabungan } from '@/modules/santri/components/TabunganSantri/RiwayatTabungan';
import PermohonanPenarikan from '@/modules/keuangan/admin/pages/PermohonanPenarikan';
import LaporanTabungan from '@/modules/santri/admin/pages/LaporanTabungan';

const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

const TabunganSantriAdmin = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'daftar-santri';
  const santriIdParam = searchParams.get('santriId');
  const santriNameParam = searchParams.get('santriName');
  const viewParam = (searchParams.get('view') as 'riwayat' | 'withdraw' | null) || null;

  const [santriList, setSantriList] = useState<SaldoTabunganSantri[]>([]);
  const [stats, setStats] = useState<TabunganStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKategori, setFilterKategori] = useState<string>('');
  const [showSetorMassal, setShowSetorMassal] = useState(false);
  const [showTarikMassal, setShowTarikMassal] = useState(false);

  // Individual operations states
  const [selectedSantriSetor, setSelectedSantriSetor] = useState<{ id: string; name: string } | null>(null);
  const [selectedSantriTarik, setSelectedSantriTarik] = useState<{ id: string; name: string; saldo: number } | null>(null);
  const [selectedSantriHistory, setSelectedSantriHistory] = useState<{ id: string; name: string } | null>(null);
  const [preselectHandled, setPreselectHandled] = useState(false);

  const { toast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [santriData, statsData] = await Promise.all([
        TabunganSantriService.getAllSaldoTabungan(),
        TabunganSantriService.getTabunganStats()
      ]);
      setSantriList(santriData);
      setStats(statsData);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data tabungan',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'daftar-santri') {
      loadData();
    }
  }, [activeTab]);

  useEffect(() => {
    if (!santriIdParam || preselectHandled || loading || santriList.length === 0 || activeTab !== 'daftar-santri') {
      return;
    }

    const target = santriList.find(s => s.santri_id === santriIdParam);
    if (!target) return;

    const displayName = santriNameParam || target.santri.nama_lengkap;

    if (viewParam === 'withdraw') {
      setSelectedSantriTarik({
        id: target.santri_id,
        name: displayName,
        saldo: target.saldo
      });
    } else {
      setSelectedSantriHistory({
        id: target.santri_id,
        name: displayName
      });
    }

    setPreselectHandled(true);
  }, [santriIdParam, santriNameParam, viewParam, preselectHandled, loading, santriList, activeTab]);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  const filteredSantri = santriList.filter(santri => {
    const matchesSearch = santri.santri.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      santri.santri.id_santri?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      santri.santri.nisn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      santri.santri.kelas?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesKategori = !filterKategori || santri.santri.kategori === filterKategori;

    return matchesSearch && matchesKategori;
  });

  const handleRefresh = () => {
    loadData();
  };

  const handleSetorMassalSuccess = () => {
    setShowSetorMassal(false);
    loadData();
  };

  const handleTarikMassalSuccess = () => {
    setShowTarikMassal(false);
    loadData();
  };

  // Individual operations handlers
  const handleSetorSuccess = () => {
    setSelectedSantriSetor(null);
    loadData();
    toast({
      title: 'Berhasil',
      description: 'Setoran berhasil disimpan'
    });
  };

  const handleTarikSuccess = () => {
    setSelectedSantriTarik(null);
    loadData();
    toast({
      title: 'Berhasil',
      description: 'Penarikan berhasil disimpan'
    });
  };

  const navigateToProfile = (santriId: string, santriName: string) => {
    window.location.href = `/santri/profile?santriId=${santriId}&santriName=${encodeURIComponent(santriName)}&tab=tabungan`;
  };

  return (
    <TooltipProvider>
      <div className="space-y-6 -mx-3 sm:-mx-4 lg:-mx-8 -my-4 sm:-my-6 px-3 sm:px-4 lg:px-8 py-4 sm:py-6 bg-gradient-to-br from-green-50/40 via-white to-blue-50/40">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Tabungan Santri</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Kelola tabungan santri pesantren - Modul khusus untuk laporan dan pengelolaan tabungan
              </p>
            </div>
          </div>
        </div>

        {/* Stats - hanya tampil di tab Daftar Santri */}
        {activeTab === 'daftar-santri' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Total Tabungan</CardTitle>
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-gray-900">{formatRupiah(stats.total_saldo)}</div>
                <p className="text-xs text-muted-foreground mt-1">Semua santri</p>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Setoran Bulan Ini</CardTitle>
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-green-600">{formatRupiah(stats.total_setoran_bulan_ini)}</div>
                <p className="text-xs text-muted-foreground mt-1">Bulan berjalan</p>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Penarikan Bulan Ini</CardTitle>
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-red-600">{formatRupiah(stats.total_penarikan_bulan_ini)}</div>
                <p className="text-xs text-muted-foreground mt-1">Bulan berjalan</p>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Rata-rata Saldo</CardTitle>
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-gray-900">{formatRupiah(stats.rata_rata_saldo)}</div>
                <p className="text-xs text-muted-foreground mt-1">Per santri</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daftar-santri" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Daftar Santri
            </TabsTrigger>
            <TabsTrigger value="permohonan-penarikan" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Permohonan Penarikan
            </TabsTrigger>
            <TabsTrigger value="laporan" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Laporan
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Daftar Santri */}
          <TabsContent value="daftar-santri" className="space-y-6 mt-6">
            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2">
              <Button
                onClick={() => setShowSetorMassal(true)}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white shadow-sm whitespace-nowrap text-xs sm:text-sm"
              >
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Setor Massal</span>
                <span className="sm:hidden">Setor</span>
              </Button>
              <Button
                onClick={() => setShowTarikMassal(true)}
                variant="outline"
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50 whitespace-nowrap text-xs sm:text-sm"
              >
                <Minus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Tarik Massal</span>
                <span className="sm:hidden">Tarik</span>
              </Button>
            </div>

            {/* Filters */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-50/50 rounded-xl border border-gray-200/60 shadow-sm">
                <div className="flex flex-wrap items-center gap-3 flex-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Search className="h-4 w-4 text-gray-500" />
                    <span>Filter</span>
                  </div>
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari nama, ID Santri, atau kelas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 h-9 bg-white border-gray-200"
                    />
                  </div>
                  <Select value={filterKategori || "all"} onValueChange={(value) => setFilterKategori(value === "all" ? "" : value)}>
                    <SelectTrigger className="w-[180px] h-9 bg-white border-gray-200">
                      <SelectValue placeholder="Semua kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua kategori</SelectItem>
                      <SelectItem value="Binaan Mukim">Binaan Mukim</SelectItem>
                      <SelectItem value="Binaan Non-Mukim">Binaan Non-Mukim</SelectItem>
                      <SelectItem value="Reguler">Reguler</SelectItem>
                      <SelectItem value="Mahasiswa">Mahasiswa</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleRefresh}
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 flex-shrink-0"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-sm text-gray-600 font-medium px-2 py-1 bg-white/80 rounded-md border border-gray-200/60">
                  {filteredSantri.length} santri ditemukan
                </div>
              </div>
            </div>

            {/* Santri List */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                        <Users className="h-5 w-5 text-gray-600" />
                        Daftar Santri
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Kelola tabungan per santri
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <ArrowUpCircle className="h-3 w-3 text-green-600" />
                        <span>Setor</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ArrowDownCircle className="h-3 w-3 text-red-600" />
                        <span>Tarik</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <History className="h-3 w-3 text-blue-600" />
                        <span>Riwayat</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>Profile</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredSantri.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Tidak ada santri ditemukan</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredSantri.map((santri) => (
                        <div
                          key={santri.santri_id}
                          className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-all hover:border-gray-300"
                        >
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div className="p-3 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg flex-shrink-0">
                              <Wallet className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 truncate">{santri.santri.nama_lengkap}</h4>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap mt-1">
                                {santri.santri.id_santri && (
                                  <Badge variant="secondary" className="text-xs font-mono bg-gray-100 text-gray-700">
                                    {santri.santri.id_santri}
                                  </Badge>
                                )}
                                {santri.santri.kelas && <span className="text-xs">• {santri.santri.kelas}</span>}
                                {santri.santri.kategori && <span className="text-xs">• {santri.santri.kategori}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 flex-shrink-0">
                            <div className="text-right">
                              <div className="font-bold text-lg text-gray-900">{formatRupiah(santri.saldo)}</div>
                              <Badge
                                variant={santri.saldo > 0 ? 'default' : 'secondary'}
                                className={`mt-1 text-xs ${santri.saldo > 0
                                  ? 'bg-green-100 text-green-700 hover:bg-green-100'
                                  : 'bg-gray-100 text-gray-600'
                                  }`}
                              >
                                {santri.saldo > 0 ? 'Aktif' : 'Belum Ada Tabungan'}
                              </Badge>
                            </div>
                            <div className="flex gap-2">
                              {/* Individual action buttons */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    onClick={() => setSelectedSantriSetor({ id: santri.santri_id, name: santri.santri.nama_lengkap })}
                                    variant="outline"
                                    size="sm"
                                    className="text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300"
                                  >
                                    <ArrowUpCircle className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Setor Tabungan</p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    onClick={() => setSelectedSantriTarik({
                                      id: santri.santri_id,
                                      name: santri.santri.nama_lengkap,
                                      saldo: santri.saldo
                                    })}
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                                    disabled={santri.saldo <= 0}
                                  >
                                    <ArrowDownCircle className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{santri.saldo <= 0 ? 'Saldo tidak mencukupi' : 'Tarik Tabungan'}</p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    onClick={() => setSelectedSantriHistory({ id: santri.santri_id, name: santri.santri.nama_lengkap })}
                                    variant="outline"
                                    size="sm"
                                    className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                                  >
                                    <History className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Lihat Riwayat Transaksi</p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    onClick={() => navigateToProfile(santri.santri_id, santri.santri.nama_lengkap)}
                                    variant="outline"
                                    size="sm"
                                    className="text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Lihat Profil Santri</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab 2: Permohonan Penarikan */}
          <TabsContent value="permohonan-penarikan" className="space-y-6 mt-6">
            <PermohonanPenarikan />
          </TabsContent>

          {/* Tab 3: Laporan */}
          <TabsContent value="laporan" className="space-y-6 mt-6">
            <LaporanTabungan hideBackButton={true} />
          </TabsContent>
        </Tabs>

        {/* Modals */}
        {showSetorMassal && (
          <FormSetorMassal
            onSuccess={handleSetorMassalSuccess}
            onCancel={() => setShowSetorMassal(false)}
          />
        )}

        {showTarikMassal && (
          <FormTarikMassal
            onSuccess={handleTarikMassalSuccess}
            onCancel={() => setShowTarikMassal(false)}
          />
        )}

        {/* Individual Operation Modals */}
        {selectedSantriSetor && (
          <FormSetor
            santriId={selectedSantriSetor.id}
            santriName={selectedSantriSetor.name}
            onSuccess={handleSetorSuccess}
            onCancel={() => setSelectedSantriSetor(null)}
          />
        )}

        {selectedSantriTarik && (
          <FormTarik
            santriId={selectedSantriTarik.id}
            santriName={selectedSantriTarik.name}
            saldoSaatIni={selectedSantriTarik.saldo}
            onSuccess={handleTarikSuccess}
            onCancel={() => setSelectedSantriTarik(null)}
          />
        )}

        {selectedSantriHistory && (
          <RiwayatTabungan
            santriId={selectedSantriHistory.id}
            santriName={selectedSantriHistory.name}
            onClose={() => setSelectedSantriHistory(null)}
          />
        )}
      </div>
    </TooltipProvider>
  );
};

export default TabunganSantriAdmin;