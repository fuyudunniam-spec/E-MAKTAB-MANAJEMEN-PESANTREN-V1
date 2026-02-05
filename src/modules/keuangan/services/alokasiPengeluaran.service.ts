import { supabase } from '../integrations/supabase/client';

export interface AlokasiPengeluaranSantri {
  id: string;
  sumber_alokasi: 'manual' | 'overhead';
  keuangan_id?: string;
  rincian_id?: string;
  alokasi_overhead_id?: string;
  santri_id: string;
  periode: string;
  bulan?: number;
  tahun?: number;
  nominal_alokasi: number;
  persentase_alokasi: number;
  spp_pendidikan?: number;
  asrama_kebutuhan?: number;
  total_alokasi?: number;
  jenis_bantuan?: string;
  keterangan?: string;
  tipe_alokasi?: 'pengeluaran_riil' | 'tracking_nominal';
  alokasi_ke?: 'formal' | 'pesantren' | 'asrama_konsumsi' | 'bantuan_langsung';
  created_at: string;
  updated_at: string;
}

export interface SantriAllocation {
  santri_id: string;
  nama_lengkap: string;
  nisn: string;
  nominal_alokasi: number;
  persentase_alokasi: number;
  jenis_bantuan: string;
  periode: string;
  keterangan?: string;
}

export interface CreateAlokasiData {
  keuangan_id: string;
  rincian_id?: string;
  santri_id: string;
  nominal_alokasi: number;
  persentase_alokasi?: number;
  jenis_bantuan: string;
  periode: string;
  keterangan?: string;
  tipe_alokasi?: 'pengeluaran_riil' | 'tracking_nominal';
  alokasi_ke?: 'formal' | 'pesantren' | 'asrama_konsumsi' | 'bantuan_langsung';
}

export interface BatchAllocationData {
  keuangan_id: string;
  rincian_id?: string;
  allocations: Omit<CreateAlokasiData, 'keuangan_id' | 'rincian_id'>[];
}

export interface AkumulasiBantuanSantri {
  santri_id: string;
  nama_lengkap: string;
  nisn: string;
  periode_bulan: string;
  total_bantuan: number;
  jumlah_transaksi: number;
  jenis_bantuan_list: string[];
}

export class AlokasiPengeluaranService {
  /**
   * Get all allocations (manual only)
   */
  static async getAll(): Promise<AlokasiPengeluaranSantri[]> {
    const { data, error } = await supabase
      .from('alokasi_layanan_santri')
      .select('*')
      .eq('sumber_alokasi', 'manual')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as AlokasiPengeluaranSantri[];
  }

