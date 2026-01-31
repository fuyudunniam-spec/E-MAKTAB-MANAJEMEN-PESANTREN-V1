import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useActivityLog } from '@/hooks/useActivityLog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Loader2, CalendarIcon, Eye, Save, Clock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ImageUpload } from '@/components/admin/ImageUpload';

const postSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  slug: z.string().min(1, 'Slug wajib diisi'),
  excerpt: z.string().optional(),
  content: z.string().min(1, 'Konten wajib diisi'),
  category: z.string().min(1, 'Kategori wajib dipilih'),
  author: z.string().min(1, 'Penulis wajib diisi'),
  image_url: z.string().optional().or(z.literal('')),
  image_caption: z.string().optional().or(z.literal('')),
  tags: z.string().optional().or(z.literal('')),
  is_published: z.boolean(),
  published_at: z.date().optional().nullable(),
});

type PostFormValues = z.infer<typeof postSchema>;

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  category: string;
  author: string;
  image_url: string | null;
  image_caption: string | null;
  tags: string[] | null;
  is_published: boolean | null;
  published_at: string | null;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Author {
  id: string;
  name: string;
  image_url: string | null;
}

const AUTOSAVE_KEY = 'post_draft_autosave';
const AUTOSAVE_DELAY = 2000; // 2 seconds

