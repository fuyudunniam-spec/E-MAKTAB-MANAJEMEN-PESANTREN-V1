import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, MoreHorizontal, Eye, Edit, Trash2, X, Calendar, FileText, Heart, DollarSign, Package, Clock, Utensils, Box, Printer, User, CheckCircle, GraduationCap, Building2, HeartHandshake } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DonationItem {
  donation_id: string;
  raw_item_name: string;
  quantity: number;
  uom: string;
  is_posted_to_stock?: boolean;
  mapped_item_id?: string;
  item_type?: 'inventory' | 'direct_consumption';
  estimated_value?: number | null;
}

export interface Donation {
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
  posted_to_stock_at?: string;
  posted_to_finance_at?: string;
  created_at: string;
  items?: DonationItem[];
  // New fields
  kategori_donasi?: string | null;
  penerima_awal_id?: string | null;
  penerima_awal?: { id: string; full_name: string } | null;
  status_setoran?: string | null;
  tanggal_setoran?: string | null;
  akun_kas_id?: string | null;
  has_keuangan_transaction?: boolean; // Flag untuk menandakan apakah sudah ada transaksi keuangan
}

interface DonationHistoryProps {
  donations: Donation[];
  selectedDonorName?: string;
  onClearFilter?: () => void;
  onViewDetail?: (donation: Donation) => void;
  onEditDonation?: (donation: Donation) => void;
  onDeleteDonation?: (donation: Donation) => void;
  onPrintNota?: (donation: Donation) => void;
  // onPostToStock dihapus - posting hanya bisa dilakukan dari dashboard inventaris
}

