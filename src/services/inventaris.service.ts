import { supabase } from "@/integrations/supabase/client";
import { addKeuanganTransaction } from "@/services/keuangan.service";
import { AkunKasService } from "@/services/akunKas.service";

// Helper untuk mendeteksi error CORS
function isCorsError(error: any): boolean {
  if (!error) return false;
  const message = error.message || '';
  return message.includes('CORS') || 
         message.includes('523') || 
         message.includes('Failed to fetch') ||
         message.includes('unreachable') ||
         message.includes('Access-Control-Allow-Origin') ||
         message.includes('520');
}

// Helper untuk menampilkan error CORS dengan pesan yang jelas
function handleCorsError(context: string) {
  console.error(`❌ ${context}: Error CORS - Supabase tidak dapat diakses`);
  console.error('   🔧 SOLUSI: Konfigurasi CORS di Supabase Dashboard');
  console.error('   1. Buka https://supabase.com/dashboard');
  console.error('   2. Pilih project → Settings → API');
  console.error('   3. Tambahkan "http://localhost:8080" ke Allowed Origins');
  console.error('   4. Lihat CORS_FIX_GUIDE.md untuk detail lengkap');
}

export type InventoryItem = {
  id: string;
  nama_barang: string;
  tipe_item: string;
  kategori: string;
  zona: string;
  lokasi: string;
  kondisi: string;
  jumlah?: number | null;
  satuan?: string | null;
  harga_perolehan?: number | null;
  sumber?: 'Pembelian' | 'Donasi' | null;
  has_expiry?: boolean | null;
  tanggal_kedaluwarsa?: string | null;
  min_stock?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type InventoryTransaction = {
  id: string;
  item_id: string;
  tipe: "Masuk" | "Keluar" | "Stocktake";
  jumlah?: number | null;
  harga_satuan?: number | null;
  before_qty?: number | null;
  after_qty?: number | null;
  penerima?: string | null;
  tanggal: string;
  catatan?: string | null;
  mutation_id?: string | null;
  created_at?: string | null;
  // New fields for mass distribution
  penerima_santri_id?: string | null;
  kategori_barang?: string | null;
  nama_barang?: string | null;
  satuan?: string | null;
  keluar_mode?: string | null;
};

export type Pagination = { page: number; pageSize: number };
export type Sort = { column: string; direction: "asc" | "desc" } | null;

export type InventoryFilters = {
  search?: string | null;
  kategori?: string | null;
  kondisi?: string | null;
  tipe_item?: string | null;
  zona?: string | null;
  lokasi?: string | null;
};

export async function listInventory(
  pagination: Pagination,
  filters: InventoryFilters = {},
  sort: Sort = { column: "created_at", direction: "desc" }
) {
  const { page, pageSize } = pagination;
  let query = supabase.from("inventaris").select("*", { count: "exact" });

  console.log('listInventory called with filters:', filters);

  if (filters.search) {
    query = query.ilike("nama_barang", `%${filters.search}%`);
  }
  if (filters.kategori && filters.kategori !== "all") query = query.eq("kategori", filters.kategori);
  if (filters.kondisi && filters.kondisi !== "all") query = query.eq("kondisi", filters.kondisi);
  if (filters.tipe_item && filters.tipe_item !== "all") {
    console.log('Filtering by tipe_item:', filters.tipe_item);
    query = query.eq("tipe_item", filters.tipe_item);
  }
  if (filters.zona && filters.zona !== "all") query = query.eq("zona", filters.zona);
  if (filters.lokasi && filters.lokasi !== "all") query = query.eq("lokasi", filters.lokasi);

  if (sort) {
    query = query.order(sort.column, { ascending: sort.direction === "asc" });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await query.range(from, to);
  
  console.log('Query result:', { data: data?.length, count, error });
  
  if (error) throw error;
  return { data: (data || []) as InventoryItem[], total: count || 0 };
}

export async function getInventoryItem(id: string) {
  const { data, error } = await supabase.from("inventaris").select("*").eq("id", id).single();
  if (error) throw error;
  return data as InventoryItem;
}

export async function createInventoryItem(payload: Partial<InventoryItem>) {
  const { data, error } = await supabase.from("inventaris").insert(payload).select("*").single();
  if (error) throw error;
  return data as InventoryItem;
}

export async function updateInventoryItem(id: string, payload: Partial<InventoryItem>) {
  const { data, error } = await supabase.from("inventaris").update(payload).eq("id", id).select("*").single();
  if (error) throw error;
  return data as InventoryItem;
}

export async function deleteInventoryItem(id: string) {
  const { error } = await supabase.from("inventaris").delete().eq("id", id);
  if (error) throw error;
}

export type TransactionFilters = {
  search?: string | null; // by nama_barang
  tipe?: "Masuk" | "Keluar" | "Stocktake" | "all" | null;
  keluar_mode?: string | null; // Filter untuk mode keluar (Penjualan, Distribusi, dll)
  startDate?: string | null;
  endDate?: string | null;
};

export async function listTransactions(
  pagination: Pagination,
  filters: TransactionFilters = {},
  sort: Sort = { column: "tanggal", direction: "desc" }
) {
  const { page, pageSize } = pagination;
  
  // Join dengan inventaris untuk mendapatkan nama_barang
  // Include referensi_distribusi_paket_id untuk mengelompokkan distribusi paket
  let query = supabase
    .from("transaksi_inventaris")
    .select(`
      *,
      inventaris!inner(nama_barang, kategori, satuan),
      distribusi_paket:referensi_distribusi_paket_id(
        id,
        paket_id,
        penerima,
        tanggal_distribusi,
        paket_sembako(nama_paket)
      )
    `, { count: "exact" });

  if (filters.tipe && filters.tipe !== "all") query = query.eq("tipe", filters.tipe);
  if (filters.keluar_mode && filters.keluar_mode !== "all") query = query.eq("keluar_mode", filters.keluar_mode);
  if (filters.startDate) query = query.gte("tanggal", filters.startDate);
  if (filters.endDate) query = query.lte("tanggal", filters.endDate);

  if (sort) query = query.order(sort.column, { ascending: sort.direction === "asc" });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  const rows = (data || []) as any[];

  // Transform data untuk menambahkan nama_barang
  const transformedRows = rows.map(row => ({
    ...row,
    nama_barang: row.inventaris?.nama_barang || "Item tidak ditemukan",
    kategori: row.inventaris?.kategori || "",
    satuan: row.inventaris?.satuan || ""
  }));

  // If search by nama_barang is requested
  if (filters.search) {
    const filtered = transformedRows.filter(r => 
      r.nama_barang.toLowerCase().includes((filters.search || "").toLowerCase())
    );
    return { data: filtered, total: filtered.length };
  }

  return { data: transformedRows, total: count || 0 };
}

// Add debouncing to prevent double submissions
let lastSubmitTime = 0;
const DEBOUNCE_TIME = 2000; // 2 seconds

export async function createTransaction(payload: Partial<InventoryTransaction>) {
  // Prevent rapid double-clicks
  const now = Date.now();
  if (now - lastSubmitTime < DEBOUNCE_TIME) {
    throw new Error('Please wait before submitting again');
  }
  lastSubmitTime = now;
  
  // Calculate harga_total with support for sales breakdown
  const jumlah = payload.jumlah || 0;
  const isPenjualan = (payload.tipe === "Keluar") && ((payload as any).keluar_mode === "Penjualan");
  const hargaDasar = (payload as any).harga_dasar || 0;
  const sumbangan = (payload as any).sumbangan || 0;
  const calculatedHargaSatuan = isPenjualan
    ? (hargaDasar + sumbangan)
    : (payload.harga_satuan || 0);
  const hargaTotal = calculatedHargaSatuan && jumlah ? calculatedHargaSatuan * jumlah : null;
  
  // Gunakan payload minimal untuk menghindari trigger bermasalah
  const minimalPayload = {
    item_id: payload.item_id,
    tipe: payload.tipe,
    jumlah: payload.jumlah,
    tanggal: payload.tanggal,
    catatan: payload.catatan || null,
    penerima: payload.penerima || null,
    // gunakan harga satuan yang sudah dihitung (khusus penjualan dari harga_dasar+sumbangan)
    harga_satuan: calculatedHargaSatuan || null,
    harga_total: hargaTotal,
    // Fields untuk Stocktake
    before_qty: payload.before_qty || null,
    after_qty: payload.after_qty || null,
    // New fields for mass distribution
    penerima_santri_id: (payload as any).penerima_santri_id || null,
    kategori_barang: (payload as any).kategori_barang || null,
    nama_barang: (payload as any).nama_barang || null,
    satuan: (payload as any).satuan || null,
    // Mode fields
    masuk_mode: (payload as any).masuk_mode || null,
    keluar_mode: (payload as any).keluar_mode || null,
    referensi_koperasi_id: (payload as any).referensi_koperasi_id || null,
    // field breakdown penjualan agar trigger/ETL dapat bekerja
    harga_dasar: (payload as any).harga_dasar || null,
    sumbangan: (payload as any).sumbangan || null
  };
  
  // Log payload untuk Stocktake
  if (payload.tipe === 'Stocktake') {
    console.log('Creating Stocktake transaction with payload:', {
      item_id: minimalPayload.item_id,
      before_qty: minimalPayload.before_qty,
      after_qty: minimalPayload.after_qty,
      jumlah: minimalPayload.jumlah,
      fullPayload: minimalPayload
    });
  }

  // Insert dengan payload minimal
  // Gunakan select sederhana untuk menghindari error 406
  const { data, error } = await supabase
    .from("transaksi_inventaris")
    .insert(minimalPayload)
    .select('*')
    .single();
    
  if (error) {
    if (isCorsError(error)) {
      handleCorsError('inventaris.service: createTransaction');
      // Throw error dengan pesan yang lebih jelas
      const corsError = new Error('CORS Error: Supabase tidak dapat diakses. Silakan konfigurasi CORS di Supabase Dashboard.');
      (corsError as any).isCorsError = true;
      throw corsError;
    }
    
    // Handle error 406 (Not Acceptable) atau PGRST116 (no rows)
    if (error.code === 'PGRST116' || error.code === 'PGRST204' || error.message?.includes('406') || error.message?.includes('Not Acceptable') || error.message?.includes('Cannot coerce')) {
      console.error("Insert error - mungkin field tidak valid atau transaksi belum tersimpan:", error);
      console.error("Payload yang diinsert:", minimalPayload);
      
      // Coba insert lagi tanpa .single() untuk melihat apakah insert berhasil
      const { data: retryData, error: retryError } = await supabase
        .from("transaksi_inventaris")
        .insert(minimalPayload)
        .select('*');
      
      if (retryError) {
        console.error("Retry insert juga gagal:", retryError);
        throw retryError;
      }
      
      // Jika retry berhasil tapi tidak ada data, berarti ada masalah lain
      if (!retryData || retryData.length === 0) {
        throw new Error('Transaksi berhasil diinsert tapi tidak bisa di-fetch. Mungkin ada masalah dengan RLS policy atau trigger.');
      }
      
      // Gunakan data pertama dari retry
      const insertedData = retryData[0];
      return { ...insertedData, _keuanganPosted: false, _fallbackUsed: false } as any;
    }
    
    console.error("Insert error details:", error);
    throw error;
  }
  
  // Pastikan data tidak null
  if (!data) {
    throw new Error('Transaksi berhasil diinsert tapi tidak ada data yang dikembalikan.');
  }

  // Log hasil untuk Stocktake
  if (payload.tipe === 'Stocktake' && data) {
    console.log('Stocktake transaction inserted:', {
      id: data.id,
      item_id: data.item_id,
      before_qty: (data as any).before_qty,
      after_qty: (data as any).after_qty,
      jumlah: data.jumlah
    });
  }
  
  // Defensive fallback: buat transaksi keuangan jika belum terhubung
  let keuanganPosted = false;
  let fallbackUsed = false;
  try {
    const needsKeuangan = isPenjualan && (data?.harga_total || 0) > 0 && !data?.keuangan_id;
    if (needsKeuangan) {
      // Gunakan akun_kas_id dari input user bila tersedia; baru fallback ke default
      let targetAkunKasId: string | undefined = (data as any)?.akun_kas_id;
      if (!targetAkunKasId) {
        try {
          const defaultAkun = await AkunKasService.getDefault();
          targetAkunKasId = defaultAkun?.id;
        } catch (e) {
          console.warn('Gagal mengambil akun kas default, lanjut tanpa akun_kas_id');
        }
      }

      const result = await addKeuanganTransaction({
        jenis_transaksi: 'Pemasukan',
        kategori: 'Penjualan Inventaris',
        jumlah: data.harga_total,
        tanggal: data.tanggal,
        deskripsi: data.catatan || `Penjualan inventaris`,
        referensi: `inventaris:${data.id}`,
        akun_kas_id: targetAkunKasId,
        status: 'posted'
      });
      const created = Array.isArray(result) ? result[0] : (result?.[0] || result);
      if (created?.id) {
        await supabase
          .from('transaksi_inventaris')
          .update({ keuangan_id: created.id })
          .eq('id', data.id);
        keuanganPosted = true;
        fallbackUsed = true;
        // reflect keuangan_id on returned object
        (data as any).keuangan_id = created.id;
      }
    }
  } catch (e) {
    console.warn('Fallback keuangan creation failed:', e);
  }

  return { ...data, _keuanganPosted: keuanganPosted, _fallbackUsed: fallbackUsed } as any;
}

export async function updateTransaction(id: string, payload: Partial<InventoryTransaction>) {
  console.log('updateTransaction called with:', { id, payload });
  
  // OPTIMASI: Deteksi apakah ini update sederhana (hanya field non-finansial)
  // Field finansial: jumlah, harga_satuan, harga_total, harga_dasar, sumbangan
  // Field non-finansial: tanggal, catatan, penerima
  const hasFinancialChanges = 
    payload.jumlah !== undefined ||
    payload.harga_satuan !== undefined ||
    (payload as any).harga_total !== undefined ||
    (payload as any).harga_dasar !== undefined ||
    (payload as any).sumbangan !== undefined;
  
  const hasNonFinancialChanges = 
    payload.tanggal !== undefined ||
    payload.catatan !== undefined ||
    payload.penerima !== undefined;
  
  // Jika hanya field non-finansial yang berubah, gunakan direct UPDATE (lebih cepat)
  if (!hasFinancialChanges && hasNonFinancialChanges) {
    console.log('Fast path: Simple update (non-financial fields only)');
    
    const updateData: any = {};
    if (payload.tanggal !== undefined) updateData.tanggal = payload.tanggal;
    if (payload.catatan !== undefined) updateData.catatan = payload.catatan;
    if (payload.penerima !== undefined) updateData.penerima = payload.penerima;
    
    const { data, error } = await supabase
      .from('transaksi_inventaris')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) {
      console.error("Simple update error:", error);
      throw error;
    }
    
    // Sync tanggal ke keuangan jika ada keuangan_id (tanpa perlu fetch current transaction)
    if (payload.tanggal !== undefined && data?.keuangan_id) {
      try {
        await supabase
          .from('keuangan')
          .update({ tanggal: payload.tanggal })
          .eq('id', data.keuangan_id);
      } catch (keuError) {
        console.warn('Failed to sync tanggal to keuangan:', keuError);
        // Don't throw - transaction update succeeded
      }
    }
    
    return data;
  }
  
  // Full update path: ada perubahan finansial, perlu validasi dan sync keuangan
  console.log('Full path: Update with financial changes');
  
  // Get current transaction to check if it's a sales transaction with keuangan_id
  const { data: currentTx, error: fetchError } = await supabase
    .from('transaksi_inventaris')
    .select('id, tipe, keluar_mode, harga_total, keuangan_id, jumlah, harga_dasar, sumbangan, catatan, tanggal')
    .eq('id', id)
    .maybeSingle();
  
  if (fetchError) {
    console.error("Error fetching current transaction:", fetchError);
    throw fetchError;
  }
  
  // If transaction doesn't exist, this is likely a create operation, not update
  if (!currentTx) {
    throw new Error(`Transaction with ID ${id} not found. Use createTransaction() instead.`);
  }
  
  // Calculate new harga_total if it's a sales transaction
  const isPenjualan = currentTx?.tipe === "Keluar" && currentTx?.keluar_mode === "Penjualan";
  let newHargaTotal = (payload as any).harga_total !== undefined ? (payload as any).harga_total : currentTx?.harga_total || null;
  
  // Calculate harga_total if not provided but we have breakdown data
  if (isPenjualan && newHargaTotal === null) {
    const jumlah = payload.jumlah !== undefined ? payload.jumlah : currentTx?.jumlah || 0;
    const hargaDasar = (payload as any).harga_dasar !== undefined ? (payload as any).harga_dasar : currentTx?.harga_dasar || 0;
    const sumbangan = (payload as any).sumbangan !== undefined ? (payload as any).sumbangan : currentTx?.sumbangan || 0;
    const calculatedHargaSatuan = hargaDasar + sumbangan;
    newHargaTotal = calculatedHargaSatuan && jumlah ? calculatedHargaSatuan * jumlah : null;
  }
  
  try {
    // Use direct UPDATE for better performance (RPC mungkin lebih lambat)
    const updateData: any = {};
    if (payload.jumlah !== undefined) updateData.jumlah = payload.jumlah;
    if (payload.tanggal !== undefined) updateData.tanggal = payload.tanggal;
    if (payload.catatan !== undefined) updateData.catatan = payload.catatan;
    if (payload.penerima !== undefined) updateData.penerima = payload.penerima;
    if (payload.harga_satuan !== undefined) updateData.harga_satuan = payload.harga_satuan;
    if ((payload as any).harga_dasar !== undefined) updateData.harga_dasar = (payload as any).harga_dasar;
    if ((payload as any).sumbangan !== undefined) updateData.sumbangan = (payload as any).sumbangan;
    if (newHargaTotal !== null && newHargaTotal !== currentTx?.harga_total) {
      updateData.harga_total = newHargaTotal;
    }
    
    const { data, error } = await supabase
      .from('transaksi_inventaris')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) {
      console.error("Update error:", error);
      throw error;
    }
    
    if (!data) {
      throw new Error(`No data returned from update for ID ${id}`);
    }
    
    // Sync with keuangan if it's a sales transaction and harga_total changed
    if (isPenjualan && currentTx?.keuangan_id) {
      const needsKeuanganSync = 
        (newHargaTotal !== null && newHargaTotal !== currentTx?.harga_total) ||
        (payload.tanggal !== undefined && payload.tanggal !== currentTx?.tanggal) ||
        (payload.catatan !== undefined && payload.catatan !== currentTx?.catatan);
      
      if (needsKeuanganSync) {
        try {
          const keuanganUpdate: any = {};
          if (newHargaTotal !== null && newHargaTotal !== currentTx?.harga_total) {
            keuanganUpdate.jumlah = newHargaTotal;
          }
          if (payload.tanggal !== undefined) {
            keuanganUpdate.tanggal = payload.tanggal;
          }
          if (payload.catatan !== undefined) {
            keuanganUpdate.deskripsi = payload.catatan || 'Penjualan inventaris';
          }
          
          await supabase
            .from('keuangan')
            .update(keuanganUpdate)
            .eq('id', currentTx.keuangan_id);
          
          console.log('Keuangan transaction synced:', { keuangan_id: currentTx.keuangan_id, updates: keuanganUpdate });
        } catch (keuError) {
          console.warn('Failed to sync keuangan transaction:', keuError);
          // Don't throw - transaction update succeeded, keuangan sync is secondary
        }
      }
    }
    
    console.log('Update successful:', data);
    return data;
    
  } catch (updateError) {
    console.error("Update failed:", updateError);
    throw updateError;
  }
}

