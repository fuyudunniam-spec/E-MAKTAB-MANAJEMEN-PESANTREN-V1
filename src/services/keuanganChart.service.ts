/**
 * Service Layer untuk Chart Data Keuangan
 * 
 * Phase 3 Refactoring: Extract chart logic dari component ke service layer
 * 
 * IMPORTANT: Data keuangan sangat penting, jadi semua fungsi di sini harus:
 * 1. Tidak mengubah data asli (hanya process & format)
 * 2. Konsisten dengan logic yang sudah ada
 * 3. Return data dalam format yang sama dengan sebelumnya
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  excludeTabunganTransactions, 
  applyTabunganExclusionFilter,
  normalizeAkunKas 
} from '@/utils/keuanganFilters';

/**
 * Interface untuk monthly chart data
 */
export interface MonthlyChartData {
  month: string;
  pemasukan: number;
  pengeluaran: number;
}

/**
 * Interface untuk category chart data
 */
export interface CategoryChartData {
  name: string;
  value: number; // percentage
  color: string;
}

/**
 * Get monthly data untuk chart (last 7 months)
 * 
 * @param accountId - Optional account ID untuk filter by account
 * @returns Array of monthly data dengan pemasukan & pengeluaran
 */
export const getMonthlyData = async (accountId?: string): Promise<MonthlyChartData[]> => {
  try {
    // Get last 7 months of data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 6); // Last 7 months including current
    
    let query = supabase
      .from('keuangan')
      .select('tanggal, jenis_transaksi, jumlah, source_module, kategori, akun_kas_id')
      .gte('tanggal', startDate.toISOString().split('T')[0])
      .lte('tanggal', endDate.toISOString().split('T')[0]);
    
    // Exclude tabungan santri transactions (using shared utility)
    query = applyTabunganExclusionFilter(query);
      
    if (accountId) {
      query = query.eq('akun_kas_id', accountId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    // Filter out tabungan transactions client-side (backup filtering using shared utility)
    const filteredData = excludeTabunganTransactions(data);
    
    // Group by month
    const monthlyStats: { [key: string]: { pemasukan: number; pengeluaran: number } } = {};
    
    // Initialize last 7 months
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().substring(0, 7); // YYYY-MM format
      monthlyStats[monthKey] = { pemasukan: 0, pengeluaran: 0 };
    }
    
    // Process transactions
    filteredData.forEach(transaction => {
      const monthKey = transaction.tanggal.substring(0, 7);
      if (monthlyStats[monthKey]) {
        if (transaction.jenis_transaksi === 'Pemasukan') {
          monthlyStats[monthKey].pemasukan += transaction.jumlah || 0;
        } else if (transaction.jenis_transaksi === 'Pengeluaran') {
          monthlyStats[monthKey].pengeluaran += transaction.jumlah || 0;
        }
      }
    });
    
    // Convert to chart format
    return Object.entries(monthlyStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, stats]) => {
        const date = new Date(monthKey + '-01');
        const monthName = date.toLocaleDateString('id-ID', { month: 'short' });
        return {
          month: monthName,
          pemasukan: stats.pemasukan,
          pengeluaran: stats.pengeluaran
        };
      });
      
  } catch (error) {
    console.error('Error loading monthly data:', error);
    return [];
  }
};

/**
 * Get category data untuk chart (current year expenditures)
 * 
 * @param accountId - Optional account ID untuk filter by account
 * @returns Array of category data dengan percentage dan color
 */
export const getCategoryData = async (accountId?: string): Promise<CategoryChartData[]> => {
  try {
    // Get current year expenditures
    const currentYear = new Date().getFullYear();
    const startDate = `${currentYear}-01-01`;
    const endDate = `${currentYear}-12-31`;
    
    let query = supabase
      .from('keuangan')
      .select('kategori, jumlah, akun_kas_id, source_module, akun_kas:akun_kas_id(nama, managed_by)')
      .eq('jenis_transaksi', 'Pengeluaran')
      .gte('tanggal', startDate)
      .lte('tanggal', endDate);
    
    // Exclude tabungan santri transactions (using shared utility)
    query = applyTabunganExclusionFilter(query);
      
    if (accountId) {
      query = query.eq('akun_kas_id', accountId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    // Filter out tabungan transactions client-side (backup filtering using shared utility)
    // Type assertion needed karena Supabase bisa return akun_kas sebagai array atau object
    const filteredData = excludeTabunganTransactions(data as any);
    
    // Group by category
    const categoryStats: { [key: string]: number } = {};
    let totalExpenditure = 0;
    
    filteredData.forEach(transaction => {
      const category = transaction.kategori || 'Lainnya';
      categoryStats[category] = (categoryStats[category] || 0) + (transaction.jumlah || 0);
      totalExpenditure += transaction.jumlah || 0;
    });
    
    // Convert to chart format with colors
    const colors = ['#3b82f6', '#f59e0b', '#10b981', '#6b7280', '#ef4444', '#8b5cf6', '#f97316'];
    
    const result = Object.entries(categoryStats)
      .map(([name, total], index) => ({
        name,
        value: totalExpenditure > 0 ? Math.round((total / totalExpenditure) * 100) : 0,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.value - a.value);
    
    return result;
      
  } catch (error) {
    console.error('Error loading category data:', error);
    return [];
  }
};

/**
 * Load both monthly and category data (convenience function)
 * 
 * @param accountId - Optional account ID untuk filter by account
 * @returns Object dengan monthlyData dan categoryData
 */
export const loadChartData = async (accountId?: string): Promise<{
  monthlyData: MonthlyChartData[];
  categoryData: CategoryChartData[];
}> => {
  const [monthlyData, categoryData] = await Promise.all([
    getMonthlyData(accountId),
    getCategoryData(accountId)
  ]);
  
  return {
    monthlyData,
    categoryData
  };
};



