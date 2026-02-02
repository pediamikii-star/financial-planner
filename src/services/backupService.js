import { supabase } from '../lib/supabase.js'

/* ======================================
   BACKUP SERVICE - MANUAL SYNC TO SUPABASE
   (Tidak mengganggu flow aplikasi yang ada)
====================================== */

class BackupService {
  constructor() {
    this.isBackingUp = false
    this.lastBackupTime = null
  }

  /* ======================
     CHECK USER LOGIN
  ====================== */
  async checkUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return user
    } catch (error) {
      console.error('Failed to get user:', error)
      return null
    }
  }

  /* ======================
     GET ALL LOCAL DATA
  ====================== */
  getAllLocalData() {
    return {
      accounts: JSON.parse(localStorage.getItem('accounts') || '[]'),
      assets: JSON.parse(localStorage.getItem('assets') || '[]'),
      investments: JSON.parse(localStorage.getItem('investments') || '[]'),
      goals: JSON.parse(localStorage.getItem('goals') || '[]'),
      transactions: JSON.parse(localStorage.getItem('transactions') || '[]'),
      // tambah lainnya sesuai kebutuhan
      backup_timestamp: new Date().toISOString(),
      device_info: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
      }
    }
  }

  /* ======================
     BACKUP TO SUPABASE
  ====================== */
  async backupToCloud() {
    if (this.isBackingUp) {
      return { success: false, message: 'Backup sedang berjalan' }
    }

    try {
      this.isBackingUp = true
      
      // 1. Cek user login
      const user = await this.checkUser()
      if (!user) {
        return { 
          success: false, 
          message: 'Silakan login terlebih dahulu',
          action: 'login_required'
        }
      }

      // 2. Ambil semua data dari localStorage
      const localData = this.getAllLocalData()
      const totalRecords = Object.values(localData)
        .filter(Array.isArray)
        .reduce((sum, arr) => sum + arr.length, 0)

      if (totalRecords === 0) {
        return { 
          success: false, 
          message: 'Tidak ada data untuk di-backup' 
        }
      }

      // 3. Prepare data untuk Supabase
      const backupData = {
        user_id: user.id,
        backup_data: localData,
        backup_size: JSON.stringify(localData).length,
        record_counts: {
          accounts: localData.accounts.length,
          assets: localData.assets.length,
          investments: localData.investments.length,
          goals: localData.goals.length,
          transactions: localData.transactions.length
        },
        device_info: localData.device_info
      }

      // 4. Upload ke Supabase
      const { data, error } = await supabase
        .from('user_backups')
        .upsert([backupData], {
          onConflict: 'user_id',
          ignoreDuplicates: false
        })
        .select()

      if (error) throw error

      // 5. Update status
      this.lastBackupTime = new Date()
      
      // 6. Simpan metadata di localStorage
      localStorage.setItem('last_backup_time', this.lastBackupTime.toISOString())
      localStorage.setItem('last_backup_size', backupData.backup_size)

      return {
        success: true,
        message: `Backup berhasil! ${totalRecords} data tersimpan di cloud`,
        timestamp: this.lastBackupTime.toISOString(),
        counts: backupData.record_counts
      }

    } catch (error) {
      console.error('Backup failed:', error)
      return {
        success: false,
        message: `Gagal backup: ${error.message}`,
        error: error.message
      }
    } finally {
      this.isBackingUp = false
    }
  }

  /* ======================
     RESTORE FROM CLOUD
  ====================== */
  async restoreFromCloud() {
    try {
      // 1. Cek user login
      const user = await this.checkUser()
      if (!user) {
        return { 
          success: false, 
          message: 'Silakan login terlebih dahulu' 
        }
      }

      // 2. Ambil backup terbaru dari Supabase
      const { data: backups, error } = await supabase
        .from('user_backups')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) throw error

      if (!backups || backups.length === 0) {
        return { 
          success: false, 
          message: 'Tidak ada backup di cloud' 
        }
      }

      const latestBackup = backups[0]
      
      // 3. Restore ke localStorage
      const backupData = latestBackup.backup_data
      
      // Simpan ke localStorage
      localStorage.setItem('accounts', JSON.stringify(backupData.accounts || []))
      localStorage.setItem('assets', JSON.stringify(backupData.assets || []))
      localStorage.setItem('investments', JSON.stringify(backupData.investments || []))
      localStorage.setItem('goals', JSON.stringify(backupData.goals || []))
      localStorage.setItem('transactions', JSON.stringify(backupData.transactions || []))
      
      // Simpan metadata restore
      localStorage.setItem('last_restore_time', new Date().toISOString())
      localStorage.setItem('last_restore_from', latestBackup.created_at)

      // 4. Trigger events untuk update UI
      window.dispatchEvent(new Event('accountsUpdated'))
      window.dispatchEvent(new Event('assetsUpdated'))
      window.dispatchEvent(new Event('investmentsUpdated'))
      window.dispatchEvent(new Event('goalsUpdated'))
      window.dispatchEvent(new Event('transactionsUpdated'))

      return {
        success: true,
        message: `Restore berhasil! ${backupData.accounts.length + backupData.assets.length + backupData.investments.length} data dipulihkan`,
        timestamp: new Date().toISOString(),
        backup_date: latestBackup.created_at,
        counts: latestBackup.record_counts
      }

    } catch (error) {
      console.error('Restore failed:', error)
      return {
        success: false,
        message: `Gagal restore: ${error.message}`,
        error: error.message
      }
    }
  }

  /* ======================
     GET BACKUP HISTORY
  ====================== */
  async getBackupHistory() {
    try {
      const user = await this.checkUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('user_backups')
        .select('id, created_at, backup_size, record_counts')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      return data || []

    } catch (error) {
      console.error('Failed to get backup history:', error)
      return []
    }
  }

  /* ======================
     CHECK BACKUP STATUS
  ====================== */
  getBackupStatus() {
    const lastBackup = localStorage.getItem('last_backup_time')
    const lastRestore = localStorage.getItem('last_restore_time')
    
    return {
      lastBackup: lastBackup ? new Date(lastBackup).toLocaleString() : 'Belum pernah',
      lastRestore: lastRestore ? new Date(lastRestore).toLocaleString() : 'Belum pernah',
      backupSize: localStorage.getItem('last_backup_size') || '0',
      isLoggedIn: supabase.auth.getUser().then(r => !!r.data.user)
    }
  }

  /* ======================
     AUTO BACKUP (BACKGROUND)
  ====================== */
  async autoBackupIfNeeded() {
    // Cek jika sudah 1 jam sejak backup terakhir
    const lastBackup = localStorage.getItem('last_backup_time')
    if (lastBackup) {
      const hoursSinceLastBackup = (new Date() - new Date(lastBackup)) / (1000 * 60 * 60)
      if (hoursSinceLastBackup < 1) return // Skip jika belum 1 jam
    }

    // Cek user login dan online
    const user = await this.checkUser()
    if (!user || !navigator.onLine) return

    // Lakukan backup di background
    try {
      const result = await this.backupToCloud()
      if (result.success) {
        console.log('Auto-backup successful:', result.message)
      }
    } catch (error) {
      console.log('Auto-backup failed (non-critical):', error)
    }
  }

  /* ======================
     INIT AUTO BACKUP SCHEDULER
  ====================== */
  initAutoBackup() {
    // Backup setiap 1 jam
    setInterval(() => {
      this.autoBackupIfNeeded()
    }, 60 * 60 * 1000) // 1 jam

    // Backup saat page visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.autoBackupIfNeeded()
      }
    })
  }
}

// Export singleton instance
export const backupService = new BackupService()

/* ======================================
   SIMPLE EXPORT FUNCTIONS
   (Untuk yang prefer simple functions)
====================================== */

// Manual backup function
export async function backupToCloud() {
  return await backupService.backupToCloud()
}

// Manual restore function
export async function restoreFromCloud() {
  return await backupService.restoreFromCloud()
}

// Get backup status
export function getBackupStatus() {
  return backupService.getBackupStatus()
}

// Get backup history
export async function getBackupHistory() {
  return await backupService.getBackupHistory()
}