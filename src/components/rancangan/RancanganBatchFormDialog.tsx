import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Users, Calculator, Calendar, Info, Search, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  RancanganPelayananService,
  PILAR_PELAYANAN_CONFIG,
  type CreateRancanganInput,
  type PilarPelayanan,
} from '@/services/rancanganPelayanan.service';
import { supabase } from '@/integrations/supabase/client';
import { SemesterSyncService } from '@/services/semesterSync.service';
import { type Semester } from '@/services/akademikSemester.service';

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

interface RancanganBatchFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface SantriOption {
  id: string;
  nama_lengkap: string;
  id_santri?: string;
  kategori?: string;
}

const RancanganBatchFormDialog: React.FC<RancanganBatchFormDialogProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingSantri, setLoadingSantri] = useState(false);
  const [santriList, setSantriList] = useState<SantriOption[]>([]);
  const [selectedSantriIds, setSelectedSantriIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [searchSantri, setSearchSantri] = useState('');
  const [batchResult, setBatchResult] = useState<{
    success: number;
    failed: number;
    successIds: string[];
    failedItems: Array<{ santriId: string; santriName: string; error: string }>;
  } | null>(null);
  
  // Form data
  const [tahun, setTahun] = useState<number>(new Date().getFullYear());
  const [periodeType, setPeriodeType] = useState<'bulanan' | 'semester'>('semester'); // Default to semester
  const [periodeDetail, setPeriodeDetail] = useState<string>('');
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('');
  const [semesterOptions, setSemesterOptions] = useState<Array<{ value: string; label: string; semester: Semester }>>([]);
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);
  const [catatan, setCatatan] = useState<string>('');
  
  // Pilar dengan mode kolektif/manual
  const [pilar, setPilar] = useState<Array<{
    pilar: PilarPelayanan;
    nama_pilar: string;
    target_biaya_bulanan: number; // Biaya per bulan
    target_biaya_total: number; // Total setelah dikalikan periode
    mode: 'kolektif' | 'manual'; // Kolektif = dibagi ke semua, Manual = per santri
    catatan?: string;
    rincian_biaya?: any;
  }>>([]);
  
  const [jumlahSantriBinaanMukim, setJumlahSantriBinaanMukim] = useState<number>(0);

  // Load santri list
  useEffect(() => {
    if (open) {
      loadSantriList();
      loadJumlahSantriBinaanMukim();
      // Load semester options first, then reset form
      const initializeForm = async () => {
        await loadSemesterOptions();
        await resetForm();
      };
      initializeForm();
    }
  }, [open]);

  // Load semester options
  const loadSemesterOptions = async () => {
    try {
      const options = await SemesterSyncService.getSemesterOptions();
      setSemesterOptions(options);
      
      // Set default to active semester if available
      const activeSemester = await SemesterSyncService.getActiveSemester();
      if (activeSemester) {
        setSelectedSemesterId(activeSemester.id);
        setSelectedSemester(activeSemester);
        // Auto-set tahun from active semester
        const tahunFromSemester = new Date(activeSemester.tanggal_mulai).getFullYear();
        setTahun(tahunFromSemester);
        // Set periode type to semester if active semester exists
        setPeriodeType('semester');
      } else if (options.length > 0) {
        // Fallback to first semester if no active semester
        setSelectedSemesterId(options[0].value);
        setSelectedSemester(options[0].semester);
        const tahunFromSemester = new Date(options[0].semester.tanggal_mulai).getFullYear();
        setTahun(tahunFromSemester);
        setPeriodeType('semester');
      }
    } catch (error: any) {
      console.error('Error loading semester options:', error);
      toast.error('Gagal memuat data semester');
    }
  };

  // Update selected semester when semesterId changes
  useEffect(() => {
    if (selectedSemesterId) {
      const option = semesterOptions.find(opt => opt.value === selectedSemesterId);
      if (option) {
        setSelectedSemester(option.semester);
        // Auto-set tahun from semester
        const tahunFromSemester = new Date(option.semester.tanggal_mulai).getFullYear();
        setTahun(tahunFromSemester);
      }
    } else {
      setSelectedSemester(null);
    }
  }, [selectedSemesterId, semesterOptions]);

  // Initialize pilar
  useEffect(() => {
    if (open && pilar.length === 0) {
      setPilar(Object.keys(PILAR_PELAYANAN_CONFIG).map(key => ({
        pilar: key as PilarPelayanan,
        nama_pilar: PILAR_PELAYANAN_CONFIG[key as PilarPelayanan].label,
        target_biaya_bulanan: 0,
        target_biaya_total: 0,
        mode: key === 'operasional_konsumsi' ? 'kolektif' : 'manual',
        catatan: ''
      })));
    }
  }, [open]);

  // Auto-calculate total when periode type or bulanan changes
  useEffect(() => {
    let multiplier = 1;
    if (periodeType === 'semester') {
      if (selectedSemester) {
        // Calculate actual semester duration in months
        multiplier = SemesterSyncService.calculateSemesterDurationMonths(selectedSemester);
      } else {
        // Fallback to 6 if no semester selected
        multiplier = 6;
      }
    }
    setPilar(prev => prev.map(p => ({
      ...p,
      target_biaya_total: Math.round(p.target_biaya_bulanan * multiplier)
    })));
  }, [periodeType, selectedSemester, pilar.map(p => p.target_biaya_bulanan).join(',')]);

  const loadSantriList = async () => {
    try {
      setLoadingSantri(true);
      const { data, error } = await supabase
        .from('santri')
        .select('id, nama_lengkap, id_santri, kategori')
        .eq('status_santri', 'Aktif')
        .order('nama_lengkap', { ascending: true });

      if (error) throw error;
      setSantriList(data || []);
    } catch (error: any) {
      console.error('Error loading santri:', error);
      toast.error('Gagal memuat data santri');
    } finally {
      setLoadingSantri(false);
    }
  };

  const loadJumlahSantriBinaanMukim = async () => {
    try {
      const { count, error } = await supabase
        .from('santri')
        .select('*', { count: 'exact', head: true })
        .or('kategori.ilike.%binaan%mukim%,kategori.ilike.%mukim%binaan%')
        .eq('status_santri', 'Aktif');
      
      if (error) throw error;
      setJumlahSantriBinaanMukim(count || 0);
    } catch (error) {
      console.error('Error loading jumlah santri:', error);
      setJumlahSantriBinaanMukim(0);
    }
  };

  const resetForm = async () => {
    setSelectedSantriIds(new Set());
    setSelectAll(false);
    setSearchSantri('');
    setPeriodeDetail('');
    setCatatan('');
    setBatchResult(null);
    setPilar(Object.keys(PILAR_PELAYANAN_CONFIG).map(key => ({
      pilar: key as PilarPelayanan,
      nama_pilar: PILAR_PELAYANAN_CONFIG[key as PilarPelayanan].label,
      target_biaya_bulanan: 0,
      target_biaya_total: 0,
      mode: key === 'operasional_konsumsi' ? 'kolektif' : 'manual',
      catatan: ''
    })));
    
    // Reset to active semester (prioritas utama)
    const activeSemester = await SemesterSyncService.getActiveSemester();
    if (activeSemester) {
      setSelectedSemesterId(activeSemester.id);
      setSelectedSemester(activeSemester);
      const tahunFromSemester = new Date(activeSemester.tanggal_mulai).getFullYear();
      setTahun(tahunFromSemester);
      setPeriodeType('semester');
    } else {
      // Fallback jika tidak ada semester aktif
      setTahun(new Date().getFullYear());
      setPeriodeType('bulanan');
      setSelectedSemesterId('');
      setSelectedSemester(null);
    }
  };

  const handleCloseWithResult = () => {
    if (batchResult && batchResult.success > 0) {
      onSuccess();
    }
    onOpenChange(false);
    resetForm();
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const filtered = getFilteredSantri();
      setSelectedSantriIds(new Set(filtered.map(s => s.id)));
      setSelectAll(true);
    } else {
      setSelectedSantriIds(new Set());
      setSelectAll(false);
    }
  };

  const handleToggleSantri = (santriId: string) => {
    const newSelected = new Set(selectedSantriIds);
    if (newSelected.has(santriId)) {
      newSelected.delete(santriId);
    } else {
      newSelected.add(santriId);
    }
    setSelectedSantriIds(newSelected);
    setSelectAll(newSelected.size === getFilteredSantri().length);
  };

  const getFilteredSantri = () => {
    if (!searchSantri) return santriList;
    const query = searchSantri.toLowerCase();
    return santriList.filter(s =>
      s.nama_lengkap.toLowerCase().includes(query) ||
      s.id_santri?.toLowerCase().includes(query) ||
      s.kategori?.toLowerCase().includes(query)
    );
  };

  const handleUpdatePilar = (index: number, field: string, value: any) => {
    const updated = [...pilar];
    let multiplier = 1;
    if (periodeType === 'semester') {
      if (selectedSemester) {
        multiplier = SemesterSyncService.calculateSemesterDurationMonths(selectedSemester);
      } else {
        multiplier = 6; // Fallback
      }
    }
    
    if (field === 'target_biaya_bulanan') {
      updated[index] = {
        ...updated[index],
        target_biaya_bulanan: value,
        target_biaya_total: Math.round(value * multiplier)
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    
    setPilar(updated);
  };

  const generatePeriodeDisplay = () => {
    if (periodeType === 'semester' && selectedSemester) {
      // Use semester display format
      return SemesterSyncService.formatSemesterDisplay(selectedSemester);
    }
    if (!periodeDetail) return '';
    const currentYear = tahun;
    return `${periodeDetail} ${currentYear}`;
  };

  const calculatePerSantri = (totalAmount: number, mode: 'kolektif' | 'manual'): number => {
    if (mode === 'manual') return totalAmount; // Manual = langsung per santri
    if (jumlahSantriBinaanMukim === 0) return 0;
    return Math.round(totalAmount / jumlahSantriBinaanMukim);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedSantriIds.size === 0) {
      toast.error('Pilih minimal satu santri');
      return;
    }

    // Validate periode based on type
    if (periodeType === 'semester') {
      if (!selectedSemesterId) {
        toast.error('Pilih semester terlebih dahulu');
        return;
      }
    } else {
      if (!periodeDetail.trim()) {
        toast.error('Detail periode harus diisi');
        return;
      }
    }

    if (pilar.length === 0) {
      toast.error('Minimal harus ada satu pilar pelayanan');
      return;
    }

    const totalTarget = pilar.reduce((sum, p) => sum + (p.target_biaya_total || 0), 0);
    if (totalTarget === 0) {
      toast.error('Total target biaya tidak boleh nol');
      return;
    }

    try {
      setLoading(true);
      const periodeFinal = generatePeriodeDisplay();
      const santriIdsArray = Array.from(selectedSantriIds);

      // Create rancangan for each selected santri with error handling
      const results = await Promise.allSettled(
        santriIdsArray.map(async (santriId) => {
          const santri = santriList.find(s => s.id === santriId);
          const santriName = santri?.nama_lengkap || 'Santri';

          try {
            // Calculate target per pilar untuk santri ini
            const pilarData = pilar.map(p => {
              let targetPerSantri = p.target_biaya_total;
              
              if (p.mode === 'kolektif') {
                // Untuk kolektif, bagi ke jumlah santri binaan mukim
                targetPerSantri = calculatePerSantri(p.target_biaya_total, 'kolektif');
              }
              // Untuk manual, sudah langsung per santri

              return {
                pilar: p.pilar,
                nama_pilar: p.nama_pilar,
                target_biaya: targetPerSantri,
                rincian_biaya: p.rincian_biaya,
                catatan: p.catatan || undefined
              };
            });

            const createInput: CreateRancanganInput & { semester_id?: string } = {
              santri_id: santriId,
              tahun,
              periode: periodeFinal,
              ...(periodeType === 'semester' && selectedSemesterId ? { semester_id: selectedSemesterId } : {}),
              status: 'draft',
              catatan: catatan || `Kebutuhan layanan batch untuk ${periodeFinal}`,
              pilar: pilarData
            };

            const result = await RancanganPelayananService.createRancangan(createInput);
            return { santriId, santriName, success: true, rancanganId: result.id };
          } catch (error: any) {
            return { 
              santriId, 
              santriName, 
              success: false, 
              error: error.message || 'Gagal membuat kebutuhan layanan' 
            };
          }
        })
      );

      // Process results
      const successItems = results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value.success)
        .map(r => r.value);
      
      const failedItems = results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && !r.value.success)
        .map(r => ({ santriId: r.value.santriId, santriName: r.value.santriName, error: r.value.error }));

      const successCount = successItems.length;
      const failedCount = failedItems.length;

      setBatchResult({
        success: successCount,
        failed: failedCount,
        successIds: successItems.map(s => s.rancanganId),
        failedItems
      });

      if (successCount > 0) {
        toast.success(`Berhasil membuat ${successCount} kebutuhan layanan untuk ${periodeFinal}${failedCount > 0 ? ` (${failedCount} gagal)` : ''}`);
      } else {
        toast.error('Gagal membuat semua kebutuhan layanan batch');
      }
    } catch (error: any) {
      console.error('Error creating batch kebutuhan:', error);
      toast.error(error.message || 'Gagal membuat kebutuhan layanan batch');
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

  const filteredSantri = getFilteredSantri();
  const totalTarget = pilar.reduce((sum, p) => sum + (p.target_biaya_total || 0), 0);
  
  // Calculate multiplier based on semester if available
  const getMultiplier = () => {
    if (periodeType === 'semester' && selectedSemester) {
      return SemesterSyncService.calculateSemesterDurationMonths(selectedSemester);
    }
    return 1;
  };
  const multiplier = getMultiplier();

  return (
    <Dialog open={open} onOpenChange={batchResult ? handleCloseWithResult : onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Buat Kebutuhan Layanan Batch
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            Buat rencana anggaran kebutuhan layanan untuk beberapa santri sekaligus
          </p>
        </DialogHeader>

        {/* Batch Result Summary */}
        {batchResult && (
          <Card className="mb-6 border-2 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg text-gray-900">Hasil Pembuatan Batch</h3>
                  <Badge variant="outline" className="bg-white">
                    {generatePeriodeDisplay()}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-900">Berhasil</span>
                    </div>
                    <div className="text-2xl font-bold text-green-700">{batchResult.success}</div>
                    <div className="text-xs text-green-600 mt-1">kebutuhan dibuat</div>
                  </div>
                  
                  {batchResult.failed > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="font-semibold text-red-900">Gagal</span>
                      </div>
                      <div className="text-2xl font-bold text-red-700">{batchResult.failed}</div>
                      <div className="text-xs text-red-600 mt-1">rancangan gagal</div>
                    </div>
                  )}
                </div>

                {batchResult.failedItems.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Detail Gagal:</p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {batchResult.failedItems.map((item, idx) => (
                        <div key={idx} className="text-xs text-red-700 bg-red-50 p-2 rounded">
                          • {item.santriName}: {item.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button onClick={handleCloseWithResult} className="bg-blue-600 hover:bg-blue-700">
                    Tutup
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!batchResult && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Periode Section */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Periode Kebutuhan</h3>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
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
                  <Label htmlFor="periodeType">Tipe Periode *</Label>
                  <Select 
                    value={periodeType} 
                    onValueChange={(v) => {
                      setPeriodeType(v as 'bulanan' | 'semester');
                      // Jika pilih semester dan belum ada yang dipilih, set ke active semester
                      if (v === 'semester' && !selectedSemesterId) {
                        SemesterSyncService.getActiveSemester().then(activeSemester => {
                          if (activeSemester) {
                            setSelectedSemesterId(activeSemester.id);
                            setSelectedSemester(activeSemester);
                            const tahunFromSemester = new Date(activeSemester.tanggal_mulai).getFullYear();
                            setTahun(tahunFromSemester);
                          }
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="semester">Semester</SelectItem>
                      <SelectItem value="bulanan">Bulanan</SelectItem>
                    </SelectContent>
                  </Select>
                  {periodeType === 'semester' && !selectedSemesterId && (
                    <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      Pilih semester terlebih dahulu
                    </p>
                  )}
                </div>
                
                {periodeType === 'semester' ? (
                  <div className="space-y-2">
                    <Label htmlFor="semester">Pilih Semester *</Label>
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
                    {selectedSemester && (
                      <p className="text-xs text-gray-500">
                        {new Date(selectedSemester.tanggal_mulai).toLocaleDateString('id-ID')} - {new Date(selectedSemester.tanggal_selesai).toLocaleDateString('id-ID')}
                        {' '}({SemesterSyncService.calculateSemesterDurationMonths(selectedSemester).toFixed(1)} bulan)
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="periodeDetail">
                      Detail Periode * (contoh: Januari)
                    </Label>
                    <Input
                      id="periodeDetail"
                      value={periodeDetail}
                      onChange={(e) => setPeriodeDetail(e.target.value)}
                      placeholder="Contoh: Januari"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Preview Periode */}
              {(periodeType === 'semester' ? selectedSemester : periodeDetail) && (
                <div className="p-3 bg-white rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Periode Rancangan:</div>
                      <div className="font-semibold text-blue-900">
                        {generatePeriodeDisplay()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-600 mb-1">Multiplier:</div>
                      <Badge className="bg-blue-600 text-white">
                        {periodeType === 'semester' && selectedSemester
                          ? `${SemesterSyncService.calculateSemesterDurationMonths(selectedSemester).toFixed(1)}x (${SemesterSyncService.calculateSemesterDurationMonths(selectedSemester).toFixed(1)} bulan)`
                          : '1x (1 bulan)'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pilih Santri Section */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Pilih Santri</h3>
                </div>
                <div className="text-sm text-gray-600">
                  {selectedSantriIds.size > 0 && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {selectedSantriIds.size} santri dipilih
                    </Badge>
                  )}
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari santri..."
                  value={searchSantri}
                  onChange={(e) => setSearchSantri(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Select All */}
              <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                <Checkbox
                  id="select-all"
                  checked={selectAll}
                  onCheckedChange={handleSelectAll}
                />
                <Label
                  htmlFor="select-all"
                  className="text-sm font-medium cursor-pointer flex-1"
                >
                  Pilih Semua ({filteredSantri.length} santri)
                </Label>
              </div>

              {/* Santri List */}
              {loadingSantri ? (
                <div className="text-center py-8 text-gray-500">Memuat data santri...</div>
              ) : (
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3">
                    {filteredSantri.map((santri) => (
                      <div
                        key={santri.id}
                        className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded transition-colors"
                      >
                        <Checkbox
                          id={santri.id}
                          checked={selectedSantriIds.has(santri.id)}
                          onCheckedChange={() => handleToggleSantri(santri.id)}
                        />
                        <Label
                          htmlFor={santri.id}
                          className="flex-1 cursor-pointer text-sm"
                        >
                          <div className="font-medium">{santri.nama_lengkap}</div>
                          <div className="flex gap-1 mt-0.5">
                            {santri.id_santri && (
                              <Badge variant="outline" className="text-xs">
                                {santri.id_santri}
                              </Badge>
                            )}
                            {santri.kategori && (
                              <Badge variant="secondary" className="text-xs">
                                {santri.kategori}
                              </Badge>
                            )}
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filteredSantri.length === 0 && !loadingSantri && (
                <div className="text-center py-8 text-gray-500">
                  Tidak ada santri ditemukan
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Santri Binaan Mukim */}
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-sm">
                <Info className="h-4 w-4 text-amber-600" />
                <span className="text-amber-900">
                  Jumlah Santri Binaan Mukim Aktif: <strong>{jumlahSantriBinaanMukim}</strong>
                  {jumlahSantriBinaanMukim > 0 && (
                    <span className="text-xs ml-2">
                      (Biaya kolektif akan dibagi otomatis)
                    </span>
                  )}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Pilar Pelayanan */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Pilar Pelayanan</h3>
              <Badge variant="outline" className="text-xs">
                {periodeType === 'semester' ? 'Total Semester' : 'Total Bulanan'}
              </Badge>
            </div>

            <div className="space-y-4">
              {pilar.map((p, index) => {
                const config = PILAR_PELAYANAN_CONFIG[p.pilar];
                const isKolektif = p.mode === 'kolektif';
                const perSantri = isKolektif 
                  ? calculatePerSantri(p.target_biaya_total, 'kolektif')
                  : p.target_biaya_total;
                
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
                        <div className="flex items-center gap-2 mb-3">
                          <span className="font-medium text-sm text-gray-900">
                            {p.nama_pilar}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({config.description})
                          </span>
                          <Select
                            value={p.mode}
                            onValueChange={(v) => handleUpdatePilar(index, 'mode', v)}
                          >
                            <SelectTrigger className="w-32 h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="kolektif">Kolektif</SelectItem>
                              <SelectItem value="manual">Manual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Input Mode */}
                        {isKolektif ? (
                          // Mode Kolektif
                          <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">
                                  Biaya Bulanan Kolektif (Rp) *
                                </Label>
                                <Input
                                  type="number"
                                  value={p.target_biaya_bulanan || ''}
                                  onChange={(e) => handleUpdatePilar(
                                    index, 
                                    'target_biaya_bulanan', 
                                    parseFloat(e.target.value) || 0
                                  )}
                                  placeholder="0"
                                  min={0}
                                  required
                                />
                                <p className="text-xs text-gray-500">
                                  Total untuk semua santri binaan mukim per bulan
                                </p>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">
                                  Total {periodeType === 'semester' ? 'Semester' : 'Bulanan'} (Otomatis)
                                </Label>
                                <Input
                                  type="text"
                                  value={formatCurrency(p.target_biaya_total)}
                                  disabled
                                  className="bg-gray-50 font-mono"
                                />
                                <p className="text-xs text-gray-500">
                                  {p.target_biaya_bulanan > 0 && (
                                    <>
                                      {formatCurrency(p.target_biaya_bulanan)} × {multiplier.toFixed(1)}
                                    </>
                                  )}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">
                                  Per Santri (Otomatis)
                                </Label>
                                <Input
                                  type="text"
                                  value={perSantri > 0 ? formatCurrency(perSantri) : '-'}
                                  disabled
                                  className="bg-gray-50 font-mono"
                                />
                                <p className="text-xs text-gray-500">
                                  {jumlahSantriBinaanMukim > 0 
                                    ? `Dibagi ke ${jumlahSantriBinaanMukim} santri`
                                    : 'Tidak ada santri binaan mukim'}
                                </p>
                              </div>
                            </div>
                            {p.target_biaya_total > 0 && jumlahSantriBinaanMukim > 0 && (
                              <div className="p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
                                <Info className="h-3 w-3 inline mr-1" />
                                Total: {formatCurrency(p.target_biaya_total)} ÷ {jumlahSantriBinaanMukim} santri = {formatCurrency(perSantri)}/santri
                              </div>
                            )}
                          </div>
                        ) : (
                          // Mode Manual
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">
                                  Biaya Bulanan per Santri (Rp) *
                                </Label>
                                <Input
                                  type="number"
                                  value={p.target_biaya_bulanan || ''}
                                  onChange={(e) => handleUpdatePilar(
                                    index, 
                                    'target_biaya_bulanan', 
                                    parseFloat(e.target.value) || 0
                                  )}
                                  placeholder="0"
                                  min={0}
                                  required
                                />
                                <p className="text-xs text-gray-500">
                                  Biaya per santri per bulan
                                </p>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">
                                  Total {periodeType === 'semester' ? 'Semester' : 'Bulanan'} (Otomatis)
                                </Label>
                                <Input
                                  type="text"
                                  value={formatCurrency(p.target_biaya_total)}
                                  disabled
                                  className="bg-gray-50 font-mono"
                                />
                                <p className="text-xs text-gray-500">
                                  {p.target_biaya_bulanan > 0 && (
                                    <>
                                      {formatCurrency(p.target_biaya_bulanan)} × {multiplier.toFixed(1)}
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="mt-3 space-y-1">
                          <Label className="text-xs">Catatan</Label>
                          <Input
                            value={p.catatan || ''}
                            onChange={(e) => handleUpdatePilar(index, 'catatan', e.target.value)}
                            placeholder="Catatan khusus..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Total */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Summary Akumulatif</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Periode</div>
                      <div className="font-semibold text-gray-900">
                        {generatePeriodeDisplay() || 'Belum diatur'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 mb-1">
                        Total Kebutuhan {periodeType === 'semester' ? 'Semester' : 'Bulanan'}
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(totalTarget)}
                      </div>
                    </div>
                  </div>

                  {/* Breakdown per Pilar */}
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="text-xs font-medium text-gray-700 mb-2">Breakdown per Pilar:</div>
                    <div className="space-y-1">
                      {pilar.map((p, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="text-gray-600">
                            {p.nama_pilar} ({p.mode === 'kolektif' ? 'Kolektif' : 'Manual'}):
                          </span>
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(p.target_biaya_total)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Info untuk Multiple Santri */}
                  {selectedSantriIds.size > 0 && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <div className="text-xs text-gray-600 mb-1">
                        Akan dibuat untuk {selectedSantriIds.size} santri
                      </div>
                      <div className="text-xs text-gray-700">
                        {pilar.map((p, idx) => {
                          const perSantri = p.mode === 'kolektif' 
                            ? calculatePerSantri(p.target_biaya_total, 'kolektif')
                            : p.target_biaya_total;
                          return (
                            <div key={idx} className="flex justify-between">
                              <span>{p.nama_pilar}:</span>
                              <span className="font-mono">
                                {formatCurrency(perSantri)}/santri
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Catatan */}
          <div className="space-y-2">
            <Label htmlFor="catatan">Catatan Umum</Label>
            <Textarea
              id="catatan"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Catatan tambahan untuk semua rancangan..."
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
            <Button 
              type="submit" 
              disabled={loading || selectedSantriIds.size === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                'Membuat Rancangan...'
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Buat {selectedSantriIds.size} Rancangan
                </>
              )}
            </Button>
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RancanganBatchFormDialog;

