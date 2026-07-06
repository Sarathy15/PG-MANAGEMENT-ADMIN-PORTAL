const { createClient } = require('@supabase/supabase-js');
const { createSupabaseLikeClient } = require('./localDataStore');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.warn('⚠️ Supabase client setup failed, using local fallback store:', error.message);
    supabase = createSupabaseLikeClient();
  }
} else {
  console.warn('⚠️ SUPABASE_URL or SUPABASE_KEY missing, using local fallback store.');
  supabase = createSupabaseLikeClient();
}

module.exports = supabase;
