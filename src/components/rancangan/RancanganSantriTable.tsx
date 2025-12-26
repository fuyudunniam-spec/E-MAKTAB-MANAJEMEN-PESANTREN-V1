import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { type RancanganPelayanan, PILAR_PELAYANAN_CONFIG } from '@/services/rancanganPelayanan.service';
import { User, MoreVertical, Edit, Trash2, Eye, ChevronDown, ChevronRight, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import RancanganDetailModal from './RancanganDetailModal';

interface RancanganSantriTableProps {
  rancangan: RancanganPelayanan[];
  loading?: boolean;
  onEdit?: (rancangan: RancanganPelayanan) => void;
  onDelete?: (rancangan: RancanganPelayanan) => void;
  onRefresh?: () => void;
}

const RancanganSantriTable: React.FC<RancanganSantriTableProps> = ({
  rancangan,
  loading = false,
  onEdit,
  onDelete,
  onRefresh
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [detailModalOpen, setDetailModalOpen] = useState<string | null>(null);

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const isSemester = (periode?: string): boolean => {
    if (!periode) return false;
    return periode.toLowerCase().includes('semester');
  };

  const getMonthlyBreakdown = (rancangan: RancanganPelayanan) => {
    if (!isSemester(rancangan.periode)) return null;

    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];
    const breakdown: Array<{
      month: string;
      pilarFormal: number;
      pilarPesantren: number;
      pilarOperasional: number;
      pilarBantuan: number;
      total: number;
    }> = [];

    const pilarFormal = getPilarValue(rancangan, 'pendidikan_formal');
    const pilarPesantren = getPilarValue(rancangan, 'pendidikan_pesantren');
    const pilarOperasional = getPilarValue(rancangan, 'operasional_konsumsi');
    const pilarBantuan = getPilarValue(rancangan, 'bantuan_langsung');

    months.forEach((month) => {
      breakdown.push({
        month,
        pilarFormal: Math.round(pilarFormal / 6),
        pilarPesantren: Math.round(pilarPesantren / 6),
        pilarOperasional: Math.round(pilarOperasional / 6),
        pilarBantuan: Math.round(pilarBantuan / 6),
        total: Math.round((pilarFormal + pilarPesantren + pilarOperasional + pilarBantuan) / 6)
      });
    });

    return breakdown;
  };
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getPilarValue = (rancangan: RancanganPelayanan, pilarType: string): number => {
    const pilar = rancangan.pilar?.find(p => p.pilar === pilarType);
    return pilar?.target_biaya || 0;
  };

  const getPilarColor = (pilarType: string): string => {
    const colorMap: Record<string, string> = {
      'pendidikan_formal': '#64748b',
      'pendidikan_pesantren': '#3b82f6',
      'operasional_konsumsi': '#22c55e',
      'bantuan_langsung': '#f97316'
    };
    return colorMap[pilarType] || '#94a3b8';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-gray-500">
          Memuat data...
        </CardContent>
      </Card>
    );
  }

  if (rancangan.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Tidak ada data rancangan
          </h3>
          <p className="text-sm text-gray-500">
            Belum ada rancangan anggaran untuk ditampilkan
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Daftar Santri dengan Nominal Layanan
        </CardTitle>
        <p className="text-sm text-gray-500 mt-1">
          Breakdown nominal per pilar untuk setiap santri
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Santri</TableHead>
                <TableHead className="text-right min-w-[150px]">
                  {PILAR_PELAYANAN_CONFIG.pendidikan_formal.label.split(' ')[0]}
                </TableHead>
                <TableHead className="text-right min-w-[150px]">
                  {PILAR_PELAYANAN_CONFIG.pendidikan_pesantren.label.split(' ')[0]}
                </TableHead>
                <TableHead className="text-right min-w-[150px]">
                  Operasional & Konsumsi
                </TableHead>
                <TableHead className="text-right min-w-[150px]">
                  Bantuan Langsung
                </TableHead>
                <TableHead className="text-right min-w-[150px] font-semibold">
                  Total
                </TableHead>
                {(onEdit || onDelete) && (
                  <TableHead className="w-[50px]"></TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rancangan.map((r) => {
                const pilarFormal = getPilarValue(r, 'pendidikan_formal');
                const pilarPesantren = getPilarValue(r, 'pendidikan_pesantren');
                const pilarOperasional = getPilarValue(r, 'operasional_konsumsi');
                const pilarBantuan = getPilarValue(r, 'bantuan_langsung');
                const total = pilarFormal + pilarPesantren + pilarOperasional + pilarBantuan;
                const hasBreakdown = isSemester(r.periode);
                const isExpanded = expandedRows.has(r.id);
                const monthlyBreakdown = getMonthlyBreakdown(r);

                return (
                  <React.Fragment key={r.id}>
                    <TableRow
                      className="hover:bg-gray-50 transition-colors"
                    >
                    {/* Santri Info */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {hasBreakdown && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => toggleRowExpansion(r.id)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                          {r.santri?.foto_profil ? (
                            <img
                              src={r.santri.foto_profil}
                              alt={r.santri.nama_lengkap}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <User className={cn('h-5 w-5 text-gray-400', r.santri?.foto_profil && 'hidden')} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 truncate">
                            {r.santri?.nama_lengkap || 'Santri'}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500 font-mono">
                              {r.santri?.id_santri || ''}
                            </span>
                            {r.periode && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className="text-xs text-gray-500">
                                  {r.periode}
                                </span>
                                {hasBreakdown && (
                                  <>
                                    <span className="text-gray-300">•</span>
                                    <Badge variant="outline" className="text-xs">
                                      <Calendar className="h-3 w-3 mr-1" />
                                      Semester
                                    </Badge>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Pilar 1 - Pendidikan Formal */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: getPilarColor('pendidikan_formal') }}
                        />
                        <span className="text-sm font-mono text-gray-900">
                          {formatCurrency(pilarFormal)}
                        </span>
                      </div>
                    </TableCell>

                    {/* Pilar 2 - Pendidikan Pesantren */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: getPilarColor('pendidikan_pesantren') }}
                        />
                        <span className="text-sm font-mono text-gray-900">
                          {formatCurrency(pilarPesantren)}
                        </span>
                      </div>
                    </TableCell>

                    {/* Pilar 3 - Operasional & Konsumsi */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: getPilarColor('operasional_konsumsi') }}
                        />
                        <span className="text-sm font-mono text-gray-900">
                          {formatCurrency(pilarOperasional)}
                        </span>
                      </div>
                    </TableCell>

                    {/* Pilar 4 - Bantuan Langsung */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: getPilarColor('bantuan_langsung') }}
                        />
                        <span className="text-sm font-mono text-gray-900">
                          {formatCurrency(pilarBantuan)}
                        </span>
                      </div>
                    </TableCell>

                    {/* Total */}
                    <TableCell className="text-right">
                      <span className="text-sm font-semibold font-mono text-blue-600">
                        {formatCurrency(total)}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    {(onEdit || onDelete) && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setDetailModalOpen(r.id)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Lihat Detail
                            </DropdownMenuItem>
                            {onEdit && (
                              <DropdownMenuItem
                                onClick={() => onEdit(r)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {onDelete && (
                              <DropdownMenuItem
                                onClick={() => {
                                  if (confirm(`Apakah Anda yakin ingin menghapus rancangan untuk ${r.santri?.nama_lengkap}?`)) {
                                    onDelete(r);
                                  }
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Hapus
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>

                  {/* Monthly Breakdown Row */}
                  {isExpanded && monthlyBreakdown && (
                    <TableRow className="bg-blue-50/50">
                      <TableCell colSpan={onEdit || onDelete ? 7 : 6} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 mb-3">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <h4 className="text-sm font-semibold text-gray-900">
                              Breakdown Bulanan (Semester)
                            </h4>
                          </div>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-white/50">
                                  <TableHead className="min-w-[120px]">Bulan</TableHead>
                                  <TableHead className="text-right">Pendidikan Formal</TableHead>
                                  <TableHead className="text-right">Pendidikan Pesantren</TableHead>
                                  <TableHead className="text-right">Operasional & Konsumsi</TableHead>
                                  <TableHead className="text-right">Bantuan Langsung</TableHead>
                                  <TableHead className="text-right font-semibold">Total/Bulan</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {monthlyBreakdown.map((month, idx) => (
                                  <TableRow key={idx} className="bg-white/30">
                                    <TableCell className="font-medium text-gray-900">
                                      {month.month}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm">
                                      {formatCurrency(month.pilarFormal)}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm">
                                      {formatCurrency(month.pilarPesantren)}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm">
                                      {formatCurrency(month.pilarOperasional)}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm">
                                      {formatCurrency(month.pilarBantuan)}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm font-semibold text-blue-600">
                                      {formatCurrency(month.total)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                                <TableRow className="bg-blue-100/50 font-semibold">
                                  <TableCell className="font-semibold">Total Semester</TableCell>
                                  <TableCell className="text-right font-mono">
                                    {formatCurrency(pilarFormal)}
                                  </TableCell>
                                  <TableCell className="text-right font-mono">
                                    {formatCurrency(pilarPesantren)}
                                  </TableCell>
                                  <TableCell className="text-right font-mono">
                                    {formatCurrency(pilarOperasional)}
                                  </TableCell>
                                  <TableCell className="text-right font-mono">
                                    {formatCurrency(pilarBantuan)}
                                  </TableCell>
                                  <TableCell className="text-right font-mono text-blue-600">
                                    {formatCurrency(total)}
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Summary Footer */}
        <div className="mt-4 pt-4 border-t">
          <div className={cn(
            "grid gap-4 text-sm",
            (onEdit || onDelete) ? "grid-cols-6" : "grid-cols-5"
          )}>
            <div className="text-gray-600 font-medium">Total:</div>
            <div className="text-right font-mono font-semibold text-gray-900">
              {formatCurrency(
                rancangan.reduce((sum, r) => sum + getPilarValue(r, 'pendidikan_formal'), 0)
              )}
            </div>
            <div className="text-right font-mono font-semibold text-gray-900">
              {formatCurrency(
                rancangan.reduce((sum, r) => sum + getPilarValue(r, 'pendidikan_pesantren'), 0)
              )}
            </div>
            <div className="text-right font-mono font-semibold text-gray-900">
              {formatCurrency(
                rancangan.reduce((sum, r) => sum + getPilarValue(r, 'operasional_konsumsi'), 0)
              )}
            </div>
            <div className="text-right font-mono font-semibold text-gray-900">
              {formatCurrency(
                rancangan.reduce((sum, r) => sum + getPilarValue(r, 'bantuan_langsung'), 0)
              )}
            </div>
            <div className="text-right font-mono font-semibold text-blue-600">
              {formatCurrency(
                rancangan.reduce((sum, r) => {
                  const formal = getPilarValue(r, 'pendidikan_formal');
                  const pesantren = getPilarValue(r, 'pendidikan_pesantren');
                  const operasional = getPilarValue(r, 'operasional_konsumsi');
                  const bantuan = getPilarValue(r, 'bantuan_langsung');
                  return sum + formal + pesantren + operasional + bantuan;
                }, 0)
              )}
            </div>
            {(onEdit || onDelete) && <div></div>}
          </div>
        </div>
      </CardContent>

      {/* Detail Modal */}
      {detailModalOpen && (
        <RancanganDetailModal
          rancangan={rancangan.find(r => r.id === detailModalOpen) || null}
          open={!!detailModalOpen}
          onOpenChange={(open) => {
            if (!open) setDetailModalOpen(null);
          }}
          onClone={onRefresh ? () => {
            onRefresh();
            setDetailModalOpen(null);
          } : undefined}
        />
      )}
    </Card>
  );
};

export default RancanganSantriTable;

