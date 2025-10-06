import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  X,
  Edit,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  Users,
  School,
  Heart,
  Activity,
  FileText,
  GraduationCap,
  Home,
  Briefcase,
  Award,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SantriDetailViewProps {
  santriId: string;
  onClose: () => void;
  onEdit: () => void;
}

export default function SantriDetailView({ santriId, onClose, onEdit }: SantriDetailViewProps) {
  const [santriData, setSantriData] = useState<any>(null);
  const [waliData, setWaliData] = useState<any[]>([]);
  const [programData, setProgramData] = useState<any[]>([]);
  const [dokumenData, setDokumenData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSantriDetail();
  }, [santriId]);

  const loadSantriDetail = async () => {
    try {
      setIsLoading(true);

      // Load santri data
      const { data: santri, error: santriError } = await supabase
        .from('santri')
        .select('*')
        .eq('id', santriId)
        .single();

      if (santriError) throw santriError;
      setSantriData(santri);

      // Load wali data
      const { data: wali, error: waliError } = await supabase
        .from('santri_wali')
        .select('*')
        .eq('santri_id', santriId);

      if (!waliError) setWaliData(wali || []);

      // Load program data
      const { data: program, error: programError } = await supabase
        .from('santri_programs')
        .select('*')
        .eq('santri_id', santriId);

      if (!programError) setProgramData(program || []);

      // Load dokumen data
      const { data: dokumen, error: dokumenError } = await supabase
        .from('dokumen_santri')
        .select('*')
        .eq('santri_id', santriId)
        .eq('is_active', true);

      if (!dokumenError) setDokumenData(dokumen || []);

    } catch (error) {
      console.error('Error loading santri detail:', error);
      toast.error('Gagal memuat detail santri');
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'aktif': return 'bg-green-500';
      case 'non-aktif': return 'bg-red-500';
      case 'alumni': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getDokumenStatusIcon = (status: string) => {
    switch (status) {
      case 'Valid': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Perlu Perbaikan': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'Ditolak': return <X className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!santriData) {
    return null;
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header with Avatar and Quick Info */}
        <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8 border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4"
          >
            <X className="w-5 h-5" />
          </Button>

          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {/* Avatar */}
            <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
              <AvatarImage src={santriData.foto_profil} />
              <AvatarFallback className="text-3xl font-bold bg-primary/20">
                {getInitials(santriData.nama_lengkap)}
              </AvatarFallback>
            </Avatar>

            {/* Quick Info */}
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-3xl font-bold">{santriData.nama_lengkap}</h2>
                  <p className="text-muted-foreground">
                    {santriData.nama_panggilan && `"${santriData.nama_panggilan}" • `}
                    {santriData.kategori}
                  </p>
                </div>
                <Button onClick={onEdit} size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {new Date(santriData.tanggal_lahir).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })} ({calculateAge(santriData.tanggal_lahir)} tahun)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{santriData.no_whatsapp || '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge className={getStatusColor(santriData.status_baru)}>
                    {santriData.status_baru || 'Aktif'}
                  </Badge>
                  <Badge variant="outline">NIS: {santriData.nis}</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-8 py-4 border-b bg-muted/30">
          <Card className="border-0 shadow-none bg-background/50">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-primary">{dokumenData.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Total Dokumen</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-none bg-background/50">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-500">
                {dokumenData.filter(d => d.status_validasi === 'Valid').length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Dokumen Valid</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-none bg-background/50">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-blue-500">{programData.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Program Aktif</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-none bg-background/50">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-purple-500">{waliData.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Data Wali</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Content */}
        <div className="px-8 pb-8">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="personal">
                <User className="w-4 h-4 mr-2" />
                Pribadi
              </TabsTrigger>
              <TabsTrigger value="wali">
                <Users className="w-4 h-4 mr-2" />
                Wali
              </TabsTrigger>
              <TabsTrigger value="program">
                <GraduationCap className="w-4 h-4 mr-2" />
                Program
              </TabsTrigger>
              <TabsTrigger value="health">
                <Heart className="w-4 h-4 mr-2" />
                Kesehatan
              </TabsTrigger>
              <TabsTrigger value="documents">
                <FileText className="w-4 h-4 mr-2" />
                Dokumen
              </TabsTrigger>
            </TabsList>

            {/* Personal Information */}
            <TabsContent value="personal" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Informasi Pribadi
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <InfoItem label="Nama Lengkap" value={santriData.nama_lengkap} />
                  <InfoItem label="Nama Panggilan" value={santriData.nama_panggilan} />
                  <InfoItem label="NIK" value={santriData.nik} />
                  <InfoItem label="Nomor KK" value={santriData.nomor_kk} />
                  <InfoItem label="Tempat Lahir" value={santriData.tempat_lahir} />
                  <InfoItem label="Tanggal Lahir" value={santriData.tanggal_lahir} />
                  <InfoItem label="Jenis Kelamin" value={santriData.jenis_kelamin} />
                  <InfoItem label="Agama" value={santriData.agama} />
                  <InfoItem label="Kewarganegaraan" value={santriData.kewarganegaraan} />
                  <InfoItem label="Golongan Darah" value={santriData.golongan_darah} />
                  <InfoItem label="Status Anak" value={santriData.status_anak} />
                  <InfoItem label="Anak Ke" value={santriData.anak_ke} />
                  <InfoItem label="Jumlah Saudara" value={santriData.jumlah_saudara} />
                  <InfoItem label="Hobi" value={santriData.hobi} />
                  <InfoItem label="Cita-cita" value={santriData.cita_cita} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Alamat
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoItem label="Alamat Lengkap" value={santriData.alamat} className="md:col-span-2" />
                  <InfoItem label="Dusun" value={santriData.dusun} />
                  <InfoItem label="Desa/Kelurahan" value={santriData.desa_kelurahan} />
                  <InfoItem label="Kecamatan" value={santriData.kecamatan} />
                  <InfoItem label="Kabupaten/Kota" value={santriData.kabupaten_kota} />
                  <InfoItem label="Provinsi" value={santriData.provinsi} />
                </CardContent>
              </Card>

              {santriData.kategori === 'Binaan Mukim' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <School className="w-5 h-5" />
                      Sekolah Formal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoItem label="Nama Sekolah" value={santriData.nama_sekolah_formal} />
                    <InfoItem label="Kelas" value={santriData.kelas_sekolah_formal} />
                    <InfoItem label="Wali Kelas" value={santriData.nama_wali_kelas} />
                    <InfoItem label="No. Telepon Wali Kelas" value={santriData.no_telepon_wali_kelas} />
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Guardian Information */}
            <TabsContent value="wali" className="space-y-4 mt-6">
              {waliData.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Belum ada data wali</p>
                  </CardContent>
                </Card>
              ) : (
                waliData.map((wali, index) => (
                  <Card key={wali.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          {wali.nama_lengkap}
                        </span>
                        {wali.is_utama && (
                          <Badge variant="default">Wali Utama</Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <InfoItem label="Hubungan" value={wali.hubungan_keluarga} />
                      <InfoItem label="NIK" value={wali.nik} />
                      <InfoItem label="No. Telepon" value={wali.no_telepon} />
                      <InfoItem label="Email" value={wali.email} />
                      <InfoItem label="Pekerjaan" value={wali.pekerjaan} />
                      <InfoItem label="Pendidikan" value={wali.pendidikan} />
                      <InfoItem label="Penghasilan" value={wali.penghasilan_bulanan} />
                      <InfoItem label="Alamat" value={wali.alamat} className="md:col-span-3" />
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Program Information */}
            <TabsContent value="program" className="space-y-4 mt-6">
              {programData.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Belum ada program terdaftar</p>
                  </CardContent>
                </Card>
              ) : (
                programData.map((program) => (
                  <Card key={program.id}>
                    <CardContent className="py-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-3">
                            <GraduationCap className="w-6 h-6 text-primary" />
                            <div>
                              <h3 className="font-semibold text-lg">{program.nama_program}</h3>
                              <p className="text-sm text-muted-foreground">
                                Kelas: {program.kelas} • Rombel: {program.rombel}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span>
                                {program.tgl_mulai ? new Date(program.tgl_mulai).toLocaleDateString('id-ID') : '-'} 
                                {program.tgl_selesai && ` - ${new Date(program.tgl_selesai).toLocaleDateString('id-ID')}`}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge variant={program.aktif ? "default" : "secondary"}>
                          {program.aktif ? "Aktif" : "Tidak Aktif"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Health Information */}
            <TabsContent value="health" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    Informasi Kesehatan
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoItem label="Riwayat Penyakit" value={santriData.riwayat_penyakit} className="md:col-span-2" />
                  <InfoItem 
                    label="Pernah Rawat Inap" 
                    value={santriData.pernah_rawat_inap ? 'Ya' : 'Tidak'} 
                  />
                  <InfoItem label="Keterangan Rawat Inap" value={santriData.keterangan_rawat_inap} />
                  <InfoItem label="Disabilitas Khusus" value={santriData.disabilitas_khusus} />
                  <InfoItem label="Obat Khusus" value={santriData.obat_khusus} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents */}
            <TabsContent value="documents" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dokumenData.length === 0 ? (
                  <Card className="md:col-span-3">
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Belum ada dokumen terupload</p>
                    </CardContent>
                  </Card>
                ) : (
                  dokumenData.map((dok) => (
                    <Card key={dok.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <CardContent className="p-0">
                        {/* Document Preview */}
                        <div className="aspect-[4/3] bg-muted flex items-center justify-center relative group">
                          {dok.mime?.startsWith('image/') ? (
                            <img 
                              src={dok.url} 
                              alt={dok.kode_dokumen}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FileText className="w-16 h-16 text-muted-foreground" />
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => window.open(dok.url, '_blank')}
                            >
                              Lihat
                            </Button>
                          </div>
                        </div>
                        
                        {/* Document Info */}
                        <div className="p-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-sm line-clamp-1">{dok.kode_dokumen}</h4>
                            {getDokumenStatusIcon(dok.status_validasi)}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {dok.original_name || 'Dokumen'}
                          </p>
                          <div className="flex items-center justify-between text-xs">
                            <Badge variant="outline" className="text-xs">
                              {dok.status_validasi}
                            </Badge>
                            <span className="text-muted-foreground">
                              {new Date(dok.tanggal_upload).toLocaleDateString('id-ID')}
                            </span>
                          </div>
                          {dok.catatan && (
                            <p className="text-xs text-muted-foreground italic mt-2">
                              "{dok.catatan}"
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface InfoItemProps {
  label: string;
  value: any;
  className?: string;
}

function InfoItem({ label, value, className = "" }: InfoItemProps) {
  return (
    <div className={className}>
      <dt className="text-sm font-medium text-muted-foreground mb-1">{label}</dt>
      <dd className="text-sm font-medium">{value || '-'}</dd>
    </div>
  );
}
