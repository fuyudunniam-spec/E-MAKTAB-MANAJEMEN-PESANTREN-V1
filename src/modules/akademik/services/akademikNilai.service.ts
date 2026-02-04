import { supabase } from '@/integrations/supabase/client';
import { AkademikSemesterService } from './akademikSemester.service';

export interface NilaiInput {
  santri_id: string;
  kelas_id: string;
  semester_id: string;
  agenda_id: string;
  nilai_angka?: number | null;
  nilai_huruf?: string | null;
  nilai_deskripsi?: string | null;
  catatan?: string | null;
}

export interface Nilai extends NilaiInput {
  id: string;
  mapel_id?: string | null;
  total_pertemuan: number;
  total_hadir: number;
  total_izin: number;
  total_sakit: number;
  total_alfa: number;
  persentase_kehadiran: number;
  status_kelulusan: 'Belum Dinilai' | 'Lulus' | 'Tidak Lulus';
  alasan_tidak_lulus?: string | null;
  status_nilai?: 'Draft' | 'Locked' | 'Published';
  locked_at?: string | null;
  locked_by?: string | null;
  published_at?: string | null;
  published_by?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
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
    mapel_nama?: string | null;
    mapel?: {
      id: string;
      nama_mapel: string;
    } | null;
  } | null;
}

export interface KehadiranSummary {
  total_pertemuan: number;
  total_hadir: number;
  total_izin: number;
  total_sakit: number;
  total_alfa: number;
  persentase_kehadiran: number;
}

export class AkademikNilaiService {
  /**
   * Hitung persentase kehadiran per santri per kelas per semester
   */
  static async hitungPersentaseKehadiran(
    santriId: string,
    kelasId: string,
    semesterId: string
  ): Promise<KehadiranSummary> {
    try {
      const { data, error } = await supabase.rpc('fn_hitung_persentase_kehadiran', {
        p_santri_id: santriId,
        p_kelas_id: kelasId,
        p_semester_id: semesterId,
      });

      if (error) {
        console.error('[AkademikNilaiService] Error calculating attendance:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return {
          total_pertemuan: 0,
          total_hadir: 0,
          total_izin: 0,
          total_sakit: 0,
          total_alfa: 0,
          persentase_kehadiran: 0,
        };
      }

      return data[0] as KehadiranSummary;
    } catch (error: any) {
      console.error('[AkademikNilaiService] Error in hitungPersentaseKehadiran:', {
        santriId,
        kelasId,
        semesterId,
        error: error.message || error,
      });
      throw error;
    }
  }

