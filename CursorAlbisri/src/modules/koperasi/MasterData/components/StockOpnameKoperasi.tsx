import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Check, AlertTriangle, Package, ClipboardList, Search, Filter } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OpnameItem {
  id: string;
  kode_barang: string;
  nama_barang: string;
  kategori: string;
  satuan_dasar: string;
  stok_sistem: number;
  stok_fisik: number;
  selisih: number;
  catatan: string;
}

interface ProdukData {
  id: string;
  kode_barang: string;
  nama_barang: string;
  kategori_id: string | null;
  stok: number;
  satuan_dasar: string;
  kategori?: string;
}

interface KategoriData {
  id: string;
  nama: string;
}

const StockOpnameKoperasi = () => {
  const [opnameItems, setOpnameItems] = useState<OpnameItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKategori, setFilterKategori] = useState<string>('all');
  const [filterSelisih, setFilterSelisih] = useState<string>('all');
  const queryClient = useQueryClient();

  // Fetch produk list with kategori
  const { data: produkList = [], isLoading } = useQuery({
    queryKey: ['koperasi-produk-opname'],
    queryFn: async () => {
      // Fetch produk dengan join ke kategori
      const { data: produkData, error: produkError } = await supabase
        .from('kop_barang')
        .select(`
          id,
          kode_barang,
          nama_barang,
          kategori_id,
          stok,
          satuan_dasar
        `)
        .eq('is_active', true)
        .order('nama_barang');

      if (produkError) throw produkError;

      // Fetch kategori untuk mapping
      const { data: kategoriList } = await supabase
        .from('kop_kategori')
        .select('id, nama');

      const kategoriMap = new Map<string, string>(
        (kategoriList || []).map((k: KategoriData) => [k.id, k.nama])
      );

      // Map produk dengan kategori
      return (produkData || []).map((produk: ProdukData) => ({
        ...produk,
        kategori: kategoriMap.get(produk.kategori_id || '') || 'Tidak Dikategorikan',
      }));
    },
    staleTime: 30000,
  });

  const startOpname = () => {
    const opnameData: OpnameItem[] = produkList.map((produk: ProdukData & { kategori?: string }) => ({
      id: produk.id,
      kode_barang: produk.kode_barang,
      nama_barang: produk.nama_barang,
      kategori: produk.kategori || 'Tidak Dikategorikan',
      satuan_dasar: produk.satuan_dasar || 'pcs',
      stok_sistem: produk.stok || 0,
      stok_fisik: produk.stok || 0, // Start with system value
      selisih: 0,
      catatan: '',
    }));
    setOpnameItems(opnameData);
  };

  const updateStokFisik = (itemId: string, stokFisik: number) => {
    setOpnameItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const selisih = stokFisik - item.stok_sistem;
          return { ...item, stok_fisik: stokFisik, selisih };
        }
        return item;
      })
    );
  };

  const updateCatatan = (itemId: string, catatan: string) => {
    setOpnameItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, catatan } : item))
    );
  };

  const processOpname = async () => {
    setIsProcessing(true);
    try {
      // Filter items yang memiliki selisih (perlu penyesuaian)
      const itemsWithSelisih = opnameItems.filter((item) => item.selisih !== 0);

      if (itemsWithSelisih.length === 0) {
        toast.info(
          'Tidak ada penyesuaian yang diperlukan. Semua stok sesuai dengan sistem.'
        );
        setOpnameItems([]);
        return;
      }

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let successCount = 0;
      let errorCount = 0;

      // Process items sequentially with delay to avoid rate limiting
      for (let i = 0; i < itemsWithSelisih.length; i++) {
        const item = itemsWithSelisih[i];

        // Add delay between transactions to avoid rate limiting (except for first item)
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        try {
          // Use atomic RPC function for stock opname
          const { data: result, error } = await supabase.rpc(
            'rpc_stock_opname_koperasi',
            {
              p_barang_id: item.id,
              p_stok_fisik: item.stok_fisik,
              p_catatan: item.catatan || null,
              p_user_id: user?.id || null,
            }
          );

          if (error) {
            console.error(
              `Error in stock opname for ${item.nama_barang}:`,
              error
            );
            throw new Error(error.message || 'Gagal melakukan stock opname');
          }

          if (!result || !result.success) {
            throw new Error(
              result?.error || 'Gagal melakukan stock opname'
            );
          }

          successCount++;

          // Show progress toast
          toast.info(
            `Progress: ${successCount}/${itemsWithSelisih.length} item diproses`
          );
        } catch (error) {
          console.error(
            `Error processing stock opname for item ${item.id}:`,
            error
          );
          errorCount++;
          const errorMessage = error instanceof Error ? error.message : 'Error tidak diketahui';
          toast.error(
            `Gagal memproses ${item.nama_barang}: ${errorMessage}`
          );
        }
      }

      // Invalidate dan refetch semua query cache terkait koperasi
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['koperasi-produk-opname'],
        }),
        queryClient.invalidateQueries({ queryKey: ['koperasi-produk'] }),
        queryClient.invalidateQueries({
          queryKey: ['koperasi-stock-alerts'],
        }),
        queryClient.refetchQueries({
          queryKey: ['koperasi-produk-opname'],
        }),
        queryClient.refetchQueries({ queryKey: ['koperasi-produk'] }),
      ]);

      // Log hasil
      console.log('Stock Opname Results:', {
        totalItems: opnameItems.length,
        itemsWithDifference: itemsWithSelisih.length,
        successCount,
        errorCount,
        adjustments: itemsWithSelisih.map((i) => ({
          nama: i.nama_barang,
          sebelum: i.stok_sistem,
          sesudah: i.stok_fisik,
          selisih: i.selisih,
        })),
      });

      if (errorCount > 0) {
        toast.warning(
          `Stock Opname selesai dengan peringatan. ${successCount} item berhasil, ${errorCount} item gagal.`
        );
      } else {
        toast.success(
          `Stock Opname selesai! ${successCount} item telah disesuaikan.`
        );
      }

      // Reset opname items setelah berhasil
      setOpnameItems([]);
    } catch (error) {
      console.error('Error processing stock opname:', error);
      toast.error('Gagal memproses stock opname');
    } finally {
      setIsProcessing(false);
    }
  };

  const getSelisihColor = (selisih: number) => {
    if (selisih > 0) return 'text-green-600';
    if (selisih < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getSelisihIcon = (selisih: number) => {
    if (selisih > 0) return <Check className="h-4 w-4 text-green-600" />;
    if (selisih < 0)
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    return null;
  };

  // Get unique categories from opname items
  const uniqueKategories = useMemo(() => {
    const kategories = new Set(opnameItems.map((item) => item.kategori));
    return Array.from(kategories).sort();
  }, [opnameItems]);

  // Filter opname items based on search and filters
  const filteredOpnameItems = useMemo(() => {
    return opnameItems.filter((item) => {
      // Search filter (kode barang or nama barang)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          item.kode_barang.toLowerCase().includes(searchLower) ||
          item.nama_barang.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Kategori filter
      if (filterKategori !== 'all' && item.kategori !== filterKategori) {
        return false;
      }

      // Selisih filter
      if (filterSelisih !== 'all') {
        if (filterSelisih === 'ada-selisih' && item.selisih === 0) {
          return false;
        }
        if (filterSelisih === 'tidak-ada-selisih' && item.selisih !== 0) {
          return false;
        }
        if (filterSelisih === 'lebih-dari-sistem' && item.selisih <= 0) {
          return false;
        }
        if (filterSelisih === 'kurang-dari-sistem' && item.selisih >= 0) {
          return false;
        }
      }

      return true;
    });
  }, [opnameItems, searchTerm, filterKategori, filterSelisih]);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterKategori('all');
    setFilterSelisih('all');
  };

  const hasActiveFilters =
    searchTerm || filterKategori !== 'all' || filterSelisih !== 'all';

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Stock Opname
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading data produk...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Stock Opname - Penghitungan Fisik Barang
        </CardTitle>
      </CardHeader>
      <CardContent>
        {opnameItems.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Mulai Stock Opname</h3>
            <p className="text-muted-foreground mb-4">
              Proses ini akan menghitung semua barang secara fisik dan
              membandingkannya dengan data sistem.
            </p>
            <Button onClick={startOpname} className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Mulai Stock Opname
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">
                    {hasActiveFilters ? filteredOpnameItems.length : opnameItems.length}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {hasActiveFilters ? 'Item Tersaring' : 'Total Items'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {filteredOpnameItems.filter((item) => item.selisih > 0).length}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Lebih dari Sistem
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-red-600">
                    {filteredOpnameItems.filter((item) => item.selisih < 0).length}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Kurang dari Sistem
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Items List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Daftar Item untuk Dihitung
                </h3>
                {hasActiveFilters && (
                  <Badge variant="secondary" className="text-xs">
                    {filteredOpnameItems.length} dari {opnameItems.length} item
                  </Badge>
                )}
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari berdasarkan kode atau nama barang..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={filterKategori} onValueChange={setFilterKategori}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Semua Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem key="all-kategori" value="all">Semua Kategori</SelectItem>
                      {uniqueKategories.map((kategori) => (
                        <SelectItem key={kategori} value={kategori}>
                          {kategori}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterSelisih} onValueChange={setFilterSelisih}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter Selisih" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem key="all-selisih" value="all">Semua Item</SelectItem>
                      <SelectItem key="ada-selisih" value="ada-selisih">Ada Selisih</SelectItem>
                      <SelectItem key="tidak-ada-selisih" value="tidak-ada-selisih">
                        Tidak Ada Selisih
                      </SelectItem>
                      <SelectItem key="lebih-dari-sistem" value="lebih-dari-sistem">
                        Lebih dari Sistem
                      </SelectItem>
                      <SelectItem key="kurang-dari-sistem" value="kurang-dari-sistem">
                        Kurang dari Sistem
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="flex items-center gap-1"
                    >
                      <X className="h-4 w-4" />
                      Reset
                    </Button>
                  )}
                </div>
              </div>

              <div className="border rounded-lg">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-medium">
                          Kode Barang
                        </th>
                        <th className="text-left p-4 font-medium">
                          Nama Barang
                        </th>
                        <th className="text-left p-4 font-medium">Kategori</th>
                        <th className="text-left p-4 font-medium">
                          Stok Sistem
                        </th>
                        <th className="text-left p-4 font-medium">
                          Stok Fisik
                        </th>
                        <th className="text-left p-4 font-medium">Selisih</th>
                        <th className="text-left p-4 font-medium">Catatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOpnameItems.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-muted-foreground">
                            {hasActiveFilters
                              ? 'Tidak ada item yang sesuai dengan filter'
                              : 'Tidak ada item'}
                          </td>
                        </tr>
                      ) : (
                        filteredOpnameItems.map((item) => (
                        <tr
                          key={item.id}
                          className="border-t hover:bg-muted/25"
                        >
                          <td className="p-4 font-mono text-sm">
                            {item.kode_barang}
                          </td>
                          <td className="p-4 font-medium">{item.nama_barang}</td>
                          <td className="p-4">
                            <Badge variant="secondary">{item.kategori}</Badge>
                          </td>
                          <td className="p-4">
                            {item.stok_sistem} {item.satuan_dasar}
                          </td>
                          <td className="p-4">
                            <Input
                              type="number"
                              value={item.stok_fisik}
                              onChange={(e) =>
                                updateStokFisik(
                                  item.id,
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-24"
                              min="0"
                            />
                          </td>
                          <td className="p-4">
                            <div
                              className={`flex items-center gap-2 ${getSelisihColor(
                                item.selisih
                              )}`}
                            >
                              {getSelisihIcon(item.selisih)}
                              <span className="font-medium">
                                {item.selisih > 0 ? '+' : ''}
                                {item.selisih} {item.satuan_dasar}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <Input
                              value={item.catatan}
                              onChange={(e) =>
                                updateCatatan(item.id, e.target.value)
                              }
                              placeholder="Catatan..."
                              className="w-40"
                            />
                          </td>
                        </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={processOpname}
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                {isProcessing
                  ? 'Memproses...'
                  : 'Selesaikan Stock Opname'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setOpnameItems([])}
                disabled={isProcessing}
              >
                <X className="h-4 w-4 mr-2" />
                Batal
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StockOpnameKoperasi;
