import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, RefreshCw, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import DonorDataTable from '@/modules/donasi/admin/components/donor/DonorDataTable';
import DonorFormDialog from '@/modules/donasi/admin/components/donor/DonorFormDialog';
import { DonorService, type DonorStatistics, type Donor, type JenisDonatur } from '@/modules/donasi/services/donor.service';

const MasterDonatur: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [donors, setDonors] = useState<DonorStatistics[]>([]);
  const [filteredDonors, setFilteredDonors] = useState<DonorStatistics[]>([]);
  
  // UI States
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingDonor, setEditingDonor] = useState<Donor | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterJenis, setFilterJenis] = useState<JenisDonatur | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | boolean>('all');

  useEffect(() => {
    loadDonors();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [donors, searchQuery, filterJenis, filterStatus]);

  const loadDonors = async () => {
    try {
      setLoading(true);
      const data = await DonorService.getDonorsWithStatistics({
        search: searchQuery || undefined,
        jenis_donatur: filterJenis !== 'all' ? filterJenis : undefined,
        status_aktif: filterStatus !== 'all' ? filterStatus : undefined
      });
      setDonors(data);
    } catch (error: any) {
      console.error('Error loading donors:', error);
      toast.error('Gagal memuat data donatur');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...donors];

    // Search filter (additional client-side filtering if needed)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d =>
        d.nama_lengkap?.toLowerCase().includes(query) ||
        d.nama_panggilan?.toLowerCase().includes(query) ||
        d.nomor_telepon?.toLowerCase().includes(query) ||
        d.email?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(d => d.status_aktif === filterStatus);
    }

    setFilteredDonors(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDonors();
    setRefreshing(false);
    toast.success('Data berhasil diperbarui');
  };

  const handleAddDonor = () => {
    setEditingDonor(null);
    setShowFormDialog(true);
  };

  const handleEditDonor = (donor: DonorStatistics) => {
    // Convert DonorStatistics to Donor type for editing
    // Note: DonorStatistics extends Donor, so it should have all Donor fields
    const donorForEdit: Donor = {
      id: donor.id,
      nama_lengkap: donor.nama_lengkap,
      nama_panggilan: donor.nama_panggilan || undefined,
      nomor_telepon: donor.nomor_telepon || undefined,
      email: donor.email || undefined,
      alamat: donor.alamat || undefined,
      jenis_donatur: donor.jenis_donatur,
      status_aktif: donor.status_aktif,
      catatan: donor.catatan || undefined,
      created_at: donor.created_at,
      updated_at: donor.updated_at
    };
    setEditingDonor(donorForEdit);
    setShowFormDialog(true);
  };

  const handleDialogClose = (open: boolean) => {
    setShowFormDialog(open);
    if (!open) {
      // Reset editing donor when dialog closes
      setEditingDonor(null);
    }
  };

  const handleDeleteDonor = async (donor: DonorStatistics) => {
    if (!confirm(`Apakah Anda yakin ingin menonaktifkan donatur ${donor.nama_lengkap}?`)) {
      return;
    }

    try {
      await DonorService.deleteDonor(donor.id);
      toast.success('Donatur berhasil dinonaktifkan');
      await loadDonors();
    } catch (error: any) {
      console.error('Error deleting donor:', error);
      toast.error(error.message || 'Gagal menonaktifkan donatur');
    }
  };

  const handleFormSuccess = async () => {
    await loadDonors();
  };

  if (loading && donors.length === 0) {
    return (
      <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <span>Donasi</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Master Donatur</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">
            Master Donatur
          </h1>
          <p className="text-sm text-gray-500">
            Kelola data donatur yayasan untuk tracking dan analisis donasi
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 h-9"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleAddDonor}
            className="bg-slate-600 hover:bg-slate-700 text-white h-9 shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Donatur
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari donatur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Jenis Donatur Filter */}
          <Select value={filterJenis} onValueChange={(v) => setFilterJenis(v as JenisDonatur | 'all')}>
            <SelectTrigger>
              <SelectValue placeholder="Jenis Donatur" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Jenis</SelectItem>
              <SelectItem value="individu">Individu</SelectItem>
              <SelectItem value="perusahaan">Perusahaan</SelectItem>
              <SelectItem value="yayasan">Yayasan</SelectItem>
              <SelectItem value="komunitas">Komunitas</SelectItem>
              <SelectItem value="lembaga">Lembaga</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select 
            value={filterStatus === 'all' ? 'all' : filterStatus.toString()} 
            onValueChange={(v) => setFilterStatus(v === 'all' ? 'all' : v === 'true')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="true">Aktif</SelectItem>
              <SelectItem value="false">Non-Aktif</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Menampilkan {filteredDonors.length} dari {donors.length} donatur
      </div>

      {/* Donors Table */}
      {filteredDonors.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Filter className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Tidak ada donatur ditemukan
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {donors.length === 0
              ? 'Mulai dengan menambahkan donatur baru'
              : 'Coba ubah filter pencarian Anda'}
          </p>
          {donors.length === 0 && (
            <Button onClick={handleAddDonor} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Donatur Pertama
            </Button>
          )}
        </div>
      ) : (
        <DonorDataTable
          donors={filteredDonors}
          loading={loading}
          onEdit={handleEditDonor}
          onDelete={handleDeleteDonor}
        />
      )}

      {/* Form Dialog */}
      <DonorFormDialog
        open={showFormDialog}
        onOpenChange={handleDialogClose}
        onSuccess={handleFormSuccess}
        editingDonor={editingDonor}
      />
    </div>
  );
};

export default MasterDonatur;

