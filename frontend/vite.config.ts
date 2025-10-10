import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Cargar variables de entorno
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || 'https://gmqtbdgkmmlorxeadbih.supabase.co'),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtcXRiZGdrbW1sb3J4ZWFkYmloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMDIxMDcsImV4cCI6MjA3MjU3ODEwN30.ZUXhbNQzqRVhXqIP85E8wsohwEjiyHxR0D7ZZpFXJpg'),
    },
  };
});
