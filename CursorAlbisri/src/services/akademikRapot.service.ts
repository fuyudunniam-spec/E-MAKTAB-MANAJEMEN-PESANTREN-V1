import { supabase } from '@/integrations/supabase/client';
import { AkademikNilaiService, Nilai } from './akademikNilai.service';
import { AkademikAgendaService } from './akademikAgenda.service';

export interface RapotInput {
  santri_id: string;
  kelas_id: string;
  semester_id: string;
  catatan_wali_kelas?: string | null;
  catatan_kepala_sekolah?: string | null;
  tanggal_cetak?: string | null;
}

export interface Rapot extends RapotInput {
  id: string;
  total_mapel: number;
  total_mapel_lulus: number;
  total_mapel_tidak_lulus: number;
  rata_rata_nilai: number;
  total_pertemuan_keseluruhan: number;
  total_hadir_keseluruhan: number;
  persentase_kehadiran_keseluruhan: number;
  status_kelulusan_semester: 'Belum Dinilai' | 'Lulus' | 'Tidak Lulus';
  alasan_tidak_lulus_semester?: string | null;
  predikat?: string | null;
  is_published?: boolean;
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
  semester?: {
    id: string;
    nama: string;
    tanggal_mulai: string;
    tanggal_selesai: string;
  };
}

export class AkademikRapotService {
  /**
   * Generate atau update rapot berdasarkan nilai yang sudah ada
   */
  static async generateRapot(input: RapotInput): Promise<Rapot> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Validasi input
      if (!input.santri_id || !input.kelas_id || !input.semester_id) {
        throw new Error('Data rapot tidak lengkap: santri_id, kelas_id, dan semester_id wajib diisi');
      }

      // Ambil semua nilai untuk santri, kelas, dan semester ini
      const semuaNilai = await AkademikNilaiService.listNilai(input.kelas_id, input.semester_id, {
        santriId: input.santri_id,
      });

      // Filter: hanya ambil nilai dari agenda yang ada di jadwal kelas+term ini
      // Ambil daftar agenda aktif untuk kelas+term ini
      const agendasKelasTerm = await AkademikAgendaService.listAgendaByKelas(input.kelas_id, {
        aktifOnly: true,
        semesterId: input.semester_id
      });
      const agendaIdsKelasTerm = new Set(agendasKelasTerm.map(a => a.id));
      
      // Filter nilai hanya dari agenda yang ada di jadwal kelas+term
      const nilaiTerfilter = semuaNilai.filter(n => n.agenda_id && agendaIdsKelasTerm.has(n.agenda_id));

      // Hitung statistik
      const totalMapel = nilaiTerfilter.length;
      const totalMapelLulus = nilaiTerfilter.filter((n) => n.status_kelulusan === 'Lulus').length;
      const totalMapelTidakLulus = nilaiTerfilter.filter((n) => n.status_kelulusan === 'Tidak Lulus').length;

      // Hitung rata-rata nilai (hanya dari nilai yang sudah dinilai)
      const nilaiYangSudahDinilai = nilaiTerfilter.filter((n) => n.nilai_angka !== null);
      const rataRataNilai =
        nilaiYangSudahDinilai.length > 0
          ? nilaiYangSudahDinilai.reduce((sum, n) => sum + (n.nilai_angka || 0), 0) / nilaiYangSudahDinilai.length
          : 0;

      // Hitung kehadiran keseluruhan (ambil dari nilai pertama, karena semua nilai punya data kehadiran yang sama)
      const kehadiranKeseluruhan =
        nilaiTerfilter.length > 0
          ? {
              total_pertemuan: nilaiTerfilter[0].total_pertemuan,
              total_hadir: nilaiTerfilter[0].total_hadir,
              persentase_kehadiran: nilaiTerfilter[0].persentase_kehadiran,
            }
          : { total_pertemuan: 0, total_hadir: 0, persentase_kehadiran: 0 };

      // Tentukan status kelulusan semester
      let statusKelulusanSemester: 'Belum Dinilai' | 'Lulus' | 'Tidak Lulus' = 'Belum Dinilai';
      let alasanTidakLulusSemester: string | null = null;

      if (totalMapel === 0) {
        statusKelulusanSemester = 'Belum Dinilai';
      } else if (totalMapelTidakLulus > 0 || kehadiranKeseluruhan.persentase_kehadiran < 60) {
        statusKelulusanSemester = 'Tidak Lulus';
        const alasan: string[] = [];
        if (totalMapelTidakLulus > 0) {
          alasan.push(`${totalMapelTidakLulus} mata pelajaran tidak lulus`);
        }
        if (kehadiranKeseluruhan.persentase_kehadiran < 60) {
          alasan.push(`Kehadiran kurang dari 60% (${kehadiranKeseluruhan.persentase_kehadiran.toFixed(2)}%)`);
        }
        alasanTidakLulusSemester = alasan.join(', ');
      } else {
        statusKelulusanSemester = 'Lulus';
      }

