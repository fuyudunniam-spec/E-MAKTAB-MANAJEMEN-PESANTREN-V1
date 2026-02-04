import { supabase } from '@/integrations/supabase/client';

export interface DonationStats {
  totalDonation: number;
  donationBulanIni: number;
  totalDonors: number;
  totalItems: number;
  donationTrend: number;
  donorTrend: number;
  // Breakdown by item type
  inventoryItems: number;
  directConsumptionItems: number;
  // Direct consumption metrics
  totalPorsi: number;
  totalKg: number;
}

export interface DonationMonthlyData {
  month: string;
  cash: number;
  inKind: number;
  pledge: number;
  mixed: number;
  // Direct consumption metrics
    directConsumption: {
      totalItems: number;
      totalQuantity: number; // Total quantity in all units
      totalPorsi: number; // Total porsi (if uom = 'porsi')
      totalKg: number; // Total kg (if uom contains 'kg' or 'kilogram')
      itemsByUom: Record<string, number>; // Quantity grouped by unit
      estimatedValues?: Array<{ // Estimated values from database
        quantity: number;
        estimatedValue: number;
        uom: string;
      }>;
      totalEstimatedValue?: number; // Total estimated value in rupiah
    };
}

export interface DonationCategoryData {
  name: string;
  value: number;
  color: string;
  // Additional metrics for direct consumption
  directConsumption?: {
    totalItems: number;
    totalPorsi: number;
    totalKg: number;
  };
}

/**
 * Get comprehensive donation dashboard statistics
 */
export const getDonasiDashboardStats = async (): Promise<DonationStats> => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const endOfMonth = new Date();
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);
  endOfMonth.setDate(0);
  endOfMonth.setHours(23, 59, 59, 999);

  // Get all donations (excluding cancelled)
  const { data: allDonations, error: donationsError } = await supabase
    .from('donations')
    .select('*')
    .neq('status', 'cancelled')
    .order('donation_date', { ascending: false });

  if (donationsError) {
    console.error('Error fetching donations:', donationsError);
    throw donationsError;
  }

  // Get donation items with item_type
  const { data: donationItems, error: itemsError } = await supabase
    .from('donation_items')
    .select('id, donation_id, item_type, quantity, uom');

  if (itemsError) {
    console.error('Error fetching donation items:', itemsError);
    // Don't throw, just use empty array
  }

  const donations = allDonations || [];
  const items = donationItems || [];

  // Calculate total donation (cash + mixed)
  const totalDonation = donations
    .filter(d => d.donation_type === 'cash' || d.donation_type === 'mixed')
    .reduce((sum, d) => sum + (d.cash_amount || 0), 0);

  // Calculate donation this month (cash + mixed)
  const donationBulanIni = donations
    .filter(d => {
      const donationDate = new Date(d.donation_date);
      return donationDate >= startOfMonth && 
             donationDate <= endOfMonth && 
             (d.donation_type === 'cash' || d.donation_type === 'mixed');
    })
    .reduce((sum, d) => sum + (d.cash_amount || 0), 0);

  // Calculate last month for trend comparison
  const lastMonthStart = new Date(startOfMonth);
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
  const lastMonthEnd = new Date(startOfMonth);
  lastMonthEnd.setMilliseconds(-1);

  const donationBulanLalu = donations
    .filter(d => {
      const donationDate = new Date(d.donation_date);
      return donationDate >= lastMonthStart && 
             donationDate <= lastMonthEnd && 
             (d.donation_type === 'cash' || d.donation_type === 'mixed');
    })
    .reduce((sum, d) => sum + (d.cash_amount || 0), 0);

  // Calculate trends
  const donationTrend = donationBulanLalu > 0
    ? ((donationBulanIni - donationBulanLalu) / donationBulanLalu) * 100
    : 0;

  // Get unique donors
  const uniqueDonors = new Set(donations.map(d => d.donor_name)).size;
  
  // Get unique donors last month
  const donorsBulanLalu = new Set(
    donations
      .filter(d => {
        const donationDate = new Date(d.donation_date);
        return donationDate >= lastMonthStart && donationDate <= lastMonthEnd;
      })
      .map(d => d.donor_name)
  ).size;

  const donorTrend = donorsBulanLalu > 0
    ? ((uniqueDonors - donorsBulanLalu) / donorsBulanLalu) * 100
    : 0;

  // Count items by type
  const inventoryItems = items.filter(item => item.item_type === 'inventory').length;
  const directConsumptionItems = items.filter(item => item.item_type === 'direct_consumption').length;
  const totalItems = items.length;

  // Calculate direct consumption metrics
  const dcItems = items.filter(item => item.item_type === 'direct_consumption');
  let totalPorsi = 0;
  let totalKg = 0;
  
  dcItems.forEach(item => {
    const qty = parseFloat(item.quantity?.toString() || '0');
    const uom = (item.uom || '').toLowerCase();
    
    if (uom.includes('porsi') || uom === 'porsi') {
      totalPorsi += qty;
    }
    
    if (uom.includes('kg') || uom.includes('kilogram') || uom.includes('kilo')) {
      totalKg += qty;
    }
  });

  return {
    totalDonation,
    donationBulanIni,
    totalDonors: uniqueDonors,
    totalItems,
    donationTrend,
    donorTrend,
    inventoryItems,
    directConsumptionItems,
    totalPorsi: Math.round(totalPorsi),
    totalKg: Math.round(totalKg * 100) / 100
  };
};

