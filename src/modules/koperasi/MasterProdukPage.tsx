import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Store,
  Plus,
  Edit,
  Trash2,
  Search,
  Package
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listKoperasiProduk,
  createKoperasiProduk,
  updateKoperasiProduk,
  deleteKoperasiProduk,
  KoperasiProduk,
  KoperasiFormData
} from '@/services/koperasi.service';
import { toast } from 'sonner';
import ModuleHeader from '@/components/layout/ModuleHeader';

const MasterProdukPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduk, setEditingProduk] = useState<KoperasiProduk | null>(null);
  const [formData, setFormData] = useState<KoperasiFormData>({
    nama_produk: '',
    kategori: '',
    harga_beli: 0,
    harga_jual: 0,
    stok_minimum: 0,
    satuan: 'pcs',
    sumber: 'Vendor',
    supplier: '',
    deskripsi: ''
  });

  const tabs = [
    { label: 'Dashboard', path: '/koperasi' },
    { label: 'Master Produk', path: '/koperasi/master' },
    { label: 'Pembelian', path: '/koperasi/pembelian' },
    { label: 'Penjualan', path: '/koperasi/penjualan' },
    { label: 'Laporan SHU', path: '/koperasi/shu' },
    { label: 'Riwayat', path: '/koperasi/transactions' }
  ];

  const { data: produkList, isLoading } = useQuery({
    queryKey: ['koperasi-produk'],
    queryFn: () => listKoperasiProduk(),
    staleTime: 30000
  });

  const createMutation = useMutation({
    mutationFn: createKoperasiProduk,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['koperasi-produk'] });
      toast.success('Produk berhasil ditambahkan');
      resetForm();
    },
    onError: (error: any) => {
      toast.error('Gagal menambahkan produk: ' + error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<KoperasiFormData> }) =>
      updateKoperasiProduk(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['koperasi-produk'] });
      toast.success('Produk berhasil diperbarui');
      resetForm();
    },
    onError: (error: any) => {
      toast.error('Gagal memperbarui produk: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteKoperasiProduk,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['koperasi-produk'] });
      toast.success('Produk berhasil dihapus');
    },
    onError: (error: any) => {
      toast.error('Gagal menghapus produk: ' + error.message);
    }
  });

  const resetForm = () => {
    setFormData({
      nama_produk: '',
      kategori: '',
      harga_beli: 0,
      harga_jual: 0,
      stok_minimum: 0,
      satuan: 'pcs',
      sumber: 'Vendor',
      supplier: '',
      deskripsi: ''
    });
    setEditingProduk(null);
    setShowForm(false);
  };

  const handleEdit = (produk: KoperasiProduk) => {
    setEditingProduk(produk);
    setFormData({
      nama_produk: produk.nama_produk,
      kategori: produk.kategori,
      harga_beli: produk.harga_beli,
      harga_jual: produk.harga_jual,
      stok_minimum: produk.stok_minimum || 0,
      satuan: produk.satuan || 'pcs',
      sumber: produk.sumber,
      supplier: produk.supplier || '',
      deskripsi: produk.deskripsi || ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nama_produk || !formData.kategori) {
      toast.error('Nama produk dan kategori wajib diisi');
      return;
    }

    if (formData.harga_beli <= 0 || formData.harga_jual <= 0) {
      toast.error('Harga beli dan harga jual harus lebih dari 0');
      return;
    }

    if (formData.harga_jual < formData.harga_beli) {
      toast.error('Harga jual harus lebih besar atau sama dengan harga beli');
      return;
    }

    try {
      if (editingProduk) {
        await updateMutation.mutateAsync({ id: editingProduk.id, data: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
    } catch (error) {
      // Error sudah di-handle di mutation
    }
  };

  const filteredProduk = produkList?.filter(p =>
    p.nama_produk.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.kategori.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <ModuleHeader title="Master Produk Koperasi" tabs={tabs} />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Daftar Produk</CardTitle>
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="h-4 w-4 mr-2" />
              {showForm ? 'Batal' : 'Tambah Produk'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Form */}
          {showForm && (
            <Card className="mb-6 border-2">
              <CardHeader>
                <CardTitle>{editingProduk ? 'Edit Produk' : 'Tambah Produk Baru'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nama_produk">Nama Produk *</Label>
                      <Input
                        id="nama_produk"
                        value={formData.nama_produk}
                        onChange={(e) => setFormData({ ...formData, nama_produk: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="kategori">Kategori *</Label>
                      <Input
                        id="kategori"
                        value={formData.kategori}
                        onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="harga_beli">Harga Beli *</Label>
                      <Input
                        id="harga_beli"
                        type="number"
                        min="0"
                        value={formData.harga_beli}
                        onChange={(e) => setFormData({ ...formData, harga_beli: parseFloat(e.target.value) || 0 })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="harga_jual">Harga Jual *</Label>
                      <Input
                        id="harga_jual"
                        type="number"
                        min="0"
                        value={formData.harga_jual}
                        onChange={(e) => setFormData({ ...formData, harga_jual: parseFloat(e.target.value) || 0 })}
                        required
                      />
                      {formData.harga_beli > 0 && formData.harga_jual > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Margin: {formatRupiah(formData.harga_jual - formData.harga_beli)} per unit
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="satuan">Satuan</Label>
                      <Input
                        id="satuan"
                        value={formData.satuan}
                        onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                        placeholder="pcs, kg, liter, dll"
                      />
                    </div>
                    <div>
                      <Label htmlFor="stok_minimum">Stok Minimum</Label>
                      <Input
                        id="stok_minimum"
                        type="number"
                        min="0"
                        value={formData.stok_minimum}
                        onChange={(e) => setFormData({ ...formData, stok_minimum: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="sumber">Sumber Barang *</Label>
                      <select
                        id="sumber"
                        value={formData.sumber}
                        onChange={(e) => setFormData({ ...formData, sumber: e.target.value as 'Inventaris' | 'Vendor' })}
                        className="w-full px-3 py-2 border rounded-md"
                        required
                      >
                        <option value="Vendor">Vendor</option>
                        <option value="Inventaris">Inventaris Yayasan</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="supplier">Supplier</Label>
                      <Input
                        id="supplier"
                        value={formData.supplier}
                        onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                        placeholder="Nama supplier/vendor"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="deskripsi">Deskripsi</Label>
                    <textarea
                      id="deskripsi"
                      value={formData.deskripsi}
                      onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                      {editingProduk ? 'Update' : 'Simpan'}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Batal
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Produk List */}
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredProduk.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Tidak ada produk ditemukan</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProduk.map((produk) => (
                <div
                  key={produk.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{produk.nama_produk}</h4>
                      <Badge variant={produk.status === 'Aktif' ? 'default' : 'secondary'}>
                        {produk.status}
                      </Badge>
                      <Badge variant="outline">{produk.sumber}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{produk.kategori}</p>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span>Beli: {formatRupiah(produk.harga_beli)}</span>
                      <span>Jual: {formatRupiah(produk.harga_jual)}</span>
                      <span className="text-green-600">Margin: {formatRupiah(produk.margin)}</span>
                      <span>Stok: {produk.stok} {produk.satuan || 'pcs'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(produk)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                      onClick={() => {
                        if (confirm('Yakin hapus produk ini?')) {
                          deleteMutation.mutate(produk.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MasterProdukPage;



