// src/store/account.store.js

// ============================================
// IMPORT SYNC FUNCTIONS DARI store.js
// ============================================
import { 
  getAccounts as getAccountsFromSync,
  saveAccount as saveAccountToSync,
  deleteAccount as deleteAccountFromSync,
  updateAccount as updateAccountInSync
} from '../services/storage.js';

const STORAGE_KEY = "accounts";

/* =========================
   TYPE MAPPING (SAMA DENGAN ACCOUNTS.JS)
========================= */
const TYPE_MAP = {
  bank: "bank",
  "digital-bank": "digital-bank",
  "e-wallet": "e-wallet",
  cash: "cash",
  loans: "loans",
};

function getMappedType(type = "") {
  return TYPE_MAP[type] || "unknown";
}

/* =========================
   DEBIT CARD HELPERS
========================= */
function formatCardNumberForDisplay(cardNumber) {
  if (!cardNumber) return null;
  
  const clean = cardNumber.replace(/\D/g, '');
  if (clean.length !== 16) return cardNumber;
  
  // Format: XXXX XXXX XXXX XXXX
  return `${clean.slice(0, 4)} ${clean.slice(4, 8)} ${clean.slice(8, 12)} ${clean.slice(12, 16)}`;
}

function maskCardNumber(cardNumber) {
  if (!cardNumber) return null;
  
  const clean = cardNumber.replace(/\D/g, '');
  if (clean.length !== 16) return cardNumber;
  
  // Mask: •••• XXXX XXXX 1234
  return `•••• ${clean.slice(4, 8)} ${clean.slice(8, 12)} ${clean.slice(12, 16)}`;
}

/* =========================
   INTERNAL STATE
========================= */
let accounts = [];
let listeners = [];

