import React, { useState, useMemo, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, ChevronRight, Edit, Trash2, Heart, Eye, User, Calendar, GraduationCap } from 'lucide-react';
import { type RancanganPelayanan, RancanganPelayananService, PILAR_PELAYANAN_CONFIG, type PilarPelayanan } from '@/services/rancanganPelayanan.service';
import { cn } from '@/lib/utils';
import BantuSekarangModal from './BantuSekarangModal';
import BatchEditBar from './BatchEditBar';
import RancanganDetailModal from './RancanganDetailModal';

interface BatchBasedTableProps {
  onEdit?: (rancangan: RancanganPelayanan) => void;
  onDelete?: (rancangan: RancanganPelayanan) => void;
  onUpdatePilar?: (rancanganId: string, pilarId: string, nominal: number) => Promise<void>;
  onBantuSekarang?: (rancanganId: string, pilar: PilarPelayanan, nominal: number) => Promise<void>;
  onRefresh?: () => void;
  loading?: boolean;
}

interface BatchData {
  id: string;
  tahun: number;
  semester_id: string | null;
  semester_nama: string | null;
  tahun_ajaran_nama: string | null;
  periode: string | null;
  jumlah_santri: number;
  total_target: number;
  total_dukungan: number;
  total_kekurangan: number;
  label: string;
  rancangan: RancanganPelayanan[];
}