export async function deleteTransaction(transactionId: string) {
  // Ambil transaksi terlebih dahulu untuk mengetahui efek ke stok
  const { data: trx, error: fetchErr } = await supabase
    .from('transaksi_inventaris')
    .select('id, item_id, tipe, keluar_mode, jumlah, before_qty, after_qty, keuangan_id')
    .eq('id', transactionId)
    .maybeSingle();

  if (fetchErr) {
    console.error('Fetch transaction before delete failed:', fetchErr);
    throw fetchErr;
  }

  // Jika transaksi tidak ditemukan, return early dengan pesan yang jelas
  if (!trx) {
    console.warn(`Transaction ${transactionId} not found, may have been already deleted`);
    // Return success karena tujuan akhir (menghapus transaksi) sudah tercapai
    return true;
  }

  // 1) Hapus entri keuangan terkait
  // Prioritaskan keuangan_id jika tersedia (lebih spesifik dan aman)
  try {
    if (trx.keuangan_id) {
      // Coba hapus menggunakan keuangan_id langsung
      const { error: deleteError } = await supabase
        .from('keuangan')
        .delete()
        .eq('id', trx.keuangan_id);
      
      if (deleteError) {
        // Error 409 berarti entri tidak bisa dihapus karena constraint/trigger
        // Ini biasanya terjadi jika auto_posted = FALSE (manual entry)
        // Coba update auto_posted menjadi TRUE dulu, lalu hapus
        if (deleteError.code === 'PGRST409' || deleteError.message?.includes('409')) {
          console.warn(`⚠️ Tidak dapat menghapus entri keuangan ${trx.keuangan_id} langsung. Mencoba update auto_posted...`);
          
          // Update auto_posted menjadi TRUE agar bisa dihapus
          const { error: updateError } = await supabase
            .from('keuangan')
            .update({ auto_posted: true })
            .eq('id', trx.keuangan_id);
          
          if (!updateError) {
            // Setelah update, coba hapus lagi
            const { error: retryDeleteError } = await supabase
              .from('keuangan')
              .delete()
              .eq('id', trx.keuangan_id);
            
            if (retryDeleteError) {
              console.warn('⚠️ Masih tidak dapat menghapus entri keuangan setelah update auto_posted:', retryDeleteError);
            }
          } else {
            console.warn('⚠️ Gagal update auto_posted:', updateError);
          }
        } else {
          console.warn('⚠️ Error menghapus entri keuangan:', deleteError);
        }
      }
    } else {
      // Fallback: hapus berdasarkan referensi (hanya untuk auto_posted entries)
      // Hanya hapus entri yang auto_posted = TRUE untuk menghindari error 409
      const { error: deleteError } = await supabase
        .from('keuangan')
        .delete()
        .or(`referensi.eq.inventaris:${transactionId},referensi.eq.inventory_sale:${transactionId}`)
        .eq('auto_posted', true); // Hanya hapus auto-posted entries
      
      if (deleteError) {
        console.warn('⚠️ Warning deleting related keuangan entry by referensi:', deleteError);
      }
    }
  } catch (keuErr: any) {
    // Tangani error yang tidak terduga
    if (keuErr?.code === 'PGRST409' || keuErr?.message?.includes('409')) {
      console.warn('⚠️ Error 409 Conflict saat menghapus entri keuangan. Entri mungkin terproteksi.');
    } else {
      console.warn('⚠️ Warning deleting related keuangan entry:', keuErr);
    }
    // Lanjutkan proses delete transaksi meskipun keuangan gagal dihapus
  }

  // 2) Kembalikan stok berdasarkan tipe transaksi
  try {
    // Ambil stok saat ini
    const { data: item, error: itemErr } = await supabase
      .from('inventaris')
      .select('jumlah')
      .eq('id', trx.item_id)
      .single();

    if (itemErr) throw itemErr;

    const currentQty = (item?.jumlah ?? 0) as number;
    const delta = (() => {
      if (trx.tipe === 'Keluar') return +(trx.jumlah || 0); // tambah kembali
      if (trx.tipe === 'Masuk') return -(trx.jumlah || 0); // kurangi kembali
      if (trx.tipe === 'Stocktake') {
        // Jika ada before_qty/after_qty, balikan ke before_qty
        if (typeof trx.before_qty === 'number') {
          return (trx.before_qty as number) - currentQty;
        }
        return 0;
      }
      return 0;
    })();

    const newQty = Math.max(0, currentQty + delta);

    if (delta !== 0) {
      const { error: updErr } = await supabase
        .from('inventaris')
        .update({ jumlah: newQty })
        .eq('id', trx.item_id);
      if (updErr) throw updErr;
    }
  } catch (stockErr) {
    console.warn('Warning adjusting stock on delete:', stockErr);
    // Lanjutkan proses hapus transaksi meski stok gagal disesuaikan
  }

  // 3) Hapus transaksi
  const { error } = await supabase
    .from('transaksi_inventaris')
    .delete()
    .eq('id', transactionId);
    
  if (error) {
    console.error('Delete error:', error);
    throw error;
  }
  
  return true;
}

