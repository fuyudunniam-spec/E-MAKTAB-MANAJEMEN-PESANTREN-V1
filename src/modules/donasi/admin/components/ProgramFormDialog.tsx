import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Heart, Trash2, Plus } from 'lucide-react';
import { ProgramDonasiService, type ProgramDonasi } from '@/modules/donasi/services/donasi.service';
import { type AkunKas } from '@/modules/keuangan/services/akunKas.service';

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

const generateSlug = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

interface ProgramFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editing: ProgramDonasi | null;
    akunKasList: AkunKas[];
}

export const ProgramFormDialog: React.FC<ProgramFormDialogProps> = ({ open, onOpenChange, editing, akunKasList }) => {
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

    useEffect(() => {
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
