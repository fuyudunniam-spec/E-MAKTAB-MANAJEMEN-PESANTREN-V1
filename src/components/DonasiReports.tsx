import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  BarChart3, 
  TrendingUp, 
  Download,
  DollarSign,
  Gift,
  FileText,
  CheckCircle,
  Calendar,
  User
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Donation {
  id: string;
  donation_type: 'cash' | 'in_kind' | 'pledge' | 'mixed';
  donor_name: string;
  donation_date: string;
  cash_amount?: number;
  status: string;
  posted_to_stock_at?: string;
  posted_to_finance_at?: string;
}

interface DonationItemDB {
  id: string;
  donation_id: string;
  raw_item_name: string;
  quantity: number;
  uom: string;
  estimated_value?: number;
  is_posted_to_stock: boolean;
  posted_at?: string;
}

const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const DonasiReports = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [donationItems, setDonationItems] = useState<DonationItemDB[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [donationsRes, itemsRes] = await Promise.all([
        supabase.from('donations').select('*').order('created_at', { ascending: false }),
        supabase.from('donation_items').select('*')
      ]);

      if (donationsRes.error) throw donationsRes.error;
      if (itemsRes.error) throw itemsRes.error;

      setDonations(donationsRes.data || []);
      setDonationItems(itemsRes.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Gagal memuat data laporan");
    } finally {
      setLoading(false);
    }
  };

  // ================================================
  // STATISTICS BY TYPE
  // ================================================
  const cashDonations = donations.filter(d => d.donation_type === 'cash' && d.status !== 'cancelled');
  const inKindDonations = donations.filter(d => d.donation_type === 'in_kind' && d.status !== 'cancelled');
  const pledgeDonations = donations.filter(d => d.donation_type === 'pledge' && d.status !== 'cancelled');

  const totalCash = cashDonations.reduce((sum, d) => sum + (d.cash_amount || 0), 0);
  
  const totalInKindValue = donationItems
    .filter(item => {
      const donation = donations.find(d => d.id === item.donation_id);
      return donation && donation.donation_type === 'in_kind' && donation.status !== 'cancelled';
    })
    .reduce((sum, item) => sum + ((item.estimated_value || 0) * item.quantity), 0);

  // Posted items
  const postedItems = donationItems.filter(item => item.is_posted_to_stock);
  const postedDonations = donations.filter(d => d.posted_to_stock_at);

  // ================================================
  // MONTHLY STATISTICS
  // ================================================
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const thisMonthDonations = donations.filter(d => {
    const donationDate = new Date(d.donation_date);
    return donationDate.getMonth() === currentMonth && 
           donationDate.getFullYear() === currentYear &&
           d.status !== 'cancelled';
  });

  const thisMonthCash = thisMonthDonations
    .filter(d => d.donation_type === 'cash')
    .reduce((sum, d) => sum + (d.cash_amount || 0), 0);

  // ================================================
  // TOP DONORS
  // ================================================
  const donorStats = donations
    .filter(d => d.status !== 'cancelled')
    .reduce((acc, d) => {
      if (!acc[d.donor_name]) {
        acc[d.donor_name] = {
          count: 0,
          totalCash: 0,
          lastDonation: d.donation_date
        };
      }
      acc[d.donor_name].count += 1;
      
      // Hitung totalCash untuk cash dan mixed donations
      if (d.donation_type === 'cash') {
        acc[d.donor_name].totalCash += d.cash_amount || 0;
      } else if (d.donation_type === 'mixed') {
        // Untuk mixed: cash_amount + nilai barang
        const cashAmount = d.cash_amount || 0;
        const itemsValue = donationItems
          .filter(item => item.donation_id === d.id)
          .reduce((sum, item) => sum + ((item.estimated_value || 0) * item.quantity), 0);
        acc[d.donor_name].totalCash += cashAmount + itemsValue;
      } else if (d.donation_type === 'in_kind') {
        // Untuk in_kind: hanya nilai barang
        const itemsValue = donationItems
          .filter(item => item.donation_id === d.id)
          .reduce((sum, item) => sum + ((item.estimated_value || 0) * item.quantity), 0);
        acc[d.donor_name].totalCash += itemsValue;
      }
      
      if (new Date(d.donation_date) > new Date(acc[d.donor_name].lastDonation)) {
        acc[d.donor_name].lastDonation = d.donation_date;
      }
      return acc;
    }, {} as Record<string, { count: number; totalCash: number; lastDonation: string }>);

  const topDonors = Object.entries(donorStats)
    .sort((a, b) => b[1].totalCash - a[1].totalCash)
    .slice(0, 10);

  // ================================================
  // EXPORT TO CSV
  // ================================================
  const exportToCSV = () => {
    const headers = [
      'Tanggal',
      'Donatur',
      'Tipe',
      'Jumlah/Nilai',
      'Status',
      'Posted to Stock',
      'Posted to Finance'
    ];

    const rows = donations.map(d => [
      d.donation_date,
      d.donor_name,
      d.donation_type,
      d.donation_type === 'cash' ? (d.cash_amount || 0).toString() : 'N/A',
      d.status,
      d.posted_to_stock_at ? 'Ya' : 'Tidak',
      d.posted_to_finance_at ? 'Ya' : 'Tidak'
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `laporan-donasi-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success('Laporan berhasil diekspor');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat laporan...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          Laporan Donasi
        </h2>
        <Button onClick={exportToCSV}>
          <Download className="w-4 h-4 mr-2" />
          Ekspor CSV
        </Button>
      </div>

      {/* Summary by Type */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan per Tipe Donasi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Tunai (Cash)</span>
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold">{cashDonations.length} donasi</p>
              <p className="text-xl font-semibold text-green-600">{formatRupiah(totalCash)}</p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Barang (In-Kind)</span>
                <Gift className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold">{inKindDonations.length} donasi</p>
              <p className="text-sm text-muted-foreground">{donationItems.length} item</p>
              <p className="text-xl font-semibold text-blue-600">{formatRupiah(totalInKindValue)}</p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Janji (Pledge)</span>
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold">{pledgeDonations.length} donasi</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performa Bulan Ini</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Total Donasi</span>
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <p className="text-2xl font-bold">{thisMonthDonations.length}</p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Total Tunai</span>
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-xl font-bold text-green-600">{formatRupiah(thisMonthCash)}</p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Barang Diterima</span>
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold">{postedItems.length}</p>
              <p className="text-sm text-muted-foreground">item ke gudang</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Donors */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Donatur</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Nama Donatur</TableHead>
                  <TableHead>Total Donasi</TableHead>
                  <TableHead>Total Nilai Tunai</TableHead>
                  <TableHead>Terakhir Donasi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topDonors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Belum ada data donatur
                    </TableCell>
                  </TableRow>
                ) : (
                  topDonors.map(([name, stats], index) => (
                    <TableRow key={name}>
                      <TableCell>
                        <Badge variant={index < 3 ? "default" : "outline"}>
                          #{index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          {name}
                        </div>
                      </TableCell>
                      <TableCell>{stats.count}x</TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatRupiah(stats.totalCash)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {formatDate(stats.lastDonation)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {topDonors.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Belum ada data donatur
              </div>
            ) : (
              topDonors.map(([name, stats], index) => (
                <Card key={name} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={index < 3 ? "default" : "outline"} className="text-sm">
                          #{index + 1}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{name}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Total Donasi</span>
                        <span className="text-sm font-medium">{stats.count}x</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Total Nilai Tunai</span>
                        <span className="text-sm font-semibold text-green-600">
                          {formatRupiah(stats.totalCash)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-xs text-muted-foreground">Terakhir Donasi</span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {formatDate(stats.lastDonation)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Posted Items List */}
      <Card>
        <CardHeader>
          <CardTitle>Barang yang Sudah Diterima ke Gudang</CardTitle>
        </CardHeader>
        <CardContent>
          {postedItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada barang yang diterima ke gudang
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Nilai Taksir</TableHead>
                      <TableHead>Tanggal Posting</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {postedItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.raw_item_name}</TableCell>
                        <TableCell>
                          {item.quantity} {item.uom}
                        </TableCell>
                        <TableCell>
                          {item.estimated_value ? formatRupiah(item.estimated_value * item.quantity) : '-'}
                        </TableCell>
                        <TableCell>
                          {item.posted_at ? formatDate(item.posted_at) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Diterima
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {postedItems.map((item) => (
                  <Card key={item.id} className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="mb-3">
                        <h4 className="font-medium text-sm mb-2">{item.raw_item_name}</h4>
                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Diterima
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Jumlah</span>
                          <span className="text-sm font-medium">
                            {item.quantity} {item.uom}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Nilai Taksir</span>
                          <span className="text-sm font-semibold text-green-600">
                            {item.estimated_value ? formatRupiah(item.estimated_value * item.quantity) : '-'}
                          </span>
                        </div>
                        {item.posted_at && (
                          <div className="flex justify-between items-center pt-2 border-t">
                            <span className="text-xs text-muted-foreground">Tanggal Posting</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(item.posted_at)}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* All Donations Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Semua Donasi</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Donatur</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Nilai/Jumlah</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Posting</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donations.slice(0, 20).map((donation) => {
                  const items = donationItems.filter(i => i.donation_id === donation.id);
                  const itemsValue = items.reduce((sum, item) => sum + ((item.estimated_value || 0) * item.quantity), 0);
                  const totalValue = donation.donation_type === 'cash' 
                    ? (donation.cash_amount || 0)
                    : donation.donation_type === 'mixed'
                    ? (donation.cash_amount || 0) + itemsValue
                    : itemsValue;
                  
                  return (
                    <TableRow key={donation.id}>
                      <TableCell>{formatDate(donation.donation_date)}</TableCell>
                      <TableCell className="font-medium">{donation.donor_name}</TableCell>
                      <TableCell>
                        {donation.donation_type === 'cash' && (
                          <Badge className="bg-green-100 text-green-800 border-green-200">Tunai</Badge>
                        )}
                        {donation.donation_type === 'in_kind' && (
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">Barang</Badge>
                        )}
                        {donation.donation_type === 'mixed' && (
                          <Badge className="bg-orange-100 text-orange-800 border-orange-200">Campuran</Badge>
                        )}
                        {donation.donation_type === 'pledge' && (
                          <Badge className="bg-purple-100 text-purple-800 border-purple-200">Janji</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {donation.donation_type === 'cash' 
                          ? formatRupiah(donation.cash_amount || 0)
                          : donation.donation_type === 'mixed'
                          ? formatRupiah(totalValue)
                          : `${items.length} item`
                        }
                      </TableCell>
                      <TableCell>
                        {donation.status === 'posted' && (
                          <Badge className="bg-green-100 text-green-800 border-green-200">Diposting</Badge>
                        )}
                        {donation.status === 'received' && (
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">Diterima</Badge>
                        )}
                        {donation.status === 'pending' && (
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>
                        )}
                        {donation.status === 'cancelled' && (
                          <Badge className="bg-red-100 text-red-800 border-red-200">Dibatalkan</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {donation.posted_to_stock_at && (
                            <Badge variant="outline" className="bg-green-50 text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Stok
                            </Badge>
                          )}
                          {donation.posted_to_finance_at && (
                            <Badge variant="outline" className="bg-blue-50 text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Keuangan
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {donations.slice(0, 20).map((donation) => {
              const items = donationItems.filter(i => i.donation_id === donation.id);
              const itemsValue = items.reduce((sum, item) => sum + ((item.estimated_value || 0) * item.quantity), 0);
              const totalValue = donation.donation_type === 'cash' 
                ? (donation.cash_amount || 0)
                : donation.donation_type === 'mixed'
                ? (donation.cash_amount || 0) + itemsValue
                : itemsValue;
              
              return (
                <Card key={donation.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-sm mb-1">{donation.donor_name}</h4>
                        <p className="text-xs text-muted-foreground">{formatDate(donation.donation_date)}</p>
                      </div>
                      <div>
                        {donation.donation_type === 'cash' && (
                          <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">Tunai</Badge>
                        )}
                        {donation.donation_type === 'in_kind' && (
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">Barang</Badge>
                        )}
                        {donation.donation_type === 'mixed' && (
                          <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">Campuran</Badge>
                        )}
                        {donation.donation_type === 'pledge' && (
                          <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">Janji</Badge>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Nilai/Jumlah</span>
                        <span className="text-sm font-semibold text-green-600">
                          {donation.donation_type === 'cash' 
                            ? formatRupiah(donation.cash_amount || 0)
                            : donation.donation_type === 'mixed'
                            ? formatRupiah(totalValue)
                            : `${items.length} item`
                          }
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Status</span>
                        <div>
                          {donation.status === 'posted' && (
                            <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">Diposting</Badge>
                          )}
                          {donation.status === 'received' && (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">Diterima</Badge>
                          )}
                          {donation.status === 'pending' && (
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">Pending</Badge>
                          )}
                          {donation.status === 'cancelled' && (
                            <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">Dibatalkan</Badge>
                          )}
                        </div>
                      </div>
                      {(donation.posted_to_stock_at || donation.posted_to_finance_at) && (
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="text-xs text-muted-foreground">Posting</span>
                          <div className="flex gap-1">
                            {donation.posted_to_stock_at && (
                              <Badge variant="outline" className="bg-green-50 text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Stok
                              </Badge>
                            )}
                            {donation.posted_to_finance_at && (
                              <Badge variant="outline" className="bg-blue-50 text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Keuangan
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {donations.length > 20 && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              Menampilkan 20 dari {donations.length} donasi
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DonasiReports;

