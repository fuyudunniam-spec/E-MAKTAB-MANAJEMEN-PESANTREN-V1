import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, 
  X, 
  FileText, 
  Image as ImageIcon, 
  File, 
  CheckCircle, 
  AlertCircle,
  Download,
  Eye,
  Trash2,
  RefreshCw
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DokumenInfo {
  kode_dokumen: string;
  nama_dokumen: string;
  is_required: boolean;
  description: string;
  kategori: string;
}

interface UploadedFile {
  id?: string;
  file: File;
  kode_dokumen: string;
  nama_dokumen: string;
  progress: number;
  status: 'uploading' | 'success' | 'error' | 'pending';
  error?: string;
  url?: string;
  version?: number;
}

interface UploadDokumenProps {
  santriId: string;
  kategori: string;
  statusSosial: string;
  tanggalLahir: string;
  waliHubungan?: string;
  alamat?: string;
  onUploadComplete?: () => void;
}

const UploadDokumen: React.FC<UploadDokumenProps> = ({
  santriId,
  kategori,
  statusSosial,
  tanggalLahir,
  waliHubungan,
  alamat,
  onUploadComplete
}) => {
  const [requiredDocs, setRequiredDocs] = useState<DokumenInfo[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [existingDocs, setExistingDocs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ACCEPTED_TYPES = {
    'application/pdf': ['.pdf'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png']
  };

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  // Load required documents and existing files
  React.useEffect(() => {
    loadRequiredDocuments();
    loadExistingDocuments();
  }, [santriId, kategori, statusSosial, tanggalLahir, waliHubungan, alamat]);

  const loadRequiredDocuments = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_required_documents_v2', {
          santri_kategori_param: kategori,
          status_sosial_param: statusSosial,
          tanggal_lahir_param: tanggalLahir,
          wali_hubungan_param: waliHubungan || null,
          alamat_param: alamat || null
        });

      if (error) throw error;
      setRequiredDocs(data || []);
    } catch (error) {
      console.error('Error loading required documents:', error);
      toast.error('Gagal memuat daftar dokumen yang dibutuhkan');
    }
  };

  const loadExistingDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('dokumen_santri')
        .select('*')
        .eq('santri_id', santriId)
        .eq('is_active', true)
        .order('tanggal_upload', { ascending: false });

      if (error) throw error;
      setExistingDocs(data || []);
    } catch (error) {
      console.error('Error loading existing documents:', error);
      toast.error('Gagal memuat dokumen yang sudah ada');
    } finally {
      setIsLoading(false);
    }
  };

  const validateFile = (file: File): string | null => {
    // Check file type
    const isValidType = Object.keys(ACCEPTED_TYPES).some(type => 
      file.type === type || ACCEPTED_TYPES[type as keyof typeof ACCEPTED_TYPES].some(ext => 
        file.name.toLowerCase().endsWith(ext)
      )
    );

    if (!isValidType) {
      return 'Tipe file tidak didukung. Hanya PDF, JPG, dan PNG yang diperbolehkan.';
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return 'Ukuran file terlalu besar. Maksimal 10MB.';
    }

    return null;
  };

  const uploadFile = async (file: File, kodeDokumen: string, namaDokumen: string) => {
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${kodeDokumen}_${Date.now()}.${fileExt}`;
      const filePath = `documents/santri/${santriId}/${kodeDokumen}/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('santri-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('santri-documents')
        .getPublicUrl(filePath);

      // Save to database
      const { data: dbData, error: dbError } = await supabase
        .from('dokumen_santri')
        .insert({
          santri_id: santriId,
          kode_dokumen: kodeDokumen,
          url: urlData.publicUrl,
          mime: file.type,
          size: file.size,
          original_name: file.name,
          status_validasi: 'Perlu Perbaikan',
          is_active: true,
          version: 1
        })
        .select()
        .single();

      if (dbError) throw dbError;

      return { ...dbData, url: urlData.publicUrl };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach(file => {
      const validationError = validateFile(file);
      if (validationError) {
        toast.error(`${file.name}: ${validationError}`);
        return;
      }

      // Find matching required document
      const matchingDoc = requiredDocs.find(doc => 
        file.name.toLowerCase().includes(doc.kode_dokumen.toLowerCase()) ||
        doc.nama_dokumen.toLowerCase().split(' ').some(word => 
          file.name.toLowerCase().includes(word)
        )
      );

      if (!matchingDoc) {
        toast.error(`Tidak dapat menentukan jenis dokumen untuk ${file.name}`);
        return;
      }

      const uploadFile: UploadedFile = {
        file,
        kode_dokumen: matchingDoc.kode_dokumen,
        nama_dokumen: matchingDoc.nama_dokumen,
        progress: 0,
        status: 'pending'
      };

      setUploadedFiles(prev => [...prev, uploadFile]);

      // Start upload
      uploadFileWithProgress(uploadFile);
    });
  }, [requiredDocs, santriId]);

  const uploadFileWithProgress = async (uploadFile: UploadedFile) => {
    try {
      setUploadedFiles(prev => prev.map(f => 
        f.file === uploadFile.file ? { ...f, status: 'uploading', progress: 0 } : f
      ));

      // Simulate progress (in real app, you'd use actual upload progress)
      const progressInterval = setInterval(() => {
        setUploadedFiles(prev => prev.map(f => 
          f.file === uploadFile.file ? { ...f, progress: Math.min(f.progress + 10, 90) } : f
        ));
      }, 200);

      const result = await uploadFile.file;
      const uploadedDoc = await uploadFile(result, uploadFile.kode_dokumen, uploadFile.nama_dokumen);

      clearInterval(progressInterval);

      setUploadedFiles(prev => prev.map(f => 
        f.file === uploadFile.file ? { 
          ...f, 
          status: 'success', 
          progress: 100, 
          id: uploadedDoc.id,
          url: uploadedDoc.url,
          version: uploadedDoc.version
        } : f
      ));

      toast.success(`Dokumen ${uploadFile.nama_dokumen} berhasil diupload`);
      loadExistingDocuments();
      onUploadComplete?.();

    } catch (error) {
      setUploadedFiles(prev => prev.map(f => 
        f.file === uploadFile.file ? { 
          ...f, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Upload gagal'
        } : f
      ));
      toast.error(`Gagal upload ${uploadFile.nama_dokumen}`);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const removeUploadedFile = (file: UploadedFile) => {
    setUploadedFiles(prev => prev.filter(f => f.file !== file.file));
  };

  const deleteDocument = async (docId: string) => {
    try {
      const { error } = await supabase
        .from('dokumen_santri')
        .update({ is_active: false })
        .eq('id', docId);

      if (error) throw error;

      toast.success('Dokumen berhasil dihapus');
      loadExistingDocuments();
    } catch (error) {
      toast.error('Gagal menghapus dokumen');
      console.error('Delete error:', error);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="w-5 h-5" />;
    } else if (mimeType === 'application/pdf') {
      return <FileText className="w-5 h-5" />;
    }
    return <File className="w-5 h-5" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Valid':
        return <Badge className="bg-green-100 text-green-800">Valid</Badge>;
      case 'Perlu Perbaikan':
        return <Badge className="bg-yellow-100 text-yellow-800">Perlu Perbaikan</Badge>;
      case 'Tidak Valid':
        return <Badge className="bg-red-100 text-red-800">Tidak Valid</Badge>;
      default:
        return <Badge variant="outline">Belum Diverifikasi</Badge>;
    }
  };

  const getKategoriBadge = (kategori: string) => {
    switch (kategori) {
      case 'WAJIB':
        return <Badge className="bg-red-100 text-red-800">Wajib</Badge>;
      case 'KONDISIONAL':
        return <Badge className="bg-blue-100 text-blue-800">Kondisional</Badge>;
      case 'SOSIAL':
        return <Badge className="bg-purple-100 text-purple-800">Sosial</Badge>;
      case 'OPSIONAL':
        return <Badge className="bg-gray-100 text-gray-800">Opsional</Badge>;
      default:
        return <Badge variant="outline">{kategori}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Memuat dokumen...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Required Documents Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Dokumen yang Dibutuhkan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {requiredDocs.map((doc) => {
              const existingDoc = existingDocs.find(ed => ed.kode_dokumen === doc.kode_dokumen);
              const isUploaded = !!existingDoc;
              
              return (
                <div key={doc.kode_dokumen} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isUploaded ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {isUploaded ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{doc.nama_dokumen}</h4>
                        {getKategoriBadge(doc.kategori)}
                        {doc.is_required && (
                          <Badge variant="outline" className="text-red-600 border-red-200">
                            Wajib
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{doc.description}</p>
                      {existingDoc && (
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(existingDoc.status_validasi)}
                          <span className="text-xs text-muted-foreground">
                            v{existingDoc.version} • {new Date(existingDoc.tanggal_upload).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {existingDoc && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(existingDoc.url, '_blank')}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Lihat
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteDocument(existingDoc.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Hapus
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Dokumen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">Upload Dokumen Santri</h3>
            <p className="text-muted-foreground mb-4">
              Drag & drop file ke sini atau klik untuk memilih file
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Format: PDF, JPG, PNG • Maksimal: 10MB per file
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
            >
              <Upload className="w-4 h-4 mr-2" />
              Pilih File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
          </div>

          {/* Upload Progress */}
          {uploadedFiles.length > 0 && (
            <div className="mt-6 space-y-4">
              <h4 className="font-medium">Progress Upload</h4>
              {uploadedFiles.map((file, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getFileIcon(file.file.type)}
                      <span className="font-medium">{file.nama_dokumen}</span>
                      <span className="text-sm text-muted-foreground">
                        ({(file.file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {file.status === 'success' && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      {file.status === 'error' && (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                      {file.status === 'uploading' && (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      )}
                      {file.status !== 'uploading' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeUploadedFile(file)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {file.status === 'uploading' && (
                    <Progress value={file.progress} className="h-2" />
                  )}
                  
                  {file.status === 'error' && (
                    <Alert className="mt-2">
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription>
                        {file.error || 'Upload gagal'}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {file.status === 'success' && (
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-green-100 text-green-800">
                        Upload Berhasil
                      </Badge>
                      {file.url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(file.url, '_blank')}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadDokumen;
