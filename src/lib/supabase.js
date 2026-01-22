import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://awivwilqdhqsqofefbjg.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_qV_9DeQTRpqpIbljcGEKYw_rWEt4cfr';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.warn('Missing Supabase URL or Anon Key. Authentication will not work.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
