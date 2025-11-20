import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Heart, Users, Package, ArrowUpRight, ArrowDownRight } from 'lucide-react';

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

interface DonationSummaryCardsProps {
  stats: {
    totalDonation: number;
    donationBulanIni: number;
    totalDonors: number;
    totalItems: number;
    donationTrend: number;
    donorTrend: number;
    inventoryItems?: number;
    directConsumptionItems?: number;
    totalPorsi?: number;
    totalKg?: number;
  };
  selectedDonorName?: string;
}

const DonationSummaryCards: React.FC<DonationSummaryCardsProps> = ({ stats, selectedDonorName }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTrend = (trend: number) => {
    if (trend === 0) return 'Tidak ada data bulan lalu';
    const roundedTrend = Math.round(trend * 100) / 100;
    const sign = roundedTrend >= 0 ? '+' : '';
    return `${sign}${roundedTrend.toFixed(2)}% dari bulan lalu`;
  };

  const cards: StatCard[] = [
    {
      title: 'Total Donasi',
      value: formatCurrency(stats.totalDonation),
      trend: {
        value: formatTrend(stats.donationTrend),
        isPositive: stats.donationTrend >= 0,
      },
      icon: <Heart className="h-5 w-5" />,
      color: 'text-rose-600',
    },
    {
      title: 'Donasi Bulan Ini',
      value: formatCurrency(stats.donationBulanIni),
      trend: {
        value: formatTrend(stats.donationTrend),
        isPositive: stats.donationTrend >= 0,
      },
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-green-600',
    },
    {
      title: 'Total Donatur',
      value: stats.totalDonors.toString(),
      trend: {
        value: formatTrend(stats.donorTrend),
        isPositive: stats.donorTrend >= 0,
      },
      icon: <Users className="h-5 w-5" />,
      color: 'text-blue-600',
    },
    {
      title: 'Item Donasi',
      value: stats.totalItems.toString(),
      trend: {
        value: stats.inventoryItems !== undefined && stats.directConsumptionItems !== undefined
          ? `${stats.inventoryItems} inventaris, ${stats.directConsumptionItems} makanan`
          : 'Barang & aset',
        isPositive: true,
      },
      icon: <Package className="h-5 w-5" />,
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filter Badge */}
      {selectedDonorName && (
        <div className="flex items-center">
          <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-xs px-2.5 py-1">
            Filter: {selectedDonorName}
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

export default DonationSummaryCards;

