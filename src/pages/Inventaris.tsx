import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const inventarisData = [
  { id: "INV001", nama: "Komputer Desktop", kategori: "Elektronik", jumlah: 25, kondisi: "Baik", lokasi: "Lab Komputer" },
  { id: "INV002", nama: "Meja Belajar", kategori: "Furniture", jumlah: 150, kondisi: "Baik", lokasi: "Ruang Kelas" },
  { id: "INV003", nama: "Al-Quran", kategori: "Buku", jumlah: 300, kondisi: "Baik", lokasi: "Perpustakaan" },
  { id: "INV004", nama: "AC Split", kategori: "Elektronik", jumlah: 12, kondisi: "Rusak Ringan", lokasi: "Ruang Guru" },
];

const kondisiColors: Record<string, string> = {
  "Baik": "bg-primary/10 text-primary border-primary/20",
  "Rusak Ringan": "bg-accent/10 text-accent border-accent/20",
  "Rusak Berat": "bg-destructive/10 text-destructive border-destructive/20",
};

const Inventaris = () => {
  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Inventaris</h1>
          <p className="text-muted-foreground">Kelola inventaris pesantren</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-medium">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Barang
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Item</CardTitle>
            <Package className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">1,234</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Kondisi Baik</CardTitle>
            <Package className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">1,087</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Perlu Perbaikan</CardTitle>
            <Package className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">132</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rusak Berat</CardTitle>
            <Package className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">15</div>
          </CardContent>
        </Card>
      </div>

      {/* Items List */}
      <Card className="border-border bg-gradient-card shadow-medium">
        <CardHeader>
          <CardTitle className="text-foreground">Daftar Inventaris</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {inventarisData.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-background hover:shadow-soft transition-all">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{item.nama}</h4>
                    <p className="text-sm text-muted-foreground">ID: {item.id}</p>
                    <p className="text-sm text-muted-foreground">{item.kategori} • {item.lokasi}</p>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="font-bold text-lg text-foreground">{item.jumlah} Unit</div>
                  <Badge className={kondisiColors[item.kondisi]}>
                    {item.kondisi}
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

export default Inventaris;
