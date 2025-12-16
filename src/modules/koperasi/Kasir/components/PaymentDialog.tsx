import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { koperasiService } from "@/services/koperasi.service";
import { toast } from "sonner";
import type { KasirCartItem } from "@/types/koperasi.types";
import ReceiptNota from "./ReceiptNota";
import { TOAST_DURATION, PAYMENT_QUICK_AMOUNT_INCREMENT } from '../../constants';

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  cart: KasirCartItem[];
  subtotal: number;
  totalDiskon: number;
  total: number;
  shiftId: string | null; // Bisa null untuk mode sederhana
  kasirId: string;
  onSuccess: () => void;
  editingPenjualanId?: string | null; // ID penjualan yang sedang diedit (jika ada)
}

export default function PaymentDialog({
  open,
  onClose,
  cart,
  subtotal,
  totalDiskon,
  total,
  shiftId,
  kasirId,
  onSuccess,
  editingPenjualanId,
}: PaymentDialogProps) {
  const [metodeBayar, setMetodeBayar] = useState<'cash' | 'transfer'>('cash');
  const [statusPembayaran, setStatusPembayaran] = useState<'lunas' | 'hutang'>('lunas');
  const [jumlahBayar, setJumlahBayar] = useState(0);
  const [tanggalJatuhTempo, setTanggalJatuhTempo] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const queryClient = useQueryClient();

  const kembalian = statusPembayaran === 'lunas' ? jumlahBayar - total : 0;

  const createPenjualanMutation = useMutation({
    mutationFn: async () => {
      // Validasi produk dan stok di frontend sebelum checkout
      const produkList = await koperasiService.getProduk({ is_active: true });
      const stokErrors: string[] = [];
      const produkNotFound: string[] = [];
      
      for (const item of cart) {
        // Skip validasi untuk produk yang sudah dihapus (data historis)
        if (item.is_deleted_product) {
          continue;
        }
        
        const produk = produkList.find(p => p.id === item.produk_id);
        if (!produk) {
          // Produk tidak ditemukan dan bukan produk yang sudah dihapus (seharusnya tidak terjadi)
          produkNotFound.push(item.nama_produk);
          continue;
        }
        
        // Untuk edit mode, stok sudah di-restore, jadi kita hanya perlu validasi untuk item baru
        // atau perubahan jumlah yang melebihi stok tersedia
        if (!editingPenjualanId) {
          // Mode create: validasi stok ketat
          const stokTersedia = Math.max(0, Math.floor(produk.stok ?? produk.stock ?? 0));
          if (stokTersedia < item.jumlah) {
            stokErrors.push(`${item.nama_produk}: Stok tersedia ${stokTersedia}, dibutuhkan ${item.jumlah}`);
          }
        } else {
          // Mode edit: validasi stok lebih longgar karena stok sudah di-restore
          // Tapi tetap perlu memastikan produk ada
          const stokTersedia = Math.max(0, Math.floor(produk.stok ?? produk.stock ?? 0));
          // Hanya error jika stok tidak cukup dan ini bukan karena restore (stok harus >= jumlah)
          // Karena stok sudah di-restore, seharusnya stok >= jumlah yang akan dibeli
          if (stokTersedia < item.jumlah) {
            stokErrors.push(`${item.nama_produk}: Stok tersedia ${stokTersedia}, dibutuhkan ${item.jumlah}. Stok mungkin belum di-restore dengan benar.`);
          }
        }
      }
      
      // Error jika ada produk yang tidak ditemukan (kecuali yang sudah ditandai sebagai deleted)
      if (produkNotFound.length > 0) {
        throw new Error(`Produk tidak ditemukan:\n${produkNotFound.join('\n')}\n\nProduk ini mungkin sudah dihapus dari database. Silakan hapus item ini dari keranjang.`);
      }
      
      // Error jika stok tidak mencukupi
      if (stokErrors.length > 0) {
        throw new Error(`Stok tidak mencukupi:\n${stokErrors.join('\n')}`);
      }
      
      // Format tanggal sebagai date only (YYYY-MM-DD), bukan datetime
      const tanggal = new Date().toISOString().split('T')[0];
      
      // Jika sedang edit, gunakan updatePenjualan, jika tidak gunakan createPenjualan
      if (editingPenjualanId) {
        // Filter out produk yang sudah dihapus dari items yang akan di-insert
        // Produk yang sudah dihapus tidak bisa di-insert karena foreign key constraint
        const deletedProducts = cart.filter(item => item.is_deleted_product);
        const itemsToSave = cart
          .filter(item => !item.is_deleted_product)
          .map(item => ({
            produk_id: item.produk_id,
            jumlah: item.jumlah,
            harga_jual: item.harga_jual,
            harga_beli: item.harga_beli,
            diskon: item.diskon || 0,
            sumber_modal_id: item.sumber_modal_id,
            price_type: item.price_type || 'ecer',
          }));
        
        // Jika semua item adalah produk yang sudah dihapus, error
        if (itemsToSave.length === 0 && cart.length > 0) {
          const deletedNames = deletedProducts.map(p => p.nama_produk).join(', ');
          throw new Error(
            `Tidak dapat menyimpan transaksi karena semua produk sudah dihapus dari database:\n${deletedNames}\n\n` +
            `Transaksi dengan produk yang sudah dihapus tidak dapat diubah. Silakan hapus transaksi ini atau hubungi administrator.`
          );
        }
        
        // Jika ada produk yang sudah dihapus, tampilkan warning
        if (deletedProducts.length > 0) {
          const deletedNames = deletedProducts.map(p => p.nama_produk).join(', ');
          console.warn(`⚠️ Produk yang sudah dihapus akan dihilangkan dari transaksi: ${deletedNames}`);
          // Note: We don't show toast here because the save will still succeed
          // The user was already warned when loading the edit data
        }
        
        return koperasiService.updatePenjualan(editingPenjualanId, {
          tanggal: tanggal,
          shift_id: shiftId || undefined,
          kasir_id: kasirId,
          subtotal,
          diskon: totalDiskon,
          total,
          metode_bayar: metodeBayar,
          jumlah_bayar: jumlahBayar,
          kembalian: metodeBayar === 'cash' ? kembalian : 0,
          items: itemsToSave,
        });
      } else {
        // Biarkan nomor_struk NULL, trigger database akan auto-generate
        // Ini menghindari race condition dengan trigger
        const isHutang = statusPembayaran === 'hutang';
        const jumlahBayarFinal = isHutang ? jumlahBayar : (metodeBayar === 'cash' ? jumlahBayar : total);
        const sisaHutang = isHutang ? (total - jumlahBayarFinal) : 0;
        
        return koperasiService.createPenjualan({
          no_penjualan: undefined, // Trigger akan generate otomatis
          tanggal: tanggal,
          shift_id: shiftId || undefined, // Opsional untuk mode sederhana
          kasir_id: kasirId,
          subtotal,
          diskon: totalDiskon,
          total,
          metode_bayar: metodeBayar,
          jumlah_bayar: jumlahBayarFinal,
          kembalian: isHutang ? 0 : (metodeBayar === 'cash' ? kembalian : 0),
          status_pembayaran: statusPembayaran,
          jumlah_hutang: sisaHutang,
          sisa_hutang: sisaHutang,
          tanggal_jatuh_tempo: isHutang && tanggalJatuhTempo ? tanggalJatuhTempo : undefined,
          items: cart.map(item => ({
            produk_id: item.produk_id,
            jumlah: item.jumlah,
            harga_jual: item.harga_jual,
            harga_beli: item.harga_beli,
            diskon: item.diskon || 0,
            sumber_modal_id: item.sumber_modal_id,
            price_type: item.price_type || 'ecer',
          })),
        });
      }
    },
    onSuccess: async (result) => {
      toast.success(editingPenjualanId ? 'Penjualan berhasil diperbarui' : 'Transaksi berhasil');
      
      // Invalidate queries untuk refresh data di modul penjualan
      queryClient.invalidateQueries({ queryKey: ['koperasi-penjualan-list'] });
      queryClient.invalidateQueries({ queryKey: ['koperasi-penjualan-stats'] });
      queryClient.invalidateQueries({ queryKey: ['koperasi-penjualan-chart'] });
      queryClient.invalidateQueries({ queryKey: ['koperasi-penjualan-hutang-summary'] });
      queryClient.invalidateQueries({ queryKey: ['koperasi-penjualan-cicilan-summary'] });
      queryClient.invalidateQueries({ queryKey: ['koperasi-penjualan'] });
      queryClient.invalidateQueries({ queryKey: ['unified-sales-history'] });
      
      // Fetch detail penjualan untuk receipt
      try {
        const penjualanId = result?.id || editingPenjualanId;
        if (penjualanId) {
          const detail = await koperasiService.getSalesDetailWithProfitSharing(
            penjualanId,
            'kop_penjualan'
          );
          
          // Get penjualan header data
          const penjualanHeader = await koperasiService.getPenjualanById(penjualanId);
          
          if (detail && penjualanHeader) {
            setReceiptData({
              penjualan: {
                id: penjualanId,
                nomor_struk: penjualanHeader.nomor_struk || penjualanHeader.no_penjualan,
                tanggal: penjualanHeader.tanggal,
                kasir_name: penjualanHeader.nama_kasir || 'Admin',
                metode_pembayaran: penjualanHeader.metode_pembayaran,
                total_transaksi: penjualanHeader.total_transaksi || penjualanHeader.total,
                jumlah_bayar: penjualanHeader.jumlah_bayar,
                kembalian: penjualanHeader.kembalian,
              },
              items: detail.items.map(item => ({
                id: item.id,
                nama_barang: item.nama_barang,
                jumlah: item.jumlah,
                satuan: item.satuan,
                harga_satuan_jual: item.harga_satuan_jual || item.harga_satuan || 0,
                subtotal: item.subtotal || item.harga_total || 0,
              })),
            });
            setShowReceipt(true);
            return; // Don't close yet, wait for receipt print
          }
        }
      } catch (error) {
        // Continue with normal flow if receipt fetch fails
        // Log only in development
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.warn('Error fetching receipt data (non-critical):', error);
        }
      }
      
      onSuccess();
      onClose();
      resetForm();
    },
    onError: (error: Error) => {
      // Tampilkan pesan error yang lebih informatif
      const errorMessage = error?.message || 'Gagal menyimpan transaksi';
      // Jika error mengandung informasi stok, tampilkan dengan lebih jelas
      if (errorMessage.includes('Stok tidak mencukupi')) {
        toast.error(errorMessage, {
          duration: TOAST_DURATION.MEDIUM, // Tampilkan lebih lama untuk error penting
        });
      } else {
        toast.error(errorMessage);
      }
    },
  });

  const resetForm = () => {
    setMetodeBayar('cash');
    setStatusPembayaran('lunas');
    setJumlahBayar(0);
    setTanggalJatuhTempo('');
  };

  const handleSubmit = () => {
    if (statusPembayaran === 'lunas') {
      if (metodeBayar === 'cash' && jumlahBayar < total) {
        toast.error('Jumlah bayar kurang');
        return;
      }
      if (metodeBayar === 'transfer' && jumlahBayar !== total) {
        setJumlahBayar(total);
      }
    } else {
      // Hutang - jumlah bayar bisa 0 (belum bayar sama sekali)
      if (jumlahBayar < 0) {
        toast.error('Jumlah bayar tidak boleh negatif');
        return;
      }
      if (jumlahBayar >= total) {
        toast.error('Untuk pembayaran penuh, pilih status "Lunas"');
        return;
      }
    }
    createPenjualanMutation.mutate();
  };

  const handleQuickAmount = (amount: number) => {
    setJumlahBayar(amount);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPenjualanId ? 'Edit Penjualan' : 'Pembayaran'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted p-4 rounded space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Diskon:</span>
                <span>- Rp {totalDiskon.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-xl font-bold border-t pt-2">
                <span>TOTAL:</span>
                <span>Rp {total.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div>
              <Label>Status Pembayaran</Label>
              <RadioGroup value={statusPembayaran} onValueChange={(v: any) => {
                setStatusPembayaran(v);
                if (v === 'lunas') {
                  setJumlahBayar(total);
                } else {
                  setJumlahBayar(0);
                }
              }}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="lunas" id="lunas" />
                  <Label htmlFor="lunas">Lunas</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hutang" id="hutang" />
                  <Label htmlFor="hutang">Hutang</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Metode Pembayaran</Label>
              <RadioGroup value={metodeBayar} onValueChange={(v: any) => setMetodeBayar(v)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash">Cash</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="transfer" id="transfer" />
                  <Label htmlFor="transfer">Transfer</Label>
                </div>
              </RadioGroup>
            </div>

            {statusPembayaran === 'hutang' && (
              <>
                <div>
                  <Label>Jumlah Bayar (Cicilan) - Opsional</Label>
                  <Input
                    type="number"
                    value={jumlahBayar}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setJumlahBayar(Math.min(Math.max(0, value), total));
                    }}
                    placeholder="0"
                    min="0"
                    max={total}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Sisa hutang: Rp {(total - jumlahBayar).toLocaleString('id-ID')}
                    {jumlahBayar === 0 && ' (Belum ada pembayaran)'}
                  </p>
                </div>
                <div>
                  <Label>Tanggal Jatuh Tempo (Opsional)</Label>
                  <Input
                    type="date"
                    value={tanggalJatuhTempo}
                    onChange={(e) => setTanggalJatuhTempo(e.target.value)}
                  />
                </div>
              </>
            )}

            {statusPembayaran === 'lunas' && metodeBayar === 'cash' && (
              <>
                <div>
                  <Label>Jumlah Bayar</Label>
                  <Input
                    type="number"
                    value={jumlahBayar}
                    onChange={(e) => setJumlahBayar(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleQuickAmount(total)}
                    size="sm"
                  >
                    Pas
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleQuickAmount(Math.ceil(total / PAYMENT_QUICK_AMOUNT_INCREMENT) * PAYMENT_QUICK_AMOUNT_INCREMENT)}
                    size="sm"
                  >
                    50K
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleQuickAmount(Math.ceil(total / 100000) * 100000)}
                    size="sm"
                  >
                    100K
                  </Button>
                </div>

                {jumlahBayar > 0 && (
                  <div className={`p-3 rounded ${
                    kembalian >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    <div className="flex justify-between font-semibold">
                      <span>Kembalian:</span>
                      <span>Rp {kembalian.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {statusPembayaran === 'lunas' && metodeBayar === 'transfer' && (
              <div className="bg-blue-50 text-blue-700 p-3 rounded">
                <p className="text-sm">Transfer: Rp {total.toLocaleString('id-ID')}</p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  createPenjualanMutation.isPending || 
                  (statusPembayaran === 'lunas' && metodeBayar === 'cash' && jumlahBayar < total) ||
                  (statusPembayaran === 'hutang' && jumlahBayar >= total)
                }
              >
                {statusPembayaran === 'hutang' ? 'Simpan Sebagai Hutang' : 'Proses Pembayaran'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Print Dialog */}
      {showReceipt && receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">Nota Penjualan</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowReceipt(false);
                  setReceiptData(null);
                  onSuccess();
                  onClose();
                  resetForm();
                }}
              >
                Tutup
              </Button>
            </div>
            <div className="p-4">
              <ReceiptNota
                penjualan={receiptData.penjualan}
                items={receiptData.items}
                autoPrint={true}
                showActions={true}
                onClose={() => {
                  setShowReceipt(false);
                  setReceiptData(null);
                  onSuccess();
                  onClose();
                  resetForm();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}



