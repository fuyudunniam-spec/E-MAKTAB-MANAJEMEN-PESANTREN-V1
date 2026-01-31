import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  FormDescription,
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
import { Plus, Pencil, Trash2, Loader2, Link2, ExternalLink, ChevronRight, CornerDownRight } from 'lucide-react';

const menuLinkSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  url: z.string().min(1, 'URL wajib diisi'),
  description: z.string().optional(),
  icon: z.string().optional(),
  group_name: z.string().min(1, 'Grup wajib dipilih'),
  position: z.coerce.number().min(0),
  is_external: z.boolean(),
  is_active: z.boolean(),
  parent_id: z.string().nullable(),
});

type MenuLinkFormValues = z.infer<typeof menuLinkSchema>;

interface MenuLink {
  id: string;
  title: string;
  url: string;
  description: string | null;
  icon: string | null;
  group_name: string | null;
  position: number;
  is_external: boolean | null;
  is_active: boolean | null;
  parent_id: string | null;
  created_at: string;
}

const iconOptions = [
  { value: 'Home', label: '🏠 Beranda' },
  { value: 'Building2', label: '🏛️ Profil' },
  { value: 'History', label: '📜 Sejarah' },
  { value: 'Target', label: '🎯 Visi Misi' },
  { value: 'Users', label: '👥 Organisasi' },
  { value: 'Building', label: '🏢 Fasilitas' },
  { value: 'GraduationCap', label: '🎓 Pendidikan' },
  { value: 'BookOpen', label: '📖 Tahfidz' },
  { value: 'Book', label: '📚 Diniyah' },
  { value: 'School', label: '🏫 Sekolah' },
  { value: 'Trophy', label: '🏆 Ekskul' },
  { value: 'UserPlus', label: '➕ Pendaftaran' },
  { value: 'FileText', label: '📄 Dokumen' },
  { value: 'Wallet', label: '💰 Biaya' },
  { value: 'ClipboardList', label: '📋 Formulir' },
  { value: 'Calendar', label: '📅 Jadwal' },
  { value: 'Newspaper', label: '📰 Berita' },
  { value: 'Image', label: '🖼️ Galeri' },
  { value: 'CalendarDays', label: '📆 Agenda' },
  { value: 'Bell', label: '🔔 Pengumuman' },
  { value: 'Phone', label: '📞 Kontak' },
  { value: 'MapPin', label: '📍 Lokasi' },
  { value: 'Shield', label: '🛡️ Kebijakan' },
  { value: 'FileCheck', label: '✅ Syarat' },
  { value: 'Link', label: '🔗 Link' },
];

const groupOptions = [
  { value: 'main', label: 'Menu Utama (Header)' },
  { value: 'footer', label: 'Menu Footer' },
];

