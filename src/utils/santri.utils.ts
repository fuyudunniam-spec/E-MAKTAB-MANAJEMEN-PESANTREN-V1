import { supabase } from '@/integrations/supabase/client';

/**
 * Standard interface untuk santri lite (tanpa NISN)
 * Gunakan id_santri sebagai primary identifier
 */
export interface SantriLite {
  id: string;
  nama_lengkap: string;
  id_santri: string;  // Primary identifier (REQUIRED, bukan optional)
  kategori?: string;
}

/**
 * Search santri dengan standar yang benar
 * Menggunakan id_santri (bukan nisn) sebagai identifier
 * 
 * @param keyword - Keyword untuk search (nama atau ID Santri)
 * @param limit - Maximum results (default: 30)
 * @returns Array of SantriLite
 * 
 * @example
 * // Search by name
 * const results = await searchSantriStandard('Ahmad');
 * 
 * // Search by ID Santri
 * const results = await searchSantriStandard('BM240001');
 */
export async function searchSantriStandard(keyword: string, limit: number = 30): Promise<SantriLite[]> {
  const kw = keyword.trim();
  const query = supabase
    .from('santri')
    .select('id, nama_lengkap, id_santri, kategori')
    .limit(limit);
  
  if (kw) {
    query.or(`nama_lengkap.ilike.%${kw}%,id_santri.ilike.%${kw}%`);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).filter(s => s.id_santri) as SantriLite[]; // Filter out null id_santri
}

/**
 * Get santri lite dengan select standar
 * Menggunakan id_santri (bukan nisn) sebagai identifier
 * 
 * @param santriIds - Array of UUID santri
 * @returns Array of SantriLite
 */
export async function getSantriLite(santriIds: string[]): Promise<SantriLite[]> {
  if (!santriIds || santriIds.length === 0) return [];
  
  const { data, error } = await supabase
    .from('santri')
    .select('id, nama_lengkap, id_santri, kategori')
    .in('id', santriIds);
  
  if (error) throw error;
  return (data || []).filter(s => s.id_santri) as SantriLite[];
}

/**
 * Get santri lite by ID
 * Menggunakan id_santri (bukan nisn) sebagai identifier
 */
export async function getSantriLiteById(santriId: string): Promise<SantriLite | null> {
  const { data, error } = await supabase
    .from('santri')
    .select('id, nama_lengkap, id_santri, kategori')
    .eq('id', santriId)
    .maybeSingle();
  
  if (error) throw error;
  return data && data.id_santri ? data as SantriLite : null;
}

