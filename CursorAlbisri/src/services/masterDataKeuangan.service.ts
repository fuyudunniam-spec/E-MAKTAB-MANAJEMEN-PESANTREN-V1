/**
 * Service Layer untuk Master Data Keuangan
 * 
 * Menangani:
 * - CRUD Pilar Layanan
 * - CRUD Kategori Pengeluaran
 * - CRUD Sub Kategori Pengeluaran
 * - Mapping Kategori & Sub Kategori ke Santri
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================
// INTERFACES - Pilar Layanan
// ============================================

export interface MasterPilarLayanan {
  id: string;
  kode: string;
  nama: string;
  deskripsi?: string;
  urutan: number;
  warna_badge?: string;
  aktif: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePilarLayananData {
  kode: string;
  nama: string;
  deskripsi?: string;
  urutan?: number;
  warna_badge?: string;
}

export interface UpdatePilarLayananData {
  nama?: string;
  deskripsi?: string;
  urutan?: number;
  warna_badge?: string;
  aktif?: boolean;
}

// ============================================
// INTERFACES - Kategori Pengeluaran
// ============================================

export interface MasterKategoriPengeluaran {
  id: string;
  nama: string;
  jenis: 'Pemasukan' | 'Pengeluaran';
  ledger: 'UMUM';
  pilar_layanan_kode?: string;
  pilar_layanan?: MasterPilarLayanan;
  deskripsi?: string;
  urutan: number;
  aktif: boolean;
  created_at: string;
  updated_at: string;
  // Unified master data fields
  tipe_alokasi?: string | null;
  santri_ids?: string[] | null;
  // Joined data
  sub_kategori?: MasterSubKategoriPengeluaran[];
  santri_mapping?: KategoriSantriMapping;
}

export interface CreateKategoriPengeluaranData {
  nama: string;
  jenis: 'Pemasukan' | 'Pengeluaran';
  pilar_layanan_kode?: string;
  deskripsi?: string;
  urutan?: number;
}

export interface UpdateKategoriPengeluaranData {
  nama?: string;
  pilar_layanan_kode?: string;
  deskripsi?: string;
  urutan?: number;
  aktif?: boolean;
}

// ============================================
// INTERFACES - Sub Kategori Pengeluaran
// ============================================

export interface MasterSubKategoriPengeluaran {
  id: string;
  kategori_id: string;
  nama: string;
  pilar_layanan_kode?: string;
  pilar_layanan?: MasterPilarLayanan;
  deskripsi?: string;
  urutan: number;
  aktif: boolean;
  created_at: string;
  updated_at: string;
  // Unified master data fields
  tipe_alokasi?: string | null;
  santri_ids?: string[] | null;
  // Joined data
  santri_mapping?: SubKategoriSantriMapping;
}

export interface CreateSubKategoriPengeluaranData {
  kategori_id: string;
  nama: string;
  pilar_layanan_kode?: string;
  deskripsi?: string;
  urutan?: number;
}

export interface UpdateSubKategoriPengeluaranData {
  nama?: string;
  pilar_layanan_kode?: string;
  deskripsi?: string;
  urutan?: number;
  aktif?: boolean;
}

// ============================================
// INTERFACES - Mapping Santri
// ============================================

export interface KategoriSantriMapping {
  id: string;
  kategori_id: string;
  tipe_alokasi: 'tidak_dialokasikan' | 'overhead' | 'pilih_santri';
  deskripsi?: string;
  aktif: boolean;
  created_at: string;
  updated_at: string;
  // Joined data (jika tipe_alokasi = 'pilih_santri')
  santri_list?: Array<{
    santri_id: string;
    santri_nama: string;
    santri_id_santri?: string;
  }>;
}

export interface CreateKategoriSantriMappingData {
  kategori_id: string;
  tipe_alokasi: 'tidak_dialokasikan' | 'overhead' | 'pilih_santri' | 'seluruh_binaan_mukim'; // 'seluruh_binaan_mukim' mapped to 'overhead'
  deskripsi?: string;
  santri_ids?: string[]; // Hanya untuk tipe 'pilih_santri'
}

export interface SubKategoriSantriMapping {
  id: string;
  sub_kategori_id: string;
  tipe_alokasi: 'tidak_dialokasikan' | 'overhead' | 'pilih_santri';
  deskripsi?: string;
  aktif: boolean;
  created_at: string;
  updated_at: string;
  // Joined data (jika tipe_alokasi = 'pilih_santri')
  santri_list?: Array<{
    santri_id: string;
    santri_nama: string;
    santri_id_santri?: string;
  }>;
}

export interface CreateSubKategoriSantriMappingData {
  sub_kategori_id: string;
  tipe_alokasi: 'tidak_dialokasikan' | 'overhead' | 'pilih_santri' | 'seluruh_binaan_mukim'; // 'seluruh_binaan_mukim' mapped to 'overhead'
  deskripsi?: string;
  santri_ids?: string[]; // Hanya untuk tipe 'pilih_santri'
}

// ============================================
// SERVICE CLASS
// ============================================

export class MasterDataKeuanganService {
  // ============================================
  // PILAR LAYANAN
  // ============================================

  /**
   * Get semua pilar layanan
   */
  static async getPilarLayanan(aktifOnly: boolean = false): Promise<MasterPilarLayanan[]> {
    try {
      let query = supabase
        .from('master_data_keuangan')
        .select('id, kode, nama, deskripsi, urutan, warna_badge, aktif, created_at, updated_at')
        .eq('level', 'pilar')
        .order('urutan', { ascending: true })
        .order('nama', { ascending: true });

      if (aktifOnly) {
        query = query.eq('aktif', true);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []) as MasterPilarLayanan[];
    } catch (error) {
      console.error('Error getting pilar layanan:', error);
      throw error;
    }
  }

  /**
   * Get pilar layanan by kode
   */
  static async getPilarLayananByKode(kode: string): Promise<MasterPilarLayanan | null> {
    try {
      const { data, error } = await supabase
        .from('master_data_keuangan')
        .select('id, kode, nama, deskripsi, urutan, warna_badge, aktif, created_at, updated_at')
        .eq('level', 'pilar')
        .eq('kode', kode)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return data as MasterPilarLayanan;
    } catch (error) {
      console.error('Error getting pilar layanan by kode:', error);
      throw error;
    }
  }

  /**
   * Create pilar layanan
   */
  static async createPilarLayanan(data: CreatePilarLayananData): Promise<MasterPilarLayanan> {
    try {
      const { data: pilar, error } = await supabase
        .from('master_data_keuangan')
        .insert({
          level: 'pilar',
          kode: data.kode.toLowerCase().replace(/\s+/g, '_'),
          nama: data.nama,
          deskripsi: data.deskripsi || null,
          urutan: data.urutan || 0,
          warna_badge: data.warna_badge || null,
          parent_id: null,
          jenis: null,
          ledger: null,
          pilar_layanan_kode: null,
          tipe_alokasi: null,
          santri_ids: null,
        })
        .select('id, kode, nama, deskripsi, urutan, warna_badge, aktif, created_at, updated_at')
        .single();

      if (error) throw error;
      return pilar as MasterPilarLayanan;
    } catch (error) {
      console.error('Error creating pilar layanan:', error);
      throw error;
    }
  }

  /**
   * Update pilar layanan
   */
  static async updatePilarLayanan(id: string, data: UpdatePilarLayananData): Promise<void> {
    try {
      const { error } = await supabase
        .from('master_data_keuangan')
        .update({
          ...(data.nama && { nama: data.nama }),
          ...(data.deskripsi !== undefined && { deskripsi: data.deskripsi || null }),
          ...(data.urutan !== undefined && { urutan: data.urutan }),
          ...(data.warna_badge !== undefined && { warna_badge: data.warna_badge || null }),
          ...(data.aktif !== undefined && { aktif: data.aktif }),
        })
        .eq('id', id)
        .eq('level', 'pilar');

      if (error) throw error;
    } catch (error) {
      console.error('Error updating pilar layanan:', error);
      throw error;
    }
  }

  /**
   * Delete pilar layanan
   */
  static async deletePilarLayanan(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('master_data_keuangan')
        .delete()
        .eq('id', id)
        .eq('level', 'pilar');

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting pilar layanan:', error);
      throw error;
    }
  }

  /**
   * Check pilar layanan usage
   */
  static async checkPilarLayananUsage(kode: string): Promise<{
    realisasi_layanan_santri: number;
    rancangan_anggaran: number;
    kategori_pengeluaran: number;
    sub_kategori_pengeluaran: number;
  }> {
    try {
      // Check realisasi_layanan_santri
      const { count: realisasiCount } = await supabase
        .from('realisasi_layanan_santri')
        .select('*', { count: 'exact', head: true })
        .eq('pilar_layanan', kode);

      // Check kategori_pengeluaran
      // NOTE: rancangan_anggaran_layanan sudah dihapus, tidak perlu check lagi
      const { count: kategoriCount } = await supabase
        .from('master_data_keuangan')
        .select('*', { count: 'exact', head: true })
        .eq('level', 'kategori')
        .eq('pilar_layanan_kode', kode);

      // Check sub_kategori_pengeluaran
      const { count: subKategoriCount } = await supabase
        .from('master_data_keuangan')
        .select('*', { count: 'exact', head: true })
        .eq('level', 'sub_kategori')
        .eq('pilar_layanan_kode', kode);

      return {
        realisasi_layanan_santri: realisasiCount || 0,
        rancangan_anggaran: 0, // Tabel sudah dihapus
        kategori_pengeluaran: kategoriCount || 0,
        sub_kategori_pengeluaran: subKategoriCount || 0,
      };
    } catch (error) {
      console.error('Error checking pilar layanan usage:', error);
      throw error;
    }
  }

  // ============================================
  // KATEGORI PENGELUARAN
  // ============================================

  /**
   * Get semua kategori pengeluaran
   */
  static async getKategoriPengeluaran(filters?: {
    jenis?: string;
    aktifOnly?: boolean;
  }): Promise<MasterKategoriPengeluaran[]> {
    try {
      // Query categories first (tanpa nested select)
      let query = supabase
        .from('master_data_keuangan')
        .select(`
          id,
          nama,
          jenis,
          ledger,
          kode,
          parent_id,
          deskripsi,
          urutan,
          aktif,
          created_at,
          updated_at,
          tipe_alokasi,
          santri_ids
        `)
        .eq('level', 'kategori')
        .eq('ledger', 'UMUM')
        .order('urutan', { ascending: true })
        .order('nama', { ascending: true });

      if (filters?.jenis) {
        query = query.eq('jenis', filters.jenis);
      }

      if (filters?.aktifOnly) {
        query = query.eq('aktif', true);
      }

      const { data: categoriesData, error } = await query;
      if (error) throw error;

      // Get parent pilar IDs
      const parentIds = [...new Set((categoriesData || [])
        .map(item => item.parent_id)
        .filter(Boolean))];

      // Fetch pilar data separately using parent_id
      let pilarDataMap: Record<string, any> = {};
      if (parentIds.length > 0) {
        const { data: pilarDataResult } = await supabase
          .from('master_data_keuangan')
          .select('id, kode, nama, deskripsi, urutan, warna_badge, aktif, created_at, updated_at')
          .eq('level', 'pilar')
          .in('id', parentIds);
        
        if (pilarDataResult) {
          pilarDataResult.forEach(pilar => {
            pilarDataMap[pilar.id] = pilar;
          });
        }
      }

      // Map categories with pilar data
      return (categoriesData || []).map(item => {
        const pilar = item.parent_id ? pilarDataMap[item.parent_id] : null;
        return {
          id: item.id,
          nama: item.nama,
          jenis: item.jenis as 'Pemasukan' | 'Pengeluaran',
          ledger: item.ledger as 'UMUM',
          pilar_layanan_kode: pilar?.kode || null,
          pilar_layanan: pilar ? {
            id: pilar.id,
            kode: pilar.kode,
            nama: pilar.nama,
            deskripsi: pilar.deskripsi,
            urutan: pilar.urutan,
            warna_badge: pilar.warna_badge,
            aktif: pilar.aktif,
            created_at: pilar.created_at,
            updated_at: pilar.updated_at,
          } : undefined,
          deskripsi: item.deskripsi || undefined,
          urutan: item.urutan,
          aktif: item.aktif,
          created_at: item.created_at,
          updated_at: item.updated_at,
          tipe_alokasi: item.tipe_alokasi,
          santri_ids: item.santri_ids || [],
        };
      });
    } catch (error) {
      console.error('Error getting kategori pengeluaran:', error);
      throw error;
    }
  }

  /**
   * Get kategori pengeluaran by ID
   */
  static async getKategoriPengeluaranById(id: string): Promise<MasterKategoriPengeluaran | null> {
    try {
      // Query category first (tanpa nested select)
      const { data: categoryData, error } = await supabase
        .from('master_data_keuangan')
        .select(`
          id,
          nama,
          jenis,
          ledger,
          kode,
          parent_id,
          deskripsi,
          urutan,
          aktif,
          created_at,
          updated_at,
          tipe_alokasi,
          santri_ids
        `)
        .eq('id', id)
        .eq('level', 'kategori')
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      // Fetch pilar data separately if parent_id exists
      let pilarLayanan: MasterPilarLayanan | undefined = undefined;
      if (categoryData.parent_id) {
        const { data: pilarData } = await supabase
          .from('master_data_keuangan')
          .select('id, kode, nama, deskripsi, urutan, warna_badge, aktif, created_at, updated_at')
          .eq('id', categoryData.parent_id)
          .eq('level', 'pilar')
          .single();
        
        if (pilarData) {
          pilarLayanan = {
            id: pilarData.id,
            kode: pilarData.kode,
            nama: pilarData.nama,
            deskripsi: pilarData.deskripsi,
            urutan: pilarData.urutan,
            warna_badge: pilarData.warna_badge,
            aktif: pilarData.aktif,
            created_at: pilarData.created_at,
            updated_at: pilarData.updated_at,
          };
        }
      }
      
      return {
        id: categoryData.id,
        nama: categoryData.nama,
        jenis: categoryData.jenis as 'Pemasukan' | 'Pengeluaran',
        ledger: 'UMUM' as const,
        pilar_layanan_kode: pilarLayanan?.kode || undefined,
        pilar_layanan: pilarLayanan,
        deskripsi: categoryData.deskripsi || undefined,
        urutan: categoryData.urutan,
        aktif: categoryData.aktif,
        created_at: categoryData.created_at,
        updated_at: categoryData.updated_at,
        tipe_alokasi: categoryData.tipe_alokasi,
        santri_ids: categoryData.santri_ids || [],
      };
    } catch (error) {
      console.error('Error getting kategori pengeluaran by id:', error);
      throw error;
    }
  }

  /**
   * Create kategori pengeluaran
   */
  static async createKategoriPengeluaran(
    data: CreateKategoriPengeluaranData
  ): Promise<MasterKategoriPengeluaran> {
    try {
      // Find parent pilar if pilar_layanan_kode provided
      let parentId: string | null = null;
      if (data.pilar_layanan_kode) {
        const { data: pilarData } = await supabase
          .from('master_data_keuangan')
          .select('id')
          .eq('level', 'pilar')
          .eq('kode', data.pilar_layanan_kode)
          .single();
        
        if (pilarData) {
          parentId = pilarData.id;
        }
      }

      const { data: kategori, error } = await supabase
        .from('master_data_keuangan')
        .insert({
          level: 'kategori',
          nama: data.nama,
          jenis: data.jenis,
          ledger: 'UMUM',
          pilar_layanan_kode: data.pilar_layanan_kode || null,
          deskripsi: data.deskripsi || null,
          urutan: data.urutan || 0,
          parent_id: parentId,
          kode: null,
          tipe_alokasi: 'tidak_dialokasikan',
          santri_ids: [],
        })
        .select(`
          id,
          nama,
          jenis,
          ledger,
          kode,
          parent_id,
          deskripsi,
          urutan,
          aktif,
          created_at,
          updated_at,
          tipe_alokasi,
          santri_ids
        `)
        .single();

      if (error) throw error;

      // Fetch pilar data separately if parent_id exists
      let pilarLayanan: MasterPilarLayanan | undefined = undefined;
      if (kategori.parent_id) {
        const { data: pilarData } = await supabase
          .from('master_data_keuangan')
          .select('id, kode, nama, deskripsi, urutan, warna_badge, aktif, created_at, updated_at')
          .eq('id', kategori.parent_id)
          .eq('level', 'pilar')
          .single();
        
        if (pilarData) {
          pilarLayanan = {
            id: pilarData.id,
            kode: pilarData.kode,
            nama: pilarData.nama,
            deskripsi: pilarData.deskripsi,
            urutan: pilarData.urutan,
            warna_badge: pilarData.warna_badge,
            aktif: pilarData.aktif,
            created_at: pilarData.created_at,
            updated_at: pilarData.updated_at,
          };
        }
      }

      return {
        id: kategori.id,
        nama: kategori.nama,
        jenis: kategori.jenis as 'Pemasukan' | 'Pengeluaran',
        ledger: 'UMUM' as const,
        pilar_layanan_kode: pilarLayanan?.kode || undefined,
        pilar_layanan: pilarLayanan,
        deskripsi: kategori.deskripsi || undefined,
        urutan: kategori.urutan,
        aktif: kategori.aktif,
        created_at: kategori.created_at,
        updated_at: kategori.updated_at,
        tipe_alokasi: kategori.tipe_alokasi,
        santri_ids: kategori.santri_ids || [],
      };
    } catch (error) {
      console.error('Error creating kategori pengeluaran:', error);
      throw error;
    }
  }

  /**
   * Update kategori pengeluaran
   */
  static async updateKategoriPengeluaran(
    id: string,
    data: UpdateKategoriPengeluaranData
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('master_data_keuangan')
        .update({
          ...(data.nama && { nama: data.nama }),
          ...(data.pilar_layanan_kode !== undefined && {
            pilar_layanan_kode: data.pilar_layanan_kode || null,
          }),
          ...(data.deskripsi !== undefined && { deskripsi: data.deskripsi || null }),
          ...(data.urutan !== undefined && { urutan: data.urutan }),
          ...(data.aktif !== undefined && { aktif: data.aktif }),
        })
        .eq('id', id)
        .eq('level', 'kategori');

      if (error) throw error;
    } catch (error) {
      console.error('Error updating kategori pengeluaran:', error);
      throw error;
    }
  }

  /**
   * Delete kategori pengeluaran
   */
  static async deleteKategoriPengeluaran(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('master_data_keuangan')
        .delete()
        .eq('id', id)
        .eq('level', 'kategori');

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting kategori pengeluaran:', error);
      throw error;
    }
  }

  /**
   * Check kategori usage
   */
  static async checkKategoriUsage(id: string): Promise<number> {
    try {
      // Get nama kategori dari master_data_keuangan
      const { data: kategori, error: kategoriError } = await supabase
        .from('master_data_keuangan')
        .select('nama')
        .eq('id', id)
        .eq('level', 'kategori')
        .single();

      if (kategoriError || !kategori) return 0;

      // Check usage di keuangan berdasarkan nama kategori
      const { count, error } = await supabase
        .from('keuangan')
        .select('*', { count: 'exact', head: true })
        .eq('kategori', kategori.nama);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error checking kategori usage:', error);
      throw error;
    }
  }

  // ============================================
  // SUB KATEGORI PENGELUARAN
  // ============================================

  /**
   * Get sub kategori by kategori ID
   */
  static async getSubKategoriByKategori(
    kategoriId: string
  ): Promise<MasterSubKategoriPengeluaran[]> {
    try {
      // Query sub categories first (tanpa nested select)
      const { data: subKategoriData, error } = await supabase
        .from('master_data_keuangan')
        .select(`
          id,
          parent_id,
          nama,
          pilar_layanan_kode,
          deskripsi,
          urutan,
          aktif,
          created_at,
          updated_at,
          tipe_alokasi,
          santri_ids
        `)
        .eq('level', 'sub_kategori')
        .eq('parent_id', kategoriId)
        .order('urutan', { ascending: true })
        .order('nama', { ascending: true });

      if (error) throw error;

      // Get pilar kode yang digunakan
      const pilarKodes = [...new Set((subKategoriData || [])
        .map(item => item.pilar_layanan_kode)
        .filter(Boolean))];

      // Fetch pilar data separately
      let pilarDataMap: Record<string, any> = {};
      if (pilarKodes.length > 0) {
        const { data: pilarDataResult } = await supabase
          .from('master_data_keuangan')
          .select('id, kode, nama, deskripsi, urutan, warna_badge, aktif, created_at, updated_at')
          .eq('level', 'pilar')
          .in('kode', pilarKodes);
        
        if (pilarDataResult) {
          pilarDataResult.forEach(pilar => {
            pilarDataMap[pilar.kode] = pilar;
          });
        }
      }

      return (subKategoriData || []).map(item => {
        const pilar = item.pilar_layanan_kode ? pilarDataMap[item.pilar_layanan_kode] : null;
        return {
          id: item.id,
          kategori_id: item.parent_id,
          nama: item.nama,
          pilar_layanan_kode: item.pilar_layanan_kode || undefined,
          pilar_layanan: pilar ? {
            id: pilar.id,
            kode: pilar.kode,
            nama: pilar.nama,
            deskripsi: pilar.deskripsi,
            urutan: pilar.urutan,
            warna_badge: pilar.warna_badge,
            aktif: pilar.aktif,
            created_at: pilar.created_at,
            updated_at: pilar.updated_at,
          } : undefined,
          deskripsi: item.deskripsi || undefined,
          urutan: item.urutan,
          aktif: item.aktif,
          created_at: item.created_at,
          updated_at: item.updated_at,
          tipe_alokasi: item.tipe_alokasi,
          santri_ids: item.santri_ids || [],
        };
      });
    } catch (error) {
      console.error('Error getting sub kategori:', error);
      throw error;
    }
  }

  /**
   * Get sub kategori count per kategori
   */
  static async getSubKategoriCountByKategori(
    kategoriIds: string[]
  ): Promise<Record<string, number>> {
    try {
      if (kategoriIds.length === 0) return {};

      const { data, error } = await supabase
        .from('master_data_keuangan')
        .select('parent_id')
        .eq('level', 'sub_kategori')
        .in('parent_id', kategoriIds);

      if (error) throw error;

      // Count sub kategori per kategori
      const counts: Record<string, number> = {};
      kategoriIds.forEach(id => {
        counts[id] = 0;
      });

      (data || []).forEach(item => {
        if (counts[item.parent_id] !== undefined) {
          counts[item.parent_id] = (counts[item.parent_id] || 0) + 1;
        }
      });

      return counts;
    } catch (error) {
      console.error('Error getting sub kategori count:', error);
      throw error;
    }
  }

  /**
   * Create sub kategori
   */
  static async createSubKategori(
    data: CreateSubKategoriPengeluaranData
  ): Promise<MasterSubKategoriPengeluaran> {
    try {
      const { data: subKategori, error } = await supabase
        .from('master_data_keuangan')
        .insert({
          level: 'sub_kategori',
          parent_id: data.kategori_id,
          nama: data.nama,
          pilar_layanan_kode: data.pilar_layanan_kode || null,
          deskripsi: data.deskripsi || null,
          urutan: data.urutan || 0,
          kode: null,
          jenis: null,
          ledger: null,
          tipe_alokasi: 'tidak_dialokasikan',
          santri_ids: [],
        })
        .select(`
          id,
          parent_id,
          nama,
          pilar_layanan_kode,
          deskripsi,
          urutan,
          aktif,
          created_at,
          updated_at,
          tipe_alokasi,
          santri_ids
        `)
        .single();

      if (error) throw error;

      // Fetch pilar data separately if pilar_layanan_kode exists
      let pilarLayanan: MasterPilarLayanan | undefined = undefined;
      if (subKategori.pilar_layanan_kode) {
        const { data: pilarData } = await supabase
          .from('master_data_keuangan')
          .select('id, kode, nama, deskripsi, urutan, warna_badge, aktif, created_at, updated_at')
          .eq('level', 'pilar')
          .eq('kode', subKategori.pilar_layanan_kode)
          .single();
        
        if (pilarData) {
          pilarLayanan = {
            id: pilarData.id,
            kode: pilarData.kode,
            nama: pilarData.nama,
            deskripsi: pilarData.deskripsi,
            urutan: pilarData.urutan,
            warna_badge: pilarData.warna_badge,
            aktif: pilarData.aktif,
            created_at: pilarData.created_at,
            updated_at: pilarData.updated_at,
          };
        }
      }

      return {
        id: subKategori.id,
        kategori_id: subKategori.parent_id,
        nama: subKategori.nama,
        pilar_layanan_kode: subKategori.pilar_layanan_kode || undefined,
        pilar_layanan: pilarLayanan,
        deskripsi: subKategori.deskripsi || undefined,
        urutan: subKategori.urutan,
        aktif: subKategori.aktif,
        created_at: subKategori.created_at,
        updated_at: subKategori.updated_at,
        tipe_alokasi: subKategori.tipe_alokasi,
        santri_ids: subKategori.santri_ids || [],
      };
    } catch (error) {
      console.error('Error creating sub kategori:', error);
      throw error;
    }
  }

  /**
   * Update sub kategori
   */
  static async updateSubKategori(
    id: string,
    data: UpdateSubKategoriPengeluaranData
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('master_data_keuangan')
        .update({
          ...(data.nama && { nama: data.nama }),
          ...(data.pilar_layanan_kode !== undefined && {
            pilar_layanan_kode: data.pilar_layanan_kode || null,
          }),
          ...(data.deskripsi !== undefined && { deskripsi: data.deskripsi || null }),
          ...(data.urutan !== undefined && { urutan: data.urutan }),
          ...(data.aktif !== undefined && { aktif: data.aktif }),
        })
        .eq('id', id)
        .eq('level', 'sub_kategori');

      if (error) throw error;
    } catch (error) {
      console.error('Error updating sub kategori:', error);
      throw error;
    }
  }

  /**
   * Delete sub kategori
   */
  static async deleteSubKategori(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('master_data_keuangan')
        .delete()
        .eq('id', id)
        .eq('level', 'sub_kategori');

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting sub kategori:', error);
      throw error;
    }
  }

  // ============================================
  // MAPPING SANTRI - KATEGORI
  // ============================================

  /**
   * Get mapping santri untuk kategori
   */
  static async getSantriMappingByKategori(
    kategoriId: string
  ): Promise<KategoriSantriMapping | null> {
    try {
      const { data, error } = await supabase
        .from('master_data_keuangan')
        .select('id, tipe_alokasi, deskripsi, aktif, created_at, updated_at, santri_ids')
        .eq('id', kategoriId)
        .eq('level', 'kategori')
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      if (!data) return null;

      // Map 'seluruh_binaan_mukim' to 'overhead' for backward compatibility
      let tipeAlokasi = (data.tipe_alokasi || 'tidak_dialokasikan') as 'tidak_dialokasikan' | 'overhead' | 'pilih_santri';
      if (tipeAlokasi === 'seluruh_binaan_mukim' as any) {
        tipeAlokasi = 'overhead';
      }
      const mapping: KategoriSantriMapping = {
        id: data.id,
        kategori_id: kategoriId,
        tipe_alokasi: tipeAlokasi,
        deskripsi: data.deskripsi || undefined,
        aktif: data.aktif,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      // Load santri list jika tipe = 'pilih_santri' dan ada santri_ids
      if (tipeAlokasi === 'pilih_santri' && data.santri_ids && Array.isArray(data.santri_ids) && data.santri_ids.length > 0) {
        const santriIds = data.santri_ids as string[];
        const { data: santriData, error: santriError } = await supabase
          .from('santri')
          .select('id, nama_lengkap, id_santri')
          .in('id', santriIds);

        if (!santriError && santriData) {
          mapping.santri_list = santriData.map(santri => ({
            santri_id: santri.id,
            santri_nama: santri.nama_lengkap,
            santri_id_santri: santri.id_santri || undefined,
          }));
        }
      }

      return mapping;
    } catch (error) {
      console.error('Error getting kategori santri mapping:', error);
      throw error;
    }
  }

  /**
   * Get mapping santri untuk kategori (by nama)
   */
  static async getSantriMappingByKategoriNama(
    namaKategori: string
  ): Promise<KategoriSantriMapping | null> {
    try {
      // Cari kategori dulu
      const { data: kategori, error: kategoriError } = await supabase
        .from('master_data_keuangan')
        .select('id')
        .eq('level', 'kategori')
        .eq('nama', namaKategori)
        .eq('ledger', 'UMUM')
        .single();

      if (kategoriError || !kategori) return null;

      return this.getSantriMappingByKategori(kategori.id);
    } catch (error) {
      console.error('Error getting kategori santri mapping by nama:', error);
      throw error;
    }
  }

  /**
   * Get kategori by nama
   */
  static async getKategoriByNama(nama: string): Promise<MasterKategoriPengeluaran | null> {
    try {
      // Query category first - jangan include kode karena kategori tidak punya kode
      // Use ilike with exact pattern for case-insensitive exact match
      // This handles URL encoding better than eq with spaces
      const { data: categoryData, error } = await supabase
        .from('master_data_keuangan')
        .select('id, nama, jenis, ledger, pilar_layanan_kode, parent_id, deskripsi, urutan, aktif, created_at, updated_at, tipe_alokasi, santri_ids')
        .eq('level', 'kategori')
        .ilike('nama', nama.replace(/%/g, '\\%').replace(/_/g, '\\_')) // Escape special chars and use ilike for exact match
        .eq('ledger', 'UMUM')
        .eq('aktif', true)
        .maybeSingle();
      
      if (error) {
        console.error('Error getting kategori by nama:', error, { nama });
        throw error;
      }
      if (!categoryData) return null;
      
      // Fetch pilar data separately using pilar_layanan_kode
      let pilarLayanan: MasterPilarLayanan | undefined = undefined;
      if (categoryData.pilar_layanan_kode) {
        const { data: pilarData } = await supabase
          .from('master_data_keuangan')
          .select('id, kode, nama, deskripsi, urutan, warna_badge, aktif, created_at, updated_at')
          .eq('level', 'pilar')
          .eq('kode', categoryData.pilar_layanan_kode)
          .single();
        
        if (pilarData) {
          pilarLayanan = {
            id: pilarData.id,
            kode: pilarData.kode,
            nama: pilarData.nama,
            deskripsi: pilarData.deskripsi,
            urutan: pilarData.urutan,
            warna_badge: pilarData.warna_badge,
            aktif: pilarData.aktif,
            created_at: pilarData.created_at,
            updated_at: pilarData.updated_at,
          };
        }
      } else if (categoryData.parent_id) {
        // Alternative: try to find pilar by parent_id if pilar_layanan_kode is null
        const { data: pilarData } = await supabase
          .from('master_data_keuangan')
          .select('id, kode, nama, deskripsi, urutan, warna_badge, aktif, created_at, updated_at')
          .eq('id', categoryData.parent_id)
          .eq('level', 'pilar')
          .maybeSingle();
        
        if (pilarData) {
          pilarLayanan = {
            id: pilarData.id,
            kode: pilarData.kode,
            nama: pilarData.nama,
            deskripsi: pilarData.deskripsi,
            urutan: pilarData.urutan,
            warna_badge: pilarData.warna_badge,
            aktif: pilarData.aktif,
            created_at: pilarData.created_at,
            updated_at: pilarData.updated_at,
          };
        }
      }
      
      return {
        id: categoryData.id,
        nama: categoryData.nama,
        jenis: categoryData.jenis as 'Pemasukan' | 'Pengeluaran',
        ledger: 'UMUM' as const,
        pilar_layanan_kode: pilarLayanan?.kode || categoryData.pilar_layanan_kode || undefined,
        pilar_layanan: pilarLayanan,
        deskripsi: categoryData.deskripsi || undefined,
        urutan: categoryData.urutan,
        aktif: categoryData.aktif,
        created_at: categoryData.created_at,
        updated_at: categoryData.updated_at,
        tipe_alokasi: categoryData.tipe_alokasi || null,
        santri_ids: categoryData.santri_ids || [],
      };
    } catch (error) {
      console.error('Error getting kategori by nama:', error, { nama });
      return null;
    }
  }

  /**
   * Get sub kategori by nama
   */
  static async getSubKategoriByNama(nama: string): Promise<MasterSubKategoriPengeluaran | null> {
    try {
      // Query sub category first - jangan include kode karena sub_kategori tidak punya kode
      // Use ilike with exact pattern for case-insensitive exact match
      // This handles URL encoding better than eq with spaces
      const { data: subKategoriData, error } = await supabase
        .from('master_data_keuangan')
        .select('id, parent_id, nama, pilar_layanan_kode, deskripsi, urutan, aktif, created_at, updated_at, tipe_alokasi, santri_ids')
        .eq('level', 'sub_kategori')
        .ilike('nama', nama.replace(/%/g, '\\%').replace(/_/g, '\\_')) // Escape special chars and use ilike for exact match
        .eq('aktif', true)
        .maybeSingle();
      
      if (error) {
        console.error('Error getting sub kategori by nama:', error, { nama });
        throw error;
      }
      if (!subKategoriData) return null;
      
      // Fetch pilar data separately using pilar_layanan_kode
      let pilarLayanan: MasterPilarLayanan | undefined = undefined;
      if (subKategoriData.pilar_layanan_kode) {
        const { data: pilarData } = await supabase
          .from('master_data_keuangan')
          .select('id, kode, nama, deskripsi, urutan, warna_badge, aktif, created_at, updated_at')
          .eq('level', 'pilar')
          .eq('kode', subKategoriData.pilar_layanan_kode)
          .maybeSingle();
        
        if (pilarData) {
          pilarLayanan = {
            id: pilarData.id,
            kode: pilarData.kode,
            nama: pilarData.nama,
            deskripsi: pilarData.deskripsi,
            urutan: pilarData.urutan,
            warna_badge: pilarData.warna_badge,
            aktif: pilarData.aktif,
            created_at: pilarData.created_at,
            updated_at: pilarData.updated_at,
          };
        }
      }
      
      return {
        id: subKategoriData.id,
        kategori_id: subKategoriData.parent_id,
        nama: subKategoriData.nama,
        pilar_layanan_kode: pilarLayanan?.kode || subKategoriData.pilar_layanan_kode || undefined,
        pilar_layanan: pilarLayanan,
        deskripsi: subKategoriData.deskripsi || undefined,
        urutan: subKategoriData.urutan,
        aktif: subKategoriData.aktif,
        created_at: subKategoriData.created_at,
        updated_at: subKategoriData.updated_at,
        tipe_alokasi: subKategoriData.tipe_alokasi || null,
        santri_ids: subKategoriData.santri_ids || [],
      };
    } catch (error) {
      console.error('Error getting sub kategori by nama:', error, { nama });
      return null;
    }
  }

  /**
   * Save mapping santri untuk kategori
   */
  static async saveKategoriSantriMapping(
    data: CreateKategoriSantriMappingData
  ): Promise<KategoriSantriMapping> {
    try {
      // Update mapping langsung di master_data_keuangan
      const updateData: any = {
        tipe_alokasi: data.tipe_alokasi === 'seluruh_binaan_mukim' ? 'overhead' : data.tipe_alokasi,
        ...(data.deskripsi !== undefined && { deskripsi: data.deskripsi || null }),
      };

      // Set santri_ids untuk tipe 'pilih_santri'
      if (data.tipe_alokasi === 'pilih_santri' && data.santri_ids && data.santri_ids.length > 0) {
        updateData.santri_ids = data.santri_ids;
      } else {
        updateData.santri_ids = [];
      }

      const { error: updateError } = await supabase
        .from('master_data_keuangan')
        .update(updateData)
        .eq('id', data.kategori_id)
        .eq('level', 'kategori');

      if (updateError) throw updateError;

      return this.getSantriMappingByKategori(data.kategori_id) as Promise<KategoriSantriMapping>;
    } catch (error) {
      console.error('Error saving kategori santri mapping:', error);
      throw error;
    }
  }

  /**
   * Get santri list untuk mapping kategori (deprecated - use getSantriMappingByKategori instead)
   */
  static async getKategoriSantriListByMapping(
    mappingId: string
  ): Promise<Array<{
    santri_id: string;
    santri_nama: string;
    santri_id_santri?: string;
  }>> {
    try {
      // Get mapping data from master_data_keuangan
      const { data, error } = await supabase
        .from('master_data_keuangan')
        .select('santri_ids')
        .eq('id', mappingId)
        .eq('level', 'kategori')
        .single();

      if (error) throw error;
      if (!data || !data.santri_ids || !Array.isArray(data.santri_ids)) return [];

      const santriIds = data.santri_ids as string[];
      if (santriIds.length === 0) return [];

      const { data: santriData, error: santriError } = await supabase
        .from('santri')
        .select('id, nama_lengkap, id_santri')
        .in('id', santriIds);

      if (santriError) throw santriError;

      return (santriData || []).map(santri => ({
        santri_id: santri.id,
        santri_nama: santri.nama_lengkap,
        santri_id_santri: santri.id_santri || undefined,
      }));
    } catch (error) {
      console.error('Error getting kategori santri list:', error);
      throw error;
    }
  }

  // ============================================
  // MAPPING SANTRI - SUB KATEGORI
  // ============================================

  /**
   * Get mapping santri untuk sub kategori
   */
  static async getSantriMappingBySubKategori(
    subKategoriId: string
  ): Promise<SubKategoriSantriMapping | null> {
    try {
      const { data, error } = await supabase
        .from('master_data_keuangan')
        .select('id, tipe_alokasi, deskripsi, aktif, created_at, updated_at, santri_ids')
        .eq('id', subKategoriId)
        .eq('level', 'sub_kategori')
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      if (!data) return null;

      // Map 'seluruh_binaan_mukim' to 'overhead' for backward compatibility
      let tipeAlokasi = (data.tipe_alokasi || 'tidak_dialokasikan') as 'tidak_dialokasikan' | 'overhead' | 'pilih_santri';
      if (tipeAlokasi === 'seluruh_binaan_mukim' as any) {
        tipeAlokasi = 'overhead';
      }
      const mapping: SubKategoriSantriMapping = {
        id: data.id,
        sub_kategori_id: subKategoriId,
        tipe_alokasi: tipeAlokasi,
        deskripsi: data.deskripsi || undefined,
        aktif: data.aktif,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      // Load santri list jika tipe = 'pilih_santri' dan ada santri_ids
      if (tipeAlokasi === 'pilih_santri' && data.santri_ids && Array.isArray(data.santri_ids) && data.santri_ids.length > 0) {
        const santriIds = data.santri_ids as string[];
        const { data: santriData, error: santriError } = await supabase
          .from('santri')
          .select('id, nama_lengkap, id_santri')
          .in('id', santriIds);

        if (!santriError && santriData) {
          mapping.santri_list = santriData.map(santri => ({
            santri_id: santri.id,
            santri_nama: santri.nama_lengkap,
            santri_id_santri: santri.id_santri || undefined,
          }));
        }
      }

      return mapping;
    } catch (error) {
      console.error('Error getting sub kategori santri mapping:', error);
      throw error;
    }
  }

  /**
   * Get mapping santri untuk sub kategori (by nama)
   */
  static async getSantriMappingBySubKategoriNama(
    namaSubKategori: string
  ): Promise<SubKategoriSantriMapping | null> {
    try {
      // Cari sub kategori dulu
      const { data: subKategori, error: subKategoriError } = await supabase
        .from('master_data_keuangan')
        .select('id')
        .eq('level', 'sub_kategori')
        .eq('nama', namaSubKategori)
        .single();

      if (subKategoriError || !subKategori) return null;

      return this.getSantriMappingBySubKategori(subKategori.id);
    } catch (error) {
      console.error('Error getting sub kategori santri mapping by nama:', error);
      throw error;
    }
  }

  /**
   * Save mapping santri untuk sub kategori
   */
  static async saveSubKategoriSantriMapping(
    data: CreateSubKategoriSantriMappingData
  ): Promise<SubKategoriSantriMapping> {
    try {
      // Update mapping langsung di master_data_keuangan
      const updateData: any = {
        tipe_alokasi: data.tipe_alokasi === 'seluruh_binaan_mukim' ? 'overhead' : data.tipe_alokasi,
        ...(data.deskripsi !== undefined && { deskripsi: data.deskripsi || null }),
      };

      // Set santri_ids untuk tipe 'pilih_santri'
      if (data.tipe_alokasi === 'pilih_santri' && data.santri_ids && data.santri_ids.length > 0) {
        updateData.santri_ids = data.santri_ids;
      } else {
        updateData.santri_ids = [];
      }

      const { error: updateError } = await supabase
        .from('master_data_keuangan')
        .update(updateData)
        .eq('id', data.sub_kategori_id)
        .eq('level', 'sub_kategori');

      if (updateError) throw updateError;

      return this.getSantriMappingBySubKategori(
        data.sub_kategori_id
      ) as Promise<SubKategoriSantriMapping>;
    } catch (error) {
      console.error('Error saving sub kategori santri mapping:', error);
      throw error;
    }
  }

  /**
   * Get santri list untuk mapping sub kategori (deprecated - use getSantriMappingBySubKategori instead)
   */
  static async getSubKategoriSantriListByMapping(
    mappingId: string
  ): Promise<Array<{
    santri_id: string;
    santri_nama: string;
    santri_id_santri?: string;
  }>> {
    try {
      // Get mapping data from master_data_keuangan
      const { data, error } = await supabase
        .from('master_data_keuangan')
        .select('santri_ids')
        .eq('id', mappingId)
        .eq('level', 'sub_kategori')
        .single();

      if (error) throw error;
      if (!data || !data.santri_ids || !Array.isArray(data.santri_ids)) return [];

      const santriIds = data.santri_ids as string[];
      if (santriIds.length === 0) return [];

      const { data: santriData, error: santriError } = await supabase
        .from('santri')
        .select('id, nama_lengkap, id_santri')
        .in('id', santriIds);

      if (santriError) throw santriError;

      return (santriData || []).map(santri => ({
        santri_id: santri.id,
        santri_nama: santri.nama_lengkap,
        santri_id_santri: santri.id_santri || undefined,
      }));
    } catch (error) {
      console.error('Error getting sub kategori santri list:', error);
      throw error;
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Get semua santri Binaan Mukim aktif
   */
  static async getAllBinaanMukimAktif(): Promise<Array<{
    id: string;
    nama_lengkap: string;
    id_santri?: string;
  }>> {
    try {
      const { data, error } = await supabase
        .from('santri')
        .select('id, nama_lengkap, id_santri')
        .eq('kategori', 'Binaan Mukim')
        .eq('status', 'Aktif')
        .order('nama_lengkap', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting all binaan mukim aktif:', error);
      throw error;
    }
  }

  /**
   * Search santri untuk mapping
   */
  static async searchSantriForMapping(filters?: {
    search?: string;
    kategori?: string;
    status?: string;
  }): Promise<Array<{
    id: string;
    nama_lengkap: string;
    id_santri?: string;
    kategori: string;
    status: string;
  }>> {
    try {
      let query = supabase
        .from('santri')
        .select('id, nama_lengkap, id_santri, kategori, status')
        .order('nama_lengkap', { ascending: true });

      if (filters?.search) {
        query = query.or(
          `nama_lengkap.ilike.%${filters.search}%,id_santri.ilike.%${filters.search}%`
        );
      }

      if (filters?.kategori && filters.kategori !== 'Semua') {
        query = query.eq('kategori', filters.kategori);
      }

      if (filters?.status && filters.status !== 'Semua') {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        nama_lengkap: item.nama_lengkap,
        id_santri: item.id_santri || undefined,
        kategori: item.kategori || '',
        status: item.status || '',
      }));
    } catch (error) {
      console.error('Error searching santri for mapping:', error);
      throw error;
    }
  }

  /**
   * Get mapping dengan prioritas (untuk form pengeluaran)
   * Prioritas: Sub Kategori → Kategori
   */
  static async getMappingWithPriority(
    kategori: string,
    subKategori?: string
  ): Promise<{
    mapping: KategoriSantriMapping | SubKategoriSantriMapping | null;
    source: 'kategori' | 'sub_kategori' | null;
  }> {
    try {
      // 1. Cek mapping di sub kategori dulu (prioritas tertinggi)
      if (subKategori) {
        const subMapping = await this.getSantriMappingBySubKategoriNama(subKategori);
        if (subMapping && subMapping.aktif) {
          return {
            mapping: subMapping,
            source: 'sub_kategori',
          };
        }
      }

      // 2. Jika tidak ada, cek mapping di kategori
      const kategoriMapping = await this.getSantriMappingByKategoriNama(kategori);
      if (kategoriMapping && kategoriMapping.aktif) {
        return {
          mapping: kategoriMapping,
          source: 'kategori',
        };
      }

      // 3. Jika tidak ada, tidak ada mapping
      return {
        mapping: null,
        source: null,
      };
    } catch (error) {
      console.error('Error getting mapping with priority:', error);
      throw error;
    }
  }
}

