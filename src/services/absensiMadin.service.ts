import { supabase } from '@/integrations/supabase/client';

export interface AbsensiMadinInput {
  santri_id: string;
  kelas_id: string;
  tanggal: string; // YYYY-MM-DD
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alfa';
  materi?: string;
  pengajar_id?: string;
  agenda_id?: string | null;
  pertemuan_id?: string | null; // Link ke jurnal pertemuan
}

export interface AbsensiMadin extends AbsensiMadinInput {
  id: string;
  created_at: string;
  santri?: {
    id: string;
    nama_lengkap: string;
    id_santri?: string;
  };
  kelas?: {
    id: string;
    nama_kelas: string;
    program: string;
  };
  agenda?: {
    id: string;
    nama_agenda: string;
    jam_mulai?: string | null;
    jam_selesai?: string | null;
    mapel_nama?: string | null;
    pengajar_nama?: string | null;
    kitab?: string | null;
  } | null;
}

export class AbsensiMadinService {
  static async listAbsensi(kelasId: string, tanggal: string, agendaId?: string | null): Promise<AbsensiMadin[]> {
    try {
      let query = supabase
        .from('absensi_madin')
        .select(`
          *,
          santri:santri_id(id, nama_lengkap, id_santri),
          kelas:kelas_id(id, nama_kelas, program),
          agenda:agenda_id(id, nama_agenda, jam_mulai, jam_selesai, mapel_nama, pengajar_nama, kitab)
        `)
        .eq('kelas_id', kelasId)
        .eq('tanggal', tanggal)
        .order('created_at', { ascending: true });

      if (agendaId) {
        query = query.eq('agenda_id', agendaId);
      } else {
        query = query.is('agenda_id', null);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('[AbsensiMadinService] Error loading absensi:', error);
        throw error;
      }
      
      return (data || []) as AbsensiMadin[];
    } catch (error: any) {
      console.error('[AbsensiMadinService] Error in listAbsensi:', {
        kelasId,
        tanggal,
        agendaId,
        error: error.message || error,
      });
      throw error;
    }
  }

  static async listAbsensiByKelas(
    kelasId: string,
    options?: { startDate?: string; endDate?: string }
  ): Promise<AbsensiMadin[]> {
    let query = supabase
      .from('absensi_madin')
      .select(`
        *,
        santri:santri_id(id, nama_lengkap, id_santri),
        agenda:agenda_id(id, nama_agenda, jam_mulai, jam_selesai, mapel_nama, pengajar_nama, kitab)
      `)
      .eq('kelas_id', kelasId)
      .order('tanggal', { ascending: false })
      .order('created_at', { ascending: false });

    if (options?.startDate) {
      query = query.gte('tanggal', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('tanggal', options.endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as AbsensiMadin[];
  }

  static async getAbsensiBySantri(
    santriId: string,
    tanggal: string,
    kelasId: string,
    agendaId?: string | null
  ): Promise<AbsensiMadin | null> {
    let query = supabase
      .from('absensi_madin')
      .select('*')
      .eq('santri_id', santriId)
      .eq('tanggal', tanggal)
      .eq('kelas_id', kelasId);

    if (agendaId) {
      query = query.eq('agenda_id', agendaId);
    } else {
      query = query.is('agenda_id', null);
    }

    const { data, error } = await query.maybeSingle();
 
    if (error) throw error;
    return data as AbsensiMadin | null;
  }

  static async createAbsensi(input: AbsensiMadinInput): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Validasi input
    if (!input.santri_id || !input.kelas_id || !input.tanggal || !input.status) {
      throw new Error('Data absensi tidak lengkap: santri_id, kelas_id, tanggal, dan status wajib diisi');
    }
    
    // Build payload dengan hanya field yang valid
    const payload: any = {
      santri_id: input.santri_id,
      kelas_id: input.kelas_id,
      tanggal: input.tanggal,
      status: input.status,
    };
    
    // Optional fields
    if (input.materi) payload.materi = input.materi;
    if (input.pengajar_id || user?.id) payload.pengajar_id = input.pengajar_id || user?.id;
    if (input.agenda_id) payload.agenda_id = input.agenda_id;
    
    // Link ke jurnal pertemuan untuk sinkronisasi data
    if (input.pertemuan_id) payload.pertemuan_id = input.pertemuan_id;
    
    const { error } = await supabase
      .from('absensi_madin')
      .insert(payload);
    
    if (error) {
      console.error('[AbsensiMadinService] Error creating absensi:', {
        payload,
        error: error.message,
        details: error,
      });
      throw new Error(error.message || 'Gagal menyimpan absensi');
    }
  }

  static async updateAbsensi(id: string, input: Partial<AbsensiMadinInput>): Promise<void> {
    const payload: any = {};
    
    // Hanya update field yang ada di input dan ada di database schema
    if ('materi' in input) payload.materi = input.materi || null;
    if ('pengajar_id' in input) payload.pengajar_id = input.pengajar_id || null;
    if ('agenda_id' in input) payload.agenda_id = input.agenda_id || null;
    if ('status' in input) payload.status = input.status;
    
    // Update pertemuan_id untuk sinkronisasi dengan jurnal pertemuan
    if ('pertemuan_id' in input) {
      payload.pertemuan_id = input.pertemuan_id || null;
    }

    if (Object.keys(payload).length === 0) {
      return; // Tidak ada yang perlu di-update
    }

    const { error } = await supabase
      .from('absensi_madin')
      .update(payload)
      .eq('id', id);
    
    if (error) {
      console.error('[AbsensiMadinService] Error updating absensi:', {
        id,
        payload,
        error: error.message,
        details: error,
      });
      throw new Error(error.message || 'Gagal memperbarui absensi');
    }
  }

  static async deleteAbsensi(id: string): Promise<void> {
    const { error } = await supabase
      .from('absensi_madin')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  static async getAnggotaKelas(kelasId: string): Promise<Array<{ id: string; nama_lengkap: string; id_santri?: string }>> {
    const { data, error } = await supabase
      .from('kelas_anggota')
      .select('santri:santri_id(id, nama_lengkap, id_santri)')
      .eq('kelas_id', kelasId)
      .eq('status', 'Aktif');
    
    if (error) throw error;
    
    // Filter dan map data dengan validasi
    const anggota = (data || [])
      .map((row: any) => row.santri)
      .filter((santri: any) => santri && santri.id && santri.nama_lengkap);
    
    return anggota;
  }

  static async checkPerizinan(santriId: string, tanggal: string): Promise<{ jenis?: string; status?: string } | null> {
    const { data, error } = await supabase
      .from('perizinan_santri')
      .select('jenis, status')
      .eq('santri_id', santriId)
      .eq('status', 'approved')
      .lte('tanggal_mulai', tanggal)
      .gte('tanggal_selesai', tanggal)
      .maybeSingle();
    
    if (error) throw error;
    return data || null;
  }
}

