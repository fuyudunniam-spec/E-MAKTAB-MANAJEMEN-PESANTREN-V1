import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  updated_at: string;
  allowed_modules?: string[] | null; // Module access list for admin users
}

// Flag untuk mencegah spam error CORS di console
let corsErrorShown = false;
const CORS_ERROR_KEY = 'cors_error_shown';

// Helper untuk menampilkan warning CORS hanya sekali
function showCorsWarningOnce() {
  if (corsErrorShown) return;
  
  // Cek sessionStorage juga untuk persist across page reloads
  if (sessionStorage.getItem(CORS_ERROR_KEY)) {
    corsErrorShown = true;
    return;
  }
  
  corsErrorShown = true;
  sessionStorage.setItem(CORS_ERROR_KEY, 'true');
  
  console.warn('⚠️ auth.service: Supabase unreachable (CORS/523/timeout)');
  console.warn('   🔧 SOLUSI: Konfigurasi CORS di Supabase Dashboard:');
  console.warn('   1. Buka https://supabase.com/dashboard');
  console.warn('   2. Pilih project → Settings → API');
  console.warn('   3. Tambahkan "http://localhost:8080" ke Allowed Origins');
  console.warn('   4. Lihat CORS_FIX_GUIDE.md untuk detail lengkap');
  console.warn('   (Warning ini hanya ditampilkan sekali per session)');
}

// Reset flag saat CORS berhasil (untuk testing)
export function resetCorsWarning() {
  corsErrorShown = false;
  sessionStorage.removeItem(CORS_ERROR_KEY);
}

export interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

/**
 * Get all roles for a user from the user_roles table
 * @param userId - The user ID from auth.users
 * @returns Array of role strings
 */
export async function getUserRoles(userId: string): Promise<string[]> {
  try {
    console.log('📋 auth.service: Fetching roles for user', userId);
    
    // Check localStorage cache first (faster)
    const cacheKey = `user_roles_${userId}`;
    const cachedRoles = localStorage.getItem(cacheKey);
    if (cachedRoles) {
      try {
        const roles = JSON.parse(cachedRoles);
        const cacheTime = localStorage.getItem(`${cacheKey}_time`);
        // Cache valid for 5 minutes
        if (cacheTime && Date.now() - parseInt(cacheTime) < 5 * 60 * 1000) {
          console.log('✅ auth.service: Using cached roles for user', userId, ':', roles);
          return roles;
        }
      } catch (e) {
        // Invalid cache, continue to fetch
      }
    }
    
    // Try direct query first (faster, no RPC overhead)
    // Reduced timeout to 2 seconds for faster failover
    const directQueryPromise = supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => resolve({ data: null, error: { message: 'Query timeout' } }), 2000);
    });

    const result: any = await Promise.race([directQueryPromise, timeoutPromise]);
    const { data, error } = result;

    if (error || !data) {
      // Check if it's a CORS error - if so, skip fallback and return empty
      const isCorsError = error?.message?.includes('CORS') || 
                         error?.message?.includes('523') || 
                         error?.message?.includes('Failed to fetch') ||
                         error?.message?.includes('unreachable') ||
                         error?.message?.includes('Access-Control-Allow-Origin') ||
                         error?.message?.includes('520');
      
      if (isCorsError) {
        showCorsWarningOnce();
        return [];
      }
      
      if (error) {
        console.error('❌ auth.service: Error fetching user roles via direct query:', error);
        console.error('   Error code:', error.code, 'Error message:', error.message);
      }
      
      // Fallback to RPC function if direct query fails
      console.warn('⚠️ auth.service: Direct query failed, trying RPC function...');
      try {
        const rpcPromise = supabase
          .rpc('get_user_roles', { _user_id: userId });
        
        const rpcTimeoutPromise = new Promise((resolve) => {
          setTimeout(() => resolve({ data: null, error: { message: 'RPC timeout' } }), 3000);
        });

        const rpcResult: any = await Promise.race([rpcPromise, rpcTimeoutPromise]);
        const { data: rpcData, error: rpcError } = rpcResult;
        
        if (rpcError || !rpcData) {
          // Check if it's a CORS error
          const isCorsError = rpcError?.message?.includes('CORS') || 
                             rpcError?.message?.includes('523') || 
                             rpcError?.message?.includes('Failed to fetch') ||
                             rpcError?.message?.includes('unreachable') ||
                             rpcError?.message?.includes('Access-Control-Allow-Origin') ||
                             rpcError?.message?.includes('520');
          
          if (isCorsError) {
            showCorsWarningOnce();
          } else {
            console.error('❌ auth.service: RPC function also failed:', rpcError);
          }
          return [];
        }
        
        if (rpcData.length === 0) {
          console.warn('⚠️ auth.service: No roles found for user', userId, '- using default santri');
          return [];
        }
        
        const roles = rpcData.map((row: any) => row.role);
        console.log('✅ auth.service: Found roles via RPC for user', userId, ':', roles);
        
        // Cache roles in localStorage
        try {
          localStorage.setItem(cacheKey, JSON.stringify(roles));
          localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
        } catch (e) {
          // localStorage might be full, ignore
        }
        
        return roles;
      } catch (fallbackError) {
        console.error('❌ auth.service: RPC fallback also failed:', fallbackError);
        return [];
      }
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ auth.service: No roles found for user', userId, '- using default santri');
      return [];
    }

    const roles = data.map((row: any) => row.role);
    console.log('✅ auth.service: Found roles for user', userId, ':', roles);
    
    // Cache roles in localStorage
    try {
      localStorage.setItem(cacheKey, JSON.stringify(roles));
      localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
    } catch (e) {
      // localStorage might be full, ignore
    }
    
    return roles;
  } catch (error: any) {
    // Check if it's a CORS error
    const isCorsError = error?.message?.includes('CORS') || 
                       error?.message?.includes('523') || 
                       error?.message?.includes('Failed to fetch') ||
                       error?.message?.includes('unreachable') ||
                       error?.message?.includes('Access-Control-Allow-Origin') ||
                       error?.message?.includes('520');
    
    if (isCorsError) {
      showCorsWarningOnce();
    } else {
      console.error('❌ auth.service: Error in getUserRoles:', error);
      console.error('   Error type:', error?.constructor?.name);
    }
    // Always return empty array instead of throwing
    return [];
  }
}

