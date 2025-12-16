import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Wallet, Building2, TrendingUp, TrendingDown, DollarSign, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface KoperasiSummaryCardsProps {
  saldoKas: number;
  hakYayasan: number;
  labaPeriode: number;
  periodLabel: string;
  pemasukan?: number;
  pengeluaran?: number;
  labaBersih?: number;
  saldoKasMode?: 'total' | 'periode';
  onSaldoKasModeChange?: (mode: 'total' | 'periode') => void;
  saldoOperasional?: number;
  totalSetoranDiserahkan?: number;
}

export default function KoperasiSummaryCards({
  saldoKas,
  hakYayasan,
  labaPeriode,
  periodLabel,
  pemasukan,
  pengeluaran,
  labaBersih,
  saldoKasMode = 'total',
  onSaldoKasModeChange,
  saldoOperasional,
  totalSetoranDiserahkan
}: KoperasiSummaryCardsProps) {
  const navigate = useNavigate();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate laba bersih if not provided
  const calculatedLabaBersih = labaBersih !== undefined 
    ? labaBersih 
    : (pemasukan !== undefined && pengeluaran !== undefined) 
      ? pemasukan - pengeluaran 
      : null;

  return (
    <div className="space-y-6">
      {/* Row 1: Pemasukan, Pengeluaran, Laba Bersih */}
      {(pemasukan !== undefined || pengeluaran !== undefined || calculatedLabaBersih !== null) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card: Pemasukan */}
          {pemasukan !== undefined && (
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-3 pt-4 px-4 border-b border-gray-100">
                <CardTitle className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Pemasukan {periodLabel}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(pemasukan)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Total pemasukan koperasi
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Card: Pengeluaran */}
          {pengeluaran !== undefined && (
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-3 pt-4 px-4 border-b border-gray-100">
                <CardTitle className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  Pengeluaran {periodLabel}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(pengeluaran)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Total pengeluaran operasional
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Card: Laba Bersih */}
          {calculatedLabaBersih !== null && (
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-3 pt-4 px-4 border-b border-gray-100">
                <CardTitle className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <DollarSign className={`h-4 w-4 ${calculatedLabaBersih >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  Laba Bersih {periodLabel}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <p className={`text-2xl font-bold ${calculatedLabaBersih >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(calculatedLabaBersih)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Pemasukan - Pengeluaran
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Row 2: Saldo Operasional, Setoran Diserahkan, Saldo Kas */}
      {(saldoOperasional !== undefined || totalSetoranDiserahkan !== undefined) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card: Saldo Operasional Koperasi */}
          {saldoOperasional !== undefined && (
            <Card className="border border-green-200 shadow-sm bg-green-50/50">
              <CardHeader className="pb-3 pt-4 px-4 border-b border-green-100">
                <CardTitle className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-green-600" />
                  Saldo Operasional {periodLabel}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-green-700">
                    {formatCurrency(saldoOperasional)}
                  </p>
                  <p className="text-xs text-gray-600">
                    Pemasukan - Pengeluaran - Setoran yang sudah diserahkan
                  </p>
                  <p className="text-xs text-gray-500 italic">
                    Saldo yang masih milik koperasi untuk periode berjalan
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Card: Setoran yang Sudah Diserahkan */}
          {totalSetoranDiserahkan !== undefined && (
            <Card className="border border-amber-200 shadow-sm bg-amber-50/50">
              <CardHeader className="pb-3 pt-4 px-4 border-b border-amber-100">
                <CardTitle className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-amber-600" />
                  Setoran yang Sudah Diserahkan
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-amber-700">
                    {formatCurrency(totalSetoranDiserahkan)}
                  </p>
                  <p className="text-xs text-gray-600">
                    Total setoran yang sudah diserahkan ke yayasan
                  </p>
                  <p className="text-xs text-gray-500 italic">
                    {periodLabel !== 'Keseluruhan' ? `Untuk periode ${periodLabel.toLowerCase()}` : 'Keseluruhan'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Card: Saldo Kas Total (tempat untuk card ketiga jika perlu) */}
          <Card className="border border-blue-200 shadow-sm bg-blue-50/50">
            <CardHeader className="pb-3 pt-4 px-4 border-b border-blue-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-blue-600" />
                  Saldo Kas Koperasi {saldoKasMode === 'periode' ? periodLabel : '(Total)'}
                </CardTitle>
                {onSaldoKasModeChange && (
                  <ToggleGroup
                    type="single"
                    value={saldoKasMode}
                    onValueChange={(value) => {
                      if (value && (value === 'total' || value === 'periode')) {
                        onSaldoKasModeChange(value);
                      }
                    }}
                    className="h-8"
                  >
                    <ToggleGroupItem value="total" aria-label="Saldo Total" size="sm" className="text-xs px-2 py-1">
                      Total
                    </ToggleGroupItem>
                    <ToggleGroupItem value="periode" aria-label="Saldo Periode" size="sm" className="text-xs px-2 py-1">
                      Periode
                    </ToggleGroupItem>
                  </ToggleGroup>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                <p className="text-2xl font-bold text-blue-700">
                  {formatCurrency(saldoKas)}
                </p>
                <p className="text-xs text-gray-600">
                  {saldoKasMode === 'total' 
                    ? 'Total saldo aktual dari semua akun kas koperasi'
                    : `Saldo akhir ${periodLabel.toLowerCase()} (termasuk setoran yang sudah diserahkan)`
                  }
                </p>
                {saldoOperasional !== undefined && (
                  <p className="text-xs text-gray-500">
                    = Saldo Operasional ({formatCurrency(saldoOperasional)}) + Setoran Diserahkan ({formatCurrency(totalSetoranDiserahkan || 0)})
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Row 3: Hak Yayasan, Laba Periode (jika row 2 tidak ditampilkan, row ini menjadi row 2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Card 2: Hak Yayasan di Kas */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3 pt-4 px-4 border-b border-gray-100">
            <CardTitle className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-amber-600" />
              Hak Yayasan di Kas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(hakYayasan)}
              </p>
              <p className="text-xs text-gray-500">
                Total bagian yayasan yang belum disetor
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/koperasi/keuangan/kelola-hpp')}
                className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                <ExternalLink className="h-3 w-3 mr-2" />
                Lihat Detail
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Laba Periode Ini */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3 pt-4 px-4 border-b border-gray-100">
            <CardTitle className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <TrendingUp className={`h-4 w-4 ${labaPeriode >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              Laba {periodLabel}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className={`text-2xl font-bold ${labaPeriode >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(labaPeriode)}
              </p>
              <p className="text-xs text-gray-500">
                Penjualan - HPP - Beban Operasional
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
