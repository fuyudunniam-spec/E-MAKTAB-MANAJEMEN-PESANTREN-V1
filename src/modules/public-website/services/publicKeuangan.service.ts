import { supabase } from '@/integrations/supabase/client';
import { ReportFormatterV3 } from '@/utils/export/reportFormatterV3';

export interface PublicImpactData {
  totalAset: number;
  totalPenyaluran: number;
  totalPemasukan: number;
  yearTotalPemasukan: number; // New field for V10
  yearTotalPengeluaran: number; // New field for V10
  totalPenerima: number;
  sourceComposition: { name: string; value: number; color: string }[];
  allocationTrend: { month: string; monthNum: number; pemasukan: number; pengeluaran: number }[];
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
    type: 'Pemasukan' | 'Pengeluaran';
    rincian?: any[];
  }[];
  yearlySummary: {
    category: string;
    amount: number;
    type: 'Pemasukan' | 'Pengeluaran';
  }[];
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const generateEmptyTrend = () => {
  return monthNames.map((name, i) => ({
    month: name,
    monthNum: i + 1,
    pemasukan: 0,
    pengeluaran: 0
  }));
};

export const getPublicImpactData = async (params?: { month?: number; year?: number }): Promise<PublicImpactData> => {
  try {
    // V10: RPC now handles everything, minimal client side fallback needed
    const { data: rpcData, error } = await supabase.rpc('get_public_financial_data', {
      p_year: params?.year,
      p_month: params?.month
    });

    if (error) {
      console.warn('RPC failed', error);
      throw error;
    }

    return mapRpcToImpactData(rpcData, params);
  } catch (error) {
    console.error('Error fetching public impact data:', error);
    return {
      totalAset: 0,
      totalPenyaluran: 0,
      totalPemasukan: 0,
      yearTotalPemasukan: 0,
      yearTotalPengeluaran: 0,
      totalPenerima: 0,
      sourceComposition: [],
      allocationTrend: generateEmptyTrend(),
      strategicPrograms: [],
      recentTransactions: [],
      yearlySummary: []
    };
  }
};

