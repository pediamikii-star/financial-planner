import { supabase, getCurrentUser } from '../lib/supabase.js'

/* ======================================
   SUPABASE SYNC HELPERS
====================================== */

const syncService = {
  // Cek apakah harus sync ke cloud
  async shouldSync() {
    try {
      const user = await getCurrentUser()
      const online = navigator.onLine
      return user && online
    } catch {
      return false
    }
  },

  // Sync data ke Supabase
  async syncToSupabase(table, data, options = {}) {
    try {
      const user = await getCurrentUser()
      if (!user) return { success: false, error: 'No user' }

      // Transform data untuk Supabase
      const transformed = data.map(item => ({
        ...item,
        user_id: user.id,
        local_id: item.id, // Simpan ID lokal sebagai reference
        id: undefined, // Supabase akan generate UUID baru
        synced_at: new Date().toISOString()
      }))

      // Upsert ke Supabase
      const { error } = await supabase
        .from(table)
        .upsert(transformed, {
          onConflict: 'local_id,user_id',
          ignoreDuplicates: false
        })

      if (error) throw error

      // Tandai data sebagai sudah sync di localStorage
      if (options.markAsSynced) {
        data.forEach(item => {
          item.synced = true
          item.synced_at = new Date().toISOString()
        })
      }

      return { 
        success: true, 
        count: transformed.length,
        table 
      }
    } catch (error) {
      console.error(`Sync ${table} failed:`, error)
      return { success: false, error: error.message }
    }
  },

  // Load data dari Supabase
  async loadFromSupabase(table) {
    try {
      const user = await getCurrentUser()
      if (!user) return []

      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Transform kembali: gunakan local_id sebagai id
      return (data || []).map(item => ({
        ...item,
        id: item.local_id || item.id,
        synced: true
      }))
    } catch (error) {
      console.error(`Load ${table} from cloud failed:`, error)
      return []
    }
  },

  // Merge local dan cloud data
  async mergeData(localKey, table) {
    const localData = JSON.parse(localStorage.getItem(localKey) || '[]')
    
    if (!(await this.shouldSync())) {
      return localData
    }

    try {
      // Load dari cloud
      const cloudData = await this.loadFromSupabase(table)
      
      if (cloudData.length === 0) {
        // Cloud kosong, upload data local
        if (localData.length > 0) {
          await this.syncToSupabase(table, localData)
        }
        return localData
      }

      // Merge strategy: cloud sebagai source of truth
      const localMap = new Map(localData.filter(d => !d.synced).map(d => [d.id, d]))
      const cloudMap = new Map(cloudData.map(d => [d.id, d]))

      // Gabungkan: cloud data + local unsynced data
      const merged = [
        ...cloudData, // Data dari cloud
        ...Array.from(localMap.values()).filter(localItem => 
          !cloudMap.has(localItem.id) // Hanya ambil yang belum ada di cloud
        )
      ]

      // Simpan merged data ke localStorage
      localStorage.setItem(localKey, JSON.stringify(merged))
      
      return merged
    } catch (error) {
      console.error('Merge failed, using local data:', error)
      return localData
    }
  }
}

/* ======================================
   ACCOUNTS STORAGE (DIMODIFIKASI)
====================================== */

const ACCOUNTS_KEY = "accounts";
const ACCOUNTS_TABLE = "accounts";

export async function getAccounts() {
  // Jika ada user, merge dengan cloud data
  if (await syncService.shouldSync()) {
    return await syncService.mergeData(ACCOUNTS_KEY, ACCOUNTS_TABLE)
  }
  return JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || [];
}

export async function saveAccount(account) {
  const accounts = await getAccounts()
  
  // Generate ID jika belum ada
  if (!account.id) {
    account.id = crypto.randomUUID()
    account.created_at = new Date().toISOString()
  }
  
  account.updated_at = new Date().toISOString()
  account.synced = false
  
  // Cek apakah update atau create
  const existingIndex = accounts.findIndex(acc => acc.id === account.id)
  
  if (existingIndex >= 0) {
    accounts[existingIndex] = account
  } else {
    accounts.push(account)
  }
  
  // Simpan ke localStorage
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
  
  // Sync ke cloud jika perlu
  if (await syncService.shouldSync()) {
    await syncService.syncToSupabase(ACCOUNTS_TABLE, [account], {
      markAsSynced: true
    })
  }
  
  window.dispatchEvent(new Event("accountsUpdated"))
  return account
}

