import { supabase } from '@/integrations/supabase/client';

export interface Santri {
  id: string;
  nama_lengkap: string;
  nisn: string;
  id_santri: string;
  status_santri: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSantriData {
  nama_lengkap: string;
  nisn: string;
  status_santri?: string;
}

export interface UpdateSantriData {
  nama_lengkap?: string;
  nisn?: string;
  status_santri?: string;
}

export class SantriService {
  /**
   * Get all active santri
   * NOTE: Menggunakan id_santri (bukan nisn) sebagai identifier utama
   */
  static async getActive(): Promise<Santri[]> {
    const { data, error } = await supabase
      .from('santri')
      .select('id, nama_lengkap, id_santri, kategori, status_santri, created_at, updated_at')
      .eq('status_santri', 'Aktif')
      .order('nama_lengkap');

    if (error) throw error;
    return data as unknown as Santri[];
  }

  /**
   * Get all santri
   * NOTE: Menggunakan id_santri (bukan nisn) sebagai identifier utama
   */
  static async getAll(): Promise<Santri[]> {
    const { data, error } = await supabase
      .from('santri')
      .select('id, nama_lengkap, id_santri, kategori, status_santri, created_at, updated_at')
      .order('nama_lengkap');

    if (error) throw error;
    return data as unknown as Santri[];
  }

  /**
   * Get santri by ID
   */
  static async getById(id: string): Promise<Santri | null> {
    const { data, error } = await supabase
      .from('santri')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as unknown as Santri;
  }

  /**
   * Create new santri
   */
  static async create(data: CreateSantriData): Promise<Santri> {
    const { data: result, error } = await supabase
      .from('santri')
      .insert([{
        ...data,
        status_santri: data.status_santri || 'Aktif',
      }])
      .select()
      .single();

    if (error) throw error;
    return result as unknown as Santri;
  }

  /**
   * Update santri
   */
  static async update(id: string, data: UpdateSantriData): Promise<Santri> {
    const { data: result, error } = await supabase
      .from('santri')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result as unknown as Santri;
  }

  /**
   * Delete santri
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('santri')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Search santri by name or ID Santri
   * NOTE: Menggunakan id_santri (bukan nisn) sebagai identifier utama
   * @param query - Nama lengkap atau ID Santri (format: KKYYNNNN, contoh: BM240001)
   */
  static async search(query: string): Promise<Santri[]> {
    const { data, error } = await supabase
      .from('santri')
      .select('id, nama_lengkap, id_santri, kategori, status_santri, created_at, updated_at')
      .or(`nama_lengkap.ilike.%${query}%,id_santri.ilike.%${query}%`)
      .eq('status_santri', 'Aktif')
      .order('nama_lengkap');

    if (error) throw error;
    return data as unknown as Santri[];
  }
}
