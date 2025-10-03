import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye,
  Users,
  GraduationCap,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SantriForm from '@/components/SantriForm';

interface SantriData {
  id: string;
  nis?: string;
  nama_lengkap: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
  alamat: string;
  angkatan?: string;
  status_baru: string;
  kategori: string;
  jenis: string;
  program_aktif: string;
  kelas_aktif?: string;
  kelas_internal?: string;
  rombel_aktif?: string;
  nama_sekolah_formal?: string;
  kelas_sekolah_formal?: string;
  nama_wali_kelas?: string;
  no_telepon_wali_kelas?: string;
  status_sosial: string;
  ukuran_seragam?: string;
  warna_seragam?: string;
  tanggal_masuk: string;
  tanggal_keluar?: string;
  program_spp?: boolean;
  program_beasiswa?: boolean;
  created_at: string;
  updated_at: string;
  dokumen_kelengkapan?: number;
  total_dokumen_required?: number;
  total_dokumen_uploaded?: number;
  total_dokumen_valid?: number;
}

const Santri = () => {
  const [santriData, setSantriData] = useState<SantriData[]>([]);
  const [filteredData, setFilteredData] = useState<SantriData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [kategoriFilter, setKategoriFilter] = useState('Semua');
  const [programFilter, setProgramFilter] = useState('Semua');
  const [showForm, setShowForm] = useState(false);
  const [editingSantri, setEditingSantri] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    aktif: 0,
    putra: 0,
    putri: 0,
    reguler: 0,
    binaanMukim: 0,
    binaanNonMukim: 0
  });

  useEffect(() => {
    loadSantriData();
  }, []);

  useEffect(() => {
    filterData();
  }, [santriData, searchTerm, statusFilter, kategoriFilter, programFilter]);

  const loadSantriData = async (force = false) => {
    try {
      if (isLoading && !force) return; // Prevent multiple simultaneous loads
      setIsLoading(true);
      
      // Load santri data with document completeness
      const { data: santri, error: santriError } = await supabase
        .from('santri')
        .select(`
          *,
          santri_wali(*),
          santri_dokumen(*)
        `)
        .order('created_at', { ascending: false });

      if (santriError) throw santriError;

      // Set santri data with basic completeness calculation
      const santriWithCompleteness = santri.map(s => ({
        ...s,
        dokumen_kelengkapan: 0,
        total_dokumen_required: 5, // Default required documents
        total_dokumen_uploaded: 0,
        total_dokumen_valid: 0
      }));

      setSantriData(santriWithCompleteness);
      calculateStats(santriWithCompleteness);

    } catch (error) {
      toast.error('Gagal memuat data santri');
      console.error('Error loading santri data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (data: SantriData[]) => {
    const newStats = {
      total: data.length,
      aktif: data.filter(s => s.status_baru === 'Aktif').length,
      putra: data.filter(s => s.jenis_kelamin === 'Laki-laki').length,
      putri: data.filter(s => s.jenis_kelamin === 'Perempuan').length,
      reguler: data.filter(s => s.kategori === 'Reguler').length,
      binaanMukim: data.filter(s => s.kategori === 'Binaan Mukim').length,
      binaanNonMukim: data.filter(s => s.kategori === 'Binaan Non-Mukim').length
    };
    setStats(newStats);
  };

  const filterData = () => {
    let filtered = [...santriData];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(santri =>
        santri.nama_lengkap.toLowerCase().includes(term) ||
        santri.nis?.toLowerCase().includes(term) ||
        santri.angkatan?.toLowerCase().includes(term) ||
        santri.kelas_internal?.toLowerCase().includes(term) ||
        santri.alamat.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'Semua') {
      filtered = filtered.filter(santri => santri.status_baru === statusFilter);
    }

    // Kategori filter
    if (kategoriFilter !== 'Semua') {
      filtered = filtered.filter(santri => santri.kategori === kategoriFilter);
    }

    // Program filter
    if (programFilter !== 'Semua') {
      filtered = filtered.filter(santri => santri.program_aktif === programFilter);
    }

    setFilteredData(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data santri ini?')) {
      return;
    }

    try {
      // Delete related data first
      await supabase.from('santri_dokumen').delete().eq('santri_id', id);
      await supabase.from('santri_wali').delete().eq('santri_id', id);
      await supabase.from('santri_riwayat_kelas').delete().eq('santri_id', id);
      
      // Delete santri
      const { error } = await supabase.from('santri').delete().eq('id', id);
      
      if (error) throw error;

      toast.success('Data santri berhasil dihapus');
      loadSantriData(true);
    } catch (error) {
      toast.error('Gagal menghapus data santri');
      console.error('Error deleting santri:', error);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'NIS', 'Nama Lengkap', 'Tempat Lahir', 'Tanggal Lahir', 'Jenis Kelamin',
      'Alamat', 'Angkatan', 'Kategori', 'Status', 'Program', 'Kelas Internal',
      'Nama Sekolah Formal', 'Kelas Sekolah Formal', 'Program SPP', 'Program Beasiswa',
      'Status Sosial', 'Tanggal Masuk', 'Dokumen Kelengkapan (%)'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredData.map(santri => [
        santri.nis || '',
        `"${santri.nama_lengkap}"`,
        `"${santri.tempat_lahir}"`,
        santri.tanggal_lahir,
        santri.jenis_kelamin,
        `"${santri.alamat}"`,
        santri.angkatan || '',
        santri.kategori || 'Reguler',
        santri.status_baru,
        santri.program_aktif,
        santri.kelas_internal || santri.kelas_aktif || '',
        `"${santri.nama_sekolah_formal || ''}"`,
        santri.kelas_sekolah_formal || '',
        santri.program_spp ? 'Ya' : 'Tidak',
        santri.program_beasiswa ? 'Ya' : 'Tidak',
        santri.status_sosial,
        santri.tanggal_masuk,
        santri.dokumen_kelengkapan || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `data_santri_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCSVImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        const importedData = [];
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            const row: any = {};
            
            headers.forEach((header, index) => {
              row[header.toLowerCase().replace(/\s+/g, '_')] = values[index];
            });
            
            // Map CSV columns to database fields
            const santriData = {
              nis: row.nis || `S${Date.now()}_${i}`,
              nama_lengkap: row.nama_lengkap || '',
              tempat_lahir: row.tempat_lahir || '',
              tanggal_lahir: row.tanggal_lahir || '',
              jenis_kelamin: row.jenis_kelamin || 'Laki-laki',
              alamat: row.alamat || '',
              angkatan: row.angkatan || new Date().getFullYear().toString(),
              kategori: row.kategori || 'Reguler',
              status_baru: row.status || 'Aktif',
              program_aktif: row.program || '',
              kelas_internal: row.kelas_internal || '',
              nama_sekolah_formal: row.nama_sekolah_formal || '',
              kelas_sekolah_formal: row.kelas_sekolah_formal || '',
              status_sosial: row.status_sosial || '',
              tanggal_masuk: row.tanggal_masuk || new Date().toISOString().split('T')[0]
            };
            
            importedData.push(santriData);
          }
        }
        
        importSantriData(importedData);
      } catch (error) {
        toast.error('Format CSV tidak valid');
        console.error('CSV parsing error:', error);
      }
    };
    
    reader.readAsText(file);
  };

  const importSantriData = async (data: any[]) => {
    try {
      setIsLoading(true);
      
      for (const santri of data) {
        if (santri.nama_lengkap) {
          const { error } = await supabase
            .from('santri')
            .insert([{
              ...santri,
              created_by: (await supabase.auth.getUser()).data.user?.id
            }]);
          
          if (error) {
            console.error('Error importing santri:', error);
            toast.error(`Gagal mengimport ${santri.nama_lengkap}`);
          }
        }
      }
      
      toast.success(`${data.length} data santri berhasil diimport`);
      loadSantriData(true);
    } catch (error) {
      toast.error('Gagal mengimport data santri');
      console.error('Import error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'Aktif': 'bg-green-100 text-green-800 border-green-200',
      'Non-Aktif': 'bg-red-100 text-red-800 border-red-200',
      'Alumni': 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getCompletenessBadge = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100 text-green-800';
    if (percentage >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getCompletenessIcon = (percentage: number) => {
    if (percentage >= 80) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (percentage >= 50) return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Data Master Santri</h1>
          <p className="text-muted-foreground">Kelola data santri pesantren dengan sistem adaptif</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV} disabled={isLoading}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVImport}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
          </div>
          <Button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-medium"
            onClick={() => setShowForm(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Santri
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-gradient-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Santri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.aktif} aktif, {stats.total - stats.aktif} non-aktif
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-border bg-gradient-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Reguler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.reguler}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Program SPP
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-border bg-gradient-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Binaan Mukim
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.binaanMukim}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Program Beasiswa
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-border bg-gradient-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Binaan Non-Mukim
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.binaanNonMukim}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Program Beasiswa
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border-border bg-gradient-card shadow-medium">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter & Pencarian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Pencarian</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Cari nama, NIS, angkatan, kelas..." 
                  className="pl-10 border-border bg-background"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Semua">Semua Status</SelectItem>
                  <SelectItem value="Aktif">Aktif</SelectItem>
                  <SelectItem value="Non-Aktif">Non-Aktif</SelectItem>
                  <SelectItem value="Alumni">Alumni</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={kategoriFilter} onValueChange={setKategoriFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Semua">Semua Kategori</SelectItem>
                  <SelectItem value="Reguler">Reguler</SelectItem>
                  <SelectItem value="Binaan Mukim">Binaan Mukim</SelectItem>
                  <SelectItem value="Binaan Non-Mukim">Binaan Non-Mukim</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Program</Label>
              <Select value={programFilter} onValueChange={setProgramFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Semua">Semua Program</SelectItem>
                  <SelectItem value="TPQ">TPQ</SelectItem>
                  <SelectItem value="Madin">Madin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card className="border-border bg-gradient-card shadow-medium">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <CardTitle className="text-foreground">
              Daftar Santri ({filteredData.length} dari {santriData.length})
            </CardTitle>
            <div className="flex-1" />
            {isLoading && (
              <Badge variant="outline" className="animate-pulse">
                Memuat data...
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {santriData.length === 0 ? 'Belum ada data santri' : 'Data tidak ditemukan'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {santriData.length === 0 
                  ? 'Mulai dengan menambahkan data santri pertama' 
                  : 'Coba ubah filter pencarian Anda'
                }
              </p>
              {santriData.length === 0 && (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Santri Pertama
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead className="text-foreground font-semibold">NIS</TableHead>
                    <TableHead className="text-foreground font-semibold">Nama Lengkap</TableHead>
                    <TableHead className="text-foreground font-semibold">Kategori</TableHead>
                    <TableHead className="text-foreground font-semibold">Program/Kelas</TableHead>
                    <TableHead className="text-foreground font-semibold">Status</TableHead>
                    <TableHead className="text-foreground font-semibold">Dokumen</TableHead>
                    <TableHead className="text-right text-foreground font-semibold">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((santri) => (
                    <TableRow key={santri.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium text-foreground">
                        {santri.nis || '-'}
                      </TableCell>
                      <TableCell className="text-foreground">
                        <div>
                          <div className="font-medium">{santri.nama_lengkap}</div>
                          <div className="text-sm text-muted-foreground">
                            {santri.jenis_kelamin} • {santri.tempat_lahir}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          santri.kategori === 'Reguler' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                          santri.kategori === 'Binaan Mukim' ? 'bg-green-100 text-green-800 border-green-200' :
                          'bg-orange-100 text-orange-800 border-orange-200'
                        }>
                          {santri.kategori}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-foreground">
                        <div>
                          <div className="font-medium">{santri.program_aktif}</div>
                          <div className="text-sm text-muted-foreground">
                            {santri.kelas_internal || santri.kelas_aktif || '-'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(santri.status_baru)}>
                          {santri.status_baru}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getCompletenessIcon(santri.dokumen_kelengkapan || 0)}
                          <div className="flex flex-col">
                            <Badge 
                              variant="outline" 
                              className={getCompletenessBadge(santri.dokumen_kelengkapan || 0)}
                            >
                              {santri.dokumen_kelengkapan || 0}%
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {santri.total_dokumen_valid || 0}/{santri.total_dokumen_required || 0} valid
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setEditingSantri(santri.id);
                              setShowForm(true);
                            }}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              // TODO: Implement view details
                              toast.info('Fitur lihat detail akan segera tersedia');
                            }}>
                              <Eye className="w-4 h-4 mr-2" />
                              Lihat Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              // TODO: Implement view documents
                              toast.info('Fitur lihat dokumen akan segera tersedia');
                            }}>
                              <FileText className="w-4 h-4 mr-2" />
                              Lihat Dokumen
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(santri.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Santri Form Dialog */}
      {showForm && (
        <SantriForm
          santriId={editingSantri || undefined}
          onClose={() => {
            setShowForm(false);
            setEditingSantri(null);
          }}
          onSave={() => loadSantriData(true)}
        />
      )}
    </div>
  );
};

export default Santri;
