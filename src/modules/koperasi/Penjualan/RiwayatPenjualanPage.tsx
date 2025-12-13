import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, Calendar, DollarSign, TrendingUp, Edit, Trash2, Printer, Building2, Store, RefreshCw, Wallet } from 'lucide-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { koperasiService } from '@/services/koperasi.service';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, startOfYear, endOfYear, startOfMonth, endOfMonth, startOfDay, endOfDay, subDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatCurrency } from '@/utils/formatCurrency';
import ReceiptNota from '@/modules/koperasi/Kasir/components/ReceiptNota';
import SetorCashDialog from './components/SetorCashDialog';
import { useAuth } from '@/hooks/useAuth';

// =====================================================
// CONSTANTS
// =====================================================
const PAGE_SIZE = 20;
const MAX_PAGINATION_BUTTONS = 5;

type DateFilterType = 'all' | 'today' | 'week' | 'month' | 'year';
type PaymentMethod = 'cash' | 'transfer';
type OwnerType = 'yayasan' | 'koperasi';

// =====================================================
// TYPE DEFINITIONS
// =====================================================
interface KopBarang {
  id: string;
  nama_barang: string;
  kode_barang: string;
  satuan_dasar: string;
  owner_type?: OwnerType;
}

interface KopPenjualanDetail {
  id: string;
  jumlah: number;
  harga_satuan_jual: number;
  subtotal: number;
  margin?: number;
  bagian_yayasan?: number;
  bagian_koperasi?: number;
  hpp_snapshot?: number;
  kop_barang?: KopBarang | null;
}

interface KopShiftKasir {
  id: string;
  no_shift: string;
}

interface PenjualanListItem {
  id: string;
  nomor_struk: string;
  tanggal: string;
  total_transaksi: number;
  diskon_global?: number;
  total_bayar: number;
  metode_pembayaran: PaymentMethod;
  status_pembayaran: string;
  items_summary?: string;
  kasir_id: string;
  shift_id?: string;
  created_at: string;
  updated_at: string;
  kop_penjualan_detail?: KopPenjualanDetail[];
}

interface PenjualanDetail extends PenjualanListItem {
  kop_shift_kasir?: KopShiftKasir | null;
}

interface StatsData {
  totalTransaksi: number;
  totalOmset: number;
  totalOmsetYayasan: number;
  totalOmsetKoperasi: number;
  totalHPP: number;
  labaKotor: number;
  rataRataTransaksi: number;
}

interface ChartDataPoint {
  month: string;
  monthYear: string;
  monthKey: string;
  total: number;
  yayasan: number;
  koperasi: number;
  cash: number;
  transfer: number;
}

interface CashBelumDisetor {
  totalPenjualanCash: number;
  totalSetoranCash: number;
  sisaBelumDisetor: number;
}

interface ReceiptItem {
  id: string;
  nama_barang: string;
  jumlah: number;
  satuan: string;
  harga_satuan_jual: number;
  subtotal: number;
}

interface ReceiptData {
  id: string;
  nomor_struk: string;
  tanggal: string;
  kasir_name: string;
  metode_pembayaran: PaymentMethod;
  total_transaksi: number;
  jumlah_bayar: number;
  kembalian: number;
}

interface DateRange {
  startDate: string;
  endDate: string;
  start: Date;
  end: Date;
}

