/**
 * Service Layer untuk Realisasi Layanan Santri
 * 
 * Menangani:
 * - Rancangan anggaran layanan santri
 * - Generate layanan periodik dari realisasi pengeluaran
 * - Generate layanan periodik dari rancangan anggaran
 * - Query realisasi layanan per santri
 */

import { supabase } from '@/integrations/supabase/client';
import { MasterDataKeuanganService } from '@/services/masterDataKeuangan.service';

// PilarLayanan is now a string (kode from master_data_keuangan table)
// Old enum values: 'pendidikan_formal' | 'pendidikan_pesantren' | 'asrama_konsumsi' | 'bantuan_langsung'
export type PilarLayanan = string;

export interface RancanganAnggaranLayanan {
  id: string;
  periode: string; // "YYYY-MM"
  pilar_layanan: PilarLayanan;
  nilai_per_santri: number;
  jumlah_santri_target: number | null;
  total_anggaran: number;
  status: 'draft' | 'approved' | 'generated';
  catatan: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RancanganAnggaranLayananPerSantri {
  id: string;
  rancangan_id: string;
  santri_id: string;
  pilar_layanan: PilarLayanan;
  nilai_layanan: number;
  created_at: string;
}

export interface LedgerLayananSantriPeriodik {
  id: string;
  periode: string; // "YYYY-MM"
  pilar_layanan: PilarLayanan;
  total_pengeluaran: number;
  jumlah_santri_snapshot: number;
  nilai_per_santri: number;
  sumber_perhitungan: 'realisasi' | 'rancangan';
  referensi_rancangan_id: string | null;
  status: 'draft' | 'finalized';
  catatan: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RealisasiLayananSantri {
  id: string;
  santri_id: string;
  periode: string; // "YYYY-MM"
  pilar_layanan: PilarLayanan;
  nilai_layanan: number;
  sumber_perhitungan: 'bantuan_langsung' | 'generate_periodik' | 'rancangan';
  referensi_keuangan_id: string | null;
  referensi_periodik_id: string | null;
  referensi_rancangan_id: string | null;
  created_at: string;
  // Joined data
  santri?: {
    id: string;
    nama_lengkap: string;
    nisn: string | null;
    kategori: string;
  };
}

export interface RealisasiLayananSantriSummary {
  santri_id: string;
  santri_nama: string;
  santri_nisn: string | null;
  // Dynamic pilar columns: Record<pilar_kode, nilai>
  pilar: Record<string, number>;
  total: number;
  // Backward compatibility: old hardcoded properties (deprecated, use pilar instead)
  pendidikan_formal?: number;
  pendidikan_pesantren?: number;
  asrama_konsumsi?: number;
  bantuan_langsung?: number;
}

export interface CreateRancanganAnggaranData {
  periode: string;
  pilar_layanan: PilarLayanan;
  nilai_per_santri: number;
  jumlah_santri_target?: number | null;
  catatan?: string;
  customPerSantri?: Array<{
    santri_id: string;
    nilai_layanan: number;
  }>;
}

export interface GenerateLayananPeriodikData {
  periode: string;
  pilar_layanan: PilarLayanan;
  sumber: 'realisasi' | 'rancangan';
  rancangan_id?: string; // Required if sumber = 'rancangan'
}

export class LayananSantriService {
  /**
   * Get rancangan anggaran untuk periode tertentu
   * NOTE: Tabel rancangan_anggaran_layanan sudah dihapus, fungsi ini return empty array
   */
  static async getRancanganAnggaran(
    periode?: string,
    pilar_layanan?: PilarLayanan
  ): Promise<RancanganAnggaranLayanan[]> {
    try {
      // Tabel rancangan_anggaran_layanan sudah dihapus, return empty array
      // TODO: Implement rancangan anggaran dengan struktur baru jika diperlukan
      console.warn('getRancanganAnggaran: Tabel rancangan_anggaran_layanan sudah dihapus, returning empty array');
      return [];
    } catch (error) {
      console.error('Error getting rancangan anggaran:', error);
      // Return empty array instead of throwing to prevent UI errors
      return [];
    }
  }

  /**
   * Get custom nilai per santri untuk rancangan tertentu
   */
  static async getRancanganPerSantri(
    rancangan_id: string
  ): Promise<RancanganAnggaranLayananPerSantri[]> {
    try {
      const { data, error } = await supabase
        .from('rancangan_anggaran_layanan_per_santri')
        .select('*')
        .eq('rancangan_id', rancangan_id);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting rancangan per santri:', error);
      throw error;
    }
  }

  /**
   * Create rancangan anggaran
   * DEPRECATED: Tabel rancangan_anggaran_layanan sudah dihapus
   * Fungsi ini masih ada untuk backward compatibility tapi tidak melakukan operasi apa-apa
   */
  static async createRancanganAnggaran(
    data: CreateRancanganAnggaranData
  ): Promise<RancanganAnggaranLayanan> {
    // DEPRECATED: Rancangan anggaran feature sudah dihapus
    // Return empty/dummy data untuk backward compatibility
    console.warn('createRancanganAnggaran: Rancangan anggaran feature sudah dihapus. Fungsi ini tidak melakukan operasi apapun.');
    throw new Error('Fitur rancangan anggaran sudah tidak tersedia. Gunakan generate dari realisasi atau input manual.');
  }

  /**
   * Get ledger periodik untuk periode tertentu
   */
  static async getLedgerPeriodik(
    periode?: string,
    pilar_layanan?: PilarLayanan
  ): Promise<LedgerLayananSantriPeriodik[]> {
    try {
      let query = supabase
        .from('ledger_layanan_santri_periodik')
        .select('*')
        .order('periode', { ascending: false })
        .order('pilar_layanan', { ascending: true });

      if (periode) {
        query = query.eq('periode', periode);
      }
      if (pilar_layanan) {
        query = query.eq('pilar_layanan', pilar_layanan);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting ledger periodik:', error);
      throw error;
    }
  }

  /**
   * Check if periodik exists for periode and pilar
   */
  static async checkPeriodikExists(
    periode: string,
    pilar_layanan: PilarLayanan
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('ledger_layanan_santri_periodik')
        .select('id')
        .eq('periode', periode)
        .eq('pilar_layanan', pilar_layanan)
        .eq('sumber_perhitungan', 'realisasi')
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking periodik exists:', error);
      return false;
    }
  }

