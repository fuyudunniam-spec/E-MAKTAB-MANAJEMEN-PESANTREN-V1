import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';

interface StatCard {
  title: string;
  value: string;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon: React.ReactNode;
  color: string;
  isHighlighted?: boolean; // For special styling (e.g., Saldo Akhir)
}

interface SummaryCardsProps {
  stats: {
    totalSaldo?: number; // For backward compatibility
    saldoAwal?: number; // Opening balance (before startDate)
    saldoAkhir?: number; // Closing balance (saldoAwal + pemasukan - pengeluaran)
    pemasukanBulanIni: number;
    pengeluaranBulanIni: number;
    totalTransaksi: number;
    pemasukanTrend: number;
    pengeluaranTrend: number;
    jumlahTransaksiPemasukan?: number;
    jumlahTransaksiPengeluaran?: number;
    penyesuaianSaldoInfo?: {
      jumlah: number;
      jumlahTransaksi: number;
      adaPenyesuaian: boolean;
    };
  };
  selectedAccountName?: string;
  periodLabel?: string; // Label untuk periode yang dipilih (e.g., "Bulan Ini", "Bulan Lalu", "3 Bulan Terakhir")
  previousPeriodLabel?: string; // Label untuk periode sebelumnya (untuk trend)
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ 
  stats, 
  selectedAccountName,
  periodLabel = 'Bulan Ini',
  previousPeriodLabel = 'periode sebelumnya'
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTrend = (trend: number) => {
    if (trend === 0) return `Tidak ada data ${previousPeriodLabel}`;
    // Round to 2 decimal places untuk menghindari angka terlalu panjang
    const roundedTrend = Math.round(trend * 100) / 100;
    const sign = roundedTrend >= 0 ? '+' : '';
    return `${sign}${roundedTrend.toFixed(2)}% dari ${previousPeriodLabel}`;
  };

  // Get saldo values (with backward compatibility)
  const saldoAwal = stats.saldoAwal ?? (stats.totalSaldo ? stats.totalSaldo - stats.pemasukanBulanIni + stats.pengeluaranBulanIni : 0);
  const saldoAkhir = stats.saldoAkhir ?? (stats.totalSaldo ?? 0);

  // Prepare penyesuaian saldo info
  const penyesuaianSaldoInfo = stats.penyesuaianSaldoInfo;
  let saldoAkhirSubtitle: string | undefined;
  if (penyesuaianSaldoInfo?.adaPenyesuaian && penyesuaianSaldoInfo.jumlahTransaksi > 0) {
    const sign = penyesuaianSaldoInfo.jumlah >= 0 ? '+' : '';
    saldoAkhirSubtitle = `Penyesuaian saldo: ${sign}${formatCurrency(Math.abs(penyesuaianSaldoInfo.jumlah))} (${penyesuaianSaldoInfo.jumlahTransaksi} transaksi)`;
  }

  const cards: StatCard[] = [
    {
      title: 'Saldo Awal (Opening Balance)',
      value: formatCurrency(saldoAwal),
      subtitle: `Saldo sebelum ${periodLabel}`,
      icon: <DollarSign className="h-5 w-5" />,
      color: 'text-gray-600',
    },
    {
      title: `Total Pemasukan ${periodLabel}`,
      value: formatCurrency(stats.pemasukanBulanIni),
      subtitle: `${stats.jumlahTransaksiPemasukan || 0} transaksi`,
      trend: stats.pemasukanTrend !== 0 ? {
        value: formatTrend(stats.pemasukanTrend),
        isPositive: stats.pemasukanTrend >= 0,
      } : undefined,
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-green-600',
    },
    {
      title: `Total Pengeluaran ${periodLabel}`,
      value: formatCurrency(stats.pengeluaranBulanIni),
      subtitle: `${stats.jumlahTransaksiPengeluaran || 0} transaksi`,
      trend: stats.pengeluaranTrend !== 0 ? {
        value: formatTrend(stats.pengeluaranTrend),
        isPositive: stats.pengeluaranTrend >= 0,
      } : undefined,
      icon: <TrendingDown className="h-5 w-5" />,
      color: 'text-red-600',
    },
    {
      title: 'Saldo Akhir (Real Balance)',
      value: formatCurrency(saldoAkhir),
      subtitle: saldoAkhirSubtitle || 'Sesuai dengan fisik uang di kas/bank',
      icon: <DollarSign className="h-5 w-5" />,
      color: 'text-indigo-600',
      isHighlighted: true, // Add flag for special styling
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filter Badge */}
      {selectedAccountName && (
        <div className="flex items-center">
          <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-xs px-2.5 py-1">
            Filter: {selectedAccountName}
          </Badge>
        </div>
      )}

      {/* Summary Cards - 4 KPI Cards untuk Dashboard Keuangan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => (
          <Card 
            key={index} 
            className={`hover:shadow-md transition-shadow duration-200 rounded-lg border ${
              card.isHighlighted 
                ? 'border-indigo-300 bg-gradient-to-br from-indigo-50 to-white shadow-indigo-100' 
                : 'border-gray-200 bg-white'
            }`}
            style={{ minHeight: '140px' }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-5 px-5">
              <CardTitle className={`text-xs font-medium uppercase tracking-wide ${
                card.isHighlighted ? 'text-indigo-700' : 'text-gray-500'
              }`}>
                {card.title}
              </CardTitle>
              <div className={`${card.color} ${card.isHighlighted ? 'opacity-100' : 'opacity-70'}`}>
                {card.icon}
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className={`text-xl font-semibold mb-1.5 tracking-tight leading-tight ${
                card.isHighlighted ? 'text-indigo-900' : 'text-gray-900'
              }`}>
                {card.value}
              </div>
              {card.subtitle && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={`text-xs mb-2 flex items-center gap-1 ${
                        card.isHighlighted ? 'text-indigo-600' : 'text-gray-500'
                      }`}>
                        {card.subtitle}
                        {card.isHighlighted && (
                          <Info className="h-3 w-3" />
                        )}
                      </div>
                    </TooltipTrigger>
                    {card.isHighlighted && (
                      <TooltipContent>
                        <p className="text-xs">Saldo akhir adalah saldo riil yang sesuai dengan fisik uang di kas/bank pada akhir periode yang dipilih</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              )}
              {card.trend && (
                <div className={`flex items-center text-xs ${
                  card.trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {card.trend.isPositive ? (
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                  )}
                  <span>{card.trend.value}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SummaryCards;