// =====================================================
// COMPONENT
// =====================================================
function RiwayatPenjualanPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('year');
  const [page, setPage] = useState(1);
  const [viewingPenjualan, setViewingPenjualan] = useState<PenjualanListItem | null>(null);
  const [printingPenjualan, setPrintingPenjualan] = useState<PenjualanListItem | null>(null);
  const [deletingPenjualan, setDeletingPenjualan] = useState<PenjualanListItem | null>(null);
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [showSetorCashDialog, setShowSetorCashDialog] = useState(false);
  const { user } = useAuth();

  const getDateRange = (): DateRange => {
    const now = new Date();
    switch (dateFilter) {
      case 'today':
        return {
          startDate: format(startOfDay(now), 'yyyy-MM-dd'),
          endDate: format(endOfDay(now), 'yyyy-MM-dd'),
          start: startOfDay(now),
          end: endOfDay(now),
        };
      case 'week': {
        const weekAgo = subDays(now, 7);
        return {
          startDate: format(startOfDay(weekAgo), 'yyyy-MM-dd'),
          endDate: format(endOfDay(now), 'yyyy-MM-dd'),
          start: startOfDay(weekAgo),
          end: endOfDay(now),
        };
      }
      case 'month':
        return {
          startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
          start: startOfMonth(now),
          end: endOfMonth(now),
        };
      case 'year':
        return {
          startDate: format(startOfYear(now), 'yyyy-MM-dd'),
          endDate: format(endOfYear(now), 'yyyy-MM-dd'),
          start: startOfYear(now),
          end: endOfYear(now),
        };
      default:
        return {
          startDate: format(startOfYear(now), 'yyyy-MM-dd'),
          endDate: format(endOfYear(now), 'yyyy-MM-dd'),
          start: startOfYear(now),
          end: endOfYear(now),
        };
    }
  };

  const dateRange = getDateRange();

  // Fetch penjualan data dengan pagination
  const { data: penjualanResponse, isLoading } = useQuery({
    queryKey: ['koperasi-penjualan-list', dateRange, page, searchTerm],
    queryFn: async () => {
      // Build base query without nested relations first
      let baseQuery = supabase
        .from('kop_penjualan')
        .select(`
          id,
          nomor_struk,
          tanggal,
          total_transaksi,
          diskon_global,
          total_bayar,
          metode_pembayaran,
          status_pembayaran,
          items_summary,
          kasir_id,
          shift_id,
          created_at,
          updated_at
        `, { count: 'exact' })
        .eq('status_pembayaran', 'lunas')
        .order('tanggal', { ascending: false });

      // Apply date filter
      baseQuery = baseQuery.gte('tanggal', dateRange.startDate + 'T00:00:00');
      baseQuery = baseQuery.lte('tanggal', dateRange.endDate + 'T23:59:59');

      // Apply search filter
      if (searchTerm) {
        baseQuery = baseQuery.or(`nomor_struk.ilike.%${searchTerm}%,items_summary.ilike.%${searchTerm}%`);
      }

      // Apply pagination
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      baseQuery = baseQuery.range(from, to);

      const { data: penjualanList, error, count } = await baseQuery;

      if (error) throw error;

      // Fetch details for each penjualan separately to avoid nested relation issues
      const penjualanWithDetails = await Promise.all(
        (penjualanList || []).map(async (penjualan: PenjualanListItem) => {
          const { data: details } = await supabase
            .from('kop_penjualan_detail')
            .select(`
              id,
              jumlah,
              harga_satuan_jual,
              subtotal,
              kop_barang(
                id,
                nama_barang,
                kode_barang,
                satuan_dasar
              )
            `)
            .eq('penjualan_id', penjualan.id);

          return {
            ...penjualan,
            kop_penjualan_detail: (details || []).map(d => ({
              ...d,
              kop_barang: Array.isArray(d.kop_barang) ? d.kop_barang[0] : d.kop_barang
            })) as KopPenjualanDetail[]
          };
        })
      );

      return {
        data: penjualanWithDetails || [],
        total: count || 0,
      };
    },
  });

  // Fetch statistics from all filtered data (without pagination) - WITH OWNER TYPE SEPARATION
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['koperasi-penjualan-stats', dateRange, searchTerm],
    queryFn: async () => {
      let statsQuery = supabase
        .from('kop_penjualan')
        .select(`
          id,
          nomor_struk,
          items_summary,
          total_transaksi,
          tanggal,
          kop_penjualan_detail(
            id,
            subtotal,
            hpp_snapshot,
            jumlah,
            kop_barang(
              owner_type
            )
          )
        `, { count: 'exact' })
        .eq('status_pembayaran', 'lunas');

      // Apply date filter
      statsQuery = statsQuery.gte('tanggal', dateRange.startDate + 'T00:00:00');
      statsQuery = statsQuery.lte('tanggal', dateRange.endDate + 'T23:59:59');

      // Apply search filter
      if (searchTerm) {
        statsQuery = statsQuery.or(`nomor_struk.ilike.%${searchTerm}%,items_summary.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await statsQuery;

      if (error) throw error;

      // Calculate totals separated by owner_type + HPP calculation
      let totalOmset = 0;
      let totalOmsetYayasan = 0;
      let totalOmsetKoperasi = 0;
      let totalHPP = 0;

      (data || []).forEach((penjualan: {
        total_transaksi: unknown;
        kop_penjualan_detail?: Array<{
          subtotal: unknown;
          hpp_snapshot?: unknown;
          jumlah: unknown;
          kop_barang?: { owner_type?: OwnerType } | Array<{ owner_type?: OwnerType }> | null;
        }>;
      }) => {
        const penjualanTotal = parseFloat(String(penjualan.total_transaksi || 0));
        totalOmset += penjualanTotal;

        // Calculate by owner_type from details and HPP
        const details = penjualan.kop_penjualan_detail || [];
        let omsetYayasan = 0;
        let omsetKoperasi = 0;

        details.forEach((detail) => {
          const kopBarang = Array.isArray(detail.kop_barang) ? detail.kop_barang[0] : detail.kop_barang;
          const ownerType = kopBarang?.owner_type;
          const subtotal = parseFloat(String(detail.subtotal || 0));
          
          // Calculate HPP: hpp_snapshot * jumlah
          const hppSnapshot = parseFloat(String(detail.hpp_snapshot || 0));
          const jumlah = parseFloat(String(detail.jumlah || 0));
          const hppTotal = hppSnapshot * jumlah;
          totalHPP += hppTotal;
          
          if (ownerType === 'yayasan') {
            omsetYayasan += subtotal;
          } else {
            omsetKoperasi += subtotal;
          }
        });

        // If no details, try to estimate from total (fallback)
        if (details.length === 0) {
          // If we can't determine, we'll skip this transaction from breakdown
          // But still count it in total
        } else {
          totalOmsetYayasan += omsetYayasan;
          totalOmsetKoperasi += omsetKoperasi;
        }
      });

      const totalTransaksi = count || 0;
      const rataRataTransaksi = totalTransaksi > 0 ? totalOmset / totalTransaksi : 0;
      
      // Calculate Laba Kotor
      const labaKotor = totalOmset - totalHPP;

      return {
        totalTransaksi,
        totalOmset,
        totalOmsetYayasan,
        totalOmsetKoperasi,
        totalHPP,
        labaKotor,
        rataRataTransaksi,
      } as StatsData;
    },
  });

  // Fetch chart data with owner_type separation
  const { data: chartData, isLoading: isLoadingChart } = useQuery({
    queryKey: ['koperasi-penjualan-chart', dateRange],
    queryFn: async () => {

      const { data, error } = await supabase
        .from('kop_penjualan')
        .select(`
          tanggal,
          total_transaksi,
          metode_pembayaran,
          kop_penjualan_detail(
            id,
            subtotal,
            kop_barang(
              owner_type
            )
          )
        `)
        .eq('status_pembayaran', 'lunas')
        .gte('tanggal', dateRange.startDate + 'T00:00:00')
        .lte('tanggal', dateRange.endDate + 'T23:59:59')
        .order('tanggal', { ascending: true });

      if (error) throw error;

      // Group by month with owner_type separation
      const monthlyMap = new Map<string, { 
        total: number; 
        yayasan: number; 
        koperasi: number;
        cash: number;
        transfer: number;
      }>();
      
      (data || []).forEach((penjualan: {
        tanggal: string;
        total_transaksi: unknown;
        metode_pembayaran: PaymentMethod;
        kop_penjualan_detail?: Array<{
          subtotal: unknown;
          kop_barang?: { owner_type?: OwnerType } | Array<{ owner_type?: OwnerType }> | null;
        }>;
      }) => {
        const date = new Date(penjualan.tanggal);
        // Use YYYY-MM format for proper sorting
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const monthKey = `${year}-${String(month).padStart(2, '0')}`;
        
        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, { total: 0, yayasan: 0, koperasi: 0, cash: 0, transfer: 0 });
        }
        
        const monthData = monthlyMap.get(monthKey)!;
        const penjualanTotal = parseFloat(String(penjualan.total_transaksi || 0));
        monthData.total += penjualanTotal;

        // Calculate by owner_type from details
        const details = penjualan.kop_penjualan_detail || [];
        let yayasanTotal = 0;
        let koperasiTotal = 0;

        details.forEach((detail) => {
          const kopBarang = Array.isArray(detail.kop_barang) ? detail.kop_barang[0] : detail.kop_barang;
          const ownerType = kopBarang?.owner_type;
          const subtotal = parseFloat(String(detail.subtotal || 0));
          
          if (ownerType === 'yayasan') {
            yayasanTotal += subtotal;
          } else {
            koperasiTotal += subtotal;
          }
        });

        monthData.yayasan += yayasanTotal;
        monthData.koperasi += koperasiTotal;

        // Track payment method
        if (penjualan.metode_pembayaran === 'cash') {
          monthData.cash += penjualanTotal;
        } else {
          monthData.transfer += penjualanTotal;
        }
      });

      // Convert to array and sort properly by year-month
      const monthlyArray: ChartDataPoint[] = Array.from(monthlyMap.entries())
        .map(([monthKey, data]) => {
          // Parse YYYY-MM format
          const [year, month] = monthKey.split('-').map(Number);
          const date = new Date(year, month - 1, 1);
          return {
            month: format(date, 'MMM', { locale: id }),
            monthYear: format(date, 'MMM yyyy', { locale: id }),
            monthKey, // Keep for sorting
            total: data.total,
            yayasan: data.yayasan,
            koperasi: data.koperasi,
            cash: data.cash,
            transfer: data.transfer,
          };
        })
        .sort((a, b) => {
          // Sort by monthKey (YYYY-MM) which is naturally sortable
          return a.monthKey.localeCompare(b.monthKey);
        });

      return monthlyArray;
    },
  });

  const penjualanData: PenjualanListItem[] = penjualanResponse?.data || [];
  const totalRecords = penjualanResponse?.total || 0;
  const totalPages = Math.ceil(totalRecords / PAGE_SIZE);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (penjualanId: string) => {
      try {
        await koperasiService.deletePenjualan(penjualanId);
      } catch (error) {
        console.error('Error in deleteMutation:', error);
        // Handle network errors
        const errorObj = error as Error;
        if (errorObj.message?.includes('Failed to fetch') || errorObj.message?.includes('ERR_ADDRESS_UNREACHABLE')) {
          throw new Error('Tidak dapat terhubung ke server. Silakan coba lagi atau periksa koneksi internet Anda.');
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Penjualan berhasil dihapus dan stok dikembalikan.');
      queryClient.invalidateQueries({ queryKey: ['koperasi-penjualan-list'] });
      queryClient.invalidateQueries({ queryKey: ['koperasi-penjualan-stats'] });
      queryClient.invalidateQueries({ queryKey: ['koperasi-penjualan-chart'] });
      queryClient.invalidateQueries({ queryKey: ['koperasi-dashboard-stats'] });
      setDeletingPenjualan(null);
    },
    onError: (error: Error) => {
      console.error('Delete error:', error);
      const errorMessage = error.message || 'Gagal menghapus penjualan. Silakan coba lagi.';
      toast.error(errorMessage);
    },
  });

  // Fetch detail untuk view
  const { data: penjualanDetail } = useQuery({
    queryKey: ['koperasi-penjualan-detail', viewingPenjualan?.id],
    queryFn: async () => {
      if (!viewingPenjualan?.id) return null;
      
      const { data, error } = await supabase
        .from('kop_penjualan')
        .select(`
          id,
          nomor_struk,
          tanggal,
          total_transaksi,
          diskon_global,
          total_bayar,
          metode_pembayaran,
          status_pembayaran,
          items_summary,
          kasir_id,
          shift_id,
          created_at,
          updated_at,
          kop_penjualan_detail(
            id,
            jumlah,
            harga_satuan_jual,
            subtotal,
            margin,
            bagian_yayasan,
            bagian_koperasi,
            kop_barang(
              id,
              kode_barang,
              nama_barang,
              satuan_dasar,
              owner_type
            )
          ),
          kop_shift_kasir(
            id,
            no_shift
          )
        `)
        .eq('id', viewingPenjualan.id)
        .single();

      if (error) throw error;
      if (!data) return null;
      
      // Handle array response from Supabase relation
      const detail = {
        ...data,
        kop_shift_kasir: Array.isArray(data.kop_shift_kasir) 
          ? (data.kop_shift_kasir[0] as KopShiftKasir | undefined) || null
          : data.kop_shift_kasir,
        kop_penjualan_detail: (data.kop_penjualan_detail || []).map((d: {
          kop_barang?: KopBarang | KopBarang[];
        }) => ({
          ...d,
          kop_barang: Array.isArray(d.kop_barang) ? d.kop_barang[0] : d.kop_barang
        })) as KopPenjualanDetail[]
      } as unknown as PenjualanDetail;
      
      return detail;
    },
    enabled: !!viewingPenjualan?.id,
  });

  // Fetch receipt data untuk print
  const { data: receiptData } = useQuery({
    queryKey: ['koperasi-penjualan-receipt', printingPenjualan?.id],
    queryFn: async () => {
      if (!printingPenjualan?.id) return null;
      
      const { data, error } = await supabase
        .from('kop_penjualan')
        .select(`
          *,
          kop_penjualan_detail(
            id,
            jumlah,
            harga_satuan_jual,
            subtotal,
            kop_barang(
              nama_barang,
              satuan_dasar
            )
          )
        `)
        .eq('id', printingPenjualan.id)
        .single();

      if (error) throw error;

      // Get kasir name
      let kasirName = 'Admin';
      if (data.kasir_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', data.kasir_id)
          .single();
        kasirName = profile?.full_name || 'Admin';
      }

      // Transform items untuk receipt
      const items: ReceiptItem[] = (data.kop_penjualan_detail || []).map((detail: KopPenjualanDetail) => ({
        id: detail.id,
        nama_barang: detail.kop_barang?.nama_barang || 'Item',
        jumlah: detail.jumlah,
        satuan: detail.kop_barang?.satuan_dasar || 'pcs',
        harga_satuan_jual: detail.harga_satuan_jual,
        subtotal: detail.subtotal,
      }));

      setReceiptItems(items);

      return {
        id: data.id,
        nomor_struk: data.nomor_struk,
        tanggal: data.tanggal,
        kasir_name: kasirName,
        metode_pembayaran: data.metode_pembayaran,
        total_transaksi: data.total_transaksi,
        jumlah_bayar: data.total_bayar || data.total_transaksi,
        kembalian: (data as { kembalian?: number }).kembalian || 0,
      } as ReceiptData;
    },
    enabled: !!printingPenjualan?.id,
  });

  // Use statistics from query
  const stats: StatsData = statsData || {
    totalTransaksi: 0,
    totalOmset: 0,
    totalOmsetYayasan: 0,
    totalOmsetKoperasi: 0,
    totalHPP: 0,
    labaKotor: 0,
    rataRataTransaksi: 0,
  };

  const handleEdit = (penjualan: PenjualanListItem) => {
    navigate(`/koperasi/kasir?edit=${penjualan.id}`);
  };

  const handlePrint = (penjualan: PenjualanListItem) => {
    setPrintingPenjualan(penjualan);
  };

  const handleDelete = (penjualan: PenjualanListItem) => {
    setDeletingPenjualan(penjualan);
  };

  const confirmDelete = () => {
    if (deletingPenjualan) {
      deleteMutation.mutate(deletingPenjualan.id);
    }
  };

  // Get total cash belum disetor untuk periode yang dipilih
  const { data: cashBelumDisetor } = useQuery({
    queryKey: ['cash-belum-disetor', dateRange],
    queryFn: async () => {
      // Get total penjualan cash
      const { data: penjualanCash } = await supabase
        .from('kop_penjualan')
        .select('total_transaksi')
        .eq('metode_pembayaran', 'cash')
        .eq('status_pembayaran', 'lunas')
        .gte('tanggal', dateRange.startDate + 'T00:00:00')
        .lte('tanggal', dateRange.endDate + 'T23:59:59');

      const totalPenjualanCash = (penjualanCash || []).reduce(
        (sum, p) => sum + parseFloat(p.total_transaksi || 0),
        0
      );

      // Get total setoran cash untuk periode yang sama
      const { data: setoranCash } = await supabase
        .from('kop_setoran_cash_kasir')
        .select('jumlah_setor')
        .eq('status', 'posted')
        .gte('tanggal_setor', dateRange.startDate + 'T00:00:00')
        .lte('tanggal_setor', dateRange.endDate + 'T23:59:59');

      const totalSetoranCash = (setoranCash || []).reduce(
        (sum, s) => sum + parseFloat(s.jumlah_setor || 0),
        0
      );

      return {
        totalPenjualanCash,
        totalSetoranCash,
        sisaBelumDisetor: totalPenjualanCash - totalSetoranCash,
      } as CashBelumDisetor;
    },
  });

  return (
    <div className="space-y-6">
      {/* Header dengan Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Riwayat Penjualan Koperasi</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola dan pantau semua transaksi penjualan</p>
        </div>
        <div className="flex items-center gap-2">
          <Select 
            value={dateFilter} 
            onValueChange={(value: DateFilterType) => {
              setDateFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[160px] h-10">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hari Ini</SelectItem>
              <SelectItem value="week">7 Hari Terakhir</SelectItem>
              <SelectItem value="month">Bulan Ini</SelectItem>
              <SelectItem value="year">Tahun Ini</SelectItem>
              <SelectItem value="all">Semua Waktu</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="h-10"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['koperasi-penjualan-list'] });
              queryClient.invalidateQueries({ queryKey: ['koperasi-penjualan-stats'] });
              queryClient.invalidateQueries({ queryKey: ['koperasi-penjualan-chart'] });
              queryClient.invalidateQueries({ queryKey: ['cash-belum-disetor'] });
              toast.success('Data diperbarui');
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards - Minimalis & Simetris */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Penjualan */}
        <Card className="border border-gray-200 bg-white shadow-sm hover:shadow transition-all overflow-hidden h-full">
          <CardContent className="p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Total Penjualan
              </p>
              <TrendingUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
            </div>
            {isLoadingStats ? (
              <div className="h-8 w-full animate-pulse bg-gray-100 rounded mb-2"></div>
            ) : (
              <p className="text-xl font-bold text-gray-900 mb-2 truncate">
                {formatCurrency(stats.totalOmset)}
              </p>
            )}
            {!isLoadingStats && (
              <p className="text-xs text-gray-500 mt-auto truncate">
                {stats.totalTransaksi} transaksi • Avg: {formatCurrency(stats.rataRataTransaksi)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Laba Kotor */}
        <Card className="border border-gray-200 bg-white shadow-sm hover:shadow transition-all overflow-hidden h-full">
          <CardContent className="p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Laba Kotor
              </p>
              <DollarSign className="h-4 w-4 text-gray-400 flex-shrink-0" />
            </div>
            {isLoadingStats ? (
              <div className="h-8 w-full animate-pulse bg-gray-100 rounded mb-2"></div>
            ) : (
              <p className={`text-xl font-bold mb-2 truncate ${stats.labaKotor >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                {formatCurrency(stats.labaKotor)}
              </p>
            )}
            {!isLoadingStats && (
              <p className="text-xs text-gray-500 mt-auto truncate">
                Penjualan - HPP
              </p>
            )}
          </CardContent>
        </Card>

        {/* Penjualan Yayasan */}
        <Card className="border border-blue-200 bg-gradient-to-br from-blue-50/50 to-white shadow-sm hover:shadow transition-all overflow-hidden h-full">
          <CardContent className="p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                Penjualan Yayasan
              </p>
              <Building2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
            </div>
            {isLoadingStats ? (
              <div className="h-8 w-full animate-pulse bg-gray-100 rounded mb-2"></div>
            ) : (
              <p className="text-xl font-bold text-blue-700 mb-2 truncate">
                {formatCurrency(stats.totalOmsetYayasan)}
              </p>
            )}
            {!isLoadingStats && (
              <p className="text-xs text-gray-500 mt-auto truncate">
                {stats.totalOmset > 0 
                  ? `${Math.round((stats.totalOmsetYayasan / stats.totalOmset) * 100)}% dari total`
                  : '0% dari total'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Penjualan Koperasi */}
        <Card className="border border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white shadow-sm hover:shadow transition-all overflow-hidden h-full">
          <CardContent className="p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">
                Penjualan Koperasi
              </p>
              <Store className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            </div>
            {isLoadingStats ? (
              <div className="h-8 w-full animate-pulse bg-gray-100 rounded mb-2"></div>
            ) : (
              <p className="text-xl font-bold text-emerald-700 mb-2 truncate">
                {formatCurrency(stats.totalOmsetKoperasi)}
              </p>
            )}
            {!isLoadingStats && (
              <p className="text-xs text-gray-500 mt-auto truncate">
                {stats.totalOmset > 0 
                  ? `${Math.round((stats.totalOmsetKoperasi / stats.totalOmset) * 100)}% dari total`
                  : '0% dari total'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cash Belum Disetor Card */}
      {cashBelumDisetor && cashBelumDisetor.sisaBelumDisetor > 0 && (
        <Card className="border border-amber-200 bg-gradient-to-r from-amber-50/50 to-orange-50/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-900">Cash Belum Disetor</p>
                  <p className="text-lg font-bold text-amber-700">
                    {formatCurrency(cashBelumDisetor.sisaBelumDisetor)}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => {
                  if (user?.id) {
                    setShowSetorCashDialog(true);
                  } else {
                    toast.error('Silakan login terlebih dahulu');
                  }
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Setor Cash
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari nomor struk atau keterangan..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          className="pl-10 h-11"
        />
      </div>

      {/* Charts Section - dengan Pemisahan Yayasan vs Koperasi */}
      {chartData && chartData.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Line Chart - Tren Penjualan Yayasan vs Koperasi */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Tren Penjualan per Owner</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Perkembangan penjualan Yayasan vs Koperasi per bulan</p>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '11px', paddingTop: '16px' }}
                      iconType="line"
                    />
                    <Line 
                      type="monotone"
                      dataKey="yayasan"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', r: 4 }}
                      name="Yayasan"
                    />
                    <Line 
                      type="monotone"
                      dataKey="koperasi"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: '#10b981', r: 4 }}
                      name="Koperasi"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Bar Chart - Perbandingan Yayasan vs Koperasi per Bulan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Pembagian Penjualan per Bulan</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Yayasan vs Koperasi</p>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '11px', paddingTop: '16px' }}
                    />
                    <Bar dataKey="yayasan" fill="#3b82f6" name="Yayasan" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="koperasi" fill="#10b981" name="Koperasi" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Penjualan Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Penjualan</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Memuat data...</div>
          ) : penjualanData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Tidak ada data penjualan
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Nomor Struk</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Metode Bayar</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {penjualanData.map((penjualan) => {
                      const itemCount = penjualan.kop_penjualan_detail?.length || 0;
                      const itemsSummary = penjualan.items_summary || 
                        (itemCount > 0 
                          ? `${itemCount} item${itemCount > 1 ? 's' : ''}`
                          : 'Tidak ada item');

                      return (
                        <TableRow key={penjualan.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {format(new Date(penjualan.tanggal), 'dd MMM yyyy HH:mm', { locale: id })}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono font-semibold">
                            {penjualan.nomor_struk || penjualan.id.slice(0, 8)}
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[300px]">
                              <div className="truncate">{itemsSummary}</div>
                              {penjualan.kop_penjualan_detail && penjualan.kop_penjualan_detail.length > 0 && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {penjualan.kop_penjualan_detail.slice(0, 2).map((detail, idx) => (
                                    <span key={detail.id}>
                                      {detail.kop_barang?.nama_barang}
                                      {idx < Math.min(penjualan.kop_penjualan_detail!.length - 1, 1) && ', '}
                                    </span>
                                  ))}
                                  {penjualan.kop_penjualan_detail.length > 2 && ` +${penjualan.kop_penjualan_detail.length - 2} lainnya`}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            {formatCurrency(penjualan.total_transaksi || 0)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={penjualan.metode_pembayaran === 'transfer' ? 'default' : 'secondary'}>
                              {penjualan.metode_pembayaran === 'transfer' ? 'Transfer' : 'Cash'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewingPenjualan(penjualan)}
                                title="Lihat Detail"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePrint(penjualan)}
                                title="Cetak Nota"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(penjualan)}
                                title="Edit Penjualan"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(penjualan)}
                                title="Hapus Penjualan"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Menampilkan {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, totalRecords)} dari {totalRecords} transaksi
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Sebelumnya
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(MAX_PAGINATION_BUTTONS, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= MAX_PAGINATION_BUTTONS) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Selanjutnya
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {viewingPenjualan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Detail Penjualan</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePrint(viewingPenjualan)}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Cetak
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(viewingPenjualan)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewingPenjualan(null)}
                  >
                    ✕
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {penjualanDetail ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Nomor Struk</p>
                      <p className="font-mono font-semibold">
                        {penjualanDetail.nomor_struk || penjualanDetail.id.slice(0, 8)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tanggal</p>
                      <p className="font-semibold">
                        {format(new Date(penjualanDetail.tanggal), 'dd MMM yyyy HH:mm', { locale: id })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Transaksi</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(penjualanDetail.total_transaksi || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Metode Pembayaran</p>
                      <Badge>
                        {penjualanDetail.metode_pembayaran === 'transfer' ? 'Transfer' : 'Cash'}
                      </Badge>
                    </div>
                  </div>

                  {/* Items List */}
                  {penjualanDetail.kop_penjualan_detail && penjualanDetail.kop_penjualan_detail.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-4">Detail Items</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Kode</TableHead>
                            <TableHead>Nama Barang</TableHead>
                            <TableHead className="text-right">Jumlah</TableHead>
                            <TableHead className="text-right">Harga Satuan</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {penjualanDetail.kop_penjualan_detail.map((detail) => (
                            <TableRow key={detail.id}>
                              <TableCell className="font-mono">
                                {detail.kop_barang?.kode_barang || '-'}
                              </TableCell>
                              <TableCell>{detail.kop_barang?.nama_barang || '-'}</TableCell>
                              <TableCell className="text-right">{detail.jumlah}</TableCell>
                              <TableCell className="text-right">{formatCurrency(detail.harga_satuan_jual)}</TableCell>
                              <TableCell className="text-right font-semibold">
                                {formatCurrency(detail.subtotal)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                        <tfoot>
                          <TableRow>
                            <TableCell colSpan={4} className="text-right font-semibold">
                              Total
                            </TableCell>
                            <TableCell className="text-right font-bold text-lg text-green-600">
                              {formatCurrency(penjualanDetail.total_transaksi || 0)}
                            </TableCell>
                          </TableRow>
                        </tfoot>
                      </Table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">Memuat detail...</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Print Receipt Modal */}
      {printingPenjualan && receiptData && receiptItems.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Cetak Nota</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPrintingPenjualan(null);
                    setReceiptItems([]);
                  }}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ReceiptNota
                penjualan={receiptData}
                items={receiptItems}
                autoPrint={true}
                showActions={true}
                onClose={() => {
                  setPrintingPenjualan(null);
                  setReceiptItems([]);
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingPenjualan} onOpenChange={(open) => !open && setDeletingPenjualan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Penjualan?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus penjualan{' '}
              <strong>{deletingPenjualan?.nomor_struk || deletingPenjualan?.id.slice(0, 8) || 'N/A'}</strong>?
              <br />
              <br />
              Tindakan ini akan:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Mengembalikan stok barang ke inventory</li>
                <li>Menghapus semua detail penjualan</li>
                <li>Menghapus transaksi keuangan terkait</li>
              </ul>
              <br />
              <strong className="text-red-600">Tindakan ini tidak dapat dibatalkan!</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Menghapus...' : 'Ya, Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Setor Cash Dialog */}
      {user?.id && (
        <SetorCashDialog
          open={showSetorCashDialog}
          onOpenChange={setShowSetorCashDialog}
          kasirId={user.id}
          shiftId={undefined}
        />
      )}
    </div>
  );
}

export default RiwayatPenjualanPage;
