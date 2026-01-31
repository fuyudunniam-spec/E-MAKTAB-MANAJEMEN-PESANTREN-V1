import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingBag, FileText, Bell, MessageSquare } from 'lucide-react';

interface DashboardStats {
  products: number;
  posts: number;
  announcements: number;
  messages: number;
  unreadMessages: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    products: 0,
    posts: 0,
    announcements: 0,
    messages: 0,
    unreadMessages: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [productsRes, postsRes, announcementsRes, messagesRes, unreadRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('posts').select('id', { count: 'exact', head: true }),
        supabase.from('announcements').select('id', { count: 'exact', head: true }),
        supabase.from('contact_messages').select('id', { count: 'exact', head: true }),
        supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('is_read', false),
      ]);

      setStats({
        products: productsRes.count || 0,
        posts: postsRes.count || 0,
        announcements: announcementsRes.count || 0,
        messages: messagesRes.count || 0,
        unreadMessages: unreadRes.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Produk',
      value: stats.products,
      icon: ShoppingBag,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Total Artikel',
      value: stats.posts,
      icon: FileText,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Pengumuman Aktif',
      value: stats.announcements,
      icon: Bell,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Pesan Belum Dibaca',
      value: stats.unreadMessages,
      icon: MessageSquare,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      subtitle: `dari ${stats.messages} total pesan`,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Selamat Datang di Dashboard</h2>
        <p className="text-muted-foreground">Kelola konten website Pesantren Mahasiswa An-Nur</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {loading ? '...' : card.value}
              </div>
              {card.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Panduan Cepat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ShoppingBag className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-foreground">Kelola Produk</h4>
                <p className="text-sm text-muted-foreground">
                  Tambah, edit, atau hapus produk di toko online
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-foreground">Tulis Artikel</h4>
                <p className="text-sm text-muted-foreground">
                  Buat artikel kajian atau pengumuman untuk santri
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bell className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-foreground">Buat Pengumuman</h4>
                <p className="text-sm text-muted-foreground">
                  Informasikan berita terbaru kepada pengunjung
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tips Admin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>• Pastikan setiap produk memiliki gambar yang menarik</p>
            <p>• Artikel yang baik memiliki judul menarik dan konten informatif</p>
            <p>• Cek pesan masuk secara berkala untuk merespon pertanyaan</p>
            <p>• Gunakan fitur pengumuman untuk info penting dan mendesak</p>
            <p>• Simpan perubahan secara berkala saat mengedit konten</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
