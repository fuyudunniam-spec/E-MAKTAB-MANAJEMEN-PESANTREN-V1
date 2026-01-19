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
import { FileText, Printer, TrendingUp, BookOpen, History, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, getMonth, getYear } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { EditBagiHasilDialog } from './components/EditBagiHasilDialog';

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

            // ✅ NEW: Get transfer ke yayasan dari tabel keuangan
            const { data: transferData } = await supabase
                .from('keuangan')
                .select('id, tanggal, jumlah, deskripsi, kategori')
                .eq('kategori', 'Transfer dari Koperasi')
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

            // ✅ NEW: Add transfer transactions
            (transferData || []).forEach((transfer) => {
                combined.push({
                    id: transfer.id,
                    tanggal: transfer.tanggal,
                    kode: `TF-${transfer.id.slice(0, 8)}`,
                    uraian: `🏛️ Transfer ke Yayasan\n${transfer.deskripsi || ''}`,
                    debet: 0,
                    kredit: transfer.jumlah, // Pengeluaran dari koperasi
                });
            });

            // Sort by date
            combined.sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

            return combined;
        },
    });

    // Fetch profit/loss data - SEPARATED BY OWNER TYPE
    const { data: labaRugiData, isLoading: isLoadingLabaRugi } = useQuery({
        queryKey: ['laporan-laba-rugi', dateRange.startDate, dateRange.endDate],
        queryFn: async () => {
            // Get detailed sales with owner type from kop_penjualan_detail
            const { data: salesDetails } = await supabase
                .from('kop_penjualan_detail')
                .select(`
                    barang_owner_type_snapshot,
                    subtotal,
                    hpp_snapshot,
                    jumlah,
                    kop_penjualan!inner(tanggal)
                `)
                .gte('kop_penjualan.tanggal', dateRange.startDate.toISOString().split('T')[0])
                .lte('kop_penjualan.tanggal', dateRange.endDate.toISOString().split('T')[0]);

            // Separate by owner type
            const yayasanItems = (salesDetails || []).filter(d => d.barang_owner_type_snapshot === 'yayasan');
            const koperasiItems = (salesDetails || []).filter(d => d.barang_owner_type_snapshot === 'koperasi');

            // Calculate Yayasan items
            const omsetYayasan = yayasanItems.reduce((sum, d) => sum + (d.subtotal || 0), 0);
            const hppYayasan = yayasanItems.reduce((sum, d) => sum + ((d.hpp_snapshot || 0) * (d.jumlah || 0)), 0);
            const marginYayasan = omsetYayasan - hppYayasan;

            // Calculate Koperasi items
            const omsetKoperasi = koperasiItems.reduce((sum, d) => sum + (d.subtotal || 0), 0);
            const hppKoperasi = koperasiItems.reduce((sum, d) => sum + ((d.hpp_snapshot || 0) * (d.jumlah || 0)), 0);
            const labaKotorKoperasi = omsetKoperasi - hppKoperasi;

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

            const totalOperasional = (expenses || []).reduce((sum, e) => sum + (e.jumlah || 0), 0);

            // Get transfers to Yayasan
            const { data: transfers } = await supabase
                .from('keuangan')
                .select('jumlah')
                .eq('kategori', 'Transfer dari Koperasi')
                .gte('tanggal', dateRange.startDate.toISOString().split('T')[0])
                .lte('tanggal', dateRange.endDate.toISOString().split('T')[0]);

            const totalTransfer = (transfers || []).reduce((sum, t) => sum + Number(t.jumlah), 0);

            // Get jasa pengelolaan if any
            const { data: jasaData } = await supabase
                .from('keuangan_koperasi')
                .select('jumlah')
                .in('akun_kas_id', accountIds)
                .eq('jenis_transaksi', 'Pemasukan')
                .eq('kategori', 'Jasa Pengelolaan')
                .gte('tanggal', dateRange.startDate.toISOString().split('T')[0])
                .lte('tanggal', dateRange.endDate.toISOString().split('T')[0]);

            const jasaPengelolaan = (jasaData || []).reduce((sum, j) => sum + (j.jumlah || 0), 0);

            // Calculate final profit for Koperasi
            // Mode: Transfer Omset → Kewajiban = Omset Yayasan
            const kewajibanYayasan = omsetYayasan - totalOperasional; // Dikurangi operasional
            const sisaKewajiban = kewajibanYayasan - totalTransfer;

            // Total laba koperasi = Laba barang koperasi + Jasa pengelolaan
            const labaBersihKoperasi = labaKotorKoperasi + jasaPengelolaan;

            return {
                // Barang Yayasan
                omsetYayasan,
                hppYayasan,
                marginYayasan,
                kewajibanYayasan,
                totalTransfer,
                sisaKewajiban,
                // Barang Koperasi
                omsetKoperasi,
                hppKoperasi,
                labaKotorKoperasi,
                // Operasional
                totalOperasional,
                // Jasa & Total
                jasaPengelolaan,
                labaBersihKoperasi,
                // Legacy fields for compatibility
                penjualan: omsetYayasan + omsetKoperasi,
                hpp: hppYayasan + hppKoperasi,
                labaKotor: (omsetYayasan + omsetKoperasi) - (hppYayasan + hppKoperasi),
                bebanOperasional: totalOperasional,
                labaBersih: labaBersihKoperasi - sisaKewajiban // Net after pending transfer
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
    isLoading,
    dateRange
}: {
    data: any;
    periodLabel: string;
    isLoading: boolean;
}) => {
    // Data transfer sudah ada di labaRugiData (totalTransfer, sisaKewajiban, dll)


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
                <div className="p-4 sm:p-6 max-w-2xl mx-auto">
                    <div className="space-y-4">

                        {/* ═══ BAGIAN A: BARANG KOPERASI ═══ */}
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                            <h4 className="font-bold text-sm mb-3 text-emerald-800 flex items-center gap-2">
                                <span className="text-lg">🏪</span>
                                BAGIAN A: PENJUALAN BARANG KOPERASI
                            </h4>
                            {data.omsetKoperasi > 0 ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Penjualan Item Koperasi</span>
                                        <span className="font-mono">{formatRupiah(data.omsetKoperasi)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">HPP Item Koperasi</span>
                                        <span className="font-mono text-red-600">({formatRupiah(data.hppKoperasi)})</span>
                                    </div>
                                    <div className="flex justify-between font-semibold pt-2 border-t border-emerald-300">
                                        <span>Laba Kotor Barang Koperasi</span>
                                        <span className="font-mono text-emerald-700">{formatRupiah(data.labaKotorKoperasi)}</span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic">Tidak ada penjualan barang milik koperasi pada periode ini.</p>
                            )}
                        </div>

                        {/* ═══ BAGIAN B: PENGELOLAAN BARANG YAYASAN ═══ */}
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <h4 className="font-bold text-sm mb-3 text-amber-800 flex items-center gap-2">
                                <span className="text-lg">🏛️</span>
                                BAGIAN B: PENGELOLAAN BARANG YAYASAN
                            </h4>
                            {data.omsetYayasan > 0 ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Penjualan Item Yayasan</span>
                                        <span className="font-mono">{formatRupiah(data.omsetYayasan)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">HPP Item Yayasan</span>
                                        <span className="font-mono text-red-600">({formatRupiah(data.hppYayasan)})</span>
                                    </div>
                                    <div className="flex justify-between text-sm pt-2 border-t border-amber-200">
                                        <span>Margin Pengelolaan</span>
                                        <span className="font-mono">{formatRupiah(data.marginYayasan)}</span>
                                    </div>

                                    {/* Mode & Kewajiban */}
                                    <div className="mt-3 p-3 bg-white/60 rounded border border-amber-200">
                                        <div className="text-xs text-amber-700 mb-2 font-medium">
                                            Mode: Transfer Omset (100% omset - operasional)
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Operasional Dikurangi:</span>
                                            <span className="font-mono text-green-600">+{formatRupiah(data.totalOperasional)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm font-semibold">
                                            <span>Kewajiban ke Yayasan:</span>
                                            <span className="font-mono text-red-700">{formatRupiah(data.kewajibanYayasan)}</span>
                                        </div>
                                    </div>

                                    {/* Transfer */}
                                    <div className="mt-3 p-3 bg-purple-50 rounded border border-purple-200">
                                        <div className="flex justify-between text-sm">
                                            <span>Transfer ke Yayasan:</span>
                                            <span className="font-mono text-purple-700">({formatRupiah(data.totalTransfer)})</span>
                                        </div>
                                        <div className={`flex justify-between text-sm font-semibold ${data.sisaKewajiban <= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                            <span>{data.sisaKewajiban <= 0 ? 'Sisa/Lebih:' : 'Sisa Kewajiban:'}</span>
                                            <span className="font-mono">{formatRupiah(Math.abs(data.sisaKewajiban))}</span>
                                        </div>
                                    </div>

                                    {/* Jasa Pengelolaan */}
                                    {data.jasaPengelolaan > 0 && (
                                        <div className="flex justify-between text-sm pt-2 border-t border-amber-300 text-emerald-700">
                                            <span className="font-medium">Jasa Pengelolaan (Pemasukan Koperasi):</span>
                                            <span className="font-mono font-semibold">+{formatRupiah(data.jasaPengelolaan)}</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic">Tidak ada penjualan barang yayasan pada periode ini.</p>
                            )}
                        </div>

                        {/* ═══ RINGKASAN LABA RUGI KOPERASI ═══ */}
                        <div className="mt-6 p-4 bg-gray-100 border-2 border-gray-300 rounded-lg">
                            <h4 className="font-bold text-sm mb-3 text-gray-800">📊 RINGKASAN LABA RUGI KOPERASI</h4>
                            <div className="space-y-2">
                                {data.labaKotorKoperasi > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span>Laba Barang Koperasi:</span>
                                        <span className="font-mono text-emerald-700">+{formatRupiah(data.labaKotorKoperasi)}</span>
                                    </div>
                                )}
                                {data.jasaPengelolaan > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span>Jasa Pengelolaan:</span>
                                        <span className="font-mono text-emerald-700">+{formatRupiah(data.jasaPengelolaan)}</span>
                                    </div>
                                )}
                                {data.totalOperasional > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Beban Operasional:</span>
                                        <span className="font-mono text-red-600">({formatRupiah(data.totalOperasional)})</span>
                                    </div>
                                )}
                                {data.sisaKewajiban !== 0 && (
                                    <div className={`flex justify-between text-sm ${data.sisaKewajiban > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                        <span>{data.sisaKewajiban > 0 ? 'Kewajiban Transfer Pending:' : 'Transfer Lebih:'}</span>
                                        <span className="font-mono">{data.sisaKewajiban > 0 ? `(${formatRupiah(data.sisaKewajiban)})` : `+${formatRupiah(Math.abs(data.sisaKewajiban))}`}</span>
                                    </div>
                                )}
                                <div className={`flex justify-between py-3 border-t-2 border-gray-400 font-bold text-lg ${data.labaBersihKoperasi >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                    <span>TOTAL LABA (RUGI) KOPERASI:</span>
                                    <span className="font-mono">{formatRupiah(data.labaBersihKoperasi)}</span>
                                </div>
                            </div>

                            {/* Warning jika ada kewajiban pending */}
                            {data.sisaKewajiban > 0 && (
                                <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-800">
                                    ⚠️ <strong>Perhatian:</strong> Masih ada kewajiban transfer ke yayasan sebesar {formatRupiah(data.sisaKewajiban)} yang belum disetor.
                                </div>
                            )}
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
    const [editingItem, setEditingItem] = useState<any>(null);
    const [showEditDialog, setShowEditDialog] = useState(false);

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setShowEditDialog(true);
    };

    const handleCloseEdit = () => {
        setShowEditDialog(false);
        setEditingItem(null);
    };

    return (
        <>
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
                    <div className="p-2 sm:p-4 overflow-x-auto">
                        {isLoading ? (
                            <div className="text-center py-12 text-gray-500">Memuat data...</div>
                        ) : data.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">Belum ada riwayat bagi hasil</div>
                        ) : (
                            <div className="min-w-[800px]">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-100">
                                            <TableHead className="font-semibold min-w-[100px]">Periode</TableHead>
                                            <TableHead className="font-semibold min-w-[90px]">Rasio</TableHead>
                                            <TableHead className="text-right font-semibold min-w-[120px]">Penjualan</TableHead>
                                            <TableHead className="text-right font-semibold min-w-[130px]">Bagian Yayasan</TableHead>
                                            <TableHead className="text-right font-semibold min-w-[130px]">Bagian Koperasi</TableHead>
                                            <TableHead className="text-right font-semibold print:hidden min-w-[120px]">Transfer</TableHead>
                                            <TableHead className="font-semibold min-w-[90px]">Status</TableHead>
                                            <TableHead className="print:hidden font-semibold w-[60px]">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.map((item) => {
                                            const monthDate = new Date(item.tahun, item.bulan - 1, 1);
                                            const percY = Number(item.percentage_yayasan || 70).toFixed(0);
                                            const percK = Number(item.percentage_koperasi || 30).toFixed(0);
                                            const isCustom = item.is_custom || item.mode_kalkulasi === 'custom';
                                            const transferActual = Number(item.transfer_actual || 0);
                                            const selisih = Number(item.selisih_transfer || 0);

                                            return (
                                                <TableRow key={item.id} className="border-b hover:bg-gray-50">
                                                    <TableCell className="text-sm font-medium">
                                                        {format(monthDate, 'MMM yyyy', { locale: localeId })}
                                                    </TableCell>
                                                    <TableCell className="text-sm">
                                                        <div className="flex items-center gap-1">
                                                            <span className={`font-semibold ${isCustom ? 'text-purple-700' : 'text-gray-700'}`}>
                                                                {percY}:{percK}
                                                            </span>
                                                            {isCustom && (
                                                                <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                                                                    Custom
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-sm">
                                                        {formatRupiah(Number(item.total_penjualan || 0))}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-sm">
                                                        <div>
                                                            <span className="text-amber-700 font-semibold">
                                                                {formatRupiah(Number(item.bagian_yayasan || 0))}
                                                            </span>
                                                            <div className="text-xs text-gray-500">
                                                                ({percY}%)
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-sm">
                                                        <div>
                                                            <span className="text-green-700 font-semibold">
                                                                {formatRupiah(Number(item.bagian_koperasi || 0))}
                                                            </span>
                                                            <div className="text-xs text-gray-500">
                                                                ({percK}%)
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-sm print:hidden">
                                                        {transferActual > 0 ? (
                                                            <div>
                                                                <div className="text-blue-700 font-semibold">
                                                                    {formatRupiah(transferActual)}
                                                                </div>
                                                                {selisih !== 0 && (
                                                                    <div className={`text-xs ${selisih > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                        {selisih > 0 ? '+' : ''}{formatRupiah(selisih)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${item.status === 'paid'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-amber-100 text-amber-800'
                                                            }`}>
                                                            {item.status === 'paid' ? '✓ Lunas' : '⏳ Belum'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="print:hidden">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEdit(item)}
                                                            className="h-8 w-8 p-0 hover:bg-purple-100"
                                                            title="Edit bagi hasil"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>

                    {/* Info Footer */}
                    {!isLoading && data.length > 0 && (
                        <div className="px-3 sm:px-4 py-3 bg-gray-50 border-t text-xs text-gray-600 print:hidden">
                            <div className="flex flex-col sm:flex-row items-start gap-2">
                                <span className="font-semibold flex-shrink-0">💡 Keterangan:</span>
                                <div className="space-y-1">
                                    <div>• <strong>Rasio</strong>: Persentase bagi hasil (Koperasi:Yayasan)</div>
                                    <div>• <strong>Custom</strong>: Bagi hasil disesuaikan berdasarkan keputusan rapat</div>
                                    <div>• <strong>Transfer</strong>: Setoran aktual (hijau = lebih, merah = kurang)</div>
                                    <div className="hidden sm:block">• Klik tombol <Edit className="h-3 w-3 inline" /> untuk mengubah persentase</div>
                                    <div className="sm:hidden">• Tap ✏️ untuk edit</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <ReportFooter />
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            {editingItem && (
                <EditBagiHasilDialog
                    open={showEditDialog}
                    onClose={handleCloseEdit}
                    data={editingItem}
                />
            )}
        </>
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
