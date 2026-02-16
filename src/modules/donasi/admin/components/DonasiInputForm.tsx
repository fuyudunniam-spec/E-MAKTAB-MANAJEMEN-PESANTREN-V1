import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Heart, HandCoins, Search } from 'lucide-react';
import { ProgramDonasiService } from '@/modules/donasi/services/donasi.service';
import { DonorService, type DonorSearchResult } from '@/modules/donasi/services/donor.service';
import { supabase } from '@/integrations/supabase/client';

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

interface DonasiInputFormProps {
    onSuccess?: () => void;
    defaultProgramId?: string;
}

export const DonasiInputForm: React.FC<DonasiInputFormProps> = ({ onSuccess, defaultProgramId }) => {
    const [programId, setProgramId] = useState(defaultProgramId || '');
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
            if (onSuccess) onSuccess();
        } catch (e: any) {
            toast.error(e.message || 'Gagal mencatat donasi');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-5">
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
    );
};
