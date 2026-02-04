import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AkademikPengajarService } from '@/modules/akademik/services/akademikPengajar.service';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { User, Camera, Save, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface PengajarData {
  id: string;
  nama_lengkap: string;
  kode_pengajar?: string | null;
  kontak?: string | null;
  catatan?: string | null;
  foto_profil?: string | null;
  program_spesialisasi?: string[] | null;
}

const ProfilPengajarPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [pengajarId, setPengajarId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PengajarData>({
    id: '',
    nama_lengkap: '',
    kode_pengajar: '',
    kontak: '',
    catatan: '',
    foto_profil: '',
    program_spesialisasi: [],
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    loadPengajarData();
  }, [user]);

  const loadPengajarData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const id = await AkademikPengajarService.getPengajarIdByUserId(user.id);
      
      if (!id) {
        toast.error('Data pengajar tidak ditemukan. Silakan hubungi administrator.');
        setLoading(false);
        return;
      }

      setPengajarId(id);

      const { data, error } = await supabase
        .from('akademik_pengajar')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          id: data.id,
          nama_lengkap: data.nama_lengkap || '',
          kode_pengajar: data.kode_pengajar || '',
          kontak: data.kontak || '',
          catatan: data.catatan || '',
          foto_profil: data.foto_profil || '',
          program_spesialisasi: data.program_spesialisasi || [],
        });

        if (data.foto_profil) {
          // Jika foto_profil adalah URL lengkap, gunakan langsung
          if (data.foto_profil.startsWith('http')) {
            setPhotoPreview(data.foto_profil);
          } else {
            // Jika path relatif, dapatkan URL dari storage
            // Path bisa berupa: "pengajarId/filename.ext" atau "pengajar-photos/pengajarId/filename.ext"
            const photoPath = data.foto_profil.startsWith('pengajar-photos/')
              ? data.foto_profil.replace('pengajar-photos/', '')
              : data.foto_profil;
            
            const { data: { publicUrl } } = supabase.storage
              .from('pengajar-photos')
              .getPublicUrl(photoPath);
            setPhotoPreview(publicUrl);
          }
        }
      }
    } catch (error: any) {
      console.error('Error loading pengajar data:', error);
      toast.error('Gagal memuat data profil: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pengajarId) return;

    // Validasi file
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File terlalu besar. Maksimal 5MB.');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipe file tidak didukung. Gunakan JPG atau PNG.');
      return;
    }

    try {
      setUploadingPhoto(true);

      // Preview foto
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload ke storage
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${timestamp}.${fileExt}`;
      const filePath = `${pengajarId}/${fileName}`;

      // Hapus foto lama jika ada
      if (formData.foto_profil && !formData.foto_profil.startsWith('http')) {
        try {
          // Jika path sudah include pengajarId, gunakan langsung
          // Jika tidak, tambahkan pengajarId
          const oldPath = formData.foto_profil.includes('/') 
            ? formData.foto_profil 
            : `${pengajarId}/${formData.foto_profil}`;
          await supabase.storage
            .from('pengajar-photos')
            .remove([oldPath]);
        } catch (err) {
          console.warn('Gagal menghapus foto lama:', err);
        }
      }

      // Upload foto baru
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pengajar-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        // Jika bucket tidak ada, beri pesan yang jelas
        if (uploadError.message.includes('Bucket') || uploadError.message.includes('not found')) {
          throw new Error('Bucket storage "pengajar-photos" belum dibuat. Silakan hubungi administrator untuk membuat bucket ini di Supabase Storage.');
        }
        throw uploadError;
      }

      // Dapatkan URL publik
      const { data: { publicUrl } } = supabase.storage
        .from('pengajar-photos')
        .getPublicUrl(filePath);

      // Update formData dengan path file (relative path tanpa bucket name)
      setFormData(prev => ({
        ...prev,
        foto_profil: filePath,
      }));

      // Update langsung ke database
      const { error: updateError } = await supabase
        .from('akademik_pengajar')
        .update({ foto_profil: filePath })
        .eq('id', pengajarId);

      if (updateError) throw updateError;

      toast.success('Foto profil berhasil diupload');
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast.error('Gagal mengupload foto: ' + error.message);
      setPhotoPreview(null);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!pengajarId) return;

    if (!formData.nama_lengkap.trim()) {
      toast.error('Nama lengkap wajib diisi');
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('akademik_pengajar')
        .update({
          nama_lengkap: formData.nama_lengkap.trim(),
          kode_pengajar: formData.kode_pengajar?.trim() || null,
          kontak: formData.kontak?.trim() || null,
          catatan: formData.catatan?.trim() || null,
        })
        .eq('id', pengajarId);

      if (error) throw error;

      toast.success('Profil berhasil diperbarui');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error('Gagal menyimpan profil: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!pengajarId) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Data pengajar tidak ditemukan.</p>
            <p className="text-sm mt-2">Silakan hubungi administrator untuk mengaktifkan akun pengajar Anda.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getInitials = (name: string) => {
    if (!name) return 'P';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profil Pengajar</h1>
        <p className="text-muted-foreground mt-2">
          Kelola informasi profil dan identitas Anda
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Foto Profil */}
        <Card>
          <CardHeader>
            <CardTitle>Foto Profil</CardTitle>
            <CardDescription>Upload foto profil Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-32 w-32">
                <AvatarImage src={photoPreview || undefined} alt={formData.nama_lengkap} />
                <AvatarFallback className="text-2xl">
                  {getInitials(formData.nama_lengkap)}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col items-center space-y-2">
                <Label htmlFor="photo-upload" className="cursor-pointer">
                  <Button
                    variant="outline"
                    type="button"
                    disabled={uploadingPhoto}
                    className="w-full"
                    asChild
                  >
                    <span>
                      <Camera className="h-4 w-4 mr-2" />
                      {uploadingPhoto ? 'Mengupload...' : 'Pilih Foto'}
                    </span>
                  </Button>
                </Label>
                <Input
                  id="photo-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploadingPhoto}
                />
                <p className="text-xs text-muted-foreground text-center">
                  Format: JPG, PNG. Maksimal 5MB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informasi Dasar */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Dasar</CardTitle>
            <CardDescription>Data identitas pengajar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nama_lengkap">
                Nama Lengkap <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nama_lengkap"
                value={formData.nama_lengkap}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, nama_lengkap: e.target.value }))
                }
                placeholder="Masukkan nama lengkap"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kode_pengajar">Kode Pengajar</Label>
              <Input
                id="kode_pengajar"
                value={formData.kode_pengajar || ''}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, kode_pengajar: e.target.value }))
                }
                placeholder="Contoh: UST001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kontak">Kontak</Label>
              <Input
                id="kontak"
                value={formData.kontak || ''}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, kontak: e.target.value }))
                }
                placeholder="No. WhatsApp atau Email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="catatan">Catatan</Label>
              <Textarea
                id="catatan"
                value={formData.catatan || ''}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, catatan: e.target.value }))
                }
                placeholder="Informasi tambahan (opsional)"
                rows={4}
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || !formData.nama_lengkap.trim()}
              className="w-full"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Perubahan
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilPengajarPage;

