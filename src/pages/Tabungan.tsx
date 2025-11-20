import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  ArrowDownCircle
} from "lucide-react";
import { TabunganSantriService } from '@/services/tabunganSantri.service';
import { SaldoTabunganSantri, TabunganStats } from '@/types/tabungan.types';
import { useToast } from '@/hooks/use-toast';
import { FormSetorMassal } from '@/components/TabunganSantri/FormSetorMassal';
import { FormTarikMassal } from '@/components/TabunganSantri/FormTarikMassal';
import { FormSetor } from '@/components/TabunganSantri/FormSetor';
import { FormTarik } from '@/components/TabunganSantri/FormTarik';
import { RiwayatTabungan } from '@/components/TabunganSantri/RiwayatTabungan';
import ModuleHeader from '@/components/ModuleHeader';

const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

const Tabungan = () => {
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
    loadData();
  }, []);

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

  const tabs = [
    { label: 'Dashboard', path: '/keuangan-v3' },
    { label: 'SPP & Tagihan', path: '/keuangan' },
    { label: 'Tabungan', path: '/tabungan' },
    { label: 'Donasi', path: '/donasi' }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <ModuleHeader title="Tabungan Santri" tabs={tabs} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <ModuleHeader title="Tabungan Santri" tabs={tabs} />
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 justify-end">
          <Button
            onClick={() => window.location.href = '/laporan-tabungan'}
            variant="outline"
            className="border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            <History className="h-4 w-4 mr-2" />
            Laporan Lengkap
          </Button>
          <Button
            onClick={() => setShowSetorMassal(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Setor Massal
          </Button>
          <Button
            onClick={() => setShowTarikMassal(true)}
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            <Minus className="h-4 w-4 mr-2" />
            Tarik Massal
          </Button>
        </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tabungan</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatRupiah(stats.total_saldo)}</div>
              <p className="text-xs text-muted-foreground">Semua santri</p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Setoran Bulan Ini</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatRupiah(stats.total_setoran_bulan_ini)}</div>
              <p className="text-xs text-muted-foreground">Bulan berjalan</p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Penarikan Bulan Ini</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatRupiah(stats.total_penarikan_bulan_ini)}</div>
              <p className="text-xs text-muted-foreground">Bulan berjalan</p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rata-rata Saldo</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatRupiah(stats.rata_rata_saldo)}</div>
              <p className="text-xs text-muted-foreground">Per santri</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="border-0 shadow-soft">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Cari Santri</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Cari nama, ID Santri, atau kelas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="kategori">Kategori Santri</Label>
              <Select value={filterKategori || "all"} onValueChange={(value) => setFilterKategori(value === "all" ? "" : value)}>
                <SelectTrigger>
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
            </div>
            <div className="flex items-end">
              <Button onClick={handleRefresh} variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Santri List */}
      <Card className="border-0 shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Users className="h-5 w-5" />
                Daftar Santri
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredSantri.length} santri ditemukan
              </p>
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-4">
              <div className="flex items-center gap-1">
                <ArrowUpCircle className="h-4 w-4 text-green-600" />
                <span>Setor</span>
              </div>
              <div className="flex items-center gap-1">
                <ArrowDownCircle className="h-4 w-4 text-red-600" />
                <span>Tarik</span>
              </div>
              <div className="flex items-center gap-1">
                <History className="h-4 w-4 text-blue-600" />
                <span>Riwayat</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>Profile</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSantri.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Tidak ada santri ditemukan
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSantri.map((santri) => (
                <div key={santri.santri_id} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-background hover:shadow-md transition-all">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Wallet className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{santri.santri.nama_lengkap}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap mt-1">
                        {santri.santri.id_santri && (
                          <Badge variant="secondary" className="text-xs font-mono">
                            {santri.santri.id_santri}
                          </Badge>
                        )}
                        {santri.santri.kelas && <span>• {santri.santri.kelas}</span>}
                        {santri.santri.kategori && <span>• {santri.santri.kategori}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold text-lg text-foreground">{formatRupiah(santri.saldo)}</div>
                      <Badge variant={santri.saldo > 0 ? 'default' : 'secondary'} className="mt-1">
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
                            className="text-green-600 border-green-200 hover:bg-green-50"
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
                            className="text-red-600 border-red-200 hover:bg-red-50"
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
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
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

export default Tabungan;
