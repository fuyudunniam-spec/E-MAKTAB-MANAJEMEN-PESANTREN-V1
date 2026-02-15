import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Heart, Plus, Trash2, Pencil, Eye, EyeOff, Users, RefreshCw,
  BookOpen, HandCoins, MessageSquareHeart, Wallet, Search,
  CheckCircle, XCircle, ClipboardList, Clock, Phone
} from 'lucide-react';
import { ProgramDonasiService, DoaHajatService, type ProgramDonasi, type DoaHajat } from '@/modules/donasi/services/donasi.service';
import { AkunKasService, type AkunKas } from '@/modules/keuangan/services/akunKas.service';
import { DonorService, type DonorSearchResult } from '@/modules/donasi/services/donor.service';
import { supabase } from '@/integrations/supabase/client';

// ============================================
// HELPERS
// ============================================

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

const generateSlug = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// ============================================
// TAB: PROGRAM
// ============================================

const TabProgram: React.FC = () => {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ProgramDonasi | null>(null);

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['programDonasi'],
    queryFn: ProgramDonasiService.getAll,
  });

  const { data: akunKasList = [] } = useQuery({
    queryKey: ['akunKasAll'],
    queryFn: AkunKasService.getAllActive,
  });

  const mDelete = useMutation({
    mutationFn: ProgramDonasiService.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['programDonasi'] }); toast.success('Program dihapus'); },
    onError: () => toast.error('Gagal menghapus program'),
  });

  const handleEdit = (p: ProgramDonasi) => { setEditing(p); setShowForm(true); };
  const handleAdd = () => { setEditing(null); setShowForm(true); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Program Donasi</h2>
          <p className="text-sm text-gray-500">Kelola program donasi yang tampil di halaman publik</p>
        </div>
        <Button onClick={handleAdd} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" /> Tambah Program
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map(i => <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : programs.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <Heart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Belum ada program</p>
          <p className="text-sm text-gray-400 mt-1">Tambahkan program donasi pertama Anda</p>
          <Button onClick={handleAdd} variant="outline" className="mt-4">
            <Plus className="w-4 h-4 mr-2" /> Tambah Program
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {programs.map(p => {
            const progress = p.target_amount > 0 ? Math.min((p.akun_kas_saldo || 0) / p.target_amount * 100, 100) : 0;
            return (
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{p.nama}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">Akun Kas: {p.akun_kas_nama || '—'}</p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button onClick={() => handleEdit(p)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { if (confirm(`Hapus program "${p.nama}"?`)) mDelete.mutate(p.id); }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {p.deskripsi && <p className="text-sm text-gray-500 line-clamp-2 mb-3">{p.deskripsi}</p>}

                {p.target_amount > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Saldo: {formatCurrency(p.akun_kas_saldo || 0)}</span>
                      <span className="text-gray-400">Target: {formatCurrency(p.target_amount)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Form Dialog */}
      <ProgramFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        editing={editing}
        akunKasList={akunKasList}
      />
    </div>
  );
};

// ============================================
// DIALOG: PROGRAM FORM (Enhanced)
// ============================================

const ProgramFormDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: ProgramDonasi | null;
  akunKasList: AkunKas[];
}> = ({ open, onOpenChange, editing, akunKasList }) => {
  const qc = useQueryClient();
  const [nama, setNama] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [slug, setSlug] = useState('');
  const [akunKasId, setAkunKasId] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [waAdmin, setWaAdmin] = useState('');
  const [sanitySlugs, setSanitySlugs] = useState<string[]>([]);
  const [sanityInput, setSanityInput] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (open && editing) {
      setNama(editing.nama);
      setDeskripsi(editing.deskripsi || '');
      setSlug(editing.slug);
      setAkunKasId(editing.akun_kas_id);
      setTargetAmount(editing.target_amount ? String(editing.target_amount) : '');
      setIsActive(editing.is_active);
      setWaAdmin(editing.wa_admin || '');
      setSanitySlugs(editing.sanity_slugs || []);
      setImagePreview(editing.gambar_url || '');
      setImageFile(null);
    } else if (open) {
      setNama(''); setDeskripsi(''); setSlug(''); setAkunKasId(''); setTargetAmount('');
      setIsActive(true); setWaAdmin(''); setSanitySlugs([]); setSanityInput('');
      setImagePreview(''); setImageFile(null);
    }
  }, [open, editing]);

  const handleNamaChange = (v: string) => {
    setNama(v);
    if (!editing) setSlug(generateSlug(v));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddSanitySlug = () => {
    const s = sanityInput.trim();
    if (s && !sanitySlugs.includes(s)) {
      setSanitySlugs([...sanitySlugs, s]);
      setSanityInput('');
    }
  };

  const handleRemoveSanitySlug = (slug: string) => {
    setSanitySlugs(sanitySlugs.filter(s => s !== slug));
  };

  const handleSave = async () => {
    if (!nama.trim() || !akunKasId) {
      toast.error('Nama dan Akun Kas wajib diisi');
      return;
    }
    setSaving(true);
    try {
      let gambar_url = editing?.gambar_url || undefined;

      // Upload image if new file selected
      if (imageFile) {
        gambar_url = await ProgramDonasiService.uploadImage(imageFile);
      }

      const payload = {
        nama: nama.trim(),
        deskripsi: deskripsi.trim() || undefined,
        slug: slug.trim() || generateSlug(nama),
        akun_kas_id: akunKasId,
        target_amount: targetAmount ? parseFloat(targetAmount) : 0,
        is_active: isActive,
        wa_admin: waAdmin.trim() || undefined,
        sanity_slugs: sanitySlugs,
        gambar_url,
      };
      if (editing) {
        await ProgramDonasiService.update(editing.id, payload);
        toast.success('Program diperbarui');
      } else {
        await ProgramDonasiService.create(payload);
        toast.success('Program ditambahkan');
      }
      qc.invalidateQueries({ queryKey: ['programDonasi'] });
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Program' : 'Tambah Program Baru'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Image Cover */}
          <div>
            <Label>Gambar Cover</Label>
            <div className="mt-1">
              {imagePreview ? (
                <div className="relative group">
                  <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg border border-gray-200" />
                  <button
                    onClick={() => { setImagePreview(''); setImageFile(null); }}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors">
                  <div className="text-center">
                    <Heart className="w-6 h-6 mx-auto text-gray-300 mb-1" />
                    <span className="text-sm text-gray-400">Klik untuk upload gambar</span>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              )}
            </div>
          </div>

          <div>
            <Label>Nama Program *</Label>
            <Input value={nama} onChange={e => handleNamaChange(e.target.value)} placeholder="Contoh: Beasiswa Yatim" />
          </div>
          <div>
            <Label>Slug URL</Label>
            <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="beasiswa-yatim" className="font-mono text-sm" />
          </div>
          <div>
            <Label>Deskripsi</Label>
            <Textarea value={deskripsi} onChange={e => setDeskripsi(e.target.value)} rows={3} placeholder="Deskripsi singkat program..." />
          </div>
          <div>
            <Label>Akun Kas Tujuan *</Label>
            <Select value={akunKasId} onValueChange={setAkunKasId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih akun kas..." />
              </SelectTrigger>
              <SelectContent>
                {akunKasList.map(ak => (
                  <SelectItem key={ak.id} value={ak.id}>
                    {ak.nama} — {formatCurrency(ak.saldo_saat_ini)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Target Donasi (Rp)</Label>
            <Input type="number" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} placeholder="0 = tanpa target" />
          </div>

          {/* WA Admin */}
          <div>
            <Label>Nomor WA Admin</Label>
            <Input value={waAdmin} onChange={e => setWaAdmin(e.target.value)} placeholder="6281234567890" className="font-mono text-sm" />
            <p className="text-xs text-gray-400 mt-1">Untuk konfirmasi donasi via WhatsApp (format: 628xxx)</p>
          </div>

          {/* Sanity Slugs */}
          <div>
            <Label>Slug Berita Terkait (Sanity)</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={sanityInput}
                onChange={e => setSanityInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSanitySlug(); } }}
                placeholder="ketik slug lalu Enter..."
                className="font-mono text-sm"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddSanitySlug} className="shrink-0">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {sanitySlugs.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {sanitySlugs.map(s => (
                  <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-mono">
                    {s}
                    <button onClick={() => handleRemoveSanitySlug(s)} className="hover:text-red-500 ml-0.5">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label className="cursor-pointer">Tampilkan di halaman publik</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? 'Menyimpan...' : (editing ? 'Simpan Perubahan' : 'Tambah Program')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ============================================
// TAB: INPUT DONASI
// ============================================

const TabInputDonasi: React.FC = () => {
  const [programId, setProgramId] = useState('');
  const [nominal, setNominal] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [deskripsi, setDeskripsi] = useState('');
  const [donorSearch, setDonorSearch] = useState('');
  const [donorId, setDonorId] = useState('');
  const [donorNama, setDonorNama] = useState('');
  const [showDonorResults, setShowDonorResults] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: programs = [] } = useQuery({
    queryKey: ['programDonasi'],
    queryFn: ProgramDonasiService.getAll,
  });

  const { data: donorResults = [] } = useQuery({
    queryKey: ['donorSearch', donorSearch],
    queryFn: () => DonorService.searchDonors(donorSearch, 5),
    enabled: donorSearch.length >= 2,
  });

  const selectedProgram = useMemo(
    () => programs.find(p => p.id === programId),
    [programs, programId]
  );

  const handleDonorSelect = (d: DonorSearchResult) => {
    setDonorId(d.id);
    setDonorNama(d.nama_lengkap);
    setDonorSearch(d.nama_lengkap);
    setShowDonorResults(false);
  };

  const handleSubmit = async () => {
    if (!programId || !nominal || !tanggal) {
      toast.error('Program, nominal, dan tanggal wajib diisi');
      return;
    }
    if (!selectedProgram) return;

    setSaving(true);
    try {
      // Insert ke keuangan sebagai pemasukan
      const { error } = await supabase.from('keuangan').insert({
        tanggal,
        kategori: 'Donasi',
        sub_kategori: selectedProgram.nama,
        jumlah: parseFloat(nominal),
        akun_kas_id: selectedProgram.akun_kas_id,
        deskripsi: `Donasi ${selectedProgram.nama}${donorNama ? ` — ${donorNama}` : ''}${deskripsi ? `. ${deskripsi}` : ''}`,
        penerima_pembayar: donorNama || 'Hamba Allah',
        jenis_transaksi: 'Pemasukan',
        status: 'posted',
      });

      if (error) throw error;

      // Also store in donations table if donor selected
      if (donorId) {
        await supabase.from('donations').insert({
          donor_id: donorId,
          amount: parseFloat(nominal),
          donation_date: tanggal,
          notes: `Program: ${selectedProgram.nama}. ${deskripsi}`,
          payment_method: 'cash',
          status: 'completed',
        }).select();
      }

      toast.success('Donasi berhasil dicatat');
      setNominal(''); setDeskripsi(''); setDonorSearch(''); setDonorId(''); setDonorNama('');
    } catch (e: any) {
      toast.error(e.message || 'Gagal mencatat donasi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Catat Donasi Offline</h2>
        <p className="text-sm text-gray-500">Catat donasi yang diterima langsung (tunai/transfer manual)</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        {/* Program */}
        <div>
          <Label>Program Donasi *</Label>
          <Select value={programId} onValueChange={setProgramId}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih program..." />
            </SelectTrigger>
            <SelectContent>
              {programs.filter(p => p.is_active).map(p => (
                <SelectItem key={p.id} value={p.id}>
                  <div className="flex items-center gap-2">
                    <Heart className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{p.nama}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedProgram && (
            <p className="text-xs text-gray-400 mt-1">
              Akun Kas: {selectedProgram.akun_kas_nama} — Saldo: {formatCurrency(selectedProgram.akun_kas_saldo || 0)}
            </p>
          )}
        </div>

        {/* Donor (optional) */}
        <div className="relative">
          <Label>Donatur (opsional)</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={donorSearch}
              onChange={e => { setDonorSearch(e.target.value); setShowDonorResults(true); setDonorId(''); setDonorNama(''); }}
              onFocus={() => donorSearch.length >= 2 && setShowDonorResults(true)}
              placeholder="Cari donatur..."
              className="pl-9"
            />
          </div>
          {showDonorResults && donorResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-auto">
              {donorResults.map(d => (
                <button
                  key={d.id}
                  onClick={() => handleDonorSelect(d)}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm border-b last:border-b-0"
                >
                  <span className="font-medium text-gray-900">{d.nama_lengkap}</span>
                  {d.nomor_telepon && <span className="text-gray-400 ml-2">{d.nomor_telepon}</span>}
                </button>
              ))}
            </div>
          )}
          {donorId && <p className="text-xs text-emerald-600 mt-1">✓ Terhubung ke donatur: {donorNama}</p>}
        </div>

        {/* Nominal */}
        <div>
          <Label>Nominal (Rp) *</Label>
          <Input type="number" value={nominal} onChange={e => setNominal(e.target.value)} placeholder="0" />
        </div>

        {/* Tanggal */}
        <div>
          <Label>Tanggal *</Label>
          <Input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} />
        </div>

        {/* Keterangan */}
        <div>
          <Label>Keterangan</Label>
          <Textarea value={deskripsi} onChange={e => setDeskripsi(e.target.value)} rows={2} placeholder="Keterangan tambahan..." />
        </div>

        <Button onClick={handleSubmit} disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700">
          <HandCoins className="w-4 h-4 mr-2" />
          {saving ? 'Menyimpan...' : 'Catat Donasi'}
        </Button>
      </div>
    </div>
  );
};

// ============================================
// TAB: VERIFIKASI DONASI PUBLIK
// ============================================

const TabVerifikasi: React.FC = () => {
  const qc = useQueryClient();

  const { data: pending = [], isLoading } = useQuery({
    queryKey: ['donasiPending'],
    queryFn: DoaHajatService.getPending,
  });

  // Also fetch all with nominal > 0 for verified/rejected history
  const { data: allDonasi = [] } = useQuery({
    queryKey: ['doaHajatAdmin'],
    queryFn: DoaHajatService.getAll,
  });

  const verifiedDonasi = allDonasi.filter(d => d.status === 'verified' && d.nominal > 0);
  const rejectedDonasi = allDonasi.filter(d => d.status === 'rejected' && d.nominal > 0);

  const mVerify = useMutation({
    mutationFn: DoaHajatService.verify,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['donasiPending'] });
      qc.invalidateQueries({ queryKey: ['doaHajatAdmin'] });
      toast.success('Donasi diverifikasi & dicatat ke keuangan');
    },
    onError: (e: any) => toast.error(e.message || 'Gagal memverifikasi'),
  });

  const mReject = useMutation({
    mutationFn: DoaHajatService.reject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['donasiPending'] });
      qc.invalidateQueries({ queryKey: ['doaHajatAdmin'] });
      toast.success('Donasi ditolak');
    },
  });

  const [viewTab, setViewTab] = useState<'pending' | 'history'>('pending');

  const renderBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-700 rounded-full"><Clock className="w-3 h-3" /> Pending</span>;
      case 'verified': return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full"><CheckCircle className="w-3 h-3" /> Verified</span>;
      case 'rejected': return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-red-50 text-red-700 rounded-full"><XCircle className="w-3 h-3" /> Ditolak</span>;
      default: return null;
    }
  };

  const renderTable = (items: DoaHajat[], showActions: boolean) => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 border-b">
              <th className="p-4 text-left font-medium">Tanggal</th>
              <th className="p-4 text-left font-medium">Nama</th>
              <th className="p-4 text-left font-medium">WhatsApp</th>
              <th className="p-4 text-left font-medium">Program</th>
              <th className="p-4 text-right font-medium">Nominal</th>
              <th className="p-4 text-left font-medium">Doa</th>
              <th className="p-4 text-center font-medium">Status</th>
              {showActions && <th className="p-4 text-center font-medium">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={showActions ? 8 : 7} className="p-8 text-center text-gray-400 italic">Tidak ada data</td></tr>
            ) : items.map(d => (
              <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="p-4 text-gray-500 whitespace-nowrap">{formatDate(d.created_at)}</td>
                <td className="p-4 font-medium text-gray-900">{d.nama}</td>
                <td className="p-4">
                  {d.no_wa ? (
                    <a href={`https://wa.me/${d.no_wa.replace(/^0/, '62')}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-emerald-600 hover:underline">
                      <Phone className="w-3 h-3" /> {d.no_wa}
                    </a>
                  ) : <span className="text-gray-300">—</span>}
                </td>
                <td className="p-4 text-gray-600">{d.program_nama || '—'}</td>
                <td className="p-4 text-right font-mono font-bold text-gray-900">{formatCurrency(d.nominal || 0)}</td>
                <td className="p-4 text-gray-500 max-w-[200px] truncate" title={d.pesan_doa}>{d.pesan_doa || '—'}</td>
                <td className="p-4 text-center">{renderBadge(d.status)}</td>
                {showActions && (
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => mVerify.mutate(d.id)}
                        disabled={mVerify.isPending}
                        className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors" title="Verifikasi & Post ke Keuangan"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { if (confirm('Tolak donasi ini?')) mReject.mutate(d.id); }}
                        disabled={mReject.isPending}
                        className="p-2 rounded-lg text-red-400 hover:bg-red-50 transition-colors" title="Tolak"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Verifikasi Donasi Online</h2>
          <p className="text-sm text-gray-500">Verifikasi donasi dari jalur publik, auto-post ke keuangan</p>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full font-medium">
            <Clock className="w-3.5 h-3.5 inline mr-1" /> {pending.length} pending
          </span>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full font-medium">
            <CheckCircle className="w-3.5 h-3.5 inline mr-1" /> {verifiedDonasi.length} verified
          </span>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setViewTab('pending')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewTab === 'pending' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
        >
          Menunggu Verifikasi ({pending.length})
        </button>
        <button
          onClick={() => setViewTab('history')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewTab === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
        >
          Riwayat
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : viewTab === 'pending' ? (
        renderTable(pending, true)
      ) : (
        renderTable([...verifiedDonasi, ...rejectedDonasi].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), false)
      )}
    </div>
  );
};

// ============================================
// TAB: DOA & HAJAT
// ============================================

const DOA_PERIOD_OPTIONS = [
  { label: '7 Hari', value: 7 },
  { label: '14 Hari', value: 14 },
  { label: '30 Hari', value: 30 },
  { label: '60 Hari', value: 60 },
  { label: '90 Hari', value: 90 },
];

const TabDoaHajat: React.FC = () => {
  const [doaPeriod, setDoaPeriod] = useState(30);
  const qc = useQueryClient();

  const { data: doas = [], isLoading } = useQuery({
    queryKey: ['doaHajatAdmin'],
    queryFn: DoaHajatService.getAll,
  });

  const mToggle = useMutation({
    mutationFn: ({ id, visible }: { id: string; visible: boolean }) => DoaHajatService.toggleVisibility(id, visible),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['doaHajatAdmin'] }); toast.success('Status diperbarui'); },
  });

  const mDelete = useMutation({
    mutationFn: DoaHajatService.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['doaHajatAdmin'] }); toast.success('Doa dihapus'); },
  });

  const visibleCount = doas.filter(d => d.is_visible).length;
  const hiddenCount = doas.filter(d => !d.is_visible).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Doa & Hajat</h2>
          <p className="text-sm text-gray-500">
            Moderasi doa/hajat yang dikirim pengunjung halaman donasi
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <label className="text-xs text-gray-500 whitespace-nowrap">Tampil publik:</label>
            <select
              value={doaPeriod}
              onChange={e => setDoaPeriod(parseInt(e.target.value))}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-200"
            >
              {DOA_PERIOD_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label} terakhir</option>
              ))}
            </select>
          </div>
          <div className="w-px h-6 bg-gray-200" />
          <div className="flex gap-3 text-sm">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full font-medium">
              <Eye className="w-3.5 h-3.5 inline mr-1" /> {visibleCount} tampil
            </span>
            <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full font-medium">
              <EyeOff className="w-3.5 h-3.5 inline mr-1" /> {hiddenCount} disembunyikan
            </span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : doas.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <MessageSquareHeart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Belum ada doa/hajat</p>
          <p className="text-sm text-gray-400 mt-1">Doa akan muncul setelah pengunjung mengirimkan melalui halaman donasi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {doas.map(d => (
            <div key={d.id} className={`bg-white rounded-xl border p-4 transition-all ${d.is_visible ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 text-sm">{d.nama}</span>
                    <span className="text-xs text-gray-400">{formatDate(d.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{d.pesan_doa}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => mToggle.mutate({ id: d.id, visible: !d.is_visible })}
                    className={`p-2 rounded-lg transition-colors ${d.is_visible ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-gray-400 bg-gray-50 hover:bg-gray-100'}`}
                    title={d.is_visible ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {d.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => { if (confirm('Hapus doa ini?')) mDelete.mutate(d.id); }}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN DASHBOARD
// ============================================

const DonasiDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const activeTab = sp.get('tab') || 'program';

  const tabs = [
    { key: 'program', label: 'Program', icon: BookOpen },
    { key: 'verifikasi', label: 'Verifikasi', icon: ClipboardList },
    { key: 'input', label: 'Input Donasi', icon: HandCoins },
    { key: 'doa', label: 'Doa & Hajat', icon: MessageSquareHeart },
  ];

  const setTab = (tab: string) => setSp({ tab });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manajemen Donasi</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola program donasi, catat penerimaan, dan moderasi doa</p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/pms/donasi/master-donatur')}
          className="border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          <Users className="w-4 h-4 mr-2" /> Master Donatur
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === 'program' && <TabProgram />}
      {activeTab === 'verifikasi' && <TabVerifikasi />}
      {activeTab === 'input' && <TabInputDonasi />}
      {activeTab === 'doa' && <TabDoaHajat />}
    </div>
  );
};

export default DonasiDashboard;
