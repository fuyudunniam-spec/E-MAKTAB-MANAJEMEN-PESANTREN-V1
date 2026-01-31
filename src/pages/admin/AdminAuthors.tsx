import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Pencil, Trash2, Loader2, Users } from 'lucide-react';
import { ImageUpload } from '@/components/admin/ImageUpload';

const authorSchema = z.object({
  name: z.string().min(1, 'Nama penulis wajib diisi'),
  slug: z.string().min(1, 'Slug wajib diisi'),
  email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  bio: z.string().optional(),
  image_url: z.string().optional().or(z.literal('')),
  is_active: z.boolean(),
});

type AuthorFormValues = z.infer<typeof authorSchema>;

interface Author {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  bio: string | null;
  image_url: string | null;
  is_active: boolean | null;
  created_at: string;
}

export default function AdminAuthors() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<AuthorFormValues>({
    resolver: zodResolver(authorSchema),
    defaultValues: {
      name: '',
      slug: '',
      email: '',
      bio: '',
      image_url: '',
      is_active: true,
    },
  });

  useEffect(() => {
    fetchAuthors();
  }, []);

  const fetchAuthors = async () => {
    try {
      const { data, error } = await supabase
        .from('authors')
        .select('*')
        .order('name');

      if (error) throw error;
      setAuthors(data || []);
    } catch (error) {
      console.error('Error fetching authors:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengambil data penulis',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const openCreateDialog = () => {
    setEditingAuthor(null);
    form.reset({
      name: '',
      slug: '',
      email: '',
      bio: '',
      image_url: '',
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (author: Author) => {
    setEditingAuthor(author);
    form.reset({
      name: author.name,
      slug: author.slug,
      email: author.email || '',
      bio: author.bio || '',
      image_url: author.image_url || '',
      is_active: author.is_active ?? true,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: AuthorFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingAuthor) {
        const { error } = await supabase
          .from('authors')
          .update({
            name: values.name,
            slug: values.slug,
            email: values.email || null,
            bio: values.bio || null,
            image_url: values.image_url || null,
            is_active: values.is_active,
          })
          .eq('id', editingAuthor.id);

        if (error) throw error;
        toast({ title: 'Berhasil', description: 'Penulis berhasil diperbarui' });
      } else {
        const { error } = await supabase.from('authors').insert([{
          name: values.name,
          slug: values.slug,
          email: values.email || null,
          bio: values.bio || null,
          image_url: values.image_url || null,
          is_active: values.is_active,
        }]);

        if (error) throw error;
        toast({ title: 'Berhasil', description: 'Penulis berhasil ditambahkan' });
      }

      setIsDialogOpen(false);
      fetchAuthors();
    } catch (error: any) {
      console.error('Error saving author:', error);
      toast({
        title: 'Error',
        description: error.message?.includes('duplicate')
          ? 'Slug sudah digunakan, gunakan slug lain'
          : 'Gagal menyimpan penulis',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteAuthor = async (id: string) => {
    if (!confirm('Yakin ingin menghapus penulis ini?')) return;

    try {
      const { error } = await supabase.from('authors').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Berhasil', description: 'Penulis berhasil dihapus' });
      fetchAuthors();
    } catch (error) {
      console.error('Error deleting author:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus penulis',
        variant: 'destructive',
      });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6" />
            Kelola Penulis
          </h2>
          <p className="text-muted-foreground">Tambah, edit, atau hapus penulis artikel</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Penulis
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAuthor ? 'Edit Penulis' : 'Tambah Penulis Baru'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Foto Profil</FormLabel>
                      <FormControl>
                        <ImageUpload
                          value={field.value}
                          onChange={field.onChange}
                          bucket="profile-images"
                          folder="authors"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Penulis</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            if (!editingAuthor) {
                              form.setValue('slug', generateSlug(e.target.value));
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug URL</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (opsional)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea rows={3} placeholder="Deskripsi singkat tentang penulis..." {...field} />
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
                        <FormLabel className="text-base">Penulis Aktif</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Penulis akan muncul di pilihan saat menulis artikel
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
                    {editingAuthor ? 'Simpan Perubahan' : 'Tambah Penulis'}
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
                <TableHead>Penulis</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : authors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Belum ada penulis
                  </TableCell>
                </TableRow>
              ) : (
                authors.map((author) => (
                  <TableRow key={author.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={author.image_url || undefined} alt={author.name} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {getInitials(author.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{author.name}</p>
                          <p className="text-sm text-muted-foreground">/{author.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {author.email || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={author.is_active ? 'default' : 'secondary'}>
                        {author.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(author)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteAuthor(author.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