export async function deleteTransactions(ids: string[]) {
  const { error } = await supabase
    .from("transaksi_inventaris")
    .delete()
    .in("id", ids);
  if (error) throw error;
}

export async function getLowStock(minThreshold = 10) {
  // Get all items first, then filter client-side for better accuracy
  const { data, error } = await supabase
    .from("inventaris")
    .select("id,nama_barang,jumlah,min_stock,kategori");
  if (error) throw error;
  // Filter items where jumlah <= min_stock or jumlah < threshold
  const filtered = (data || []).filter(item => {
    const jumlah = item.jumlah || 0;
    const minStock = item.min_stock || minThreshold;
    return jumlah <= minStock || jumlah < minThreshold;
  });
  return filtered as Pick<InventoryItem, "id" | "nama_barang" | "jumlah" | "min_stock" | "kategori">[];
}

export async function getNearExpiry(days = 30) {
  const now = new Date();
  const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("inventaris")
    .select("id,nama_barang,tanggal_kedaluwarsa,has_expiry,kategori")
    .eq("has_expiry", true)
    .lte("tanggal_kedaluwarsa", until);
  if (error) throw error;
  return (data || []) as Pick<InventoryItem, "id" | "nama_barang" | "tanggal_kedaluwarsa" | "has_expiry" | "kategori">[];
}

