const { createClient } = require("@supabase/supabase-js");
const {
  supabaseUrl,
  supabaseAnonKey,
  supabaseServiceRoleKey
} = require("../config/env");

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const authClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = { supabase, authClient };