  /**
   * Get allocations by keuangan_id
   */
  static async getByKeuanganId(keuangan_id: string): Promise<AlokasiPengeluaranSantri[]> {
    const { data, error } = await supabase
      .from('alokasi_layanan_santri')
      .select('*')
      .eq('sumber_alokasi', 'manual')
      .eq('keuangan_id', keuangan_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as AlokasiPengeluaranSantri[];
  }

  /**
   * Get allocations by santri_id (all types)
   */
  static async getBySantriId(santri_id: string): Promise<AlokasiPengeluaranSantri[]> {
    const { data, error } = await supabase
      .from('alokasi_layanan_santri')
      .select('*')
      .eq('santri_id', santri_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as AlokasiPengeluaranSantri[];
  }

  /**
   * Get allocations by santri_id and period
   */
  static async getBySantriIdAndPeriod(santri_id: string, periode: string): Promise<AlokasiPengeluaranSantri[]> {
    const { data, error } = await supabase
      .from('alokasi_layanan_santri')
      .select('*')
      .eq('santri_id', santri_id)
      .eq('periode', periode)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as AlokasiPengeluaranSantri[];
  }

  /**
   * Get real-time accumulation for all santri
   */
  static async getAkumulasiBantuan(): Promise<AkumulasiBantuanSantri[]> {
    const { data, error } = await supabase
      .from('alokasi_layanan_santri')
      .select(`
        santri_id,
        periode,
        nominal_alokasi,
        jenis_bantuan,
        sumber_alokasi,
        santri:santri_id(nama_lengkap, nisn)
      `)
      .order('periode', { ascending: false });

    if (error) throw error;
    
    // Aggregate by santri and period
    const aggregateMap = new Map<string, AkumulasiBantuanSantri>();
    (data || []).forEach((item: any) => {
      const key = `${item.santri_id}_${item.periode}`;
      if (!aggregateMap.has(key)) {
        aggregateMap.set(key, {
          santri_id: item.santri_id,
          nama_lengkap: Array.isArray(item.santri) ? (item.santri[0]?.nama_lengkap || '') : (item.santri?.nama_lengkap || ''),
          nisn: Array.isArray(item.santri) ? (item.santri[0]?.nisn || '') : (item.santri?.nisn || ''),
          periode_bulan: item.periode,
          total_bantuan: 0,
          jumlah_transaksi: 0,
          jenis_bantuan_list: []
        });
      }
      const acc = aggregateMap.get(key)!;
      acc.total_bantuan += item.nominal_alokasi || 0;
      acc.jumlah_transaksi += 1;
      if (item.jenis_bantuan && !acc.jenis_bantuan_list.includes(item.jenis_bantuan)) {
        acc.jenis_bantuan_list.push(item.jenis_bantuan);
      }
    });
    
    return Array.from(aggregateMap.values()).sort((a, b) => 
      b.periode_bulan.localeCompare(a.periode_bulan)
    );
  }

  /**
   * Get real-time accumulation by santri_id
   */
  static async getAkumulasiBantuanBySantri(santri_id: string): Promise<AkumulasiBantuanSantri[]> {
    const { data, error } = await supabase
      .from('alokasi_layanan_santri')
      .select(`
        santri_id,
        periode,
        nominal_alokasi,
        jenis_bantuan,
        sumber_alokasi,
        santri:santri_id(nama_lengkap, nisn)
      `)
      .eq('santri_id', santri_id)
      .order('periode', { ascending: false });

    if (error) throw error;
    
    // Aggregate by period
    const aggregateMap = new Map<string, AkumulasiBantuanSantri>();
    (data || []).forEach((item: any) => {
      const key = item.periode;
      if (!aggregateMap.has(key)) {
        aggregateMap.set(key, {
          santri_id: item.santri_id,
          nama_lengkap: Array.isArray(item.santri) ? (item.santri[0]?.nama_lengkap || '') : (item.santri?.nama_lengkap || ''),
          nisn: Array.isArray(item.santri) ? (item.santri[0]?.nisn || '') : (item.santri?.nisn || ''),
          periode_bulan: item.periode,
          total_bantuan: 0,
          jumlah_transaksi: 0,
          jenis_bantuan_list: []
        });
      }
      const acc = aggregateMap.get(key)!;
      acc.total_bantuan += item.nominal_alokasi || 0;
      acc.jumlah_transaksi += 1;
      if (item.jenis_bantuan && !acc.jenis_bantuan_list.includes(item.jenis_bantuan)) {
        acc.jenis_bantuan_list.push(item.jenis_bantuan);
      }
    });
    
    return Array.from(aggregateMap.values()).sort((a, b) => 
      b.periode_bulan.localeCompare(a.periode_bulan)
    );
  }

  /**
   * Get real-time accumulation by period
   */
  static async getAkumulasiBantuanByPeriod(periode: string): Promise<AkumulasiBantuanSantri[]> {
    const { data, error } = await supabase
      .from('alokasi_layanan_santri')
      .select(`
        santri_id,
        periode,
        nominal_alokasi,
        jenis_bantuan,
        sumber_alokasi,
        santri:santri_id(nama_lengkap, nisn)
      `)
      .eq('periode', periode)
      .order('nominal_alokasi', { ascending: false });

    if (error) throw error;
    
    // Aggregate by santri
    const aggregateMap = new Map<string, AkumulasiBantuanSantri>();
    (data || []).forEach((item: any) => {
      const key = item.santri_id;
      if (!aggregateMap.has(key)) {
        aggregateMap.set(key, {
          santri_id: item.santri_id,
          nama_lengkap: Array.isArray(item.santri) ? (item.santri[0]?.nama_lengkap || '') : (item.santri?.nama_lengkap || ''),
          nisn: Array.isArray(item.santri) ? (item.santri[0]?.nisn || '') : (item.santri?.nisn || ''),
          periode_bulan: item.periode,
          total_bantuan: 0,
          jumlah_transaksi: 0,
          jenis_bantuan_list: []
        });
      }
      const acc = aggregateMap.get(key)!;
      acc.total_bantuan += item.nominal_alokasi || 0;
      acc.jumlah_transaksi += 1;
      if (item.jenis_bantuan && !acc.jenis_bantuan_list.includes(item.jenis_bantuan)) {
        acc.jenis_bantuan_list.push(item.jenis_bantuan);
      }
    });
    
    return Array.from(aggregateMap.values()).sort((a, b) => 
      b.total_bantuan - a.total_bantuan
    );
  }

  /**
   * Create single allocation
   */
  static async create(data: CreateAlokasiData): Promise<AlokasiPengeluaranSantri> {
    // Extract bulan and tahun from periode (format: YYYY-MM)
    const periodeParts = data.periode.split('-');
    const tahun = periodeParts.length > 0 ? parseInt(periodeParts[0]) : null;
    const bulan = periodeParts.length > 1 ? parseInt(periodeParts[1]) : null;

    const { data: result, error } = await supabase
      .from('alokasi_layanan_santri')
      .insert([{
        sumber_alokasi: 'manual',
        keuangan_id: data.keuangan_id,
        rincian_id: data.rincian_id || null,
        alokasi_overhead_id: null,
        santri_id: data.santri_id,
        periode: data.periode,
        bulan: bulan,
        tahun: tahun,
        nominal_alokasi: data.nominal_alokasi,
        persentase_alokasi: data.persentase_alokasi || 0,
        jenis_bantuan: data.jenis_bantuan,
        keterangan: data.keterangan || null,
        tipe_alokasi: data.tipe_alokasi || null,
        alokasi_ke: data.alokasi_ke || null,
      }])
      .select()
      .single();

    if (error) throw error;
    return result as AlokasiPengeluaranSantri;
  }

  /**
   * Create batch allocations
   */
  static async createBatch(data: BatchAllocationData): Promise<AlokasiPengeluaranSantri[]> {
    const allocations = data.allocations.map(allocation => {
      // Extract bulan and tahun from periode
      const periodeParts = allocation.periode.split('-');
      const tahun = periodeParts.length > 0 ? parseInt(periodeParts[0]) : null;
      const bulan = periodeParts.length > 1 ? parseInt(periodeParts[1]) : null;

      return {
        sumber_alokasi: 'manual' as const,
        keuangan_id: data.keuangan_id,
        rincian_id: data.rincian_id || null,
        alokasi_overhead_id: null,
        santri_id: allocation.santri_id,
        periode: allocation.periode,
        bulan: bulan,
        tahun: tahun,
        nominal_alokasi: allocation.nominal_alokasi,
        persentase_alokasi: allocation.persentase_alokasi || 0,
        jenis_bantuan: allocation.jenis_bantuan,
        keterangan: allocation.keterangan || null,
        tipe_alokasi: allocation.tipe_alokasi || null,
        alokasi_ke: allocation.alokasi_ke || null,
      };
    });

    const { data: result, error } = await supabase
      .from('alokasi_layanan_santri')
      .insert(allocations)
      .select();

    if (error) throw error;
    return (result || []) as AlokasiPengeluaranSantri[];
  }

  /**
   * Auto-split allocation among selected santri
   */
  static async createAutoSplit(
    keuangan_id: string,
    rincian_id: string | undefined,
    total_amount: number,
    santri_ids: string[],
    jenis_bantuan: string,
    periode: string,
    keterangan?: string
  ): Promise<AlokasiPengeluaranSantri[]> {
    const amount_per_santri = total_amount / santri_ids.length;
    const percentage_per_santri = 100 / santri_ids.length;

    const allocations = santri_ids.map(santri_id => ({
      santri_id,
      nominal_alokasi: amount_per_santri,
      persentase_alokasi: percentage_per_santri,
      jenis_bantuan,
      periode,
      keterangan: keterangan || `Auto-split ${jenis_bantuan}`,
    }));

    return this.createBatch({ keuangan_id, rincian_id, allocations });
  }

  /**
   * Update allocation
   */
  static async update(id: string, data: Partial<CreateAlokasiData>): Promise<AlokasiPengeluaranSantri> {
    // Extract bulan and tahun from periode if provided
    const updateData: any = { ...data };
    if (data.periode) {
      const periodeParts = data.periode.split('-');
      updateData.tahun = periodeParts.length > 0 ? parseInt(periodeParts[0]) : null;
      updateData.bulan = periodeParts.length > 1 ? parseInt(periodeParts[1]) : null;
    }

    const { data: result, error } = await supabase
      .from('alokasi_layanan_santri')
      .update(updateData)
      .eq('id', id)
      .eq('sumber_alokasi', 'manual')
      .select()
      .single();

    if (error) throw error;
    return result as AlokasiPengeluaranSantri;
  }

  /**
   * Delete allocation
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('alokasi_layanan_santri')
      .delete()
      .eq('id', id)
      .eq('sumber_alokasi', 'manual');

    if (error) throw error;
  }

  /**
   * Delete all allocations for a keuangan_id
   */
  static async deleteByKeuanganId(keuangan_id: string): Promise<void> {
    const { error } = await supabase
      .from('alokasi_layanan_santri')
      .delete()
      .eq('keuangan_id', keuangan_id)
      .eq('sumber_alokasi', 'manual');

    if (error) throw error;
  }

  /**
   * Get allocation summary by keuangan_id
   */
  static async getSummaryByKeuanganId(keuangan_id: string): Promise<{
    total_allocation: number;
    total_santri: number;
    allocations: AlokasiPengeluaranSantri[];
  }> {
    const allocations = await this.getByKeuanganId(keuangan_id);
    
    const total_allocation = allocations.reduce((sum, alloc) => sum + alloc.nominal_alokasi, 0);
    const total_santri = allocations.length;

    return {
      total_allocation,
      total_santri,
      allocations,
    };
  }

  /**
   * Get allocation summary by santri_id for a period
   */
  static async getSummaryBySantriId(santri_id: string, periode?: string): Promise<{
    total_bantuan: number;
    jumlah_transaksi: number;
    jenis_bantuan_list: string[];
    allocations: AlokasiPengeluaranSantri[];
  }> {
    const allocations = periode 
      ? await this.getBySantriIdAndPeriod(santri_id, periode)
      : await this.getBySantriId(santri_id);

    const total_bantuan = allocations.reduce((sum, alloc) => sum + alloc.nominal_alokasi, 0);
    const jenis_bantuan_list = [...new Set(allocations.map(alloc => alloc.jenis_bantuan))];

    return {
      total_bantuan,
      jumlah_transaksi: allocations.length,
      jenis_bantuan_list,
      allocations,
    };
  }

  /**
   * Validate allocation data
   */
  static validate(data: CreateAlokasiData): string[] {
    const errors: string[] = [];

    if (!data.keuangan_id) {
      errors.push('ID keuangan harus diisi');
    }

    if (!data.santri_id) {
      errors.push('ID santri harus diisi');
    }

    if (!data.jenis_bantuan || data.jenis_bantuan.trim().length === 0) {
      errors.push('Jenis bantuan harus diisi');
    }

    if (!data.periode || data.periode.trim().length === 0) {
      errors.push('Periode harus diisi');
    }

    if (data.nominal_alokasi <= 0) {
      errors.push('Nominal alokasi harus lebih dari 0');
    }

    if (data.persentase_alokasi !== undefined && (data.persentase_alokasi < 0 || data.persentase_alokasi > 100)) {
      errors.push('Persentase alokasi harus antara 0-100');
    }

    return errors;
  }

  /**
   * Get available santri for allocation
   */
  static async getAvailableSantri(): Promise<{ 
    id: string; 
    nama_lengkap: string; 
    nisn: string;
    id_santri: string;
    program?: string;
  }[]> {
    const { data, error } = await supabase
      .from('santri')
      .select(`
        id, 
        nama_lengkap, 
        nisn,
        id_santri,
        kelas:santri_kelas(
          kelas_program,
          rombel,
          tingkat,
          status_kelas
        )
      `)
      .eq('status_santri', 'Aktif')
      .order('nama_lengkap', { ascending: true });

    if (error) throw error;
    
    // Transform data to include kelas info
    return (data || []).map(item => {
      const aktif = (item.kelas || []).find((k: any) => k.status_kelas === 'Aktif') || item.kelas?.[0];
      const program = aktif
        ? [aktif.kelas_program, aktif.rombel].filter(Boolean).join(' - ') || aktif.kelas_program
        : undefined;

      return {
        id: item.id,
        nama_lengkap: item.nama_lengkap,
        nisn: item.nisn,
        id_santri: item.id_santri,
        program,
      };
    });
  }

  /**
   * Get allocation statistics
   */
  static async getStatistics(): Promise<{
    total_allocations: number;
    total_amount: number;
    unique_santri: number;
    unique_periods: string[];
    top_beneficiaries: Array<{ santri_id: string; nama_lengkap: string; total_bantuan: number }>;
  }> {
      const { data, error } = await supabase
        .from('alokasi_layanan_santri')
        .select(`
          *,
          santri!inner(nama_lengkap)
        `)
        .eq('sumber_alokasi', 'manual');

    if (error) throw error;

    const allocations = data || [];
    const total_allocations = allocations.length;
    const total_amount = allocations.reduce((sum, alloc) => sum + alloc.nominal_alokasi, 0);
    
    const unique_santri = new Set(allocations.map(alloc => alloc.santri_id)).size;
    const unique_periods = [...new Set(allocations.map(alloc => alloc.periode))];

    // Calculate top beneficiaries
    const santriTotals: { [key: string]: { nama_lengkap: string; total: number } } = {};
    allocations.forEach((allocItem: any) => {
      const alloc = allocItem as any;
      const santriId = alloc.santri_id;
      const santri = alloc.santri as any;
      const santriName = Array.isArray(santri) ? (santri[0]?.nama_lengkap || '') : (santri?.nama_lengkap || '');
      if (!santriTotals[santriId]) {
        santriTotals[santriId] = { nama_lengkap: santriName, total: 0 };
      }
      santriTotals[santriId].total += alloc.nominal_alokasi || 0;
    });

    const top_beneficiaries = Object.entries(santriTotals)
      .map(([santri_id, data]) => ({ santri_id, nama_lengkap: data.nama_lengkap, total_bantuan: data.total }))
      .sort((a, b) => b.total_bantuan - a.total_bantuan)
      .slice(0, 10);

    return {
      total_allocations,
      total_amount,
      unique_santri,
      unique_periods,
      top_beneficiaries,
    };
  }

  /**
   * Get santri assistance summary for reports
   */
  static async getSantriAssistanceSummary(filters?: {
    periode?: string;
    program?: string;
  }): Promise<Array<{
    id_santri: string;
    nama_lengkap: string;
    program: string;
    total_bantuan: number;
    jumlah_alokasi: number;
  }>> {
    let query = supabase
      .from('alokasi_layanan_santri')
      .select(`
        santri_id,
        nominal_alokasi,
        santri:santri_id!inner(
          id,
          id_santri,
          nama_lengkap,
          kelas:santri_kelas(
            kelas_program,
            rombel,
            tingkat,
            status_kelas
          )
        )
      `)
      .eq('sumber_alokasi', 'manual');

    // Apply filters
    if (filters?.periode) {
      query = query.eq('periode', filters.periode);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Group by santri and calculate totals
    const santriTotals: { [key: string]: {
      id_santri: string;
      nama_lengkap: string;
      program: string;
      total_bantuan: number;
      jumlah_alokasi: number;
    } } = {};

    (data || []).forEach((allocationItem: any) => {
      const santri = allocationItem.santri;
      if (!santri || !santri.id) return;
      
      const kelasAktif = Array.isArray(santri.kelas) 
        ? santri.kelas.find((k: any) => k.status_kelas === 'Aktif') || santri.kelas[0]
        : null;
      const program = kelasAktif
        ? [kelasAktif.kelas_program, kelasAktif.rombel].filter(Boolean).join(' - ')
        : 'Belum diploat';

      // Apply program filter if specified
      if (filters?.program && program !== filters.program) {
        return;
      }

      const santriId = santri.id;
      if (!santriTotals[santriId]) {
        santriTotals[santriId] = {
          id_santri: santri.id_santri || '',
          nama_lengkap: santri.nama_lengkap || '',
          program,
          total_bantuan: 0,
          jumlah_alokasi: 0,
        };
      }

      santriTotals[santriId].total_bantuan += allocationItem.nominal_alokasi || 0;
      santriTotals[santriId].jumlah_alokasi += 1;
    });

    return Object.values(santriTotals).sort((a, b) => b.total_bantuan - a.total_bantuan);
  }
}
