import { supabase } from '@/integrations/supabase/client';

export interface PerizinanSantriInput {
  santri_id: string;
  jenis: 'Izin' | 'Sakit' | 'Dispen' | 'Libur Kolektif';
  kategori: 'Harian' | 'Partial-Jam';
  tanggal_mulai: string; // YYYY-MM-DD
  tanggal_selesai: string; // YYYY-MM-DD
  jam_mulai?: string; // HH:mm (untuk Partial-Jam)
  jam_selesai?: string; // HH:mm (untuk Partial-Jam)
  alasan?: string;
  lampiran_url?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'auto';
}

export interface PerizinanSantri extends PerizinanSantriInput {
  id: string;
  diajukan_oleh?: string;
  disetujui_oleh?: string;
  created_at: string;
  updated_at: string;
  santri?: {
    id: string;
    nama_lengkap: string;
    id_santri?: string;
  };
}

export class PerizinanSantriService {
  static async listPerizinan(
    filters?: {
      santriId?: string;
      status?: 'pending' | 'approved' | 'rejected' | 'auto';
      tanggalMulai?: string;
      tanggalSelesai?: string;
    }
  ): Promise<PerizinanSantri[]> {
    let query = supabase
      .from('perizinan_santri')
      .select(`
        *,
        santri:santri_id(id, nama_lengkap, id_santri)
      `)
      .order('created_at', { ascending: false });
    
    if (filters?.santriId) {
      query = query.eq('santri_id', filters.santriId);
    }
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters?.tanggalMulai) {
      query = query.gte('tanggal_mulai', filters.tanggalMulai);
    }
    
    if (filters?.tanggalSelesai) {
      query = query.lte('tanggal_selesai', filters.tanggalSelesai);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return (data || []) as PerizinanSantri[];
  }

  static async getPerizinan(id: string): Promise<PerizinanSantri | null> {
    const { data, error } = await supabase
      .from('perizinan_santri')
      .select(`
        *,
        santri:santri_id(id, nama_lengkap, id_santri)
      `)
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data as PerizinanSantri | null;
  }

  static async createPerizinan(input: PerizinanSantriInput): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Auto-approve untuk Libur Kolektif
    const status = input.jenis === 'Libur Kolektif' ? 'auto' : (input.status || 'pending');
    
    const payload = {
      santri_id: input.santri_id,
      jenis: input.jenis,
      kategori: input.kategori,
      tanggal_mulai: input.tanggal_mulai,
      tanggal_selesai: input.tanggal_selesai,
      jam_mulai: input.jam_mulai || null,
      jam_selesai: input.jam_selesai || null,
      alasan: input.alasan || null,
      lampiran_url: input.lampiran_url || null,
      status: status,
      diajukan_oleh: user?.id || null,
      disetujui_oleh: status === 'auto' ? user?.id : null,
    };
    
    const { data, error } = await supabase
      .from('perizinan_santri')
      .insert(payload)
      .select('id')
      .single();
    
    if (error) throw error;
    return data.id;
  }

  static async updatePerizinan(id: string, input: Partial<PerizinanSantriInput>): Promise<void> {
    const { error } = await supabase
      .from('perizinan_santri')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    
    if (error) throw error;
  }

  static async approvePerizinan(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('perizinan_santri')
      .update({
        status: 'approved',
        disetujui_oleh: user?.id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    
    if (error) throw error;
  }

  static async rejectPerizinan(id: string, reason?: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const updateData: any = {
      status: 'rejected',
      disetujui_oleh: user?.id || null,
      updated_at: new Date().toISOString(),
    };
    
    if (reason) {
      updateData.alasan = (updateData.alasan || '') + `\n\n[Ditolak: ${reason}]`;
    }
    
    const { error } = await supabase
      .from('perizinan_santri')
      .update(updateData)
      .eq('id', id);
    
    if (error) throw error;
  }

  static async deletePerizinan(id: string): Promise<void> {
    const { error } = await supabase
      .from('perizinan_santri')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}

