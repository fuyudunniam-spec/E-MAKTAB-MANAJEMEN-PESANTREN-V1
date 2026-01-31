import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, ShoppingCart, Package, DollarSign, Truck, Tag, AlertCircle, RefreshCw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { addKeuanganKoperasiTransaction } from '@/services/keuanganKoperasi.service';

interface PembelianFormDialogProps {
  open: boolean;
  onClose: () => void;
}

interface ItemPembelian {
  barang_id: string;
  nama_barang: string;
  satuan: string;
  jumlah: number;
  harga_satuan: number;
  subtotal: number;
}

export default function PembelianFormDialog({ open, onClose }: PembelianFormDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    supplier_id: '',
    nomor_faktur: '',
    tanggal: new Date().toISOString().split('T')[0],
    status_pembayaran: 'lunas',
    jatuh_tempo: '',
    ongkir: 0,
    diskon: 0,
    catatan: '',
  });
  const [items, setItems] = useState<ItemPembelian[]>([]);
  const [selectedBarang, setSelectedBarang] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch suppliers
  const { data: suppliers = [] } = useQuery({
    queryKey: ['koperasi-suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kop_supplier')
        .select('*')
        .order('nama');
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch barang
  const { data: barangList = [] } = useQuery({
    queryKey: ['koperasi-barang-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kop_barang')
        .select('id, kode_barang, nama_barang, harga_beli, satuan_dasar, stok_saat_ini')
        .eq('is_active', true)
        .order('nama_barang');
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      // Generate nomor faktur if empty
      if (!data.nomor_faktur) {
        const timestamp = Date.now().toString().slice(-6);
        data.nomor_faktur = `PB-${timestamp}`;
      }

      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      const total = subtotal + Number(data.ongkir) - Number(data.diskon);
      
      // Determine payment amounts
      let totalBayar = 0;
      let sisaHutang = 0;
      
      if (data.status_pembayaran === 'lunas') {
        totalBayar = total;
        sisaHutang = 0;
      } else {
        totalBayar = 0;
        sisaHutang = total;
      }

      // Insert pembelian header
      const { data: pembelian, error: pembelianError } = await supabase
        .from('kop_pembelian')
        .insert({
          ...data,
          total_pembelian: total,
          total_bayar: totalBayar,
          sisa_hutang: sisaHutang,
          status: 'completed',
        })
        .select()
        .single();

      if (pembelianError) throw pembelianError;

      // Insert pembelian details
      const details = items.map(item => ({
        pembelian_id: pembelian.id,
        barang_id: item.barang_id,
        jumlah: item.jumlah,
        harga_satuan_beli: item.harga_satuan,
        subtotal: item.subtotal,
      }));

      const { error: detailError } = await supabase
        .from('kop_pembelian_detail')
        .insert(details);

      if (detailError) throw detailError;

      // Update stok dan harga_beli untuk setiap item
      for (const item of items) {
        // Get current stock and harga_beli
        const { data: currentBarang, error: fetchError } = await supabase
          .from('kop_barang')
          .select('stok, harga_beli')
          .eq('id', item.barang_id)
          .single();

        if (fetchError) {
          console.error(`Error fetching barang ${item.barang_id}:`, fetchError);
          continue;
        }

        const currentStok = Number(currentBarang?.stok || 0);
        const currentHargaBeli = Number(currentBarang?.harga_beli || 0);
        const newStok = currentStok + item.jumlah;
        
        // Update harga_beli jika harga pembelian berbeda (gunakan harga terbaru)
        const updateData: any = {
          stok: newStok,
        };

        // Update harga_beli jika harga pembelian berbeda dari harga beli saat ini
        // Gunakan harga pembelian terbaru sebagai harga beli baru
        if (item.harga_satuan !== currentHargaBeli && item.harga_satuan > 0) {
          updateData.harga_beli = item.harga_satuan;
        }

        const { error: updateError } = await supabase
          .from('kop_barang')
          .update(updateData)
          .eq('id', item.barang_id);

        if (updateError) {
          console.error(`Error updating barang ${item.barang_id}:`, updateError);
          // Continue dengan item berikutnya, jangan throw error
        }
      }

      // Auto-post ke keuangan sebagai pengeluaran (hanya jika status lunas)
      if (data.status_pembayaran === 'lunas' && total > 0) {
        try {
          // Get supplier name for description
          const supplier = suppliers.find((s: any) => s.id === data.supplier_id);
          const supplierName = supplier?.nama || 'Supplier';

          await addKeuanganKoperasiTransaction({
            tanggal: data.tanggal,
            jenis_transaksi: 'Pengeluaran',
            kategori: 'Pembelian Barang',
            sub_kategori: 'Kulakan',
            jumlah: total,
            deskripsi: `Pembelian dari ${supplierName} - ${data.nomor_faktur || 'Tanpa Faktur'}`,
            referensi: `koperasi_pembelian:${pembelian.id}`,
            status: 'posted',
          });

          // Update saldo akun kas jika ada
          // Note: akun_kas_id akan diambil dari default kas koperasi jika ada
        } catch (keuanganError) {
          console.warn('Gagal auto-post ke keuangan:', keuanganError);
          // Jangan throw error, hanya log warning
          // Pembelian sudah berhasil disimpan, posting keuangan bisa dilakukan manual
        }
      }

      return pembelian;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['koperasi-pembelian'] });
      queryClient.invalidateQueries({ queryKey: ['koperasi-hutang-list'] });
      queryClient.invalidateQueries({ queryKey: ['koperasi-produk'] });
      queryClient.invalidateQueries({ queryKey: ['koperasi-produk-with-stock'] });
      queryClient.invalidateQueries({ queryKey: ['koperasi-barang-list'] });
      queryClient.invalidateQueries({ queryKey: ['koperasi-keuangan'] });
      toast.success('Pembelian berhasil disimpan dan stok diperbarui');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menyimpan pembelian');
    },
  });

  const handleAddItem = () => {
    if (!selectedBarang) {
      toast.error('Pilih barang terlebih dahulu');
      return;
    }

    const barang = barangList.find((b: any) => b.id === selectedBarang);
    if (!barang) return;

    const existingItem = items.find(item => item.barang_id === selectedBarang);
    if (existingItem) {
      toast.error('Barang sudah ditambahkan');
      return;
    }

    const hargaBeli = Number(barang.harga_beli || 0);
    setItems([...items, {
      barang_id: barang.id,
      nama_barang: barang.nama_barang,
      satuan: barang.satuan_dasar || 'pcs',
      jumlah: 1,
      harga_satuan: hargaBeli,
      subtotal: hargaBeli,
    }]);
    setSelectedBarang('');
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'jumlah' || field === 'harga_satuan') {
      newItems[index].subtotal = newItems[index].jumlah * newItems[index].harga_satuan;
    }
    
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.supplier_id) {
      newErrors.supplier_id = 'Supplier harus dipilih';
    }

    if (!formData.tanggal) {
      newErrors.tanggal = 'Tanggal harus diisi';
    }

    if (items.length === 0) {
      newErrors.items = 'Tambahkan minimal 1 barang';
    }

    // Validate items
    items.forEach((item, index) => {
      if (item.jumlah <= 0) {
        newErrors[`item_${index}_jumlah`] = 'Jumlah harus lebih dari 0';
      }
      if (item.harga_satuan < 0) {
        newErrors[`item_${index}_harga`] = 'Harga tidak boleh negatif';
      }
    });

    if (formData.status_pembayaran === 'hutang' || formData.status_pembayaran === 'cicilan') {
      if (!formData.jatuh_tempo) {
        newErrors.jatuh_tempo = 'Jatuh tempo harus diisi untuk hutang/cicilan';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Mohon lengkapi form dengan benar');
      return;
    }

    saveMutation.mutate(formData);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return subtotal + Number(formData.ongkir || 0) - Number(formData.diskon || 0);
  };

  useEffect(() => {
    if (!open) {
      setFormData({
        supplier_id: '',
        nomor_faktur: '',
        tanggal: new Date().toISOString().split('T')[0],
        status_pembayaran: 'lunas',
        jatuh_tempo: '',
        ongkir: 0,
        diskon: 0,
        catatan: '',
      });
      setItems([]);
      setSelectedBarang('');
      setErrors({});
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="border-b border-gray-200 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">Form Pembelian Barang</DialogTitle>
              <p className="text-sm text-gray-600 mt-1">Isi data pembelian dengan lengkap dan akurat</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Error Alert */}
          {Object.keys(errors).length > 0 && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                Mohon perbaiki kesalahan pada form sebelum menyimpan
              </AlertDescription>
            </Alert>
          )}

          {/* Informasi Supplier & Faktur */}
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Package className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 text-base">Informasi Supplier & Faktur</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Supplier <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.supplier_id}
                    onValueChange={(value) => {
                      setFormData({ ...formData, supplier_id: value });
                      setErrors({ ...errors, supplier_id: '' });
                    }}
                  >
                    <SelectTrigger className={`h-11 ${errors.supplier_id ? 'border-red-500' : 'border-gray-300'}`}>
                      <SelectValue placeholder="Pilih supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{s.nama}</span>
                            {s.kontak && <span className="text-xs text-gray-500">{s.kontak}</span>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.supplier_id && (
                    <p className="text-xs text-red-600 mt-1.5">{errors.supplier_id}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">No. Faktur</Label>
                  <Input
                    value={formData.nomor_faktur}
                    onChange={(e) => setFormData({ ...formData, nomor_faktur: e.target.value })}
                    placeholder="Auto-generate jika kosong"
                    className="font-mono h-11 border-gray-300"
                  />
                  <p className="text-xs text-gray-500">Kosongkan untuk generate otomatis</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Tanggal <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={formData.tanggal}
                    onChange={(e) => {
                      setFormData({ ...formData, tanggal: e.target.value });
                      setErrors({ ...errors, tanggal: '' });
                    }}
                    className={`h-11 border-gray-300 ${errors.tanggal ? 'border-red-500' : ''}`}
                  />
                  {errors.tanggal && (
                    <p className="text-xs text-red-600 mt-1.5">{errors.tanggal}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Status Pembayaran <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.status_pembayaran}
                    onValueChange={(value) => setFormData({ ...formData, status_pembayaran: value })}
                  >
                    <SelectTrigger className="h-11 border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lunas">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span>Lunas</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="hutang">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          <span>Hutang</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="cicilan">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                          <span>Cicilan</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(formData.status_pembayaran === 'hutang' || formData.status_pembayaran === 'cicilan') && (
                <div className="mt-6 space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Jatuh Tempo <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={formData.jatuh_tempo}
                    onChange={(e) => {
                      setFormData({ ...formData, jatuh_tempo: e.target.value });
                      setErrors({ ...errors, jatuh_tempo: '' });
                    }}
                    className={`h-11 border-gray-300 ${errors.jatuh_tempo ? 'border-red-500' : ''}`}
                  />
                  {errors.jatuh_tempo && (
                    <p className="text-xs text-red-600 mt-1.5">{errors.jatuh_tempo}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Daftar Barang */}
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <Package className="h-4 w-4 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 text-base">Daftar Barang</h3>
                {items.length > 0 && (
                  <Badge variant="outline" className="ml-auto bg-green-50 text-green-700 border-green-200">
                    {items.length} item
                  </Badge>
                )}
              </div>

              {/* Item Selector */}
              <div className="flex gap-3 mb-6">
                <Select value={selectedBarang} onValueChange={setSelectedBarang}>
                  <SelectTrigger className="flex-1 h-11 border-gray-300 bg-white">
                    <SelectValue placeholder="Pilih barang untuk ditambahkan" />
                  </SelectTrigger>
                  <SelectContent>
                    {barangList.map((b: any) => (
                      <SelectItem key={b.id} value={b.id}>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{b.nama_barang}</span>
                          <span className="text-xs text-gray-500">
                            Stok: {b.stok_saat_ini || 0} {b.satuan_dasar} | Harga Beli: Rp {Number(b.harga_beli || 0).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  type="button" 
                  onClick={handleAddItem} 
                  className="bg-green-600 hover:bg-green-700 text-white shadow-sm h-11 px-6"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah
                </Button>
              </div>

              {errors.items && (
                <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-800">{errors.items}</AlertDescription>
                </Alert>
              )}

              {/* Items List */}
              {items.length > 0 ? (
                <div className="space-y-3">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700">
                    <div className="col-span-4">Nama Barang</div>
                    <div className="col-span-2 text-center">Jumlah</div>
                    <div className="col-span-2 text-center">Satuan</div>
                    <div className="col-span-2 text-right">Harga Satuan</div>
                    <div className="col-span-2 text-right">Subtotal</div>
                  </div>

                  {/* Items */}
                  {items.map((item, index) => (
                    <div 
                      key={index} 
                      className="grid grid-cols-12 gap-3 items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50/50 hover:border-gray-300 transition-all bg-white"
                    >
                      <div className="col-span-4">
                        <p className="font-semibold text-sm text-gray-900">{item.nama_barang}</p>
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          value={item.jumlah}
                          onChange={(e) => {
                            handleUpdateItem(index, 'jumlah', Number(e.target.value));
                            setErrors({ ...errors, [`item_${index}_jumlah`]: '' });
                          }}
                          className={`text-center h-9 border-gray-300 ${errors[`item_${index}_jumlah`] ? 'border-red-500' : ''}`}
                          min="1"
                        />
                      </div>
                      <div className="col-span-2 text-center text-sm text-gray-600 font-medium">
                        {item.satuan}
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          value={item.harga_satuan}
                          onChange={(e) => {
                            handleUpdateItem(index, 'harga_satuan', Number(e.target.value));
                            setErrors({ ...errors, [`item_${index}_harga`]: '' });
                          }}
                          className={`text-right h-9 border-gray-300 ${errors[`item_${index}_harga`] ? 'border-red-500' : ''}`}
                          min="0"
                        />
                      </div>
                      <div className="col-span-1 text-right font-semibold text-sm text-gray-900">
                        Rp {item.subtotal.toLocaleString('id-ID')}
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">Belum ada barang ditambahkan</p>
                  <p className="text-xs text-gray-500 mt-1">Pilih barang dari dropdown di atas untuk menambahkannya</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Biaya Tambahan */}
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900 text-base">Biaya Tambahan</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Truck className="h-4 w-4 text-gray-500" />
                    Ongkir
                  </Label>
                  <Input
                    type="number"
                    value={formData.ongkir}
                    onChange={(e) => setFormData({ ...formData, ongkir: Number(e.target.value) })}
                    min="0"
                    placeholder="0"
                    className="h-11 border-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-gray-500" />
                    Diskon
                  </Label>
                  <Input
                    type="number"
                    value={formData.diskon}
                    onChange={(e) => setFormData({ ...formData, diskon: Number(e.target.value) })}
                    min="0"
                    placeholder="0"
                    className="h-11 border-gray-300"
                  />
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Catatan</Label>
                <Textarea
                  value={formData.catatan}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  rows={3}
                  placeholder="Catatan tambahan (opsional)"
                  className="border-gray-300 resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-white border border-blue-100 shadow-sm">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 font-medium">Subtotal Barang:</span>
                  <span className="font-semibold text-gray-900">Rp {calculateSubtotal().toLocaleString('id-ID')}</span>
                </div>
                {formData.ongkir > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 font-medium">Ongkir:</span>
                    <span className="font-semibold text-gray-900">Rp {Number(formData.ongkir || 0).toLocaleString('id-ID')}</span>
                  </div>
                )}
                {formData.diskon > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 font-medium">Diskon:</span>
                    <span className="font-semibold text-red-600">- Rp {Number(formData.diskon || 0).toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="border-t border-blue-200 pt-4 flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total Pembelian:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    Rp {calculateTotal().toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              disabled={saveMutation.isPending}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 h-11 px-6"
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={saveMutation.isPending || items.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm h-11 px-6"
            >
              {saveMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Simpan Pembelian
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
