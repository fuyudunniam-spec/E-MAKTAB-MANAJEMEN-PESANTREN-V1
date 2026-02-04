import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Award, AlertTriangle, Plus } from "lucide-react";

const prestasiData = [
  { id: 1, santri: "Ahmad Fauzi", prestasi: "Juara 1 Tahfidz", tanggal: "2025-01-15", poin: 100 },
  { id: 2, santri: "Fatimah Zahra", prestasi: "Juara 2 MTQ", tanggal: "2025-01-10", poin: 80 },
  { id: 3, santri: "Muhammad Rizki", prestasi: "Juara 1 Kaligrafi", tanggal: "2025-01-08", poin: 100 },
];

const pelanggaranData = [
  { id: 1, santri: "Abdullah Hasan", pelanggaran: "Terlambat sholat", tanggal: "2025-01-16", sanksi: "Teguran" },
  { id: 2, santri: "Aisyah Nur", pelanggaran: "Tidak mengikuti piket", tanggal: "2025-01-15", sanksi: "Piket tambahan" },
];

const Monitoring = () => {
  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Monitoring Santri</h1>
        <p className="text-muted-foreground">Catat prestasi dan pelanggaran santri</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Prestasi</CardTitle>
            <Award className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">87</div>
            <p className="text-xs text-muted-foreground mt-1">Bulan ini</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pelanggaran</CardTitle>
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">12</div>
            <p className="text-xs text-muted-foreground mt-1">Bulan ini</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rata-rata Poin</CardTitle>
            <Award className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">92</div>
            <p className="text-xs text-muted-foreground mt-1">Per santri</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="prestasi" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="prestasi">Prestasi</TabsTrigger>
          <TabsTrigger value="pelanggaran">Pelanggaran</TabsTrigger>
        </TabsList>

        <TabsContent value="prestasi" className="space-y-4">
          <div className="flex justify-end">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Catat Prestasi
            </Button>
          </div>
          <Card className="border-border bg-gradient-card shadow-medium">
            <CardHeader>
              <CardTitle className="text-foreground">Daftar Prestasi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {prestasiData.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-background hover:shadow-soft transition-all">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-accent/10 rounded-lg">
                        <Award className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{item.santri}</h4>
                        <p className="text-sm text-muted-foreground">{item.prestasi}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.tanggal}</p>
                      </div>
                    </div>
                    <Badge className="bg-accent/10 text-accent border-accent/20">
                      +{item.poin} Poin
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pelanggaran" className="space-y-4">
          <div className="flex justify-end">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Catat Pelanggaran
            </Button>
          </div>
          <Card className="border-border bg-gradient-card shadow-medium">
            <CardHeader>
              <CardTitle className="text-foreground">Daftar Pelanggaran</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pelanggaranData.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-background hover:shadow-soft transition-all">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-destructive/10 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{item.santri}</h4>
                        <p className="text-sm text-muted-foreground">{item.pelanggaran}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.tanggal}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-destructive/20 text-destructive">
                      {item.sanksi}
                    </Badge>
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

export default Monitoring;
