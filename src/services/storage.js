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
   KEYS CONSTANTS
====================================== */

const ACCOUNTS_KEY = "accounts";
const ACCOUNTS_TABLE = "accounts";
const ASSETS_KEY = "assets";
const ASSETS_TABLE = "assets";
const INVESTMENTS_KEY = "investments";
const INVESTMENTS_TABLE = "investments";
const CREATORS_KEY = "creators";
const CREATORS_TABLE = "creators";
const GOALS_KEY = "goals";
const GOALS_TABLE = "goals";
const TRANSACTIONS_KEY = "transactions";
const TRANSACTIONS_TABLE = "transactions";

/* ======================================
   HELPER FUNCTIONS
====================================== */

function normalizeCategory(category = "") {
  const c = category.toLowerCase();
  if (c.includes("property")) return "property";
  if (c.includes("vehicle")) return "vehicle";
  if (c.includes("gold")) return "gold";
  if (c.includes("land")) return "land";
  if (c.includes("gadget")) return "gadget";
  return "other";
}

function getLocalData(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error parsing ${key} from localStorage:`, error);
    return [];
  }
}

function saveLocalData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
}

/* ======================================
   ACCOUNTS STORAGE
====================================== */

export async function getAccounts() {
  if (await syncService.shouldSync()) {
    return await syncService.mergeData(ACCOUNTS_KEY, ACCOUNTS_TABLE)
  }
  return getLocalData(ACCOUNTS_KEY);
}

export async function saveAccount(account) {
  const accounts = await getAccounts()
  
  if (!account.id) {
    account.id = crypto.randomUUID()
    account.created_at = new Date().toISOString()
  }
  
  account.updated_at = new Date().toISOString()
  account.synced = false
  
  const existingIndex = accounts.findIndex(acc => acc.id === account.id)
  
  if (existingIndex >= 0) {
    accounts[existingIndex] = account
  } else {
    accounts.push(account)
  }
  
  saveLocalData(ACCOUNTS_KEY, accounts)
  
  if (await syncService.shouldSync()) {
    await syncService.syncToSupabase(ACCOUNTS_TABLE, [account], {
      markAsSynced: true
    })
  }
  
  window.dispatchEvent(new Event("accountsUpdated"))
  return account
}

export async function updateAccount(updated) {
  return await saveAccount(updated)
}

export async function deleteAccount(id) {
  let accounts = await getAccounts()
  const accountToDelete = accounts.find(acc => acc.id === id)
  
  if (!accountToDelete) return
  
  accounts = accounts.filter(acc => acc.id !== id)
  saveLocalData(ACCOUNTS_KEY, accounts)
  
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
   ASSETS STORAGE
====================================== */

export async function getAssets() {
  if (await syncService.shouldSync()) {
    return await syncService.mergeData(ASSETS_KEY, ASSETS_TABLE)
  }
  return getLocalData(ASSETS_KEY);
}

export function getAssetsSync() {
  return getLocalData(ASSETS_KEY);
}

export async function saveAsset(asset) {
  const assets = await getAssets()
  
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
  
  saveLocalData(ASSETS_KEY, assets)
  
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
  saveLocalData(ASSETS_KEY, assets)
  
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
   INVESTMENTS STORAGE
====================================== */

export async function getInvestments() {
  if (await syncService.shouldSync()) {
    return await syncService.mergeData(INVESTMENTS_KEY, INVESTMENTS_TABLE)
  }
  return getLocalData(INVESTMENTS_KEY);
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
  
  saveLocalData(INVESTMENTS_KEY, investments)
  
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
  saveLocalData(INVESTMENTS_KEY, investments)
  
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
   CREATORS STORAGE
====================================== */

export async function getCreators() {
  if (await syncService.shouldSync()) {
    return await syncService.mergeData(CREATORS_KEY, CREATORS_TABLE)
  }
  return getLocalData(CREATORS_KEY);
}

export async function saveCreator(creator) {
  const creators = await getCreators()
  
  if (!creator.id) {
    creator.id = crypto.randomUUID()
    creator.created_at = new Date().toISOString()
  }
  
  creator.updated_at = new Date().toISOString()
  creator.synced = false
  
  const existingIndex = creators.findIndex(c => c.id === creator.id)
  
  if (existingIndex >= 0) {
    creators[existingIndex] = creator
  } else {
    creators.push(creator)
  }
  
  saveLocalData(CREATORS_KEY, creators)
  
  if (await syncService.shouldSync()) {
    await syncService.syncToSupabase(CREATORS_TABLE, [creator], {
      markAsSynced: true
    })
  }
  
  window.dispatchEvent(new Event("creatorsUpdated"))
  return creator
}

export async function updateCreator(updated) {
  return await saveCreator(updated)
}

export async function deleteCreator(id) {
  let creators = await getCreators()
  const creatorToDelete = creators.find(c => c.id === id)
  
  if (!creatorToDelete) return
  
  creators = creators.filter(c => c.id !== id)
  saveLocalData(CREATORS_KEY, creators)
  
  if (creatorToDelete.synced && (await syncService.shouldSync())) {
    try {
      const user = await getCurrentUser()
      if (user) {
        await supabase
          .from(CREATORS_TABLE)
          .delete()
          .eq('local_id', id)
          .eq('user_id', user.id)
      }
    } catch (error) {
      console.error('Failed to delete from cloud:', error)
    }
  }
  
  window.dispatchEvent(new Event("creatorsUpdated"))
}

/* ======================================
   GOALS STORAGE
====================================== */

export async function getGoals() {
  if (await syncService.shouldSync()) {
    return await syncService.mergeData(GOALS_KEY, GOALS_TABLE)
  }
  return getLocalData(GOALS_KEY);
}

export async function saveGoal(goal) {
  const goals = await getGoals()
  
  if (!goal.id) {
    goal.id = crypto.randomUUID()
    goal.created_at = new Date().toISOString()
  }
  
  goal.updated_at = new Date().toISOString()
  goal.synced = false
  
  const existingIndex = goals.findIndex(g => g.id === goal.id)
  
  if (existingIndex >= 0) {
    goals[existingIndex] = goal
  } else {
    goals.push(goal)
  }
  
  saveLocalData(GOALS_KEY, goals)
  
  if (await syncService.shouldSync()) {
    await syncService.syncToSupabase(GOALS_TABLE, [goal], {
      markAsSynced: true
    })
  }
  
  window.dispatchEvent(new Event("goalsUpdated"))
  return goal
}

export async function updateGoal(updated) {
  return await saveGoal(updated)
}

export async function deleteGoal(id) {
  let goals = await getGoals()
  const goalToDelete = goals.find(g => g.id === id)
  
  if (!goalToDelete) return
  
  goals = goals.filter(g => g.id !== id)
  saveLocalData(GOALS_KEY, goals)
  
  if (goalToDelete.synced && (await syncService.shouldSync())) {
    try {
      const user = await getCurrentUser()
      if (user) {
        await supabase
          .from(GOALS_TABLE)
          .delete()
          .eq('local_id', id)
          .eq('user_id', user.id)
      }
    } catch (error) {
      console.error('Failed to delete from cloud:', error)
    }
  }
  
  window.dispatchEvent(new Event("goalsUpdated"))
}

/* ======================================
   TRANSACTIONS STORAGE
====================================== */

export async function getTransactions() {
  if (await syncService.shouldSync()) {
    return await syncService.mergeData(TRANSACTIONS_KEY, TRANSACTIONS_TABLE)
  }
  return getLocalData(TRANSACTIONS_KEY);
}

export async function saveTransaction(transaction) {
  const transactions = await getTransactions()
  
  if (!transaction.id) {
    transaction.id = crypto.randomUUID()
    transaction.created_at = new Date().toISOString()
  }
  
  transaction.updated_at = new Date().toISOString()
  transaction.synced = false
  
  const existingIndex = transactions.findIndex(t => t.id === transaction.id)
  
  if (existingIndex >= 0) {
    transactions[existingIndex] = transaction
  } else {
    transactions.push(transaction)
  }
  
  saveLocalData(TRANSACTIONS_KEY, transactions)
  
  if (await syncService.shouldSync()) {
    await syncService.syncToSupabase(TRANSACTIONS_TABLE, [transaction], {
      markAsSynced: true
    })
  }
  
  window.dispatchEvent(new Event("transactionsUpdated"))
  return transaction
}

export async function updateTransaction(updated) {
  return await saveTransaction(updated)
}

export async function deleteTransaction(id) {
  let transactions = await getTransactions()
  const transactionToDelete = transactions.find(t => t.id === id)
  
  if (!transactionToDelete) return
  
  transactions = transactions.filter(t => t.id !== id)
  saveLocalData(TRANSACTIONS_KEY, transactions)
  
  if (transactionToDelete.synced && (await syncService.shouldSync())) {
    try {
      const user = await getCurrentUser()
      if (user) {
        await supabase
          .from(TRANSACTIONS_TABLE)
          .delete()
          .eq('local_id', id)
          .eq('user_id', user.id)
      }
    } catch (error) {
      console.error('Failed to delete from cloud:', error)
    }
  }
  
  window.dispatchEvent(new Event("transactionsUpdated"))
}

/* ======================================
   ASSETS CALCULATION FUNCTIONS 
   (Menggunakan SYNC version)
====================================== */

export function getTotalPurchaseValue() {
  const assets = getAssetsSync();
  if (!Array.isArray(assets)) {
    console.warn('Assets is not array in getTotalPurchaseValue:', assets);
    return 0;
  }
  return assets.reduce((total, asset) => total + (Number(asset.value) || 0), 0);
}

export function getTotalCurrentValue() {
  const assets = getAssetsSync();
  if (!Array.isArray(assets)) {
    console.warn('Assets is not array in getTotalCurrentValue:', assets);
    return 0;
  }
  return assets.reduce((total, asset) => 
    total + (Number(asset.currentEstimatedValue) || Number(asset.value) || 0), 0);
}

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

export function getAssetCount() {
  const assets = getAssetsSync();
  return Array.isArray(assets) ? assets.length : 0;
}

export function getAssetsWithPL() {
  const assets = getAssetsSync();
  if (!Array.isArray(assets)) return [];
  
  return assets.map(asset => {
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

export function getAssetsByCategory() {
  const assets = getAssetsSync();
  if (!Array.isArray(assets)) return [];
  
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

/* ======================================
   SYNC UTILITIES
====================================== */

export async function syncAllToCloud() {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, message: 'Silakan login dulu' }
  }

  const results = []
  
  const syncJobs = [
    { key: ACCOUNTS_KEY, table: ACCOUNTS_TABLE, name: 'Akun' },
    { key: ASSETS_KEY, table: ASSETS_TABLE, name: 'Aset' },
    { key: INVESTMENTS_KEY, table: INVESTMENTS_TABLE, name: 'Investasi' },
    { key: CREATORS_KEY, table: CREATORS_TABLE, name: 'Kreator' },
    { key: GOALS_KEY, table: GOALS_TABLE, name: 'Goals' },
    { key: TRANSACTIONS_KEY, table: TRANSACTIONS_TABLE, name: 'Transaksi' }
  ]

  for (const job of syncJobs) {
    try {
      const data = getLocalData(job.key)
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
        
        // Update localStorage dengan status synced
        if (result.success) {
          const allData = getLocalData(job.key)
          allData.forEach(item => {
            if (unsyncedData.find(unsynced => unsynced.id === item.id)) {
              item.synced = true
              item.synced_at = new Date().toISOString()
            }
          })
          saveLocalData(job.key, allData)
        }
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

export async function loadAllFromCloud() {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, message: 'Silakan login dulu' }
  }

  try {
    const [accounts, assets, investments, creators, goals, transactions] = await Promise.all([
      syncService.loadFromSupabase(ACCOUNTS_TABLE),
      syncService.loadFromSupabase(ASSETS_TABLE),
      syncService.loadFromSupabase(INVESTMENTS_TABLE),
      syncService.loadFromSupabase(CREATORS_TABLE),
      syncService.loadFromSupabase(GOALS_TABLE),
      syncService.loadFromSupabase(TRANSACTIONS_TABLE)
    ])

    saveLocalData(ACCOUNTS_KEY, accounts)
    saveLocalData(ASSETS_KEY, assets)
    saveLocalData(INVESTMENTS_KEY, investments)
    saveLocalData(CREATORS_KEY, creators)
    saveLocalData(GOALS_KEY, goals)
    saveLocalData(TRANSACTIONS_KEY, transactions)

    window.dispatchEvent(new Event("accountsUpdated"))
    window.dispatchEvent(new Event("assetsUpdated"))
    window.dispatchEvent(new Event("investmentsUpdated"))
    window.dispatchEvent(new Event("creatorsUpdated"))
    window.dispatchEvent(new Event("goalsUpdated"))
    window.dispatchEvent(new Event("transactionsUpdated"))

    return {
      success: true,
      counts: {
        accounts: accounts.length,
        assets: assets.length,
        investments: investments.length,
        creators: creators.length,
        goals: goals.length,
        transactions: transactions.length
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

export async function getSyncStatus() {
  const user = await getCurrentUser()
  const online = navigator.onLine
  
  const data = {
    accounts: getLocalData(ACCOUNTS_KEY),
    assets: getLocalData(ASSETS_KEY),
    investments: getLocalData(INVESTMENTS_KEY),
    creators: getLocalData(CREATORS_KEY),
    goals: getLocalData(GOALS_KEY),
    transactions: getLocalData(TRANSACTIONS_KEY)
  }
  
  return {
    user: user ? 'Logged in' : 'Not logged in',
    online,
    totals: {
      accounts: data.accounts.length,
      assets: data.assets.length,
      investments: data.investments.length,
      creators: data.creators.length,
      goals: data.goals.length,
      transactions: data.transactions.length
    },
    unsynced: {
      accounts: data.accounts.filter(d => !d.synced).length,
      assets: data.assets.filter(d => !d.synced).length,
      investments: data.investments.filter(d => !d.synced).length,
      creators: data.creators.filter(d => !d.synced).length,
      goals: data.goals.filter(d => !d.synced).length,
      transactions: data.transactions.filter(d => !d.synced).length
    }
  }
}

/* ======================================
   TRIGGER EVENTS
====================================== */

export function triggerAssetUpdate() {
  window.dispatchEvent(new Event("assetsUpdated"))
}

export function triggerAccountUpdate() {
  window.dispatchEvent(new Event("accountsUpdated"))
}

export function triggerInvestmentUpdate() {
  window.dispatchEvent(new Event("investmentsUpdated"))
}

export function triggerCreatorUpdate() {
  window.dispatchEvent(new Event("creatorsUpdated"))
}

export function triggerGoalUpdate() {
  window.dispatchEvent(new Event("goalsUpdated"))
}

export function triggerTransactionUpdate() {
  window.dispatchEvent(new Event("transactionsUpdated"))
}