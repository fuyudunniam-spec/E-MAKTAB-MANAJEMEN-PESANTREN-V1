import React, { useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, Download, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface LedgerEntry {
    id: string;
    tanggal: string;
    kode: string;
    uraian: string;
    debet: number;
    kredit: number;
}

interface PaperStyleReportProps {
    title?: string;
    subtitle?: string;
    entries: LedgerEntry[];
    openingBalance?: number;
    dateRange?: { start: Date; end: Date };
}

const PaperStyleReport: React.FC<PaperStyleReportProps> = ({
    title = "Buku Besar Koperasi",
    subtitle = "Koperasi Yayasan Pesantren Anak Yatim Al-Bisri",
    entries = [],
    openingBalance = 0,
    dateRange
}) => {
    const reportRef = useRef<HTMLDivElement>(null);

    const formatRupiah = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        try {
            return format(new Date(dateStr), 'dd MMM yyyy', { locale: id });
        } catch {
            return dateStr;
        }
    };

    // Calculate running balance
    let runningBalance = openingBalance;
    const entriesWithBalance = entries.map(entry => {
        runningBalance = runningBalance + entry.debet - entry.kredit;
        return { ...entry, saldo: runningBalance };
    });

    const totalDebet = entries.reduce((sum, e) => sum + e.debet, 0);
    const totalKredit = entries.reduce((sum, e) => sum + e.kredit, 0);
    const closingBalance = runningBalance;

    const handlePrint = () => {
        window.print();
    };

    const currentDate = format(new Date(), 'dd MMMM yyyy', { locale: id });
    const periodLabel = dateRange
        ? `${format(dateRange.start, 'dd MMM yyyy', { locale: id })} - ${format(dateRange.end, 'dd MMM yyyy', { locale: id })}`
        : 'Semua Periode';

    return (
        <div className="space-y-4">
            {/* Action Bar - Hide on print */}
            <div className="flex items-center justify-between print:hidden">
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Periode: {periodLabel}</span>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handlePrint}>
                        <Printer className="h-4 w-4 mr-2" />
                        Cetak PDF
                    </Button>
                </div>
            </div>

            {/* Paper Container */}
            <Card
                ref={reportRef}
                className="bg-white shadow-lg print:shadow-none print:border-none"
                style={{
                    minHeight: '297mm',
                    width: '100%',
                    maxWidth: '210mm',
                    margin: '0 auto'
                }}
            >
                {/* Header - Styled like official document */}
                <CardHeader className="border-b-2 border-gray-800 pb-4 text-center">
                    <div className="flex items-center justify-center gap-4 mb-2">
                        <img
                            src="/kop-albisri.png"
                            alt="Logo"
                            className="h-16 w-16 object-contain"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-wide">
                                SANTRA MART
                            </h1>
                            <p className="text-sm text-gray-600 font-medium">
                                {subtitle}
                            </p>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-300">
                        <h2 className="text-lg font-semibold text-gray-800 uppercase tracking-widest">
                            {title}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Periode: {periodLabel}
                        </p>
                    </div>
                </CardHeader>

                <CardContent className="p-6">
                    {/* Opening Balance */}
                    <div className="mb-4 p-3 bg-gray-50 rounded border">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-600">Saldo Awal</span>
                            <span className="font-bold text-lg">Rp {formatRupiah(openingBalance)}</span>
                        </div>
                    </div>

                    {/* Ledger Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold w-24">Tanggal</th>
                                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold w-24">Kode</th>
                                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Uraian</th>
                                    <th className="border border-gray-300 px-3 py-2 text-right font-semibold w-28">Debet</th>
                                    <th className="border border-gray-300 px-3 py-2 text-right font-semibold w-28">Kredit</th>
                                    <th className="border border-gray-300 px-3 py-2 text-right font-semibold w-32">Saldo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entriesWithBalance.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="border border-gray-300 px-3 py-8 text-center text-gray-500">
                                            Tidak ada transaksi pada periode ini
                                        </td>
                                    </tr>
                                ) : (
                                    entriesWithBalance.map((entry, index) => (
                                        <tr key={entry.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="border border-gray-300 px-3 py-2 text-gray-600">
                                                {formatDate(entry.tanggal)}
                                            </td>
                                            <td className="border border-gray-300 px-3 py-2 font-mono text-xs text-gray-500">
                                                {entry.kode}
                                            </td>
                                            <td className="border border-gray-300 px-3 py-2">
                                                {entry.uraian}
                                            </td>
                                            <td className="border border-gray-300 px-3 py-2 text-right text-green-700 font-medium">
                                                {entry.debet > 0 ? formatRupiah(entry.debet) : '-'}
                                            </td>
                                            <td className="border border-gray-300 px-3 py-2 text-right text-red-700 font-medium">
                                                {entry.kredit > 0 ? formatRupiah(entry.kredit) : '-'}
                                            </td>
                                            <td className="border border-gray-300 px-3 py-2 text-right font-bold">
                                                Rp {formatRupiah(entry.saldo)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            <tfoot>
                                <tr className="bg-gray-200 font-bold">
                                    <td colSpan={3} className="border border-gray-300 px-3 py-2 text-right">
                                        TOTAL
                                    </td>
                                    <td className="border border-gray-300 px-3 py-2 text-right text-green-800">
                                        Rp {formatRupiah(totalDebet)}
                                    </td>
                                    <td className="border border-gray-300 px-3 py-2 text-right text-red-800">
                                        Rp {formatRupiah(totalKredit)}
                                    </td>
                                    <td className="border border-gray-300 px-3 py-2 text-right text-blue-800">
                                        Rp {formatRupiah(closingBalance)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Summary Cards */}
                    <div className="mt-6 grid grid-cols-3 gap-4">
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-xs text-green-600 font-medium mb-1">Total Debet</p>
                            <p className="text-lg font-bold text-green-800">Rp {formatRupiah(totalDebet)}</p>
                        </div>
                        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                            <p className="text-xs text-red-600 font-medium mb-1">Total Kredit</p>
                            <p className="text-lg font-bold text-red-800">Rp {formatRupiah(totalKredit)}</p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-xs text-blue-600 font-medium mb-1">Saldo Akhir</p>
                            <p className="text-lg font-bold text-blue-800">Rp {formatRupiah(closingBalance)}</p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
                        <p>Dicetak pada: {currentDate}</p>
                        <p className="mt-1">Dokumen ini digenerate otomatis oleh sistem e-Maktab</p>
                    </div>
                </CardContent>
            </Card>

            {/* Print Styles */}
            <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          [data-print-area], [data-print-area] * {
            visibility: visible;
          }
          [data-print-area] {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
        </div>
    );
};

export default PaperStyleReport;