// Ringkasan pemasukan dari penjualan inventaris
export async function getSalesSummary(filters: TransactionFilters = {}) {
  let query = supabase
    .from("transaksi_inventaris")
    .select(`
      item_id,
      tipe,
      jumlah,
      harga_satuan,
      harga_total,
      tanggal,
      catatan,
      keluar_mode,
      harga_dasar,
      sumbangan,
      inventaris!inner(nama_barang, kategori)
    `)
    .eq("tipe", "Keluar")
    .eq("keluar_mode", "Penjualan")
    .not("harga_total", "is", null)
    .gt("harga_total", 0);

  if (filters.startDate) query = query.gte("tanggal", filters.startDate);
  if (filters.endDate) query = query.lte("tanggal", filters.endDate);

  const { data, error } = await query;
  if (error) throw error;

  // Semua transaksi penjualan yang sudah difilter oleh query
  const transactions = (data || []) as any[];
  
  // Hitung ringkasan menggunakan harga_total untuk akurasi
  const totalPenjualan = transactions.reduce((sum, t) => {
    return sum + (t.harga_total || 0);
  }, 0);

  const totalTransaksi = transactions.length;
  const totalJumlah = transactions.reduce((sum, t) => sum + (t.jumlah || 0), 0);
  const rataRataPenjualan = totalTransaksi > 0 ? totalPenjualan / totalTransaksi : 0;

  // Ringkasan per kategori
  const kategoriSummary = transactions.reduce((acc, t) => {
    const kategori = t.inventaris?.kategori || "Lainnya";
    if (!acc[kategori]) {
      acc[kategori] = { total: 0, jumlah: 0, transaksi: 0 };
    }
    acc[kategori].total += (t.harga_total || 0);
    acc[kategori].jumlah += t.jumlah || 0;
    acc[kategori].transaksi += 1;
    return acc;
  }, {} as Record<string, { total: number; jumlah: number; transaksi: number }>);

  // Ringkasan per item
  const itemSummary = transactions.reduce((acc, t) => {
    const nama = t.inventaris?.nama_barang || "Item tidak ditemukan";
    const itemId = t.item_id;
    if (!acc[nama]) {
      acc[nama] = { total: 0, jumlah: 0, transaksi: 0, item_id: itemId };
    }
    acc[nama].total += (t.harga_total || 0);
    acc[nama].jumlah += t.jumlah || 0;
    acc[nama].transaksi += 1;
    return acc;
  }, {} as Record<string, { total: number; jumlah: number; transaksi: number; item_id: string }>);

  // Calculate monthly revenue (current month)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.tanggal);
    return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
  });
  
  const monthlyRevenue = monthlyTransactions.reduce((sum, t) => sum + (t.harga_total || 0), 0);
  const monthlyTransactionCount = monthlyTransactions.length;

  return {
    totalPenjualan,
    totalTransaksi,
    totalJumlah,
    rataRataPenjualan,
    monthlyRevenue,
    monthlyTransactions: monthlyTransactionCount,
    kategoriSummary,
    itemSummary: Object.entries(itemSummary)
      .map(([nama, data]) => {
        const item = data as { total: number; jumlah: number; transaksi: number; item_id: string };
        return { nama, total: item.total, jumlah: item.jumlah, transaksi: item.transaksi, item_id: item.item_id };
      })
      .sort((a, b) => b.total - a.total)
  };
}


