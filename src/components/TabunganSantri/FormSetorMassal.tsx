import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Loader2, 
  Users, 
  DollarSign, 
  CheckCircle,
  Search,
  User,
  Calendar,
  Wallet,
  Info
} from 'lucide-react';
import { TabunganSantriService } from '@/services/tabunganSantri.service';
import { AkunKasService, AkunKas } from '@/services/akunKas.service';
import { SaldoTabunganSantri } from '@/types/tabungan.types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FormSetorMassalProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const FormSetorMassal: React.FC<FormSetorMassalProps> = ({
  onSuccess,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingSantri, setLoadingSantri] = useState(true);
  const [loadingAkunKas, setLoadingAkunKas] = useState(false);
  const [akunKasOptions, setAkunKasOptions] = useState<AkunKas[]>([]);
  const [santriList, setSantriList] = useState<SaldoTabunganSantri[]>([]);
  const [selectedSantri, setSelectedSantri] = useState<Record<string, string>>({}); // { santriId: nominal }
  const [searchTerm, setSearchTerm] = useState('');
  const [mode, setMode] = useState<'massal' | 'manual'>('manual'); // Mode: massal (sama semua) atau manual (pilih sendiri)
  const [nominalMassal, setNominalMassal] = useState(''); // Nominal untuk mode massal
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    akunKasId: null as string | null,
    sumberDana: '',
    deskripsi: '',
    catatan: ''
  });
  const { toast } = useToast();

  const loadSantriList = async () => {
    try {
      setLoadingSantri(true);
      const data = await TabunganSantriService.getSantriWithSaldo();
      setSantriList(data);
    } catch (error: any) {
      console.error('Error loading santri:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat daftar santri',
        variant: 'destructive'
      });
    } finally {
      setLoadingSantri(false);
    }
  };

  useEffect(() => {
    loadSantriList();
  }, []);

  useEffect(() => {
    loadAkunKas();
  }, []);

  const loadAkunKas = async () => {
    try {
      setLoadingAkunKas(true);
      const accounts = await AkunKasService.getAll();
      // Filter hanya akun kas operasional (bukan tabungan)
      const operasionalAccounts = accounts.filter(acc => 
        acc.status === 'aktif' && 
        acc.managed_by !== 'tabungan'
      );
      setAkunKasOptions(operasionalAccounts);
      
      // Set default
      const defaultAccount = operasionalAccounts.find(acc => acc.is_default);
      if (defaultAccount) {
        setFormData(prev => ({ ...prev, akunKasId: defaultAccount.id }));
      } else if (operasionalAccounts.length > 0) {
        setFormData(prev => ({ ...prev, akunKasId: operasionalAccounts[0].id }));
      }
    } catch (error) {
      console.error('Error loading akun kas:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat akun kas',
        variant: 'destructive'
      });
    } finally {
      setLoadingAkunKas(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Untuk mode massal, pastikan nominal massal sudah diisi
    if (mode === 'massal') {
      const nominal = parseFloat(nominalMassal.replace(/[^\d]/g, ''));
      if (!nominal || nominal <= 0) {
        toast({
          title: 'Error',
          description: 'Isi nominal untuk setoran massal',
          variant: 'destructive'
        });
        return;
      }
      if (Object.keys(selectedSantri).length === 0) {
        toast({
          title: 'Error',
          description: 'Pilih minimal satu santri',
          variant: 'destructive'
        });
        return;
      }
    }
    
    const selectedIds = Object.keys(selectedSantri).filter(id => {
      if (mode === 'massal') {
        // Mode massal: gunakan nominal massal
        return parseFloat(nominalMassal.replace(/[^\d]/g, '')) > 0;
      } else {
        // Mode manual: gunakan nominal per santri
        const nominal = parseFloat(selectedSantri[id].replace(/[^\d]/g, ''));
        return nominal > 0;
      }
    });

    if (selectedIds.length === 0) {
      toast({
        title: 'Error',
        description: mode === 'massal' 
          ? 'Pilih minimal satu santri dan isi nominal massal'
          : 'Pilih minimal satu santri dan isi nominal',
        variant: 'destructive'
      });
      return;
    }

    // Validasi semua nominal
    for (const santriId of selectedIds) {
      let nominal: number;
      if (mode === 'massal') {
        nominal = parseFloat(nominalMassal.replace(/[^\d]/g, ''));
      } else {
        nominal = parseFloat(selectedSantri[santriId].replace(/[^\d]/g, ''));
      }
      
      if (!nominal || nominal <= 0) {
        toast({
          title: 'Error',
          description: 'Semua santri yang dipilih harus memiliki nominal lebih dari 0',
          variant: 'destructive'
        });
        return;
      }
    }


    try {
      setLoading(true);
      
      // Tentukan tipe setoran berdasarkan ada/tidaknya akun kas
      const tipeSetoran = formData.akunKasId ? 'tunai' : 'non-kas';

      // 1. Create transaksi tabungan untuk setiap santri
      const tabunganIds: string[] = [];
      let totalNominal = 0;
      
      for (const santriId of selectedIds) {
        let nominal: number;
        if (mode === 'massal') {
          nominal = parseFloat(nominalMassal.replace(/[^\d]/g, ''));
        } else {
          nominal = parseFloat(selectedSantri[santriId].replace(/[^\d]/g, ''));
        }
        totalNominal += nominal;
        
        const tabunganId = await TabunganSantriService.setorTabungan({
          santri_id: santriId,
          nominal: nominal,
          deskripsi: formData.deskripsi || 
            (formData.akunKasId 
              ? `Setoran massal tunai dari ${formData.sumberDana || 'Santri'}`
              : `Reward/Apresiasi massal dari ${formData.sumberDana || 'Yayasan'}`),
          catatan: formData.catatan || undefined,
          tipe_setoran: tipeSetoran,
          sumber_dana: formData.sumberDana || undefined,
          akun_kas_id: formData.akunKasId || undefined,
          tanggal: formData.tanggal
        });
        tabunganIds.push(tabunganId);
      }

      // 2. Jika akun kas diisi, create entry di keuangan (pemasukan)
      if (formData.akunKasId) {
        await supabase
          .from('keuangan')
          .insert({
            tanggal: formData.tanggal,
            jenis_transaksi: 'Pemasukan',
            kategori: 'Tabungan Santri',
            sub_kategori: 'Setoran Massal Tunai',
            jumlah: totalNominal,
            deskripsi: `Setoran massal tabungan untuk ${selectedIds.length} santri${formData.sumberDana ? ` dari ${formData.sumberDana}` : ''}`,
            penerima_pembayar: formData.sumberDana || `Massal (${selectedIds.length} santri)`,
            akun_kas_id: formData.akunKasId,
            source_module: 'tabungan',
            source_id: tabunganIds[0], // Reference first tabungan ID
            status: 'posted',
            auto_posted: false
          });

        // Update saldo akun kas
        try {
          await supabase.rpc('ensure_akun_kas_saldo_correct_for', {
            p_akun_id: formData.akunKasId
          });
        } catch (saldoError) {
          // Silent fail - saldo will be recalculated
          console.warn('Warning ensuring saldo correct:', saldoError);
        }
      }
      // Jika non-kas, tidak perlu create entry di keuangan
      
      toast({
        title: 'Berhasil',
        description: formData.akunKasId
          ? `Setoran massal tunai berhasil untuk ${selectedIds.length} santri dan tercatat di keuangan`
          : `Setoran massal non-kas berhasil untuk ${selectedIds.length} santri (tidak mempengaruhi kas)`
      });
      onSuccess();
    } catch (error: any) {
      console.error('Error setor massal:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal melakukan setoran massal',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredSantri = santriList.filter(santri =>
    santri.santri.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
    santri.santri.id_santri?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    santri.santri.nisn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    santri.santri.kelas?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = () => {
    const allSelected = Object.keys(selectedSantri).length === filteredSantri.length;
    if (allSelected) {
      setSelectedSantri({});
    } else {
      const newSelection: Record<string, string> = {};
      filteredSantri.forEach(santri => {
        // Jika mode massal, gunakan nominal massal
        newSelection[santri.santri_id] = mode === 'massal' ? nominalMassal : '';
      });
      setSelectedSantri(newSelection);
    }
  };

  // Handler untuk mode massal - apply nominal ke semua santri terpilih
  const handleApplyMassal = () => {
    const nominal = parseFloat(nominalMassal.replace(/[^\d]/g, ''));
    if (!nominal || nominal <= 0) {
      toast({
        title: 'Error',
        description: 'Nominal harus lebih dari 0',
        variant: 'destructive'
      });
      return;
    }

    const newSelection: Record<string, string> = {};
    filteredSantri.forEach(santri => {
      newSelection[santri.santri_id] = nominalMassal;
    });
    setSelectedSantri(newSelection);
    toast({
      title: 'Berhasil',
      description: `Nominal ${formatCurrency(nominal)} diterapkan ke ${filteredSantri.length} santri`
    });
  };

  const handleSelectSantri = (santriId: string) => {
    setSelectedSantri(prev => {
      if (prev[santriId]) {
        const newSelection = { ...prev };
        delete newSelection[santriId];
        return newSelection;
      } else {
        // Jika mode massal dan nominal massal sudah diisi, gunakan nominal massal
        const initialNominal = mode === 'massal' && nominalMassal ? nominalMassal : '';
        return { ...prev, [santriId]: initialNominal };
      }
    });
  };

  const handleNominalChange = (santriId: string, value: string) => {
    const cleanValue = value.replace(/[^\d]/g, '');
    setSelectedSantri(prev => ({
      ...prev,
      [santriId]: cleanValue
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Calculate total nominal from selected santri
  const selectedIds = Object.keys(selectedSantri).filter(id => {
    if (mode === 'massal') {
      // Mode massal: semua santri terpilih valid jika nominal massal > 0
      return parseFloat(nominalMassal.replace(/[^\d]/g, '')) > 0;
    } else {
      // Mode manual: cek nominal per santri
      const nominal = parseFloat(selectedSantri[id].replace(/[^\d]/g, ''));
      return nominal > 0;
    }
  });
  
  const totalNominal = selectedIds.reduce((sum, id) => {
    let nominal: number;
    if (mode === 'massal') {
      nominal = parseFloat(nominalMassal.replace(/[^\d]/g, '')) || 0;
    } else {
      nominal = parseFloat(selectedSantri[id].replace(/[^\d]/g, '')) || 0;
    }
    return sum + nominal;
  }, 0);

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl">Setor Tabungan Massal</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Form Fields - Compact */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tanggal">Tanggal *</Label>
              <div className="relative">
                <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="tanggal"
                  type="date"
                  value={formData.tanggal}
                  onChange={(e) => setFormData(prev => ({ ...prev, tanggal: e.target.value }))}
                  className="pl-8"
                  required
                />
              </div>
            </div>


            {/* Akun Kas - Opsional */}
            <div className="space-y-2">
              <Label htmlFor="akun_kas_id">
                Akun Kas 
                <span className="text-xs text-muted-foreground ml-1">(Opsional)</span>
              </Label>
              <Select 
                value={formData.akunKasId || 'none'} 
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  akunKasId: value === 'none' ? null : value 
                }))}
                disabled={loadingAkunKas}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingAkunKas ? "Memuat..." : "Pilih akun kas (opsional)"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Tidak ada (Non-Kas)
                    </div>
                  </SelectItem>
                  {akunKasOptions.map(akun => (
                    <SelectItem key={akun.id} value={akun.id}>
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        {akun.nama}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.akunKasId 
                  ? 'Akan dicatat sebagai pemasukan di modul keuangan'
                  : 'Tidak akan dicatat di modul keuangan (reward/apresiasi non-kas)'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sumber_dana">Sumber Dana</Label>
              <Input
                id="sumber_dana"
                value={formData.sumberDana}
                onChange={(e) => setFormData(prev => ({ ...prev, sumberDana: e.target.value }))}
                placeholder={
                  formData.akunKasId 
                    ? "Contoh: Orang Tua, Transfer Bank, dll"
                    : "Contoh: Donatur A, Yayasan, Reward Prestasi, dll"
                }
              />
              <p className="text-xs text-muted-foreground">
                {formData.akunKasId 
                  ? 'Sumber uang yang masuk'
                  : 'Sumber reward/apresiasi (donatur, yayasan, dll)'}
              </p>
            </div>

            {/* Info Box */}
            {!formData.akunKasId && (
              <div className="md:col-span-3">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Setoran Massal Non-Kas</AlertTitle>
                  <AlertDescription>
                    Setoran ini tidak akan mengurangi/menambah kas. Ini adalah pengakuan kewajiban 
                    (liability) yayasan kepada santri. Contoh: Reward prestasi massal, apresiasi dari donatur, dll.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="deskripsi">Deskripsi</Label>
            <Textarea
              id="deskripsi"
              placeholder={
                formData.akunKasId
                  ? "Contoh: Setoran massal dari orang tua, transfer bank, dll"
                  : "Contoh: Reward prestasi massal, apresiasi dari donatur, dll"
              }
              value={formData.deskripsi}
              onChange={(e) => setFormData(prev => ({ ...prev, deskripsi: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="catatan">Catatan Tambahan</Label>
            <Textarea
              id="catatan"
              placeholder="Catatan internal (opsional)"
              value={formData.catatan}
              onChange={(e) => setFormData(prev => ({ ...prev, catatan: e.target.value }))}
              rows={2}
            />
          </div>

          {/* Santri Selection - Prominent Section */}
          <div className="border-t bg-muted/30">
            <div className="px-6 py-4">
              {/* Mode Selection */}
              <div className="mb-4 p-4 bg-background border rounded-lg">
                <Label className="text-base font-semibold mb-3 block">Mode Setoran</Label>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="mode-manual"
                      name="mode"
                      value="manual"
                      checked={mode === 'manual'}
                      onChange={(e) => {
                        setMode('manual');
                        setSelectedSantri({});
                        setNominalMassal('');
                      }}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="mode-manual" className="font-normal cursor-pointer">
                      Pilih Santri Manual (Nominal per Santri)
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="mode-massal"
                      name="mode"
                      value="massal"
                      checked={mode === 'massal'}
                      onChange={(e) => {
                        setMode('massal');
                        setSelectedSantri({});
                      }}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="mode-massal" className="font-normal cursor-pointer">
                      Setor Massal (Nominal Sama untuk Semua)
                    </Label>
                  </div>
                </div>
              </div>

              {/* Massal Mode - Input Nominal */}
              {mode === 'massal' && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-end gap-3">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="nominal-massal" className="text-sm font-medium">
                        Nominal untuk Semua Santri *
                      </Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="nominal-massal"
                          type="text"
                          placeholder="Masukkan nominal..."
                          value={nominalMassal.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^\d]/g, '');
                            setNominalMassal(value);
                          }}
                          className="pl-9 h-10 text-base"
                        />
                      </div>
                      {nominalMassal && (
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(parseFloat(nominalMassal.replace(/[^\d]/g, '')) || 0)} per santri
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      onClick={handleApplyMassal}
                      disabled={!nominalMassal || parseFloat(nominalMassal.replace(/[^\d]/g, '')) <= 0}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Terapkan ke Semua
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-semibold text-base">
                      {mode === 'massal' ? 'Pilih Santri' : 'Pilih Santri dan Atur Nominal'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {Object.keys(selectedSantri).length} santri terpilih • Total: {formatCurrency(totalNominal)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {Object.keys(selectedSantri).length === filteredSantri.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                  </Button>
                </div>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari santri berdasarkan nama, ID, NISN, atau kelas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
            </div>

            {/* Santri List - Large Scrollable Area */}
            <div className="px-6 pb-4">
              <div className="border rounded-lg bg-background max-h-[50vh] overflow-y-auto">
              {loadingSantri ? (
                <div className="flex items-center justify-center h-64">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    <p className="text-sm text-muted-foreground">Memuat daftar santri...</p>
                  </div>
                </div>
              ) : filteredSantri.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {searchTerm ? 'Tidak ada santri yang cocok dengan pencarian' : 'Tidak ada santri tersedia'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {filteredSantri.map((santri) => {
                    const isSelected = !!selectedSantri[santri.santri_id];
                    const nominalValue = selectedSantri[santri.santri_id] || '';
                    const nominal = parseFloat(nominalValue.replace(/[^\d]/g, '')) || 0;
                    
                    return (
                      <Card 
                        key={santri.santri_id} 
                        className={`p-4 transition-all hover:shadow-md ${
                          isSelected 
                            ? 'border-green-400 bg-green-50/70 shadow-sm' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleSelectSantri(santri.santri_id)}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                {santri.santri.id_santri && (
                                  <Badge variant="secondary" className="text-xs font-mono flex-shrink-0">
                                    {santri.santri.id_santri}
                                  </Badge>
                                )}
                                <span className="font-semibold text-base">{santri.santri.nama_lengkap}</span>
                                {santri.santri.nisn && (
                                  <Badge variant="outline" className="text-xs">
                                    NISN: {santri.santri.nisn}
                                  </Badge>
                                )}
                                {santri.santri.kelas && (
                                  <Badge variant="outline" className="text-xs">
                                    {santri.santri.kelas}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Saldo saat ini: <span className="font-semibold text-green-600">{formatCurrency(santri.saldo)}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Input Nominal - Hanya muncul jika santri dipilih dan mode manual */}
                          {isSelected && mode === 'manual' && (
                            <div className="pl-7 space-y-2 border-t pt-3 mt-2">
                              <Label htmlFor={`nominal-${santri.santri_id}`} className="text-sm font-medium">
                                Nominal Setoran *
                              </Label>
                              <div className="flex items-center gap-3">
                                <div className="relative flex-1">
                                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    id={`nominal-${santri.santri_id}`}
                                    type="text"
                                    placeholder="Masukkan nominal..."
                                    value={nominalValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                                    onChange={(e) => handleNominalChange(santri.santri_id, e.target.value)}
                                    className="pl-9 h-10 text-base"
                                    autoFocus
                                  />
                                </div>
                                {nominal > 0 && (
                                  <div className="flex flex-col items-end min-w-[120px]">
                                    <div className="text-sm font-semibold text-green-600">
                                      {formatCurrency(nominal)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Saldo: {formatCurrency(santri.saldo + nominal)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Info untuk mode massal */}
                          {isSelected && mode === 'massal' && (
                            <div className="pl-7 space-y-2 border-t pt-3 mt-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-green-600">
                                    Nominal: {formatCurrency(parseFloat(nominalMassal.replace(/[^\d]/g, '')) || 0)}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Saldo setelah: {formatCurrency(santri.saldo + (parseFloat(nominalMassal.replace(/[^\d]/g, '')) || 0))}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
              </div>
            </div>
          </div>
          </div>

          {/* Summary & Action Buttons - Fixed at bottom */}
          <div className="border-t bg-background px-6 py-4 space-y-4">
            {/* Summary */}
            {selectedIds.length > 0 && totalNominal > 0 && (
              <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-base">Ringkasan Setoran Massal</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Jumlah Santri</div>
                      <div className="text-lg font-bold">{selectedIds.length} santri</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Rata-rata per Santri</div>
                      <div className="text-lg font-semibold">{formatCurrency(selectedIds.length > 0 ? Math.round(totalNominal / selectedIds.length) : 0)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Total Setoran</div>
                      <div className="text-xl font-bold text-green-600">{formatCurrency(totalNominal)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
                disabled={loading}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={loading || selectedIds.length === 0 || totalNominal === 0}
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <DollarSign className="h-4 w-4 mr-2" />
                <span>Setor Massal ({selectedIds.length} santri)</span>
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
