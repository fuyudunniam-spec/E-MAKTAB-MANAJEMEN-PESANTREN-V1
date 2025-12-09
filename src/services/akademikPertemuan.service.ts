import { supabase } from '@/integrations/supabase/client';

export type PertemuanStatus = 'Terjadwal' | 'Berjalan' | 'Selesai' | 'Batal' | 'Tunda';

export interface KelasPertemuanInput {
  agenda_id: string;
  kelas_id?: string;
  tanggal: string;
  status?: PertemuanStatus;
  pengajar_id?: string | null;
  pengajar_nama?: string | null;
  materi?: string | null;
  catatan?: string | null;
}

export interface KelasPertemuan extends KelasPertemuanInput {
  id: string;
  kelas?: {
    id: string;
    nama_kelas: string;
    program: string;
    rombel?: string | null;
    semester_id?: string | null;
  } | null;
  agenda?: {
    id: string;
    nama_agenda: string;
    hari?: string | null;
    jam_mulai?: string | null;
    jam_selesai?: string | null;
    kelas_id: string;
    mapel_nama?: string | null;
    lokasi?: string | null;
    pengajar_id?: string | null;
    pengajar_nama?: string | null;
    pengajar?: {
      id: string;
      nama_lengkap: string;
      status: string;
    } | null;
    mapel?: {
      id: string;
      nama_mapel: string;
      program: string;
    } | null;
  } | null;
  created_at: string;
  updated_at: string;
}

