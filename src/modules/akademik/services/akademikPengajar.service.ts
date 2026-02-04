import { supabase } from '@/integrations/supabase/client';
import { KelasPertemuan, PertemuanStatus } from './akademikPertemuan.service';
import { AkademikAgenda } from './akademikAgenda.service';

export interface PengajarJadwalHariIni {
  pertemuan_id: string;
  agenda_id: string;
  kelas_id: string;
  tanggal: string;
  jam_mulai?: string | null;
  jam_selesai?: string | null;
  nama_agenda: string;
  nama_kelas: string;
  program: string;
  rombel?: string | null;
  status: PertemuanStatus;
  mapel_nama?: string | null;
  kitab?: string | null;
  lokasi?: string | null;
  sudah_ada_presensi: boolean;
  sudah_ada_jurnal: boolean;
}

export interface PengajarStats {
  total_pertemuan_hari_ini: number;
  pertemuan_berjalan: number;
  pertemuan_selesai: number;
  pertemuan_terjadwal: number;
  pertemuan_belum_presensi: number;
  pertemuan_belum_jurnal: number;
}

export interface PengajarPertemuanMingguIni {
  pertemuan: KelasPertemuan & {
    agenda?: AkademikAgenda | null;
    kelas?: {
      id: string;
      nama_kelas: string;
      program: string;
      rombel?: string | null;
    } | null;
  };
  perlu_action: boolean; // true jika perlu start/end/input presensi
  action_type?: 'start' | 'end' | 'presensi' | 'jurnal';
}

export class AkademikPengajarService {
  /**
   * Mendapatkan pengajar_id dari user_id
   */
  static async getPengajarIdByUserId(userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('akademik_pengajar')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'Aktif')
      .single();

    if (error) {
      // Jika tidak ditemukan, return null (bukan error)
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data?.id || null;
  }

  /**
   * Mendapatkan jadwal hari ini untuk pengajar
   */
  static async getJadwalHariIni(pengajarId: string, tanggal?: string): Promise<PengajarJadwalHariIni[]> {
    const targetDate = tanggal || new Date().toISOString().split('T')[0];

    // Ambil pertemuan yang terkait dengan pengajar ini
    const { data: pertemuan1, error: err1 } = await supabase
      .from('kelas_pertemuan')
      .select(`
        id,
        agenda_id,
        kelas_id,
        tanggal,
        status,
        pengajar_id,
        agenda:agenda_id(
          id,
          nama_agenda,
          jam_mulai,
          jam_selesai,
          lokasi,
          mapel_nama,
          kitab,
          pengajar_id,
          kelas:kelas_id(
            id,
            nama_kelas,
            program,
            rombel
          )
        )
      `)
      .eq('tanggal', targetDate)
      .eq('pengajar_id', pengajarId);

    if (err1) throw err1;

    // Kedua, ambil yang pengajar_id di agenda
    const { data: agendaIds, error: err2 } = await supabase
      .from('kelas_agenda')
      .select('id')
      .eq('pengajar_id', pengajarId);

    if (err2) throw err2;

    const agendaIdList = (agendaIds || []).map(a => a.id);
    let pertemuan2: any[] = [];

    if (agendaIdList.length > 0) {
      const { data: pertemuan2Data, error: err3 } = await supabase
        .from('kelas_pertemuan')
        .select(`
          id,
          agenda_id,
          kelas_id,
          tanggal,
          status,
          pengajar_id,
          agenda:agenda_id(
            id,
            nama_agenda,
            jam_mulai,
            jam_selesai,
            lokasi,
            mapel_nama,
            kitab,
            pengajar_id,
            kelas:kelas_id(
              id,
              nama_kelas,
              program,
              rombel
            )
          )
        `)
        .eq('tanggal', targetDate)
        .in('agenda_id', agendaIdList)
        .is('pengajar_id', null);

      if (err3) throw err3;
      pertemuan2 = pertemuan2Data || [];
    }

    // Gabungkan dan hapus duplikat
    const allPertemuan = [...(pertemuan1 || []), ...pertemuan2];
    const uniquePertemuan = allPertemuan.filter((p, index, self) => 
      index === self.findIndex(t => t.id === p.id)
    );

    // Sort by jam_mulai
    uniquePertemuan.sort((a, b) => {
      const jamA = a.agenda?.jam_mulai || '';
      const jamB = b.agenda?.jam_mulai || '';
      return jamA.localeCompare(jamB);
    });

    // Cek apakah sudah ada presensi untuk pertemuan ini
    const pertemuanIds = uniquePertemuan.map(p => p.id);
    let presensiMap: Record<string, boolean> = {};

    if (pertemuanIds.length > 0) {
      const { data: presensi } = await supabase
        .from('absensi_madin')
        .select('pertemuan_id')
        .in('pertemuan_id', pertemuanIds);

      presensiMap = (presensi || []).reduce((acc, p) => {
        acc[p.pertemuan_id] = true;
        return acc;
      }, {} as Record<string, boolean>);
    }

    return uniquePertemuan.map((p: any) => {
      const agenda = p.agenda;
      const kelas = agenda?.kelas || {};
      
      return {
        pertemuan_id: p.id,
        agenda_id: p.agenda_id,
        kelas_id: p.kelas_id,
        tanggal: p.tanggal,
        jam_mulai: agenda?.jam_mulai || null,
        jam_selesai: agenda?.jam_selesai || null,
        nama_agenda: agenda?.nama_agenda || 'Agenda Tidak Ditemukan',
        nama_kelas: kelas?.nama_kelas || 'Kelas Tidak Ditemukan',
        program: kelas?.program || '-',
        rombel: kelas?.rombel || null,
        status: p.status as PertemuanStatus,
        mapel_nama: agenda?.mapel_nama || null,
        kitab: agenda?.kitab || null,
        lokasi: agenda?.lokasi || null,
        sudah_ada_presensi: presensiMap[p.id] || false,
        sudah_ada_jurnal: p.status !== 'Terjadwal', // Jika sudah Berjalan/Selesai berarti sudah ada jurnal
      };
    });
  }

