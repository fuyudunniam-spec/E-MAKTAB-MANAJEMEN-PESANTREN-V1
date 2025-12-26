import { supabase } from '@/integrations/supabase/client';

// ============================================
// TYPES
// ============================================

export type PilarPelayanan = 
  | 'pendidikan_formal'
  | 'pendidikan_pesantren'
  | 'operasional_konsumsi'
  | 'bantuan_langsung';

export type StatusRancangan = 'draft' | 'aktif' | 'selesai' | 'dibatalkan';
export type StatusPemenuhan = 'belum_terpenuhi' | 'terlayani' | 'tercukupi';

export interface RancanganPelayanan {
  id: string;
  santri_id: string;
  tahun: number;
  periode?: string;
  semester_id?: string | null;
  status: StatusRancangan;
  total_target: number;
  total_dukungan: number;
  persentase_pemenuhan: number;
  status_pemenuhan: StatusPemenuhan;
  catatan?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Relations
  santri?: {
    id: string;
    nama_lengkap: string;
    id_santri?: string;
    jenjang_sekolah?: string;
    foto_profil?: string;
  };
  pilar?: RancanganPilar[];
  riwayat_dukungan?: RiwayatDukungan[];
}

export interface RancanganPilar {
  id: string;
  rancangan_id: string;
  pilar: PilarPelayanan;
  nama_pilar: string;
  target_biaya: number;
  dukungan_masuk: number;
  persentase_pemenuhan: number;
  rincian_biaya?: any;
  catatan?: string;
  created_at: string;
  updated_at: string;
}

export interface RiwayatDukungan {
  id: string;
  rancangan_id: string;
  pilar_id?: string;
  donation_id?: string;
  donor_name?: string;
  donor_id?: string;
  jumlah_dukungan: number;
  alokasi_per_pilar?: Record<PilarPelayanan, number>;
  tanggal_dukungan: string;
  status: 'terkonfirmasi' | 'pending' | 'dibatalkan';
  catatan?: string;
  created_at: string;
  updated_at: string;
  // Relations
  donation?: {
    id: string;
    donor_name: string;
    donation_date: string;
    cash_amount?: number;
  };
}

export interface CreateRancanganInput {
  santri_id: string;
  tahun: number;
  periode?: string;
  status?: StatusRancangan;
  catatan?: string;
  pilar: Array<{
    pilar: PilarPelayanan;
    nama_pilar: string;
    target_biaya: number;
    rincian_biaya?: any;
    catatan?: string;
  }>;
}

export interface UpdateRancanganInput {
  tahun?: number;
  periode?: string;
  status?: StatusRancangan;
  catatan?: string;
  pilar?: Array<{
    id?: string;
    pilar: PilarPelayanan;
    nama_pilar: string;
    target_biaya: number;
    rincian_biaya?: any;
    catatan?: string;
  }>;
}

export interface CreateDukunganInput {
  rancangan_id: string;
  donation_id?: string;
  donor_name?: string;
  donor_id?: string;
  jumlah_dukungan: number;
  alokasi_per_pilar?: Record<PilarPelayanan, number>;
  tanggal_dukungan: string;
  status?: 'terkonfirmasi' | 'pending' | 'dibatalkan';
  catatan?: string;
}

export interface RancanganStatistik {
  total_rancangan: number;
  rancangan_aktif: number;
  santri_tercukupi: number;
  santri_terlayani: number;
  santri_belum_terpenuhi: number;
  total_target_keseluruhan: number;
  total_dukungan_keseluruhan: number;
  total_kekurangan_dukungan: number;
  persentase_pemenuhan_keseluruhan: number;
}

// ============================================
// CONSTANTS
// ============================================

