import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { FileX, TrendingDown, AlertCircle } from 'lucide-react';
import { DonationMonthlyData, DonationCategoryData } from '@/services/donasiDashboard.service';

interface DonationChartsSectionProps {
  monthlyData?: DonationMonthlyData[];
  categoryData?: DonationCategoryData[];
  selectedDonorName?: string;
}

// Empty State Component
const EmptyStateCard: React.FC<{ 
  title: string; 
  message: string; 
  icon: React.ReactNode; 
  selectedDonorName?: string;
}> = ({ title, message, icon, selectedDonorName }) => (
  <Card className="rounded-2xl shadow-md border-0 h-fit">
    <CardHeader className="pb-4">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        {selectedDonorName ? (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
            Filter: {selectedDonorName}
          </Badge>
        ) : (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200 text-xs">
            Semua Donatur
          </Badge>
        )}
      </div>
    </CardHeader>
    <CardContent>
      <div className="h-[300px] flex flex-col items-center justify-center text-center space-y-6">
        <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full shadow-inner">
          {icon}
        </div>
        <div className="space-y-3 max-w-sm">
          <h3 className="text-xl font-semibold text-gray-800">Tidak Ada Data</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            {selectedDonorName 
              ? `Belum ada donasi dari ${selectedDonorName}` 
              : 'Belum ada data donasi yang tersedia'
            }
          </p>
          <div className="pt-2">
            <p className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
              💡 Tambahkan donasi untuk melihat analitik
            </p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const DonationChartsSection: React.FC<DonationChartsSectionProps> = ({ 
  monthlyData = [], 
  categoryData = [],
  selectedDonorName
}) => {
  // Mock data for demonstration
  const mockMonthlyData: DonationMonthlyData[] = [
    { 
      month: 'Apr', 
      cash: 1500000, 
      inKind: 5, 
      pledge: 0,
      mixed: 0,
      directConsumption: { totalItems: 0, totalQuantity: 0, totalPorsi: 0, totalKg: 0, itemsByUom: {} }
    },
    { 
      month: 'Mei', 
      cash: 1800000, 
      inKind: 8, 
      pledge: 0,
      mixed: 0,
      directConsumption: { totalItems: 0, totalQuantity: 0, totalPorsi: 0, totalKg: 0, itemsByUom: {} }
    },
    { 
      month: 'Jun', 
      cash: 2200000, 
      inKind: 12, 
      pledge: 0,
      mixed: 0,
      directConsumption: { totalItems: 0, totalQuantity: 0, totalPorsi: 0, totalKg: 0, itemsByUom: {} }
    },
    { 
      month: 'Jul', 
      cash: 1900000, 
      inKind: 10, 
      pledge: 0,
      mixed: 0,
      directConsumption: { totalItems: 0, totalQuantity: 0, totalPorsi: 0, totalKg: 0, itemsByUom: {} }
    },
    { 
      month: 'Agu', 
      cash: 2400000, 
      inKind: 15, 
      pledge: 0,
      mixed: 0,
      directConsumption: { totalItems: 0, totalQuantity: 0, totalPorsi: 0, totalKg: 0, itemsByUom: {} }
    },
    { 
      month: 'Sep', 
      cash: 2100000, 
      inKind: 11, 
      pledge: 0,
      mixed: 0,
      directConsumption: { totalItems: 0, totalQuantity: 0, totalPorsi: 0, totalKg: 0, itemsByUom: {} }
    },
    { 
      month: 'Okt', 
      cash: 1900000, 
      inKind: 9, 
      pledge: 0,
      mixed: 0,
      directConsumption: { totalItems: 0, totalQuantity: 0, totalPorsi: 0, totalKg: 0, itemsByUom: {} }
    },
  ];

  const mockCategoryData: DonationCategoryData[] = [
    { name: 'Tunai', value: 70, color: '#3b82f6' },
    { name: 'Barang', value: 30, color: '#f59e0b' },
  ];

  // Detect if we have meaningful data
  const hasMonthlyData = monthlyData.length > 0 && 
    monthlyData.some(d => (
      d.cash > 0 || 
      d.inKind > 0 || 
      d.mixed > 0 || 
      d.directConsumption.totalItems > 0
    ));
  const hasCategoryData = categoryData.length > 0 && 
    categoryData.some(c => c.value > 0);
  
  // Use real data if available, fallback to mock only when no filter is selected
  const shouldShowMockData = !selectedDonorName && !hasMonthlyData && !hasCategoryData;
  const rawData = hasMonthlyData ? monthlyData : (shouldShowMockData ? mockMonthlyData : []);
  // Add computed field for direct consumption items
  // Gunakan totalEstimatedValue dari database jika ada (lebih akurat)
  // Jika tidak ada, fallback ke estimasi berdasarkan UOM
  const data = rawData.map(d => {
    let directConsumptionValue = 0;
    
    // Prioritas 1: Gunakan totalEstimatedValue dari database (jika sudah dihitung di service)
    if (d.directConsumption.totalEstimatedValue && d.directConsumption.totalEstimatedValue > 0) {
      directConsumptionValue = d.directConsumption.totalEstimatedValue;
    } 
    // Prioritas 2: Estimasi berdasarkan porsi
    else if (d.directConsumption.totalPorsi > 0) {
      directConsumptionValue = d.directConsumption.totalPorsi * 10000; // Rp 10.000 per porsi
    } 
    // Prioritas 3: Estimasi berdasarkan kg
    else if (d.directConsumption.totalKg > 0) {
      directConsumptionValue = d.directConsumption.totalKg * 15000; // Rp 15.000 per kg
    } 
    // Prioritas 4: Estimasi berdasarkan jumlah item
    else if (d.directConsumption.totalItems > 0) {
      directConsumptionValue = d.directConsumption.totalItems * 50000; // Rp 50.000 per item sebagai estimasi
    }
    
    return {
      ...d,
      directConsumptionItems: d.directConsumption.totalItems,
      directConsumptionValue: directConsumptionValue // Nilai untuk grafik (dari DB atau estimasi)
    };
  });
  const categories = hasCategoryData ? categoryData : (shouldShowMockData ? mockCategoryData : []);

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
      const monthData = data.find(d => d.month === label);
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => {
            // Cari data bulan untuk mendapatkan detail directConsumption
            const monthData = data.find(d => d.month === label);
            
            if (entry.name === 'Makanan' && monthData) {
              // Tampilkan detail makanan dengan lebih informatif
              return (
                <div key={index} className="mb-2">
                  <p style={{ color: entry.color }} className="mb-1 font-medium">
                    {entry.name}: {formatCurrency(entry.value)} (estimasi)
                  </p>
                  <div className="text-xs text-gray-600 ml-2 space-y-0.5">
                    {monthData.directConsumption.totalItems > 0 && (
                      <p>• {monthData.directConsumption.totalItems} jenis item</p>
                    )}
                    {monthData.directConsumption.totalPorsi > 0 && (
                      <p>• {monthData.directConsumption.totalPorsi.toLocaleString('id-ID')} porsi</p>
                    )}
                    {monthData.directConsumption.totalKg > 0 && (
                      <p>• {monthData.directConsumption.totalKg.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg</p>
                    )}
                  </div>
                </div>
              );
            }
            
            return (
              <p key={index} style={{ color: entry.color }} className="mb-1">
                {entry.name}: {entry.name === 'Tunai' || entry.name === 'Barang'
                  ? formatCurrency(entry.value) 
                  : `${entry.value} donasi`}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly Donation Chart */}
      {!hasMonthlyData && selectedDonorName ? (
        <EmptyStateCard 
          title="Ringkasan Donasi" 
          message="Perbandingan donasi tunai dan barang per bulan"
          icon={<TrendingDown className="w-8 h-8 text-gray-400" />}
          selectedDonorName={selectedDonorName}
        />
      ) : (
        <Card className="rounded-lg border border-gray-200 shadow-sm bg-white">
          <CardHeader className="pb-4 pt-4 px-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-gray-900">Ringkasan Donasi</CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  Donasi tunai dan barang bulanan
                </p>
              </div>
              {selectedDonorName ? (
                <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-xs px-2 py-0.5">
                  {selectedDonorName}
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-xs px-2 py-0.5">
                  Semua Donatur
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    {/* Gradient untuk Tunai (Blue/Cyan) */}
                    <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                    {/* Gradient untuk Barang (Orange/Yellow) */}
                    <linearGradient id="colorInKind" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                    </linearGradient>
                    {/* Gradient untuk Makanan (Red/Pink) */}
                    <linearGradient id="colorDirectConsumption" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${value / 1000000}jt`}
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    content={<CustomTooltip />}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                    iconType="circle"
                  />
                  {/* Area untuk Makanan (Red/Pink) - diletakkan di bawah */}
                  {data.some(d => d.directConsumptionValue > 0) && (
                    <Area 
                      type="monotone" 
                      dataKey="directConsumptionValue" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      fill="url(#colorDirectConsumption)"
                      name="Makanan"
                      dot={{ fill: 'white', stroke: '#ef4444', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  )}
                  {/* Area untuk Barang (Orange/Yellow) */}
                  <Area 
                    type="monotone" 
                    dataKey="inKind" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    fill="url(#colorInKind)"
                    name="Barang"
                    dot={{ fill: 'white', stroke: '#f59e0b', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  {/* Area untuk Tunai (Blue/Cyan) - diletakkan di atas */}
                  <Area 
                    type="monotone" 
                    dataKey="cash" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    fill="url(#colorCash)"
                    name="Tunai"
                    dot={{ fill: 'white', stroke: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Distribution Chart */}
      {!hasCategoryData && selectedDonorName ? (
        <EmptyStateCard 
          title="Distribusi Tipe" 
          message="Distribusi donasi berdasarkan tipe"
          icon={<FileX className="w-8 h-8 text-gray-400" />}
          selectedDonorName={selectedDonorName}
        />
      ) : (
        <Card className="rounded-lg border border-gray-200 shadow-sm bg-white">
          <CardHeader className="pb-4 pt-4 px-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-gray-900">Distribusi Tipe Donasi</CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  Berdasarkan tipe donasi
                </p>
              </div>
              {selectedDonorName ? (
                <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-xs px-2 py-0.5">
                  {selectedDonorName}
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-xs px-2 py-0.5">
                  Semua Donatur
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories.map(cat => ({
                      ...cat,
                      payload: cat // Pass the full category object as payload
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0];
                        return (
                          <div className="bg-white p-3 border rounded-lg shadow-lg">
                            <p className="font-medium mb-1">{data.name}</p>
                            <p className="text-sm">{data.value}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {categories.map((category, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm text-muted-foreground truncate">
                    {category.name}: {category.value}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DonationChartsSection;