export async function updateAccount(updated) {
  return await saveAccount(updated) // Gunakan saveAccount yang sudah handle update
}

export async function deleteAccount(id) {
  let accounts = await getAccounts()
  const accountToDelete = accounts.find(acc => acc.id === id)
  
  if (!accountToDelete) return
  
  // Hapus dari local
  accounts = accounts.filter(acc => acc.id !== id)
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
  
  // Hapus dari cloud jika sudah synced
  if (accountToDelete.synced && (await syncService.shouldSync())) {
    try {
      const user = await getCurrentUser()
      if (user) {
        await supabase
          .from(ACCOUNTS_TABLE)
          .delete()
          .eq('local_id', id)
          .eq('user_id', user.id)
      }
    } catch (error) {
      console.error('Failed to delete from cloud:', error)
    }
  }
  
  window.dispatchEvent(new Event("accountsUpdated"))
}

/* ======================================
   ASSETS STORAGE (DIMODIFIKASI)
====================================== */

const ASSETS_KEY = "assets";
const ASSETS_TABLE = "assets";

export async function getAssets() {
  if (await syncService.shouldSync()) {
    return await syncService.mergeData(ASSETS_KEY, ASSETS_TABLE)
  }
  return JSON.parse(localStorage.getItem(ASSETS_KEY)) || [];
}

export async function saveAsset(asset) {
  const assets = await getAssets()
  
  // Generate ID jika belum ada
  if (!asset.id) {
    asset.id = crypto.randomUUID()
    asset.created_at = new Date().toISOString()
  }
  
  asset.updated_at = new Date().toISOString()
  asset.synced = false
  
  const existingIndex = assets.findIndex(a => a.id === asset.id)
  
  if (existingIndex >= 0) {
    assets[existingIndex] = asset
  } else {
    assets.push(asset)
  }
  
  localStorage.setItem(ASSETS_KEY, JSON.stringify(assets))
  
  if (await syncService.shouldSync()) {
    await syncService.syncToSupabase(ASSETS_TABLE, [asset], {
      markAsSynced: true
    })
  }
  
  window.dispatchEvent(new Event("assetsUpdated"))
  return asset
}

export async function updateAsset(updated) {
  return await saveAsset(updated)
}

export async function deleteAsset(id) {
  let assets = await getAssets()
  const assetToDelete = assets.find(a => a.id === id)
  
  if (!assetToDelete) return
  
  assets = assets.filter(a => a.id !== id)
  localStorage.setItem(ASSETS_KEY, JSON.stringify(assets))
  
  if (assetToDelete.synced && (await syncService.shouldSync())) {
    try {
      const user = await getCurrentUser()
      if (user) {
        await supabase
          .from(ASSETS_TABLE)
          .delete()
          .eq('local_id', id)
          .eq('user_id', user.id)
      }
    } catch (error) {
      console.error('Failed to delete from cloud:', error)
    }
  }
  
  window.dispatchEvent(new Event("assetsUpdated"))
}

/* ======================================
   INVESTMENTS STORAGE (DIMODIFIKASI)
====================================== */

const INVESTMENTS_KEY = "investments";
const INVESTMENTS_TABLE = "investments";

export async function getInvestments() {
  if (await syncService.shouldSync()) {
    return await syncService.mergeData(INVESTMENTS_KEY, INVESTMENTS_TABLE)
  }
  return JSON.parse(localStorage.getItem(INVESTMENTS_KEY)) || [];
}

