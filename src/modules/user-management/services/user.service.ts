/**
 * UNIFIED USER SERVICE
 * 
 * Centralized service untuk semua operasi user management
 * Menggabungkan logic dari UserManagementService dan santriAuth.service
 * 
 * @version 2.0
 * @date 2025-01-27
 */

import { supabase } from '@/integrations/supabase/client';
import type { AppRole } from '@/modules/user-management/services/userManagement.service';

// ============================================
// TYPES
// ============================================

export interface UserComplete {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
  roles: AppRole[];
  user_type: 'santri' | 'pengajar' | 'staff';
  allowed_modules?: string[] | null; // Module access list for staff users
  santri?: {
    id: string;
    id_santri: string;
    nama_lengkap: string;
    status_santri: 'Aktif' | 'Non-Aktif' | 'Alumni';
    kategori: string;
  } | null;
  pengajar?: {
    id: string;
    nama_lengkap: string;
    kode_pengajar?: string | null;
    status: 'Aktif' | 'Non-Aktif';
  } | null;
}

export interface CreateSantriAccountInput {
  id_santri: string;
  password?: string; // Optional, akan auto-generate jika tidak ada
}

export interface CreatePengajarAccountInput {
  email: string;
  password: string;
  full_name: string;
  kode_pengajar?: string;
  program_spesialisasi?: string[];
  kontak?: string;
  require_approval?: boolean; // Untuk self-registration
}

export interface UserFilters {
  user_type?: 'santri' | 'pengajar' | 'staff' | 'all';
  role?: AppRole | 'all';
  status?: 'Aktif' | 'Non-Aktif' | 'Alumni' | 'all';
  search?: string;
}

// ============================================
// USER SERVICE CLASS
// ============================================

export class UserService {
  /**
   * Get all users dengan complete data
   * Menggunakan view v_users_complete jika ada, fallback ke manual join
   */
  static async listUsers(filters?: UserFilters): Promise<UserComplete[]> {
    try {
      // Always use manual join to ensure allowed_modules is loaded correctly
      // Note: v_users_complete view doesn't include allowed_modules, so we use manual join
      return await this.listUsersManual(filters);
    } catch (error: any) {
      console.error('[UserService] Error listing users:', error);
      throw error;
    }
  }

  /**
   * Manual join fallback (existing logic from UserManagementService)
   */
  private static async listUsersManual(filters?: UserFilters): Promise<UserComplete[]> {
    // Explicitly select allowed_modules to ensure it's loaded
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, created_at, updated_at, allowed_modules')
      .order('created_at', { ascending: false });
    
    console.log('[UserService.listUsersManual] Profiles loaded:', {
      count: profiles?.length || 0,
      sample: profiles?.[0] ? {
        id: profiles[0].id,
        email: profiles[0].email,
        allowed_modules: (profiles[0] as any).allowed_modules,
      } : null,
    });

    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) return [];

    const userIds = profiles.map(p => p.id);

    // Get roles
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', userIds);

    // Get santri
    const { data: santriData } = await supabase
      .from('santri')
      .select('id, id_santri, nama_lengkap, status_santri, kategori, user_id')
      .in('user_id', userIds);

    // Get pengajar
    const { data: pengajarData } = await supabase
      .from('akademik_pengajar')
      .select('id, nama_lengkap, kode_pengajar, status, user_id')
      .in('user_id', userIds);

    // Map data
    const rolesMap: Record<string, AppRole[]> = {};
    (rolesData || []).forEach(r => {
      if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
      rolesMap[r.user_id].push(r.role as AppRole);
    });

    const santriMap: Record<string, any> = {};
    (santriData || []).forEach(s => {
      if (s.user_id) santriMap[s.user_id] = s;
    });

    const pengajarMap: Record<string, any> = {};
    (pengajarData || []).forEach(p => {
      if (p.user_id) pengajarMap[p.user_id] = p;
    });

    // Build result
    let result: UserComplete[] = profiles.map(profile => {
      const santri = santriMap[profile.id];
      const pengajar = pengajarMap[profile.id];
      
      let user_type: 'santri' | 'pengajar' | 'staff' = 'staff';
      if (santri) user_type = 'santri';
      else if (pengajar) user_type = 'pengajar';

      return {
        id: profile.id,
        email: profile.email || '',
        full_name: profile.full_name,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        roles: rolesMap[profile.id] || [],
        user_type,
        allowed_modules: (profile as any).allowed_modules || null, // Include allowed_modules
        santri: santri ? {
          id: santri.id,
          id_santri: santri.id_santri,
          nama_lengkap: santri.nama_lengkap,
          status_santri: santri.status_santri,
          kategori: santri.kategori,
        } : null,
        pengajar: pengajar ? {
          id: pengajar.id,
          nama_lengkap: pengajar.nama_lengkap,
          kode_pengajar: pengajar.kode_pengajar,
          status: pengajar.status,
        } : null,
      };
    });

    // Apply filters
    if (filters?.user_type && filters.user_type !== 'all') {
      result = result.filter(u => u.user_type === filters.user_type);
    }

