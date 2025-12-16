import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, CartesianGrid, XAxis, YAxis } from 'recharts';
import { FileX, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';

interface ChartsSectionProps {
  monthlyData?: Array<{
    month: string;
    pemasukan: number;
    pengeluaran: number;
  }>;
  categoryData?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  categoryDataPemasukan?: Array<{
    name: string;
    value: number;
    color: string;
    amount?: number;
  }>;
  categoryDataPengeluaran?: Array<{
    name: string;
    value: number;
    color: string;
    amount?: number;
  }>;
  selectedAccountId?: string;
  selectedAccountName?: string;
}

const EmptyStateCard: React.FC<{ 
  title: string; 
  message: string; 
  icon: React.ReactNode; 
  selectedAccountName?: string;
}> = ({ title, message, icon, selectedAccountName }) => (
  <Card className="rounded-lg border border-gray-200 shadow-sm bg-white">
    <CardHeader className="pb-4 pt-4 px-4">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="text-sm font-medium text-gray-900">{title}</CardTitle>
          <p className="text-xs text-gray-500 mt-0.5">{message}</p>
        </div>
        {selectedAccountName && (
          <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-xs px-2 py-0.5">
            {selectedAccountName}
          </Badge>
        )}
      </div>
    </CardHeader>
    <CardContent>
      <div className="h-[300px] flex flex-col items-center justify-center text-center space-y-4">
        <div className="p-4 bg-gray-50 rounded-full">
          {icon}
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-800">Tidak Ada Data</h3>
          <p className="text-xs text-gray-500">
            {selectedAccountName 
              ? `Belum ada transaksi untuk akun ${selectedAccountName}` 
              : 'Belum ada data transaksi yang tersedia'
            }
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
);

const ChartsSection: React.FC<ChartsSectionProps> = ({ 
  monthlyData = [], 
  categoryData = [],
  categoryDataPemasukan = [],
  categoryDataPengeluaran = [],
  selectedAccountId,
  selectedAccountName
}) => {
  const hasMonthlyData = monthlyData.length > 0 && 
    monthlyData.some(d => (d.pemasukan > 0 || d.pengeluaran > 0));
  const hasCategoryData = categoryData.length > 0 && 
    categoryData.some(c => c.value > 0);
  const hasCategoryDataPemasukan = categoryDataPemasukan.length > 0 && 
    categoryDataPemasukan.some(c => c.value > 0);
  const hasCategoryDataPengeluaran = categoryDataPengeluaran.length > 0 && 
    categoryDataPengeluaran.some(c => c.value > 0);
  
  // Use new category data if available, otherwise fallback to old categoryData
  const useNewCategoryData = categoryDataPemasukan.length > 0 || categoryDataPengeluaran.length > 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-sm mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Prepare chart data for Line and Bar charts
  const chartData = monthlyData.map(item => ({
    month: item.month,
    pemasukan: item.pemasukan,
    pengeluaran: item.pengeluaran
  }));

  // Prepare chart data for pengeluaran categories (detailed breakdown)
  // Show top 5 categories by amount
  const topPengeluaranCategories = categoryDataPengeluaran
    .filter(category => (category.amount || 0) > 0)
    .slice(0, 5)
    .map(category => ({
      name: category.name,
      value: category.amount || 0,
      amount: category.amount || 0,
      color: category.color
    }));

  const hasPengeluaranData = topPengeluaranCategories.length > 0;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Line Chart - Trend Pemasukan vs Pengeluaran */}
      {chartData && chartData.length > 0 ? (
        <Card className="rounded-lg border border-gray-200 shadow-sm bg-white">
          <CardHeader className="pb-4 pt-4 px-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-gray-900">Tren Pemasukan vs Pengeluaran</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Perkembangan pemasukan dan pengeluaran koperasi per bulan</p>
              </div>
              <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-xs px-2 py-0.5">
                {selectedAccountName || 'Kas Koperasi'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '11px', paddingTop: '16px' }}
                    iconType="line"
                  />
                  <Line 
                    type="monotone"
                    dataKey="pemasukan"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    name="Pemasukan"
                  />
                  <Line 
                    type="monotone"
                    dataKey="pengeluaran"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: '#f59e0b', r: 4 }}
                    name="Pengeluaran"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmptyStateCard 
          title="Ringkasan Transaksi" 
          message="Pemasukan vs pengeluaran bulanan"
          icon={<TrendingDown className="w-6 h-6 text-gray-400" />}
          selectedAccountName={selectedAccountName}
        />
      )}

      {/* Pie Chart - Pengeluaran by Category */}
      {useNewCategoryData && hasPengeluaranData ? (
        <Card className="rounded-lg border border-gray-200 shadow-sm bg-white">
          <CardHeader className="pb-4 pt-4 px-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-gray-900">Pembagian Pengeluaran</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Berdasarkan kategori pengeluaran</p>
              </div>
              <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-xs px-2 py-0.5">
                {selectedAccountName || 'Kas Koperasi'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topPengeluaranCategories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                    outerRadius={100}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {topPengeluaranCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string) => [formatCurrency(value), name]}
                    contentStyle={{ 
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value, entry: any) => (
                      <span style={{ color: entry.color, fontSize: '12px' }}>
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmptyStateCard 
          title="Pembagian Pengeluaran" 
          message="Berdasarkan kategori pengeluaran"
          icon={<FileX className="w-6 h-6 text-gray-400" />}
          selectedAccountName={selectedAccountName}
        />
      )}
    </div>
  );
};

export default ChartsSection;