  /**
   * Delete periodik untuk periode dan pilar tertentu
   */
  static async deletePeriodik(
    periode: string,
    pilar_layanan: PilarLayanan
  ): Promise<void> {
    try {
      // Get periodik ID first
      const { data: periodikData, error: fetchError } = await supabase
        .from('ledger_layanan_santri_periodik')
        .select('id')
        .eq('periode', periode)
        .eq('pilar_layanan', pilar_layanan)
        .eq('sumber_perhitungan', 'realisasi');

      if (fetchError) throw fetchError;

      if (periodikData && periodikData.length > 0) {
        const periodikId = periodikData[0].id;

        // Delete realisasi entries first (CASCADE should handle this, but explicit is safer)
        const { error: deleteLedgerError } = await supabase
          .from('realisasi_layanan_santri')
          .delete()
          .eq('referensi_periodik_id', periodikId);

        if (deleteLedgerError) throw deleteLedgerError;

        // Delete periodik
        const { error: deleteError } = await supabase
          .from('ledger_layanan_santri_periodik')
          .delete()
          .eq('id', periodikId);

        if (deleteError) throw deleteError;
      }
    } catch (error) {
      console.error('Error deleting periodik:', error);
      throw error;
    }
  }

  /**
   * Get jumlah santri binaan mukim aktif pada akhir periode tertentu
   */
  static async getJumlahSantriBinaanMukim(periode: string): Promise<number> {
    try {
      // Parse periode to get year and month
      const [year, month] = periode.split('-').map(Number);
      const endDate = new Date(year, month, 0); // Last day of the month

      // Get santri binaan mukim yang aktif pada akhir periode
      const { data, error } = await supabase
        .from('santri')
        .select('id')
        .eq('status', 'Aktif')
        .or('kategori.ilike.%Binaan Mukim%,kategori.ilike.%Mukim Binaan%')
        .lte('created_at', endDate.toISOString()); // Santri yang sudah ada sebelum/saat akhir periode

      if (error) throw error;

      return data?.length || 0;
    } catch (error) {
      console.error('Error getting jumlah santri binaan mukim:', error);
      throw error;
    }
  }

  /**
   * Get total pengeluaran untuk kategori tertentu di periode tertentu
   * REVISI: Untuk bantuan_langsung dan pendidikan_formal, ambil SEMUA transaksi (termasuk yang punya santri_id)
   */
  static async getTotalPengeluaranPerPilar(
    periode: string,
    pilar_layanan: PilarLayanan
  ): Promise<number> {
    try {
      const [year, month] = periode.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      // Map pilar layanan ke kategori keuangan
      const kategoriMapping: Record<PilarLayanan, string[]> = {
        pendidikan_pesantren: ['Pendidikan Pesantren'],
        asrama_konsumsi: ['Operasional dan Konsumsi Santri'],
        pendidikan_formal: ['Pendidikan Formal'],
        bantuan_langsung: ['Bantuan Langsung Yayasan'],
      };

      const kategoriList = kategoriMapping[pilar_layanan] || [];

      // REVISI: Untuk bantuan_langsung dan pendidikan_formal, ambil SEMUA transaksi
      // (tidak filter santri_id karena kita mau total semua transaksi)
      const query = supabase
        .from('keuangan')
        .select('jumlah')
        .eq('jenis_transaksi', 'Pengeluaran')
        .eq('status', 'posted')
        .eq('ledger', 'UMUM')
        .in('kategori', kategoriList)
        .gte('tanggal', startDate.toISOString().split('T')[0])
        .lte('tanggal', endDate.toISOString().split('T')[0]);

      const { data, error } = await query;
      if (error) throw error;

      const total = (data || []).reduce((sum, item) => sum + (Number(item.jumlah) || 0), 0);
      return total;
    } catch (error) {
      console.error('Error getting total pengeluaran per pilar:', error);
      throw error;
    }
  }

