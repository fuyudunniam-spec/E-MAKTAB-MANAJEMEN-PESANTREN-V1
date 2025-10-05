import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DonaturFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editData?: any;
}

export const DonaturForm: React.FC<DonaturFormProps> = ({
  open,
  onOpenChange,
  onSuccess,
  editData
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nama_lengkap: editData?.nama_lengkap || '',
    email: editData?.email || '',
    no_telepon: editData?.no_telepon || '',
    alamat: editData?.alamat || '',
    catatan: editData?.catatan || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editData) {
        const { error } = await supabase
          .from('donatur' as any)
          .update(formData)
          .eq('id', editData.id);

        if (error) throw error;
        toast.success('Data donatur berhasil diperbarui');
      } else {
        const { error } = await supabase
          .from('donatur' as any)
          .insert([formData]);

        if (error) throw error;
        toast.success('Data donatur berhasil ditambahkan');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving donatur:', error);
      toast.error('Gagal menyimpan data donatur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editData ? 'Edit Data Donatur' : 'Tambah Data Donatur'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nama_lengkap">Nama Lengkap *</Label>
            <Input
              id="nama_lengkap"
              value={formData.nama_lengkap}
              onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="no_telepon">No. Telepon *</Label>
            <Input
              id="no_telepon"
              value={formData.no_telepon}
              onChange={(e) => setFormData({ ...formData, no_telepon: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="alamat">Alamat</Label>
            <Textarea
              id="alamat"
              value={formData.alamat}
              onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="catatan">Catatan</Label>
            <Textarea
              id="catatan"
              value={formData.catatan}
              onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : editData ? 'Update' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