export const PILAR_PELAYANAN_CONFIG: Record<PilarPelayanan, { label: string; color: string; description: string; icon: string }> = {
  pendidikan_formal: {
    label: 'Layanan Pendidikan Formal',
    color: 'slate',
    description: 'Sekolah luar/instansi formal',
    icon: 'GraduationCap'
  },
  pendidikan_pesantren: {
    label: 'Layanan Pendidikan Pesantren',
    color: 'blue',
    description: 'Inovasi & pendidikan internal - Income Yayasan',
    icon: 'BookOpen'
  },
  operasional_konsumsi: {
    label: 'Layanan Operasional dan Konsumsi Santri',
    color: 'green',
    description: 'Konsumsi, listrik, wifi - Kolektif',
    icon: 'Utensils'
  },
  bantuan_langsung: {
    label: 'Layanan Bantuan Langsung',
    color: 'orange',
    description: 'Kesehatan & kebutuhan darurat',
    icon: 'HeartHandshake'
  }
};

// ============================================
// SERVICE FUNCTIONS
// ============================================

export class RancanganPelayananService {
  /**
   * Get daftar batch yang sudah dibuat (unique kombinasi tahun + semester_id + periode)
   */
  static async getDaftarBatch(): Promise<Array<{
    id: string; // Composite key: tahun-semester_id-periode
    tahun: number;
    semester_id: string | null;
    semester_nama: string | null;
    tahun_ajaran_nama: string | null;
    periode: string | null;
    jumlah_santri: number;
    total_target: number;
    total_dukungan: number;
    total_kekurangan: number;
    label: string; // Display label
  }>> {
    try {
      const { data: rancanganList, error } = await supabase
        .from('rancangan_pelayanan_santri')
        .select(`
          id,
          tahun,
          semester_id,
          periode,
          total_target,
          total_dukungan,
          santri_id
        `)
        .eq('status', 'aktif')
        .order('tahun', { ascending: false })
        .order('periode', { ascending: true });

      if (error) throw error;

      // Group by batch (tahun + semester_id + periode)
      const batchMap = new Map<string, {
        tahun: number;
        semester_id: string | null;
        semester_nama: string | null;
        tahun_ajaran_nama: string | null;
        periode: string | null;
        santriIds: Set<string>;
        total_target: number;
        total_dukungan: number;
      }>();

      // Get unique semester IDs
      const semesterIds = new Set<string>();
      (rancanganList || []).forEach((r: any) => {
        if (r.semester_id) {
          semesterIds.add(r.semester_id);
        }
      });

      // Load semester data
      const semesterMap = new Map<string, { nama: string; tahun_ajaran_nama: string | null }>();
      if (semesterIds.size > 0) {
        const { data: semesterData } = await supabase
          .from('akademik_semester')
          .select(`
            id,
            nama,
            tahun_ajaran_id
          `)
          .in('id', Array.from(semesterIds));

        if (semesterData) {
          const tahunAjaranIds = new Set<string>();
          semesterData.forEach(s => {
            if (s.tahun_ajaran_id) {
              tahunAjaranIds.add(s.tahun_ajaran_id);
            }
          });

          let tahunAjaranMap = new Map<string, string>();
          if (tahunAjaranIds.size > 0) {
            const { data: tahunAjaranData } = await supabase
              .from('akademik_tahun_ajaran')
              .select('id, nama')
              .in('id', Array.from(tahunAjaranIds));

            if (tahunAjaranData) {
              tahunAjaranData.forEach(ta => {
                tahunAjaranMap.set(ta.id, ta.nama);
              });
            }
          }

          semesterData.forEach(s => {
            semesterMap.set(s.id, {
              nama: s.nama,
              tahun_ajaran_nama: s.tahun_ajaran_id ? (tahunAjaranMap.get(s.tahun_ajaran_id) || null) : null
            });
          });
        }
      }

      (rancanganList || []).forEach((r: any) => {
        const batchKey = `${r.tahun}-${r.semester_id || 'null'}-${r.periode || 'null'}`;
        
        if (!batchMap.has(batchKey)) {
          const semesterInfo = r.semester_id ? semesterMap.get(r.semester_id) : null;
          batchMap.set(batchKey, {
            tahun: r.tahun,
            semester_id: r.semester_id,
            semester_nama: semesterInfo?.nama || null,
            tahun_ajaran_nama: semesterInfo?.tahun_ajaran_nama || null,
            periode: r.periode,
            santriIds: new Set(),
            total_target: 0,
            total_dukungan: 0
          });
        }

        const batch = batchMap.get(batchKey)!;
        batch.santriIds.add(r.santri_id);
        batch.total_target += parseFloat(r.total_target?.toString() || '0') || 0;
        batch.total_dukungan += parseFloat(r.total_dukungan?.toString() || '0') || 0;
      });

      // Convert to array and format
      return Array.from(batchMap.entries()).map(([key, batch]) => {
        const totalKekurangan = Math.max(0, batch.total_target - batch.total_dukungan);
        
        // Generate label
        let label = '';
        if (batch.semester_nama && batch.tahun_ajaran_nama) {
          label = `${batch.semester_nama} - ${batch.tahun_ajaran_nama}`;
          if (batch.periode) {
            label += ` (${batch.periode})`;
          }
        } else if (batch.periode) {
          label = `${batch.periode} ${batch.tahun}`;
        } else {
          label = `Tahun ${batch.tahun}`;
        }

        return {
          id: key,
          tahun: batch.tahun,
          semester_id: batch.semester_id,
          semester_nama: batch.semester_nama,
          tahun_ajaran_nama: batch.tahun_ajaran_nama,
          periode: batch.periode,
          jumlah_santri: batch.santriIds.size,
          total_target: batch.total_target,
          total_dukungan: batch.total_dukungan,
          total_kekurangan: totalKekurangan,
          label
        };
      }).sort((a, b) => {
        // Sort by tahun desc, then by semester/periode
        if (a.tahun !== b.tahun) return b.tahun - a.tahun;
        if (a.semester_nama && b.semester_nama) {
          return a.semester_nama.localeCompare(b.semester_nama);
        }
        return (a.periode || '').localeCompare(b.periode || '');
      });
    } catch (error) {
      console.error('Error getting daftar batch:', error);
      throw error;
    }
  }

