import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TagihanService, TagihanSantri, PembayaranSantri } from '@/services/tagihan.service';
import { supabase } from '@/integrations/supabase/client';
import { formatRupiah } from '@/utils/inventaris.utils';
import { DollarSign, Users, HandCoins, Building2, Loader2 } from 'lucide-react';

interface TagihanBantuanPendidikanTabProps {
  santriId: string;
  santriName?: string;
}

interface TagihanSummary {
  total_tagihan: number;
  dibayar_orang_tua: number;
  dibayar_donatur: number;
  sisa_tagihan: number;
}

interface TagihanPeriode {
  periode: string;
  bulan: string;
  total_tagihan: number;
  dibayar_orang_tua: number;
  dibayar_donatur: number;
  sisa_tagihan: number;
  status: string;
}

const TagihanBantuanPendidikanTab: React.FC<TagihanBantuanPendidikanTabProps> = ({
  santriId,
  santriName
}) => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<TagihanSummary>({
    total_tagihan: 0,
    dibayar_orang_tua: 0,
    dibayar_donatur: 0,
    sisa_tagihan: 0
  });
  const [tagihanPeriode, setTagihanPeriode] = useState<TagihanPeriode[]>([]);

  useEffect(() => {
    loadData();
  }, [santriId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get all tagihan for this santri
      const tagihanList = await TagihanService.getTagihan({ santri_id: santriId });
      
      // Get current year
      const currentYear = new Date().getFullYear();
      
      // Filter tagihan for current year
      const tagihanTahunIni = tagihanList.filter(t => {
        const tahun = parseInt(t.periode.split('-')[0]);
        return tahun === currentYear;
      });

      // Calculate summary
      let totalTagihan = 0;
      let dibayarOrangTua = 0;
      let dibayarDonatur = 0;

      // Get payment history for all tagihan
      const paymentPromises = tagihanTahunIni.map(t => TagihanService.getPaymentHistory(t.id));
      const paymentHistories = await Promise.all(paymentPromises);

      // Process payments
      tagihanTahunIni.forEach((tagihan, index) => {
        totalTagihan += tagihan.total_tagihan;
        
        const payments = paymentHistories[index];
        payments.forEach((payment: PembayaranSantri) => {
          if (payment.sumber_pembayaran === 'orang_tua') {
            dibayarOrangTua += payment.jumlah_bayar;
          } else if (payment.sumber_pembayaran === 'donatur') {
            dibayarDonatur += payment.jumlah_bayar;
          }
        });
      });

      const sisaTagihan = totalTagihan - dibayarOrangTua - dibayarDonatur;

      setSummary({
        total_tagihan: totalTagihan,
        dibayar_orang_tua: dibayarOrangTua,
        dibayar_donatur: dibayarDonatur,
        sisa_tagihan: sisaTagihan
      });

      // Process tagihan per periode
      const tagihanPeriodeData: TagihanPeriode[] = tagihanTahunIni.map((tagihan, index) => {
        const payments = paymentHistories[index] || [];
        let dibayarOT = 0;
        let dibayarDon = 0;

        payments.forEach((payment: PembayaranSantri) => {
          if (payment.sumber_pembayaran === 'orang_tua') {
            dibayarOT += payment.jumlah_bayar;
          } else if (payment.sumber_pembayaran === 'donatur') {
            dibayarDon += payment.jumlah_bayar;
          }
        });

        const sisa = tagihan.total_tagihan - dibayarOT - dibayarDon;

        return {
          periode: tagihan.periode,
          bulan: tagihan.bulan,
          total_tagihan: tagihan.total_tagihan,
          dibayar_orang_tua: dibayarOT,
          dibayar_donatur: dibayarDon,
          sisa_tagihan: sisa,
          status: tagihan.status
        };
      });

      setTagihanPeriode(tagihanPeriodeData.sort((a, b) => b.periode.localeCompare(a.periode)));
    } catch (error) {
      console.error('Error loading tagihan data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'belum_bayar': 'bg-gray-100 text-gray-800',
      'dibayar_sebagian': 'bg-blue-100 text-blue-800',
      'lunas': 'bg-green-100 text-green-800',
      'terlambat': 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      'belum_bayar': 'Belum Bayar',
      'dibayar_sebagian': 'Dibayar Sebagian',
      'lunas': 'Lunas',
      'terlambat': 'Terlambat',
    };
    return (
      <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Memuat data tagihan...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tagihan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(summary.total_tagihan)}</div>
            <p className="text-xs text-muted-foreground">Tahun {new Date().getFullYear()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dibayar Orang Tua</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatRupiah(summary.dibayar_orang_tua)}</div>
            <p className="text-xs text-muted-foreground">Pembayaran dari wali</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ditutup Donatur</CardTitle>
            <HandCoins className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatRupiah(summary.dibayar_donatur)}</div>
            <p className="text-xs text-muted-foreground">Bantuan donatur</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sisa Tagihan</CardTitle>
            <Building2 className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatRupiah(summary.sisa_tagihan)}</div>
            <p className="text-xs text-muted-foreground">Belum lunas</p>
          </CardContent>
        </Card>
      </div>

      {/* Tagihan per Periode Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tagihan per Bulan</CardTitle>
        </CardHeader>
        <CardContent>
          {tagihanPeriode.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada tagihan untuk tahun ini
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Periode</TableHead>
                    <TableHead className="text-right">Total Tagihan</TableHead>
                    <TableHead className="text-right">Dibayar Orang Tua</TableHead>
                    <TableHead className="text-right">Dibayar Donatur</TableHead>
                    <TableHead className="text-right">Sisa</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tagihanPeriode.map((item) => (
                    <TableRow key={item.periode}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.bulan}</div>
                          <div className="text-xs text-muted-foreground">{item.periode}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatRupiah(item.total_tagihan)}
                      </TableCell>
                      <TableCell className="text-right text-blue-600">
                        {formatRupiah(item.dibayar_orang_tua)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatRupiah(item.dibayar_donatur)}
                      </TableCell>
                      <TableCell className="text-right text-amber-600">
                        {formatRupiah(item.sisa_tagihan)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(item.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TagihanBantuanPendidikanTab;

