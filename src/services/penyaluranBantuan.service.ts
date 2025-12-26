import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, parseISO, eachMonthOfInterval } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export interface UnifiedPenyaluranBantuan {
  id: string;
  tanggal: string;
  santri_id?: string; // Optional karena Operasional Yayasan tidak punya santri
  santri_nama?: string;
  santri_nisn?: string;
  jenis_bantuan: 'Finansial' | 'Barang' | 'Operasional';
  kategori: string;
  detail: string;
  nominal?: number; // untuk finansial
  jumlah?: number; // untuk barang
  satuan?: string; // untuk barang
  status_penyaluran?: string;
  sumber: 'Keuangan' | 'Inventaris';
  referensi_id: string;
  created_at: string;
  alokasi_ke?: 'formal' | 'pesantren' | 'asrama_konsumsi' | 'bantuan_langsung';
  kategori_keuangan?: string; // kategori dari tabel keuangan
  is_operasional_yayasan?: boolean; // Flag untuk operasional yayasan
}

export interface PenyaluranStatistics {
  total_finansial: number;
  total_barang: number;
  total_operasional: number;
  total_all: number;
  total_santri: number;
  rata_rata: number;
  jumlah_transaksi: number;
  by_kategori: {
    'Bantuan Langsung Yayasan': number;
    'Operasional dan Konsumsi Santri': number;
    'Pendidikan Formal': number;
    'Pendidikan Pesantren': number;
    'Operasional Yayasan': number;
    'Lain-lain': number;
  };
}

export interface MonthlyTrendData {
  month: string;
  finansial: number;
  barang: number;
  total: number;
}

export interface CategoryDistributionData {
  kategori: string;
  value: number;
  color: string;
  count: number;
}

export interface TopRecipientData {
  santri_id: string;
  santri_nama: string;
  santri_nisn: string;
  total_finansial: number;
  total_barang: number;
  total_all: number;
  jumlah_transaksi: number;
}

export interface PenyaluranFilters {
  startDate?: string;
  endDate?: string;
  jenis?: 'Finansial' | 'Barang' | 'Operasional' | 'All';
  santri_id?: string;
  kategori?: string;
  status?: string;
}

