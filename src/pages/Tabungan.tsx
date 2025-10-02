import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const tabunganData = [
  { id: "S001", nama: "Ahmad Fauzi", saldo: 250000, setor: 50000, tarik: 0, tanggal: "2025-01-15" },
  { id: "S002", nama: "Fatimah Zahra", saldo: 180000, setor: 0, tarik: 20000, tanggal: "2025-01-14" },
  { id: "S003", nama: "Muhammad Rizki", saldo: 320000, setor: 100000, tarik: 0, tanggal: "2025-01-13" },
  { id: "S004", nama: "Aisyah Nur", saldo: 150000, setor: 30000, tarik: 0, tanggal: "2025-01-12" },
];

const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

const Tabungan = () => {
  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Tabungan Santri</h1>
        <p className="text-muted-foreground">Kelola tabungan santri pesantren</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tabungan</CardTitle>
            <Wallet className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">Rp 45.2 Jt</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Setoran Bulan Ini</CardTitle>
            <TrendingUp className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">Rp 8.5 Jt</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Penarikan Bulan Ini</CardTitle>
            <TrendingDown className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">Rp 2.3 Jt</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rata-rata Saldo</CardTitle>
            <Wallet className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">Rp 182 Rb</div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Card className="border-border bg-gradient-card shadow-medium">
        <CardHeader>
          <CardTitle className="text-foreground">Transaksi Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tabunganData.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-background hover:shadow-soft transition-all">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Wallet className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{item.nama}</h4>
                    <p className="text-sm text-muted-foreground">ID: {item.id}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.tanggal}</p>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="font-bold text-foreground">{formatRupiah(item.saldo)}</div>
                  {item.setor > 0 && (
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {formatRupiah(item.setor)}
                    </Badge>
                  )}
                  {item.tarik > 0 && (
                    <Badge variant="outline" className="border-destructive/20 text-destructive">
                      <TrendingDown className="w-3 h-3 mr-1" />
                      {formatRupiah(item.tarik)}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Tabungan;
