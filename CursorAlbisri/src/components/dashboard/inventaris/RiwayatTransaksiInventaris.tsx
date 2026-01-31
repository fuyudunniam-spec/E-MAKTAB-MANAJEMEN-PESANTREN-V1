import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, ArrowUpRight, ArrowDownLeft, X, Calendar, Edit, Trash2, Eye, ArrowRight, Plus, Download, Package, ChevronDown, ChevronRight, AlertTriangle, RefreshCw } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import TransactionForm from '@/components/inventaris/TransactionForm';
import { deleteTransaction } from '@/services/inventaris.service';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { formatRupiah, exportToCSV } from '@/utils/inventaris.utils';

interface InventarisTransaction {
  id: string;
  tanggal: string;
  tipe: 'Masuk' | 'Keluar' | 'Stocktake';
  keluar_mode?: string | null;
  masuk_mode?: string | null;
  nama_barang: string;
  kategori?: string;
  jumlah: number;
  satuan?: string;
  penerima?: string | null;
  catatan?: string | null;
  harga_satuan?: number | null;
  harga_total?: number | null;
  harga_dasar?: number | null;
  sumbangan?: number | null;
  before_qty?: number | null;
  after_qty?: number | null;
  created_at: string;
  referensi_distribusi_paket_id?: string | null;
  distribusi_paket?: {
    paket_sembako?: {
      nama_paket?: string;
    };
    penerima?: string;
    tanggal_distribusi?: string;
  } | null;
}

interface RiwayatTransaksiInventarisProps {
  transactions: InventarisTransaction[];
  onRefresh?: () => void;
  compact?: boolean;
  initialFilter?: {
    tipe?: 'Masuk' | 'Keluar' | 'Stocktake' | 'all';
    mode?: string;
    fromModule?: 'master' | 'penjualan' | 'distribusi' | null;
  };
  onNavigateToModule?: (module: 'master' | 'penjualan' | 'distribusi' | 'transactions') => void;
}

