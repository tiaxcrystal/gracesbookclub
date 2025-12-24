// supabase/supabaseClient.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;

// Lazy anon client (safe even if ANON key is missing)
function getSupabase() {
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!anonKey) {
    throw new Error('SUPABASE_ANON_KEY is required.');
  }
  return createClient(supabaseUrl, anonKey);
}

// Lazy admin client (you already did this right)
function getSupabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required.');
  }
  return createClient(supabaseUrl, serviceKey);
}

module.exports = { getSupabase, getSupabaseAdmin };
