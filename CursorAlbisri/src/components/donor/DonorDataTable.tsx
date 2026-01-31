import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Phone, Mail, MapPin, User } from 'lucide-react';
import { type DonorStatistics, type JenisDonatur } from '@/services/donor.service';
import { cn } from '@/lib/utils';

interface DonorDataTableProps {
  donors: DonorStatistics[];
  onEdit?: (donor: DonorStatistics) => void;
  onDelete?: (donor: DonorStatistics) => void;
  loading?: boolean;
}

const JENIS_DONATUR_CONFIG: Record<JenisDonatur, { label: string; color: string }> = {
  individu: { label: 'Individu', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  perusahaan: { label: 'Perusahaan', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  yayasan: { label: 'Yayasan', color: 'bg-green-50 text-green-700 border-green-200' },
  komunitas: { label: 'Komunitas', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  lembaga: { label: 'Lembaga', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
};

const DonorDataTable: React.FC<DonorDataTableProps> = ({
  donors,
  onEdit,
  onDelete,
  loading = false
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="w-full border border-slate-100 rounded-lg overflow-hidden">
        <div className="p-8 text-center text-gray-500">Memuat data...</div>
      </div>
    );
  }

  return (
    <div className="w-full border border-slate-100 rounded-lg overflow-hidden bg-white">
      <div className="overflow-x-auto max-h-[calc(100vh-300px)]">
        <Table>
          <TableHeader className="sticky top-0 bg-white z-10 border-b border-slate-100 shadow-sm">
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-[250px] px-4 py-3 font-semibold text-gray-700">
                Donatur
              </TableHead>
              <TableHead className="min-w-[150px] px-4 py-3 font-semibold text-gray-700">
                Kontak
              </TableHead>
              <TableHead className="min-w-[150px] px-4 py-3 font-semibold text-gray-700">
                Alamat
              </TableHead>
              <TableHead className="min-w-[120px] px-4 py-3 font-semibold text-gray-700 text-center">
                Jenis
              </TableHead>
              <TableHead className="min-w-[120px] px-4 py-3 font-semibold text-gray-700 text-right">
                Total Donasi
              </TableHead>
              <TableHead className="min-w-[120px] px-4 py-3 font-semibold text-gray-700 text-right">
                Nominal
              </TableHead>
              <TableHead className="min-w-[150px] px-4 py-3 font-semibold text-gray-700 text-center">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {donors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                  Tidak ada data donatur
                </TableCell>
              </TableRow>
            ) : (
              donors.map((donor) => (
                <TableRow
                  key={donor.id}
                  className="hover:bg-slate-50/50 transition-colors border-b border-slate-100"
                >
                  {/* Donatur Info */}
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-slate-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate">
                          {donor.nama_lengkap}
                        </div>
                        {donor.nama_panggilan && (
                          <div className="text-sm text-gray-500 truncate">
                            {donor.nama_panggilan}
                          </div>
                        )}
                        {!donor.status_aktif && (
                          <Badge variant="outline" className="mt-1 text-xs text-gray-500">
                            Non-Aktif
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Kontak */}
                  <TableCell className="px-4 py-3">
                    <div className="space-y-1">
                      {donor.nomor_telepon && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Phone className="h-3.5 w-3.5 text-gray-400" />
                          <span className="font-mono">{donor.nomor_telepon}</span>
                        </div>
                      )}
                      {donor.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Mail className="h-3.5 w-3.5 text-gray-400" />
                          <span className="truncate">{donor.email}</span>
                        </div>
                      )}
                      {!donor.nomor_telepon && !donor.email && (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </div>
                  </TableCell>

                  {/* Alamat */}
                  <TableCell className="px-4 py-3">
                    {donor.alamat ? (
                      <div className="flex items-start gap-2 text-sm text-gray-700">
                        <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <div className="truncate max-w-[200px]">{donor.alamat}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </TableCell>

                  {/* Jenis */}
                  <TableCell className="px-4 py-3 text-center">
                    <Badge className={cn('text-xs', JENIS_DONATUR_CONFIG[donor.jenis_donatur]?.color || 'bg-gray-50 text-gray-700 border-gray-200')}>
                      {JENIS_DONATUR_CONFIG[donor.jenis_donatur]?.label || donor.jenis_donatur}
                    </Badge>
                  </TableCell>

                  {/* Total Donasi */}
                  <TableCell className="px-4 py-3 text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {donor.total_donasi || 0} kali
                    </div>
                    {donor.tanggal_donasi_pertama && (
                      <div className="text-xs text-gray-500">
                        Sejak {formatDate(donor.tanggal_donasi_pertama)}
                      </div>
                    )}
                  </TableCell>

                  {/* Nominal */}
                  <TableCell className="px-4 py-3 text-right">
                    <div className="text-sm font-semibold text-gray-900 font-mono">
                      {formatCurrency(donor.total_nominal_donasi || 0)}
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(donor)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(donor)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DonorDataTable;

