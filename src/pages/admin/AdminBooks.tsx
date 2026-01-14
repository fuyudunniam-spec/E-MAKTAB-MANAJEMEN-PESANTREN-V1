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
import { Separator } from '@/components/ui/separator';
import { Plus, Pencil, Trash2, Loader2, BookOpen, ExternalLink, Eye, EyeOff, Copy, Percent, Tag, FileUp } from 'lucide-react';
import { ImageUpload } from '@/components/admin/ImageUpload';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { BulkActions, BulkSelectCheckbox } from '@/components/admin/BulkActions';

const bookSchema = z.object({
  // Informasi Dasar
  name: z.string().min(1, 'Judul buku wajib diisi'),
  slug: z.string().min(1, 'Slug wajib diisi'),
  author: z.string().min(1, 'Penulis wajib diisi'),
  author_family_name: z.string().optional(),
  author_affiliation: z.string().optional(),
  editor: z.string().optional(),
  
  // Informasi Penerbitan
  publisher: z.string().optional(),
  publisher_city: z.string().optional(),
  publish_year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1).optional().or(z.literal('')),
  edition: z.string().optional(),
  pages: z.coerce.number().min(1).optional().or(z.literal('')),
  language: z.string().default('Indonesia'),
  
  // Identifikasi
  isbn: z.string().optional(),
  doi: z.string().optional(),
  
  // Konten
  abstract: z.string().optional(),
  table_of_contents: z.string().optional(),
  keywords: z.string().optional(),
  
  // Format & Link
  book_format: z.string().default('Cetak'),
  preview_link: z.string().optional(),
  preview_pdf: z.string().optional().or(z.literal('')),
  purchase_link: z.string().optional(),
  
  // Kategori & Harga
  category: z.string().min(1, 'Kategori wajib dipilih'),
  price: z.coerce.number().min(0, 'Harga tidak boleh negatif'),
  discount_price: z.coerce.number().min(0).optional().or(z.literal('')),
  discount_percentage: z.coerce.number().min(0).max(100).optional().or(z.literal('')),
  is_on_sale: z.boolean().default(false),
  stock: z.coerce.number().min(0, 'Stok tidak boleh negatif'),
  
  // Media & Status
  image_url: z.string().optional().or(z.literal('')),
  is_active: z.boolean(),
});

type BookFormValues = z.infer<typeof bookSchema>;

interface Book {
  id: string;
  name: string;
  slug: string;
  author: string | null;
  author_family_name: string | null;
  author_affiliation: string | null;
  editor: string | null;
  publisher: string | null;
  publisher_city: string | null;
  publish_year: number | null;
  edition: string | null;
  pages: number | null;
  language: string | null;
  isbn: string | null;
  doi: string | null;
  abstract: string | null;
  table_of_contents: string | null;
  keywords: string[] | null;
  book_format: string | null;
  preview_link: string | null;
  preview_pdf: string | null;
  purchase_link: string | null;
  category: string;
  price: number;
  discount_price: number | null;
  discount_percentage: number | null;
  is_on_sale: boolean | null;
  stock: number | null;
  image_url: string | null;
  is_active: boolean | null;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function AdminBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { toast } = useToast();
  const { logActivity } = useActivityLog();

