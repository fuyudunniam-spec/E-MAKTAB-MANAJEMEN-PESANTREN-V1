import { supabase } from '@/integrations/supabase/client';

// ============================================
// TYPES
// ============================================

export type JenisDonatur = 'individu' | 'perusahaan' | 'yayasan' | 'komunitas' | 'lembaga';

export interface Donor {
  id: string;
  nama_lengkap: string;
  nama_panggilan?: string;
  nomor_telepon?: string;
  email?: string;
  alamat?: string;
  jenis_donatur: JenisDonatur;
  status_aktif: boolean;
  catatan?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface DonorStatistics extends Donor {
  total_donasi: number;
  total_nominal_donasi: number;
  tanggal_donasi_pertama?: string;
  tanggal_donasi_terakhir?: string;
}

export interface CreateDonorInput {
  nama_lengkap: string;
  nama_panggilan?: string;
  nomor_telepon?: string;
  email?: string;
  alamat?: string;
  jenis_donatur?: JenisDonatur;
  status_aktif?: boolean;
  catatan?: string;
}

export interface UpdateDonorInput extends Partial<CreateDonorInput> {
  id: string;
}

export interface DonorSearchResult {
  id: string;
  nama_lengkap: string;
  nama_panggilan?: string;
  nomor_telepon?: string;
  email?: string;
  jenis_donatur: JenisDonatur;
  total_donasi?: number;
  total_nominal_donasi?: number;
}

// ============================================
// SERVICE CLASS
// ============================================

export class DonorService {
  /**
   * Get all donors with optional filters
   */
  static async getAllDonors(filters?: {
    search?: string;
    jenis_donatur?: JenisDonatur;
    status_aktif?: boolean;
  }): Promise<Donor[]> {
    try {
      let query = supabase
        .from('donors')
        .select('*')
        .order('nama_lengkap', { ascending: true });

      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        query = query.or(`nama_lengkap.ilike.%${searchTerm}%,nama_panggilan.ilike.%${searchTerm}%,nomor_telepon.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      if (filters?.jenis_donatur) {
        query = query.eq('jenis_donatur', filters.jenis_donatur);
      }

      if (filters?.status_aktif !== undefined) {
        query = query.eq('status_aktif', filters.status_aktif);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as Donor[];
    } catch (error) {
      console.error('Error getting donors:', error);
      throw error;
    }
  }

  /**
   * Get donor by ID
   */
  static async getDonorById(id: string): Promise<Donor | null> {
    try {
      const { data, error } = await supabase
        .from('donors')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return data as Donor;
    } catch (error) {
      console.error('Error getting donor:', error);
      throw error;
    }
  }

  /**
   * Get donors with statistics
   */
  static async getDonorsWithStatistics(filters?: {
    search?: string;
    jenis_donatur?: JenisDonatur;
    status_aktif?: boolean;
  }): Promise<DonorStatistics[]> {
    try {
      let query = supabase
        .from('vw_donor_statistics')
        .select('*')
        .order('total_nominal_donasi', { ascending: false });

      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        query = query.or(`nama_lengkap.ilike.%${searchTerm}%,nama_panggilan.ilike.%${searchTerm}%,nomor_telepon.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      if (filters?.jenis_donatur) {
        query = query.eq('jenis_donatur', filters.jenis_donatur);
      }

      if (filters?.status_aktif !== undefined) {
        query = query.eq('status_aktif', filters.status_aktif);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as DonorStatistics[];
    } catch (error) {
      console.error('Error getting donors with statistics:', error);
      throw error;
    }
  }

  /**
   * Search donors (for autocomplete)
   * Menggunakan query langsung ke tabel donors karena RPC search_donors tidak tersedia
   */
  static async searchDonors(searchTerm: string, limit: number = 10): Promise<DonorSearchResult[]> {
    try {
      if (!searchTerm || searchTerm.length < 2) {
        return [];
      }

      // Langsung gunakan query manual ke tabel donors
      // RPC search_donors tidak tersedia di database
      const searchLower = searchTerm.toLowerCase();
      const { data, error } = await supabase
        .from('donors')
        .select(`
          id,
          nama_lengkap,
          nama_panggilan,
          nomor_telepon,
          email,
          jenis_donatur
        `)
        .or(`nama_lengkap.ilike.%${searchLower}%,nama_panggilan.ilike.%${searchLower}%,nomor_telepon.ilike.%${searchLower}%,email.ilike.%${searchLower}%`)
        .eq('status_aktif', true)
        .order('nama_lengkap', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error searching donors:', error);
        // Return empty array instead of throwing to prevent UI breaking
        return [];
      }

      // Return results without statistics for better performance
      // Statistics can be loaded separately if needed
      return (data || []).map(donor => ({
        ...donor,
        total_donasi: undefined,
        total_nominal_donasi: undefined
      })) as DonorSearchResult[];
    } catch (error) {
      console.error('Error searching donors:', error);
      // Return empty array instead of throwing to prevent UI breaking
      return [];
    }
  }

  /**
   * Create new donor
   */
  static async createDonor(input: CreateDonorInput): Promise<Donor> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      const { data, error } = await supabase
        .from('donors')
        .insert({
          ...input,
          jenis_donatur: input.jenis_donatur || 'individu',
          status_aktif: input.status_aktif !== undefined ? input.status_aktif : true,
          created_by: userId
        })
        .select()
        .single();

      if (error) throw error;
      return data as Donor;
    } catch (error) {
      console.error('Error creating donor:', error);
      throw error;
    }
  }

