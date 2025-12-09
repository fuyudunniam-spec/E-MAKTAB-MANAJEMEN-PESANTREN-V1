import { supabase } from '@/integrations/supabase/client';

export interface KelasMasterInput {
  nama_kelas: string;
  program: string; // Fleksibel, tidak terbatas pada 4 opsi
  rombel?: string;
  tingkat?: string;
  tahun_ajaran?: string;
  semester?: string;
  status?: 'Aktif' | 'Non-Aktif';
  tahun_ajaran_id?: string | null;
  semester_id?: string | null;
  tanggal_mulai?: string | null; // Tanggal mulai periode aktif kelas
  tanggal_selesai?: string | null; // Tanggal selesai periode aktif kelas
}

export interface KelasMaster extends KelasMasterInput {
  id: string;
  created_at: string;
}

export class AkademikKelasService {
  /**
   * Get kelas yang di-assign ke pengajar tertentu (melalui agenda)
   * @param pengajarId ID pengajar
   * @param options Opsi filter tambahan
   */
  static async listKelasByPengajar(
    pengajarId: string,
    options?: { semesterId?: string }
  ): Promise<KelasMaster[]> {
    if (!pengajarId) return [];

    // Ambil kelas dari agenda yang di-assign ke pengajar ini
    let agendaQuery = supabase
      .from('kelas_agenda')
      .select('kelas_id, kelas:kelas_id(*)')
      .eq('pengajar_id', pengajarId)
      .eq('aktif', true);

    const { data: agendas, error: agendaError } = await agendaQuery;

    if (agendaError) throw agendaError;

    // Extract unique kelas
    const kelasMap = new Map<string, KelasMaster>();
    (agendas || []).forEach((agenda: any) => {
      if (agenda.kelas && !kelasMap.has(agenda.kelas.id)) {
        // Filter berdasarkan semester jika disediakan
        if (!options?.semesterId || agenda.kelas.semester_id === options.semesterId) {
          kelasMap.set(agenda.kelas.id, agenda.kelas as KelasMaster);
        }
      }
    });

    return Array.from(kelasMap.values());
  }

  static async listKelas(): Promise<Array<KelasMaster & { jumlah_anggota: number; jumlah_agenda: number }>> {
    // Fetch kelas and members count using RPC or manual join
    const { data, error } = await supabase
      .from('kelas_master')
      .select(`
        id, 
        nama_kelas, 
        program, 
        rombel, 
        tingkat, 
        tahun_ajaran, 
        semester, 
        status, 
        tahun_ajaran_id, 
        semester_id, 
        tanggal_mulai,
        tanggal_selesai,
        created_at,
        semester:semester_id(id, nama, tahun_ajaran:tahun_ajaran_id(nama))
      `);
    if (error) throw error;

    const kelasIds = (data || []).map(k => k.id);
    if (kelasIds.length === 0) return [];

    const { data: counts, error: err2 } = await supabase
      .from('kelas_anggota')
      .select('kelas_id, count:kelas_id', { count: 'exact', head: false })
      .in('kelas_id', kelasIds)
      .eq('status', 'Aktif');
    if (err2) throw err2;

    const kelasIdToCount: Record<string, number> = {};
    (counts || []).forEach((row: any) => {
      const key = row.kelas_id;
      kelasIdToCount[key] = (kelasIdToCount[key] || 0) + 1;
    });

    const { data: agendaRows, error: agendaErr } = await supabase
      .from('kelas_agenda')
      .select('kelas_id')
      .in('kelas_id', kelasIds)
      .eq('aktif', true);
    if (agendaErr) throw agendaErr;

    const kelasIdToAgenda: Record<string, number> = {};
    (agendaRows || []).forEach((row: any) => {
      const key = row.kelas_id;
      kelasIdToAgenda[key] = (kelasIdToAgenda[key] || 0) + 1;
    });

    return (data || []).map(k => {
      // Gunakan semester dari relasi jika ada, jika tidak gunakan dari field semester
      const semesterData = (k as any).semester;
      const semesterNama = semesterData?.nama || k.semester;
      const tahunAjaranNama = semesterData?.tahun_ajaran?.nama || k.tahun_ajaran;
      
      return {
        ...k,
        semester: semesterNama,
        tahun_ajaran: tahunAjaranNama,
        jumlah_anggota: kelasIdToCount[k.id] || 0,
        jumlah_agenda: kelasIdToAgenda[k.id] || 0,
      };
    });
  }

