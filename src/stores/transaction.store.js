import { accountStore } from "./account.store";

// Import sync functions dari store.js
import { 
  getTransactions as getTransactionsFromSync,
  saveTransaction as saveTransactionToSync,
  deleteTransaction as deleteTransactionFromSync,
  syncAllToCloud
} from '../services/storage.js';

const STORAGE_KEY = "transactions";

/* =========================
   INTERNAL STATE
========================= */
let transactions = [];
let listeners = [];

/* =========================
   HELPERS
========================= */
function notify() {
  listeners.forEach((cb) => cb(transactions));
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

async function loadFromStorage() {
  try {
    // Coba load dari sync system dulu
    const syncedTransactions = await getTransactionsFromSync();
    
    if (syncedTransactions && syncedTransactions.length > 0) {
      console.log('📥 Loaded transactions from sync system:', syncedTransactions.length);
      transactions = syncedTransactions;
    } else {
      // Fallback ke local storage
      const raw = localStorage.getItem(STORAGE_KEY);
      transactions = raw ? JSON.parse(raw) : [];
      console.log('📥 Loaded transactions from localStorage:', transactions.length);
    }
  } catch (error) {
    console.warn('⚠️ Error loading transactions from sync, using localStorage:', error);
    const raw = localStorage.getItem(STORAGE_KEY);
    transactions = raw ? JSON.parse(raw) : [];
  }
}

// Helper untuk sync transaction ke cloud
async function syncTransactionChange(transaction, operation = 'save') {
  try {
    const transactionToSync = {
      ...transaction,
      // Pastikan semua numeric fields jadi number
      amount: Number(transaction.amount) || 0,
      adminFee: Number(transaction.adminFee) || 0,
      netAmount: Number(transaction.netAmount) || 0,
      // Sync metadata
      synced: false,
      synced_at: null
    };
    
    if (operation === 'save') {
      await saveTransactionToSync(transactionToSync);
      return { success: true, transactionId: transaction.id };
    } else if (operation === 'delete') {
      await deleteTransactionFromSync(transaction.id);
      return { success: true, transactionId: transaction.id };
    }
  } catch (error) {
    console.warn('⚠️ Transaction sync to cloud failed (will retry later):', error.message);
    // Mark as unsynced for later retry
    if (transaction) {
      transaction.synced = false;
      saveToStorage();
    }
    return { success: false, error: error.message };
  }
}

/* =========================
   ROLLBACK HELPER
========================= */
function rollbackTransaction(trx) {
  if (!trx) return;

  const {
    type,
    amount,
    accountId,
    toAccountId,
    adminFee = 0,
  } = trx;

  if (type === "expense") {
    accountStore.adjustBalance(accountId, amount + adminFee);
  }

  if (type === "income" || type === "topup") {
    accountStore.adjustBalance(accountId, -(amount - adminFee));
  }

  if (type === "transfer") {
    accountStore.adjustBalance(accountId, amount + adminFee);
    accountStore.adjustBalance(toAccountId, -amount);
  }
}

/* =========================
   APPLY HELPER
========================= */
function applyTransaction(trx) {
  const {
    type,
    amount,
    accountId,
    toAccountId,
    adminFee = 0,
  } = trx;

  if (type === "expense") {
    accountStore.adjustBalance(accountId, -(amount + adminFee));
  }

  if (type === "income" || type === "topup") {
    accountStore.adjustBalance(accountId, amount - adminFee);
  }

  if (type === "transfer") {
    accountStore.adjustBalance(accountId, -(amount + adminFee));
    accountStore.adjustBalance(toAccountId, amount);
  }
}

/* =========================
   STORE API DENGAN SYNC SUPPORT
========================= */
export const transactionStore = {
  subscribe(callback) {
    listeners.push(callback);
    callback(transactions);
    return () => {
      listeners = listeners.filter((l) => l !== callback);
    };
  },

  getAll() {
    return transactions;
  },

  async getAllAsync() {
    // Untuk komponen yang perlu async data
    await this.refreshFromSync();
    return transactions;
  },

  async init() {
    await loadFromStorage();
    notify();
  },

  /* =========================
     REFRESH DATA DARI CLOUD
  ========================= */
  async refreshFromSync() {
    try {
      const syncedTransactions = await getTransactionsFromSync();
      if (syncedTransactions && syncedTransactions.length > 0) {
        transactions = syncedTransactions;
        saveToStorage();
        notify();
        console.log('🔄 Refreshed transactions from cloud:', transactions.length);
      }
    } catch (error) {
      console.warn('⚠️ Refresh from cloud failed:', error.message);
    }
  },

  /* =========================
     ADD TRANSACTION DENGAN SYNC
  ========================= */
  async add(transaction) {
    console.log("🔴 transactionStore.add called with:", transaction);
    console.log("🔴 Category in payload:", transaction.category);
    
    const finalAmount = Number(transaction.amount || 0);
    const fee = Number(transaction.adminFee || 0);

    // Apply perubahan saldo
    applyTransaction({
      ...transaction,
      amount: finalAmount,
      adminFee: fee,
    });

    // Buat transaction object dengan SEMUA field
    const newTransaction = {
      id: crypto.randomUUID(), // Gunakan UUID untuk consistency
      createdAt: new Date().toISOString(),
      // FIELD UTAMA DULU
      type: transaction.type || "",
      category: transaction.category || "",
      accountId: transaction.accountId || null,
      accountName: transaction.accountName || "",
      fromAccountName: transaction.fromAccountName || "",
      amount: finalAmount,
      adminFee: fee,
      netAmount: transaction.netAmount || finalAmount - fee,
      notes: transaction.notes || "",
      creatorId: transaction.creatorId || null,
      creatorName: transaction.creatorName || "",
      platform: transaction.platform || "",
      date: transaction.date || new Date().toISOString().slice(0, 10),
      // UNTUK TRANSFER
      toAccountId: transaction.toAccountId || null,
      toAccountName: transaction.toAccountName || "",
      // Sync metadata
      synced: false,
      synced_at: null
    };

    console.log("🟢 New transaction to save:", newTransaction);
    console.log("🟢 Category in newTransaction:", newTransaction.category);

    transactions.push(newTransaction);
    saveToStorage();
    notify();
    
    // Sync ke cloud (background)
    syncTransactionChange(newTransaction, 'save');
    
    return newTransaction;
  },

  /* =========================
     UPDATE DENGAN SYNC
  ========================= */
  async update(id, payload) {
    const index = transactions.findIndex((t) => t.id === id);
    if (index === -1) return;

    const oldTrx = transactions[index];

    // 1️⃣ rollback lama
    rollbackTransaction(oldTrx);

    // 2️⃣ normalize data baru
    const finalAmount = Number(payload.amount || 0);
    const fee = Number(payload.adminFee || 0);

    const newTrx = {
      ...oldTrx,
      ...payload,
      amount: finalAmount,
      adminFee: fee,
      updatedAt: new Date().toISOString(),
      // Mark for sync
      synced: false
    };

    // 3️⃣ apply baru
    applyTransaction(newTrx);

    // 4️⃣ replace
    transactions[index] = newTrx;

    saveToStorage();
    notify();
    
    // Sync ke cloud (background)
    syncTransactionChange(newTrx, 'save');
  },

  /* =========================
     REMOVE DENGAN SYNC
  ========================= */
  async remove(id) {
    const trx = transactions.find((t) => t.id === id);
    if (!trx) return;

    rollbackTransaction(trx);

    transactions = transactions.filter((t) => t.id !== id);
    saveToStorage();
    notify();
    
    // Sync delete ke cloud (background)
    syncTransactionChange(trx, 'delete');
  },

  /* =========================
     NEW: SYNC UTILITY METHODS
  ========================= */

  // Manual sync untuk transaction tertentu
  async syncToCloud(transactionId) {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return { success: false, error: 'Transaction not found' };
    
    try {
      await saveTransactionToSync(transaction);
      
      // Update sync status
      const index = transactions.findIndex(t => t.id === transactionId);
      if (index !== -1) {
        transactions[index] = {
          ...transactions[index],
          synced: true,
          synced_at: new Date().toISOString()
        };
        saveToStorage();
        notify();
      }
      
      return { success: true, transactionId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Sync semua transactions ke cloud
  async syncAllToCloud() {
    const results = [];
    
    for (const transaction of transactions) {
      if (!transaction.synced) {
        try {
          await saveTransactionToSync(transaction);
          
          // Update sync status
          const index = transactions.findIndex(t => t.id === transaction.id);
          if (index !== -1) {
            transactions[index] = {
              ...transactions[index],
              synced: true,
              synced_at: new Date().toISOString()
            };
          }
          
          results.push({ transactionId: transaction.id, success: true });
        } catch (error) {
          results.push({ transactionId: transaction.id, success: false, error: error.message });
        }
      } else {
        results.push({ transactionId: transaction.id, success: true, message: 'Already synced' });
      }
    }
    
    if (results.length > 0) {
      saveToStorage();
      notify();
    }
    
    return results;
  },

  // Cek sync status untuk semua transactions
  getSyncStatus() {
    const total = transactions.length;
    const synced = transactions.filter(t => t.synced).length;
    const unsynced = total - synced;
    
    // Kategorikan berdasarkan type
    const byType = {
      income: { total: 0, synced: 0 },
      expense: { total: 0, synced: 0 },
      transfer: { total: 0, synced: 0 },
      topup: { total: 0, synced: 0 }
    };
    
    transactions.forEach(t => {
      if (byType[t.type]) {
        byType[t.type].total++;
        if (t.synced) byType[t.type].synced++;
      }
    });
    
    return {
      total,
      synced,
      unsynced,
      percentage: total > 0 ? Math.round((synced / total) * 100) : 0,
      byType
    };
  },

  // Retry failed syncs
  async retryFailedSyncs() {
    const unsyncedTransactions = transactions.filter(t => !t.synced);
    const results = [];
    
    for (const transaction of unsyncedTransactions) {
      try {
        await saveTransactionToSync(transaction);
        
        // Update sync status
        const index = transactions.findIndex(t => t.id === transaction.id);
        if (index !== -1) {
          transactions[index] = {
            ...transactions[index],
            synced: true,
            synced_at: new Date().toISOString()
          };
        }
        
        results.push({ transactionId: transaction.id, success: true });
      } catch (error) {
        results.push({ transactionId: transaction.id, success: false, error: error.message });
      }
    }
    
    if (results.length > 0) {
      saveToStorage();
      notify();
    }
    
    return results;
  },

  // Get transactions by date range
  getByDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return transactions.filter(t => {
      const transactionDate = new Date(t.date || t.createdAt);
      return transactionDate >= start && transactionDate <= end;
    });
  },

  // Get transactions by account
  getByAccount(accountId) {
    return transactions.filter(t => 
      t.accountId === accountId || t.toAccountId === accountId
    );
  },

  // Get transactions by category
  getByCategory(category) {
    return transactions.filter(t => t.category === category);
  },

  // Get monthly summary
  getMonthlySummary(year, month) {
    const filtered = transactions.filter(t => {
      const date = new Date(t.date || t.createdAt);
      return date.getFullYear() === year && date.getMonth() === month;
    });
    
    const summary = {
      income: 0,
      expense: 0,
      transfer: 0,
      topup: 0,
      count: filtered.length
    };
    
    filtered.forEach(t => {
      if (summary[t.type] !== undefined) {
        summary[t.type] += Number(t.amount) || 0;
      }
    });
    
    return summary;
  }
};