const DonationHistory: React.FC<DonationHistoryProps> = ({
  donations,
  selectedDonorName,
  onClearFilter,
  onViewDetail,
  onEditDonation,
  onDeleteDonation,
  onPrintNota
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<string>('donation_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Date filter states
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Item type tab filter
  const [itemTypeTab, setItemTypeTab] = useState<'all' | 'inventory' | 'direct_consumption'>('all');
  
  // Pengurus list for dropdown
  const [pengurusList, setPengurusList] = useState<Array<{ id: string; full_name: string }>>([]);
  const [editingPenerimaAwal, setEditingPenerimaAwal] = useState<string | null>(null);
  const [editingStatusSetoran, setEditingStatusSetoran] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Load pengurus list
  useEffect(() => {
    const loadPengurusList = async () => {
      try {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .order('full_name', { ascending: true });
        
        if (profilesError) throw profilesError;
        
        const userIds = (profiles || []).map(p => p.id);
        
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds);
        
        if (rolesError) throw rolesError;
        
        const rolesMap: Record<string, string[]> = {};
        (roles || []).forEach(r => {
          if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
          rolesMap[r.user_id].push(r.role);
        });
        
        const pengurusProfiles = (profiles || []).filter(p => {
          const userRoles = rolesMap[p.id] || [];
          return userRoles.some(role => 
            ['admin', 'pengurus', 'admin_keuangan', 'admin_inventaris', 'admin_akademik'].includes(role)
          ) && !userRoles.includes('santri');
        });
        
        setPengurusList(pengurusProfiles);
      } catch (error) {
        console.error('Error loading pengurus list:', error);
      }
    };
    
    loadPengurusList();
  }, []);

  // Update penerima awal
  const handleUpdatePenerimaAwal = async (donationId: string, penerimaAwalId: string | null) => {
    try {
      const { error } = await supabase
        .from('donations')
        .update({ penerima_awal_id: penerimaAwalId })
        .eq('id', donationId);
      
      if (error) throw error;
      
      toast.success('Penerima awal berhasil diupdate');
      setEditingPenerimaAwal(null);
      
      // Trigger window reload to refresh data
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error: any) {
      console.error('Error updating penerima awal:', error);
      toast.error('Gagal mengupdate penerima awal: ' + error.message);
    }
  };

  // Helper function untuk mapping kategori_donasi ke kategori keuangan
  const getKategoriKeuangan = (kategoriDonasi: string | null | undefined): string => {
    switch (kategoriDonasi) {
      case 'Orang Tua Asuh Pendidikan':
        return 'Donasi Pendidikan';
      case 'Pembangunan':
        return 'Donasi Pembangunan';
      case 'Donasi Umum':
        return 'Donasi Umum';
      default:
        return 'Donasi';
    }
  };

  // Helper function untuk auto-route akun_kas_id berdasarkan kategori donasi
  const getAkunKasIdByKategori = async (kategori: string | null | undefined): Promise<string | null> => {
    if (!kategori) return null;
    
    try {
      let accountNamePattern = '';
      
      if (kategori === 'Orang Tua Asuh Pendidikan') {
        accountNamePattern = '%Pendidikan%Santri%';
      } else if (kategori === 'Pembangunan') {
        accountNamePattern = '%Pembangunan%';
      } else if (kategori === 'Donasi Umum') {
        accountNamePattern = '%Operasional%';
      } else {
        return null;
      }
      
      const { data, error } = await supabase
        .from('akun_kas')
        .select('id, nama')
        .eq('status', 'aktif')
        .ilike('nama', accountNamePattern)
        .limit(1)
        .maybeSingle();
      
      if (error || !data) {
        console.warn(`Akun kas dengan pola "${accountNamePattern}" tidak ditemukan untuk kategori "${kategori}"`);
        return null;
      }
      
      return data.id;
    } catch (error) {
      console.error('Error getting akun kas by kategori:', error);
      return null;
    }
  };

  // Helper function untuk cek apakah sudah ada transaksi keuangan untuk donasi ini
  const checkExistingKeuanganTransaction = async (donationId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('keuangan')
        .select('id')
        .eq('source_module', 'donasi')
        .eq('source_id', donationId)
        .eq('auto_posted', true)
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error('Error checking existing keuangan transaction:', error);
        return false;
      }
      
      return !!data;
    } catch (error) {
      console.error('Error checking existing keuangan transaction:', error);
      return false;
    }
  };

  // Helper function untuk membuat transaksi keuangan dari donasi
  const createKeuanganTransactionFromDonation = async (donation: Donation): Promise<void> => {
    // Validasi: Donasi barang tidak boleh membuat transaksi kas
    if (donation.donation_type === 'in_kind') {
      return; // Skip untuk donasi barang
    }

    // Validasi: Harus ada cash_amount
    if (!donation.cash_amount || donation.cash_amount <= 0) {
      throw new Error('Donasi tunai harus memiliki jumlah uang yang valid');
    }

    // Validasi: Harus ada tanggal_setoran
    if (!donation.tanggal_setoran) {
      throw new Error('Tanggal setoran harus diisi untuk membuat transaksi keuangan');
    }

    // Cek apakah sudah ada transaksi keuangan untuk donasi ini
    const existingTransaction = await checkExistingKeuanganTransaction(donation.id);
    if (existingTransaction) {
      console.log(`Transaksi keuangan untuk donasi ${donation.id} sudah ada, skip pembuatan`);
      return; // Sudah ada, tidak perlu membuat lagi
    }

    // Tentukan akun_kas_id
    let akunKasId = donation.akun_kas_id || null;
    
    // Jika akun_kas_id belum ada, coba auto-route berdasarkan kategori_donasi
    if (!akunKasId && donation.kategori_donasi) {
      akunKasId = await getAkunKasIdByKategori(donation.kategori_donasi);
    }

    // Jika masih belum ada, ambil default account
    if (!akunKasId) {
      const { data: defaultAccount, error: defaultError } = await supabase
        .from('akun_kas')
        .select('id')
        .eq('is_default', true)
        .eq('status', 'aktif')
        .limit(1)
        .maybeSingle();
      
      if (defaultError || !defaultAccount) {
        throw new Error('Tidak dapat menentukan akun kas untuk transaksi ini');
      }
      
      akunKasId = defaultAccount.id;
    }

    // Mapping kategori donasi ke kategori keuangan
    const kategoriKeuangan = getKategoriKeuangan(donation.kategori_donasi);

    // Build deskripsi
    let deskripsi = `Donasi dari ${donation.donor_name}`;
    if (donation.kategori_donasi) {
      deskripsi += ` (${donation.kategori_donasi})`;
    }

    // Buat transaksi keuangan
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    const keuanganData = {
      tanggal: donation.tanggal_setoran,
      jenis_transaksi: 'Pemasukan',
      kategori: kategoriKeuangan,
      jumlah: donation.cash_amount,
      deskripsi: deskripsi,
      referensi: `donasi:${donation.id}`,
      akun_kas_id: akunKasId,
      status: 'posted',
      auto_posted: true,
      source_module: 'donasi',
      source_id: donation.id,
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: keuanganError } = await supabase
      .from('keuangan')
      .insert([keuanganData]);

    if (keuanganError) {
      throw new Error(`Gagal membuat transaksi keuangan: ${keuanganError.message}`);
    }
  };

  // Update status setoran
  const handleUpdateStatusSetoran = async (
    donationId: string, 
    statusSetoran: string,
    tanggalSetoran?: string | null,
    oldStatusSetoran?: string | null
  ) => {
    try {
      // Blokir perubahan dari 'Sudah disetor' → 'Belum disetor'
      if (oldStatusSetoran === 'Sudah disetor' && statusSetoran === 'Belum disetor') {
        toast.error('Status setoran yang sudah "Sudah disetor" tidak bisa dikembalikan menjadi "Belum disetor"');
        setEditingStatusSetoran(null);
        return;
      }

      // Ambil data donasi lengkap untuk validasi dan membuat transaksi
      const { data: donationData, error: donationError } = await supabase
        .from('donations')
        .select('*')
        .eq('id', donationId)
        .single();

      if (donationError) throw donationError;
      if (!donationData) throw new Error('Donasi tidak ditemukan');

      // Jika perubahan dari 'Belum disetor' → 'Sudah disetor'
      if ((oldStatusSetoran === 'Belum disetor' || !oldStatusSetoran) && statusSetoran === 'Sudah disetor') {
        // Set tanggal_setoran jika belum ada
        if (!tanggalSetoran) {
          tanggalSetoran = new Date().toISOString().split('T')[0];
        }

        // Pastikan akun_kas_id sudah terisi
        let finalAkunKasId = donationData.akun_kas_id;
        
        // Jika belum ada, coba auto-route berdasarkan kategori_donasi
        if (!finalAkunKasId && donationData.kategori_donasi) {
          finalAkunKasId = await getAkunKasIdByKategori(donationData.kategori_donasi);
          
          // Update akun_kas_id di donations jika ditemukan
          if (finalAkunKasId) {
            const { error: updateAkunError } = await supabase
              .from('donations')
              .update({ akun_kas_id: finalAkunKasId })
              .eq('id', donationId);
            
            if (updateAkunError) {
              console.warn('Warning: Gagal update akun_kas_id:', updateAkunError);
            }
          }
        }

        // Cek apakah sudah ada transaksi keuangan untuk donasi ini
        const existingTransaction = await checkExistingKeuanganTransaction(donationId);
        
        // Buat transaksi keuangan jika belum ada (hanya untuk donasi tunai/campuran, bukan barang)
        if (!existingTransaction && donationData.donation_type !== 'in_kind') {
          // Siapkan data donasi untuk membuat transaksi
          const donationForTransaction: Donation = {
            ...donationData,
            akun_kas_id: finalAkunKasId || donationData.akun_kas_id,
            tanggal_setoran: tanggalSetoran || donationData.tanggal_setoran
          } as Donation;

          await createKeuanganTransactionFromDonation(donationForTransaction);
        }
      }

      // Update status setoran dan tanggal setoran
      const updateData: any = { status_setoran: statusSetoran };
      if (statusSetoran === 'Sudah disetor' && tanggalSetoran) {
        updateData.tanggal_setoran = tanggalSetoran;
      } else if (statusSetoran === 'Belum disetor') {
        updateData.tanggal_setoran = null;
      }
      
      const { error } = await supabase
        .from('donations')
        .update(updateData)
        .eq('id', donationId);
      
      if (error) throw error;
      
      toast.success('Status setoran berhasil diupdate');
      setEditingStatusSetoran(null);
      
      // Trigger window reload to refresh data
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error: any) {
      console.error('Error updating status setoran:', error);
      toast.error('Gagal mengupdate status setoran: ' + error.message);
    }
  };

  const getDonationTypeIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'in_kind':
        return <Package className="h-4 w-4 text-blue-600" />;
      case 'mixed':
        return <Package className="h-4 w-4 text-purple-600" />;
      default:
        return <Heart className="h-4 w-4 text-rose-600" />;
    }
  };

  const getKategoriDonasiIcon = (kategori: string | null | undefined) => {
    if (!kategori) return null;
    
    switch (kategori) {
      case 'Orang Tua Asuh Pendidikan':
        return <GraduationCap className="h-3.5 w-3.5 text-blue-600" />;
      case 'Pembangunan':
        return <Building2 className="h-3.5 w-3.5 text-orange-600" />;
      case 'Donasi Umum':
        return <HeartHandshake className="h-3.5 w-3.5 text-green-600" />;
      default:
        return <Heart className="h-3.5 w-3.5 text-gray-600" />;
    }
  };


  const getDonationTypeLabel = (type: string) => {
    switch (type) {
      case 'cash':
        return 'Tunai';
      case 'in_kind':
        return 'Barang';
      case 'mixed':
        return 'Campuran';
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'posted': { color: 'bg-green-100 text-green-800', label: 'Diposting' },
      'received': { color: 'bg-blue-100 text-blue-800', label: 'Diterima' },
      'pending': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      'cancelled': { color: 'bg-red-100 text-red-800', label: 'Dibatalkan' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['pending'];
    return <Badge className={config.color} variant="secondary">{config.label}</Badge>;
  };

  // Get unique types for filter
  const uniqueTypes = Array.from(new Set(donations.map(d => d.donation_type)));

  // Date filter logic
  const getDateFilter = (donation: Donation) => {
    const donationDate = new Date(donation.donation_date);
    const now = new Date();
    
    switch (dateFilter) {
      case 'today':
        return donationDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return donationDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return donationDate >= monthAgo;
      case 'custom':
        if (!customStartDate || !customEndDate) return true;
        return donationDate >= customStartDate && donationDate <= customEndDate;
      default:
        return true;
    }
  };

  const filteredDonations = donations.filter(donation => {
    const s = (searchTerm || '').toLowerCase();
    const donorName = (donation.donor_name || '').toLowerCase();
    const donorEmail = (donation.donor_email || '').toLowerCase();
    const notes = (donation.notes || '').toLowerCase();
    const matchesSearch = donorName.includes(s) || donorEmail.includes(s) || notes.includes(s);
    
    // Filter by type: jika filterType = 'cash', include juga 'mixed' yang punya cash_amount
    let matchesType = true;
    if (filterType === 'all') {
      matchesType = true;
    } else if (filterType === 'cash') {
      // Include cash donations dan mixed donations yang punya cash_amount
      matchesType = donation.donation_type === 'cash' || 
                   (donation.donation_type === 'mixed' && donation.cash_amount && donation.cash_amount > 0);
    } else {
      matchesType = donation.donation_type === filterType;
    }
    
    const matchesStatus = filterStatus === 'all' || donation.status === filterStatus;
    const matchesDate = getDateFilter(donation);
    
    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  // Sort donations
  const sortedDonations = [...filteredDonations].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'donation_date':
        aValue = new Date(a.donation_date).getTime();
        bValue = new Date(b.donation_date).getTime();
        break;
      case 'cash_amount':
        aValue = a.cash_amount || 0;
        bValue = b.cash_amount || 0;
        break;
      case 'donor_name':
        aValue = a.donor_name.toLowerCase();
        bValue = b.donor_name.toLowerCase();
        break;
      default:
        aValue = new Date(a.donation_date).getTime();
        bValue = new Date(b.donation_date).getTime();
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : (aValue < bValue ? -1 : 0);
    } else {
      return aValue < bValue ? 1 : (aValue > bValue ? -1 : 0);
    }
  });

  // Filter donations by item type tab (for display)
  const donationsFilteredByTab = sortedDonations.filter((donation) => {
    if (itemTypeTab === 'all') return true;
    
    // For inventory/makanan tabs, only show donations that have items of that type
    // Skip cash-only donations (they don't have items)
    if (donation.donation_type === 'cash') return false;
    
    // Must have items and at least one item matching the selected tab
    if (!donation.items || donation.items.length === 0) return false;
    return donation.items.some(item => item.item_type === itemTypeTab);
  });

  // Pagination logic (after tab filter)
  const totalPages = Math.ceil(donationsFilteredByTab.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDonations = donationsFilteredByTab.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, filterStatus, dateFilter, itemTypeTab]);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <Card className="rounded-lg border border-gray-200 shadow-sm bg-white">
      <CardHeader className="pb-3 pt-3 px-3 sm:px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-sm sm:text-base font-medium text-gray-900">Riwayat Donasi</CardTitle>
            <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">
              Daftar lengkap donasi
            </p>
          </div>
          {selectedDonorName && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-xs px-2 py-0.5">
                {selectedDonorName}
              </Badge>
              {onClearFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilter}
                  className="h-7 px-2 text-xs"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4">
        {/* Filters */}
        <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-5">
          {/* Search and Basic Filters */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <div className="relative flex-1 min-w-[150px] sm:min-w-[200px]">
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              <Input
                placeholder="Cari donatur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 sm:pl-10 h-8 sm:h-9 text-xs sm:text-sm"
              />
            </div>
            
            {/* Type Filter */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[100px] sm:w-[130px] h-8 sm:h-9 text-xs border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="cash">Tunai</SelectItem>
                <SelectItem value="in_kind">Barang</SelectItem>
                <SelectItem value="mixed">Campuran</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[100px] sm:w-[130px] h-8 sm:h-9 text-xs border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="received">Diterima</SelectItem>
                <SelectItem value="posted">Diposting</SelectItem>
                <SelectItem value="cancelled">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[140px] sm:w-[180px] h-8 sm:h-9 text-xs border-gray-200 justify-start text-left font-normal",
                    !dateFilter && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">
                    {dateFilter === 'today' && 'Hari Ini'}
                    {dateFilter === 'week' && '7 Hari Terakhir'}
                    {dateFilter === 'month' && '30 Hari Terakhir'}
                    {dateFilter === 'custom' && customStartDate && customEndDate && 
                      `${formatDate(customStartDate.toISOString())} - ${formatDate(customEndDate.toISOString())}`}
                    {dateFilter === 'all' && 'Semua Tanggal'}
                  </span>
                  <span className="sm:hidden">Tanggal</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3 space-y-2">
                  <Button
                    variant={dateFilter === 'all' ? 'default' : 'ghost'}
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => {
                      setDateFilter('all');
                      setShowDatePicker(false);
                    }}
                  >
                    Semua Tanggal
                  </Button>
                  <Button
                    variant={dateFilter === 'today' ? 'default' : 'ghost'}
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => {
                      setDateFilter('today');
                      setShowDatePicker(false);
                    }}
                  >
                    Hari Ini
                  </Button>
                  <Button
                    variant={dateFilter === 'week' ? 'default' : 'ghost'}
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => {
                      setDateFilter('week');
                      setShowDatePicker(false);
                    }}
                  >
                    7 Hari Terakhir
                  </Button>
                  <Button
                    variant={dateFilter === 'month' ? 'default' : 'ghost'}
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => {
                      setDateFilter('month');
                      setShowDatePicker(false);
                    }}
                  >
                    30 Hari Terakhir
                  </Button>
                  <div className="border-t pt-2">
                    <p className="text-xs text-gray-500 mb-2 px-2">Rentang Kustom</p>
                    <CalendarComponent
                      mode="range"
                      selected={{ from: customStartDate, to: customEndDate }}
                      onSelect={(range) => {
                        if (range?.from && range?.to) {
                          setCustomStartDate(range.from);
                          setCustomEndDate(range.to);
                          setDateFilter('custom');
                          setShowDatePicker(false);
                        }
                      }}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Item Type Tabs - Only show if there are items */}
        {sortedDonations.some(d => d.items && d.items.length > 0) && (
          <div className="mb-4 border-b border-gray-200">
            <div className="flex gap-1">
              <button
                onClick={() => setItemTypeTab('all')}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                  itemTypeTab === 'all'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setItemTypeTab('inventory')}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
                  itemTypeTab === 'inventory'
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Box className="h-4 w-4" />
                Inventaris
              </button>
              <button
                onClick={() => setItemTypeTab('direct_consumption')}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
                  itemTypeTab === 'direct_consumption'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Utensils className="h-4 w-4" />
                Makanan
              </button>
            </div>
          </div>
        )}

        {/* Table - Responsive dengan card view untuk mobile */}
        {currentDonations.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-sm text-gray-500">Tidak ada donasi yang ditemukan</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto -mx-4 px-4">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        <button
                          onClick={() => handleSort('donation_date')}
                          className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                        >
                          Tanggal
                          {sortBy === 'donation_date' && (
                            <span className="text-gray-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        <button
                          onClick={() => handleSort('donor_name')}
                          className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                        >
                          Donatur
                          {sortBy === 'donor_name' && (
                            <span className="text-gray-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Tipe / Kategori
                      </th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Rincian Item
                      </th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        <button
                          onClick={() => handleSort('cash_amount')}
                          className="flex items-center gap-1 ml-auto hover:text-gray-900 transition-colors"
                        >
                          Jumlah
                          {sortBy === 'cash_amount' && (
                            <span className="text-gray-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Status / Setoran
                      </th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentDonations.map((donation) => {
                      // Filter items based on selected tab
                      const filteredItems = donation.items?.filter(item => {
                        if (itemTypeTab === 'all') return true;
                        return item.item_type === itemTypeTab;
                      }) || [];

                      return (
                        <tr key={donation.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-2 px-3 text-xs text-gray-900 whitespace-nowrap">
                            {formatDate(donation.donation_date)}
                          </td>
                          <td className="py-2 px-3">
                            <div className="text-xs font-medium text-gray-900">{donation.donor_name}</div>
                            {donation.donor_email && (
                              <div className="text-xs text-gray-500 truncate max-w-[150px]">{donation.donor_email}</div>
                            )}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                {getDonationTypeIcon(donation.donation_type)}
                                <span className="text-xs text-gray-700">{getDonationTypeLabel(donation.donation_type)}</span>
                              </div>
                              {donation.kategori_donasi && (
                                <div className="flex items-center gap-1.5">
                                  {getKategoriDonasiIcon(donation.kategori_donasi)}
                                  <span className="text-[10px] text-gray-500 truncate max-w-[120px]" title={donation.kategori_donasi || ''}>
                                    {donation.kategori_donasi}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            {filteredItems.length > 0 ? (
                              <div className="space-y-0.5 max-w-[300px]">
                                {filteredItems.slice(0, 2).map((item, idx) => (
                                  <div key={idx} className="flex items-start gap-1.5 text-xs">
                                    {item.item_type === 'inventory' ? (
                                      <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-[10px] px-1.5 py-0 h-4 flex items-center gap-1 flex-shrink-0">
                                        <Box className="h-2.5 w-2.5" />
                                        Inventaris
                                      </Badge>
                                    ) : item.item_type === 'direct_consumption' ? (
                                      <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] px-1.5 py-0 h-4 flex items-center gap-1 flex-shrink-0">
                                        <Utensils className="h-2.5 w-2.5" />
                                        Makanan
                                      </Badge>
                                    ) : null}
                                    <div className="flex-1 min-w-0">
                                      <span className="text-gray-700 truncate block">{item.raw_item_name}</span>
                                      <span className="text-gray-500 text-[10px]">({item.quantity} {item.uom})</span>
                                    </div>
                                  </div>
                                ))}
                                {filteredItems.length > 2 && (
                                  <div className="text-[10px] text-gray-500 ml-4">+{filteredItems.length - 2} item lainnya</div>
                                )}
                              </div>
                            ) : donation.items && donation.items.length > 0 ? (
                              <span className="text-xs text-gray-400">Tidak ada item di kategori ini</span>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right whitespace-nowrap">
                            {(() => {
                              if (donation.donation_type === 'cash' && donation.cash_amount) {
                                return (
                                  <div className="text-xs font-semibold text-gray-900">
                                    {formatCurrency(donation.cash_amount)}
                                  </div>
                                );
                              }
                              if (donation.donation_type === 'mixed' && donation.cash_amount) {
                                return (
                                  <div className="text-xs font-semibold text-gray-900">
                                    {formatCurrency(donation.cash_amount)}
                                  </div>
                                );
                              }
                              if (donation.donation_type === 'in_kind' && donation.items && donation.items.length > 0) {
                                const hasDirectConsumptionOnly = donation.items.every(item => 
                                  item.item_type === 'direct_consumption'
                                );
                                const hasInventoryItems = donation.items.some(item => 
                                  item.item_type === 'inventory'
                                );
                                if (hasDirectConsumptionOnly && !hasInventoryItems) {
                                  return <div className="text-xs text-gray-400">-</div>;
                                }
                                if (hasInventoryItems) {
                                  const totalEstimatedValue = donation.items
                                    .filter(item => item.item_type === 'inventory' && item.estimated_value)
                                    .reduce((sum, item) => sum + ((item.estimated_value || 0) * item.quantity), 0);
                                  if (totalEstimatedValue > 0) {
                                    return (
                                      <div className="text-xs font-semibold text-gray-900">
                                        {formatCurrency(totalEstimatedValue)}
                                      </div>
                                    );
                                  }
                                }
                              }
                              return <div className="text-xs text-gray-500">-</div>;
                            })()}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <div className="flex flex-col gap-1.5">
                              {getStatusBadge(donation.status)}
                              {/* Status Setoran */}
                              {editingStatusSetoran === donation.id ? (
                                <div className="space-y-1">
                                  <Select
                                    value={donation.status_setoran || "Belum disetor"}
                                    onValueChange={(value) => {
                                      const oldStatus = donation.status_setoran || "Belum disetor";
                                      if (value === "Sudah disetor") {
                                        const today = new Date().toISOString().split('T')[0];
                                        handleUpdateStatusSetoran(donation.id, value, donation.tanggal_setoran || today, oldStatus);
                                      } else {
                                        handleUpdateStatusSetoran(donation.id, value, null, oldStatus);
                                      }
                                    }}
                                    onOpenChange={(open) => {
                                      if (!open) setEditingStatusSetoran(null);
                                    }}
                                  >
                                    <SelectTrigger className="h-7 text-xs w-[140px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Belum disetor">Belum disetor</SelectItem>
                                      <SelectItem value="Sudah disetor">Sudah disetor</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {donation.status_setoran === "Sudah disetor" && donation.tanggal_setoran && (
                                    <div className="text-[10px] text-gray-500">
                                      {formatDate(donation.tanggal_setoran)}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div
                                  className="text-xs cursor-pointer hover:text-blue-600 hover:underline"
                                  onClick={() => setEditingStatusSetoran(donation.id)}
                                >
                                  <div className="flex items-center gap-1">
                                    {donation.status_setoran === "Sudah disetor" ? (
                                      <>
                                        <CheckCircle className="h-3 w-3 text-green-600" />
                                        <span className="text-green-700 font-medium">Sudah disetor</span>
                                      </>
                                    ) : (
                                      <>
                                        <Clock className="h-3 w-3 text-gray-400" />
                                        <span className="text-gray-600">Belum disetor</span>
                                      </>
                                    )}
                                  </div>
                                  {donation.status_setoran === "Sudah disetor" && donation.tanggal_setoran && (
                                    <div className="text-[10px] text-gray-500 mt-0.5">
                                      {formatDate(donation.tanggal_setoran)}
                                    </div>
                                  )}
                                  {/* Badge "Masuk kas" jika sudah ada transaksi keuangan */}
                                  {donation.status_setoran === "Sudah disetor" && donation.has_keuangan_transaction && (
                                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0 h-4 flex items-center gap-1 mt-1">
                                      <DollarSign className="h-2.5 w-2.5" />
                                      Masuk kas
                                    </Badge>
                                  )}
                                </div>
                              )}
                              {/* Penerima Awal - Compact */}
                              {donation.penerima_awal?.full_name && (
                                <div className="text-[10px] text-gray-500 flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  <span className="truncate max-w-[120px]" title={donation.penerima_awal.full_name}>
                                    {donation.penerima_awal.full_name}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center justify-end gap-0.5">
                              {onPrintNota && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onPrintNota(donation)}
                                  className="h-7 w-7 p-0"
                                  title="Print Nota"
                                >
                                  <Printer className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {onViewDetail && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onViewDetail(donation)}
                                  className="h-7 w-7 p-0"
                                  title="Lihat Detail"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Menu">
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {onEditDonation && (
                                    <DropdownMenuItem onClick={() => onEditDonation(donation)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                  )}
                                  {onDeleteDonation && (
                                    <DropdownMenuItem 
                                      onClick={() => onDeleteDonation(donation)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Hapus
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {currentDonations.map((donation) => {
                const filteredItems = donation.items?.filter(item => {
                  if (itemTypeTab === 'all') return true;
                  return item.item_type === itemTypeTab;
                }) || [];

                return (
                  <div key={donation.id} className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getDonationTypeIcon(donation.donation_type)}
                          <span className="text-sm font-semibold text-gray-900 truncate">{donation.donor_name}</span>
                        </div>
                        {donation.kategori_donasi && (
                          <div className="flex items-center gap-1.5 mb-1">
                            {getKategoriDonasiIcon(donation.kategori_donasi)}
                            <span className="text-[10px] text-gray-500">{donation.kategori_donasi}</span>
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mb-2">{formatDate(donation.donation_date)}</div>
                        {donation.donor_email && (
                          <div className="text-xs text-gray-500 truncate">{donation.donor_email}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {onPrintNota && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onPrintNota(donation)}
                            className="h-7 w-7 p-0"
                            title="Print Nota"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        )}
                        {onViewDetail && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewDetail(donation)}
                            className="h-7 w-7 p-0"
                            title="Lihat Detail"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onEditDonation && (
                              <DropdownMenuItem onClick={() => onEditDonation(donation)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {onDeleteDonation && (
                              <DropdownMenuItem 
                                onClick={() => onDeleteDonation(donation)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Hapus
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    
                    {filteredItems.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-gray-100">
                        {filteredItems.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs">
                            {item.item_type === 'inventory' ? (
                              <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-[10px] px-1.5 py-0.5 h-5 flex items-center gap-1 flex-shrink-0">
                                <Box className="h-2.5 w-2.5" />
                                Inventaris
                              </Badge>
                            ) : item.item_type === 'direct_consumption' ? (
                              <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] px-1.5 py-0.5 h-5 flex items-center gap-1 flex-shrink-0">
                                <Utensils className="h-2.5 w-2.5" />
                                Makanan
                              </Badge>
                            ) : null}
                            <div className="flex-1 min-w-0">
                              <span className="text-gray-700">{item.raw_item_name}</span>
                              <span className="text-gray-500 ml-1">({item.quantity} {item.uom})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div>
                        {(() => {
                          if (donation.donation_type === 'cash' && donation.cash_amount) {
                            return <div className="text-sm font-semibold text-gray-900">{formatCurrency(donation.cash_amount)}</div>;
                          }
                          if (donation.donation_type === 'mixed' && donation.cash_amount) {
                            return <div className="text-sm font-semibold text-gray-900">{formatCurrency(donation.cash_amount)}</div>;
                          }
                          return null;
                        })()}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {getStatusBadge(donation.status)}
                        {/* Status Setoran - Compact */}
                        {donation.status_setoran === "Sudah disetor" ? (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span className="text-[10px] text-green-700">Sudah disetor</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-[10px] text-gray-500">Belum disetor</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Penerima Awal & Status Setoran - Mobile View (untuk edit) */}
                    <div className="pt-2 border-t border-gray-100 space-y-2">
                      <div>
                        <div className="text-[10px] text-gray-500 mb-1">Penerima Awal</div>
                        {editingPenerimaAwal === donation.id ? (
                          <Select
                            value={donation.penerima_awal_id || undefined}
                            onValueChange={(value) => {
                              if (value === "__none__") {
                                handleUpdatePenerimaAwal(donation.id, null);
                              } else {
                                handleUpdatePenerimaAwal(donation.id, value);
                              }
                            }}
                            onOpenChange={(open) => {
                              if (!open) setEditingPenerimaAwal(null);
                            }}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue placeholder="Pilih penerima" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">Tidak dipilih</SelectItem>
                              {pengurusList.map((pengurus) => (
                                <SelectItem key={pengurus.id} value={pengurus.id}>
                                  {pengurus.full_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div
                            className="text-xs text-gray-700 cursor-pointer hover:text-blue-600 hover:underline"
                            onClick={() => setEditingPenerimaAwal(donation.id)}
                          >
                            {donation.penerima_awal?.full_name || (
                              <span className="text-gray-400 italic">Klik untuk set</span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <div className="text-[10px] text-gray-500 mb-1">Status Setoran</div>
                        {editingStatusSetoran === donation.id ? (
                          <div className="space-y-1">
                            <Select
                              value={donation.status_setoran || "Belum disetor"}
                              onValueChange={(value) => {
                                const oldStatus = donation.status_setoran || "Belum disetor";
                                if (value === "Sudah disetor") {
                                  const today = new Date().toISOString().split('T')[0];
                                  handleUpdateStatusSetoran(donation.id, value, donation.tanggal_setoran || today, oldStatus);
                                } else {
                                  handleUpdateStatusSetoran(donation.id, value, null, oldStatus);
                                }
                              }}
                              onOpenChange={(open) => {
                                if (!open) setEditingStatusSetoran(null);
                              }}
                            >
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Belum disetor">Belum disetor</SelectItem>
                                <SelectItem value="Sudah disetor">Sudah disetor</SelectItem>
                              </SelectContent>
                            </Select>
                            {donation.status_setoran === "Sudah disetor" && donation.tanggal_setoran && (
                              <div className="text-[10px] text-gray-500">
                                {formatDate(donation.tanggal_setoran)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div
                            className="text-xs cursor-pointer hover:text-blue-600 hover:underline"
                            onClick={() => setEditingStatusSetoran(donation.id)}
                          >
                            <div className="flex items-center gap-1">
                              {donation.status_setoran === "Sudah disetor" ? (
                                <>
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                  <span className="text-green-700 font-medium">Sudah disetor</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="h-3 w-3 text-gray-400" />
                                  <span className="text-gray-600">Belum disetor</span>
                                </>
                              )}
                            </div>
                            {donation.status_setoran === "Sudah disetor" && donation.tanggal_setoran && (
                              <div className="text-[10px] text-gray-500 mt-0.5">
                                {formatDate(donation.tanggal_setoran)}
                              </div>
                            )}
                            {/* Badge "Masuk kas" jika sudah ada transaksi keuangan */}
                            {donation.status_setoran === "Sudah disetor" && donation.has_keuangan_transaction && (
                              <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0 h-4 flex items-center gap-1 mt-1">
                                <DollarSign className="h-2.5 w-2.5" />
                                Masuk kas
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-200">
                <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                  Menampilkan {startIndex + 1}-{Math.min(endIndex, donationsFilteredByTab.length)} dari {donationsFilteredByTab.length} donasi
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="h-7 sm:h-8 text-xs px-2 sm:px-3"
                  >
                    <span className="hidden sm:inline">Sebelumnya</span>
                    <span className="sm:hidden">Prev</span>
                  </Button>
                  <div className="text-xs sm:text-sm text-gray-700 px-2">
                    {currentPage}/{totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="h-7 sm:h-8 text-xs px-2 sm:px-3"
                  >
                    <span className="hidden sm:inline">Selanjutnya</span>
                    <span className="sm:hidden">Next</span>
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DonationHistory;