/**
 * Get monthly donation data for charts
 * Includes direct consumption items metrics
 */
export const getDonationMonthlyData = async (): Promise<DonationMonthlyData[]> => {
  const { data: donations, error } = await supabase
    .from('donations')
    .select('id, donation_date, donation_type, cash_amount')
    .neq('status', 'cancelled')
    .order('donation_date', { ascending: true });

  if (error) {
    console.error('Error fetching monthly data:', error);
    return [];
  }

  // Get all donation items with item_type
  const { data: donationItems } = await supabase
    .from('donation_items')
    .select('donation_id, item_type, quantity, uom')
    .in('donation_id', donations?.map(d => d.id) || []);

  // Group by month
  const monthlyMap = new Map<string, { 
    cash: number; 
    inKind: number; 
    pledge: number;
    mixed: number;
    directConsumption: {
      totalItems: number;
      totalQuantity: number;
      totalPorsi: number;
      totalKg: number;
      itemsByUom: Record<string, number>;
    };
  }>();

  donations?.forEach(donation => {
    const date = new Date(donation.donation_date);
    const monthKey = date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
    
    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, { 
        cash: 0, 
        inKind: 0, 
        pledge: 0,
        mixed: 0,
        directConsumption: {
          totalItems: 0,
          totalQuantity: 0,
          totalPorsi: 0,
          totalKg: 0,
          itemsByUom: {},
          estimatedValues: []
        }
      });
    }

    const monthData = monthlyMap.get(monthKey)!;
    
    if (donation.donation_type === 'cash') {
      monthData.cash += donation.cash_amount || 0;
    } else if (donation.donation_type === 'in_kind') {
      monthData.inKind += 1; // Count donations, not value
    } else if (donation.donation_type === 'pledge') {
      monthData.pledge += donation.cash_amount || 0;
    } else if (donation.donation_type === 'mixed') {
      monthData.mixed += donation.cash_amount || 0;
    }

    // Process donation items for this donation
    const items = donationItems?.filter(item => item.donation_id === donation.id) || [];
    items.forEach(item => {
      if (item.item_type === 'direct_consumption') {
        const qty = parseFloat(item.quantity?.toString() || '0');
        const uom = (item.uom || '').toLowerCase();
        const estimatedValue = parseFloat(item.estimated_value?.toString() || '0');
        
        monthData.directConsumption.totalItems += 1;
        monthData.directConsumption.totalQuantity += qty;
        
        // Count porsi
        if (uom.includes('porsi') || uom === 'porsi') {
          monthData.directConsumption.totalPorsi += qty;
        }
        
        // Count kg
        if (uom.includes('kg') || uom.includes('kilogram') || uom.includes('kilo')) {
          monthData.directConsumption.totalKg += qty;
        }
        
        // Group by UOM
        if (!monthData.directConsumption.itemsByUom[uom]) {
          monthData.directConsumption.itemsByUom[uom] = 0;
        }
        monthData.directConsumption.itemsByUom[uom] += qty;
        
        // Store estimated value per item (for later use in chart)
        if (!monthData.directConsumption.estimatedValues) {
          monthData.directConsumption.estimatedValues = [];
        }
        monthData.directConsumption.estimatedValues.push({
          quantity: qty,
          estimatedValue: estimatedValue,
          uom: uom
        });
      }
    });
  });

  // Convert to array and sort by date
  const monthlyData: DonationMonthlyData[] = Array.from(monthlyMap.entries())
    .map(([month, data]) => {
      // Calculate total estimated value from database
      let totalEstimatedValue = 0;
      if (data.directConsumption.estimatedValues && data.directConsumption.estimatedValues.length > 0) {
        totalEstimatedValue = data.directConsumption.estimatedValues.reduce((sum, item) => {
          // Jika ada estimated_value dari database, gunakan itu
          if (item.estimatedValue > 0) {
            return sum + (item.estimatedValue * item.quantity);
          }
          // Fallback: estimasi berdasarkan UOM
          const uom = item.uom.toLowerCase();
          if (uom.includes('porsi') || uom === 'porsi') {
            return sum + (item.quantity * 10000); // Rp 10.000 per porsi
          } else if (uom.includes('kg') || uom.includes('kilogram') || uom.includes('kilo')) {
            return sum + (item.quantity * 15000); // Rp 15.000 per kg
          } else {
            return sum + (item.quantity * 50000); // Rp 50.000 per item sebagai estimasi
          }
        }, 0);
      }
      
      return {
        month,
        cash: data.cash,
        inKind: data.inKind,
        pledge: data.pledge,
        mixed: data.mixed,
        directConsumption: {
          ...data.directConsumption,
          totalEstimatedValue
        }
      };
    })
    .sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });

  // Get last 6 months
  return monthlyData.slice(-6);
};