  /**
   * Update donor
   */
  static async updateDonor(input: UpdateDonorInput): Promise<Donor> {
    try {
      const { id, ...updateData } = input;
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      // Build update object - explicitly handle each field
      const updatePayload: any = {
        nama_lengkap: updateData.nama_lengkap,
        nama_panggilan: updateData.nama_panggilan || null,
        nomor_telepon: updateData.nomor_telepon || null,
        email: updateData.email || null,
        alamat: updateData.alamat || null,
        jenis_donatur: updateData.jenis_donatur || 'individu',
        status_aktif: updateData.status_aktif !== undefined ? updateData.status_aktif : true,
        catatan: updateData.catatan || null,
        updated_by: userId
      };

      const { data, error } = await supabase
        .from('donors')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Donor;
    } catch (error) {
      console.error('Error updating donor:', error);
      throw error;
    }
  }

  /**
   * Delete donor (soft delete by setting status_aktif to false)
   */
  static async deleteDonor(id: string): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      const { error } = await supabase
        .from('donors')
        .update({
          status_aktif: false,
          updated_by: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting donor:', error);
      throw error;
    }
  }

  /**
   * Hard delete donor (only if no donations linked)
   */
  static async hardDeleteDonor(id: string): Promise<void> {
    try {
      // Check if donor has donations
      const { data: donations, error: checkError } = await supabase
        .from('donations')
        .select('id')
        .eq('donor_id', id)
        .limit(1);

      if (checkError) throw checkError;

      if (donations && donations.length > 0) {
        throw new Error('Cannot delete donor with existing donations. Please deactivate instead.');
      }

      const { error } = await supabase
        .from('donors')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error hard deleting donor:', error);
      throw error;
    }
  }

  /**
   * Get donor by phone or email (for duplicate checking)
   */
  static async findDonorByContact(phone?: string, email?: string): Promise<Donor | null> {
    try {
      if (!phone && !email) return null;

      let query = supabase
        .from('donors')
        .select('*')
        .limit(1);

      if (phone && email) {
        query = query.or(`nomor_telepon.eq.${phone},email.eq.${email}`);
      } else if (phone) {
        query = query.eq('nomor_telepon', phone);
      } else if (email) {
        query = query.eq('email', email);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data && data.length > 0) ? (data[0] as Donor) : null;
    } catch (error) {
      console.error('Error finding donor by contact:', error);
      throw error;
    }
  }
}

