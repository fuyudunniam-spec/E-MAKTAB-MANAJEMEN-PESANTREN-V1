import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Heart, HandCoins, Search } from 'lucide-react';
import { DonorService, type DonorSearchResult } from '@/modules/donasi/services/donor.service';
import { AkunKasService } from '@/modules/keuangan/services/akunKas.service';
import { supabase } from '@/integrations/supabase/client';
import { DnsSubmissionService } from '@/modules/donasi/services/dns.service';
import { MessageSquareQuote, Sparkles, Wallet } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

interface DonasiInputFormProps {
    onSuccess?: () => void;
}

export const DonasiInputForm: React.FC<DonasiInputFormProps> = ({ onSuccess }) => {
    const qc = useQueryClient();
    const [akunKasId, setAkunKasId] = useState('');
    const [nominal, setNominal] = useState('');
    const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
    const [deskripsi, setDeskripsi] = useState('');
    const [donorSearch, setDonorSearch] = useState('');
    const [donorId, setDonorId] = useState('');
    const [donorNama, setDonorNama] = useState('');
    const [pesanDoa, setPesanDoa] = useState('');
    const [showDonorResults, setShowDonorResults] = useState(false);
    const [saving, setSaving] = useState(false);

    const { data: akunKasList = [] } = useQuery({
        queryKey: ['akunKasAll'],
        queryFn: AkunKasService.getAllActive,
    });

    const { data: donorResults = [] } = useQuery({
        queryKey: ['donorSearch', donorSearch],
        queryFn: () => DonorService.searchDonors(donorSearch, 5),
        enabled: donorSearch.length >= 2,
    });

    // programs query removed

    const handleDonorSelect = (d: DonorSearchResult) => {
        setDonorId(d.id);
        setDonorNama(d.nama_lengkap);
        setDonorSearch(d.nama_lengkap);
        setShowDonorResults(false);
    };

    const handleSubmit = async () => {
        const nominalVal = parseFloat(nominal) || 0;

        if (nominalVal > 0 && !akunKasId) {
            toast.error('Pilih akun kas untuk donasi nominal > 0');
            return;
        }

        if (nominalVal === 0 && !pesanDoa) {
            toast.error('Tuliskan pesan doa/hajat jika tidak ada nominal donasi');
            return;
        }

        setSaving(true);
        try {
            // Gunakan DnsSubmissionService.postOffline agar tersinkron ke social proof
            await DnsSubmissionService.postOffline({
                nama: donorNama || donorSearch || 'Hamba Allah',
                no_wa: donorResults.find(d => d.id === donorId)?.nomor_telepon || undefined,
                nominal: nominalVal,
                catatan: deskripsi,
                akun_kas_id: nominalVal > 0 ? akunKasId : undefined,
                tanggal: tanggal,
                pesan_doa: pesanDoa || undefined
            });

            // Jika ada donatur terpilih, simpan juga di tabel donations (opsional, karena postOffline mungkin sudah handle donor profile)
            // Jika ada donatur terpilih, simpan juga di tabel donations (v1 legacy support if needed)
            if (donorId && nominalVal > 0) {
                await supabase.from('donations').insert({
                    donor_id: donorId,
                    amount: nominalVal,
                    donation_date: tanggal,
                    notes: `${deskripsi}${pesanDoa ? ` | Doa: ${pesanDoa}` : ''}`,
                    payment_method: 'cash',
                    status: 'completed',
                });
            }

            toast.success(nominalVal > 0 ? 'Donasi & Doa berhasil dicatat' : 'Pesan doa berhasil dicatata');
            setNominal(''); setDeskripsi(''); setDonorSearch(''); setDonorId(''); setDonorNama(''); setPesanDoa('');
            qc.invalidateQueries({ queryKey: ['dns_social_proof'] });
            if (onSuccess) onSuccess();
        } catch (e: any) {
            toast.error(e.message || 'Gagal mencatat data');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-5">
            {/* Akun Kas */}
            <div>
                <Label>Penerimaan ke Akun (Kas/Bank)</Label>
                <Select value={akunKasId} onValueChange={setAkunKasId}>
                    <SelectTrigger className="border-emerald-100 focus:ring-emerald-200">
                        <SelectValue placeholder="Pilih akun kas (wajib jika > 0)" />
                    </SelectTrigger>
                    <SelectContent>
                        {akunKasList.map(ak => (
                            <SelectItem key={ak.id} value={ak.id}>
                                <div className="flex items-center gap-2">
                                    <Wallet className="w-3.5 h-3.5 text-blue-500" />
                                    <span>{ak.nama}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
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
                <Label>Nominal (Rp)</Label>
                <Input
                    type="number"
                    value={nominal}
                    onChange={e => setNominal(e.target.value)}
                    placeholder="0"
                />
                <p className="text-[10px] text-slate-400 mt-1 italic">Kosongkan/Isi 0 jika hanya ingin mencatat Hajat/Doa saja.</p>
            </div>

            {/* Tanggal */}
            <div>
                <Label>Tanggal *</Label>
                <Input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} />
            </div>

            {/* Pesan Doa / Hajat */}
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-5">
                    <MessageSquareQuote size={48} />
                </div>
                <Label className="text-emerald-900 flex items-center gap-2 mb-2">
                    <MessageSquareQuote className="w-4 h-4" />
                    Pesan Doa / Hajat Donatur
                </Label>
                <Textarea
                    value={pesanDoa}
                    onChange={e => setPesanDoa(e.target.value)}
                    rows={3}
                    placeholder="Tuliskan titipan doa atau hajat di sini..."
                    className="bg-white/80 border-emerald-100 focus:border-emerald-300 focus:ring-emerald-200"
                />
                <p className="text-[10px] text-emerald-600/70 mt-2 italic">
                    Akan otomatis tampil di "Buku Doa Santri" pada halaman publik.
                </p>
            </div>

            {/* Keterangan Internal */}
            <div>
                <Label>Catatan Admin (Internal)</Label>
                <Textarea value={deskripsi} onChange={e => setDeskripsi(e.target.value)} rows={2} placeholder="Keterangan tambahan untuk admin..." />
            </div>

            <Button onClick={handleSubmit} disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700">
                <HandCoins className="w-4 h-4 mr-2" />
                {saving ? 'Menyimpan...' : 'Simpan Data'}
            </Button>
        </div>
    );
};
