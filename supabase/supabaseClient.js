// supabase/supabaseClient.js
const { createClient } = require('@supabase/supabase-js');

// Public anon client (for general reads)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Runtime-safe admin client (for writes that bypass RLS)
function getSupabaseAdmin() {
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseServiceRoleKey) {
    throw new Error('supabaseKey is required.');
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

module.exports = { supabase, getSupabaseAdmin };
