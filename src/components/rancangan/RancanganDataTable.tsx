import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash2, Heart, User, Eye } from 'lucide-react';
import { type RancanganPelayanan, PILAR_PELAYANAN_CONFIG, type PilarPelayanan } from '@/services/rancanganPelayanan.service';
import { cn } from '@/lib/utils';
import BantuSekarangModal from './BantuSekarangModal';
import BatchEditBar from './BatchEditBar';
import RancanganDetailModal from './RancanganDetailModal';

interface RancanganDataTableProps {
  rancangan: RancanganPelayanan[];
  onEdit?: (rancangan: RancanganPelayanan) => void;
  onDelete?: (rancangan: RancanganPelayanan) => void;
  onUpdatePilar?: (rancanganId: string, pilarId: string, nominal: number) => Promise<void>;
  onBantuSekarang?: (rancanganId: string, pilar: PilarPelayanan, nominal: number) => Promise<void>;
  onRefresh?: () => void;
  loading?: boolean;
}

const RancanganDataTable: React.FC<RancanganDataTableProps> = ({
  rancangan,
  onEdit,
  onDelete,
  onUpdatePilar,
  onBantuSekarang,
  onRefresh,
  loading = false
}) => {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ rancanganId: string; pilarId: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [bantuModalOpen, setBantuModalOpen] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const parseCurrency = (value: string): number => {
    const cleaned = value.replace(/[^\d]/g, '');
    return cleaned ? parseInt(cleaned, 10) : 0;
  };

  const getPilarValue = (rancangan: RancanganPelayanan, pilarType: PilarPelayanan): number => {
    const pilar = rancangan.pilar?.find(p => p.pilar === pilarType);
    return pilar?.target_biaya || 0;
  };

  const getPilarId = (rancangan: RancanganPelayanan, pilarType: PilarPelayanan): string | null => {
    const pilar = rancangan.pilar?.find(p => p.pilar === pilarType);
    return pilar?.id || null;
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(rancangan.map(r => r.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRows(newSelected);
  };

  const handleCellClick = (rancanganId: string, pilarId: string, currentValue: number) => {
    setEditingCell({ rancanganId, pilarId });
    setEditValue(currentValue.toString());
  };

  const handleCellBlur = async () => {
    if (!editingCell || !onUpdatePilar) {
      setEditingCell(null);
      setEditValue('');
      return;
    }
    
    const cleaned = editValue.replace(/\D/g, '');
    const newValue = cleaned ? parseInt(cleaned, 10) : 0;
    if (newValue >= 0) {
      await onUpdatePilar(editingCell.rancanganId, editingCell.pilarId, newValue);
    }
    
    setEditingCell(null);
    setEditValue('');
  };

  const handleCellKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellBlur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  };

  const getJenjangBadge = (santri: RancanganPelayanan['santri']) => {
    const jenjang = getJenjangText(santri);
    const colors: Record<string, string> = {
      'SD': 'bg-blue-50 text-blue-700 border-blue-200',
      'SMP': 'bg-green-50 text-green-700 border-green-200',
      'SMA': 'bg-purple-50 text-purple-700 border-purple-200',
      'SMK': 'bg-orange-50 text-orange-700 border-orange-200',
      'MA': 'bg-indigo-50 text-indigo-700 border-indigo-200'
    };
    return colors[jenjang] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getJenjangText = (santri: RancanganPelayanan['santri']): string => {
    return santri?.jenjang_sekolah || 'SD';
  };

  const getProgressColor = (persentase: number) => {
    if (persentase >= 100) return 'bg-emerald-600';
    if (persentase >= 50) return 'bg-emerald-500';
    if (persentase > 0) return 'bg-emerald-400';
    return 'bg-gray-300';
  };

  const selectedRancangan = useMemo(() => {
    return rancangan.filter(r => selectedRows.has(r.id));
  }, [rancangan, selectedRows]);

  if (loading) {
    return (
      <div className="w-full border border-slate-100 rounded-lg overflow-hidden">
        <div className="p-8 text-center text-gray-500">Memuat data...</div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full border border-slate-100 rounded-lg overflow-hidden bg-white">
        <div className="overflow-x-auto max-h-[calc(100vh-300px)]">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10 border-b border-slate-100 shadow-sm">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 px-3">
                  <Checkbox
                    checked={selectedRows.size === rancangan.length && rancangan.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="min-w-[200px] px-4 py-3 font-semibold text-gray-700">
                  Santri
                </TableHead>
                <TableHead className="min-w-[150px] px-4 py-3 font-semibold text-gray-700 text-right">
                  {PILAR_PELAYANAN_CONFIG.pendidikan_formal.label.split(' ')[0]}
                </TableHead>
                <TableHead className="min-w-[150px] px-4 py-3 font-semibold text-gray-700 text-right">
                  {PILAR_PELAYANAN_CONFIG.pendidikan_pesantren.label.split(' ')[0]}
                </TableHead>
                <TableHead className="min-w-[150px] px-4 py-3 font-semibold text-gray-700 text-right">
                  Operasional
                </TableHead>
                <TableHead className="min-w-[150px] px-4 py-3 font-semibold text-gray-700 text-right">
                  Bantuan
                </TableHead>
                <TableHead className="min-w-[200px] px-4 py-3 font-semibold text-gray-700 text-right">
                  Total & Progress
                </TableHead>
                <TableHead className="min-w-[180px] px-4 py-3 font-semibold text-gray-700 text-center">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rancangan.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                    Tidak ada data rancangan pelayanan
                  </TableCell>
                </TableRow>
              ) : (
                rancangan.map((r) => {
                  const pilarFormal = getPilarValue(r, 'pendidikan_formal');
                  const pilarPesantren = getPilarValue(r, 'pendidikan_pesantren');
                  const pilarOperasional = getPilarValue(r, 'operasional_konsumsi');
                  const pilarBantuan = getPilarValue(r, 'bantuan_langsung');
                  
                  const pilarFormalId = getPilarId(r, 'pendidikan_formal');
                  const pilarPesantrenId = getPilarId(r, 'pendidikan_pesantren');
                  const pilarOperasionalId = getPilarId(r, 'operasional_konsumsi');
                  const pilarBantuanId = getPilarId(r, 'bantuan_langsung');

                  const isEditingFormal = editingCell?.rancanganId === r.id && editingCell?.pilarId === pilarFormalId;
                  const isEditingPesantren = editingCell?.rancanganId === r.id && editingCell?.pilarId === pilarPesantrenId;
                  const isEditingOperasional = editingCell?.rancanganId === r.id && editingCell?.pilarId === pilarOperasionalId;
                  const isEditingBantuan = editingCell?.rancanganId === r.id && editingCell?.pilarId === pilarBantuanId;

                  return (
                    <TableRow
                      key={r.id}
                      className="hover:bg-slate-50/50 transition-colors border-b border-slate-100"
                    >
                      {/* Checkbox */}
                      <TableCell className="px-3">
                        <Checkbox
                          checked={selectedRows.has(r.id)}
                          onCheckedChange={(checked) => handleSelectRow(r.id, checked as boolean)}
                        />
                      </TableCell>

                      {/* Santri Info */}
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
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
                            <User className={cn('h-5 w-5 text-slate-400', r.santri?.foto_profil && 'hidden')} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-gray-900 truncate">
                              {r.santri?.nama_lengkap || 'Santri'}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500 font-mono">
                                {r.santri?.id_santri || ''}
                              </span>
                              <Badge className={cn('text-[10px] px-1.5 py-0', getJenjangBadge(r.santri))}>
                                {getJenjangText(r.santri)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Pilar 1 - Formal */}
                      <TableCell className="px-4 py-3 text-right">
                        {isEditingFormal ? (
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">Rp</span>
                            <Input
                              type="text"
                              value={editValue ? new Intl.NumberFormat('id-ID').format(parseInt(editValue.replace(/\D/g, '') || '0')) : ''}
                              onChange={(e) => {
                                const cleaned = e.target.value.replace(/\D/g, '');
                                setEditValue(cleaned);
                              }}
                              onBlur={handleCellBlur}
                              onKeyDown={handleCellKeyDown}
                              className="h-8 text-right text-sm font-mono pl-8"
                              autoFocus
                              placeholder="0"
                            />
                          </div>
                        ) : (
                          <div
                            className="text-sm font-mono text-gray-900 cursor-pointer hover:bg-slate-100 px-2 py-1 rounded -mx-2 -my-1"
                            onClick={() => pilarFormalId && handleCellClick(r.id, pilarFormalId, pilarFormal)}
                          >
                            {formatCurrency(pilarFormal)}
                          </div>
                        )}
                      </TableCell>

                      {/* Pilar 2 - Pesantren */}
                      <TableCell className="px-4 py-3 text-right">
                        {isEditingPesantren ? (
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">Rp</span>
                            <Input
                              type="text"
                              value={editValue ? new Intl.NumberFormat('id-ID').format(parseInt(editValue.replace(/\D/g, '') || '0')) : ''}
                              onChange={(e) => {
                                const cleaned = e.target.value.replace(/\D/g, '');
                                setEditValue(cleaned);
                              }}
                              onBlur={handleCellBlur}
                              onKeyDown={handleCellKeyDown}
                              className="h-8 text-right text-sm font-mono pl-8"
                              autoFocus
                              placeholder="0"
                            />
                          </div>
                        ) : (
                          <div
                            className="text-sm font-mono text-gray-900 cursor-pointer hover:bg-slate-100 px-2 py-1 rounded -mx-2 -my-1"
                            onClick={() => pilarPesantrenId && handleCellClick(r.id, pilarPesantrenId, pilarPesantren)}
                          >
                            {formatCurrency(pilarPesantren)}
                          </div>
                        )}
                      </TableCell>

                      {/* Pilar 3 - Operasional */}
                      <TableCell className="px-4 py-3 text-right">
                        {isEditingOperasional ? (
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">Rp</span>
                            <Input
                              type="text"
                              value={editValue ? new Intl.NumberFormat('id-ID').format(parseInt(editValue.replace(/\D/g, '') || '0')) : ''}
                              onChange={(e) => {
                                const cleaned = e.target.value.replace(/\D/g, '');
                                setEditValue(cleaned);
                              }}
                              onBlur={handleCellBlur}
                              onKeyDown={handleCellKeyDown}
                              className="h-8 text-right text-sm font-mono pl-8"
                              autoFocus
                              placeholder="0"
                            />
                          </div>
                        ) : (
                          <div
                            className="text-sm font-mono text-gray-900 cursor-pointer hover:bg-slate-100 px-2 py-1 rounded -mx-2 -my-1"
                            onClick={() => pilarOperasionalId && handleCellClick(r.id, pilarOperasionalId, pilarOperasional)}
                          >
                            {formatCurrency(pilarOperasional)}
                          </div>
                        )}
                      </TableCell>

                      {/* Pilar 4 - Bantuan */}
                      <TableCell className="px-4 py-3 text-right">
                        {isEditingBantuan ? (
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">Rp</span>
                            <Input
                              type="text"
                              value={editValue ? new Intl.NumberFormat('id-ID').format(parseInt(editValue.replace(/\D/g, '') || '0')) : ''}
                              onChange={(e) => {
                                const cleaned = e.target.value.replace(/\D/g, '');
                                setEditValue(cleaned);
                              }}
                              onBlur={handleCellBlur}
                              onKeyDown={handleCellKeyDown}
                              className="h-8 text-right text-sm font-mono pl-8"
                              autoFocus
                              placeholder="0"
                            />
                          </div>
                        ) : (
                          <div
                            className="text-sm font-mono text-gray-900 cursor-pointer hover:bg-slate-100 px-2 py-1 rounded -mx-2 -my-1"
                            onClick={() => pilarBantuanId && handleCellClick(r.id, pilarBantuanId, pilarBantuan)}
                          >
                            {formatCurrency(pilarBantuan)}
                          </div>
                        )}
                      </TableCell>

                      {/* Total & Progress */}
                      <TableCell className="px-4 py-3">
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-sm font-semibold text-gray-900 font-mono">
                            {formatCurrency(r.total_target)}
                          </div>
                          <div className="w-full max-w-[150px]">
                            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={cn('h-full transition-all duration-300', getProgressColor(r.persentase_pemenuhan))}
                                style={{ width: `${Math.min(r.persentase_pemenuhan, 100)}%` }}
                              />
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5 text-right">
                              {r.persentase_pemenuhan.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => setBantuModalOpen(r.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3"
                          >
                            <Heart className="h-3.5 w-3.5 mr-1.5" />
                            Bantu Sekarang
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDetailModalOpen(r.id)}
                            className="h-8 w-8 p-0"
                            title="Lihat Detail"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(r)}
                              className="h-8 w-8 p-0"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(r)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Hapus"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Batch Edit Bar */}
      {selectedRows.size > 0 && (
        <BatchEditBar
          selectedCount={selectedRows.size}
          selectedRancangan={selectedRancangan}
          onClearSelection={() => setSelectedRows(new Set())}
          onSuccess={() => {
            onRefresh?.();
          }}
        />
      )}

      {/* Bantu Sekarang Modal */}
      {bantuModalOpen && (
        <BantuSekarangModal
          open={!!bantuModalOpen}
          onOpenChange={(open) => !open && setBantuModalOpen(null)}
          rancangan={rancangan.find(r => r.id === bantuModalOpen)!}
          onSuccess={async (pilar, nominal) => {
            if (onBantuSekarang && bantuModalOpen) {
              await onBantuSekarang(bantuModalOpen, pilar, nominal);
            }
            setBantuModalOpen(null);
          }}
        />
      )}

      {/* Detail Modal */}
      {detailModalOpen && (
        <RancanganDetailModal
          open={!!detailModalOpen}
          onOpenChange={(open) => !open && setDetailModalOpen(null)}
          rancangan={rancangan.find(r => r.id === detailModalOpen) || null}
          onClone={async () => {
            onRefresh?.();
          }}
        />
      )}
    </>
  );
};

export default RancanganDataTable;

