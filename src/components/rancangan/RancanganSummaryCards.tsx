import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target } from 'lucide-react';

interface RancanganSummaryCardsProps {
  stats: {
    totalTarget: number;
    totalDukungan: number;
    totalKekurangan: number;
    persentasePemenuhan: number;
    totalRancangan: number;
    rancanganAktif: number;
    santriTercukupi: number;
    santriTerlayani: number;
    santriBelumTerpenuhi: number;
  };
  periodLabel?: string;
}

const RancanganSummaryCards: React.FC<RancanganSummaryCardsProps> = ({ 
  stats,
  periodLabel = 'Keseluruhan'
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const cards = [
    {
      title: `Total Target ${periodLabel}`,
      value: formatCurrency(stats.totalTarget),
      subtitle: `${stats.totalRancangan} rancangan • ${stats.santriTerlayani} santri terlayani`,
      icon: <Target className="h-5 w-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      iconBg: 'bg-blue-100',
    },
    {
      title: `Persentase Pemenuhan`,
      value: `${stats.persentasePemenuhan.toFixed(1)}%`,
      subtitle: `${stats.santriTercukupi} tercukupi • ${stats.santriBelumTerpenuhi} belum terpenuhi`,
      icon: stats.persentasePemenuhan >= 100 ? (
        <TrendingUp className="h-5 w-5" />
      ) : (
        <TrendingDown className="h-5 w-5" />
      ),
      color: stats.persentasePemenuhan >= 100 ? 'text-green-600' : 'text-yellow-600',
      bgColor: stats.persentasePemenuhan >= 100 ? 'bg-green-50' : 'bg-yellow-50',
      iconBg: stats.persentasePemenuhan >= 100 ? 'bg-green-100' : 'bg-yellow-100',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow duration-200 rounded-lg border border-gray-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {card.title}
              </CardTitle>
              <div className={`${card.iconBg} p-2 rounded-lg`}>
                <div className={card.color}>
                  {card.icon}
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl font-semibold text-gray-900 mb-1.5 tracking-tight">
                {card.value}
              </div>
              <div className="text-xs text-gray-500">
                {card.subtitle}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RancanganSummaryCards;

