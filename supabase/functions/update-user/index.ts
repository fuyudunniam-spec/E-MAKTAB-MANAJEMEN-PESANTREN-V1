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

    // Check if user is admin
    const { data: roles, error: rolesError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin');

    if (rolesError || !roles || roles.length === 0) {
      return createCorsResponse({ error: 'Forbidden: Admin access required' }, 403);
    }

    // Parse request body
    const body = await req.json();
    const { user_id, email, password, full_name, roles: userRoles } = body;

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

    // Update profile
    if (full_name !== undefined) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ full_name })
        .eq('id', user_id);

      if (profileError) {
        console.error('[update-user] Failed to update profile:', profileError);
        return createCorsResponse({ 
          error: `Failed to update profile: ${profileError.message}`, 
          details: profileError 
        }, 400);
      }
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

