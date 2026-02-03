import { createClient } from '@supabase/supabase-js'

// ============================================
// 1. HARDCODE UNTUK TESTING - GANTI INI DULU
// ============================================
const supabaseUrl = 'https://wdpvrpiqzoovnfjubepf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkcHZycGlxem9vdm5manViZXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNDI3NTAsImV4cCI6MjA4NTYxODc1MH0.Cb-2wB2mVx5V8ArrDFmBUO3xn-K9LrfGnsfjJSeqaMk'

console.log('🔧 Supabase URL:', supabaseUrl)
console.log('🔧 Supabase Key loaded:', !!supabaseAnonKey)

// ============================================
// 2. CREATE SUPABASE CLIENT
// ============================================
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================
// 3. HELPER FUNCTION: GET CURRENT USER
// ============================================
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.warn('⚠️ Auth error:', error.message)
      return null
    }
    
    return user
  } catch (error) {
    console.error('❌ Error getting user:', error)
    return null
  }
}

// ============================================
// 4. HELPER FUNCTION: CHECK IF ONLINE
// ============================================
export function isOnline() {
  return navigator.onLine
}

// ============================================
// 5. AUTH STATE LISTENER
// ============================================

supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('🔐 Auth event:', event);
  
  // Dispatch custom event untuk React App
  window.dispatchEvent(new CustomEvent('supabase:auth', { 
    detail: { event, session, user: session?.user } 
  }));
  
  if (event === 'SIGNED_IN' && session) {
    console.log('✅ User logged in:', session.user.email);
    
    // Auto sync setelah 2 detik
    setTimeout(async () => {
      try {
        const storage = await import('/src/services/storage.js');
        const status = await storage.getSyncStatus();
        
        if (status.unsynced.accounts > 0 || status.unsynced.assets > 0) {
          console.log('🔄 Auto syncing data...');
          const results = await storage.syncAllToCloud();
          console.log('Auto sync results:', results);
        }
      } catch (error) {
        console.error('Auto sync error:', error);
      }
    }, 2000);
  }
  
  if (event === 'SIGNED_OUT') {
    console.log('👋 User signed out');
  }
});

// ============================================
// 6. TEST CONNECTION
// ============================================
setTimeout(async () => {
  console.log('🔍 Testing Supabase connection...')
  
  try {
    const { data, error } = await supabase
      .from('accounts')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Database test failed:', error.message)
    } else {
      console.log('✅ Supabase connection successful!')
    }
  } catch (error) {
    console.error('❌ Connection test crashed:', error)
  }
}, 3000)