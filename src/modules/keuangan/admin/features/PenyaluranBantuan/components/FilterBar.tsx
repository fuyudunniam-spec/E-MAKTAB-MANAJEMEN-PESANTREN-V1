import React, { useState, useEffect } from 'react';
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
import { X, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { PenyaluranFilters } from '@/modules/keuangan/services/penyaluranBantuan.service';

interface FilterBarProps {
  filters: PenyaluranFilters;
  onFilterChange: (filters: PenyaluranFilters) => void;
  onReset: () => void;
  santriOptions?: Array<{ id: string; nama_lengkap: string }>;
  kategoriOptions?: string[];
  loading?: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  santriOptions = [],
  kategoriOptions = [],
  loading = false,
}) => {
  const [periodeType, setPeriodeType] = useState<'custom' | 'tahun' | '3bulan' | '6bulan'>('3bulan');
  // Local state for custom date inputs (to prevent immediate query trigger)
  const [localStartDate, setLocalStartDate] = useState<string>('');
  const [localEndDate, setLocalEndDate] = useState<string>('');

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  // Sync local state with filters when filters change externally
  useEffect(() => {
    if (periodeType === 'custom') {
      setLocalStartDate(filters.startDate || '');
      setLocalEndDate(filters.endDate || '');
    }
  }, [filters.startDate, filters.endDate, periodeType]);


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
        // When switching to custom, use current filter dates or default to current month
        if (filters.startDate && filters.endDate) {
          setLocalStartDate(filters.startDate);
          setLocalEndDate(filters.endDate);
          return; // Don't change dates if custom is selected and dates exist
        }
        startDate = startOfMonth(currentDate);
        endDate = endOfMonth(currentDate);
        setLocalStartDate(format(startDate, 'yyyy-MM-dd'));
        setLocalEndDate(format(endDate, 'yyyy-MM-dd'));
        break;
    }

    onFilterChange({
      ...filters,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    });
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

  const hasActiveFilters = filters.jenis || filters.santri_id || filters.kategori;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <Label className="text-sm font-semibold text-gray-700">Filter</Label>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-7 px-2 text-xs text-gray-500 hover:text-gray-700"
          >
            <X className="w-3 h-3 mr-1" />
            Reset
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Periode */}
        <div className="space-y-1">
          <Label className="text-xs text-gray-600">Periode</Label>
          <Select
            value={periodeType}
            onValueChange={handlePeriodeTypeChange}
            disabled={loading}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Pilih periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tahun">Tahun Ini</SelectItem>
              <SelectItem value="6bulan">6 Bulan Terakhir</SelectItem>
              <SelectItem value="3bulan">3 Bulan Terakhir</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tahun (jika periode = tahun) */}
        {periodeType === 'tahun' && (
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Tahun</Label>
            <Select
              value={filters.startDate ? new Date(filters.startDate).getFullYear().toString() : currentYear.toString()}
              onValueChange={handleYearChange}
              disabled={loading}
            >
              <SelectTrigger className="h-9 text-xs">
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
          <>
            <div className="space-y-1">
              <Label className="text-xs text-gray-600">Tanggal Mulai</Label>
              <Input
                type="date"
                value={localStartDate}
                onChange={(e) => {
                  // Hanya update local state, TIDAK trigger query
                  setLocalStartDate(e.target.value);
                }}
                onKeyDown={(e) => {
                  // Trigger query saat Enter ditekan (jika kedua tanggal sudah diisi)
                  if (e.key === 'Enter' && localStartDate && localEndDate) {
                    e.preventDefault();
                    onFilterChange({
                      ...filters,
                      startDate: localStartDate,
                      endDate: localEndDate,
                    });
                  }
                }}
                className="h-9 text-xs"
                disabled={loading}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-600">Tanggal Akhir</Label>
              <Input
                type="date"
                value={localEndDate}
                onChange={(e) => {
                  // Hanya update local state, TIDAK trigger query
                  setLocalEndDate(e.target.value);
                }}
                onBlur={(e) => {
                  // Hanya trigger query saat blur dari input terakhir jika kedua tanggal sudah diisi
                  if (e.target.value && localStartDate) {
                    onFilterChange({
                      ...filters,
                      startDate: localStartDate,
                      endDate: e.target.value,
                    });
                  }
                }}
                onKeyDown={(e) => {
                  // Trigger query saat Enter ditekan (jika kedua tanggal sudah diisi)
                  if (e.key === 'Enter' && localStartDate && localEndDate) {
                    e.preventDefault();
                    onFilterChange({
                      ...filters,
                      startDate: localStartDate,
                      endDate: localEndDate,
                    });
                  }
                }}
                className="h-9 text-xs"
                disabled={loading}
              />
            </div>
            {/* Tombol Terapkan untuk custom date range */}
            <div className="space-y-1">
              <Label className="text-xs text-gray-600 opacity-0">Terapkan</Label>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (localStartDate && localEndDate) {
                    onFilterChange({
                      ...filters,
                      startDate: localStartDate,
                      endDate: localEndDate,
                    });
                  }
                }}
                disabled={loading || !localStartDate || !localEndDate}
                className="h-9 w-full text-xs"
              >
                Terapkan
              </Button>
            </div>
          </>
        )}

        {/* Jenis Bantuan */}
        <div className="space-y-1">
          <Label className="text-xs text-gray-600">Jenis Bantuan</Label>
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
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Pilih jenis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Semua</SelectItem>
              <SelectItem value="Finansial">Bantuan Finansial</SelectItem>
              <SelectItem value="Barang">Bantuan Barang</SelectItem>
              <SelectItem value="Operasional">Operasional Yayasan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Kategori */}
        {kategoriOptions.length > 0 && (
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Kategori</Label>
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
              <SelectTrigger className="h-9 text-xs">
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

        {/* Santri */}
        {santriOptions.length > 0 && (
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Santri</Label>
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
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Pilih santri" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">Semua Santri</SelectItem>
                {santriOptions.slice(0, 50).map((santri) => (
                  <SelectItem key={santri.id} value={santri.id}>
                    {santri.nama_lengkap}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Display current period */}
      {filters.startDate && filters.endDate && (
        <div className="text-xs text-gray-500 mt-2 pt-2 border-t flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {format(new Date(filters.startDate), 'dd MMM yyyy', { locale: localeId })} -{' '}
          {format(new Date(filters.endDate), 'dd MMM yyyy', { locale: localeId })}
        </div>
      )}
    </div>
  );
};

export default FilterBar;

