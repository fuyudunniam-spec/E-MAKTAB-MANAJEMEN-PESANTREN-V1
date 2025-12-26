import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Download, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface FilterPanelProps {
  filters: {
    startDate?: string;
    endDate?: string;
    jenis?: 'Finansial' | 'Barang' | 'All';
    santri_id?: string;
    kategori?: string;
  };
  onFilterChange: (filters: any) => void;
  onReset: () => void;
  onExport?: () => void;
  santriOptions?: Array<{ id: string; nama_lengkap: string }>;
  kategoriOptions?: string[];
  loading?: boolean;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  onReset,
  onExport,
  santriOptions = [],
  kategoriOptions = [],
  loading = false,
}) => {
  const [periodeType, setPeriodeType] = useState<'custom' | 'tahun' | '3bulan' | '6bulan'>('custom');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const handlePeriodeTypeChange = (type: string) => {
    const newType = type as 'custom' | 'tahun' | '3bulan' | '6bulan';
    setPeriodeType(newType);

    let startDate: Date;
    let endDate: Date;

    switch (newType) {
      case 'tahun':
        startDate = startOfYear(currentDate);
        endDate = endOfYear(currentDate);
        break;
      case '3bulan':
        startDate = startOfMonth(subMonths(currentDate, 2));
        endDate = endOfMonth(currentDate);
        break;
      case '6bulan':
        startDate = startOfMonth(subMonths(currentDate, 5));
        endDate = endOfMonth(currentDate);
        break;
      case 'custom':
      default:
        // Keep existing dates or use current month
        if (filters.startDate && filters.endDate) {
          return; // Don't change dates if custom is selected
        }
        startDate = startOfMonth(currentDate);
        endDate = endOfMonth(currentDate);
        break;
    }

    onFilterChange({
      ...filters,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    });
  };

  const handleCustomDateChange = () => {
    if (customStartDate && customEndDate) {
      onFilterChange({
        ...filters,
        startDate: customStartDate,
        endDate: customEndDate,
      });
    }
  };

  const handleYearChange = (year: string) => {
    const yearNum = parseInt(year);
    const startDate = startOfYear(new Date(yearNum, 0, 1));
    const endDate = endOfYear(new Date(yearNum, 11, 31));

    onFilterChange({
      ...filters,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    });
    setPeriodeType('tahun');
  };

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Filter</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-8 px-2 text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Periode Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Periode</Label>
          <Select
            value={periodeType}
            onValueChange={handlePeriodeTypeChange}
            disabled={loading}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Pilih periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tahun">Tahun Ini</SelectItem>
              <SelectItem value="6bulan">6 Bulan Terakhir</SelectItem>
              <SelectItem value="3bulan">3 Bulan Terakhir</SelectItem>
              <SelectItem value="custom">Custom (Pilih Tanggal)</SelectItem>
            </SelectContent>
          </Select>

          {/* Tahun Selector (untuk filter tahun spesifik) */}
          {periodeType === 'tahun' && (
            <div className="mt-2">
              <Label className="text-xs text-gray-500 mb-1">Tahun</Label>
              <Select
                value={filters.startDate ? new Date(filters.startDate).getFullYear().toString() : currentYear.toString()}
                onValueChange={handleYearChange}
                disabled={loading}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Pilih tahun" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Custom Date Range */}
          {periodeType === 'custom' && (
            <div className="mt-2 space-y-2">
              <div>
                <Label className="text-xs text-gray-500 mb-1">Tanggal Mulai</Label>
                <Input
                  type="date"
                  value={customStartDate || filters.startDate || ''}
                  onChange={(e) => {
                    setCustomStartDate(e.target.value);
                    if (e.target.value && customEndDate) {
                      onFilterChange({
                        ...filters,
                        startDate: e.target.value,
                        endDate: customEndDate,
                      });
                    } else if (e.target.value) {
                      onFilterChange({
                        ...filters,
                        startDate: e.target.value,
                      });
                    }
                  }}
                  className="h-9"
                  disabled={loading}
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1">Tanggal Akhir</Label>
                <Input
                  type="date"
                  value={customEndDate || filters.endDate || ''}
                  onChange={(e) => {
                    setCustomEndDate(e.target.value);
                    if (e.target.value && (customStartDate || filters.startDate)) {
                      onFilterChange({
                        ...filters,
                        startDate: customStartDate || filters.startDate || '',
                        endDate: e.target.value,
                      });
                    } else if (e.target.value) {
                      onFilterChange({
                        ...filters,
                        endDate: e.target.value,
                      });
                    }
                  }}
                  className="h-9"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* Display current period */}
          {filters.startDate && filters.endDate && (
            <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
              <Calendar className="w-3 h-3 inline mr-1" />
              {format(new Date(filters.startDate), 'dd MMM yyyy', { locale: localeId })} -{' '}
              {format(new Date(filters.endDate), 'dd MMM yyyy', { locale: localeId })}
            </div>
          )}
        </div>

        {/* Jenis Bantuan */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Jenis Bantuan</Label>
          <Select
            value={filters.jenis || 'All'}
            onValueChange={(value) =>
              onFilterChange({
                ...filters,
                jenis: value === 'All' ? undefined : (value as 'Finansial' | 'Barang'),
              })
            }
            disabled={loading}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Pilih jenis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Semua</SelectItem>
              <SelectItem value="Finansial">Finansial</SelectItem>
              <SelectItem value="Barang">Barang</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Kategori */}
        {kategoriOptions.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Kategori</Label>
            <Select
              value={filters.kategori || 'All'}
              onValueChange={(value) =>
                onFilterChange({
                  ...filters,
                  kategori: value === 'All' ? undefined : value,
                })
              }
              disabled={loading}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">Semua Kategori</SelectItem>
                {kategoriOptions.map((kat) => (
                  <SelectItem key={kat} value={kat}>
                    {kat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Santri Search */}
        {santriOptions.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Santri</Label>
            <Select
              value={filters.santri_id || 'All'}
              onValueChange={(value) =>
                onFilterChange({
                  ...filters,
                  santri_id: value === 'All' ? undefined : value,
                })
              }
              disabled={loading}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Pilih santri" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">Semua Santri</SelectItem>
                {santriOptions.map((santri) => (
                  <SelectItem key={santri.id} value={santri.id}>
                    {santri.nama_lengkap}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="flex-1"
            disabled={loading}
          >
            Reset
          </Button>
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="flex-1"
              disabled={loading}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FilterPanel;

