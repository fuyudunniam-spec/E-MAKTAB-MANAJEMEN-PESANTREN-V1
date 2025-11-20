import { supabase } from '@/integrations/supabase/client';
import { addKeuanganTransaction } from '@/services/keuangan.service';

// =====================================================
// TYPES
// =====================================================

export interface KoperasiProduk {
  id: string;
  nama_produk: string;
  kategori: string;
  harga_beli: number;
  harga_jual: number;
  margin: number;
  stok: number;
  stok_minimum: number;
  satuan?: string | null;
  sumber: 'Inventaris' | 'Vendor';
  referensi_inventaris_id?: string | null;
  supplier?: string | null;
  status: 'Aktif' | 'Non-Aktif';
  deskripsi?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface KoperasiTransaksi {
  id: string;
  produk_id: string;
  tipe: 'Pembelian' | 'Penjualan';
  jumlah: number;
  harga_beli?: number | null;
  harga_jual?: number | null;
  total_beli?: number | null;
  total_jual?: number | null;
  keuntungan?: number | null;
  sumber?: 'Inventaris' | 'Vendor' | null;
  referensi_inventaris_id?: string | null;
  pembeli?: string | null;
  supplier?: string | null;
  tanggal: string;
  catatan?: string | null;
  created_at?: string | null;
  // Joined fields
  produk?: KoperasiProduk | null;
}

export interface KoperasiFormData {
  nama_produk: string;
  kategori: string;
  harga_beli: number;
  harga_jual: number;
  stok_minimum?: number;
  satuan?: string;
  sumber: 'Inventaris' | 'Vendor';
  supplier?: string;
  deskripsi?: string;
}

export interface PembelianFormData {
  produk_id: string;
  jumlah: number;
  harga_beli: number;
  supplier?: string;
  sumber: 'Inventaris' | 'Vendor';
  referensi_inventaris_id?: string; // Jika dari inventaris
  tanggal: string;
  catatan?: string;
}

export interface PenjualanFormData {
  produk_id: string;
  jumlah: number;
  harga_jual: number;
  pembeli: string;
  tanggal: string;
  catatan?: string;
}

export interface SHUData {
  bulan: string;
  total_transaksi_penjualan: number;
  total_revenue: number;
  total_cost: number;
  total_keuntungan: number;
  keuntungan_dari_inventaris: number;
  keuntungan_dari_vendor: number;
}

// =====================================================
// MASTER PRODUK
// =====================================================

/**
 * Get all produk koperasi
 */
export const listKoperasiProduk = async (filters?: {
  kategori?: string;
  status?: 'Aktif' | 'Non-Aktif';
  sumber?: 'Inventaris' | 'Vendor';
}): Promise<KoperasiProduk[]> => {
  let query = supabase
    .from('koperasi')
    .select('*')
    .order('nama_produk', { ascending: true });

  if (filters?.kategori) query = query.eq('kategori', filters.kategori);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.sumber) query = query.eq('sumber', filters.sumber);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as KoperasiProduk[];
};

/**
 * Get produk by ID
 */
export const getKoperasiProduk = async (id: string): Promise<KoperasiProduk | null> => {
  const { data, error } = await supabase
    .from('koperasi')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as KoperasiProduk;
};

/**
 * Create produk koperasi
 */
export const createKoperasiProduk = async (data: KoperasiFormData): Promise<KoperasiProduk> => {
  const { data: { user } } = await supabase.auth.getUser();

  const { data: produk, error } = await supabase
    .from('koperasi')
    .insert([{
      ...data,
      stok: 0, // Stok awal 0, akan bertambah saat pembelian
      created_by: user?.id
    }])
    .select()
    .single();

  if (error) throw error;
  return produk as KoperasiProduk;
};

/**
 * Update produk koperasi
 */
export const updateKoperasiProduk = async (
  id: string,
  data: Partial<KoperasiFormData>
): Promise<KoperasiProduk> => {
  const { data: { user } } = await supabase.auth.getUser();

  const { data: produk, error } = await supabase
    .from('koperasi')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
      updated_by: user?.id
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return produk as KoperasiProduk;
};