const RiwayatTransaksiInventaris: React.FC<RiwayatTransaksiInventarisProps> = ({
  transactions,
  onRefresh,
  compact = false,
  initialFilter,
  onNavigateToModule
}) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>(initialFilter?.tipe || 'all');
  const [filterMode, setFilterMode] = useState<string>(initialFilter?.mode || 'all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(compact ? 5 : 20);
  const [sortBy, setSortBy] = useState<string>('tanggal');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNewTransactionForm, setShowNewTransactionForm] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<InventarisTransaction | null>(null);
  const [expandedPaket, setExpandedPaket] = useState<Set<string>>(new Set());

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string, useTime: boolean = false) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    };
    if (useTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    return date.toLocaleDateString('id-ID', options);
  };
  
  const formatDateWithTime = (transaction: InventarisTransaction) => {
    const dateStr = transaction.tanggal;
    const createdStr = transaction.created_at;
    
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    let timeStr = '';
    
    if (createdStr) {
      const createdDate = new Date(createdStr);
      timeStr = createdDate.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } else {
      timeStr = date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
    
    const dateFormatted = date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    
    return `${dateFormatted}, ${timeStr}`;
  };

  const getTransactionIcon = (tipe: string) => {
    if (tipe === 'Masuk') {
      return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    } else if (tipe === 'Keluar') {
      return <ArrowDownLeft className="h-4 w-4 text-red-600" />;
    } else if (tipe === 'Stocktake') {
      return <RefreshCw className="h-4 w-4 text-blue-600" />;
    }
    return <ArrowDownLeft className="h-4 w-4 text-gray-600" />;
  };

  const getModeBadge = (mode: string | null | undefined, tipe: string) => {
    if (!mode) return null;
    
    const modeConfig: Record<string, { color: string; label: string }> = {
      'Penjualan': { color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Penjualan' },
      'Distribusi': { color: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Distribusi' },
      'Pembelian': { color: 'bg-green-50 text-green-700 border-green-200', label: 'Pembelian' },
      'Donasi': { color: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Donasi' },
    };
    
    const config = modeConfig[mode] || { color: 'bg-gray-50 text-gray-700 border-gray-200', label: mode };
    return <Badge variant="outline" className={`text-xs ${config.color}`}>{config.label}</Badge>;
  };

  const getTypeBadge = (tipe: string) => {
    switch (tipe) {
      case 'Masuk':
        return <Badge variant="default" className="bg-green-600">Masuk</Badge>;
      case 'Keluar':
        return <Badge variant="destructive">Keluar</Badge>;
      case 'Stocktake':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Stocktake</Badge>;
      default:
        return <Badge variant="outline">{tipe}</Badge>;
    }
  };

  // Group transactions by distribusi paket
  const groupedTransactions = useMemo(() => {
    const grouped: Map<string, InventarisTransaction[]> = new Map();
    const standalone: InventarisTransaction[] = [];

    transactions.forEach((trans) => {
      const paketId = trans.referensi_distribusi_paket_id;
      
      if (paketId && trans.keluar_mode === 'Distribusi') {
        if (!grouped.has(paketId)) {
          grouped.set(paketId, []);
        }
        grouped.get(paketId)!.push(trans);
      } else {
        standalone.push(trans);
      }
    });

    const groupedArray = Array.from(grouped.entries()).map(([paketId, transaksi]) => {
      const firstTrans = transaksi[0];
      const distribusiPaket = firstTrans.distribusi_paket;
      
      return {
        id: `paket-${paketId}`,
        isPaket: true,
        paketId,
        paketNama: distribusiPaket?.paket_sembako?.nama_paket || 'Paket Sembako',
        penerima: distribusiPaket?.penerima || firstTrans.penerima,
        tanggal: distribusiPaket?.tanggal_distribusi || firstTrans.tanggal,
        transaksi: transaksi,
        jumlahItem: transaksi.length,
        tipe: 'Keluar' as const,
        keluar_mode: 'Distribusi',
        catatan: `Distribusi paket: ${distribusiPaket?.paket_sembako?.nama_paket || 'Paket'} ke ${distribusiPaket?.penerima || firstTrans.penerima}`,
        nama_barang: distribusiPaket?.paket_sembako?.nama_paket || 'Paket Sembako',
        jumlah: 0,
        created_at: firstTrans.created_at
      };
    });

    const allTransactions = [...groupedArray, ...standalone];
    return allTransactions.sort((a, b) => {
      const dateA = a.tanggal || a.created_at || '';
      const dateB = b.tanggal || b.created_at || '';
      return dateB.localeCompare(dateA);
    });
  }, [transactions]);

  // Get unique modes for filter
  // Pastikan mode "Distribusi" selalu tersedia karena penting untuk modul distribusi
  const uniqueModes = Array.from(new Set(
    [
      ...transactions.map(t => t.tipe === 'Keluar' ? t.keluar_mode : t.masuk_mode).filter(Boolean),
      'Distribusi', // Selalu sertakan Distribusi untuk memastikan filter tersedia
      'Penjualan', // Selalu sertakan Penjualan untuk konsistensi
      'Pembelian', // Selalu sertakan Pembelian untuk konsistensi
      'Donasi' // Selalu sertakan Donasi untuk konsistensi
    ]
  )).filter(Boolean);

  // Date filter logic
  const getDateFilter = (transaction: InventarisTransaction | any) => {
    const transactionDate = new Date(transaction.tanggal);
    const now = new Date();
    
    switch (dateFilter) {
      case 'today':
        return transactionDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return transactionDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return transactionDate >= monthAgo;
      case 'custom':
        if (!customStartDate || !customEndDate) return true;
        return transactionDate >= customStartDate && transactionDate <= customEndDate;
      default:
        return true;
    }
  };

  const filteredTransactions = groupedTransactions.filter((transaction: any) => {
    const s = (searchTerm || '').toLowerCase();
    const namaBarang = (transaction.nama_barang || '').toLowerCase();
    const penerima = (transaction.penerima || '').toLowerCase();
    const catatan = (transaction.catatan || '').toLowerCase();
    const matchesSearch = namaBarang.includes(s) || penerima.includes(s) || catatan.includes(s);
    
    const matchesType = filterType === 'all' || transaction.tipe === filterType;
    
    // Logika filter mode:
    // - Jika filterMode === 'all', tampilkan semua (kecuali jika filterType spesifik)
    // - Jika filterMode spesifik, hanya tampilkan transaksi dengan mode yang sesuai
    // - Stocktake tidak punya mode, jadi hanya tampilkan jika filterMode === 'all' atau filterType === 'Stocktake'
    const matchesMode = filterMode === 'all' 
      ? true // Jika filter mode 'all', tampilkan semua (filter tipe akan mengatur)
      : transaction.tipe === 'Stocktake' 
        ? false // Stocktake tidak punya mode, jangan tampilkan jika filter mode spesifik
        : (transaction.tipe === 'Keluar' && transaction.keluar_mode === filterMode) ||
          (transaction.tipe === 'Masuk' && transaction.masuk_mode === filterMode);
    
    const matchesDate = getDateFilter(transaction);
    
    return matchesSearch && matchesType && matchesMode && matchesDate;
  });

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a: any, b: any) => {
    let aValue: any, bValue: any;
    let aTieBreaker: number, bTieBreaker: number;
    
    switch (sortBy) {
      case 'tanggal':
        aValue = new Date(a.tanggal).getTime();
        bValue = new Date(b.tanggal).getTime();
        aTieBreaker = a.created_at ? new Date(a.created_at).getTime() : 0;
        bTieBreaker = b.created_at ? new Date(b.created_at).getTime() : 0;
        break;
      case 'jumlah':
        aValue = a.jumlah || 0;
        bValue = b.jumlah || 0;
        aTieBreaker = a.created_at ? new Date(a.created_at).getTime() : 0;
        bTieBreaker = b.created_at ? new Date(b.created_at).getTime() : 0;
        break;
      case 'nama_barang':
        aValue = (a.nama_barang || '').toLowerCase();
        bValue = (b.nama_barang || '').toLowerCase();
        aTieBreaker = a.created_at ? new Date(a.created_at).getTime() : 0;
        bTieBreaker = b.created_at ? new Date(b.created_at).getTime() : 0;
        break;
      default:
        aValue = new Date(a.tanggal).getTime();
        bValue = new Date(b.tanggal).getTime();
        aTieBreaker = a.created_at ? new Date(a.created_at).getTime() : 0;
        bTieBreaker = b.created_at ? new Date(b.created_at).getTime() : 0;
    }
    
    let result = 0;
    if (sortOrder === 'asc') {
      result = aValue > bValue ? 1 : (aValue < bValue ? -1 : 0);
    } else {
      result = aValue < bValue ? 1 : (aValue > bValue ? -1 : 0);
    }
    
    if (result === 0 && aTieBreaker !== bTieBreaker) {
      return sortOrder === 'asc' 
        ? (aTieBreaker > bTieBreaker ? 1 : -1)
        : (aTieBreaker < bTieBreaker ? 1 : -1);
    }
    
    return result;
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = sortedTransactions.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, filterMode, dateFilter]);

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

  const handleViewDetail = (transaction: InventarisTransaction | any) => {
    if (transaction.isPaket) {
      // Untuk paket, ambil transaksi pertama untuk detail
      setSelectedTransaction(transaction.transaksi[0]);
    } else {
      setSelectedTransaction(transaction);
    }
    setShowViewModal(true);
  };

  const handleEditTransaction = (transaction: InventarisTransaction | any) => {
    if (transaction.isPaket) {
      toast.info('Edit distribusi paket harus dilakukan dari modul Distribusi');
      return;
    }
    setSelectedTransaction(transaction);
    setShowEditForm(true);
  };

  const handleDeleteTransaction = (transaction: InventarisTransaction | any) => {
    if (transaction.isPaket) {
      toast.info('Hapus distribusi paket harus dilakukan dari modul Distribusi');
      return;
    }
    setSelectedTransaction(transaction);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedTransaction) return;
    
    try {
      await deleteTransaction(selectedTransaction.id);
      toast.success('Transaksi berhasil dihapus');
      setShowDeleteConfirm(false);
      setSelectedTransaction(null);
      queryClient.invalidateQueries({ queryKey: ['transactions-history'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-master'] });
      onRefresh?.();
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      let errorMessage = 'Gagal menghapus transaksi';
      if (error?.code === 'PGRST116') {
        errorMessage = 'Transaksi tidak ditemukan atau sudah dihapus';
      } else if (error?.message) {
        errorMessage = `Gagal menghapus: ${error.message}`;
      }
      toast.error(errorMessage);
    }
  };

  const handleExportLaporan = () => {
    try {
      if (sortedTransactions.length === 0) {
        toast.error('Tidak ada data untuk diekspor');
        return;
      }

      const exportData = sortedTransactions
        .filter((t: any) => !t.isPaket) // Hanya transaksi standalone
        .map((trans: any) => ({
          "Tanggal": trans.tanggal || "",
          "Item": trans.nama_barang || "",
          "Tipe": trans.tipe || "",
          "Mode": trans.keluar_mode || trans.masuk_mode || "",
          "Jumlah": trans.jumlah || 0,
          "Satuan": trans.satuan || "",
          "Harga Satuan": trans.harga_satuan || 0,
          "Harga Total": (trans.jumlah || 0) * (trans.harga_satuan || 0),
          "Harga Dasar": trans.harga_dasar || 0,
          "Sumbangan": trans.sumbangan || 0,
          "Penerima": trans.penerima || "",
          "Catatan": trans.catatan || "",
          "Stok Sebelum": trans.before_qty || 0,
          "Stok Sesudah": trans.after_qty || 0,
          "Tanggal Dibuat": trans.created_at || ""
        }));

      const filename = `riwayat_transaksi_${new Date().toISOString().split('T')[0]}`;
      exportToCSV(exportData, filename);
      toast.success('Laporan berhasil diekspor');
    } catch (error: any) {
      console.error('Error exporting:', error);
      toast.error('Gagal mengekspor laporan');
    }
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setSelectedTransaction(null);
  };
  
  const handleCloseEditForm = () => {
    setShowEditForm(false);
    setSelectedTransaction(null);
    queryClient.invalidateQueries({ queryKey: ['transactions-history'] });
    queryClient.invalidateQueries({ queryKey: ['inventory-master'] });
    onRefresh?.();
  };

  const handleCloseNewTransactionForm = () => {
    setShowNewTransactionForm(false);
    queryClient.invalidateQueries({ queryKey: ['transactions-history'] });
    queryClient.invalidateQueries({ queryKey: ['inventory-master'] });
    onRefresh?.();
  };

  // Determine if we should show link to module
  const getModuleLink = () => {
    if (filterMode === 'Penjualan' && onNavigateToModule) {
      return { label: 'Lihat Semua Penjualan', path: 'penjualan' };
    }
    if (filterMode === 'Distribusi' && onNavigateToModule) {
      return { label: 'Lihat Semua Distribusi', path: 'distribusi' };
    }
    if (filterMode === 'Pembelian' && onNavigateToModule) {
      return { label: 'Lihat Master Data', path: 'master' };
    }
    return null;
  };

  const moduleLink = getModuleLink();
  const hasActiveFilter = filterType !== 'all' || filterMode !== 'all' || dateFilter !== 'all' || searchTerm;

  return (
    <>
      <Card className="rounded-lg border border-gray-200 shadow-sm bg-white">
        <CardHeader className="pb-4 pt-4 px-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-medium text-gray-900">Riwayat Transaksi</CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">
                {initialFilter?.fromModule 
                  ? `Filter dari modul ${initialFilter.fromModule === 'penjualan' ? 'Penjualan' : initialFilter.fromModule === 'distribusi' ? 'Distribusi' : 'Master Data'}`
                  : 'Daftar lengkap transaksi inventaris'
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!compact && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewTransactionForm(true)}
                    className="text-xs h-7"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Baru
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportLaporan}
                    disabled={sortedTransactions.length === 0}
                    className="text-xs h-7"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                </>
              )}
              {moduleLink && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigateToModule?.(moduleLink.path as any)}
                  className="text-xs h-7 border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  {moduleLink.label}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Active Filter Tags */}
          {hasActiveFilter && (
            <div className="flex flex-wrap gap-2 mb-4 pb-3 border-b">
              {filterMode !== 'all' && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  Mode: {filterMode}
                  <button
                    onClick={() => setFilterMode('all')}
                    className="ml-1 hover:text-blue-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filterType !== 'all' && (
                <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-200">
                  Tipe: {filterType}
                  <button
                    onClick={() => setFilterType('all')}
                    className="ml-1 hover:text-gray-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {dateFilter !== 'all' && (
                <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-200">
                  Tanggal: {dateFilter === 'today' ? 'Hari Ini' : dateFilter === 'week' ? '7 Hari' : dateFilter === 'month' ? '30 Hari' : 'Custom'}
                  <button
                    onClick={() => setDateFilter('all')}
                    className="ml-1 hover:text-gray-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {searchTerm && (
                <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-200">
                  Pencarian: {searchTerm}
                  <button
                    onClick={() => setSearchTerm('')}
                    className="ml-1 hover:text-gray-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}

          {/* Filters */}
          {!compact && (
            <div className="space-y-3 mb-5">
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari transaksi, item, atau penerima..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[130px] h-9 text-xs border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tipe</SelectItem>
                    <SelectItem value="Masuk">Masuk</SelectItem>
                    <SelectItem value="Keluar">Keluar</SelectItem>
                    <SelectItem value="Stocktake">Stocktake</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterMode} onValueChange={setFilterMode}>
                  <SelectTrigger className="w-[150px] h-9 text-xs border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Mode</SelectItem>
                    {uniqueModes.map(mode => (
                      <SelectItem key={mode} value={mode || ''}>{mode}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[130px] h-9 text-xs border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tanggal</SelectItem>
                    <SelectItem value="today">Hari Ini</SelectItem>
                    <SelectItem value="week">7 Hari</SelectItem>
                    <SelectItem value="month">30 Hari</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>

                {dateFilter === 'custom' && (
                  <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        {customStartDate && customEndDate 
                          ? `${customStartDate.toLocaleDateString('id-ID')} - ${customEndDate.toLocaleDateString('id-ID')}`
                          : 'Pilih Periode'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="p-4">
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Tanggal Mulai:</label>
                            <CalendarComponent
                              mode="single"
                              selected={customStartDate}
                              onSelect={setCustomStartDate}
                              className="rounded-md border"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Tanggal Akhir:</label>
                            <CalendarComponent
                              mode="single"
                              selected={customEndDate}
                              onSelect={setCustomEndDate}
                              className="rounded-md border"
                            />
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => setShowDatePicker(false)}
                            disabled={!customStartDate || !customEndDate}
                          >
                            Terapkan
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto -mx-4 sm:mx-0 pb-4 overflow-y-visible">
            <div className="min-w-[800px] px-4 sm:px-0 pb-2">
              <div className="grid grid-cols-12 gap-4 p-3 bg-gray-50 rounded-lg font-medium text-xs text-gray-600 border-b border-gray-200">
                <div 
                  className="col-span-3 sm:col-span-2 cursor-pointer hover:text-gray-900 flex items-center space-x-1"
                  onClick={() => handleSort('tanggal')}
                >
                  <span>Tanggal</span>
                  {sortBy === 'tanggal' && (
                    <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
                <div 
                  className="col-span-2 cursor-pointer hover:text-gray-900 flex items-center space-x-1"
                  onClick={() => handleSort('nama_barang')}
                >
                  <span>Item</span>
                  {sortBy === 'nama_barang' && (
                    <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
                <div className="col-span-2">Tipe/Mode</div>
                <div className="col-span-2 sm:col-span-2">Jumlah</div>
                <div className="col-span-2 hidden sm:block">Penerima</div>
                <div 
                  className="col-span-1 cursor-pointer hover:text-gray-900 flex items-center justify-end space-x-1"
                  onClick={() => handleSort('jumlah')}
                >
                  <span>Harga</span>
                  {sortBy === 'jumlah' && (
                    <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
                <div className="col-span-1 text-right">Aksi</div>
              </div>

              <div className="space-y-2">
                {currentTransactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Tidak ada transaksi ditemukan
                  </div>
                ) : (
                  currentTransactions.map((transaction: any) => {
                    // Jika ini distribusi paket
                    if (transaction.isPaket) {
                      const isExpanded = expandedPaket.has(transaction.paketId);
                      return (
                        <React.Fragment key={transaction.id}>
                          <div className={`grid grid-cols-12 gap-4 p-3 rounded-lg border transition-all duration-150 bg-blue-50/30 border-blue-200 hover:bg-blue-50`}>
                            <div className="col-span-3 sm:col-span-2 flex items-center gap-2">
                              <button
                                onClick={() => {
                                  const newExpanded = new Set(expandedPaket);
                                  if (isExpanded) {
                                    newExpanded.delete(transaction.paketId);
                                  } else {
                                    newExpanded.add(transaction.paketId);
                                  }
                                  setExpandedPaket(newExpanded);
                                }}
                                className="p-1 hover:bg-blue-100 rounded"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </button>
                              <Package className="h-4 w-4 text-blue-600" />
                              <span className="text-xs font-medium text-gray-900">
                                {formatDateWithTime(transaction)}
                              </span>
                            </div>
                            <div className="col-span-2">
                              <div className="text-xs font-medium text-gray-900 flex items-center gap-2">
                                {transaction.paketNama}
                                <Badge variant="outline" className="text-xs">
                                  {transaction.jumlahItem} item
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-600 mt-1">{transaction.catatan}</div>
                            </div>
                            <div className="col-span-2">
                              {getTypeBadge(transaction.tipe)}
                              <Badge variant="outline" className="text-xs text-purple-600 mt-1">
                                <Package className="h-3 w-3 mr-1" />
                                Distribusi Paket
                              </Badge>
                            </div>
                            <div className="col-span-2 sm:col-span-2">
                              <div className="text-xs font-medium text-gray-900">-</div>
                            </div>
                            <div className="col-span-2 hidden sm:block">
                              <div className="text-xs text-gray-700">{transaction.penerima || '-'}</div>
                            </div>
                            <div className="col-span-1 text-right">
                              <div className="text-xs font-semibold text-gray-600">-</div>
                            </div>
                            <div className="col-span-1 flex items-center justify-end space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetail(transaction)}
                                className="h-8 w-8 p-0 hover:bg-blue-100"
                                title="Lihat detail"
                              >
                                <Eye className="h-4 w-4 text-blue-600" />
                              </Button>
                            </div>
                          </div>
                          {isExpanded && transaction.transaksi.map((itemTrans: InventarisTransaction) => (
                            <div key={itemTrans.id} className="grid grid-cols-12 gap-4 p-3 rounded-lg border bg-muted/10 border-gray-200 ml-8">
                              <div className="col-span-3 sm:col-span-2 flex items-center gap-2">
                                {getTransactionIcon(itemTrans.tipe)}
                                <span className="text-xs font-medium text-gray-900">
                                  {formatDateWithTime(itemTrans)}
                                </span>
                              </div>
                              <div className="col-span-2">
                                <div className="text-xs font-medium text-gray-900">{itemTrans.nama_barang}</div>
                                {itemTrans.kategori && (
                                  <Badge variant="outline" className="text-xs mt-1 bg-gray-50 border-gray-200">
                                    {itemTrans.kategori}
                                  </Badge>
                                )}
                              </div>
                              <div className="col-span-2">
                                {getTypeBadge(itemTrans.tipe)}
                                {getModeBadge(
                                  itemTrans.tipe === 'Keluar' ? itemTrans.keluar_mode : itemTrans.masuk_mode,
                                  itemTrans.tipe
                                )}
                              </div>
                              <div className="col-span-2 sm:col-span-2">
                                {itemTrans.tipe === 'Stocktake' && itemTrans.before_qty !== null && itemTrans.after_qty !== null ? (
                                  <div className="text-xs font-medium text-blue-600">
                                    {itemTrans.before_qty} → {itemTrans.after_qty} {itemTrans.satuan || 'pcs'}
                                  </div>
                                ) : (
                                  <div className="text-xs font-medium text-gray-900">
                                    {itemTrans.jumlah} {itemTrans.satuan || 'pcs'}
                                  </div>
                                )}
                              </div>
                              <div className="col-span-2 hidden sm:block">
                                <div className="text-xs text-gray-700">{itemTrans.penerima || '-'}</div>
                              </div>
                              <div className="col-span-1 text-right">
                                <div className={`text-xs font-semibold ${
                                  itemTrans.tipe === 'Masuk' 
                                    ? 'text-emerald-600' 
                                    : 'text-rose-600'
                                }`}>
                                  {itemTrans.harga_total 
                                    ? formatCurrency(itemTrans.harga_total)
                                    : itemTrans.harga_satuan
                                    ? formatCurrency(itemTrans.harga_satuan * itemTrans.jumlah)
                                    : '-'
                                  }
                                </div>
                              </div>
                              <div className="col-span-1 flex items-center justify-end space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewDetail(itemTrans)}
                                  className="h-8 w-8 p-0 hover:bg-blue-100"
                                  title="Lihat detail"
                                >
                                  <Eye className="h-4 w-4 text-blue-600" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </React.Fragment>
                      );
                    }
                    
                    // Transaksi standalone biasa
                    return (
                      <div
                        key={transaction.id}
                        className={`grid grid-cols-12 gap-4 p-3 rounded-lg border transition-all duration-150 ${
                          transaction.tipe === 'Masuk' 
                            ? 'bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50' 
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="col-span-3 sm:col-span-2 flex items-center gap-2">
                          {getTransactionIcon(transaction.tipe)}
                          <span className="text-xs font-medium text-gray-900">
                            {formatDateWithTime(transaction)}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <div className="text-xs font-medium text-gray-900">
                            {transaction.nama_barang}
                          </div>
                          {transaction.kategori && (
                            <Badge variant="outline" className="text-xs mt-1 bg-gray-50 border-gray-200">
                              {transaction.kategori}
                            </Badge>
                          )}
                        </div>
                        <div className="col-span-2">
                          {getTypeBadge(transaction.tipe)}
                          {getModeBadge(
                            transaction.tipe === 'Keluar' ? transaction.keluar_mode : transaction.masuk_mode,
                            transaction.tipe
                          )}
                        </div>
                        <div className="col-span-2 sm:col-span-2">
                          {transaction.tipe === 'Stocktake' && transaction.before_qty !== null && transaction.after_qty !== null ? (
                            <div className="text-xs font-medium text-blue-600">
                              {transaction.before_qty} → {transaction.after_qty} {transaction.satuan || 'pcs'}
                            </div>
                          ) : (
                            <div className="text-xs font-medium text-gray-900">
                              {transaction.jumlah} {transaction.satuan || 'pcs'}
                            </div>
                          )}
                        </div>
                        <div className="col-span-2 hidden sm:block">
                          <div className="text-xs text-gray-700">
                            {transaction.penerima || '-'}
                          </div>
                        </div>
                        <div className="col-span-1 text-right">
                          <div className={`text-xs font-semibold ${
                            transaction.tipe === 'Masuk' 
                              ? 'text-emerald-600' 
                              : 'text-rose-600'
                          }`}>
                            {transaction.harga_total 
                              ? formatCurrency(transaction.harga_total)
                              : transaction.harga_satuan
                              ? formatCurrency(transaction.harga_satuan * transaction.jumlah)
                              : '-'
                            }
                          </div>
                        </div>
                        <div className="col-span-1 flex items-center justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetail(transaction)}
                            className="h-8 w-8 p-0 hover:bg-blue-100"
                            title="Lihat detail"
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTransaction(transaction)}
                            className="h-8 w-8 p-0 hover:bg-green-100"
                            title="Edit transaksi"
                          >
                            <Edit className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTransaction(transaction)}
                            className="h-8 w-8 p-0 hover:bg-red-100"
                            title="Hapus transaksi"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Pagination */}
          {!compact && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-6 pt-4 border-t pb-2">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:space-x-4">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  Menampilkan {startIndex + 1}-{Math.min(endIndex, sortedTransactions.length)} dari {sortedTransactions.length} transaksi
                </span>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                  <SelectTrigger className="w-full sm:w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-center sm:justify-end space-x-2 flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="flex-shrink-0"
                >
                  ← Sebelumnya
                </Button>
                <span className="flex items-center px-3 text-sm whitespace-nowrap">
                  Halaman {currentPage} dari {totalPages || 1}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                  className="flex-shrink-0"
                >
                  Selanjutnya →
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Detail Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Transaksi</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Item</Label>
                  <p className="font-medium">{selectedTransaction.nama_barang || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tipe</Label>
                  <div className="mt-1">{getTypeBadge(selectedTransaction.tipe)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Mode</Label>
                  <div className="mt-1">{getModeBadge(selectedTransaction.keluar_mode || selectedTransaction.masuk_mode || 'N/A', selectedTransaction.tipe)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Jumlah</Label>
                  <p className="font-medium">{selectedTransaction.jumlah || 0} {selectedTransaction.satuan || ''}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tanggal</Label>
                  <p className="font-medium">{formatDateWithTime(selectedTransaction)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Penerima</Label>
                  <p className="font-medium">{selectedTransaction.penerima || 'N/A'}</p>
                </div>
                {selectedTransaction.harga_satuan && (
                  <div>
                    <Label className="text-muted-foreground">Harga Satuan</Label>
                    <p className="font-medium">{formatCurrency(selectedTransaction.harga_satuan)}</p>
                  </div>
                )}
                {selectedTransaction.harga_total && (
                  <div>
                    <Label className="text-muted-foreground">Harga Total</Label>
                    <p className="font-medium">{formatCurrency(selectedTransaction.harga_total)}</p>
                  </div>
                )}
                {selectedTransaction.harga_dasar && (
                  <div>
                    <Label className="text-muted-foreground">Harga Dasar</Label>
                    <p className="font-medium">{formatCurrency(selectedTransaction.harga_dasar)}</p>
                  </div>
                )}
                {selectedTransaction.sumbangan && (
                  <div>
                    <Label className="text-muted-foreground">Sumbangan</Label>
                    <p className="font-medium">{formatCurrency(selectedTransaction.sumbangan)}</p>
                  </div>
                )}
              </div>
              {selectedTransaction.catatan && (
                <div>
                  <Label className="text-muted-foreground">Catatan</Label>
                  <p className="mt-1 text-sm bg-muted/50 p-3 rounded-md">{selectedTransaction.catatan}</p>
                </div>
              )}
              {(selectedTransaction.tipe === 'Stocktake' || (selectedTransaction.before_qty !== null && selectedTransaction.after_qty !== null)) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Stok Sebelum</Label>
                    <p className="font-medium">
                      {selectedTransaction.before_qty !== null && selectedTransaction.before_qty !== undefined 
                        ? selectedTransaction.before_qty 
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Stok Sesudah</Label>
                    <p className="font-medium">
                      {selectedTransaction.after_qty !== null && selectedTransaction.after_qty !== undefined 
                        ? selectedTransaction.after_qty 
                        : '-'}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" onClick={handleCloseViewModal} className="w-full">
                  Tutup
                </Button>
                <Button 
                  variant="default" 
                  onClick={() => {
                    handleCloseViewModal();
                    handleEditTransaction(selectedTransaction);
                  }}
                  className="w-full"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Transaksi
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Form */}
      <TransactionForm
        isOpen={showEditForm}
        onClose={handleCloseEditForm}
        editingTransaction={selectedTransaction}
        availableStock={selectedTransaction?.jumlah || 0}
      />

      {/* New Transaction Form */}
      <TransactionForm
        isOpen={showNewTransactionForm}
        onClose={handleCloseNewTransactionForm}
        editingTransaction={undefined}
        availableStock={0}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Konfirmasi Hapus
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Apakah Anda yakin ingin menghapus transaksi ini?
            </p>
            {selectedTransaction && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium">{selectedTransaction.nama_barang}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {selectedTransaction.tipe} - {formatDateWithTime(selectedTransaction)}
                </p>
              </div>
            )}
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">
                <strong>Peringatan:</strong> Tindakan ini tidak dapat dibatalkan. 
                Transaksi akan dihapus secara permanen dan stok akan dikembalikan.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setSelectedTransaction(null);
              }}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Ya, Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RiwayatTransaksiInventaris;
