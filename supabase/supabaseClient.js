console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log(
  'SUPABASE_SERVICE_ROLE_KEY:',
  process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING'
);

// supabase/supabaseClient.js
const { createClient } = require('@supabase/supabase-js');

// Public anon client (for general reads)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service role client (for writes that need to bypass RLS)
let supabaseAdmin;
function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) throw new Error('supabaseKey is required.');
    supabaseAdmin = createClient(supabaseUrl, key);
  }
  return supabaseAdmin;
}

module.exports = { supabase, getSupabaseAdmin };
