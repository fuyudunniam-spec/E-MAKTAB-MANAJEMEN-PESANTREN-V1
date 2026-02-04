import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface EditBagiHasilDialogProps {
    open: boolean;
    onClose: () => void;
    data: any;
}

const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

type ModeKalkulasi = 'standard' | 'custom';

export const EditBagiHasilDialog = ({ open, onClose, data }: EditBagiHasilDialogProps) => {
    const queryClient = useQueryClient();
    const [mode, setMode] = useState<ModeKalkulasi>('standard');
    const [percentageYayasan, setPercentageYayasan] = useState(70);
    const [percentageKoperasi, setPercentageKoperasi] = useState(30);
    const [notes, setNotes] = useState('');
    const [status, setStatus] = useState('unpaid');

    // Fetch transfer aktual untuk periode ini
    const { data: transfers } = useQuery({
        queryKey: ['transfers', data?.bulan, data?.tahun],
        queryFn: async () => {
            if (!data) return [];

            const startDate = startOfMonth(new Date(data.tahun, data.bulan - 1, 1));
            const endDate = endOfMonth(new Date(data.tahun, data.bulan - 1, 1));

            const { data: result } = await supabase
                .from('keuangan')
                .select('tanggal, jumlah, deskripsi')
                .eq('kategori', 'Transfer dari Koperasi')
                .gte('tanggal', startDate.toISOString())
                .lte('tanggal', endDate.toISOString());

            return result || [];
        },
        enabled: open && !!data,
    });

    const totalTransfer = transfers?.reduce((sum, t) => sum + Number(t.jumlah), 0) || 0;

    // Initialize form dari data existing
    useEffect(() => {
        if (data) {
            setMode((data.mode_kalkulasi || 'standard') as ModeKalkulasi);
            setPercentageYayasan(Number(data.percentage_yayasan) || 70);
            setPercentageKoperasi(Number(data.percentage_koperasi) || 30);
            setNotes(data.notes || '');
            setStatus(data.status || 'unpaid');
        }
    }, [data]);

    // Hitung bagi hasil berdasarkan mode dan percentage
    const hitungBagiHasil = () => {
        const totalPenjualan = Number(data?.total_penjualan || 0);
        return {
            yayasan: totalPenjualan * (percentageYayasan / 100),
            koperasi: totalPenjualan * (percentageKoperasi / 100),
        };
    };

    const hasil = hitungBagiHasil();
    const selisih = totalTransfer - hasil.yayasan;

    const updateMutation = useMutation({
        mutationFn: async () => {
            if (!data) return;

            const { error } = await supabase
                .from('koperasi_bagi_hasil_log')
                .update({
                    mode_kalkulasi: mode,
                    percentage_yayasan: percentageYayasan,
                    percentage_koperasi: percentageKoperasi,
                    bagian_yayasan: hasil.yayasan,
                    bagian_koperasi: hasil.koperasi,
                    transfer_actual: totalTransfer,
                    selisih_transfer: selisih,
                    is_custom: mode === 'custom',
                    notes: notes,
                    status: status,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', data.id);

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success('Data bagi hasil berhasil diupdate');
            queryClient.invalidateQueries({ queryKey: ['laporan-bagi-hasil'] });
            onClose();
        },
        onError: (error: any) => {
            toast.error(`Gagal update data: ${error.message}`);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate();
    };

    if (!data) return null;

    const monthName = format(new Date(data.tahun, data.bulan - 1), 'MMMM yyyy', { locale: localeId });

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
                <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl">Edit Bagi Hasil - {monthName}</DialogTitle>
                    <DialogDescription className="text-sm">
                        Atur persentase bagi hasil sesuai keputusan rapat koperasi
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-6 py-4">
                        {/* Data Penjualan */}
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                <Info className="h-4 w-4" />
                                Data Penjualan Periode Ini
                            </h4>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Total Penjualan:</span>
                                <span className="font-mono font-semibold">{formatRupiah(Number(data.total_penjualan || 0))}</span>
                            </div>
                        </div>

                        {/* Mode Kalkulasi */}
                        <div className="space-y-3">
                            <Label className="text-base font-semibold">Mode Kalkulasi Bagi Hasil</Label>
                            <RadioGroup value={mode} onValueChange={(v) => setMode(v as ModeKalkulasi)}>
                                <div className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                                    <RadioGroupItem value="standard" id="standard" className="mt-1" />
                                    <Label htmlFor="standard" className="flex-1 cursor-pointer">
                                        <div className="font-medium">Standard (70% Yayasan : 30% Koperasi)</div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Menggunakan skema bagi hasil default sesuai aturan koperasi
                                        </p>
                                    </Label>
                                </div>
                                <div className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                                    <RadioGroupItem value="custom" id="custom" className="mt-1" />
                                    <Label htmlFor="custom" className="flex-1 cursor-pointer">
                                        <div className="font-medium">Custom (Atur Sendiri)</div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Tentukan persentase bagi hasil sesuai keputusan rapat
                                        </p>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {/* Custom Percentage Controls */}
                        {mode === 'custom' && (
                            <div className="space-y-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                <Label className="text-sm font-semibold">Persentase Bagi Hasil</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="percentage_yayasan" className="text-sm">
                                            Bagian Yayasan (%)
                                        </Label>
                                        <Input
                                            id="percentage_yayasan"
                                            type="number"
                                            min={0}
                                            max={100}
                                            step={0.01}
                                            value={percentageYayasan}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                if (val >= 0 && val <= 100) {
                                                    setPercentageYayasan(val);
                                                    setPercentageKoperasi(100 - val);
                                                }
                                            }}
                                            className="text-right font-mono"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="percentage_koperasi" className="text-sm">
                                            Bagian Koperasi (%)
                                        </Label>
                                        <Input
                                            id="percentage_koperasi"
                                            type="number"
                                            value={percentageKoperasi}
                                            disabled
                                            className="text-right font-mono bg-gray-100"
                                        />
                                    </div>
                                </div>
                                <div className="text-xs text-gray-600 mt-2">
                                    💡 Total harus 100%. Sistem akan otomatis menghitung bagian koperasi.
                                </div>
                            </div>
                        )}

                        {/* Reset ke Standard */}
                        {mode === 'custom' && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setMode('standard');
                                    setPercentageYayasan(70);
                                    setPercentageKoperasi(30);
                                }}
                                className="text-xs"
                            >
                                Reset ke Standard (70:30)
                            </Button>
                        )}

                        {/* Hasil Kalkulasi */}
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                Hasil Kalkulasi
                            </h4>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                        Bagian Yayasan ({percentageYayasan.toFixed(2)}%):
                                    </span>
                                    <span className="font-mono font-semibold text-amber-700">
                                        {formatRupiah(hasil.yayasan)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                        Bagian Koperasi ({percentageKoperasi.toFixed(2)}%):
                                    </span>
                                    <span className="font-mono font-semibold text-green-700">
                                        {formatRupiah(hasil.koperasi)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Transfer Aktual */}
                        {transfers && transfers.length > 0 && (
                            <div className="p-3 sm:p-4 bg-purple-50 border border-purple-200 rounded-lg overflow-hidden">
                                <h4 className="font-semibold text-sm mb-3">📤 Transfer yang Sudah Dilakukan</h4>
                                <div className="space-y-1 mb-3 max-h-32 overflow-y-auto">
                                    {transfers.map((t, idx) => (
                                        <div key={idx} className="flex justify-between gap-2 text-xs sm:text-sm">
                                            <span className="text-gray-600 whitespace-nowrap">
                                                {format(new Date(t.tanggal), 'dd MMM yyyy', { locale: localeId })}
                                            </span>
                                            <span className="font-mono text-right">{formatRupiah(Number(t.jumlah))}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-3 border-t border-purple-300 space-y-2">
                                    <div className="flex justify-between gap-2 text-xs sm:text-sm">
                                        <span className="text-gray-600">Total Transfer:</span>
                                        <span className="font-mono font-semibold text-right">{formatRupiah(totalTransfer)}</span>
                                    </div>
                                    <div className="flex justify-between gap-2 text-xs sm:text-sm">
                                        <span className="text-gray-600">Kewajiban Yayasan:</span>
                                        <span className="font-mono text-right">{formatRupiah(hasil.yayasan)}</span>
                                    </div>
                                    <div className="flex justify-between gap-2 text-xs sm:text-sm font-semibold">
                                        <span className="flex-shrink-0">{selisih >= 0 ? 'Transfer Berlebih:' : 'Kurang Setor:'}</span>
                                        <span className={`font-mono text-right ${selisih >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                            {formatRupiah(Math.abs(selisih))}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Alert untuk transfer berlebih */}
                        {selisih > 0 && (
                            <Alert className="bg-amber-50 border-amber-300">
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                                <AlertDescription className="text-sm">
                                    <strong>Transfer melebihi kewajiban bagi hasil.</strong><br />
                                    Ini bisa berarti koperasi berkontribusi lebih ke yayasan, atau ada transfer yang termasuk
                                    kewajiban periode lain. Silakan tambahkan catatan untuk menjelaskan.
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Status */}
                        <div className="space-y-2">
                            <Label htmlFor="status">Status Pembayaran</Label>
                            <select
                                id="status"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <option value="unpaid">Belum Disetor</option>
                                <option value="paid">Sudah Disetor</option>
                            </select>
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="notes">Catatan (Opsional)</Label>
                            <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Misalnya: Berdasarkan keputusan rapat tanggal XX, bagi hasil diubah menjadi 0:100 karena..."
                                rows={4}
                                className="resize-none"
                            />
                            <p className="text-xs text-gray-500">
                                Catatan ini akan membantu tracking perubahan dan keputusan rapat koperasi
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