export default function AdminMenuLinks() {
  const [menuLinks, setMenuLinks] = useState<MenuLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<MenuLink | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<MenuLinkFormValues>({
    resolver: zodResolver(menuLinkSchema),
    defaultValues: {
      title: '',
      url: '',
      description: '',
      icon: 'Link',
      group_name: 'main',
      position: 0,
      is_external: false,
      is_active: true,
      parent_id: null,
    },
  });

  useEffect(() => {
    fetchMenuLinks();
  }, []);

  const fetchMenuLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_links')
        .select('*')
        .order('group_name')
        .order('position');

      if (error) throw error;
      setMenuLinks(data || []);
    } catch (error) {
      console.error('Error fetching menu links:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengambil data menu',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Get parent menus (menus without parent_id)
  const parentMenus = menuLinks.filter(link => !link.parent_id && link.group_name === 'main');

  const openCreateDialog = () => {
    setEditingLink(null);
    const maxPosition = Math.max(0, ...menuLinks.map(l => l.position)) + 1;
    form.reset({
      title: '',
      url: '',
      description: '',
      icon: 'Link',
      group_name: 'main',
      position: maxPosition,
      is_external: false,
      is_active: true,
      parent_id: null,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (link: MenuLink) => {
    setEditingLink(link);
    form.reset({
      title: link.title,
      url: link.url,
      description: link.description || '',
      icon: link.icon || 'Link',
      group_name: link.group_name || 'main',
      position: link.position,
      is_external: link.is_external ?? false,
      is_active: link.is_active ?? true,
      parent_id: link.parent_id || null,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: MenuLinkFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingLink) {
        const { error } = await supabase
          .from('menu_links')
          .update({
            title: values.title,
            url: values.url,
            description: values.description || null,
            icon: values.icon || null,
            group_name: values.group_name,
            position: values.position,
            is_external: values.is_external,
            is_active: values.is_active,
            parent_id: values.parent_id || null,
          })
          .eq('id', editingLink.id);

        if (error) throw error;
        toast({ title: 'Berhasil', description: 'Menu berhasil diperbarui' });
      } else {
        const { error } = await supabase.from('menu_links').insert([{
          title: values.title,
          url: values.url,
          description: values.description || null,
          icon: values.icon || null,
          group_name: values.group_name,
          position: values.position,
          is_external: values.is_external,
          is_active: values.is_active,
          parent_id: values.parent_id || null,
        }]);

        if (error) throw error;
        toast({ title: 'Berhasil', description: 'Menu berhasil ditambahkan' });
      }

      setIsDialogOpen(false);
      fetchMenuLinks();
    } catch (error: any) {
      console.error('Error saving menu link:', error);
      toast({
        title: 'Error',
        description: 'Gagal menyimpan menu',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteMenuLink = async (id: string) => {
    if (!confirm('Yakin ingin menghapus menu ini? Sub-menu di bawahnya juga akan terhapus.')) return;

    try {
      const { error } = await supabase.from('menu_links').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Berhasil', description: 'Menu berhasil dihapus' });
      fetchMenuLinks();
    } catch (error) {
      console.error('Error deleting menu link:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus menu',
        variant: 'destructive',
      });
    }
  };

  const getGroupLabel = (groupName: string | null) => {
    const group = groupOptions.find(g => g.value === groupName);
    return group?.label || groupName || 'Lainnya';
  };

  // Build hierarchical structure
  const buildHierarchy = (links: MenuLink[], groupName: string) => {
    const groupLinks = links.filter(l => l.group_name === groupName);
    const parents = groupLinks.filter(l => !l.parent_id);
    
    return parents.map(parent => ({
      ...parent,
      children: groupLinks.filter(l => l.parent_id === parent.id).sort((a, b) => a.position - b.position)
    })).sort((a, b) => a.position - b.position);
  };

  const mainMenuHierarchy = buildHierarchy(menuLinks, 'main');
  const footerMenuHierarchy = buildHierarchy(menuLinks, 'footer');

  const renderMenuRow = (link: MenuLink & { children?: MenuLink[] }, isChild = false) => (
    <>
      <TableRow key={link.id} className={isChild ? 'bg-muted/30' : ''}>
        <TableCell className="text-muted-foreground">
          {isChild ? (
            <span className="flex items-center gap-1">
              <CornerDownRight className="h-4 w-4 text-muted-foreground/50" />
              {link.position}
            </span>
          ) : (
            link.position
          )}
        </TableCell>
        <TableCell>
          <div className={isChild ? 'pl-4' : ''}>
            <p className="font-medium flex items-center gap-2">
              {!isChild && link.children && link.children.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {link.children.length} sub
                </Badge>
              )}
              {link.title}
            </p>
            {link.description && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {link.description}
              </p>
            )}
          </div>
        </TableCell>
        <TableCell>
          <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
            {link.url}
          </span>
        </TableCell>
        <TableCell>
          <Badge variant={link.is_active ? 'default' : 'secondary'}>
            {link.is_active ? 'Aktif' : 'Nonaktif'}
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openEditDialog(link)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteMenuLink(link.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {link.children?.map(child => renderMenuRow(child, true))}
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Link2 className="h-6 w-6" />
            Struktur Menu Website
          </h2>
          <p className="text-muted-foreground">
            Kelola menu utama dan sub-menu website Pesantren An-Nur
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Menu
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingLink ? 'Edit Menu' : 'Tambah Menu Baru'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Menu</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Tentang Kami" {...field} />
                      </FormControl>
                      <FormDescription>
                        Nama yang tampil di navigasi website
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alamat Halaman (URL)</FormLabel>
                      <FormControl>
                        <Input placeholder="/halaman/tentang-kami atau https://..." {...field} />
                      </FormControl>
                      <FormDescription>
                        Gunakan "/" untuk halaman internal, "https://" untuk link eksternal
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deskripsi Menu</FormLabel>
                      <FormControl>
                        <Textarea 
                          rows={2} 
                          placeholder="Jelaskan isi halaman ini agar admin lain paham" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Penjelasan singkat fungsi menu (tidak tampil di website)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ikon</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih ikon" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {iconOptions.map((icon) => (
                              <SelectItem key={icon.value} value={icon.value}>
                                {icon.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="group_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lokasi Menu</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih lokasi" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {groupOptions.map((group) => (
                              <SelectItem key={group.value} value={group.value}>
                                {group.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="parent_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Menu Induk (untuk sub-menu)</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === 'none' ? null : value)} 
                        value={field.value || 'none'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih menu induk" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">— Tidak ada (Menu Utama) —</SelectItem>
                          {parentMenus
                            .filter(m => m.id !== editingLink?.id)
                            .map((menu) => (
                              <SelectItem key={menu.id} value={menu.id}>
                                {menu.title}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Kosongkan jika ini menu utama, pilih menu induk jika ini sub-menu
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Urutan Tampil</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
                      </FormControl>
                      <FormDescription>
                        Angka kecil = tampil lebih dulu (1, 2, 3, dst)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_external"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <FormLabel className="text-base">Buka di Tab Baru</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Aktifkan untuk link ke website luar
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <FormLabel className="text-base">Tampilkan Menu</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Nonaktifkan untuk menyembunyikan sementara
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
                    {editingLink ? 'Simpan Perubahan' : 'Tambah Menu'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Guide Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">📋 Panduan Struktur Menu</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p><strong>Menu Utama:</strong> Menu yang tampil di bagian atas website (header)</p>
          <p><strong>Sub-Menu:</strong> Menu yang muncul saat kursor diarahkan ke menu utama</p>
          <p><strong>Menu Footer:</strong> Link yang tampil di bagian bawah website</p>
          <p className="pt-2 text-xs">💡 Tips: Maksimal 2 tingkat (Menu → Sub-menu). Gunakan deskripsi agar admin lain paham fungsi tiap menu.</p>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : menuLinks.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Belum ada menu. Klik "Tambah Menu" untuk membuat struktur menu website.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Main Menu */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                🌐 Menu Utama (Header)
              </CardTitle>
              <CardDescription>
                Menu yang tampil di bagian atas website
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Urutan</TableHead>
                    <TableHead>Nama Menu</TableHead>
                    <TableHead>Alamat Halaman</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right w-24">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mainMenuHierarchy.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                        Belum ada menu utama
                      </TableCell>
                    </TableRow>
                  ) : (
                    mainMenuHierarchy.map(menu => renderMenuRow(menu))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Footer Menu */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                📎 Menu Footer
              </CardTitle>
              <CardDescription>
                Link yang tampil di bagian bawah website
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Urutan</TableHead>
                    <TableHead>Nama Menu</TableHead>
                    <TableHead>Alamat Halaman</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right w-24">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {footerMenuHierarchy.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                        Belum ada menu footer
                      </TableCell>
                    </TableRow>
                  ) : (
                    footerMenuHierarchy.map(menu => renderMenuRow(menu))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
