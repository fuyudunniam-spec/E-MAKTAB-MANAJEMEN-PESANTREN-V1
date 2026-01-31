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
import { Loader2, Plus, Save, Trash2, GripVertical, Eye, EyeOff, BookOpen } from 'lucide-react';
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

interface Program {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  position: number | null;
  is_active: boolean | null;
}

const iconOptions = [
  'BookOpen', 'GraduationCap', 'Users', 'Heart', 'Globe', 'Moon', 
  'Star', 'Award', 'Lightbulb', 'Target', 'Compass', 'Feather',
  'Languages', 'School', 'Library', 'Pencil'
];

function SortableItem({ 
  program, 
  onEdit, 
  onToggle, 
  onDelete 
}: { 
  program: Program; 
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
  } = useSortable({ id: program.id });

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
        program.is_active ? 'bg-background' : 'bg-muted/50 opacity-60'
      } ${isDragging ? 'shadow-lg ring-2 ring-primary' : ''}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <BookOpen className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-foreground">{program.title}</div>
        <div className="text-sm text-muted-foreground truncate">
          {program.description || 'Tidak ada deskripsi'}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={program.is_active || false}
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

export default function AdminPrograms() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const { logActivity } = useActivityLog();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .order('position', { ascending: true });

      if (error) throw error;
      setPrograms(data || []);
    } catch (error) {
      console.error('Error fetching programs:', error);
      toast.error('Gagal memuat data program');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = programs.findIndex((p) => p.id === active.id);
      const newIndex = programs.findIndex((p) => p.id === over.id);

      const newPrograms = arrayMove(programs, oldIndex, newIndex);
      setPrograms(newPrograms);

      // Update positions in database
      try {
        const updates = newPrograms.map((program, index) => ({
          id: program.id,
          position: index,
        }));

        for (const update of updates) {
          await supabase
            .from('programs')
            .update({ position: update.position })
            .eq('id', update.id);
        }

        toast.success('Urutan program berhasil diperbarui');
      } catch (error) {
        console.error('Error updating positions:', error);
        toast.error('Gagal memperbarui urutan');
        fetchPrograms(); // Revert on error
      }
    }
  };

  const handleSave = async () => {
    if (!editingProgram) return;
    
    setSaving(true);
    try {
      if (editingProgram.id.startsWith('new-')) {
        const { id, ...programData } = editingProgram;
        const { data, error } = await supabase
          .from('programs')
          .insert({ ...programData, position: programs.length })
          .select('id')
          .single();
        if (error) throw error;
        
        await logActivity({
          action: 'create',
          entityType: 'program',
          entityId: data?.id,
          entityName: editingProgram.title,
        });
        
        toast.success('Program berhasil ditambahkan');
      } else {
        const { error } = await supabase
          .from('programs')
          .update({
            title: editingProgram.title,
            description: editingProgram.description,
            icon: editingProgram.icon,
            is_active: editingProgram.is_active,
          })
          .eq('id', editingProgram.id);
        if (error) throw error;
        
        await logActivity({
          action: 'update',
          entityType: 'program',
          entityId: editingProgram.id,
          entityName: editingProgram.title,
        });
        
        toast.success('Program berhasil diperbarui');
      }
      
      setIsDialogOpen(false);
      setEditingProgram(null);
      fetchPrograms();
    } catch (error) {
      console.error('Error saving program:', error);
      toast.error('Gagal menyimpan program');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    const programToDelete = programs.find(p => p.id === deleteId);
    
    try {
      const { error } = await supabase
        .from('programs')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;
      
      await logActivity({
        action: 'delete',
        entityType: 'program',
        entityId: deleteId,
        entityName: programToDelete?.title,
      });
      
      toast.success('Program berhasil dihapus');
      setDeleteId(null);
      fetchPrograms();
    } catch (error) {
      console.error('Error deleting program:', error);
      toast.error('Gagal menghapus program');
    }
  };

  const handleToggleActive = async (program: Program) => {
    try {
      const { error } = await supabase
        .from('programs')
        .update({ is_active: !program.is_active })
        .eq('id', program.id);

      if (error) throw error;
      toast.success(`Program ${!program.is_active ? 'diaktifkan' : 'dinonaktifkan'}`);
      fetchPrograms();
    } catch (error) {
      console.error('Error toggling program:', error);
      toast.error('Gagal mengubah status program');
    }
  };

  const openEditDialog = (program?: Program) => {
    if (program) {
      setEditingProgram(program);
    } else {
      setEditingProgram({
        id: `new-${Date.now()}`,
        title: '',
        description: '',
        icon: 'BookOpen',
        position: programs.length,
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const activePrograms = programs.filter(p => p.is_active);

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
          <h2 className="text-2xl font-bold text-foreground">Kelola Program</h2>
          <p className="text-muted-foreground">Kelola program unggulan yang ditampilkan di homepage. Drag untuk mengatur urutan.</p>
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
            Tambah Program
          </Button>
        </div>
      </div>

      {/* Preview Mode */}
      {previewMode && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview Section Programs
            </CardTitle>
            <CardDescription>Tampilan program di halaman utama</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activePrograms.map((program) => (
                <Card key={program.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                      <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{program.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{program.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
            {activePrograms.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Tidak ada program aktif untuk ditampilkan
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Programs List with Drag and Drop */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Program ({programs.length})</CardTitle>
          <CardDescription>Drag untuk mengubah urutan, klik pada program untuk mengedit</CardDescription>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={programs.map(p => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {programs.map((program) => (
                  <SortableItem
                    key={program.id}
                    program={program}
                    onEdit={() => openEditDialog(program)}
                    onToggle={() => handleToggleActive(program)}
                    onDelete={() => setDeleteId(program.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          {programs.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Belum ada program. Klik "Tambah Program" untuk menambahkan.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingProgram?.id.startsWith('new-') ? 'Tambah Program Baru' : 'Edit Program'}
            </DialogTitle>
            <DialogDescription>
              Isi detail program yang akan ditampilkan di homepage
            </DialogDescription>
          </DialogHeader>
          {editingProgram && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Judul Program</Label>
                <Input
                  id="title"
                  value={editingProgram.title}
                  onChange={(e) => setEditingProgram({ ...editingProgram, title: e.target.value })}
                  placeholder="Contoh: Tahfidz Al-Quran"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={editingProgram.description || ''}
                  onChange={(e) => setEditingProgram({ ...editingProgram, description: e.target.value })}
                  placeholder="Deskripsi singkat tentang program..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="flex flex-wrap gap-2">
                  {iconOptions.map((icon) => (
                    <Button
                      key={icon}
                      type="button"
                      variant={editingProgram.icon === icon ? "default" : "outline"}
                      size="sm"
                      onClick={() => setEditingProgram({ ...editingProgram, icon })}
                    >
                      {icon}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={editingProgram.is_active || false}
                  onCheckedChange={(checked) => setEditingProgram({ ...editingProgram, is_active: checked })}
                />
                <Label htmlFor="is_active">Aktif</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving || !editingProgram?.title}>
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
            <DialogTitle>Hapus Program?</DialogTitle>
            <DialogDescription>
              Tindakan ini tidak dapat dibatalkan. Program akan dihapus secara permanen.
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
