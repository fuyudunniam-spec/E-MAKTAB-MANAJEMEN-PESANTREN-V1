import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Plus, TrendingDown, AlertTriangle, Edit, Trash2, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { InventarisForm } from '@/components/inventaris/InventarisForm';
import { TransaksiForm } from '@/components/inventaris/TransaksiForm';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const kondisiColors: Record<string, string> = {
  "Baik": "bg-green-100 text-green-800",
  "Rusak Ringan": "bg-yellow-100 text-yellow-800",
  "Rusak Berat": "bg-red-100 text-red-800",
};

const Inventaris = () => {
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    baik: 0,
    rusakRingan: 0,
    rusakBerat: 0
  });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showTransaksiForm, setShowTransaksiForm] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load items
      const { data: itemsData, error: itemsError } = await supabase
        .from('inventaris')
        .select('*')
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;
      setItems(itemsData || []);

      // Calculate stats
      const total = itemsData?.length || 0;
      const baik = itemsData?.filter(i => i.kondisi === 'Baik').length || 0;
      const rusakRingan = itemsData?.filter(i => i.kondisi === 'Rusak Ringan').length || 0;
      const rusakBerat = itemsData?.filter(i => i.kondisi === 'Rusak Berat').length || 0;

      setStats({ total, baik, rusakRingan, rusakBerat });
    } catch (error) {
      console.error('Error loading inventaris:', error);
      toast.error('Gagal memuat data inventaris');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditData(item);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;

    try {
      const { error } = await supabase
        .from('inventaris')
        .delete()
        .eq('id', deleteItem.id);

      if (error) throw error;

      toast.success('Data inventaris berhasil dihapus');
      loadData();
      setDeleteItem(null);
    } catch (error) {
      console.error('Error deleting inventaris:', error);
      toast.error('Gagal menghapus data inventaris');
    }
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Inventaris</h1>
          <p className="text-muted-foreground">Kelola inventaris pesantren dengan tracking lengkap</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowTransaksiForm(true)}
            variant="outline"
            className="shadow-medium"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Transaksi
          </Button>
          <Button 
            onClick={() => {
              setEditData(null);
              setShowForm(true);
            }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Barang
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Item</CardTitle>
            <Package className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Kondisi Baik</CardTitle>
            <Package className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.baik}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.baik / stats.total) * 100) : 0}% dari total
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Perlu Perbaikan</CardTitle>
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.rusakRingan}</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rusak Berat</CardTitle>
            <TrendingDown className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.rusakBerat}</div>
          </CardContent>
        </Card>
      </div>

      {/* Items Table */}
      <Card className="border-border bg-gradient-card shadow-medium">
        <CardHeader>
          <CardTitle className="text-foreground">Daftar Inventaris</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada data inventaris
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Barang</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead>Kondisi</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.nama_barang}
                      {item.perishable && item.tanggal_kedaluwarsa && (
                        <div className="text-xs text-red-600">
                          Exp: {new Date(item.tanggal_kedaluwarsa).toLocaleDateString()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.tipe}</Badge>
                    </TableCell>
                    <TableCell>{item.kategori}</TableCell>
                    <TableCell>{item.lokasi || '-'}</TableCell>
                    <TableCell>
                      <span className="font-semibold">{item.jumlah}</span> {item.satuan}
                    </TableCell>
                    <TableCell>
                      <Badge className={kondisiColors[item.kondisi]}>
                        {item.kondisi}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatRupiah(item.harga_perolehan || 0)}</TableCell>
                    <TableCell>
                      <Badge variant={item.source === 'Donasi' ? 'default' : 'secondary'}>
                        {item.source}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteItem(item)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Forms */}
      <InventarisForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditData(null);
        }}
        onSuccess={loadData}
        editData={editData}
      />

      <TransaksiForm
        open={showTransaksiForm}
        onOpenChange={setShowTransaksiForm}
        onSuccess={loadData}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Inventaris?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus {deleteItem?.nama_barang}? 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Inventaris;
