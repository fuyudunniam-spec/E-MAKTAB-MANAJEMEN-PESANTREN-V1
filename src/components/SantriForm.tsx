import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Plus, 
  Trash2, 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Calendar,
  User,
  School,
  FileImage,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Users,
  Save,
  X
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import UploadDokumen from './UploadDokumen';
import UploadDokumenSantri from './UploadDokumenSantri';

// Types untuk kategori santri baru
type SantriKategori = 'Reguler' | 'Binaan Mukim' | 'Binaan Non-Mukim';
type SantriProgram = 'TPQ' | 'Madin';
type SantriStatus = 'Aktif' | 'Non-Aktif' | 'Alumni';
type DokumenStatus = 'Ada' | 'Tidak Ada' | 'Dalam Proses';

interface SantriData {
  id?: string;
  // Administrasi
  kategori: string;
  angkatan: string;
  status_baru: string;
  nis?: string;
  rfid?: string;
  tanggal_masuk: string;
  // Data sekolah formal (untuk Binaan Mukim)
  nama_sekolah_formal?: string;
  kelas_sekolah_formal?: string;
  nama_wali_kelas?: string;
  no_telepon_wali_kelas?: string;
  // Pribadi
  nama_lengkap: string;
  nama_panggilan?: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_kelamin: 'Laki-laki' | 'Perempuan';
  agama?: string;
  kewarganegaraan?: string;
  golongan_darah?: string;
  status_anak?: string;
  anak_ke?: number;
  jumlah_saudara?: number;
  hobi?: string;
  cita_cita?: string;
  nik?: string;
  nomor_kk?: string;
  no_whatsapp: string;
  alamat: string;
  dusun: string;
  desa_kelurahan: string;
  kecamatan: string;
  kabupaten_kota: string;
  provinsi: string;
  ukuran_seragam?: string;
  // Kesehatan
  riwayat_penyakit?: string;
  pernah_rawat_inap?: boolean;
  keterangan_rawat_inap?: string;
  disabilitas_khusus?: string;
  obat_khusus?: string;
  // Legacy fields
  created_at?: string;
  updated_at?: string;
}

interface WaliData {
  id?: string;
  nama_lengkap: string;
  hubungan_keluarga: string;
  nik?: string;
  pekerjaan?: string;
  pendidikan?: string;
  penghasilan_bulanan?: string;
  alamat?: string;
  no_telepon: string;
  is_utama: boolean;
}

interface ProgramData {
  id?: string;
  nama_program: string;
  kelas_program: string;
  rombel?: string;
  jenis?: 'TPQ' | 'Madin';
}

interface DokumenData {
  id?: string;
  jenis_dokumen: string;
  status: DokumenStatus;
  nama_file?: string;
  path_file?: string;
  keterangan?: string;
  tanggal_upload?: string;
}

interface SantriFormProps {
  santriId?: string;
  onClose: () => void;
  onSave: () => void;
}

