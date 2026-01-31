import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    BookOpen,
    TrendingUp,
    AlertTriangle,
    RefreshCw
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PaperStyleReport from './components/PaperStyleReport';
import { MonthYearFilter } from '@/components/filters/MonthYearFilter';

export default function KeuanganLaporanPage() {
    const [activeTab, setActiveTab] = useState('buku-besar');
    const [filterMonth, setFilterMonth] = useState<number | undefined>(new Date().getMonth() + 1);
    const [filterYear, setFilterYear] = useState<number | undefined>(new Date().getFullYear());

    // Fetch comprehensive koperasi transactions for ledger
    const { data: transactions = [], isLoading, refetch } = useQuery({
        queryKey: ['koperasi-ledger-transactions', filterMonth, filterYear],
        queryFn: async () => {
            // Date range filter
            let startDateStr = '';
            let endDateStr = '';
            if (filterMonth && filterYear) {
                startDateStr = new Date(filterYear, filterMonth - 1, 1).toISOString().split('T')[0];
                endDateStr = new Date(filterYear, filterMonth, 0).toISOString().split('T')[0];
            }

            // 1. Fetch Sales (Income)
            let salesQuery = supabase
                .from('kop_penjualan')
                .select(`id, nomor_struk, tanggal, total_transaksi, total_bayar, metode_pembayaran, created_at`)
                .order('tanggal', { ascending: true });

            if (startDateStr && endDateStr) {
                salesQuery = salesQuery.gte('tanggal', startDateStr).lte('tanggal', endDateStr);
            }

            // 2. Fetch Koperasi Mutations (Expenses, Transfers, etc.)
            let mutationQuery = supabase
                .from('keuangan_koperasi')
                .select('*')
                .eq('status', 'posted')
                .order('tanggal', { ascending: true });

            if (startDateStr && endDateStr) {
                mutationQuery = mutationQuery.gte('tanggal', startDateStr).lte('tanggal', endDateStr);
            }

            // 3. Fetch from General Financial Table (Integrated transactions)
            let generalQuery = supabase
                .from('keuangan')
                .select('*')
                .eq('source_module', 'koperasi')
                .eq('status', 'posted')
                .order('tanggal', { ascending: true });

            if (startDateStr && endDateStr) {
                generalQuery = generalQuery.gte('tanggal', startDateStr).lte('tanggal', endDateStr);
            }

            const [resSales, resMutations, resGeneral] = await Promise.all([
                salesQuery,
                mutationQuery,
                generalQuery
            ]);

            const allEntries: any[] = [];

            // Process Sales as Debet (Money In)
            (resSales.data || []).forEach((s: any) => {
                allEntries.push({
                    id: s.id,
                    tanggal: s.tanggal,
                    kode: s.nomor_struk || 'SLS',
                    uraian: `Penjualan ${s.metode_pembayaran === 'cash' ? 'Tunai' : 'Transfer'}`,
                    debet: s.total_bayar || s.total_transaksi || 0,
                    kredit: 0,
                    created_at: s.created_at
                });
            });

            // Process Mutations
            const processedIds = new Set(allEntries.map(e => e.id));

            [...(resMutations.data || []), ...(resGeneral.data || [])].forEach((m: any) => {
                if (processedIds.has(m.id)) return; // Avoid double counting
                processedIds.add(m.id);

                const isIncome = m.jenis_transaksi === 'Pemasukan';
                allEntries.push({
                    id: m.id,
                    tanggal: m.tanggal,
                    kode: m.no_transaksi || m.nomor_transaksi || 'TX',
                    uraian: m.deskripsi || m.kategori || 'Mutasi Kas',
                    debet: isIncome ? (m.jumlah || 0) : 0,
                    kredit: !isIncome ? (m.jumlah || 0) : 0,
                    created_at: m.created_at
                });
            });

            // Sort all by date, then by created_at
            return allEntries.sort((a, b) => {
                const dateDiff = new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime();
                if (dateDiff !== 0) return dateDiff;
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            });
        }
    });

    // Transform transactions to ledger format
    const ledgerEntries = transactions;

    // Fetch HPP summary for Yayasan debt tracking
    const { data: hppSummary } = useQuery({
        queryKey: ['koperasi-hpp-summary', filterMonth, filterYear],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('kop_penjualan_detail')
                .select(`
                    id,
                    hpp_snapshot,
                    bagian_yayasan,
                    kop_barang:barang_id (
                        nama_barang,
                        owner_type
                    )
                `);

            if (error) return { totalHpp: 0, totalYayasan: 0 };

            const totalHpp = (data || []).reduce((sum: number, item: any) => sum + (item.hpp_snapshot || 0), 0);
            const totalYayasan = (data || []).reduce((sum: number, item: any) => sum + (item.bagian_yayasan || 0), 0);

            return { totalHpp, totalYayasan };
        }
    });


    const formatRupiah = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const dateRange = filterMonth && filterYear ? {
        start: new Date(filterYear, filterMonth - 1, 1),
        end: new Date(filterYear, filterMonth, 0)
    } : undefined;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Keuangan & Laporan</h1>
                    <p className="text-muted-foreground">Laporan keuangan standar akuntansi Santra Mart</p>
                </div>
                <div className="flex items-center gap-2">
                    <MonthYearFilter
                        selectedMonth={filterMonth}
                        selectedYear={filterYear}
                        onMonthChange={setFilterMonth}
                        onYearChange={setFilterYear}
                    />
                    <Button variant="outline" size="icon" onClick={() => refetch()}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            Total Pemasukan
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {formatRupiah(ledgerEntries.reduce((sum, e) => sum + e.debet, 0))}
                        </div>
                        <p className="text-xs text-muted-foreground">{ledgerEntries.length} transaksi</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            Hutang HPP Yayasan
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">
                            {formatRupiah(hppSummary?.totalYayasan || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">Wajib disetor ke Yayasan</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-blue-600" />
                            Laba Bersih Koperasi
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {formatRupiah(
                                ledgerEntries.reduce((sum, e) => sum + e.debet, 0) -
                                (hppSummary?.totalYayasan || 0)
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">Setelah dikurangi HPP</p>
                    </CardContent>
                </Card>
            </div>

            {/* Report Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-auto">
                    <TabsTrigger value="buku-besar" className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        <span className="hidden sm:inline">Buku Besar</span>
                    </TabsTrigger>
                    <TabsTrigger value="laba-rugi" className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        <span className="hidden sm:inline">Laba Rugi</span>
                    </TabsTrigger>
                    <TabsTrigger value="hpp-yayasan" className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="hidden sm:inline">HPP Yayasan</span>
                    </TabsTrigger>
                </TabsList>

                {/* Buku Besar / General Ledger */}
                <TabsContent value="buku-besar" className="mt-6">
                    {isLoading ? (
                        <div className="text-center py-12">
                            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                            <p className="mt-2 text-muted-foreground">Memuat data...</p>
                        </div>
                    ) : (
                        <PaperStyleReport
                            title="Buku Besar Koperasi"
                            entries={ledgerEntries}
                            openingBalance={0}
                            dateRange={dateRange}
                        />
                    )}
                </TabsContent>

                {/* Laporan Laba Rugi */}
                <TabsContent value="laba-rugi" className="mt-6">
                    <Card className="bg-white shadow-lg" style={{ maxWidth: '210mm', margin: '0 auto' }}>
                        <CardHeader className="border-b-2 border-gray-800 pb-4 text-center">
                            <div className="flex items-center justify-center gap-4 mb-2">
                                <img
                                    src="/kop-albisri.png"
                                    alt="Logo"
                                    className="h-16 w-16 object-contain"
                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                />
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">SANTRA MART</h1>
                                    <p className="text-sm text-gray-600">Koperasi Yayasan Pesantren Anak Yatim Al-Bisri</p>
                                </div>
                            </div>
                            <h2 className="text-lg font-semibold text-gray-800 uppercase tracking-widest mt-4">
                                LAPORAN LABA RUGI
                            </h2>
                        </CardHeader>
                        <CardContent className="p-6">
                            <table className="w-full text-sm">
                                <tbody>
                                    <tr className="border-b">
                                        <td className="py-3 font-semibold">PENDAPATAN</td>
                                        <td className="py-3 text-right"></td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pl-4">Penjualan Tunai</td>
                                        <td className="py-2 text-right font-medium">
                                            {formatRupiah(ledgerEntries.reduce((sum, e) => sum + e.debet, 0))}
                                        </td>
                                    </tr>
                                    <tr className="border-b bg-gray-50">
                                        <td className="py-3 pl-4 font-semibold">Total Pendapatan</td>
                                        <td className="py-3 text-right font-bold text-green-700">
                                            {formatRupiah(ledgerEntries.reduce((sum, e) => sum + e.debet, 0))}
                                        </td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-3 font-semibold">HARGA POKOK PENJUALAN</td>
                                        <td className="py-3 text-right"></td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pl-4">HPP Barang Koperasi</td>
                                        <td className="py-2 text-right font-medium">
                                            {formatRupiah(hppSummary?.totalHpp ? hppSummary.totalHpp - (hppSummary.totalYayasan || 0) : 0)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pl-4">HPP Barang Yayasan</td>
                                        <td className="py-2 text-right font-medium text-amber-700">
                                            {formatRupiah(hppSummary?.totalYayasan || 0)}
                                        </td>
                                    </tr>
                                    <tr className="border-b bg-gray-50">
                                        <td className="py-3 pl-4 font-semibold">Total HPP</td>
                                        <td className="py-3 text-right font-bold text-red-700">
                                            ({formatRupiah(hppSummary?.totalHpp || 0)})
                                        </td>
                                    </tr>
                                    <tr className="bg-blue-50">
                                        <td className="py-4 font-bold text-lg">LABA KOTOR</td>
                                        <td className="py-4 text-right font-bold text-lg text-blue-800">
                                            {formatRupiah(
                                                ledgerEntries.reduce((sum, e) => sum + e.debet, 0) -
                                                (hppSummary?.totalHpp || 0)
                                            )}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* HPP Yayasan Tracking */}
                <TabsContent value="hpp-yayasan" className="mt-6">
                    <Card className="bg-white shadow-lg" style={{ maxWidth: '210mm', margin: '0 auto' }}>
                        <CardHeader className="border-b-2 border-amber-500 pb-4 text-center bg-amber-50">
                            <div className="flex items-center justify-center gap-2">
                                <AlertTriangle className="h-6 w-6 text-amber-600" />
                                <h2 className="text-xl font-bold text-amber-800">
                                    Laporan Hutang HPP ke Yayasan
                                </h2>
                            </div>
                            <p className="text-sm text-amber-700 mt-2">
                                Akumulasi nilai barang milik Yayasan yang telah terjual dan harus disetor
                            </p>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="text-center py-8">
                                <div className="text-5xl font-bold text-amber-600 mb-4">
                                    {formatRupiah(hppSummary?.totalYayasan || 0)}
                                </div>
                                <Badge variant="outline" className="text-amber-700 border-amber-300 text-lg px-4 py-2">
                                    Wajib Disetor ke Kas Yayasan
                                </Badge>
                            </div>

                            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                                <h3 className="font-semibold mb-3">Catatan Penting:</h3>
                                <ul className="text-sm text-gray-600 space-y-2">
                                    <li>• Nilai di atas adalah akumulasi HPP dari barang <strong>milik Yayasan</strong> yang telah terjual.</li>
                                    <li>• Dana ini <strong>bukan milik Koperasi</strong> dan harus dikembalikan ke Kas Pusat Yayasan.</li>
                                    <li>• Setiap penjualan barang Yayasan otomatis menambah nilai hutang ini.</li>
                                    <li>• Lakukan penyetoran secara berkala untuk menjaga kesehatan finansial.</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