    if (filters?.role && filters.role !== 'all') {
      result = result.filter(u => u.roles.includes(filters.role!));
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(u => 
        u.email?.toLowerCase().includes(searchLower) ||
        u.full_name?.toLowerCase().includes(searchLower) ||
        u.santri?.id_santri?.toLowerCase().includes(searchLower) ||
        u.pengajar?.kode_pengajar?.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }

  /**
   * Get user by ID dengan complete data
   */
  static async getUserById(userId: string): Promise<UserComplete | null> {
    const users = await this.listUsers();
    return users.find(u => u.id === userId) || null;
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<UserComplete | null> {
    const users = await this.listUsers();
    return users.find(u => u.email === email) || null;
  }

  /**
   * Create Santri account
   * Wrapper untuk existing createSantriAccount dari santriAuth.service
   */
  static async createSantriAccount(input: CreateSantriAccountInput): Promise<{ userId: string; email: string; password: string }> {
    // Import existing service
    const { createSantriAccount } = await import('@/modules/santri/shared/services/santriAuth.service');
    
    // Get santri data
    const { data: santri, error: santriError } = await supabase
      .from('santri')
      .select('id, nama_lengkap, tanggal_lahir, user_id')
      .eq('id_santri', input.id_santri.toUpperCase())
      .single();

    if (santriError || !santri) {
      throw new Error('Santri tidak ditemukan');
    }

    if (santri.user_id) {
      throw new Error('Akun untuk santri ini sudah ada');
    }

    // Generate password if not provided
    let password = input.password;
    if (!password && santri.tanggal_lahir) {
      // Use existing password generation logic
      const { UserManagementService } = await import('@/modules/user-management/services/userManagement.service');
      password = (UserManagementService as any).generatePasswordFromBirthdate(
        santri.tanggal_lahir,
        input.id_santri
      );
    }

    if (!password) {
      throw new Error('Password harus disediakan atau tanggal lahir harus ada');
    }

    // Create account via Edge Function
    const { data, error } = await supabase.functions.invoke('santri-auth-admin', {
      body: {
        action: 'create_account',
        id_santri: input.id_santri.toUpperCase(),
        password,
        nama_lengkap: santri.nama_lengkap,
      },
    });

    if (error) throw error;
    if (data.error) throw new Error(data.error);

    return {
      userId: data.userId,
      email: data.email,
      password,
    };
  }

  /**
   * Create Pengajar account
   * Support both admin-created and self-registration (with approval)
   */
  static async createPengajarAccount(input: CreatePengajarAccountInput): Promise<{ userId: string; pengajarId?: string; requiresApproval: boolean }> {
    // Import UserManagementService
    const { UserManagementService } = await import('@/modules/user-management/services/userManagement.service');

    // Create user via existing service
    const result = await UserManagementService.createUser({
      email: input.email,
      password: input.password,
      full_name: input.full_name,
      roles: ['pengajar'],
      createPengajar: true,
      pengajarData: {
        nama_lengkap: input.full_name,
        kode_pengajar: input.kode_pengajar,
        program_spesialisasi: input.program_spesialisasi,
        kontak: input.kontak,
      },
    });

    // If requires approval, set status to pending
    if (input.require_approval) {
      // TODO: Add approval workflow (create pengajar_approvals table)
      // For now, just return flag
    }

    return {
      userId: result.user_id,
      pengajarId: result.pengajar_id,
      requiresApproval: input.require_approval || false,
    };
  }

  /**
   * Validate user data consistency
   */
  static async validateUser(userId: string): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    const user = await this.getUserById(userId);

    if (!user) {
      return { valid: false, errors: ['User tidak ditemukan'] };
    }

    // Check role consistency
    if (user.santri && !user.roles.includes('santri')) {
      errors.push('User memiliki data santri tapi tidak memiliki role santri');
    }

    if (user.pengajar && !user.roles.includes('pengajar')) {
      errors.push('User memiliki data pengajar tapi tidak memiliki role pengajar');
    }

    // Check data completeness
    if (user.santri && !user.santri.id_santri) {
      errors.push('Santri tidak memiliki id_santri');
    }

    if (user.pengajar && !user.pengajar.nama_lengkap) {
      errors.push('Pengajar tidak memiliki nama_lengkap');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get statistics
   */
  static async getStatistics(): Promise<{
    total_users: number;
    total_santri: number;
    total_pengajar: number;
    total_staff: number;
    santri_with_account: number;
    santri_without_account: number;
    pengajar_with_account: number;
    pengajar_without_account: number;
  }> {
    const users = await this.listUsers();

    const total_users = users.length;
    const total_santri = users.filter(u => u.user_type === 'santri').length;
    const total_pengajar = users.filter(u => u.user_type === 'pengajar').length;
    const total_staff = users.filter(u => u.user_type === 'staff').length;

    // Get santri without accounts
    const { data: allSantri } = await supabase
      .from('santri')
      .select('id, user_id')
      .not('id_santri', 'is', null);

    const santri_with_account = (allSantri || []).filter(s => s.user_id).length;
    const santri_without_account = (allSantri || []).length - santri_with_account;

    // Get pengajar without accounts
    const { data: allPengajar } = await supabase
      .from('akademik_pengajar')
      .select('id, user_id')
      .eq('status', 'Aktif');

    const pengajar_with_account = (allPengajar || []).filter(p => p.user_id).length;
    const pengajar_without_account = (allPengajar || []).length - pengajar_with_account;

    return {
      total_users,
      total_santri,
      total_pengajar,
      total_staff,
      santri_with_account,
      santri_without_account,
      pengajar_with_account,
      pengajar_without_account,
    };
  }
}

// Re-export types for convenience
export type { AppRole } from '@/modules/user-management/services/userManagement.service';


