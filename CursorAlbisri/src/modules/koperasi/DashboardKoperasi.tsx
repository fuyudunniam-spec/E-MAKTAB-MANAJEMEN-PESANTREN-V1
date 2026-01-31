import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  DollarSign,
  CreditCard,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { koperasiService } from '@/services/koperasi.service';

const DashboardKoperasi = () => {
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['koperasi-dashboard-stats'],
    queryFn: () => koperasiService.getDashboardStats(),
    staleTime: 60000
  });

  const { data: produkData } = useQuery({
    queryKey: ['koperasi-produk'],
    queryFn: () => koperasiService.getProduk(),
    staleTime: 30000
  });

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Calculate low stock products
  const lowStockProducts = produkData?.filter((p: any) => (p.stok || 0) <= (p.stok_minimum || 5)) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard Koperasi</h1>
        <p className="text-muted-foreground">Ringkasan kesehatan finansial Santra Mart</p>
      </div>

      {/* Financial Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Omzet</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statsLoading ? '...' : formatRupiah(stats?.penjualan_hari_ini || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Penjualan hari ini</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">HPP Yayasan</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {statsLoading ? '...' : formatRupiah(stats?.hpp_yayasan || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Wajib setor ke Yayasan</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Koperasi</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {statsLoading ? '...' : formatRupiah(stats?.kas_koperasi || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Margin bersih</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transaksi</CardTitle>
            <ShoppingCart className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {statsLoading ? '...' : stats?.total_transaksi_hari_ini || 0}
            </div>
            <p className="text-xs text-muted-foreground">Hari ini</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Simplified to 4 */}
      <Card>
        <CardHeader>
          <CardTitle>Aksi Cepat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 hover:border-primary"
              onClick={() => navigate('/koperasi/master')}
            >
              <Package className="h-6 w-6" />
              <span className="text-sm">Produk & Stok</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 hover:border-primary"
              onClick={() => navigate('/koperasi/kasir')}
            >
              <CreditCard className="h-6 w-6" />
              <span className="text-sm">Kasir/POS</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 hover:border-primary"
              onClick={() => navigate('/koperasi/penjualan')}
            >
              <ShoppingCart className="h-6 w-6" />
              <span className="text-sm">Riwayat Penjualan</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 hover:border-primary"
              onClick={() => navigate('/koperasi/keuangan')}
            >
              <DollarSign className="h-6 w-6" />
              <span className="text-sm">Keuangan & Laporan</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-amber-800">Peringatan Stok Rendah</CardTitle>
            </div>
            <Badge variant="outline" className="text-amber-700 border-amber-300">
              {lowStockProducts.length} produk
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockProducts.slice(0, 5).map((produk: any) => (
                <div
                  key={produk.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white border"
                >
                  <div>
                    <p className="font-medium">{produk.nama_produk}</p>
                    <p className="text-sm text-muted-foreground">
                      Stok: <span className="font-semibold text-amber-600">{produk.stok || 0}</span> {produk.satuan || 'pcs'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate('/koperasi/master')}
                    className="text-amber-700"
                  >
                    Update <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardKoperasi;