  // Bulk action handlers
  const handleSelectAll = () => {
    setSelectedIds(books.map(b => b.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      const { error } = await supabase.from('products').delete().in('id', ids);
      if (error) throw error;
      toast({ title: 'Berhasil', description: `${ids.length} buku berhasil dihapus` });
      setSelectedIds([]);
      fetchBooks();
    } catch (error) {
      console.error('Error bulk deleting:', error);
      toast({ title: 'Error', description: 'Gagal menghapus buku', variant: 'destructive' });
    }
  };

  const handleBulkActivate = async (ids: string[]) => {
    try {
      const { error } = await supabase.from('products').update({ is_active: true }).in('id', ids);
      if (error) throw error;
      toast({ title: 'Berhasil', description: `${ids.length} buku diaktifkan` });
      setSelectedIds([]);
      fetchBooks();
    } catch (error) {
      console.error('Error bulk activating:', error);
      toast({ title: 'Error', description: 'Gagal mengaktifkan buku', variant: 'destructive' });
    }
  };

  const handleBulkDeactivate = async (ids: string[]) => {
    try {
      const { error } = await supabase.from('products').update({ is_active: false }).in('id', ids);
      if (error) throw error;
      toast({ title: 'Berhasil', description: `${ids.length} buku dinonaktifkan` });
      setSelectedIds([]);
      fetchBooks();
    } catch (error) {
      console.error('Error bulk deactivating:', error);
      toast({ title: 'Error', description: 'Gagal menonaktifkan buku', variant: 'destructive' });
    }
  };

  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      name: '',
      slug: '',
      author: '',
      author_family_name: '',
      author_affiliation: '',
      editor: '',
      publisher: '',
      publisher_city: '',
      publish_year: '',
      edition: '',
      pages: '',
      language: 'Indonesia',
      isbn: '',
      doi: '',
      abstract: '',
      table_of_contents: '',
      keywords: '',
      book_format: 'Cetak',
      preview_link: '',
      preview_pdf: '',
      purchase_link: '',
      category: '',
      price: 0,
      discount_price: '',
      discount_percentage: '',
      is_on_sale: false,
      stock: 0,
      image_url: '',
      is_active: true,
    },
  });

  useEffect(() => {
    fetchBooks();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('type', 'product')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('product_type', 'book')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBooks(data || []);
    } catch (error) {
      console.error('Error fetching books:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengambil data buku',
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
    setEditingBook(null);
    form.reset({
      name: '',
      slug: '',
      author: '',
      author_family_name: '',
      author_affiliation: '',
      editor: '',
      publisher: '',
      publisher_city: '',
      publish_year: '',
      edition: '',
      pages: '',
      language: 'Indonesia',
      isbn: '',
      doi: '',
      abstract: '',
      table_of_contents: '',
      keywords: '',
      book_format: 'Cetak',
      preview_link: '',
      preview_pdf: '',
      purchase_link: '',
      category: categories[0]?.name || '',
      price: 0,
      discount_price: '',
      discount_percentage: '',
      is_on_sale: false,
      stock: 0,
      image_url: '',
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (book: Book) => {
    setEditingBook(book);
    form.reset({
      name: book.name,
      slug: book.slug,
      author: book.author || '',
      author_family_name: book.author_family_name || '',
      author_affiliation: book.author_affiliation || '',
      editor: book.editor || '',
      publisher: book.publisher || '',
      publisher_city: (book as any).publisher_city || '',
      publish_year: book.publish_year || '',
      edition: book.edition || '',
      pages: book.pages || '',
      language: book.language || 'Indonesia',
      isbn: book.isbn || '',
      doi: book.doi || '',
      abstract: book.abstract || '',
      table_of_contents: book.table_of_contents || '',
      keywords: book.keywords?.join(', ') || '',
      book_format: book.book_format || 'Cetak',
      preview_link: book.preview_link || '',
      preview_pdf: book.preview_pdf || '',
      purchase_link: book.purchase_link || '',
      category: book.category,
      price: book.price,
      discount_price: book.discount_price || '',
      discount_percentage: book.discount_percentage || '',
      is_on_sale: book.is_on_sale ?? false,
      stock: book.stock || 0,
      image_url: book.image_url || '',
      is_active: book.is_active ?? true,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: BookFormValues) => {
    setIsSubmitting(true);
    try {
      const keywordsArray = values.keywords 
        ? values.keywords.split(',').map(k => k.trim()).filter(k => k)
        : null;

      const bookData = {
        name: values.name,
        slug: values.slug,
        author: values.author || null,
        author_family_name: values.author_family_name || null,
        author_affiliation: values.author_affiliation || null,
        editor: values.editor || null,
        publisher: values.publisher || null,
        publisher_city: values.publisher_city || null,
        publish_year: values.publish_year ? Number(values.publish_year) : null,
        edition: values.edition || null,
        pages: values.pages ? Number(values.pages) : null,
        language: values.language || 'Indonesia',
        isbn: values.isbn || null,
        doi: values.doi || null,
        abstract: values.abstract || null,
        table_of_contents: values.table_of_contents || null,
        keywords: keywordsArray,
        book_format: values.book_format || 'Cetak',
        preview_link: values.preview_link || null,
        preview_pdf: values.preview_pdf || null,
        purchase_link: values.purchase_link || null,
        category: values.category,
        price: values.price,
        discount_price: values.discount_price ? Number(values.discount_price) : null,
        discount_percentage: values.discount_percentage ? Number(values.discount_percentage) : null,
        is_on_sale: values.is_on_sale,
        stock: values.stock,
        image_url: values.image_url || null,
        is_active: values.is_active,
        product_type: 'book',
      };

      if (editingBook) {
        const { error } = await supabase
          .from('products')
          .update(bookData)
          .eq('id', editingBook.id);

        if (error) throw error;
        
        await logActivity({
          action: 'update',
          entityType: 'product',
          entityId: editingBook.id,
          entityName: values.name,
        });
        
        toast({ title: 'Berhasil', description: 'Buku berhasil diperbarui' });
      } else {
        const { data, error } = await supabase.from('products').insert([bookData]).select().single();

        if (error) throw error;
        
        await logActivity({
          action: 'create',
          entityType: 'product',
          entityId: data?.id,
          entityName: values.name,
        });
        
        toast({ title: 'Berhasil', description: 'Buku berhasil ditambahkan' });
      }

      setIsDialogOpen(false);
      fetchBooks();
    } catch (error: any) {
      console.error('Error saving book:', error);
      toast({
        title: 'Error',
        description: error.message?.includes('duplicate')
          ? 'Slug sudah digunakan, gunakan slug lain'
          : 'Gagal menyimpan buku',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteBook = async (id: string) => {
    if (!confirm('Yakin ingin menghapus buku ini?')) return;

    // Get book name for logging before delete
    const bookToDelete = books.find(b => b.id === id);

    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      
      await logActivity({
        action: 'delete',
        entityType: 'product',
        entityId: id,
        entityName: bookToDelete?.name || 'Unknown',
      });
      
      toast({ title: 'Berhasil', description: 'Buku berhasil dihapus' });
      fetchBooks();
    } catch (error) {
      console.error('Error deleting book:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus buku',
        variant: 'destructive',
      });
    }
  };

  const toggleActiveStatus = async (book: Book) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !book.is_active })
        .eq('id', book.id);

      if (error) throw error;
      
      await logActivity({
        action: 'update',
        entityType: 'product',
        entityId: book.id,
        entityName: book.name,
        details: { status: !book.is_active ? 'activated' : 'deactivated' },
      });
      
      toast({
        title: 'Berhasil',
        description: book.is_active ? 'Buku disembunyikan dari katalog' : 'Buku ditampilkan di katalog',
      });
      fetchBooks();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const duplicateBook = async (book: Book) => {
    try {
      const newSlug = `${book.slug}-copy-${Date.now().toString(36)}`;
      
      const { data, error } = await supabase.from('products').insert([{
        ...book,
        id: undefined,
        name: `${book.name} (Salinan)`,
        slug: newSlug,
        is_active: false,
        created_at: undefined,
      }]).select().single();

      if (error) throw error;
      
      await logActivity({
        action: 'create',
        entityType: 'product',
        entityId: data?.id,
        entityName: `${book.name} (Salinan)`,
        details: { duplicated_from: book.id },
      });
      
      toast({ title: 'Berhasil', description: 'Buku berhasil diduplikasi' });
      fetchBooks();
    } catch (error) {
      console.error('Error duplicating book:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Katalog Buku</h2>
            <p className="text-muted-foreground">Kelola buku akademik dengan metadata lengkap untuk Google Scholar</p>
          </div>
          <div className="flex items-center gap-2">
            <BulkActions
              selectedIds={selectedIds}
              totalItems={books.length}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onBulkDelete={handleBulkDelete}
              onBulkActivate={handleBulkActivate}
              onBulkDeactivate={handleBulkDeactivate}
              entityName="buku"
            />
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Buku
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {editingBook ? 'Edit Buku' : 'Tambah Buku Baru'}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  
                  {/* Section: Informasi Dasar */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">Informasi Dasar</h3>
                      <Badge variant="secondary" className="text-xs">Wajib</Badge>
                    </div>
                    <Separator />
                    
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Judul Buku</FormLabel>
                          <FormDescription>Judul lengkap buku sesuai yang tertera di sampul</FormDescription>
                          <FormControl>
                            <Input
                              placeholder="Contoh: Metodologi Penelitian Kualitatif"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                if (!editingBook) {
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
                      name="author"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Penulis</FormLabel>
                          <FormDescription>Nama penulis lengkap (tanpa singkatan). Jika lebih dari satu, pisahkan dengan koma</FormDescription>
                          <FormControl>
                            <Input placeholder="Contoh: Prof. Dr. Ahmad Dahlan, M.Pd." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="author_family_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Family Name (Nama Belakang)</FormLabel>
                            <FormDescription>Untuk format sitasi Google Scholar</FormDescription>
                            <FormControl>
                              <Input placeholder="Contoh: Dahlan" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="editor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Editor (Opsional)</FormLabel>
                            <FormDescription>Nama editor buku jika ada</FormDescription>
                            <FormControl>
                              <Input placeholder="Contoh: Dr. Siti Aminah, M.A." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="author_affiliation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Afiliasi Penulis (Opsional)</FormLabel>
                          <FormDescription>Institusi atau universitas penulis</FormDescription>
                          <FormControl>
                            <Input placeholder="Contoh: Universitas Islam Negeri Sunan Kalijaga" {...field} />
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
                          <FormDescription>Alamat web untuk buku ini (otomatis dari judul)</FormDescription>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Section: Informasi Penerbitan */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground">Informasi Penerbitan</h3>
                    <Separator />
                    
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="publisher"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Penerbit</FormLabel>
                            <FormControl>
                              <Input placeholder="Contoh: Gramedia Pustaka Utama" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="publisher_city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kota Penerbit</FormLabel>
                            <FormDescription>Untuk format sitasi</FormDescription>
                            <FormControl>
                              <Input placeholder="Contoh: Jakarta" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="publish_year"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tahun Terbit</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Contoh: 2024" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="edition"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Edisi</FormLabel>
                            <FormControl>
                              <Input placeholder="Contoh: Edisi ke-2" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="pages"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Jumlah Halaman</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Contoh: 350" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="language"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bahasa</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih bahasa" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Indonesia">Indonesia</SelectItem>
                                <SelectItem value="English">English</SelectItem>
                                <SelectItem value="Arabic">Arabic</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Section: Identifikasi */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground">Identifikasi Buku</h3>
                    <Separator />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="isbn"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ISBN</FormLabel>
                            <FormDescription>Nomor standar buku internasional</FormDescription>
                            <FormControl>
                              <Input placeholder="Contoh: 978-602-03-1234-5" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="doi"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>DOI (Opsional)</FormLabel>
                            <FormDescription>Digital Object Identifier jika ada</FormDescription>
                            <FormControl>
                              <Input placeholder="Contoh: 10.1234/book.2024" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Section: Konten */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground">Konten & Deskripsi</h3>
                    <Separator />
                    
                    <FormField
                      control={form.control}
                      name="abstract"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Abstrak / Sinopsis</FormLabel>
                          <FormDescription>Ringkasan isi buku (penting untuk pencarian Google Scholar)</FormDescription>
                          <FormControl>
                            <Textarea 
                              rows={4} 
                              placeholder="Tuliskan ringkasan isi buku secara akademis..."
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="keywords"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kata Kunci</FormLabel>
                          <FormDescription>Pisahkan dengan koma. Contoh: pendidikan islam, metodologi, penelitian</FormDescription>
                          <FormControl>
                            <Input placeholder="kata kunci 1, kata kunci 2, kata kunci 3" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="table_of_contents"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Daftar Isi / Daftar Bab</FormLabel>
                          <FormDescription>Tuliskan daftar bab atau isi buku (satu bab per baris)</FormDescription>
                          <FormControl>
                            <Textarea rows={6} placeholder="Bab 1: Pendahuluan&#10;Bab 2: Landasan Teori&#10;Bab 3: Metodologi..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Section: Format & Link */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground">Format & Link</h3>
                    <Separator />
                    
                    <FormField
                      control={form.control}
                      name="book_format"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Format Buku</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih format" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Cetak">Cetak (Hardcopy)</SelectItem>
                              <SelectItem value="PDF">PDF Digital</SelectItem>
                              <SelectItem value="eBook">eBook</SelectItem>
                              <SelectItem value="Cetak & PDF">Cetak & PDF</SelectItem>
                              <SelectItem value="Semua Format">Semua Format</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="preview_link"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Link Preview / Sample Bab</FormLabel>
                            <FormDescription>Link ke preview buku atau sample bab (opsional)</FormDescription>
                            <FormControl>
                              <Input placeholder="https://..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="purchase_link"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Link Pembelian Eksternal</FormLabel>
                            <FormDescription>Link ke marketplace atau situs lain (opsional)</FormDescription>
                            <FormControl>
                              <Input placeholder="https://..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="preview_pdf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <FileUp className="w-4 h-4" />
                            Upload PDF Preview
                          </FormLabel>
                          <FormDescription>
                            Upload file PDF untuk preview buku yang bisa dilihat pengunjung
                          </FormDescription>
                          <FormControl>
                            <ImageUpload
                              value={field.value || ''}
                              onChange={field.onChange}
                              bucket="product-images"
                              folder="pdf-previews"
                              accept="application/pdf"
                            />
                          </FormControl>
                          {field.value && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <FileUp className="w-4 h-4" />
                              <a 
                                href={field.value} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                Lihat PDF
                              </a>
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Section: Kategori & Harga */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground">Kategori & Harga</h3>
                    <Separator />
                    
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kategori</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih kategori" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.name}>
                                    {cat.name}
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
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Harga Normal (Rp)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="stock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stok</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Discount Section */}
                    <div className="rounded-lg border p-4 space-y-4 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-primary" />
                          <h4 className="font-medium">Pengaturan Diskon/Promo</h4>
                        </div>
                        <FormField
                          control={form.control}
                          name="is_on_sale"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormLabel className="text-sm text-muted-foreground">Aktifkan Promo</FormLabel>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="discount_price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Harga Diskon (Rp)</FormLabel>
                              <FormDescription>Harga setelah diskon</FormDescription>
                              <FormControl>
                                <Input type="number" placeholder="0" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="discount_percentage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Persentase Diskon (%)</FormLabel>
                              <FormDescription>Akan dihitung otomatis jika kosong</FormDescription>
                              <FormControl>
                                <Input type="number" placeholder="0" min="0" max="100" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section: Gambar Sampul */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground">Gambar Sampul</h3>
                    <Separator />
                    
                    <FormField
                      control={form.control}
                      name="image_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sampul Buku</FormLabel>
                          <FormDescription>Upload gambar sampul buku berkualitas tinggi</FormDescription>
                          <FormControl>
                            <ImageUpload
                              value={field.value}
                              onChange={field.onChange}
                              bucket="product-images"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Status */}
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <FormLabel className="text-base">Tampilkan di Katalog</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Buku akan muncul di halaman toko dan dapat diindeks Google Scholar
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
                      {editingBook ? 'Simpan Perubahan' : 'Tambah Buku'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Info Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Tips Google Scholar
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Lengkapi semua field metadata (Penulis, Tahun, ISBN, Abstrak, Kata Kunci) agar buku dapat terindeks dengan baik di Google Scholar.
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Buku</TableHead>
                  <TableHead>Penulis</TableHead>
                  <TableHead>Tahun</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : books.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Belum ada buku dalam katalog
                    </TableCell>
                  </TableRow>
                ) : (
                  books.map((book) => (
                    <TableRow key={book.id} className={selectedIds.includes(book.id) ? 'bg-muted/50' : ''}>
                      <TableCell>
                        <BulkSelectCheckbox
                          id={book.id}
                          selectedIds={selectedIds}
                          onToggle={handleToggleSelect}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {book.image_url && (
                            <img
                              src={book.image_url}
                              alt={book.name}
                              className="h-12 w-9 rounded object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium line-clamp-1">{book.name}</p>
                            <p className="text-xs text-muted-foreground">{book.category}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{book.author || '-'}</TableCell>
                      <TableCell>{book.publish_year || '-'}</TableCell>
                      <TableCell>{formatPrice(book.price)}</TableCell>
                      <TableCell>
                        <Badge variant={book.is_active ? 'default' : 'secondary'}>
                          {book.is_active ? 'Aktif' : 'Draft'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                              >
                                <a href={`/shop/${book.slug}`} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Lihat Halaman</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleActiveStatus(book)}
                              >
                                {book.is_active ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {book.is_active ? 'Sembunyikan' : 'Tampilkan'}
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => duplicateBook(book)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Duplikasi</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(book)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteBook(book.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Hapus</TooltipContent>
                          </Tooltip>
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
    </TooltipProvider>
  );
}