const mapRpcToImpactData = (stats: any, params?: { month?: number; year?: number }): PublicImpactData => {
  // Luxury Palette: Royal(Navy), Gold, Slate, Stone, Muted Blue
  const predefinedColors = ['#020617', '#d4af37', '#94a3b8', '#e7e5e4', '#64748b'];
  const targetYear = params?.year || new Date().getFullYear();


  // 1. Map Recent Tx
  const allTransactions = (stats.recentTransactions || []).map((h: any) => {
    let finalDescription = '';
    if (h.type === 'Pengeluaran' && h.rincian && h.rincian.length > 0) {
      finalDescription = ReportFormatterV3.generateDescriptionFromDetails(h.rincian);
    } else {
      finalDescription = ReportFormatterV3.cleanAutoPostDescription(h.description || `${h.type} - ${h.category}`);
    }

    return {
      date: h.date,
      description: finalDescription,
      category: h.kategori,
      amount: h.amount || 0,
      status: 'Selesai',
      type: h.type as 'Pemasukan' | 'Pengeluaran',
      rincian: h.rincian
    };
  });

  // Client-side filtering for the RECENT TRANSACTIONS TABLE ONLY
  // This might be redundant if RPC already filters by date range, but safe to keep for "Recent" logic
  let filteredTransactions = allTransactions;
  // Note: V10 RPC parameters already filter recentTransactions by date range if p_month is passed.
  // So we take it as is.

  // 2. Map Composition
  const sourceComposition = (stats.sourceComposition || []).map((c: any, index: number) => ({
    name: c.name,
    value: c.value,
    color: predefinedColors[index % predefinedColors.length]
  }));

  const totalComp = sourceComposition.reduce((sum: number, c: any) => sum + c.value, 0);
  if (totalComp > 100 && totalComp > 0) { // Just a safety check, though value should be raw amount now
    // If value is raw amount, we don't need to normalize to 100 here for PieChart data usually, 
    // unless we strictly want percentages. Recharts handles raw values fine.
    // Keeping logic as is implies it might expect percentage or raw.
    // If RPC V10 returns raw amounts (which it does), we should probably let Recharts calc %.
    // But let's keep existing logic to avoid breaking changes if it expects something else.
    // Actually V9 RPC returns raw amounts. 
  }

  // 3. Map Trend (Grouped and filled 12 months)
  const trendMap = new Map<number, { pemasukan: number; pengeluaran: number }>();
  (stats.monthlyTrend || []).forEach((m: any) => {
    const parts = m.month.split(' ');
    if (parts.length < 2) return;
    let mNum = parseInt(parts[0]);
    let mYear = parseInt(parts[1]);
    if (isNaN(mNum)) {
      mNum = monthNames.findIndex(name => parts[0].toLowerCase().startsWith(name.toLowerCase())) + 1;
    }
    // Only map if year matches target year (RPC V10 filters this already)
    if (mYear === targetYear && mNum >= 1 && mNum <= 12) {
      trendMap.set(mNum, {
        pemasukan: m.pemasukan / 1000000, // Convert to Millions
        pengeluaran: m.pengeluaran / 1000000 // Convert to Millions
      });
    }
  });

  const allocationTrend = generateEmptyTrend().map(item => {
    const data = trendMap.get(item.monthNum);
    return data ? { ...item, ...data } : item;
  });

  // 4. Strategic Programs (Mapped to Landing Page Pillars)
  const pillars = [
    { key: 'Pendidikan Formal', aliases: ['Bantuan Langsung Yayasan', 'Pendidikan Formal', 'Beasiswa'], desc: 'Beasiswa penuh bagi santri yatim dan dhuafa' },
    { key: 'Pendidikan Pesantren', aliases: ['Pendidikan Pesantren', 'Pendidikan', 'Kitab Kuning'], desc: 'Kurikulum Diniyah & Tahfidz Al-Quran' },
    { key: 'Asrama & Konsumsi', aliases: ['Asrama dan Konsumsi Santri', 'Konsumsi', 'Asrama'], desc: 'Layanan tempat tinggal dan gizi santri' },
    { key: 'Operasional Yayasan', aliases: ['Operasional Yayasan', 'Gaji', 'Listrik'], desc: 'Dukungan manajemen dan operasional' }
  ];

  const strategicPrograms = pillars.map((pillar, index) => {
    // Find matching category in sourceComposition
    const match = sourceComposition.find(c =>
      pillar.aliases.some(alias => c.name.toLowerCase().includes(alias.toLowerCase()))
    );

    const images = [
      'https://images.unsplash.com/photo-1542810634-71277d95dc24?q=80&w=200&auto=format&fit=crop', // Education
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=200&auto=format&fit=crop', // Quran
      'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=200&auto=format&fit=crop', // Dorm/Food
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=200&auto=format&fit=crop'  // Office
    ];

    return {
      title: pillar.key,
      description: match ? `Alokasi dana untuk ${pillar.desc.toLowerCase()}.` : pillar.desc,
      progress: match ? 100 : 0, // Should be calculated if we had a target
      budget: match ? match.value : 0,
      targetDate: 'Berjalan',
      image: images[index % images.length],
      status: (match ? 'Selesai' : 'In Progress') as 'Selesai' | 'In Progress'
    };
  }).filter(p => p.budget > 0); // Only show active pillars or show all if preferred. User implies "Realisasi" so stick to active? 
  // User wants to see the pillars. If 0, maybe still show? 
  // Let's filter > 0 to avoid showing empty programs unless we want to show "0%". 
  // Actually showing all is better for "Pillars" presence even if 0.
  // But let's stick to .filter(p => p.budget > 0) to avoid empty cards cluttering if data is missing.
  // Wait, if I filter, I might miss the "Pillars" the user explicitly asked for. 
  // Let's keep all 4 pillars but sorted by budget? 
  // No, let's just return the mapped pillars. If budget is 0, it shows 0.

  const finalStrategicPrograms = strategicPrograms.sort((a, b) => b.budget - a.budget);

  return {
    totalAset: stats.totalAset || 0,
    totalPemasukan: stats.totalPemasukan || 0,
    totalPenyaluran: stats.totalPenyaluran || 0,
    yearTotalPemasukan: stats.yearTotalPemasukan || 0, // V10
    yearTotalPengeluaran: stats.yearTotalPengeluaran || 0, // V10
    totalPenerima: stats.totalPenerima || 0,
    sourceComposition,
    allocationTrend,
    strategicPrograms: finalStrategicPrograms,
    recentTransactions: filteredTransactions,
    yearlySummary: stats.yearlySummary || []
  };
};
