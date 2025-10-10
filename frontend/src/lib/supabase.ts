import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Usar valores directos como fallback si las variables de entorno no están disponibles
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gmqtbdgkmmlorxeadbih.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtcXRiZGdrbW1sb3J4ZWFkYmloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMDIxMDcsImV4cCI6MjA3MjU3ODEwN30.ZUXhbNQzqRVhXqIP85E8wsohwEjiyHxR0D7ZZpFXJpg';

console.log('Supabase config:', { url: supabaseUrl, hasKey: !!supabaseAnonKey });

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: true,
    detectSessionInUrl: true,
    persistSession: true,
    storage: window.localStorage
  }
});Thu Oct  9 23:31:25 -03 2025
