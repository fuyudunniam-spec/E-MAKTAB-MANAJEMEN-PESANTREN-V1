import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

// CORS headers untuk semua response
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

// Helper function untuk membuat response dengan CORS
const createCorsResponse = (body: any, status: number = 200) => {
  const headers: Record<string, string> = { ...corsHeaders };
  
  if (body !== null && status !== 204) {
    headers['Content-Type'] = 'application/json';
  }
  
  return new Response(
    body === null ? null : (typeof body === 'string' ? body : JSON.stringify(body)),
    {
      status,
      headers,
    }
  );
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return createCorsResponse(null, 204);
  }

  console.log(`[update-user] ${req.method} request received`);

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createCorsResponse({ error: 'Missing authorization header' }, 401);
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Create admin client untuk update auth
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verify user is authenticated and is admin
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return createCorsResponse({ error: 'Unauthorized', details: authError?.message }, 401);
    }

    // Check if user is admin (via user_roles OR user_metadata)
    // First check metadata (bypass RLS/missing role record)
    const metaRole = user.user_metadata?.role;
    const isMetaAdmin = metaRole === 'admin' || metaRole === 'superadmin';
    
    let isAdmin = isMetaAdmin;
    
    if (!isAdmin) {
      // Fallback: Check user_roles table
      const { data: roles, error: rolesError } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin');

      if (!rolesError && roles && roles.length > 0) {
        isAdmin = true;
      }
    }

    if (!isAdmin) {
      return createCorsResponse({ error: 'Forbidden: Admin access required' }, 403);
    }

    // Parse request body
    const body = await req.json();
    console.log('[update-user] Full request body received:', JSON.stringify(body, null, 2));
    const { user_id, email, password, full_name, roles: userRoles, allowed_modules } = body;

    if (!user_id) {
      return createCorsResponse({ error: 'user_id is required' }, 400);
    }

    // Update auth user (email/password)
    if (email || password) {
      const updateData: any = {};
      if (email) updateData.email = email;
      if (password) updateData.password = password;

      const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
        user_id,
        updateData
      );

      if (updateAuthError) {
        console.error('[update-user] Failed to update auth user:', updateAuthError);
        return createCorsResponse({ 
          error: `Failed to update user: ${updateAuthError.message}`, 
          details: updateAuthError 
        }, 400);
      }
    }

    // Update profile - always check allowed_modules if provided, even if other fields are not being updated
    const profileUpdateData: any = {};
    
    if (full_name !== undefined) {
      profileUpdateData.full_name = full_name;
    }
    
    // Handle allowed_modules: ALWAYS process if key exists in body
    // This is critical - we need to check if the key exists, not just if value is defined
    // because null is a valid value that should be processed
    if ('allowed_modules' in body) {
      // Check if user will be staff (either already is, or roles are being updated)
      let isOrWillBeStaff = false;
      
      if (userRoles !== undefined) {
        // Roles are being updated - check if staff is in new roles
        isOrWillBeStaff = userRoles.includes('staff');
      } else {
        // Roles not being updated - check current roles
        const { data: currentRoles } = await supabaseAdmin
          .from('user_roles')
          .select('role')
          .eq('user_id', user_id);
        isOrWillBeStaff = currentRoles?.some(r => r.role === 'staff') || false;
      }
      
      console.log('[update-user] Processing allowed_modules:', {
        user_id,
        allowed_modules_request: allowed_modules,
        allowed_modules_in_body: 'allowed_modules' in body,
        isOrWillBeStaff,
        userRoles,
      });
      
      if (isOrWillBeStaff) {
        // Staff: set allowed_modules (can be array or null)
        profileUpdateData.allowed_modules = allowed_modules;
        console.log('[update-user] Setting allowed_modules for staff:', allowed_modules);
      } else {
        // Not staff - always null (admin = full access, others = fixed modules)
        profileUpdateData.allowed_modules = null;
        console.log('[update-user] Clearing allowed_modules (not staff)');
      }
    }

    if (Object.keys(profileUpdateData).length > 0) {
      console.log('[update-user] Updating profile with data:', JSON.stringify(profileUpdateData, null, 2));
      const { error: profileError, data: profileData } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdateData)
        .eq('id', user_id)
        .select('id, email, allowed_modules');

      if (profileError) {
        console.error('[update-user] Failed to update profile:', profileError);
        return createCorsResponse({ 
          error: `Failed to update profile: ${profileError.message}`, 
          details: profileError 
        }, 400);
      }
      
      console.log('[update-user] Profile updated successfully:', JSON.stringify(profileData, null, 2));
    } else {
      console.log('[update-user] No profile data to update');
    }

    // Update roles
    if (userRoles !== undefined) {
      // Delete all existing roles
      const { error: deleteError } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', user_id);

      if (deleteError) {
        console.error('[update-user] Failed to delete roles:', deleteError);
        // Continue anyway
      }

      // Insert new roles
      if (userRoles.length > 0) {
        const rolesToInsert = userRoles.map((role: string) => ({
          user_id: user_id,
          role: role,
        }));

        const { error: insertError } = await supabaseAdmin
          .from('user_roles')
          .insert(rolesToInsert);

        if (insertError) {
          console.error('[update-user] Failed to insert roles:', insertError);
          return createCorsResponse({ 
            error: `Failed to update roles: ${insertError.message}`, 
            details: insertError 
          }, 400);
        }
      }
    }

    return createCorsResponse({ success: true, message: 'User updated successfully' }, 200);

  } catch (error: any) {
    console.error('[update-user] Error:', error);
    return createCorsResponse({ 
      error: error.message || 'Internal server error', 
      details: error 
    }, 500);
  }
});