export default function AdminPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('edit');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { logActivity } = useActivityLog();

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      category: '',
      author: 'Admin',
      image_url: '',
      image_caption: '',
      tags: '',
      is_published: false,
      published_at: null,
    },
  });

  // Check for existing draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(AUTOSAVE_KEY);
    if (savedDraft) {
      setHasDraft(true);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchCategories();
    fetchAuthors();
  }, []);

  // Autosave function
  const saveDraft = useCallback((values: PostFormValues) => {
    if (!editingPost) { // Only autosave for new posts
      const draftData = {
        ...values,
        published_at: values.published_at?.toISOString() || null,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(draftData));
      setLastSaved(new Date());
    }
  }, [editingPost]);

  // Watch form changes and autosave
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (!isDialogOpen || editingPost) return;
      
      // Clear existing timeout
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
      
      // Set new timeout for autosave
      autosaveTimeoutRef.current = setTimeout(() => {
        if (values.title || values.content) {
          saveDraft(values as PostFormValues);
        }
      }, AUTOSAVE_DELAY);
    });

    return () => {
      subscription.unsubscribe();
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [form, isDialogOpen, editingPost, saveDraft]);

  // Clear draft after successful save
  const clearDraft = useCallback(() => {
    localStorage.removeItem(AUTOSAVE_KEY);
    setLastSaved(null);
    setHasDraft(false);
  }, []);

  // Restore draft
  const restoreDraft = useCallback(() => {
    const savedDraft = localStorage.getItem(AUTOSAVE_KEY);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        form.reset({
          title: draft.title || '',
          slug: draft.slug || '',
          excerpt: draft.excerpt || '',
          content: draft.content || '',
          category: draft.category || categories[0]?.name || '',
          author: draft.author || authors[0]?.name || 'Admin',
          image_url: draft.image_url || '',
          image_caption: draft.image_caption || '',
          is_published: draft.is_published || false,
          published_at: draft.published_at ? new Date(draft.published_at) : null,
        });
        setLastSaved(new Date(draft.savedAt));
        toast({
          title: 'Draft Dipulihkan',
          description: 'Draft artikel sebelumnya berhasil dipulihkan',
        });
      } catch (e) {
        console.error('Failed to restore draft:', e);
      }
    }
    setHasDraft(false);
    setIsDialogOpen(true);
  }, [form, categories, authors, toast]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('type', 'post')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchAuthors = async () => {
    try {
      const { data, error } = await supabase
        .from('authors')
        .select('id, name, image_url')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setAuthors(data || []);
    } catch (error) {
      console.error('Error fetching authors:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengambil data artikel',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const openCreateDialog = () => {
    // Check if there's a saved draft
    const savedDraft = localStorage.getItem(AUTOSAVE_KEY);
    if (savedDraft) {
      setHasDraft(true);
      return; // Will show restore prompt instead
    }
    
    setEditingPost(null);
    setActiveTab('edit');
    setLastSaved(null);
    form.reset({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      category: categories[0]?.name || '',
      author: authors[0]?.name || 'Admin',
      image_url: '',
      image_caption: '',
      tags: '',
      is_published: false,
      published_at: null,
    });
    setIsDialogOpen(true);
  };

  const startFreshPost = () => {
    clearDraft();
    setEditingPost(null);
    setActiveTab('edit');
    setLastSaved(null);
    form.reset({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      category: categories[0]?.name || '',
      author: authors[0]?.name || 'Admin',
      image_url: '',
      image_caption: '',
      tags: '',
      is_published: false,
      published_at: null,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (post: Post) => {
    setEditingPost(post);
    setActiveTab('edit');
    form.reset({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content || '',
      category: post.category,
      author: post.author,
      image_url: post.image_url || '',
      image_caption: post.image_caption || '',
      tags: post.tags?.join(', ') || '',
      is_published: post.is_published ?? false,
      published_at: post.published_at ? new Date(post.published_at) : null,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: PostFormValues) => {
    setIsSubmitting(true);
    try {
      const publishedAt = values.is_published 
        ? (values.published_at?.toISOString() || new Date().toISOString())
        : null;
      
      // Parse tags from comma-separated string
      const tagsArray = values.tags
        ? values.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : null;

      if (editingPost) {
        const { error } = await supabase
          .from('posts')
          .update({
            title: values.title,
            slug: values.slug,
            excerpt: values.excerpt || null,
            content: values.content,
            category: values.category,
            author: values.author,
            image_url: values.image_url || null,
            image_caption: values.image_caption || null,
            tags: tagsArray,
            is_published: values.is_published,
            published_at: publishedAt,
          })
          .eq('id', editingPost.id);

        if (error) throw error;
        
        await logActivity({
          action: 'update',
          entityType: 'post',
          entityId: editingPost.id,
          entityName: values.title,
        });
        
        toast({ title: 'Berhasil', description: 'Artikel berhasil diperbarui' });
      } else {
        const { data, error } = await supabase.from('posts').insert([{
          title: values.title,
          slug: values.slug,
          excerpt: values.excerpt || null,
          content: values.content,
          category: values.category,
          author: values.author,
          image_url: values.image_url || null,
          image_caption: values.image_caption || null,
          tags: tagsArray,
          is_published: values.is_published,
          published_at: publishedAt,
        }]).select('id').single();

        if (error) throw error;
        
        await logActivity({
          action: 'create',
          entityType: 'post',
          entityId: data?.id,
          entityName: values.title,
        });
        
        toast({ title: 'Berhasil', description: 'Artikel berhasil ditambahkan' });
        clearDraft();
      }

      setIsDialogOpen(false);
      fetchPosts();
    } catch (error: any) {
      console.error('Error saving post:', error);
      toast({
        title: 'Error',
        description: error.message?.includes('duplicate')
          ? 'Slug sudah digunakan, gunakan slug lain'
          : 'Gagal menyimpan artikel',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deletePost = async (id: string) => {
    const postToDelete = posts.find(p => p.id === id);
    if (!confirm('Yakin ingin menghapus artikel ini?')) return;

    try {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (error) throw error;
      
      await logActivity({
        action: 'delete',
        entityType: 'post',
        entityId: id,
        entityName: postToDelete?.title,
      });
      
      toast({ title: 'Berhasil', description: 'Artikel berhasil dihapus' });
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus artikel',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Draft Restore Dialog */}
      <Dialog open={hasDraft} onOpenChange={setHasDraft}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Draft Tersimpan Ditemukan
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Anda memiliki draft artikel yang belum selesai. Apakah ingin melanjutkan draft tersebut atau memulai artikel baru?
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={startFreshPost}>
              Mulai Baru
            </Button>
            <Button onClick={restoreDraft}>
              Lanjutkan Draft
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Kelola Artikel</h2>
          <p className="text-muted-foreground">Tambah, edit, atau hapus artikel blog</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open && !editingPost) {
            // Save draft when closing dialog
            const values = form.getValues();
            if (values.title || values.content) {
              saveDraft(values);
            }
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Artikel
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{editingPost ? 'Edit Artikel' : 'Tambah Artikel Baru'}</span>
                {!editingPost && lastSaved && (
                  <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
                    <Save className="h-3 w-3" />
                    Tersimpan {format(lastSaved, 'HH:mm:ss')}
                  </span>
                )}
              </DialogTitle>
            </DialogHeader>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="edit">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </TabsTrigger>
                <TabsTrigger value="preview">
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="edit" className="mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Judul Artikel</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            if (!editingPost) {
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

                <div className="grid grid-cols-2 gap-4">
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
                    name="author"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Penulis</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih penulis" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {authors.map((author) => (
                              <SelectItem key={author.id} value={author.name}>
                                {author.name}
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
                  name="published_at"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Tanggal Publikasi</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "d MMMM yyyy", { locale: localeId })
                              ) : (
                                <span>Pilih tanggal</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gambar Artikel</FormLabel>
                      <FormControl>
                        <ImageUpload
                          value={field.value}
                          onChange={field.onChange}
                          bucket="post-images"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="image_caption"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Keterangan Gambar (Opsional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Contoh: Foto oleh Ahmad / Ilustrasi: Budi Santoso" 
                          {...field} 
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Untuk memberi kredit kepada fotografer atau ilustrator
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="pendidikan, islam, pesantren (pisahkan dengan koma)" 
                          {...field} 
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Pisahkan beberapa tag dengan koma
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="excerpt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ringkasan</FormLabel>
                      <FormControl>
                        <Textarea rows={2} placeholder="Ringkasan singkat artikel..." {...field} />
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
                      <FormLabel>Konten Artikel</FormLabel>
                      <FormControl>
                        <RichTextEditor
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Tulis konten artikel di sini..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_published"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <FormLabel className="text-base">Publikasikan</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Artikel akan ditampilkan di halaman blog
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
                    {editingPost ? 'Simpan Perubahan' : 'Tambah Artikel'}
                  </Button>
                </div>
              </form>
            </Form>
              </TabsContent>
              
              <TabsContent value="preview" className="mt-4">
                <div className="border rounded-lg overflow-hidden">
                  {/* Preview Header */}
                  {form.watch('image_url') && (
                    <div className="relative">
                      <img
                        src={form.watch('image_url')}
                        alt={form.watch('title')}
                        className="w-full h-64 object-cover"
                      />
                      {form.watch('image_caption') && (
                        <p className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-sm px-4 py-2">
                          {form.watch('image_caption')}
                        </p>
                      )}
                    </div>
                  )}
                  
                  <div className="p-6 space-y-4">
                    {/* Category & Date */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <Badge variant="outline">{form.watch('category') || 'Kategori'}</Badge>
                      <span>{format(form.watch('published_at') || new Date(), 'd MMMM yyyy', { locale: localeId })}</span>
                    </div>
                    
                    {/* Title */}
                    <h1 className="text-3xl font-bold">
                      {form.watch('title') || 'Judul Artikel'}
                    </h1>
                    
                    {/* Author */}
                    <p className="text-muted-foreground">
                      Oleh <span className="font-medium text-foreground">{form.watch('author') || 'Penulis'}</span>
                    </p>
                    
                    {/* Excerpt */}
                    {form.watch('excerpt') && (
                      <p className="text-lg text-muted-foreground italic border-l-4 border-primary pl-4">
                        {form.watch('excerpt')}
                      </p>
                    )}
                    
                    {/* Content */}
                    <div 
                      className="prose prose-lg dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: form.watch('content') || '<p class="text-muted-foreground">Konten artikel akan muncul di sini...</p>' }}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Artikel</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Penulis</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : posts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Belum ada artikel
                  </TableCell>
                </TableRow>
              ) : (
                posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {post.image_url && (
                          <img
                            src={post.image_url}
                            alt={post.title}
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium">{post.title}</p>
                          <p className="text-sm text-muted-foreground">/{post.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{post.category}</TableCell>
                    <TableCell>{post.author}</TableCell>
                    <TableCell>
                      <Badge variant={post.is_published ? 'default' : 'secondary'}>
                        {post.is_published ? 'Dipublikasikan' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(post.published_at || post.created_at), 'd MMM yyyy', { locale: localeId })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(post)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deletePost(post.id)}
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
