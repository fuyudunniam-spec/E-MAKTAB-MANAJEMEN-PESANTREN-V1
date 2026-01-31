import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useActivityLog } from '@/hooks/useActivityLog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Loader2, Megaphone, Bell, Calendar, AlertTriangle, Info, Gift, Star, Heart, BookOpen, Users } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

// Icon options for announcements
const iconOptions = [
  { value: 'megaphone', label: 'Megaphone', icon: Megaphone },
  { value: 'bell', label: 'Bell', icon: Bell },
  { value: 'calendar', label: 'Kalender', icon: Calendar },
  { value: 'alert', label: 'Peringatan', icon: AlertTriangle },
  { value: 'info', label: 'Info', icon: Info },
  { value: 'gift', label: 'Hadiah', icon: Gift },
  { value: 'star', label: 'Bintang', icon: Star },
  { value: 'heart', label: 'Hati', icon: Heart },
  { value: 'book', label: 'Buku', icon: BookOpen },
  { value: 'users', label: 'Komunitas', icon: Users },
];

const getIconComponent = (iconName: string) => {
  const found = iconOptions.find(opt => opt.value === iconName);
  return found?.icon || Megaphone;
};

const announcementSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  content: z.string().optional(),
  link: z.string().url('URL tidak valid').optional().or(z.literal('')),
  icon: z.string(),
  is_active: z.boolean(),
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

interface Announcement {
  id: string;
  title: string;
  content: string | null;
  link: string | null;
  icon: string | null;
  is_active: boolean | null;
  published_at: string;
  created_at: string;
}

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { logActivity } = useActivityLog();

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: '',
      content: '',
      link: '',
      icon: 'megaphone',
      is_active: true,
    },
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('published_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengambil data pengumuman',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingAnnouncement(null);
    form.reset({
      title: '',
      content: '',
      link: '',
      icon: 'megaphone',
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    form.reset({
      title: announcement.title,
      content: announcement.content || '',
      link: announcement.link || '',
      icon: announcement.icon || 'megaphone',
      is_active: announcement.is_active ?? true,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: AnnouncementFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingAnnouncement) {
        const { error } = await supabase
          .from('announcements')
          .update({
            title: values.title,
            content: values.content || null,
            link: values.link || null,
            icon: values.icon,
            is_active: values.is_active,
          })
          .eq('id', editingAnnouncement.id);

        if (error) throw error;
        
        await logActivity({
          action: 'update',
          entityType: 'announcement',
          entityId: editingAnnouncement.id,
          entityName: values.title,
        });
        
        toast({ title: 'Berhasil', description: 'Pengumuman berhasil diperbarui' });
      } else {
        const { data, error } = await supabase.from('announcements').insert([{
          title: values.title,
          content: values.content || null,
          link: values.link || null,
          icon: values.icon,
          is_active: values.is_active,
        }]).select('id').single();

        if (error) throw error;
        
        await logActivity({
          action: 'create',
          entityType: 'announcement',
          entityId: data?.id,
          entityName: values.title,
        });
        
        toast({ title: 'Berhasil', description: 'Pengumuman berhasil ditambahkan' });
      }

      setIsDialogOpen(false);
      fetchAnnouncements();
    } catch (error: any) {
      console.error('Error saving announcement:', error);
      toast({
        title: 'Error',
        description: 'Gagal menyimpan pengumuman',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    const announcementToDelete = announcements.find(a => a.id === id);
    if (!confirm('Yakin ingin menghapus pengumuman ini?')) return;

    try {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
      
      await logActivity({
        action: 'delete',
        entityType: 'announcement',
        entityId: id,
        entityName: announcementToDelete?.title,
      });
      
      toast({ title: 'Berhasil', description: 'Pengumuman berhasil dihapus' });
      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus pengumuman',
        variant: 'destructive',
      });
    }
  };

  const selectedIcon = form.watch('icon');
  const SelectedIconComponent = getIconComponent(selectedIcon);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Kelola Pengumuman</h2>
          <p className="text-muted-foreground">Tambah, edit, atau hapus pengumuman</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Pengumuman
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAnnouncement ? 'Edit Pengumuman' : 'Tambah Pengumuman Baru'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue>
                              <div className="flex items-center gap-2">
                                <SelectedIconComponent className="h-4 w-4" />
                                <span>{iconOptions.find(o => o.value === field.value)?.label}</span>
                              </div>
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {iconOptions.map((option) => {
                            const IconComp = option.icon;
                            return (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <IconComp className="h-4 w-4" />
                                  <span>{option.label}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Judul Pengumuman</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Isi Pengumuman (opsional)</FormLabel>
                      <FormControl>
                        <Textarea rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link Tujuan (opsional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <FormLabel className="text-base">Pengumuman Aktif</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Pengumuman akan ditampilkan di halaman utama
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingAnnouncement ? 'Simpan Perubahan' : 'Tambah Pengumuman'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Icon</TableHead>
                <TableHead>Judul</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : announcements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Belum ada pengumuman
                  </TableCell>
                </TableRow>
              ) : (
                announcements.map((announcement) => {
                  const IconComp = getIconComponent(announcement.icon || 'megaphone');
                  return (
                    <TableRow key={announcement.id}>
                      <TableCell>
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <IconComp className="h-5 w-5 text-primary" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{announcement.title}</p>
                          {announcement.link && (
                            <p className="text-sm text-muted-foreground truncate max-w-xs">
                              {announcement.link}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={announcement.is_active ? 'default' : 'secondary'}>
                          {announcement.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(announcement.published_at), 'd MMM yyyy', { locale: id })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(announcement)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteAnnouncement(announcement.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
