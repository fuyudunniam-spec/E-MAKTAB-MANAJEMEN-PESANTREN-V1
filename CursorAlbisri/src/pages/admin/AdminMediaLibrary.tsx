import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Loader2,
  Upload,
  Search,
  Trash2,
  Copy,
  FolderOpen,
  Image as ImageIcon,
  FileText,
  Film,
  Music,
  File,
  Grid,
  List,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MediaFile {
  id: string;
  name: string;
  file_path: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
  folder: string | null;
  alt_text: string | null;
  created_at: string;
}

const folders = [
  { value: 'all', label: 'Semua File' },
  { value: 'uncategorized', label: 'Tanpa Folder' },
  { value: 'products', label: 'Produk' },
  { value: 'posts', label: 'Artikel' },
  { value: 'gallery', label: 'Galeri' },
  { value: 'pages', label: 'Halaman' },
];

export default function AdminMediaLibrary() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<MediaFile | null>(null);

  useEffect(() => {
    fetchFiles();
  }, [selectedFolder]);

  const fetchFiles = async () => {
    try {
      let query = supabase
        .from('media_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedFolder !== 'all') {
        query = query.eq('folder', selectedFolder);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Gagal memuat file');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    setUploading(true);

    try {
      for (const file of Array.from(uploadedFiles)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('media-library')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('media-library')
          .getPublicUrl(filePath);

        // Save to database
        const { error: dbError } = await supabase.from('media_files').insert({
          name: file.name,
          file_path: filePath,
          file_url: urlData.publicUrl,
          file_type: file.type,
          file_size: file.size,
          folder: selectedFolder === 'all' ? 'uncategorized' : selectedFolder,
        });

        if (dbError) throw dbError;
      }

      toast.success('File berhasil diupload');
      fetchFiles();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Gagal mengupload file');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDelete = async () => {
    if (!fileToDelete) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('media-library')
        .remove([fileToDelete.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('media_files')
        .delete()
        .eq('id', fileToDelete.id);

      if (dbError) throw dbError;

      toast.success('File berhasil dihapus');
      setDeleteDialogOpen(false);
      setFileToDelete(null);
      fetchFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Gagal menghapus file');
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL berhasil disalin');
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return ImageIcon;
    if (fileType.startsWith('video/')) return Film;
    if (fileType.startsWith('audio/')) return Music;
    if (fileType.includes('pdf') || fileType.includes('document')) return FileText;
    return File;
  };

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Media Library</h2>
          <p className="text-muted-foreground">Kelola semua file media</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            multiple
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
            onChange={handleUpload}
          />
          <Button asChild disabled={uploading}>
            <label htmlFor="file-upload" className="cursor-pointer">
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Upload File
            </label>
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari file..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedFolder} onValueChange={setSelectedFolder}>
          <SelectTrigger className="w-full sm:w-48">
            <FolderOpen className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {folders.map((folder) => (
              <SelectItem key={folder.value} value={folder.value}>
                {folder.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 border rounded-lg p-1">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {filteredFiles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {searchQuery ? 'Tidak ada file yang ditemukan' : 'Belum ada file. Upload file pertama Anda!'}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredFiles.map((file) => {
            const FileIcon = getFileIcon(file.file_type);
            return (
              <Card
                key={file.id}
                className="cursor-pointer hover:ring-2 hover:ring-primary transition-all group"
                onClick={() => setSelectedFile(file)}
              >
                <CardContent className="p-2">
                  <div className="aspect-square rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                    {file.file_type.startsWith('image/') ? (
                      <img
                        src={file.file_url}
                        alt={file.alt_text || file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileIcon className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <p className="mt-2 text-xs text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.file_size)}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredFiles.map((file) => {
                const FileIcon = getFileIcon(file.file_type);
                return (
                  <div
                    key={file.id}
                    className="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedFile(file)}
                  >
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {file.file_type.startsWith('image/') ? (
                        <img
                          src={file.file_url}
                          alt={file.alt_text || file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FileIcon className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.file_size)} • {file.folder}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(file.file_url);
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFileToDelete(file);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Detail Dialog */}
      <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail File</DialogTitle>
          </DialogHeader>
          {selectedFile && (
            <div className="space-y-4">
              <div className="aspect-video rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                {selectedFile.file_type.startsWith('image/') ? (
                  <img
                    src={selectedFile.file_url}
                    alt={selectedFile.alt_text || selectedFile.name}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-center">
                    {(() => {
                      const FileIcon = getFileIcon(selectedFile.file_type);
                      return <FileIcon className="h-16 w-16 text-muted-foreground mx-auto mb-2" />;
                    })()}
                    <p className="text-muted-foreground">Preview tidak tersedia</p>
                  </div>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">Nama File</Label>
                  <p className="font-medium break-all">{selectedFile.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Ukuran</Label>
                  <p className="font-medium">{formatFileSize(selectedFile.file_size)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tipe</Label>
                  <p className="font-medium">{selectedFile.file_type}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Folder</Label>
                  <Badge variant="secondary">{selectedFile.folder}</Badge>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">URL</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input value={selectedFile.file_url} readOnly className="text-xs" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(selectedFile.file_url)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => {
                setFileToDelete(selectedFile);
                setSelectedFile(null);
                setDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus File?</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus file "{fileToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
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
