import { supabase } from '@/integrations/supabase/client';

export interface DocumentRequirement {
  id: string;
  jenis_dokumen: string;
  kategori_santri: string;
  kategori_dokumen: 'Reguler' | 'Bantuan' | 'Optional';
  is_required: boolean;
  is_editable_by_santri: boolean;
  kondisi_required?: string;
  deskripsi?: string;
  urutan: number;
}

export interface DocumentFile {
  id?: string;
  santri_id: string;
  jenis_dokumen: string;
  nama_dokumen: string;
  nama_file?: string;
  path_file?: string;
  ukuran_file?: number;
  tipe_file?: string;
  status_verifikasi: 'Belum Diverifikasi' | 'Diverifikasi' | 'Ditolak';
  tanggal_verifikasi?: string;
  verifikasi_oleh?: string;
  catatan_verifikasi?: string;
  kategori_dokumen: 'Reguler' | 'Bantuan' | 'Optional';
  is_required: boolean;
  is_editable_by_santri: boolean;
  pengajuan_bantuan_id?: string;
  keterangan?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export class DocumentService {
  /**
   * Get document requirements based on santri category and status
   * @param kategoriSantri - Kategori santri (Reguler, Binaan Mukim, dll) atau 'ALL'
   * @param statusSosial - Status sosial (Yatim, Piatu, Yatim Piatu, Lengkap)
   * @param isBantuanRecipient - Apakah santri penerima bantuan
   */
  static async getDocumentRequirements(
    kategoriSantri: string = 'ALL',
    statusSosial?: string,
    isBantuanRecipient: boolean = false
  ): Promise<DocumentRequirement[]> {
    try {
      const { data, error } = await supabase
        .from('requirement_dokumen')
        .select('*')
        .or(`kategori_santri.eq.${kategoriSantri},kategori_santri.eq.ALL`)
        .order('urutan', { ascending: true });

      if (error) throw error;

      console.log('📋 [DocumentService] Raw requirements from DB:', {
        kategoriSantri,
        statusSosial,
        isBantuanRecipient,
        totalRaw: data?.length || 0,
        sample: data?.slice(0, 3)
      });

      // Helper function to check if status sosial matches kondisi_required
      const checkKondisiRequired = (kondisiRequired: string | null, currentStatusSosial?: string): boolean => {
        if (!kondisiRequired) return true; // No condition = always include
        
        if (!currentStatusSosial) return false; // No status = don't include if has condition
        
        // Parse kondisi_required (format: "Yatim,Piatu,Yatim Piatu" or single value)
        const conditions = kondisiRequired.split(',').map(c => c.trim());
        const matches = conditions.includes(currentStatusSosial);
        
        console.log('🔍 [DocumentService] Checking kondisi:', {
          kondisiRequired,
          currentStatusSosial,
          conditions,
          matches
        });
        
        return matches;
      };

      // List of documents to exclude for Binaan (redundant or not needed)
      const excludedDocumentsForBinaan = [
        'Surat Keterangan Sehat',
        'KTP Orang Tua', // Already have KTP Wali Utama and Pendamping
        'Akta Kematian Orang Tua', // Already have specific Akta Kematian Ayah/Ibu
        'Surat Permohonan',
        'Surat Keterangan Penghasilan',
        'Surat Keterangan Tidak Mampu', // Redundant with SKTM
        'Sertifikat Prestasi',
        'Raport',
        'Slip Gaji Orang Tua',
        'Surat Keterangan', // Generic, not needed
        'KTP Santri', // Optional, not needed for onboarding
        'Dokumen Lainnya' // Generic, not needed
      ];

      // Check if this is Binaan category
      const isBinaanCategory = kategoriSantri?.includes('Binaan') || false;

      // Filter based on conditions
      const filtered = (data || []).filter(req => {
        // Exclude redundant documents for Binaan
        if (isBinaanCategory && excludedDocumentsForBinaan.includes(req.jenis_dokumen)) {
          return false;
        }

        // RULE 1: Regular documents
        if (req.kategori_dokumen === 'Reguler') {
          // If has kondisi_required, check if status matches
          if (req.kondisi_required) {
            return checkKondisiRequired(req.kondisi_required, statusSosial);
          }
          // No condition = always include
          return true;
        }
        
        // RULE 2: Beasiswa/Bantuan documents - only for bantuan recipients
        // BUT: For Binaan, we don't need Beasiswa category documents (they have their own Reguler docs)
        if (req.kategori_dokumen === 'Beasiswa' || req.kategori_dokumen === 'Bantuan') {
          // Skip Beasiswa documents for Binaan (they use Reguler category)
          if (isBinaanCategory) return false;
          
          if (!isBantuanRecipient) return false; // Skip if not bantuan
          
          // If has condition, check if status matches
          if (req.kondisi_required) {
            return checkKondisiRequired(req.kondisi_required, statusSosial);
          }
          
          // No condition = required for all bantuan
          return true;
        }
        
        // RULE 3: Optional documents - exclude for Binaan (they have specific optional docs)
        if (req.kategori_dokumen === 'Optional') {
          // For Binaan, only show specific optional docs (Ijazah, Transkrip) from Reguler category
          if (isBinaanCategory) return false;
          return true;
        }
        
        return false;
      });

      // Deduplicate: Prioritize specific category over 'ALL'
      // If same jenis_dokumen exists in both specific category and 'ALL', keep the specific one
      const deduplicated = new Map<string, DocumentRequirement>();
      
      // First pass: Add documents from specific category (prioritized)
      filtered.forEach(req => {
        if (req.kategori_santri === kategoriSantri && req.kategori_santri !== 'ALL') {
          deduplicated.set(req.jenis_dokumen, req);
        }
      });
      
      // Second pass: Add documents from 'ALL' only if not already in map
      filtered.forEach(req => {
        if (req.kategori_santri === 'ALL' && !deduplicated.has(req.jenis_dokumen)) {
          deduplicated.set(req.jenis_dokumen, req);
        }
      });
      
      // Convert map back to array and sort by urutan
      const result = Array.from(deduplicated.values()).sort((a, b) => {
        // Sort by urutan, but prioritize specific category
        if (a.kategori_santri === kategoriSantri && b.kategori_santri === 'ALL') return -1;
        if (a.kategori_santri === 'ALL' && b.kategori_santri === kategoriSantri) return 1;
        return (a.urutan || 0) - (b.urutan || 0);
      });

      console.log('✅ [DocumentService] Filtered & Deduplicated requirements:', {
        kategoriSantri,
        statusSosial,
        isBantuanRecipient,
        isBinaanCategory,
        totalBeforeDedup: filtered.length,
        totalAfterDedup: result.length,
        duplicatesRemoved: filtered.length - result.length,
        excludedCount: (data || []).length - filtered.length,
        byCategory: {
          reguler: result.filter(r => r.kategori_dokumen === 'Reguler').length,
          beasiswa: result.filter(r => r.kategori_dokumen === 'Beasiswa' || r.kategori_dokumen === 'Bantuan').length,
          optional: result.filter(r => r.kategori_dokumen === 'Optional').length,
        },
        withCondition: result.filter(r => r.kondisi_required).length,
        documents: result.map(r => ({
          jenis: r.jenis_dokumen,
          kategori: r.kategori_dokumen,
          kategoriSantri: r.kategori_santri,
          required: r.is_required,
          kondisi: r.kondisi_required
        }))
      });

      return result;
    } catch (error) {
      console.error('Error getting document requirements:', error);
      throw error;
    }
  }

  /**
   * Get documents for a specific santri
   */
  static async getSantriDocuments(santriId: string): Promise<DocumentFile[]> {
    try {
      const { data, error } = await supabase
        .from('dokumen_santri')
        .select('*')
        .eq('santri_id', santriId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting santri documents:', error);
      throw error;
    }
  }

  /**
   * Upload document
   */
  static async uploadDocument(
    santriId: string,
    documentType: string,
    file: File,
    pengajuanBantuanId?: string
  ): Promise<DocumentFile> {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${timestamp}.${fileExtension}`;
      const filePath = `santri/${santriId}/${documentType}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('santri-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get document requirement info
      const requirements = await this.getDocumentRequirements();
      const requirement = requirements.find(r => r.jenis_dokumen === documentType);

      // Insert document record
      const { data, error } = await supabase
        .from('dokumen_santri')
        .insert({
          santri_id: santriId,
          jenis_dokumen: documentType,
          nama_dokumen: documentType,
          nama_file: file.name,
          path_file: filePath,
          ukuran_file: file.size,
          tipe_file: file.type,
          status_verifikasi: 'Belum Diverifikasi',
          kategori_dokumen: requirement?.kategori_dokumen || 'Reguler',
          is_required: requirement?.is_required || false,
          is_editable_by_santri: requirement?.is_editable_by_santri ?? true,
          pengajuan_bantuan_id: pengajuanBantuanId,
          keterangan: requirement?.deskripsi
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  /**
   * Delete document
   */
  static async deleteDocument(documentId: string): Promise<void> {
    try {
      // Get document info first
      const { data: document, error: fetchError } = await supabase
        .from('dokumen_santri')
        .select('path_file')
        .eq('id', documentId)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage
      if (document.path_file) {
        const { error: storageError } = await supabase.storage
          .from('santri-documents')
          .remove([document.path_file]);

        if (storageError) console.warn('Storage deletion error:', storageError);
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('dokumen_santri')
        .delete()
        .eq('id', documentId);

      if (deleteError) throw deleteError;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  /**
   * Verify document
   */
  static async verifyDocument(
    documentId: string,
    status: 'Diverifikasi' | 'Belum Diverifikasi' | 'Ditolak',
    catatan?: string,
    verifikasiOleh?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status_verifikasi: status,
        tanggal_verifikasi: new Date().toISOString(),
        catatan_verifikasi: catatan
      };

      if (verifikasiOleh) {
        updateData.verifikasi_oleh = verifikasiOleh;
      }

      const { error } = await supabase
        .from('dokumen_santri')
        .update(updateData)
        .eq('id', documentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error verifying document:', error);
      throw error;
    }
  }

  /**
   * Get document download URL
   */
  static async getDocumentUrl(pathFile: string): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from('santri-documents')
        .createSignedUrl(pathFile, 3600); // 1 hour expiry

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting document URL:', error);
      throw error;
    }
  }

  /**
   * Download document
   */
  static async downloadDocument(pathFile: string, fileName: string): Promise<void> {
    try {
      const url = await this.getDocumentUrl(pathFile);
      
      const response = await fetch(url);
      const blob = await response.blob();
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading document:', error);
      throw error;
    }
  }
}
