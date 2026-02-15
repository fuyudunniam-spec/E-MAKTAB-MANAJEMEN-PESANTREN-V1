import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { TabunganSantriService } from '@/modules/santri/shared/services/tabunganSantri.service';

interface FormSetorProps {
    santriId: string;
    santriName: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export const FormSetor: React.FC<FormSetorProps> = ({
    santriId,
    santriName,
    onSuccess,
    onCancel,
}) => {
    const [nominal, setNominal] = useState<number>(0);
    const [deskripsi, setDeskripsi] = useState('Setoran tunai');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (nominal <= 0) return;
        try {
            setLoading(true);
            await TabunganSantriService.setorTabungan({
                santri_id: santriId,
                nominal,
                deskripsi,
            });
            onSuccess();
        } catch (error) {
            console.error('Error setor tabungan:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onCancel()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Setor Tabungan - {santriName}</DialogTitle>
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
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Deskripsi</Label>
                        <Input
                            value={deskripsi}
                            onChange={(e) => setDeskripsi(e.target.value)}
                            placeholder="Deskripsi setoran"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onCancel} disabled={loading}>
                        Batal
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || nominal <= 0}>
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Memproses...
                            </>
                        ) : (
                            'Setor'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
