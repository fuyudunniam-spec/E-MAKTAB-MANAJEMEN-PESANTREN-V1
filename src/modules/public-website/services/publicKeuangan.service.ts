import { supabase } from '@/integrations/supabase/client';
import { PenyaluranBantuanService } from '@/modules/keuangan/services/penyaluranBantuan.service';
import { AkunKasService } from '@/modules/keuangan/services/akunKas.service';

export interface PublicImpactData {
  totalAset: number;
  totalPenyaluran: number;
  totalPenerima: number;
  sourceComposition: { name: string; value: number; color: string }[];
  allocationTrend: { month: string; amount: number }[];
  strategicPrograms: {
    title: string;
    description: string;
    progress: number;
    budget: number;
    targetDate: string;
    image: string;
    status: 'Selesai' | 'In Progress';
  }[];
  recentTransactions: {
    date: string;
    description: string;
    category: string;
    amount: number;
    status: string;
  }[];
}

export const getPublicImpactData = async (): Promise<PublicImpactData> => {
  try {
    // 1. Get real financial stats
    const stats = await PenyaluranBantuanService.getStatistics();
    const unifiedBalance = await AkunKasService.getUnifiedBalance();
    
    // 2. Get real trend data
    const monthlyTrend = await PenyaluranBantuanService.getMonthlyTrend();
    
    // 3. Get real category distribution
    const categoryDist = await PenyaluranBantuanService.getCategoryDistribution();
    
    // 4. Get real history
    const history = await PenyaluranBantuanService.getUnifiedHistory({ limit: 5 } as any);

    // 5. Map category distribution to source composition
    // For public view, we focus on the top 3-4 categories
    const sourceComposition = categoryDist.map(c => ({
      name: c.kategori,
      value: Math.round((c.value / stats.total_all) * 100) || 0,
      color: c.color
    })).slice(0, 4);

    // 6. Map monthly trend
    const allocationTrend = monthlyTrend.map(m => ({
      month: m.month.split(' ')[0], // Just the month name
      amount: m.total / 1000000 // In millions for chart readability
    })).slice(-10); // Last 10 months

    // 7. Map recent transactions
    const recentTransactions = history.map(h => ({
      date: h.tanggal,
      description: h.detail,
      category: h.kategori,
      amount: h.nominal || 0,
      status: 'Tersalurkan'
    })).slice(0, 5);

    // 8. Strategic Programs (Logic: use specific categories or projects)
    // For now, we'll map them based on categories found in the database
    // but with hardcoded targets since "Budget/Target" isn't fully in DB yet
    const strategicPrograms: PublicImpactData['strategicPrograms'] = [
      {
        title: 'Beasiswa Kader Ulama',
        description: 'Penyaluran dana untuk SPP, kitab, dan biaya hidup santri yatim & dhuafa.',
        progress: Math.min(Math.round((stats.by_kategori['Pendidikan Pesantren'] / 500000000) * 100), 100),
        budget: 500000000,
        targetDate: 'Des 2024',
        image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=200&auto=format&fit=crop',
        status: stats.by_kategori['Pendidikan Pesantren'] >= 500000000 ? 'Selesai' : 'In Progress'
      },
      {
        title: 'Operasional Layanan Santri',
        description: 'Pemenuhan kebutuhan konsumsi dan kesehatan harian santri mukim.',
        progress: Math.min(Math.round((stats.by_kategori['Operasional dan Konsumsi Santri'] / 1000000000) * 100), 100),
        budget: 1000000000,
        targetDate: 'Berjalan',
        image: 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?q=80&w=200&auto=format&fit=crop',
        status: 'In Progress'
      }
    ];

    return {
      totalAset: unifiedBalance.totalOperational,
      totalPenyaluran: stats.total_all,
      totalPenerima: stats.total_santri,
      sourceComposition,
      allocationTrend,
      strategicPrograms,
      recentTransactions
    };
  } catch (error) {
    console.error('Error fetching public impact data:', error);
    // Fallback to empty/mock structure if everything fails
    return {
      totalAset: 0,
      totalPenyaluran: 0,
      totalPenerima: 0,
      sourceComposition: [],
      allocationTrend: [],
      strategicPrograms: [],
      recentTransactions: []
    };
  }
};