  /**
   * Get daftar santri yang akan di-generate untuk bantuan langsung atau pendidikan formal
   * Returns list of students with their transaction amounts
   */
  static async getDaftarSantriUntukGenerate(
    periode: string,
    pilar_layanan: 'bantuan_langsung' | 'pendidikan_formal'
  ): Promise<Array<{
    santri_id: string;
    santri_nama: string;
    santri_nisn: string | null;
    total_nilai: number;
    jumlah_transaksi: number;
  }>> {
    try {
      const [year, month] = periode.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const kategoriMapping: Record<string, string> = {
        bantuan_langsung: 'Bantuan Langsung Yayasan',
        pendidikan_formal: 'Pendidikan Formal',
      };

      const kategori = kategoriMapping[pilar_layanan];
      if (!kategori) {
        throw new Error(`Pilar layanan ${pilar_layanan} tidak didukung`);
      }

      // Get transaksi keuangan yang punya santri_id
      const { data: keuanganData, error: keuanganError } = await supabase
        .from('keuangan')
        .select(`
          id,
          santri_id,
          jumlah,
          tanggal,
          santri:santri_id(
            id,
            nama_lengkap,
            nisn
          )
        `)
        .eq('jenis_transaksi', 'Pengeluaran')
        .eq('status', 'posted')
        .eq('ledger', 'UMUM')
        .eq('kategori', kategori)
        .not('santri_id', 'is', null)
        .gte('tanggal', startDate.toISOString().split('T')[0])
        .lte('tanggal', endDate.toISOString().split('T')[0]);

      if (keuanganError) {
        console.error('Error getting keuangan data:', keuanganError);
      }

      // Get dari alokasi_pengeluaran_santri untuk transaksi lama
      // REVISI: Ambil semua alokasi untuk kategori ini, lalu filter berdasarkan tanggal keuangan di client-side
      const { data: alokasiData, error: alokasiError } = await supabase
        .from('alokasi_layanan_santri')
        .select(`
          santri_id,
          nominal_alokasi,
          keuangan_id,
          keuangan:keuangan_id(
            kategori,
            tanggal
          ),
          santri:santri_id(
            id,
            nama_lengkap,
            nisn
          )
        `)
        .eq('sumber_alokasi', 'manual');

      if (alokasiError) {
        console.error('Error getting alokasi data:', alokasiError);
      }

      // Aggregate per santri
      const santriMap = new Map<string, {
        santri_id: string;
        santri_nama: string;
        santri_nisn: string | null;
        total_nilai: number;
        jumlah_transaksi: number;
      }>();

      // Dari transaksi keuangan langsung
      (keuanganData || []).forEach((tx: any) => {
        const santriId = tx.santri_id;
        const nilai = Number(tx.jumlah) || 0;
        const santri = tx.santri as any;

        if (!santriMap.has(santriId)) {
          santriMap.set(santriId, {
            santri_id: santriId,
            santri_nama: santri?.nama_lengkap || 'Tidak Diketahui',
            santri_nisn: santri?.nisn || null,
            total_nilai: 0,
            jumlah_transaksi: 0,
          });
        }

        const entry = santriMap.get(santriId)!;
        entry.total_nilai += nilai;
        entry.jumlah_transaksi += 1;
      });

      // Dari alokasi_pengeluaran_santri
      (alokasiData || []).forEach((alokasi: any) => {
        if (alokasi.keuangan?.kategori === kategori) {
          const txDate = alokasi.keuangan?.tanggal;
          if (txDate) {
            const txDateObj = new Date(txDate);
            if (txDateObj >= startDate && txDateObj <= endDate) {
              const santriId = alokasi.santri_id;
              const nilai = Number(alokasi.nominal_alokasi) || 0;
              const santri = alokasi.santri as any;

              if (!santriMap.has(santriId)) {
                santriMap.set(santriId, {
                  santri_id: santriId,
                  santri_nama: santri?.nama_lengkap || 'Tidak Diketahui',
                  santri_nisn: santri?.nisn || null,
                  total_nilai: 0,
                  jumlah_transaksi: 0,
                });
              }

              const entry = santriMap.get(santriId)!;
              entry.total_nilai += nilai;
              entry.jumlah_transaksi += 1;
            }
          }
        }
      });

      return Array.from(santriMap.values()).sort((a, b) => 
        a.santri_nama.localeCompare(b.santri_nama)
      );
    } catch (error) {
      console.error('Error getting daftar santri untuk generate:', error);
      throw error;
    }
  }

