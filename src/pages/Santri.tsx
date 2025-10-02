import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, MoreVertical } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const santriData = [
  { id: "S001", nama: "Ahmad Fauzi", kelas: "6 SD", jenisKelamin: "L", alamat: "Malang", status: "Aktif" },
  { id: "S002", nama: "Fatimah Zahra", kelas: "5 SD", jenisKelamin: "P", alamat: "Blitar", status: "Aktif" },
  { id: "S003", nama: "Muhammad Rizki", kelas: "1 SMP", jenisKelamin: "L", alamat: "Kediri", status: "Aktif" },
  { id: "S004", nama: "Aisyah Nur", kelas: "2 SMP", jenisKelamin: "P", alamat: "Malang", status: "Aktif" },
  { id: "S005", nama: "Abdullah Hasan", kelas: "3 SMP", jenisKelamin: "L", alamat: "Surabaya", status: "Aktif" },
];

const Santri = () => {
  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Data Master Santri</h1>
          <p className="text-muted-foreground">Kelola data santri pesantren</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-medium">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Santri
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border bg-gradient-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Santri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">248</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-gradient-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Santri Putra</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">142</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-gradient-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Santri Putri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">106</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-gradient-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Santri Baru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">12</div>
          </CardContent>
        </Card>
      </div>

      {/* Table Card */}
      <Card className="border-border bg-gradient-card shadow-medium">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <CardTitle className="text-foreground">Daftar Santri</CardTitle>
            <div className="flex-1 lg:max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Cari santri..." 
                  className="pl-10 border-border bg-background"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead className="text-foreground font-semibold">ID</TableHead>
                  <TableHead className="text-foreground font-semibold">Nama</TableHead>
                  <TableHead className="text-foreground font-semibold">Kelas</TableHead>
                  <TableHead className="text-foreground font-semibold">JK</TableHead>
                  <TableHead className="text-foreground font-semibold">Alamat</TableHead>
                  <TableHead className="text-foreground font-semibold">Status</TableHead>
                  <TableHead className="text-right text-foreground font-semibold">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {santriData.map((santri) => (
                  <TableRow key={santri.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium text-foreground">{santri.id}</TableCell>
                    <TableCell className="text-foreground">{santri.nama}</TableCell>
                    <TableCell className="text-foreground">{santri.kelas}</TableCell>
                    <TableCell className="text-foreground">{santri.jenisKelamin}</TableCell>
                    <TableCell className="text-foreground">{santri.alamat}</TableCell>
                    <TableCell>
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        {santri.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Santri;
