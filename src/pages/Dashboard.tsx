import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Award, TrendingUp, Heart, Package, Store, Wallet, DollarSign } from "lucide-react";

const stats = [
  {
    title: "Total Santri",
    value: "248",
    icon: Users,
    trend: "+12 bulan ini",
    color: "text-primary",
    bgColor: "bg-primary/10"
  },
  {
    title: "Prestasi",
    value: "87",
    icon: Award,
    trend: "+23 bulan ini",
    color: "text-accent",
    bgColor: "bg-accent/10"
  },
  {
    title: "Total Tabungan",
    value: "Rp 45.2 Jt",
    icon: Wallet,
    trend: "+15% dari bulan lalu",
    color: "text-primary",
    bgColor: "bg-primary/10"
  },
  {
    title: "Donasi Terkumpul",
    value: "Rp 128 Jt",
    icon: Heart,
    trend: "+8% dari bulan lalu",
    color: "text-accent",
    bgColor: "bg-accent/10"
  },
  {
    title: "Item Inventaris",
    value: "1,234",
    icon: Package,
    trend: "12 item ditambahkan",
    color: "text-primary",
    bgColor: "bg-primary/10"
  },
  {
    title: "Omzet Koperasi",
    value: "Rp 8.5 Jt",
    icon: Store,
    trend: "+12% dari bulan lalu",
    color: "text-accent",
    bgColor: "bg-accent/10"
  },
  {
    title: "Pemasukan",
    value: "Rp 156 Jt",
    icon: TrendingUp,
    trend: "Bulan ini",
    color: "text-primary",
    bgColor: "bg-primary/10"
  },
  {
    title: "Saldo Kas",
    value: "Rp 89.3 Jt",
    icon: DollarSign,
    trend: "Per hari ini",
    color: "text-accent",
    bgColor: "bg-accent/10"
  },
];

const Dashboard = () => {
  return (
    <div className="p-6 lg:p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Selamat datang di Sistem Manajemen Pesantren Al-Bisri
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={index} 
              className="relative overflow-hidden border-border hover:shadow-medium transition-all duration-300 bg-gradient-card animate-slide-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground mb-1">
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stat.trend}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border bg-gradient-card hover:shadow-medium transition-all">
          <CardHeader>
            <CardTitle className="text-foreground">Aktivitas Terbaru</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 pb-3 border-b border-border">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">5 Santri baru terdaftar</p>
                <p className="text-xs text-muted-foreground">2 jam yang lalu</p>
              </div>
            </div>
            <div className="flex items-start gap-3 pb-3 border-b border-border">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Award className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">12 Prestasi baru dicatat</p>
                <p className="text-xs text-muted-foreground">5 jam yang lalu</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Heart className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Donasi baru Rp 5.000.000</p>
                <p className="text-xs text-muted-foreground">1 hari yang lalu</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-gradient-card hover:shadow-medium transition-all">
          <CardHeader>
            <CardTitle className="text-foreground">Jadwal Hari Ini</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 pb-3 border-b border-border">
              <div className="text-sm font-bold text-primary">08:00</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Kajian Pagi</p>
                <p className="text-xs text-muted-foreground">Aula Utama</p>
              </div>
            </div>
            <div className="flex items-start gap-3 pb-3 border-b border-border">
              <div className="text-sm font-bold text-primary">13:00</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Tahfidz Al-Quran</p>
                <p className="text-xs text-muted-foreground">Ruang Tahfidz</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-sm font-bold text-primary">19:00</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Kajian Malam</p>
                <p className="text-xs text-muted-foreground">Masjid</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
