import { supabase } from '@/integrations/supabase/client';

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

      return (data || []) as Nilai[];
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

      return data as Nilai | null;
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
   * Jika kehadiran < 60%, tidak bisa input nilai dan otomatis tidak lulus
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

      // Validasi: jika kehadiran < 60%, tidak bisa input nilai
      if (kehadiran.persentase_kehadiran < 60) {
        throw new Error(
          `Tidak dapat input nilai karena kehadiran kurang dari 60%. Kehadiran saat ini: ${kehadiran.persentase_kehadiran.toFixed(2)}%`
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
}