export class PenyaluranBantuanService {
  /**
   * Get unified history combining financial and inventory data
   */
  static async getUnifiedHistory(
    filters: PenyaluranFilters = {}
  ): Promise<UnifiedPenyaluranBantuan[]> {
    const results: UnifiedPenyaluranBantuan[] = [];

    try {
      // 1. Get financial allocations (alokasi_pengeluaran_santri)
      if (!filters.jenis || filters.jenis === 'All' || filters.jenis === 'Finansial') {
        let finansialQuery = supabase
          .from('alokasi_pengeluaran_santri')
          .select(`
            id,
            nominal_alokasi,
            jenis_bantuan,
            periode,
            keterangan,
            alokasi_ke,
            created_at,
            santri:santri_id(
              id,
              nama_lengkap,
              nisn
            ),
            keuangan:keuangan_id(
              id,
              tanggal,
              kategori,
              sub_kategori
            )
          `)
          .order('created_at', { ascending: false });

        // Apply filters - filter by keuangan.tanggal if available, otherwise created_at
        // Note: We'll filter after fetching since we need to join with keuangan table
        if (filters.santri_id) {
          finansialQuery = finansialQuery.eq('santri_id', filters.santri_id);
        }
        // Note: kategori filter will be applied after mapping, since we map alokasi_ke to kategori

        const { data: finansialData, error: finansialError } = await finansialQuery;

        if (finansialError) {
          console.error('Error fetching financial data:', finansialError);
        } else {
          // Filter by date after fetching (since we need keuangan.tanggal)
          const filteredFinansialData = (finansialData || []).filter((item: any) => {
            const tanggal = item.keuangan?.tanggal || item.created_at;
            if (filters.startDate && tanggal < filters.startDate) return false;
            if (filters.endDate && tanggal > filters.endDate) return false;
            return true;
          });

          filteredFinansialData.forEach((item: any) => {
            // Map alokasi_ke dan kategori keuangan ke kategori yang lebih jelas
            const kategoriKeuangan = item.keuangan?.kategori || '';
            const alokasiKe = item.alokasi_ke;
            
            // Tentukan kategori berdasarkan prioritas: kategori keuangan > alokasi_ke
            let kategori = 'Lain-lain';
            if (kategoriKeuangan) {
              if (kategoriKeuangan === 'Pendidikan Pesantren' || kategoriKeuangan === 'Pendidikan Pesantren') {
                kategori = 'Pendidikan Pesantren';
              } else if (kategoriKeuangan === 'Pendidikan Formal') {
                kategori = 'Pendidikan Formal';
              } else if (kategoriKeuangan === 'Operasional dan Konsumsi Santri') {
                kategori = 'Operasional dan Konsumsi Santri';
              } else if (kategoriKeuangan === 'Bantuan Langsung Yayasan') {
                kategori = 'Bantuan Langsung Yayasan';
              } else {
                // Fallback ke alokasi_ke jika kategori keuangan tidak jelas
                if (alokasiKe === 'pesantren') kategori = 'Pendidikan Pesantren';
                else if (alokasiKe === 'formal') kategori = 'Pendidikan Formal';
                else if (alokasiKe === 'asrama_konsumsi') kategori = 'Operasional dan Konsumsi Santri';
                else if (alokasiKe === 'bantuan_langsung') kategori = 'Bantuan Langsung Yayasan';
              }
            } else if (alokasiKe) {
              // Jika tidak ada kategori keuangan, gunakan alokasi_ke
              if (alokasiKe === 'pesantren') kategori = 'Pendidikan Pesantren';
              else if (alokasiKe === 'formal') kategori = 'Pendidikan Formal';
              else if (alokasiKe === 'asrama_konsumsi') kategori = 'Operasional dan Konsumsi Santri';
              else if (alokasiKe === 'bantuan_langsung') kategori = 'Bantuan Langsung Yayasan';
            }
            
            results.push({
              id: item.id,
              tanggal: item.keuangan?.tanggal || item.created_at,
              santri_id: item.santri?.id || '',
              santri_nama: item.santri?.nama_lengkap || 'Tidak Diketahui',
              santri_nisn: item.santri?.nisn || '',
              jenis_bantuan: 'Finansial',
              kategori: kategori,
              detail: item.keterangan || item.keuangan?.sub_kategori || item.jenis_bantuan || '',
              nominal: item.nominal_alokasi || 0,
              sumber: 'Keuangan',
              referensi_id: item.keuangan?.id || item.id,
              created_at: item.created_at,
              alokasi_ke: alokasiKe,
              kategori_keuangan: kategoriKeuangan,
            });
          });
        }
      }

      // 2. Get Operasional Yayasan (pengeluaran yang tidak dialokasikan ke santri)
      if (!filters.jenis || filters.jenis === 'All' || filters.jenis === 'Finansial') {
        let operasionalQuery = supabase
          .from('keuangan')
          .select(`
            id,
            tanggal,
            kategori,
            sub_kategori,
            deskripsi,
            jumlah,
            akun_kas_id
          `)
          .eq('jenis_transaksi', 'Pengeluaran')
          .eq('kategori', 'Operasional Yayasan')
          .eq('status', 'posted')
          .order('tanggal', { ascending: false });

        // Apply filters
        if (filters.startDate) {
          operasionalQuery = operasionalQuery.gte('tanggal', filters.startDate);
        }
        if (filters.endDate) {
          operasionalQuery = operasionalQuery.lte('tanggal', filters.endDate);
        }

        const { data: operasionalData, error: operasionalError } = await operasionalQuery;

        if (operasionalError) {
          console.error('Error fetching operasional yayasan data:', operasionalError);
        } else {
          (operasionalData || []).forEach((item: any) => {
            results.push({
              id: item.id,
              tanggal: item.tanggal,
              jenis_bantuan: 'Operasional',
              kategori: 'Operasional Yayasan',
              detail: item.deskripsi || item.sub_kategori || 'Operasional Yayasan',
              nominal: item.jumlah || 0,
              sumber: 'Keuangan',
              referensi_id: item.id,
              created_at: item.tanggal,
              is_operasional_yayasan: true,
            });
          });
        }
      }

      // 3. Get inventory distributions (transaksi_inventaris with keluar_mode = 'Distribusi')
      if (!filters.jenis || filters.jenis === 'All' || filters.jenis === 'Barang') {
        let inventarisQuery = supabase
          .from('transaksi_inventaris')
          .select(`
            id,
            tanggal,
            jumlah,
            catatan,
            penerima_santri_id,
            inventaris:item_id(
              nama_barang,
              kategori
            ),
            santri:penerima_santri_id(
              id,
              nama_lengkap,
              nisn
            )
          `)
          .eq('tipe', 'Keluar')
          .eq('keluar_mode', 'Distribusi')
          .order('tanggal', { ascending: false });

        // Apply filters
        if (filters.startDate) {
          inventarisQuery = inventarisQuery.gte('tanggal', filters.startDate);
        }
        if (filters.endDate) {
          inventarisQuery = inventarisQuery.lte('tanggal', filters.endDate);
        }
        if (filters.santri_id) {
          inventarisQuery = inventarisQuery.eq('penerima_santri_id', filters.santri_id);
        }
        // Note: kategori filter will be applied after mapping

        const { data: inventarisData, error: inventarisError } = await inventarisQuery;

        if (inventarisError) {
          console.error('Error fetching inventory data:', inventarisError);
        } else {
          (inventarisData || []).forEach((item: any) => {
            results.push({
              id: item.id,
              tanggal: item.tanggal,
              santri_id: item.santri?.id || item.penerima_santri_id || '',
              santri_nama: item.santri?.nama_lengkap || 'Tidak Diketahui',
              santri_nisn: item.santri?.nisn || '',
              jenis_bantuan: 'Barang',
              kategori: item.inventaris?.kategori || 'Lain-lain',
              detail: item.inventaris?.nama_barang || item.catatan || '',
              jumlah: item.jumlah || 0,
              satuan: item.inventaris?.satuan || 'pcs',
              sumber: 'Inventaris',
              referensi_id: item.id,
              created_at: item.tanggal,
            });
          });
        }
      }

      // Apply kategori filter after mapping (if specified)
      let filteredResults = results;
      if (filters.kategori) {
        filteredResults = results.filter((item) => item.kategori === filters.kategori);
      }

      // Sort by tanggal descending
      filteredResults.sort((a, b) => {
        const dateA = new Date(a.tanggal).getTime();
        const dateB = new Date(b.tanggal).getTime();
        return dateB - dateA;
      });

      return filteredResults;
    } catch (error) {
      console.error('Error in getUnifiedHistory:', error);
      return [];
    }
  }

