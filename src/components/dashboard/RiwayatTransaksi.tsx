import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, MoreHorizontal, Eye, Edit, Trash2, ArrowUpRight, ArrowDownLeft, X, Calendar, FileText } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  tanggal: string;
  jenis_transaksi: 'Pemasukan' | 'Pengeluaran';
  kategori: string;
  deskripsi: string;
  jumlah: number;
  akun_kas_id: string;
  akun_kas_nama: string;
  status: string;
  created_at: string;
  sub_kategori?: string;
  penerima_pembayar?: string;
  rincian_items?: any[];
  alokasi_santri?: any[];
  display_category?: string;
  source_type?: string;
  display_description?: string;
  auto_posted?: boolean;
  source_module?: string;
  referensi?: string;
}

interface RiwayatTransaksiProps {
  transactions: Transaction[];
  selectedAccountId?: string;
  selectedAccountName?: string;
  onClearFilter?: () => void;
  onViewDetail?: (transaction: Transaction) => void;
  onEditTransaction?: (transaction: Transaction) => void;
  onDeleteTransaction?: (transaction: Transaction) => void;
}

const RiwayatTransaksi: React.FC<RiwayatTransaksiProps> = ({
  transactions,
  selectedAccountId,
  selectedAccountName,
  onClearFilter,
  onViewDetail,
  onEditTransaction,
  onDeleteTransaction
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  // Status filter removed - not used in this system
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<string>('tanggal');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Date filter states
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const formatCurrency = (amount: number) => {
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
    // If date is DATE type (no time), it will show as midnight
    // Use created_at for time if available
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
  
  // Format date with time from created_at if available
  const formatDateWithTime = (transaction: Transaction) => {
    const dateStr = transaction.tanggal;
    const createdStr = (transaction as any).created_at;
    
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    let timeStr = '';
    
    // Use created_at for accurate time if available
    if (createdStr) {
      const createdDate = new Date(createdStr);
      timeStr = createdDate.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } else {
      // Fallback: use date's time (might be 00:00 for DATE type)
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

  const getTransactionIcon = (jenis: string) => {
    return jenis === 'Pemasukan' ? 
      <ArrowUpRight className="h-4 w-4 text-green-600" /> : 
      <ArrowDownLeft className="h-4 w-4 text-red-600" />;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Posted': { color: 'bg-green-100 text-green-800', label: 'Posted' },
      'Pending': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      'Draft': { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      'Cancelled': { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Draft'];
    return <Badge className={config.color} variant="secondary">{config.label}</Badge>;
  };

  // Get unique categories for filter
  const uniqueCategories = Array.from(new Set(transactions.map(t => t.kategori)));

  // Date filter logic
  const getDateFilter = (transaction: Transaction) => {
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

  const filteredTransactions = transactions.filter(transaction => {
    // EXCLUDE transactions from tabungan module
    // Filter by source_module
    if (transaction.source_module && 
        typeof transaction.source_module === 'string' &&
        transaction.source_module.toLowerCase().includes('tabungan')) {
      return false;
    }
    // Filter by kategori
    if (transaction.kategori === 'Tabungan Santri') {
      return false;
    }
    // Filter by akun kas managed_by if available
    if ((transaction as any).akun_kas?.managed_by === 'tabungan') {
      return false;
    }
    
    // Apply other filters
    const s = (searchTerm || '').toLowerCase();
    const desc = ((transaction.deskripsi ?? '') as string).toString().toLowerCase();
    const kat = ((transaction.kategori ?? '') as string).toString().toLowerCase();
    const akun = ((transaction.akun_kas_nama ?? '') as string).toString().toLowerCase();
    const matchesSearch = desc.includes(s) || kat.includes(s) || akun.includes(s);
    const matchesType = filterType === 'all' || transaction.jenis_transaksi === filterType;
    
    // Status filter removed - not used
    const matchesStatus = true;
    
    const matchesCategory = filterCategory === 'all' || transaction.kategori === filterCategory;
    const matchesAccount = !selectedAccountId || transaction.akun_kas_id === selectedAccountId;
    const matchesDate = getDateFilter(transaction);
    
    return matchesSearch && matchesType && matchesStatus && matchesCategory && matchesAccount && matchesDate;
  });

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let aValue, bValue;
    let aTieBreaker, bTieBreaker;
    
    switch (sortBy) {
      case 'tanggal':
        aValue = new Date(a.tanggal).getTime();
        bValue = new Date(b.tanggal).getTime();
        // Use created_at as tie-breaker for same date
        aTieBreaker = (a as any).created_at ? new Date((a as any).created_at).getTime() : 0;
        bTieBreaker = (b as any).created_at ? new Date((b as any).created_at).getTime() : 0;
        break;
      case 'jumlah':
        aValue = a.jumlah;
        bValue = b.jumlah;
        // Use created_at as tie-breaker for same amount
        aTieBreaker = (a as any).created_at ? new Date((a as any).created_at).getTime() : 0;
        bTieBreaker = (b as any).created_at ? new Date((b as any).created_at).getTime() : 0;
        break;
      case 'kategori':
        aValue = a.kategori;
        bValue = b.kategori;
        // Use created_at as tie-breaker for same category
        aTieBreaker = (a as any).created_at ? new Date((a as any).created_at).getTime() : 0;
        bTieBreaker = (b as any).created_at ? new Date((b as any).created_at).getTime() : 0;
        break;
      default:
        // Default: sort by tanggal, then created_at
        aValue = new Date(a.tanggal).getTime();
        bValue = new Date(b.tanggal).getTime();
        aTieBreaker = (a as any).created_at ? new Date((a as any).created_at).getTime() : 0;
        bTieBreaker = (b as any).created_at ? new Date((b as any).created_at).getTime() : 0;
    }
    
    // Primary sort
    let result = 0;
    if (sortOrder === 'asc') {
      result = aValue > bValue ? 1 : (aValue < bValue ? -1 : 0);
    } else {
      result = aValue < bValue ? 1 : (aValue > bValue ? -1 : 0);
    }
    
    // Tie-breaker: if primary values are equal, use created_at (newest first for desc, oldest first for asc)
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
  }, [searchTerm, filterType, filterCategory, selectedAccountId, dateFilter]);

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
      <CardHeader className="pb-4 pt-4 px-4">
        <div className="flex items-center justify-between">
        <div>
          <CardTitle className="text-base font-medium text-gray-900">Riwayat Transaksi</CardTitle>
          <p className="text-xs text-gray-500 mt-0.5">
            Daftar lengkap transaksi keuangan
          </p>
        </div>
        {selectedAccountId && selectedAccountName && (
          <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-xs px-2 py-0.5">
            {selectedAccountName}
          </Badge>
        )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="space-y-3 mb-5">
          {/* Search and Basic Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari transaksi, kategori, atau akun..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Type Filter */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[130px] h-9 text-xs border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                <SelectItem value="Pemasukan">Pemasukan</SelectItem>
                <SelectItem value="Pengeluaran">Pengeluaran</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[150px] h-9 text-xs border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {uniqueCategories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Filter */}
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

            {/* Custom Date Picker */}
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

          {/* Active Filters Display */}
          <div className="flex flex-wrap gap-2">
            {selectedAccountId && selectedAccountName && (
              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-xs px-2 py-0.5">
                Akun: {selectedAccountName}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onClearFilter}
                  className="h-4 w-4 p-0 ml-1.5 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {filterType !== 'all' && (
              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-xs px-2 py-0.5">
                Jenis: {filterType}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setFilterType('all')}
                  className="h-4 w-4 p-0 ml-1.5 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {filterCategory !== 'all' && (
              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-xs px-2 py-0.5">
                Kategori: {filterCategory}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setFilterCategory('all')}
                  className="h-4 w-4 p-0 ml-1.5 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {dateFilter !== 'all' && (
              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-xs px-2 py-0.5">
                Periode: {dateFilter === 'custom' ? 'Custom' : dateFilter}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setDateFilter('all')}
                  className="h-4 w-4 p-0 ml-1.5 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
        </div>

        {/* Table Wrapper with Horizontal Scroll for Mobile */}
        <div className="overflow-x-auto -mx-4 sm:mx-0 pb-4 overflow-y-visible">
          <div className="min-w-[800px] px-4 sm:px-0 pb-2">
            {/* Table Header with Sort */}
            <div className="grid grid-cols-12 gap-4 p-3 bg-gray-50 rounded-lg font-medium text-xs text-gray-600 border-b border-gray-200">
              <div className="col-span-1 hidden sm:block">
                <input type="checkbox" className="rounded border-gray-300" />
              </div>
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
                className="col-span-3 sm:col-span-2 cursor-pointer hover:text-gray-900 flex items-center space-x-1"
                onClick={() => handleSort('kategori')}
              >
                <span>Kategori</span>
                {sortBy === 'kategori' && (
                  <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </div>
              <div className="col-span-3 sm:col-span-3">Deskripsi</div>
              <div className="col-span-1 hidden sm:block">Status</div>
              <div 
                className="col-span-2 cursor-pointer hover:text-gray-900 flex items-center justify-end space-x-1"
                onClick={() => handleSort('jumlah')}
              >
                <span>Jumlah</span>
                {sortBy === 'jumlah' && (
                  <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </div>
              <div className="col-span-1 text-right">Aksi</div>
            </div>

            {/* Transactions Table */}
            <div className="space-y-2">
              {currentTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Tidak ada transaksi ditemukan
                </div>
              ) : (
                currentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className={`grid grid-cols-12 gap-4 p-3 rounded-lg border transition-all duration-150 ${
                  transaction.jenis_transaksi === 'Pemasukan' 
                    ? 'bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50' 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                {/* Checkbox */}
                <div className="col-span-1 hidden sm:flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                  />
                </div>
                
                {/* Date */}
                <div className="col-span-3 sm:col-span-2 flex items-center gap-2">
                  {getTransactionIcon(transaction.jenis_transaksi)}
                  <span className="text-xs font-medium text-gray-900">
                    {formatDateWithTime(transaction)}
                  </span>
                </div>
                
                {/* Category */}
                <div className="col-span-3 sm:col-span-2">
                  <div className="text-xs font-medium text-gray-900">
                    {transaction.display_category || transaction.kategori}
                  </div>
                  {transaction.source_type && (
                    <Badge variant="outline" className="text-xs mt-1 bg-gray-50 border-gray-200">
                      {transaction.source_type}
                    </Badge>
                  )}
                </div>
                
                {/* Description */}
                <div className="col-span-3 sm:col-span-3">
                  <div className="text-xs text-gray-700 line-clamp-1">
                    {transaction.display_description || transaction.deskripsi}
                  </div>
                  {transaction.penerima_pembayar && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {transaction.penerima_pembayar}
                    </div>
                  )}
                </div>
                
                {/* Status - Hidden */}
                <div className="col-span-1 hidden sm:flex items-center">
                  <span className="text-transparent text-xs">-</span>
                </div>
                
                {/* Amount */}
                <div className="col-span-2 text-right">
                  <div className={`text-sm font-semibold ${
                    transaction.jenis_transaksi === 'Pemasukan' 
                      ? 'text-emerald-600' 
                      : 'text-rose-600'
                  }`}>
                    {formatCurrency(transaction.jumlah)}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {transaction.akun_kas_nama}
                  </div>
                </div>
                
                {/* Actions - Always on the right */}
                <div className="col-span-1 flex items-center justify-end space-x-1">
                  {/* Hide edit/delete buttons for auto-posted entries (from inventaris/donasi) */}
                  {/* Note: Auto-posted transactions are final and cannot be edited/deleted from keuangan module */}
                  {transaction.auto_posted || 
                   transaction.referensi?.startsWith('inventory_sale:') ||
                   transaction.referensi?.startsWith('donation:') ||
                   transaction.referensi?.startsWith('donasi:') ||
                   transaction.referensi?.startsWith('pembayaran_santri:') ? (
                    // No action buttons for auto-posted transactions
                    <span className="text-xs text-muted-foreground">-</span>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditTransaction?.(transaction)}
                        className="h-8 w-8 p-0 hover:bg-blue-100"
                        title="Edit transaksi"
                      >
                        <Edit className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteTransaction?.(transaction)}
                        className="h-8 w-8 p-0 hover:bg-red-100"
                        title="Hapus transaksi"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Pagination and Items Per Page */}
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
              Halaman {currentPage} dari {totalPages}
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="flex-shrink-0"
            >
              Selanjutnya →
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RiwayatTransaksi;
