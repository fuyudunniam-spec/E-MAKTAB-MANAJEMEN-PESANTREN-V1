import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, User, DollarSign, Calendar, Wallet, Info } from 'lucide-react';
import { TabunganSantriService } from '@/modules/santri/services/tabunganSantri.service';
import { TransaksiTabungan } from '@/modules/keuangan/types/tabungan.types';
import { AkunKasService, AkunKas } from '@/modules/keuangan/services/akunKas.service';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FormSetorProps {
  santriId: string;
  santriName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const FormSetor: React.FC<FormSetorProps> = ({
  santriId,
  santriName,
  onSuccess,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingAkunKas, setLoadingAkunKas] = useState(false);
  const [akunKasOptions, setAkunKasOptions] = useState<AkunKas[]>([]);
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    nominal: '',
    akunKasId: null as string | null,
    sumberDana: '',
    deskripsi: '',
    catatan: ''
  });
  const { toast } = useToast();

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
    
    const nominal = parseFloat(formData.nominal.replace(/[^\d]/g, ''));
    
    if (!formData.nominal || nominal <= 0) {
      toast({
        title: 'Error',
        description: 'Nominal harus lebih dari 0',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      
      // Tentukan tipe setoran berdasarkan ada/tidaknya akun kas
      const tipeSetoran = formData.akunKasId ? 'tunai' : 'non-kas';

      // 1. Create transaksi tabungan
      const tabunganId = await TabunganSantriService.setorTabungan({
        santri_id: santriId,
        nominal: nominal,
        deskripsi: formData.deskripsi || 
          (formData.akunKasId 
            ? `Setoran tunai dari ${formData.sumberDana || 'Santri'}`
            : `Reward/Apresiasi dari ${formData.sumberDana || 'Yayasan'}`),
        catatan: formData.catatan || null,
        tipe_setoran: tipeSetoran,
        sumber_dana: formData.sumberDana || undefined,
        akun_kas_id: formData.akunKasId || undefined,
        tanggal: formData.tanggal
      });

      // 2. Jika akun kas diisi, create entry di keuangan (pemasukan)
      if (formData.akunKasId) {
        await supabase
          .from('keuangan')
          .insert({
            tanggal: formData.tanggal,
            jenis_transaksi: 'Pemasukan',
            kategori: 'Tabungan Santri',
            sub_kategori: 'Setoran Tunai',
            jumlah: nominal,
            deskripsi: `Setoran tabungan: ${santriName}${formData.sumberDana ? ` dari ${formData.sumberDana}` : ''}`,
            penerima_pembayar: formData.sumberDana || santriName,
            akun_kas_id: formData.akunKasId,
            source_module: 'tabungan',
            source_id: tabunganId,
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
          ? 'Setoran tunai berhasil dicatat dan tercatat di keuangan'
          : 'Setoran non-kas berhasil dicatat (tidak mempengaruhi kas)'
      });
      onSuccess();
    } catch (error: any) {
      console.error('Error setor tabungan:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal melakukan setoran',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const nominal = parseFloat(formData.nominal.replace(/[^\d]/g, '')) || 0;

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Setor Tabungan Santri</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Santri Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{santriName}</span>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Form Fields */}
          <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="nominal">Nominal *</Label>
              <Input
                id="nominal"
                type="text"
                placeholder="0"
                value={formData.nominal.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d]/g, '');
                  setFormData(prev => ({ ...prev, nominal: value }));
                }}
                required
              />
              {formData.nominal && (
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(nominal)}
                </p>
              )}
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="deskripsi">Deskripsi</Label>
            <Textarea
              id="deskripsi"
              placeholder={
                formData.akunKasId
                  ? "Contoh: Setoran dari orang tua, transfer bank, dll"
                  : "Contoh: Reward prestasi juara 1, apresiasi dari donatur, dll"
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

          {/* Info Box */}
          {!formData.akunKasId && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Setoran Non-Kas</AlertTitle>
              <AlertDescription>
                Setoran ini tidak akan mengurangi/menambah kas. Ini adalah pengakuan kewajiban 
                (liability) yayasan kepada santri. Contoh: Reward prestasi, apresiasi dari donatur, dll.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
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
              disabled={loading || !formData.nominal}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <DollarSign className="h-4 w-4 mr-2" />
              Setor
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
