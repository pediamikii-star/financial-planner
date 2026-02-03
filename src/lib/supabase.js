import { createClient } from '@supabase/supabase-js'

// ============================================
// 1. GET ENVIRONMENT VARIABLES
// ============================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// ============================================
// 2. VALIDASI ENVIRONMENT VARIABLES (HANYA DI DEVELOPMENT)
// ============================================
if (import.meta.env.DEV) {
  if (!supabaseUrl) {
    console.warn('⚠️  VITE_SUPABASE_URL is not defined in .env.local')
    console.warn('Please add: VITE_SUPABASE_URL=https://your-project.supabase.co')
  }

  if (!supabaseAnonKey) {
    console.warn('⚠️  VITE_SUPABASE_ANON_KEY is not defined in .env.local')
    console.warn('Get it from: Supabase Dashboard → Settings → API → anon public key')
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('📝 Current values:')
    console.warn('- VITE_SUPABASE_URL:', supabaseUrl || '(empty)')
    console.warn('- VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '***set***' : '(empty)')
  }
}

// ============================================
// 3. CREATE SUPABASE CLIENT
// ============================================
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

// ============================================
// 4. HELPER FUNCTION: GET CURRENT USER
// ============================================
export async function getCurrentUser() {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase not configured')
      return null
    }
    
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
// 5. HELPER FUNCTION: CHECK IF ONLINE
// ============================================
export function isOnline() {
  return navigator.onLine
}

// ============================================
// 6. AUTH STATE LISTENER
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
// 7. TEST CONNECTION (Hanya di development)
// ============================================
if (import.meta.env.DEV) {
  setTimeout(async () => {
    console.log('🔍 Testing Supabase connection...')
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('⚠️ Skipping test: Environment variables missing')
      return
    }
    
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
}