import { supabase } from '@/integrations/supabase/client';

export interface SetoranHarianInput {
  santri_id: string;
  program: 'TPQ' | 'Tahfid' | 'Tahsin';
  tanggal_setor: string; // YYYY-MM-DD
  status: 'Sudah Setor' | 'Tidak Setor' | 'Izin' | 'Sakit' | 'Hadir';
  agenda_id?: string | null;
  waktu_setor?: string | null; // ISO timestamp
  
  // Jenis aktivitas setoran (hanya untuk status 'Sudah Setor' atau 'Hadir')
  jenis_setoran?: 'Menambah' | 'Murajaah';
  
  // Detail setoran (fleksibel)
  iqra_jilid?: string; // '1' sampai '6'
  iqra_halaman_awal?: number;
  iqra_halaman_akhir?: number;
  surat?: string;
  ayat_awal?: number;
  ayat_akhir?: number;
  juz?: number;
  
  // Penilaian (skema: Maqbul, Jayyid, Jayyid Jiddan, Mumtaz)
  nilai_kelancaran?: string; // 'Maqbul' | 'Jayyid' | 'Jayyid Jiddan' | 'Mumtaz'
  nilai_tajwid?: string; // 'Maqbul' | 'Jayyid' | 'Jayyid Jiddan' | 'Mumtaz'
  catatan?: string;
  perizinan_id?: string;
}

export interface SetoranHarian extends SetoranHarianInput {
  id: string;
  pengurus_id?: string;
  created_at: string;
  agenda?: {
    id: string;
    nama_agenda: string;
    jam_mulai?: string | null;
    jam_selesai?: string | null;
    kelas?: {
      id: string;
      nama_kelas: string;
      program: string;
    } | null;
  } | null;
  santri?: {
    id: string;
    nama_lengkap: string;
    id_santri?: string;
  };
  pengurus?: {
    id: string;
    email?: string;
    full_name?: string;
  };
}

export interface SetoranHarianListOptions {
  santriId?: string;
  agendaId?: string | null;
  jenis?: 'Menambah' | 'Murajaah';
  status?: 'Sudah Setor' | 'Tidak Setor' | 'Izin' | 'Sakit' | 'Hadir';
  startDate?: string;
  endDate?: string;
  order?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface SetoranHarianListResult {
  data: SetoranHarian[];
  total: number;
}

export class SetoranHarianService {
  static async listSetoran(
    program: 'TPQ' | 'Tahfid' | 'Tahsin',
    tanggal: string,
    options?: { agendaId?: string | null }
  ): Promise<SetoranHarian[]> {
    let query = supabase
      .from('setoran_harian')
      .select(`
        *,
        santri:santri_id(id, nama_lengkap, id_santri),
        agenda:agenda_id(
          id,
          nama_agenda,
          jam_mulai,
          jam_selesai,
          kelas:kelas_id(id, nama_kelas, program)
        )
      `)
      .eq('program', program)
      .eq('tanggal_setor', tanggal)
      .order('waktu_setor', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });
    
    if (options?.agendaId) {
      query = query.eq('agenda_id', options.agendaId);
    } else if (options?.agendaId === null) {
      query = query.is('agenda_id', null);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    return SetoranHarianService.attachPengurusProfiles(data || []);
  }

  static async listSetoranRiwayat(
    program: 'TPQ' | 'Tahfid' | 'Tahsin',
    options: SetoranHarianListOptions = {}
  ): Promise<SetoranHarianListResult> {
    const page = options.page ?? 0;
    const pageSize = options.pageSize ?? 20;
    const order = options.order ?? 'desc';

    let query = supabase
      .from('setoran_harian')
      .select(
        `
        *,
        santri:santri_id(id, nama_lengkap, id_santri),
        agenda:agenda_id(
          id,
          nama_agenda,
          hari,
          jam_mulai,
          jam_selesai,
          kelas:kelas_id(id, nama_kelas, program)
        )
      `,
        { count: 'exact' }
      )
      .eq('program', program)
      .order('tanggal_setor', { ascending: order === 'asc' })
      .order('waktu_setor', { ascending: order === 'asc', nullsFirst: order === 'asc' })
      .order('created_at', { ascending: order === 'asc' });

    if (options.santriId) {
      query = query.eq('santri_id', options.santriId);
    }

    if (options.agendaId !== undefined) {
      if (options.agendaId === null) {
        query = query.is('agenda_id', null);
      } else {
        query = query.eq('agenda_id', options.agendaId);
      }
    }

    if (options.jenis) {
      query = query.eq('jenis_setoran', options.jenis);
    }

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.startDate) {
      query = query.gte('tanggal_setor', options.startDate);
    }

