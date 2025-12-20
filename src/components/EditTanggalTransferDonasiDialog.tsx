import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface EditTanggalTransferDonasiDialogProps {
  transaction: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const EditTanggalTransferDonasiDialog: React.FC<EditTanggalTransferDonasiDialogProps> = ({
  transaction,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [editTanggal, setEditTanggal] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [donationInfo, setDonationInfo] = useState<any>(null);

  // Load donation info when dialog opens
  useEffect(() => {
    if (isOpen && transaction?.source_id) {
      loadDonationInfo();
    }
  }, [isOpen, transaction]);

  // Set initial tanggal when transaction changes
  useEffect(() => {
    if (transaction?.tanggal) {
      setEditTanggal(transaction.tanggal);
    }
  }, [transaction]);

  const loadDonationInfo = async () => {
    if (!transaction?.source_id) return;

    try {
      const { data, error } = await supabase
        .from('donations')
        .select('id, donor_name, cash_amount, donation_date, tanggal_setoran, kategori_donasi')
        .eq('id', transaction.source_id)
        .single();

      if (error) throw error;
      setDonationInfo(data);
    } catch (error: any) {
      console.error('Error loading donation info:', error);
      // Don't show error toast, just continue without donation info
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleSave = async () => {
    if (!editTanggal || !transaction) {
      toast.error('Tanggal harus diisi');
      return;
    }

    try {
      setLoading(true);

      // 1. Update tanggal di keuangan
      const { error: keuanganError } = await supabase
        .from('keuangan')
        .update({ tanggal: editTanggal })
        .eq('id', transaction.id);

      if (keuanganError) {
        throw new Error('Gagal mengupdate tanggal di keuangan: ' + keuanganError.message);
      }

      // 2. Update donation_date dan tanggal_setoran di donations (sinkronisasi dua arah)
      // Karena kita menggunakan donation_date sebagai tanggal transaksi untuk grafik yang akurat,
      // kita update donation_date agar konsisten dengan tanggal di keuangan
      if (transaction.source_id) {
        const { error: donationError } = await supabase
          .from('donations')
          .update({ 
            donation_date: editTanggal,
            tanggal_setoran: editTanggal // Juga update tanggal_setoran untuk konsistensi
          })
          .eq('id', transaction.source_id);

        if (donationError) {
          console.warn('Warning: Gagal update tanggal di donations:', donationError);
          // Tidak throw error karena keuangan sudah berhasil diupdate
          toast.warning('Tanggal di keuangan berhasil diupdate, namun gagal sinkronisasi dengan donasi');
        }
      }

      // 3. Recalculate saldo akun kas
      if (transaction.akun_kas_id) {
        try {
          await supabase.rpc('ensure_akun_kas_saldo_correct_for', {
            p_akun_id: transaction.akun_kas_id
          });
        } catch (saldoError) {
          console.warn('Warning: Gagal update saldo akun kas:', saldoError);
          // Tidak throw error, hanya warning
        }
      }

      toast.success('Tanggal transfer berhasil diupdate');
      
      // Trigger refresh sebelum menutup dialog
      if (onSuccess) {
        await onSuccess();
      }
      
      // Tutup dialog setelah refresh selesai
      onClose();
    } catch (error: any) {
      console.error('Error updating tanggal transfer:', error);
      toast.error(error.message || 'Gagal mengupdate tanggal transfer');
    } finally {
      setLoading(false);
    }
  };

  if (!transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Tanggal Transfer Pemasukan Donasi</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Tanggal Transfer</Label>
            <Input
              type="date"
              value={editTanggal}
              onChange={(e) => setEditTanggal(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Tanggal ini akan digunakan untuk transaksi keuangan dan akan disinkronkan dengan tanggal setoran di modul donasi.
            </p>
          </div>

          {donationInfo && (
            <div className="text-sm text-muted-foreground space-y-1 bg-gray-50 p-3 rounded-md">
              <p><strong>Donatur:</strong> {donationInfo.donor_name}</p>
              <p><strong>Jumlah:</strong> {formatCurrency(parseFloat(donationInfo.cash_amount || 0))}</p>
              {donationInfo.kategori_donasi && (
                <p><strong>Kategori:</strong> {donationInfo.kategori_donasi}</p>
              )}
              {donationInfo.donation_date && (
                <p><strong>Tanggal Donasi:</strong> {format(new Date(donationInfo.donation_date), 'd MMMM yyyy', { locale: id })}</p>
              )}
              {donationInfo.tanggal_setoran && (
                <p><strong>Tanggal Setoran Saat Ini:</strong> {format(new Date(donationInfo.tanggal_setoran), 'd MMMM yyyy', { locale: id })}</p>
              )}
            </div>
          )}

          <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-md">
            <p className="font-semibold mb-1">Catatan:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Mengubah tanggal transfer akan mengubah tanggal transaksi di keuangan</li>
              <li>Tanggal setoran di modul donasi akan otomatis disinkronkan</li>
              <li>Saldo akun kas akan otomatis dihitung ulang</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || !editTanggal}
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditTanggalTransferDonasiDialog;

