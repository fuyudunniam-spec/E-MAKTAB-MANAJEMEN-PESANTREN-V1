import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserManagementService, UserWithRoles, AppRole, CreateUserInput, UpdateUserInput } from '@/services/userManagement.service';
import { getAllModuleNames, getModuleLabel, ModuleName } from '@/utils/permissions';
import { UserService, UserComplete, UserFilters } from '@/services/user.service';
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

// Simplified role options - only 4 roles: admin, staff, pengajar, santri
const ROLE_OPTIONS: { value: AppRole; label: string; description: string }[] = [
  { value: 'admin', label: 'Admin', description: 'Mengakses seluruh modul dan semua fitur' },
  { value: 'staff', label: 'Staff', description: 'Akses fleksibel - pilih modul yang diizinkan (yang tidak dipilih tidak ditampilkan)' },
  { value: 'pengajar', label: 'Pengajar', description: 'Hanya dapat mengakses profil pengajar' },
  { value: 'santri', label: 'Santri', description: 'Hanya mengakses profil santri' },
];

const UserManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.roles?.includes('admin');

  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const searchTermRef = useRef<string>('');
  
  // Sync searchTerm with ref
  useEffect(() => {
    searchTermRef.current = searchTerm;
  }, [searchTerm]);
  const [filterRole, setFilterRole] = useState<AppRole | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'santri' | 'pengajar' | 'staff'>('santri');
  
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
  const selectedUserRef = useRef<UserWithRoles | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Sync selectedUser with ref
  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);
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
    allowedModules: null,
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
      
      // Try to use new UserService first, fallback to UserManagementService
      try {
        const filters: UserFilters = {
          user_type: activeTab,
          role: filterRole === 'all' ? 'all' : filterRole,
          search: searchTerm || undefined,
        };
        const data = await UserService.listUsers(filters);
        console.log('[UserManagementPage] Users loaded via UserService:', data?.length || 0);
        
        // Convert UserComplete to UserWithRoles format for compatibility
        const convertedUsers: UserWithRoles[] = data.map(u => {
          // Note: User can have santri role without santri data if they're staff/admin with santri role
          // This is not necessarily an error, so we'll only log in debug mode
          if (process.env.NODE_ENV === 'development' && u.roles.includes('santri' as AppRole) && !u.santri) {
            console.debug('[UserManagementPage] User has santri role but no santri data (may be intentional):', {
              id: u.id,
              email: u.email,
              roles: u.roles,
              user_type: u.user_type,
            });
          }
          
          return {
            id: u.id,
            email: u.email,
            full_name: u.full_name,
            created_at: u.created_at,
            updated_at: u.updated_at,
            roles: u.roles as AppRole[],
            username: u.santri?.id_santri || undefined,
            password_plain: undefined, // Will be loaded separately if needed
            allowedModules: u.allowed_modules || null, // Map allowed_modules from UserComplete
            allowed_modules: u.allowed_modules || null, // Keep for backward compatibility
            santri: u.santri ? {
              id: u.santri.id,
              id_santri: u.santri.id_santri,
              nama_lengkap: u.santri.nama_lengkap,
              status_santri: u.santri.status_santri,
              kategori: u.santri.kategori,
            } : undefined,
            pengajar: u.pengajar ? {
              id: u.pengajar.id,
              nama_lengkap: u.pengajar.nama_lengkap,
              kode_pengajar: u.pengajar.kode_pengajar || undefined,
              status: u.pengajar.status,
            } : undefined,
          };
        });
        
        console.log('[UserManagementPage] Converted users:', {
          total: convertedUsers.length,
          withSantri: convertedUsers.filter(u => u.santri).length,
          withSantriRole: convertedUsers.filter(u => u.roles.includes('santri')).length,
        });
        // Debug: Check allowedModules mapping
        convertedUsers.forEach(u => {
          if (u.roles.includes('staff')) {
            console.log('[UserManagementPage] Staff user allowedModules:', {
              id: u.id,
              email: u.email,
              allowedModules: u.allowedModules,
              allowed_modules: u.allowed_modules,
            });
          }
        });
        
        setUsers(convertedUsers);
      } catch (serviceError) {
        // Fallback to UserManagementService
        console.warn('[UserManagementPage] UserService failed, using fallback:', serviceError);
        const data = await UserManagementService.listUsers();
        console.log('[UserManagementPage] Users loaded via UserManagementService:', data?.length || 0);
        setUsers(data || []);
      }
    } catch (error: any) {
      console.error('[UserManagementPage] Error loading users:', error);
      toast.error(error.message || 'Gagal memuat daftar user');
      // Set empty array sebagai fallback
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, filterRole, searchTerm]);

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
  }, [isAdmin, loadUsers, loadKelas, activeTab]);

  useEffect(() => {
    if (selectedKelasId) {
      loadAgenda(selectedKelasId);
    }
  }, [selectedKelasId, loadAgenda]);
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
    };
  }, []);
  
  // Reset newPassword when password dialog opens
  useEffect(() => {
    if (passwordDialogOpen) {
      // Always reset password field when dialog opens
      setNewPassword('');
      setShowPassword(false);
    }
  }, [passwordDialogOpen]);

  // Reset formData when create dialog opens
  useEffect(() => {
    if (createDialogOpen) {
      console.log('[UserManagementPage] Create dialog opened - resetting formData');
      setFormData({
        email: '',
        password: '',
        full_name: '',
        roles: [],
        allowedModules: null,
        createPengajar: false,
        pengajarData: {
          nama_lengkap: '',
          kode_pengajar: '',
          program_spesialisasi: [],
          kontak: '',
        },
      });
    }
  }, [createDialogOpen]);

  const handleCreateUser = async () => {
    if (!formData.email || !formData.password || !formData.full_name || formData.roles.length === 0) {
      toast.error('Mohon lengkapi semua field yang wajib');
      return;
    }

    // Validasi khusus untuk role pengajar
    if (formData.roles[0] === 'pengajar') {
      if (!formData.pengajarData?.nama_lengkap || formData.pengajarData.nama_lengkap.trim() === '') {
        toast.error('Jika memilih role Pengajar, nama pengajar wajib diisi');
        return;
      }
    }

    // Validasi khusus untuk role staff - wajib pilih minimal 1 modul (selain dashboard)
    let finalAllowedModules = formData.allowedModules;
    if (formData.roles[0] === 'staff') {
      if (!formData.allowedModules || formData.allowedModules.length === 0) {
        toast.error('Staff wajib memilih minimal 1 modul yang dapat diakses');
        return;
      }
      // Ensure dashboard is always included for staff (create new array, don't mutate)
      finalAllowedModules = formData.allowedModules.includes('dashboard')
        ? [...formData.allowedModules] // Copy array
        : ['dashboard', ...formData.allowedModules];
    }

    // Admin: selalu set allowedModules ke null (full access)
    const submitData = {
      ...formData,
      allowedModules: formData.roles[0] === 'admin' ? null : finalAllowedModules,
    };

    console.log('[UserManagementPage] Creating user - submitData:', {
      email: submitData.email,
      roles: submitData.roles,
      allowedModules: submitData.allowedModules,
      allowedModules_type: typeof submitData.allowedModules,
      allowedModules_isArray: Array.isArray(submitData.allowedModules),
      allowedModules_length: Array.isArray(submitData.allowedModules) ? submitData.allowedModules.length : 'N/A',
      formData_allowedModules: formData.allowedModules,
      finalAllowedModules: finalAllowedModules,
      submitData_full: JSON.stringify(submitData, null, 2),
    });

    try {
      await UserManagementService.createUser(submitData);
      toast.success('User berhasil dibuat');
      setCreateDialogOpen(false);
      setFormData({
        email: '',
        password: '',
        full_name: '',
        roles: [],
        allowedModules: null,
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

    // Validasi khusus untuk role staff - wajib pilih minimal 1 modul (selain dashboard)
    let finalAllowedModules = formData.allowedModules;
    if (formData.roles[0] === 'staff') {
      if (!formData.allowedModules || formData.allowedModules.length === 0) {
        toast.error('Staff wajib memilih minimal 1 modul yang dapat diakses');
        return;
      }
      // Ensure dashboard is always included for staff (create new array, don't mutate)
      finalAllowedModules = formData.allowedModules.includes('dashboard')
        ? [...formData.allowedModules] // Copy array
        : ['dashboard', ...formData.allowedModules];
    }

    // Admin: selalu set allowedModules ke null (full access)
    const submitData: UpdateUserInput = {
      full_name: formData.full_name,
      roles: formData.roles,
    };
    
    // Only include email if it changed
    if (formData.email !== selectedUser.email) {
      submitData.email = formData.email;
    }
    
    // CRITICAL: Always include allowedModules (even if null for admin)
    // This ensures it's sent to the backend and saved properly
    submitData.allowedModules = formData.roles[0] === 'admin' ? null : finalAllowedModules;

    console.log('[UserManagementPage] Updating user - submitData:', {
      userId: selectedUser.id,
      roles: submitData.roles,
      allowedModules: submitData.allowedModules,
      allowedModules_type: typeof submitData.allowedModules,
      allowedModules_isArray: Array.isArray(submitData.allowedModules),
      allowedModules_length: Array.isArray(submitData.allowedModules) ? submitData.allowedModules.length : 'N/A',
      finalAllowedModules: finalAllowedModules,
      formData_allowedModules: formData.allowedModules,
      submitData_full: JSON.stringify(submitData, null, 2),
    });

    try {
      await UserManagementService.updateUser(selectedUser.id, submitData);
      toast.success('User berhasil diperbarui');
      setEditDialogOpen(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || 'Gagal memperbarui user');
    }
  };

  const handleUpdatePassword = async () => {
    // Use ref to ensure we have the correct user even if state hasn't updated
    const userToUpdate = selectedUserRef.current || selectedUser;
    
    if (!userToUpdate || !newPassword) {
      toast.error('Password baru wajib diisi');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }

    try {
      // Log untuk debugging
      console.log('[UserManagementPage] Updating password for user:', {
        id: userToUpdate.id,
        email: userToUpdate.email,
        full_name: userToUpdate.full_name,
      });
      
      await UserManagementService.updateUser(userToUpdate.id, {
        password: newPassword,
      });
      toast.success(`Password berhasil diubah untuk ${userToUpdate.full_name || userToUpdate.email}`);
      setPasswordDialogOpen(false);
      setSelectedUser(null);
      selectedUserRef.current = null;
      setNewPassword('');
      setShowPassword(false);
    } catch (error: any) {
      console.error('[UserManagementPage] Error updating password:', error);
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
  // Single role selection (replaces toggleRole for new simplified role system)
  const setRole = (role: AppRole) => {
    setFormData(prev => {
      const isStaff = role === 'staff';
      const isPengajar = role === 'pengajar';
      
      // Staff: Set default modules jika belum ada (dashboard + settings)
      // Admin: tidak perlu allowedModules (selalu null = full access)
      // Santri & Pengajar: tidak perlu allowedModules (fixed modules)
      let allowedModules = null;
      if (isStaff) {
        // Jika sebelumnya bukan staff, set default
        if (prev.roles[0] !== 'staff') {
          allowedModules = ['dashboard', 'settings']; // Default untuk staff baru
        } else {
          // Tetap pakai yang sudah ada, atau default jika kosong
          allowedModules = prev.allowedModules && prev.allowedModules.length > 0 
            ? prev.allowedModules 
            : ['dashboard', 'settings'];
        }
      }
      
      return {
        ...prev,
        roles: [role], // Single role only
        allowedModules,
        createPengajar: isPengajar ? true : false,
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
        formData.roles[0] === 'pengajar' && 
        formData.pengajarData?.nama_lengkap && 
        !formData.pengajarData?.kode_pengajar) {
      generateKodePengajar();
    }
  }, [formData.createPengajar, formData.roles, formData.pengajarData?.nama_lengkap, formData.pengajarData?.kode_pengajar, generateKodePengajar]);

  // Calculate statistics for tab counts only
  const statistics = useMemo(() => {
    // Filter santri: check both santri property and 'santri' role
    const santriUsers = users.filter(u => 
      u.santri || u.roles.includes('santri')
    );
    // Filter pengajar: check both pengajar property and 'pengajar' role
    const pengajarUsers = users.filter(u => 
      u.pengajar || u.roles.includes('pengajar')
    );
    const staffUsers = users.filter(u => u.roles.includes('staff'));

    return {
      totalSantri: santriUsers.length,
      totalPengajar: pengajarUsers.length,
      totalStaff: staffUsers.length,
    };
  }, [users]);

  // Filter users based on active tab
  const filteredUsers = useMemo(() => {
    let tabFiltered = users;
    
    // Filter by active tab
    if (activeTab === 'santri') {
      tabFiltered = users.filter(u => u.santri || u.roles.includes('santri'));
    } else if (activeTab === 'pengajar') {
      tabFiltered = users.filter(u => u.pengajar || u.roles.includes('pengajar'));
    } else if (activeTab === 'staff') {
      tabFiltered = users.filter(u => u.roles.includes('staff'));
    }

    // Filter by role (if not 'all')
    const roleFiltered = filterRole !== 'all' 
      ? tabFiltered.filter(u => u.roles.includes(filterRole))
      : tabFiltered;

    // Filter by search term
    if (!searchTerm) return roleFiltered;
    
    return roleFiltered.filter(u => 
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.pengajar?.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.santri?.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.santri?.id_santri.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, activeTab, filterRole, searchTerm]);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Kelola User</h1>
          <p className="text-muted-foreground">
            Master data akun user, pengajar, dan staff. Kelola profil, role, password, dan monitoring.
          </p>
        </div>
        <div className="flex gap-2">
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

      {/* Table View */}
      <Card>
          <CardHeader>
            <CardTitle>Daftar User</CardTitle>
            <CardDescription>
              Master data semua akun user, pengajar, dan staff
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Tabs untuk memisahkan Santri, Pengajar, dan Staff */}
            <div className="mb-4 border-b">
              <div className="flex gap-2">
                <Button
                  variant={activeTab === 'santri' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setActiveTab('santri');
                    setFilterRole('all');
                  }}
                >
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Santri ({statistics.totalSantri})
                </Button>
                <Button
                  variant={activeTab === 'pengajar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setActiveTab('pengajar');
                    setFilterRole('all');
                  }}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Pengajar ({statistics.totalPengajar})
                </Button>
                <Button
                  variant={activeTab === 'staff' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setActiveTab('staff');
                    setFilterRole('all');
                  }}
                >
                  <UserCog className="w-4 h-4 mr-2" />
                  Staff ({statistics.totalStaff})
                </Button>
              </div>
            </div>

            <div className="mb-4 flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Cari user berdasarkan email, nama, ID santri, atau kode pengajar..."
                value={searchTerm}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setSearchTerm(newValue);
                  // Debounce search - clear previous timeout
                  if (searchTimeoutRef.current) {
                    clearTimeout(searchTimeoutRef.current);
                  }
                  // Trigger reload when search changes (after 500ms delay)
                  searchTimeoutRef.current = setTimeout(() => {
                    loadUsers();
                  }, 500);
                }}
                autoComplete="off"
                className="flex-1 max-w-md"
              />
              <Select value={filterRole} onValueChange={(value) => {
                setFilterRole(value as AppRole | 'all');
                // Debounce filter - clear previous timeout
                if (filterTimeoutRef.current) {
                  clearTimeout(filterTimeoutRef.current);
                }
                // Trigger reload when filter changes (after 200ms delay)
                filterTimeoutRef.current = setTimeout(() => {
                  loadUsers();
                }, 200);
              }}>
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
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Tidak ada user ditemukan
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((u) => (
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
                                  // Use allowedModules (camelCase) first, fallback to allowed_modules (snake_case)
                                  let userAllowedModules = u.allowedModules || u.allowed_modules || null;
                                  
                                  console.log('[UserManagementPage] Loading user for edit - RAW DATA:', {
                                    id: u.id,
                                    email: u.email,
                                    roles: u.roles,
                                    allowedModules_raw: u.allowedModules,
                                    allowed_modules_raw: u.allowed_modules,
                                    user_object: u
                                  });
                                  
                                  // If user is staff and allowedModules is null/empty, set default
                                  if (u.roles.includes('staff')) {
                                    if (!userAllowedModules || (Array.isArray(userAllowedModules) && userAllowedModules.length === 0)) {
                                      // Only set default if truly empty - means user hasn't configured modules yet
                                      userAllowedModules = ['dashboard', 'settings'];
                                      console.log('[UserManagementPage] Staff user with empty allowedModules - setting default:', userAllowedModules);
                                    } else {
                                      // Ensure dashboard is always included if not already present
                                      if (!userAllowedModules.includes('dashboard')) {
                                        userAllowedModules = ['dashboard', ...userAllowedModules];
                                        console.log('[UserManagementPage] Dashboard not found - adding it:', userAllowedModules);
                                      }
                                      console.log('[UserManagementPage] Using saved allowedModules:', userAllowedModules);
                                    }
                                  }
                                  
                                  console.log('[UserManagementPage] Final allowedModules for form:', userAllowedModules);
                                  setFormData({
                                    email: u.email,
                                    password: '',
                                    full_name: u.full_name || '',
                                    roles: u.roles,
                                    allowedModules: userAllowedModules,
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
                                onClick={(e) => {
                                  // Prevent event bubbling
                                  e.preventDefault();
                                  e.stopPropagation();
                                  
                                  // Store current searchTerm to prevent it from changing
                                  const currentSearchTerm = searchTermRef.current;
                                  
                                  // Reset all password-related state first
                                  setNewPassword('');
                                  setShowPassword(false);
                                  
                                  // Set selectedUser
                                  setSelectedUser(u);
                                  selectedUserRef.current = u;
                                  
                                  // Open dialog immediately - no setTimeout needed
                                  setPasswordDialogOpen(true);
                                  
                                  // Restore searchTerm if it was changed (after a brief delay)
                                  setTimeout(() => {
                                    if (searchTermRef.current !== currentSearchTerm) {
                                      setSearchTerm(currentSearchTerm);
                                    }
                                  }, 10);
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
              <Label>Role *</Label>
              <div className="grid grid-cols-1 gap-2">
                {ROLE_OPTIONS.map((role) => (
                  <div 
                    key={role.value} 
                    className={`flex items-start space-x-2 p-3 border rounded cursor-pointer transition-colors ${
                      formData.roles[0] === role.value 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setRole(role.value)}
                  >
                    <input
                      type="radio"
                      name="create-role"
                      checked={formData.roles[0] === role.value}
                      onChange={() => setRole(role.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label className="font-medium cursor-pointer">{role.label}</Label>
                      <p className="text-xs text-muted-foreground">{role.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Module Access - Hanya untuk staff (admin selalu full access) */}
            {formData.roles[0] === 'staff' && (
              <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
                <Label>Akses Modul *</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Pilih modul yang dapat diakses oleh staff ini. Modul yang tidak dipilih tidak akan ditampilkan.
                </p>
                <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded mb-2">
                  ⚠️ Staff wajib memilih minimal 1 modul
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {getAllModuleNames()
                    .filter(module => module !== 'dashboard') // Dashboard always included, don't show in checkbox
                    .map((module) => {
                      const currentModules = formData.allowedModules || ['dashboard'];
                      const isChecked = currentModules.includes(module);
                      
                      return (
                        <div key={module} className="flex items-center space-x-2">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              setFormData(prev => {
                                const current = prev.allowedModules || ['dashboard'];
                                const otherModules = current.filter(m => m !== 'dashboard');
                                
                                let newOtherModules: string[];
                                if (checked) {
                                  newOtherModules = otherModules.includes(module) 
                                    ? otherModules 
                                    : [...otherModules, module];
                                } else {
                                  newOtherModules = otherModules.filter(m => m !== module);
                                }
                                
                                const finalModules = ['dashboard', ...newOtherModules];
                                
                                console.log('[UserManagementPage] Checkbox changed (CREATE):', {
                                  module,
                                  checked,
                                  current,
                                  otherModules,
                                  newOtherModules,
                                  finalModules
                                });
                                
                                return {
                                  ...prev,
                                  allowedModules: finalModules,
                                };
                              });
                            }}
                          />
                          <Label className="text-sm cursor-pointer">{getModuleLabel(module)}</Label>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={formData.createPengajar}
                disabled={formData.roles[0] === 'pengajar'}
                onCheckedChange={(checked) =>
                  setFormData(prev => ({ ...prev, createPengajar: checked as boolean }))
                }
              />
              <Label className={formData.roles[0] === 'pengajar' ? 'text-muted-foreground' : ''}>
                Buat Data Pengajar untuk User Ini
                {formData.roles[0] === 'pengajar' && (
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
              <Label>Role *</Label>
              <div className="grid grid-cols-1 gap-2">
                {ROLE_OPTIONS.map((role) => (
                  <div 
                    key={role.value} 
                    className={`flex items-start space-x-2 p-3 border rounded cursor-pointer transition-colors ${
                      formData.roles[0] === role.value 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setRole(role.value)}
                  >
                    <input
                      type="radio"
                      name="create-role"
                      checked={formData.roles[0] === role.value}
                      onChange={() => setRole(role.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label className="font-medium cursor-pointer">{role.label}</Label>
                      <p className="text-xs text-muted-foreground">{role.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Module Access - Hanya untuk staff (admin selalu full access) */}
            {formData.roles[0] === 'staff' && (
              <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
                <Label>Akses Modul *</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Pilih modul yang dapat diakses oleh staff ini. Dashboard akan selalu ditambahkan secara otomatis. Modul yang tidak dipilih tidak akan ditampilkan.
                </p>
                <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded mb-2">
                  ⚠️ Staff wajib memilih minimal 1 modul (selain dashboard)
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {getAllModuleNames()
                    .filter(module => module !== 'dashboard') // Dashboard always included, don't show in checkbox
                    .map((module) => {
                      // Check if module is selected (dashboard is always included, so check the rest)
                      const currentModules = formData.allowedModules || ['dashboard'];
                      const isChecked = currentModules.includes(module);
                      
                      return (
                        <div key={module} className="flex items-center space-x-2">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              setFormData(prev => {
                                const current = prev.allowedModules || ['dashboard'];
                                // Filter out dashboard temporarily to work with other modules
                                const otherModules = current.filter(m => m !== 'dashboard');
                                
                                // Update other modules based on checkbox state
                                let newOtherModules: string[];
                                if (checked) {
                                  // Add module if not already present
                                  newOtherModules = otherModules.includes(module) 
                                    ? otherModules 
                                    : [...otherModules, module];
                                } else {
                                  // Remove module
                                  newOtherModules = otherModules.filter(m => m !== module);
                                }
                                
                                // Always include dashboard, plus selected other modules
                                const finalModules = ['dashboard', ...newOtherModules];
                                
                                console.log('[UserManagementPage] Checkbox changed (EDIT):', {
                                  module,
                                  checked,
                                  current,
                                  otherModules,
                                  newOtherModules,
                                  finalModules
                                });
                                
                                return {
                                  ...prev,
                                  allowedModules: finalModules,
                                };
                              });
                            }}
                          />
                          <Label className="text-sm cursor-pointer">{getModuleLabel(module)}</Label>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
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
      <Dialog 
        open={passwordDialogOpen} 
        onOpenChange={(open) => {
          // Only close dialog, don't allow opening from here (use button click instead)
          if (!open) {
            setPasswordDialogOpen(false);
            setNewPassword('');
            setSelectedUser(null);
            selectedUserRef.current = null;
            setShowPassword(false);
          }
        }}
        key={`password-dialog-${selectedUser?.id || 'new'}`}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Password</DialogTitle>
            <DialogDescription>
              Ubah password untuk user: <strong>{selectedUser?.full_name || selectedUser?.email}</strong>
              {selectedUser?.email && selectedUser?.full_name && (
                <span className="block text-xs text-muted-foreground mt-1">
                  Email: {selectedUser.email}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Password Baru *</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="pr-10"
                  autoComplete="new-password"
                  autoFocus={false}
                  key={`password-input-${selectedUser?.id || 'new'}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
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
              selectedUserRef.current = null;
              setShowPassword(false);
            }}>
              Batal
            </Button>
            <Button 
              onClick={handleUpdatePassword} 
              disabled={!newPassword || newPassword.length < 6 || !selectedUser}
            >
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

