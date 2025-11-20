import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserManagementService, UserWithRoles, AppRole, CreateUserInput } from '@/services/userManagement.service';
import { supabase } from '@/integrations/supabase/client';
import { AkademikKelasService, KelasMaster } from '@/services/akademikKelas.service';
import { AkademikAgendaService, AkademikAgenda } from '@/services/akademikAgenda.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Shield,
  BookOpen,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Key,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  GraduationCap,
  UserCog,
  BarChart3,
  ClipboardList,
  ClipboardCheck,
  FileText,
  ExternalLink,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ROLE_OPTIONS: { value: AppRole; label: string; description: string }[] = [
  { value: 'admin', label: 'Admin', description: 'Akses penuh ke semua modul' },
  { value: 'admin_keuangan', label: 'Admin Keuangan', description: 'Akses ke modul keuangan, pembayaran, tabungan' },
  { value: 'admin_inventaris', label: 'Admin Inventaris', description: 'Akses ke modul inventaris, distribusi, penjualan' },
  { value: 'admin_akademik', label: 'Admin Akademik', description: 'Akses ke modul akademik, santri, monitoring' },
  { value: 'pengurus', label: 'Pengurus', description: 'Akses read-only ke semua modul' },
  { value: 'pengajar', label: 'Pengajar', description: 'Pengajar yang dapat di-assign ke kelas dan agenda' },
  { value: 'santri', label: 'Santri', description: 'Akses terbatas ke dashboard dan tabungan' },
];

const UserManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.roles?.includes('admin');

  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<AppRole | 'all'>('all');
  const [viewMode, setViewMode] = useState<'dashboard' | 'table'>('dashboard');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'Aktif' | 'Non-Aktif' | 'Alumni'>('Aktif');
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [generateMassalDialogOpen, setGenerateMassalDialogOpen] = useState(false);
  const [isGeneratingMassal, setIsGeneratingMassal] = useState(false);
  const [generateMassalResults, setGenerateMassalResults] = useState<{
    total: number;
    success: number;
    failed: number;
    results: Array<{
      santri_id: string;
      id_santri: string;
      nama_lengkap: string;
      success: boolean;
      message: string;
      username?: string;
      password?: string;
    }>;
  } | null>(null);
  
  // Form states
  const [formData, setFormData] = useState<CreateUserInput>({
    email: '',
    password: '',
    full_name: '',
    roles: [],
    createPengajar: false,
    pengajarData: {
      nama_lengkap: '',
      kode_pengajar: '',
      program_spesialisasi: [],
      kontak: '',
    },
  });

  // Assign states
  const [kelasList, setKelasList] = useState<KelasMaster[]>([]);
  const [agendaList, setAgendaList] = useState<AkademikAgenda[]>([]);
  const [selectedKelasId, setSelectedKelasId] = useState<string>('');
  const [selectedAgendaId, setSelectedAgendaId] = useState<string>('');
  const [selectedPengajarId, setSelectedPengajarId] = useState<string>('');

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      console.log('[UserManagementPage] Loading users...');
      const data = await UserManagementService.listUsers();
      console.log('[UserManagementPage] Users loaded:', data?.length || 0);
      setUsers(data || []);
    } catch (error: any) {
      console.error('[UserManagementPage] Error loading users:', error);
      toast.error(error.message || 'Gagal memuat daftar user');
      // Set empty array sebagai fallback
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadKelas = useCallback(async () => {
    try {
      const data = await AkademikKelasService.listKelas();
      setKelasList(data);
    } catch (error: any) {
      console.error('Error loading kelas:', error);
    }
  }, []);

  const loadAgenda = useCallback(async (kelasId?: string) => {
    try {
      if (kelasId) {
        const data = await AkademikAgendaService.listAgendaByKelas(kelasId);
        setAgendaList(data);
      } else {
        const data = await AkademikAgendaService.listAgenda();
        setAgendaList(data);
      }
    } catch (error: any) {
      console.error('Error loading agenda:', error);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
      loadKelas();
    }
  }, [isAdmin, loadUsers, loadKelas]);

  useEffect(() => {
    if (selectedKelasId) {
      loadAgenda(selectedKelasId);
    }
  }, [selectedKelasId, loadAgenda]);

  const handleCreateUser = async () => {
    if (!formData.email || !formData.password || !formData.full_name || formData.roles.length === 0) {
      toast.error('Mohon lengkapi semua field yang wajib');
      return;
    }

    // Validasi khusus untuk role pengajar
    if (formData.roles.includes('pengajar')) {
      if (!formData.pengajarData?.nama_lengkap || formData.pengajarData.nama_lengkap.trim() === '') {
        toast.error('Jika memilih role Pengajar, nama pengajar wajib diisi');
        return;
      }
    }

    try {
      await UserManagementService.createUser(formData);
      toast.success('User berhasil dibuat');
      setCreateDialogOpen(false);
      setFormData({
        email: '',
        password: '',
        full_name: '',
        roles: [],
        createPengajar: false,
        pengajarData: {
          nama_lengkap: '',
          kode_pengajar: '',
          program_spesialisasi: [],
          kontak: '',
        },
      });
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || 'Gagal membuat user');
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      await UserManagementService.updateUser(selectedUser.id, {
        full_name: formData.full_name,
        email: formData.email !== selectedUser.email ? formData.email : undefined,
        roles: formData.roles,
      });
      toast.success('User berhasil diperbarui');
      setEditDialogOpen(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || 'Gagal memperbarui user');
    }
  };

  const handleUpdatePassword = async () => {
    if (!selectedUser || !newPassword) {
      toast.error('Password baru wajib diisi');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }

    try {
      await UserManagementService.updateUser(selectedUser.id, {
        password: newPassword,
      });
      toast.success('Password berhasil diubah');
      setPasswordDialogOpen(false);
      setSelectedUser(null);
      setNewPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengubah password');
    }
  };

  const handleUpdateSantriStatus = async () => {
    if (!selectedUser || !selectedUser.santri) {
      toast.error('User tidak memiliki data santri');
      return;
    }

    try {
      await UserManagementService.updateSantriStatus(selectedUser.santri.id, selectedStatus);
      toast.success('Status santri berhasil diubah');
      setStatusDialogOpen(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengubah status santri');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus user "${userName}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    try {
      await UserManagementService.deleteUser(userId);
      toast.success('User berhasil dihapus');
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus user');
    }
  };

  const handleAssignPengajar = async () => {
    if (!selectedPengajarId) {
      toast.error('Pilih pengajar terlebih dahulu');
      return;
    }

    try {
      if (selectedKelasId) {
        // Assign ke semua agenda di kelas
        await UserManagementService.assignPengajarToKelas({
          pengajar_id: selectedPengajarId,
          kelas_id: selectedKelasId,
        });
        toast.success('Pengajar berhasil diassign ke kelas');
      } else if (selectedAgendaId) {
        // Assign ke agenda spesifik
        await UserManagementService.assignPengajarToAgenda({
          pengajar_id: selectedPengajarId,
          agenda_id: selectedAgendaId,
        });
        toast.success('Pengajar berhasil diassign ke agenda');
      } else {
        toast.error('Pilih kelas atau agenda terlebih dahulu');
        return;
      }

      setAssignDialogOpen(false);
      setSelectedKelasId('');
      setSelectedAgendaId('');
      setSelectedPengajarId('');
    } catch (error: any) {
      toast.error(error.message || 'Gagal assign pengajar');
    }
  };

  const handleGenerateMassal = async () => {
    try {
      setIsGeneratingMassal(true);
      const results = await UserManagementService.generateAccountsForAllSantri();
      setGenerateMassalResults(results);
      
      if (results.success > 0) {
        toast.success(`Berhasil membuat ${results.success} akun dari ${results.total} santri`);
        loadUsers(); // Refresh user list
      }
      
      if (results.failed > 0) {
        toast.warning(`${results.failed} akun gagal dibuat. Lihat detail di dialog.`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal generate akun massal');
    } finally {
      setIsGeneratingMassal(false);
    }
  };

  const toggleRole = (role: AppRole) => {
    setFormData(prev => {
      const newRoles = prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role];
      
      // Jika memilih role 'pengajar', otomatis centang "Buat Data Pengajar"
      // Jika uncheck role 'pengajar', uncheck juga "Buat Data Pengajar"
      const shouldCreatePengajar = newRoles.includes('pengajar');
      
      return {
        ...prev,
        roles: newRoles,
        createPengajar: shouldCreatePengajar ? true : (role === 'pengajar' ? false : prev.createPengajar),
      };
    });
  };

  // Auto-generate kode_pengajar
  const generateKodePengajar = useCallback(async () => {
    if (!formData.createPengajar || !formData.pengajarData?.nama_lengkap) {
      return;
    }
    
    if (formData.pengajarData.kode_pengajar) {
      return; // Sudah ada kode, jangan generate ulang
    }
    
    try {
      // Ambil jumlah pengajar terakhir untuk generate kode
      const { data: lastPengajar } = await supabase
        .from('akademik_pengajar')
        .select('kode_pengajar')
        .not('kode_pengajar', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let nextNumber = 1;
      if (lastPengajar?.kode_pengajar) {
        const match = lastPengajar.kode_pengajar.match(/\d+$/);
        if (match) {
          nextNumber = parseInt(match[0]) + 1;
        }
      }

      const kode = `UST${nextNumber.toString().padStart(3, '0')}`;
      setFormData(prev => ({
        ...prev,
        pengajarData: {
          ...prev.pengajarData!,
          kode_pengajar: kode,
        },
      }));
    } catch (error) {
      // Ignore error, use default
      const kode = 'UST001';
      setFormData(prev => ({
        ...prev,
        pengajarData: {
          ...prev.pengajarData!,
          kode_pengajar: kode,
        },
      }));
    }
  }, [formData.createPengajar, formData.pengajarData?.nama_lengkap, formData.pengajarData?.kode_pengajar]);

  useEffect(() => {
    if (formData.createPengajar && 
        formData.roles.includes('pengajar') && 
        formData.pengajarData?.nama_lengkap && 
        !formData.pengajarData?.kode_pengajar) {
      generateKodePengajar();
    }
  }, [formData.createPengajar, formData.roles, formData.pengajarData?.nama_lengkap, formData.pengajarData?.kode_pengajar, generateKodePengajar]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalUsers = users.length;
    const santriUsers = users.filter(u => u.santri);
    const pengajarUsers = users.filter(u => u.pengajar);
    const adminUsers = users.filter(u => u.roles.includes('admin'));
    const pengurusUsers = users.filter(u => 
      ['admin_keuangan', 'admin_inventaris', 'admin_akademik', 'pengurus'].some(r => u.roles.includes(r as AppRole))
    );

    return {
      totalUsers,
      totalSantri: santriUsers.length,
      santriAktif: santriUsers.filter(u => u.santri?.status_santri === 'Aktif').length,
      santriNonAktif: santriUsers.filter(u => u.santri?.status_santri === 'Non-Aktif').length,
      santriAlumni: santriUsers.filter(u => u.santri?.status_santri === 'Alumni').length,
      santriPutra: santriUsers.filter(u => u.santri?.jenis_kelamin === 'Laki-laki').length,
      santriPutri: santriUsers.filter(u => u.santri?.jenis_kelamin === 'Perempuan').length,
      totalPengajar: pengajarUsers.length,
      pengajarAktif: pengajarUsers.filter(u => u.pengajar?.status === 'Aktif').length,
      pengajarNonAktif: pengajarUsers.filter(u => u.pengajar?.status === 'Non-Aktif').length,
      totalAdmin: adminUsers.length,
      totalPengurus: pengurusUsers.length,
    };
  }, [users]);

  const filteredUsers = users.filter(u => {
    // Filter by role
    if (filterRole !== 'all' && !u.roles.includes(filterRole)) {
      return false;
    }

    // Filter by search term
    const matchesSearch = 
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.pengajar?.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.santri?.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.santri?.id_santri.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 flex flex-col items-center justify-center gap-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Akses Ditolak</h2>
              <p className="text-muted-foreground">
                Hanya Administrator yang dapat mengakses halaman Kelola User.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter users berdasarkan activeFilter
  const getFilteredUsersByCategory = () => {
    if (!activeFilter) return filteredUsers;

    switch (activeFilter) {
      case 'santri-aktif':
        return filteredUsers.filter(u => u.santri?.status_santri === 'Aktif');
      case 'santri-nonaktif':
        return filteredUsers.filter(u => u.santri?.status_santri === 'Non-Aktif');
      case 'santri-alumni':
        return filteredUsers.filter(u => u.santri?.status_santri === 'Alumni');
      case 'santri-putra':
        return filteredUsers.filter(u => u.santri && u.santri.jenis_kelamin === 'Laki-laki');
      case 'santri-putri':
        return filteredUsers.filter(u => u.santri && u.santri.jenis_kelamin === 'Perempuan');
      case 'pengajar':
        return filteredUsers.filter(u => u.roles.includes('pengajar'));
      case 'pengajar-aktif':
        return filteredUsers.filter(u => u.pengajar?.status === 'Aktif');
      case 'admin':
        return filteredUsers.filter(u => u.roles.includes('admin'));
      case 'pengurus':
        return filteredUsers.filter(u => 
          ['admin_keuangan', 'admin_inventaris', 'admin_akademik', 'pengurus'].some(r => u.roles.includes(r as AppRole))
        );
      default:
        return filteredUsers;
    }
  };

  const displayUsers = activeFilter ? getFilteredUsersByCategory() : filteredUsers;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Kelola User</h1>
          <p className="text-muted-foreground">
            Dashboard eksekutif untuk master data akun user, pengajar, dan pengurus. Kelola profil, role, password, dan monitoring.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={viewMode === 'dashboard' ? 'default' : 'outline'}
            onClick={() => {
              setViewMode('dashboard');
              setActiveFilter(null);
            }}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <Button 
            variant={viewMode === 'table' ? 'default' : 'outline'}
            onClick={() => {
              setViewMode('table');
              setActiveFilter(null);
            }}
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            Tabel
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Tambah User
          </Button>
          <Button 
            variant="outline" 
            onClick={async () => {
              try {
                const santriList = await UserManagementService.getSantriWithoutAccounts();
                if (santriList.length === 0) {
                  toast.info('Semua santri sudah memiliki akun');
                  return;
                }
                setGenerateMassalDialogOpen(true);
              } catch (error: any) {
                toast.error(error.message || 'Gagal memuat daftar santri');
              }
            }}
          >
            <Users className="w-4 h-4 mr-2" />
            Generate Akun Massal
          </Button>
        </div>
      </div>

      {viewMode === 'dashboard' && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Users */}
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                setViewMode('table');
                setActiveFilter(null);
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total User</p>
                    <p className="text-2xl font-bold">{statistics.totalUsers}</p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Santri */}
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                setViewMode('table');
                setActiveFilter('santri-aktif');
                setFilterRole('santri');
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Santri</p>
                    <p className="text-2xl font-bold">{statistics.totalSantri}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {statistics.santriAktif} Aktif • {statistics.santriNonAktif} Non-Aktif • {statistics.santriAlumni} Alumni
                    </p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <GraduationCap className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Pengajar */}
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                setViewMode('table');
                setActiveFilter('pengajar');
                setFilterRole('pengajar');
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Pengajar</p>
                    <p className="text-2xl font-bold">{statistics.totalPengajar}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {statistics.pengajarAktif} Aktif • {statistics.pengajarNonAktif} Non-Aktif
                    </p>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <BookOpen className="w-6 h-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Admin & Pengurus */}
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                setViewMode('table');
                setActiveFilter('admin');
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Admin & Pengurus</p>
                    <p className="text-2xl font-bold">{statistics.totalAdmin + statistics.totalPengurus}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {statistics.totalAdmin} Admin • {statistics.totalPengurus} Pengurus
                    </p>
                  </div>
                  <div className="p-3 bg-purple-500/10 rounded-lg">
                    <UserCog className="w-6 h-6 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter Cards - Santri */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Data Santri
              </CardTitle>
              <CardDescription>Klik untuk melihat daftar santri berdasarkan kategori</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary"
                  onClick={() => {
                    setViewMode('table');
                    setActiveFilter('santri-aktif');
                    setFilterRole('santri');
                  }}
                >
                  <CardContent className="p-4 text-center">
                    <UserCheck className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <p className="text-sm font-medium">Santri Aktif</p>
                    <p className="text-2xl font-bold text-green-600">{statistics.santriAktif}</p>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-red-500"
                  onClick={() => {
                    setViewMode('table');
                    setActiveFilter('santri-nonaktif');
                    setFilterRole('santri');
                  }}
                >
                  <CardContent className="p-4 text-center">
                    <UserX className="w-8 h-8 mx-auto mb-2 text-red-500" />
                    <p className="text-sm font-medium">Santri Non-Aktif</p>
                    <p className="text-2xl font-bold text-red-600">{statistics.santriNonAktif}</p>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-500"
                  onClick={() => {
                    setViewMode('table');
                    setActiveFilter('santri-alumni');
                    setFilterRole('santri');
                  }}
                >
                  <CardContent className="p-4 text-center">
                    <GraduationCap className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                    <p className="text-sm font-medium">Alumni</p>
                    <p className="text-2xl font-bold text-blue-600">{statistics.santriAlumni}</p>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-indigo-500"
                  onClick={() => {
                    setViewMode('table');
                    setActiveFilter('santri-putra');
                    setFilterRole('santri');
                  }}
                >
                  <CardContent className="p-4 text-center">
                    <Users className="w-8 h-8 mx-auto mb-2 text-indigo-500" />
                    <p className="text-sm font-medium">Santri Putra</p>
                    <p className="text-2xl font-bold text-indigo-600">{statistics.santriPutra}</p>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-pink-500"
                  onClick={() => {
                    setViewMode('table');
                    setActiveFilter('santri-putri');
                    setFilterRole('santri');
                  }}
                >
                  <CardContent className="p-4 text-center">
                    <Users className="w-8 h-8 mx-auto mb-2 text-pink-500" />
                    <p className="text-sm font-medium">Santri Putri</p>
                    <p className="text-2xl font-bold text-pink-600">{statistics.santriPutri}</p>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary"
                  onClick={() => {
                    setViewMode('table');
                    setActiveFilter(null);
                    setFilterRole('santri');
                  }}
                >
                  <CardContent className="p-4 text-center">
                    <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <p className="text-sm font-medium">Semua Santri</p>
                    <p className="text-2xl font-bold">{statistics.totalSantri}</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Filter Cards - Pengajar & Admin */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Data Pengajar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Card 
                    className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-green-500"
                    onClick={() => {
                      setViewMode('table');
                      setActiveFilter('pengajar-aktif');
                      setFilterRole('pengajar');
                    }}
                  >
                    <CardContent className="p-4 text-center">
                      <UserCheck className="w-8 h-8 mx-auto mb-2 text-green-500" />
                      <p className="text-sm font-medium">Pengajar Aktif</p>
                      <p className="text-2xl font-bold text-green-600">{statistics.pengajarAktif}</p>
                    </CardContent>
                  </Card>

                  <Card 
                    className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary"
                    onClick={() => {
                      setViewMode('table');
                      setActiveFilter('pengajar');
                      setFilterRole('pengajar');
                    }}
                  >
                    <CardContent className="p-4 text-center">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm font-medium">Semua Pengajar</p>
                      <p className="text-2xl font-bold">{statistics.totalPengajar}</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="w-5 h-5" />
                  Admin & Pengurus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Card 
                    className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-purple-500"
                    onClick={() => {
                      setViewMode('table');
                      setActiveFilter('admin');
                    }}
                  >
                    <CardContent className="p-4 text-center">
                      <Shield className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                      <p className="text-sm font-medium">Admin</p>
                      <p className="text-2xl font-bold text-purple-600">{statistics.totalAdmin}</p>
                    </CardContent>
                  </Card>

                  <Card 
                    className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-orange-500"
                    onClick={() => {
                      setViewMode('table');
                      setActiveFilter('pengurus');
                    }}
                  >
                    <CardContent className="p-4 text-center">
                      <UserCog className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                      <p className="text-sm font-medium">Pengurus</p>
                      <p className="text-2xl font-bold text-orange-600">{statistics.totalPengurus}</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
            <div>
              <CardTitle>Daftar User</CardTitle>
              <CardDescription>
                {activeFilter 
                  ? `Menampilkan: ${activeFilter.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`
                  : 'Master data semua akun user, pengajar, dan pengurus'
                }
              </CardDescription>
            </div>
            {activeFilter && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setActiveFilter(null);
                  setFilterRole('all');
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Hapus Filter
              </Button>
            )}
          </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Cari user berdasarkan email, nama, atau nama pengajar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 max-w-md"
              />
              <Select value={filterRole} onValueChange={(value) => setFilterRole(value as AppRole | 'all')}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter berdasarkan role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Role</SelectItem>
                  {ROLE_OPTIONS.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="py-10 flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Memuat data...
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pengajar</TableHead>
                    <TableHead>Tanggal Dibuat</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        {activeFilter 
                          ? `Tidak ada user ditemukan untuk filter: ${activeFilter.replace(/-/g, ' ')}`
                          : 'Tidak ada user ditemukan'
                        }
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{u.full_name || u.email}</div>
                            <div className="text-sm text-muted-foreground">{u.email}</div>
                            {u.username && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Username: <span className="font-mono">{u.username}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {u.santri ? (
                          <div>
                            <Badge variant="outline" className="font-mono">
                              {u.santri.id_santri}
                            </Badge>
                          </div>
                        ) : u.pengajar?.kode_pengajar ? (
                          <div>
                            <Badge variant="outline" className="font-mono">
                              {u.pengajar.kode_pengajar}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                          {u.roles.map((role) => (
                            <Badge key={role} variant="secondary">
                              {ROLE_OPTIONS.find(r => r.value === role)?.label || role}
                            </Badge>
                          ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {u.santri ? (
                          <Badge 
                            variant="outline" 
                            className={
                              u.santri.status_santri === 'Aktif' 
                                ? 'bg-green-50 text-green-800 border-green-200' 
                                : u.santri.status_santri === 'Non-Aktif'
                                ? 'bg-red-50 text-red-800 border-red-200'
                                : 'bg-blue-50 text-blue-800 border-blue-200'
                            }
                          >
                            {u.santri.status_santri}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                        </TableCell>
                        <TableCell>
                          {u.pengajar ? (
                          <Badge variant="outline" className="bg-blue-50">
                            <BookOpen className="w-3 h-3 mr-1" />
                            {u.pengajar.nama_lengkap}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                        </TableCell>
                        <TableCell>
                          {new Date(u.created_at).toLocaleDateString('id-ID')}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(u);
                                  setViewDialogOpen(true);
                                }}
                              >
                                <Users className="w-4 h-4 mr-2" />
                                View Detail
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(u);
                                  setFormData({
                                  email: u.email,
                                  password: '',
                                  full_name: u.full_name || '',
                                  roles: u.roles,
                                  createPengajar: false,
                                  pengajarData: {
                                    nama_lengkap: '',
                                    kode_pengajar: '',
                                    program_spesialisasi: [],
                                    kontak: '',
                                  },
                                });
                                setEditDialogOpen(true);
                              }}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Kelola Akun
                              </DropdownMenuItem>
                              {u.santri && (
                                <React.Fragment>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      navigate(`/santri/profile?santriId=${u.santri!.id}`);
                                    }}
                                  >
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Lihat Profil Santri
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      navigate(`/akademik/presensi?santriId=${u.santri!.id}`);
                                    }}
                                  >
                                    <ClipboardCheck className="w-4 h-4 mr-2" />
                                    Monitoring Absensi
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedUser(u);
                                      setSelectedStatus(u.santri!.status_santri);
                                      setStatusDialogOpen(true);
                                    }}
                                  >
                                    <Shield className="w-4 h-4 mr-2" />
                                    Edit Status Santri
                                  </DropdownMenuItem>
                                </React.Fragment>
                              )}
                              {u.pengajar && (
                                <React.Fragment>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      navigate(`/akademik/pengajar/profil?pengajarId=${u.pengajar!.id}`);
                                    }}
                                  >
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Lihat Profil Pengajar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      navigate(`/akademik/presensi?pengajarId=${u.pengajar!.id}`);
                                    }}
                                  >
                                    <ClipboardCheck className="w-4 h-4 mr-2" />
                                    Monitoring Absensi
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedPengajarId(u.pengajar!.id);
                                      setAssignDialogOpen(true);
                                    }}
                                  >
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Assign ke Kelas/Agenda
                                  </DropdownMenuItem>
                                </React.Fragment>
                              )}
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(u);
                                  setNewPassword('');
                                  setPasswordDialogOpen(true);
                                }}
                              >
                                <Key className="w-4 h-4 mr-2" />
                                Ubah Password
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteUser(u.id, u.full_name || u.email)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Hapus User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah User Baru</DialogTitle>
            <DialogDescription>
              Buat akun user baru dan assign role. Jika user adalah pengajar, centang "Buat Data Pengajar".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Password *</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Minimal 6 karakter"
              />
            </div>
            <div className="space-y-2">
              <Label>Nama Lengkap *</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Nama lengkap user"
              />
            </div>
            <div className="space-y-2">
              <Label>Roles *</Label>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.map((role) => (
                  <div key={role.value} className="flex items-start space-x-2 p-2 border rounded">
                    <Checkbox
                      checked={formData.roles.includes(role.value)}
                      onCheckedChange={() => toggleRole(role.value)}
                    />
                    <div className="flex-1">
                      <Label className="font-medium cursor-pointer">{role.label}</Label>
                      <p className="text-xs text-muted-foreground">{role.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={formData.createPengajar}
                disabled={formData.roles.includes('pengajar')}
                onCheckedChange={(checked) =>
                  setFormData(prev => ({ ...prev, createPengajar: checked as boolean }))
                }
              />
              <Label className={formData.roles.includes('pengajar') ? 'text-muted-foreground' : ''}>
                Buat Data Pengajar untuk User Ini
                {formData.roles.includes('pengajar') && (
                  <span className="text-xs text-muted-foreground ml-1">(Otomatis aktif untuk role Pengajar)</span>
                )}
              </Label>
            </div>
            {formData.createPengajar && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <div className="space-y-2">
                  <Label>Nama Pengajar *</Label>
                  <Input
                    value={formData.pengajarData?.nama_lengkap || ''}
                    onChange={(e) =>
                      setFormData(prev => ({
                        ...prev,
                        pengajarData: { ...prev.pengajarData!, nama_lengkap: e.target.value },
                      }))
                    }
                    placeholder="Nama lengkap pengajar"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kode Pengajar</Label>
                  <Input
                    value={formData.pengajarData?.kode_pengajar || ''}
                    onChange={(e) =>
                      setFormData(prev => ({
                        ...prev,
                        pengajarData: { ...prev.pengajarData!, kode_pengajar: e.target.value },
                      }))
                    }
                    placeholder="Kode unik pengajar (opsional)"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kontak</Label>
                  <Input
                    value={formData.pengajarData?.kontak || ''}
                    onChange={(e) =>
                      setFormData(prev => ({
                        ...prev,
                        pengajarData: { ...prev.pengajarData!, kontak: e.target.value },
                      }))
                    }
                    placeholder="No. WhatsApp atau email"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleCreateUser}>
              <UserPlus className="w-4 h-4 mr-2" />
              Buat User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update informasi user dan roles
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="user@example.com"
              />
              <p className="text-xs text-muted-foreground">
                Email dapat diubah. User akan login dengan email baru.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Nama Lengkap *</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Nama lengkap user"
              />
            </div>
            <div className="space-y-2">
              <Label>Roles *</Label>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.map((role) => (
                  <div key={role.value} className="flex items-start space-x-2 p-2 border rounded">
                    <Checkbox
                      checked={formData.roles.includes(role.value)}
                      onCheckedChange={() => toggleRole(role.value)}
                    />
                    <div className="flex-1">
                      <Label className="font-medium cursor-pointer">{role.label}</Label>
                      <p className="text-xs text-muted-foreground">{role.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleUpdateUser}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Password</DialogTitle>
            <DialogDescription>
              Ubah password untuk user: {selectedUser?.full_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Password Baru *</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
              />
              <p className="text-xs text-muted-foreground">
                Password minimal 6 karakter
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setPasswordDialogOpen(false);
              setNewPassword('');
              setSelectedUser(null);
            }}>
              Batal
            </Button>
            <Button onClick={handleUpdatePassword} disabled={!newPassword || newPassword.length < 6}>
              <Key className="w-4 h-4 mr-2" />
              Ubah Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Detail Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail User</DialogTitle>
            <DialogDescription>
              Informasi lengkap user dan akun
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Nama Lengkap</Label>
                  <p className="text-sm">{selectedUser.full_name || '-'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <p className="text-sm">{selectedUser.email}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Username</Label>
                  <p className="text-sm">{selectedUser.username || '-'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Roles</Label>
                  <div className="flex flex-wrap gap-1">
                    {selectedUser.roles.map((role) => (
                      <Badge key={role} variant="secondary">
                        {ROLE_OPTIONS.find(r => r.value === role)?.label || role}
                      </Badge>
                    ))}
                  </div>
                </div>
                {selectedUser.password_plain && (
                  <div className="space-y-2 col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground">Password</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={selectedUser.password_plain}
                        readOnly
                        className="font-mono"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Password ini dapat dilihat oleh admin untuk membantu user yang lupa password
                    </p>
                  </div>
                )}
                {selectedUser.santri && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">ID Santri</Label>
                      <p className="text-sm font-mono">{selectedUser.santri.id_santri}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Status Santri</Label>
                      <Badge 
                        variant="outline" 
                        className={
                          selectedUser.santri.status_santri === 'Aktif' 
                            ? 'bg-green-50 text-green-800 border-green-200' 
                            : selectedUser.santri.status_santri === 'Non-Aktif'
                            ? 'bg-red-50 text-red-800 border-red-200'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }
                      >
                        {selectedUser.santri.status_santri}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Kategori</Label>
                      <p className="text-sm">{selectedUser.santri.kategori}</p>
                    </div>
                  </>
                )}
                {selectedUser.pengajar && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Nama Pengajar</Label>
                      <p className="text-sm">{selectedUser.pengajar.nama_lengkap}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Kode Pengajar</Label>
                      <p className="text-sm font-mono">{selectedUser.pengajar.kode_pengajar || '-'}</p>
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Tanggal Dibuat</Label>
                  <p className="text-sm">{new Date(selectedUser.created_at).toLocaleString('id-ID')}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Terakhir Diupdate</Label>
                  <p className="text-sm">{new Date(selectedUser.updated_at).toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Status Santri Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Status Santri</DialogTitle>
            <DialogDescription>
              Ubah status untuk: {selectedUser?.santri?.nama_lengkap || selectedUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Status Santri *</Label>
              <Select 
                value={selectedUser?.santri?.status_santri || selectedStatus} 
                onValueChange={(value) => setSelectedStatus(value as 'Aktif' | 'Non-Aktif' | 'Alumni')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aktif">Aktif</SelectItem>
                  <SelectItem value="Non-Aktif">Non-Aktif</SelectItem>
                  <SelectItem value="Alumni">Alumni</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setStatusDialogOpen(false);
              setSelectedUser(null);
            }}>
              Batal
            </Button>
            <Button onClick={handleUpdateSantriStatus}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Simpan Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Pengajar Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Pengajar ke Kelas/Agenda</DialogTitle>
            <DialogDescription>
              Pilih kelas atau agenda untuk assign pengajar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Pilih Kelas (Assign ke Semua Agenda di Kelas)</Label>
              <Select value={selectedKelasId || undefined} onValueChange={(value) => {
                setSelectedKelasId(value);
                setSelectedAgendaId(''); // Reset agenda jika pilih kelas
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelas..." />
                </SelectTrigger>
                <SelectContent>
                  {kelasList.map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.nama_kelas} {k.rombel && `(${k.rombel})`} - {k.program}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-center text-muted-foreground">ATAU</div>
            <div className="space-y-2">
              <Label>Pilih Agenda Spesifik</Label>
              <Select value={selectedAgendaId || undefined} onValueChange={(value) => {
                setSelectedAgendaId(value);
                setSelectedKelasId(''); // Reset kelas jika pilih agenda
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih agenda..." />
                </SelectTrigger>
                <SelectContent>
                  {agendaList.length === 0 ? (
                    <SelectItem value="no-agenda" disabled>
                      Tidak ada agenda tersedia
                    </SelectItem>
                  ) : (
                    agendaList.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.nama_agenda} - {a.kelas?.nama_kelas || '-'}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleAssignPengajar}>
              <Calendar className="w-4 h-4 mr-2" />
              Assign Pengajar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Akun Massal Dialog */}
      <Dialog open={generateMassalDialogOpen} onOpenChange={setGenerateMassalDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Akun Massal untuk Santri</DialogTitle>
            <DialogDescription>
              Generate akun untuk semua santri yang belum memiliki akun. Password akan di-generate dari tanggal lahir.
              Format password: DDMMYYYY + 3 digit terakhir ID Santri.
            </DialogDescription>
          </DialogHeader>
          {!generateMassalResults ? (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900 mb-1">Perhatian</h4>
                    <p className="text-sm text-yellow-800">
                      Proses ini akan membuat akun untuk semua santri yang belum memiliki akun.
                      Pastikan data santri (id_santri dan tanggal_lahir) sudah lengkap.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Format Password</Label>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm font-mono">DDMMYYYY + 3 digit terakhir ID Santri</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Contoh: Tanggal lahir 15 Maret 2005, ID Santri S2024001 → Password: 15032005001
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Total Santri</p>
                    <p className="text-2xl font-bold">{generateMassalResults.total}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Berhasil</p>
                    <p className="text-2xl font-bold text-green-600">{generateMassalResults.success}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Gagal</p>
                    <p className="text-2xl font-bold text-red-600">{generateMassalResults.failed}</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-2">
                <Label>Detail Hasil</Label>
                <div className="border rounded-lg max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID Santri</TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Password</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {generateMassalResults.results.map((result) => (
                        <TableRow key={result.santri_id}>
                          <TableCell className="font-mono">{result.id_santri}</TableCell>
                          <TableCell>{result.nama_lengkap}</TableCell>
                          <TableCell>
                            {result.success ? (
                              <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Berhasil
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Gagal
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-mono">{result.username || '-'}</TableCell>
                          <TableCell className="font-mono">{result.password || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            {!generateMassalResults ? (
              <>
                <Button variant="outline" onClick={() => setGenerateMassalDialogOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleGenerateMassal} disabled={isGeneratingMassal}>
                  {isGeneratingMassal ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4 mr-2" />
                      Generate Akun
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button onClick={() => {
                setGenerateMassalDialogOpen(false);
                setGenerateMassalResults(null);
              }}>
                Tutup
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagementPage;