  static async createKelas(input: KelasMasterInput): Promise<KelasMaster> {
    const payload = {
      nama_kelas: input.nama_kelas,
      program: input.program,
      rombel: input.rombel || null,
      tingkat: input.tingkat || null,
      tahun_ajaran: input.tahun_ajaran || '2024/2025',
      semester: input.semester || 'Ganjil',
      status: input.status || 'Aktif',
      tahun_ajaran_id: input.tahun_ajaran_id || null,
      semester_id: input.semester_id || null,
      tanggal_mulai: input.tanggal_mulai || null,
      tanggal_selesai: input.tanggal_selesai || null,
    };
    const { data, error } = await supabase.from('kelas_master').insert(payload).select().single();
    if (error) throw error;
    return data as KelasMaster;
  }

  static async createKelasBulk(inputs: KelasMasterInput[]): Promise<KelasMaster[]> {
    if (!inputs || inputs.length === 0) return [];
    const rows = inputs.map((i) => ({
      nama_kelas: i.nama_kelas,
      program: i.program,
      rombel: i.rombel || null,
      tingkat: i.tingkat || null,
      tahun_ajaran: i.tahun_ajaran || '2024/2025',
      semester: i.semester || 'Ganjil',
      status: i.status || 'Aktif',
      tahun_ajaran_id: i.tahun_ajaran_id || null,
      semester_id: i.semester_id || null,
      tanggal_mulai: i.tanggal_mulai || null,
      tanggal_selesai: i.tanggal_selesai || null,
    }));
    const { data, error } = await supabase.from('kelas_master').insert(rows).select();
    if (error) throw error;
    return (data || []) as KelasMaster[];
  }
  static async updateKelas(id: string, input: Partial<KelasMasterInput>): Promise<void> {
    const { error } = await supabase.from('kelas_master').update(input).eq('id', id);
    if (error) throw error;
  }

  static async deleteKelas(id: string): Promise<void> {
    // Hapus data terkait terlebih dahulu untuk menghindari constraint violation
    // Urutan penting: mulai dari yang paling dependen ke yang paling independen
    
    // 1. Hapus pertemuan (jurnal pertemuan)
    await supabase.from('kelas_pertemuan').delete().eq('kelas_id', id);
    
    // 2. Hapus absensi yang terkait dengan kelas
    await supabase.from('absensi_madin').delete().eq('kelas_id', id);
    
    // 3. Ambil semua agenda_id yang terkait dengan kelas ini
    const { data: agendas } = await supabase
      .from('kelas_agenda')
      .select('id')
      .eq('kelas_id', id);
    
    const agendaIds = (agendas || []).map(a => a.id);
    
    // 4. Update setoran_harian yang terkait dengan agenda (set agenda_id menjadi NULL)
    // Ini lebih aman daripada menghapus karena setoran adalah data historis penting
    if (agendaIds.length > 0) {
      await supabase
        .from('setoran_harian')
        .update({ agenda_id: null })
        .in('agenda_id', agendaIds);
    }
    
    // 5. Hapus agenda (setelah setoran sudah diupdate)
    await supabase.from('kelas_agenda').delete().eq('kelas_id', id);
    
    // 6. Hapus anggota kelas
    await supabase.from('kelas_anggota').delete().eq('kelas_id', id);
    
    // 7. Hapus kelas master (sekarang sudah aman karena semua referensi sudah dihapus)
    const { error } = await supabase.from('kelas_master').delete().eq('id', id);
    if (error) throw error;
  }

  static async getKelasById(id: string): Promise<KelasMaster | null> {
    const { data, error } = await supabase
      .from('kelas_master')
      .select(`
        id, 
        nama_kelas, 
        program, 
        rombel, 
        tingkat, 
        tahun_ajaran, 
        semester, 
        status, 
        tahun_ajaran_id, 
        semester_id, 
        tanggal_mulai,
        tanggal_selesai,
        created_at,
        semester:semester_id(id, nama, tahun_ajaran:tahun_ajaran_id(nama))
      `)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    
    if (!data) return null;
    
    // Gunakan semester dari relasi jika ada
    const semesterData = (data as any).semester;
    const semesterNama = semesterData?.nama || data.semester;
    const tahunAjaranNama = semesterData?.tahun_ajaran?.nama || data.tahun_ajaran;
    
    return {
      ...data,
      semester: semesterNama,
      tahun_ajaran: tahunAjaranNama,
    } as KelasMaster;
  }

  /**
   * Update semester untuk kelas yang sudah ada berdasarkan semester aktif
   */
  static async updateKelasSemester(kelasId: string, semesterId: string, tahunAjaranId: string, semesterNama: string, tahunAjaranNama: string): Promise<void> {
    const { error } = await supabase
      .from('kelas_master')
      .update({
        semester_id: semesterId,
        tahun_ajaran_id: tahunAjaranId,
        semester: semesterNama,
        tahun_ajaran: tahunAjaranNama,
      })
      .eq('id', kelasId);
    if (error) throw error;
  }
}


