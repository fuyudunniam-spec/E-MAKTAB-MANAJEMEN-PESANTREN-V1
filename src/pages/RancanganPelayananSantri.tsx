import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, RefreshCw, Search, Filter, LayoutDashboard, List, Users } from 'lucide-react';
import { toast } from 'sonner';
import RancanganDataTable from '@/components/rancangan/RancanganDataTable';
import BatchBasedTable from '@/components/rancangan/BatchBasedTable';
import RancanganFormDialog from '@/components/rancangan/RancanganFormDialog';
import RancanganBatchFormDialog from '@/components/rancangan/RancanganBatchFormDialog';
import RancanganSummaryCards from '@/components/rancangan/RancanganSummaryCards';
import RancanganChartsSection from '@/components/rancangan/RancanganChartsSection';
import RancanganSantriTable from '@/components/rancangan/RancanganSantriTable';
import {
  RancanganPelayananService,
  type RancanganPelayanan,
  type StatusRancangan,
  type StatusPemenuhan,
  PILAR_PELAYANAN_CONFIG
} from '@/services/rancanganPelayanan.service';

const RancanganPelayananSantri: React.FC = () => {
  const [sp, setSearchParams] = useSearchParams();
  const activeTab = sp.get('tab') || 'dashboard';
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rancangan, setRancangan] = useState<RancanganPelayanan[]>([]);
  const [filteredRancangan, setFilteredRancangan] = useState<RancanganPelayanan[]>([]);
  
  // Dashboard data
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [monthlyChartData, setMonthlyChartData] = useState<any[]>([]);
  const [pilarChartData, setPilarChartData] = useState<any[]>([]);
  
  // UI States
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showBatchFormDialog, setShowBatchFormDialog] = useState(false);
  const [editingRancangan, setEditingRancangan] = useState<RancanganPelayanan | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<StatusRancangan | 'all'>('all');
  const [filterPemenuhan, setFilterPemenuhan] = useState<StatusPemenuhan | 'all'>('all');
  const [filterTahun, setFilterTahun] = useState<number | 'all'>('all');
  const [filterPeriode, setFilterPeriode] = useState<string>('all');

  useEffect(() => {
    loadRancangan();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [rancangan, searchQuery, filterStatus, filterPemenuhan, filterTahun]);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboardData();
    }
  }, [activeTab, rancangan]);

  const loadRancangan = async () => {
    try {
      setLoading(true);
      const data = await RancanganPelayananService.getAllRancangan();
      setRancangan(data);
    } catch (error: any) {
      console.error('Error loading rancangan:', error);
      toast.error('Gagal memuat data kebutuhan layanan');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = useCallback(async () => {
    try {
      // Filter rancangan berdasarkan filter yang dipilih
      let filteredData = [...rancangan];
      
      if (filterTahun !== 'all') {
        filteredData = filteredData.filter(r => r.tahun === filterTahun);
      }
      
      if (filterPeriode !== 'all') {
        filteredData = filteredData.filter(r => 
          r.periode?.includes(filterPeriode) || false
        );
      }

      // Calculate dashboard stats dari filtered data
      const totalTarget = filteredData.reduce((sum, r) => sum + (r.total_target || 0), 0);
      const totalDukungan = filteredData.reduce((sum, r) => sum + (r.total_dukungan || 0), 0);
      const totalKekurangan = totalTarget - totalDukungan;
      const persentasePemenuhan = totalTarget > 0 ? (totalDukungan / totalTarget) * 100 : 0;

      const dashboardStatsData = {
        totalTarget,
        totalDukungan,
        totalKekurangan,
        persentasePemenuhan,
        totalRancangan: filteredData.length,
        rancanganAktif: filteredData.filter(r => r.status === 'aktif').length,
        santriTercukupi: filteredData.filter(r => r.status_pemenuhan === 'tercukupi').length,
        santriTerlayani: filteredData.filter(r => r.status_pemenuhan === 'terlayani' || r.status_pemenuhan === 'tercukupi').length,
        santriBelumTerpenuhi: filteredData.filter(r => r.status_pemenuhan === 'belum_terpenuhi').length,
      };

      setDashboardStats(dashboardStatsData);

      // Prepare monthly chart data (group by periode)
      const monthlyMap = new Map<string, { target: number; dukungan: number; eksekusi: number }>();
      filteredData.forEach(r => {
        const key = r.periode || `Tahun ${r.tahun}`;
        if (!monthlyMap.has(key)) {
          monthlyMap.set(key, { target: 0, dukungan: 0, eksekusi: 0 });
        }
        const data = monthlyMap.get(key)!;
        data.target += r.total_target || 0;
        data.dukungan += r.total_dukungan || 0;
        data.eksekusi += r.total_dukungan || 0; // Eksekusi = dukungan untuk sekarang
      });

      const monthlyData = Array.from(monthlyMap.entries())
        .map(([month, data]) => ({
          month,
          target: data.target,
          dukungan: data.dukungan,
          eksekusi: data.eksekusi
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      setMonthlyChartData(monthlyData);

      // Prepare pilar chart data
      const pilarMap = new Map<string, number>();
      filteredData.forEach(r => {
        r.pilar?.forEach(p => {
          const pilarName = PILAR_PELAYANAN_CONFIG[p.pilar]?.label || p.nama_pilar;
          const current = pilarMap.get(pilarName) || 0;
          pilarMap.set(pilarName, current + (p.target_biaya || 0));
        });
      });

      const pilarColors: Record<string, string> = {
        'Pelayanan Pendidikan Formal': '#64748b',
        'Pelayanan Pendidikan Pesantren': '#3b82f6',
        'Pelayanan Operasional dan Konsumsi Santri': '#22c55e',
        'Pelayanan Bantuan Langsung': '#f97316'
      };

      const pilarData = Array.from(pilarMap.entries())
        .map(([name, amount]) => ({
          name,
          value: amount,
          amount,
          color: pilarColors[name] || '#94a3b8'
        }))
        .sort((a, b) => b.amount - a.amount);

      setPilarChartData(pilarData);
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      toast.error('Gagal memuat data dashboard');
    }
  }, [rancangan, filterTahun, filterPeriode]);

  const applyFilters = () => {
    let filtered = [...rancangan];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.santri?.nama_lengkap?.toLowerCase().includes(query) ||
        r.santri?.id_santri?.toLowerCase().includes(query) ||
        r.periode?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }

    // Pemenuhan filter
    if (filterPemenuhan !== 'all') {
      filtered = filtered.filter(r => r.status_pemenuhan === filterPemenuhan);
    }

    // Tahun filter
    if (filterTahun !== 'all') {
      filtered = filtered.filter(r => r.tahun === filterTahun);
    }

    setFilteredRancangan(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRancangan();
    setRefreshing(false);
    toast.success('Data berhasil diperbarui');
  };

  const handleAddRancangan = () => {
    setEditingRancangan(null);
    setShowFormDialog(true);
  };

  const handleEditRancangan = (r: RancanganPelayanan) => {
    setEditingRancangan(r);
    setShowFormDialog(true);
  };

  const handleDeleteRancangan = async (r: RancanganPelayanan) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kebutuhan layanan untuk ${r.santri?.nama_lengkap}?`)) {
      return;
    }

    try {
      await RancanganPelayananService.deleteRancangan(r.id);
      toast.success('Kebutuhan layanan berhasil dihapus');
      await loadRancangan();
    } catch (error: any) {
      console.error('Error deleting rancangan:', error);
      toast.error('Gagal menghapus kebutuhan layanan');
    }
  };

  const handleViewRancangan = (r: RancanganPelayanan) => {
    // TODO: Navigate to detail page or open modal
    console.log('View rancangan:', r);
    toast.info('Fitur detail akan segera tersedia');
  };

  const handleFormSuccess = () => {
    loadRancangan();
  };

  // Get unique years for filter
  const availableYears = Array.from(
    new Set(rancangan.map(r => r.tahun))
  ).sort((a, b) => b - a);

  if (loading) {
    return (
      <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-white rounded-lg shadow-sm animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <span>Donasi</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Kebutuhan Layanan Santri</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">
            Kebutuhan Layanan Santri
          </h1>
          <p className="text-sm text-gray-500">
            Kelola rencana anggaran kebutuhan layanan per santri dalam 4 pilar pelayanan secara custom
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 h-9"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBatchFormDialog(true)}
            className="border-blue-300 text-blue-700 hover:bg-blue-50 h-9"
          >
            <Users className="h-4 w-4 mr-2" />
            Buat Batch
          </Button>
          <Button
            size="sm"
            onClick={handleAddRancangan}
            className="bg-slate-600 hover:bg-slate-700 text-white h-9 shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Kebutuhan
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Daftar Kebutuhan
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="mt-0">
        <div className="space-y-6">
          {/* Period Filter */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  Filter Periode
                </label>
                <div className="flex items-center gap-2">
                  <Select
                    value={filterTahun === 'all' ? 'all' : filterTahun.toString()}
                    onValueChange={(v) => {
                      const newTahun = v === 'all' ? 'all' : parseInt(v);
                      setFilterTahun(newTahun);
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Tahun" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Tahun</SelectItem>
                      {availableYears.map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={filterPeriode}
                    onValueChange={setFilterPeriode}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Semua Periode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Periode</SelectItem>
                      <SelectItem value="Semester 1">Semester 1</SelectItem>
                      <SelectItem value="Semester 2">Semester 2</SelectItem>
                      {Array.from({ length: 12 }, (_, i) => {
                        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                                          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                        return (
                          <SelectItem key={monthNames[i]} value={monthNames[i]}>
                            {monthNames[i]}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {filterTahun !== 'all' && (
                  <span>
                    Menampilkan data untuk tahun {filterTahun}
                    {filterPeriode !== 'all' && ` - ${filterPeriode}`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <RancanganSummaryCards 
            stats={dashboardStats || {
              totalTarget: 0,
              totalDukungan: 0,
              totalKekurangan: 0,
              persentasePemenuhan: 0,
              totalRancangan: 0,
              rancanganAktif: 0,
              santriTercukupi: 0,
              santriTerlayani: 0,
              santriBelumTerpenuhi: 0,
            }}
            periodLabel={
              filterTahun !== 'all' 
                ? `${filterTahun}${filterPeriode !== 'all' ? ` - ${filterPeriode}` : ''}`
                : 'Keseluruhan'
            }
          />

          {/* Charts Section */}
          <RancanganChartsSection
            monthlyData={monthlyChartData}
            pilarData={pilarChartData}
            periodLabel={
              filterTahun !== 'all' 
                ? `${filterTahun}${filterPeriode !== 'all' ? ` - ${filterPeriode}` : ''}`
                : 'Keseluruhan'
            }
          />

          {/* Tabel Daftar Santri dengan 4 Kolom Pilar */}
          <RancanganSantriTable
            rancangan={filteredRancangan}
            loading={loading}
            onEdit={handleEditRancangan}
            onDelete={handleDeleteRancangan}
            onRefresh={loadRancangan}
          />
        </div>
        </TabsContent>

        {/* List Tab */}
        <TabsContent value="list" className="mt-0">
        <>
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari santri..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Status Filter */}
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as StatusRancangan | 'all')}>
            <SelectTrigger>
              <SelectValue placeholder="Status Rancangan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="aktif">Aktif</SelectItem>
              <SelectItem value="selesai">Selesai</SelectItem>
              <SelectItem value="dibatalkan">Dibatalkan</SelectItem>
            </SelectContent>
          </Select>

          {/* Pemenuhan Filter */}
          <Select value={filterPemenuhan} onValueChange={(v) => setFilterPemenuhan(v as StatusPemenuhan | 'all')}>
            <SelectTrigger>
              <SelectValue placeholder="Status Pemenuhan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Pemenuhan</SelectItem>
              <SelectItem value="belum_terpenuhi">Belum Terpenuhi</SelectItem>
              <SelectItem value="terlayani">Terlayani</SelectItem>
              <SelectItem value="tercukupi">Tercukupi</SelectItem>
            </SelectContent>
          </Select>

          {/* Tahun Filter */}
          <Select
            value={filterTahun === 'all' ? 'all' : filterTahun.toString()}
            onValueChange={(v) => setFilterTahun(v === 'all' ? 'all' : parseInt(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tahun" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tahun</SelectItem>
              {availableYears.map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Menampilkan {filteredRancangan.length} dari {rancangan.length} rancangan
      </div>

      {/* Rancangan Grid */}
      {filteredRancangan.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Filter className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Tidak ada rancangan ditemukan
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {rancangan.length === 0
              ? 'Mulai dengan membuat rancangan pelayanan baru'
              : 'Coba ubah filter pencarian Anda'}
          </p>
          {rancangan.length === 0 && (
            <Button onClick={handleAddRancangan} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Kebutuhan Pertama
            </Button>
          )}
        </div>
      ) : (
        <BatchBasedTable
          loading={loading}
          onEdit={handleEditRancangan}
          onDelete={handleDeleteRancangan}
          onRefresh={loadRancangan}
          onUpdatePilar={async (rancanganId, pilarId, nominal) => {
            try {
              await RancanganPelayananService.updatePilarTarget(pilarId, nominal);
              toast.success('Nominal pilar berhasil diperbarui');
              await loadRancangan();
            } catch (error: any) {
              console.error('Error updating pilar:', error);
              toast.error('Gagal memperbarui nominal pilar');
            }
          }}
          onBantuSekarang={async (rancanganId, pilar, nominal) => {
            try {
              await RancanganPelayananService.addDukunganDonasi(rancanganId, pilar, nominal);
              toast.success('Bantuan berhasil ditambahkan');
              await loadRancangan();
            } catch (error: any) {
              console.error('Error adding dukungan:', error);
              toast.error('Gagal menambahkan bantuan');
            }
          }}
        />
      )}
        </>
        </TabsContent>
      </Tabs>

      {/* Batch Form Dialog */}
      <RancanganBatchFormDialog
        open={showBatchFormDialog}
        onOpenChange={setShowBatchFormDialog}
        onSuccess={() => {
          loadRancangan();
          setShowBatchFormDialog(false);
        }}
      />

      {/* Form Dialog */}
      <RancanganFormDialog
        open={showFormDialog}
        onOpenChange={setShowFormDialog}
        onSuccess={handleFormSuccess}
        editingRancangan={editingRancangan}
      />
    </div>
  );
};

export default RancanganPelayananSantri;

