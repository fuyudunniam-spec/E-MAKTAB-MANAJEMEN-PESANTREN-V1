import { supabase } from '@/integrations/supabase/client';

export interface PublicImpactData {
  totalAset: number;
  totalPenyaluran: number;
  totalPemasukan: number; // Added Total Income
  totalPenerima: number;
  sourceComposition: { name: string; value: number; color: string }[];
  allocationTrend: { month: string; amount: number; type: 'Pemasukan' | 'Pengeluaran' }[]; // Updated to show both
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
    type: 'Pemasukan' | 'Pengeluaran'; // Added type
  }[];
}



export const getPublicImpactData = async (): Promise<PublicImpactData> => {
  try {
    const { data: rpcData, error } = await supabase.rpc('get_public_financial_data');

    if (error) throw error;

    // Safety check if data is null (shouldn't be with current RPC)
    if (!rpcData) throw new Error("No data returned from public financial endpoint");

    const stats = rpcData as any;

    // 1. Map Composition (Add Colors)
    const predefinedColors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
    const sourceComposition = (stats.sourceComposition || []).map((c: any, index: number) => ({
      name: c.name,
      value: Math.round((c.value / (stats.totalPenyaluran || 1)) * 100) || 0, // Using % relative to current month for impact, or maybe just raw value if chart supports it. 
      // The RPC returns raw total. The previous code was calculating percentage. 
      // Let's assume the pie chart wants percentage. 
      // "value" here is raw sum. 
      // Let's fix the percentage calc: (Category Total / Total Expenses in that dataset) * 100
      // But wait, the dataset for composition is "All Time" or "Yearly" based on RPC query, while 'totalPenyaluran' is "Current Month".
      // This percentage will be huge if we divide Year Total by Month Total.
      // Let's recalculate total inside map or use sum of all categories.
      // Actually, Pie Chart usually takes raw values and calculates angles. We can just pass raw values if 'value' property is expected to be amount.
      // But the previous code had logic: "value: Math.round(...)".
      // Let's look at TransparansiPage: <Pie dataKey="value" ... label={(value) => `${value}%`} />
      // It displays percentage directly in labels? No, formatter={(value) => [`${value}%`, 'Persentase']}.
      // So it expects 'value' to be a Number 0-100? yes.
      // We need to sum up all categories first.

      // Re-calculating proper percentage
      color: predefinedColors[index % predefinedColors.length]
    }));

    const totalCompositionValue = sourceComposition.reduce((acc: number, curr: any) => acc + curr.value, 0); // This is raw value if we haven't converted yet.
    // Wait, the RPC returns 'value' as raw total amount.
    // We should normalize it to percentage 100%.
    const rawTotal = (stats.sourceComposition || []).reduce((acc: number, curr: any) => acc + curr.value, 0);

    const normalizedComposition = (stats.sourceComposition || []).map((c: any, index: number) => ({
      name: c.name,
      value: rawTotal > 0 ? Math.round((c.value / rawTotal) * 100) : 0,
      color: predefinedColors[index % predefinedColors.length]
    }));


    // 2. Map Trend
    const allocationTrend = (stats.monthlyTrend || []).flatMap((m: any) => [
      { month: m.month.split(' ')[0], amount: m.pengeluaran / 1000000, type: 'Pengeluaran' as const },
      { month: m.month.split(' ')[0], amount: m.pemasukan / 1000000, type: 'Pemasukan' as const }
    ]).slice(-12);

    // 3. Map Recent Tx
    const recentTransactions = (stats.recentTransactions || []).map((h: any) => ({
      date: h.date,
      description: h.description || `${h.type} - ${h.category}`,
      category: h.category,
      amount: h.amount || 0,
      status: 'Selesai',
      type: h.type as 'Pemasukan' | 'Pengeluaran'
    }));

    // 4. Strategic Programs (from Top Categories)
    const strategicPrograms = (stats.sourceComposition || []).slice(0, 4).map((cat: any, index: number) => {
      const images = [
        'https://images.unsplash.com/photo-1542810634-71277d95dc24?q=80&w=200&auto=format&fit=crop', // General/Islamic
        'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=200&auto=format&fit=crop', // Education
        'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=200&auto=format&fit=crop', // Community
        'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=200&auto=format&fit=crop'  // Finance/Office
      ];

      return {
        title: cat.name,
        description: `Alokasi dana untuk program ${cat.name.toLowerCase()}.`,
        progress: 100,
        budget: cat.value,
        targetDate: 'Berjalan',
        image: images[index % images.length],
        status: 'In Progress' as const
      };
    });

    return {
      totalAset: stats.totalAset || 0,
      totalPemasukan: stats.totalPemasukan || 0,
      totalPenyaluran: stats.totalPenyaluran || 0, // This is explicitly 'Pengeluaran Bulan Ini'
      totalPenerima: stats.totalPenerima || 0,
      sourceComposition: normalizedComposition,
      allocationTrend,
      strategicPrograms,
      recentTransactions
    };
  } catch (error) {
    console.error('Error fetching public impact data:', error);
    return {
      totalAset: 0,
      totalPenyaluran: 0,
      totalPemasukan: 0,
      totalPenerima: 0,
      sourceComposition: [],
      allocationTrend: [],
      strategicPrograms: [],
      recentTransactions: []
    };
  }
};
