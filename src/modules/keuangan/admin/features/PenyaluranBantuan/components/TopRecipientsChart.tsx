import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Award } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';

interface TopRecipientsChartProps {
  data: Array<{
    santri_id: string;
    santri_nama: string;
    santri_nisn: string;
    total_finansial: number;
    total_barang: number;
    total_all: number;
    jumlah_transaksi: number;
  }>;
  loading?: boolean;
}

const TopRecipientsChart: React.FC<TopRecipientsChartProps> = ({ data, loading = false }) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const finansial = payload.find((p: any) => p.dataKey === 'total_finansial');
      const barang = payload.find((p: any) => p.dataKey === 'total_barang');
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-sm mb-2 text-gray-900">{label}</p>
          {finansial && (
            <p className="text-xs mb-1" style={{ color: finansial.color }}>
              <span className="font-medium">Finansial:</span>{' '}
              {formatCurrency(finansial.value)}
            </p>
          )}
          {barang && (
            <p className="text-xs mb-1" style={{ color: barang.color }}>
              <span className="font-medium">Barang:</span> {formatCurrency(barang.value)}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-2 border-t pt-2">
            Total: {formatCurrency((finansial?.value || 0) + (barang?.value || 0))}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Top 10 Penerima Bantuan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] flex items-center justify-center">
            <div className="animate-pulse text-gray-400">Memuat data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter out items without santri for display (exclude Operasional Yayasan)
  const validData = (data || []).filter((item) => item.santri_nama && item.santri_id);

  if (!data || data.length === 0 || validData.length === 0) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Top 10 Penerima Bantuan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 bg-gray-50 rounded-full">
              <Award className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-800">Tidak Ada Data</h3>
              <p className="text-xs text-gray-500 mt-1">
                Belum ada data penerima bantuan untuk ditampilkan
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data with shortened names
  const chartData = validData
    .map((item) => ({
      ...item,
      nama: (item.santri_nama || '').length > 20
        ? (item.santri_nama || '').substring(0, 20) + '...'
        : item.santri_nama || 'Tidak Diketahui',
    }));

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Top 10 Penerima Bantuan
            </CardTitle>
            <p className="text-xs text-gray-500 mt-1">
              Santri dengan bantuan terbesar
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                type="number"
                tickFormatter={(value) => `${(value / 1000000).toFixed(1)}jt`}
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="nama"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                width={90}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                iconType="square"
              />
              <Bar
                dataKey="total_finansial"
                stackId="a"
                fill="#3b82f6"
                name="Finansial"
                radius={[0, 4, 4, 0]}
              />
              <Bar
                dataKey="total_barang"
                stackId="a"
                fill="#f59e0b"
                name="Barang"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default TopRecipientsChart;