  /**
   * Mendapatkan statistik pengajar untuk hari ini
   */
  static async getStatsHariIni(pengajarId: string, tanggal?: string): Promise<PengajarStats> {
    const jadwal = await this.getJadwalHariIni(pengajarId, tanggal);

    return {
      total_pertemuan_hari_ini: jadwal.length,
      pertemuan_berjalan: jadwal.filter(j => j.status === 'Berjalan').length,
      pertemuan_selesai: jadwal.filter(j => j.status === 'Selesai').length,
      pertemuan_terjadwal: jadwal.filter(j => j.status === 'Terjadwal').length,
      pertemuan_belum_presensi: jadwal.filter(j => !j.sudah_ada_presensi && j.status !== 'Terjadwal').length,
      pertemuan_belum_jurnal: jadwal.filter(j => j.status === 'Terjadwal').length,
    };
  }

  /**
   * Mendapatkan pertemuan minggu ini yang perlu action
   */
  static async getPertemuanMingguIni(pengajarId: string): Promise<PengajarPertemuanMingguIni[]> {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Minggu
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sabtu
    endOfWeek.setHours(23, 59, 59, 999);

    const startDate = startOfWeek.toISOString().split('T')[0];
    const endDate = endOfWeek.toISOString().split('T')[0];

    // Ambil pertemuan dengan pengajar_id langsung
    const { data: pertemuan1, error: err1 } = await supabase
      .from('kelas_pertemuan')
      .select(`
        *,
        agenda:agenda_id(
          id,
          nama_agenda,
          jam_mulai,
          jam_selesai,
          lokasi,
          mapel_nama,
          kitab,
          pengajar_id,
          kelas_id,
          kelas:kelas_id(
            id,
            nama_kelas,
            program,
            rombel
          )
        )
      `)
      .gte('tanggal', startDate)
      .lte('tanggal', endDate)
      .eq('pengajar_id', pengajarId);

    if (err1) throw err1;

    // Ambil pertemuan dengan pengajar_id di agenda
    const { data: agendaIds, error: err2 } = await supabase
      .from('kelas_agenda')
      .select('id')
      .eq('pengajar_id', pengajarId);

    if (err2) throw err2;

    const agendaIdList = (agendaIds || []).map(a => a.id);
    let pertemuan2: any[] = [];

    if (agendaIdList.length > 0) {
      const { data: pertemuan2Data, error: err3 } = await supabase
        .from('kelas_pertemuan')
        .select(`
          *,
          agenda:agenda_id(
            id,
            nama_agenda,
            jam_mulai,
            jam_selesai,
            lokasi,
            mapel_nama,
            kitab,
            pengajar_id,
            kelas_id,
            kelas:kelas_id(
              id,
              nama_kelas,
              program,
              rombel
            )
          )
        `)
        .gte('tanggal', startDate)
        .lte('tanggal', endDate)
        .in('agenda_id', agendaIdList)
        .is('pengajar_id', null);

      if (err3) throw err3;
      pertemuan2 = pertemuan2Data || [];
    }

    // Gabungkan dan hapus duplikat
    const allPertemuan = [...(pertemuan1 || []), ...pertemuan2];
    const uniquePertemuan = allPertemuan.filter((p, index, self) => 
      index === self.findIndex(t => t.id === p.id)
    );

    // Sort
    uniquePertemuan.sort((a, b) => {
      const dateCompare = a.tanggal.localeCompare(b.tanggal);
      if (dateCompare !== 0) return dateCompare;
      const jamA = a.agenda?.jam_mulai || '';
      const jamB = b.agenda?.jam_mulai || '';
      return jamA.localeCompare(jamB);
    });

    // Cek presensi untuk setiap pertemuan
    const pertemuanIds = uniquePertemuan.map(p => p.id);
    let presensiMap: Record<string, boolean> = {};

    if (pertemuanIds.length > 0) {
      const { data: presensi } = await supabase
        .from('absensi_madin')
        .select('pertemuan_id')
        .in('pertemuan_id', pertemuanIds);

      presensiMap = (presensi || []).reduce((acc, p) => {
        acc[p.pertemuan_id] = true;
        return acc;
      }, {} as Record<string, boolean>);
    }

    return uniquePertemuan.map((p: any) => {
      const sudahAdaPresensi = presensiMap[p.id] || false;
      const status = p.status as PertemuanStatus;
      
      let perlu_action = false;
      let action_type: 'start' | 'end' | 'presensi' | 'jurnal' | undefined;

      if (status === 'Terjadwal') {
        perlu_action = true;
        action_type = 'start';
      } else if (status === 'Berjalan' && !sudahAdaPresensi) {
        perlu_action = true;
        action_type = 'presensi';
      } else if (status === 'Berjalan' && sudahAdaPresensi) {
        perlu_action = true;
        action_type = 'end';
      } else if (status === 'Selesai' && !sudahAdaPresensi) {
        perlu_action = true;
        action_type = 'presensi';
      }

      return {
        pertemuan: p as KelasPertemuan & {
          agenda?: AkademikAgenda | null;
          kelas?: {
            id: string;
            nama_kelas: string;
            program: string;
            rombel?: string | null;
          } | null;
        },
        perlu_action,
        action_type,
      };
    });
  }
}