    if (options.endDate) {
      query = query.lte('tanggal_setor', options.endDate);
    }

    if (pageSize) {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
          }

    const { data, error, count } = await query;
    if (error) throw error;

    const enriched = await SetoranHarianService.attachPengurusProfiles(data || []);
    return {
      data: enriched,
      total: count ?? enriched.length,
    };
  }

  static async getSetoranBySantri(
    santriId: string,
    program: 'TPQ' | 'Tahfid' | 'Tahsin',
    tanggal: string,
    agendaId?: string | null
  ): Promise<SetoranHarian | null> {
    let query = supabase
      .from('setoran_harian')
      .select(`
        *,
        agenda:agenda_id(
          id,
          nama_agenda,
          jam_mulai,
          jam_selesai
        )
      `)
      .eq('santri_id', santriId)
      .eq('program', program)
      .eq('tanggal_setor', tanggal)
      .order('waktu_setor', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (agendaId) {
      query = query.eq('agenda_id', agendaId);
    } else if (agendaId === null) {
      query = query.is('agenda_id', null);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data as SetoranHarian | null;
  }

  static async createSetoran(input: SetoranHarianInput): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Pastikan jenis_setoran hanya dikirim jika status 'Sudah Setor' atau 'Hadir' dan value valid
    const shouldIncludeJenisSetoran = (input.status === 'Sudah Setor' || input.status === 'Hadir');
    const jenisSetoranValue = shouldIncludeJenisSetoran && input.jenis_setoran 
      ? (input.jenis_setoran === 'Menambah' || input.jenis_setoran === 'Murajaah' ? input.jenis_setoran : null)
      : null;
    
    const payload: any = {
      santri_id: input.santri_id,
      program: input.program,
      tanggal_setor: input.tanggal_setor,
      status: input.status,
      agenda_id: input.agenda_id ?? null,
      waktu_setor: input.waktu_setor ?? new Date().toISOString(),
      iqra_jilid: input.iqra_jilid || null,
      iqra_halaman_awal: input.iqra_halaman_awal || null,
      iqra_halaman_akhir: input.iqra_halaman_akhir || null,
      surat: input.surat || null,
      ayat_awal: input.ayat_awal || null,
      ayat_akhir: input.ayat_akhir || null,
      juz: input.juz || null,
      nilai_kelancaran: input.nilai_kelancaran || null,
      nilai_tajwid: input.nilai_tajwid || null,
      catatan: input.catatan || null,
      perizinan_id: input.perizinan_id || null,
      pengurus_id: user?.id || null,
    };
    
    // Hanya tambahkan jenis_setoran jika value valid (bukan empty string)
    if (jenisSetoranValue) {
      payload.jenis_setoran = jenisSetoranValue;
    }
    
    const { error } = await supabase
      .from('setoran_harian')
      .insert(payload);
    
    if (error) throw error;
  }

  static async updateSetoran(id: string, input: Partial<SetoranHarianInput>): Promise<void> {
    // Prepare update payload dengan handle jenis_setoran yang benar
    const updatePayload: any = { ...input };
    
    // Handle jenis_setoran: hanya kirim jika status 'Sudah Setor' atau 'Hadir' dan value valid
    if ('status' in input || 'jenis_setoran' in input) {
      const status = input.status || undefined;
      const jenisSetoran = input.jenis_setoran;
      
      const shouldIncludeJenisSetoran = status === 'Sudah Setor' || status === 'Hadir';
      
      if (shouldIncludeJenisSetoran && jenisSetoran && 
          (jenisSetoran === 'Menambah' || jenisSetoran === 'Murajaah')) {
        updatePayload.jenis_setoran = jenisSetoran;
      } else if (!shouldIncludeJenisSetoran || !jenisSetoran) {
        // Set ke null jika status bukan 'Sudah Setor'/'Hadir' atau jenis_setoran tidak valid
        updatePayload.jenis_setoran = null;
      }
    }

    if ('agenda_id' in input) {
      updatePayload.agenda_id = input.agenda_id || null;
    }

    if ('waktu_setor' in input) {
      updatePayload.waktu_setor = input.waktu_setor || null;
    }
    
    const { error } = await supabase
      .from('setoran_harian')
      .update(updatePayload)
      .eq('id', id);
    
    if (error) throw error;
  }

  static async deleteSetoran(id: string): Promise<void> {
    const { error } = await supabase
      .from('setoran_harian')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  static async getSantriBelumSetor(program: 'TPQ' | 'Tahfid' | 'Tahsin', tanggal: string): Promise<Array<{ id: string; nama_lengkap: string; id_santri?: string }>> {
    // Manual query untuk santri yang belum setor hari ini (exclude perizinan approved)
    const { data: allSantri, error: santriError } = await supabase
      .from('santri')
      .select('id, nama_lengkap, id_santri')
      .or('kategori.ilike.%Binaan Mukim%,kategori.ilike.%Binaan Non-Mukim%');
    
    if (santriError) throw santriError;
    
    const { data: setoranData } = await supabase
      .from('setoran_harian')
      .select('santri_id')
      .eq('program', program)
      .eq('tanggal_setor', tanggal)
      .in('status', ['Sudah Setor', 'Hadir']);
    
    const { data: perizinanData } = await supabase
      .from('perizinan_santri')
      .select('santri_id')
      .eq('status', 'approved')
      .lte('tanggal_mulai', tanggal)
      .gte('tanggal_selesai', tanggal);
    
    const sudahSetor = new Set((setoranData || []).map(s => s.santri_id));
    const adaPerizinan = new Set((perizinanData || []).map(p => p.santri_id));
    
    return (allSantri || []).filter(s => 
      !sudahSetor.has(s.id) && !adaPerizinan.has(s.id)
    );
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

  static async getStatusSetoranHariIni(
    santriIds: string[],
    tanggal: string
  ): Promise<Record<
    string,
    Array<{
      program: 'TPQ' | 'Tahfid' | 'Tahsin';
      status: string;
      jenis_setoran?: 'Menambah' | 'Murajaah';
      agenda_id?: string | null;
      waktu_setor?: string | null;
    }>
  >> {
    if (!santriIds || santriIds.length === 0) {
      return {};
    }

    const { data, error } = await supabase
      .from('setoran_harian')
      .select('santri_id, program, status, jenis_setoran, agenda_id, waktu_setor')
      .in('santri_id', santriIds)
      .eq('tanggal_setor', tanggal)
      .order('waktu_setor', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    const result: Record<string, Array<{
      program: 'TPQ' | 'Tahfid' | 'Tahsin';
      status: string;
      jenis_setoran?: 'Menambah' | 'Murajaah';
      agenda_id?: string | null;
      waktu_setor?: string | null;
    }>> = {};

    (data || []).forEach((row: any) => {
      if (!result[row.santri_id]) {
        result[row.santri_id] = [];
      }
      result[row.santri_id].push({
        program: row.program,
        status: row.status,
        jenis_setoran: row.jenis_setoran || undefined,
        agenda_id: row.agenda_id || null,
        waktu_setor: row.waktu_setor || null,
      });
    });

    return result;
  }

  /**
   * Get santri binaan mukim yang belum setor hari ini
   * Exclude: yang sudah setor (semua program) dan yang ada perizinan approved
   */
  static async getSantriBinaanMukimBelumSetor(tanggal: string): Promise<Array<{
    id: string;
    nama_lengkap: string;
    id_santri?: string;
    kategori: string;
  }>> {
    // Get semua santri binaan mukim aktif
    const { data: allSantri, error: santriError } = await supabase
      .from('santri')
      .select('id, nama_lengkap, id_santri, kategori')
      .ilike('kategori', '%Binaan Mukim%')
      .eq('status_santri', 'Aktif');
    
    if (santriError) throw santriError;
    
    // Get yang sudah setor hari ini (semua program)
    const { data: setoranData } = await supabase
      .from('setoran_harian')
      .select('santri_id')
      .eq('tanggal_setor', tanggal)
      .in('status', ['Sudah Setor', 'Hadir']);
    
    // Get yang ada perizinan approved
    const { data: perizinanData } = await supabase
      .from('perizinan_santri')
      .select('santri_id')
      .eq('status', 'approved')
      .lte('tanggal_mulai', tanggal)
      .gte('tanggal_selesai', tanggal);
    
    const sudahSetor = new Set((setoranData || []).map(s => s.santri_id));
    const adaPerizinan = new Set((perizinanData || []).map(p => p.santri_id));
    
    return (allSantri || []).filter(s => 
      !sudahSetor.has(s.id) && !adaPerizinan.has(s.id)
    );
  }

  /**
   * Get progress tracking untuk santri (LENGKAP)
   * Menampilkan setoran terakhir, total setoran, statistik 30 hari terakhir,
   * rasio Menambah/Murajaah, streak harian, dan rata-rata nilai
   */
  static async getProgressSantri(santriId: string, program: 'TPQ' | 'Tahfid' | 'Tahsin'): Promise<{
    setoran_terakhir?: {
      tanggal: string;
      detail: string;
      nilai?: string;
      jenis_setoran?: 'Menambah' | 'Murajaah';
    } | null;
    total_setoran: number;
    last_30_days: number;
    menambah_30_days: number;
    murajaah_30_days: number;
    streak_harian: number;
    avg_kelancaran?: string;
    avg_tajwid?: string;
  }> {
    // Get setoran terakhir
    const { data: lastSetoran } = await supabase
      .from('setoran_harian')
      .select('tanggal_setor, waktu_setor, iqra_jilid, iqra_halaman_awal, iqra_halaman_akhir, surat, ayat_awal, ayat_akhir, juz, nilai_kelancaran, nilai_tajwid, jenis_setoran')
      .eq('santri_id', santriId)
      .eq('program', program)
      .in('status', ['Sudah Setor', 'Hadir'])
      .order('waktu_setor', { ascending: false, nullsFirst: false })
      .order('tanggal_setor', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    // Get stats
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
    
    // Total setoran (all time)
    const { count: totalCount } = await supabase
      .from('setoran_harian')
      .select('*', { count: 'exact', head: true })
      .eq('santri_id', santriId)
      .eq('program', program)
      .in('status', ['Sudah Setor', 'Hadir']);
    
    // Setoran 30 hari terakhir
    const { data: last30Setoran } = await supabase
      .from('setoran_harian')
      .select('tanggal_setor, jenis_setoran, nilai_kelancaran, nilai_tajwid')
      .eq('santri_id', santriId)
      .eq('program', program)
      .in('status', ['Sudah Setor', 'Hadir'])
      .gte('tanggal_setor', thirtyDaysAgoStr)
      .order('tanggal_setor', { ascending: false });
    
    const last30Count = last30Setoran?.length || 0;
    
    // Hitung Menambah vs Murajaah (30 hari)
    const menambah30 = (last30Setoran || []).filter(s => s.jenis_setoran === 'Menambah').length;
    const murajaah30 = (last30Setoran || []).filter(s => s.jenis_setoran === 'Murajaah').length;
    
    // Hitung streak harian (hari berturut-turut setor, tidak termasuk hari ini jika belum setor)
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get semua setoran untuk hitung streak
    const { data: allSetoran } = await supabase
      .from('setoran_harian')
      .select('tanggal_setor, waktu_setor')
      .eq('santri_id', santriId)
      .eq('program', program)
      .in('status', ['Sudah Setor', 'Hadir'])
      .order('waktu_setor', { ascending: false, nullsFirst: false })
      .order('tanggal_setor', { ascending: false })
      .limit(100); // Ambil 100 hari terakhir untuk hitung streak
    
    if (allSetoran && allSetoran.length > 0) {
      const setoranDates = new Set((allSetoran || []).map(s => s.tanggal_setor));
      let checkDate = new Date(today);
      
      // Mulai dari hari ini atau kemarin (jika hari ini belum setor)
      const todayStr = today.toISOString().split('T')[0];
      if (!setoranDates.has(todayStr)) {
        checkDate.setDate(checkDate.getDate() - 1);
      }
      
      // Hitung streak mundur
      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (setoranDates.has(dateStr)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }
    
    // Hitung rata-rata nilai (mapping qualitative ke numeric untuk rata-rata)
    const nilaiMap: Record<string, number> = {
      'Maqbul': 1,
      'Jayyid': 2,
      'Jayyid Jiddan': 3,
      'Mumtaz': 4
    };
    
    const reverseMap: Record<number, string> = {
      1: 'Maqbul',
      2: 'Jayyid',
      3: 'Jayyid Jiddan',
      4: 'Mumtaz'
    };
    
    const kelancaranValues = (last30Setoran || [])
      .map(s => s.nilai_kelancaran)
      .filter((v): v is string => !!v && v in nilaiMap)
      .map(v => nilaiMap[v]);
    
    const tajwidValues = (last30Setoran || [])
      .map(s => s.nilai_tajwid)
      .filter((v): v is string => !!v && v in nilaiMap)
      .map(v => nilaiMap[v]);
    
    const avgKelancaran = kelancaranValues.length > 0
      ? reverseMap[Math.round(kelancaranValues.reduce((a, b) => a + b, 0) / kelancaranValues.length)]
      : undefined;
    
    const avgTajwid = tajwidValues.length > 0
      ? reverseMap[Math.round(tajwidValues.reduce((a, b) => a + b, 0) / tajwidValues.length)]
      : undefined;
    
    // Format detail setoran terakhir
    let detail = '-';
    if (lastSetoran) {
      if (program === 'TPQ' && lastSetoran.iqra_halaman_awal && lastSetoran.iqra_halaman_akhir) {
        detail = `Iqra' ${lastSetoran.iqra_jilid ? `Jilid ${lastSetoran.iqra_jilid} ` : ''}Hlm. ${lastSetoran.iqra_halaman_awal}-${lastSetoran.iqra_halaman_akhir}`;
        if (lastSetoran.surat) {
          detail += ` + ${lastSetoran.surat}`;
        }
      } else if (lastSetoran.surat) {
        detail = `${lastSetoran.surat}${lastSetoran.ayat_awal ? ` Ayat ${lastSetoran.ayat_awal}-${lastSetoran.ayat_akhir || lastSetoran.ayat_awal}` : ''}`;
        if (lastSetoran.juz) {
          detail += ` (Juz ${lastSetoran.juz})`;
        }
      } else if (lastSetoran.juz) {
        detail = `Juz ${lastSetoran.juz}`;
      }
    }
    
    return {
      setoran_terakhir: lastSetoran ? {
        tanggal: lastSetoran.tanggal_setor,
        detail,
        nilai: lastSetoran.nilai_kelancaran && lastSetoran.nilai_tajwid 
          ? `${lastSetoran.nilai_kelancaran}/${lastSetoran.nilai_tajwid}`
          : undefined,
        jenis_setoran: lastSetoran.jenis_setoran as 'Menambah' | 'Murajaah' | undefined
      } : null,
      total_setoran: totalCount || 0,
      last_30_days: last30Count,
      menambah_30_days: menambah30,
      murajaah_30_days: murajaah30,
      streak_harian: streak,
      avg_kelancaran: avgKelancaran,
      avg_tajwid: avgTajwid
    };
  }

  /**
   * Get dashboard summary untuk Master Akademik
   * Menampilkan KPI ringkas, statistik setoran, dan daftar perhatian
   */
  static async getDashboardSummary(params?: {
    program?: 'TPQ' | 'Tahfid' | 'Tahsin';
    tanggal?: string;
  }): Promise<{
    kpi: {
      total_setoran_hari_ini: number;
      persentase_hadir: number;
      menambah_count: number;
      murajaah_count: number;
      distribusi_nilai: {
        Mumtaz: number;
        'Jayyid Jiddan': number;
        Jayyid: number;
        Maqbul: number;
      };
    };
    perhatian: {
      belum_setor_binaan_mukim: number;
      santri_belum_setor: Array<{
        id: string;
        nama_lengkap: string;
        id_santri?: string;
      }>;
    };
  }> {
    const tanggal = params?.tanggal || new Date().toISOString().split('T')[0];
    const program = params?.program;

    // Get setoran hari ini
    const setoranQuery = supabase
      .from('setoran_harian')
      .select('status, jenis_setoran, nilai_kelancaran, nilai_tajwid, santri_id')
      .eq('tanggal_setor', tanggal)
      .in('status', ['Sudah Setor', 'Hadir']);

    if (program) {
      setoranQuery.eq('program', program);
    }

    const { data: setoranHariIni, error: setoranError } = await setoranQuery;

    if (setoranError) throw setoranError;

    // Get total santri aktif (untuk hitung % hadir)
    const santriQuery = supabase
      .from('santri')
      .select('id', { count: 'exact', head: true })
      .or('kategori.ilike.%Binaan Mukim%,kategori.ilike.%Binaan Non-Mukim%')
      .eq('status_santri', 'Aktif');

    const { count: totalSantriAktif } = await santriQuery;

    // Hitung KPI
    const totalSetoran = setoranHariIni?.length || 0;
    const menambahCount = (setoranHariIni || []).filter(s => s.jenis_setoran === 'Menambah').length;
    const murajaahCount = (setoranHariIni || []).filter(s => s.jenis_setoran === 'Murajaah').length;

    // Distribusi nilai
    const distribusiNilai = {
      Mumtaz: 0,
      'Jayyid Jiddan': 0,
      Jayyid: 0,
      Maqbul: 0
    };

    (setoranHariIni || []).forEach(s => {
      if (s.nilai_kelancaran && s.nilai_kelancaran in distribusiNilai) {
        distribusiNilai[s.nilai_kelancaran as keyof typeof distribusiNilai]++;
      }
      if (s.nilai_tajwid && s.nilai_tajwid in distribusiNilai) {
        distribusiNilai[s.nilai_tajwid as keyof typeof distribusiNilai]++;
      }
    });

    // Get binaan mukim yang belum setor
    const belumSetor = await this.getSantriBinaanMukimBelumSetor(tanggal);

    return {
      kpi: {
        total_setoran_hari_ini: totalSetoran,
        persentase_hadir: totalSantriAktif ? Math.round((totalSetoran / totalSantriAktif) * 100) : 0,
        menambah_count: menambahCount,
        murajaah_count: murajaahCount,
        distribusi_nilai: distribusiNilai
      },
      perhatian: {
        belum_setor_binaan_mukim: belumSetor.length,
        santri_belum_setor: belumSetor
      }
    };
  }

  private static async attachPengurusProfiles(rows: any[]): Promise<SetoranHarian[]> {
    return Promise.all(
      (rows || []).map(async (item: any) => {
        if (item && item.pengurus_id) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, email, full_name')
              .eq('id', item.pengurus_id)
              .maybeSingle();

            return {
              ...item,
              pengurus: profile || null,
            };
          } catch (err) {
            console.warn(`Error fetching pengurus profile for ${item.pengurus_id}:`, err);
            return {
              ...item,
              pengurus: null,
            };
          }
        }
        return {
          ...item,
          pengurus: null,
        };
      })
    ) as unknown as SetoranHarian[];
  }
}

