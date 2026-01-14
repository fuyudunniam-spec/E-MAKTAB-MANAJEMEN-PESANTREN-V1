import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Save, Upload, X, Home, BarChart, Type, MousePointer, Info, BookOpen, MessageSquare, Layout } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface HomepageSettings {
  [key: string]: string;
}

export default function AdminHomepage() {
  const [settings, setSettings] = useState<HomepageSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value');

      if (error) throw error;

      const settingsMap: HomepageSettings = {};
      data?.forEach((item) => {
        settingsMap[item.key] = item.value || '';
      });
      setSettings(settingsMap);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Gagal memuat pengaturan');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = async (file: File, key: string) => {
    setUploadingImage(key);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${key}-${Date.now()}.${fileExt}`;
      const filePath = `homepage/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media-library')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('media-library')
        .getPublicUrl(filePath);

      handleChange(key, urlData.publicUrl);
      toast.success('Gambar berhasil diupload');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Gagal mengupload gambar');
    } finally {
      setUploadingImage(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Get all relevant keys
      const relevantPrefixes = ['hero_', 'about_', 'programs_', 'testimonials_', 'header_'];
      const relevantKeys = Object.keys(settings).filter(key =>
        relevantPrefixes.some(prefix => key.startsWith(prefix))
      );

      const upsertData = relevantKeys.map(key => ({
        key,
        value: settings[key],
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('site_settings')
        .upsert(upsertData, { onConflict: 'key' });

      if (error) throw error;

      toast.success('Pengaturan homepage berhasil disimpan');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  const ImageUploadField = ({ label, settingKey, description }: { label: string; settingKey: string; description?: string }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <div className="flex gap-2">
        <Input
          value={settings[settingKey] || ''}
          onChange={(e) => handleChange(settingKey, e.target.value)}
          placeholder="URL gambar atau upload file"
          className="flex-1"
        />
        <input
          type="file"
          id={`upload-${settingKey}`}
          className="hidden"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file, settingKey);
            e.target.value = '';
          }}
        />
        <Button variant="outline" size="icon" disabled={uploadingImage === settingKey} asChild>
          <label htmlFor={`upload-${settingKey}`} className="cursor-pointer">
            {uploadingImage === settingKey ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          </label>
        </Button>
        {settings[settingKey] && (
          <Button variant="ghost" size="icon" onClick={() => handleChange(settingKey, '')}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {settings[settingKey] && (
        <div className="mt-2 p-4 border rounded-lg bg-muted/50">
          <img
            src={settings[settingKey]}
            alt={label}
            className="max-h-32 object-contain mx-auto rounded"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
    </div>
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Edit Homepage</h2>
          <p className="text-muted-foreground">Kelola konten halaman utama website (opsional - akan menggunakan default jika kosong)</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Simpan Perubahan
        </Button>
      </div>

      <Tabs defaultValue="header" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="header">Header</TabsTrigger>
          <TabsTrigger value="hero">Hero Section</TabsTrigger>
          <TabsTrigger value="cta">Tombol CTA</TabsTrigger>
          <TabsTrigger value="stats">Statistik</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
        </TabsList>

        {/* Header Section */}
        <TabsContent value="header">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5" />
                Header / Navbar
              </CardTitle>
              <CardDescription>Pengaturan logo dan nama website di header</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ImageUploadField
                label="Logo Website"
                settingKey="header_logo_url"
                description="Logo akan ditampilkan di navbar. Ukuran disarankan: 40x40 piksel (PNG/SVG)"
              />
              <div className="space-y-2">
                <Label htmlFor="header_site_name">Nama Website (Desktop)</Label>
                <Input
                  id="header_site_name"
                  value={settings.header_site_name || ''}
                  onChange={(e) => handleChange('header_site_name', e.target.value)}
                  placeholder="Pesantren Mahasiswa An-Nur"
                />
                <p className="text-xs text-muted-foreground">Nama lengkap yang ditampilkan di desktop</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="header_site_name_short">Nama Website (Mobile)</Label>
                <Input
                  id="header_site_name_short"
                  value={settings.header_site_name_short || ''}
                  onChange={(e) => handleChange('header_site_name_short', e.target.value)}
                  placeholder="An-Nur"
                />
                <p className="text-xs text-muted-foreground">Nama singkat untuk layar kecil</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hero Section */}
        <TabsContent value="hero">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Hero Section
              </CardTitle>
              <CardDescription>Bagian utama yang pertama dilihat pengunjung</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="hero_badge_text">Badge Text</Label>
                <Input
                  id="hero_badge_text"
                  value={settings.hero_badge_text || ''}
                  onChange={(e) => handleChange('hero_badge_text', e.target.value)}
                  placeholder="Pendaftaran Santri Baru Dibuka"
                />
              </div>

              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <Label className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Judul Utama
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hero_title_1" className="text-sm text-muted-foreground">Baris 1</Label>
                    <Input
                      id="hero_title_1"
                      value={settings.hero_title_1 || ''}
                      onChange={(e) => handleChange('hero_title_1', e.target.value)}
                      placeholder="Membangun Generasi"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hero_title_highlight_1" className="text-sm text-muted-foreground">Highlight 1</Label>
                    <Input
                      id="hero_title_highlight_1"
                      value={settings.hero_title_highlight_1 || ''}
                      onChange={(e) => handleChange('hero_title_highlight_1', e.target.value)}
                      placeholder="Qurani"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hero_title_2" className="text-sm text-muted-foreground">Highlight 2</Label>
                    <Input
                      id="hero_title_2"
                      value={settings.hero_title_2 || ''}
                      onChange={(e) => handleChange('hero_title_2', e.target.value)}
                      placeholder="Cendekia"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hero_title_3" className="text-sm text-muted-foreground">Highlight 3</Label>
                    <Input
                      id="hero_title_3"
                      value={settings.hero_title_3 || ''}
                      onChange={(e) => handleChange('hero_title_3', e.target.value)}
                      placeholder="Berakhlak Mulia"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hero_subtitle">Subtitle</Label>
                <Textarea
                  id="hero_subtitle"
                  value={settings.hero_subtitle || ''}
                  onChange={(e) => handleChange('hero_subtitle', e.target.value)}
                  placeholder="Deskripsi singkat tentang pesantren..."
                  rows={3}
                />
              </div>

              <ImageUploadField
                label="Background Image"
                settingKey="hero_background_image"
                description="Ukuran yang disarankan: 1920x1080 piksel"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* CTA Section */}
        <TabsContent value="cta">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MousePointer className="h-5 w-5" />
                Tombol CTA
              </CardTitle>
              <CardDescription>Tombol aksi di hero section</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 p-4 border rounded-lg">
                  <Label className="font-semibold">Tombol Utama</Label>
                  <div className="space-y-2">
                    <Label htmlFor="hero_cta_primary_text" className="text-sm text-muted-foreground">Teks</Label>
                    <Input
                      id="hero_cta_primary_text"
                      value={settings.hero_cta_primary_text || ''}
                      onChange={(e) => handleChange('hero_cta_primary_text', e.target.value)}
                      placeholder="Daftar Santri Baru"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hero_cta_primary_link" className="text-sm text-muted-foreground">Link</Label>
                    <Input
                      id="hero_cta_primary_link"
                      value={settings.hero_cta_primary_link || ''}
                      onChange={(e) => handleChange('hero_cta_primary_link', e.target.value)}
                      placeholder="/#kontak"
                    />
                  </div>
                </div>
                <div className="space-y-4 p-4 border rounded-lg">
                  <Label className="font-semibold">Tombol Sekunder</Label>
                  <div className="space-y-2">
                    <Label htmlFor="hero_cta_secondary_text" className="text-sm text-muted-foreground">Teks</Label>
                    <Input
                      id="hero_cta_secondary_text"
                      value={settings.hero_cta_secondary_text || ''}
                      onChange={(e) => handleChange('hero_cta_secondary_text', e.target.value)}
                      placeholder="Pelajari Lebih Lanjut"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stats Section */}
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Statistik
              </CardTitle>
              <CardDescription>Angka-angka di hero section</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((num) => (
                  <div key={num} className="space-y-4 p-4 border rounded-lg">
                    <Label className="font-semibold">Statistik {num} {num === 2 && "(Highlight)"}</Label>
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Angka</Label>
                      <Input
                        value={settings[`hero_stat_${num}_number`] || ''}
                        onChange={(e) => handleChange(`hero_stat_${num}_number`, e.target.value)}
                        placeholder={num === 1 ? "500+" : num === 2 ? "50+" : "10+"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Label</Label>
                      <Input
                        value={settings[`hero_stat_${num}_label`] || ''}
                        onChange={(e) => handleChange(`hero_stat_${num}_label`, e.target.value)}
                        placeholder={num === 1 ? "Alumni" : num === 2 ? "Santri Aktif" : "Tahun Berdiri"}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* About Section */}
        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Section About
              </CardTitle>
              <CardDescription>Konten bagian "Tentang Kami"</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Label Section</Label>
                  <Input
                    value={settings.about_section_label || ''}
                    onChange={(e) => handleChange('about_section_label', e.target.value)}
                    placeholder="Tentang Kami"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Judul Section</Label>
                  <Input
                    value={settings.about_section_title || ''}
                    onChange={(e) => handleChange('about_section_title', e.target.value)}
                    placeholder="Tentang Pesantren Mahasiswa An-Nur"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Textarea
                  value={settings.about_description_1 || ''}
                  onChange={(e) => handleChange('about_description_1', e.target.value)}
                  placeholder="Deskripsi tentang pesantren..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Visi</Label>
                <Textarea
                  value={settings.about_vision || ''}
                  onChange={(e) => handleChange('about_vision', e.target.value)}
                  placeholder="Visi pesantren..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Misi</Label>
                <Textarea
                  value={settings.about_mission || ''}
                  onChange={(e) => handleChange('about_mission', e.target.value)}
                  placeholder="Misi pesantren..."
                  rows={2}
                />
              </div>
              <ImageUploadField
                label="Gambar About"
                settingKey="about_image_url"
                description="Gambar yang ditampilkan di bagian About"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Angka Pengalaman</Label>
                  <Input
                    value={settings.about_experience_number || ''}
                    onChange={(e) => handleChange('about_experience_number', e.target.value)}
                    placeholder="10+"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Label Pengalaman</Label>
                  <Input
                    value={settings.about_experience_label || ''}
                    onChange={(e) => handleChange('about_experience_label', e.target.value)}
                    placeholder="Tahun Pengalaman"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Programs Section */}
        <TabsContent value="programs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Section Programs
              </CardTitle>
              <CardDescription>Judul dan deskripsi bagian Program (Konten program dikelola terpisah)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Label Section</Label>
                <Input
                  value={settings.programs_section_label || ''}
                  onChange={(e) => handleChange('programs_section_label', e.target.value)}
                  placeholder="Program Kami"
                />
              </div>
              <div className="space-y-2">
                <Label>Judul Section</Label>
                <Input
                  value={settings.programs_section_title || ''}
                  onChange={(e) => handleChange('programs_section_title', e.target.value)}
                  placeholder="Program Unggulan"
                />
              </div>
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Textarea
                  value={settings.programs_section_subtitle || ''}
                  onChange={(e) => handleChange('programs_section_subtitle', e.target.value)}
                  placeholder="Deskripsi singkat tentang program..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Testimonials Section */}
        <TabsContent value="testimonials">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Section Testimonials
              </CardTitle>
              <CardDescription>Judul dan deskripsi bagian Testimoni (Konten testimoni menggunakan data statis)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Label Section</Label>
                <Input
                  value={settings.testimonials_section_label || ''}
                  onChange={(e) => handleChange('testimonials_section_label', e.target.value)}
                  placeholder="Testimoni"
                />
              </div>
              <div className="space-y-2">
                <Label>Judul Section</Label>
                <Input
                  value={settings.testimonials_section_title || ''}
                  onChange={(e) => handleChange('testimonials_section_title', e.target.value)}
                  placeholder="Apa Kata Alumni & Santri"
                />
              </div>
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Textarea
                  value={settings.testimonials_section_subtitle || ''}
                  onChange={(e) => handleChange('testimonials_section_subtitle', e.target.value)}
                  placeholder="Deskripsi singkat..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
