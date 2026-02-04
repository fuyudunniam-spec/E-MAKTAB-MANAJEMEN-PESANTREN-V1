import React, { useCallback, useEffect, useState } from 'react';
import { AkademikAgendaService } from '@/modules/akademik/services/akademikAgenda.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Search, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Pengajar {
  id: string;
  nama_lengkap: string;
  status: 'Aktif' | 'Non-Aktif';
  kode_pengajar?: string | null;
}

const PengajarMasterPage: React.FC = () => {
  const { user } = useAuth();
  const isAdminOrStaff = user?.role === 'admin' || user?.role === 'staff';
  
  const [pengajarList, setPengajarList] = useState<Pengajar[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPengajar, setEditingPengajar] = useState<Pengajar | null>(null);
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    kode_pengajar: '',
    status: 'Aktif' as 'Aktif' | 'Non-Aktif',
    kontak: '',
    catatan: '',
  });

  const loadPengajar = useCallback(async () => {
    try {
      setLoading(true);
      const data = await AkademikAgendaService.listPengajar('Semua');
      setPengajarList(data);
    } catch (e: any) {
      toast.error(e.message || 'Gagal memuat data pengajar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPengajar();
  }, [loadPengajar]);

  const filteredPengajar = React.useMemo(() => {
    if (!searchTerm) return pengajarList;
    const term = searchTerm.toLowerCase();
    return pengajarList.filter(p => 
      p.nama_lengkap.toLowerCase().includes(term) ||
      (p.kode_pengajar && p.kode_pengajar.toLowerCase().includes(term))
    );
  }, [pengajarList, searchTerm]);

  const paginatedPengajar = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPengajar.slice(start, start + itemsPerPage);
  }, [filteredPengajar, currentPage]);

  const totalPages = Math.ceil(filteredPengajar.length / itemsPerPage);

  const handleOpenDialog = (pengajar?: Pengajar) => {
    if (pengajar) {
      setEditingPengajar(pengajar);
      setFormData({
        nama_lengkap: pengajar.nama_lengkap,
        kode_pengajar: pengajar.kode_pengajar || '',
        status: pengajar.status,
        kontak: '',
        catatan: '',
      });
    } else {
      setEditingPengajar(null);
      setFormData({
        nama_lengkap: '',
        kode_pengajar: '',
        status: 'Aktif',
        kontak: '',
        catatan: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nama_lengkap.trim()) {
      toast.error('Nama pengajar wajib diisi');
      return;
    }

    try {
      if (editingPengajar) {
        await AkademikAgendaService.updatePengajar(editingPengajar.id, {
          nama_lengkap: formData.nama_lengkap.trim(),
          kode_pengajar: formData.kode_pengajar.trim() || null,
          status: formData.status,
          kontak: formData.kontak.trim() || null,
          catatan: formData.catatan.trim() || null,
        });
        toast.success('Pengajar berhasil diperbarui');
      } else {
        await AkademikAgendaService.createPengajar({
          nama_lengkap: formData.nama_lengkap.trim(),
          kode_pengajar: formData.kode_pengajar.trim() || null,
          status: formData.status,
          kontak: formData.kontak.trim() || null,
          catatan: formData.catatan.trim() || null,
        });
        toast.success('Pengajar berhasil ditambahkan');
      }
      setDialogOpen(false);
      loadPengajar();
    } catch (e: any) {
      toast.error(e.message || 'Gagal menyimpan pengajar');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus pengajar ini? Tindakan ini tidak dapat dibatalkan.')) return;
    try {
      await AkademikAgendaService.deletePengajar(id);
      toast.success('Pengajar berhasil dihapus');
      loadPengajar();
    } catch (e: any) {
      toast.error(e.message || 'Gagal menghapus pengajar');
    }
  };

  const handleToggleStatus = async (pengajar: Pengajar) => {
    try {
      await AkademikAgendaService.updatePengajar(pengajar.id, {
        status: pengajar.status === 'Aktif' ? 'Non-Aktif' : 'Aktif',
      });
      toast.success(`Pengajar ${pengajar.status === 'Aktif' ? 'dinonaktifkan' : 'diaktifkan'}`);
      loadPengajar();
    } catch (e: any) {
      toast.error(e.message || 'Gagal mengubah status');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Master Pengajar</h2>
          <p className="text-sm text-muted-foreground">Kelola data pengajar</p>
        </div>
        {isAdminOrStaff && (
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Pengajar
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari pengajar..."
            className="pl-8"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-7 w-7 p-0"
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Kode</TableHead>
              <TableHead>Status</TableHead>
              {isAdminOrStaff && <TableHead className="text-right">Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={isAdminOrStaff ? 4 : 3} className="text-center text-muted-foreground">
                  Memuat...
                </TableCell>
              </TableRow>
            ) : paginatedPengajar.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdminOrStaff ? 4 : 3} className="text-center text-muted-foreground">
                  {searchTerm ? 'Tidak ada pengajar yang cocok' : 'Belum ada pengajar'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedPengajar.map((pengajar) => (
                <TableRow key={pengajar.id}>
                  <TableCell className="font-medium">{pengajar.nama_lengkap}</TableCell>
                  <TableCell>{pengajar.kode_pengajar || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={pengajar.status === 'Aktif' ? 'default' : 'secondary'}>
                      {pengajar.status}
                    </Badge>
                  </TableCell>
                  {isAdminOrStaff && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(pengajar)}
                        >
                          {pengajar.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(pengajar)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(pengajar.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredPengajar.length)} dari {filteredPengajar.length} pengajar
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPengajar ? 'Edit Pengajar' : 'Tambah Pengajar Baru'}</DialogTitle>
            <DialogDescription>
              {editingPengajar ? 'Perbarui informasi pengajar' : 'Tambahkan pengajar baru ke master data'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nama Pengajar *</Label>
              <Input
                value={formData.nama_lengkap}
                onChange={(e) => setFormData(prev => ({ ...prev, nama_lengkap: e.target.value }))}
                placeholder="Contoh: Ust. Ahmad"
              />
            </div>
            <div>
              <Label>Kode Pengajar</Label>
              <Input
                value={formData.kode_pengajar}
                onChange={(e) => setFormData(prev => ({ ...prev, kode_pengajar: e.target.value }))}
                placeholder="Opsional"
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as 'Aktif' | 'Non-Aktif' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aktif">Aktif</SelectItem>
                  <SelectItem value="Non-Aktif">Non-Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Kontak</Label>
              <Input
                value={formData.kontak}
                onChange={(e) => setFormData(prev => ({ ...prev, kontak: e.target.value }))}
                placeholder="Opsional"
              />
            </div>
            <div>
              <Label>Catatan</Label>
              <Textarea
                value={formData.catatan}
                onChange={(e) => setFormData(prev => ({ ...prev, catatan: e.target.value }))}
                rows={3}
                placeholder="Catatan opsional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PengajarMasterPage;

