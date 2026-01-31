import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useActivityLog } from '@/hooks/useActivityLog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, FileText, ChevronRight, Eye, EyeOff, ExternalLink, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { BlockEditor, Block } from '@/components/admin/BlockEditor';
import { ImageUpload } from '@/components/admin/ImageUpload';

interface Page {
  id: string;
  parent_id: string | null;
  title: string;
  slug: string;
  meta_description: string | null;
  featured_image: string | null;
  is_published: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

interface PageBlock {
  id: string;
  page_id: string;
  type: string;
  content: Record<string, any>;
  position: number;
}

export default function AdminPages() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    parent_id: '',
    meta_description: '',
    featured_image: '',
    is_published: false,
    position: 0,
  });

  const { toast } = useToast();
  const { logActivity } = useActivityLog();

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .order('position', { ascending: true });

      if (error) throw error;
      setPages(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPageBlocks = async (pageId: string) => {
    try {
      const { data, error } = await supabase
        .from('page_blocks')
        .select('*')
        .eq('page_id', pageId)
        .order('position', { ascending: true });

      if (error) throw error;
      
      setBlocks((data || []).map(block => ({
        id: block.id,
        type: block.type as Block['type'],
        content: block.content as Record<string, any>,
        position: block.position,
      })));
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
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

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: editingPage ? prev.slug : generateSlug(title),
    }));
  };

  const openCreateDialog = () => {
    setEditingPage(null);
    setBlocks([]);
    setFormData({
      title: '',
      slug: '',
      parent_id: '',
      meta_description: '',
      featured_image: '',
      is_published: false,
      position: pages.length,
    });
    setDialogOpen(true);
  };

  const openEditDialog = async (page: Page) => {
    setEditingPage(page);
    setFormData({
      title: page.title,
      slug: page.slug,
      parent_id: page.parent_id || '',
      meta_description: page.meta_description || '',
      featured_image: page.featured_image || '',
      is_published: page.is_published,
      position: page.position,
    });
    await fetchPageBlocks(page.id);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const pageData = {
        title: formData.title,
        slug: formData.slug,
        parent_id: formData.parent_id || null,
        meta_description: formData.meta_description || null,
        featured_image: formData.featured_image || null,
        is_published: formData.is_published,
        position: formData.position,
      };

      let pageId = editingPage?.id;

      if (editingPage) {
        const { error } = await supabase
          .from('pages')
          .update(pageData)
          .eq('id', editingPage.id);
        if (error) throw error;
        
        await logActivity({
          action: 'update',
          entityType: 'page',
          entityId: editingPage.id,
          entityName: formData.title,
        });
      } else {
        const { data, error } = await supabase
          .from('pages')
          .insert(pageData)
          .select()
          .single();
        if (error) throw error;
        pageId = data.id;
        
        await logActivity({
          action: 'create',
          entityType: 'page',
          entityId: pageId,
          entityName: formData.title,
        });
      }

      // Save blocks
      if (pageId) {
        // Delete existing blocks
        await supabase
          .from('page_blocks')
          .delete()
          .eq('page_id', pageId);

        // Insert new blocks
        if (blocks.length > 0) {
          const blocksData = blocks.map((block, index) => ({
            page_id: pageId,
            type: block.type,
            content: block.content,
            position: index,
          }));

          const { error: blocksError } = await supabase
            .from('page_blocks')
            .insert(blocksData);

          if (blocksError) throw blocksError;
        }
      }

      toast({
        title: 'Berhasil',
        description: `Halaman berhasil ${editingPage ? 'diperbarui' : 'ditambahkan'}`,
      });

      setDialogOpen(false);
      fetchPages();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    const pageToDelete = pages.find(p => p.id === id);
    if (!confirm('Yakin ingin menghapus halaman ini?')) return;

    try {
      const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await logActivity({
        action: 'delete',
        entityType: 'page',
        entityId: id,
        entityName: pageToDelete?.title,
      });

      toast({
        title: 'Berhasil',
        description: 'Halaman berhasil dihapus',
      });

      fetchPages();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getParentTitle = (parentId: string | null) => {
    if (!parentId) return '-';
    const parent = pages.find(p => p.id === parentId);
    return parent?.title || '-';
  };

  const getAvailableParents = () => {
    return pages.filter(p => p.id !== editingPage?.id);
  };

  const togglePublishStatus = async (page: Page) => {
    try {
      const { error } = await supabase
        .from('pages')
        .update({ is_published: !page.is_published })
        .eq('id', page.id);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: page.is_published ? 'Halaman disimpan sebagai draft' : 'Halaman dipublikasikan',
      });

      fetchPages();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const openPreview = (page: Page) => {
    // Use preview mode query param for draft pages
    const url = page.is_published 
      ? `/halaman/${page.slug}` 
      : `/halaman/${page.slug}?preview=true`;
    window.open(url, '_blank');
  };

  const duplicatePage = async (page: Page) => {
    try {
      // Generate unique slug
      const newSlug = `${page.slug}-copy-${Date.now().toString(36)}`;
      
      // Create duplicate page
      const { data: newPage, error: pageError } = await supabase
        .from('pages')
        .insert({
          title: `${page.title} (Salinan)`,
          slug: newSlug,
          parent_id: page.parent_id,
          meta_description: page.meta_description,
          featured_image: page.featured_image,
          is_published: false, // Always start as draft
          position: pages.length,
        })
        .select()
        .single();

      if (pageError) throw pageError;

      // Fetch original page blocks
      const { data: originalBlocks, error: blocksError } = await supabase
        .from('page_blocks')
        .select('*')
        .eq('page_id', page.id)
        .order('position', { ascending: true });

      if (blocksError) throw blocksError;

      // Duplicate blocks if any
      if (originalBlocks && originalBlocks.length > 0) {
        const newBlocks = originalBlocks.map(block => ({
          page_id: newPage.id,
          type: block.type,
          content: block.content,
          position: block.position,
        }));

        const { error: insertBlocksError } = await supabase
          .from('page_blocks')
          .insert(newBlocks);

        if (insertBlocksError) throw insertBlocksError;
      }

      toast({
        title: 'Berhasil',
        description: `Halaman "${page.title}" berhasil diduplikasi`,
      });

      fetchPages();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <TooltipProvider>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Halaman</h1>
          <p className="text-muted-foreground">Kelola halaman website (Profil, Visi Misi, dll)</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Halaman
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPage ? 'Edit Halaman' : 'Tambah Halaman Baru'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Judul Halaman</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (URL)</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parent">Parent Page</Label>
                  <Select
                    value={formData.parent_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, parent_id: value === 'none' ? '' : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih parent (opsional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Tidak ada parent</SelectItem>
                      {getAvailableParents().map((page) => (
                        <SelectItem key={page.id} value={page.id}>
                          {page.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Posisi</Label>
                  <Input
                    id="position"
                    type="number"
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta_description">Meta Description (SEO)</Label>
                <Textarea
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                  placeholder="Deskripsi singkat untuk SEO (max 160 karakter)"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Featured Image</Label>
                <ImageUpload
                  value={formData.featured_image}
                  onChange={(url) => setFormData(prev => ({ ...prev, featured_image: url }))}
                  bucket="post-images"
                  folder="pages"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
                />
                <Label htmlFor="is_published">Publikasikan</Label>
              </div>

              <div className="space-y-2">
                <Label>Konten</Label>
                <BlockEditor blocks={blocks} onChange={setBlocks} />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">
                  {editingPage ? 'Simpan Perubahan' : 'Tambah Halaman'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Daftar Halaman
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pages.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Belum ada halaman. Klik tombol "Tambah Halaman" untuk membuat halaman baru.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Posisi</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell className="font-medium">
                      {page.parent_id && <ChevronRight className="inline h-4 w-4 mr-1 text-muted-foreground" />}
                      {page.title}
                    </TableCell>
                    <TableCell className="text-muted-foreground">/{page.slug}</TableCell>
                    <TableCell>{getParentTitle(page.parent_id)}</TableCell>
                    <TableCell>
                      <Badge variant={page.is_published ? 'default' : 'secondary'}>
                        {page.is_published ? 'Published' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell>{page.position}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openPreview(page)}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {page.is_published ? 'Lihat Halaman' : 'Preview Draft'}
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => togglePublishStatus(page)}
                            >
                              {page.is_published ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {page.is_published ? 'Jadikan Draft' : 'Publikasikan'}
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => duplicatePage(page)}
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
                              onClick={() => openEditDialog(page)}
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
                              onClick={() => handleDelete(page.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Hapus</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
    </TooltipProvider>
  );
}
