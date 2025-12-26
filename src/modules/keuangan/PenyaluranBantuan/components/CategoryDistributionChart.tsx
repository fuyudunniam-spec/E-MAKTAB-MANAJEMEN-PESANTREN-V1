import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';

interface CategoryDistributionChartProps {
  data: Array<{
    kategori: string;
    value: number;
    color: string;
    count: number;
  }>;
  loading?: boolean;
}

const CategoryDistributionChart: React.FC<CategoryDistributionChartProps> = ({
  data,
  loading = false,
}) => {
  // Show all categories (should be 4 main + Lain-lain)
  const displayCategories = data || [];
  const total = displayCategories.reduce((sum, cat) => sum + cat.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const tooltipData = payload[0];
      const kategori = tooltipData.payload?.kategori || tooltipData.name || '';
      const value = tooltipData.value || 0;
      const count = tooltipData.payload?.count || 0;
      const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: tooltipData.color }}
            />
            <p className="font-semibold text-sm text-gray-900">{kategori}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-600">
              <span className="font-medium">Total:</span> {formatCurrency(value)}
            </p>
            <p className="text-xs text-gray-500">
              <span className="font-medium">Persentase:</span> {percentage}%
            </p>
            <p className="text-xs text-gray-500">
              <span className="font-medium">Jumlah:</span> {count} transaksi
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Distribusi Kategori</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] flex items-center justify-center">
            <div className="animate-pulse text-gray-400">Memuat data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Distribusi Kategori</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 bg-gray-50 rounded-full">
              <PieChartIcon className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-800">Tidak Ada Data</h3>
              <p className="text-xs text-gray-500 mt-1">
                Belum ada data kategori untuk ditampilkan
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }


  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Distribusi Kategori
            </CardTitle>
            <p className="text-xs text-gray-500 mt-1">
              Pembagian bantuan berdasarkan kategori pengeluaran
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart */}
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayCategories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ percent, kategori }) =>
                    percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''
                  }
                  outerRadius={90}
                  innerRadius={50}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {displayCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend dengan deskripsi lengkap */}
          <div className="space-y-2 pt-2 border-t">
            {displayCategories.map((item, index) => (
              <div
                key={item.kategori}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className="w-4 h-4 rounded flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.kategori}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.count} transaksi
                    </p>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(item.value)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryDistributionChart;

