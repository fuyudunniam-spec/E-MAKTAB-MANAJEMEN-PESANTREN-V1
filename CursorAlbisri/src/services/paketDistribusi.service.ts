import { supabase } from '@/integrations/supabase/client';

// =====================================================
// TYPES
// =====================================================

export interface PaketSembako {
  id: string;
  nama_paket: string;
  deskripsi?: string | null;
  nilai_paket?: number | null;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  created_by?: string | null;
}

export interface PaketKomponen {
  id: string;
  paket_id: string;
  item_id: string;
  jumlah: number;
  created_at?: string | null;
  // Joined fields
  inventaris?: {
    id: string;
    nama_barang: string;
    kategori?: string | null;
    satuan?: string | null;
    jumlah?: number | null; // Stok tersedia
  } | null;
}

export interface PaketKomponenWithStock extends PaketKomponen {
  stok_tersedia: number;
  stok_cukup: boolean;
  kurang?: number;
}

export interface DistribusiPaket {
  id: string;
  paket_id: string;
  penerima: string;
  tipe_penerima?: string | null;
  alamat?: string | null;
  kriteria?: string | null;
  tanggal_distribusi: string;
  catatan?: string | null;
  created_at?: string | null;
  created_by?: string | null;
  // Joined fields
  paket_sembako?: PaketSembako | null;
}

export interface PaketSembakoWithKomponen extends PaketSembako {
  komponen: PaketKomponenWithStock[];
}

export interface DistribusiPaketFormData {
  paket_id: string;
  penerima: string;
  tipe_penerima?: string;
  alamat?: string;
  kriteria?: string;
  tanggal_distribusi: string;
  catatan?: string;
}

// =====================================================
// MASTER PAKET SEMBAKO
// =====================================================

/**
 * Get all paket sembako
 */
export const listPaketSembako = async (includeInactive = false): Promise<PaketSembako[]> => {
  let query = supabase
    .from('paket_sembako')
    .select('*')
    .order('created_at', { ascending: false });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
};

/**
 * Get paket sembako by ID
 */
export const getPaketSembako = async (id: string): Promise<PaketSembako | null> => {
  const { data, error } = await supabase
    .from('paket_sembako')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return data;
};

/**
 * Get paket dengan komponen dan cek stok
 */
export const getPaketSembakoWithKomponen = async (
  id: string
): Promise<PaketSembakoWithKomponen | null> => {
  // Get paket
  const paket = await getPaketSembako(id);
  if (!paket || !paket.is_active) return null; // Jangan return paket yang sudah dihapus

  // Get komponen dengan stok
  const { data: komponen, error } = await supabase
    .from('paket_komponen')
    .select(`
      *,
      inventaris (
        id,
        nama_barang,
        kategori,
        satuan,
        jumlah
      )
    `)
    .eq('paket_id', id)
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Enrich dengan cek stok
  const komponenWithStock: PaketKomponenWithStock[] = (komponen || []).map((k) => {
    const stokTersedia = k.inventaris?.jumlah || 0;
    const stokCukup = stokTersedia >= k.jumlah;
    const kurang = stokCukup ? 0 : k.jumlah - stokTersedia;

    return {
      ...k,
      stok_tersedia: stokTersedia,
      stok_cukup: stokCukup,
      kurang: kurang > 0 ? kurang : undefined,
    };
  });

  return {
    ...paket,
    komponen: komponenWithStock,
  };
};

/**
 * Create paket sembako
 */