/* =========================
   INTERNAL HELPERS
========================= */
function notify() {
  listeners.forEach((cb) => cb(accounts));
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

async function loadFromStorage() {
  try {
    // Coba load dari sync system dulu
    const syncedAccounts = await getAccountsFromSync();
    
    if (syncedAccounts && syncedAccounts.length > 0) {
      console.log('📥 Loaded accounts from sync system:', syncedAccounts.length);
      accounts = syncedAccounts;
    } else {
      // Fallback ke local storage
      const raw = localStorage.getItem(STORAGE_KEY);
      accounts = raw ? JSON.parse(raw) : [];
      console.log('📥 Loaded accounts from localStorage:', accounts.length);
    }
  } catch (error) {
    console.warn('⚠️ Error loading accounts from sync, using localStorage:', error);
    const raw = localStorage.getItem(STORAGE_KEY);
    accounts = raw ? JSON.parse(raw) : [];
  }
}

// Helper untuk sync perubahan ke cloud
async function syncAccountChange(account, operation = 'save') {
  try {
    if (operation === 'save') {
      await saveAccountToSync(account);
    } else if (operation === 'delete') {
      await deleteAccountFromSync(account.id);
    } else if (operation === 'update') {
      await updateAccountInSync(account);
    }
  } catch (error) {
    console.warn('⚠️ Sync to cloud failed (will retry later):', error.message);
    // Mark as unsynced for later retry
    if (account) {
      account.synced = false;
      saveToStorage();
    }
  }
}

/* =========================
   PUBLIC STORE API - DENGAN SYNC SUPPORT
========================= */
export const accountStore = {
  /* ---------- subscribe ---------- */
  subscribe(callback) {
    listeners.push(callback);
    callback(accounts);

    return () => {
      listeners = listeners.filter((l) => l !== callback);
    };
  },

  /* ---------- getters ---------- */
  getAll() {
    return accounts;
  },

  async getAllAsync() {
    // Untuk komponen yang perlu async data
    await this.refreshFromSync();
    return accounts;
  },

  getById(id) {
    return accounts.find(acc => acc.id === id);
  },

  getByType(type) {
    return accounts.filter((acc) => acc.type === type);
  },

  /* ---------- Get by mapped type ---------- */
  getByMappedType(mappedType) {
    return accounts.filter((acc) => getMappedType(acc.type) === mappedType);
  },

  /* ---------- Get summary counts ---------- */
  getSummary() {
    const summary = {
      total: accounts.length,
      byType: {
        bank: 0,
        "digital-bank": 0,
        "e-wallet": 0,
        cash: 0,
        loans: 0,
        unknown: 0
      }
    };

    accounts.forEach((acc) => {
      const mappedType = getMappedType(acc.type);
      summary.byType[mappedType] = (summary.byType[mappedType] || 0) + 1;
    });

    return summary;
  },

  /* ---------- Get total balance ---------- */
  getTotalBalance() {
    return accounts.reduce((total, acc) => total + (Number(acc.balance) || 0), 0);
  },

  /* ---------- Get accounts with debit card ---------- */
  getAccountsWithDebitCard() {
    return accounts.filter(acc => 
      acc.debitCardNumber && acc.debitCardProvider
    );
  },

  /* ---------- Format card number for display ---------- */
  formatCardNumber(cardNumber) {
    return formatCardNumberForDisplay(cardNumber);
  },

  /* ---------- Mask card number (•••• 1234 5678 9012) ---------- */
  maskCardNumber(cardNumber) {
    return maskCardNumber(cardNumber);
  },

  /* ---------- Get last 4 digits ---------- */
  getLastFourDigits(cardNumber) {
    if (!cardNumber) return null;
    const clean = cardNumber.replace(/\D/g, '');
    return clean.slice(-4);
  },

  /* ---------- Get provider logo key ---------- */
  getDebitProviderLogoKey(providerName) {
    if (!providerName) return null;
    return providerName.toLowerCase().replace(/\s+/g, '');
  },

  /* ---------- actions ---------- */
  async init() {
    await loadFromStorage();
    notify();
  },

  /* ---------- Refresh data dari cloud ---------- */
  async refreshFromSync() {
    try {
      const syncedAccounts = await getAccountsFromSync();
      if (syncedAccounts && syncedAccounts.length > 0) {
        accounts = syncedAccounts;
        saveToStorage();
        notify();
        console.log('🔄 Refreshed accounts from cloud:', accounts.length);
      }
    } catch (error) {
      console.warn('⚠️ Refresh from cloud failed:', error.message);
    }
  },

  /* ---------- Add account dengan sync ---------- */
  async add(account) {
    const newAccount = {
      // Default values
      id: account.id ?? crypto.randomUUID(),
      type: account.type || "unknown",
      name: account.name || "Unnamed Account",
      detail: account.detail || "",
      balance: Number(account.balance || 0),
      notes: account.notes || "",
      
      // NEW: Debit card fields
      debitCardNumber: account.debitCardNumber || null,
      debitCardProvider: account.debitCardProvider || null,
      
      // Transaction history
      lastTransaction: account.lastTransaction || null,
      transactionHistory: account.transactionHistory || [],
      
      // Metadata
      createdAt: account.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      
      // Cash specific (jika ada)
      ...(account.cashType && { cashType: account.cashType }),
      
      // Sync metadata
      synced: false,
      synced_at: null
    };
    
    accounts.push(newAccount);
    saveToStorage();
    notify();
    
    // Sync ke cloud (background)
    syncAccountChange(newAccount, 'save');
    
    return newAccount;
  },

  /* ---------- Update account dengan sync ---------- */
  async update(updated) {
    accounts = accounts.map((acc) =>
      acc.id === updated.id 
        ? { 
            ...acc, 
            ...updated,
            // Pastikan tipe data konsisten
            ...(updated.balance !== undefined && { balance: Number(updated.balance) }),
            // Update timestamp
            updatedAt: new Date().toISOString(),
            // Mark for sync
            synced: false
          } 
        : acc
    );
    
    saveToStorage();
    notify();
    
    // Sync ke cloud (background)
    const updatedAccount = accounts.find(acc => acc.id === updated.id);
    if (updatedAccount) {
      syncAccountChange(updatedAccount, 'update');
    }
  },

  /* ---------- Remove account dengan sync ---------- */
  async remove(id) {
    const accountToDelete = accounts.find(acc => acc.id === id);
    
    if (!accountToDelete) return;
    
    accounts = accounts.filter((acc) => acc.id !== id);
    saveToStorage();
    notify();
    
    // Sync delete ke cloud (background)
    syncAccountChange(accountToDelete, 'delete');
  },

  /* ---------- Adjust balance dengan sync ---------- */
  async adjustBalance(accountId, delta) {
    accounts = accounts.map((acc) =>
      acc.id === accountId
        ? {
            ...acc,
            balance: Number(acc.balance || 0) + Number(delta || 0),
            updatedAt: new Date().toISOString(),
            synced: false
          }
        : acc
    );

    saveToStorage();
    notify();
    
    // Sync ke cloud (background)
    const updatedAccount = accounts.find(acc => acc.id === accountId);
    if (updatedAccount) {
      syncAccountChange(updatedAccount, 'update');
    }
  },

  /* ---------- ADD BALANCE METHOD dengan sync ---------- */
  async addBalance(accountId, amount, description = "Deposit") {
    const account = accounts.find(acc => acc.id === accountId);
    
    if (!account) {
      throw new Error(`Account with ID ${accountId} not found`);
    }

    const addAmount = Number(amount);
    
    if (isNaN(addAmount) || addAmount <= 0) {
      throw new Error("Invalid amount to add");
    }

    const newBalance = Number(account.balance || 0) + addAmount;
    account.balance = newBalance;
    
    // Update transaction history
    const transaction = {
      id: Date.now(),
      type: "deposit",
      amount: addAmount,
      description,
      timestamp: new Date().toISOString(),
      previousBalance: account.balance - addAmount,
      newBalance: newBalance,
    };
    
    account.lastTransaction = transaction;
    account.transactionHistory = [transaction, ...(account.transactionHistory || [])].slice(0, 10);
    account.updatedAt = new Date().toISOString();
    account.synced = false;
    
    saveToStorage();
    notify();
    
    // Sync ke cloud (background)
    syncAccountChange(account, 'update');
    
    return {
      success: true,
      accountName: account.name,
      amountAdded: addAmount,
      newBalance: account.balance,
      transaction,
    };
  },

  /* ---------- DEDUCT BALANCE METHOD dengan sync ---------- */
  async deductBalance(accountId, amount, description = "Withdrawal") {
    const account = accounts.find(acc => acc.id === accountId);
    
    if (!account) {
      throw new Error(`Account with ID ${accountId} not found`);
    }

    const deductAmount = Number(amount);
    const currentBalance = Number(account.balance || 0);
    
    if (isNaN(deductAmount) || deductAmount <= 0) {
      throw new Error("Invalid amount to deduct");
    }

    if (currentBalance < deductAmount) {
      throw new Error(
        `Insufficient balance in ${account.name}. Available: Rp ${currentBalance.toLocaleString("id-ID")}, Required: Rp ${deductAmount.toLocaleString("id-ID")}`
      );
    }

    const newBalance = currentBalance - deductAmount;
    account.balance = newBalance;
    
    // Update transaction history
    const transaction = {
      id: Date.now(),
      type: "withdrawal",
      amount: -deductAmount,
      description,
      timestamp: new Date().toISOString(),
      previousBalance: currentBalance,
      newBalance: newBalance,
    };
    
    account.lastTransaction = transaction;
    account.transactionHistory = [transaction, ...(account.transactionHistory || [])].slice(0, 10);
    account.updatedAt = new Date().toISOString();
    account.synced = false;
    
    saveToStorage();
    notify();
    
    // Sync ke cloud (background)
    syncAccountChange(account, 'update');
    
    return {
      success: true,
      accountName: account.name,
      amountDeducted: deductAmount,
      newBalance: account.balance,
      transaction,
    };
  },

  /* ---------- TRANSFER BETWEEN ACCOUNTS dengan sync ---------- */
  async transfer(fromAccountId, toAccountId, amount, description = "Transfer") {
    const fromAccount = accounts.find(acc => acc.id === fromAccountId);
    const toAccount = accounts.find(acc => acc.id === toAccountId);
    
    if (!fromAccount || !toAccount) {
      throw new Error("One or both accounts not found");
    }

    if (fromAccountId === toAccountId) {
      throw new Error("Cannot transfer to the same account");
    }

    const transferAmount = Number(amount);
    
    if (isNaN(transferAmount) || transferAmount <= 0) {
      throw new Error("Invalid transfer amount");
    }

    // Check balance
    const fromBalance = Number(fromAccount.balance || 0);
    if (fromBalance < transferAmount) {
      throw new Error(`Insufficient balance in ${fromAccount.name}`);
    }

    // Perform transfer
    const fromNewBalance = fromBalance - transferAmount;
    const toNewBalance = Number(toAccount.balance || 0) + transferAmount;
    
    fromAccount.balance = fromNewBalance;
    toAccount.balance = toNewBalance;
    
    // Update transaction history for both accounts
    const now = new Date().toISOString();
    
    const fromTransaction = {
      id: Date.now(),
      type: "transfer_out",
      amount: -transferAmount,
      description: `Transfer to ${toAccount.name}: ${description}`,
      timestamp: now,
      previousBalance: fromBalance,
      newBalance: fromNewBalance,
      relatedAccountId: toAccountId,
      relatedAccountName: toAccount.name,
    };
    
    const toTransaction = {
      id: Date.now() + 1,
      type: "transfer_in",
      amount: transferAmount,
      description: `Transfer from ${fromAccount.name}: ${description}`,
      timestamp: now,
      previousBalance: toAccount.balance - transferAmount,
      newBalance: toNewBalance,
      relatedAccountId: fromAccountId,
      relatedAccountName: fromAccount.name,
    };
    
    fromAccount.lastTransaction = fromTransaction;
    toAccount.lastTransaction = toTransaction;
    
    fromAccount.transactionHistory = [fromTransaction, ...(fromAccount.transactionHistory || [])].slice(0, 10);
    toAccount.transactionHistory = [toTransaction, ...(toAccount.transactionHistory || [])].slice(0, 10);
    
    fromAccount.updatedAt = now;
    fromAccount.synced = false;
    toAccount.updatedAt = now;
    toAccount.synced = false;
    
    saveToStorage();
    notify();
    
    // Sync kedua account ke cloud (background)
    syncAccountChange(fromAccount, 'update');
    syncAccountChange(toAccount, 'update');
    
    return {
      success: true,
      fromAccount: fromAccount.name,
      toAccount: toAccount.name,
      amount: transferAmount,
      fromNewBalance: fromAccount.balance,
      toNewBalance: toAccount.balance,
      transactions: {
        from: fromTransaction,
        to: toTransaction,
      },
    };
  },

  /* ---------- UPDATE LATEST TRANSACTION ---------- */
  async updateLatestTransaction(accountId, transactionData) {
    const account = accounts.find(acc => acc.id === accountId);
    
    if (!account) {
      throw new Error(`Account with ID ${accountId} not found`);
    }

    const transaction = {
      id: Date.now(),
      ...transactionData,
      timestamp: new Date().toISOString(),
    };
    
    account.lastTransaction = transaction;
    account.updatedAt = new Date().toISOString();
    account.synced = false;
    
    saveToStorage();
    notify();
    
    // Sync ke cloud (background)
    syncAccountChange(account, 'update');
    
    return {
      success: true,
      accountName: account.name,
      transaction,
    };
  },

  /* ---------- ADD MOCK TRANSACTION ---------- */
  async addMockTransaction(accountId) {
    const account = accounts.find(acc => acc.id === accountId);
    
    if (!account) {
      throw new Error(`Account with ID ${accountId} not found`);
    }

    const mockTransactions = [
      { type: "purchase", description: "Starbucks Coffee", amount: -45000 },
      { type: "deposit", description: "Salary Deposit", amount: 5000000 },
      { type: "bill", description: "Electricity Bill", amount: -350000 },
      { type: "shopping", description: "Online Shopping", amount: -125000 },
      { type: "transfer", description: "Received from Friend", amount: 250000 },
    ];
    
    const randomTrans = mockTransactions[Math.floor(Math.random() * mockTransactions.length)];
    
    // Update balance based on transaction
    account.balance = Number(account.balance || 0) + randomTrans.amount;
    
    const transaction = {
      id: Date.now(),
      ...randomTrans,
      timestamp: new Date().toISOString(),
      previousBalance: account.balance - randomTrans.amount,
      newBalance: account.balance,
    };
    
    account.lastTransaction = transaction;
    account.transactionHistory = [transaction, ...(account.transactionHistory || [])].slice(0, 10);
    account.updatedAt = new Date().toISOString();
    account.synced = false;
    
    saveToStorage();
    notify();
    
    // Sync ke cloud (background)
    syncAccountChange(account, 'update');
    
    return {
      success: true,
      accountName: account.name,
      transaction,
    };
  },

  /* ---------- RESET ALL ---------- */
  async resetAll() {
    accounts = [];
    saveToStorage();
    notify();
  },

  /* ---------- GET ACCOUNT CARD DISPLAY INFO ---------- */
  getAccountCardInfo(accountId) {
    const account = accounts.find(acc => acc.id === accountId);
    
    if (!account) return null;
    
    return {
      ...account,
      // Formatted values for display
      formattedBalance: `Rp ${Number(account.balance || 0).toLocaleString("id-ID")}`,
      maskedCardNumber: account.debitCardNumber ? maskCardNumber(account.debitCardNumber) : null,
      lastFourDigits: account.debitCardNumber ? this.getLastFourDigits(account.debitCardNumber) : null,
      formattedCardNumber: account.debitCardNumber ? formatCardNumberForDisplay(account.debitCardNumber) : null,
      providerLogoKey: account.debitCardProvider ? this.getDebitProviderLogoKey(account.debitCardProvider) : null,
      hasDebitCard: !!(account.debitCardNumber && account.debitCardProvider),
      lastTransactionTime: account.lastTransaction 
        ? new Date(account.lastTransaction.timestamp).toLocaleDateString("id-ID", {
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit'
          })
        : "No transactions",
    };
  },

  /* ---------- NEW: SYNC SPECIFIC METHODS ---------- */
  
  // Manual sync untuk account ini saja
  async syncToCloud(accountId) {
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) return { success: false, error: 'Account not found' };
    
    try {
      await saveAccountToSync(account);
      account.synced = true;
      account.synced_at = new Date().toISOString();
      saveToStorage();
      notify();
      return { success: true, accountId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Cek sync status untuk semua accounts
  getSyncStatus() {
    const total = accounts.length;
    const synced = accounts.filter(acc => acc.synced).length;
    const unsynced = total - synced;
    
    return {
      total,
      synced,
      unsynced,
      percentage: total > 0 ? Math.round((synced / total) * 100) : 0
    };
  },

  // Retry sync untuk yang gagal
  async retryFailedSyncs() {
    const unsyncedAccounts = accounts.filter(acc => !acc.synced);
    const results = [];
    
    for (const account of unsyncedAccounts) {
      try {
        await saveAccountToSync(account);
        account.synced = true;
        account.synced_at = new Date().toISOString();
        results.push({ accountId: account.id, success: true });
      } catch (error) {
        results.push({ accountId: account.id, success: false, error: error.message });
      }
    }
    
    if (results.length > 0) {
      saveToStorage();
      notify();
    }
    
    return results;
  }
};