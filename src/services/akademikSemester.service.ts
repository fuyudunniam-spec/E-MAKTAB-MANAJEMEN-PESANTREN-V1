import { supabase } from '@/integrations/supabase/client';

export type TahunAjaranStatus = 'Aktif' | 'Ditutup';
export type SemesterStatus = 'Aktif' | 'Ditutup';
export type SemesterNama = 'Ganjil' | 'Genap' | 'Pendek' | 'Khusus';

export interface TahunAjaranInput {
  nama: string;
  kode?: string | null;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status?: TahunAjaranStatus;
  is_aktif?: boolean;
  catatan?: string | null;
}

export interface TahunAjaran extends TahunAjaranInput {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface SemesterInput {
  tahun_ajaran_id: string;
  nama: SemesterNama;
  kode?: string | null;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status?: SemesterStatus;
  is_aktif?: boolean;
  template_source_id?: string | null;
  catatan?: string | null;
}

export interface Semester extends SemesterInput {
  id: string;
  created_at: string;
  updated_at: string;
  tahun_ajaran?: TahunAjaran | null;
}

export class AkademikSemesterService {
  // Tahun Ajaran
  static async listTahunAjaran(): Promise<TahunAjaran[]> {
    const { data, error } = await supabase
      .from('akademik_tahun_ajaran')
      .select('*')
      .order('tanggal_mulai', { ascending: false });
    if (error) throw error;
    return (data || []) as TahunAjaran[];
  }

  static async createTahunAjaran(input: TahunAjaranInput): Promise<TahunAjaran> {
    const payload = {
      nama: input.nama,
      kode: input.kode || null,
      tanggal_mulai: input.tanggal_mulai,
      tanggal_selesai: input.tanggal_selesai,
      status: input.status || 'Aktif',
      is_aktif: input.is_aktif ?? false,
      catatan: input.catatan || null,
    };
    const { data, error } = await supabase
      .from('akademik_tahun_ajaran')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data as TahunAjaran;
  }

  static async updateTahunAjaran(id: string, input: Partial<TahunAjaranInput>): Promise<void> {
    if (!id) throw new Error('ID tahun ajaran wajib ada');
    const payload: any = { ...input };
    if ('kode' in input) payload.kode = input.kode || null;
    if ('catatan' in input) payload.catatan = input.catatan || null;
    const { error } = await supabase.from('akademik_tahun_ajaran').update(payload).eq('id', id);
    if (error) throw error;
  }

  static async setTahunAjaranAktif(id: string): Promise<void> {
    const { error } = await supabase.rpc('fn_set_tahun_ajaran_aktif', { tahun_ajaran_id: id });
    if (error) throw error;
  }

  static async deleteTahunAjaran(id: string): Promise<void> {
    const { error } = await supabase.from('akademik_tahun_ajaran').delete().eq('id', id);
    if (error) throw error;
  }

  // Semester
  static async listSemester(tahunAjaranId?: string): Promise<Semester[]> {
    let query = supabase
      .from('akademik_semester')
      .select('*, tahun_ajaran:akademik_tahun_ajaran(*)')
      .order('tanggal_mulai', { ascending: false });
    if (tahunAjaranId) query = query.eq('tahun_ajaran_id', tahunAjaranId);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as Semester[];
  }

  static async createSemester(input: SemesterInput): Promise<Semester> {
    const payload = {
      tahun_ajaran_id: input.tahun_ajaran_id,
      nama: input.nama,
      kode: input.kode || null,
      tanggal_mulai: input.tanggal_mulai,
      tanggal_selesai: input.tanggal_selesai,
      status: input.status || 'Aktif',
      is_aktif: input.is_aktif ?? false,
      template_source_id: input.template_source_id || null,
      catatan: input.catatan || null,
    };
    const { data, error } = await supabase
      .from('akademik_semester')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data as Semester;
  }

  static async updateSemester(id: string, input: Partial<SemesterInput>): Promise<void> {
    if (!id) throw new Error('ID semester wajib ada');
    const payload: any = { ...input };
    if ('kode' in input) payload.kode = input.kode || null;
    if ('template_source_id' in input) payload.template_source_id = input.template_source_id || null;
    if ('catatan' in input) payload.catatan = input.catatan || null;
    const { error } = await supabase.from('akademik_semester').update(payload).eq('id', id);
    if (error) throw error;
  }

  static async setSemesterAktif(id: string): Promise<void> {
    const { error } = await supabase.rpc('fn_set_semester_aktif', { semester_id: id });
    if (error) throw error;
  }

  static async deleteSemester(id: string): Promise<void> {
    const { error } = await supabase.from('akademik_semester').delete().eq('id', id);
    if (error) throw error;
  }

  static async getSemesterAktif(): Promise<Semester | null> {
    const { data, error } = await supabase
      .from('akademik_semester')
      .select('*, tahun_ajaran:akademik_tahun_ajaran(*)')
      .eq('is_aktif', true)
      .maybeSingle();
    if (error) throw error;
    return data as Semester | null;
  }

  // Duplikasi kelas & agenda dari semester sebelumnya (supaya atomic)
  static async duplicateStructure(params: { source_semester_id: string; target_semester_id: string }): Promise<void> {
    const { error } = await supabase.rpc('fn_duplicate_semester_structure', params);
    if (error) throw error;
  }
}



