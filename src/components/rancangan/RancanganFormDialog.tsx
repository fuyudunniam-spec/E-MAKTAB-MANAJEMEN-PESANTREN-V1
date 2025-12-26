import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import {
  RancanganPelayananService,
  PILAR_PELAYANAN_CONFIG,
  type CreateRancanganInput,
  type UpdateRancanganInput,
  type PilarPelayanan,
  type RancanganPelayanan
} from '@/services/rancanganPelayanan.service';
import { supabase } from '@/integrations/supabase/client';

// Helper function untuk mendapatkan warna pilar
const getPilarColorHex = (color: string): string => {
  const colorMap: Record<string, string> = {
    slate: '#64748b',
    blue: '#3b82f6',
    green: '#22c55e',
    orange: '#f97316'
  };
  return colorMap[color] || '#64748b';
};

interface RancanganFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingRancangan?: RancanganPelayanan | null;
  santriId?: string;
}

const RancanganFormDialog: React.FC<RancanganFormDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  editingRancangan,
  santriId
}) => {
  const [loading, setLoading] = useState(false);
  const [santriList, setSantriList] = useState<Array<{ id: string; nama_lengkap: string; id_santri?: string }>>([]);
  const [selectedSantriId, setSelectedSantriId] = useState<string>(santriId || '');
  const [tahun, setTahun] = useState<number>(new Date().getFullYear());
  const [periode, setPeriode] = useState<string>('');
  const [catatan, setCatatan] = useState<string>('');
  const [pilar, setPilar] = useState<Array<{
    pilar: PilarPelayanan;
    nama_pilar: string;
    target_biaya: number;
    rincian_biaya?: any;
    catatan?: string;
  }>>([]);
  const [expandedRincian, setExpandedRincian] = useState<Set<number>>(new Set());

  // Load santri list
  useEffect(() => {
    if (open) {
      loadSantriList();
      if (editingRancangan) {
        loadEditingData();
      } else {
        resetForm();
        // Initialize dengan 4 pilar default
        if (pilar.length === 0) {
          setPilar(Object.keys(PILAR_PELAYANAN_CONFIG).map(key => ({
            pilar: key as PilarPelayanan,
            nama_pilar: PILAR_PELAYANAN_CONFIG[key as PilarPelayanan].label,
            target_biaya: 0,
            catatan: ''
          })));
        }
      }
    }
  }, [open, editingRancangan]);

  const loadSantriList = async () => {
    try {
      const { data, error } = await supabase
        .from('santri')
        .select('id, nama_lengkap, id_santri')
        .eq('status_santri', 'Aktif')
        .order('nama_lengkap', { ascending: true });

      if (error) throw error;
      setSantriList(data || []);
    } catch (error: any) {
      console.error('Error loading santri:', error);
      toast.error('Gagal memuat data santri');
    }
  };

  const loadEditingData = () => {
    if (!editingRancangan) return;

    setSelectedSantriId(editingRancangan.santri_id);
    setTahun(editingRancangan.tahun);
    setPeriode(editingRancangan.periode || '');
    setCatatan(editingRancangan.catatan || '');
    
    if (editingRancangan.pilar && editingRancangan.pilar.length > 0) {
      setPilar(editingRancangan.pilar.map(p => ({
        pilar: p.pilar,
        nama_pilar: p.nama_pilar,
        target_biaya: p.target_biaya,
        rincian_biaya: p.rincian_biaya,
        catatan: p.catatan || ''
      })));
    } else {
      // Initialize dengan 4 pilar default
      setPilar(Object.keys(PILAR_PELAYANAN_CONFIG).map(key => ({
        pilar: key as PilarPelayanan,
        nama_pilar: PILAR_PELAYANAN_CONFIG[key as PilarPelayanan].label,
        target_biaya: 0,
        catatan: ''
      })));
    }
  };

  const resetForm = () => {
    setSelectedSantriId(santriId || '');
    setTahun(new Date().getFullYear());
    setPeriode('');
    setCatatan('');
    setPilar(Object.keys(PILAR_PELAYANAN_CONFIG).map(key => ({
      pilar: key as PilarPelayanan,
      nama_pilar: PILAR_PELAYANAN_CONFIG[key as PilarPelayanan].label,
      target_biaya: 0,
      catatan: ''
    })));
  };

  const handleAddPilar = () => {
    // Find unused pilar
    const usedPilar = new Set(pilar.map(p => p.pilar));
    const availablePilar = Object.keys(PILAR_PELAYANAN_CONFIG).find(
      key => !usedPilar.has(key as PilarPelayanan)
    ) as PilarPelayanan | undefined;

    if (availablePilar) {
      setPilar([...pilar, {
        pilar: availablePilar,
        nama_pilar: PILAR_PELAYANAN_CONFIG[availablePilar].label,
        target_biaya: 0,
        catatan: ''
      }]);
    } else {
      toast.info('Semua pilar sudah ditambahkan');
    }
  };

  const handleRemovePilar = (index: number) => {
    setPilar(pilar.filter((_, i) => i !== index));
  };

  const handleUpdatePilar = (index: number, field: string, value: any) => {
    const updated = [...pilar];
    updated[index] = { ...updated[index], [field]: value };
    setPilar(updated);
  };

  const toggleRincianExpanded = (index: number) => {
    const newExpanded = new Set(expandedRincian);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRincian(newExpanded);
  };

  const handleAddRincianItem = (pilarIndex: number) => {
    const updated = [...pilar];
    const currentRincian = updated[pilarIndex].rincian_biaya || [];
    updated[pilarIndex] = {
      ...updated[pilarIndex],
      rincian_biaya: [
        ...currentRincian,
        {
          nama_item: '',
          jumlah: 1,
          satuan: 'unit',
          harga_satuan: 0,
          total: 0
        }
      ]
    };
    setPilar(updated);
  };

  const handleUpdateRincianItem = (pilarIndex: number, itemIndex: number, field: string, value: any) => {
    const updated = [...pilar];
    const rincian = [...(updated[pilarIndex].rincian_biaya || [])];
    rincian[itemIndex] = { ...rincian[itemIndex], [field]: value };
    
    // Auto-calculate total
    if (field === 'jumlah' || field === 'harga_satuan') {
      rincian[itemIndex].total = (rincian[itemIndex].jumlah || 0) * (rincian[itemIndex].harga_satuan || 0);
    }
    
    updated[pilarIndex] = {
      ...updated[pilarIndex],
      rincian_biaya: rincian
    };
    setPilar(updated);
  };

  const handleRemoveRincianItem = (pilarIndex: number, itemIndex: number) => {
    const updated = [...pilar];
    const rincian = [...(updated[pilarIndex].rincian_biaya || [])];
    rincian.splice(itemIndex, 1);
    updated[pilarIndex] = {
      ...updated[pilarIndex],
      rincian_biaya: rincian.length > 0 ? rincian : undefined
    };
    setPilar(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSantriId) {
      toast.error('Pilih santri terlebih dahulu');
      return;
    }

    if (pilar.length === 0) {
      toast.error('Minimal harus ada satu pilar pelayanan');
      return;
    }

    const totalTarget = pilar.reduce((sum, p) => sum + (p.target_biaya || 0), 0);
    if (totalTarget === 0) {
      toast.error('Total rencana anggaran tidak boleh nol');
      return;
    }

    try {
      setLoading(true);

      if (editingRancangan) {
        const updateInput: UpdateRancanganInput = {
          tahun,
          periode: periode || undefined,
          catatan: catatan || undefined,
          pilar: pilar.map(p => ({
            pilar: p.pilar,
            nama_pilar: p.nama_pilar,
            target_biaya: p.target_biaya,
            rincian_biaya: p.rincian_biaya,
            catatan: p.catatan || undefined
          }))
        };

        await RancanganPelayananService.updateRancangan(editingRancangan.id, updateInput);
        toast.success('Kebutuhan layanan berhasil diperbarui');
      } else {
        const createInput: CreateRancanganInput = {
          santri_id: selectedSantriId,
          tahun,
          periode: periode || undefined,
          catatan: catatan || undefined,
          pilar: pilar.map(p => ({
            pilar: p.pilar,
            nama_pilar: p.nama_pilar,
            target_biaya: p.target_biaya,
            rincian_biaya: p.rincian_biaya,
            catatan: p.catatan || undefined
          }))
        };

        await RancanganPelayananService.createRancangan(createInput);
        toast.success('Kebutuhan layanan berhasil dibuat');
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving rancangan:', error);
      toast.error(error.message || 'Gagal menyimpan kebutuhan layanan');
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

  const totalTarget = pilar.reduce((sum, p) => sum + (p.target_biaya || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingRancangan ? 'Edit Kebutuhan Layanan' : 'Tambah Kebutuhan Layanan'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Santri Selection */}
          <div className="space-y-2">
            <Label htmlFor="santri">Santri *</Label>
            <Select
              value={selectedSantriId}
              onValueChange={setSelectedSantriId}
              disabled={!!santriId || !!editingRancangan}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih santri" />
              </SelectTrigger>
              <SelectContent>
                {santriList.map(santri => (
                  <SelectItem key={santri.id} value={santri.id}>
                    {santri.nama_lengkap} {santri.id_santri ? `(${santri.id_santri})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tahun dan Periode */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tahun">Tahun *</Label>
              <Input
                id="tahun"
                type="number"
                value={tahun}
                onChange={(e) => setTahun(parseInt(e.target.value) || new Date().getFullYear())}
                min={2020}
                max={2100}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="periode">Periode</Label>
              <Input
                id="periode"
                value={periode}
                onChange={(e) => setPeriode(e.target.value)}
                placeholder="e.g., Semester 1 2024"
              />
            </div>
          </div>

          {/* Pilar Pelayanan */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Pilar Pelayanan *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddPilar}
                disabled={pilar.length >= 4}
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Pilar
              </Button>
            </div>

            <div className="space-y-4">
              {pilar.map((p, index) => {
                const config = PILAR_PELAYANAN_CONFIG[p.pilar];
                return (
                  <div
                    key={index}
                    className="p-4 border rounded-lg space-y-3 border-l-4"
                    style={{
                      borderLeftColor: getPilarColorHex(config.color)
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-sm text-gray-900">
                            {p.nama_pilar}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({config.description})
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Target Biaya (Rp)</Label>
                            <Input
                              type="number"
                              value={p.target_biaya || ''}
                              onChange={(e) => handleUpdatePilar(index, 'target_biaya', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              min={0}
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Catatan</Label>
                            <Input
                              value={p.catatan || ''}
                              onChange={(e) => handleUpdatePilar(index, 'catatan', e.target.value)}
                              placeholder="Catatan khusus..."
                            />
                          </div>
                        </div>
                        
                        {/* Rincian Biaya Section */}
                        <div className="mt-3 pt-3 border-t">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRincianExpanded(index)}
                            className="w-full justify-between text-xs"
                          >
                            <span>Rincian Biaya (Opsional)</span>
                            {expandedRincian.has(index) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                          
                          {expandedRincian.has(index) && (
                            <div className="mt-3 space-y-2">
                              {(p.rincian_biaya || []).map((item: any, itemIndex: number) => (
                                <div key={itemIndex} className="p-2 bg-gray-50 rounded border space-y-2">
                                  <div className="grid grid-cols-2 gap-2">
                                    <Input
                                      placeholder="Nama item"
                                      value={item.nama_item || ''}
                                      onChange={(e) => handleUpdateRincianItem(index, itemIndex, 'nama_item', e.target.value)}
                                      className="text-xs"
                                    />
                                    <div className="flex gap-2">
                                      <Input
                                        type="number"
                                        placeholder="Jumlah"
                                        value={item.jumlah || ''}
                                        onChange={(e) => handleUpdateRincianItem(index, itemIndex, 'jumlah', parseFloat(e.target.value) || 0)}
                                        className="text-xs w-20"
                                        min={0}
                                      />
                                      <Input
                                        placeholder="Satuan"
                                        value={item.satuan || ''}
                                        onChange={(e) => handleUpdateRincianItem(index, itemIndex, 'satuan', e.target.value)}
                                        className="text-xs w-24"
                                      />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <Input
                                      type="number"
                                      placeholder="Harga satuan"
                                      value={item.harga_satuan || ''}
                                      onChange={(e) => handleUpdateRincianItem(index, itemIndex, 'harga_satuan', parseFloat(e.target.value) || 0)}
                                      className="text-xs"
                                      min={0}
                                    />
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-600 flex-1">
                                        Total: {formatCurrency(item.total || 0)}
                                      </span>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveRincianItem(index, itemIndex)}
                                        className="h-6 w-6 p-0"
                                      >
                                        <Trash2 className="h-3 w-3 text-red-500" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddRincianItem(index)}
                                className="w-full text-xs"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Tambah Item Rincian
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      {pilar.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePilar(index)}
                          className="ml-2"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Target */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Total Target:</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(totalTarget)}
                </span>
              </div>
            </div>
          </div>

          {/* Catatan */}
          <div className="space-y-2">
            <Label htmlFor="catatan">Catatan</Label>
            <Textarea
              id="catatan"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Catatan tambahan..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : editingRancangan ? 'Perbarui' : 'Simpan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RancanganFormDialog;

