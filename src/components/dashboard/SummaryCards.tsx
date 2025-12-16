import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCard {
  title: string;
  value: string;
  trend: {
    value: string;
    isPositive: boolean;
  };
  icon: React.ReactNode;
  color: string;
}

interface SummaryCardsProps {
  stats: {
    totalSaldo: number;
    pemasukanBulanIni: number;
    pengeluaranBulanIni: number;
    totalTransaksi: number;
    pemasukanTrend: number;
    pengeluaranTrend: number;
    labaBersih?: number; // Laba bersih = pemasukan - pengeluaran
    labaBersihTrend?: number; // Trend laba bersih
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

  // Calculate laba bersih if not provided
  const labaBersih = stats.labaBersih !== undefined 
    ? stats.labaBersih 
    : stats.pemasukanBulanIni - stats.pengeluaranBulanIni;
  
  // Calculate laba bersih trend if not provided
  const labaBersihTrend = stats.labaBersihTrend !== undefined
    ? stats.labaBersihTrend
    : 0; // Will be calculated if previous period data available

  const cards: StatCard[] = [
    {
      title: 'Total Saldo',
      value: formatCurrency(stats.totalSaldo),
      trend: {
        value: formatTrend(5), // Mock trend for now
        isPositive: true,
      },
      icon: <DollarSign className="h-5 w-5" />,
      color: 'text-blue-600',
    },
    {
      title: `Pemasukan ${periodLabel}`,
      value: formatCurrency(stats.pemasukanBulanIni),
      trend: {
        value: formatTrend(stats.pemasukanTrend),
        isPositive: stats.pemasukanTrend >= 0,
      },
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-green-600',
    },
    {
      title: `Pengeluaran ${periodLabel}`,
      value: formatCurrency(stats.pengeluaranBulanIni),
      trend: {
        value: formatTrend(stats.pengeluaranTrend),
        isPositive: stats.pengeluaranTrend >= 0,
      },
      icon: <TrendingDown className="h-5 w-5" />,
      color: 'text-red-600',
    },
    {
      title: `Laba Bersih ${periodLabel}`,
      value: formatCurrency(labaBersih),
      trend: {
        value: labaBersihTrend !== 0 ? formatTrend(labaBersihTrend) : 'Tidak ada data sebelumnya',
        isPositive: labaBersih >= 0,
      },
      icon: labaBersih >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />,
      color: labaBersih >= 0 ? 'text-green-600' : 'text-red-600',
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow duration-200 rounded-lg border border-gray-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {card.title}
              </CardTitle>
              <div className={`${card.color} opacity-70`}>
                {card.icon}
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl font-semibold text-gray-900 mb-1.5 tracking-tight">{card.value}</div>
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SummaryCards;
