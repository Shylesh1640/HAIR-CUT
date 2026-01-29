import { createClient } from '@supabase/supabase-js';

// Sanitize URL to remove potential trailing slash
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase Setup: Credentials missing! Check your .env file.');
}

export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

console.log('Supabase Setup: Client initialized status:', !!supabase);
