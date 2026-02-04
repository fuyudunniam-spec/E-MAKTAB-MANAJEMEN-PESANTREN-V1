import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  History,
  CreditCard, 
  PackageCheck, 
  AlertCircle,
  TrendingUp,
  DollarSign,
  Calendar
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import InputPembelian from './components/InputPembelian';
import RiwayatPembelian from './components/RiwayatPembelian';
import HutangList from './components/HutangList';
import PenerimaanBarangList from './components/PenerimaanBarangList';

export default function PembelianPage() {
  const [activeTab, setActiveTab] = useState('input');

  // Fetch hutang count
  const { data: hutangCount = 0 } = useQuery({
    queryKey: ['koperasi-hutang-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('kop_pembelian')
        .select('*', { count: 'exact', head: true })
        .in('status_pembayaran', ['hutang', 'cicilan'])
        .gt('sisa_hutang', 0);
      
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch jatuh tempo count
  const { data: jatuhTempoCount = 0 } = useQuery({
    queryKey: ['koperasi-jatuh-tempo-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('kop_pembelian')
        .select('*', { count: 'exact', head: true })
        .in('status_pembayaran', ['hutang', 'cicilan'])
        .lt('jatuh_tempo', new Date().toISOString())
        .gt('sisa_hutang', 0);
      
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch stats untuk summary cards
  const { data: stats } = useQuery({
    queryKey: ['koperasi-pembelian-stats'],
    queryFn: async () => {
      const { data: pembelianData, error } = await supabase
        .from('kop_pembelian')
        .select('total_pembelian, status_pembayaran, sisa_hutang')
        .gte('tanggal', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

      if (error) throw error;

      const totalPembelian = (pembelianData || []).reduce((sum, p) => sum + Number(p.total_pembelian || 0), 0);
      const totalHutang = (pembelianData || []).reduce((sum, p) => sum + Number(p.sisa_hutang || 0), 0);
      const totalLunas = (pembelianData || []).filter(p => p.status_pembayaran === 'lunas').length;

      return {
        totalPembelian,
        totalHutang,
        totalLunas,
        totalTransaksi: pembelianData?.length || 0,
      };
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pembelian & Kulakan</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola pembelian barang, hutang supplier, dan penerimaan barang
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-gray-200 bg-white shadow-sm hover:shadow transition-all overflow-hidden h-full">
          <CardContent className="p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Total Pembelian
              </p>
              <ShoppingCart className="h-4 w-4 text-gray-400 flex-shrink-0" />
            </div>
            <p className="text-xl font-bold text-gray-900 mb-2 truncate">
              {stats ? formatCurrency(stats.totalPembelian) : 'Rp 0'}
            </p>
            <p className="text-xs text-gray-500 mt-auto truncate">
              {stats?.totalTransaksi || 0} transaksi bulan ini
            </p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 bg-white shadow-sm hover:shadow transition-all overflow-hidden h-full">
          <CardContent className="p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Total Hutang
              </p>
              <CreditCard className="h-4 w-4 text-gray-400 flex-shrink-0" />
            </div>
            <p className={`text-xl font-bold mb-2 truncate ${stats && stats.totalHutang > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {stats ? formatCurrency(stats.totalHutang) : 'Rp 0'}
            </p>
            <p className="text-xs text-gray-500 mt-auto truncate">
              {hutangCount || 0} pembelian belum lunas
            </p>
          </CardContent>
        </Card>

        <Card className="border border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white shadow-sm hover:shadow transition-all overflow-hidden h-full">
          <CardContent className="p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">
                Pembelian Lunas
              </p>
              <TrendingUp className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            </div>
            <p className="text-xl font-bold text-emerald-700 mb-2 truncate">
              {stats?.totalLunas || 0}
            </p>
            <p className="text-xs text-gray-500 mt-auto truncate">
              {stats?.totalTransaksi ? `${Math.round((stats.totalLunas / stats.totalTransaksi) * 100)}% dari total` : '0% dari total'}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-amber-200 bg-gradient-to-br from-amber-50/50 to-white shadow-sm hover:shadow transition-all overflow-hidden h-full">
          <CardContent className="p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">
                Jatuh Tempo
              </p>
              <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
            </div>
            <p className={`text-xl font-bold mb-2 truncate ${jatuhTempoCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {jatuhTempoCount || 0}
            </p>
            <p className="text-xs text-gray-500 mt-auto truncate">
              {jatuhTempoCount > 0 ? 'Perlu perhatian segera' : 'Semua pembayaran tepat waktu'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alert Jatuh Tempo */}
      {jatuhTempoCount > 0 && (
        <Card className="border border-red-200 bg-gradient-to-r from-red-50/50 to-orange-50/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-500 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-red-900">
                  {jatuhTempoCount} Hutang Jatuh Tempo!
                </p>
                <p className="text-sm text-red-700 mt-0.5">
                  Segera lakukan pembayaran untuk menghindari denda
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('hutang')}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Lihat Detail
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="input" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px] bg-gray-100">
          <TabsTrigger 
            value="input" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Input Pembelian</span>
          </TabsTrigger>
          <TabsTrigger 
            value="riwayat" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <History className="h-4 w-4" />
            <span>Riwayat Pembelian</span>
          </TabsTrigger>
          <TabsTrigger 
            value="hutang" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <CreditCard className="h-4 w-4" />
            <span>Hutang</span>
            {hutangCount > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0">{hutangCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="penerimaan" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <PackageCheck className="h-4 w-4" />
            <span>Penerimaan</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="mt-6">
          <InputPembelian />
        </TabsContent>

        <TabsContent value="riwayat" className="mt-6">
          <RiwayatPembelian />
        </TabsContent>

        <TabsContent value="hutang" className="mt-6">
          <HutangList />
        </TabsContent>

        <TabsContent value="penerimaan" className="mt-6">
          <PenerimaanBarangList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