      // Tentukan predikat berdasarkan rata-rata nilai
      let predikat: string | null = null;
      if (rataRataNilai >= 90) {
        predikat = 'Sangat Memuaskan';
      } else if (rataRataNilai >= 80) {
        predikat = 'Memuaskan';
      } else if (rataRataNilai >= 70) {
        predikat = 'Cukup';
      } else if (rataRataNilai >= 60) {
        predikat = 'Kurang';
      } else if (rataRataNilai > 0) {
        predikat = 'Sangat Kurang';
      }

      // Insert atau update rapot
      // Catatan: Saat generate ulang, set is_published = false (draft) karena mungkin ada perubahan data
      const { data, error } = await supabase
        .from('akademik_rapot')
        .upsert(
          {
            santri_id: input.santri_id,
            kelas_id: input.kelas_id,
            semester_id: input.semester_id,
            total_mapel: totalMapel,
            total_mapel_lulus: totalMapelLulus,
            total_mapel_tidak_lulus: totalMapelTidakLulus,
            rata_rata_nilai: Math.round(rataRataNilai * 100) / 100,
            total_pertemuan_keseluruhan: kehadiranKeseluruhan.total_pertemuan,
            total_hadir_keseluruhan: kehadiranKeseluruhan.total_hadir,
            persentase_kehadiran_keseluruhan: Math.round(kehadiranKeseluruhan.persentase_kehadiran * 100) / 100,
            status_kelulusan_semester: statusKelulusanSemester,
            alasan_tidak_lulus_semester: alasanTidakLulusSemester,
            predikat,
            catatan_wali_kelas: input.catatan_wali_kelas || null,
            catatan_kepala_sekolah: input.catatan_kepala_sekolah || null,
            tanggal_cetak: input.tanggal_cetak || null,
            is_published: false, // Generate ulang = kembali ke draft, perlu publish lagi
            published_at: null,
            published_by: null,
            updated_at: new Date().toISOString(),
            updated_by: user?.id || null,
          },
          {
            onConflict: 'santri_id,kelas_id,semester_id',
          }
        )
        .select(
          `
          *,
          santri:santri_id(id, nama_lengkap, id_santri),
          kelas:kelas_id(id, nama_kelas, program),
          semester:semester_id(id, nama, tanggal_mulai, tanggal_selesai)
        `
        )
        .single();

      if (error) {
        console.error('[AkademikRapotService] Error generating rapot:', error);
        throw error;
      }

