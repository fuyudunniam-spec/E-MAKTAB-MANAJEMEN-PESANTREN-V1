import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Users, TrendingUp, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const donasiData = [
  { id: 1, donatur: "PT. Sejahtera Abadi", jumlah: 50000000, kategori: "Umum", tanggal: "2025-01-15" },
  { id: 2, donatur: "Bapak Ahmad Suryono", jumlah: 10000000, kategori: "Pendidikan", tanggal: "2025-01-14" },
  { id: 3, donatur: "Ibu Siti Nurhaliza", jumlah: 5000000, kategori: "Operasional", tanggal: "2025-01-13" },
  { id: 4, donatur: "Yayasan Cahaya Iman", jumlah: 25000000, kategori: "Infrastruktur", tanggal: "2025-01-12" },
];

const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

const kategoriColors: Record<string, string> = {
  "Umum": "bg-primary/10 text-primary border-primary/20",
  "Pendidikan": "bg-accent/10 text-accent border-accent/20",
  "Operasional": "bg-blue-500/10 text-blue-500 border-blue-500/20",
  "Infrastruktur": "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

const Donasi = () => {
  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Donasi</h1>
          <p className="text-muted-foreground">Kelola donasi untuk pesantren</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-medium">
          <Plus className="w-4 h-4 mr-2" />
          Catat Donasi
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Donasi</CardTitle>
            <Heart className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">Rp 128 Jt</div>
            <p className="text-xs text-muted-foreground mt-1">Tahun ini</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bulan Ini</CardTitle>
            <TrendingUp className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">Rp 18.5 Jt</div>
            <p className="text-xs text-muted-foreground mt-1">+8% dari bulan lalu</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Donatur</CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">342</div>
            <p className="text-xs text-muted-foreground mt-1">Aktif</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rata-rata</CardTitle>
            <Heart className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">Rp 2.8 Jt</div>
            <p className="text-xs text-muted-foreground mt-1">Per donatur</p>
          </CardContent>
        </Card>
      </div>

      {/* Donations List */}
      <Card className="border-border bg-gradient-card shadow-medium">
        <CardHeader>
          <CardTitle className="text-foreground">Donasi Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {donasiData.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-background hover:shadow-soft transition-all">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Heart className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{item.donatur}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{item.tanggal}</p>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="font-bold text-lg text-foreground">{formatRupiah(item.jumlah)}</div>
                  <Badge className={kategoriColors[item.kategori]}>
                    {item.kategori}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Donasi;