export async function saveInvestment(investment) {
  const investments = await getInvestments()
  
  if (!investment.id) {
    investment.id = crypto.randomUUID()
    investment.created_at = new Date().toISOString()
  }
  
  investment.updated_at = new Date().toISOString()
  investment.synced = false
  
  const existingIndex = investments.findIndex(i => i.id === investment.id)
  
  if (existingIndex >= 0) {
    investments[existingIndex] = investment
  } else {
    investments.push(investment)
  }
  
  localStorage.setItem(INVESTMENTS_KEY, JSON.stringify(investments))
  
  if (await syncService.shouldSync()) {
    await syncService.syncToSupabase(INVESTMENTS_TABLE, [investment], {
      markAsSynced: true
    })
  }
  
  window.dispatchEvent(new Event("investmentsUpdated"))
  return investment
}

export async function deleteInvestment(id) {
  let investments = await getInvestments()
  const investmentToDelete = investments.find(i => i.id === id)
  
  if (!investmentToDelete) return
  
  investments = investments.filter(i => i.id !== id)
  localStorage.setItem(INVESTMENTS_KEY, JSON.stringify(investments))
  
  if (investmentToDelete.synced && (await syncService.shouldSync())) {
    try {
      const user = await getCurrentUser()
      if (user) {
        await supabase
          .from(INVESTMENTS_TABLE)
          .delete()
          .eq('local_id', id)
          .eq('user_id', user.id)
      }
    } catch (error) {
      console.error('Failed to delete from cloud:', error)
    }
  }
  
  window.dispatchEvent(new Event("investmentsUpdated"))
}

/* ======================================
   SYNC UTILITIES (FUNGSI BARU)
====================================== */

// Manual sync function (bisa dipanggil dari UI)
export async function syncAllToCloud() {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, message: 'Silakan login dulu' }
  }

  const results = []
  
  // Sync semua data
  const syncJobs = [
    { key: ACCOUNTS_KEY, table: ACCOUNTS_TABLE, name: 'Akun' },
    { key: ASSETS_KEY, table: ASSETS_TABLE, name: 'Aset' },
    { key: INVESTMENTS_KEY, table: INVESTMENTS_TABLE, name: 'Investasi' }
  ]

  for (const job of syncJobs) {
    try {
      const data = JSON.parse(localStorage.getItem(job.key) || '[]')
      const unsyncedData = data.filter(item => !item.synced)
      
      if (unsyncedData.length > 0) {
        const result = await syncService.syncToSupabase(job.table, unsyncedData, {
          markAsSynced: true
        })
        
        results.push({
          type: job.name,
          success: result.success,
          count: unsyncedData.length,
          error: result.error
        })
      } else {
        results.push({
          type: job.name,
          success: true,
          count: 0,
          message: 'Sudah up-to-date'
        })
      }
    } catch (error) {
      results.push({
        type: job.name,
        success: false,
        error: error.message
      })
    }
  }

  return results
}