/**
 * Delete produk koperasi (soft delete)
 */
export const deleteKoperasiProduk = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('koperasi')
    .update({ status: 'Non-Aktif' })
    .eq('id', id);

  if (error) throw error;
};

// =====================================================
// TRANSAKSI PEMBELIAN
// =====================================================

/**
 * Create transaksi pembelian
 */
export const createPembelianKoperasi = async (
  data: PembelianFormData
): Promise<KoperasiTransaksi> => {
  const { data: { user } } = await supabase.auth.getUser();

  // Get produk untuk validasi
  const produk = await getKoperasiProduk(data.produk_id);
  if (!produk) throw new Error('Produk tidak ditemukan');

  const totalBeli = data.harga_beli * data.jumlah;

  const { data: transaksi, error } = await supabase
    .from('transaksi_koperasi')
    .insert([{
      produk_id: data.produk_id,
      tipe: 'Pembelian',
      jumlah: data.jumlah,
      harga_beli: data.harga_beli,
      total_beli: totalBeli,
      sumber: data.sumber,
      referensi_inventaris_id: data.referensi_inventaris_id || null,
      supplier: data.supplier || null,
      tanggal: data.tanggal,
      catatan: data.catatan || null,
      created_by: user?.id
    }])
    .select(`
      *,
      produk:koperasi(*)
    `)
    .single();

  if (error) throw error;

  // Jika dari inventaris, auto-post ke keuangan sebagai pengeluaran
  if (data.sumber === 'Inventaris' && data.referensi_inventaris_id) {
    try {
      await addKeuanganTransaction({
        jenis_transaksi: 'Pengeluaran',
        kategori: 'Pembelian Inventaris ke Koperasi',
        jumlah: totalBeli,
        tanggal: data.tanggal,
        referensi: `koperasi_pembelian:${transaksi.id}`
      });
    } catch (e) {
      console.warn('Gagal auto-post ke keuangan:', e);
    }
  }

  return transaksi as KoperasiTransaksi;
};

// =====================================================
// TRANSAKSI PENJUALAN
// =====================================================

/**
 * Create transaksi penjualan
 */
export const createPenjualanKoperasi = async (
  data: PenjualanFormData
): Promise<KoperasiTransaksi> => {
  const { data: { user } } = await supabase.auth.getUser();

  // Get produk untuk validasi stok dan harga beli
  const produk = await getKoperasiProduk(data.produk_id);
  if (!produk) throw new Error('Produk tidak ditemukan');

  // Validasi stok
  if (produk.stok < data.jumlah) {
    throw new Error(`Stok tidak mencukupi! Tersedia: ${produk.stok}, Dibutuhkan: ${data.jumlah}`);
  }

  const totalJual = data.harga_jual * data.jumlah;
  const totalBeli = produk.harga_beli * data.jumlah;

  const { data: transaksi, error } = await supabase
    .from('transaksi_koperasi')
    .insert([{
      produk_id: data.produk_id,
      tipe: 'Penjualan',
      jumlah: data.jumlah,
      harga_beli: produk.harga_beli,
      harga_jual: data.harga_jual,
      total_beli: totalBeli,
      total_jual: totalJual,
      sumber: produk.sumber,
      referensi_inventaris_id: produk.referensi_inventaris_id,
      pembeli: data.pembeli,
      tanggal: data.tanggal,
      catatan: data.catatan || null,
      created_by: user?.id
    }])
    .select(`
      *,
      produk:koperasi(*)
    `)
    .single();

  if (error) throw error;

  // Auto-post ke keuangan sudah di-handle oleh trigger
  return transaksi as KoperasiTransaksi;
};

// =====================================================
// TRANSFER DARI INVENTARIS (Manual Approach)
// =====================================================
// Note: Modul koperasi akan dibuat sebagai aplikasi terpisah
// Function ini untuk referensi jika diperlukan workflow manual

/**
 * Transfer barang dari inventaris yayasan ke koperasi (manual approach)
 * Workflow: 
 * 1. Di inventaris: Buat transaksi keluar dengan mode "Penjualan" ke koperasi
 * 2. Di koperasi: Input manual transaksi pembelian menggunakan function ini
 */
