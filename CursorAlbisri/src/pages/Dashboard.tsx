import { useState, useEffect } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Users,
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  GraduationCap,
  Store,
  AlertCircle,
  FileText,
  CreditCard,
  Leaf
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";

// Services
import { AkunKasService } from "@/services/akunKas.service";
import { TagihanService } from "@/services/tagihan.service";
import { PerizinanSantriService } from "@/services/perizinanSantri.service";
import { getLabaRugiReport } from "@/services/laporanKoperasi.service";
import { supabase } from "@/integrations/supabase/client";

// --- Components ---

const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, color = "primary" }: any) => (
  <Card className="border border-border/50 shadow-soft hover:shadow-medium transition-all duration-300 bg-white">
    <CardContent className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl bg-${color}/10 text-${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${trend === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
            {trendValue}
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
        <h3 className="text-3xl font-bold font-heading text-foreground tracking-tight">{value}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>}
      </div>
    </CardContent>
  </Card>
);

const SectionHeader = ({ title, description, action }: any) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
    <div>
      <h2 className="text-xl font-bold font-heading text-foreground">{title}</h2>
      {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
    </div>
    {action}
  </div>
);

// --- Main Dashboard Component ---

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);

  // State for Metrics
  const [financeStats, setFinanceStats] = useState({
    totalLiquid: 0,
    operational: 0,
    savings: 0,
    collectionRate: 0,
    unpaidAmount: 0
  });

  const [academicStats, setAcademicStats] = useState({
    totalSantri: 0,
    activePermits: 0,
    attendanceRate: 0, // Placeholder for now
    permitsList: [] as any[]
  });

  const [businessStats, setBusinessStats] = useState({
    dailyTurnover: 0,
    profitMargin: 0,
    totalTransactions: 0
  });

  useEffect(() => {
    if (authLoading) return;
    fetchDashboardData();
  }, [authLoading]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const todayStr = today.toISOString().split('T')[0];

      // 1. Finance Data
      const balanceData = await AkunKasService.getUnifiedBalance();
      const tagihanStats = await TagihanService.getTagihanStats();
      const collectionRate = tagihanStats.total_tagihan > 0
        ? ((tagihanStats.total_dibayar / tagihanStats.total_tagihan) * 100)
        : 0;

      // 2. Academic Data
      // Get total santri active
      const { count: totalSantri } = await supabase
        .from('santri')
        .select('*', { count: 'exact', head: true })
        .eq('status_santri', 'Aktif');

      // Get active permits (Approved and currently ongoing)
      const { data: activePermits } = await supabase
        .from('perizinan_santri')
        .select('*')
        .eq('status', 'approved')
        .lte('tanggal_mulai', todayStr)
        .gte('tanggal_selesai', todayStr);

      // 3. Business Data (Koperasi)
      // Get today's sales
      const { data: todaysSales } = await supabase
        .from('kop_penjualan')
        .select('total_transaksi')
        .eq('status_pembayaran', 'lunas')
        .gte('created_at', todayStr + 'T00:00:00')
        .lte('created_at', todayStr + 'T23:59:59');

      const dailyTurnover = todaysSales?.reduce((sum, sale) => sum + (Number(sale.total_transaksi) || 0), 0) || 0;

      // Update States
      setFinanceStats({
        totalLiquid: balanceData.grandTotal,
        operational: balanceData.totalOperational,
        savings: balanceData.totalTabunganSantri, // Note: Service might return 0 if not implemented, check service
        collectionRate,
        unpaidAmount: tagihanStats.total_sisa
      });

      setAcademicStats({
        totalSantri: totalSantri || 0,
        activePermits: activePermits?.length || 0,
        attendanceRate: 98.5, // Mockup for now until presensi service is fully integrated
        permitsList: activePermits || []
      });

      setBusinessStats({
        dailyTurnover,
        profitMargin: 15, // Estimate
        totalTransactions: todaysSales?.length || 0
      });

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-96 w-full md:col-span-2" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <div className="border-b border-border bg-white px-6 py-5 sticky top-0 z-30 shadow-sm/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-heading text-primary tracking-tight">Executive Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Operasional Hari Ini &bull; {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-border text-foreground hover:bg-secondary/10" onClick={() => fetchDashboardData()}>
              Refresh Data
            </Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft">
              <span className="mr-2">+</span> Quick Action
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Top Row: Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Finance KPI */}
          <StatCard
            title="Total Liquid Assets"
            value={formatRupiah(financeStats.totalLiquid)}
            subtitle="Termasuk Kas & Bank Operasional"
            icon={Wallet}
            color="emerald"
            trend="up"
            trendValue="+2.4% vs Last Month"
          />

          {/* Academic KPI */}
          <StatCard
            title="Kehadiran Santri"
            value={`${academicStats.attendanceRate}%`}
            subtitle={`${academicStats.totalSantri - academicStats.activePermits} Hadir dari ${academicStats.totalSantri} Santri`}
            icon={GraduationCap}
            color="blue"
            trend="down" // Mock
            trendValue="1.5% Absensi"
          />

          {/* Business KPI */}
          <StatCard
            title="Omset Bisnis Harian"
            value={formatRupiah(businessStats.dailyTurnover)}
            subtitle={`${businessStats.totalTransactions} Transaksi Hari Ini`}
            icon={Store}
            color="amber"
            trend="up"
            trendValue="+12% vs Yesterday"
          />
        </div>

        {/* Middle Section: Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column: Financial Health (Wide) */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-border/50 shadow-soft bg-white h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-heading text-lg">Financial Composition</CardTitle>
                    <CardDescription>Breakdown aset dan efektivitas penagihan</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon"><MoreHorizontal className="w-5 h-5" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {/* Asset Breakdown */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Distribusi Aset</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-foreground">Dana Operasional</span>
                          <span className="font-bold text-emerald-700">{formatRupiah(financeStats.operational)}</span>
                        </div>
                        <Progress value={(financeStats.operational / financeStats.totalLiquid) * 100} className="h-2 bg-emerald-100" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-foreground">Tabungan Santri (Restricted)</span>
                          <span className="font-bold text-blue-700">{formatRupiah(financeStats.savings)}</span>
                        </div>
                        <Progress value={(financeStats.savings / financeStats.totalLiquid) * 100} className="h-2 bg-blue-100" />
                      </div>
                    </div>
                  </div>

                  {/* Collection Stats */}
                  <div className="space-y-4 bg-secondary/5 p-4 rounded-xl border border-secondary/20">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <CreditCard className="w-4 h-4" /> Collection Rate
                    </h4>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-bold font-heading text-secondary-foreground">{financeStats.collectionRate.toFixed(1)}%</span>
                      <span className="text-sm text-muted-foreground mb-1">Terbayar bulan ini</span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Outstanding Amount</p>
                      <p className="font-bold text-rose-600">{formatRupiah(financeStats.unpaidAmount)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Alerts & Operational Status */}
          <div className="space-y-6">
            <Card className="border border-border/50 shadow-soft bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  Operational Attention
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Active Permits List */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Izin / Sakit ({academicStats.activePermits})</p>
                  {academicStats.activePermits === 0 ? (
                    <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm text-center">
                      Semua santri lengkap di asrama
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin">
                      {academicStats.permitsList.map((permit: any) => (
                        <div key={permit.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                          <div>
                            <span className="font-medium block">{permit.santri?.nama_lengkap || 'Santri'}</span>
                            <span className="text-xs text-muted-foreground">{permit.jenis} &bull; {format(new Date(permit.tanggal_selesai), 'dd MMM')}</span>
                          </div>
                          <Badge variant="outline" className="text-xs border-amber-200 bg-amber-50 text-amber-700">Away</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-dashed border-gray-200">
                  <Button variant="ghost" className="w-full text-xs text-muted-foreground h-8">
                    View All Notifications
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Modules Links */}
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto py-3 flex flex-col gap-2 bg-white hover:bg-primary/5 hover:border-primary/30 transition-all group" onClick={() => navigate('/keuangan-v3')}>
                <Wallet className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium">Finance</span>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex flex-col gap-2 bg-white hover:bg-primary/5 hover:border-primary/30 transition-all group" onClick={() => navigate('/akademik')}>
                <GraduationCap className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium">Academic</span>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex flex-col gap-2 bg-white hover:bg-primary/5 hover:border-primary/30 transition-all group" onClick={() => navigate('/koperasi')}>
                <Store className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium">Koperasi</span>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex flex-col gap-2 bg-white hover:bg-primary/5 hover:border-primary/30 transition-all group" onClick={() => navigate('/santri')}>
                <Users className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium">Santri</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Section: Footer or Additional Metrcs */}
        <div className="flex items-center justify-center p-6 text-sm text-muted-foreground/60">
          <Leaf className="w-4 h-4 mr-2 text-primary/40" />
          Sistem Informasi Manajemen Pesantren Al-Bisri v2.0 &bull; Designed for Efficiency
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
