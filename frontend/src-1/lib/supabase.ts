import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/supabase.config';

console.log('Supabase initialized:', { url: SUPABASE_URL, keyLength: SUPABASE_ANON_KEY.length });

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: true,
    detectSessionInUrl: true,
    persistSession: true,
    storage: window.localStorage
  }
});
