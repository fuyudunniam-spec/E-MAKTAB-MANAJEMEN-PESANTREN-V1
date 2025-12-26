import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Calendar, DollarSign, Loader2, Edit, Eye, GraduationCap } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  RancanganPelayananService, 
  type RancanganPelayanan,
  type PilarPelayanan,
  PILAR_PELAYANAN_CONFIG
} from '@/services/rancanganPelayanan.service';
import { SemesterSyncService } from '@/services/semesterSync.service';
import { type Semester } from '@/services/akademikSemester.service';
import { toast } from 'sonner';

interface BatchEditBarProps {
  selectedCount: number;
  selectedRancangan: RancanganPelayanan[];
  onClearSelection: () => void;
  onSuccess?: () => void;
}

const BatchEditBar: React.FC<BatchEditBarProps> = ({
  selectedCount,
  selectedRancangan,
  onClearSelection,
  onSuccess
}) => {
  const [showPeriodDialog, setShowPeriodDialog] = useState(false);
  const [showNominalDialog, setShowNominalDialog] = useState(false);
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false);
  const [period, setPeriod] = useState<string>('none'); // Use 'none' instead of empty string
  const [periodCustom, setPeriodCustom] = useState('');
  const [nominal, setNominal] = useState('');
  const [selectedPilar, setSelectedPilar] = useState<PilarPelayanan>('pendidikan_formal');
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSemesterDialog, setShowSemesterDialog] = useState(false);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('');
  const [semesterOptions, setSemesterOptions] = useState<Array<{ value: string; label: string; semester: Semester }>>([]);

  const handleAturPeriode = () => {
    setShowPeriodDialog(true);
  };

  const handleTerapkanNominal = () => {
    setShowNominalDialog(true);
  };

  const handlePeriodSubmit = async () => {
    const finalPeriod = period === 'custom' ? periodCustom.trim() : period;
    
    if (!finalPeriod || finalPeriod === 'none') {
      toast.error('Periode harus diisi');
      return;
    }

    try {
      setLoading(true);
      const rancanganIds = selectedRancangan.map(r => r.id);
      await RancanganPelayananService.batchUpdatePeriode(rancanganIds, finalPeriod);
      toast.success(`Periode berhasil diupdate untuk ${selectedCount} rancangan`);
      setShowPeriodDialog(false);
      setPeriod('none');
      setPeriodCustom('');
      onSuccess?.();
    } catch (error: any) {
      console.error('Error updating periode:', error);
      toast.error(error.message || 'Gagal mengupdate periode');
    } finally {
      setLoading(false);
    }
  };

  const handleNominalSubmit = async () => {
    const nominalValue = parseInt(nominal.replace(/[^\d]/g, '')) || 0;
    
    if (nominalValue <= 0) {
      toast.error('Nominal harus lebih dari 0');
      return;
    }

    try {
      setLoading(true);
      const rancanganIds = selectedRancangan.map(r => r.id);
      await RancanganPelayananService.batchUpdateNominalPilar(
        rancanganIds,
        selectedPilar,
        nominalValue
      );
      toast.success(`Nominal ${PILAR_PELAYANAN_CONFIG[selectedPilar].label} berhasil diupdate untuk ${selectedCount} rancangan`);
      setShowNominalDialog(false);
      setNominal('');
      setSelectedPilar('pendidikan_formal');
      onSuccess?.();
    } catch (error: any) {
      console.error('Error updating nominal:', error);
      toast.error(error.message || 'Gagal mengupdate nominal');
    } finally {
      setLoading(false);
    }
  };

  const loadSemesterOptions = async () => {
    try {
      const options = await SemesterSyncService.getSemesterOptions();
      setSemesterOptions(options);
      
      // Auto-select active semester
      const activeSemester = await SemesterSyncService.getActiveSemester();
      if (activeSemester) {
        setSelectedSemesterId(activeSemester.id);
      } else if (options.length > 0) {
        setSelectedSemesterId(options[0].value);
      }
    } catch (error: any) {
      console.error('Error loading semester options:', error);
      toast.error('Gagal memuat data semester');
    }
  };

  const handleSemesterSubmit = async () => {
    if (!selectedSemesterId) {
      toast.error('Pilih semester terlebih dahulu');
      return;
    }

    try {
      setLoading(true);
      const rancanganIds = selectedRancangan.map(r => r.id);
      await RancanganPelayananService.batchUpdateSemester(rancanganIds, selectedSemesterId);
      
      const selectedSemester = semesterOptions.find(opt => opt.value === selectedSemesterId);
      const semesterLabel = selectedSemester?.label || 'Semester yang dipilih';
      
      toast.success(`Semester berhasil disinkronkan untuk ${selectedCount} rancangan: ${semesterLabel}`);
      setShowSemesterDialog(false);
      setSelectedSemesterId('');
      onSuccess?.();
    } catch (error: any) {
      console.error('Error updating semester:', error);
      toast.error(error.message || 'Gagal mengupdate semester');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-3 flex items-center gap-4">
          <div className="text-sm font-medium text-gray-700">
            {selectedCount} santri dipilih
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAturPeriode}
            className="text-sm"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Atur Periode
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleTerapkanNominal}
            className="text-sm"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Terapkan Nominal Standar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              loadSemesterOptions();
              setShowSemesterDialog(true);
            }}
            className="text-sm"
          >
            <GraduationCap className="h-4 w-4 mr-2" />
            Sinkronkan Semester
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBulkEditDialog(true)}
            className="text-sm"
          >
            <Edit className="h-4 w-4 mr-2" />
            Bulk Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Period Dialog */}
      <Dialog open={showPeriodDialog} onOpenChange={setShowPeriodDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Atur Periode</DialogTitle>
            <DialogDescription>
              Atur periode untuk {selectedCount} santri yang dipilih
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Periode</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih periode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bulanan">Bulanan</SelectItem>
                  <SelectItem value="semester">Semester</SelectItem>
                  <SelectItem value="tahunan">Tahunan</SelectItem>
                  <SelectItem value="custom">Custom (Input Manual)</SelectItem>
                </SelectContent>
              </Select>
              {period === 'custom' && (
                <Input
                  value={periodCustom}
                  onChange={(e) => setPeriodCustom(e.target.value)}
                  placeholder="Contoh: Januari 2024, Semester 1 2024"
                  className="mt-2"
                />
              )}
            </div>
            {period && period !== 'custom' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  Periode yang akan diterapkan: <strong>{period}</strong>
                </p>
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPeriodDialog(false);
                  setPeriod('none');
                }}
                className="flex-1"
                disabled={loading}
              >
                Batal
              </Button>
              <Button
                onClick={handlePeriodSubmit}
                className="flex-1"
                disabled={(!period || period === 'none' || (period === 'custom' && !periodCustom.trim()) || loading)}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Terapkan'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nominal Dialog */}
      <Dialog open={showNominalDialog} onOpenChange={setShowNominalDialog}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Terapkan Nominal Standar Pilar</DialogTitle>
            <DialogDescription>
              Terapkan nominal standar untuk pilar tertentu pada {selectedCount} rancangan yang dipilih
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Pilih Pilar Pelayanan</Label>
              <Select value={selectedPilar} onValueChange={(v) => setSelectedPilar(v as PilarPelayanan)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih pilar" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PILAR_PELAYANAN_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nominal Standar (Rp)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  Rp
                </span>
                <Input
                  type="text"
                  value={nominal ? formatCurrency(parseInt(nominal.replace(/[^\d]/g, '') || '0')) : ''}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/[^\d]/g, '');
                    setNominal(cleaned);
                  }}
                  placeholder="0"
                  className="pl-10 font-mono text-right"
                />
              </div>
              <p className="text-xs text-gray-500">
                Nominal akan diterapkan ke pilar {PILAR_PELAYANAN_CONFIG[selectedPilar].label}
              </p>
              {nominal && parseInt(nominal.replace(/[^\d]/g, '')) > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mt-2">
                  <p className="text-xs text-blue-800">
                    Preview: {formatCurrency(parseInt(nominal.replace(/[^\d]/g, '')))} akan diterapkan ke <strong>{selectedCount}</strong> rancangan untuk pilar <strong>{PILAR_PELAYANAN_CONFIG[selectedPilar].label}</strong>
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNominalDialog(false);
                  setNominal('');
                }}
                className="flex-1"
                disabled={loading}
              >
                Batal
              </Button>
              <Button
                onClick={handleNominalSubmit}
                className="flex-1"
                disabled={!nominal || loading || parseInt(nominal.replace(/[^\d]/g, '')) <= 0}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Terapkan'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Edit Dialog - Advanced */}
      <Dialog open={showBulkEditDialog} onOpenChange={(open) => {
        setShowBulkEditDialog(open);
        if (open) {
          loadSemesterOptions();
        } else {
          setSelectedSemesterId('');
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Edit Kebutuhan Layanan</DialogTitle>
            <DialogDescription>
              Edit beberapa field sekaligus untuk {selectedCount} kebutuhan layanan yang dipilih
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Preview Rancangan yang Dipilih</Label>
              <div className="max-h-32 overflow-y-auto border rounded-lg p-2 space-y-1">
                {selectedRancangan.slice(0, 5).map((r) => (
                  <div key={r.id} className="text-xs text-gray-600">
                    • {r.santri?.nama_lengkap || 'Santri'} - {r.periode || 'Tidak ada periode'}
                  </div>
                ))}
                {selectedRancangan.length > 5 && (
                  <div className="text-xs text-gray-500 italic">
                    ... dan {selectedRancangan.length - 5} lainnya
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-blue-600" />
                Sinkronkan Semester
              </Label>
              <Select 
                value={selectedSemesterId || 'none'} 
                onValueChange={(v) => {
                  if (v === 'none') {
                    setSelectedSemesterId('');
                  } else {
                    setSelectedSemesterId(v);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih semester atau biarkan kosong" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak diubah</SelectItem>
                  {semesterOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedSemesterId && selectedSemesterId !== 'none' && (
                <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800 mt-2">
                  Semester akan disinkronkan: <strong>{semesterOptions.find(opt => opt.value === selectedSemesterId)?.label || 'Semester yang dipilih'}</strong>
                  <br />
                  <span className="text-blue-600">Batch akan otomatis teridentifikasi berdasarkan kombinasi tahun + semester + periode</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Atur Periode</Label>
              <Select value={period === 'none' ? undefined : period} onValueChange={(v) => setPeriod(v || 'none')}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih atau biarkan kosong" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak diubah</SelectItem>
                  <SelectItem value="bulanan">Bulanan</SelectItem>
                  <SelectItem value="semester">Semester</SelectItem>
                  <SelectItem value="tahunan">Tahunan</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              {period === 'custom' && (
                <Input
                  value={periodCustom}
                  onChange={(e) => setPeriodCustom(e.target.value)}
                  placeholder="Contoh: Januari 2024"
                  className="mt-2"
                />
              )}
              {period && period !== 'none' && (
                <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800 mt-2">
                  Periode akan diubah menjadi: <strong>{period === 'custom' ? periodCustom : period}</strong>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Terapkan Nominal ke Pilar</Label>
              <div className="grid grid-cols-2 gap-2">
                <Select value={selectedPilar} onValueChange={(v) => setSelectedPilar(v as PilarPelayanan)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PILAR_PELAYANAN_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                    Rp
                  </span>
                  <Input
                    type="text"
                    value={nominal ? formatCurrency(parseInt(nominal.replace(/[^\d]/g, '') || '0')) : ''}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/[^\d]/g, '');
                      setNominal(cleaned);
                    }}
                    placeholder="0"
                    className="pl-8 font-mono text-right text-sm"
                  />
                </div>
              </div>
              {nominal && parseInt(nominal.replace(/[^\d]/g, '')) > 0 && (
                <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800 mt-2">
                  Nominal <strong>{formatCurrency(parseInt(nominal.replace(/[^\d]/g, '')))}</strong> akan diterapkan ke pilar <strong>{PILAR_PELAYANAN_CONFIG[selectedPilar].label}</strong>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowBulkEditDialog(false);
                  setSelectedSemesterId('');
                  setPeriod('none');
                  setPeriodCustom('');
                  setNominal('');
                }}
                className="flex-1"
                disabled={loading}
              >
                Batal
              </Button>
              <Button
                onClick={async () => {
                  let hasChanges = false;
                  
                  // Apply semester sync if set
                  if (selectedSemesterId && selectedSemesterId !== 'none') {
                    try {
                      setLoading(true);
                      hasChanges = true;
                      const rancanganIds = selectedRancangan.map(r => r.id);
                      await RancanganPelayananService.batchUpdateSemester(rancanganIds, selectedSemesterId);
                      const selectedSemester = semesterOptions.find(opt => opt.value === selectedSemesterId);
                      toast.success(`Semester berhasil disinkronkan: ${selectedSemester?.label || 'Semester yang dipilih'}`);
                    } catch (error: any) {
                      toast.error('Gagal mengupdate semester');
                      setLoading(false);
                      return;
                    }
                  }
                  
                  // Apply periode if set (not 'none')
                  if (period && period !== 'none') {
                    const finalPeriod = period === 'custom' ? periodCustom.trim() : period;
                    if (finalPeriod) {
                      try {
                        if (!hasChanges) setLoading(true);
                        hasChanges = true;
                        const rancanganIds = selectedRancangan.map(r => r.id);
                        await RancanganPelayananService.batchUpdatePeriode(rancanganIds, finalPeriod);
                        toast.success(`Periode berhasil diupdate`);
                      } catch (error: any) {
                        toast.error('Gagal mengupdate periode');
                        setLoading(false);
                        return;
                      }
                    }
                  }

                  // Apply nominal if set
                  if (nominal && parseInt(nominal.replace(/[^\d]/g, '')) > 0) {
                    try {
                      if (!hasChanges) setLoading(true);
                      hasChanges = true;
                      const nominalValue = parseInt(nominal.replace(/[^\d]/g, ''));
                      const rancanganIds = selectedRancangan.map(r => r.id);
                      await RancanganPelayananService.batchUpdateNominalPilar(
                        rancanganIds,
                        selectedPilar,
                        nominalValue
                      );
                      toast.success(`Nominal berhasil diupdate`);
                    } catch (error: any) {
                      toast.error('Gagal mengupdate nominal');
                      setLoading(false);
                      return;
                    }
                  }

                  if (!hasChanges) {
                    toast.error('Pilih setidaknya satu perubahan (semester, periode, atau nominal)');
                    return;
                  }

                  setLoading(false);
                  setShowBulkEditDialog(false);
                  setSelectedSemesterId('');
                  setPeriod('none');
                  setPeriodCustom('');
                  setNominal('');
                  onSuccess?.();
                }}
                className="flex-1"
                disabled={loading || ((selectedSemesterId === '' || selectedSemesterId === 'none') && (period === 'none' || !period) && (!nominal || parseInt(nominal.replace(/[^\d]/g, '')) <= 0))}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Terapkan Semua'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Semester Sync Dialog */}
      <Dialog open={showSemesterDialog} onOpenChange={setShowSemesterDialog}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              Sinkronkan Semester
            </DialogTitle>
            <DialogDescription>
              Sinkronkan semester untuk {selectedCount} kebutuhan layanan yang dipilih dengan semester aktif di modul akademik
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Pilih Semester *</Label>
              <Select 
                value={selectedSemesterId} 
                onValueChange={setSelectedSemesterId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesterOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedSemesterId && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    Semester yang dipilih akan diterapkan ke <strong>{selectedCount}</strong> kebutuhan layanan yang dipilih.
                    <br />
                    <span className="font-medium mt-1 block">Batch akan otomatis teridentifikasi berdasarkan kombinasi tahun + semester + periode.</span>
                    <br />
                    <span className="text-blue-600 mt-1 block">Batch ini akan muncul sebagai referensi di dialog form donasi.</span>
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSemesterDialog(false);
                  setSelectedSemesterId('');
                }}
                className="flex-1"
                disabled={loading}
              >
                Batal
              </Button>
              <Button
                onClick={handleSemesterSubmit}
                className="flex-1"
                disabled={!selectedSemesterId || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Sinkronkan'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BatchEditBar;

