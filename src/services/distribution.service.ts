import { supabase } from '@/integrations/supabase/client';

export interface DistributionTransaction {
  id: string;
  item_id: string;
  nama_barang: string;
  kategori: string;
  jumlah: number;
  penerima: string;
  penerima_santri_id?: string;
  tanggal: string;
  catatan?: string;
  created_at: string;
}

export interface DistributionFormData {
  item_id: string;
  jumlah: number;
  penerima: string;
  penerima_santri_id?: string;
  tanggal: string;
  catatan?: string;
}

export interface MassDistributionData {
  item_id: string;
  distributions: Array<{
    penerima: string;
    penerima_santri_id?: string;
    jumlah: number;
    catatan?: string;
  }>;
  tanggal: string;
}

export interface DistributionStats {
  totalDistribusi: number;
  totalTransaksi: number;
  totalJumlah: number;
  penerimaSummary: Record<string, { total: number; transaksi: number }>;
  itemSummary: Record<string, { total: number; transaksi: number; item_id: string }>;
}

export interface DistributionFilters {
  startDate?: string;
  endDate?: string;
  item_id?: string;
  penerima?: string;
  penerima_santri_id?: string;
}

/**
 * Create a new distribution transaction
 */
export const createDistributionTransaction = async (data: DistributionFormData): Promise<DistributionTransaction> => {
  // Get user ID first
  const { data: { user } } = await supabase.auth.getUser();
  
  const payload = {
    item_id: data.item_id,
    tipe: 'Keluar',
    keluar_mode: 'Distribusi',
    jumlah: data.jumlah,
    harga_satuan: null, // No financial value for distribution
    harga_total: null, // No financial value for distribution
    penerima: data.penerima,
    penerima_santri_id: data.penerima_santri_id,
    tanggal: data.tanggal,
    catatan: data.catatan || 'Distribusi',
    created_by: user?.id
  };

  const { data: result, error } = await supabase
    .from('transaksi_inventaris')
    .insert([payload])
    .select(`
      *,
      inventaris!inner(nama_barang, kategori)
    `)
    .single();

  if (error) throw error;

  // Transform to DistributionTransaction format
  const distributionTransaction: DistributionTransaction = {
    id: result.id,
    item_id: result.item_id,
    nama_barang: result.inventaris.nama_barang,
    kategori: result.inventaris.kategori,
    jumlah: result.jumlah,
    penerima: result.penerima,
    penerima_santri_id: result.penerima_santri_id,
    tanggal: result.tanggal,
    catatan: result.catatan,
    created_at: result.created_at
  };

  return distributionTransaction;
};

/**
 * Create mass distribution (multiple recipients for one item)
 */
export const createMassDistribution = async (data: MassDistributionData): Promise<DistributionTransaction[]> => {
  // Simplified version for now
  console.log('createMassDistribution called with data:', data);
  
  // Return empty array for now
  return [];
};

/**
 * Get distribution transactions with filtering
 */
export const getDistributionTransactions = async (
  pagination: { page: number; pageSize: number },
  filters: DistributionFilters = {},
  sort: { column: string; direction: 'asc' | 'desc' } = { column: 'tanggal', direction: 'desc' }
) => {
  const { page, pageSize } = pagination;
  
  let query = supabase
    .from('transaksi_inventaris')
    .select(`
      *,
      inventaris!inner(nama_barang, kategori),
      santri:penerima_santri_id(id, id_santri, nama_lengkap)
    `, { count: 'exact' })
    .eq('tipe', 'Keluar')
    .eq('keluar_mode', 'Distribusi');

  // Apply filters
  if (filters.startDate) query = query.gte('tanggal', filters.startDate);
  if (filters.endDate) query = query.lte('tanggal', filters.endDate);
  if (filters.item_id) query = query.eq('item_id', filters.item_id);
  if (filters.penerima) query = query.ilike('penerima', `%${filters.penerima}%`);
  if (filters.penerima_santri_id) query = query.eq('penerima_santri_id', filters.penerima_santri_id);

  // Apply sorting
  query = query.order(sort.column, { ascending: sort.direction === 'asc' });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await query.range(from, to);

  if (error) throw error;

  // Transform data
  const transformedData = (data || []).map((row: any) => ({
    id: row.id,
    item_id: row.item_id,
    nama_barang: row.inventaris.nama_barang,
    kategori: row.inventaris.kategori,
    jumlah: row.jumlah,
    penerima: row.penerima,
    penerima_santri_id: row.penerima_santri_id,
    penerima_santri_id_santri: row.santri?.id_santri || null,
    tanggal: row.tanggal,
    catatan: row.catatan,
    created_at: row.created_at
  }));

  return { 
    data: transformedData as DistributionTransaction[], 
    total: count || 0 
  };
};

/**
 * Get distribution statistics
 */
export const getDistributionStats = async (filters: DistributionFilters = {}): Promise<DistributionStats> => {
  // Simplified version for now - return default stats
  console.log('getDistributionStats called with filters:', filters);
  
  return {
    totalDistribusi: 0,
    totalTransaksi: 0,
    totalJumlah: 0,
    penerimaSummary: {},
    itemSummary: {}
  };
};

