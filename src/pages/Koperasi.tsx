import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, TrendingUp, ShoppingCart, Plus } from "lucide-react";

const produkData = [
  { id: 1, nama: "Buku Tulis", kategori: "ATK", harga: 5000, stok: 250, terjual: 45 },
  { id: 2, nama: "Pulpen", kategori: "ATK", harga: 3000, stok: 180, terjual: 32 },
  { id: 3, nama: "Snack Ringan", kategori: "Makanan", harga: 8000, stok: 120, terjual: 78 },
  { id: 4, nama: "Minuman Kemasan", kategori: "Minuman", harga: 5000, stok: 200, terjual: 95 },
];

const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

const Koperasi = () => {
  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Koperasi</h1>
          <p className="text-muted-foreground">Kelola koperasi pesantren</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-medium">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Produk
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Omzet Bulan Ini</CardTitle>
            <Store className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">Rp 8.5 Jt</div>
            <p className="text-xs text-muted-foreground mt-1">+12% dari bulan lalu</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Transaksi</CardTitle>
            <ShoppingCart className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">542</div>
            <p className="text-xs text-muted-foreground mt-1">Bulan ini</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Produk Tersedia</CardTitle>
            <Store className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">84</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rata-rata/Hari</CardTitle>
            <TrendingUp className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">Rp 425 Rb</div>
          </CardContent>
        </Card>
      </div>

      {/* Products */}
      <Card className="border-border bg-gradient-card shadow-medium">
        <CardHeader>
          <CardTitle className="text-foreground">Produk Terpopuler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {produkData.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-background hover:shadow-soft transition-all">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Store className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{item.nama}</h4>
                    <p className="text-sm text-muted-foreground">{item.kategori}</p>
                    <p className="text-sm font-medium text-primary mt-1">{formatRupiah(item.harga)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Stok: <span className="font-semibold text-foreground">{item.stok}</span></div>
                  <div className="text-sm text-muted-foreground mt-1">Terjual: <span className="font-semibold text-accent">{item.terjual}</span></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Koperasi;