export const transferFromInventaris = async (
  inventarisTransactionId: string, // ID transaksi keluar dari inventaris
  produkId: string,
  jumlah: number,
  hargaBeli: number // Harga beli dari inventaris (harga murah)
): Promise<KoperasiTransaksi> => {
  // Validasi produk koperasi
  const produk = await getKoperasiProduk(produkId);
  if (!produk) throw new Error('Produk koperasi tidak ditemukan');

  // Create transaksi pembelian di koperasi
  const pembelian = await createPembelianKoperasi({
    produk_id: produkId,
    jumlah: jumlah,
    harga_beli: hargaBeli,
    supplier: 'Inventaris Yayasan',
    sumber: 'Inventaris',
    referensi_inventaris_id: inventarisTransactionId,
    tanggal: new Date().toISOString().split('T')[0],
    catatan: `Transfer dari inventaris yayasan`
  });

  return pembelian;
};

// =====================================================
// LIST TRANSAKSI
// =====================================================

/**
 * Get transaksi koperasi dengan filtering
 */
export const listKoperasiTransaksi = async (
  pagination: { page: number; pageSize: number },
  filters?: {
    tipe?: 'Pembelian' | 'Penjualan';
    sumber?: 'Inventaris' | 'Vendor';
    startDate?: string;
    endDate?: string;
    produk_id?: string;
  },
  sort: { column: string; direction: 'asc' | 'desc' } = { column: 'tanggal', direction: 'desc' }
) => {
  const { page, pageSize } = pagination;
  
  let query = supabase
    .from('transaksi_koperasi')
    .select(`
      *,
      produk:koperasi(*)
    `, { count: 'exact' });

  if (filters?.tipe) query = query.eq('tipe', filters.tipe);
  if (filters?.sumber) query = query.eq('sumber', filters.sumber);
  if (filters?.produk_id) query = query.eq('produk_id', filters.produk_id);
  if (filters?.startDate) query = query.gte('tanggal', filters.startDate);
  if (filters?.endDate) query = query.lte('tanggal', filters.endDate);

  query = query.order(sort.column, { ascending: sort.direction === 'asc' });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await query.range(from, to);

  if (error) throw error;

  return {
    data: (data || []) as KoperasiTransaksi[],
    total: count || 0
  };
};

// =====================================================
// SHU & STATISTIK
// =====================================================

/**
 * Get SHU data per bulan
 */
export const getSHUData = async (filters?: {
  startDate?: string;
  endDate?: string;
}): Promise<SHUData[]> => {
  let query = supabase
    .from('view_shu_koperasi')
    .select('*')
    .order('bulan', { ascending: false });

  if (filters?.startDate) {
    query = query.gte('bulan', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte('bulan', filters.endDate);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as SHUData[];
};

/**
 * Get statistik koperasi
 */
export const getKoperasiStats = async (filters?: {
  startDate?: string;
  endDate?: string;
}) => {
  const startDate = filters?.startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const endDate = filters?.endDate || new Date().toISOString().split('T')[0];

  // Get total produk aktif
  const { count: totalProduk } = await supabase
    .from('koperasi')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Aktif');

  // Get transaksi bulan ini
  const { data: transaksi, error } = await supabase
    .from('transaksi_koperasi')
    .select('tipe, total_jual, total_beli, keuntungan')
    .gte('tanggal', startDate)
    .lte('tanggal', endDate);

  if (error) throw error;

  const penjualan = transaksi?.filter(t => t.tipe === 'Penjualan') || [];
  const totalOmzet = penjualan.reduce((sum, t) => sum + (t.total_jual || 0), 0);
  const totalTransaksi = penjualan.length;
  const totalKeuntungan = penjualan.reduce((sum, t) => sum + (t.keuntungan || 0), 0);
  const rataRataHari = totalTransaksi > 0 ? totalOmzet / (new Date().getDate()) : 0;

  return {
    totalProduk: totalProduk || 0,
    totalOmzet,
    totalTransaksi,
    totalKeuntungan,
    rataRataHari
  };
};