  /**
   * List nilai per kelas per semester
   */
  static async listNilai(
    kelasId: string,
    semesterId: string,
    options?: { agendaId?: string; santriId?: string }
  ): Promise<Nilai[]> {
    try {
      let query = supabase
        .from('akademik_nilai')
        .select(
          `
          *,
          santri:santri_id(id, nama_lengkap, id_santri),
          kelas:kelas_id(id, nama_kelas, program),
          agenda:agenda_id(
            id,
            nama_agenda,
            mapel_nama,
            mapel:mapel_id(id, nama_mapel)
          )
        `
        )
        .eq('kelas_id', kelasId)
        .eq('semester_id', semesterId)
        .order('created_at', { ascending: false });

      if (options?.agendaId) {
        query = query.eq('agenda_id', options.agendaId);
      }

      if (options?.santriId) {
        query = query.eq('santri_id', options.santriId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[AkademikNilaiService] Error loading nilai:', error);
        throw error;
      }

      return (data || []).map((n: any) => ({
        ...n,
        status_nilai: n.status_nilai || 'Draft', // Default to Draft if not set
      })) as Nilai[];
    } catch (error: any) {
      console.error('[AkademikNilaiService] Error in listNilai:', {
        kelasId,
        semesterId,
        options,
        error: error.message || error,
      });
      throw error;
    }
  }

  /**
   * Get nilai by ID
   */
  static async getNilaiById(nilaiId: string): Promise<Nilai | null> {
    try {
      const { data, error } = await supabase
        .from('akademik_nilai')
        .select(
          `
          *,
          santri:santri_id(id, nama_lengkap, id_santri),
          kelas:kelas_id(id, nama_kelas, program),
          agenda:agenda_id(
            id,
            nama_agenda,
            mapel_nama,
            mapel:mapel_id(id, nama_mapel)
          )
        `
        )
        .eq('id', nilaiId)
        .maybeSingle();

      if (error) {
        console.error('[AkademikNilaiService] Error loading nilai:', error);
        throw error;
      }

      if (!data) return null;
      return {
        ...data,
        status_nilai: data.status_nilai || 'Draft', // Default to Draft if not set
      } as Nilai;
    } catch (error: any) {
      console.error('[AkademikNilaiService] Error in getNilaiById:', {
        nilaiId,
        error: error.message || error,
      });
      throw error;
    }
  }

  /**
   * Input atau update nilai dengan validasi kehadiran
   * P0: Jika kehadiran < 75%, tidak bisa input nilai dan otomatis tidak lulus (diubah dari 60% menjadi 75%)
   */
  static async inputNilai(input: NilaiInput): Promise<Nilai> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Validasi input
      if (!input.santri_id || !input.kelas_id || !input.semester_id || !input.agenda_id) {
        throw new Error('Data nilai tidak lengkap: santri_id, kelas_id, semester_id, dan agenda_id wajib diisi');
      }

      // Hitung persentase kehadiran terlebih dahulu
      const kehadiran = await this.hitungPersentaseKehadiran(
        input.santri_id,
        input.kelas_id,
        input.semester_id
      );

      // P0: Validasi: jika kehadiran < 75%, tidak bisa input nilai (diubah dari 60% menjadi 75%)
      if (kehadiran.persentase_kehadiran < 75) {
        throw new Error(
          `Tidak dapat input nilai karena kehadiran kurang dari 75%. Kehadiran saat ini: ${kehadiran.persentase_kehadiran.toFixed(2)}%`
        );
      }

      // Validasi nilai_angka harus diisi jika ingin input nilai
      if (!input.nilai_angka && input.nilai_angka !== 0) {
        throw new Error('Nilai angka wajib diisi');
      }

      // Validasi nilai_angka harus antara 0-100
      if (input.nilai_angka !== null && (input.nilai_angka < 0 || input.nilai_angka > 100)) {
        throw new Error('Nilai angka harus antara 0-100');
      }

      // Konversi nilai angka ke huruf dan deskripsi
      let nilaiHuruf = input.nilai_huruf || '';
      let nilaiDeskripsi = input.nilai_deskripsi || '';

      if (input.nilai_angka !== null && !input.nilai_huruf) {
        if (input.nilai_angka >= 90) {
          nilaiHuruf = 'A';
          nilaiDeskripsi = 'Sangat Baik';
        } else if (input.nilai_angka >= 80) {
          nilaiHuruf = 'B';
          nilaiDeskripsi = 'Baik';
        } else if (input.nilai_angka >= 70) {
          nilaiHuruf = 'C';
          nilaiDeskripsi = 'Cukup';
        } else if (input.nilai_angka >= 60) {
          nilaiHuruf = 'D';
          nilaiDeskripsi = 'Kurang';
        } else {
          nilaiHuruf = 'E';
          nilaiDeskripsi = 'Sangat Kurang';
        }
      }

      // Gunakan function database untuk insert/update dengan validasi
      const { data, error } = await supabase.rpc('fn_update_nilai_dengan_validasi', {
        p_santri_id: input.santri_id,
        p_kelas_id: input.kelas_id,
        p_semester_id: input.semester_id,
        p_agenda_id: input.agenda_id,
        p_nilai_angka: input.nilai_angka,
        p_nilai_huruf: nilaiHuruf,
        p_nilai_deskripsi: nilaiDeskripsi,
        p_catatan: input.catatan || null,
      });

      if (error) {
        console.error('[AkademikNilaiService] Error saving nilai:', error);
        throw error;
      }

      // Ambil data nilai yang baru saja disimpan
      const nilai = await this.getNilaiById(data);

      if (!nilai) {
        throw new Error('Gagal mengambil data nilai yang baru disimpan');
      }

      return nilai;
    } catch (error: any) {
      console.error('[AkademikNilaiService] Error in inputNilai:', {
        input,
        error: error.message || error,
      });
      throw error;
    }
  }

  /**
   * Update nilai (dengan validasi kehadiran)
   */
  static async updateNilai(nilaiId: string, input: Partial<NilaiInput>): Promise<Nilai> {
    try {
      // Ambil nilai yang ada
      const nilaiLama = await this.getNilaiById(nilaiId);
      if (!nilaiLama) {
        throw new Error('Nilai tidak ditemukan');
      }

      // Merge dengan input baru
      const inputBaru: NilaiInput = {
        santri_id: input.santri_id || nilaiLama.santri_id,
        kelas_id: input.kelas_id || nilaiLama.kelas_id,
        semester_id: input.semester_id || nilaiLama.semester_id,
        agenda_id: input.agenda_id || nilaiLama.agenda_id,
        nilai_angka: input.nilai_angka !== undefined ? input.nilai_angka : nilaiLama.nilai_angka,
        nilai_huruf: input.nilai_huruf || nilaiLama.nilai_huruf,
        nilai_deskripsi: input.nilai_deskripsi || nilaiLama.nilai_deskripsi,
        catatan: input.catatan !== undefined ? input.catatan : nilaiLama.catatan,
      };

      return await this.inputNilai(inputBaru);
    } catch (error: any) {
      console.error('[AkademikNilaiService] Error in updateNilai:', {
        nilaiId,
        input,
        error: error.message || error,
      });
      throw error;
    }
  }

  /**
   * Delete nilai
   */
  static async deleteNilai(nilaiId: string): Promise<void> {
    try {
      // P0: Validasi lock semester
      const { data: nilai } = await supabase
        .from('akademik_nilai')
        .select('semester_id')
        .eq('id', nilaiId)
        .single();
      
      if (nilai?.semester_id) {
        const isLocked = await AkademikSemesterService.isSemesterLocked(nilai.semester_id);
        if (isLocked) {
          throw new Error('Semester terkunci, tidak dapat menghapus nilai. Silakan unlock semester terlebih dahulu jika perlu koreksi.');
        }
      }
      
      const { error } = await supabase.from('akademik_nilai').delete().eq('id', nilaiId);

      if (error) {
        console.error('[AkademikNilaiService] Error deleting nilai:', error);
        throw error;
      }
    } catch (error: any) {
      console.error('[AkademikNilaiService] Error in deleteNilai:', {
        nilaiId,
        error: error.message || error,
      });
      throw error;
    }
  }

  /**
   * Lock nilai untuk kelas+term+jadwal (dengan auto-fill D/60)
   */
  static async lockNilai(
    kelasId: string,
    semesterId: string,
    agendaId: string,
    lockedBy?: string
  ): Promise<void> {
    try {
      // Ambil semua nilai untuk agenda ini
      const allNilai = await this.listNilai(kelasId, semesterId, { agendaId });

      if (allNilai.length === 0) {
        throw new Error('Tidak ada nilai untuk dikunci');
      }

      // Ambil semua santri di kelas
      const { data: anggotaData } = await supabase
        .from('kelas_anggota')
        .select('santri_id')
        .eq('kelas_id', kelasId)
        .eq('status', 'Aktif');

      const santriIds = (anggotaData || []).map(a => a.santri_id);

      // Untuk setiap santri, cek apakah sudah ada nilai
      // Jika belum ada atau kehadiran < 75%, auto-fill D/60
      const now = new Date().toISOString();
      const updates: Array<{ id: string; nilai_angka: number; nilai_huruf: string; nilai_deskripsi: string }> = [];
      const inserts: Array<any> = [];

      for (const santriId of santriIds) {
        const nilaiLama = allNilai.find(n => n.santri_id === santriId);
        
        // Hitung kehadiran
        const kehadiran = await this.hitungPersentaseKehadiran(santriId, kelasId, semesterId);
        
        // Jika belum ada nilai atau kehadiran < 75%, auto-fill D/60
        if (!nilaiLama || kehadiran.persentase_kehadiran < 75) {
          const nilaiAngka = 60;
          const nilaiHuruf = 'D';
          const nilaiDeskripsi = 'Kurang';

          if (nilaiLama) {
            // Update existing
            updates.push({
              id: nilaiLama.id,
              nilai_angka: nilaiAngka,
              nilai_huruf: nilaiHuruf,
              nilai_deskripsi: nilaiDeskripsi,
            });
          } else {
            // Insert new
            inserts.push({
              santri_id: santriId,
              kelas_id: kelasId,
              semester_id: semesterId,
              agenda_id: agendaId,
              nilai_angka: nilaiAngka,
              nilai_huruf: nilaiHuruf,
              nilai_deskripsi: nilaiDeskripsi,
              total_pertemuan: kehadiran.total_pertemuan,
              total_hadir: kehadiran.total_hadir,
              total_izin: kehadiran.total_izin,
              total_sakit: kehadiran.total_sakit,
              total_alfa: kehadiran.total_alfa,
              persentase_kehadiran: kehadiran.persentase_kehadiran,
              status_kelulusan: 'Lulus',
            });
          }
        }
      }

      // Execute updates
      if (updates.length > 0) {
        for (const update of updates) {
          await supabase
            .from('akademik_nilai')
            .update({
              nilai_angka: update.nilai_angka,
              nilai_huruf: update.nilai_huruf,
              nilai_deskripsi: update.nilai_deskripsi,
            })
            .eq('id', update.id);
        }
      }

      // Execute inserts
      if (inserts.length > 0) {
        await supabase.from('akademik_nilai').insert(inserts);
      }

      // Update semua nilai menjadi Locked
      const nilaiIds = allNilai.map(n => n.id);
      if (inserts.length > 0) {
        // Get IDs of newly inserted nilai
        const { data: newNilai } = await supabase
          .from('akademik_nilai')
          .select('id')
          .eq('kelas_id', kelasId)
          .eq('semester_id', semesterId)
          .eq('agenda_id', agendaId)
          .in('santri_id', santriIds)
          .is('status_nilai', null);
        
        if (newNilai) {
          nilaiIds.push(...newNilai.map(n => n.id));
        }
      }

      if (nilaiIds.length > 0) {
        const { error } = await supabase
          .from('akademik_nilai')
          .update({
            status_nilai: 'Locked',
            locked_at: now,
            locked_by: lockedBy || null,
          })
          .in('id', nilaiIds);

        if (error) {
          console.error('[AkademikNilaiService] Error locking nilai:', error);
          throw error;
        }
      }
    } catch (error: any) {
      console.error('[AkademikNilaiService] Error in lockNilai:', {
        kelasId,
        semesterId,
        agendaId,
        error: error.message || error,
      });
      throw error;
    }
  }

  /**
   * Publish nilai untuk kelas+term+jadwal (legacy, untuk backward compatibility)
   */
  static async publishNilai(
    kelasId: string,
    semesterId: string,
    agendaId: string,
    publishedBy?: string
  ): Promise<void> {
    try {
      // Ambil semua nilai untuk agenda ini
      const allNilai = await this.listNilai(kelasId, semesterId, { agendaId });

      // Filter hanya nilai yang statusnya Locked
      const nilaiToPublish = allNilai.filter(
        n => n.status_nilai === 'Locked' || (!n.status_nilai && (n as any).locked_at)
      );

      if (nilaiToPublish.length === 0) {
        throw new Error('Tidak ada nilai yang perlu dipublish (semua harus sudah dikunci)');
      }

      // Update semua nilai menjadi Published
      const now = new Date().toISOString();
      const nilaiIds = nilaiToPublish.map(n => n.id);

      const { error } = await supabase
        .from('akademik_nilai')
        .update({
          status_nilai: 'Published',
          published_at: now,
          published_by: publishedBy || null,
        })
        .in('id', nilaiIds);

      if (error) {
        console.error('[AkademikNilaiService] Error publishing nilai:', error);
        throw error;
      }
    } catch (error: any) {
      console.error('[AkademikNilaiService] Error in publishNilai:', {
        kelasId,
        semesterId,
        agendaId,
        error: error.message || error,
      });
      throw error;
    }
  }

  /**
   * Get status nilai untuk kelas+term (bulk)
   * Returns: 'Draft' | 'Locked' | 'Published' | 'Partial'
   */
  static async getStatusNilaiKelasTerm(
    kelasId: string,
    semesterId: string
  ): Promise<'Draft' | 'Locked' | 'Published' | 'Partial'> {
    try {
      // Ambil semua jadwal untuk kelas+term
      const { AkademikAgendaService } = await import('./akademikAgenda.service');
      const agendas = await AkademikAgendaService.listAgenda({
        kelasId,
        semesterId,
        aktifOnly: false, // Include all untuk cek status
      });

      if (agendas.length === 0) {
        return 'Draft';
      }

      // Ambil semua nilai untuk kelas+term
      const allNilai = await this.listNilai(kelasId, semesterId);

      // Group nilai by agenda
      const nilaiByAgenda = new Map<string, Nilai[]>();
      for (const nilai of allNilai) {
        const agendaId = nilai.agenda_id;
        if (!nilaiByAgenda.has(agendaId)) {
          nilaiByAgenda.set(agendaId, []);
        }
        nilaiByAgenda.get(agendaId)!.push(nilai);
      }

      // Check status per agenda
      let hasDraft = false;
      let hasLocked = false;
      let hasPublished = false;
      const agendaStatuses: string[] = [];

      for (const agenda of agendas) {
        const nilaiAgenda = nilaiByAgenda.get(agenda.id) || [];
        
        if (nilaiAgenda.length === 0) {
          hasDraft = true;
          agendaStatuses.push(`${agenda.mapel_nama || agenda.nama_agenda || 'Unknown'}: Draft (belum ada nilai)`);
          continue;
        }

        const allPublished = nilaiAgenda.every(n => n.status_nilai === 'Published');
        const allLocked = nilaiAgenda.every(n => n.status_nilai === 'Locked');
        const hasDraftAgenda = nilaiAgenda.some(n => n.status_nilai === 'Draft' || !n.status_nilai);

        if (allPublished) {
          hasPublished = true;
        } else if (allLocked && !hasDraftAgenda) {
          hasLocked = true;
        } else {
          hasDraft = true;
          agendaStatuses.push(`${agenda.mapel_nama || agenda.nama_agenda || 'Unknown'}: Draft`);
        }
      }

      // Determine overall status
      if (hasDraft && (hasLocked || hasPublished)) {
        return 'Partial';
      } else if (hasDraft) {
        return 'Draft';
      } else if (hasLocked && !hasPublished) {
        return 'Locked';
      } else if (hasPublished && !hasDraft && !hasLocked) {
        return 'Published';
      } else {
        return 'Partial';
      }
    } catch (error: any) {
      console.error('[AkademikNilaiService] Error in getStatusNilaiKelasTerm:', {
        kelasId,
        semesterId,
        error: error.message || error,
      });
      throw error;
    }
  }

  /**
   * Publish semua nilai untuk kelas+term (bulk publish)
   * Hanya bisa publish jika semua jadwal sudah LOCKED
   */
  static async publishNilaiKelasTerm(
    kelasId: string,
    semesterId: string,
    publishedBy?: string
  ): Promise<void> {
    try {
      // Validasi: semua jadwal harus sudah LOCKED
      const status = await this.getStatusNilaiKelasTerm(kelasId, semesterId);
      
      if (status === 'Draft' || status === 'Partial') {
        // Ambil detail jadwal yang belum locked untuk error message
        const { AkademikAgendaService } = await import('./akademikAgenda.service');
        const agendas = await AkademikAgendaService.listAgenda({
          kelasId,
          semesterId,
          aktifOnly: false,
        });

        const allNilai = await this.listNilai(kelasId, semesterId);
        const nilaiByAgenda = new Map<string, Nilai[]>();
        for (const nilai of allNilai) {
          const agendaId = nilai.agenda_id;
          if (!nilaiByAgenda.has(agendaId)) {
            nilaiByAgenda.set(agendaId, []);
          }
          nilaiByAgenda.get(agendaId)!.push(nilai);
        }

        const belumLocked: string[] = [];
        for (const agenda of agendas) {
          const nilaiAgenda = nilaiByAgenda.get(agenda.id) || [];
          if (nilaiAgenda.length === 0) {
            belumLocked.push(agenda.mapel_nama || agenda.nama_agenda || 'Unknown');
          } else {
            const hasDraft = nilaiAgenda.some(n => n.status_nilai === 'Draft' || !n.status_nilai);
            if (hasDraft) {
              belumLocked.push(agenda.mapel_nama || agenda.nama_agenda || 'Unknown');
            }
          }
        }

        throw new Error(
          `Tidak dapat publish karena masih ada mapel yang belum dikunci: ${belumLocked.join(', ')}`
        );
      }

      if (status === 'Published') {
        throw new Error('Nilai untuk kelas ini sudah dipublish');
      }

      // Ambil semua nilai untuk kelas+term
      const allNilai = await this.listNilai(kelasId, semesterId);

      // Filter hanya nilai yang statusnya Locked (belum Published)
      const nilaiToPublish = allNilai.filter(
        n => n.status_nilai === 'Locked' || (!n.status_nilai && (n as any).locked_at)
      );

      if (nilaiToPublish.length === 0) {
        throw new Error('Tidak ada nilai yang perlu dipublish');
      }

      // Update semua nilai menjadi Published
      const now = new Date().toISOString();
      const nilaiIds = nilaiToPublish.map(n => n.id);

      const { error } = await supabase
        .from('akademik_nilai')
        .update({
          status_nilai: 'Published',
          published_at: now,
          published_by: publishedBy || null,
        })
        .in('id', nilaiIds);

      if (error) {
        console.error('[AkademikNilaiService] Error publishing nilai:', error);
        throw error;
      }
    } catch (error: any) {
      console.error('[AkademikNilaiService] Error in publishNilaiKelasTerm:', {
        kelasId,
        semesterId,
        error: error.message || error,
      });
      throw error;
    }
  }

  /**
   * List nilai published untuk santri (untuk profil santri)
   * Fallback: gunakan published_at jika status_nilai tidak ada
   */
  static async listNilaiPublished(
    santriId: string,
    semesterId?: string
  ): Promise<Nilai[]> {
    try {
      let query = supabase
        .from('akademik_nilai')
        .select(
          `
          *,
          santri:santri_id(id, nama_lengkap, id_santri),
          kelas:kelas_id(id, nama_kelas, program),
          agenda:agenda_id(
            id,
            nama_agenda,
            mapel_nama,
            mapel:mapel_id(id, nama_mapel),
            pengajar_nama,
            hari,
            jam_mulai,
            jam_selesai
          )
        `
        )
        .eq('santri_id', santriId)
        .order('created_at', { ascending: false });

      if (semesterId) {
        query = query.eq('semester_id', semesterId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[AkademikNilaiService] Error loading published nilai:', error);
        throw error;
      }

      // Filter untuk nilai yang sudah published
      // Fallback: jika status_nilai tidak ada, gunakan published_at
      const publishedNilai = (data || []).filter((n: any) => {
        // Jika ada status_nilai, gunakan itu
        if (n.status_nilai) {
          return n.status_nilai === 'Published';
        }
        // Fallback: gunakan published_at
        return n.published_at !== null && n.published_at !== undefined;
      }) as Nilai[];

      return publishedNilai;
    } catch (error: any) {
      console.error('[AkademikNilaiService] Error in listNilaiPublished:', {
        santriId,
        semesterId,
        error: error.message || error,
      });
      throw error;
    }
  }
}

