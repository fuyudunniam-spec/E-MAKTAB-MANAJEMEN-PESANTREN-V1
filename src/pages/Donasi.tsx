import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Users, TrendingUp, Plus, DollarSign, Package, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DonasiForm } from '@/components/donasi/DonasiForm';
import { DonaturForm } from '@/components/donasi/DonaturForm';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Donasi = () => {
  const [donations, setDonations] = useState<any[]>([]);
  const [donaturList, setDonaturList] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUang: 0,
    totalBarang: 0,
    totalDonatur: 0,
    bulanIni: 0
  });
  const [topDonatur, setTopDonatur] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDonasiForm, setShowDonasiForm] = useState(false);
  const [showDonaturForm, setShowDonaturForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load donations
      const { data: donasiData, error: donasiError } = await supabase
        .from('donasi')
        .select('*')
        .order('tanggal_donasi', { ascending: false })
        .limit(50);

      if (donasiError) throw donasiError;
      setDonations(donasiData || []);

      // Load donatur
      const { data: donaturData, error: donaturError } = await supabase
        .from('donatur' as any)
        .select('*')
        .order('total_donasi', { ascending: false })
        .limit(10);

      if (donaturError) throw donaturError;
      setDonaturList(donaturData || []);
      setTopDonatur(donaturData?.slice(0, 5) || []);

      // Calculate stats
      const totalUang = donasiData
        ?.filter(d => d.jenis_donasi === 'Uang')
        .reduce((sum, d) => sum + (d.jumlah || 0), 0) || 0;
      
      const totalBarang = donasiData?.filter(d => d.jenis_donasi === 'Barang').length || 0;
      
      const totalDonatur = donaturData?.length || 0;

      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const bulanIni = donasiData
        ?.filter(d => {
          const donationDate = new Date(d.tanggal_donasi);
          return donationDate >= firstDayOfMonth && d.jenis_donasi === 'Uang';
        })
        .reduce((sum, d) => sum + (d.jumlah || 0), 0) || 0;

      setStats({ totalUang, totalBarang, totalDonatur, bulanIni });
    } catch (error) {
      console.error('Error loading donasi:', error);
      toast.error('Gagal memuat data donasi');
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const kategoriColors: Record<string, string> = {
    "Pending": "bg-yellow-100 text-yellow-800",
    "Diterima": "bg-green-100 text-green-800",
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Donasi</h1>
          <p className="text-muted-foreground">Kelola donasi dengan integrasi otomatis</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowDonaturForm(true)}
            variant="outline"
            className="shadow-medium"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Tambah Donatur
          </Button>
          <Button 
            onClick={() => setShowDonasiForm(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Catat Donasi
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Donasi Uang</CardTitle>
            <DollarSign className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatRupiah(stats.totalUang)}</div>
            <p className="text-xs text-muted-foreground mt-1">Sepanjang masa</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bulan Ini</CardTitle>
            <TrendingUp className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatRupiah(stats.bulanIni)}</div>
            <p className="text-xs text-muted-foreground mt-1">Donasi uang</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Donatur</CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalDonatur}</div>
            <p className="text-xs text-muted-foreground mt-1">Terdaftar</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Donasi Barang</CardTitle>
            <Package className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalBarang}</div>
            <p className="text-xs text-muted-foreground mt-1">Item barang</p>
          </CardContent>
        </Card>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="donasi" className="space-y-4">
        <TabsList>
          <TabsTrigger value="donasi">Daftar Donasi</TabsTrigger>
          <TabsTrigger value="donatur">Daftar Donatur</TabsTrigger>
          <TabsTrigger value="top">Top Donatur</TabsTrigger>
        </TabsList>

        {/* Donations List */}
        <TabsContent value="donasi">
          <Card className="border-border bg-gradient-card shadow-medium">
            <CardHeader>
              <CardTitle className="text-foreground">Donasi Terbaru</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
              ) : donations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Belum ada data donasi
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Donatur</TableHead>
                      <TableHead>Jenis</TableHead>
                      <TableHead>Detail</TableHead>
                      <TableHead>Hajat/Doa</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {donations.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{new Date(item.tanggal_donasi).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{item.nama_donatur}</TableCell>
                        <TableCell>
                          <Badge variant={item.jenis_donasi === 'Uang' ? 'default' : 'secondary'}>
                            {item.jenis_donasi}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.jenis_donasi === 'Uang' 
                            ? formatRupiah(item.jumlah || 0)
                            : `${item.jumlah_barang} ${item.satuan_barang} ${item.jenis_barang}`
                          }
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {item.hajat_doa || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className={kategoriColors[item.status]}>
                            {item.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Donatur List */}
        <TabsContent value="donatur">
          <Card className="border-border bg-gradient-card shadow-medium">
            <CardHeader>
              <CardTitle className="text-foreground">Database Donatur</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
              ) : donaturList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Belum ada data donatur
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Telepon</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Total Donasi</TableHead>
                      <TableHead>Jumlah Transaksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {donaturList.map((donatur) => (
                      <TableRow key={donatur.id}>
                        <TableCell className="font-medium">{donatur.nama_lengkap}</TableCell>
                        <TableCell>{donatur.no_telepon}</TableCell>
                        <TableCell>{donatur.email || '-'}</TableCell>
                        <TableCell className="font-semibold">
                          {formatRupiah(donatur.total_donasi || 0)}
                        </TableCell>
                        <TableCell>{donatur.jumlah_donasi || 0}x</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Donatur */}
        <TabsContent value="top">
          <Card className="border-border bg-gradient-card shadow-medium">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Top 5 Donatur Teraktif
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
              ) : topDonatur.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Belum ada data donatur
                </div>
              ) : (
                <div className="space-y-4">
                  {topDonatur.map((donatur, index) => (
                    <div 
                      key={donatur.id} 
                      className="flex items-center justify-between p-4 rounded-lg border border-border bg-background hover:shadow-soft transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-100 text-gray-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-primary/10 text-primary'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{donatur.nama_lengkap}</h4>
                          <p className="text-sm text-muted-foreground">{donatur.no_telepon}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg text-foreground">
                          {formatRupiah(donatur.total_donasi || 0)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {donatur.jumlah_donasi || 0} transaksi
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Forms */}
      <DonasiForm
        open={showDonasiForm}
        onOpenChange={setShowDonasiForm}
        onSuccess={loadData}
      />

      <DonaturForm
        open={showDonaturForm}
        onOpenChange={setShowDonaturForm}
        onSuccess={loadData}
      />
    </div>
  );
};

export default Donasi;
