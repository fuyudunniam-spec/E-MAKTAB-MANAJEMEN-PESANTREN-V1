import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const pemasukanData = [
  { id: 1, sumber: "Donasi", jumlah: 18500000, tanggal: "2025-01-15", kategori: "Donasi" },
  { id: 2, sumber: "SPP Santri", jumlah: 12000000, tanggal: "2025-01-10", kategori: "SPP" },
  { id: 3, sumber: "Koperasi", jumlah: 8500000, tanggal: "2025-01-08", kategori: "Usaha" },
];

const pengeluaranData = [
  { id: 1, keperluan: "Gaji Ustadz", jumlah: 25000000, tanggal: "2025-01-12", kategori: "Operasional" },
  { id: 2, keperluan: "Listrik & Air", jumlah: 3500000, tanggal: "2025-01-10", kategori: "Utilitas" },
  { id: 3, keperluan: "Belanja Dapur", jumlah: 8000000, tanggal: "2025-01-08", kategori: "Konsumsi" },
];

const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

const Keuangan = () => {
  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Keuangan</h1>
        <p className="text-muted-foreground">Laporan keuangan pesantren</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Kas</CardTitle>
            <Wallet className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">Rp 89.3 Jt</div>
            <p className="text-xs text-muted-foreground mt-1">Per hari ini</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pemasukan</CardTitle>
            <TrendingUp className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">Rp 156 Jt</div>
            <p className="text-xs text-muted-foreground mt-1">Bulan ini</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pengeluaran</CardTitle>
            <TrendingDown className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">Rp 124 Jt</div>
            <p className="text-xs text-muted-foreground mt-1">Bulan ini</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Surplus</CardTitle>
            <DollarSign className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">Rp 32 Jt</div>
            <p className="text-xs text-muted-foreground mt-1">Bulan ini</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Tabs defaultValue="pemasukan" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="pemasukan">Pemasukan</TabsTrigger>
          <TabsTrigger value="pengeluaran">Pengeluaran</TabsTrigger>
        </TabsList>

        <TabsContent value="pemasukan">
          <Card className="border-border bg-gradient-card shadow-medium">
            <CardHeader>
              <CardTitle className="text-foreground">Daftar Pemasukan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pemasukanData.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-background hover:shadow-soft transition-all">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{item.sumber}</h4>
                        <p className="text-sm text-muted-foreground">{item.kategori}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.tanggal}</p>
                      </div>
                    </div>
                    <div className="font-bold text-lg text-primary">{formatRupiah(item.jumlah)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pengeluaran">
          <Card className="border-border bg-gradient-card shadow-medium">
            <CardHeader>
              <CardTitle className="text-foreground">Daftar Pengeluaran</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pengeluaranData.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-background hover:shadow-soft transition-all">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-destructive/10 rounded-lg">
                        <TrendingDown className="w-5 h-5 text-destructive" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{item.keperluan}</h4>
                        <p className="text-sm text-muted-foreground">{item.kategori}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.tanggal}</p>
                      </div>
                    </div>
                    <div className="font-bold text-lg text-destructive">{formatRupiah(item.jumlah)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Keuangan;
