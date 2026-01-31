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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import { ImageUpload } from '@/components/admin/ImageUpload';

const gallerySchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  description: z.string().optional(),
  image_url: z.string().min(1, 'Gambar wajib diupload'),
  is_active: z.boolean(),
  position: z.number(),
});

type GalleryFormValues = z.infer<typeof gallerySchema>;

interface GalleryItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  is_active: boolean | null;
  position: number;
  created_at: string;
}

export default function AdminGallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { logActivity } = useActivityLog();

  const form = useForm<GalleryFormValues>({
    resolver: zodResolver(gallerySchema),
    defaultValues: {
      title: '',
      description: '',
      image_url: '',
      is_active: true,
      position: 0,
    },
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('position', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching gallery:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengambil data galeri',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingItem(null);
    form.reset({
      title: '',
      description: '',
      image_url: '',
      is_active: true,
      position: items.length,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: GalleryItem) => {
    setEditingItem(item);
    form.reset({
      title: item.title,
      description: item.description || '',
      image_url: item.image_url,
      is_active: item.is_active ?? true,
      position: item.position,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: GalleryFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('gallery')
          .update({
            title: values.title,
            description: values.description || null,
            image_url: values.image_url,
            is_active: values.is_active,
            position: values.position,
          })
          .eq('id', editingItem.id);

        if (error) throw error;
        
        await logActivity({
          action: 'update',
          entityType: 'gallery',
          entityId: editingItem.id,
          entityName: values.title,
        });
        
        toast({ title: 'Berhasil', description: 'Gambar galeri berhasil diperbarui' });
      } else {
        const { data, error } = await supabase.from('gallery').insert([{
          title: values.title,
          description: values.description || null,
          image_url: values.image_url,
          is_active: values.is_active,
          position: values.position,
        }]).select('id').single();

        if (error) throw error;
        
        await logActivity({
          action: 'create',
          entityType: 'gallery',
          entityId: data?.id,
          entityName: values.title,
        });
        
        toast({ title: 'Berhasil', description: 'Gambar galeri berhasil ditambahkan' });
      }

      setIsDialogOpen(false);
      fetchItems();
    } catch (error: any) {
      console.error('Error saving gallery:', error);
      toast({
        title: 'Error',
        description: 'Gagal menyimpan gambar galeri',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteItem = async (id: string) => {
    const itemToDelete = items.find(i => i.id === id);
    if (!confirm('Yakin ingin menghapus gambar ini?')) return;

    try {
      const { error } = await supabase.from('gallery').delete().eq('id', id);
      if (error) throw error;
      
      await logActivity({
        action: 'delete',
        entityType: 'gallery',
        entityId: id,
        entityName: itemToDelete?.title,
      });
      
      toast({ title: 'Berhasil', description: 'Gambar galeri berhasil dihapus' });
      fetchItems();
    } catch (error) {
      console.error('Error deleting gallery:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus gambar galeri',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Kelola Galeri</h2>
          <p className="text-muted-foreground">Tambah, edit, atau hapus gambar galeri</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Gambar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit Gambar' : 'Tambah Gambar Baru'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gambar</FormLabel>
                      <FormControl>
                        <ImageUpload
                          value={field.value}
                          onChange={field.onChange}
                          bucket="post-images"
                          folder="gallery"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Judul / Keterangan</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Kajian Rutin Santri" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deskripsi (opsional)</FormLabel>
                      <FormControl>
                        <Textarea rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Urutan</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
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
                        <FormLabel className="text-base">Tampilkan</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Gambar akan ditampilkan di galeri
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
                    {editingItem ? 'Simpan Perubahan' : 'Tambah Gambar'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada gambar di galeri</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item) => (
                <div key={item.id} className="group relative aspect-square rounded-lg overflow-hidden border">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  {!item.is_active && (
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary">Nonaktif</Badge>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <p className="text-white text-sm font-medium text-center px-2">{item.title}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openEditDialog(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