const BatchBasedTable: React.FC<BatchBasedTableProps> = ({
  onEdit,
  onDelete,
  onUpdatePilar,
  onBantuSekarang,
  onRefresh,
  loading = false
}) => {
  const [batches, setBatches] = useState<BatchData[]>([]);
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ rancanganId: string; pilarId: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [bantuModalOpen, setBantuModalOpen] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState<string | null>(null);
  const [loadingBatches, setLoadingBatches] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const loadBatches = async () => {
    try {
      setLoadingBatches(true);
      const batchList = await RancanganPelayananService.getDaftarBatch();
      
      // Load all rancangan to find unassigned ones
      const allRancangan = await RancanganPelayananService.getAllRancangan();
      const aktifRancangan = allRancangan.filter(r => r.status === 'aktif');
      
      // Get all rancangan IDs that are already in batches
      const assignedRancanganIds = new Set<string>();
      batchList.forEach(batch => {
        const [tahunStr, semesterId, periodeDetail] = batch.id.split('-');
        const tahun = parseInt(tahunStr);
        aktifRancangan.forEach(r => {
          const rWithSemester = r as RancanganPelayanan & { semester_id?: string | null };
          if (r.tahun === tahun &&
              ((semesterId === 'null' && (rWithSemester.semester_id === null || rWithSemester.semester_id === undefined)) || 
               (semesterId !== 'null' && rWithSemester.semester_id === semesterId)) &&
              ((periodeDetail === 'null' && r.periode === null) || (periodeDetail !== 'null' && r.periode === periodeDetail))) {
            assignedRancanganIds.add(r.id);
          }
        });
      });
      
      // Find unassigned rancangan (aktif but not in any batch)
      const unassignedRancangan = aktifRancangan.filter(r => !assignedRancanganIds.has(r.id));
      
      // Load rancangan details for each batch
      const batchesWithRancangan: BatchData[] = await Promise.all(
        batchList.map(async (batch) => {
          // Parse batchId to get filter params
          const [tahunStr, semesterId, periodeDetail] = batch.id.split('-');
          const tahun = parseInt(tahunStr);

          const rancanganData = aktifRancangan.filter(r => {
            const rWithSemester = r as RancanganPelayanan & { semester_id?: string | null };
            if (r.tahun !== tahun) return false;
            if (semesterId !== 'null' && rWithSemester.semester_id !== semesterId) return false;
            if (semesterId === 'null' && (rWithSemester.semester_id !== null && rWithSemester.semester_id !== undefined)) return false;
            if (periodeDetail !== 'null' && r.periode !== periodeDetail) return false;
            if (periodeDetail === 'null' && r.periode !== null) return false;
            return true;
          });

          return {
            ...batch,
            rancangan: rancanganData || []
          };
        })
      );
      
      // Add unassigned rancangan as a special batch if there are any
      if (unassignedRancangan.length > 0) {
        // Group unassigned by tahun for better organization
        const unassignedByTahun = new Map<number, RancanganPelayanan[]>();
        unassignedRancangan.forEach(r => {
          if (!unassignedByTahun.has(r.tahun)) {
            unassignedByTahun.set(r.tahun, []);
          }
          unassignedByTahun.get(r.tahun)!.push(r);
        });
        
        unassignedByTahun.forEach((rancanganList, tahun) => {
          const totalTarget = rancanganList.reduce((sum, r) => sum + (r.total_target || 0), 0);
          const totalDukungan = rancanganList.reduce((sum, r) => sum + (r.total_dukungan || 0), 0);
          const totalKekurangan = Math.max(0, totalTarget - totalDukungan);
          
          batchesWithRancangan.push({
            id: `unassigned-${tahun}`,
            tahun,
            semester_id: null,
            semester_nama: null,
            tahun_ajaran_nama: null,
            periode: null,
            jumlah_santri: rancanganList.length,
            total_target: totalTarget,
            total_dukungan: totalDukungan,
            total_kekurangan: totalKekurangan,
            label: `Belum di-assign ke Batch - Tahun ${tahun}`,
            rancangan: rancanganList
          });
        });
      }

      setBatches(batchesWithRancangan);
    } catch (error: any) {
      console.error('Error loading batches:', error);
    } finally {
      setLoadingBatches(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

  const toggleBatchExpand = (batchId: string) => {
    const newExpanded = new Set(expandedBatches);
    if (newExpanded.has(batchId)) {
      newExpanded.delete(batchId);
    } else {
      newExpanded.add(batchId);
    }
    setExpandedBatches(newExpanded);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set<string>();
      batches.forEach(batch => {
        batch.rancangan.forEach(r => allIds.add(r.id));
      });
      setSelectedRows(allIds);
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
      await loadBatches(); // Reload after update
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

  const getPilarValue = (rancangan: RancanganPelayanan, pilarType: PilarPelayanan): number => {
    const pilar = rancangan.pilar?.find(p => p.pilar === pilarType);
    return pilar?.target_biaya || 0;
  };

  const getPilarId = (rancangan: RancanganPelayanan, pilarType: PilarPelayanan): string | null => {
    const pilar = rancangan.pilar?.find(p => p.pilar === pilarType);
    return pilar?.id || null;
  };

  const getJenjangBadge = (santri: RancanganPelayanan['santri']) => {
    const jenjang = santri?.jenjang_sekolah || 'SD';
    const colors: Record<string, string> = {
      'SD': 'bg-blue-50 text-blue-700 border-blue-200',
      'SMP': 'bg-green-50 text-green-700 border-green-200',
      'SMA': 'bg-purple-50 text-purple-700 border-purple-200',
      'SMK': 'bg-orange-50 text-orange-700 border-orange-200',
      'MA': 'bg-indigo-50 text-indigo-700 border-indigo-200'
    };
    return colors[jenjang] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getProgressColor = (persentase: number) => {
    if (persentase >= 100) return 'bg-emerald-600';
    if (persentase >= 50) return 'bg-emerald-500';
    if (persentase > 0) return 'bg-emerald-400';
    return 'bg-gray-300';
  };

  const selectedRancangan = useMemo(() => {
    const allRancangan: RancanganPelayanan[] = [];
    batches.forEach(batch => {
      batch.rancangan.forEach(r => {
        if (selectedRows.has(r.id)) {
          allRancangan.push(r);
        }
      });
    });
    return allRancangan;
  }, [batches, selectedRows]);

  if (loading || loadingBatches) {
    return (
      <div className="w-full border border-slate-100 rounded-lg overflow-hidden">
        <div className="p-8 text-center text-gray-500">Memuat data...</div>
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="w-full border border-slate-100 rounded-lg overflow-hidden bg-white">
        <div className="p-8 text-center text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium mb-2">Belum ada batch kebutuhan layanan</p>
          <p className="text-sm text-gray-500">Buat batch baru untuk mulai mengatur kebutuhan layanan santri</p>
        </div>
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
                    checked={selectedRows.size > 0 && selectedRows.size === batches.reduce((sum, b) => sum + b.rancangan.length, 0)}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="min-w-[250px] px-4 py-3 font-semibold text-gray-700">
                  Batch Kebutuhan / Santri
                </TableHead>
                <TableHead className="min-w-[120px] px-4 py-3 font-semibold text-gray-700 text-center">
                  Jumlah Santri
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
              {batches.map((batch) => {
                const isExpanded = expandedBatches.has(batch.id);
                const batchProgress = batch.total_target > 0 
                  ? (batch.total_dukungan / batch.total_target) * 100 
                  : 0;

                return (
                  <React.Fragment key={batch.id}>
                    {/* Batch Row */}
                    <TableRow className="hover:bg-slate-50/50 transition-colors border-b border-slate-200 bg-slate-50/30">
                      <TableCell className="px-3">
                        <Checkbox
                          checked={batch.rancangan.every(r => selectedRows.has(r.id)) && batch.rancangan.length > 0}
                          onCheckedChange={(checked) => {
                            batch.rancangan.forEach(r => {
                              handleSelectRow(r.id, checked as boolean);
                            });
                          }}
                        />
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => toggleBatchExpand(batch.id)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <GraduationCap className="h-4 w-4 text-blue-600" />
                              <span className="font-semibold text-gray-900">{batch.label}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {batch.semester_nama && (
                                <Badge variant="outline" className="text-xs">
                                  {batch.semester_nama}
                                </Badge>
                              )}
                              {batch.periode && (
                                <Badge variant="outline" className="text-xs">
                                  {batch.periode}
                                </Badge>
                              )}
                              <span className="text-xs text-gray-500">Tahun {batch.tahun}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        <span className="font-medium text-gray-900">{batch.jumlah_santri}</span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <span className="font-semibold text-gray-900 font-mono">
                          {formatCurrency(batch.total_target)}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <span className="font-medium text-emerald-600 font-mono">
                          {formatCurrency(batch.total_dukungan)}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <span className={cn(
                          "font-medium font-mono",
                          batch.total_kekurangan > 0 ? "text-red-600" : "text-gray-500"
                        )}>
                          {formatCurrency(batch.total_kekurangan)}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-full max-w-[100px]">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={cn('h-full transition-all duration-300', getProgressColor(batchProgress))}
                                style={{ width: `${Math.min(batchProgress, 100)}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {batchProgress.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Rancangan Rows */}
                    {isExpanded && batch.rancangan.map((r) => {
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
                          className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 bg-white"
                        >
                          <TableCell className="px-3">
                            <Checkbox
                              checked={selectedRows.has(r.id)}
                              onCheckedChange={(checked) => handleSelectRow(r.id, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell className="px-4 py-3 pl-12">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                                {r.santri?.foto_profil ? (
                                  <img
                                    src={r.santri.foto_profil}
                                    alt={r.santri.nama_lengkap}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
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
                                    {r.santri?.jenjang_sekolah || 'SD'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-right">
                            {isEditingFormal ? (
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">Rp</span>
                                <input
                                  type="text"
                                  value={editValue ? new Intl.NumberFormat('id-ID').format(parseInt(editValue.replace(/\D/g, '') || '0')) : ''}
                                  onChange={(e) => {
                                    const cleaned = e.target.value.replace(/\D/g, '');
                                    setEditValue(cleaned);
                                  }}
                                  onBlur={handleCellBlur}
                                  onKeyDown={handleCellKeyDown}
                                  className="h-8 text-right text-sm font-mono pl-8 border rounded px-2 w-full"
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
                          <TableCell className="px-4 py-3 text-right">
                            {isEditingPesantren ? (
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">Rp</span>
                                <input
                                  type="text"
                                  value={editValue ? new Intl.NumberFormat('id-ID').format(parseInt(editValue.replace(/\D/g, '') || '0')) : ''}
                                  onChange={(e) => {
                                    const cleaned = e.target.value.replace(/\D/g, '');
                                    setEditValue(cleaned);
                                  }}
                                  onBlur={handleCellBlur}
                                  onKeyDown={handleCellKeyDown}
                                  className="h-8 text-right text-sm font-mono pl-8 border rounded px-2 w-full"
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
                          <TableCell className="px-4 py-3 text-right">
                            {isEditingOperasional ? (
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">Rp</span>
                                <input
                                  type="text"
                                  value={editValue ? new Intl.NumberFormat('id-ID').format(parseInt(editValue.replace(/\D/g, '') || '0')) : ''}
                                  onChange={(e) => {
                                    const cleaned = e.target.value.replace(/\D/g, '');
                                    setEditValue(cleaned);
                                  }}
                                  onBlur={handleCellBlur}
                                  onKeyDown={handleCellKeyDown}
                                  className="h-8 text-right text-sm font-mono pl-8 border rounded px-2 w-full"
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
                          <TableCell className="px-4 py-3 text-right">
                            {isEditingBantuan ? (
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">Rp</span>
                                <input
                                  type="text"
                                  value={editValue ? new Intl.NumberFormat('id-ID').format(parseInt(editValue.replace(/\D/g, '') || '0')) : ''}
                                  onChange={(e) => {
                                    const cleaned = e.target.value.replace(/\D/g, '');
                                    setEditValue(cleaned);
                                  }}
                                  onBlur={handleCellBlur}
                                  onKeyDown={handleCellKeyDown}
                                  className="h-8 text-right text-sm font-mono pl-8 border rounded px-2 w-full"
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
                          <TableCell className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => setBantuModalOpen(r.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3"
                              >
                                <Heart className="h-3.5 w-3.5 mr-1.5" />
                                Bantu
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
                    })}
                  </React.Fragment>
                );
              })}
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
            loadBatches();
            onRefresh?.();
          }}
        />
      )}

      {/* Bantu Sekarang Modal */}
      {bantuModalOpen && (
        <BantuSekarangModal
          open={!!bantuModalOpen}
          onOpenChange={(open) => !open && setBantuModalOpen(null)}
          rancangan={batches.flatMap(b => b.rancangan).find(r => r.id === bantuModalOpen)!}
          onSuccess={async (pilar, nominal) => {
            if (onBantuSekarang && bantuModalOpen) {
              await onBantuSekarang(bantuModalOpen, pilar, nominal);
            }
            setBantuModalOpen(null);
            await loadBatches();
          }}
        />
      )}

      {/* Detail Modal */}
      {detailModalOpen && (
        <RancanganDetailModal
          open={!!detailModalOpen}
          onOpenChange={(open) => !open && setDetailModalOpen(null)}
          rancangan={batches.flatMap(b => b.rancangan).find(r => r.id === detailModalOpen) || null}
          onClone={async () => {
            await loadBatches();
            onRefresh?.();
          }}
        />
      )}
    </>
  );
};

export default BatchBasedTable;

