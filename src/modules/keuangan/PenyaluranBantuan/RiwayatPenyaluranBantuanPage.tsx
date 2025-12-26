import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download } from 'lucide-react';
import { toast } from 'sonner';
import { PenyaluranBantuanService, PenyaluranFilters } from '@/services/penyaluranBantuan.service';
import SummaryCards from './components/SummaryCards';
import TrendChart from './components/TrendChart';
import CategoryDistributionChart from './components/CategoryDistributionChart';
import TopRecipientsChart from './components/TopRecipientsChart';
import RiwayatTable from './components/RiwayatTable';
import FilterBar from './components/FilterBar';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns';

const RiwayatPenyaluranBantuanPage: React.FC = () => {
  const [filters, setFilters] = useState<PenyaluranFilters>(() => {
    const now = new Date();
    // Default: 3 bulan terakhir
    return {
      startDate: format(startOfMonth(subMonths(now, 2)), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
    };
  });

  const [santriOptions, setSantriOptions] = useState<Array<{ id: string; nama_lengkap: string }>>(
    []
  );
  const [kategoriOptions, setKategoriOptions] = useState<string[]>([]);

  // Load santri options
  useEffect(() => {
    const loadSantriOptions = async () => {
      try {
        const { data, error } = await supabase
          .from('santri')
          .select('id, nama_lengkap')
          .eq('status', 'Aktif')
          .order('nama_lengkap', { ascending: true })
          .limit(100);

        if (error) throw error;
        setSantriOptions(data || []);
      } catch (error) {
        console.error('Error loading santri options:', error);
      }
    };

    loadSantriOptions();
  }, []);

  // Load kategori options from unified history
  useEffect(() => {
    const loadKategoriOptions = async () => {
      try {
        const history = await PenyaluranBantuanService.getUnifiedHistory({});
        const uniqueKategori = Array.from(
          new Set(history.map((h) => h.kategori).filter(Boolean))
        ).sort();
        setKategoriOptions(uniqueKategori);
      } catch (error) {
        console.error('Error loading kategori options:', error);
      }
    };

    loadKategoriOptions();
  }, []);

  // Fetch statistics
  const {
    data: statistics,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['penyaluran-statistics', filters],
    queryFn: () => PenyaluranBantuanService.getStatistics(filters),
  });

  // Fetch monthly trend
  const {
    data: monthlyTrend,
    isLoading: trendLoading,
    refetch: refetchTrend,
  } = useQuery({
    queryKey: ['penyaluran-trend', filters],
    queryFn: () => PenyaluranBantuanService.getMonthlyTrend(filters),
  });

  // Fetch category distribution
  const {
    data: categoryDistribution,
    isLoading: categoryLoading,
    refetch: refetchCategory,
  } = useQuery({
    queryKey: ['penyaluran-category', filters],
    queryFn: () => PenyaluranBantuanService.getCategoryDistribution(filters),
  });

  // Fetch top recipients
  const {
    data: topRecipients,
    isLoading: recipientsLoading,
    refetch: refetchRecipients,
  } = useQuery({
    queryKey: ['penyaluran-recipients', filters],
    queryFn: () => PenyaluranBantuanService.getTopRecipients(filters, 10),
  });

  // Fetch unified history
  const {
    data: history,
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ['penyaluran-history', filters],
    queryFn: () => PenyaluranBantuanService.getUnifiedHistory(filters),
  });

  const handleRefresh = () => {
    refetchStats();
    refetchTrend();
    refetchCategory();
    refetchRecipients();
    refetchHistory();
    toast.success('Data diperbarui');
  };

  const handleFilterChange = (newFilters: PenyaluranFilters) => {
    setFilters(newFilters);
  };

  const handleReset = () => {
    const now = new Date();
    // Reset to 3 bulan terakhir
    setFilters({
      startDate: format(startOfMonth(subMonths(now, 2)), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
    });
  };

  const handleExport = () => {
    toast.info('Fitur export akan segera tersedia');
  };

  const handleViewDetail = (item: any) => {
    // TODO: Implement detail view
    toast.info(`Detail: ${item.santri_nama} - ${item.kategori}`);
  };

  const isLoading =
    statsLoading || trendLoading || categoryLoading || recipientsLoading || historyLoading;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan Keuangan Yayasan</h1>
          <p className="text-sm text-gray-500 mt-1">
            Laporan lengkap pengeluaran yayasan: bantuan untuk santri dan operasional yayasan
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-9"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="h-9">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards statistics={statistics || {
        total_finansial: 0,
        total_barang: 0,
        total_operasional: 0,
        total_all: 0,
        total_santri: 0,
        rata_rata: 0,
        jumlah_transaksi: 0,
        by_kategori: {
          'Bantuan Langsung Yayasan': 0,
          'Operasional dan Konsumsi Santri': 0,
          'Pendidikan Formal': 0,
          'Pendidikan Pesantren': 0,
          'Operasional Yayasan': 0,
          'Lain-lain': 0,
        },
      }} loading={statsLoading} />

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TrendChart data={monthlyTrend || []} loading={trendLoading} />
        <CategoryDistributionChart
          data={categoryDistribution || []}
          loading={categoryLoading}
        />
      </div>

      {/* Top Recipients Chart */}
      <TopRecipientsChart data={topRecipients || []} loading={recipientsLoading} />

      {/* Filter Bar and Table Section */}
      <div className="space-y-4">
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          santriOptions={santriOptions}
          kategoriOptions={kategoriOptions}
          loading={isLoading}
        />
        <RiwayatTable
          data={history || []}
          loading={historyLoading}
          onViewDetail={handleViewDetail}
        />
      </div>
    </div>
  );
};

export default RiwayatPenyaluranBantuanPage;

