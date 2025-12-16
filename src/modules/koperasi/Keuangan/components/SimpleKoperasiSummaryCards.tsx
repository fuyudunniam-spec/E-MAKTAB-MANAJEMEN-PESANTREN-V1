import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, DollarSign, Calculator, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SimpleKoperasiSummaryCardsProps {
  pemasukan: number;
  pengeluaran: number;
  labaRugi: number;
  periodLabel: string;
  onTransfer?: () => void;
}

export default function SimpleKoperasiSummaryCards({
  pemasukan,
  pengeluaran,
  labaRugi,
  periodLabel,
  onTransfer
}: SimpleKoperasiSummaryCardsProps) {
  const navigate = useNavigate();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleNavigateToHPP = () => {
    navigate('/koperasi/keuangan/kelola-hpp');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Pemasukan */}
      <Card className="border border-green-200/60 shadow-sm bg-gradient-to-br from-green-50/50 to-white hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Pemasukan {periodLabel}
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
              <ArrowUpCircle className="h-4 w-4 text-green-600" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-700">
            {formatCurrency(pemasukan)}
          </div>
          <p className="text-xs text-gray-500 mt-1.5">
            Total setor cash dari penjualan
          </p>
        </CardContent>
      </Card>

      {/* Pengeluaran */}
      <Card className="border border-red-200/60 shadow-sm bg-gradient-to-br from-red-50/50 to-white hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Pengeluaran {periodLabel}
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center">
              <ArrowDownCircle className="h-4 w-4 text-red-600" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-700">
            {formatCurrency(pengeluaran)}
          </div>
          <p className="text-xs text-gray-500 mt-1.5">
            Total biaya operasional
          </p>
        </CardContent>
      </Card>

      {/* Laba/Rugi */}
      <Card className="border border-blue-200/60 shadow-sm bg-gradient-to-br from-blue-50/50 to-white hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Laba/Rugi {periodLabel}
            </CardTitle>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${labaRugi >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
              <DollarSign className={`h-4 w-4 ${labaRugi >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${labaRugi >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
            {formatCurrency(labaRugi)}
          </div>
          <p className={`text-xs mt-1.5 ${labaRugi >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            {labaRugi >= 0 ? 'Laba' : 'Rugi'}
          </p>
          <Button 
            className="mt-4 w-full bg-gray-900 hover:bg-gray-800 text-white shadow-sm" 
            size="sm"
            onClick={handleNavigateToHPP}
          >
            <Calculator className="w-4 h-4 mr-2" />
            Kelola HPP & Bagi Hasil
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

