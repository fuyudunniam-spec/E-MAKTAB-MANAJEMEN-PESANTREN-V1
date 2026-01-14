import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useActivityLog } from '@/hooks/useActivityLog';
import { Loader2, Plus, Save, Trash2, GripVertical, Eye, EyeOff, Star, Quote, Upload, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Testimonial {
  id: string;
  name: string;
  role: string | null;
  content: string;
  avatar_url: string | null;
  rating: number | null;
  position: number | null;
  is_active: boolean | null;
}

function SortableItem({
  testimonial,
  onEdit,
  onToggle,
  onDelete,
}: {
  testimonial: Testimonial;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: testimonial.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-4 border rounded-lg transition-colors ${
        testimonial.is_active ? 'bg-background' : 'bg-muted/50 opacity-60'
      } ${isDragging ? 'shadow-lg ring-2 ring-primary' : ''}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>
      {testimonial.avatar_url ? (
        <img
          src={testimonial.avatar_url}
          alt={testimonial.name}
          className="w-10 h-10 rounded-full object-cover"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-primary font-semibold">{testimonial.name.charAt(0)}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-foreground">{testimonial.name}</div>
        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
        <div className="text-xs text-muted-foreground truncate mt-1">
          "{testimonial.content}"
        </div>
      </div>
      <div className="flex items-center gap-1">
        {Array.from({ length: testimonial.rating || 0 }).map((_, i) => (
          <Star key={i} className="w-3 h-3 fill-secondary text-secondary" />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={testimonial.is_active || false}
          onCheckedChange={onToggle}
        />
        <Button variant="ghost" size="sm" onClick={onEdit}>
          Edit
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function AdminTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const { logActivity } = useActivityLog();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('position', { ascending: true });

      if (error) throw error;
      setTestimonials(data || []);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      toast.error('Gagal memuat data testimoni');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = testimonials.findIndex((t) => t.id === active.id);
      const newIndex = testimonials.findIndex((t) => t.id === over.id);

      const newTestimonials = arrayMove(testimonials, oldIndex, newIndex);
      setTestimonials(newTestimonials);

      // Update positions in database
      try {
        const updates = newTestimonials.map((testimonial, index) => ({
          id: testimonial.id,
          position: index,
        }));

        for (const update of updates) {
          await supabase
            .from('testimonials')
            .update({ position: update.position })
            .eq('id', update.id);
        }

        toast.success('Urutan testimoni berhasil diperbarui');
      } catch (error) {
        console.error('Error updating positions:', error);
        toast.error('Gagal memperbarui urutan');
        fetchTestimonials(); // Revert on error
      }
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!editingTestimonial) return;
    
    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `testimonial-${Date.now()}.${fileExt}`;
      const filePath = `testimonials/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media-library')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('media-library')
        .getPublicUrl(filePath);

      setEditingTestimonial({ ...editingTestimonial, avatar_url: urlData.publicUrl });
      toast.success('Avatar berhasil diupload');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Gagal mengupload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!editingTestimonial) return;
    
    setSaving(true);
    try {
      if (editingTestimonial.id.startsWith('new-')) {
        const { id, ...testimonialData } = editingTestimonial;
        const { data, error } = await supabase
          .from('testimonials')
          .insert({ ...testimonialData, position: testimonials.length })
          .select('id')
          .single();
        if (error) throw error;
        
        await logActivity({
          action: 'create',
          entityType: 'testimonial',
          entityId: data?.id,
          entityName: editingTestimonial.name,
        });
        
        toast.success('Testimoni berhasil ditambahkan');
      } else {
        const { error } = await supabase
          .from('testimonials')
          .update({
            name: editingTestimonial.name,
            role: editingTestimonial.role,
            content: editingTestimonial.content,
            avatar_url: editingTestimonial.avatar_url,
            rating: editingTestimonial.rating,
            is_active: editingTestimonial.is_active,
          })
          .eq('id', editingTestimonial.id);
        if (error) throw error;
        
        await logActivity({
          action: 'update',
          entityType: 'testimonial',
          entityId: editingTestimonial.id,
          entityName: editingTestimonial.name,
        });
        
        toast.success('Testimoni berhasil diperbarui');
      }
      
      setIsDialogOpen(false);
      setEditingTestimonial(null);
      fetchTestimonials();
    } catch (error) {
      console.error('Error saving testimonial:', error);
      toast.error('Gagal menyimpan testimoni');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    const testimonialToDelete = testimonials.find(t => t.id === deleteId);
    
    try {
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;
      
      await logActivity({
        action: 'delete',
        entityType: 'testimonial',
        entityId: deleteId,
        entityName: testimonialToDelete?.name,
      });
      
      toast.success('Testimoni berhasil dihapus');
      setDeleteId(null);
      fetchTestimonials();
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      toast.error('Gagal menghapus testimoni');
    }
  };

  const handleToggleActive = async (testimonial: Testimonial) => {
    try {
      const { error } = await supabase
        .from('testimonials')
        .update({ is_active: !testimonial.is_active })
        .eq('id', testimonial.id);

      if (error) throw error;
      toast.success(`Testimoni ${!testimonial.is_active ? 'diaktifkan' : 'dinonaktifkan'}`);
      fetchTestimonials();
    } catch (error) {
      console.error('Error toggling testimonial:', error);
      toast.error('Gagal mengubah status testimoni');
    }
  };

  const openEditDialog = (testimonial?: Testimonial) => {
    if (testimonial) {
      setEditingTestimonial(testimonial);
    } else {
      setEditingTestimonial({
        id: `new-${Date.now()}`,
        name: '',
        role: '',
        content: '',
        avatar_url: null,
        rating: 5,
        position: testimonials.length,
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const activeTestimonials = testimonials.filter(t => t.is_active);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Kelola Testimoni</h2>
          <p className="text-muted-foreground">Kelola testimoni yang ditampilkan di homepage. Drag untuk mengatur urutan.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={previewMode ? "default" : "outline"}
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
            {previewMode ? 'Tutup Preview' : 'Preview'}
          </Button>
          <Button onClick={() => openEditDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Testimoni
          </Button>
        </div>
      </div>

      {/* Preview Mode */}
      {previewMode && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview Section Testimoni
            </CardTitle>
            <CardDescription>Tampilan testimoni di halaman utama</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              {activeTestimonials.map((testimonial) => (
                <Card key={testimonial.id} className="relative overflow-hidden">
                  <CardContent className="p-6">
                    <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Quote className="w-5 h-5 text-primary" />
                    </div>
                    <blockquote className="text-muted-foreground leading-relaxed mb-6 pr-12">
                      "{testimonial.content}"
                    </blockquote>
                    <div className="flex items-center gap-3">
                      {testimonial.avatar_url ? (
                        <img
                          src={testimonial.avatar_url}
                          alt={testimonial.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-primary font-bold text-lg">
                            {testimonial.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-foreground">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                    {testimonial.rating && (
                      <div className="flex gap-1 mt-3">
                        {Array.from({ length: testimonial.rating }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-secondary text-secondary" />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            {activeTestimonials.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Tidak ada testimoni aktif untuk ditampilkan
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Testimonials List with Drag and Drop */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Testimoni ({testimonials.length})</CardTitle>
          <CardDescription>Drag untuk mengubah urutan, klik pada testimoni untuk mengedit</CardDescription>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={testimonials.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {testimonials.map((testimonial) => (
                  <SortableItem
                    key={testimonial.id}
                    testimonial={testimonial}
                    onEdit={() => openEditDialog(testimonial)}
                    onToggle={() => handleToggleActive(testimonial)}
                    onDelete={() => setDeleteId(testimonial.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          {testimonials.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Belum ada testimoni. Klik "Tambah Testimoni" untuk menambahkan.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTestimonial?.id.startsWith('new-') ? 'Tambah Testimoni Baru' : 'Edit Testimoni'}
            </DialogTitle>
            <DialogDescription>
              Isi detail testimoni yang akan ditampilkan di homepage
            </DialogDescription>
          </DialogHeader>
          {editingTestimonial && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama</Label>
                <Input
                  id="name"
                  value={editingTestimonial.name}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, name: e.target.value })}
                  placeholder="Contoh: Ahmad Fauzi"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Status/Jabatan</Label>
                <Input
                  id="role"
                  value={editingTestimonial.role || ''}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, role: e.target.value })}
                  placeholder="Contoh: Wali Santri / Alumni 2023"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Isi Testimoni</Label>
                <Textarea
                  id="content"
                  value={editingTestimonial.content}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, content: e.target.value })}
                  placeholder="Tuliskan testimoni..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Avatar (Opsional)</Label>
                <div className="flex gap-2 items-center">
                  {editingTestimonial.avatar_url && (
                    <img
                      src={editingTestimonial.avatar_url}
                      alt="Avatar preview"
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                  <input
                    type="file"
                    id="avatar-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAvatarUpload(file);
                      e.target.value = '';
                    }}
                  />
                  <Button variant="outline" size="sm" asChild disabled={uploadingAvatar}>
                    <label htmlFor="avatar-upload" className="cursor-pointer">
                      {uploadingAvatar ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                      Upload Avatar
                    </label>
                  </Button>
                  {editingTestimonial.avatar_url && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingTestimonial({ ...editingTestimonial, avatar_url: null })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Rating</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Button
                      key={rating}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingTestimonial({ ...editingTestimonial, rating })}
                    >
                      <Star
                        className={`w-5 h-5 ${
                          rating <= (editingTestimonial.rating || 0)
                            ? 'fill-secondary text-secondary'
                            : 'text-muted-foreground'
                        }`}
                      />
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={editingTestimonial.is_active || false}
                  onCheckedChange={(checked) => setEditingTestimonial({ ...editingTestimonial, is_active: checked })}
                />
                <Label htmlFor="is_active">Aktif</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving || !editingTestimonial?.name || !editingTestimonial?.content}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Testimoni?</DialogTitle>
            <DialogDescription>
              Tindakan ini tidak dapat dibatalkan. Testimoni akan dihapus secara permanen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
