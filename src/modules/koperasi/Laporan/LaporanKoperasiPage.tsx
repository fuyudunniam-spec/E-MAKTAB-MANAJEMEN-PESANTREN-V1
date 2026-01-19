import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Printer, TrendingUp, BookOpen, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, getMonth, getYear } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

// Helper function
const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

// Generate month/year options
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

const currentYear = getYear(new Date());
const years = Array.from({ length: 6 }, (_, i) => String(currentYear - i));

// ============================
// MAIN COMPONENT
// ============================
const LaporanKoperasiPage = () => {
    const [activeTab, setActiveTab] = useState('buku-besar');
    const [selectedMonth, setSelectedMonth] = useState(String(getMonth(new Date()) + 1).padStart(2, '0'));
    const [selectedYear, setSelectedYear] = useState(String(currentYear));

    // Date range
    const dateRange = useMemo(() => {
        const monthNum = parseInt(selectedMonth) - 1;
        const yearNum = parseInt(selectedYear);
        const start = startOfMonth(new Date(yearNum, monthNum, 1));
        const end = endOfMonth(new Date(yearNum, monthNum, 1));
        return { startDate: start, endDate: end };
    }, [selectedMonth, selectedYear]);

    // Fetch transactions for Buku Besar
    const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery({
        queryKey: ['laporan-buku-besar', dateRange.startDate, dateRange.endDate],
        queryFn: async () => {
            // Get koperasi account IDs
            const { data: accounts } = await supabase
                .from('akun_kas')
                .select('id')
                .or('managed_by.eq.koperasi,nama.ilike.%koperasi%');

            const accountIds = (accounts || []).map(a => a.id);
            if (accountIds.length === 0) return [];

            // Get koperasi transactions
            const { data: keuanganData } = await supabase
                .from('keuangan_koperasi')
                .select('*')
                .in('akun_kas_id', accountIds)
                .gte('tanggal', dateRange.startDate.toISOString().split('T')[0])
                .lte('tanggal', dateRange.endDate.toISOString().split('T')[0])
                .order('tanggal', { ascending: true });

            // Get sales transactions
            const { data: salesData } = await supabase
                .from('kop_penjualan')
                .select('id, tanggal, total_transaksi, metode_pembayaran')
                .gte('tanggal', dateRange.startDate.toISOString().split('T')[0])
                .lte('tanggal', dateRange.endDate.toISOString().split('T')[0])
                .order('tanggal', { ascending: true });

            // Combine and format
            const combined: any[] = [];

            (salesData || []).forEach((sale) => {
                combined.push({
                    id: sale.id,
                    tanggal: sale.tanggal,
                    kode: `PJ-${sale.id.slice(0, 8)}`,
                    uraian: `Penjualan (${sale.metode_pembayaran})`,
                    debet: sale.total_transaksi,
                    kredit: 0,
                });
            });

            (keuanganData || []).forEach((tx) => {
                combined.push({
                    id: tx.id,
                    tanggal: tx.tanggal,
                    kode: tx.no_transaksi || `TX-${tx.id.slice(0, 8)}`,
                    uraian: tx.deskripsi || tx.kategori || '-',
                    debet: tx.jenis_transaksi === 'Pemasukan' ? tx.jumlah : 0,
                    kredit: tx.jenis_transaksi === 'Pengeluaran' ? tx.jumlah : 0,
                });
            });

            // Sort by date
            combined.sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

            return combined;
        },
    });

    // Fetch profit/loss data
    const { data: labaRugiData, isLoading: isLoadingLabaRugi } = useQuery({
        queryKey: ['laporan-laba-rugi', dateRange.startDate, dateRange.endDate],
        queryFn: async () => {
            // Get sales
            const { data: sales } = await supabase
                .from('kop_penjualan')
                .select('total_transaksi')
                .gte('tanggal', dateRange.startDate.toISOString().split('T')[0])
                .lte('tanggal', dateRange.endDate.toISOString().split('T')[0]);

            const totalPenjualan = (sales || []).reduce((sum, s) => sum + (s.total_transaksi || 0), 0);

            // Get HPP from sales details
            const { data: salesDetails } = await supabase
                .from('kop_penjualan_detail')
                .select('hpp_snapshot, jumlah, kop_penjualan!inner(tanggal)')
                .gte('kop_penjualan.tanggal', dateRange.startDate.toISOString().split('T')[0])
                .lte('kop_penjualan.tanggal', dateRange.endDate.toISOString().split('T')[0]);

            const totalHPP = (salesDetails || []).reduce((sum, d) => sum + ((d.hpp_snapshot || 0) * (d.jumlah || 0)), 0);

            // Get expenses
            const { data: accounts } = await supabase
                .from('akun_kas')
                .select('id')
                .or('managed_by.eq.koperasi,nama.ilike.%koperasi%');

            const accountIds = (accounts || []).map(a => a.id);

            const { data: expenses } = await supabase
                .from('keuangan_koperasi')
                .select('jumlah, kategori')
                .in('akun_kas_id', accountIds)
                .eq('jenis_transaksi', 'Pengeluaran')
                .gte('tanggal', dateRange.startDate.toISOString().split('T')[0])
                .lte('tanggal', dateRange.endDate.toISOString().split('T')[0]);

            const totalBeban = (expenses || []).reduce((sum, e) => sum + (e.jumlah || 0), 0);
            const labaKotor = totalPenjualan - totalHPP;
            const labaBersih = labaKotor - totalBeban;

            return {
                penjualan: totalPenjualan,
                hpp: totalHPP,
                labaKotor,
                bebanOperasional: totalBeban,
                labaBersih,
            };
        },
    });

    // Fetch bagi hasil history
    const { data: bagiHasilData = [], isLoading: isLoadingBagiHasil } = useQuery({
        queryKey: ['laporan-bagi-hasil'],
        queryFn: async () => {
            const { data } = await supabase
                .from('koperasi_bagi_hasil_log')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            return data || [];
        },
    });

    // Calculate running balance for Buku Besar
    const transactionsWithBalance = useMemo(() => {
        let saldo = 0;
        return transactions.map((tx) => {
            saldo = saldo + tx.debet - tx.kredit;
            return { ...tx, saldo };
        });
    }, [transactions]);

    // Print handler
    const handlePrint = () => {
        window.print();
    };

    const isLoading = isLoadingTransactions || isLoadingLabaRugi || isLoadingBagiHasil;
    const periodLabel = `${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`;

    return (
        <div className="min-h-screen bg-gray-50 print:bg-white">
            {/* Header - Hidden on print */}
            <div className="bg-white border-b print:hidden">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Laporan Keuangan</h1>
                            <p className="text-sm text-gray-500">Santra Mart - Koperasi Pesantren</p>
                        </div>
                        <Button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700">
                            <Printer className="w-4 h-4 mr-2" />
                            Cetak PDF
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-6 print:px-0 print:py-0">
                {/* Period Selector - Hidden on print */}
                <div className="bg-white rounded-lg border p-4 mb-6 print:hidden">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-600">Periode:</span>
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger className="w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {months.map((m) => (
                                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger className="w-28">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map((y) => (
                                    <SelectItem key={y} value={y}>{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Tabs - Hidden on print */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="print:hidden">
                    <TabsList className="mb-6">
                        <TabsTrigger value="buku-besar" className="gap-2">
                            <BookOpen className="w-4 h-4" />
                            Buku Besar
                        </TabsTrigger>
                        <TabsTrigger value="laba-rugi" className="gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Laba Rugi
                        </TabsTrigger>
                        <TabsTrigger value="bagi-hasil" className="gap-2">
                            <History className="w-4 h-4" />
                            Riwayat Bagi Hasil
                        </TabsTrigger>
                    </TabsList>

                    {/* Buku Besar Tab */}
                    <TabsContent value="buku-besar">
                        <BukuBesarReport
                            transactions={transactionsWithBalance}
                            periodLabel={periodLabel}
                            isLoading={isLoading}
                        />
                    </TabsContent>

                    {/* Laba Rugi Tab */}
                    <TabsContent value="laba-rugi">
                        <LabaRugiReport
                            data={labaRugiData}
                            periodLabel={periodLabel}
                            isLoading={isLoading}
                        />
                    </TabsContent>

                    {/* Bagi Hasil Tab */}
                    <TabsContent value="bagi-hasil">
                        <BagiHasilReport
                            data={bagiHasilData}
                            isLoading={isLoading}
                        />
                    </TabsContent>
                </Tabs>

                {/* Print View - Only visible on print */}
                <div className="hidden print:block">
                    {activeTab === 'buku-besar' && (
                        <BukuBesarReport
                            transactions={transactionsWithBalance}
                            periodLabel={periodLabel}
                            isLoading={false}
                        />
                    )}
                    {activeTab === 'laba-rugi' && (
                        <LabaRugiReport
                            data={labaRugiData}
                            periodLabel={periodLabel}
                            isLoading={false}
                        />
                    )}
                    {activeTab === 'bagi-hasil' && (
                        <BagiHasilReport
                            data={bagiHasilData}
                            isLoading={false}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

// ============================
// BUKU BESAR REPORT COMPONENT
// ============================
const BukuBesarReport = ({
    transactions,
    periodLabel,
    isLoading
}: {
    transactions: any[];
    periodLabel: string;
    isLoading: boolean;
}) => {
    const totals = useMemo(() => {
        return transactions.reduce((acc, tx) => ({
            debet: acc.debet + tx.debet,
            kredit: acc.kredit + tx.kredit,
        }), { debet: 0, kredit: 0 });
    }, [transactions]);

    return (
        <Card className="border-2 shadow-sm print:shadow-none print:border-0">
            <CardContent className="p-0">
                {/* Report Header */}
                <div className="text-center py-6 border-b-2 border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">SANTRA MART</h2>
                    <p className="text-sm text-gray-600">Koperasi Pesantren Anak Yatim Al-Bisri</p>
                    <div className="mt-4">
                        <h3 className="text-lg font-semibold text-gray-800">BUKU BESAR</h3>
                        <p className="text-sm text-gray-500">Periode: {periodLabel}</p>
                    </div>
                </div>

                {/* Table */}
                <div className="p-4">
                    {isLoading ? (
                        <div className="text-center py-12 text-gray-500">Memuat data...</div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">Tidak ada transaksi</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-100">
                                    <TableHead className="w-24 font-semibold">Tanggal</TableHead>
                                    <TableHead className="w-32 font-semibold">Kode</TableHead>
                                    <TableHead className="font-semibold">Uraian</TableHead>
                                    <TableHead className="text-right font-semibold w-32">Debet</TableHead>
                                    <TableHead className="text-right font-semibold w-32">Kredit</TableHead>
                                    <TableHead className="text-right font-semibold w-36">Saldo</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map((tx) => (
                                    <TableRow key={tx.id} className="border-b">
                                        <TableCell className="font-mono text-sm">
                                            {format(new Date(tx.tanggal), 'dd/MM/yy')}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">{tx.kode}</TableCell>
                                        <TableCell className="text-sm">{tx.uraian}</TableCell>
                                        <TableCell className={`text-right font-mono text-sm ${tx.debet > 0 ? 'text-green-700' : 'text-gray-400'}`}>
                                            {tx.debet > 0 ? formatRupiah(tx.debet) : '-'}
                                        </TableCell>
                                        <TableCell className={`text-right font-mono text-sm ${tx.kredit > 0 ? 'text-red-700' : 'text-gray-400'}`}>
                                            {tx.kredit > 0 ? formatRupiah(tx.kredit) : '-'}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm font-semibold">
                                            {formatRupiah(tx.saldo)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {/* Total Row */}
                                <TableRow className="bg-gray-100 font-bold">
                                    <TableCell colSpan={3} className="text-right">TOTAL</TableCell>
                                    <TableCell className="text-right font-mono text-green-700">{formatRupiah(totals.debet)}</TableCell>
                                    <TableCell className="text-right font-mono text-red-700">{formatRupiah(totals.kredit)}</TableCell>
                                    <TableCell className="text-right font-mono">{formatRupiah(totals.debet - totals.kredit)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    )}
                </div>

                {/* Footer */}
                <ReportFooter />
            </CardContent>
        </Card>
    );
};

// ============================
// LABA RUGI REPORT COMPONENT
// ============================
const LabaRugiReport = ({
    data,
    periodLabel,
    isLoading
}: {
    data: any;
    periodLabel: string;
    isLoading: boolean;
}) => {
    if (isLoading || !data) {
        return (
            <Card className="border-2 shadow-sm">
                <CardContent className="py-12 text-center text-gray-500">
                    Memuat data...
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-2 shadow-sm print:shadow-none print:border-0">
            <CardContent className="p-0">
                {/* Report Header */}
                <div className="text-center py-6 border-b-2 border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">SANTRA MART</h2>
                    <p className="text-sm text-gray-600">Koperasi Pesantren Anak Yatim Al-Bisri</p>
                    <div className="mt-4">
                        <h3 className="text-lg font-semibold text-gray-800">LAPORAN LABA RUGI</h3>
                        <p className="text-sm text-gray-500">Periode: {periodLabel}</p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 max-w-lg mx-auto">
                    <div className="space-y-3">
                        {/* Pendapatan */}
                        <div className="flex justify-between py-2 border-b">
                            <span className="font-medium">Penjualan</span>
                            <span className="font-mono">{formatRupiah(data.penjualan)}</span>
                        </div>

                        {/* HPP */}
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-600">Harga Pokok Penjualan (HPP)</span>
                            <span className="font-mono text-red-600">({formatRupiah(data.hpp)})</span>
                        </div>

                        {/* Laba Kotor */}
                        <div className="flex justify-between py-2 border-b-2 border-gray-300 font-semibold">
                            <span>Laba Kotor</span>
                            <span className="font-mono">{formatRupiah(data.labaKotor)}</span>
                        </div>

                        {/* Beban Operasional */}
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-600">Beban Operasional</span>
                            <span className="font-mono text-red-600">({formatRupiah(data.bebanOperasional)})</span>
                        </div>

                        {/* Laba Bersih */}
                        <div className={`flex justify-between py-3 border-t-2 border-b-2 border-gray-800 font-bold text-lg ${data.labaBersih >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            <span>LABA (RUGI) BERSIH</span>
                            <span className="font-mono">{formatRupiah(data.labaBersih)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <ReportFooter />
            </CardContent>
        </Card>
    );
};

// ============================
// BAGI HASIL REPORT COMPONENT
// ============================
const BagiHasilReport = ({
    data,
    isLoading
}: {
    data: any[];
    isLoading: boolean;
}) => {
    return (
        <Card className="border-2 shadow-sm print:shadow-none print:border-0">
            <CardContent className="p-0">
                {/* Report Header */}
                <div className="text-center py-6 border-b-2 border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">SANTRA MART</h2>
                    <p className="text-sm text-gray-600">Koperasi Pesantren Anak Yatim Al-Bisri</p>
                    <div className="mt-4">
                        <h3 className="text-lg font-semibold text-gray-800">RIWAYAT BAGI HASIL</h3>
                        <p className="text-sm text-gray-500">Rekap Pembagian Laba dengan Yayasan</p>
                    </div>
                </div>

                {/* Table */}
                <div className="p-4">
                    {isLoading ? (
                        <div className="text-center py-12 text-gray-500">Memuat data...</div>
                    ) : data.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">Belum ada riwayat bagi hasil</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-100">
                                    <TableHead className="font-semibold">Periode</TableHead>
                                    <TableHead className="font-semibold">Mode</TableHead>
                                    <TableHead className="text-right font-semibold">Penjualan</TableHead>
                                    <TableHead className="text-right font-semibold">Bagian Yayasan</TableHead>
                                    <TableHead className="text-right font-semibold">Bagian Koperasi</TableHead>
                                    <TableHead className="font-semibold">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((item) => (
                                    <TableRow key={item.id} className="border-b">
                                        <TableCell className="text-sm">
                                            {item.periode_start && format(new Date(item.periode_start), 'MMM yyyy', { locale: localeId })}
                                        </TableCell>
                                        <TableCell className="text-sm capitalize">{item.mode_kalkulasi || '-'}</TableCell>
                                        <TableCell className="text-right font-mono text-sm">
                                            {formatRupiah(item.total_penjualan || 0)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm text-amber-700">
                                            {formatRupiah(item.bagi_hasil_yayasan || 0)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm text-green-700">
                                            {formatRupiah(item.bagi_hasil_koperasi || 0)}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 text-xs rounded-full ${item.status === 'paid'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-amber-100 text-amber-800'
                                                }`}>
                                                {item.status === 'paid' ? 'Sudah Disetor' : 'Belum Disetor'}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>

                {/* Footer */}
                <ReportFooter />
            </CardContent>
        </Card>
    );
};

// ============================
// REPORT FOOTER COMPONENT
// ============================
const ReportFooter = () => {
    return (
        <div className="border-t-2 border-gray-200 p-6 bg-gray-50 print:bg-white">
            <div className="flex justify-between text-sm">
                <div>
                    <p className="text-gray-600 mb-6">Mengetahui,</p>
                    <div className="border-t border-gray-400 pt-1 w-40">
                        <p className="font-medium text-gray-900">Ketua Koperasi</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-gray-600">Mojokerto, {format(new Date(), 'd MMMM yyyy', { locale: localeId })}</p>
                    <p className="text-gray-600 mb-6">Dibuat oleh,</p>
                    <div className="border-t border-gray-400 pt-1 w-40 ml-auto">
                        <p className="font-medium text-gray-900">Bagian Keuangan</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LaporanKoperasiPage;
