import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DonorService, type Donor, type CreateDonorInput, type UpdateDonorInput, type JenisDonatur } from '@/modules/donasi/services/donor.service';
import { toast } from 'sonner';

interface DonorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingDonor?: Donor | null;
}

const JENIS_DONATUR_OPTIONS: { value: JenisDonatur; label: string }[] = [
  { value: 'individu', label: 'Individu' },
  { value: 'perusahaan', label: 'Perusahaan' },
  { value: 'yayasan', label: 'Yayasan' },
  { value: 'komunitas', label: 'Komunitas' },
  { value: 'lembaga', label: 'Lembaga' }
];

const DonorFormDialog: React.FC<DonorFormDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  editingDonor
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateDonorInput>({
    nama_lengkap: '',
    nama_panggilan: '',
    nomor_telepon: '',
    email: '',
    alamat: '',
    jenis_donatur: 'individu',
    status_aktif: true,
    catatan: ''
  });

  useEffect(() => {
    if (open) {
      if (editingDonor) {
        setFormData({
          nama_lengkap: editingDonor.nama_lengkap || '',
          nama_panggilan: editingDonor.nama_panggilan || '',
          nomor_telepon: editingDonor.nomor_telepon || '',
          email: editingDonor.email || '',
          alamat: editingDonor.alamat || '',
          jenis_donatur: editingDonor.jenis_donatur || 'individu',
          status_aktif: editingDonor.status_aktif !== undefined ? editingDonor.status_aktif : true,
          catatan: editingDonor.catatan || ''
        });
      } else {
        resetForm();
      }
    }
  }, [open, editingDonor]);

  const resetForm = () => {
    setFormData({
      nama_lengkap: '',
      nama_panggilan: '',
      nomor_telepon: '',
      email: '',
      alamat: '',
      jenis_donatur: 'individu',
      status_aktif: true,
      catatan: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nama_lengkap.trim()) {
      toast.error('Nama lengkap wajib diisi');
      return;
    }

    try {
      setLoading(true);

      // Prepare data - convert empty strings to null for optional fields
      const dataToSave = {
        ...formData,
        nama_panggilan: formData.nama_panggilan?.trim() || null,
        nomor_telepon: formData.nomor_telepon?.trim() || null,
        email: formData.email?.trim() || null,
        alamat: formData.alamat?.trim() || null,
        catatan: formData.catatan?.trim() || null
      };

      if (editingDonor) {
        const updateData: UpdateDonorInput = {
          id: editingDonor.id,
          ...dataToSave
        };
        await DonorService.updateDonor(updateData);
        toast.success('Donatur berhasil diperbarui');
      } else {
        await DonorService.createDonor(dataToSave);
        toast.success('Donatur berhasil ditambahkan');
      }

      // Call onSuccess first to reload data
      onSuccess();
      
      // Wait a bit to ensure data is loaded
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Reset form and close dialog
      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving donor:', error);
      toast.error(error.message || 'Gagal menyimpan donatur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingDonor ? 'Edit Donatur' : 'Tambah Donatur Baru'}
          </DialogTitle>
          <DialogDescription>
            {editingDonor 
              ? 'Perbarui informasi donatur' 
              : 'Tambahkan donatur baru ke database'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nama_lengkap">
                  Nama Lengkap <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nama_lengkap"
                  value={formData.nama_lengkap}
                  onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                  placeholder="Nama lengkap donatur"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nama_panggilan">Nama Panggilan</Label>
                <Input
                  id="nama_panggilan"
                  value={formData.nama_panggilan}
                  onChange={(e) => setFormData({ ...formData, nama_panggilan: e.target.value })}
                  placeholder="Nama panggilan (opsional)"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="jenis_donatur">Jenis Donatur</Label>
              <Select
                value={formData.jenis_donatur}
                onValueChange={(value) => setFormData({ ...formData, jenis_donatur: value as JenisDonatur })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JENIS_DONATUR_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-sm text-gray-700">Informasi Kontak</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nomor_telepon">Nomor Telepon</Label>
                <Input
                  id="nomor_telepon"
                  value={formData.nomor_telepon}
                  onChange={(e) => setFormData({ ...formData, nomor_telepon: e.target.value })}
                  placeholder="08xx-xxxx-xxxx"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-sm text-gray-700">Alamat</h3>
            <div className="space-y-2">
              <Label htmlFor="alamat">Alamat Lengkap</Label>
              <Textarea
                id="alamat"
                value={formData.alamat}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                placeholder="Jalan, RT/RW, Kelurahan, Kota, Provinsi"
                rows={3}
              />
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="catatan">Catatan</Label>
              <Textarea
                id="catatan"
                value={formData.catatan}
                onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                placeholder="Catatan tambahan tentang donatur"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="status_aktif"
                checked={formData.status_aktif}
                onCheckedChange={(checked) => setFormData({ ...formData, status_aktif: checked as boolean })}
              />
              <Label htmlFor="status_aktif" className="text-sm font-normal cursor-pointer">
                Donatur aktif
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : editingDonor ? 'Perbarui' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DonorFormDialog;

