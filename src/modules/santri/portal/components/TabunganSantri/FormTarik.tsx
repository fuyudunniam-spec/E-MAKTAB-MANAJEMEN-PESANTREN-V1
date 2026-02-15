import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { TabunganSantriService } from '@/modules/santri/shared/services/tabunganSantri.service';

interface FormTarikProps {
    santriId: string;
    santriName: string;
    saldoSaatIni: number;
    onSuccess: () => void;
    onCancel: () => void;
}

export const FormTarik: React.FC<FormTarikProps> = ({
    santriId,
    santriName,
    saldoSaatIni,
    onSuccess,
    onCancel,
}) => {
    const [nominal, setNominal] = useState<number>(0);
    const [deskripsi, setDeskripsi] = useState('Penarikan tunai');
    const [loading, setLoading] = useState(false);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

    const canSubmit = nominal > 0 && nominal <= saldoSaatIni;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        try {
            setLoading(true);
            await TabunganSantriService.tarikTabungan({
                santri_id: santriId,
                nominal,
                deskripsi,
            });
            onSuccess();
        } catch (error) {
            console.error('Error tarik tabungan:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onCancel()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Tarik Tabungan - {santriName}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Nominal</Label>
                        <Input
                            type="number"
                            value={nominal || ''}
                            onChange={(e) => setNominal(Number(e.target.value))}
                            placeholder="Masukkan nominal"
                            min={1}
                            max={saldoSaatIni}
                        />
                        <p className="text-xs text-muted-foreground">
                            Saldo tersedia: {formatCurrency(saldoSaatIni)}
                        </p>
                        {nominal > saldoSaatIni && (
                            <p className="text-xs text-red-500">Nominal melebihi saldo</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label>Deskripsi</Label>
                        <Input
                            value={deskripsi}
                            onChange={(e) => setDeskripsi(e.target.value)}
                            placeholder="Deskripsi penarikan"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onCancel} disabled={loading}>
                        Batal
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || !canSubmit}>
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Memproses...
                            </>
                        ) : (
                            'Tarik'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
