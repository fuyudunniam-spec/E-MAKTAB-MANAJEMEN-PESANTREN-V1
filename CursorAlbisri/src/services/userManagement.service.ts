import { supabase } from '@/integrations/supabase/client';

// Get Supabase URL from client
const getSupabaseUrl = () => {
  // Try from env first
  if (import.meta.env.VITE_SUPABASE_URL) {
    return import.meta.env.VITE_SUPABASE_URL;
  }
  // Fallback to hardcoded (from client.ts)
  return 'https://dwyemauojftlyzzgujgh.supabase.co';
};

const getSupabaseAnonKey = () => {
  if (import.meta.env.VITE_SUPABASE_ANON_KEY) {
    return import.meta.env.VITE_SUPABASE_ANON_KEY;
  }
  // Fallback to publishable key from client
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3eWVtYXVvamZ0bHl6emd1amdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNjkyMDcsImV4cCI6MjA3NDk0NTIwN30.AYYJ3ikwLY1hnt1njt4S-gCliMTEJ_trUYkMri6MUas';
};

// Simplified role system - only 4 roles (import from permissions.ts for consistency)
export type AppRole = 'admin' | 'staff' | 'santri' | 'pengajar';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserWithRoles extends UserProfile {
  roles: AppRole[];
  username?: string | null;
  password_plain?: string | null;
  allowedModules?: string[] | null; // Module access list for staff users (camelCase - preferred)
  allowed_modules?: string[] | null; // Module access list for staff users (snake_case for backward compatibility)
  pengajar?: {
    id: string;
    nama_lengkap: string;
    status: 'Aktif' | 'Non-Aktif';
    kode_pengajar?: string | null;
  } | null;
  santri?: {
    id: string;
    id_santri: string;
    nama_lengkap: string;
    status_santri: 'Aktif' | 'Non-Aktif' | 'Alumni';
    kategori: string;
    jenis_kelamin?: string;
  } | null;
}

export interface CreateUserInput {
  email: string;
  password: string;
  full_name: string;
  roles: AppRole[];
  allowedModules?: string[] | null; // Module access list for admin users
  createPengajar?: boolean;
  pengajarData?: {
    nama_lengkap: string;
    kode_pengajar?: string;
    program_spesialisasi?: string[];
    kontak?: string;
  };
}

export interface UpdateUserInput {
  full_name?: string;
  roles?: AppRole[];
  email?: string;
  allowedModules?: string[] | null; // Module access list for admin users
}

export interface AssignPengajarToKelasInput {
  pengajar_id: string;
  kelas_id: string;
  mapel_id?: string;
  mapel_nama?: string;
  kitab?: string;
}

export interface AssignPengajarToAgendaInput {
  pengajar_id: string;
  agenda_id: string;
}