  /**
   * Get kebutuhan aggregate per batch spesifik
   * Untuk digunakan di modul donasi
   */
  static async getKebutuhanPeriode(params: {
    batchId?: string; // Format: tahun-semester_id-periode
    periodeType?: 'semester' | 'bulan';
    semesterId?: string;
    bulan?: number;
    tahun?: number;
  }): Promise<{
    total_kebutuhan: number;
    total_terkumpul: number;
    total_kekurangan: number;
    per_pilar: {
      pendidikan_formal: { target: number; terkumpul: number; kekurangan: number };
      pendidikan_pesantren: { target: number; terkumpul: number; kekurangan: number };
      operasional_konsumsi: { target: number; terkumpul: number; kekurangan: number };
      bantuan_langsung: { target: number; terkumpul: number; kekurangan: number };
    };
    jumlah_santri: number;
    periode_info: string;
  }> {
    try {
      let query = supabase
        .from('rancangan_pelayanan_santri')
        .select(`
          id,
          santri_id,
          total_target,
          total_dukungan,
          semester_id,
          periode,
          tahun,
          status
        `)
        .eq('status', 'aktif');

      // Filter berdasarkan batch spesifik (prioritas tertinggi)
      if (params.batchId) {
        const [tahun, semesterId, periode] = params.batchId.split('-');
        query = query.eq('tahun', parseInt(tahun));
        if (semesterId !== 'null') {
          query = query.eq('semester_id', semesterId);
        } else {
          query = query.is('semester_id', null);
        }
        if (periode !== 'null') {
          query = query.eq('periode', periode);
        } else {
          query = query.is('periode', null);
        }
      }
      // Filter berdasarkan periode (fallback untuk backward compatibility)
      else if (params.periodeType === 'semester' && params.semesterId) {
        query = query.eq('semester_id', params.semesterId);
      } else if (params.periodeType === 'bulan' && params.bulan && params.tahun) {
        // Filter berdasarkan bulan - cari rancangan yang periode-nya mengandung bulan tersebut
        // Format periode bisa "Januari 2024", "Semester 1 2024", dll
        const bulanNama = [
          'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        const bulanStr = bulanNama[params.bulan - 1];
        query = query
          .eq('tahun', params.tahun)
          .or(`periode.ilike.%${bulanStr}%,periode.ilike.%${params.bulan}%`);
      }

      const { data: rancanganList, error } = await query;

      if (error) throw error;

      // Aggregate per pilar
      const perPilar: Record<PilarPelayanan, { target: number; terkumpul: number; kekurangan: number }> = {
        pendidikan_formal: { target: 0, terkumpul: 0, kekurangan: 0 },
        pendidikan_pesantren: { target: 0, terkumpul: 0, kekurangan: 0 },
        operasional_konsumsi: { target: 0, terkumpul: 0, kekurangan: 0 },
        bantuan_langsung: { target: 0, terkumpul: 0, kekurangan: 0 }
      };

      let totalKebutuhan = 0;
      let totalTerkumpul = 0;
      const uniqueSantriIds = new Set<string>();

      // Load pilar untuk setiap rancangan
      for (const rancangan of rancanganList || []) {
        uniqueSantriIds.add(rancangan.santri_id);
        
        const pilarList = await this.getPilarByRancanganId(rancangan.id);
        
        pilarList.forEach((pilar) => {
          const pilarKey = pilar.pilar as PilarPelayanan;
          perPilar[pilarKey].target += pilar.target_biaya || 0;
          perPilar[pilarKey].terkumpul += pilar.dukungan_masuk || 0;
        });
      }

      // Calculate totals
      Object.values(perPilar).forEach((pilar) => {
        totalKebutuhan += pilar.target;
        totalTerkumpul += pilar.terkumpul;
        pilar.kekurangan = Math.max(0, pilar.target - pilar.terkumpul);
      });

      const totalKekurangan = Math.max(0, totalKebutuhan - totalTerkumpul);

      // Generate periode info
      let periodeInfo = '';
      if (params.batchId) {
        // Get batch info from first rancangan
        if (rancanganList && rancanganList.length > 0) {
          const firstRancangan = rancanganList[0];
          if (firstRancangan.semester_id) {
            const { data: semesterData } = await supabase
              .from('akademik_semester')
              .select(`
                nama,
                tahun_ajaran:akademik_tahun_ajaran(nama)
              `)
              .eq('id', firstRancangan.semester_id)
              .single();
            if (semesterData) {
              periodeInfo = `${semesterData.nama} - ${(semesterData.tahun_ajaran as any)?.nama || ''}`;
              if (firstRancangan.periode) {
                periodeInfo += ` (${firstRancangan.periode})`;
              }
            }
          } else if (firstRancangan.periode) {
            periodeInfo = `${firstRancangan.periode} ${firstRancangan.tahun}`;
          } else {
            periodeInfo = `Tahun ${firstRancangan.tahun}`;
          }
        }
      } else if (params.periodeType === 'semester' && params.semesterId) {
        const { data: semesterData } = await supabase
          .from('akademik_semester')
          .select(`
            nama,
            tahun_ajaran:akademik_tahun_ajaran(nama)
          `)
          .eq('id', params.semesterId)
          .single();
        if (semesterData) {
          periodeInfo = `${semesterData.nama} - ${(semesterData.tahun_ajaran as any)?.nama || ''}`;
        }
      } else if (params.periodeType === 'bulan' && params.bulan && params.tahun) {
        const bulanNama = [
          'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        periodeInfo = `${bulanNama[params.bulan - 1]} ${params.tahun}`;
      }

      return {
        total_kebutuhan: totalKebutuhan,
        total_terkumpul: totalTerkumpul,
        total_kekurangan: totalKekurangan,
        per_pilar: perPilar,
        jumlah_santri: uniqueSantriIds.size,
        periode_info: periodeInfo
      };
    } catch (error) {
      console.error('Error getting kebutuhan periode:', error);
      throw error;
    }
  }

  /**
   * Get all rancangan pelayanan dengan filter
   */
  static async getAllRancangan(filters?: {
    santri_id?: string;
    tahun?: number;
    status?: StatusRancangan;
    status_pemenuhan?: StatusPemenuhan;
  }): Promise<RancanganPelayanan[]> {
    try {
      let query = supabase
        .from('rancangan_pelayanan_santri')
        .select(`
          *,
          santri(id, nama_lengkap, id_santri, status_pelayanan, jenjang_sekolah, foto_profil)
        `)
        .order('created_at', { ascending: false });

      if (filters?.santri_id) {
        query = query.eq('santri_id', filters.santri_id);
      }
      if (filters?.tahun) {
        query = query.eq('tahun', filters.tahun);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.status_pemenuhan) {
        query = query.eq('status_pemenuhan', filters.status_pemenuhan);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Load pilar dan riwayat untuk setiap rancangan
      const rancanganWithDetails = await Promise.all(
        (data || []).map(async (r) => {
          const [pilar, riwayat] = await Promise.all([
            this.getPilarByRancanganId(r.id),
            this.getRiwayatByRancanganId(r.id)
          ]);

          return {
            ...r,
            pilar,
            riwayat_dukungan: riwayat
          } as RancanganPelayanan;
        })
      );

      return rancanganWithDetails;
    } catch (error) {
      console.error('Error getting rancangan:', error);
      throw error;
    }
  }

  /**
   * Get rancangan by ID
   */
  static async getRancanganById(id: string): Promise<RancanganPelayanan | null> {
    try {
      const { data, error } = await supabase
        .from('rancangan_pelayanan_santri')
        .select(`
          *,
          santri(id, nama_lengkap, id_santri, status_pelayanan, jenjang_sekolah, foto_profil)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;

      const [pilar, riwayat] = await Promise.all([
        this.getPilarByRancanganId(id),
        this.getRiwayatByRancanganId(id)
      ]);

      return {
        ...data,
        pilar,
        riwayat_dukungan: riwayat
      } as RancanganPelayanan;
    } catch (error) {
      console.error('Error getting rancangan by id:', error);
      throw error;
    }
  }

  /**
   * Get pilar by rancangan ID
   */
  static async getPilarByRancanganId(rancanganId: string): Promise<RancanganPilar[]> {
    try {
      const { data, error } = await supabase
        .from('rancangan_pilar_pelayanan')
        .select('*')
        .eq('rancangan_id', rancanganId)
        .order('pilar', { ascending: true });

      if (error) throw error;
      return (data || []) as RancanganPilar[];
    } catch (error) {
      console.error('Error getting pilar:', error);
      throw error;
    }
  }

  /**
   * Get riwayat dukungan by rancangan ID
   */
  static async getRiwayatByRancanganId(rancanganId: string): Promise<RiwayatDukungan[]> {
    try {
      const { data, error } = await supabase
        .from('riwayat_dukungan_pelayanan')
        .select(`
          *,
          donations(id, donor_name, donation_date, cash_amount)
        `)
        .eq('rancangan_id', rancanganId)
        .order('tanggal_dukungan', { ascending: false });

      if (error) throw error;
      return (data || []) as RiwayatDukungan[];
    } catch (error) {
      console.error('Error getting riwayat:', error);
      throw error;
    }
  }

  /**
   * Create new rancangan pelayanan
   */
  static async createRancangan(input: CreateRancanganInput & { semester_id?: string }): Promise<RancanganPelayanan> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      // Create rancangan
      const { data: rancangan, error: rancanganError } = await supabase
        .from('rancangan_pelayanan_santri')
        .insert({
          santri_id: input.santri_id,
          tahun: input.tahun,
          periode: input.periode,
          semester_id: (input as any).semester_id || null,
          status: input.status || 'draft',
          catatan: input.catatan,
          created_by: userId
        })
        .select()
        .single();

      if (rancanganError) throw rancanganError;

      // Create pilar
      const pilarData = input.pilar.map(p => ({
        rancangan_id: rancangan.id,
        pilar: p.pilar,
        nama_pilar: p.nama_pilar,
        target_biaya: p.target_biaya,
        rincian_biaya: p.rincian_biaya,
        catatan: p.catatan
      }));

      const { error: pilarError } = await supabase
        .from('rancangan_pilar_pelayanan')
        .insert(pilarData);

      if (pilarError) throw pilarError;

      // Return dengan pilar
      return await this.getRancanganById(rancangan.id) as RancanganPelayanan;
    } catch (error) {
      console.error('Error creating rancangan:', error);
      throw error;
    }
  }

  /**
   * Update rancangan pelayanan
   */
  static async updateRancangan(
    id: string,
    input: UpdateRancanganInput
  ): Promise<RancanganPelayanan> {
    try {
      // Update rancangan
      const updateData: any = {};
      if (input.tahun !== undefined) updateData.tahun = input.tahun;
      if (input.periode !== undefined) updateData.periode = input.periode;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.catatan !== undefined) updateData.catatan = input.catatan;

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('rancangan_pelayanan_santri')
          .update(updateData)
          .eq('id', id);

        if (error) throw error;
      }

      // Update pilar jika ada
      if (input.pilar) {
        // Delete existing pilar
        await supabase
          .from('rancangan_pilar_pelayanan')
          .delete()
          .eq('rancangan_id', id);

        // Insert new pilar
        const pilarData = input.pilar.map(p => ({
          rancangan_id: id,
          pilar: p.pilar,
          nama_pilar: p.nama_pilar,
          target_biaya: p.target_biaya,
          rincian_biaya: p.rincian_biaya,
          catatan: p.catatan
        }));

        const { error: pilarError } = await supabase
          .from('rancangan_pilar_pelayanan')
          .insert(pilarData);

        if (pilarError) throw pilarError;
      }

      return await this.getRancanganById(id) as RancanganPelayanan;
    } catch (error) {
      console.error('Error updating rancangan:', error);
      throw error;
    }
  }

  /**
   * Delete rancangan pelayanan
   */
  static async deleteRancangan(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('rancangan_pelayanan_santri')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting rancangan:', error);
      throw error;
    }
  }

  /**
   * Create riwayat dukungan
   */
  static async createDukungan(input: CreateDukunganInput): Promise<RiwayatDukungan> {
    try {
      const { data, error } = await supabase
        .from('riwayat_dukungan_pelayanan')
        .insert({
          rancangan_id: input.rancangan_id,
          pilar_id: input.alokasi_per_pilar ? undefined : null, // Will be set per pilar if needed
          donation_id: input.donation_id,
          donor_name: input.donor_name,
          donor_id: input.donor_id,
          jumlah_dukungan: input.jumlah_dukungan,
          alokasi_per_pilar: input.alokasi_per_pilar,
          tanggal_dukungan: input.tanggal_dukungan,
          status: input.status || 'terkonfirmasi',
          catatan: input.catatan
        })
        .select()
        .single();

      if (error) throw error;
      return data as RiwayatDukungan;
    } catch (error) {
      console.error('Error creating dukungan:', error);
      throw error;
    }
  }

  /**
   * Link donation to rancangan (create dukungan from donation)
   */
  static async linkDonationToRancangan(
    donationId: string,
    rancanganId: string,
    alokasiPerPilar?: Record<PilarPelayanan, number>
  ): Promise<RiwayatDukungan> {
    try {
      // Get donation data
      const { data: donation, error: donationError } = await supabase
        .from('donations')
        .select('*')
        .eq('id', donationId)
        .single();

      if (donationError) throw donationError;
      if (!donation) throw new Error('Donation not found');

      // Create dukungan
      return await this.createDukungan({
        rancangan_id: rancanganId,
        donation_id: donationId,
        donor_name: donation.donor_name,
        jumlah_dukungan: donation.cash_amount || 0,
        alokasi_per_pilar: alokasiPerPilar,
        tanggal_dukungan: donation.donation_date || new Date().toISOString().split('T')[0],
        status: 'terkonfirmasi',
        catatan: `Dukungan dari donasi: ${donation.donor_name}`
      });
    } catch (error) {
      console.error('Error linking donation:', error);
      throw error;
    }
  }

  /**
   * Get statistik untuk dashboard
   */
  static async getStatistik(): Promise<RancanganStatistik> {
    try {
      const { data, error } = await supabase
        .from('vw_rancangan_statistik')
        .select('*')
        .single();

      if (error) throw error;
      return (data || {
        total_rancangan: 0,
        rancangan_aktif: 0,
        santri_tercukupi: 0,
        santri_terlayani: 0,
        santri_belum_terpenuhi: 0,
        total_target_keseluruhan: 0,
        total_dukungan_keseluruhan: 0,
        total_kekurangan_dukungan: 0,
        persentase_pemenuhan_keseluruhan: 0
      }) as RancanganStatistik;
    } catch (error) {
      console.error('Error getting statistik:', error);
      // Return default jika error
      return {
        total_rancangan: 0,
        rancangan_aktif: 0,
        santri_tercukupi: 0,
        santri_terlayani: 0,
        santri_belum_terpenuhi: 0,
        total_target_keseluruhan: 0,
        total_dukungan_keseluruhan: 0,
        total_kekurangan_dukungan: 0,
        persentase_pemenuhan_keseluruhan: 0
      };
    }
  }

  /**
   * Get rancangan summary untuk dashboard
   */
  static async getRancanganSummary(filters?: {
    tahun?: number;
    status?: StatusRancangan;
  }): Promise<any[]> {
    try {
      let query = supabase
        .from('vw_rancangan_pelayanan_summary')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.tahun) {
        query = query.eq('tahun', filters.tahun);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting summary:', error);
      throw error;
    }
  }

  /**
   * Update pilar target biaya
   */
  static async updatePilarTarget(
    pilarId: string,
    targetBiaya: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('rancangan_pilar_pelayanan')
        .update({
          target_biaya: targetBiaya,
          updated_at: new Date().toISOString()
        })
        .eq('id', pilarId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating pilar target:', error);
      throw error;
    }
  }

  /**
   * Add dukungan donasi (Bantu Sekarang)
   */
  static async addDukunganDonasi(
    rancanganId: string,
    pilar: PilarPelayanan,
    nominal: number,
    donorName?: string
  ): Promise<RiwayatDukungan> {
    try {
      // Get pilar ID
      const { data: pilarData } = await supabase
        .from('rancangan_pilar_pelayanan')
        .select('id')
        .eq('rancangan_id', rancanganId)
        .eq('pilar', pilar)
        .single();

      const alokasiPerPilar: Record<string, number> = {
        [pilar]: nominal
      };

      // Create dukungan
      const dukungan = await this.createDukungan({
        rancangan_id: rancanganId,
        donor_name: donorName || 'Donatur',
        jumlah_dukungan: nominal,
        alokasi_per_pilar: alokasiPerPilar as Record<PilarPelayanan, number>,
        tanggal_dukungan: new Date().toISOString().split('T')[0],
        status: 'terkonfirmasi',
        catatan: `Bantuan untuk pilar: ${PILAR_PELAYANAN_CONFIG[pilar].label}`
      });

      return dukungan;
    } catch (error) {
      console.error('Error adding dukungan donasi:', error);
      throw error;
    }
  }

  /**
   * Batch update periode untuk multiple rancangan
   */
  static async batchUpdatePeriode(
    rancanganIds: string[],
    periode: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('rancangan_pelayanan_santri')
        .update({ periode, updated_at: new Date().toISOString() })
        .in('id', rancanganIds);

      if (error) throw error;
    } catch (error) {
      console.error('Error batch updating periode:', error);
      throw error;
    }
  }

  /**
   * Batch update semester_id untuk multiple rancangan (sinkronisasi dengan semester aktif)
   * Otomatis set status ke 'aktif' agar rancangan muncul di batch list setelah update
   */
  static async batchUpdateSemester(
    rancanganIds: string[],
    semesterId: string | null
  ): Promise<void> {
    try {
      if (rancanganIds.length === 0) {
        throw new Error('Tidak ada rancangan yang dipilih');
      }

      // Update semester_id dan set status ke 'aktif'
      // Ini memastikan rancangan muncul di batch list setelah di-assign ke semester baru
      const { error } = await supabase
        .from('rancangan_pelayanan_santri')
        .update({ 
          semester_id: semesterId,
          status: 'aktif', // Set ke 'aktif' agar muncul di batch list
          updated_at: new Date().toISOString()
        })
        .in('id', rancanganIds);

      if (error) throw error;
    } catch (error) {
      console.error('Error batch updating semester:', error);
      throw error;
    }
  }

  /**
   * Batch update nominal pilar untuk multiple rancangan
   */
  static async batchUpdateNominalPilar(
    rancanganIds: string[],
    pilar: PilarPelayanan,
    targetBiaya: number
  ): Promise<void> {
    try {
      // Get all pilar IDs for the selected rancangan
      const { data: pilarData, error: fetchError } = await supabase
        .from('rancangan_pilar_pelayanan')
        .select('id, rancangan_id')
        .in('rancangan_id', rancanganIds)
        .eq('pilar', pilar);

      if (fetchError) throw fetchError;

      if (!pilarData || pilarData.length === 0) {
        throw new Error('Tidak ada pilar yang ditemukan untuk rancangan yang dipilih');
      }

      // Update each pilar
      const pilarIds = pilarData.map(p => p.id);
      const { error: updateError } = await supabase
        .from('rancangan_pilar_pelayanan')
        .update({
          target_biaya: targetBiaya,
          updated_at: new Date().toISOString()
        })
        .in('id', pilarIds);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error batch updating nominal pilar:', error);
      throw error;
    }
  }

  /**
   * Copy/clone rancangan untuk tahun berikutnya
   */
  static async cloneRancangan(
    rancanganId: string,
    tahunBaru: number,
    periodeBaru?: string
  ): Promise<RancanganPelayanan> {
    try {
      const rancanganLama = await this.getRancanganById(rancanganId);
      if (!rancanganLama) {
        throw new Error('Rancangan tidak ditemukan');
      }

      // Create new rancangan
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      const { data: rancanganBaru, error: rancanganError } = await supabase
        .from('rancangan_pelayanan_santri')
        .insert({
          santri_id: rancanganLama.santri_id,
          tahun: tahunBaru,
          periode: periodeBaru || rancanganLama.periode,
          status: 'draft',
          catatan: rancanganLama.catatan ? `Salinan dari ${rancanganLama.tahun}: ${rancanganLama.catatan}` : `Salinan dari ${rancanganLama.tahun}`,
          created_by: userId
        })
        .select()
        .single();

      if (rancanganError) throw rancanganError;

      // Copy pilar
      if (rancanganLama.pilar && rancanganLama.pilar.length > 0) {
        const pilarData = rancanganLama.pilar.map(p => ({
          rancangan_id: rancanganBaru.id,
          pilar: p.pilar,
          nama_pilar: p.nama_pilar,
          target_biaya: p.target_biaya,
          rincian_biaya: p.rincian_biaya,
          catatan: p.catatan
        }));

        const { error: pilarError } = await supabase
          .from('rancangan_pilar_pelayanan')
          .insert(pilarData);

        if (pilarError) throw pilarError;
      }

      return await this.getRancanganById(rancanganBaru.id) as RancanganPelayanan;
    } catch (error) {
      console.error('Error cloning rancangan:', error);
      throw error;
    }
  }
}

