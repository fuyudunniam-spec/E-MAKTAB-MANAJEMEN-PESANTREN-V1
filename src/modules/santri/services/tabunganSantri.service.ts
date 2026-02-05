import { supabase } from '@/integrations/supabase/client';
import {
  TabunganSantri,
  TabunganSantriWithSantri,
  SaldoTabunganSantri,
  SetorTabunganRequest,
  TarikTabunganRequest,
  SetorMassalRequest,
  TarikMassalRequest,
  TarikMassalResult,
  TabunganStats,
  TabunganFilter
} from '@/modules/keuangan/types/tabungan.types';

export class TabunganSantriService {
  // Get saldo tabungan santri
  static async getSaldoTabungan(santriId: string): Promise<number> {
    const { data, error } = await supabase.rpc('get_saldo_tabungan_santri', {
      p_santri_id: santriId
    });

    if (error) {
      throw new Error(`Error getting saldo: ${error.message}`);
    }

    return data || 0;
  }

  // Get saldo semua santri dengan info santri (OPTIMIZED: menggunakan single RPC call)
  static async getAllSaldoTabungan(): Promise<SaldoTabunganSantri[]> {
    const { data, error } = await supabase.rpc('get_all_saldo_tabungan');

    if (error) {
      throw new Error(`Error getting saldo tabungan: ${error.message}`);
    }

    // Transform data ke format yang diharapkan
    return (data || []).map((item: any) => ({
      santri_id: item.santri_id,
      saldo: parseFloat(item.saldo) || 0,
      santri: {
        id: item.santri_id,
        id_santri: item.id_santri,
        nama_lengkap: item.nama_lengkap,
        nisn: item.nisn,
        kelas: item.kelas,
        kategori: item.kategori
      }
    }));
  }

  // Setor tabungan santri
  static async setorTabungan(request: SetorTabunganRequest): Promise<string> {
    const { data, error } = await supabase.rpc('setor_tabungan_santri', {
      p_santri_id: request.santri_id,
      p_nominal: request.nominal,
      p_deskripsi: request.deskripsi || 'Setoran tunai',
      p_catatan: request.catatan || null,
      p_bukti_file: request.bukti_file || null,
      p_petugas_id: request.petugas_id || null,
      p_petugas_nama: request.petugas_nama || null
    });

    if (error) {
      throw new Error(`Error setor tabungan: ${error.message}`);
    }

    const tabunganId = data;

    // Update record dengan field baru jika ada
    const updateData: any = {};
    if (request.tanggal) {
      updateData.tanggal = request.tanggal;
    }
    if (request.tipe_setoran) {
      updateData.tipe_setoran = request.tipe_setoran;
    }
    if (request.sumber_dana) {
      updateData.sumber_dana = request.sumber_dana;
    }
    if (request.akun_kas_id) {
      updateData.akun_kas_id = request.akun_kas_id;
    }

    // Update record jika ada field baru
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('santri_tabungan')
        .update(updateData)
        .eq('id', tabunganId);

      if (updateError) {
        console.warn('Warning updating tabungan metadata:', updateError);
        // Don't throw - RPC already succeeded
      }
    }