/**
 * Get user profile from the profiles table
 * @param userId - The user ID from auth.users
 * @returns UserProfile or null if not found
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    console.log('👤 auth.service: Fetching profile for user', userId);
    
    // Add timeout to prevent hanging on CORS/523 errors
    // Explicitly select allowed_modules to ensure it's included
    const queryPromise = supabase
      .from('profiles')
      .select('id, email, full_name, created_at, updated_at, allowed_modules')
      .eq('id', userId)
      .single();
    
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => resolve({ data: null, error: { message: 'Query timeout - Supabase unreachable', code: 'TIMEOUT' } }), 3000);
    });

    const result: any = await Promise.race([queryPromise, timeoutPromise]);
    const { data, error } = result;

    if (error) {
      // Handle different error types
      if (error.code === 'PGRST116') {
        // Profile not found - this is OK
        console.warn('⚠️ auth.service: Profile not found for user', userId, '- this is OK, will use defaults');
        return null;
      }
      
      // Handle CORS/523 errors gracefully
      if (error.message?.includes('CORS') || 
          error.message?.includes('523') || 
          error.message?.includes('Failed to fetch') ||
          error.message?.includes('unreachable') ||
          error.message?.includes('Access-Control-Allow-Origin') ||
          error.code === 'TIMEOUT') {
        showCorsWarningOnce();
        // Return null gracefully - app can still work without profile
        return null;
      }
      
      console.error('❌ auth.service: Error fetching user profile:', error);
      // Don't throw, return null instead
      return null;
    }

    console.log('✅ auth.service: Found profile for user', userId);
    return data as UserProfile;
  } catch (error: any) {
    // Handle network errors gracefully
    if (error?.message?.includes('CORS') || 
        error?.message?.includes('523') || 
        error?.message?.includes('Failed to fetch') ||
        error?.message?.includes('unreachable') ||
        error?.message?.includes('Access-Control-Allow-Origin') ||
        error?.message?.includes('520')) {
      showCorsWarningOnce();
      return null;
    }
    
    // Hanya log error jika bukan CORS error (untuk menghindari spam)
    console.error('❌ auth.service: Error in getUserProfile:', error);
    // Always return null instead of throwing
    return null;
  }
}

/**
 * Get primary role for a user (first role in the array, or 'santri' as default)
 * @param userId - The user ID from auth.users
 * @returns Primary role string
 */
export async function getUserPrimaryRole(userId: string): Promise<string> {
  const roles = await getUserRoles(userId);
  
  if (roles.length === 0) {
    return 'santri'; // Default role
  }

  // If user has 'admin' role, prioritize it
  if (roles.includes('admin')) {
    return 'admin';
  }

  // Return first role as primary
  return roles[0];
}

