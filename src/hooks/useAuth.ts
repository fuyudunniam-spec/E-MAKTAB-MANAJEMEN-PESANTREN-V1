import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { getUserRoles, getUserProfile, getUserPrimaryRole } from "@/services/auth.service";
import { canAccessModule, canAccessModuleWithUser, canPerformAction, type AppRole } from "@/utils/permissions";
import { logger } from "@/utils/logger";

export type UserRole = AppRole;

export interface User {
  id: string;
  email: string;
  role: UserRole;
  roles: string[]; // All roles user has
  name?: string;
  santriId?: string; // UUID dari tabel santri
  idSantri?: string; // ID Santri (format: BM240001)
  allowedModules?: string[] | null; // Module access list for admin users
  profile?: {
    full_name: string | null;
    email: string | null;
  };
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [testRoleOverride, setTestRoleOverride] = useState<string | null>(null);

  // Check for test role override in localStorage (for role switcher)
  useEffect(() => {
    const storedOverride = localStorage.getItem("test_role_override");
    if (storedOverride) {
      setTestRoleOverride(storedOverride);
    }
  }, []);

  // Fetch user role from database
  const fetchUserRole = useCallback(async (userId: string, supabaseUser: SupabaseUser) => {
    try {
      const [roles, profile, santriData] = await Promise.all([
        getUserRoles(userId).catch(err => {
          logger.warn("Error fetching roles, using default:", err);
          return [];
        }),
        getUserProfile(userId).catch(err => {
          logger.warn("Error fetching profile:", err);
          return null;
        }),
        // Fetch santri data if user is santri
        // Try RPC function first with timeout, fallback to direct query if RPC doesn't exist
        (async () => {
          try {
            // Try RPC function first with timeout
            const rpcPromise = supabase.rpc('get_santri_by_user_id', { p_user_id: userId });
            const timeoutPromise = new Promise((resolve) =>
              setTimeout(() => resolve({ data: null, error: { message: 'RPC timeout' } }), 3000)
            );

            const result: any = await Promise.race([rpcPromise, timeoutPromise]);
            const { data: rpcData, error: rpcError } = result;

            // Check if it's a CORS/network error - silently fail
            const isNetworkError = rpcError && (
              rpcError.message?.includes('CORS') ||
              rpcError.message?.includes('520') ||
              rpcError.message?.includes('523') ||
              rpcError.message?.includes('Failed to fetch') ||
              rpcError.message?.includes('unreachable') ||
              rpcError.message?.includes('Access-Control-Allow-Origin') ||
              rpcError.message?.includes('timeout')
            );

            if (isNetworkError) {
              // Silently fail for network errors, don't spam console
              return null;
            }

            if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
              return rpcData[0];
            }

            // Fallback: Query directly from santri table using user_id column
            // Link between auth user and santri is via user_id column in santri table
            const { data: santriData, error: santriError } = await supabase
              .from('santri')
              .select('*')
              .eq('user_id', userId)
              .limit(1)
              .maybeSingle();

            if (!santriError && santriData) {
              return santriData;
            }

            return null;
          } catch (err: any) {
            // Check if it's a CORS/network error - silently fail
            const isNetworkError = err?.message?.includes('CORS') ||
              err?.message?.includes('520') ||
              err?.message?.includes('523') ||
              err?.message?.includes('Failed to fetch') ||
              err?.message?.includes('unreachable') ||
              err?.message?.includes('Access-Control-Allow-Origin');

            if (isNetworkError) {
              // Silently fail for network errors
              return null;
            }

            // If RPC function doesn't exist (error 520/523 or CORS), try direct query
            if (err?.code === 'PGRST204' || err?.message?.includes('CORS') || err?.message?.includes('520') || err?.message?.includes('523')) {
              logger.warn('RPC function not available, trying direct query:', err);
              try {
                const { data: santriData, error: santriError } = await supabase
                  .from('santri')
                  .select('*')
                  .eq('user_id', userId)
                  .limit(1)
                  .maybeSingle();

                if (!santriError && santriData) {
                  return santriData;
                }
              } catch (fallbackErr) {
                logger.warn('Fallback query also failed:', fallbackErr);
              }
            } else {
              logger.warn('Error fetching santri data:', err);
            }
            return null;
          }
        })()
      ]);

      // Determine Primary Role based on multiple factors
      let primaryRole = 'santri'; // Default

      // 1. Check user_metadata first (set during signup)
      if (supabaseUser.user_metadata?.role) {
        primaryRole = supabaseUser.user_metadata.role;
      }

      // 2. Check santri status if available
      if (santriData) {
        if (santriData.status_santri === 'Calon') {
          primaryRole = 'santri_calon';
        } else if (santriData.status_santri === 'Aktif') {
          primaryRole = 'santri';
        }
      } else if (!roles.length) {
        // If NO santri data and NO admin/staff roles, 
        // they are likely a new applicant (Calon Santri) who hasn't completed registration data.
        primaryRole = 'santri_calon';
      }

      // 3. Check explicit roles table (overrides others if admin/staff)
      if (roles.length > 0) {
        // If user has admin/staff roles, prioritize them
        const highPrivilegeRoles = ['admin', 'pengurus', 'keuangan', 'pengajar'];
        const hasHighPrivilege = roles.some(r => highPrivilegeRoles.includes(r));
        
        if (hasHighPrivilege) {
           primaryRole = roles[0]; // Use the first high privilege role
        }
      }

      // Use test override if available (for debugging)
      const effectiveRole = testRoleOverride || primaryRole;

      const userData: User = {
        id: userId,
        email: supabaseUser.email || '',
        role: effectiveRole as UserRole,
        roles: roles,
        name: santriData?.nama_lengkap || profile?.full_name || supabaseUser.email?.split('@')[0] || 'User',
        santriId: santriData?.id,
        idSantri: santriData?.id_santri,
        allowedModules: (profile as any)?.allowed_modules || null,
        profile: profile ? {
          full_name: profile.full_name,
          email: profile.email
        } : undefined
      };

      setUser(userData);
      return userData;
    } catch (error) {
      logger.error("Error fetching user role:", error);
      // Fallback to default - always set user even if error
      const fallbackUser: User = {
        id: userId,
        email: supabaseUser.email || '',
        role: (testRoleOverride || 'santri') as UserRole,
        roles: [],
        name: supabaseUser.email?.split('@')[0] || 'User',
        allowedModules: null,
      };
      setUser(fallbackUser);
      return fallbackUser;
    }
  }, [testRoleOverride]);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;
    let hasSetLoading = false;

    const setLoadingFalse = () => {
      if (mounted && !hasSetLoading) {
        logger.log("✅ [useAuth] Setting loading to false");
        setLoading(false);
        hasSetLoading = true;
        if (timeoutId) clearTimeout(timeoutId);
      }
    };

    // Safety timeout - reduced for effectiveness
    timeoutId = setTimeout(() => {
      if (mounted && !hasSetLoading) {
        setLoading(false);
        hasSetLoading = true;
      }
    }, 1500);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        setSession(session);

        if (session?.user) {
          // Quick fetch role
          fetchUserRole(session.user.id, session.user)
            .finally(() => {
              if (mounted) setLoadingFalse();
            });
        } else {
          setUser(null);
          setLoadingFalse();
        }
      }
    );

    // Immediate session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted && !hasSetLoading) {
        if (!session) {
          setLoadingFalse();
        }
      }
    });

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [fetchUserRole]);

  const login = (userData: User) => {
    // This is kept for backward compatibility
    // In real app, login should be done via Supabase auth
    setUser(userData);
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      return { data, error };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  const logout = async () => {
    try {
      // Set flag to prevent redirect loops during logout
      sessionStorage.setItem('is_logging_out', 'true');

      // Clear all localStorage cache related to user/auth
      // Collect keys first to avoid modifying localStorage during iteration
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('user_roles_') || key === 'test_role_override')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Clear React state
      setUser(null);
      setSession(null);
      setTestRoleOverride(null);

      // Sign out from Supabase auth
      await supabase.auth.signOut();

      // Force full page reload to auth page to ensure clean state
      // Using window.location.href instead of navigate() to prevent race conditions
      // and ensure all React state, subscriptions, and effects are completely reset
      window.location.href = '/auth';
    } catch (error) {
      logger.error("Error during logout:", error);
      // Always redirect to auth page even if logout fails
      window.location.href = '/auth';
    }
  };

  const refreshRole = useCallback(async () => {
    if (session?.user) {
      await fetchUserRole(session.user.id, session.user);
    }
  }, [session, fetchUserRole]);

  const setTestRole = (role: string | null) => {
    if (role) {
      localStorage.setItem("test_role_override", role);
      setTestRoleOverride(role);
      // Update user role immediately
      if (user) {
        setUser({ ...user, role: role as UserRole });
      }
    } else {
      localStorage.removeItem("test_role_override");
      setTestRoleOverride(null);
      // Refresh role from database
      refreshRole();
    }
  };

  const hasPermission = (action: string): boolean => {
    if (!user) return false;
    return canPerformAction(user.role, action);
  };

  const canAccess = (module: string): boolean => {
    if (!user) return false;
    return canAccessModuleWithUser(user, module);
  };

  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "admin" || user?.role?.startsWith("admin_") || user?.role === "pengurus";
  const isViewer = user?.role === "pengurus" || user?.role === "santri";

  return {
    user,
    session,
    loading,
    login,
    logout,
    signIn,
    signUp,
    hasPermission,
    canAccess,
    isAdmin,
    isStaff,
    isViewer,
    refreshRole,
    setTestRole, // For role switcher in Settings
    testRoleOverride
  };
}