/**
 * Get donation category distribution for pie chart
 * Includes direct consumption items metrics
 */
export const getDonationCategoryData = async (): Promise<DonationCategoryData[]> => {
  const { data: donations, error } = await supabase
    .from('donations')
    .select('id, donation_type, cash_amount')
    .neq('status', 'cancelled');

  if (error) {
    console.error('Error fetching category data:', error);
    return [];
  }

  // Get all donation items with item_type
  const { data: donationItems } = await supabase
    .from('donation_items')
    .select('donation_id, item_type, quantity, uom')
    .in('donation_id', donations?.map(d => d.id) || []);

  // Calculate totals
  const cashTotal = donations
    ?.filter(d => d.donation_type === 'cash' || d.donation_type === 'mixed')
    .reduce((sum, d) => sum + (d.cash_amount || 0), 0) || 0;

  // Separate inventory and direct consumption items
  const inventoryItems = donationItems?.filter(item => 
    item.item_type === 'inventory'
  ) || [];
  
  const directConsumptionItems = donationItems?.filter(item => 
    item.item_type === 'direct_consumption'
  ) || [];

  const pledgeTotal = donations
    ?.filter(d => d.donation_type === 'pledge')
    .reduce((sum, d) => sum + (d.cash_amount || 0), 0) || 0;

  // Calculate direct consumption metrics (for reference, not displayed)
  let totalPorsi = 0;
  let totalKg = 0;

  directConsumptionItems.forEach(item => {
    const qty = parseFloat(item.quantity?.toString() || '0');
    const uom = (item.uom || '').toLowerCase();
    
    if (uom.includes('porsi') || uom === 'porsi') {
      totalPorsi += qty;
    }
    
    if (uom.includes('kg') || uom.includes('kilogram') || uom.includes('kilo')) {
      totalKg += qty;
    }
  });

  // Calculate total for percentage (use count-based estimation)
  const inventoryCount = inventoryItems.length;
  const directConsumptionCount = directConsumptionItems.length;
  const total = cashTotal + (inventoryCount * 1000000) + (directConsumptionCount * 1000000) + pledgeTotal;

  if (total === 0 && inventoryItems.length === 0 && directConsumptionItems.length === 0) {
    return [];
  }

  const cashPercent = total > 0 ? (cashTotal / total) * 100 : 0;
  const inventoryPercent = total > 0 ? ((inventoryCount * 1000000) / total) * 100 : 0;
  const directConsumptionPercent = total > 0 ? ((directConsumptionCount * 1000000) / total) * 100 : 0;
  const pledgePercent = total > 0 ? (pledgeTotal / total) * 100 : 0;

  const result: DonationCategoryData[] = [];

  // Add cash
  if (cashTotal > 0 || cashPercent > 0) {
    result.push({
      name: 'Tunai',
      value: Math.round(cashPercent),
      color: '#3b82f6'
    });
  }

  // Add inventory items (Barang/Inventaris)
  if (inventoryItems.length > 0 || inventoryPercent > 0) {
    result.push({
      name: 'Barang',
      value: Math.round(inventoryPercent),
      color: '#f59e0b'
    });
  }

  // Add direct consumption (Makanan)
  if (directConsumptionItems.length > 0 || directConsumptionPercent > 0) {
    result.push({
      name: 'Makanan',
      value: Math.round(directConsumptionPercent),
      color: '#ef4444',
      directConsumption: {
        totalItems: directConsumptionItems.length,
        totalPorsi: Math.round(totalPorsi),
        totalKg: Math.round(totalKg * 100) / 100
      }
    });
  }

  // Add pledge if exists
  if (pledgePercent > 0) {
    result.push({
      name: 'Janji',
      value: Math.round(pledgePercent),
      color: '#10b981'
    });
  }

  return result;
};