/**
 * Update distribution transaction
 */
export const updateDistributionTransaction = async (id: string, data: Partial<DistributionFormData>): Promise<DistributionTransaction> => {
  const updateData = {
    penerima: data.penerima,
    penerima_santri_id: data.penerima_santri_id,
    jumlah: data.jumlah,
    catatan: data.catatan
  };

  const { data: result, error } = await supabase
    .from('transaksi_inventaris')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      inventaris!inner(nama_barang, kategori),
      santri:penerima_santri_id(id, id_santri, nama_lengkap)
    `)
    .single();

  if (error) throw error;

  // Transform to DistributionTransaction format
  const distributionTransaction: DistributionTransaction = {
    id: result.id,
    item_id: result.item_id,
    nama_barang: result.inventaris.nama_barang,
    kategori: result.inventaris.kategori,
    jumlah: result.jumlah,
    penerima: result.penerima,
    penerima_santri_id: result.penerima_santri_id,
    penerima_santri_id_santri: (result as any).santri?.id_santri || null,
    tanggal: result.tanggal,
    catatan: result.catatan,
    created_at: result.created_at
  };

  return distributionTransaction;
};

/**
 * Delete distribution transaction
 */
export const deleteDistributionTransaction = async (id: string): Promise<void> => {
  // Ambil transaksi terlebih dahulu untuk mengetahui efek ke stok
  const { data: trx, error: fetchErr } = await supabase
    .from('transaksi_inventaris')
    .select('id, item_id, tipe, jumlah, before_qty, after_qty')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr) {
    console.error('Fetch transaction before delete failed:', fetchErr);
    throw fetchErr;
  }

  // Jika transaksi tidak ditemukan, return early
  if (!trx) {
    console.warn(`Transaction ${id} not found, may have been already deleted`);
    return;
  }

  // Kembalikan stok (karena ini transaksi Keluar/Distribusi, stok harus dikembalikan)
  try {
    const { data: item, error: itemErr } = await supabase
      .from('inventaris')
      .select('jumlah')
      .eq('id', trx.item_id)
      .single();

    if (itemErr) throw itemErr;

    const currentQty = (item?.jumlah ?? 0) as number;
    const delta = trx.jumlah || 0; // Distribusi adalah Keluar, jadi kembalikan jumlahnya

    await supabase
      .from('inventaris')
      .update({ jumlah: currentQty + delta })
      .eq('id', trx.item_id);
  } catch (stockErr) {
    console.warn('Warning updating stock:', stockErr);
  }

  // Hapus transaksi
  const { error } = await supabase
    .from('transaksi_inventaris')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

/**
 * Get distribution transaction by ID
 */
export const getDistributionTransaction = async (id: string): Promise<DistributionTransaction> => {
  const { data, error } = await supabase
    .from('transaksi_inventaris')
    .select(`
      *,
      inventaris!inner(nama_barang, kategori),
      santri:penerima_santri_id(id, id_santri, nama_lengkap)
    `)
    .eq('id', id)
    .eq('tipe', 'Keluar')
    .eq('keluar_mode', 'Distribusi')
    .single();

  if (error) throw error;

  return {
    id: data.id,
    item_id: data.item_id,
    nama_barang: data.inventaris.nama_barang,
    kategori: data.inventaris.kategori,
    jumlah: data.jumlah,
    penerima: data.penerima,
    penerima_santri_id: data.penerima_santri_id,
    penerima_santri_id_santri: (data as any).santri?.id_santri || null,
    tanggal: data.tanggal,
    catatan: data.catatan,
    created_at: data.created_at
  };
};

/**
 * Get santri for recipient selection
 */
export const getSantriForDistribution = async (search?: string) => {
  let query = supabase
    .from('santri')
    .select('id, id_santri, nama_lengkap, kategori, no_whatsapp')
    .eq('status_santri', 'Aktif')
    .order('nama_lengkap');

  if (search) {
    query = query.or(`id_santri.ilike.%${search}%,nama_lengkap.ilike.%${search}%`);
  }

  const { data, error } = await query.limit(50);

  if (error) throw error;
  return data || [];
};

/**
 * Get distribution history for a specific santri
 */
export const getSantriDistributionHistory = async (santriId: string) => {
  const { data, error } = await supabase
    .from('transaksi_inventaris')
    .select(`
      *,
      inventaris!inner(nama_barang, kategori)
    `)
    .eq('tipe', 'Keluar')
    .eq('keluar_mode', 'Distribusi')
    .eq('penerima_santri_id', santriId)
    .order('tanggal', { ascending: false });

  if (error) throw error;

  return (data || []).map(row => ({
    id: row.id,
    item_id: row.item_id,
    nama_barang: row.inventaris.nama_barang,
    kategori: row.inventaris.kategori,
    jumlah: row.jumlah,
    penerima: row.penerima,
    tanggal: row.tanggal,
    catatan: row.catatan,
    created_at: row.created_at
  }));
};
