import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, parseISO, eachMonthOfInterval } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { 
  excludeTabunganTransactions, 
  applyTabunganExclusionFilter,
  excludeKoperasiTransactions,
  applyKoperasiExclusionFilter
} from '@/modules/keuangan/utils/keuanganFilters';

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

export interface MonthlyCashflowData {
  month: string;
  pemasukan: number;
  pengeluaran: number;
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
      // REVISI v2: Halaman "Laporan Keuangan Yayasan" harus menampilkan transaksi keuangan dari tabel keuangan
      // TIDAK menampilkan baris per-santri dari alokasi_pengeluaran_santri
      // Hanya menampilkan transaksi keuangan yang memiliki alokasi ke santri (untuk Bantuan Langsung)
      // atau transaksi operasional yayasan
      if (!filters.jenis || filters.jenis === 'All' || filters.jenis === 'Finansial') {
        // REVISI v2: Ambil transaksi keuangan langsung, bukan alokasi per-santri
        // Hanya untuk kategori yang memang dialokasikan ke santri (Bantuan Langsung)
        let keuanganQuery = supabase
          .from('keuangan')
          .select(`
            id,
            tanggal,
            kategori,
            sub_kategori,
            deskripsi,
            jumlah,
            akun_kas_id,
            ledger,
            source_module,
            jenis_alokasi,
            santri_id,
            santri:santri_id(
              id,
              nama_lengkap,
              nisn
            )
          `)
          .eq('jenis_transaksi', 'Pengeluaran')
          .eq('status', 'posted')
          .eq('ledger', 'UMUM') // CRITICAL: Only include transactions from general finance module
          .order('tanggal', { ascending: false });

        // Apply filters
        if (filters.startDate) {
          keuanganQuery = keuanganQuery.gte('tanggal', filters.startDate);
        }
        if (filters.endDate) {
          keuanganQuery = keuanganQuery.lte('tanggal', filters.endDate);
        }
        if (filters.santri_id) {
          keuanganQuery = keuanganQuery.eq('santri_id', filters.santri_id);
        }
        if (filters.kategori) {
          keuanganQuery = keuanganQuery.eq('kategori', filters.kategori);
        }

        // Exclude tabungan and koperasi transactions
        keuanganQuery = applyTabunganExclusionFilter(keuanganQuery);
        keuanganQuery = applyKoperasiExclusionFilter(keuanganQuery);

        const { data: keuanganData, error: keuanganError } = await keuanganQuery;

        if (keuanganError) {
          console.error('Error fetching keuangan data:', keuanganError);
        } else {
          // Filter out tabungan and koperasi transactions client-side (backup filtering)
          const filteredKeuanganData = excludeKoperasiTransactions(excludeTabunganTransactions(keuanganData || []));

          filteredKeuanganData.forEach((item: any) => {
            // REVISI v2: Hanya tampilkan transaksi keuangan, bukan alokasi per-santri
            // Untuk Bantuan Langsung, tampilkan jika ada santri_id langsung di transaksi
            // Untuk kategori lain, tampilkan sebagai transaksi tanpa detail per-santri
            
            const kategori = item.kategori || 'Lain-lain';
            
            // Skip jika ini adalah kategori yang tidak relevan untuk laporan penyaluran
            // (kecuali Bantuan Langsung dan Operasional Yayasan yang sudah ditangani di bagian lain)
            if (kategori === 'Operasional Yayasan') {
              // Akan ditangani di bagian operasional yayasan
              return;
            }

            // Untuk Bantuan Langsung, tampilkan jika ada santri_id
            if (kategori === 'Bantuan Langsung Yayasan' && item.santri_id) {
              results.push({
                id: item.id,
                tanggal: item.tanggal,
                santri_id: item.santri?.id || item.santri_id || '',
                santri_nama: item.santri?.nama_lengkap || 'Tidak Diketahui',
                santri_nisn: item.santri?.nisn || '',
                jenis_bantuan: 'Finansial',
                kategori: kategori,
                detail: item.deskripsi || item.sub_kategori || kategori,
                nominal: item.jumlah || 0,
                sumber: 'Keuangan',
                referensi_id: item.id,
                created_at: item.tanggal,
                kategori_keuangan: kategori,
              });
            } else if (kategori === 'Bantuan Langsung Yayasan' && !item.santri_id) {
              // REVISI: Jika Bantuan Langsung tidak punya santri_id di keuangan,
              // ambil dari alokasi_pengeluaran_santri (untuk transaksi lama)
              // Ini hanya untuk backward compatibility
              // TODO: Migrate old transactions to have santri_id in keuangan table
            } else if (kategori !== 'Bantuan Langsung Yayasan' && kategori !== 'Operasional Yayasan') {
              // Untuk kategori lain (Pendidikan Pesantren, Pendidikan Formal, Operasional dan Konsumsi Santri)
              // Tampilkan sebagai transaksi tanpa detail per-santri (sesuai spec v2)
              // TIDAK menampilkan baris per-santri dari alokasi
              results.push({
                id: item.id,
                tanggal: item.tanggal,
                // Tidak ada santri_id karena ini adalah transaksi keuangan, bukan alokasi per-santri
                jenis_bantuan: 'Finansial',
                kategori: kategori,
                detail: item.deskripsi || item.sub_kategori || kategori,
                nominal: item.jumlah || 0,
                sumber: 'Keuangan',
                referensi_id: item.id,
                created_at: item.tanggal,
                kategori_keuangan: kategori,
              });
            }
          });
        }
        
        // REVISI: Ambil Bantuan Langsung Yayasan dari alokasi_pengeluaran_santri
        // untuk transaksi lama yang belum punya santri_id di tabel keuangan
        // Hanya untuk kategori "Bantuan Langsung Yayasan"
        // REVISI: Query alokasi dengan filter keuangan harus dilakukan dengan cara berbeda
        // karena Supabase tidak support nested order/filter langsung
        let alokasiQuery = supabase
          .from('alokasi_layanan_santri')
          .select(`
            id,
            keuangan_id,
            santri_id,
            nominal_alokasi,
            sumber_alokasi,
            keuangan:keuangan_id(
              id,
              tanggal,
              kategori,
              sub_kategori,
              deskripsi,
              jumlah,
              ledger,
              status
            ),
            santri:santri_id(
              id,
              nama_lengkap,
              nisn
            )
          `)
          .eq('sumber_alokasi', 'manual');
        
        // Apply filters - filter by santri_id first (direct field)
        if (filters.santri_id) {
          alokasiQuery = alokasiQuery.eq('santri_id', filters.santri_id);
        }
        
        const { data: alokasiData, error: alokasiError } = await alokasiQuery;
        
        if (alokasiError) {
          console.error('Error fetching alokasi data:', alokasiError);
        } else {
          // Filter client-side untuk kategori, ledger, status, dan tanggal
          const filteredAlokasiData = (alokasiData || []).filter((item: any) => {
            const keuangan = item.keuangan;
            if (!keuangan) return false;
            
            // Filter by kategori
            if (keuangan.kategori !== 'Bantuan Langsung Yayasan') return false;
            
            // Filter by ledger
            if (keuangan.ledger !== 'UMUM') return false;
            
            // Filter by status
            if (keuangan.status !== 'posted') return false;
            
            // Filter by date range
            if (filters.startDate && keuangan.tanggal < filters.startDate) return false;
            if (filters.endDate && keuangan.tanggal > filters.endDate) return false;
            
            return true;
          });
          
          // Sort by tanggal descending
          filteredAlokasiData.sort((a: any, b: any) => {
            const dateA = new Date(a.keuangan.tanggal).getTime();
            const dateB = new Date(b.keuangan.tanggal).getTime();
            return dateB - dateA;
          });
          
          filteredAlokasiData.forEach((item: any) => {
            const keuangan = item.keuangan;
            if (!keuangan || !item.santri) return;
            
            // Skip if already added from keuangan query (with santri_id)
            const alreadyAdded = results.some(r => 
              r.referensi_id === keuangan.id && 
              r.santri_id === item.santri.id
            );
            
            if (!alreadyAdded) {
              results.push({
                id: `${keuangan.id}-${item.santri.id}`,
                tanggal: keuangan.tanggal,
                santri_id: item.santri.id || item.santri_id || '',
                santri_nama: item.santri.nama_lengkap || 'Tidak Diketahui',
                santri_nisn: item.santri.nisn || '',
                jenis_bantuan: 'Finansial',
                kategori: 'Bantuan Langsung Yayasan',
                detail: keuangan.deskripsi || keuangan.sub_kategori || 'Bantuan Langsung Yayasan',
                nominal: item.nominal_alokasi || 0,
                sumber: 'Keuangan',
                referensi_id: keuangan.id,
                created_at: keuangan.tanggal,
                kategori_keuangan: 'Bantuan Langsung Yayasan',
              });
            }
          });
        }
      }

