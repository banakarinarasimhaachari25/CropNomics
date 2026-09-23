import { createClient } from '@supabase/supabase-js';

// Paste your actual URL inside the quotes below
const supabaseUrl = 'https://kibhchkwhmelqdppghvv.supabase.co'; 

// Paste your actual Anon Key inside the quotes below
const supabaseAnonKey = 'sb_publishable_RnT3kMJmhRCoC9On8q14yQ_gL9qlX_0';

export const isSupabaseConfigured = () => {
  return true; 
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);