export const createPaketSembako = async (
  data: Omit<PaketSembako, 'id' | 'created_at' | 'updated_at'>
): Promise<PaketSembako> => {
  const { data: { user } } = await supabase.auth.getUser();

  const { data: paket, error } = await supabase
    .from('paket_sembako')
    .insert([
      {
        ...data,
        created_by: user?.id,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return paket;
};

/**
 * Update paket sembako
 */
export const updatePaketSembako = async (
  id: string,
  data: Partial<Omit<PaketSembako, 'id' | 'created_at' | 'created_by'>>
): Promise<PaketSembako> => {
  const { data: paket, error } = await supabase
    .from('paket_sembako')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return paket;
};

/**
 * Delete paket sembako (soft delete)
 */
export const deletePaketSembako = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('paket_sembako')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
};

// =====================================================
// KOMPONEN PAKET
// =====================================================

/**
 * Get komponen paket dengan cek stok
 */
export const getKomponenPaket = async (
  paketId: string
): Promise<PaketKomponenWithStock[]> => {
  const { data, error } = await supabase
    .from('paket_komponen')
    .select(`
      *,
      inventaris (
        id,
        nama_barang,
        kategori,
        satuan,
        jumlah
      )
    `)
    .eq('paket_id', paketId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data || []).map((k) => {
    const stokTersedia = k.inventaris?.jumlah || 0;
    const stokCukup = stokTersedia >= k.jumlah;
    const kurang = stokCukup ? 0 : k.jumlah - stokTersedia;

    return {
      ...k,
      stok_tersedia: stokTersedia,
      stok_cukup: stokCukup,
      kurang: kurang > 0 ? kurang : undefined,
    };
  });
};

/**
 * Add komponen ke paket
 */
export const addKomponenPaket = async (
  paketId: string,
  itemId: string,
  jumlah: number
): Promise<PaketKomponen> => {
  const { data, error } = await supabase
    .from('paket_komponen')
    .insert([
      {
        paket_id: paketId,
        item_id: itemId,
        jumlah,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Update komponen paket
 */
export const updateKomponenPaket = async (
  id: string,
  data: Partial<Pick<PaketKomponen, 'item_id' | 'jumlah'>>
): Promise<PaketKomponen> => {
  const { data: komponen, error } = await supabase
    .from('paket_komponen')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return komponen;
};

/**
 * Delete komponen paket
 */
export const deleteKomponenPaket = async (id: string): Promise<void> => {
  const { error } = await supabase.from('paket_komponen').delete().eq('id', id);

  if (error) throw error;
};

/**
 * Replace all komponen paket (untuk bulk update)
 */
export const replaceKomponenPaket = async (
  paketId: string,
  komponen: Array<{ item_id: string; jumlah: number }>
): Promise<void> => {
  // Delete existing komponen
  await supabase.from('paket_komponen').delete().eq('paket_id', paketId);

  // Insert new komponen
  if (komponen.length > 0) {
    const { error } = await supabase.from('paket_komponen').insert(
      komponen.map((k) => ({
        paket_id: paketId,
        item_id: k.item_id,
        jumlah: k.jumlah,
      }))
    );

    if (error) throw error;
  }
};

// =====================================================
// CEK STOK PAKET
// =====================================================

/**
 * Cek apakah stok mencukupi untuk paket
 */
export const cekStokPaket = async (
  paketId: string
): Promise<{
  cukup: boolean;
  komponen: PaketKomponenWithStock[];
  total_kurang: number;
}> => {
  const komponen = await getKomponenPaket(paketId);

  const cukup = komponen.every((k) => k.stok_cukup);
  const totalKurang = komponen.reduce((sum, k) => sum + (k.kurang || 0), 0);

  return {
    cukup,
    komponen,
    total_kurang: totalKurang,
  };
};

// =====================================================
// DISTRIBUSI PAKET
// =====================================================

/**
 * Get all distribusi paket
 */
export const listDistribusiPaket = async (
  filters?: {
    paket_id?: string;
    start_date?: string;
    end_date?: string;
    penerima?: string;
  }
): Promise<DistribusiPaket[]> => {
  let query = supabase
    .from('distribusi_paket')
    .select(`
      *,
      paket_sembako (*)
    `)
    .order('tanggal_distribusi', { ascending: false });

  if (filters?.paket_id) {
    query = query.eq('paket_id', filters.paket_id);
  }

  if (filters?.start_date) {
    query = query.gte('tanggal_distribusi', filters.start_date);
  }

  if (filters?.end_date) {
    query = query.lte('tanggal_distribusi', filters.end_date);
  }

  if (filters?.penerima) {
    query = query.ilike('penerima', `%${filters.penerima}%`);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
};

/**
 * Get distribusi paket by ID
 */
export const getDistribusiPaket = async (id: string): Promise<DistribusiPaket | null> => {
  const { data, error } = await supabase
    .from('distribusi_paket')
    .select(`
      *,
      paket_sembako (*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
};

/**
 * Create distribusi paket dan generate transaksi inventaris
 */
export const createDistribusiPaket = async (
  formData: DistribusiPaketFormData
): Promise<DistribusiPaket> => {
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Cek stok terlebih dahulu
  const cekStok = await cekStokPaket(formData.paket_id);
  if (!cekStok.cukup) {
    throw new Error(
      `Stok tidak mencukupi untuk paket ini. Total kurang: ${cekStok.total_kurang} item.`
    );
  }

  // 2. Create distribusi_paket record
  const { data: distribusi, error: distribusiError } = await supabase
    .from('distribusi_paket')
    .insert([
      {
        ...formData,
        created_by: user?.id,
      },
    ])
    .select()
    .single();

  if (distribusiError) throw distribusiError;

  // 3. Generate transaksi_inventaris untuk setiap komponen
  const komponen = await getKomponenPaket(formData.paket_id);

  const transaksiPromises = komponen.map((k) =>
    supabase.from('transaksi_inventaris').insert({
      item_id: k.item_id,
      tipe: 'Keluar',
      keluar_mode: 'Distribusi',
      jumlah: k.jumlah,
      harga_satuan: null, // Distribusi tidak punya harga
      penerima: formData.penerima,
      tanggal: formData.tanggal_distribusi,
      catatan: `Distribusi paket: ${formData.penerima} - ${formData.catatan || ''}`.trim(),
      referensi_distribusi_paket_id: distribusi.id,
      created_by: user?.id,
    })
  );

  const results = await Promise.all(transaksiPromises);
  const errors = results.filter((r) => r.error).map((r) => r.error);

  if (errors.length > 0) {
    // Rollback: delete distribusi_paket jika transaksi gagal
    await supabase.from('distribusi_paket').delete().eq('id', distribusi.id);
    throw new Error(`Gagal membuat transaksi inventaris: ${errors[0]?.message}`);
  }

  // 4. Get distribusi dengan paket info
  const distribusiWithPaket = await getDistribusiPaket(distribusi.id);
  if (!distribusiWithPaket) throw new Error('Gagal mengambil data distribusi');

  return distribusiWithPaket;
};

/**
 * Update distribusi paket
 */
export const updateDistribusiPaket = async (
  id: string,
  data: Partial<DistribusiPaketFormData>
): Promise<DistribusiPaket> => {
  const { data: distribusi, error } = await supabase
    .from('distribusi_paket')
    .update(data)
    .eq('id', id)
    .select(`
      *,
      paket_sembako (*)
    `)
    .single();

  if (error) throw error;
  return distribusi;
};

/**
 * Delete distribusi paket (dan transaksi terkait)
 * Optimized: Delete transaksi dulu, lalu distribusi (urutan penting untuk constraint)
 */
export const deleteDistribusiPaket = async (id: string): Promise<void> => {
  // 1. Delete transaksi terkait terlebih dahulu (harus sebelum distribusi karena foreign key constraint)
  const transaksiResult = await supabase
    .from('transaksi_inventaris')
    .delete()
    .eq('referensi_distribusi_paket_id', id);

  // Check error transaksi (tidak throw karena mungkin sudah dihapus atau tidak ada)
  if (transaksiResult.error) {
    console.warn('Warning: Error deleting related transactions:', transaksiResult.error);
    // Lanjutkan karena mungkin transaksi sudah dihapus atau tidak ada
  }

  // 2. Delete distribusi setelah transaksi dihapus
  const { error } = await supabase
    .from('distribusi_paket')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// =====================================================
// STATISTIK
// =====================================================

/**
 * Get statistik distribusi paket
 */
export const getStatistikDistribusiPaket = async (filters?: {
  start_date?: string;
  end_date?: string;
}): Promise<{
  total_distribusi: number;
  total_penerima: number;
  paket_terdistribusi: Record<string, number>;
}> => {
  let query = supabase.from('distribusi_paket').select('paket_id, penerima');

  if (filters?.start_date) {
    query = query.gte('tanggal_distribusi', filters.start_date);
  }

  if (filters?.end_date) {
    query = query.lte('tanggal_distribusi', filters.end_date);
  }

  const { data, error } = await query;

  if (error) throw error;

  const distribusi = data || [];
  const totalDistribusi = distribusi.length;
  const uniquePenerima = new Set(distribusi.map((d) => d.penerima));
  const totalPenerima = uniquePenerima.size;

  const paketTerdistribusi: Record<string, number> = {};
  distribusi.forEach((d) => {
    paketTerdistribusi[d.paket_id] = (paketTerdistribusi[d.paket_id] || 0) + 1;
  });

  return {
    total_distribusi: totalDistribusi,
    total_penerima: totalPenerima,
    paket_terdistribusi: paketTerdistribusi,
  };
};

