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
  } | null;
  agenda?: {
    id: string;
    nama_agenda: string;
    hari?: string | null;
    jam_mulai?: string | null;
    jam_selesai?: string | null;
    kelas_id: string;
    mapel_nama?: string | null;
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
            mapel:mapel_id(id, nama_mapel, program)
          ),
          kelas:kelas_id(id, nama_kelas, program, rombel)
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
}


