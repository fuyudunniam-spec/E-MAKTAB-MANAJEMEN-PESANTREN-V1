import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RefreshCw, Plus, FileText, Package, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

// Import dashboard components
import TotalDonationDisplay from '@/modules/donasi/components/dashboard/donasi/TotalDonationDisplay';
import DonationSummaryCards from '@/modules/donasi/components/dashboard/donasi/DonationSummaryCards';
import DonationChartsSection from '@/modules/donasi/components/dashboard/donasi/DonationChartsSection';
import DonationHistory from '@/modules/donasi/components/dashboard/donasi/DonationHistory';
import HajatHariIni from '@/modules/donasi/components/dashboard/donasi/HajatHariIni';
import DonationFormDialog from '@/modules/donasi/components/donasi/DonationFormDialog';
// import DonasiReports from '@/modules/donasi/componentsReports'; // TODO: File not found - needs to be created or path corrected
import DonationDetailModal from '@/modules/donasi/components/dashboard/donasi/DonationDetailModal';
import DonationReceipt from '@/modules/donasi/components/dashboard/donasi/DonationReceipt';

// Import services
import {
  getDonasiDashboardStats,
  getDonationMonthlyData,
  getDonationCategoryData,
  type DonationStats,
  type DonationMonthlyData,
  type DonationCategoryData
} from '@/modules/donasi/services/donasiDashboard.service';
import { supabase } from '@/integrations/supabase/client';

interface Donation {
  id: string;
  donation_type: 'cash' | 'in_kind' | 'pledge' | 'mixed';
  donor_name: string;
  donor_email?: string;
  donor_phone?: string;
  donor_address?: string;
  donation_date: string;
  received_date?: string;
  cash_amount?: number;
  payment_method?: string;
  status: 'pending' | 'received' | 'posted' | 'cancelled';
  notes?: string;
  hajat_doa?: string;
  created_at: string;
  items?: Array<{
    raw_item_name: string;
    quantity: number;
    uom: string;
  }>;
  // New fields
  kategori_donasi?: string | null;
  penerima_awal_id?: string | null;
  penerima_awal?: { id: string; full_name: string } | null;
  status_setoran?: string | null;
  tanggal_setoran?: string | null;
  akun_kas_id?: string | null;
  has_keuangan_transaction?: boolean; // Flag untuk menandakan apakah sudah ada transaksi keuangan
}

const DonasiDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [statistics, setStatistics] = useState<DonationStats | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [monthlyData, setMonthlyData] = useState<DonationMonthlyData[]>([]);
  const [categoryData, setCategoryData] = useState<DonationCategoryData[]>([]);

  // UI states
  const [showNewDonationDialog, setShowNewDonationDialog] = useState(false);
  const [showReportsDialog, setShowReportsDialog] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState<string | null>(null);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [donationForReceipt, setDonationForReceipt] = useState<Donation | null>(null);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load all data in parallel
      const [stats, monthly, category, donationsData] = await Promise.all([
        getDonasiDashboardStats(),
        getDonationMonthlyData(),
        getDonationCategoryData(),
        loadDonations()
      ]);

      setStatistics(stats);
      setMonthlyData(monthly);
      setCategoryData(category);
      setDonations(donationsData);

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Gagal memuat data donasi');
    } finally {
      setLoading(false);
    }
  };

  const loadDonations = async (): Promise<Donation[]> => {
    // Load donations with items and posting status
    // Limit to last 200 donations untuk optimasi loading
    const { data: donationsData, error: donationsError } = await supabase
      .from('donations')
      .select(`
        *,
        penerima_awal:profiles!donations_penerima_awal_id_fkey(id, full_name)
      `)
      .order('donation_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(200);

    if (donationsError) {
      console.error('Error loading donations:', donationsError);
      throw donationsError;
    }

    if (!donationsData || donationsData.length === 0) {
      return [];
    }

    // Load donation items hanya untuk donations yang sudah di-load (optimasi)
    const donationIds = donationsData.map(d => d.id);
    const { data: itemsData, error: itemsError } = await supabase
      .from('donation_items')
      .select('donation_id, raw_item_name, quantity, uom, is_posted_to_stock, mapped_item_id, item_type, estimated_value')
      .in('donation_id', donationIds);

    if (itemsError) {
      console.error('Error loading donation items:', itemsError);
      // Don't throw, just continue without items
    }

    // Combine donations with their items
    const itemsMap = new Map<string, any[]>();
    (itemsData || []).forEach(item => {
      if (!itemsMap.has(item.donation_id)) {
        itemsMap.set(item.donation_id, []);
      }
      itemsMap.get(item.donation_id)!.push(item);
    });

    // Check which donations have keuangan transactions
    const { data: keuanganData, error: keuanganError } = await supabase
      .from('keuangan')
      .select('source_id')
      .eq('source_module', 'donasi')
      .in('source_id', donationIds)
      .eq('auto_posted', true);

    if (keuanganError) {
      console.error('Error checking keuangan transactions:', keuanganError);
    }

    // Create a set of donation IDs that have keuangan transactions
    const hasKeuanganSet = new Set(
      (keuanganData || []).map(k => k.source_id).filter(Boolean)
    );

    const donations = donationsData.map(donation => ({
      ...donation,
      items: itemsMap.get(donation.id) || [],
      has_keuangan_transaction: hasKeuanganSet.has(donation.id)
    }));

    return donations;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast.success('Data berhasil diperbarui');
  };

  const handleAddDonation = () => {
    setEditingDonation(null);
    setShowNewDonationDialog(true);
  };

  const handleViewReports = () => {
    setShowReportsDialog(true);
  };

  const handleViewAllDonors = () => {
    setSelectedDonor(null);
  };

  const handleSelectDonor = (donorName: string) => {
    setSelectedDonor(donorName);
  };

  const handleViewDetail = (donation: Donation) => {
    setSelectedDonation(donation);
    setShowDetailModal(true);
  };

  const handlePrintNota = (donation: Donation) => {
    setDonationForReceipt(donation);
  };

  const handleEditDonation = (donation: Donation) => {
    setEditingDonation(donation);
    setShowNewDonationDialog(true);
  };

  // handlePostToStock dihapus - posting hanya bisa dilakukan dari dashboard inventaris
  // Admin inventaris akan melakukan posting dari dashboard inventaris setelah verifikasi

  const postToFinance = async (donationId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      const { data, error } = await supabase
        .rpc('post_donation_to_finance', {
          p_donation_id: donationId,
          p_user_id: userId
        });

      if (error) throw error;

      // Only show success message if actually posted
      if (data && data.message) {
        if (data.amount > 0) {
          toast.success(data.message || "Transaksi keuangan berhasil dicatat");
        } else {
          // No estimated value, skip silently
          console.log("Donasi barang tanpa nilai taksir, tidak masuk keuangan");
        }
      }
    } catch (error) {
      console.error("Error posting to finance:", error);
      // Don't show error if it's just because no estimated value
      if (!error.message?.includes('nilai taksir')) {
        toast.error("Gagal mencatat ke keuangan");
      }
    }
  };

  const handleDeleteDonation = async (donation: Donation) => {
    // Delete diaktifkan untuk semua kategori donasi
    // Tidak ada lagi pembatasan berdasarkan posted_to_stock_at

    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus donasi dari ${donation.donor_name}?`
    );

    if (confirmed) {
      try {
        const { error } = await supabase
          .from('donations')
          .delete()
          .eq('id', donation.id);

        if (error) throw error;

        toast.success('Donasi berhasil dihapus');
        await loadData();
      } catch (error: any) {
        console.error('Error deleting donation:', error);
        toast.error('Gagal menghapus donasi: ' + (error.message || 'Terjadi kesalahan'));
      }
    }
  };

  const handleClearFilter = () => {
    setSelectedDonor(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Memuat data donasi...</p>
        </div>
      </div>
    );
  }

  // Filter donations by selected donor
  const filteredDonations = selectedDonor
    ? donations.filter(d => d.donor_name === selectedDonor)
    : donations;

  // Calculate totals for display
  const totals = {
    totalDonation: selectedDonor
      ? filteredDonations
        .filter(d => d.donation_type === 'cash')
        .reduce((sum, d) => sum + (d.cash_amount || 0), 0)
      : statistics?.totalDonation || 0,
    donorCount: statistics?.totalDonors || 0
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 bg-white min-h-screen">
      {/* Header - Adopsi dari KeuanganV3 */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-light tracking-tight text-gray-900">Donasi</h1>
          </div>

          {/* Action Buttons - Grouped and Clean seperti KeuanganV3 */}
          <div className="flex items-center gap-2 flex-wrap justify-end ml-auto">
            {/* Primary Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                size="sm"
                onClick={handleAddDonation}
                className="bg-gray-900 hover:bg-gray-800 text-white shadow-sm whitespace-nowrap text-xs sm:text-sm"
              >
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Tambah Donasi</span>
              </Button>
            </div>

            {/* Secondary Actions */}
            <div className="flex items-center gap-2 border-l border-gray-200 pl-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleViewReports}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 whitespace-nowrap text-xs sm:text-sm"
              >
                <FileText className="h-4 w-4 sm:mr-2" />
                <span className="hidden md:inline">Laporan</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 flex-shrink-0"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Total Donation Display - Mirip dengan TotalBalanceDisplay */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Total Donation Display */}
        <div>
          <TotalDonationDisplay
            totalDonation={totals.totalDonation}
            donorCount={totals.donorCount}
            selectedDonor={selectedDonor || undefined}
            onAddDonation={handleAddDonation}
            onViewReports={handleViewReports}
            onViewAllDonors={handleViewAllDonors}
          />
        </div>

        {/* Quick Stats atau komponen tambahan */}
        <div className="flex items-center justify-center">
          {/* Placeholder untuk komponen tambahan */}
        </div>
      </div>

      {/* Section 2: Summary Cards - Menggunakan komponen yang sudah ada */}
      {statistics && (
        <DonationSummaryCards
          stats={{
            totalDonation: statistics.totalDonation,
            donationBulanIni: statistics.donationBulanIni,
            totalDonors: statistics.totalDonors,
            totalItems: statistics.totalItems,
            donationTrend: statistics.donationTrend,
            donorTrend: statistics.donorTrend,
            inventoryItems: statistics.inventoryItems,
            directConsumptionItems: statistics.directConsumptionItems,
            totalPorsi: statistics.totalPorsi,
            totalKg: statistics.totalKg,
          }}
          selectedDonorName={selectedDonor || undefined}
        />
      )}

      {/* Section 3: Charts Section - Menggunakan komponen yang sudah ada */}
      <DonationChartsSection
        monthlyData={monthlyData}
        categoryData={categoryData}
        selectedDonorName={selectedDonor || undefined}
      />

      {/* Section 4: Hajat Hari Ini - Tetap dipertahankan */}
      <HajatHariIni
        donations={donations}
        onPrintNota={handlePrintNota}
        onShareWA={(donation) => {
          const phone = donation.donor_phone?.replace(/[^0-9]/g, '') || '';
          if (phone) {
            const message = `Assalamu'alaikum. Terima kasih atas donasi dari ${donation.donor_name}. Semoga Allah SWT mengabulkan hajat yang dimohonkan. Aamiin.`;
            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
          } else {
            toast.error('Nomor telepon tidak tersedia');
          }
        }}
        onEdit={handleEditDonation}
      />

      {/* Section 5: Donation History - Menggunakan komponen yang sudah ada */}
      <DonationHistory
        donations={filteredDonations as any}
        selectedDonorName={selectedDonor || undefined}
        onClearFilter={handleClearFilter}
        onViewDetail={handleViewDetail}
        onEditDonation={handleEditDonation}
        onDeleteDonation={handleDeleteDonation}
        onPrintNota={handlePrintNota}
      />

      {/* Detail Modal */}
      <DonationDetailModal
        donation={selectedDonation as any}
        open={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedDonation(null);
        }}
        onPrintNota={handlePrintNota}
      />

      {/* Receipt Print */}
      {donationForReceipt && (
        <DonationReceipt
          donation={donationForReceipt as any}
          onClose={() => setDonationForReceipt(null)}
        />
      )}

      {/* Form Dialog */}
      <DonationFormDialog
        open={showNewDonationDialog}
        onOpenChange={setShowNewDonationDialog}
        onSuccess={loadData}
        editingDonation={editingDonation}
      />

      {/* Reports Dialog */}
      <Dialog open={showReportsDialog} onOpenChange={setShowReportsDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Laporan Donasi</DialogTitle>
          </DialogHeader>
          {/* <DonasiReports /> */}
          <div className="p-8 text-center text-muted-foreground">
            <p>Fitur laporan dalam pengembangan</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DonasiDashboard;

