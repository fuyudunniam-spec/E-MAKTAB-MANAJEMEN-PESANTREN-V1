import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

// CORS headers untuk semua response
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

// Helper function untuk membuat response dengan CORS
const createCorsResponse = (body: any, status: number = 200) => {
  const headers: Record<string, string> = { ...corsHeaders };
  
  // Untuk OPTIONS request (204), tidak perlu Content-Type
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
  // Handle CORS preflight - HARUS di-handle pertama kali
  if (req.method === 'OPTIONS') {
    return createCorsResponse(null, 204);
  }

  // Log request untuk debugging
  console.log(`[create-user] ${req.method} request received`);

  try {

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[create-user] Missing authorization header');
      return createCorsResponse({ error: 'Missing authorization header' }, 401);
    }

    // Create Supabase client with user's token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user is authenticated and is admin
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('[create-user] Auth error:', authError?.message);
      return createCorsResponse({ error: 'Unauthorized', details: authError?.message }, 401);
    }

    // Check if user is admin
    const { data: roles, error: rolesError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin');

    if (rolesError || !roles || roles.length === 0) {
      console.error('[create-user] User is not admin');
      return createCorsResponse({ error: 'Forbidden: Admin access required', details: rolesError?.message }, 403);
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
      console.log('[create-user] Request body received:', { 
        email: body.email, 
        full_name: body.full_name,
        roles: body.roles,
        allowed_modules: body.allowed_modules,
      });
    } catch (parseError) {
      console.error('[create-user] JSON parse error:', parseError);
      return createCorsResponse({ error: 'Invalid JSON in request body', details: String(parseError) }, 400);
    }

    const {
      email,
      password,
      full_name,
      roles: userRoles,
      allowed_modules,
      create_pengajar = false,
      pengajar_nama,
      pengajar_kode,
      pengajar_program,
      pengajar_kontak,
    } = body;

    // Validate input
    if (!email || !password || !full_name || !userRoles || userRoles.length === 0) {
      console.error('[create-user] Missing required fields:', { email: !!email, password: !!password, full_name: !!full_name, roles: userRoles });
      return createCorsResponse({ error: 'Missing required fields: email, password, full_name, roles' }, 400);
    }

    // Create Supabase Admin Client (using service role key)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Create user in auth.users
    const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name,
      },
    });

    if (createError) {
      console.error('[create-user] Failed to create auth user:', createError);
      return createCorsResponse({ error: `Failed to create user: ${createError.message}`, details: createError }, 400);
    }

    const userId = authUser.user.id;

    // Wait a bit for trigger to complete (handle_new_user trigger creates profile and default 'santri' role)
    await new Promise(resolve => setTimeout(resolve, 500));

    // Update profile (trigger already created it, but we want to ensure correct data)
    const profileUpdateData: any = {
      id: userId,
      email,
      full_name,
    };
    
    // Set allowed_modules only for staff (admin always null = full access)
    if (userRoles.includes('staff')) {
      // Staff: set allowed_modules if provided (can be null or array)
      if (allowed_modules !== undefined) {
        profileUpdateData.allowed_modules = allowed_modules;
      } else {
        // If not provided, set to null (should not happen due to validation, but handle gracefully)
        profileUpdateData.allowed_modules = null;
      }
    } else {
      // Admin, pengajar, santri: always null (admin = full access, others = fixed modules)
      profileUpdateData.allowed_modules = null;
    }
    
    console.log('[create-user] Setting allowed_modules:', {
      userRoles,
      allowed_modules_request: allowed_modules,
      allowed_modules_set: profileUpdateData.allowed_modules,
      isStaff: userRoles.includes('staff'),
    });
    
    console.log('[create-user] Profile update data before upsert:', JSON.stringify(profileUpdateData, null, 2));
    
    const { error: profileError, data: profileData } = await supabaseAdmin
      .from('profiles')
      .upsert(profileUpdateData, {
        onConflict: 'id',
      })
      .select('id, email, allowed_modules');

    if (profileError) {
      console.error('[create-user] Failed to update profile:', profileError);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return createCorsResponse({ error: `Failed to update profile: ${profileError.message}`, details: profileError }, 400);
    }
    
    console.log('[create-user] Profile updated successfully:', {
      profile_id: profileData?.[0]?.id,
      email: profileData?.[0]?.email,
      allowed_modules: profileData?.[0]?.allowed_modules,
      allowed_modules_type: typeof profileData?.[0]?.allowed_modules,
      allowed_modules_isArray: Array.isArray(profileData?.[0]?.allowed_modules),
    });

    // Delete default 'santri' role created by trigger (if user doesn't want it)
    // Then insert the actual roles requested
    const rolesToInsert = userRoles.map((role: string) => ({
      user_id: userId,
      role: role,
    }));

    // First, delete all existing roles for this user (including default 'santri' from trigger)
    const { error: deleteRolesError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (deleteRolesError) {
      console.error('[create-user] Failed to delete existing roles:', deleteRolesError);
      // Continue anyway, might not have roles yet
    }

    // Then insert the requested roles
    const { error: rolesInsertError } = await supabaseAdmin
      .from('user_roles')
      .insert(rolesToInsert);

    if (rolesInsertError) {
      // Clean up on error
      console.error('[create-user] Failed to assign roles:', rolesInsertError);
      await supabaseAdmin.from('profiles').delete().eq('id', userId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return createCorsResponse({ error: `Failed to assign roles: ${rolesInsertError.message}`, details: rolesInsertError }, 400);
    }

    // Create pengajar if needed
    let pengajarId: string | undefined;
    if (create_pengajar && pengajar_nama) {
      const { data: pengajarData, error: pengajarError } = await supabaseAdmin
        .from('akademik_pengajar')
        .insert({
          user_id: userId,
          nama_lengkap: pengajar_nama,
          kode_pengajar: pengajar_kode || null,
          program_spesialisasi: pengajar_program || null,
          kontak: pengajar_kontak || null,
          status: 'Aktif',
        })
        .select('id')
        .single();

      if (pengajarError) {
        console.error('Failed to create pengajar:', pengajarError);
        // Don't fail the whole operation, just log the error
      } else {
        pengajarId = pengajarData.id;
      }
    }

    console.log('[create-user] User created successfully:', userId);
    return createCorsResponse({
      success: true,
      user_id: userId,
      pengajar_id: pengajarId,
      message: 'User created successfully',
    }, 200);
  } catch (error: any) {
    console.error('[create-user] Unexpected error:', error);
    return createCorsResponse({ 
      error: error.message || 'Internal server error',
      details: error.stack || error.toString(),
    }, 500);
  }
});

