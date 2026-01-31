import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, Loader2, ImageIcon, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  bucket: string;
  folder?: string;
  accept?: string;
}

export function ImageUpload({ value, onChange, bucket, folder = '', accept = 'image/*' }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const isPdfMode = accept === 'application/pdf';
  const maxSize = isPdfMode ? 20 * 1024 * 1024 : 5 * 1024 * 1024; // 20MB for PDF, 5MB for images
  const maxSizeLabel = isPdfMode ? '20MB' : '5MB';

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (isPdfMode) {
      if (file.type !== 'application/pdf') {
        toast({
          title: 'Error',
          description: 'Hanya file PDF yang diperbolehkan',
          variant: 'destructive',
        });
        return;
      }
    } else {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Error',
          description: 'Hanya file gambar yang diperbolehkan',
          variant: 'destructive',
        });
        return;
      }
    }

    if (file.size > maxSize) {
      toast({
        title: 'Error',
        description: `Ukuran file maksimal ${maxSizeLabel}`,
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onChange(publicUrl);
      toast({
        title: 'Berhasil',
        description: isPdfMode ? 'PDF berhasil diupload' : 'Gambar berhasil diupload',
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Error',
        description: error.message || (isPdfMode ? 'Gagal mengupload PDF' : 'Gagal mengupload gambar'),
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onChange('');
  };

  return (
    <div className="space-y-3">
      <Input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      {value ? (
        <div className="relative inline-block">
          {isPdfMode ? (
            <div className="h-32 w-32 rounded-lg border border-border bg-muted flex flex-col items-center justify-center">
              <FileText className="h-10 w-10 text-primary" />
              <span className="mt-2 text-xs text-muted-foreground">PDF</span>
            </div>
          ) : (
            <img
              src={value}
              alt="Preview"
              className="h-32 w-32 rounded-lg object-cover border border-border"
            />
          )}
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 transition-colors hover:border-primary/50 hover:bg-muted"
        >
          {isUploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <>
              {isPdfMode ? (
                <FileText className="h-8 w-8 text-muted-foreground" />
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              )}
              <span className="mt-2 text-xs text-muted-foreground">Klik untuk upload</span>
            </>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          {value ? (isPdfMode ? 'Ganti PDF' : 'Ganti Gambar') : (isPdfMode ? 'Upload PDF' : 'Upload Gambar')}
        </Button>
      </div>
    </div>
  );
}