  /**
   * Get statistics for summary cards
   */
  static async getStatistics(
    filters: PenyaluranFilters = {}
  ): Promise<PenyaluranStatistics> {
    const history = await this.getUnifiedHistory(filters);

    const total_finansial = history
      .filter((h) => h.jenis_bantuan === 'Finansial')
      .reduce((sum, h) => sum + (h.nominal || 0), 0);

    const total_barang = history
      .filter((h) => h.jenis_bantuan === 'Barang')
      .reduce((sum, h) => sum + (h.nominal || 0), 0); // Note: barang tidak punya nominal, bisa dihitung dari jumlah * harga jika ada

    const total_operasional = history
      .filter((h) => h.jenis_bantuan === 'Operasional' || h.is_operasional_yayasan)
      .reduce((sum, h) => sum + (h.nominal || 0), 0);

    const total_all = total_finansial + total_barang + total_operasional;

    const uniqueSantri = new Set(history.map((h) => h.santri_id)).size;
    const rata_rata = uniqueSantri > 0 ? total_all / uniqueSantri : 0;

    // Calculate by category
    const by_kategori = {
      'Bantuan Langsung Yayasan': 0,
      'Operasional dan Konsumsi Santri': 0,
      'Pendidikan Formal': 0,
      'Pendidikan Pesantren': 0,
      'Operasional Yayasan': 0,
      'Lain-lain': 0,
    };

    history.forEach((item) => {
      const kategori = item.kategori || 'Lain-lain';
      if (kategori in by_kategori) {
        by_kategori[kategori as keyof typeof by_kategori] += item.nominal || 0;
      } else {
        by_kategori['Lain-lain'] += item.nominal || 0;
      }
    });

    return {
      total_finansial,
      total_barang,
      total_operasional,
      total_all,
      total_santri: uniqueSantri,
      rata_rata,
      jumlah_transaksi: history.length,
      by_kategori,
    };
  }

  /**
   * Get monthly trend data
   * Returns data sorted from January to December, filling missing months with 0
   */
  static async getMonthlyTrend(
    filters: PenyaluranFilters = {}
  ): Promise<MonthlyTrendData[]> {
    const history = await this.getUnifiedHistory(filters);

    // Determine date range from filters or use all data
    let startDate: Date;
    let endDate: Date;

    if (filters.startDate && filters.endDate) {
      startDate = parseISO(filters.startDate);
      endDate = parseISO(filters.endDate);
    } else {
      // If no filters, use range from data
      const dates = history.map((h) => parseISO(h.tanggal));
      if (dates.length > 0) {
        startDate = new Date(Math.min(...dates.map(d => d.getTime())));
        endDate = new Date(Math.max(...dates.map(d => d.getTime())));
      } else {
        // Default to current year
        const now = new Date();
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
      }
    }

    // Group by month
    const monthlyMap: { [key: string]: { finansial: number; barang: number } } = {};

    history.forEach((item) => {
      const date = parseISO(item.tanggal);
      const monthKey = format(date, 'yyyy-MM');

      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { finansial: 0, barang: 0 };
      }

      if (item.jenis_bantuan === 'Finansial') {
        monthlyMap[monthKey].finansial += item.nominal || 0;
      } else {
        // For barang, we use nominal if available, otherwise 0
        monthlyMap[monthKey].barang += item.nominal || 0;
      }
    });

    // Generate all months in range, filling missing ones with 0
    const result: MonthlyTrendData[] = [];
    
