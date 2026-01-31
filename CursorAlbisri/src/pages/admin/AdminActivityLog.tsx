import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Loader2,
  Search,
  Clock,
  User,
  FileText,
  Trash2,
  Edit,
  Plus,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ActivityLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  details: unknown;
  created_at: string;
}

const actionIcons: Record<string, React.ReactNode> = {
  create: <Plus className="h-4 w-4" />,
  update: <Edit className="h-4 w-4" />,
  delete: <Trash2 className="h-4 w-4" />,
  view: <Eye className="h-4 w-4" />,
};

const actionColors: Record<string, string> = {
  create: 'bg-green-500/10 text-green-600 dark:text-green-400',
  update: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  delete: 'bg-red-500/10 text-red-600 dark:text-red-400',
  view: 'bg-muted text-muted-foreground',
};

const entityLabels: Record<string, string> = {
  product: 'Produk',
  post: 'Artikel',
  page: 'Halaman',
  announcement: 'Pengumuman',
  message: 'Pesan',
  user: 'Admin',
  category: 'Kategori',
  author: 'Penulis',
  gallery: 'Galeri',
  setting: 'Pengaturan',
  media: 'Media',
  program: 'Program',
  testimonial: 'Testimoni',
};

const ITEMS_PER_PAGE = 20;

export default function AdminActivityLog() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterEntity, setFilterEntity] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchLogs();
  }, [currentPage, filterAction, filterEntity, filterDate]);

  const getDateRange = () => {
    const now = new Date();
    switch (filterDate) {
      case 'today':
        return { from: startOfDay(now), to: endOfDay(now) };
      case 'week':
        return { from: startOfDay(subDays(now, 7)), to: endOfDay(now) };
      case 'month':
        return { from: startOfDay(subDays(now, 30)), to: endOfDay(now) };
      default:
        return null;
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('activity_logs')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filterAction !== 'all') {
        query = query.eq('action', filterAction);
      }
      if (filterEntity !== 'all') {
        query = query.eq('entity_type', filterEntity);
      }
      
      const dateRange = getDateRange();
      if (dateRange) {
        query = query
          .gte('created_at', dateRange.from.toISOString())
          .lte('created_at', dateRange.to.toISOString());
      }

      // Apply pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      setLogs(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Gagal memuat activity log');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.entity_name?.toLowerCase().includes(query) ||
      log.user_email?.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'create':
        return 'Menambah';
      case 'update':
        return 'Mengubah';
      case 'delete':
        return 'Menghapus';
      case 'view':
        return 'Melihat';
      default:
        return action;
    }
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const handleActionChange = (value: string) => {
    setFilterAction(value);
    handleFilterChange();
  };

  const handleEntityChange = (value: string) => {
    setFilterEntity(value);
    handleFilterChange();
  };

  const handleDateChange = (value: string) => {
    setFilterDate(value);
    handleFilterChange();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Activity Log</h2>
          <p className="text-muted-foreground">
            Riwayat perubahan yang dilakukan admin ({totalCount} aktivitas)
          </p>
        </div>
        <Button variant="outline" onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari berdasarkan nama atau email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterAction} onValueChange={handleActionChange}>
          <SelectTrigger>
            <SelectValue placeholder="Aksi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Aksi</SelectItem>
            <SelectItem value="create">Tambah</SelectItem>
            <SelectItem value="update">Ubah</SelectItem>
            <SelectItem value="delete">Hapus</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterEntity} onValueChange={handleEntityChange}>
          <SelectTrigger>
            <SelectValue placeholder="Tipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe</SelectItem>
            <SelectItem value="product">Produk</SelectItem>
            <SelectItem value="post">Artikel</SelectItem>
            <SelectItem value="page">Halaman</SelectItem>
            <SelectItem value="announcement">Pengumuman</SelectItem>
            <SelectItem value="gallery">Galeri</SelectItem>
            <SelectItem value="program">Program</SelectItem>
            <SelectItem value="testimonial">Testimoni</SelectItem>
            <SelectItem value="setting">Pengaturan</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterDate} onValueChange={handleDateChange}>
          <SelectTrigger>
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Periode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Waktu</SelectItem>
            <SelectItem value="today">Hari Ini</SelectItem>
            <SelectItem value="week">7 Hari Terakhir</SelectItem>
            <SelectItem value="month">30 Hari Terakhir</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {searchQuery || filterAction !== 'all' || filterEntity !== 'all' || filterDate !== 'all'
                ? 'Tidak ada aktivitas yang ditemukan'
                : 'Belum ada riwayat aktivitas'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${actionColors[log.action] || 'bg-muted'}`}
                    >
                      {actionIcons[log.action] || <FileText className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        <span className="font-semibold">{getActionLabel(log.action)}</span>{' '}
                        <Badge variant="secondary" className="mx-1">
                          {entityLabels[log.entity_type] || log.entity_type}
                        </Badge>
                        {log.entity_name && (
                          <span className="text-muted-foreground">"{log.entity_name}"</span>
                        )}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {log.user_email || 'Unknown'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(log.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} dari {totalCount} aktivitas
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Sebelumnya
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        className="w-9"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Selanjutnya
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