      // 2. Get Operasional Yayasan (pengeluaran yang tidak dialokasikan ke santri)
      // CRITICAL: Filter by ledger='UMUM' to ensure only general finance module transactions are included
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
            akun_kas_id,
            ledger
          `)
          .eq('jenis_transaksi', 'Pengeluaran')
          .eq('kategori', 'Operasional Yayasan')
          .eq('status', 'posted')
          .eq('ledger', 'UMUM') // CRITICAL: Only include transactions from general finance module
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

      // 3. Inventory distributions removed - transaksi_inventaris feature deprecated

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

  /**
   * Get monthly cashflow data (Pemasukan vs Pengeluaran)
   * Returns data sorted chronologically by month, filling missing months with 0
   * Uses data from keuangan table (not assistance data)
   */
  static async getMonthlyCashflow(
    filters: PenyaluranFilters = {}
  ): Promise<MonthlyCashflowData[]> {
    try {
      // Determine date range from filters or use default (last 12 months)
      let startDate: Date;
      let endDate: Date;

      if (filters.startDate && filters.endDate) {
        startDate = parseISO(filters.startDate);
        endDate = parseISO(filters.endDate);
      } else {
        // Default to last 12 months
        const now = new Date();
        endDate = endOfMonth(now);
        startDate = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 11, 1));
      }

      // Query keuangan table for pemasukan and pengeluaran
      // CRITICAL: Filter by ledger='UMUM' to ensure only general finance module transactions are included
      let query = supabase
        .from('keuangan')
        .select(`
          tanggal, 
          jenis_transaksi, 
          jumlah, 
          source_module, 
          akun_kas_id,
          ledger,
          akun_kas:akun_kas_id(nama, managed_by)
        `)
        .eq('ledger', 'UMUM') // CRITICAL: Only include transactions from general finance module
        .gte('tanggal', format(startDate, 'yyyy-MM-dd'))
        .lte('tanggal', format(endDate, 'yyyy-MM-dd'))
        .eq('status', 'posted');

      // Exclude tabungan santri transactions
      query = applyTabunganExclusionFilter(query);
      // Exclude koperasi transactions
      query = applyKoperasiExclusionFilter(query);

      const { data, error } = await query;
      if (error) throw error;

      // Filter out tabungan and koperasi transactions client-side (backup filtering)
      // This is critical because client-side filtering can check akun_kas.managed_by which server-side filter cannot
      const filteredData = excludeKoperasiTransactions(excludeTabunganTransactions(data || []));

      // Group by month with chronological sorting
      const monthlyMap: { [key: string]: { pemasukan: number; pengeluaran: number } } = {};

      // Initialize all months in range with 0
      const months = eachMonthOfInterval({
        start: startDate,
        end: endDate,
      });

      months.forEach((monthDate) => {
        const monthKey = format(monthDate, 'yyyy-MM');
        monthlyMap[monthKey] = { pemasukan: 0, pengeluaran: 0 };
      });

      // Process transactions
      filteredData.forEach((transaction) => {
        const date = parseISO(transaction.tanggal);
        const monthKey = format(date, 'yyyy-MM');

        if (monthlyMap[monthKey]) {
          if (transaction.jenis_transaksi === 'Pemasukan') {
            monthlyMap[monthKey].pemasukan += transaction.jumlah || 0;
          } else if (transaction.jenis_transaksi === 'Pengeluaran') {
            monthlyMap[monthKey].pengeluaran += transaction.jumlah || 0;
          }
        }
      });

      // Convert to chart format with chronological sorting
      const result: MonthlyCashflowData[] = months.map((monthDate) => {
        const monthKey = format(monthDate, 'yyyy-MM');
        const monthData = monthlyMap[monthKey] || { pemasukan: 0, pengeluaran: 0 };

        return {
          month: format(monthDate, 'MMM yyyy', { locale: localeId }),
          pemasukan: monthData.pemasukan,
          pengeluaran: monthData.pengeluaran,
        };
      });

      return result;
    } catch (error) {
      console.error('Error in getMonthlyCashflow:', error);
      return [];
    }
  }
}

