import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  FileBarChart,
  Package,
  TrendingUp,
  DollarSign,
  RefreshCw,
  Download,
  Calendar,
  Building2,
  Store,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileText,
  FileSpreadsheet,
  Printer,
} from 'lucide-react';
import { formatRupiah, exportToCSV } from '@/utils/inventaris.utils';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, startOfDay, endOfDay, getMonth, getYear } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  getPersediaanReport,
  getLabaRugiReport,
  getBagiHasilReport,
  type PersediaanReportData,
  type LabaRugiReportData,
  type BagiHasilReportData,
} from '@/services/laporanKoperasi.service';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type ReportType = 'persediaan' | 'laba-rugi' | 'bagi-hasil';

const LaporanPage = () => {
  const queryClient = useQueryClient();
  const [activeReport, setActiveReport] = useState<ReportType>('laba-rugi');
  const [selectedMonth, setSelectedMonth] = useState<string>(String(getMonth(new Date()) + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState<string>(String(getYear(new Date())));
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

  // Get date range based on selected month/year
  const getDateRange = () => {
    const monthNum = parseInt(selectedMonth) - 1;
    const yearNum = parseInt(selectedYear);
    const start = startOfMonth(new Date(yearNum, monthNum, 1));
    const end = endOfMonth(new Date(yearNum, monthNum, 1));
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  };

  const dateRange = getDateRange();

  // Fetch Persediaan Report (no date filter needed) - with real-time updates
  const { data: persediaanData, isLoading: isLoadingPersediaan, refetch: refetchPersediaan } = useQuery({
    queryKey: ['laporan-persediaan'],
    queryFn: () => getPersediaanReport(),
    enabled: activeReport === 'persediaan',
    refetchInterval: 5000, // Auto-refetch every 5 seconds
    refetchIntervalInBackground: true,
  });

  // Fetch Laba Rugi Report - with real-time updates
  const { data: labaRugiData, isLoading: isLoadingLabaRugi, refetch: refetchLabaRugi } = useQuery({
    queryKey: ['laporan-laba-rugi', dateRange.startDate, dateRange.endDate],
    queryFn: () => getLabaRugiReport(dateRange.startDate, dateRange.endDate),
    enabled: activeReport === 'laba-rugi',
    refetchInterval: 5000, // Auto-refetch every 5 seconds
    refetchIntervalInBackground: true,
  });

  // Fetch Bagi Hasil Report - with real-time updates
  const { data: bagiHasilData, isLoading: isLoadingBagiHasil, refetch: refetchBagiHasil } = useQuery({
    queryKey: ['laporan-bagi-hasil', dateRange.startDate, dateRange.endDate],
    queryFn: () => getBagiHasilReport(dateRange.startDate, dateRange.endDate),
    enabled: activeReport === 'bagi-hasil',
    refetchInterval: 5000, // Auto-refetch every 5 seconds
    refetchIntervalInBackground: true,
  });

  // Setup real-time subscription for automatic updates
  useEffect(() => {
    const channel = supabase
      .channel('laporan-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kop_penjualan',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['laporan-laba-rugi'] });
          queryClient.invalidateQueries({ queryKey: ['laporan-bagi-hasil'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'keuangan_koperasi',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['laporan-laba-rugi'] });
          queryClient.invalidateQueries({ queryKey: ['laporan-bagi-hasil'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kop_barang',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['laporan-persediaan'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleRefresh = () => {
    if (activeReport === 'persediaan') {
      refetchPersediaan();
    } else if (activeReport === 'laba-rugi') {
      refetchLabaRugi();
    } else if (activeReport === 'bagi-hasil') {
      refetchBagiHasil();
    }
    toast.success('Data diperbarui');
  };

  const isLoading = isLoadingPersediaan || isLoadingLabaRugi || isLoadingBagiHasil;

  // Export functions
  const handleExportPDFLabaRugi = async (data: LabaRugiReportData) => {
    setIsExporting(true);
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);

      const doc = new jsPDF('portrait');
      
      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Koperasi', 105, 20, { align: 'center' });
      
      doc.setFontSize(16);
      doc.text('Laporan Laba Rugi', 105, 30, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const periodText = `Untuk Periode yang Berakhir pada ${format(new Date(dateRange.endDate), 'dd MMMM yyyy', { locale: localeId })}`;
      doc.text(periodText, 105, 40, { align: 'center', maxWidth: 180 });
      
      // Table data
      const tableData = [
        ['Penjualan Bersih', formatRupiah(data.penjualanBersih).replace('Rp', '').trim()],
        ['Harga Pokok Penjualan (HPP)', `(${formatRupiah(data.hpp).replace('Rp', '').trim()})`],
        ['Laba Kotor', formatRupiah(data.labaKotor).replace('Rp', '').trim()],
        ['Beban Operasional', `(${formatRupiah(data.bebanOperasional).replace('Rp', '').trim()})`],
        ['LABA (RUGI) BERSIH', formatRupiah(data.labaBersih).replace('Rp', '').trim()],
      ];

      autoTable(doc, {
        head: [['Keterangan', 'Jumlah']],
        body: tableData,
        startY: 50,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 120 },
          1: { cellWidth: 70, halign: 'right' },
        },
      });

      // Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(10);
      doc.text('Mengetahui,', 30, pageHeight - 50);
      doc.text('Direktur', 30, pageHeight - 30);
      
      const location = 'Mojokerto';
      const date = format(new Date(), 'dd MMMM yyyy', { locale: localeId });
      doc.text(`${location}, ${date}`, 150, pageHeight - 30);
      doc.text('Dibuat oleh,', 150, pageHeight - 50);
      doc.text('Bagian Akuntansi', 150, pageHeight - 30);

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

  const handleExportCSVLabaRugi = (data: LabaRugiReportData) => {
    try {
      const csvData = [
        {
          'Keterangan': 'Penjualan Bersih',
          'Jumlah': data.penjualanBersih,
        },
        {
          'Keterangan': 'Harga Pokok Penjualan (HPP)',
          'Jumlah': -data.hpp,
        },
        {
          'Keterangan': 'Laba Kotor',
          'Jumlah': data.labaKotor,
        },
        {
          'Keterangan': 'Beban Operasional',
          'Jumlah': -data.bebanOperasional,
        },
        {
          'Keterangan': 'LABA (RUGI) BERSIH',
          'Jumlah': data.labaBersih,
        },
      ];

      exportToCSV(csvData, `Laporan_Laba_Rugi_${selectedMonth}_${selectedYear}`);
      toast.success('CSV berhasil diekspor');
    } catch (error) {
      console.error('Export CSV error:', error);
      toast.error('Gagal mengekspor CSV');
    }
  };

  const handleExportPDFBagiHasil = async (data: BagiHasilReportData) => {
    setIsExporting(true);
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);

      const doc = new jsPDF('portrait');
      
      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Koperasi', 105, 20, { align: 'center' });
      
      doc.setFontSize(16);
      doc.text('Laporan Bagi Hasil', 105, 30, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const periodText = `Untuk Periode yang Berakhir pada ${format(new Date(dateRange.endDate), 'dd MMMM yyyy', { locale: localeId })}`;
      doc.text(periodText, 105, 40, { align: 'center', maxWidth: 180 });
      
      // Summary table
      const summaryData = [
        ['Total Penjualan', formatRupiah(data.summary.totalPenjualan).replace('Rp', '').trim()],
        ['Bagian Yayasan (70%)', formatRupiah(data.summary.totalBagianYayasan).replace('Rp', '').trim()],
        ['Bagian Koperasi (30%)', formatRupiah(data.summary.totalBagianKoperasi).replace('Rp', '').trim()],
        ['Status Setoran', data.summary.statusSetoran],
      ];

      autoTable(doc, {
        head: [['Keterangan', 'Jumlah']],
        body: summaryData,
        startY: 50,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
      });

      // Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(10);
      doc.text('Mengetahui,', 30, pageHeight - 50);
      doc.text('Direktur', 30, pageHeight - 30);
      
      const location = 'Mojokerto';
      const date = format(new Date(), 'dd MMMM yyyy', { locale: localeId });
      doc.text(`${location}, ${date}`, 150, pageHeight - 30);
      doc.text('Dibuat oleh,', 150, pageHeight - 50);
      doc.text('Bagian Akuntansi', 150, pageHeight - 30);

      const filename = `Laporan_Bagi_Hasil_${selectedMonth}_${selectedYear}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(filename);
      toast.success('PDF berhasil diekspor');
    } catch (error) {
      console.error('Export PDF error:', error);
      toast.error('Gagal mengekspor PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSVBagiHasil = (data: BagiHasilReportData) => {
    try {
      const csvData = [
        {
          'Keterangan': 'Total Penjualan',
          'Jumlah': data.summary.totalPenjualan,
        },
        {
          'Keterangan': 'Bagian Yayasan (70%)',
          'Jumlah': data.summary.totalBagianYayasan,
        },
        {
          'Keterangan': 'Bagian Koperasi (30%)',
          'Jumlah': data.summary.totalBagianKoperasi,
        },
        {
          'Keterangan': 'Status Setoran',
          'Jumlah': data.summary.statusSetoran,
        },
      ];

      exportToCSV(csvData, `Laporan_Bagi_Hasil_${selectedMonth}_${selectedYear}`);
      toast.success('CSV berhasil diekspor');
    } catch (error) {
      console.error('Export CSV error:', error);
      toast.error('Gagal mengekspor CSV');
    }
  };

  const handleExportPDFPersediaan = async (data: PersediaanReportData) => {
    setIsExporting(true);
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);

      const doc = new jsPDF('landscape');
      
      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Koperasi', 148, 20, { align: 'center' });
      
      doc.setFontSize(16);
      doc.text('Laporan Persediaan & Modal', 148, 30, { align: 'center' });
      
      // Summary
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Modal Koperasi: ${formatRupiah(data.summary.modalKoperasi)}`, 20, 45);
      doc.text(`Nilai Stok Yayasan: ${formatRupiah(data.summary.nilaiStokYayasan)}`, 20, 52);
      doc.text(`Total Nilai Persediaan: ${formatRupiah(data.summary.totalNilai)}`, 20, 59);
      
      // Table data
      const tableData = data.details.map((item) => [
        item.kode_produk,
        item.nama_produk,
        item.owner_type,
        `${item.stok} ${item.satuan}`,
        formatRupiah(item.hpp).replace('Rp', '').trim(),
        formatRupiah(item.nilai).replace('Rp', '').trim(),
      ]);

      autoTable(doc, {
        head: [['Kode', 'Nama Produk', 'Owner', 'Stok', 'HPP', 'Nilai']],
        body: tableData,
        startY: 65,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
      });

      const filename = `Laporan_Persediaan_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(filename);
      toast.success('PDF berhasil diekspor');
    } catch (error) {
      console.error('Export PDF error:', error);
      toast.error('Gagal mengekspor PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSVPersediaan = (data: PersediaanReportData) => {
    try {
      const csvData = data.details.map((item) => ({
        'Kode Produk': item.kode_produk,
        'Nama Produk': item.nama_produk,
        'Owner': item.owner_type,
        'Stok': item.stok,
        'Satuan': item.satuan,
        'HPP': item.hpp,
        'Nilai': item.nilai,
      }));

      exportToCSV(csvData, `Laporan_Persediaan_${format(new Date(), 'yyyy-MM-dd')}`);
      toast.success('CSV berhasil diekspor');
    } catch (error) {
      console.error('Export CSV error:', error);
      toast.error('Gagal mengekspor CSV');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header dengan style seperti simpleakunting */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Laporan Koperasi</h1>
              <p className="text-sm text-gray-500 mt-1">Data diperbarui otomatis setiap 5 detik</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Report Type Selection dengan style seperti dropdown siap cetak */}
          <div className="lg:col-span-1">
            <Card className="shadow-md border-2">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="text-base font-semibold">Jenis Laporan</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1 p-2">
                  <button
                    onClick={() => setActiveReport('laba-rugi')}
                    className={`w-full text-left px-4 py-3 rounded-md transition-all ${
                      activeReport === 'laba-rugi'
                        ? 'bg-blue-600 text-white shadow-md font-semibold'
                        : 'hover:bg-gray-100 text-gray-700 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      <span>Laba Rugi</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveReport('persediaan')}
                    className={`w-full text-left px-4 py-3 rounded-md transition-all ${
                      activeReport === 'persediaan'
                        ? 'bg-blue-600 text-white shadow-md font-semibold'
                        : 'hover:bg-gray-100 text-gray-700 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      <span>Persediaan & Modal</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveReport('bagi-hasil')}
                    className={`w-full text-left px-4 py-3 rounded-md transition-all ${
                      activeReport === 'bagi-hasil'
                        ? 'bg-blue-600 text-white shadow-md font-semibold'
                        : 'hover:bg-gray-100 text-gray-700 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <span>Bagi Hasil</span>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Period Selector - Style seperti simpleakunting */}
            {activeReport !== 'persediaan' && (
              <Card className="shadow-md border-2">
                <CardHeader className="bg-gray-50 border-b">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Pilih Periode
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex gap-2 flex-1">
                      <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-full sm:w-[180px] border-2">
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
                        <SelectTrigger className="w-full sm:w-[120px] border-2">
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
                    <Button 
                      onClick={() => {
                        queryClient.invalidateQueries({ queryKey: ['laporan-laba-rugi'] });
                        queryClient.invalidateQueries({ queryKey: ['laporan-bagi-hasil'] });
                        queryClient.invalidateQueries({ queryKey: ['laporan-persediaan'] });
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Tampilkan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Report Content - Style siap cetak */}
            {isLoading ? (
              <Card className="shadow-md">
                <CardContent className="py-12">
                  <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">Memuat data...</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {activeReport === 'persediaan' && persediaanData && (
                  <PersediaanReportView 
                    data={persediaanData} 
                    onExportPDF={() => handleExportPDFPersediaan(persediaanData)}
                    onExportCSV={() => handleExportCSVPersediaan(persediaanData)}
                  />
                )}
                {activeReport === 'laba-rugi' && labaRugiData && (
                  <LabaRugiReportView 
                    data={labaRugiData} 
                    dateRange={dateRange}
                    selectedMonth={months[parseInt(selectedMonth) - 1]?.label || ''}
                    selectedYear={selectedYear}
                    onExportPDF={() => handleExportPDFLabaRugi(labaRugiData)}
                    onExportCSV={() => handleExportCSVLabaRugi(labaRugiData)}
                  />
                )}
                {activeReport === 'bagi-hasil' && bagiHasilData && (
                  <BagiHasilReportView 
                    data={bagiHasilData} 
                    dateRange={dateRange}
                    selectedMonth={months[parseInt(selectedMonth) - 1]?.label || ''}
                    selectedYear={selectedYear}
                    onExportPDF={() => handleExportPDFBagiHasil(bagiHasilData)}
                    onExportCSV={() => handleExportCSVBagiHasil(bagiHasilData)}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// PERSEDIAAN REPORT VIEW
// =====================================================
const PersediaanReportView = ({ 
  data, 
  onExportPDF, 
  onExportCSV 
}: { 
  data: PersediaanReportData;
  onExportPDF: () => void;
  onExportCSV: () => void;
}) => {
  return (
    <>
      {/* Report Card - Style seperti simpleakunting, siap cetak */}
      <Card className="shadow-lg border-2 bg-white">
        <CardContent className="p-0">
          {/* Report Header */}
          <div className="bg-white border-b-2 border-gray-200 py-6 px-6">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Koperasi</h2>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Laporan Persediaan & Modal</h3>
              <p className="text-sm text-gray-600">
                Per Tanggal {format(new Date(), 'dd MMMM yyyy', { locale: localeId })}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                onClick={onExportCSV}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export XLS
              </Button>
              <Button
                onClick={onExportPDF}
                className="bg-red-600 hover:bg-red-700 text-white"
                size="sm"
              >
                <FileText className="h-4 w-4 mr-2" />
                Cetak PDF
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 border-b-2 border-gray-200">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-gray-600 mb-2">Modal Koperasi di Stok</p>
              <div className="text-2xl font-bold text-blue-600">
                {formatRupiah(data.summary.modalKoperasi)}
              </div>
            </div>
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
              <p className="text-sm font-medium text-gray-600 mb-2">Nilai Stok Yayasan</p>
              <div className="text-2xl font-bold text-emerald-600">
                {formatRupiah(data.summary.nilaiStokYayasan)}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm font-medium text-gray-600 mb-2">Total Nilai Persediaan</p>
              <div className="text-2xl font-bold text-gray-900">
                {formatRupiah(data.summary.totalNilai)}
              </div>
            </div>
          </div>

          {/* Detail Table */}
          <div className="p-6">
            <div className="overflow-x-auto">
              <Table className="border-collapse">
                <TableHeader>
                  <TableRow className="bg-gray-100 border-b-2 border-gray-300">
                    <TableHead className="font-semibold text-gray-900 py-3 px-4">Kode</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3 px-4">Nama Produk</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3 px-4">Owner</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3 px-4 text-right">Stok</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3 px-4 text-right">HPP</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3 px-4 text-right">Nilai</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.details.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        Tidak ada data
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.details.map((item) => (
                      <TableRow key={item.id} className="border-b border-gray-200">
                        <TableCell className="py-3 px-4 font-mono text-sm">{item.kode_produk}</TableCell>
                        <TableCell className="py-3 px-4 font-medium">{item.nama_produk}</TableCell>
                        <TableCell className="py-3 px-4">
                          <Badge
                            variant="outline"
                            className={
                              item.owner_type === 'koperasi'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }
                          >
                            {item.owner_type === 'koperasi' ? (
                              <Store className="w-3 h-3 mr-1" />
                            ) : (
                              <Building2 className="w-3 h-3 mr-1" />
                            )}
                            {item.owner_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right font-mono">
                          {item.stok} {item.satuan}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right font-mono">{formatRupiah(item.hpp)}</TableCell>
                        <TableCell className="py-3 px-4 text-right font-mono font-semibold">
                          {formatRupiah(item.nilai)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Signature Section */}
          <div className="bg-gray-50 border-t-2 border-gray-200 py-6 px-6">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-sm text-gray-600 mb-8">Mengetahui,</p>
                <div className="border-t border-gray-300 pt-2">
                  <p className="font-semibold text-gray-900">Direktur</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-2">
                  {format(new Date(), "'Mojokerto,' dd MMMM yyyy", { locale: localeId })}
                </p>
                <p className="text-sm text-gray-600 mb-8">Dibuat oleh,</p>
                <div className="border-t border-gray-300 pt-2">
                  <p className="font-semibold text-gray-900">Bagian Akuntansi</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

// =====================================================
// LABA RUGI REPORT VIEW
// =====================================================
const LabaRugiReportView = ({
  data,
  dateRange,
  selectedMonth,
  selectedYear,
  onExportPDF,
  onExportCSV,
}: {
  data: LabaRugiReportData;
  dateRange: { startDate: string; endDate: string };
  selectedMonth: string;
  selectedYear: string;
  onExportPDF: () => void;
  onExportCSV: () => void;
}) => {
  return (
    <>
      {/* Report Card - Style seperti simpleakunting, siap cetak */}
      <Card className="shadow-lg border-2 bg-white">
        <CardContent className="p-0">
          {/* Report Header */}
          <div className="bg-white border-b-2 border-gray-200 py-6 px-6">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Koperasi</h2>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Laporan Laba Rugi</h3>
              <p className="text-sm text-gray-600">
                Untuk Periode yang Berakhir pada {format(new Date(dateRange.endDate), 'dd MMMM yyyy', { locale: localeId })}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                onClick={onExportCSV}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export XLS
              </Button>
              <Button
                onClick={onExportPDF}
                className="bg-red-600 hover:bg-red-700 text-white"
                size="sm"
              >
                <FileText className="h-4 w-4 mr-2" />
                Cetak PDF
              </Button>
            </div>
          </div>

          {/* Report Table - Style siap cetak */}
          <div className="p-6">
            <div className="overflow-x-auto">
              <Table className="border-collapse">
                <TableHeader>
                  <TableRow className="bg-gray-100 border-b-2 border-gray-300">
                    <TableHead className="font-semibold text-gray-900 py-3 px-4 text-left">Keterangan</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3 px-4 text-right">Jumlah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-b border-gray-200">
                    <TableCell className="py-3 px-4 font-medium">Pendapatan</TableCell>
                    <TableCell className="py-3 px-4 text-right"></TableCell>
                  </TableRow>
                  <TableRow className="border-b border-gray-200 bg-gray-50">
                    <TableCell className="py-3 px-4 pl-8">Total Pendapatan</TableCell>
                    <TableCell className="py-3 px-4 text-right font-mono font-semibold">{formatRupiah(data.penjualanBersih)}</TableCell>
                  </TableRow>
                  <TableRow className="border-b border-gray-200">
                    <TableCell className="py-3 px-4 font-medium">Beban Pokok Penjualan</TableCell>
                    <TableCell className="py-3 px-4 text-right"></TableCell>
                  </TableRow>
                  <TableRow className="border-b-2 border-gray-400 bg-gray-50">
                    <TableCell className="py-3 px-4 pl-8 font-semibold">Laba Kotor</TableCell>
                    <TableCell className={`py-3 px-4 text-right font-mono font-bold text-lg ${data.labaKotor >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatRupiah(data.labaKotor)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-b border-gray-200">
                    <TableCell className="py-3 px-4 font-medium">Beban Operasional</TableCell>
                    <TableCell className="py-3 px-4 text-right"></TableCell>
                  </TableRow>
                  <TableRow className="border-b border-gray-200 bg-gray-50">
                    <TableCell className="py-3 px-4 pl-8">Total Beban</TableCell>
                    <TableCell className="py-3 px-4 text-right font-mono text-red-600">({formatRupiah(data.bebanOperasional)})</TableCell>
                  </TableRow>
                  <TableRow className="border-t-2 border-gray-400 bg-blue-50">
                    <TableCell className="py-4 px-4 font-bold text-lg">LABA (RUGI) BERSIH</TableCell>
                    <TableCell className={`py-4 px-4 text-right font-mono font-bold text-xl ${data.labaBersih >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatRupiah(data.labaBersih)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Signature Section */}
          <div className="bg-gray-50 border-t-2 border-gray-200 py-6 px-6">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-sm text-gray-600 mb-8">Mengetahui,</p>
                <div className="border-t border-gray-300 pt-2">
                  <p className="font-semibold text-gray-900">Direktur</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-2">
                  {format(new Date(), "'Mojokerto,' dd MMMM yyyy", { locale: localeId })}
                </p>
                <p className="text-sm text-gray-600 mb-8">Dibuat oleh,</p>
                <div className="border-t border-gray-300 pt-2">
                  <p className="font-semibold text-gray-900">Bagian Akuntansi</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Breakdown Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Beban Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Beban Operasional</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.breakdown.beban.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-500 py-4">
                        Tidak ada beban operasional
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.breakdown.beban.map((beban, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-sm">
                          {format(new Date(beban.tanggal), 'd MMM yyyy', { locale: localeId })}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{beban.kategori}</div>
                            {beban.sub_kategori && (
                              <div className="text-xs text-gray-500">{beban.sub_kategori}</div>
                            )}
                            {beban.deskripsi && (
                              <div className="text-xs text-gray-400">{beban.deskripsi}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatRupiah(beban.jumlah)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Penjualan Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Penjualan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>No. Penjualan</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.breakdown.penjualan.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-500 py-4">
                        Tidak ada penjualan
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.breakdown.penjualan.slice(0, 10).map((penjualan, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-sm">
                          {format(new Date(penjualan.tanggal), 'd MMM yyyy', { locale: localeId })}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{penjualan.no_penjualan}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatRupiah(penjualan.total)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

// =====================================================
// BAGI HASIL REPORT VIEW
// =====================================================
const BagiHasilReportView = ({
  data,
  dateRange,
  selectedMonth,
  selectedYear,
  onExportPDF,
  onExportCSV,
}: {
  data: BagiHasilReportData;
  dateRange: { startDate: string; endDate: string };
  selectedMonth: string;
  selectedYear: string;
  onExportPDF: () => void;
  onExportCSV: () => void;
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sudah':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Sudah
          </Badge>
        );
      case 'sebagian':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Sebagian
          </Badge>
        );
      case 'belum':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Belum
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
            Tidak Ada
          </Badge>
        );
    }
  };

  return (
    <>
      {/* Report Card - Style seperti simpleakunting, siap cetak */}
      <Card className="shadow-lg border-2 bg-white">
        <CardContent className="p-0">
          {/* Report Header */}
          <div className="bg-white border-b-2 border-gray-200 py-6 px-6">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Koperasi</h2>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Laporan Bagi Hasil</h3>
              <p className="text-sm text-gray-600">
                Untuk Periode yang Berakhir pada {format(new Date(dateRange.endDate), 'dd MMMM yyyy', { locale: localeId })}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                onClick={onExportCSV}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export XLS
              </Button>
              <Button
                onClick={onExportPDF}
                className="bg-red-600 hover:bg-red-700 text-white"
                size="sm"
              >
                <FileText className="h-4 w-4 mr-2" />
                Cetak PDF
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 border-b-2 border-gray-200">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm font-medium text-gray-600 mb-2">Total Penjualan</p>
              <div className="text-xl font-bold text-gray-900">
                {formatRupiah(data.summary.totalPenjualan)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Produk yayasan</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
              <p className="text-sm font-medium text-gray-600 mb-2">Bagian Yayasan</p>
              <div className="text-xl font-bold text-emerald-600">
                {formatRupiah(data.summary.totalBagianYayasan)}
              </div>
              <p className="text-xs text-gray-500 mt-1">70% dari margin</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-gray-600 mb-2">Bagian Koperasi</p>
              <div className="text-xl font-bold text-blue-600">
                {formatRupiah(data.summary.totalBagianKoperasi)}
              </div>
              <p className="text-xs text-gray-500 mt-1">30% dari margin</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-sm font-medium text-gray-600 mb-2">Status Setoran</p>
              <div className="mt-2">{getStatusBadge(data.summary.statusSetoran)}</div>
              <p className="text-xs text-gray-500 mt-2">Status pembayaran</p>
            </div>
          </div>

          {/* Detail Table */}
          <div className="p-6">
            <h4 className="text-base font-semibold mb-4">Detail Penjualan Produk Yayasan</h4>
            <div className="overflow-x-auto">
              <Table className="border-collapse">
                <TableHeader>
                  <TableRow className="bg-gray-100 border-b-2 border-gray-300">
                    <TableHead className="font-semibold text-gray-900 py-3 px-4">Tanggal</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3 px-4">No. Penjualan</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3 px-4 text-right">Total Penjualan</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3 px-4 text-right">Bagian Yayasan</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3 px-4 text-right">Bagian Koperasi</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3 px-4 text-center">Status Setoran</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.details.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        Tidak ada data penjualan produk yayasan
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.details.map((item) => (
                      <TableRow key={item.id} className="border-b border-gray-200">
                        <TableCell className="py-3 px-4 text-sm">
                          {format(new Date(item.tanggal), 'd MMM yyyy', { locale: localeId })}
                        </TableCell>
                        <TableCell className="py-3 px-4 font-mono text-sm">{item.no_penjualan}</TableCell>
                        <TableCell className="py-3 px-4 text-right font-mono">
                          {formatRupiah(item.total_penjualan)}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right font-mono text-emerald-600">
                          {formatRupiah(item.bagian_yayasan)}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right font-mono text-blue-600">
                          {formatRupiah(item.bagian_koperasi)}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-center">
                          {getStatusBadge(item.status_setoran)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Setoran History */}
          {data.setoranHistory.length > 0 && (
            <div className="p-6 border-t-2 border-gray-200">
              <h4 className="text-base font-semibold mb-4">Riwayat Setoran</h4>
              <div className="overflow-x-auto">
                <Table className="border-collapse">
                  <TableHeader>
                    <TableRow className="bg-gray-100 border-b-2 border-gray-300">
                      <TableHead className="font-semibold text-gray-900 py-3 px-4">Tanggal</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3 px-4 text-right">Jumlah</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3 px-4">Keterangan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.setoranHistory.map((setoran) => (
                      <TableRow key={setoran.id} className="border-b border-gray-200">
                        <TableCell className="py-3 px-4 text-sm">
                          {format(new Date(setoran.tanggal), 'd MMM yyyy', { locale: localeId })}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right font-mono font-semibold text-emerald-600">
                          {formatRupiah(setoran.jumlah)}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-sm text-gray-600">
                          {setoran.keterangan || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Signature Section */}
          <div className="bg-gray-50 border-t-2 border-gray-200 py-6 px-6">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-sm text-gray-600 mb-8">Mengetahui,</p>
                <div className="border-t border-gray-300 pt-2">
                  <p className="font-semibold text-gray-900">Direktur</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-2">
                  {format(new Date(), "'Mojokerto,' dd MMMM yyyy", { locale: localeId })}
                </p>
                <p className="text-sm text-gray-600 mb-8">Dibuat oleh,</p>
                <div className="border-t border-gray-300 pt-2">
                  <p className="font-semibold text-gray-900">Bagian Akuntansi</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default LaporanPage;
