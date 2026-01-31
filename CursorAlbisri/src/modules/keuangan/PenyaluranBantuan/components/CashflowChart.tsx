import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Dot,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';

interface CashflowChartProps {
  data: Array<{
    month: string;
    pemasukan: number;
    pengeluaran: number;
  }>;
  loading?: boolean;
}

// Month order reference for chronological sorting (Indonesian locale)
const MONTH_ORDER = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const CashflowChart: React.FC<CashflowChartProps> = ({ data, loading = false }) => {
  // Sort data chronologically by month
  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Parse month string to date for proper chronological sorting
    const parseMonthString = (monthStr: string): Date => {
      // Format: "MMM yyyy" (e.g., "Jan 2025", "Des 2024")
      const parts = monthStr.trim().split(' ');
      const monthName = parts[0];
      const year = parseInt(parts[1] || new Date().getFullYear().toString());
      
      const monthIndex = MONTH_ORDER.indexOf(monthName);
      if (monthIndex !== -1) {
        // Return date object for the first day of that month
        return new Date(year, monthIndex, 1);
      }
      
      // Fallback: try to parse as date string
      try {
        const parsed = new Date(monthStr);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      } catch {
        // If parsing fails, return current date
      }
      
      return new Date();
    };

    return [...data].sort((a, b) => {
      const dateA = parseMonthString(a.month);
      const dateB = parseMonthString(b.month);
      return dateA.getTime() - dateB.getTime();
    });
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-sm mb-2 text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs mb-1" style={{ color: entry.color }}>
              <span className="font-medium">{entry.name}:</span>{' '}
              {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Arus Kas Bulanan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] flex items-center justify-center">
            <div className="animate-pulse text-gray-400">Memuat data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!sortedData || sortedData.length === 0) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Arus Kas Bulanan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 bg-gray-50 rounded-full">
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-800">Tidak Ada Data</h3>
              <p className="text-xs text-gray-500 mt-1">
                Belum ada data keuangan untuk ditampilkan
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format Y-axis values with proper Rp currency format
  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `Rp ${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `Rp ${(value / 1000).toFixed(0)}K`;
    }
    return `Rp ${value.toLocaleString('id-ID')}`;
  };

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Arus Kas Bulanan
            </CardTitle>
            <p className="text-xs text-gray-500 mt-1">
              Perbandingan pemasukan dan pengeluaran per bulan
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={sortedData} 
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorPemasukan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorPengeluaran" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                tickLine={false}
                axisLine={false}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tickFormatter={formatYAxis}
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                iconType="circle"
              />
              <Area
                type="monotone"
                dataKey="pemasukan"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#colorPemasukan)"
                name="Pemasukan"
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Area
                type="monotone"
                dataKey="pengeluaran"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#colorPengeluaran)"
                name="Pengeluaran"
                dot={{ fill: '#ef4444', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default CashflowChart;

