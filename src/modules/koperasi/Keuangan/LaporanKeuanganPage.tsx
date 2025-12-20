import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Download, FileText, TrendingUp, TrendingDown, DollarSign, Building2, RefreshCw, FileSpreadsheet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, getMonth, getYear } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { toast } from 'sonner';
import { PDFExporter } from '@/utils/export/pdfExporter';
import { exportToCSV } from '@/utils/inventaris.utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface FinancialSummary {
  total_pendapatan_koperasi: number;
  total_pendapatan_inventaris: number;
  total_pendapatan: number;
  total_hpp_koperasi: number;
  total_hpp_inventaris: number;
  total_hpp: number;
  total_beban: number;
  total_kewajiban_yayasan: number;
  total_margin_koperasi: number;
  laba_kotor: number;
  laba_bersih: number;
}

const LaporanKeuanganPage = () => {
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState<string>(String(getMonth(new Date()) + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState<string>(String(getYear(new Date())));
  const [compareMonth, setCompareMonth] = useState<string>(String(getMonth(subMonths(new Date(), 1)) + 1).padStart(2, '0'));
  const [compareYear, setCompareYear] = useState<string>(String(getYear(subMonths(new Date(), 1))));
  const [isExporting, setIsExporting] = useState(false);

  // Generate month options
  const months = [
    { value: '01', label: 'Januari' },
    { value: '02', label: 'Februari' },
    { value: '03', label: 'Maret' },
    { value: '04', label: 'April' },
    { value: '05', label: 'Mei' },
    { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' },
    { value: '08', label: 'Agustus' },
    { value: '09', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
  ];

  // Generate year options (current year and 5 years back)
  const currentYear = getYear(new Date());
  const years = Array.from({ length: 6 }, (_, i) => String(currentYear - i));

  const getDateRange = (month: string, year: string) => {
    const monthNum = parseInt(month) - 1;
    const yearNum = parseInt(year);
    const start = startOfMonth(new Date(yearNum, monthNum, 1));
    const end = endOfMonth(new Date(yearNum, monthNum, 1));
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  };

  const currentPeriod = getDateRange(selectedMonth, selectedYear);
  const comparePeriod = getDateRange(compareMonth, compareYear);

  // Fetch current period data with real-time updates (refetch every 5 seconds)
  const { data: currentSummary, isLoading: isLoadingCurrent } = useQuery({
    queryKey: ['laporan-keuangan-summary', currentPeriod.start, currentPeriod.end],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('get_laporan_keuangan_summary', {
          p_start_date: currentPeriod.start || null,
          p_end_date: currentPeriod.end || null,
        });

        if (error) {
          throw new Error(`Gagal memuat laporan keuangan: ${error.message}`);
        }
        
        if (Array.isArray(data) && data.length > 0) {
          return data[0] as FinancialSummary;
        }
        return {
          total_pendapatan_koperasi: 0,
          total_pendapatan_inventaris: 0,
          total_pendapatan: 0,
          total_hpp_koperasi: 0,
          total_hpp_inventaris: 0,
          total_hpp: 0,
          total_beban: 0,
          total_kewajiban_yayasan: 0,
          total_margin_koperasi: 0,
          laba_kotor: 0,
          laba_bersih: 0,
        } as FinancialSummary;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Gagal memuat laporan keuangan';
        toast.error(errorMessage);
        throw err;
      }
    },
    refetchInterval: 5000, // Auto-refetch every 5 seconds for real-time updates
    refetchIntervalInBackground: true,
  });

  // Fetch compare period data
  const { data: compareSummary, isLoading: isLoadingCompare } = useQuery({
    queryKey: ['laporan-keuangan-summary', comparePeriod.start, comparePeriod.end],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('get_laporan_keuangan_summary', {
          p_start_date: comparePeriod.start || null,
          p_end_date: comparePeriod.end || null,
        });

        if (error) {
          throw new Error(`Gagal memuat laporan keuangan: ${error.message}`);
        }
        
        if (Array.isArray(data) && data.length > 0) {
          return data[0] as FinancialSummary;
        }
        return {
          total_pendapatan_koperasi: 0,
          total_pendapatan_inventaris: 0,
          total_pendapatan: 0,
          total_hpp_koperasi: 0,
          total_hpp_inventaris: 0,
          total_hpp: 0,
          total_beban: 0,
          total_kewajiban_yayasan: 0,
          total_margin_koperasi: 0,
          laba_kotor: 0,
          laba_bersih: 0,
        } as FinancialSummary;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Gagal memuat laporan keuangan';
        toast.error(errorMessage);
        throw err;
      }
    },
  });

  // Setup real-time subscription for keuangan changes
  useEffect(() => {
    const channel = supabase
      .channel('keuangan-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'keuangan',
          filter: `status=eq.posted`,
        },
        (payload) => {
          console.log('Keuangan change detected:', payload);
          // Invalidate queries to trigger refetch
          queryClient.invalidateQueries({ queryKey: ['laporan-keuangan-summary'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'keuangan_koperasi',
          filter: `status=eq.posted`,
        },
        (payload) => {
          console.log('Keuangan koperasi change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['laporan-keuangan-summary'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '0.00';
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const calculateChange = (current: number, compare: number) => {
    const change = current - compare;
    const percentage = compare !== 0 ? (change / compare) * 100 : (current !== 0 ? 100 : 0);
    return { change, percentage };
  };

  const handleExportPDF = async () => {
    if (!currentSummary) {
      toast.error('Data belum tersedia');
      return;
    }

    setIsExporting(true);
    try {
      const doc = new jsPDF('landscape');
      
      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Koperasi', 105, 20, { align: 'center' });
      
      doc.setFontSize(16);
      doc.text('Laporan Laba Rugi Komparatif', 105, 30, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const periodText = `Untuk Periode yang Berakhir pada ${format(new Date(currentPeriod.end), 'dd MMMM yyyy', { locale: localeId })} dan ${format(new Date(comparePeriod.end), 'dd MMMM yyyy', { locale: localeId })}`;
      doc.text(periodText, 105, 40, { align: 'center', maxWidth: 250 });
      
      // Table data
      const tableData = [
        ['Pendapatan', '', '', '', ''],
        ['Total Pendapatan', formatCurrency(currentSummary.total_pendapatan), formatCurrency(compareSummary?.total_pendapatan || 0), '', ''],
        ['Beban Pokok Penjualan', '', '', '', ''],
        ['Laba Kotor', formatCurrency(currentSummary.laba_kotor), formatCurrency(compareSummary?.laba_kotor || 0), '', ''],
        ['Beban Operasional', '', '', '', ''],
        ['Total Beban', formatCurrency(currentSummary.total_beban), formatCurrency(compareSummary?.total_beban || 0), '', ''],
        ['LABA (RUGI) BERSIH', formatCurrency(currentSummary.laba_bersih), formatCurrency(compareSummary?.laba_bersih || 0), '', ''],
      ];

      // Calculate changes
      if (compareSummary) {
        const pendapatanChange = calculateChange(currentSummary.total_pendapatan, compareSummary.total_pendapatan);
        const labaKotorChange = calculateChange(currentSummary.laba_kotor, compareSummary.laba_kotor);
        const bebanChange = calculateChange(currentSummary.total_beban, compareSummary.total_beban);
        const labaBersihChange = calculateChange(currentSummary.laba_bersih, compareSummary.laba_bersih);

        tableData[1][3] = formatCurrency(pendapatanChange.change);
        tableData[1][4] = `${formatNumber(pendapatanChange.percentage)}%`;
        tableData[3][3] = formatCurrency(labaKotorChange.change);
        tableData[3][4] = `${formatNumber(labaKotorChange.percentage)}%`;
        tableData[5][3] = formatCurrency(bebanChange.change);
        tableData[5][4] = `${formatNumber(bebanChange.percentage)}%`;
        tableData[6][3] = formatCurrency(labaBersihChange.change);
        tableData[6][4] = `${formatNumber(labaBersihChange.percentage)}%`;
      }

      autoTable(doc, {
        head: [['Keterangan', `${months[parseInt(selectedMonth) - 1].label} ${selectedYear}`, `${months[parseInt(compareMonth) - 1].label} ${compareYear}`, 'Perubahan (Rp)', 'Perubahan (%)']],
        body: tableData,
        startY: 50,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 50, halign: 'right' },
          2: { cellWidth: 50, halign: 'right' },
          3: { cellWidth: 40, halign: 'right' },
          4: { cellWidth: 30, halign: 'right' },
        },
      });

      // Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(10);
      doc.text('Mengetahui,', 30, pageHeight - 50);
      doc.text('Direktur', 30, pageHeight - 30);
      
      const location = 'Mojokerto';
      const date = format(new Date(), 'dd MMMM yyyy', { locale: localeId });
      doc.text(`${location}, ${date}`, 200, pageHeight - 30);
      
      doc.text('Dibuat oleh,', 200, pageHeight - 50);
      doc.text('Bagian Akuntansi', 200, pageHeight - 30);

      // Save PDF
      const filename = `Laporan_Laba_Rugi_${selectedMonth}_${selectedYear}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(filename);
      
      toast.success('PDF berhasil diekspor');
    } catch (error) {
      console.error('Export PDF error:', error);
      toast.error('Gagal mengekspor PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = () => {
    if (!currentSummary || !compareSummary) {
      toast.error('Data belum tersedia');
      return;
    }

    try {
      const pendapatanChange = calculateChange(currentSummary.total_pendapatan, compareSummary.total_pendapatan);
      const labaKotorChange = calculateChange(currentSummary.laba_kotor, compareSummary.laba_kotor);
      const bebanChange = calculateChange(currentSummary.total_beban, compareSummary.total_beban);
      const labaBersihChange = calculateChange(currentSummary.laba_bersih, compareSummary.laba_bersih);

      const csvData = [
        {
          'Keterangan': 'Pendapatan',
          [`${months[parseInt(selectedMonth) - 1].label} ${selectedYear}`]: '',
          [`${months[parseInt(compareMonth) - 1].label} ${compareYear}`]: '',
          'Perubahan (Rp)': '',
          'Perubahan (%)': '',
        },
        {
          'Keterangan': 'Total Pendapatan',
          [`${months[parseInt(selectedMonth) - 1].label} ${selectedYear}`]: currentSummary.total_pendapatan,
          [`${months[parseInt(compareMonth) - 1].label} ${compareYear}`]: compareSummary.total_pendapatan,
          'Perubahan (Rp)': pendapatanChange.change,
          'Perubahan (%)': `${formatNumber(pendapatanChange.percentage)}%`,
        },
        {
          'Keterangan': 'Beban Pokok Penjualan',
          [`${months[parseInt(selectedMonth) - 1].label} ${selectedYear}`]: '',
          [`${months[parseInt(compareMonth) - 1].label} ${compareYear}`]: '',
          'Perubahan (Rp)': '',
          'Perubahan (%)': '',
        },
        {
          'Keterangan': 'Laba Kotor',
          [`${months[parseInt(selectedMonth) - 1].label} ${selectedYear}`]: currentSummary.laba_kotor,
          [`${months[parseInt(compareMonth) - 1].label} ${compareYear}`]: compareSummary.laba_kotor,
          'Perubahan (Rp)': labaKotorChange.change,
          'Perubahan (%)': `${formatNumber(labaKotorChange.percentage)}%`,
        },
        {
          'Keterangan': 'Beban Operasional',
          [`${months[parseInt(selectedMonth) - 1].label} ${selectedYear}`]: '',
          [`${months[parseInt(compareMonth) - 1].label} ${compareYear}`]: '',
          'Perubahan (Rp)': '',
          'Perubahan (%)': '',
        },
        {
          'Keterangan': 'Total Beban',
          [`${months[parseInt(selectedMonth) - 1].label} ${selectedYear}`]: currentSummary.total_beban,
          [`${months[parseInt(compareMonth) - 1].label} ${compareYear}`]: compareSummary.total_beban,
          'Perubahan (Rp)': bebanChange.change,
          'Perubahan (%)': `${formatNumber(bebanChange.percentage)}%`,
        },
        {
          'Keterangan': 'LABA (RUGI) BERSIH',
          [`${months[parseInt(selectedMonth) - 1].label} ${selectedYear}`]: currentSummary.laba_bersih,
          [`${months[parseInt(compareMonth) - 1].label} ${compareYear}`]: compareSummary.laba_bersih,
          'Perubahan (Rp)': labaBersihChange.change,
          'Perubahan (%)': `${formatNumber(labaBersihChange.percentage)}%`,
        },
      ];

      exportToCSV(csvData, `Laporan_Laba_Rugi_${selectedMonth}_${selectedYear}`);
      toast.success('CSV berhasil diekspor');
    } catch (error) {
      console.error('Export CSV error:', error);
      toast.error('Gagal mengekspor CSV');
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['laporan-keuangan-summary'] });
    toast.success('Data diperbarui');
  };

  const isLoading = isLoadingCurrent || isLoadingCompare;
  const currentMonthName = months[parseInt(selectedMonth) - 1]?.label || '';
  const compareMonthName = months[parseInt(compareMonth) - 1]?.label || '';

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Laporan Laba Rugi Komparatif</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Data diperbarui otomatis setiap 5 detik
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pilih Periode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Periode Utama</label>
              <div className="flex gap-2">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Periode Pembanding</label>
              <div className="flex gap-2">
                <Select value={compareMonth} onValueChange={setCompareMonth}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={compareYear} onValueChange={setCompareYear}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleExportPDF} disabled={isExporting || isLoading} className="bg-red-600 hover:bg-red-700">
              <FileText className="h-4 w-4 mr-2" />
              {isExporting ? 'Mengekspor...' : 'Cetak PDF'}
            </Button>
            <Button onClick={handleExportCSV} disabled={isLoading} variant="outline" className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export XLS
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Table */}
      <Card>
        <CardHeader>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold">Koperasi</h2>
            <h3 className="text-lg font-semibold">Laporan Laba Rugi Komparatif</h3>
            <p className="text-sm text-gray-600">
              Untuk Periode yang Berakhir pada {format(new Date(currentPeriod.end), 'dd MMMM yyyy', { locale: localeId })} dan {format(new Date(comparePeriod.end), 'dd MMMM yyyy', { locale: localeId })}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">Memuat data...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="text-right">{currentMonthName} {selectedYear}</TableHead>
                    <TableHead className="text-right">{compareMonthName} {compareYear}</TableHead>
                    <TableHead className="text-right">Perubahan (Rp)</TableHead>
                    <TableHead className="text-right">Perubahan (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={5} className="font-semibold bg-gray-50">Pendapatan</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Total Pendapatan</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(currentSummary?.total_pendapatan || 0)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(compareSummary?.total_pendapatan || 0)}</TableCell>
                    <TableCell className="text-right font-mono">
                      {compareSummary ? formatCurrency(calculateChange(currentSummary?.total_pendapatan || 0, compareSummary.total_pendapatan).change) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {compareSummary ? `${formatNumber(calculateChange(currentSummary?.total_pendapatan || 0, compareSummary.total_pendapatan).percentage)}%` : '-'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={5} className="font-semibold bg-gray-50">Beban Pokok Penjualan</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Laba Kotor</TableCell>
                    <TableCell className={`text-right font-mono font-semibold ${(currentSummary?.laba_kotor || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(currentSummary?.laba_kotor || 0)}
                    </TableCell>
                    <TableCell className={`text-right font-mono font-semibold ${(compareSummary?.laba_kotor || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(compareSummary?.laba_kotor || 0)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {compareSummary ? formatCurrency(calculateChange(currentSummary?.laba_kotor || 0, compareSummary.laba_kotor).change) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {compareSummary ? `${formatNumber(calculateChange(currentSummary?.laba_kotor || 0, compareSummary.laba_kotor).percentage)}%` : '-'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={5} className="font-semibold bg-gray-50">Beban Operasional</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Total Beban</TableCell>
                    <TableCell className="text-right font-mono text-red-600">{formatCurrency(currentSummary?.total_beban || 0)}</TableCell>
                    <TableCell className="text-right font-mono text-red-600">{formatCurrency(compareSummary?.total_beban || 0)}</TableCell>
                    <TableCell className="text-right font-mono">
                      {compareSummary ? formatCurrency(calculateChange(currentSummary?.total_beban || 0, compareSummary.total_beban).change) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {compareSummary ? `${formatNumber(calculateChange(currentSummary?.total_beban || 0, compareSummary.total_beban).percentage)}%` : '-'}
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-blue-50 border-t-2 border-blue-300">
                    <TableCell className="font-bold text-lg">LABA (RUGI) BERSIH</TableCell>
                    <TableCell className={`text-right font-mono font-bold text-lg ${(currentSummary?.laba_bersih || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(currentSummary?.laba_bersih || 0)}
                    </TableCell>
                    <TableCell className={`text-right font-mono font-bold text-lg ${(compareSummary?.laba_bersih || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(compareSummary?.laba_bersih || 0)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {compareSummary ? formatCurrency(calculateChange(currentSummary?.laba_bersih || 0, compareSummary.laba_bersih).change) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {compareSummary ? `${formatNumber(calculateChange(currentSummary?.laba_bersih || 0, compareSummary.laba_bersih).percentage)}%` : '-'}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Signature Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-sm mb-8">Mengetahui,</p>
              <div className="border-t border-gray-300 pt-2">
                <p className="font-semibold">Direktur</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm mb-2">
                {format(new Date(), "'Mojokerto,' dd MMMM yyyy", { locale: localeId })}
              </p>
              <p className="text-sm mb-8">Dibuat oleh,</p>
              <div className="border-t border-gray-300 pt-2">
                <p className="font-semibold">Bagian Akuntansi</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LaporanKeuanganPage;
