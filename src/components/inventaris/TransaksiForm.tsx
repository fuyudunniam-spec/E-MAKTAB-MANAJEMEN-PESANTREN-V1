import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface TransaksiFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const TransaksiForm: React.FC<TransaksiFormProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    item_id: '',
    jumlah: 0,
    harga: 0,
    tipe: 'Distribusi',
    penerima: '',
    tanggal: new Date().toISOString().split('T')[0],
    catatan: ''
  });

  useEffect(() => {
    if (open) {
      loadItems();
    }
  }, [open]);

  const loadItems = async () => {
    try {
      const { data, error } = await supabase
        .from('inventaris')
        .select('*')
        .gt('jumlah', 0)
        .order('nama_barang');

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading items:', error);
      toast.error('Gagal memuat data inventaris');
    }
  };

  const handleItemChange = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    setSelectedItem(item);
    setFormData({
      ...formData,
      item_id: itemId,
      harga: item?.harga_perolehan || 0
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedItem) {
      toast.error('Pilih item terlebih dahulu');
      return;
    }

    if (formData.jumlah > selectedItem.jumlah) {
      toast.error(`Stok tidak mencukupi. Tersedia: ${selectedItem.jumlah} ${selectedItem.satuan}`);
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('transaksi_inventaris' as any)
        .insert([formData]);

      if (error) throw error;

      toast.success(`Transaksi ${formData.tipe} berhasil dicatat`);
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        item_id: '',
        jumlah: 0,
        harga: 0,
        tipe: 'Distribusi',
        penerima: '',
        tanggal: new Date().toISOString().split('T')[0],
        catatan: ''
      });
      setSelectedItem(null);
    } catch (error) {
      console.error('Error saving transaksi:', error);
      toast.error('Gagal menyimpan transaksi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Transaksi Inventaris</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tipe">Tipe Transaksi *</Label>
            <Select
              value={formData.tipe}
              onValueChange={(value) => setFormData({ ...formData, tipe: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Distribusi">Distribusi (Gratis)</SelectItem>
                <SelectItem value="Penjualan">Penjualan (Berbayar)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="item_id">Item *</Label>
            <Select
              value={formData.item_id}
              onValueChange={handleItemChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih item" />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.nama_barang} - Stok: {item.jumlah} {item.satuan}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedItem && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm"><strong>Kategori:</strong> {selectedItem.kategori}</p>
              <p className="text-sm"><strong>Lokasi:</strong> {selectedItem.lokasi || '-'}</p>
              <p className="text-sm"><strong>Stok Tersedia:</strong> {selectedItem.jumlah} {selectedItem.satuan}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jumlah">Jumlah *</Label>
              <Input
                id="jumlah"
                type="number"
                min="1"
                value={formData.jumlah}
                onChange={(e) => setFormData({ ...formData, jumlah: parseInt(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="harga">
                {formData.tipe === 'Penjualan' ? 'Harga Jual *' : 'Nilai Barang'}
              </Label>
              <Input
                id="harga"
                type="number"
                value={formData.harga}
                onChange={(e) => setFormData({ ...formData, harga: parseFloat(e.target.value) || 0 })}
                required={formData.tipe === 'Penjualan'}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="penerima">Penerima *</Label>
            <Input
              id="penerima"
              value={formData.penerima}
              onChange={(e) => setFormData({ ...formData, penerima: e.target.value })}
              placeholder="Nama penerima"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Tanggal *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(new Date(formData.tanggal), 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={new Date(formData.tanggal)}
                  onSelect={(date) => setFormData({ ...formData, tanggal: date?.toISOString().split('T')[0] || '' })}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="catatan">Catatan</Label>
            <Textarea
              id="catatan"
              value={formData.catatan}
              onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
              rows={3}
            />
          </div>

          {formData.tipe === 'Penjualan' && formData.jumlah > 0 && formData.harga > 0 && (
            <div className="p-3 bg-primary/10 rounded-lg">
              <p className="text-sm font-medium">
                Total: Rp {(formData.jumlah * formData.harga).toLocaleString('id-ID')}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
