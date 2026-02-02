import React, { useEffect, useState } from 'react';
import { PerizinanSantriService, type IzinSantri, type CreateIzinPayload, type IzinStats } from '@/modules/santri/services/perizinanSantri.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, CheckCircle2, XCircle, Clock, Search, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SantriOption {
  id: string;
  nama_lengkap: string;
  id_santri?: string;
}

interface PerizinanFormData {
  santri_id: string;
  jenis: 'Izin' | 'Sakit' | 'Dispen' | 'Libur Kolektif';
  kategori: 'Harian' | 'Partial-Jam';
  tanggal_mulai: string;
  tanggal_selesai: string;
  jam_mulai?: string;
  jam_selesai?: string;
  alasan?: string;
}

const PerizinanSantriPage: React.FC = () => {
  const [perizinanList, setPerizinanList] = useState<any[]>([]);
  const [santriList, setSantriList] = useState<SantriOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedPerizinan, setSelectedPerizinan] = useState<any | null>(null);
  const [editingPerizinan, setEditingPerizinan] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<PerizinanFormData>({
    santri_id: '',
    jenis: 'Izin',
    kategori: 'Harian',
    tanggal_mulai: new Date().toISOString().split('T')[0],
    tanggal_selesai: new Date().toISOString().split('T')[0],
  });

  const loadSantri = async () => {
    try {
      const { data, error } = await supabase
        .from('santri')
        .select('id, nama_lengkap, id_santri')
        .order('nama_lengkap');

      if (error) throw error;
      setSantriList(data || []);
    } catch (e: any) {
      toast.error(e.message || 'Gagal memuat data santri');
    }
  };

  const loadPerizinan = async () => {
    try {
      setLoading(true);
      const filters: any = {};

      if (activeTab === 'pending') {
        filters.status = 'pending';
      } else if (activeTab === 'approved') {
        filters.status = 'approved';
      } else if (activeTab === 'rejected') {
        filters.status = 'rejected';
      }

      const data = await PerizinanSantriService.listPerizinan(filters);
      setPerizinanList(data);
    } catch (e: any) {
      toast.error(e.message || 'Gagal memuat data perizinan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSantri();
    loadPerizinan();
  }, [activeTab]);

  const handleOpenDialog = (perizinan?: any) => {
    if (perizinan) {
      setEditingPerizinan(perizinan);
      setFormData({
        santri_id: perizinan.santri_id,
        jenis: perizinan.jenis,
        kategori: perizinan.kategori,
        tanggal_mulai: perizinan.tanggal_mulai,
        tanggal_selesai: perizinan.tanggal_selesai,
        jam_mulai: perizinan.jam_mulai || '',
        jam_selesai: perizinan.jam_selesai || '',
        alasan: perizinan.alasan || '',
      });
    } else {
      setEditingPerizinan(null);
      setFormData({
        santri_id: '',
        jenis: 'Izin',
        kategori: 'Harian',
        tanggal_mulai: new Date().toISOString().split('T')[0],
        tanggal_selesai: new Date().toISOString().split('T')[0],
      });
    }
    setDialogOpen(true);
  };

  const handleSavePerizinan = async () => {
    if (!formData.santri_id || !formData.tanggal_mulai || !formData.tanggal_selesai) {
      toast.error('Mohon lengkapi semua field yang wajib');
      return;
    }

    if (new Date(formData.tanggal_selesai) < new Date(formData.tanggal_mulai)) {
      toast.error('Tanggal selesai harus setelah tanggal mulai');
      return;
    }

    if (formData.kategori === 'Partial-Jam' && (!formData.jam_mulai || !formData.jam_selesai)) {
      toast.error('Jam mulai dan selesai wajib diisi untuk perizinan Partial-Jam');
      return;
    }

    try {
      const input: PerizinanSantriInput = {
        santri_id: formData.santri_id,
        jenis: formData.jenis,
        kategori: formData.kategori,
        tanggal_mulai: formData.tanggal_mulai,
        tanggal_selesai: formData.tanggal_selesai,
        jam_mulai: formData.jam_mulai || undefined,
        jam_selesai: formData.jam_selesai || undefined,
        alasan: formData.alasan || undefined,
      };

      if (editingPerizinan) {
        await PerizinanSantriService.updatePerizinan(editingPerizinan.id, input);
        toast.success('Perizinan berhasil diperbarui');
      } else {
        await PerizinanSantriService.createPerizinan(input);
        toast.success('Perizinan berhasil dibuat');
      }

      setDialogOpen(false);
      loadPerizinan();
    } catch (e: any) {
      toast.error(e.message || 'Gagal menyimpan perizinan');
    }
  };

  const handleApprove = async () => {
    if (!selectedPerizinan) return;

    try {
      await PerizinanSantriService.approvePerizinan(selectedPerizinan.id);
      toast.success('Perizinan disetujui');
      setApprovalDialogOpen(false);
      setSelectedPerizinan(null);
      loadPerizinan();
    } catch (e: any) {
      toast.error(e.message || 'Gagal menyetujui perizinan');
    }
  };

  const handleReject = async () => {
    if (!selectedPerizinan) return;

    const reason = prompt('Alasan penolakan (opsional):');
    try {
      await PerizinanSantriService.rejectPerizinan(selectedPerizinan.id, reason || undefined);
      toast.success('Perizinan ditolak');
      setApprovalDialogOpen(false);
      setSelectedPerizinan(null);
      loadPerizinan();
    } catch (e: any) {
      toast.error(e.message || 'Gagal menolak perizinan');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus perizinan ini?')) return;

    try {
      await PerizinanSantriService.deletePerizinan(id);
      toast.success('Perizinan dihapus');
      loadPerizinan();
    } catch (e: any) {
      toast.error(e.message || 'Gagal menghapus perizinan');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />Disetujui</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Ditolak</Badge>;
      case 'auto':
        return <Badge className="bg-blue-100 text-blue-800">Auto</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getJenisBadge = (jenis: string) => {
    switch (jenis) {
      case 'Izin':
        return <Badge variant="outline" className="bg-yellow-50">Izin</Badge>;
      case 'Sakit':
        return <Badge variant="outline" className="bg-blue-50">Sakit</Badge>;
      case 'Dispen':
        return <Badge variant="outline" className="bg-purple-50">Dispen</Badge>;
      case 'Libur Kolektif':
        return <Badge variant="outline" className="bg-gray-50">Libur Kolektif</Badge>;
      default:
        return <Badge variant="outline">{jenis}</Badge>;
    }
  };

  const filteredPerizinan = perizinanList.filter(p => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.santri?.nama_lengkap?.toLowerCase().includes(term) ||
      p.santri?.id_santri?.toLowerCase().includes(term) ||
      p.jenis?.toLowerCase().includes(term) ||
      p.alasan?.toLowerCase().includes(term)
    );
  });

  const stats = {
    all: perizinanList.length,
    pending: perizinanList.filter(p => p.status === 'pending').length,
    approved: perizinanList.filter(p => p.status === 'approved' || p.status === 'auto').length,
    rejected: perizinanList.filter(p => p.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Perizinan Santri</h1>
          <p className="text-muted-foreground">Kelola perizinan santri (izin, sakit, dispensasi)</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Perizinan
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.all}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">Disetujui</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">Ditolak</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Perizinan</CardTitle>
          <CardDescription>Kelola semua perizinan santri</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">Semua ({stats.all})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
              <TabsTrigger value="approved">Disetujui ({stats.approved})</TabsTrigger>
              <TabsTrigger value="rejected">Ditolak ({stats.rejected})</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mt-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Cari nama santri, ID Santri, jenis, atau alasan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
          ) : filteredPerizinan.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Tidak ada perizinan</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Santri</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead>Jam</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Alasan</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPerizinan.map((perizinan) => (
                    <TableRow key={perizinan.id}>
                      <TableCell className="font-medium">
                        {perizinan.santri?.nama_lengkap || '-'}
                        {perizinan.santri?.id_santri && (
                          <div className="text-xs text-muted-foreground">{perizinan.santri.id_santri}</div>
                        )}
                      </TableCell>
                      <TableCell>{getJenisBadge(perizinan.jenis)}</TableCell>
                      <TableCell>{perizinan.kategori}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(perizinan.tanggal_mulai).toLocaleDateString('id-ID')}
                          {perizinan.tanggal_mulai !== perizinan.tanggal_selesai && (
                            <> - {new Date(perizinan.tanggal_selesai).toLocaleDateString('id-ID')}</>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {perizinan.kategori === 'Partial-Jam' && perizinan.jam_mulai && perizinan.jam_selesai
                          ? `${perizinan.jam_mulai} - ${perizinan.jam_selesai}`
                          : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(perizinan.status)}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {perizinan.alasan || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {perizinan.status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedPerizinan(perizinan);
                                  setApprovalDialogOpen(true);
                                }}
                              >
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedPerizinan(perizinan);
                                  handleReject();
                                }}
                              >
                                <XCircle className="w-4 h-4 text-red-600" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(perizinan)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(perizinan.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPerizinan ? 'Edit Perizinan' : 'Tambah Perizinan'}</DialogTitle>
            <DialogDescription>
              Buat perizinan baru untuk santri
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Santri *</Label>
              <Select
                value={formData.santri_id}
                onValueChange={(v) => setFormData({ ...formData, santri_id: v })}
                disabled={!!editingPerizinan}
              >
                <SelectTrigger><SelectValue placeholder="Pilih santri" /></SelectTrigger>
                <SelectContent>
                  {santriList.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nama_lengkap} {s.id_santri ? `(${s.id_santri})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Jenis Perizinan *</Label>
              <Select
                value={formData.jenis}
                onValueChange={(v: any) => setFormData({ ...formData, jenis: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Izin">Izin</SelectItem>
                  <SelectItem value="Sakit">Sakit</SelectItem>
                  <SelectItem value="Dispen">Dispen</SelectItem>
                  <SelectItem value="Libur Kolektif">Libur Kolektif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Kategori *</Label>
              <Select
                value={formData.kategori}
                onValueChange={(v: any) => setFormData({ ...formData, kategori: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Harian">Harian</SelectItem>
                  <SelectItem value="Partial-Jam">Partial-Jam</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tanggal Mulai *</Label>
                <Input
                  type="date"
                  value={formData.tanggal_mulai}
                  onChange={(e) => setFormData({ ...formData, tanggal_mulai: e.target.value })}
                />
              </div>
              <div>
                <Label>Tanggal Selesai *</Label>
                <Input
                  type="date"
                  value={formData.tanggal_selesai}
                  onChange={(e) => setFormData({ ...formData, tanggal_selesai: e.target.value })}
                />
              </div>
            </div>

            {formData.kategori === 'Partial-Jam' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Jam Mulai *</Label>
                  <Input
                    type="time"
                    value={formData.jam_mulai || ''}
                    onChange={(e) => setFormData({ ...formData, jam_mulai: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Jam Selesai *</Label>
                  <Input
                    type="time"
                    value={formData.jam_selesai || ''}
                    onChange={(e) => setFormData({ ...formData, jam_selesai: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div>
              <Label>Alasan</Label>
              <Textarea
                value={formData.alasan || ''}
                onChange={(e) => setFormData({ ...formData, alasan: e.target.value })}
                placeholder="Alasan perizinan"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSavePerizinan}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Setujui Perizinan?</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menyetujui perizinan ini?
            </DialogDescription>
          </DialogHeader>
          {selectedPerizinan && (
            <div className="space-y-2">
              <p><strong>Santri:</strong> {selectedPerizinan.santri?.nama_lengkap}</p>
              <p><strong>Jenis:</strong> {selectedPerizinan.jenis}</p>
              <p><strong>Periode:</strong> {new Date(selectedPerizinan.tanggal_mulai).toLocaleDateString('id-ID')} - {new Date(selectedPerizinan.tanggal_selesai).toLocaleDateString('id-ID')}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>Batal</Button>
            <Button variant="outline" onClick={handleReject} className="bg-red-50 text-red-600 hover:bg-red-100">
              Tolak
            </Button>
            <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
              Setujui
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PerizinanSantriPage;