      return data as Rapot;
    } catch (error: any) {
      console.error('[AkademikRapotService] Error in generateRapot:', {
        input,
        error: error.message || error,
      });
      throw error;
    }
  }

  /**
   * List rapot per kelas per semester
   */
  static async listRapot(
    kelasId: string,
    semesterId: string,
    options?: { santriId?: string }
  ): Promise<Rapot[]> {
    try {
      let query = supabase
        .from('akademik_rapot')
        .select(
          `
          *,
          santri:santri_id(id, nama_lengkap, id_santri),
          kelas:kelas_id(id, nama_kelas, program),
          semester:semester_id(id, nama, tanggal_mulai, tanggal_selesai)
        `
        )
        .eq('kelas_id', kelasId)
        .eq('semester_id', semesterId)
        .order('created_at', { ascending: false });

      if (options?.santriId) {
        query = query.eq('santri_id', options.santriId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[AkademikRapotService] Error loading rapot:', error);
        throw error;
      }

      return (data || []) as Rapot[];
    } catch (error: any) {
      console.error('[AkademikRapotService] Error in listRapot:', {
        kelasId,
        semesterId,
        options,
        error: error.message || error,
      });
      throw error;
    }
  }

  /**
   * Get rapot by ID
   */
  static async getRapotById(rapotId: string): Promise<Rapot | null> {
    try {
      const { data, error } = await supabase
        .from('akademik_rapot')
        .select(
          `
          *,
          santri:santri_id(id, nama_lengkap, id_santri),
          kelas:kelas_id(id, nama_kelas, program),
          semester:semester_id(id, nama, tanggal_mulai, tanggal_selesai)
        `
        )
        .eq('id', rapotId)
        .maybeSingle();

      if (error) {
        console.error('[AkademikRapotService] Error loading rapot:', error);
        throw error;
      }

      return data as Rapot | null;
    } catch (error: any) {
      console.error('[AkademikRapotService] Error in getRapotById:', {
        rapotId,
        error: error.message || error,
      });
      throw error;
    }
  }

  /**
   * Get rapot by santri, kelas, dan semester
   */
  static async getRapotBySantriKelasSemester(
    santriId: string,
    kelasId: string,
    semesterId: string
  ): Promise<Rapot | null> {
    try {
      const { data, error } = await supabase
        .from('akademik_rapot')
        .select(
          `
          *,
          santri:santri_id(id, nama_lengkap, id_santri),
          kelas:kelas_id(id, nama_kelas, program),
          semester:semester_id(id, nama, tanggal_mulai, tanggal_selesai)
        `
        )
        .eq('santri_id', santriId)
        .eq('kelas_id', kelasId)
        .eq('semester_id', semesterId)
        .maybeSingle();

      if (error) {
        console.error('[AkademikRapotService] Error loading rapot:', error);
        throw error;
      }

      return data as Rapot | null;
    } catch (error: any) {
      console.error('[AkademikRapotService] Error in getRapotBySantriKelasSemester:', {
        santriId,
        kelasId,
        semesterId,
        error: error.message || error,
      });
      throw error;
    }
  }

  /**
   * P0: List rapot untuk santri tertentu (semua kelas dan semester)
   * Hanya menampilkan rapot yang sudah published (is_published = true)
   */
  static async listRapotBySantri(santriId: string): Promise<Rapot[]> {
    try {
      const { data, error } = await supabase
        .from('akademik_rapot')
        .select(
          `
          *,
          santri:santri_id(id, nama_lengkap, id_santri),
          kelas:kelas_id(id, nama_kelas, program),
          semester:semester_id(
            id, 
            nama, 
            tanggal_mulai, 
            tanggal_selesai,
            tahun_ajaran:akademik_tahun_ajaran(*)
          )
        `
        )
        .eq('santri_id', santriId)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[AkademikRapotService] Error loading rapot by santri:', error);
        throw error;
      }

      return (data || []) as Rapot[];
    } catch (error: any) {
      console.error('[AkademikRapotService] Error in listRapotBySantri:', {
        santriId,
        error: error.message || error,
      });
      throw error;
    }
  }

  /**
   * Update rapot (catatan, tanggal cetak, dll)
   */
  static async updateRapot(rapotId: string, input: Partial<RapotInput>): Promise<Rapot> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('akademik_rapot')
        .update({
          ...input,
          updated_at: new Date().toISOString(),
          updated_by: user?.id || null,
        })
        .eq('id', rapotId)
        .select(
          `
          *,
          santri:santri_id(id, nama_lengkap, id_santri),
          kelas:kelas_id(id, nama_kelas, program),
          semester:semester_id(id, nama, tanggal_mulai, tanggal_selesai)
        `
        )
        .single();

      if (error) {
        console.error('[AkademikRapotService] Error updating rapot:', error);
        throw error;
      }

      return data as Rapot;
    } catch (error: any) {
      console.error('[AkademikRapotService] Error in updateRapot:', {
        rapotId,
        input,
        error: error.message || error,
      });
      throw error;
    }
  }

  /**
   * Delete rapot
   */
  static async deleteRapot(rapotId: string): Promise<void> {
    try {
      const { error } = await supabase.from('akademik_rapot').delete().eq('id', rapotId);

      if (error) {
        console.error('[AkademikRapotService] Error deleting rapot:', error);
        throw error;
      }
    } catch (error: any) {
      console.error('[AkademikRapotService] Error in deleteRapot:', {
        rapotId,
        error: error.message || error,
      });
      throw error;
    }
  }

  /**
   * Publish rapot untuk ditampilkan di profil santri
   */
  static async publishRapot(rapotId: string): Promise<Rapot> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('akademik_rapot')
        .update({
          is_published: true,
          published_at: new Date().toISOString(),
          published_by: user?.id || null,
          updated_at: new Date().toISOString(),
          updated_by: user?.id || null,
        })
        .eq('id', rapotId)
        .select(
          `
          *,
          santri:santri_id(id, nama_lengkap, id_santri),
          kelas:kelas_id(id, nama_kelas, program),
          semester:semester_id(id, nama, tanggal_mulai, tanggal_selesai)
        `
        )
        .single();

      if (error) {
        console.error('[AkademikRapotService] Error publishing rapot:', error);
        throw error;
      }

      return data as Rapot;
    } catch (error: any) {
      console.error('[AkademikRapotService] Error in publishRapot:', {
        rapotId,
        error: error.message || error,
      });
      throw error;
    }
  }

  /**
   * Unpublish rapot (untuk koreksi)
   */
  static async unpublishRapot(rapotId: string): Promise<Rapot> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('akademik_rapot')
        .update({
          is_published: false,
          published_at: null,
          published_by: null,
          updated_at: new Date().toISOString(),
          updated_by: user?.id || null,
        })
        .eq('id', rapotId)
        .select(
          `
          *,
          santri:santri_id(id, nama_lengkap, id_santri),
          kelas:kelas_id(id, nama_kelas, program),
          semester:semester_id(id, nama, tanggal_mulai, tanggal_selesai)
        `
        )
        .single();

      if (error) {
        console.error('[AkademikRapotService] Error unpublishing rapot:', error);
        throw error;
      }

      return data as Rapot;
    } catch (error: any) {
      console.error('[AkademikRapotService] Error in unpublishRapot:', {
        rapotId,
        error: error.message || error,
      });
      throw error;
    }
  }
}




