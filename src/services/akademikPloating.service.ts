import { supabase } from '@/integrations/supabase/client';
import { searchSantriStandard, SantriLite } from '@/utils/santri.utils';

export interface KelasOption { id: string; nama_kelas: string; program: string; rombel?: string|null } // program fleksibel
// Export SantriLite dari utils untuk konsistensi
export type { SantriLite };

export class AkademikPloatingService {
  static async getKelasOptions(): Promise<KelasOption[]> {
    const { data, error } = await supabase
      .from('kelas_master')
      .select('id, nama_kelas, program, rombel')
      .eq('status', 'Aktif')
      .order('program', { ascending: true })
      .order('nama_kelas', { ascending: true });
    if (error) throw error;
    return (data || []) as KelasOption[];
  }

  /**
   * Search santri menggunakan utility function standar
   * Menggunakan id_santri (bukan nisn) sebagai identifier
   */
  static async searchSantri(keyword: string): Promise<SantriLite[]> {
    return await searchSantriStandard(keyword, 30);
  }

  static async listAnggota(kelasId: string): Promise<SantriLite[]> {
    const { data, error } = await supabase
      .from('kelas_anggota')
      .select('santri:santri_id(id, nama_lengkap, id_santri, kategori)')
      .eq('kelas_id', kelasId)
      .eq('status', 'Aktif')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map((row: any) => row.santri) as SantriLite[];
  }

  static async addMembers(kelasId: string, santriIds: string[]): Promise<void> {
    if (santriIds.length === 0) return;
    const rows = santriIds.map((sid) => ({ kelas_id: kelasId, santri_id: sid, status: 'Aktif' }));
    const { error } = await supabase.from('kelas_anggota').insert(rows, { defaultToNull: true });
    if (error) throw error;
  }

  static async removeMember(kelasId: string, santriId: string): Promise<void> {
    const { error } = await supabase
      .from('kelas_anggota')
      .delete()
      .eq('kelas_id', kelasId)
      .eq('santri_id', santriId);
    if (error) throw error;
  }
}