  /**
   * Get monthly breakdown pengeluaran untuk pilar tertentu (untuk preview di dialog)
   */
  static async getMonthlyBreakdownPerPilar(
    periode: string,
    pilar_layanan: PilarLayanan,
    monthsBack: number = 3
  ): Promise<Array<{ month: string; amount: number; periode: string }>> {
    try {
      const [year, month] = periode.split('-').map(Number);
      const results: Array<{ month: string; amount: number; periode: string }> = [];

      // Map pilar layanan ke kategori keuangan
      const kategoriMapping: Record<PilarLayanan, string[]> = {
        pendidikan_pesantren: ['Pendidikan Pesantren'],
        asrama_konsumsi: ['Operasional dan Konsumsi Santri'],
        pendidikan_formal: ['Pendidikan Formal'],
        bantuan_langsung: ['Bantuan Langsung Yayasan'],
      };

      const kategoriList = kategoriMapping[pilar_layanan] || [];

      // Get data for last N months
      for (let i = 0; i < monthsBack; i++) {
        const checkDate = new Date(year, month - 1 - i, 1);
        const checkPeriode = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}`;
        const checkStartDate = new Date(checkDate.getFullYear(), checkDate.getMonth(), 1);
        const checkEndDate = new Date(checkDate.getFullYear(), checkDate.getMonth() + 1, 0);

        const { data, error } = await supabase
          .from('keuangan')
          .select('jumlah')
          .eq('jenis_transaksi', 'Pengeluaran')
          .eq('status', 'posted')
          .eq('ledger', 'UMUM')
          .in('kategori', kategoriList)
          .gte('tanggal', checkStartDate.toISOString().split('T')[0])
          .lte('tanggal', checkEndDate.toISOString().split('T')[0]);

        if (error) {
          console.error(`Error getting data for ${checkPeriode}:`, error);
          continue;
        }

        const total = (data || []).reduce((sum, item) => sum + (Number(item.jumlah) || 0), 0);
        const monthName = checkDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        
        results.push({
          month: monthName,
          amount: total,
          periode: checkPeriode,
        });
      }

      return results.reverse(); // Reverse to show oldest first
    } catch (error) {
      console.error('Error getting monthly breakdown:', error);
      return [];
    }
  }

  /**
   * Generate layanan periodik dari realisasi pengeluaran
   * REVISI: Untuk bantuan_langsung dan pendidikan_formal, generate langsung dari transaksi keuangan yang punya santri_id
   */
  static async generateLayananPeriodikDariRealisasi(
    data: GenerateLayananPeriodikData
  ): Promise<LedgerLayananSantriPeriodik> {
    try {
      if (data.sumber !== 'realisasi') {
        throw new Error('Method ini hanya untuk generate dari realisasi');
      }

      // REVISI: Untuk bantuan_langsung dan pendidikan_formal, generate langsung dari transaksi keuangan
      if (data.pilar_layanan === 'bantuan_langsung' || data.pilar_layanan === 'pendidikan_formal') {
        return await this.generateLayananDariTransaksiKeuangan(data);
      }

      // Untuk pilar lain (pendidikan_pesantren, asrama_konsumsi), gunakan logika lama (dibagi rata)
      // Get total pengeluaran
      const totalPengeluaran = await this.getTotalPengeluaranPerPilar(
        data.periode,
        data.pilar_layanan
      );

      // Get jumlah santri snapshot
      const jumlahSantri = await this.getJumlahSantriBinaanMukim(data.periode);

      if (jumlahSantri === 0) {
        throw new Error('Tidak ada santri binaan mukim aktif pada periode ini');
      }

      const nilaiPerSantri = totalPengeluaran / jumlahSantri;

      // REVISI: Delete existing periodik untuk periode dan pilar yang sama untuk menghindari duplicate key
      const { error: deleteError } = await supabase
        .from('ledger_layanan_santri_periodik')
        .delete()
        .eq('periode', data.periode)
        .eq('pilar_layanan', data.pilar_layanan)
        .eq('sumber_perhitungan', 'realisasi');

      if (deleteError) throw deleteError;

      // Insert ledger periodik
      const { data: periodik, error: periodikError } = await supabase
        .from('ledger_layanan_santri_periodik')
        .insert({
          periode: data.periode,
          pilar_layanan: data.pilar_layanan,
          total_pengeluaran: totalPengeluaran,
          jumlah_santri_snapshot: jumlahSantri,
          nilai_per_santri: nilaiPerSantri,
          sumber_perhitungan: 'realisasi',
          status: 'draft',
        })
        .select()
        .single();

      if (periodikError) throw periodikError;

      // Generate ledger per santri
      await this.generateLedgerPerSantriDariPeriodik(periodik.id);

      return periodik;
    } catch (error) {
      console.error('Error generating layanan periodik dari realisasi:', error);
      throw error;
    }
  }

  /**
   * Generate layanan langsung dari transaksi keuangan yang punya santri_id
   * Untuk bantuan_langsung dan pendidikan_formal
   */
  static async generateLayananDariTransaksiKeuangan(
    data: GenerateLayananPeriodikData
  ): Promise<LedgerLayananSantriPeriodik> {
    try {
      const [year, month] = data.periode.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      // Map pilar ke kategori
      const kategoriMapping: Record<string, string> = {
        bantuan_langsung: 'Bantuan Langsung Yayasan',
        pendidikan_formal: 'Pendidikan Formal',
      };

      const kategori = kategoriMapping[data.pilar_layanan];
      if (!kategori) {
        throw new Error(`Pilar layanan ${data.pilar_layanan} tidak didukung untuk generate dari transaksi keuangan`);
      }

      // Get transaksi keuangan yang punya santri_id
      const { data: keuanganData, error: keuanganError } = await supabase
        .from('keuangan')
        .select('id, santri_id, jumlah, tanggal')
        .eq('jenis_transaksi', 'Pengeluaran')
        .eq('status', 'posted')
        .eq('ledger', 'UMUM')
        .eq('kategori', kategori)
        .not('santri_id', 'is', null)
        .gte('tanggal', startDate.toISOString().split('T')[0])
        .lte('tanggal', endDate.toISOString().split('T')[0]);

      if (keuanganError) throw keuanganError;

      // Juga ambil dari alokasi_layanan_santri untuk transaksi lama
      const { data: alokasiData, error: alokasiError } = await supabase
        .from('alokasi_layanan_santri')
        .select(`
          santri_id,
          nominal_alokasi,
          sumber_alokasi,
          keuangan_id,
          keuangan:keuangan_id(
            kategori,
            tanggal
          )
        `)
        .eq('sumber_alokasi', 'manual')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (alokasiError) {
        console.error('Error getting alokasi data:', alokasiError);
      }

      // Aggregate per santri
      const santriMap = new Map<string, number>();
      let totalPengeluaran = 0;

      // Dari transaksi keuangan langsung
      (keuanganData || []).forEach((tx: any) => {
        const nilai = Number(tx.jumlah) || 0;
        const santriId = tx.santri_id;
        santriMap.set(santriId, (santriMap.get(santriId) || 0) + nilai);
        totalPengeluaran += nilai;
      });

      // Dari alokasi_pengeluaran_santri
      (alokasiData || []).forEach((alokasi: any) => {
        if (alokasi.keuangan?.kategori === kategori) {
          const txDate = alokasi.keuangan?.tanggal;
          if (txDate) {
            const txDateObj = new Date(txDate);
            if (txDateObj >= startDate && txDateObj <= endDate) {
              const nilai = Number(alokasi.nominal_alokasi) || 0;
              const santriId = alokasi.santri_id;
              santriMap.set(santriId, (santriMap.get(santriId) || 0) + nilai);
              totalPengeluaran += nilai;
            }
          }
        }
      });

      const jumlahSantri = santriMap.size;

      if (jumlahSantri === 0) {
        throw new Error(`Tidak ada transaksi ${kategori} dengan santri_id pada periode ini`);
      }

      // Delete existing periodik
      const { error: deletePeriodikError } = await supabase
        .from('ledger_layanan_santri_periodik')
        .delete()
        .eq('periode', data.periode)
        .eq('pilar_layanan', data.pilar_layanan)
        .eq('sumber_perhitungan', 'realisasi');

      if (deletePeriodikError) throw deletePeriodikError;

      // Delete existing realisasi entries untuk periode ini
      const { error: deleteLedgerError } = await supabase
        .from('realisasi_layanan_santri')
        .delete()
        .eq('periode', data.periode)
        .eq('pilar_layanan', data.pilar_layanan)
        .eq('sumber_perhitungan', 'generate_periodik');

      if (deleteLedgerError) throw deleteLedgerError;

      // Create periodik record
      const nilaiPerSantri = jumlahSantri > 0 ? totalPengeluaran / jumlahSantri : 0;

      const { data: periodik, error: periodikError } = await supabase
        .from('ledger_layanan_santri_periodik')
        .insert({
          periode: data.periode,
          pilar_layanan: data.pilar_layanan,
          total_pengeluaran: totalPengeluaran,
          jumlah_santri_snapshot: jumlahSantri,
          nilai_per_santri: nilaiPerSantri,
          sumber_perhitungan: 'realisasi',
          status: 'draft',
        })
        .select()
        .single();

      if (periodikError) throw periodikError;

      // Create ledger entries per santri (dari transaksi keuangan yang sudah ada)
      const ledgerEntries: Array<{
        santri_id: string;
        periode: string;
        pilar_layanan: PilarLayanan;
        nilai_layanan: number;
        sumber_perhitungan: 'generate_periodik';
        referensi_periodik_id: string;
        referensi_keuangan_id?: string;
      }> = [];

      // Dari transaksi keuangan langsung
      (keuanganData || []).forEach((tx: any) => {
        const nilai = Number(tx.jumlah) || 0;
        ledgerEntries.push({
          santri_id: tx.santri_id,
          periode: data.periode,
          pilar_layanan: data.pilar_layanan,
          nilai_layanan: nilai,
          sumber_perhitungan: 'generate_periodik',
          referensi_periodik_id: periodik.id,
          referensi_keuangan_id: tx.id,
        });
      });

      // Dari alokasi_pengeluaran_santri (untuk transaksi lama)
      (alokasiData || []).forEach((alokasi: any) => {
        if (alokasi.keuangan?.kategori === kategori) {
          const txDate = alokasi.keuangan?.tanggal;
          if (txDate) {
            const txDateObj = new Date(txDate);
            if (txDateObj >= startDate && txDateObj <= endDate) {
              const nilai = Number(alokasi.nominal_alokasi) || 0;
              ledgerEntries.push({
                santri_id: alokasi.santri_id,
                periode: data.periode,
                pilar_layanan: data.pilar_layanan,
                nilai_layanan: nilai,
                sumber_perhitungan: 'generate_periodik',
                referensi_periodik_id: periodik.id,
                referensi_keuangan_id: alokasi.keuangan_id,
              });
            }
          }
        }
      });

      // Insert realisasi entries
      if (ledgerEntries.length > 0) {
        const { error: insertError } = await supabase
          .from('realisasi_layanan_santri')
          .insert(ledgerEntries);

        if (insertError) throw insertError;
      }

      return periodik;
    } catch (error) {
      console.error('Error generating layanan dari transaksi keuangan:', error);
      throw error;
    }
  }

  /**
   * Generate layanan periodik dari rancangan anggaran
   */
  static async generateLayananPeriodikDariRancangan(
    data: GenerateLayananPeriodikData
  ): Promise<LedgerLayananSantriPeriodik> {
    try {
      if (data.sumber !== 'rancangan' || !data.rancangan_id) {
        throw new Error('Method ini hanya untuk generate dari rancangan, dan rancangan_id harus disediakan');
      }

      // Get rancangan
      const rancangan = await this.getRancanganAnggaran(data.periode, data.pilar_layanan);
      const targetRancangan = rancangan.find(r => r.id === data.rancangan_id);

      if (!targetRancangan) {
        throw new Error('Rancangan anggaran tidak ditemukan');
      }

      // Get jumlah santri snapshot
      const jumlahSantri = await this.getJumlahSantriBinaanMukim(data.periode);

      if (jumlahSantri === 0) {
        throw new Error('Tidak ada santri binaan mukim aktif pada periode ini');
      }

      // Get custom per santri if any
      const customPerSantri = await this.getRancanganPerSantri(targetRancangan.id);

      // Calculate total anggaran
      let totalAnggaran = 0;
      if (customPerSantri.length > 0) {
        totalAnggaran = customPerSantri.reduce((sum, item) => sum + item.nilai_layanan, 0);
      } else {
        totalAnggaran = targetRancangan.nilai_per_santri * jumlahSantri;
      }

      const nilaiPerSantri = jumlahSantri > 0 ? totalAnggaran / jumlahSantri : 0;

      // Insert ledger periodik
      const { data: periodik, error: periodikError } = await supabase
        .from('ledger_layanan_santri_periodik')
        .insert({
          periode: data.periode,
          pilar_layanan: data.pilar_layanan,
          total_pengeluaran: totalAnggaran, // For rancangan, this is total anggaran
          jumlah_santri_snapshot: jumlahSantri,
          nilai_per_santri: nilaiPerSantri,
          sumber_perhitungan: 'rancangan',
          referensi_rancangan_id: targetRancangan.id,
          status: 'draft',
        })
        .select()
        .single();

      if (periodikError) throw periodikError;

      // Generate ledger per santri
      if (customPerSantri.length > 0) {
        // Use custom values
        await this.generateLedgerPerSantriDariRancanganCustom(
          periodik.id,
          targetRancangan.id,
          customPerSantri
        );
      } else {
        // Use flat value
        await this.generateLedgerPerSantriDariPeriodik(periodik.id);
      }

      // Update rancangan status
      await supabase
        .from('rancangan_anggaran_layanan')
        .update({ status: 'generated' })
        .eq('id', targetRancangan.id);

      return periodik;
    } catch (error) {
      console.error('Error generating layanan periodik dari rancangan:', error);
      throw error;
    }
  }

  /**
   * Generate ledger per santri dari periodik (flat value)
   */
  static async generateLedgerPerSantriDariPeriodik(
    periodik_id: string
  ): Promise<void> {
    try {
      // Get periodik data
      const { data: periodik, error: periodikError } = await supabase
        .from('ledger_layanan_santri_periodik')
        .select('*')
        .eq('id', periodik_id)
        .single();

      if (periodikError) throw periodikError;

      // Get all santri binaan mukim aktif pada akhir periode
      const jumlahSantri = await this.getJumlahSantriBinaanMukim(periodik.periode);
      const [year, month] = periodik.periode.split('-').map(Number);
      const endDate = new Date(year, month, 0);

      const { data: santriList, error: santriError } = await supabase
        .from('santri')
        .select('id')
        .eq('status', 'Aktif')
        .or('kategori.ilike.%Binaan Mukim%,kategori.ilike.%Mukim Binaan%')
        .lte('created_at', endDate.toISOString());

      if (santriError) throw santriError;

      // Create ledger entries
      const ledgerEntries = (santriList || []).map(santri => ({
        santri_id: santri.id,
        periode: periodik.periode,
        pilar_layanan: periodik.pilar_layanan,
        nilai_layanan: periodik.nilai_per_santri,
        sumber_perhitungan: 'generate_periodik' as const,
        referensi_periodik_id: periodik.id,
      }));

      if (ledgerEntries.length > 0) {
        // Delete existing entries for this periodik to avoid conflicts
        // The unique index includes COALESCE which can't be used in onConflict
        const { error: deleteError } = await supabase
          .from('realisasi_layanan_santri')
          .delete()
          .eq('periode', periodik.periode)
          .eq('pilar_layanan', periodik.pilar_layanan)
          .eq('sumber_perhitungan', 'generate_periodik')
          .eq('referensi_periodik_id', periodik.id);

        if (deleteError) throw deleteError;

        // Insert new entries
        const { error: insertError } = await supabase
          .from('realisasi_layanan_santri')
          .insert(ledgerEntries);

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error generating ledger per santri dari periodik:', error);
      throw error;
    }
  }

  /**
   * Generate ledger per santri dari rancangan dengan custom values
   */
  static async generateLedgerPerSantriDariRancanganCustom(
    periodik_id: string,
    rancangan_id: string,
    customPerSantri: RancanganAnggaranLayananPerSantri[]
  ): Promise<void> {
    try {
      // Get periodik data
      const { data: periodik, error: periodikError } = await supabase
        .from('ledger_layanan_santri_periodik')
        .select('*')
        .eq('id', periodik_id)
        .single();

      if (periodikError) throw periodikError;

      // Create ledger entries from custom values
      const ledgerEntries = customPerSantri.map(item => ({
        santri_id: item.santri_id,
        periode: periodik.periode,
        pilar_layanan: periodik.pilar_layanan,
        nilai_layanan: item.nilai_layanan,
        sumber_perhitungan: 'rancangan' as const,
        referensi_periodik_id: periodik.id,
        referensi_rancangan_id: rancangan_id,
      }));

      if (ledgerEntries.length > 0) {
        // Delete existing entries for this periodik and rancangan to avoid conflicts
        const { error: deleteError } = await supabase
          .from('realisasi_layanan_santri')
          .delete()
          .eq('periode', periodik.periode)
          .eq('pilar_layanan', periodik.pilar_layanan)
          .eq('sumber_perhitungan', 'rancangan')
          .eq('referensi_periodik_id', periodik.id)
          .eq('referensi_rancangan_id', rancangan_id);

        if (deleteError) throw deleteError;

        // Insert new entries
        const { error: insertError } = await supabase
          .from('realisasi_layanan_santri')
          .insert(ledgerEntries);

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error generating ledger per santri dari rancangan custom:', error);
      throw error;
    }
  }

  /**
   * Get realisasi layanan santri untuk periode tertentu
   * REVISI: Mengembalikan SEMUA santri binaan mukim, bukan hanya yang punya data di ledger
   * REVISI: Ambil langsung dari transaksi keuangan untuk "Bantuan Langsung" dan "Pendidikan Formal"
   * REVISI: Menggunakan struktur dynamic berdasarkan master_data_keuangan
   */
  static async getRealisasiLayananSantri(
    periode: string
  ): Promise<RealisasiLayananSantriSummary[]> {
    try {
      // Fetch pilar layanan dari master_data_keuangan
      const pilarList = await MasterDataKeuanganService.getPilarLayanan();
      const pilarMap = new Map<string, string>(); // Map kode -> nama
      pilarList.forEach(pilar => {
        pilarMap.set(pilar.kode, pilar.nama);
      });

      // Parse periode to get year and month
      const [year, month] = periode.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // Last day of the month

      // Get ALL santri binaan mukim aktif pada akhir periode
      const { data: allSantri, error: santriError } = await supabase
        .from('santri')
        .select('id, nama_lengkap, id_santri, nisn, kategori')
        .eq('status', 'Aktif')
        .or('kategori.ilike.%Binaan Mukim%,kategori.ilike.%Mukim Binaan%')
        .lte('created_at', endDate.toISOString())
        .order('nama_lengkap', { ascending: true });

      if (santriError) throw santriError;

      // Initialize summary map with all santri
      const summaryMap = new Map<string, RealisasiLayananSantriSummary>();
      
      (allSantri || []).forEach(santri => {
        // Initialize pilar object with all pilar kodes
        const pilar: Record<string, number> = {};
        pilarList.forEach(pilarItem => {
          pilar[pilarItem.kode] = 0;
        });

        summaryMap.set(santri.id, {
          santri_id: santri.id,
          santri_nama: santri.nama_lengkap || 'Tidak Diketahui',
          santri_nisn: (santri as any).nisn || null,
          pilar,
          total: 0,
        });
      });

      // REVISI: Hanya ambil dari realisasi_layanan_santri sebagai single source of truth
      // Tidak perlu ambil dari keuangan atau alokasi_pengeluaran_santri karena:
      // 1. Realisasi_layanan_santri sudah di-populate dari keuangan/alokasi saat transaksi dibuat
      // 2. Mengambil dari multiple sources bisa menyebabkan duplikasi
      // 3. Realisasi_layanan_santri adalah source of truth untuk realisasi layanan

      // Get all realisasi entries for the period
      const { data: realisasiEntries, error: realisasiError } = await supabase
        .from('realisasi_layanan_santri')
        .select(`
          *,
          santri:santri_id(id, nama_lengkap, nisn, kategori)
        `)
        .eq('periode', periode);

      if (realisasiError) throw realisasiError;

      // Populate summary map with realisasi data
      (realisasiEntries || []).forEach(entry => {
        const santriId = entry.santri_id;
        const pilarKode = entry.pilar_layanan as string;
        
        // Skip if santri not in our map (shouldn't happen, but safety check)
        if (!summaryMap.has(santriId)) {
          const santri = entry.santri as any;
          // Initialize pilar object with all pilar kodes
          const pilar: Record<string, number> = {};
          pilarList.forEach(pilarItem => {
            pilar[pilarItem.kode] = 0;
          });

          summaryMap.set(santriId, {
            santri_id: santriId,
            santri_nama: santri?.nama_lengkap || 'Tidak Diketahui',
            santri_nisn: santri?.nisn || null,
            pilar,
            total: 0,
          });
        }

        const summary = summaryMap.get(santriId)!;
        const nilai = Number(entry.nilai_layanan) || 0;

        // Accumulate nilai per pilar (dynamic)
        if (pilarKode && summary.pilar.hasOwnProperty(pilarKode)) {
          summary.pilar[pilarKode] = (summary.pilar[pilarKode] || 0) + nilai;
        } else if (pilarKode) {
          // Pilar tidak ditemukan di master_data_keuangan, tambahkan ke dynamic object
          summary.pilar[pilarKode] = (summary.pilar[pilarKode] || 0) + nilai;
        }
      });

      // Calculate totals
      summaryMap.forEach((summary) => {
        summary.total = Object.values(summary.pilar).reduce((sum, nilai) => sum + (nilai || 0), 0);
      });

      // Add backward compatibility properties for components still using old structure
      const result = Array.from(summaryMap.values()).map((summary) => ({
        ...summary,
        // Backward compatibility: add old properties for components still using them
        pendidikan_formal: summary.pilar['pendidikan_formal'] || 0,
        pendidikan_pesantren: summary.pilar['pendidikan_pesantren'] || 0,
        asrama_konsumsi: summary.pilar['asrama_konsumsi'] || 0,
        bantuan_langsung: summary.pilar['bantuan_langsung'] || 0,
      }));

      return result.sort((a, b) =>
        a.santri_nama.localeCompare(b.santri_nama)
      );
    } catch (error) {
      console.error('Error getting realisasi layanan santri:', error);
      throw error;
    }
  }

  /**
   * Get rancangan untuk periode tertentu (untuk comparison)
   */
  static async getRancanganUntukPeriode(
    periode: string
  ): Promise<Map<PilarLayanan, RancanganAnggaranLayanan>> {
    try {
      const rancangan = await this.getRancanganAnggaran(periode);
      const map = new Map<PilarLayanan, RancanganAnggaranLayanan>();

      rancangan.forEach(r => {
        map.set(r.pilar_layanan, r);
      });

      return map;
    } catch (error) {
      console.error('Error getting rancangan untuk periode:', error);
      throw error;
    }
  }

  /**
   * Get monthly breakdown layanan santri untuk santri tertentu
   * Returns breakdown per bulan untuk periode tertentu
   */
  static async getMonthlyBreakdownPerSantri(
    santri_id: string,
    startPeriode: string, // Format: "YYYY-MM"
    endPeriode: string   // Format: "YYYY-MM"
  ): Promise<Array<{
    periode: string;
    pilar: Record<string, number>; // Dynamic pilar columns
    total: number;
    // Backward compatibility (deprecated)
    pendidikan_formal?: number;
    pendidikan_pesantren?: number;
    asrama_konsumsi?: number;
    bantuan_langsung?: number;
  }>> {
    try {
      // Fetch pilar layanan dari master_data_keuangan
      const pilarList = await MasterDataKeuanganService.getPilarLayanan(true); // aktifOnly = true
      
      const [startYear, startMonth] = startPeriode.split('-').map(Number);
      const [endYear, endMonth] = endPeriode.split('-').map(Number);
      
      const results: Array<{
        periode: string;
        pilar: Record<string, number>;
        total: number;
        pendidikan_formal?: number;
        pendidikan_pesantren?: number;
        asrama_konsumsi?: number;
        bantuan_langsung?: number;
      }> = [];

      // Generate list of months between start and end
      const months: string[] = [];
      let currentYear = startYear;
      let currentMonth = startMonth;
      
      while (
        currentYear < endYear || 
        (currentYear === endYear && currentMonth <= endMonth)
      ) {
        months.push(`${currentYear}-${String(currentMonth).padStart(2, '0')}`);
        currentMonth++;
        if (currentMonth > 12) {
          currentMonth = 1;
          currentYear++;
        }
      }

      // Get data from realisasi_layanan_santri and keuangan for each month
      for (const monthPeriode of months) {
        const [year, month] = monthPeriode.split('-').map(Number);
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        // Get from realisasi_layanan_santri
        const { data: ledgerData, error: ledgerError } = await supabase
          .from('realisasi_layanan_santri')
          .select('pilar_layanan, nilai_layanan')
          .eq('santri_id', santri_id)
          .eq('periode', monthPeriode);

        if (ledgerError) {
          console.error(`Error getting ledger for ${monthPeriode}:`, ledgerError);
        }

        // Get from keuangan transactions - get ALL pengeluaran with santri_id (not hardcoded kategori)
        // Filter by pilar will be done after fetching kategori data from master_data_keuangan
        const { data: keuanganData, error: keuanganError } = await supabase
          .from('keuangan')
          .select('kategori, jumlah, tanggal')
          .eq('jenis_transaksi', 'Pengeluaran')
          .eq('status', 'posted')
          .eq('ledger', 'UMUM')
          .eq('santri_id', santri_id)
          .gte('tanggal', startDate.toISOString().split('T')[0])
          .lte('tanggal', endDate.toISOString().split('T')[0]);

        if (keuanganError) {
          console.error(`Error getting keuangan for ${monthPeriode}:`, keuanganError);
        }

        // Initialize pilar object with all pilar kodes (dynamic)
        const pilar: Record<string, number> = {};
        pilarList.forEach(pilarItem => {
          pilar[pilarItem.kode] = 0;
        });

        // From ledger - aggregate by pilar_layanan (dynamic)
        (ledgerData || []).forEach(entry => {
          const nilai = Number(entry.nilai_layanan) || 0;
          const pilarKode = entry.pilar_layanan as string;
          
          if (pilarKode && pilar.hasOwnProperty(pilarKode)) {
            pilar[pilarKode] = (pilar[pilarKode] || 0) + nilai;
          } else if (pilarKode) {
            // Pilar tidak ditemukan di master_data_keuangan, tambahkan ke dynamic object
            pilar[pilarKode] = (pilar[pilarKode] || 0) + nilai;
          }
        });

        // From keuangan transactions (direct) - REVISI: Pastikan mengambil semua transaksi yang punya santri_id
        // Need to map kategori to pilar_kode dynamically
        // Get unique kategori first, then map them to pilar
        const uniqueKategori = [...new Set((keuanganData || []).map(tx => tx.kategori).filter(Boolean))];
        const kategoriToPilarMap = new Map<string, string>();
        
        // Map kategori to pilar_layanan_kode
        for (const kategori of uniqueKategori) {
          try {
            const kategoriData = await MasterDataKeuanganService.getKategoriByNama(kategori);
            if (kategoriData?.pilar_layanan_kode) {
              kategoriToPilarMap.set(kategori, kategoriData.pilar_layanan_kode);
            }
          } catch (error) {
            console.warn(`Error mapping kategori "${kategori}" to pilar:`, error);
          }
        }
        
        // Process keuangan transactions with mapped pilar
        (keuanganData || []).forEach(tx => {
          const nilai = Number(tx.jumlah) || 0;
          const pilarKode = kategoriToPilarMap.get(tx.kategori || '');
          
          if (pilarKode) {
            if (pilar.hasOwnProperty(pilarKode)) {
              pilar[pilarKode] = (pilar[pilarKode] || 0) + nilai;
            } else {
              pilar[pilarKode] = nilai;
            }
          }
        });

        // REVISI: Juga cek dari alokasi_layanan_santri untuk transaksi lama yang mungkin belum punya santri_id di keuangan
        // Tapi hanya untuk kategori yang relevan
        const { data: alokasiData, error: alokasiError } = await supabase
          .from('alokasi_layanan_santri')
          .select(`
          nominal_alokasi,
          sumber_alokasi,
          keuangan:keuangan_id(
              kategori,
              tanggal
            )
          `)
          .eq('sumber_alokasi', 'manual')
          .eq('santri_id', santri_id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        if (!alokasiError && alokasiData && alokasiData.length > 0) {
          // Process alokasi data - map kategori to pilar dynamically
          // Get unique kategori from alokasi first
          const uniqueAlokasiKategori = [...new Set(
            (alokasiData || [])
              .map((a: any) => (a.keuangan && Array.isArray(a.keuangan) ? a.keuangan[0]?.kategori : a.keuangan?.kategori))
              .filter(Boolean)
          )];
          const alokasiKategoriToPilarMap = new Map<string, string>();
          
          // Map kategori to pilar_layanan_kode for alokasi
          for (const kategori of uniqueAlokasiKategori) {
            try {
              const kategoriData = await MasterDataKeuanganService.getKategoriByNama(kategori);
              if (kategoriData?.pilar_layanan_kode) {
                alokasiKategoriToPilarMap.set(kategori, kategoriData.pilar_layanan_kode);
              }
            } catch (error) {
              console.warn(`Error mapping kategori "${kategori}" to pilar:`, error);
            }
          }
          
          // Process alokasi with mapped pilar
          for (const alokasi of alokasiData) {
            const nilai = Number(alokasi.nominal_alokasi) || 0;
            // Handle keuangan yang bisa berupa object atau array
            const keuangan = Array.isArray(alokasi.keuangan) ? alokasi.keuangan[0] : alokasi.keuangan;
            const kategori = keuangan?.kategori;
            
            // Pastikan tanggal transaksi masuk dalam bulan yang sedang diproses
            const txDate = keuangan?.tanggal;
            if (txDate) {
              const txDateObj = new Date(txDate);
              if (txDateObj >= startDate && txDateObj <= endDate) {
                const pilarKode = alokasiKategoriToPilarMap.get(kategori || '');
                
                if (pilarKode) {
                  if (pilar.hasOwnProperty(pilarKode)) {
                    pilar[pilarKode] = (pilar[pilarKode] || 0) + nilai;
                  } else {
                    pilar[pilarKode] = nilai;
                  }
                }
              }
            }
          }
        }

        // Calculate total
        const total = Object.values(pilar).reduce((sum, val) => sum + (val || 0), 0);

        // Build result with dynamic pilar and backward compatibility
        const result: any = {
          periode: monthPeriode,
          pilar,
          total,
        };
        
        // Backward compatibility - map old hardcoded pilar if they exist
        if (pilar['pendidikan_formal'] !== undefined) result.pendidikan_formal = pilar['pendidikan_formal'];
        if (pilar['pendidikan_pesantren'] !== undefined) result.pendidikan_pesantren = pilar['pendidikan_pesantren'];
        if (pilar['asrama_konsumsi'] !== undefined) result.asrama_konsumsi = pilar['asrama_konsumsi'];
        if (pilar['bantuan_langsung'] !== undefined) result.bantuan_langsung = pilar['bantuan_langsung'];

        results.push(result);
      }

      return results.reverse(); // Oldest first
    } catch (error) {
      console.error('Error getting monthly breakdown per santri:', error);
      throw error;
    }
  }
}

