import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { HandHeart, Package, Users, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';

interface SummaryCardsProps {
  statistics: {
    total_finansial: number;
    total_barang: number;
    total_operasional: number;
    total_all: number;
    total_santri: number;
    rata_rata: number;
    jumlah_transaksi: number;
    by_kategori: {
      'Bantuan Langsung Yayasan': number;
      'Operasional dan Konsumsi Santri': number;
      'Pendidikan Formal': number;
      'Pendidikan Pesantren': number;
      'Operasional Yayasan': number;
      'Lain-lain': number;
    };
  };
  loading?: boolean;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ statistics, loading = false }) => {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-32"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Pengeluaran',
      value: formatCurrency(statistics.total_all),
      subtitle: `${statistics.jumlah_transaksi} transaksi`,
      icon: HandHeart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      title: 'Bantuan untuk Santri',
      value: formatCurrency(statistics.total_finansial + statistics.total_barang),
      subtitle: `${statistics.total_santri} santri penerima`,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    {
      title: 'Operasional Yayasan',
      value: formatCurrency(statistics.by_kategori['Operasional Yayasan']),
      subtitle: 'Pengeluaran operasional yayasan',
      icon: Package,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
    {
      title: 'Pendidikan',
      value: formatCurrency(
        statistics.by_kategori['Pendidikan Formal'] + 
        statistics.by_kategori['Pendidikan Pesantren']
      ),
      subtitle: `Formal: ${formatCurrency(statistics.by_kategori['Pendidikan Formal'])} • Pesantren: ${formatCurrency(statistics.by_kategori['Pendidikan Pesantren'])}`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card
            key={index}
            className={`border ${card.borderColor} shadow-sm hover:shadow-md transition-all duration-200`}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-xs font-medium text-gray-500 mb-1.5 truncate uppercase tracking-wide">
                    {card.title}
                  </p>
                  <p className="text-xl font-bold text-gray-900 mb-1.5 break-words leading-tight">
                    {card.value}
                  </p>
                  {card.subtitle && (
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed break-words">
                      {card.subtitle}
                    </p>
                  )}
                </div>
                <div className={`p-2.5 rounded-lg ${card.bgColor} flex-shrink-0 mt-0.5`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SummaryCards;

