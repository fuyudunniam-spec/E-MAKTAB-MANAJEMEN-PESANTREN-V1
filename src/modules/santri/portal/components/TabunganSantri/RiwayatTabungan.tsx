import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { TabunganSantriService } from '@/modules/santri/shared/services/tabunganSantri.service';

interface RiwayatTabunganProps {
    santriId: string;
    santriName: string;
    onClose: () => void;
}

export const RiwayatTabungan: React.FC<RiwayatTabunganProps> = ({
    santriId,
    santriName,
    onClose,
}) => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    useEffect(() => {
        const loadRiwayat = async () => {
            try {
                setLoading(true);
                const riwayat = await TabunganSantriService.getRiwayatTabungan({
                    santri_id: santriId,
                    limit: 50,
                });
                setData(riwayat);
            } catch (error) {
                console.error('Error loading riwayat:', error);
            } finally {
                setLoading(false);
            }
        };
        loadRiwayat();
    }, [santriId]);

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Riwayat Tabungan - {santriName}</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto space-y-2">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : data.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            Belum ada riwayat transaksi
                        </div>
                    ) : (
                        data.map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between p-3 border rounded-md">
                                <div className="flex items-center gap-3">
                                    {item.jenis === 'Setoran' ? (
                                        <TrendingUp className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <TrendingDown className="h-4 w-4 text-red-600" />
                                    )}
                                    <div>
                                        <div className="text-sm font-medium">{item.deskripsi || item.jenis}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {formatDate(item.tanggal || item.created_at)}
                                        </div>
                                    </div>
                                </div>
                                <Badge
                                    variant="outline"
                                    className={
                                        item.jenis === 'Setoran'
                                            ? 'text-green-700 border-green-200 bg-green-50'
                                            : 'text-red-700 border-red-200 bg-red-50'
                                    }
                                >
                                    {item.jenis === 'Setoran' ? '+' : '-'}{formatCurrency(Number(item.nominal))}
                                </Badge>
                            </div>
                        ))
                    )}
                </div>
                <div className="flex justify-end pt-2 border-t">
                    <Button variant="outline" onClick={onClose}>
                        Tutup
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
