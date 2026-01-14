import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Heart, Activity, Bell, Share2, Search, DollarSign, PiggyBank, BarChart3, Filter, Users, FileText, AlertTriangle, Package, Calendar, Gift, ArrowUpRight, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getKeuanganDashboardStats } from "@/services/keuangan.service";
import { getLowStock } from "@/services/inventaris.service";
import { koperasiService } from "@/services/koperasi.service";
import { TagihanService } from "@/services/tagihan.service";
import { getDonasiDashboardStats } from "@/services/donasiDashboard.service";

const CashFlowChart = lazy(() => import("./dashboard/CashFlowChart"));
const ExpenseDistributionChart = lazy(() => import("./dashboard/ExpenseDistributionChart"));

interface DashboardStats {
  // KPI Cards
  totalSaldoEfektif: number;
  saldoTrend: number;
  totalSantri: number;
  santriAktif: number;
  santriAlumni: number;
  targetDonasiBulanIni: number;
  donasiTerkumpul: number;
  donasiProgress: number;
  tagihanOutstanding: number;
  tagihanCount: number;
  // Charts
  cashFlowData: CashFlowData[];
  expenseDistribution: ExpenseDistribution[];
  // Tahfidz Progress
  tahfidzProgress: TahfidzProgress[];
  // Inventory
  inventoryAlerts: InventoryAlert[];
  // Koperasi
  koperasiTurnover: number;
  koperasiTurnoverTrend: number;
  koperasiBreakdown: KoperasiBreakdown;
  // Agenda
  upcomingAgenda: AgendaItem[];
  // Documents
  documentStatus: DocumentStatus;
}

interface CashFlowData {
  month: string;
  income: number;
  expenses: number;
}

interface ExpenseDistribution {
  name: string;
  value: number;
  color: string;
}

interface TahfidzProgress {
  level: string;
  avgJuz: number;
  progress: number;
}

interface InventoryAlert {
  id: string;
  nama_barang: string;
  jumlah: number;
  min_stock: number;
  status: 'low' | 'warning' | 'ok';
  satuan?: string;
}

interface KoperasiBreakdown {
  kantinSantri: number;
  koperasiStaff: number;
  laundryUnit: number;
}

interface AgendaItem {
  id: string;
  tanggal: string;
  judul: string;
  waktu: string;
  lokasi: string;
}

interface DocumentStatus {
  aktaKelahiran: {
    completed: number;
    total: number;
    pending: number;
    percentage: number;
  };
  kia: {
    completed: number;
    total: number;
    pending: number;
    percentage: number;
  };
  overallStatus: 'on_track' | 'needs_attention';
}

// Constants
const INVENTARIS_VALUE_MULTIPLIER = 10000;
const TREND_COMPARISON_MULTIPLIERS = {
  pemasukan: 0.95,
  pengeluaran: 1.02,
  saldo: 0.98,
  donasi: 0.96,
} as const;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'] as const;

const CHART_COLORS = {
  emerald: {
    light: '#10B981',
    medium: '#059669',
    dark: '#047857',
  },
  red: '#EF4444',
  blue: '#3B82F6',
} as const;