export class UserManagementService {
  /**
   * List semua user dengan roles mereka
   */
  static async listUsers(): Promise<UserWithRoles[]> {
    try {
      console.log('[UserManagementService] Fetching profiles...');
      // Explicitly select allowed_modules to ensure it's included
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at, updated_at, allowed_modules')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('[UserManagementService] Error fetching profiles:', profilesError);
        throw profilesError;
      }

      console.log('[UserManagementService] Profiles fetched:', profiles?.length || 0);

      if (!profiles || profiles.length === 0) {
        console.log('[UserManagementService] No profiles found');
        return [];
      }

    const userIds = profiles.map(p => p.id);

    // Ambil roles untuk semua user
    let roles: any[] = [];
    try {
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      if (rolesError) {
        console.error('[UserManagementService] Error fetching roles:', rolesError);
        // Continue dengan empty array jika error
      } else {
        roles = rolesData || [];
      }
    } catch (error) {
      console.error('[UserManagementService] Exception fetching roles:', error);
    }

    // Ambil data pengajar untuk user yang punya pengajar
    let pengajar: any[] = [];
    try {
      const { data: pengajarData, error: pengajarError } = await supabase
        .from('akademik_pengajar')
        .select('id, nama_lengkap, status, kode_pengajar, user_id')
        .in('user_id', userIds);

      if (pengajarError) {
        console.error('[UserManagementService] Error fetching pengajar:', pengajarError);
        // Continue dengan empty array jika error
      } else {
        pengajar = pengajarData || [];
      }
    } catch (error) {
      console.error('[UserManagementService] Exception fetching pengajar:', error);
    }

     // Ambil data santri untuk user yang punya santri
     let santri: any[] = [];
     try {
       const { data: santriData, error: santriError } = await supabase
         .from('santri')
         .select('id, id_santri, nama_lengkap, status_santri, kategori, user_id, jenis_kelamin')
         .in('user_id', userIds);

      if (santriError) {
        console.error('[UserManagementService] Error fetching santri:', santriError);
        // Continue dengan empty array jika error
      } else {
        santri = santriData || [];
      }
    } catch (error) {
      console.error('[UserManagementService] Exception fetching santri:', error);
    }

    // Map roles per user
    const rolesMap: Record<string, AppRole[]> = {};
    roles.forEach(r => {
      if (r?.user_id && r?.role) {
        if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
        rolesMap[r.user_id].push(r.role as AppRole);
      }
    });

    // Map pengajar per user
    const pengajarMap: Record<string, any> = {};
    pengajar.forEach(p => {
      if (p?.user_id) {
        pengajarMap[p.user_id] = p;
      }
    });

    // Map santri per user
    const santriMap: Record<string, any> = {};
    santri.forEach(s => {
      if (s?.user_id) {
        santriMap[s.user_id] = s;
      }
    });

      const result = (profiles || []).map(profile => ({
        id: profile.id,
        email: profile.email || '',
        full_name: profile.full_name,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        username: (profile as any).username || null,
        password_plain: (profile as any).password_plain || null,
        allowedModules: (profile as any).allowed_modules || null, // Map to camelCase
        allowed_modules: (profile as any).allowed_modules || null, // Keep for backward compatibility
        roles: rolesMap[profile.id] || [],
        pengajar: pengajarMap[profile.id] ? {
          id: pengajarMap[profile.id].id,
          nama_lengkap: pengajarMap[profile.id].nama_lengkap,
          status: pengajarMap[profile.id].status as 'Aktif' | 'Non-Aktif',
          kode_pengajar: pengajarMap[profile.id].kode_pengajar,
        } : null,
         santri: santriMap[profile.id] ? {
           id: santriMap[profile.id].id,
           id_santri: santriMap[profile.id].id_santri,
           nama_lengkap: santriMap[profile.id].nama_lengkap,
           status_santri: santriMap[profile.id].status_santri as 'Aktif' | 'Non-Aktif' | 'Alumni',
           kategori: santriMap[profile.id].kategori,
           jenis_kelamin: santriMap[profile.id].jenis_kelamin,
         } : null,
      }));

      console.log('[UserManagementService] Users mapped:', result.length);
      return result;
    } catch (error: any) {
      console.error('[UserManagementService] Error in listUsers:', error);
      // Return empty array instead of throwing to prevent crash
      return [];
    }
  }

  /**
   * Create user baru dengan roles via Edge Function
   * Menggunakan Supabase Admin API untuk create user langsung dari frontend
   */
  static async createUser(input: CreateUserInput): Promise<{ user_id: string; pengajar_id?: string }> {
    // Get current session untuk authorization
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Anda harus login terlebih dahulu');
    }

    // Validate input sebelum mengirim
    if (!input.email || !input.password || !input.full_name || !input.roles || input.roles.length === 0) {
      throw new Error('Mohon lengkapi semua field yang wajib: email, password, full_name, dan roles');
    }

    // Call Edge Function untuk create user
    const supabaseUrl = getSupabaseUrl();
    const anonKey = getSupabaseAnonKey();
    
    const requestBody = {
      email: input.email.trim(),
      password: input.password,
      full_name: input.full_name.trim(),
      roles: input.roles,
      allowed_modules: input.allowedModules !== undefined ? input.allowedModules : null,
      create_pengajar: input.createPengajar || false,
      pengajar_nama: input.pengajarData?.nama_lengkap?.trim() || null,
      pengajar_kode: input.pengajarData?.kode_pengajar?.trim() || null,
      pengajar_program: input.pengajarData?.program_spesialisasi || null,
      pengajar_kontak: input.pengajarData?.kontak?.trim() || null,
    };

    console.log('[UserManagementService] Creating user with data:', {
      email: requestBody.email,
      full_name: requestBody.full_name,
      roles: requestBody.roles,
      allowed_modules: requestBody.allowed_modules,
      allowed_modules_type: typeof requestBody.allowed_modules,
      allowed_modules_isArray: Array.isArray(requestBody.allowed_modules),
      allowed_modules_length: Array.isArray(requestBody.allowed_modules) ? requestBody.allowed_modules.length : 'N/A',
      create_pengajar: requestBody.create_pengajar,
      full_requestBody: JSON.stringify(requestBody, null, 2),
    });

    const response = await fetch(`${supabaseUrl}/functions/v1/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': anonKey,
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log('[UserManagementService] Response status:', response.status);
    console.log('[UserManagementService] Response body:', responseText);

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { error: responseText || `HTTP ${response.status}: ${response.statusText}` };
      }
      
      let errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
      
      // Handle specific error cases with user-friendly messages
      if (errorData.details?.code === 'email_exists' || errorMessage.includes('already been registered')) {
        errorMessage = `Email "${requestBody.email}" sudah terdaftar. Silakan gunakan email lain atau hapus user yang sudah ada terlebih dahulu.`;
      } else if (errorData.details) {
        errorMessage = `${errorMessage}\nDetail: ${JSON.stringify(errorData.details)}`;
      }
      
      console.error('[UserManagementService] Error creating user:', errorMessage);
      throw new Error(errorMessage);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[UserManagementService] Failed to parse response:', parseError);
      throw new Error('Gagal memproses response dari server');
    }
    
    if (!data.success) {
      throw new Error(data.error || 'Gagal membuat user');
    }

    return { user_id: data.user_id, pengajar_id: data.pengajar_id };
  }

  /**
   * Update user profile, roles, email, dan password via Edge Function
   */
  static async updateUser(userId: string, input: UpdateUserInput & { password?: string }): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Anda harus login terlebih dahulu');
    }

    const supabaseUrl = getSupabaseUrl();
    
    // Build update body - only include defined fields
    const updateBody: any = {
      user_id: userId,
    };
    
    // Only include fields that are explicitly provided (not undefined)
    if (input.email !== undefined) updateBody.email = input.email;
    if (input.password !== undefined) updateBody.password = input.password;
    if (input.full_name !== undefined) updateBody.full_name = input.full_name;
    if (input.roles !== undefined) updateBody.roles = input.roles;
    
    // CRITICAL: Always include allowed_modules if it exists in input (even if null)
    // This allows clearing it (null) or updating it (array)
    if ('allowedModules' in input) {
      updateBody.allowed_modules = input.allowedModules;
    }
    
    console.log('[UserManagementService] Updating user with data:', {
      user_id: userId,
      input_keys: Object.keys(input),
      input_allowedModules: input.allowedModules,
      input_allowedModules_type: typeof input.allowedModules,
      input_allowedModules_in_input: 'allowedModules' in input,
      updateBody_keys: Object.keys(updateBody),
      updateBody_allowed_modules: updateBody.allowed_modules,
      full_updateBody: JSON.stringify(updateBody, null, 2),
    });

    const response = await fetch(`${supabaseUrl}/functions/v1/update-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': getSupabaseAnonKey(),
      },
      body: JSON.stringify(updateBody),
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`Gagal memproses response: ${responseText}`);
    }

    if (!response.ok) {
      const errorMessage = data.error || `HTTP ${response.status}: ${responseText}`;
      throw new Error(errorMessage);
    }

    if (!data.success) {
      throw new Error(data.error || 'Gagal update user');
    }
  }

  /**
   * Update status santri
   */
  static async updateSantriStatus(santriId: string, status: 'Aktif' | 'Non-Aktif' | 'Alumni'): Promise<void> {
    const { error } = await supabase
      .from('santri')
      .update({ status_santri: status })
      .eq('id', santriId);

    if (error) throw error;
  }

  /**
   * Generate password baru untuk user
   */
  static async generateNewPassword(userId: string): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Anda harus login terlebih dahulu');
    }

    const supabaseUrl = getSupabaseUrl();
    const response = await fetch(`${supabaseUrl}/functions/v1/generate-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': getSupabaseAnonKey(),
      },
      body: JSON.stringify({ user_id: userId }),
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`Gagal memproses response: ${responseText}`);
    }

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Gagal generate password');
    }

    return data.password;
  }

  /**
   * Delete user (akan cascade ke profiles, user_roles, dll)
   */
  static async deleteUser(userId: string): Promise<void> {
    // Delete via Supabase Auth Admin API
    // Untuk sekarang, kita akan delete dari profiles dan user_roles saja
    // Auth user akan dihapus via admin atau RPC function
    
    const { error } = await supabase.rpc('delete_user_complete', {
      p_user_id: userId,
    });

    if (error) {
      // Fallback: delete dari tables yang bisa kita akses
      await supabase.from('user_roles').delete().eq('user_id', userId);
      await supabase.from('profiles').delete().eq('id', userId);
      throw new Error(`Gagal menghapus user dari auth: ${error.message}. Data di profiles dan user_roles sudah dihapus.`);
    }
  }

  /**
   * Assign pengajar ke kelas (via agenda)
   */
  static async assignPengajarToKelas(input: AssignPengajarToKelasInput): Promise<void> {
    // Ambil semua agenda untuk kelas ini
    const { data: agendas, error: agendasError } = await supabase
      .from('kelas_agenda')
      .select('id')
      .eq('kelas_id', input.kelas_id)
      .eq('aktif', true);

    if (agendasError) throw agendasError;

    if (!agendas || agendas.length === 0) {
      throw new Error('Kelas ini belum memiliki agenda aktif');
    }

    // Update semua agenda dengan pengajar_id
    const agendaIds = agendas.map(a => a.id);
    const updateData: any = {
      pengajar_id: input.pengajar_id,
    };

    if (input.mapel_id) updateData.mapel_id = input.mapel_id;
    if (input.mapel_nama) updateData.mapel_nama = input.mapel_nama;
    if (input.kitab) updateData.kitab = input.kitab;

    const { error } = await supabase
      .from('kelas_agenda')
      .update(updateData)
      .in('id', agendaIds);

    if (error) throw error;
  }

  /**
   * Assign pengajar ke agenda spesifik
   */
  static async assignPengajarToAgenda(input: AssignPengajarToAgendaInput): Promise<void> {
    const { error } = await supabase
      .from('kelas_agenda')
      .update({ pengajar_id: input.pengajar_id })
      .eq('id', input.agenda_id);

    if (error) throw error;
  }

  /**
   * Get pengajar yang belum punya user account
   */
  static async getPengajarWithoutUser(): Promise<Array<{
    id: string;
    nama_lengkap: string;
    kode_pengajar?: string | null;
    status: 'Aktif' | 'Non-Aktif';
  }>> {
    const { data: allPengajar, error } = await supabase
      .from('akademik_pengajar')
      .select('id, nama_lengkap, kode_pengajar, status, user_id')
      .eq('status', 'Aktif');

    if (error) throw error;

    return (allPengajar || [])
      .filter(p => !p.user_id)
      .map(p => ({
        id: p.id,
        nama_lengkap: p.nama_lengkap,
        kode_pengajar: p.kode_pengajar,
        status: p.status as 'Aktif' | 'Non-Aktif',
      }));
  }

  /**
   * Link pengajar yang sudah ada dengan user account
   */
  static async linkPengajarToUser(pengajarId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('akademik_pengajar')
      .update({ user_id: userId })
      .eq('id', pengajarId);

    if (error) throw error;
  }

  /**
   * Get users yang ada di auth.users tapi tidak lengkap (tidak ada di profiles atau tidak ada roles)
   * Ini untuk membantu cleanup user yang error saat dibuat
   */
  static async getIncompleteUsers(): Promise<Array<{
    id: string;
    email: string;
    created_at: string;
    has_profile: boolean;
    has_roles: boolean;
  }>> {
    // Query via RPC function karena kita perlu akses ke auth.users
    // Atau kita bisa query langsung dari profiles dan cek yang tidak ada
    const { data: allProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, created_at');

    if (profilesError) throw profilesError;

    const profileIds = new Set((allProfiles || []).map(p => p.id));

    // Get users yang punya roles
    const { data: allRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id');

    if (rolesError) throw rolesError;

    const usersWithRoles = new Set((allRoles || []).map(r => r.user_id));

    // Return profiles yang tidak punya roles (incomplete)
    return (allProfiles || [])
      .filter(p => !usersWithRoles.has(p.id))
      .map(p => ({
        id: p.id,
        email: p.email || '',
        created_at: p.created_at,
        has_profile: true,
        has_roles: false,
      }));
  }

  /**
   * Cleanup user yang tidak lengkap (hapus dari auth.users jika tidak ada di profiles)
   * Hanya bisa dilakukan via Edge Function karena perlu admin access
   */
  static async cleanupIncompleteUser(userId: string): Promise<void> {
    // Check apakah user ada di profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    // Jika tidak ada profile, user ini incomplete dan bisa dihapus
    // Tapi kita tidak bisa hapus dari auth.users langsung dari client
    // Perlu Edge Function untuk ini
    if (!profile) {
      throw new Error('User tidak ditemukan di profiles. Untuk menghapus dari auth.users, gunakan Supabase Dashboard atau Edge Function.');
    }

    // Jika ada profile tapi tidak ada roles, kita bisa hapus profile dan roles
    const { data: roles } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId);

    if (!roles || roles.length === 0) {
      // Hapus profile jika tidak ada roles
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (deleteError) throw deleteError;
    }
  }

  /**
   * Generate password from tanggal lahir and id_santri
   * Format: DDMMYYYY + 3 last digits of id_santri
   * Example: tanggal_lahir = 2005-03-15, id_santri = S2024001
   * Password: 15032005001
   */
  static generatePasswordFromBirthdate(tanggalLahir: string, idSantri: string): string {
    const date = new Date(tanggalLahir);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear());
    const last3 = idSantri.slice(-3);
    
    return `${day}${month}${year}${last3}`;
  }

  /**
   * Get all santri without accounts
   */
  static async getSantriWithoutAccounts(): Promise<Array<{
    id: string;
    id_santri: string;
    nama_lengkap: string;
    tanggal_lahir: string;
  }>> {
    const { data, error } = await supabase
      .from('santri')
      .select('id, id_santri, nama_lengkap, tanggal_lahir')
      .is('user_id', null)
      .not('id_santri', 'is', null)
      .not('tanggal_lahir', 'is', null)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[UserManagementService] Error fetching santri without accounts:', error);
      throw error;
    }

    return (data || []).filter(s => s.id_santri && s.tanggal_lahir);
  }

  /**
   * Generate accounts for all santri without accounts
   */
  static async generateAccountsForAllSantri(): Promise<{
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
  }> {
    const santriList = await this.getSantriWithoutAccounts();
    const results: Array<{
      santri_id: string;
      id_santri: string;
      nama_lengkap: string;
      success: boolean;
      message: string;
      username?: string;
      password?: string;
    }> = [];

    let successCount = 0;
    let failedCount = 0;

    for (const santri of santriList) {
      try {
        // Generate password from tanggal lahir
        const password = this.generatePasswordFromBirthdate(santri.tanggal_lahir, santri.id_santri);
        const email = `${santri.id_santri}@pondoksukses.local`;

        // Create user account
        const { user_id } = await this.createUser({
          email,
          password,
          full_name: santri.nama_lengkap,
          roles: ['santri'],
        });

        // Update profiles with username and password_plain
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            username: santri.id_santri,
            password_plain: password,
          })
          .eq('id', user_id);

        if (updateError) {
          console.error(`[UserManagementService] Error updating profile for ${santri.id_santri}:`, updateError);
        }

        // Link santri to user
        const { error: linkError } = await supabase
          .from('santri')
          .update({ user_id })
          .eq('id', santri.id);

        if (linkError) {
          console.error(`[UserManagementService] Error linking santri ${santri.id_santri} to user:`, linkError);
        }

        results.push({
          santri_id: santri.id,
          id_santri: santri.id_santri,
          nama_lengkap: santri.nama_lengkap,
          success: true,
          message: 'Akun berhasil dibuat',
          username: santri.id_santri,
          password,
        });

        successCount++;
      } catch (error: any) {
        console.error(`[UserManagementService] Error creating account for ${santri.id_santri}:`, error);
        results.push({
          santri_id: santri.id,
          id_santri: santri.id_santri,
          nama_lengkap: santri.nama_lengkap,
          success: false,
          message: error.message || 'Gagal membuat akun',
        });
        failedCount++;
      }
    }

    return {
      total: santriList.length,
      success: successCount,
      failed: failedCount,
      results,
    };
  }
}

