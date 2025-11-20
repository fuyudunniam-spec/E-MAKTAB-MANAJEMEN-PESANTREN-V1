import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, TrendingUp, AlertTriangle, FileText, Clock, Gift, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { InventoryStats } from '@/services/inventarisDashboard.service';

interface InventorySummaryCardsProps {
  stats: InventoryStats;
}

const InventorySummaryCards: React.FC<InventorySummaryCardsProps> = ({ stats }) => {
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
    return `${sign}${roundedTrend.toFixed(1)}% dari bulan lalu`;
  };

  const cards = [
    {
      title: 'Total Item',
      value: stats.totalItems.toString(),
      trend: {
        value: `${stats.itemsFromDonation} dari donasi, ${stats.itemsFromPurchase} dari pembelian`,
        isPositive: true,
      },
      icon: <Package className="h-5 w-5" />,
      color: 'text-blue-600',
    },
    {
      title: 'Nilai Total',
      value: formatCurrency(stats.totalValue),
      trend: {
        value: 'Nilai inventaris saat ini',
        isPositive: true,
      },
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-green-600',
    },
    {
      title: 'Stok Menipis',
      value: stats.lowStockItems.toString(),
      trend: {
        value: 'Perlu perhatian',
        isPositive: false,
      },
      icon: <AlertTriangle className="h-5 w-5" />,
      color: 'text-orange-600',
    },
    {
      title: 'Transaksi Bulan Ini',
      value: stats.transactionsThisMonth.toString(),
      trend: {
        value: formatTrend(stats.transactionTrend),
        isPositive: stats.transactionTrend >= 0,
      },
      icon: <FileText className="h-5 w-5" />,
      color: 'text-purple-600',
    },
  ];

  return (
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
              card.trend.isPositive ? 'text-emerald-600' : 'text-gray-600'
            }`}>
              <span>{card.trend.value}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default InventorySummaryCards;
