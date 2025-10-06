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
  FileText,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import SantriForm from "@/components/SantriForm";
import UploadDokumenSantri from "@/components/UploadDokumenSantri";
import SantriDetailView from "@/components/SantriDetailView";

interface SantriData {
  id: string;
  nama_lengkap: string;
  nis: string;
  nik?: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
  alamat: string;
  no_whatsapp?: string;
  kategori: string;
  status_anak?: string;
  nama_wali?: string;
  no_telepon_wali?: string;
  jumlah_saudara?: number;
  hobi?: string;
  cita_cita?: string;
  created_at: string;
  updated_at: string;
  total_dokumen_required?: number;
  total_dokumen_uploaded?: number;
  total_dokumen_valid?: number;
}

export default function Santri() {
  const [santriData, setSantriData] = useState<SantriData[]>([]);
  const [filteredData, setFilteredData] = useState<SantriData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterKategori, setFilterKategori] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingSantri, setEditingSantri] = useState<SantriData | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedSantriForUpload, setSelectedSantriForUpload] = useState<SantriData | null>(null);
  const [showDetailView, setShowDetailView] = useState(false);
  const [selectedSantriForDetail, setSelectedSantriForDetail] = useState<SantriData | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    reguler: 0,
    binaanMukim: 0,
    binaanNonMukim: 0,
    yatim: 0,
    piatu: 0,
    yatimPiatu: 0,
    dhuafa: 0
  });
  const navigate = useNavigate();

  const loadSantriData = async (force = false) => {
    try {
      console.log('loadSantriData called, isLoading:', isLoading, 'force:', force);
      if (isLoading && !force) {
        console.log('Skipping load - already loading and not forced');
        return; // Prevent multiple simultaneous loads
      }
      setIsLoading(true);
      
      // Check authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('Auth check:', { user, authError });
      
      if (authError) {
        console.error('Auth error:', authError);
        toast.error('Masalah autentikasi: ' + authError.message);
        return;
      }
      
      // Load santri data first without joins
      const { data: santri, error: santriError } = await supabase
        .from('santri')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Supabase response:', { santri, santriError });

      if (santriError) {
        console.error('Supabase error details:', santriError);
        throw santriError;
      }

      // Load all documents for all santri in one query
      const santriIds = (santri || []).map(s => s.id);
      let allDocuments: any[] = [];
      
      if (santriIds.length > 0) {
        const { data: documents, error: docError } = await supabase
          .from('dokumen_santri')
          .select('santri_id, status_validasi')
          .in('santri_id', santriIds)
          .eq('is_active', true);

        if (docError) {
          console.error('Error loading documents:', docError);
        } else {
          allDocuments = documents || [];
        }
      }


      // Calculate completeness for each santri
      const santriWithCompleteness = (santri || []).map((s): SantriData => {
        const santriDocuments = allDocuments.filter(d => d.santri_id === s.id);
        const totalUploaded = santriDocuments.length;
        
        // Simplified approach: count all valid documents and set a reasonable required count
        const santriWithStatus = s as any;
        const validRequiredDocs = santriDocuments.filter(doc => doc.status_validasi === 'Valid').length;
        
        // Set required count based on category and status
        let totalRequired = 5; // Base minimum
        
        if (s.kategori === 'Binaan Mukim' || s.kategori === 'Binaan Non-Mukim') {
          totalRequired = 7; // More documents required for Binaan
        }
        
        if (santriWithStatus.status_anak === 'Yatim' || santriWithStatus.status_anak === 'Piatu' || santriWithStatus.status_anak === 'Yatim Piatu') {
          totalRequired += 2; // Additional documents for special status
        }

        console.log(`Santri ${s.nama_lengkap} (${s.kategori}, ${santriWithStatus.status_anak}): ${validRequiredDocs}/${totalRequired} valid docs`);
        console.log(`Available docs:`, santriDocuments.map(d => `${d.kode_dokumen}(${d.status_validasi})`));

        return {
          ...s,
          total_dokumen_required: totalRequired,
          total_dokumen_uploaded: totalUploaded,
          total_dokumen_valid: validRequiredDocs
        } as SantriData;
      });

      console.log('Setting santri data:', santriWithCompleteness);
      setSantriData(santriWithCompleteness);
      calculateStats(santriWithCompleteness);

    } catch (error) {
      console.error('Error loading santri data:', error);
      toast.error('Gagal memuat data santri: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (data: SantriData[]) => {
    const newStats = {
      total: data.length,
      reguler: data.filter(s => s.kategori === 'Reguler').length,
      binaanMukim: data.filter(s => s.kategori === 'Binaan Mukim').length,
      binaanNonMukim: data.filter(s => s.kategori === 'Binaan Non-Mukim').length,
      yatim: data.filter(s => s.status_anak === 'Yatim').length,
      piatu: data.filter(s => s.status_anak === 'Piatu').length,
      yatimPiatu: data.filter(s => s.status_anak === 'Yatim Piatu').length,
      dhuafa: data.filter(s => s.status_anak === 'Dhuafa').length
    };
    setStats(newStats);
  };

  const refreshData = () => {
    console.log('refreshData called');
    loadSantriData(true);
  };

  useEffect(() => {
    console.log('Santri component mounted, loading data...');
    // Add a small delay to ensure component is fully mounted
    const timer = setTimeout(() => {
      loadSantriData();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    console.log('Filtering data...', { searchTerm, filterKategori, filterStatus });
    let filtered = santriData;

    if (searchTerm) {
      filtered = filtered.filter(santri =>
        santri.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (santri.nik || santri.nis).toLowerCase().includes(searchTerm.toLowerCase()) ||
                (santri.no_whatsapp || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterKategori && filterKategori !== 'all') {
      filtered = filtered.filter(santri => santri.kategori === filterKategori);
    }

    if (filterStatus && filterStatus !== 'all') {
      filtered = filtered.filter(santri => santri.status_anak === filterStatus);
    }

    console.log('Filtered data:', filtered.length, 'items');
    setFilteredData(filtered);
  }, [santriData, searchTerm, filterKategori, filterStatus]);

  const handleAddSantri = () => {
    setEditingSantri(null);
    setShowForm(true);
  };

  const handleEditSantri = (santri: SantriData) => {
    setEditingSantri(santri);
    setShowForm(true);
  };

  const handleDeleteSantri = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data santri ini? Semua dokumen dan data terkait akan ikut terhapus.')) {
      return;
    }

    try {
      // 1. Ambil semua dokumen santri terlebih dahulu
      const { data: documents, error: docSelectError } = await supabase
        .from('dokumen_santri')
        .select('id')
        .eq('santri_id', id);

      if (docSelectError) {
        console.warn('Warning selecting documents:', docSelectError);
      }

      // 2. Hapus dokumen audit log jika ada dokumen
      if (documents && documents.length > 0) {
        const docIds = documents.map(doc => doc.id);
        const { error: auditLogError } = await supabase
          .from('dokumen_audit_log')
          .delete()
          .in('dokumen_id', docIds);

        if (auditLogError) {
          console.warn('Warning deleting audit logs:', auditLogError);
        }
      }

      // 3. Hapus dokumen santri
      const { error: dokumenError } = await supabase
        .from('dokumen_santri')
        .delete()
        .eq('santri_id', id);

      if (dokumenError) {
        console.warn('Warning deleting documents:', dokumenError);
      }

      // 4. Hapus data wali jika ada
      const { error: waliError } = await supabase
        .from('santri_wali')
        .delete()
        .eq('santri_id', id);

      if (waliError) {
        console.warn('Warning deleting wali data:', waliError);
      }

      // 5. Hapus data santri
      const { error: santriError } = await supabase
        .from('santri')
        .delete()
        .eq('id', id);

      if (santriError) throw santriError;

      toast.success('Data santri berhasil dihapus');
      refreshData();
    } catch (error) {
      console.error('Error deleting santri:', error);
      toast.error('Gagal menghapus data santri: ' + (error as Error).message);
    }
  };

  const handleViewProfile = (santri: SantriData) => {
    setSelectedSantriForDetail(santri);
    setShowDetailView(true);
  };

  const handleDownloadCSV = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all santri data with wali information
      const { data: santriData, error: santriError } = await supabase
        .from('santri')
        .select(`
          nama_lengkap,
          alamat,
          nik,
          nomor_kk,
          kategori,
          status_anak,
          nama_wali,
          no_telepon_wali
        `)
        .order('nama_lengkap');

      if (santriError) throw santriError;

      // Fetch wali data for relationship information
      const { data: waliData, error: waliError } = await supabase
        .from('santri_wali')
        .select(`
          santri_id,
          nama_lengkap,
          hubungan_keluarga,
          no_telepon
        `);

      if (waliError) {
        console.warn('Warning fetching wali data:', waliError);
      }

      // Create CSV content
      const headers = [
        'Nama Lengkap',
        'Alamat Lengkap', 
        'NIK',
        'No. KK',
        'Kategori Santri',
        'Status Santri',
        'Nama Wali',
        'Hubungan Wali',
        'Nomor Telepon Wali'
      ];

      const csvRows = [headers.join(',')];

      if (santriData) {
        santriData.forEach((santri: any) => {
          // Find wali data for this santri
          const wali = waliData?.find((w: any) => w.santri_id === santri.id);
          
          const row = [
            `"${santri.nama_lengkap || ''}"`,
            `"${santri.alamat || ''}"`,
            `"${santri.nik || ''}"`,
            `"${santri.nomor_kk || ''}"`,
            `"${santri.kategori || ''}"`,
            `"${santri.status_anak || 'Normal'}"`,
            `"${wali?.nama_lengkap || santri.nama_wali || ''}"`,
            `"${wali?.hubungan_keluarga || ''}"`,
            `"${wali?.no_telepon || santri.no_telepon_wali || ''}"`
          ];
          
          csvRows.push(row.join(','));
        });
      }

      // Create and download CSV file
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `data_santri_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast.success('Data santri berhasil didownload');
    } catch (error) {
      console.error('Error downloading CSV:', error);
      toast.error('Gagal mendownload data santri');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSantri = async (santriData: Partial<SantriData>) => {
    try {
      if (editingSantri) {
        // Update existing santri
        const { error } = await supabase
          .from('santri')
          .update(santriData)
          .eq('id', editingSantri.id);

        if (error) throw error;
        toast.success('Data santri berhasil diperbarui');
      } else {
        // Create new santri
        const { error } = await supabase
          .from('santri')
          .insert(santriData as any);

        if (error) throw error;
        toast.success('Data santri berhasil ditambahkan');
      }

      setShowForm(false);
      setEditingSantri(null);
      refreshData();
    } catch (error) {
      console.error('Error saving santri:', error);
      toast.error('Gagal menyimpan data santri');
    }
  };

  const getCompletenessColor = (valid: number, total: number) => {
    if (valid === total) return "bg-green-500";
    if (valid >= total * 0.7) return "bg-yellow-500";
    if (valid >= total * 0.4) return "bg-orange-500";
    return "bg-red-500";
  };

  const getCompletenessText = (valid: number, total: number) => {
    if (valid === total) return "Lengkap";
    if (valid >= total * 0.7) return "Cukup";
    if (valid >= total * 0.4) return "Kurang";
    return "Belum";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Data Santri</h1>
          <p className="text-muted-foreground">
            Kelola data santri dan dokumen yang diperlukan
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleDownloadCSV} variant="outline" size="sm" disabled={isLoading}>
            <Download className="w-4 h-4 mr-2" />
            {isLoading ? 'Downloading...' : 'Download CSV'}
          </Button>
          <Button onClick={handleAddSantri}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Santri
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Santri</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Raw data: {santriData.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reguler</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reguler}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Binaan Mukim</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.binaanMukim}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Binaan Non-Mukim</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.binaanNonMukim}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Pencarian & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Cari Santri</Label>
              <Input
                id="search"
                placeholder="Nama, NIS, atau WhatsApp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kategori">Kategori</Label>
              <Select value={filterKategori} onValueChange={setFilterKategori}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  <SelectItem value="Reguler">Reguler</SelectItem>
                  <SelectItem value="Binaan Mukim">Binaan Mukim</SelectItem>
                  <SelectItem value="Binaan Non-Mukim">Binaan Non-Mukim</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status Anak</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="Yatim">Yatim</SelectItem>
                  <SelectItem value="Piatu">Piatu</SelectItem>
                  <SelectItem value="Yatim Piatu">Yatim Piatu</SelectItem>
                  <SelectItem value="Dhuafa">Dhuafa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setFilterKategori("all");
                  setFilterStatus("all");
                }}
                className="w-full"
              >
                <Filter className="w-4 h-4 mr-2" />
                Reset Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Daftar Santri</span>
            <Badge variant="secondary">
              {filteredData.length} dari {santriData.length} santri
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Memuat data...
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {santriData.length === 0 ? "Belum ada data santri" : "Tidak ada data yang sesuai dengan filter"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Nama Lengkap</th>
                    <th className="text-left p-3 font-medium">NIS</th>
                    <th className="text-left p-3 font-medium">Kategori</th>
                    <th className="text-left p-3 font-medium">Status Anak</th>
                    <th className="text-left p-3 font-medium">Dokumen</th>
                    <th className="text-left p-3 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((santri, index) => (
                    <tr key={`${santri.id}-${index}`} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{santri.nama_lengkap}</div>
                          <div className="text-sm text-muted-foreground">{santri.no_whatsapp || 'Tidak ada WhatsApp'}</div>
                        </div>
                      </td>
                      <td className="p-3">{santri.nik || santri.nis}</td>
                      <td className="p-3">
                        <Badge variant="outline">{santri.kategori}</Badge>
                      </td>
                      <td className="p-3">
                        <Badge 
                          variant={santri.status_anak === 'Yatim' || santri.status_anak === 'Piatu' || santri.status_anak === 'Yatim Piatu' ? 'destructive' : 'secondary'}
                        >
                          {santri.status_anak || 'Normal'}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`w-2 h-2 rounded-full ${getCompletenessColor(santri.total_dokumen_valid || 0, santri.total_dokumen_required || 0)}`}></div>
                              <span className="text-sm font-medium">
                                {santri.total_dokumen_valid || 0}/{santri.total_dokumen_required || 0}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {getCompletenessText(santri.total_dokumen_valid || 0, santri.total_dokumen_required || 0)}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              dokumen valid
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditSantri(santri)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewProfile(santri)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSantri(santri.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Forms */}
      {showForm && (
        <SantriForm
          santriId={editingSantri?.id}
          onSave={() => {
            // SantriForm will handle the save internally
            refreshData();
          }}
          onClose={() => {
            setShowForm(false);
            setEditingSantri(null);
          }}
        />
      )}

      {showUploadDialog && selectedSantriForUpload && (
        <UploadDokumenSantri
          santriId={selectedSantriForUpload.id}
          kategori={selectedSantriForUpload.kategori}
          statusAnak={selectedSantriForUpload.status_anak || ''}
          onUploadComplete={() => {
            refreshData();
          }}
        />
      )}

      {showDetailView && selectedSantriForDetail && (
        <SantriDetailView
          santriId={selectedSantriForDetail.id}
          onClose={() => {
            setShowDetailView(false);
            setSelectedSantriForDetail(null);
          }}
          onEdit={() => {
            setShowDetailView(false);
            handleEditSantri(selectedSantriForDetail);
          }}
        />
      )}
    </div>
  );
}
