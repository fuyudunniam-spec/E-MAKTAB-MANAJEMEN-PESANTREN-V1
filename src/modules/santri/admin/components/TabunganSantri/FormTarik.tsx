import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, User, DollarSign, AlertTriangle, Calendar, Wallet } from 'lucide-react';
import { TabunganSantriService } from '@/modules/santri/services/tabunganSantri.service';
import { TransaksiTabungan } from '@/modules/keuangan/types/tabungan.types';
import { AkunKasService, AkunKas } from '@/modules/keuangan/services/akunKas.service';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FormTarikProps {
  santriId: string;
  santriName: string;
  saldoSaatIni: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export const FormTarik: React.FC<FormTarikProps> = ({
  santriId,
  santriName,
  saldoSaatIni,
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

    if (nominal > saldoSaatIni) {
      toast({
        title: 'Error',
        description: `Saldo tidak mencukupi. Saldo saat ini: ${formatCurrency(saldoSaatIni)}`,
        variant: 'destructive'
      });
      return;
    }

    if (!formData.akunKasId) {
      toast({
        title: 'Error',
        description: 'Pilih akun kas untuk penarikan',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      
      // 1. Create transaksi tabungan
      const tabunganId = await TabunganSantriService.tarikTabungan({
        santri_id: santriId,
        nominal: nominal,
        deskripsi: formData.deskripsi || `Penarikan tunai dari ${santriName}`,
        catatan: formData.catatan || null,
        akun_kas_id: formData.akunKasId,
        tanggal: formData.tanggal
      });

      // 2. Create entry di keuangan untuk tracking (penarikan selalu mengurangi kas)
      await supabase
        .from('keuangan')
        .insert({
          tanggal: formData.tanggal,
          jenis_transaksi: 'Pengeluaran',
          kategori: 'Tabungan Santri',
          sub_kategori: 'Penarikan Tunai',
          jumlah: nominal,
          deskripsi: `Penarikan tabungan: ${santriName}`,
          penerima_pembayar: santriName,
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
      
      toast({
        title: 'Berhasil',
        description: 'Penarikan tabungan berhasil dicatat'
      });
      onSuccess();
    } catch (error: any) {
      console.error('Error tarik tabungan:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal melakukan penarikan',
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
  const saldoSesudah = saldoSaatIni - nominal;
  const isInsufficient = nominal > saldoSaatIni;

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tarik Tabungan Santri</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Santri Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{santriName}</span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Saldo saat ini: <span className="font-medium">{formatCurrency(saldoSaatIni)}</span>
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
              <Label htmlFor="nominal">Nominal Penarikan *</Label>
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

            <div className="space-y-2">
              <Label htmlFor="akun_kas_id">Akun Kas *</Label>
              <Select 
                value={formData.akunKasId || ''} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, akunKasId: value }))}
                required
                disabled={loadingAkunKas}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingAkunKas ? "Memuat..." : "Pilih akun kas"} />
                </SelectTrigger>
                <SelectContent>
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
                Uang akan keluar dari akun kas ini
              </p>
            </div>
          </div>

            {/* Saldo Preview */}
            {formData.nominal && (
              <Card className={isInsufficient ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}>
                <CardContent className="p-3">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Saldo saat ini:</span>
                      <span>{formatCurrency(saldoSaatIni)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Penarikan:</span>
                      <span className="text-red-600">-{formatCurrency(nominal)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Saldo setelah penarikan:</span>
                      <span className={isInsufficient ? 'text-red-600' : 'text-green-600'}>
                        {formatCurrency(saldoSesudah)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Warning if insufficient */}
            {isInsufficient && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Saldo tidak mencukupi untuk penarikan ini.
                </AlertDescription>
              </Alert>
            )}

          <div className="space-y-2">
            <Label htmlFor="deskripsi">Deskripsi</Label>
            <Textarea
              id="deskripsi"
              placeholder="Contoh: Penarikan untuk kebutuhan pribadi, dll"
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
              className="flex-1 bg-red-600 hover:bg-red-700"
              disabled={loading || !formData.nominal || isInsufficient || !formData.akunKasId}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <DollarSign className="h-4 w-4 mr-2" />
              Tarik
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
