import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // HARDCORE FIX FOR PRODUCTION
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://wdpvrpiqzoovnfjubepf.supabase.co'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkcHZycGlxem9vdm5manViZXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNDI3NTAsImV4cCI6MjA4NTYxODc1MH0.Cb-2wB2mVx5V8ArrDFmBUO3xn-K9LrfGnsfjJSeqaMk')
  }
})