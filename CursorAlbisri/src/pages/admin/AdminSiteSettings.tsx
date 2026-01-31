import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Loader2, Save, Globe, Phone, Mail, MapPin, Instagram, Facebook, Youtube, Twitter,
  Image as ImageIcon, Upload, X, Search, BarChart3
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SiteSettings {
  [key: string]: string;
}

export default function AdminSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingOgImage, setUploadingOgImage] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value');

      if (error) throw error;

      const settingsMap: SiteSettings = {};
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

  const handleImageUpload = async (
    file: File,
    key: string,
    setUploading: (val: boolean) => void
  ) => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${key}-${Date.now()}.${fileExt}`;
      const filePath = `branding/${fileName}`;

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
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const upsertData = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('site_settings')
        .upsert(upsertData, { onConflict: 'key' });

      if (error) throw error;

      toast.success('Pengaturan berhasil disimpan');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  const ImageUploadField = ({
    label,
    settingKey,
    uploading,
    setUploading,
    description
  }: {
    label: string;
    settingKey: string;
    uploading: boolean;
    setUploading: (val: boolean) => void;
    description?: string;
  }) => (
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
            if (file) handleImageUpload(file, settingKey, setUploading);
            e.target.value = '';
          }}
        />
        <Button
          variant="outline"
          size="icon"
          disabled={uploading}
          asChild
        >
          <label htmlFor={`upload-${settingKey}`} className="cursor-pointer">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          </label>
        </Button>
        {settings[settingKey] && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleChange(settingKey, '')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {settings[settingKey] && (
        <div className="mt-2 p-4 border rounded-lg bg-muted/50 flex items-center justify-center">
          <img
            src={settings[settingKey]}
            alt={label}
            className="max-h-24 object-contain"
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
          <h2 className="text-2xl font-bold text-foreground">Pengaturan Website</h2>
          <p className="text-muted-foreground">Kelola informasi umum website</p>
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

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="general">Umum</TabsTrigger>
          <TabsTrigger value="contact">Kontak</TabsTrigger>
          <TabsTrigger value="social">Media Sosial</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Informasi Umum
              </CardTitle>
              <CardDescription>Pengaturan dasar website</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site_name">Nama Website</Label>
                <Input
                  id="site_name"
                  value={settings.site_name || ''}
                  onChange={(e) => handleChange('site_name', e.target.value)}
                  placeholder="Nama website Anda"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site_name_short">Nama Singkat (Mobile)</Label>
                <Input
                  id="site_name_short"
                  value={settings.site_name_short || ''}
                  onChange={(e) => handleChange('site_name_short', e.target.value)}
                  placeholder="Nama pendek untuk tampilan mobile"
                />
                <p className="text-xs text-muted-foreground">
                  Ditampilkan di navbar pada layar kecil/mobile
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="site_tagline">Tagline</Label>
                <Textarea
                  id="site_tagline"
                  value={settings.site_tagline || ''}
                  onChange={(e) => handleChange('site_tagline', e.target.value)}
                  placeholder="Deskripsi singkat website"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site_url" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  URL Website (Domain)
                </Label>
                <Input
                  id="site_url"
                  value={settings.site_url || ''}
                  onChange={(e) => handleChange('site_url', e.target.value)}
                  placeholder="https://www.example.com"
                />
                <p className="text-xs text-muted-foreground">
                  URL domain utama untuk sitemap.xml dan SEO (tanpa trailing slash)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Informasi Kontak
              </CardTitle>
              <CardDescription>Detail kontak yang ditampilkan di website</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact_email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={settings.contact_email || ''}
                  onChange={(e) => handleChange('contact_email', e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telepon / WhatsApp
                </Label>
                <Input
                  id="contact_phone"
                  value={settings.contact_phone || ''}
                  onChange={(e) => handleChange('contact_phone', e.target.value)}
                  placeholder="+62 xxx-xxxx-xxxx"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Alamat
                </Label>
                <Textarea
                  id="contact_address"
                  value={settings.contact_address || ''}
                  onChange={(e) => handleChange('contact_address', e.target.value)}
                  placeholder="Alamat lengkap"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Instagram className="h-5 w-5" />
                Media Sosial
              </CardTitle>
              <CardDescription>Link akun media sosial</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="social_instagram" className="flex items-center gap-2">
                  <Instagram className="h-4 w-4" />
                  Instagram
                </Label>
                <Input
                  id="social_instagram"
                  value={settings.social_instagram || ''}
                  onChange={(e) => handleChange('social_instagram', e.target.value)}
                  placeholder="https://instagram.com/username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="social_facebook" className="flex items-center gap-2">
                  <Facebook className="h-4 w-4" />
                  Facebook
                </Label>
                <Input
                  id="social_facebook"
                  value={settings.social_facebook || ''}
                  onChange={(e) => handleChange('social_facebook', e.target.value)}
                  placeholder="https://facebook.com/pagename"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="social_youtube" className="flex items-center gap-2">
                  <Youtube className="h-4 w-4" />
                  YouTube
                </Label>
                <Input
                  id="social_youtube"
                  value={settings.social_youtube || ''}
                  onChange={(e) => handleChange('social_youtube', e.target.value)}
                  placeholder="https://youtube.com/@channel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="social_twitter" className="flex items-center gap-2">
                  <Twitter className="h-4 w-4" />
                  Twitter / X
                </Label>
                <Input
                  id="social_twitter"
                  value={settings.social_twitter || ''}
                  onChange={(e) => handleChange('social_twitter', e.target.value)}
                  placeholder="https://twitter.com/username"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Branding
              </CardTitle>
              <CardDescription>Logo dan identitas visual</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ImageUploadField
                label="Logo Website"
                settingKey="logo_url"
                uploading={uploadingLogo}
                setUploading={setUploadingLogo}
                description="Ukuran yang disarankan: 200x60 piksel (PNG/SVG transparan)"
              />
              <ImageUploadField
                label="Favicon"
                settingKey="favicon_url"
                uploading={uploadingFavicon}
                setUploading={setUploadingFavicon}
                description="Ukuran yang disarankan: 32x32 atau 64x64 piksel (ICO/PNG)"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Meta Tags
                </CardTitle>
                <CardDescription>Pengaturan SEO untuk mesin pencari</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="seo_title">Title Tag</Label>
                  <Input
                    id="seo_title"
                    value={settings.seo_title || ''}
                    onChange={(e) => handleChange('seo_title', e.target.value)}
                    placeholder="Judul website untuk mesin pencari"
                    maxLength={60}
                  />
                  <p className="text-xs text-muted-foreground">
                    {(settings.seo_title || '').length}/60 karakter
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seo_description">Meta Description</Label>
                  <Textarea
                    id="seo_description"
                    value={settings.seo_description || ''}
                    onChange={(e) => handleChange('seo_description', e.target.value)}
                    placeholder="Deskripsi website untuk hasil pencarian"
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-xs text-muted-foreground">
                    {(settings.seo_description || '').length}/160 karakter
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seo_keywords">Keywords</Label>
                  <Input
                    id="seo_keywords"
                    value={settings.seo_keywords || ''}
                    onChange={(e) => handleChange('seo_keywords', e.target.value)}
                    placeholder="kata kunci, dipisahkan, koma"
                  />
                </div>
                <ImageUploadField
                  label="OG Image (Social Share)"
                  settingKey="seo_og_image"
                  uploading={uploadingOgImage}
                  setUploading={setUploadingOgImage}
                  description="Gambar yang muncul saat dibagikan di media sosial (1200x630 piksel)"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Analytics & Verification
                </CardTitle>
                <CardDescription>Integrasi dengan layanan pihak ketiga</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="google_analytics_id">Google Analytics ID</Label>
                  <Input
                    id="google_analytics_id"
                    value={settings.google_analytics_id || ''}
                    onChange={(e) => handleChange('google_analytics_id', e.target.value)}
                    placeholder="G-XXXXXXXXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="google_site_verification">Google Site Verification</Label>
                  <Input
                    id="google_site_verification"
                    value={settings.google_site_verification || ''}
                    onChange={(e) => handleChange('google_site_verification', e.target.value)}
                    placeholder="Kode verifikasi Google Search Console"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
