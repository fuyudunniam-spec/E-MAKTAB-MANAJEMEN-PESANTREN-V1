import { createClient } from '@supabase/supabase-js';

// Gunakan environment variables jika tersedia, fallback ke hardcoded values untuk development
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://dwyemauojftlyzzgujgh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3eWVtYXVvamZ0bHl6emd1amdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNjkyMDcsImV4cCI6MjA3NDk0NTIwN30.AYYJ3ikwLY1hnt1njt4S-gCliMTEJ_trUYkMri6MUas";

// Validasi bahwa URL dan key tersedia
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error('❌ [Supabase] Missing configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local');
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'x-app-module': 'tabungan',
      // Alias headers to accommodate backend variations
      'x-module': 'tabungan',
      'x-source-module': 'tabungan',
    }
  }
});