    return tabunganId;
  }

  // Tarik tabungan santri
  static async tarikTabungan(request: TarikTabunganRequest): Promise<string> {
    const { data, error } = await supabase.rpc('tarik_tabungan_santri', {
      p_santri_id: request.santri_id,
      p_nominal: request.nominal,
      p_deskripsi: request.deskripsi || 'Penarikan tunai',
      p_catatan: request.catatan || null,
      p_bukti_file: request.bukti_file || null,
      p_petugas_id: request.petugas_id || null,
      p_petugas_nama: request.petugas_nama || null
    });

    if (error) {
      throw new Error(`Error tarik tabungan: ${error.message}`);
    }

    const tabunganId = data;

    // Update record dengan field baru jika ada
    const updateData: any = {};
    if (request.tanggal) {
      updateData.tanggal = request.tanggal;
    }
    if (request.akun_kas_id) {
      updateData.akun_kas_id = request.akun_kas_id;
    }

    // Update record jika ada field baru
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('santri_tabungan')
        .update(updateData)
        .eq('id', tabunganId);

      if (updateError) {
        console.warn('Warning updating tabungan metadata:', updateError);
        // Don't throw - RPC already succeeded
      }
    }

    return tabunganId;
  }

  // Setor massal tabungan santri
  static async setorMassal(request: SetorMassalRequest): Promise<string[]> {
    const { data, error } = await supabase.rpc('setor_tabungan_santri_massal', {
      p_santri_ids: request.santri_ids,
      p_nominal: request.nominal,
      p_deskripsi: request.deskripsi ?? 'Setoran massal',
      p_catatan: request.catatan || null,
      p_petugas_id: request.petugas_id || null,
      p_petugas_nama: request.petugas_nama || null
    });

    if (error) {
      throw new Error(`Error setor massal: ${error.message}`);
    }

    const tabunganIds = data || [];

    // Update records dengan field baru jika ada
    const updateData: any = {};
    if (request.tanggal) {
      updateData.tanggal = request.tanggal;
    }
    if (request.tipe_setoran) {
      updateData.tipe_setoran = request.tipe_setoran;
    }
    if (request.sumber_dana) {
      updateData.sumber_dana = request.sumber_dana;
    }
    if (request.akun_kas_id) {
      updateData.akun_kas_id = request.akun_kas_id;
    }

    // Update records jika ada field baru
    if (Object.keys(updateData).length > 0 && tabunganIds.length > 0) {
      const { error: updateError } = await supabase
        .from('santri_tabungan')
        .update(updateData)
        .in('id', tabunganIds);

      if (updateError) {
        console.warn('Warning updating tabungan metadata:', updateError);
        // Don't throw - RPC already succeeded
      }
    }

    return tabunganIds;
  }

  // Tarik massal tabungan santri
  static async tarikMassal(request: TarikMassalRequest): Promise<TarikMassalResult> {
    const { data, error } = await supabase.rpc('tarik_tabungan_santri_massal', {
      p_santri_ids: request.santri_ids,
      p_nominal: request.nominal,
      p_deskripsi: request.deskripsi ?? 'Penarikan massal',
      p_catatan: request.catatan || null,
      p_petugas_id: request.petugas_id || null,
      p_petugas_nama: request.petugas_nama || null
    });

    if (error) {
      throw new Error(`Error tarik massal: ${error.message}`);
    }

    return data;
  }

  // Get riwayat tabungan santri
  static async getRiwayatTabungan(filter: TabunganFilter): Promise<TabunganSantriWithSantri[]> {
    let query = supabase
      .from('santri_tabungan')
      .select(`
        *,
        santri:santri_id (
          id,
          id_santri,
          nama_lengkap,
          nisn,
          kelas,
          kategori
        )
      `)
      .order('created_at', { ascending: false });

    if (filter.santri_id) {
      query = query.eq('santri_id', filter.santri_id);
    }

    if (filter.jenis) {
      query = query.eq('jenis', filter.jenis);
    }

    if (filter.tanggal_mulai) {
      query = query.gte('tanggal', filter.tanggal_mulai);
    }

    if (filter.tanggal_selesai) {
      query = query.lte('tanggal', filter.tanggal_selesai);
    }

    if (filter.search) {
      query = query.or(`deskripsi.ilike.%${filter.search}%,catatan.ilike.%${filter.search}%`);
    }

    if (filter.limit) {
      query = query.limit(filter.limit);
    }

    if (filter.offset) {
      query = query.range(filter.offset, filter.offset + (filter.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error getting riwayat tabungan: ${error.message}`);
    }

    return data || [];
  }

  // Get stats tabungan - OPTIMIZED: menggunakan single RPC call
  static async getTabunganStats(): Promise<TabunganStats> {
    const { data, error } = await supabase.rpc('get_tabungan_stats');

    if (error) {
      throw new Error(`Error getting tabungan stats: ${error.message}`);
    }

    return {
      total_saldo: parseFloat(data?.total_saldo || 0),
      total_setoran_bulan_ini: parseFloat(data?.total_setoran_bulan_ini || 0),
      total_penarikan_bulan_ini: parseFloat(data?.total_penarikan_bulan_ini || 0),
      jumlah_santri_aktif: parseInt(data?.jumlah_santri_aktif || 0),
      rata_rata_saldo: parseFloat(data?.rata_rata_saldo || 0)
    };
  }

  // Get santri dengan saldo tabungan (untuk multi-select)
  static async getSantriWithSaldo(): Promise<SaldoTabunganSantri[]> {
    const { data: santriData, error: santriError } = await supabase
      .from('santri')
      .select(`
        id,
        id_santri,
        nama_lengkap,
        nisn,
        kelas,
        kategori,
        status_santri
      `)
      .eq('status_santri', 'Aktif')
      .order('nama_lengkap');

    if (santriError) {
      throw new Error(`Error getting santri: ${santriError.message}`);
    }

    const saldoPromises = santriData.map(async (santri) => {
      const saldo = await this.getSaldoTabungan(santri.id);
      return {
        santri_id: santri.id,
        saldo,
        santri: {
          id: santri.id,
          id_santri: santri.id_santri,
          nama_lengkap: santri.nama_lengkap,
          nisn: santri.nisn,
          kelas: santri.kelas,
          kategori: santri.kategori
        }
      };
    });

    return Promise.all(saldoPromises);
  }
}