export class AkademikPertemuanService {
  static async listPertemuan(params: {
    program?: string;
    kelasId?: string;
    agendaId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<KelasPertemuan[]> {
    let query = supabase
      .from('kelas_pertemuan')
      .select(
        `
          *,
          agenda:agenda_id(
            id, 
            nama_agenda, 
            hari, 
            jam_mulai, 
            jam_selesai, 
            kelas_id,
            mapel_nama,
            lokasi,
            pengajar_id,
            pengajar_nama,
            pengajar:pengajar_id(id, nama_lengkap, status),
            mapel:mapel_id(id, nama_mapel, program)
          ),
          kelas:kelas_id(id, nama_kelas, program, rombel, semester_id)
        `,
      )
      .order('tanggal', { ascending: true })
      .order('created_at', { ascending: true });

    if (params.agendaId) {
      query = query.eq('agenda_id', params.agendaId);
    }
    if (params.kelasId) {
      query = query.eq('kelas_id', params.kelasId);
    }
    if (params.program) {
      query = query.eq('kelas.program', params.program);
    }
    if (params.startDate) {
      query = query.gte('tanggal', params.startDate);
    }
    if (params.endDate) {
      query = query.lte('tanggal', params.endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as unknown as KelasPertemuan[];
  }

  static async createPertemuan(input: KelasPertemuanInput): Promise<void> {
    if (!input.agenda_id) throw new Error('Agenda wajib dipilih');
    const payload = {
      agenda_id: input.agenda_id,
      kelas_id: input.kelas_id || null,
      tanggal: input.tanggal,
      status: input.status || 'Terjadwal',
      pengajar_id: input.pengajar_id || null,
      pengajar_nama: input.pengajar_nama || null,
      materi: input.materi || null,
      catatan: input.catatan || null,
    };
    const { error } = await supabase.from('kelas_pertemuan').insert(payload);
    if (error) throw error;
  }

  static async updatePertemuan(id: string, input: Partial<KelasPertemuanInput>): Promise<void> {
    if (!id) throw new Error('ID pertemuan wajib ada');
    const payload: any = { ...input };
    if ('pengajar_id' in input) payload.pengajar_id = input.pengajar_id || null;
    if ('pengajar_nama' in input) payload.pengajar_nama = input.pengajar_nama || null;
    if ('materi' in input) payload.materi = input.materi || null;
    if ('catatan' in input) payload.catatan = input.catatan || null;
    const { error } = await supabase.from('kelas_pertemuan').update(payload).eq('id', id);
    if (error) throw error;
  }

  static async deletePertemuan(id: string): Promise<void> {
    if (!id) return;
    const { error } = await supabase.from('kelas_pertemuan').delete().eq('id', id);
    if (error) throw error;
  }

  /**
   * Generate pertemuan otomatis berdasarkan jadwal agenda
   * @param semesterId ID semester
   * @param options Opsi untuk filter kelas dan agenda
   * @returns Jumlah pertemuan yang berhasil dibuat
   */
  static async generatePertemuanOtomatis(
    semesterId: string,
    options?: {
      kelasId?: string;
      agendaId?: string;
      overwrite?: boolean; // Jika true, hapus pertemuan yang sudah ada terlebih dahulu
    }
  ): Promise<{ created: number; skipped: number; errors: number }> {
    // Ambil data semester
    const { data: semester, error: semesterError } = await supabase
      .from('akademik_semester')
      .select('tanggal_mulai, tanggal_selesai')
      .eq('id', semesterId)
      .single();

    if (semesterError || !semester) {
      throw new Error('Semester tidak ditemukan');
    }

    // Ambil semua agenda yang relevan
    let agendaQuery = supabase
      .from('kelas_agenda')
      .select('id, kelas_id, hari, tanggal_mulai, tanggal_selesai, aktif')
      .eq('aktif', true)
      .not('hari', 'is', null);

    // Filter berdasarkan kelas jika dipilih
    if (options?.kelasId) {
      agendaQuery = agendaQuery.eq('kelas_id', options.kelasId);
    }

    // Filter berdasarkan agenda jika dipilih
    if (options?.agendaId) {
      agendaQuery = agendaQuery.eq('id', options.agendaId);
    }

    const { data: agendas, error: agendaError } = await agendaQuery;

    if (agendaError) throw agendaError;
    if (!agendas || agendas.length === 0) {
      const filterInfo = [];
      if (options?.kelasId) filterInfo.push(`kelas: ${options.kelasId}`);
      if (options?.agendaId) filterInfo.push(`agenda: ${options.agendaId}`);
      throw new Error(
        `Tidak ada agenda aktif dengan jadwal hari yang ditemukan${filterInfo.length > 0 ? ` (filter: ${filterInfo.join(', ')})` : ''}`
      );
    }

    // Log untuk debugging
    console.log(`[Generate Otomatis] Ditemukan ${agendas.length} agenda untuk di-generate:`, {
      semesterId,
      filterKelas: options?.kelasId || 'Semua',
      filterAgenda: options?.agendaId || 'Semua',
      agendaCount: agendas.length,
      agendaDetails: agendas.map(a => ({
        id: a.id,
        kelas_id: a.kelas_id,
        hari: a.hari,
        tanggal_mulai: a.tanggal_mulai,
        tanggal_selesai: a.tanggal_selesai,
      })),
    });

    // Mapping hari Indonesia ke angka JavaScript (0 = Minggu, 1 = Senin, ...)
    const hariMap: Record<string, number> = {
      'Minggu': 0,
      'Senin': 1,
      'Selasa': 2,
      'Rabu': 3,
      'Kamis': 4,
      'Jumat': 5,
      'Sabtu': 6,
      'Ahad': 0, // Ahad = Minggu
    };

    const semesterStart = new Date(semester.tanggal_mulai);
    const semesterEnd = new Date(semester.tanggal_selesai);
    
    let created = 0;
    let skipped = 0;
    let errors = 0;

    // Untuk setiap agenda, generate pertemuan
    for (const agenda of agendas) {
      if (!agenda.hari) {
        console.warn(`[Generate Otomatis] Agenda ${agenda.id} tidak memiliki hari, dilewati`);
        continue;
      }

      const hariAngka = hariMap[agenda.hari];
      if (hariAngka === undefined) {
        console.warn(`[Generate Otomatis] Agenda ${agenda.id} memiliki hari tidak valid: ${agenda.hari}`);
        continue;
      }

      // Tentukan rentang tanggal untuk agenda ini
      const semesterStartDate = new Date(semester.tanggal_mulai);
      const semesterEndDate = new Date(semester.tanggal_selesai);
      
      // Gunakan tanggal agenda jika ada, jika tidak gunakan tanggal semester
      const agendaStartStr = agenda.tanggal_mulai || semester.tanggal_mulai;
      const agendaEndStr = agenda.tanggal_selesai || semester.tanggal_selesai;
      
      // Parse tanggal dengan benar (hindari timezone issues dengan menggunakan local time)
      const [startYear, startMonth, startDay] = agendaStartStr.split('-').map(Number);
      const [endYear, endMonth, endDay] = agendaEndStr.split('-').map(Number);
      
      const agendaStartDate = new Date(startYear, startMonth - 1, startDay);
      const agendaEndDate = new Date(endYear, endMonth - 1, endDay);
      
      // Pastikan tidak melewati batas semester
      const startDate = agendaStartDate > semesterStartDate ? agendaStartDate : semesterStartDate;
      const endDate = agendaEndDate < semesterEndDate ? agendaEndDate : semesterEndDate;

      // Generate tanggal untuk setiap hari yang sesuai
      const dates: string[] = [];
      
      // Cari hari pertama yang sesuai dengan jadwal
      let currentDate = new Date(startDate);
      const startDayOfWeek = currentDate.getDay();
      
      // Hitung selisih hari untuk mencapai hari target
      // Jika hari mulai sama dengan hari target, tidak perlu tambah hari
      // Jika berbeda, hitung selisihnya
      let daysToAdd = 0;
      if (startDayOfWeek !== hariAngka) {
        // Hitung berapa hari ke depan untuk mencapai hari target
        daysToAdd = (hariAngka - startDayOfWeek + 7) % 7;
        // Jika hasilnya 0, berarti hari target sudah lewat, jadi tambah 7 hari
        if (daysToAdd === 0) {
          daysToAdd = 7;
        }
      }
      
      // Set tanggal ke hari yang sesuai
      if (daysToAdd > 0) {
        currentDate.setDate(startDate.getDate() + daysToAdd);
      }
      
      // Verifikasi bahwa tanggal yang dihasilkan benar-benar sesuai dengan hari target
      const verifyDay = currentDate.getDay();
      if (verifyDay !== hariAngka) {
        console.error(`[Generate Otomatis] ERROR: Tanggal yang dihasilkan tidak sesuai! Agenda ${agenda.id}, hari target: ${agenda.hari} (${hariAngka}), tanggal: ${currentDate.toISOString().split('T')[0]}, hari aktual: ${verifyDay}`);
        // Coba perbaiki dengan mencari hari yang benar
        while (currentDate.getDay() !== hariAngka && currentDate <= endDate) {
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }

      // Generate semua tanggal yang sesuai (setiap minggu)
      let iterationCount = 0;
      const maxIterations = 1000; // Safety limit untuk menghindari infinite loop
      
      while (currentDate <= endDate && iterationCount < maxIterations) {
        // Verifikasi hari sebelum menambahkan
        const currentDay = currentDate.getDay();
        if (currentDay === hariAngka) {
          // Format tanggal sebagai YYYY-MM-DD
          const year = currentDate.getFullYear();
          const month = String(currentDate.getMonth() + 1).padStart(2, '0');
          const day = String(currentDate.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;
          dates.push(dateStr);
        } else {
          console.warn(`[Generate Otomatis] WARNING: Tanggal ${currentDate.toISOString().split('T')[0]} tidak sesuai dengan hari target ${agenda.hari} (${hariAngka}), hari aktual: ${currentDay}`);
        }
        
        // Tambah 7 hari untuk minggu berikutnya
        currentDate.setDate(currentDate.getDate() + 7);
        iterationCount++;
      }
      
      if (iterationCount >= maxIterations) {
        console.error(`[Generate Otomatis] ERROR: Terlalu banyak iterasi untuk agenda ${agenda.id}, kemungkinan infinite loop`);
      }

        // Cek pertemuan yang sudah ada (batch check jika terlalu banyak)
        if (dates.length > 0) {
          const existingDates = new Set<string>();
          
          // Supabase .in() memiliki limit, jadi kita perlu batch jika terlalu banyak
          const checkBatchSize = 100;
          for (let i = 0; i < dates.length; i += checkBatchSize) {
            const dateBatch = dates.slice(i, i + checkBatchSize);
            const { data: existingPertemuan, error: checkError } = await supabase
              .from('kelas_pertemuan')
              .select('tanggal')
              .eq('agenda_id', agenda.id)
              .in('tanggal', dateBatch);

            if (checkError) {
              errors += dateBatch.length;
              continue;
            }

            (existingPertemuan || []).forEach(p => existingDates.add(p.tanggal));
          }

        // Hapus yang sudah ada jika overwrite
        if (options?.overwrite && existingDates.size > 0) {
          const { error: deleteError } = await supabase
            .from('kelas_pertemuan')
            .delete()
            .eq('agenda_id', agenda.id)
            .in('tanggal', Array.from(existingDates));

          if (deleteError) {
            errors++;
            continue;
          }
        }

        // Insert pertemuan baru
        const datesToInsert = options?.overwrite 
          ? dates 
          : dates.filter(d => !existingDates.has(d));

        if (datesToInsert.length > 0) {
          const pertemuanToInsert = datesToInsert.map(tanggal => ({
            agenda_id: agenda.id,
            kelas_id: agenda.kelas_id || null,
            tanggal,
            status: 'Terjadwal' as PertemuanStatus,
          }));

          // Insert dalam batch (Supabase mendukung hingga 1000 rows per batch)
          const batchSize = 100;
          for (let i = 0; i < pertemuanToInsert.length; i += batchSize) {
            const batch = pertemuanToInsert.slice(i, i + batchSize);
            const { error: insertError } = await supabase
              .from('kelas_pertemuan')
              .insert(batch);

            if (insertError) {
              console.error(`[Generate Otomatis] Error insert batch untuk agenda ${agenda.id}:`, insertError);
              errors += batch.length;
            } else {
              created += batch.length;
              console.log(`[Generate Otomatis] Berhasil insert ${batch.length} pertemuan untuk agenda ${agenda.id}`);
            }
          }
        }

        skipped += dates.length - datesToInsert.length;
        if (datesToInsert.length > 0) {
          console.log(`[Generate Otomatis] Agenda ${agenda.id} (${agenda.hari}): ${datesToInsert.length} dibuat, ${dates.length - datesToInsert.length} dilewati`);
        }
      } else {
        console.log(`[Generate Otomatis] Agenda ${agenda.id} (${agenda.hari}): Tidak ada tanggal yang perlu di-generate`);
      }
    }

    console.log(`[Generate Otomatis] Selesai: ${created} dibuat, ${skipped} dilewati, ${errors} error`);
    return { created, skipped, errors };
  }
}