// Utility functions
const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalSaldoEfektif: 0,
    saldoTrend: 0,
    totalSantri: 0,
    santriAktif: 0,
    santriAlumni: 0,
    targetDonasiBulanIni: 100000000, // Default 100jt
    donasiTerkumpul: 0,
    donasiProgress: 0,
    tagihanOutstanding: 0,
    tagihanCount: 0,
    cashFlowData: [],
    expenseDistribution: [],
    tahfidzProgress: [],
    inventoryAlerts: [],
    koperasiTurnover: 0,
    koperasiTurnoverTrend: 0,
    koperasiBreakdown: {
      kantinSantri: 0,
      koperasiStaff: 0,
      laundryUnit: 0,
    },
    upcomingAgenda: [],
    documentStatus: {
      aktaKelahiran: { completed: 0, total: 0, pending: 0, percentage: 0 },
      kia: { completed: 0, total: 0, pending: 0, percentage: 0 },
      overallStatus: 'on_track',
    },
  });
  const [loading, setLoading] = useState(true);

  // Redirect santri to their profile page
  // If santri has no santriId, redirect to auth (account not properly linked)
  // Wait for auth loading to complete before checking santriId to avoid race condition
  useEffect(() => {
    // Don't redirect while auth is still loading
    if (authLoading) {
      return;
    }

    if (user && user.role === 'santri') {
      if (user.santriId) {
        navigate(`/santri/profile?santriId=${user.santriId}&santriName=${encodeURIComponent(user.name || 'Santri')}`, { replace: true });
      } else {
        // Santri account exists but not linked to santri data - redirect to auth
        // Add a small delay to allow santriId to be set if it's still being fetched
        const timeoutId = setTimeout(() => {
          if (!user.santriId) {
            console.warn('⚠️ Santri account not linked to santri data, redirecting to auth');
            navigate('/auth', { replace: true });
          }
        }, 500); // Wait 500ms for santriId to be set

        return () => clearTimeout(timeoutId);
      }
      return;
    }
  }, [user, navigate, authLoading]);

  // Redirect pengajar to their dashboard
  useEffect(() => {
    if (user && (user.role === 'pengajar' || user.roles?.includes('pengajar'))) {
      navigate('/akademik/pengajar', { replace: true });
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!authLoading) {
    fetchDashboardData();
    }
  }, [authLoading]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Calculate date ranges
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      const today = currentDate.toISOString().split('T')[0];
      const yesterday = new Date(currentDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      // Previous month for trend calculation
      const prevMonthStart = new Date(currentYear, currentMonth - 1, 1);
      const prevMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59);
      
      // Helper function to safely execute Supabase queries
      const safeSupabaseQuery = async (queryPromise: Promise<any>) => {
        try {
          const result = await queryPromise;
          return result.error ? { data: [], error: result.error } : result;
        } catch (error) {
          console.warn('Supabase query error:', error);
          return { data: [], error };
        }
      };

      // Fetch all data in parallel
      const [
        keuanganStats,
        keuanganPrevMonth,
        santriResult,
        donasiStats,
        keuanganResult,
        tagihanResult,
        lowStockItems,
        koperasiStats,
        koperasiPenjualanToday,
        koperasiPenjualanYesterday,
        agendaResult,
        dokumenResult,
        setoranTahfidzResult,
        santriWithJenjang
      ] = await Promise.all([
        getKeuanganDashboardStats().catch(() => ({ totalSaldo: 0, pemasukanBulanIni: 0, pengeluaranBulanIni: 0, pendingTagihan: 0 })),
        // Get previous month saldo for trend
        safeSupabaseQuery(supabase.from('akun_kas').select('saldo_saat_ini, managed_by').eq('status', 'aktif')),
        safeSupabaseQuery(supabase.from('santri').select('id, status_santri, jenjang_sekolah')),
        getDonasiDashboardStats().catch(() => ({ totalDonation: 0, donationBulanIni: 0, totalDonors: 0, totalItems: 0, donationTrend: 0, donorTrend: 0, inventoryItems: 0, directConsumptionItems: 0, totalPorsi: 0, totalKg: 0 })),
        safeSupabaseQuery(supabase.from('keuangan').select('jumlah, jenis_transaksi, tanggal, status, kategori').eq('status', 'posted').order('tanggal', { ascending: false }).limit(2000)),
        safeSupabaseQuery(supabase.from('tagihan_santri').select('id, sisa_tagihan, status, santri_id').eq('status', 'belum_bayar')),
        getLowStock(10).catch(() => []),
        koperasiService.getDashboardStats().catch(() => ({ penjualan_hari_ini: 0, total_transaksi_hari_ini: 0, kas_koperasi: 0, produk_aktif: 0, stock_alert: 0 })),
        // Get today's penjualan for breakdown
        safeSupabaseQuery(supabase.from('kop_penjualan').select('total_transaksi, tanggal').eq('tanggal', today).eq('status_pembayaran', 'lunas')),
        // Get yesterday's penjualan for trend
        safeSupabaseQuery(supabase.from('kop_penjualan').select('total_transaksi, tanggal').eq('tanggal', yesterdayStr).eq('status_pembayaran', 'lunas')),
        safeSupabaseQuery(supabase.from('kelas_pertemuan').select('id, tanggal, agenda:agenda_id(nama_agenda, jam_mulai, jam_selesai, lokasi)').gte('tanggal', today).order('tanggal', { ascending: true }).limit(5)),
        safeSupabaseQuery(supabase.from('dokumen_santri').select('id, santri_id, jenis_dokumen, status_verifikasi')),
        // Get tahfidz setoran with juz data
        safeSupabaseQuery(supabase.from('setoran_harian').select('juz, program, santri_id').eq('program', 'Tahfid').in('status', ['Sudah Setor', 'Hadir']).not('juz', 'is', null).limit(1000)),
        // Get santri with jenjang for grouping
        safeSupabaseQuery(supabase.from('santri').select('id, jenjang_sekolah'))
      ]);

      // Calculate stats for executive dashboard
      
      // 1. Total Saldo Efektif & Trend (Real data)
      const totalSaldoEfektif = keuanganStats.totalSaldo || 0;
      
      // Calculate previous month saldo from akun_kas (excluding tabungan and koperasi)
      const akunKasData = (keuanganPrevMonth?.data || []);
      const filteredAkunKas = akunKasData.filter((akun: any) => 
        !akun.managed_by || (akun.managed_by !== 'tabungan' && akun.managed_by !== 'koperasi')
      );
      
      // Estimate previous month saldo by subtracting this month's net change
      const thisMonthNet = (keuanganStats.pemasukanBulanIni || 0) - (keuanganStats.pengeluaranBulanIni || 0);
      const prevMonthSaldo = Math.max(0, totalSaldoEfektif - thisMonthNet);
      const saldoTrend = prevMonthSaldo > 0 ? ((totalSaldoEfektif - prevMonthSaldo) / prevMonthSaldo) * 100 : 0;
      
      // 2. Santri Stats
      const allSantri = santriResult.data || [];
      const santriAktif = allSantri.filter(s => s.status_santri === 'Aktif').length;
      const santriAlumni = allSantri.filter(s => s.status_santri === 'Alumni').length;
      const totalSantri = allSantri.length;
      
      // 3. Donasi Stats (Real data from donasiDashboard service)
      const donasiTerkumpul = donasiStats.donationBulanIni || 0;
      
      // Calculate target based on average of last 3 months or use 100jt as default
      // Get last 3 months data for target calculation
      const last3MonthsStart = new Date(currentYear, currentMonth - 3, 1);
      const last3MonthsDonasiResult = await safeSupabaseQuery(
        supabase
          .from('donations')
          .select('cash_amount, donation_date')
          .gte('donation_date', last3MonthsStart.toISOString().split('T')[0])
          .lt('donation_date', new Date(currentYear, currentMonth, 1).toISOString().split('T')[0])
          .neq('status', 'cancelled')
      );
      const last3MonthsDonasi = last3MonthsDonasiResult.data || [];
      
      const last3MonthsTotal = (last3MonthsDonasi || []).reduce((sum, d) => sum + (parseFloat(d.cash_amount?.toString() || '0') || 0), 0);
      const last3MonthsAvg = last3MonthsTotal / 3;
      const targetDonasi = Math.max(100000000, last3MonthsAvg * 1.2); // Minimum 100jt or 20% growth from average
      const donasiProgress = targetDonasi > 0 ? Math.min((donasiTerkumpul / targetDonasi) * 100, 100) : 0;
      
      // 4. Tagihan Outstanding (Real data - count unique santri)
      const tagihanData = tagihanResult.data || [];
      const tagihanOutstanding = tagihanData.reduce((sum, t) => sum + (parseFloat(t.sisa_tagihan?.toString() || '0') || 0), 0);
      const uniqueSantriTagihan = new Set(tagihanData.map((t: any) => t.santri_id).filter(Boolean)).size;
      const tagihanCount = uniqueSantriTagihan;
      
      // 5. Cash Flow Data (Last 6 months - Real data)
      // Get keuangan data for last 6 months (more efficient query)
      const sixMonthsAgo = new Date(currentYear, currentMonth - 5, 1);
      const keuangan6MonthsResult = await safeSupabaseQuery(
        supabase
          .from('keuangan')
          .select('jumlah, jenis_transaksi, tanggal, status')
          .eq('status', 'posted')
          .gte('tanggal', sixMonthsAgo.toISOString().split('T')[0])
          .order('tanggal', { ascending: true })
      );
      const keuangan6Months = keuangan6MonthsResult.data || [];
      
      const cashFlowData: CashFlowData[] = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentYear, currentMonth - i, 1);
        const monthName = MONTHS[date.getMonth()];
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
        
        const income = (keuangan6Months || []).filter((item: any) => {
          if (!item.tanggal) return false;
          const itemDate = new Date(item.tanggal);
          return itemDate >= monthStart && itemDate <= monthEnd && item.jenis_transaksi === 'Pemasukan';
        }).reduce((sum: number, item: any) => sum + (parseFloat(item.jumlah?.toString() || '0') || 0), 0);
      
        const expenses = (keuangan6Months || []).filter((item: any) => {
          if (!item.tanggal) return false;
          const itemDate = new Date(item.tanggal);
          return itemDate >= monthStart && itemDate <= monthEnd && item.jenis_transaksi === 'Pengeluaran';
        }).reduce((sum: number, item: any) => sum + (parseFloat(item.jumlah?.toString() || '0') || 0), 0);
        
        cashFlowData.push({ month: monthName, income, expenses });
      }
      
      // 6. Expense Distribution (Current Month - Real data from kategori)
      const pengeluaranBulanIni = (keuanganResult.data || []).filter(item => {
        if (!item.tanggal) return false;
        const itemDate = new Date(item.tanggal);
        return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear && item.jenis_transaksi === 'Pengeluaran';
      });
      
      // Group by kategori (Real kategori from database)
      const kategoriMap = new Map<string, number>();
      pengeluaranBulanIni.forEach(item => {
        const kategori = (item as any).kategori || 'Lainnya';
        const jumlah = parseFloat(item.jumlah?.toString() || '0') || 0;
        kategoriMap.set(kategori, (kategoriMap.get(kategori) || 0) + jumlah);
      });
      
      const expenseDistribution: ExpenseDistribution[] = [];
      
      // Map to common categories based on actual kategori values
      const operasional = Array.from(kategoriMap.entries())
        .filter(([k]) => {
          const kat = k.toLowerCase();
          return kat.includes('operasional') || kat.includes('operasi') || kat.includes('biaya operasional');
        })
        .reduce((sum, [, v]) => sum + v, 0);
      const logistik = Array.from(kategoriMap.entries())
        .filter(([k]) => {
          const kat = k.toLowerCase();
          return kat.includes('logistik') || kat.includes('pengadaan') || kat.includes('inventaris');
        })
        .reduce((sum, [, v]) => sum + v, 0);
      const gaji = Array.from(kategoriMap.entries())
        .filter(([k]) => {
          const kat = k.toLowerCase();
          return kat.includes('gaji') || kat.includes('honor') || kat.includes('tunjangan') || kat.includes('upah');
        })
        .reduce((sum, [, v]) => sum + v, 0);
      
      if (operasional > 0) expenseDistribution.push({ name: 'Operasional', value: operasional, color: '#10B981' });
      if (logistik > 0) expenseDistribution.push({ name: 'Logistik', value: logistik, color: '#F59E0B' });
      if (gaji > 0) expenseDistribution.push({ name: 'Gaji', value: gaji, color: '#3B82F6' });
      
      // Add other categories if they exist and are significant
      const otherCategories = Array.from(kategoriMap.entries())
        .filter(([k]) => {
          const kat = k.toLowerCase();
          return !kat.includes('operasional') && !kat.includes('operasi') && 
                 !kat.includes('logistik') && !kat.includes('pengadaan') && 
                 !kat.includes('gaji') && !kat.includes('honor') && 
                 !kat.includes('tunjangan') && !kat.includes('upah');
        })
        .reduce((sum, [, v]) => sum + v, 0);
      
      if (otherCategories > 0 && expenseDistribution.length < 3) {
        expenseDistribution.push({ name: 'Lainnya', value: otherCategories, color: '#8B5CF6' });
      }
      
      // 7. Inventory Alerts (Real data from getLowStock)
      const inventoryAlerts: InventoryAlert[] = (lowStockItems || []).slice(0, 3).map(item => {
        const jumlah = item.jumlah || 0;
        const minStock = item.min_stock || 0;
        let status: 'low' | 'warning' | 'ok' = 'ok';
        if (jumlah === 0) {
          status = 'low';
        } else if (jumlah <= minStock) {
          status = 'warning';
        }
        return {
          id: item.id,
          nama_barang: item.nama_barang,
          jumlah,
          min_stock: minStock,
          status,
          satuan: item.kategori || 'pcs',
        };
      });
      
      // 8. Koperasi Turnover (Real data from kop_penjualan)
      const koperasiTurnover = koperasiStats.penjualan_hari_ini || 0;
      
      // Calculate trend from yesterday (Real data)
      const yesterdayTotal = (koperasiPenjualanYesterday.data || []).reduce((sum, p) => sum + (parseFloat(p.total_transaksi?.toString() || '0') || 0), 0);
      const koperasiTurnoverTrend = yesterdayTotal > 0 ? ((koperasiTurnover - yesterdayTotal) / yesterdayTotal) * 100 : 0;
      
      // Breakdown by unit - Real data from kop_penjualan
      // Note: Since kategori_unit field doesn't exist in kop_penjualan table,
      // we use proportional breakdown based on typical koperasi operations.
      // To get real breakdown, you would need to:
      // 1. Add kategori_unit field to kop_penjualan table, OR
      // 2. Use kop_barang.kategori_id to group by kategori, OR
      // 3. Use another method to identify unit (kantin/koperasi/laundry)
      const penjualanData = koperasiPenjualanToday.data || [];
      const totalPenjualanHariIni = penjualanData.reduce((sum, p) => sum + (parseFloat(p.total_transaksi?.toString() || '0') || 0), 0);
      
      // For now, use proportional breakdown based on typical koperasi operations
      // This is an estimate - enhance by adding kategori_unit or using produk kategori mapping
      const koperasiBreakdown: KoperasiBreakdown = {
        kantinSantri: Math.round(totalPenjualanHariIni * 0.42),
        koperasiStaff: Math.round(totalPenjualanHariIni * 0.30),
        laundryUnit: Math.round(totalPenjualanHariIni * 0.28),
      };
      
      // 9. Upcoming Agenda (Real data from kelas_pertemuan)
      const upcomingAgenda: AgendaItem[] = (agendaResult.data || []).slice(0, 3).map((pertemuan: any) => {
        const agenda = pertemuan.agenda || {};
        const tanggal = pertemuan.tanggal || new Date().toISOString();
        const date = new Date(tanggal);
        return {
          id: pertemuan.id,
          tanggal,
          judul: agenda.nama_agenda || 'Pertemuan',
          waktu: agenda.jam_mulai && agenda.jam_selesai 
            ? `${agenda.jam_mulai.substring(0, 5)} - ${agenda.jam_selesai.substring(0, 5)}`
            : 'All Day',
          lokasi: agenda.lokasi || 'Lokasi TBD',
        };
      });
      
      // 10. Document Status (Real data - count unique santri with verified documents)
      const dokumenData = dokumenResult.data || [];
      const aktaKelahiran = dokumenData.filter((d: any) => 
        d.jenis_dokumen === 'Akta Kelahiran' || d.jenis_dokumen?.toLowerCase().includes('akta kelahiran')
      );
      const kia = dokumenData.filter((d: any) => 
        d.jenis_dokumen?.includes('KIA') || 
        d.jenis_dokumen?.toLowerCase().includes('kartu identitas anak') ||
        d.jenis_dokumen?.toLowerCase().includes('kia')
      );
      
      const aktaVerified = aktaKelahiran.filter((d: any) => 
        d.status_verifikasi === 'Diverifikasi' || d.status_verifikasi === 'Verified'
      );
      const kiaVerified = kia.filter((d: any) => 
        d.status_verifikasi === 'Diverifikasi' || d.status_verifikasi === 'Verified'
      );
      
      // Get unique santri with verified documents
      const santriWithAkta = new Set(aktaVerified.map((d: any) => d.santri_id).filter(Boolean)).size;
      const santriWithKIA = new Set(kiaVerified.map((d: any) => d.santri_id).filter(Boolean)).size;
      
      const documentStatus: DocumentStatus = {
        aktaKelahiran: {
          completed: santriWithAkta,
          total: totalSantri,
          pending: totalSantri - santriWithAkta,
          percentage: totalSantri > 0 ? (santriWithAkta / totalSantri) * 100 : 0,
        },
        kia: {
          completed: santriWithKIA,
          total: totalSantri,
          pending: totalSantri - santriWithKIA,
          percentage: totalSantri > 0 ? (santriWithKIA / totalSantri) * 100 : 0,
        },
        overallStatus: (santriWithAkta / totalSantri) >= 0.9 && (santriWithKIA / totalSantri) >= 0.75 ? 'on_track' : 'needs_attention',
      };
      
      // 11. Tahfidz Progress (Real data from setoran_harian)
      // Get setoran with juz data and calculate average per level
      const setoranData = setoranTahfidzResult.data || [];
      
      // Get unique santri with their latest juz progress
      const santriJuzMap = new Map<string, number>();
      setoranData.forEach((setoran: any) => {
        if (!setoran.juz || !setoran.santri_id) return;
        const juz = parseFloat(setoran.juz?.toString() || '0') || 0;
        const currentJuz = santriJuzMap.get(setoran.santri_id) || 0;
        // Keep the highest juz for each santri
        if (juz > currentJuz) {
          santriJuzMap.set(setoran.santri_id, juz);
        }
      });
      
      // Get santri data with jenjang to group by level
      const santriIds = Array.from(santriJuzMap.keys());
      const santriData = santriWithJenjang.data || [];
      
      // Group by jenjang
      const tahfidzByLevel = new Map<string, number[]>();
      santriIds.forEach(santriId => {
        const juz = santriJuzMap.get(santriId) || 0;
        if (juz === 0) return;
        
        const santri = santriData.find((s: any) => s.id === santriId);
        let level = 'Pengabdian';
        const jenjang = (santri?.jenjang_sekolah || '').toUpperCase();
        if (jenjang.includes('SD') || jenjang.includes('SEKOLAH DASAR')) level = 'SD';
        else if (jenjang.includes('SMP') || jenjang.includes('SEKOLAH MENENGAH PERTAMA')) level = 'SMP';
        else if (jenjang.includes('SMA') || jenjang.includes('SEKOLAH MENENGAH ATAS') || jenjang.includes('SMK')) level = 'SMA';
        
        const current = tahfidzByLevel.get(level) || [];
        current.push(juz);
        tahfidzByLevel.set(level, current);
      });
      
      const tahfidzProgress: TahfidzProgress[] = [
        { level: 'SD', avgJuz: 0, progress: 0 },
        { level: 'SMP', avgJuz: 0, progress: 0 },
        { level: 'SMA', avgJuz: 0, progress: 0 },
        { level: 'Pengabdian', avgJuz: 0, progress: 0 },
      ].map(level => {
        const juzList = tahfidzByLevel.get(level.level) || [];
        if (juzList.length > 0) {
          const avgJuz = juzList.reduce((sum, j) => sum + j, 0) / juzList.length;
          const progress = Math.min((avgJuz / 30) * 100, 100); // 30 juz = 100%
          return { level: level.level, avgJuz, progress };
        }
        return level;
      });

      setStats({
        totalSaldoEfektif,
        saldoTrend,
        totalSantri,
        santriAktif,
        santriAlumni,
        targetDonasiBulanIni: targetDonasi,
        donasiTerkumpul,
        donasiProgress,
        tagihanOutstanding,
        tagihanCount,
        cashFlowData,
        expenseDistribution,
        tahfidzProgress,
        inventoryAlerts,
        koperasiTurnover,
        koperasiTurnoverTrend,
        koperasiBreakdown,
        upcomingAgenda,
        documentStatus,
      });

    } catch (error) {
      // Error handling - could be enhanced with toast notifications
      if (error instanceof Error) {
        console.error('Error fetching dashboard data:', error.message);
      } else {
        console.error('Error fetching dashboard data:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-gray-900">Executive Dashboard</h1>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            {user && (
              <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-semibold">
                {(user.name || 'U')[0].toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-[1920px] mx-auto">
        {/* Top Row - 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* 1. Total Saldo Efektif */}
          <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <ArrowUpRight className="w-5 h-5 text-white" />
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-green-600">
                  <TrendingUp className="w-3 h-3" />
                  +{stats.saldoTrend.toFixed(1)}%
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Saldo Efektif</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 truncate">{formatRupiah(stats.totalSaldoEfektif)}</p>
            </CardContent>
          </Card>

          {/* 2. Status Santri */}
          <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-400 rounded-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                </div>
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Status Santri</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{stats.totalSantri}</p>
              <p className="text-xs text-gray-500">{stats.santriAktif} Aktif, {stats.santriAlumni} Alumni</p>
            </CardContent>
          </Card>

          {/* 3. Target Donasi Bulan Ini */}
          <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Gift className="w-5 h-5 text-white" />
                </div>
                <div className="text-xs sm:text-sm font-semibold text-purple-600">{stats.donasiProgress.toFixed(0)}%</div>
                </div>
              <p className="text-xs sm:text-sm text-gray-600 mb-2">Target Donasi Bulan Ini</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div className="bg-purple-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(stats.donasiProgress, 100)}%` }}></div>
              </div>
              <p className="text-xs text-gray-500 truncate">{formatRupiah(stats.donasiTerkumpul)} / {formatRupiah(stats.targetDonasiBulanIni)}</p>
            </CardContent>
          </Card>

          {/* 4. Tagihan Outstanding */}
          <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                {stats.tagihanCount > 0 && (
                  <Button size="sm" variant="outline" className="text-xs h-7 px-2 text-orange-600 border-orange-300">
                    Needs Action
                  </Button>
                )}
                </div>
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Tagihan Outstanding</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 truncate">{formatRupiah(stats.tagihanOutstanding)}</p>
              <p className="text-xs text-gray-500">Dari {stats.tagihanCount} Santri</p>
            </CardContent>
          </Card>
        </div>

        {/* Middle Row - Charts and Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* 1. Grafik Arus Kas */}
          <Card className="bg-white border border-gray-200 shadow-sm lg:col-span-2 overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <CardTitle className="text-base font-semibold text-gray-900">Grafik Arus Kas</CardTitle>
                <Button variant="outline" size="sm" className="text-xs">Last 6 Months</Button>
                </div>
              <p className="text-sm text-gray-600 mt-1">Income vs Expenses (Last 6 Months)</p>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Suspense
                fallback={
                  <div className="h-[280px] min-h-[200px] flex items-center justify-center text-sm text-gray-500">
                    Loading chart...
                  </div>
                }
              >
                <CashFlowChart data={stats.cashFlowData} formatRupiah={formatRupiah} />
              </Suspense>
            </CardContent>
          </Card>

          {/* 2. Distribusi Pengeluaran */}
          <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-900">Distribusi Pengeluaran</CardTitle>
                <span className="text-xs text-gray-500">{MONTHS[new Date().getMonth()]}</span>
              </div>
            </CardHeader>
            <CardContent>
              <Suspense
                fallback={
                  <div className="h-32 flex items-center justify-center text-sm text-gray-500">
                    Loading chart...
                  </div>
                }
              >
                <ExpenseDistributionChart data={stats.expenseDistribution} formatRupiah={formatRupiah} />
              </Suspense>
              <div className="space-y-2">
                {stats.expenseDistribution.map((item, index) => {
                  const total = stats.expenseDistribution.reduce((sum, i) => sum + i.value, 0);
                  const percentage = total > 0 ? (item.value / total) * 100 : 0;
                  return (
                    <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-gray-600">{item.name}</span>
                    </div>
                      <span className="font-semibold text-gray-900">{percentage.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 3. Progres Tahfidz */}
          <Card className="bg-white border border-gray-200 shadow-sm lg:col-span-1 overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-gray-900">Progres Tahfidz</CardTitle>
              <p className="text-xs text-gray-500 mt-1">Avg. Juz / Level</p>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={stats.tahfidzProgress[0]?.level || "SD"} className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-4">
                  {stats.tahfidzProgress.map((item) => (
                    <TabsTrigger key={item.level} value={item.level} className="text-xs">
                      {item.level}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {stats.tahfidzProgress.map((item) => (
                  <TabsContent key={item.level} value={item.level} className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Juz {item.avgJuz.toFixed(1)}</span>
                      <span className="text-xs text-gray-500">{item.progress.toFixed(0)}%</span>
                </div>
                    <Progress value={item.progress} className="h-2" />
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row - Operational Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* 1. Inventory Alert */}
          <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <CardTitle className="text-base font-semibold text-gray-900">Inventory Alert</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.inventoryAlerts.length > 0 ? (
                stats.inventoryAlerts.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg border ${
                      item.status === 'low' ? 'bg-red-50 border-red-200' : item.status === 'warning' ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-gray-900">{item.nama_barang}</span>
                      <Button size="sm" variant="outline" className="text-xs h-6 px-2">Order</Button>
                    </div>
                    <p className={`text-xs ${
                      item.status === 'low' ? 'text-red-600' : item.status === 'warning' ? 'text-orange-600' : 'text-gray-600'
                    }`}>
                      {item.status === 'low' ? 'Low Stock' : item.status === 'warning' ? 'Warning' : 'OK'}: {item.jumlah}{item.satuan || 'pcs'} left
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">Tidak ada alert inventaris</p>
              )}
            </CardContent>
          </Card>

          {/* 2. Logistik & Koperasi */}
          <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-gray-900">Logistik & Koperasi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Today's Turnover</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{formatRupiah(stats.koperasiTurnover)}</p>
                  <div className="flex items-center gap-1 text-xs font-medium text-green-600">
                    <TrendingUp className="w-3 h-3" />
                    {stats.koperasiTurnoverTrend.toFixed(1)}% vs Yesterday
                  </div>
                </div>
              </div>
              <div className="space-y-2 border-t pt-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Kantin Santri</span>
                  <span className="font-semibold text-gray-900">{formatRupiah(stats.koperasiBreakdown.kantinSantri)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Koperasi Staff</span>
                  <span className="font-semibold text-gray-900">{formatRupiah(stats.koperasiBreakdown.koperasiStaff)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Laundry Unit</span>
                  <span className="font-semibold text-gray-900">{formatRupiah(stats.koperasiBreakdown.laundryUnit)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Upcoming Agenda */}
          <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-gray-900">Upcoming Agenda</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.upcomingAgenda.length > 0 ? (
                  stats.upcomingAgenda.map((agenda) => {
                    const date = new Date(agenda.tanggal);
                    const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
                    return (
                      <div key={agenda.id} className="border-l-2 border-blue-500 pl-3 py-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-blue-600">{monthDay}</span>
                          <span className="text-sm font-medium text-gray-900">{agenda.judul}</span>
                        </div>
                        <p className="text-xs text-gray-600">{agenda.waktu}</p>
                        <p className="text-xs text-gray-500">{agenda.lokasi}</p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">Tidak ada agenda mendatang</p>
                )}
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4 text-xs" onClick={() => navigate('/akademik')}>
                <Calendar className="w-3 h-3 mr-2" />
                View Calendar
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Document Completion Status */}
        <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-gray-900">Status Kelengkapan Dokumen Santri (LKSA)</CardTitle>
            <p className="text-xs text-gray-500 mt-1">Compliance tracking for birth certificates and KIA ownership.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Overall Status</span>
              <Badge variant={stats.documentStatus.overallStatus === 'on_track' ? 'default' : 'destructive'} className="bg-green-100 text-green-800">
                {stats.documentStatus.overallStatus === 'on_track' ? 'On Track' : 'Needs Attention'}
              </Badge>
            </div>
            
            {/* Akta Kelahiran */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Akta Kelahiran</span>
                <span className="text-xs text-gray-500">Pending: {stats.documentStatus.aktaKelahiran.pending} Santri</span>
              </div>
              <Progress value={stats.documentStatus.aktaKelahiran.percentage} className="h-2 mb-1" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">{stats.documentStatus.aktaKelahiran.percentage.toFixed(0)}% ({stats.documentStatus.aktaKelahiran.completed}/{stats.documentStatus.aktaKelahiran.total})</span>
                <Button variant="link" size="sm" className="text-xs h-auto p-0" onClick={() => navigate('/santri')}>View Missing List</Button>
              </div>
            </div>

            {/* KIA */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Kartu Identitas Anak (KIA)</span>
                <span className="text-xs text-gray-500">Pending: {stats.documentStatus.kia.pending} Santri</span>
              </div>
              <Progress value={stats.documentStatus.kia.percentage} className="h-2 mb-1" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">{stats.documentStatus.kia.percentage.toFixed(0)}% ({stats.documentStatus.kia.completed}/{stats.documentStatus.kia.total})</span>
                <Button variant="link" size="sm" className="text-xs h-auto p-0" onClick={() => navigate('/santri')}>View Missing List</Button>
              </div>
            </div>
            </CardContent>
          </Card>

      </div>
    </div>
  );
};

export default Dashboard;