// Load semua dari cloud (untuk device baru)
export async function loadAllFromCloud() {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, message: 'Silakan login dulu' }
  }

  try {
    const [accounts, assets, investments] = await Promise.all([
      syncService.loadFromSupabase(ACCOUNTS_TABLE),
      syncService.loadFromSupabase(ASSETS_TABLE),
      syncService.loadFromSupabase(INVESTMENTS_TABLE)
    ])

    // Simpan ke localStorage
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
    localStorage.setItem(ASSETS_KEY, JSON.stringify(assets))
    localStorage.setItem(INVESTMENTS_KEY, JSON.stringify(investments))

    // Trigger update events
    window.dispatchEvent(new Event("accountsUpdated"))
    window.dispatchEvent(new Event("assetsUpdated"))
    window.dispatchEvent(new Event("investmentsUpdated"))

    return {
      success: true,
      counts: {
        accounts: accounts.length,
        assets: assets.length,
        investments: investments.length
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

// Cek status sync
export async function getSyncStatus() {
  const user = await getCurrentUser()
  const online = navigator.onLine
  
  const data = {
    accounts: JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]'),
    assets: JSON.parse(localStorage.getItem(ASSETS_KEY) || '[]'),
    investments: JSON.parse(localStorage.getItem(INVESTMENTS_KEY) || '[]')
  }
  
  return {
    user: user ? 'Logged in' : 'Not logged in',
    online,
    totals: {
      accounts: data.accounts.length,
      assets: data.assets.length,
      investments: data.investments.length
    },
    unsynced: {
      accounts: data.accounts.filter(d => !d.synced).length,
      assets: data.assets.filter(d => !d.synced).length,
      investments: data.investments.filter(d => !d.synced).length
    }
  }
}

/* ======================================
   ASSETS CALCULATION FUNCTIONS 
   (TETAP SAMA, TIDAK PERLU DIUBAH)
====================================== */

// ... (semua fungsi calculation tetap sama seperti sebelumnya)
// getTotalPurchaseValue, getTotalCurrentValue, getOverallPL, dll...
// COPY PASTE dari kode Anda yang lama

/* ======================
   NORMALIZE CATEGORY FUNCTION (INTERNAL)
====================== */
function normalizeCategory(category = "") {
  const c = category.toLowerCase();
  if (c.includes("property")) return "property";
  if (c.includes("vehicle")) return "vehicle";
  if (c.includes("gold")) return "gold";
  if (c.includes("land")) return "land";
  if (c.includes("gadget")) return "gadget";
  return "other";
}

/* ======================
   GET TOTAL PURCHASE VALUE
====================== */
export function getTotalPurchaseValue() {
  const assets = getAssets();
  return assets.reduce((total, asset) => total + (Number(asset.value) || 0), 0);
}

/* ======================
   GET TOTAL CURRENT ESTIMATED VALUE
====================== */
export function getTotalCurrentValue() {
  const assets = getAssets();
  return assets.reduce((total, asset) => 
    total + (Number(asset.currentEstimatedValue) || Number(asset.value) || 0), 0);
}

/* ======================
   GET OVERALL PROFIT/LOSS
====================== */
export function getOverallPL() {
  const purchaseTotal = getTotalPurchaseValue();
  const currentTotal = getTotalCurrentValue();
  const amount = currentTotal - purchaseTotal;
  const percentage = purchaseTotal > 0 ? (amount / purchaseTotal) * 100 : 0;
  
  return {
    amount,
    percentage,
    isProfit: amount >= 0
  };
}

/* ======================
   GET ASSET COUNT
====================== */
export function getAssetCount() {
  return getAssets().length;
}

/* ======================
   GET ASSETS WITH P/L CALCULATED
====================== */
export function getAssetsWithPL() {
  return getAssets().map(asset => {
    const purchasePrice = Number(asset.value) || 0;
    const currentValue = Number(asset.currentEstimatedValue) || purchasePrice;
    const plAmount = currentValue - purchasePrice;
    const plPercentage = purchasePrice > 0 ? (plAmount / purchasePrice) * 100 : 0;
    
    return {
      ...asset,
      plAmount,
      plPercentage,
      isProfit: plAmount >= 0
    };
  });
}

/* ======================
   GET ASSETS BY CATEGORY WITH VALUE
====================== */
export function getAssetsByCategory() {
  const assets = getAssets();
  const categoryMap = {};
  
  assets.forEach(asset => {
    const normalizedCategory = normalizeCategory(asset.category || 'Uncategorized');
    
    if (!categoryMap[normalizedCategory]) {
      categoryMap[normalizedCategory] = {
        category: normalizedCategory,
        count: 0,
        totalPurchase: 0,
        totalCurrent: 0
      };
    }
    
    categoryMap[normalizedCategory].count++;
    categoryMap[normalizedCategory].totalPurchase += Number(asset.value) || 0;
    categoryMap[normalizedCategory].totalCurrent += Number(asset.currentEstimatedValue) || Number(asset.value) || 0;
  });
  
  // Convert to array and calculate P/L
  return Object.values(categoryMap).map(data => ({
    ...data,
    plAmount: data.totalCurrent - data.totalPurchase,
    plPercentage: data.totalPurchase > 0 
      ? ((data.totalCurrent - data.totalPurchase) / data.totalPurchase) * 100 
      : 0,
    isProfit: (data.totalCurrent - data.totalPurchase) >= 0
  }));
}