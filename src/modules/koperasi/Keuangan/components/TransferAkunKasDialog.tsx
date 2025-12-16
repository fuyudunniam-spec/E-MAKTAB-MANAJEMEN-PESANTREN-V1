import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { koperasiService } from '@/services/koperasi.service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface TransferAkunKasDialogProps {
  open: boolean;
  onClose: () => void;
  defaultDariAkunId?: string;
  onSuccess?: () => void;
}

export default function TransferAkunKasDialog({
  open,
  onClose,
  defaultDariAkunId,
  onSuccess,
}: TransferAkunKasDialogProps) {
  const [dariAkunId, setDariAkunId] = useState<string>(defaultDariAkunId || '');
  const [keAkunId, setKeAkunId] = useState<string>('');
  const [jumlah, setJumlah] = useState<string>('');
  const [keterangan, setKeterangan] = useState<string>('');
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const queryClient = useQueryClient();

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (defaultDariAkunId) {
        setDariAkunId(defaultDariAkunId);
      }
      setTanggal(new Date().toISOString().split('T')[0]);
    } else {
      setDariAkunId(defaultDariAkunId || '');
      setKeAkunId('');
      setJumlah('');
      setKeterangan('');
    }
  }, [open, defaultDariAkunId]);

  // Fetch akun kas
  const { data: akunKasList = [], isLoading: loadingAkunKas } = useQuery({
    queryKey: ['akun-kas-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('akun_kas')
        .select('id, nama, saldo_saat_ini, status')
        .eq('status', 'aktif')
        .order('nama');

      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  // Get saldo dari akun yang dipilih
  const dariAkun = akunKasList.find(akun => akun.id === dariAkunId);
  const saldoDariAkun = dariAkun?.saldo_saat_ini || 0;

  // Transfer mutation
  const transferMutation = useMutation({
    mutationFn: async () => {
      if (!dariAkunId) throw new Error('Pilih akun kas sumber');
      if (!keAkunId) throw new Error('Pilih akun kas tujuan');
      if (dariAkunId === keAkunId) throw new Error('Akun kas sumber dan tujuan tidak boleh sama');
      
      const jumlahNum = parseFloat(jumlah.replace(/\./g, '').replace(',', '.'));
      if (isNaN(jumlahNum) || jumlahNum <= 0) {
        throw new Error('Jumlah transfer harus lebih dari 0');
      }

      return await koperasiService.transferAntarAkunKas({
        dari_akun_kas_id: dariAkunId,
        ke_akun_kas_id: keAkunId,
        jumlah: jumlahNum,
        tanggal: tanggal,
        keterangan: keterangan || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Transfer antar akun kas berhasil');
      queryClient.invalidateQueries({ queryKey: ['akun-kas-list'] });
      queryClient.invalidateQueries({ queryKey: ['keuangan'] });
      queryClient.invalidateQueries({ queryKey: ['keuangan-koperasi'] });
      onSuccess?.(); // Call parent callback to reload data
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal melakukan transfer');
    },
  });

  const handleClose = () => {
    setJumlah('');
    setKeterangan('');
    setKeAkunId('');
    onClose();
  };

  const formatCurrency = (value: string) => {
    // Remove non-numeric characters
    const numericValue = value.replace(/[^\d]/g, '');
    if (!numericValue) return '';
    
    // Format with thousand separators
    return new Intl.NumberFormat('id-ID').format(parseInt(numericValue));
  };

  const handleJumlahChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatCurrency(value);
    setJumlah(formatted);
  };

  const jumlahNum = parseFloat(jumlah.replace(/\./g, '')) || 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Transfer Antar Akun Kas</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tanggal */}
          <div>
            <Label>Tanggal Transfer *</Label>
            <Input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              required
            />
          </div>

          {/* Dari Akun Kas */}
          <div>
            <Label>Dari Akun Kas *</Label>
            <Select value={dariAkunId} onValueChange={setDariAkunId} disabled={!!defaultDariAkunId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih akun kas sumber">
                  {loadingAkunKas ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Memuat...
                    </span>
                  ) : dariAkun ? (
                    `${dariAkun.nama} (Saldo: Rp ${saldoDariAkun.toLocaleString('id-ID')})`
                  ) : (
                    'Pilih akun kas sumber'
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {akunKasList.map((akun) => (
                  <SelectItem key={akun.id} value={akun.id}>
                    {akun.nama} (Saldo: Rp {(akun.saldo_saat_ini || 0).toLocaleString('id-ID')})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {dariAkun && (
              <p className="text-xs text-muted-foreground mt-1">
                Saldo tersedia: Rp {saldoDariAkun.toLocaleString('id-ID')}
              </p>
            )}
          </div>

          {/* Ke Akun Kas */}
          <div>
            <Label>Ke Akun Kas *</Label>
            <Select value={keAkunId} onValueChange={setKeAkunId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih akun kas tujuan" />
              </SelectTrigger>
              <SelectContent>
                {akunKasList
                  .filter((akun) => akun.id !== dariAkunId)
                  .map((akun) => (
                    <SelectItem key={akun.id} value={akun.id}>
                      {akun.nama} (Saldo: Rp {(akun.saldo_saat_ini || 0).toLocaleString('id-ID')})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Jumlah */}
          <div>
            <Label>Jumlah Transfer *</Label>
            <Input
              type="text"
              value={jumlah}
              onChange={handleJumlahChange}
              placeholder="0"
              required
            />
            {jumlahNum > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Rp {jumlahNum.toLocaleString('id-ID')}
              </p>
            )}
            {dariAkun && jumlahNum > saldoDariAkun && (
              <p className="text-xs text-red-600 mt-1">
                Saldo tidak cukup! Saldo tersedia: Rp {saldoDariAkun.toLocaleString('id-ID')}
              </p>
            )}
          </div>

          {/* Keterangan */}
          <div>
            <Label>Keterangan</Label>
            <Textarea
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Catatan transfer (opsional)"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={handleClose}>
              Batal
            </Button>
            <Button
              onClick={() => transferMutation.mutate()}
              disabled={
                !dariAkunId ||
                !keAkunId ||
                jumlahNum <= 0 ||
                jumlahNum > saldoDariAkun ||
                transferMutation.isPending
              }
            >
              {transferMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Transfer'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

