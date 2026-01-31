import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Plus, Pencil, Trash2, Loader2, ShoppingBag, Eye, EyeOff, Copy, Tag } from 'lucide-react';
import { ImageUpload } from '@/components/admin/ImageUpload';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { BulkActions, BulkSelectCheckbox } from '@/components/admin/BulkActions';

const productSchema = z.object({
  name: z.string().min(1, 'Nama produk wajib diisi'),
  slug: z.string().min(1, 'Slug wajib diisi'),
  description: z.string().optional(),
  category: z.string().min(1, 'Kategori wajib dipilih'),
  price: z.coerce.number().min(0, 'Harga tidak boleh negatif'),
  discount_price: z.coerce.number().min(0).optional().or(z.literal('')),
  discount_percentage: z.coerce.number().min(0).max(100).optional().or(z.literal('')),
  is_on_sale: z.boolean().default(false),
  stock: z.coerce.number().min(0, 'Stok tidak boleh negatif'),
  image_url: z.string().optional().or(z.literal('')),
  is_active: z.boolean(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
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

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { toast } = useToast();

  // Bulk action handlers
  const handleSelectAll = () => {
    setSelectedIds(products.map(p => p.id));
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
      toast({ title: 'Berhasil', description: `${ids.length} produk berhasil dihapus` });
      setSelectedIds([]);
      fetchProducts();
    } catch (error) {
      console.error('Error bulk deleting:', error);
      toast({ title: 'Error', description: 'Gagal menghapus produk', variant: 'destructive' });
    }
  };

  const handleBulkActivate = async (ids: string[]) => {
    try {
      const { error } = await supabase.from('products').update({ is_active: true }).in('id', ids);
      if (error) throw error;
      toast({ title: 'Berhasil', description: `${ids.length} produk diaktifkan` });
      setSelectedIds([]);
      fetchProducts();
    } catch (error) {
      console.error('Error bulk activating:', error);
      toast({ title: 'Error', description: 'Gagal mengaktifkan produk', variant: 'destructive' });
    }
  };

  const handleBulkDeactivate = async (ids: string[]) => {
    try {
      const { error } = await supabase.from('products').update({ is_active: false }).in('id', ids);
      if (error) throw error;
      toast({ title: 'Berhasil', description: `${ids.length} produk dinonaktifkan` });
      setSelectedIds([]);
      fetchProducts();
    } catch (error) {
      console.error('Error bulk deactivating:', error);
      toast({ title: 'Error', description: 'Gagal menonaktifkan produk', variant: 'destructive' });
    }
  };

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
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
    fetchProducts();
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

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('product_type', 'general')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengambil data produk',
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
    setEditingProduct(null);
    form.reset({
      name: '',
      slug: '',
      description: '',
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

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      category: product.category,
      price: product.price,
      discount_price: product.discount_price || '',
      discount_percentage: product.discount_percentage || '',
      is_on_sale: product.is_on_sale ?? false,
      stock: product.stock || 0,
      image_url: product.image_url || '',
      is_active: product.is_active ?? true,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: ProductFormValues) => {
    setIsSubmitting(true);
    try {
      const productData = {
        name: values.name,
        slug: values.slug,
        description: values.description || null,
        category: values.category,
        price: values.price,
        discount_price: values.discount_price ? Number(values.discount_price) : null,
        discount_percentage: values.discount_percentage ? Number(values.discount_percentage) : null,
        is_on_sale: values.is_on_sale,
        stock: values.stock,
        image_url: values.image_url || null,
        is_active: values.is_active,
        product_type: 'general',
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast({ title: 'Berhasil', description: 'Produk berhasil diperbarui' });
      } else {
        const { error } = await supabase.from('products').insert([productData]);

        if (error) throw error;
        toast({ title: 'Berhasil', description: 'Produk berhasil ditambahkan' });
      }

      setIsDialogOpen(false);
      fetchProducts();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({
        title: 'Error',
        description: error.message?.includes('duplicate')
          ? 'Slug sudah digunakan, gunakan slug lain'
          : 'Gagal menyimpan produk',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;

    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Berhasil', description: 'Produk berhasil dihapus' });
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus produk',
        variant: 'destructive',
      });
    }
  };

  const toggleActiveStatus = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !product.is_active })
        .eq('id', product.id);

      if (error) throw error;
      toast({
        title: 'Berhasil',
        description: product.is_active ? 'Produk disembunyikan' : 'Produk ditampilkan',
      });
      fetchProducts();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const duplicateProduct = async (product: Product) => {
    try {
      const newSlug = `${product.slug}-copy-${Date.now().toString(36)}`;
      
      const { error } = await supabase.from('products').insert([{
        ...product,
        id: undefined,
        name: `${product.name} (Salinan)`,
        slug: newSlug,
        is_active: false,
        created_at: undefined,
        product_type: 'general',
      }]);

      if (error) throw error;
      toast({ title: 'Berhasil', description: 'Produk berhasil diduplikasi' });
      fetchProducts();
    } catch (error) {
      console.error('Error duplicating product:', error);
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
            <h2 className="text-2xl font-bold text-foreground">Produk Umum</h2>
            <p className="text-muted-foreground">Kelola merchandise, souvenir, dan produk non-buku lainnya</p>
          </div>
          <div className="flex items-center gap-2">
            <BulkActions
              selectedIds={selectedIds}
              totalItems={products.length}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onBulkDelete={handleBulkDelete}
              onBulkActivate={handleBulkActivate}
              onBulkDeactivate={handleBulkDeactivate}
              entityName="produk"
            />
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Produk
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  
                  {/* Informasi Dasar */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground">Informasi Produk</h3>
                    <Separator />
                    
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Produk</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Contoh: Sajadah Eksklusif"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                if (!editingProduct) {
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
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Deskripsi</FormLabel>
                          <FormControl>
                            <Textarea rows={4} placeholder="Deskripsi produk..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Kategori & Harga */}
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
                            <FormLabel>Harga (Rp)</FormLabel>
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
                          <h4 className="font-medium">Pengaturan Diskon</h4>
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

                  {/* Gambar */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground">Gambar Produk</h3>
                    <Separator />
                    
                    <FormField
                      control={form.control}
                      name="image_url"
                      render={({ field }) => (
                        <FormItem>
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
                          <FormLabel className="text-base">Tampilkan di Toko</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Produk akan muncul di halaman toko
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
                      {editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Stok</TableHead>
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
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Belum ada produk. Klik "Tambah Produk" untuk menambahkan.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id} className={selectedIds.includes(product.id) ? 'bg-muted/50' : ''}>
                      <TableCell>
                        <BulkSelectCheckbox
                          id={product.id}
                          selectedIds={selectedIds}
                          onToggle={handleToggleSelect}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-12 h-12 rounded object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                              <ShoppingBag className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-muted-foreground">/{product.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{product.category}</Badge>
                      </TableCell>
                      <TableCell>
                        {product.is_on_sale && product.discount_price ? (
                          <div>
                            <span className="line-through text-muted-foreground text-xs">
                              {formatPrice(product.price)}
                            </span>
                            <br />
                            <span className="text-destructive font-medium">
                              {formatPrice(product.discount_price)}
                            </span>
                          </div>
                        ) : (
                          formatPrice(product.price)
                        )}
                      </TableCell>
                      <TableCell>{product.stock ?? 0}</TableCell>
                      <TableCell>
                        <Badge variant={product.is_active ? 'default' : 'secondary'}>
                          {product.is_active ? 'Aktif' : 'Draft'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleActiveStatus(product)}
                              >
                                {product.is_active ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {product.is_active ? 'Sembunyikan' : 'Tampilkan'}
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => duplicateProduct(product)}
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
                                onClick={() => openEditDialog(product)}
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
                                onClick={() => deleteProduct(product.id)}
                                className="text-destructive hover:text-destructive"
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