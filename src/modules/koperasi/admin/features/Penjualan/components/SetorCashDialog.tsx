import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, AlertCircle, CheckCircle2, Calendar } from 'lucide-react';
import { setoranCashKasirService } from '@/modules/koperasi/services/koperasi.service';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';

interface SetorCashDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kasirId: string;
  shiftId?: string;
}

const SetorCashDialog: React.FC<SetorCashDialogProps> = ({
  open,
  onOpenChange,
  kasirId,
  shiftId,
}) => {
  const queryClient = useQueryClient();
  const [jumlahSetor, setJumlahSetor] = useState('');
  const [metodeSetor, setMetodeSetor] = useState<'cash' | 'transfer'>('cash');
  const [akunKasId, setAkunKasId] = useState<string>('');
  const [catatan, setCatatan] = useState('');
  
  // Periode selection - menggunakan bulan/tahun
  const currentDate = new Date();
  
  // Get available years from penjualan data (all cash sales, not filtered by kasir for year options)
  const { data: availableYears } = useQuery({
    queryKey: ['available-years-penjualan-cash'],
    queryFn: async () => {
      // Get all cash sales to determine available years (not filtered by kasir)
      const { data, error } = await supabase
        .from('kop_penjualan')
        .select('tanggal')
        .eq('metode_pembayaran', 'cash')
        .eq('status_pembayaran', 'lunas');
      
      if (error) throw error;
      
      // Extract unique years
      const years = new Set<number>();
      (data || []).forEach((p: any) => {
        try {
          const date = new Date(p.tanggal);
          if (!isNaN(date.getTime())) {
            years.add(date.getFullYear());
          }
        } catch (e) {
          // Skip invalid dates
        }
      });
      
      // Always include current year, last year, and next year
      years.add(currentDate.getFullYear());
      years.add(currentDate.getFullYear() - 1);
      years.add(currentDate.getFullYear() + 1);
      
      // Also include years from setoran cash (in case there are setoran without penjualan)
      const { data: setoranData } = await supabase
        .from('kop_setoran_cash_kasir')
        .select('periode_start, periode_end')
        .eq('status', 'posted');
      
      (setoranData || []).forEach((s: any) => {
        if (s.periode_start) {
          try {
            const date = new Date(s.periode_start);
            if (!isNaN(date.getTime())) {
              years.add(date.getFullYear());
            }
          } catch (e) {
            // Skip invalid dates
          }
        }
        if (s.periode_end) {
          try {
            const date = new Date(s.periode_end);
            if (!isNaN(date.getTime())) {
              years.add(date.getFullYear());
            }
          } catch (e) {
            // Skip invalid dates
          }
        }
      });
      
      return Array.from(years).sort((a, b) => b - a); // Descending order
    },
    enabled: open,
  });

  // Set default year to most recent year with data, or current year
  const defaultYear = availableYears && availableYears.length > 0 
    ? availableYears[0] 
    : currentDate.getFullYear();
  
  const [selectedYear, setSelectedYear] = useState<number>(defaultYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  
  // Update selectedYear when availableYears is loaded or dialog opens
  useEffect(() => {
    if (open) {
      if (availableYears && availableYears.length > 0) {
        // Set to most recent year with data
        setSelectedYear(availableYears[0]);
      } else {
        // Fallback to current year
        setSelectedYear(currentDate.getFullYear());
      }
      // Reset to current month when dialog opens
      setSelectedMonth(currentDate.getMonth() + 1);
    }
  }, [availableYears, open]);
  
  // Calculate date range from selected month/year
  const getDateRange = () => {
    const start = startOfMonth(new Date(selectedYear, selectedMonth - 1));
    const end = endOfMonth(new Date(selectedYear, selectedMonth - 1));
    const startDateStr = format(start, 'yyyy-MM-dd');
    const endDateStr = format(end, 'yyyy-MM-dd');
    
    // Debug log
    if (open) {
      console.log('📅 Date range calculated:', {
        selectedYear,
        selectedMonth,
        startDate: startDateStr,
        endDate: endDateStr,
        startDateObj: start.toISOString(),
        endDateObj: end.toISOString(),
      });
    }
    
    return {
      startDate: startDateStr,
      endDate: endDateStr,
      startDateObj: start,
      endDateObj: end,
    };
  };

  const dateRange = getDateRange();
  const periodeLabel = format(new Date(selectedYear, selectedMonth - 1), 'MMMM yyyy', { locale: id });

  // Get total penjualan cash untuk periode yang dipilih
  // Re-fetch saat selectedYear atau selectedMonth berubah
  // NOTE: Untuk setor cash, kita ambil SEMUA penjualan cash untuk periode tersebut,
  // bukan hanya penjualan dari satu kasir tertentu
  const { data: penjualanPeriode, isLoading: loadingPenjualanPeriode, refetch: refetchPenjualanPeriode } = useQuery({
    queryKey: ['total-cash-sales-period', selectedYear, selectedMonth, dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      // Pass undefined untuk kasirId agar mengambil semua penjualan cash
      const result = await setoranCashKasirService.getTotalCashSalesForPeriod(
        dateRange.startDate,
        dateRange.endDate,
        undefined // Tidak filter berdasarkan kasir - ambil semua penjualan cash untuk periode
      );
      console.log('📊 Total penjualan cash untuk periode:', {
        periode: periodeLabel,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        kasirId: 'ALL (tidak difilter)',
        result
      });
      return result;
    },
    enabled: open && !!dateRange.startDate && !!dateRange.endDate && !!selectedYear && !!selectedMonth,
  });

  // Refetch saat periode berubah
  useEffect(() => {
    if (open && dateRange.startDate && dateRange.endDate) {
      refetchPenjualanPeriode();
    }
  }, [selectedYear, selectedMonth, open, dateRange.startDate, dateRange.endDate, refetchPenjualanPeriode]);

  // Get total setoran untuk periode yang dipilih
  // Untuk setor cash, kita perlu melihat SEMUA setoran yang overlap dengan periode
  // Tidak perlu filter berdasarkan kasir karena setor cash bisa untuk seluruh penjualan periode
  const { data: totalSetoranPeriode = 0, isLoading: loadingSetoranPeriode, refetch: refetchSetoranPeriode } = useQuery({
    queryKey: ['total-setoran-period', selectedYear, selectedMonth, dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kop_setoran_cash_kasir')
        .select('jumlah_setor, periode_start, periode_end, kasir_id')
        .eq('status', 'posted');
      
      if (error) throw error;
      
      // Filter setoran yang overlap dengan periode yang dipilih
      const periodeStart = new Date(dateRange.startDate);
      const periodeEnd = new Date(dateRange.endDate);
      
      const setoranDalamPeriode = (data || []).filter((s: any) => {
        if (!s.periode_start || !s.periode_end) return false;
        const setoranStart = new Date(s.periode_start);
        const setoranEnd = new Date(s.periode_end);
        // Check overlap: setoran period overlaps with selected period
        return setoranStart <= periodeEnd && setoranEnd >= periodeStart;
      });
      
      const total = setoranDalamPeriode.reduce((sum, s) => sum + parseFloat(s.jumlah_setor || 0), 0);
      console.log('💰 Total setoran untuk periode:', {
        periode: periodeLabel,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        jumlahSetoran: setoranDalamPeriode.length,
        total
      });
      return total;
    },
    enabled: open && !!dateRange.startDate && !!dateRange.endDate && !!selectedYear && !!selectedMonth,
  });

  // Get akun kas list
  const { data: akunKasList = [] } = useQuery({
    queryKey: ['akun-kas-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('akun_kas')
        .select('id, nama, kode, saldo_saat_ini')
        .eq('status', 'aktif')
        .order('nama');
      if (error) throw error;
      return data || [];
    },
  });

  const totalPenjualanPeriode = penjualanPeriode?.totalPenjualanCash || 0;
  const sisaBelumDisetor = totalPenjualanPeriode - totalSetoranPeriode;
  const selisih = sisaBelumDisetor - parseFloat(jumlahSetor || '0');

  const createSetoranMutation = useMutation({
    mutationFn: async () => {
      if (!jumlahSetor || parseFloat(jumlahSetor) <= 0) {
        throw new Error('Jumlah setor harus lebih dari 0');
      }

      if (!akunKasId) {
        throw new Error('Akun kas tujuan harus dipilih');
      }

      return setoranCashKasirService.createSetoranCashKasir({
        kasir_id: kasirId,
        shift_id: shiftId,
        jumlah_setor: parseFloat(jumlahSetor),
        total_penjualan_tunai_snapshot: totalPenjualanPeriode,
        total_setoran_sebelumnya: totalSetoranPeriode,
        akun_kas_id: akunKasId,
        metode_setor: metodeSetor,
        catatan: catatan || undefined,
        periode_start: dateRange.startDate,
        periode_end: dateRange.endDate,
        periode_label: periodeLabel,
      });
    },
    onSuccess: async () => {
      toast.success('Setoran cash berhasil dicatat');
      // Invalidate dan refetch semua query terkait
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['total-cash-sales'] }),
        queryClient.invalidateQueries({ queryKey: ['total-setoran-kasir'] }),
        queryClient.invalidateQueries({ queryKey: ['riwayat-setoran-kasir'] }),
        queryClient.invalidateQueries({ queryKey: ['total-cash-sales-period'] }),
        queryClient.invalidateQueries({ queryKey: ['total-setoran-period'] }),
        queryClient.invalidateQueries({ queryKey: ['riwayat-setoran-cash'] }),
        queryClient.invalidateQueries({ queryKey: ['koperasi-penjualan-stats'] }),
        queryClient.invalidateQueries({ queryKey: ['koperasi-keuangan-dashboard-stats'] }),
      ]);
      // Refetch data untuk update UI
      await Promise.all([
        refetchPenjualanPeriode(),
        refetchSetoranPeriode(),
      ]);
      onOpenChange(false);
      setJumlahSetor('');
      setCatatan('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal mencatat setoran cash');
    },
  });

  useEffect(() => {
    if (open && sisaBelumDisetor > 0) {
      // Set default jumlah setor = sisa belum disetor
      setJumlahSetor(sisaBelumDisetor.toString());
    } else if (open) {
      setJumlahSetor('');
    }
  }, [open, sisaBelumDisetor]);

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Generate year options from available years or fallback to last 5 years
  const yearOptions = availableYears && availableYears.length > 0
    ? availableYears
    : (() => {
        const years = [];
        for (let year = currentDate.getFullYear() - 4; year <= currentDate.getFullYear() + 1; year++) {
          years.push(year);
        }
        return years.sort((a, b) => b - a); // Descending order
      })();

  // Generate month options (all 12 months)
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-green-600" />
            Setor Cash Kasir
          </DialogTitle>
          <DialogDescription>
            Catat setoran cash dari kasir ke kas utama
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Periode Selection */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-blue-600" />
                <Label className="text-base font-semibold text-blue-900">Pilih Periode Penjualan</Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="periode-year">Tahun</Label>
                  <Select
                    value={selectedYear.toString()}
                    onValueChange={(value) => setSelectedYear(parseInt(value))}
                  >
                    <SelectTrigger id="periode-year">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="periode-month">Bulan</Label>
                  <Select
                    value={selectedMonth.toString()}
                    onValueChange={(value) => setSelectedMonth(parseInt(value))}
                  >
                    <SelectTrigger id="periode-month">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((month) => (
                        <SelectItem key={month} value={month.toString()}>
                          {format(new Date(selectedYear, month - 1), 'MMMM', { locale: id })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-2 text-sm text-blue-700">
                Periode: <span className="font-semibold">{periodeLabel}</span>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          {loadingPenjualanPeriode ? (
            <Card>
              <CardContent className="pt-4">
                <div className="text-center py-4 text-muted-foreground">
                  Memuat data penjualan...
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-4">
                    <p className="text-sm text-green-700 font-medium mb-1">Total Penjualan Cash</p>
                    <p className="text-2xl font-bold text-green-800">
                      {formatRupiah(totalPenjualanPeriode)}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      {penjualanPeriode?.jumlahTransaksi || 0} transaksi
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <p className="text-sm text-blue-700 font-medium mb-1">Total Setoran Sebelumnya</p>
                    <p className="text-2xl font-bold text-blue-800">
                      {loadingSetoranPeriode ? '...' : formatRupiah(totalSetoranPeriode)}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Periode {periodeLabel}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="pt-4">
                  <p className="text-sm text-amber-700 font-medium mb-1">Sisa Belum Disetor</p>
                  <p className="text-2xl font-bold text-amber-800">
                    {formatRupiah(sisaBelumDisetor)}
                  </p>
                  {sisaBelumDisetor > 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      {penjualanPeriode?.jumlahBelumDisetor || 0} transaksi belum disetor
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Form */}
          <div className="space-y-4 border-t pt-4">
            <div>
              <Label htmlFor="jumlah-setor">Jumlah Setor *</Label>
              <Input
                id="jumlah-setor"
                type="number"
                value={jumlahSetor}
                onChange={(e) => setJumlahSetor(e.target.value)}
                placeholder="0"
                className="text-lg font-semibold"
              />
              <p className="text-xs text-gray-500 mt-1">
                Sisa belum disetor: {formatRupiah(sisaBelumDisetor)}
              </p>
            </div>

            {Math.abs(selisih) > 100 && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <p className="text-sm text-amber-700">
                  Selisih: {formatRupiah(Math.abs(selisih))} 
                  {selisih > 0 ? ' (kurang)' : ' (lebih)'}
                </p>
              </div>
            )}

            {Math.abs(selisih) <= 100 && selisih !== 0 && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <p className="text-sm text-green-700">
                  Selisih: {formatRupiah(Math.abs(selisih))} (dalam toleransi)
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="metode-setor">Metode Setor</Label>
              <Select value={metodeSetor} onValueChange={(value: 'cash' | 'transfer') => setMetodeSetor(value)}>
                <SelectTrigger id="metode-setor">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="akun-kas">Akun Kas Tujuan *</Label>
              <Select value={akunKasId} onValueChange={setAkunKasId}>
                <SelectTrigger id="akun-kas">
                  <SelectValue placeholder="Pilih akun kas" />
                </SelectTrigger>
                <SelectContent>
                  {akunKasList.map((akun) => (
                    <SelectItem key={akun.id} value={akun.id}>
                      {akun.nama} {akun.kode && `(${akun.kode})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="catatan">Catatan (Opsional)</Label>
              <Textarea
                id="catatan"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Tambahkan catatan jika diperlukan"
                rows={3}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createSetoranMutation.isPending}
            >
              Batal
            </Button>
            <Button
              onClick={() => createSetoranMutation.mutate()}
              disabled={createSetoranMutation.isPending || !jumlahSetor || parseFloat(jumlahSetor) <= 0 || !akunKasId}
              className="bg-green-600 hover:bg-green-700"
            >
              {createSetoranMutation.isPending ? 'Menyimpan...' : 'Simpan Setoran'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SetorCashDialog;
