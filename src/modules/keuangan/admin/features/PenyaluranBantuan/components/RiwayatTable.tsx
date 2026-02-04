import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Package, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { UnifiedPenyaluranBantuan } from '@/modules/keuangan/services/penyaluranBantuan.service';

interface RiwayatTableProps {
  data: UnifiedPenyaluranBantuan[];
  loading?: boolean;
  onViewDetail?: (item: UnifiedPenyaluranBantuan) => void;
}

const RiwayatTable: React.FC<RiwayatTableProps> = ({
  data,
  loading = false,
  onViewDetail,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = data.slice(startIndex, endIndex);

  if (loading) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Riwayat Penyaluran</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Riwayat Penyaluran</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-900 mb-2">Tidak Ada Data</h3>
            <p className="text-xs text-gray-500">
              Belum ada riwayat penyaluran bantuan untuk ditampilkan
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Riwayat Penyaluran
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {data.length} transaksi
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[100px] text-xs font-semibold text-gray-700">
                  Tanggal
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-700">Santri</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700">
                  Jenis Bantuan
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-700">Kategori</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700">Detail</TableHead>
                <TableHead className="text-right text-xs font-semibold text-gray-700">
                  Nominal/Jumlah
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-700">Sumber</TableHead>
                <TableHead className="w-[80px] text-xs font-semibold text-gray-700">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50">
                  <TableCell className="text-xs text-gray-600">
                    {format(new Date(item.tanggal), 'dd MMM yyyy', { locale: localeId })}
                  </TableCell>
                  <TableCell>
                    {item.santri_nama ? (
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.santri_nama}</p>
                        <p className="text-xs text-gray-500">{item.santri_nisn}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Tidak dialokasikan</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        item.jenis_bantuan === 'Finansial'
                          ? 'border-blue-200 bg-blue-50 text-blue-700'
                          : item.jenis_bantuan === 'Operasional'
                          ? 'border-red-200 bg-red-50 text-red-700'
                          : 'border-amber-200 bg-amber-50 text-amber-700'
                      }
                    >
                      {item.jenis_bantuan === 'Finansial' ? (
                        <DollarSign className="w-3 h-3 mr-1" />
                      ) : item.jenis_bantuan === 'Operasional' ? (
                        <Package className="w-3 h-3 mr-1" />
                      ) : (
                        <Package className="w-3 h-3 mr-1" />
                      )}
                      {item.jenis_bantuan}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-600">{item.kategori}</TableCell>
                  <TableCell className="text-xs text-gray-600 max-w-[200px] truncate">
                    {item.detail}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.jenis_bantuan === 'Finansial' ? (
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(item.nominal || 0)}
                      </span>
                    ) : (
                      <span className="text-sm font-semibold text-gray-900">
                        {item.jumlah} {item.satuan}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        item.sumber === 'Keuangan'
                          ? 'border-green-200 bg-green-50 text-green-700'
                          : 'border-purple-200 bg-purple-50 text-purple-700'
                      }
                    >
                      {item.sumber}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {onViewDetail && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetail(item)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-gray-500">
              Menampilkan {startIndex + 1}-{Math.min(endIndex, data.length)} dari {data.length}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-8"
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="h-8"
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RiwayatTable;