const SantriForm: React.FC<SantriFormProps> = ({ santriId, onClose, onSave }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('administrasi');
  const [santriData, setSantriData] = useState<SantriData>({
    // Administrasi
    kategori: 'Reguler',
    angkatan: new Date().getFullYear().toString(),
    status_baru: 'Aktif',
    nis: '',
    rfid: '',
    tanggal_masuk: new Date().toISOString().split('T')[0],
    // Pribadi
    nama_lengkap: 'Test Santri',
    nama_panggilan: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    jenis_kelamin: 'Laki-laki',
    agama: 'Islam',
    kewarganegaraan: 'Indonesia',
    golongan_darah: '',
    status_anak: '',
    anak_ke: undefined,
    jumlah_saudara: undefined,
    hobi: '',
    cita_cita: '',
    nik: '',
    nomor_kk: '',
    no_whatsapp: '',
    alamat: '',
    dusun: '',
    desa_kelurahan: '',
    kecamatan: '',
    kabupaten_kota: 'Surabaya',
    provinsi: 'Jawa Timur',
    ukuran_seragam: '',
    // Kesehatan
    riwayat_penyakit: '',
    pernah_rawat_inap: false,
    keterangan_rawat_inap: '',
    disabilitas_khusus: '',
    obat_khusus: ''
  });

  const [waliData, setWaliData] = useState<WaliData[]>([
    {
      nama_lengkap: 'Test Wali Utama',
      hubungan_keluarga: 'Ayah',
      nik: '',
      pekerjaan: '',
      pendidikan: '',
      penghasilan_bulanan: '',
      alamat: '',
      no_telepon: '081234567890',
      is_utama: true
    },
    {
      nama_lengkap: '',
      hubungan_keluarga: 'Ibu',
      nik: '',
      pekerjaan: '',
      pendidikan: '',
      penghasilan_bulanan: '',
      alamat: '',
      no_telepon: '',
      is_utama: false
    }
  ]);

  const [programData, setProgramData] = useState<ProgramData[]>([
    {
      nama_program: 'TPQ',
      kelas_program: '1',
      rombel: '',
      jenis: 'TPQ'
    }
  ]);

  const [dokumenData, setDokumenData] = useState<DokumenData[]>([
    { jenis_dokumen: 'KK', status: 'Tidak Ada' },
    { jenis_dokumen: 'Akta Lahir', status: 'Tidak Ada' },
    { jenis_dokumen: 'Pas Foto', status: 'Tidak Ada' }
  ]);

  const [uploadedFiles, setUploadedFiles] = useState<{[key: string]: File | null}>({});

  // Options untuk form
  const kategoriOptions = [
    { value: 'Reguler', label: 'Reguler', description: 'Santri dengan program SPP' },
    { value: 'Binaan Mukim', label: 'Binaan Mukim', description: 'Santri binaan yang tinggal di pesantren' },
    { value: 'Binaan Non-Mukim', label: 'Binaan Non-Mukim', description: 'Santri binaan yang tidak tinggal di pesantren' }
  ];

  const programOptions = [
    { value: 'TPQ', label: 'TPQ' },
    { value: 'Madin', label: 'Madin' }
  ];

  const kelasOptions = {
    'TPQ': [
      { value: 'TPQ 1', label: 'TPQ 1' },
      { value: 'TPQ 2', label: 'TPQ 2' },
      { value: 'TPQ 3', label: 'TPQ 3' }
    ],
    'Madin': [
      { value: 'I\'dad', label: 'I\'dad' },
      { value: 'Ula', label: 'Ula' },
      { value: 'Wustha', label: 'Wustha' },
      { value: 'Ulya', label: 'Ulya' }
    ]
  };

  const statusSosialOptions = [
    { value: 'Lengkap', label: 'Lengkap' },
    { value: 'Yatim', label: 'Yatim' },
    { value: 'Piatu', label: 'Piatu' },
    { value: 'Yatim Piatu', label: 'Yatim Piatu' }
  ];

  const hubunganKeluargaOptions = [
    'Ayah', 'Ibu', 'Kakek', 'Nenek', 'Paman', 'Bibi', 'Kakak', 'Adik', 'Saudara', 'Lainnya'
  ];

  const dokumenStatusOptions = [
    { value: 'Ada', label: 'Ada' },
    { value: 'Tidak Ada', label: 'Tidak Ada' },
    { value: 'Dalam Proses', label: 'Dalam Proses' }
  ];

  // Fungsi untuk mengelola program data
  const updateProgram = (indexOrJenis: number | string, field: string, value: string) => {
    if (typeof indexOrJenis === 'string') {
      // Untuk Binaan Mukim (TPQ/Madin)
      setProgramData(prev => {
        const updated = [...prev];
        const existingIndex = updated.findIndex(p => p.jenis === indexOrJenis);
        if (existingIndex >= 0) {
          updated[existingIndex] = { ...updated[existingIndex], [field]: value };
        } else {
          updated.push({
            nama_program: indexOrJenis,
            kelas_program: '',
            rombel: '',
            jenis: indexOrJenis as 'TPQ' | 'Madin'
          });
          const newIndex = updated.length - 1;
          updated[newIndex] = { ...updated[newIndex], [field]: value };
        }
        return updated;
      });
    } else {
      // Untuk Reguler & Binaan Non-Mukim
      setProgramData(prev => prev.map((program, idx) => 
        idx === indexOrJenis ? { ...program, [field]: value } : program
      ));
    }
  };

  const addProgram = () => {
    setProgramData(prev => [...prev, {
      nama_program: '',
      kelas_program: '',
      rombel: ''
    }]);
  };

  const removeProgram = (index: number) => {
    setProgramData(prev => prev.filter((_, idx) => idx !== index));
  };

  // Fungsi untuk regenerate NIS
  const regenerateNIS = () => {
    const year = new Date().getFullYear();
    const randomSeq = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const newNIS = `${year}-${randomSeq}`;
    setSantriData({...santriData, nis: newNIS});
  };

  // Fungsi untuk handle file upload
  const handleFileUpload = (jenisDokumen: string, file: File | null) => {
    setUploadedFiles(prev => ({
      ...prev,
      [jenisDokumen]: file
    }));
    
    if (file) {
      // Update status dokumen menjadi "Ada"
      const dokumenIndex = dokumenData.findIndex(d => d.jenis_dokumen === jenisDokumen);
      if (dokumenIndex !== -1) {
        const newDokumenData = [...dokumenData];
        newDokumenData[dokumenIndex].status = 'Ada';
        setDokumenData(newDokumenData);
      }
    }
  };

  useEffect(() => {
    if (santriId) {
      loadSantriData();
    } else {
      // Set dokumen dasar sesuai kategori
      updateDokumenDasar();
    }
  }, [santriId, santriData.kategori, santriData.tanggal_lahir]);

  // Update documents when wali relationship changes
  useEffect(() => {
    if (!santriId && waliData.length > 0) {
      updateDokumenDasar();
    }
  }, [waliData]);

  const loadSantriData = async () => {
    if (!santriId) return;

    try {
      setIsLoading(true);

      // Load santri data
      const { data: santri, error: santriError } = await supabase
        .from('santri')
        .select('*')
        .eq('id', santriId)
        .single();

      if (santriError) throw santriError;

      setSantriData({
        ...santri,
        jenis_kelamin: santri.jenis_kelamin as 'Laki-laki' | 'Perempuan',
        kategori: santri.kategori || 'Reguler',
        status_baru: santri.status_baru || 'Aktif',
        nama_lengkap: santri.nama_lengkap || '',
        tempat_lahir: santri.tempat_lahir || '',
        tanggal_lahir: santri.tanggal_lahir || '',
        no_whatsapp: (santri as any).no_whatsapp || '',
        alamat: santri.alamat || '',
        dusun: (santri as any).dusun || '',
        desa_kelurahan: (santri as any).desa_kelurahan || '',
        kecamatan: (santri as any).kecamatan || '',
        kabupaten_kota: (santri as any).kabupaten_kota || '',
        provinsi: (santri as any).provinsi || '',
        angkatan: santri.angkatan || new Date().getFullYear().toString(),
        tanggal_masuk: (santri as any).tanggal_masuk || new Date().toISOString().split('T')[0]
      });

      // Load wali data
      const { data: wali, error: waliError } = await supabase
        .from('santri_wali')
        .select('*')
        .eq('santri_id', santriId)
        .order('is_utama', { ascending: false });

      if (waliError) throw waliError;

      if (wali && wali.length > 0) {
        setWaliData(wali);
      }

      // Load program data
      const { data: programs, error: programsError } = await supabase
        .from('santri_programs' as any)
        .select('*')
        .eq('santri_id', santriId)
        .eq('aktif', true);

      if (programsError) throw programsError;

      setProgramData(programs?.map((p: any) => ({
        nama_program: p.nama_program,
        kelas_program: p.kelas,
        rombel: p.rombel || ''
      })) || []);

      // Load dokumen data
      const { data: dokumen, error: dokumenError } = await supabase
        .from('santri_dokumen')
        .select('*')
        .eq('santri_id', santriId);

      if (dokumenError) throw dokumenError;

      if (dokumen && dokumen.length > 0) {
        setDokumenData(dokumen);
      } else {
        updateDokumenDasar();
      }

    } catch (error) {
      toast.error('Gagal memuat data santri');
      console.error('Error loading santri data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateDokumenDasar = async () => {
    try {
      // Get wali utama untuk menentukan KTP yang dibutuhkan
      const waliUtama = waliData.find(w => w.is_utama);
      
      // Call function to get required documents (only if tanggal_lahir is not empty)
      let requiredDocs = null;
      if (santriData.tanggal_lahir) {
        const { data, error } = await supabase
        .rpc('get_required_documents' as any, {
          santri_kategori_param: santriData.kategori,
          tanggal_lahir_param: santriData.tanggal_lahir,
          wali_hubungan_param: waliUtama?.hubungan_keluarga || null,
          status_sosial_param: santriData.status_anak || null
        });
        
        if (error) {
          console.error('Error getting required documents:', error);
        } else {
          requiredDocs = data;
        }
      }

      // Fallback to basic documents if no required docs or error
      if (!requiredDocs) {
        setDokumenData([
          { jenis_dokumen: 'KK', status: 'Tidak Ada' as DokumenStatus },
          { jenis_dokumen: 'Akta Lahir', status: 'Tidak Ada' as DokumenStatus },
          { jenis_dokumen: 'Pas Foto', status: 'Tidak Ada' as DokumenStatus }
        ]);
        return;
      }

      // Convert to dokumen data format
      const dokumenDasar = Array.isArray(requiredDocs) ? requiredDocs.map((doc: any) => ({
        jenis_dokumen: doc.jenis_dokumen,
        status: 'Tidak Ada' as DokumenStatus
      })) : [
        { jenis_dokumen: 'KK', status: 'Tidak Ada' as DokumenStatus },
        { jenis_dokumen: 'Akta Lahir', status: 'Tidak Ada' as DokumenStatus },
        { jenis_dokumen: 'Pas Foto', status: 'Tidak Ada' as DokumenStatus }
      ];

      setDokumenData(dokumenDasar);
    } catch (error) {
      console.error('Error updating documents:', error);
      // Fallback to basic documents
      setDokumenData([
        { jenis_dokumen: 'KK', status: 'Tidak Ada' as DokumenStatus },
        { jenis_dokumen: 'Akta Lahir', status: 'Tidak Ada' as DokumenStatus },
        { jenis_dokumen: 'Pas Foto', status: 'Tidak Ada' as DokumenStatus }
      ]);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (isLoading) return; // Prevent multiple submissions
    
    console.log('Form validation check:', {
      nama_lengkap: santriData.nama_lengkap.trim(),
      kategori: santriData.kategori,
      angkatan: santriData.angkatan,
      tanggal_masuk: santriData.tanggal_masuk,
      programData: programData,
      waliData: waliData,
      isFormValid: isFormValid
    });
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      if (santriId) {
        // Update existing santri
        await updateSantri();
      } else {
        // Create new santri
        await createSantri();
      }

      toast.success(santriId ? 'Data santri berhasil diperbarui' : 'Data santri berhasil ditambahkan');
      
      // Delay callback to prevent immediate reload
      setTimeout(() => {
        onSave();
        onClose();
      }, 100);

    } catch (error) {
      toast.error('Gagal menyimpan data santri');
      console.error('Error saving santri:', error);
      console.error('Error details:', {
        santriData,
        programData,
        waliData,
        error
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!santriData.nama_lengkap.trim()) {
      toast.error('Nama lengkap harus diisi');
      return false;
    }

    if (!santriData.kategori) {
      toast.error('Kategori santri harus diisi');
      return false;
    }

    if (!santriData.angkatan) {
      toast.error('Angkatan harus diisi');
      return false;
    }

    if (!santriData.tanggal_masuk) {
      toast.error('Tanggal masuk harus diisi');
      return false;
    }

    // Validasi wali utama
    const waliUtama = waliData.find(w => w.is_utama);
    if (!waliUtama || !waliUtama.nama_lengkap.trim()) {
      toast.error('Data wali utama harus diisi');
      return false;
    }

    // Validasi program data
    if (programData.length === 0 || !programData[0].nama_program || !programData[0].kelas_program) {
      toast.error('Data program harus diisi');
      return false;
    }

    return true;
  };

  // Helper function to clean data for database
  const cleanDataForDB = (data: any) => {
    const cleaned = { ...data };
    Object.keys(cleaned).forEach(key => {
      const value = cleaned[key];
      
      // Handle empty strings and undefined
      if (value === '' || value === undefined) {
        cleaned[key] = null;
      }
      
      // Handle date fields - convert empty strings to null
      if (key.includes('tanggal') && (value === '' || value === null)) {
        cleaned[key] = null;
      }
      
      // Handle boolean fields - ensure they are boolean
      if (key === 'pernah_rawat_inap' && typeof value !== 'boolean') {
        cleaned[key] = value === true || value === 'true';
      }
    });
    return cleaned;
  };

  const createSantri = async () => {
    // Insert santri - only include fields that exist in database
    const santriInsertData = cleanDataForDB({
      // Basic fields
      nis: santriData.nis || `S${Date.now()}`,
      nama_lengkap: santriData.nama_lengkap,
      tempat_lahir: santriData.tempat_lahir || null,
      tanggal_lahir: santriData.tanggal_lahir || null,
      jenis_kelamin: santriData.jenis_kelamin,
      alamat: santriData.alamat,
      tanggal_masuk: santriData.tanggal_masuk || null,
      angkatan: santriData.angkatan,
      status_baru: santriData.status_baru as 'Aktif' | 'Non-Aktif' | 'Alumni',
      kategori: santriData.kategori,
      
      // New fields
      agama: santriData.agama,
      kewarganegaraan: santriData.kewarganegaraan,
      golongan_darah: santriData.golongan_darah,
      status_anak: santriData.status_anak,
      anak_ke: santriData.anak_ke,
      jumlah_saudara: santriData.jumlah_saudara,
      hobi: santriData.hobi,
      cita_cita: santriData.cita_cita,
      nik: santriData.nik,
      nomor_kk: santriData.nomor_kk,
      no_whatsapp: santriData.no_whatsapp,
      dusun: santriData.dusun,
      desa_kelurahan: santriData.desa_kelurahan,
      kecamatan: santriData.kecamatan,
      kabupaten_kota: santriData.kabupaten_kota,
      provinsi: santriData.provinsi,
      ukuran_seragam: santriData.ukuran_seragam,
      riwayat_penyakit: santriData.riwayat_penyakit,
      pernah_rawat_inap: santriData.pernah_rawat_inap,
      keterangan_rawat_inap: santriData.keterangan_rawat_inap,
      disabilitas_khusus: santriData.disabilitas_khusus,
      obat_khusus: santriData.obat_khusus,
      
      // School fields for Binaan Mukim
      nama_sekolah_formal: santriData.nama_sekolah_formal,
      kelas_sekolah_formal: santriData.kelas_sekolah_formal,
      nama_wali_kelas: santriData.nama_wali_kelas,
      no_telepon_wali_kelas: santriData.no_telepon_wali_kelas,
      
      // System fields
      created_by: (await supabase.auth.getUser()).data.user?.id
    });

    const { data: santri, error: santriError } = await supabase
      .from('santri')
      .insert(santriInsertData)
      .select()
      .single();

    if (santriError) throw santriError;

    // Insert program data
    if (programData.length > 0) {
      const programInsertData = programData.map(p => ({
        santri_id: santri.id,
        nama_program: p.nama_program,
        kelas: p.kelas_program,
        rombel: p.rombel || null,
        aktif: true,
        tgl_mulai: new Date().toISOString().split('T')[0]
      }));

      const { error: programError } = await supabase
        .from('santri_programs' as any)
        .insert(programInsertData);

      if (programError) throw programError;
    }

    // Insert wali data
    if (waliData.length > 0) {
      const waliInsertData = waliData
        .filter(w => w.nama_lengkap.trim())
        .map(w => ({
          ...w,
          santri_id: santri.id
        }));

      if (waliInsertData.length > 0) {
        const { error: waliError } = await supabase
          .from('santri_wali')
          .insert(waliInsertData);

        if (waliError) throw waliError;
      }
    }

    // Insert dokumen data - temporarily disabled
    // if (dokumenData.length > 0) {
    //   const dokumenInsertData = dokumenData.map(d => ({
    //     ...d,
    //     santri_id: santri.id,
    //     tanggal_upload: new Date().toISOString()
    //   }));

    //   console.log('Inserting dokumen data:', dokumenInsertData);

    //   const { error: dokumenError } = await supabase
    //     .from('santri_dokumen')
    //     .insert(dokumenInsertData);

    //   if (dokumenError) {
    //     console.error('Dokumen insertion error:', dokumenError);
    //     throw dokumenError;
    //   }
    // }
  };

  const updateSantri = async () => {
    if (!santriId) return;

    // Update santri - only include fields that exist in database
    const santriUpdateData = cleanDataForDB({
      // Basic fields
      nis: santriData.nis,
      nama_lengkap: santriData.nama_lengkap,
      tempat_lahir: santriData.tempat_lahir,
      tanggal_lahir: santriData.tanggal_lahir,
      jenis_kelamin: santriData.jenis_kelamin,
      alamat: santriData.alamat,
      tanggal_masuk: santriData.tanggal_masuk,
      angkatan: santriData.angkatan,
      status_baru: santriData.status_baru as 'Aktif' | 'Non-Aktif' | 'Alumni',
      kategori: santriData.kategori,
      
      // New fields
      agama: santriData.agama,
      kewarganegaraan: santriData.kewarganegaraan,
      golongan_darah: santriData.golongan_darah,
      status_anak: santriData.status_anak,
      anak_ke: santriData.anak_ke,
      jumlah_saudara: santriData.jumlah_saudara,
      hobi: santriData.hobi,
      cita_cita: santriData.cita_cita,
      nik: santriData.nik,
      nomor_kk: santriData.nomor_kk,
      no_whatsapp: santriData.no_whatsapp,
      dusun: santriData.dusun,
      desa_kelurahan: santriData.desa_kelurahan,
      kecamatan: santriData.kecamatan,
      kabupaten_kota: santriData.kabupaten_kota,
      provinsi: santriData.provinsi,
      ukuran_seragam: santriData.ukuran_seragam,
      riwayat_penyakit: santriData.riwayat_penyakit,
      pernah_rawat_inap: santriData.pernah_rawat_inap,
      keterangan_rawat_inap: santriData.keterangan_rawat_inap,
      disabilitas_khusus: santriData.disabilitas_khusus,
      obat_khusus: santriData.obat_khusus,
      
      // School fields for Binaan Mukim
      nama_sekolah_formal: santriData.nama_sekolah_formal,
      kelas_sekolah_formal: santriData.kelas_sekolah_formal,
      nama_wali_kelas: santriData.nama_wali_kelas,
      no_telepon_wali_kelas: santriData.no_telepon_wali_kelas,
      
      // System fields
      updated_at: new Date().toISOString(),
      updated_by: (await supabase.auth.getUser()).data.user?.id
    });

    const { error: santriError } = await supabase
      .from('santri')
      .update(santriUpdateData)
      .eq('id', santriId);

    if (santriError) throw santriError;

    // Update program data
    // Delete existing programs
    await supabase.from('santri_programs' as any).delete().eq('santri_id', santriId);

    // Insert updated programs
    if (programData.length > 0) {
      const programInsertData = programData.map(p => ({
        santri_id: santriId,
        nama_program: p.nama_program,
        kelas: p.kelas_program,
        rombel: p.rombel || null,
        aktif: true,
        tgl_mulai: new Date().toISOString().split('T')[0]
      }));

      const { error: programError } = await supabase
        .from('santri_programs' as any)
        .insert(programInsertData);

      if (programError) throw programError;
    }

    // Update wali data
    // Delete existing wali
    await supabase.from('santri_wali').delete().eq('santri_id', santriId);

    // Insert updated wali
    if (waliData.length > 0) {
      const waliInsertData = waliData
        .filter(w => w.nama_lengkap.trim())
        .map(w => ({
          ...w,
          santri_id: santriId
        }));

      if (waliInsertData.length > 0) {
        const { error: waliError } = await supabase
          .from('santri_wali')
          .insert(waliInsertData);

        if (waliError) throw waliError;
      }
    }

    // Update dokumen data - temporarily disabled
    // Delete existing dokumen
    // await supabase.from('santri_dokumen').delete().eq('santri_id', santriId);

    // Insert updated dokumen
    // if (dokumenData.length > 0) {
    //   const dokumenInsertData = dokumenData.map(d => ({
    //     ...d,
    //     santri_id: santriId,
    //     tanggal_upload: d.tanggal_upload || new Date().toISOString()
    //   }));

    //   const { error: dokumenError } = await supabase
    //     .from('santri_dokumen')
    //     .insert(dokumenInsertData);

    //   if (dokumenError) throw dokumenError;
    // }
  };

  const addWali = () => {
    setWaliData([...waliData, {
      nama_lengkap: '',
      hubungan_keluarga: 'Wali Pendamping',
      nik: '',
      pekerjaan: '',
      pendidikan: '',
      penghasilan_bulanan: '',
      alamat: '',
      no_telepon: '',
      is_utama: false
    }]);
  };

  const removeWali = (index: number) => {
    if (waliData.length > 1) {
      const newWaliData = waliData.filter((_, i) => i !== index);
      setWaliData(newWaliData);
    }
  };

  const setWaliUtama = (index: number) => {
    const newWaliData = waliData.map((w, i) => ({
      ...w,
      is_utama: i === index
    }));
    setWaliData(newWaliData);
  };

  const updateDokumenStatus = (index: number, status: DokumenStatus) => {
    const newDokumenData = [...dokumenData];
    newDokumenData[index].status = status;
    setDokumenData(newDokumenData);
  };

  const getStatusIcon = (status: DokumenStatus) => {
    switch (status) {
      case 'Ada':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Dalam Proses':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: DokumenStatus) => {
    switch (status) {
      case 'Ada':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Dalam Proses':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getDocumentDescription = (jenisDokumen: string): string => {
    const descriptions: { [key: string]: string } = {
      'KK': 'Kartu Keluarga - Dokumen wajib untuk semua kategori',
      'Akta Lahir': 'Akta Kelahiran - Dokumen wajib untuk semua kategori',
      'Pas Foto': 'Pas Foto - Dokumen wajib untuk semua kategori',
      'KTP Santri': 'KTP Santri - Wajib untuk usia ≥17 tahun',
      'KTP Ayah': 'KTP Ayah - Wajib jika wali utama adalah Ayah',
      'KTP Ibu': 'KTP Ibu - Wajib jika wali utama adalah Ibu',
      'KTP Kakek': 'KTP Kakek - Wajib jika wali utama adalah Kakek',
      'KTP Nenek': 'KTP Nenek - Wajib jika wali utama adalah Nenek',
      'Akta Kematian': 'Akta Kematian - Dokumen sosial untuk kategori Binaan',
      'SKTM': 'SKTM - Surat Keterangan Tidak Mampu untuk kategori Binaan',
      'Surat Domisili': 'Surat Domisili - Dokumen sosial untuk kategori Binaan'
    };
    
    return descriptions[jenisDokumen] || 'Dokumen pendukung';
  };

  const isFormValid = santriData.nama_lengkap.trim() && 
                     santriData.kategori && 
                     santriData.angkatan &&
                     santriData.tanggal_masuk &&
                     programData.length > 0 &&
                     programData[0].nama_program &&
                     programData[0].kelas_program &&
                     waliData.some(w => w.is_utama && w.nama_lengkap.trim());

  // Debug logging
  console.log('Form validation state:', {
    nama_lengkap: santriData.nama_lengkap.trim(),
    kategori: santriData.kategori,
    angkatan: santriData.angkatan,
    tanggal_masuk: santriData.tanggal_masuk,
    programData_length: programData.length,
    programData_0: programData[0],
    waliData: waliData,
    waliUtama: waliData.find(w => w.is_utama),
    isFormValid: isFormValid
  });

  return (
    <Dialog open={true} onOpenChange={(open) => {
      if (!open && !isLoading) {
        onClose();
      }
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {santriId ? 'Edit Data Santri' : 'Tambah Data Santri'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {santriId ? 'Edit data santri yang sudah ada' : 'Tambah data santri baru'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={(value) => {
            if (!isLoading) {
              setActiveTab(value);
            }
          }}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="administrasi">Administrasi</TabsTrigger>
              <TabsTrigger value="pribadi">Pribadi</TabsTrigger>
              <TabsTrigger value="program">Program</TabsTrigger>
              <TabsTrigger value="wali">Wali</TabsTrigger>
              <TabsTrigger value="dokumen">Dokumen</TabsTrigger>
              <TabsTrigger value="kesehatan">Kesehatan</TabsTrigger>
            </TabsList>

            {/* Tab Administrasi */}
            <TabsContent value="administrasi" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <School className="w-4 h-4" />
                    Data Administrasi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="kategori">Kategori Santri *</Label>
                    <Select 
                      value={santriData.kategori} 
                      onValueChange={(value) => setSantriData({...santriData, kategori: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori santri" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Reguler">Reguler</SelectItem>
                        <SelectItem value="Binaan Mukim">Binaan Mukim</SelectItem>
                        <SelectItem value="Binaan Non-Mukim">Binaan Non-Mukim</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="angkatan">Angkatan *</Label>
                      <Input
                        id="angkatan"
                        type="number"
                        value={santriData.angkatan}
                        onChange={(e) => setSantriData({...santriData, angkatan: e.target.value})}
                        placeholder="Tahun masuk"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status_baru">Status Santri *</Label>
                      <Select 
                        value={santriData.status_baru} 
                        onValueChange={(value) => setSantriData({...santriData, status_baru: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih status santri" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Aktif">Aktif</SelectItem>
                          <SelectItem value="Non Aktif">Non Aktif</SelectItem>
                          <SelectItem value="Alumni">Alumni</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nis">NIS</Label>
                    <div className="flex gap-2">
                      <Input
                        id="nis"
                        value={santriData.nis || ''}
                        onChange={(e) => setSantriData({...santriData, nis: e.target.value})}
                        placeholder="Auto-generate saat penyimpanan pertama"
                        readOnly={!santriData.nis}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={regenerateNIS}
                      >
                        Regenerate NIS
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Format: YYYY-PRG-KELAS-SEQ atau YYYY-SEQ
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rfid">RFID</Label>
                    <Input
                      id="rfid"
                      value={santriData.rfid || ''}
                      onChange={(e) => setSantriData({...santriData, rfid: e.target.value})}
                      placeholder="RFID (opsional)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tanggal_masuk">Tanggal Masuk *</Label>
                    <Input
                      id="tanggal_masuk"
                      type="date"
                      value={santriData.tanggal_masuk}
                      onChange={(e) => setSantriData({...santriData, tanggal_masuk: e.target.value})}
                      required
                    />
                  </div>

                  {/* Data Sekolah Formal - Hanya untuk Binaan Mukim */}
                  {santriData.kategori === 'Binaan Mukim' && (
                    <>
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-4">Data Sekolah Formal</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="nama_sekolah">Nama Sekolah</Label>
                            <Input
                              id="nama_sekolah"
                              value={santriData.nama_sekolah_formal || ''}
                              onChange={(e) => setSantriData({...santriData, nama_sekolah_formal: e.target.value})}
                              placeholder="Nama sekolah formal"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="kelas_sekolah">Kelas Sekolah</Label>
                            <Input
                              id="kelas_sekolah"
                              value={santriData.kelas_sekolah_formal || ''}
                              onChange={(e) => setSantriData({...santriData, kelas_sekolah_formal: e.target.value})}
                              placeholder="Kelas di sekolah formal"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="nama_wali_kelas">Nama Wali Kelas</Label>
                            <Input
                              id="nama_wali_kelas"
                              value={santriData.nama_wali_kelas || ''}
                              onChange={(e) => setSantriData({...santriData, nama_wali_kelas: e.target.value})}
                              placeholder="Nama wali kelas"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="no_wali_kelas">Nomor Wali Kelas</Label>
                            <Input
                              id="no_wali_kelas"
                              value={santriData.no_telepon_wali_kelas || ''}
                              onChange={(e) => setSantriData({...santriData, no_telepon_wali_kelas: e.target.value})}
                              placeholder="Nomor telepon wali kelas"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Pribadi */}
            <TabsContent value="pribadi" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Data Pribadi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nama_lengkap">Nama Lengkap *</Label>
                      <Input
                        id="nama_lengkap"
                        value={santriData.nama_lengkap}
                        onChange={(e) => setSantriData({...santriData, nama_lengkap: e.target.value})}
                        placeholder="Nama lengkap santri"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nama_panggilan">Nama Panggilan</Label>
                      <Input
                        id="nama_panggilan"
                        value={santriData.nama_panggilan || ''}
                        onChange={(e) => setSantriData({...santriData, nama_panggilan: e.target.value})}
                        placeholder="Nama panggilan"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tempat_lahir">Tempat Lahir *</Label>
                      <Input
                        id="tempat_lahir"
                        value={santriData.tempat_lahir}
                        onChange={(e) => setSantriData({...santriData, tempat_lahir: e.target.value})}
                        placeholder="Tempat lahir"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tanggal_lahir">Tanggal Lahir *</Label>
                      <Input
                        id="tanggal_lahir"
                        type="date"
                        value={santriData.tanggal_lahir}
                        onChange={(e) => setSantriData({...santriData, tanggal_lahir: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="jenis_kelamin">Jenis Kelamin *</Label>
                      <Select 
                        value={santriData.jenis_kelamin} 
                        onValueChange={(value: 'Laki-laki' | 'Perempuan') => setSantriData({...santriData, jenis_kelamin: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                          <SelectItem value="Perempuan">Perempuan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="agama">Agama</Label>
                      <Input
                        id="agama"
                        value={santriData.agama || 'Islam'}
                        onChange={(e) => setSantriData({...santriData, agama: e.target.value})}
                        placeholder="Islam"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="kewarganegaraan">Kewarganegaraan</Label>
                      <Input
                        id="kewarganegaraan"
                        value={santriData.kewarganegaraan || 'Indonesia'}
                        onChange={(e) => setSantriData({...santriData, kewarganegaraan: e.target.value})}
                        placeholder="Indonesia"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="golongan_darah">Golongan Darah</Label>
                      <Input
                        id="golongan_darah"
                        value={santriData.golongan_darah || ''}
                        onChange={(e) => setSantriData({...santriData, golongan_darah: e.target.value})}
                        placeholder="A, B, AB, O"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status_anak">Status Anak {(santriData.kategori.includes('Binaan')) ? '*' : ''}</Label>
                    <Select 
                      value={santriData.status_anak || ''} 
                      onValueChange={(value) => setSantriData({...santriData, status_anak: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status anak" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Umum">Umum</SelectItem>
                        <SelectItem value="Yatim">Yatim</SelectItem>
                        <SelectItem value="Piatu">Piatu</SelectItem>
                        <SelectItem value="Yatim Piatu">Yatim Piatu</SelectItem>
                        <SelectItem value="Dhuafa">Dhuafa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="anak_ke">Anak ke-</Label>
                      <Input
                        id="anak_ke"
                        type="number"
                        value={santriData.anak_ke || ''}
                        onChange={(e) => setSantriData({...santriData, anak_ke: parseInt(e.target.value) || undefined})}
                        placeholder="1, 2, 3..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="jumlah_saudara">Jumlah Saudara</Label>
                      <Input
                        id="jumlah_saudara"
                        type="number"
                        value={santriData.jumlah_saudara || ''}
                        onChange={(e) => setSantriData({...santriData, jumlah_saudara: parseInt(e.target.value) || undefined})}
                        placeholder="0, 1, 2..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hobi">Hobi</Label>
                      <Input
                        id="hobi"
                        value={santriData.hobi || ''}
                        onChange={(e) => setSantriData({...santriData, hobi: e.target.value})}
                        placeholder="Hobi santri"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cita_cita">Cita-cita</Label>
                    <Input
                      id="cita_cita"
                      value={santriData.cita_cita || ''}
                      onChange={(e) => setSantriData({...santriData, cita_cita: e.target.value})}
                      placeholder="Cita-cita santri"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nik">Nomor Induk Kependudukan (NIK)</Label>
                      <Input
                        id="nik"
                        value={santriData.nik || ''}
                        onChange={(e) => setSantriData({...santriData, nik: e.target.value})}
                        placeholder="16 digit NIK"
                        maxLength={16}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nomor_kk">Nomor Kartu Keluarga (KK)</Label>
                      <Input
                        id="nomor_kk"
                        value={santriData.nomor_kk || ''}
                        onChange={(e) => setSantriData({...santriData, nomor_kk: e.target.value})}
                        placeholder="Nomor Kartu Keluarga"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="no_whatsapp">Nomor WhatsApp *</Label>
                    <Input
                      id="no_whatsapp"
                      type="tel"
                      value={santriData.no_whatsapp}
                      onChange={(e) => setSantriData({...santriData, no_whatsapp: e.target.value})}
                      placeholder="+6281234567890"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alamat">Alamat *</Label>
                    <Textarea
                      id="alamat"
                      value={santriData.alamat}
                      onChange={(e) => setSantriData({...santriData, alamat: e.target.value})}
                      placeholder="Alamat lengkap"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dusun">Dusun *</Label>
                      <Input
                        id="dusun"
                        value={santriData.dusun}
                        onChange={(e) => setSantriData({...santriData, dusun: e.target.value})}
                        placeholder="Nama dusun"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="desa_kelurahan">Desa/Kelurahan *</Label>
                      <Input
                        id="desa_kelurahan"
                        value={santriData.desa_kelurahan}
                        onChange={(e) => setSantriData({...santriData, desa_kelurahan: e.target.value})}
                        placeholder="Nama desa/kelurahan"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="kecamatan">Kecamatan *</Label>
                      <Input
                        id="kecamatan"
                        value={santriData.kecamatan}
                        onChange={(e) => setSantriData({...santriData, kecamatan: e.target.value})}
                        placeholder="Nama kecamatan"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="kabupaten_kota">Kabupaten/Kota *</Label>
                      <Input
                        id="kabupaten_kota"
                        value={santriData.kabupaten_kota}
                        onChange={(e) => setSantriData({...santriData, kabupaten_kota: e.target.value})}
                        placeholder="Nama kabupaten/kota"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="provinsi">Provinsi *</Label>
                      <Input
                        id="provinsi"
                        value={santriData.provinsi}
                        onChange={(e) => setSantriData({...santriData, provinsi: e.target.value})}
                        placeholder="Nama provinsi"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ukuran_seragam">Ukuran Seragam</Label>
                    <Input
                      id="ukuran_seragam"
                      value={santriData.ukuran_seragam || ''}
                      onChange={(e) => setSantriData({...santriData, ukuran_seragam: e.target.value})}
                      placeholder="S, M, L, XL, dll"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Program */}
            <TabsContent value="program" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <School className="w-4 h-4" />
                      Data Program
                    </div>
                    {santriData.kategori !== 'Binaan Mukim' && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => addProgram()}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Program
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {santriData.kategori === 'Binaan Mukim' ? (
                    // Binaan Mukim - tampilkan blok TPQ dan Madin
                    <div className="space-y-6">
                      {/* Blok TPQ */}
                      <div className="border rounded-lg p-4 bg-blue-50">
                        <h4 className="font-semibold text-blue-900 mb-4">TPQ</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="kelas_tpq">Kelas TPQ *</Label>
                            <Input
                              id="kelas_tpq"
                              value={programData.find(p => p.jenis === 'TPQ')?.kelas_program || ''}
                              onChange={(e) => updateProgram('TPQ', 'kelas_program', e.target.value)}
                              placeholder="1, 2, 3"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="rombel_tpq">Rombel TPQ</Label>
                            <Input
                              id="rombel_tpq"
                              value={programData.find(p => p.jenis === 'TPQ')?.rombel || ''}
                              onChange={(e) => updateProgram('TPQ', 'rombel', e.target.value)}
                              placeholder="A, B, C"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Blok Madin */}
                      <div className="border rounded-lg p-4 bg-green-50">
                        <h4 className="font-semibold text-green-900 mb-4">Madin</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="kelas_madin">Kelas Madin *</Label>
                            <Input
                              id="kelas_madin"
                              value={programData.find(p => p.jenis === 'Madin')?.kelas_program || ''}
                              onChange={(e) => updateProgram('Madin', 'kelas_program', e.target.value)}
                              placeholder="I'dad, Ula, Wusta, Ulya"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="rombel_madin">Rombel Madin</Label>
                            <Input
                              id="rombel_madin"
                              value={programData.find(p => p.jenis === 'Madin')?.rombel || ''}
                              onChange={(e) => updateProgram('Madin', 'rombel', e.target.value)}
                              placeholder="A, B, C"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Reguler & Binaan Non-Mukim - program bebas
                    <div className="space-y-4">
                      {programData.map((program, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium">Program {index + 1}</h4>
                            {programData.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeProgram(index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`nama_program_${index}`}>Nama Program *</Label>
                              <Input
                                id={`nama_program_${index}`}
                                value={program.nama_program}
                                onChange={(e) => updateProgram(index, 'nama_program', e.target.value)}
                                placeholder="TPQ, Madin"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`kelas_program_${index}`}>Kelas Program *</Label>
                              <Input
                                id={`kelas_program_${index}`}
                                value={program.kelas_program}
                                onChange={(e) => updateProgram(index, 'kelas_program', e.target.value)}
                                placeholder="Kelas atau tingkat"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`rombel_${index}`}>Rombel</Label>
                              <Input
                                id={`rombel_${index}`}
                                value={program.rombel || ''}
                                onChange={(e) => updateProgram(index, 'rombel', e.target.value)}
                                placeholder="A, B, C"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Wali */}
            <TabsContent value="wali" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Data Wali
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addWali}>
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Wali
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {waliData.map((wali, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {wali.is_utama && (
                            <Badge className="bg-blue-100 text-blue-800">Wali Utama</Badge>
                          )}
                          <h4 className="font-medium">Wali {index + 1}</h4>
                        </div>
                        <div className="flex gap-2">
                          {!wali.is_utama && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setWaliUtama(index)}
                            >
                              Jadikan Utama
                            </Button>
                          )}
                          {waliData.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeWali(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`nama_wali_${index}`}>Nama Lengkap *</Label>
                          <Input
                            id={`nama_wali_${index}`}
                            value={wali.nama_lengkap}
                            onChange={(e) => {
                              const newWaliData = [...waliData];
                              newWaliData[index].nama_lengkap = e.target.value;
                              setWaliData(newWaliData);
                            }}
                            placeholder="Nama lengkap wali"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`hubungan_${index}`}>Hubungan *</Label>
                          <Select 
                            value={wali.hubungan_keluarga} 
                            onValueChange={(value) => {
                              const newWaliData = [...waliData];
                              newWaliData[index].hubungan_keluarga = value;
                              setWaliData(newWaliData);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih hubungan" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Ayah">Ayah</SelectItem>
                              <SelectItem value="Ibu">Ibu</SelectItem>
                              <SelectItem value="Wali Utama">Wali Utama</SelectItem>
                              <SelectItem value="Wali Pendamping">Wali Pendamping</SelectItem>
                              <SelectItem value="Paman">Paman</SelectItem>
                              <SelectItem value="Bibi">Bibi</SelectItem>
                              <SelectItem value="Kakek">Kakek</SelectItem>
                              <SelectItem value="Nenek">Nenek</SelectItem>
                              <SelectItem value="Saudara">Saudara</SelectItem>
                              <SelectItem value="Lainnya">Lainnya</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`nik_${index}`}>NIK</Label>
                          <Input
                            id={`nik_${index}`}
                            value={wali.nik || ''}
                            onChange={(e) => {
                              const newWaliData = [...waliData];
                              newWaliData[index].nik = e.target.value;
                              setWaliData(newWaliData);
                            }}
                            placeholder="16 digit NIK (opsional)"
                            maxLength={16}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`pekerjaan_${index}`}>Pekerjaan</Label>
                          <Input
                            id={`pekerjaan_${index}`}
                            value={wali.pekerjaan || ''}
                            onChange={(e) => {
                              const newWaliData = [...waliData];
                              newWaliData[index].pekerjaan = e.target.value;
                              setWaliData(newWaliData);
                            }}
                            placeholder="Pekerjaan wali"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`pendidikan_${index}`}>Pendidikan</Label>
                          <Select 
                            value={wali.pendidikan || ''} 
                            onValueChange={(value) => {
                              const newWaliData = [...waliData];
                              newWaliData[index].pendidikan = value;
                              setWaliData(newWaliData);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih tingkat pendidikan" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SD/Sederajat">SD/Sederajat</SelectItem>
                              <SelectItem value="SMP/Sederajat">SMP/Sederajat</SelectItem>
                              <SelectItem value="SMA/Sederajat">SMA/Sederajat</SelectItem>
                              <SelectItem value="D1">D1</SelectItem>
                              <SelectItem value="D2">D2</SelectItem>
                              <SelectItem value="D3">D3</SelectItem>
                              <SelectItem value="D4">D4</SelectItem>
                              <SelectItem value="S1">S1</SelectItem>
                              <SelectItem value="S2">S2</SelectItem>
                              <SelectItem value="S3">S3</SelectItem>
                              <SelectItem value="Tidak Sekolah">Tidak Sekolah</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`penghasilan_${index}`}>Penghasilan Bulanan</Label>
                          <Select 
                            value={wali.penghasilan_bulanan || ''} 
                            onValueChange={(value) => {
                              const newWaliData = [...waliData];
                              newWaliData[index].penghasilan_bulanan = value;
                              setWaliData(newWaliData);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih kisaran penghasilan" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Kurang dari Rp 1.000.000">Kurang dari Rp 1.000.000</SelectItem>
                              <SelectItem value="Rp 1.000.000 - Rp 2.000.000">Rp 1.000.000 - Rp 2.000.000</SelectItem>
                              <SelectItem value="Rp 2.000.000 - Rp 3.000.000">Rp 2.000.000 - Rp 3.000.000</SelectItem>
                              <SelectItem value="Rp 3.000.000 - Rp 5.000.000">Rp 3.000.000 - Rp 5.000.000</SelectItem>
                              <SelectItem value="Rp 5.000.000 - Rp 10.000.000">Rp 5.000.000 - Rp 10.000.000</SelectItem>
                              <SelectItem value="Lebih dari Rp 10.000.000">Lebih dari Rp 10.000.000</SelectItem>
                              <SelectItem value="Tidak Berpenghasilan">Tidak Berpenghasilan</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor={`alamat_wali_${index}`}>Alamat Lengkap Sesuai KTP</Label>
                          <Textarea
                            id={`alamat_wali_${index}`}
                            value={wali.alamat || ''}
                            onChange={(e) => {
                              const newWaliData = [...waliData];
                              newWaliData[index].alamat = e.target.value;
                              setWaliData(newWaliData);
                            }}
                            placeholder="Alamat lengkap sesuai KTP wali"
                            rows={3}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`no_telepon_${index}`}>Nomor WhatsApp *</Label>
                          <Input
                            id={`no_telepon_${index}`}
                            type="tel"
                            value={wali.no_telepon}
                            onChange={(e) => {
                              const newWaliData = [...waliData];
                              newWaliData[index].no_telepon = e.target.value;
                              setWaliData(newWaliData);
                            }}
                            placeholder="+6281234567890"
                            required
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`is_utama_${index}`}
                            checked={wali.is_utama}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setWaliUtama(index);
                              }
                            }}
                          />
                          <Label htmlFor={`is_utama_${index}`} className="text-sm">
                            Wali Utama *
                          </Label>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Dokumen */}
            <TabsContent value="dokumen" className="space-y-4">
              {santriId ? (
                <UploadDokumenSantri
                  santriId={santriId}
                  kategori={santriData.kategori}
                  statusAnak={santriData.status_anak || ''}
                  onUploadComplete={() => {
                    toast.success('Dokumen berhasil diupload');
                  }}
                />
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium mb-2">Simpan Data Santri Terlebih Dahulu</h3>
                    <p className="text-muted-foreground">
                      Upload dokumen dapat dilakukan setelah data santri disimpan
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tab Kesehatan */}
            <TabsContent value="kesehatan" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Data Kesehatan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="riwayat_penyakit">Riwayat Penyakit</Label>
                    <Textarea
                      id="riwayat_penyakit"
                      value={santriData.riwayat_penyakit || ''}
                      onChange={(e) => setSantriData({...santriData, riwayat_penyakit: e.target.value})}
                      placeholder="Riwayat penyakit yang pernah diderita"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="pernah_rawat_inap"
                      checked={santriData.pernah_rawat_inap || false}
                      onCheckedChange={(checked) => setSantriData({...santriData, pernah_rawat_inap: !!checked})}
                    />
                    <Label htmlFor="pernah_rawat_inap" className="text-sm">
                      Pernah Rawat Inap?
                    </Label>
                  </div>

                  {santriData.pernah_rawat_inap && (
                    <div className="space-y-2">
                      <Label htmlFor="keterangan_rawat_inap">Keterangan Rawat Inap *</Label>
                      <Textarea
                        id="keterangan_rawat_inap"
                        value={santriData.keterangan_rawat_inap || ''}
                        onChange={(e) => setSantriData({...santriData, keterangan_rawat_inap: e.target.value})}
                        placeholder="Keterangan rawat inap"
                        rows={3}
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="disabilitas_khusus">Disabilitas Khusus</Label>
                    <Input
                      id="disabilitas_khusus"
                      value={santriData.disabilitas_khusus || ''}
                      onChange={(e) => setSantriData({...santriData, disabilitas_khusus: e.target.value})}
                      placeholder="Jenis disabilitas jika ada"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="obat_khusus">Obat Khusus</Label>
                    <Input
                      id="obat_khusus"
                      value={santriData.obat_khusus || ''}
                      onChange={(e) => setSantriData({...santriData, obat_khusus: e.target.value})}
                      placeholder="Obat-obatan khusus yang dikonsumsi"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Batal
            </Button>
            <Button onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSubmit();
            }} disabled={isLoading || !isFormValid}>
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Menyimpan...' : (santriId ? 'Perbarui' : 'Simpan')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SantriForm;