import { supabase } from '@/integrations/supabase/client';
import { createTransaction } from './inventaris.service';
import { transferFromInventaris } from './koperasi.service';
import { addKeuanganTransaction } from './keuangan.service';
import { AkunKasService } from './akunKas.service';

/**
 * Transfer barang dari inventaris yayasan ke koperasi
 * 
 * Alur:
 * 1. Create transaksi keluar di inventaris (mode: Transfer Koperasi)
 * 2. Create transaksi pembelian di koperasi
 * 3. Auto-post ke keuangan (pemasukan untuk yayasan)
 */
export async function transferInventarisToKoperasi(
  inventarisItemId: string,
  koperasiProdukId: string,
  jumlah: number,
  hargaJual: number, // Harga jual ke koperasi (harga murah)
  tanggal?: string
): Promise<{ 
  inventarisTransactionId: string;
  koperasiTransactionId: string;
}> {
  // 1. Validasi stok inventaris
  const { data: item, error: itemErr } = await supabase
    .from('inventaris')
    .select('id, nama_barang, jumlah')
    .eq('id', inventarisItemId)
    .single();

  if (itemErr || !item) {
    throw new Error('Item inventaris tidak ditemukan');
  }

  if ((item.jumlah || 0) < jumlah) {
    throw new Error(`Stok tidak mencukupi! Tersedia: ${item.jumlah || 0}, Dibutuhkan: ${jumlah}`);
  }

  // 2. Create transaksi keluar di inventaris
  const transaksiKeluar = await createTransaction({
    item_id: inventarisItemId,
    tipe: 'Keluar',
    keluar_mode: 'Transfer Koperasi',
    jumlah: jumlah,
    harga_satuan: hargaJual,
    harga_total: hargaJual * jumlah,
    tanggal: tanggal || new Date().toISOString().split('T')[0],
    catatan: `Transfer ke koperasi: ${koperasiProdukId}`,
    penerima: 'Koperasi'
  });

  // 3. Transfer ke koperasi (create transaksi pembelian di koperasi)
  const koperasiTransaksi = await transferFromInventaris(
    transaksiKeluar.id,
    koperasiProdukId,
    jumlah,
    hargaJual
  );

  // 4. Auto-post ke keuangan (pemasukan untuk yayasan)
  try {
    let targetAkunKasId: string | undefined;
    try {
      const defaultAkun = await AkunKasService.getDefault();
      targetAkunKasId = defaultAkun?.id;
    } catch (e) {
      console.warn('Gagal mengambil akun kas default, lanjut tanpa akun_kas_id');
    }

    await addKeuanganTransaction({
      jenis_transaksi: 'Pemasukan',
      kategori: 'Penjualan Inventaris ke Koperasi',
      jumlah: hargaJual * jumlah,
      tanggal: tanggal || new Date().toISOString().split('T')[0],
      deskripsi: `Transfer ${item.nama_barang} ke koperasi (${jumlah} unit)`,
      referensi: `inventaris_transfer:${transaksiKeluar.id}`,
      akun_kas_id: targetAkunKasId,
      status: 'posted'
    });
  } catch (e) {
    console.warn('Gagal auto-post ke keuangan:', e);
    // Jangan throw error, karena transaksi sudah berhasil
  }

  return {
    inventarisTransactionId: transaksiKeluar.id,
    koperasiTransactionId: koperasiTransaksi.id
  };
}