    // Use eachMonthOfInterval to get all months in range
    const months = eachMonthOfInterval({
      start: startDate,
      end: endDate,
    });

    months.forEach((monthDate) => {
      const monthKey = format(monthDate, 'yyyy-MM');
      const monthData = monthlyMap[monthKey] || { finansial: 0, barang: 0 };
      
      result.push({
        month: format(monthDate, 'MMM yyyy', { locale: localeId }),
        finansial: monthData.finansial,
        barang: monthData.barang,
        total: monthData.finansial + monthData.barang,
      });
    });

    return result;
  }

  /**
   * Get category distribution data
   * Focus on 4 main categories: Bantuan Langsung, Operasional & Konsumsi, Pendidikan Formal, Pendidikan Pesantren
   */
  static async getCategoryDistribution(
    filters: PenyaluranFilters = {}
  ): Promise<CategoryDistributionData[]> {
    const history = await this.getUnifiedHistory(filters);

    // Group by category - focus on 4 main categories
    const categoryMap: { [key: string]: { value: number; count: number } } = {};

    history.forEach((item) => {
      const kategori = item.kategori || 'Lain-lain';
      if (!categoryMap[kategori]) {
        categoryMap[kategori] = { value: 0, count: 0 };
      }
      categoryMap[kategori].value += item.nominal || 0;
      categoryMap[kategori].count += 1;
    });

    // Define main categories with colors
    const mainCategories = [
      { name: 'Bantuan Langsung Yayasan', color: '#3b82f6' }, // Blue
      { name: 'Operasional dan Konsumsi Santri', color: '#10b981' }, // Green
      { name: 'Pendidikan Formal', color: '#f59e0b' }, // Amber
      { name: 'Pendidikan Pesantren', color: '#8b5cf6' }, // Purple
      { name: 'Operasional Yayasan', color: '#ef4444' }, // Red
    ];

    // Combine other categories into "Lain-lain"
    const otherCategories: string[] = [];
    let otherTotal = 0;
    let otherCount = 0;

    Object.keys(categoryMap).forEach((kategori) => {
      const isMainCategory = mainCategories.some((mc) => mc.name === kategori);
      if (!isMainCategory) {
        otherCategories.push(kategori);
        otherTotal += categoryMap[kategori].value;
        otherCount += categoryMap[kategori].count;
      }
    });

    // Build result with main categories first, then "Lain-lain" if exists
    const result: CategoryDistributionData[] = [];

    mainCategories.forEach((mainCat) => {
      if (categoryMap[mainCat.name]) {
        result.push({
          kategori: mainCat.name,
          value: categoryMap[mainCat.name].value,
          color: mainCat.color,
          count: categoryMap[mainCat.name].count,
        });
      }
    });

    // Add "Lain-lain" if there are other categories
    if (otherTotal > 0) {
      result.push({
        kategori: 'Lain-lain',
        value: otherTotal,
        color: '#9ca3af', // Gray
        count: otherCount,
      });
    }

    return result.sort((a, b) => b.value - a.value);
  }

  /**
   * Get top recipients (only for items with santri, exclude Operasional Yayasan)
   */
  static async getTopRecipients(
    filters: PenyaluranFilters = {},
    limit: number = 10
  ): Promise<TopRecipientData[]> {
    const history = await this.getUnifiedHistory(filters);

    // Filter out Operasional Yayasan (items without santri)
    const santriHistory = history.filter((item) => item.santri_id && !item.is_operasional_yayasan);

    // Group by santri
    const santriMap: {
      [key: string]: {
        santri_id: string;
        santri_nama: string;
        santri_nisn: string;
        total_finansial: number;
        total_barang: number;
        jumlah_transaksi: number;
      };
    } = {};

    santriHistory.forEach((item) => {
      const key = item.santri_id;
      if (!key) return; // Skip if no santri_id
      
      if (!santriMap[key]) {
        santriMap[key] = {
          santri_id: item.santri_id || '',
          santri_nama: item.santri_nama || 'Tidak Diketahui',
          santri_nisn: item.santri_nisn || '',
          total_finansial: 0,
          total_barang: 0,
          jumlah_transaksi: 0,
        };
      }

      if (item.jenis_bantuan === 'Finansial') {
        santriMap[key].total_finansial += item.nominal || 0;
      } else if (item.jenis_bantuan === 'Barang') {
        santriMap[key].total_barang += item.nominal || 0;
      }
      santriMap[key].jumlah_transaksi += 1;
    });

    // Convert to array, calculate total, and sort
    const result = Object.values(santriMap)
      .filter((santri) => santri.santri_id && santri.santri_nama) // Ensure valid santri data
      .map((santri) => ({
        ...santri,
        total_all: santri.total_finansial + santri.total_barang,
      }))
      .sort((a, b) => b.total_all - a.total_all)
      .slice(0, limit);

    return result;
  }
}

