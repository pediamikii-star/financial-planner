import { accountStore } from "./account.store";

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

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    transactions = raw ? JSON.parse(raw) : [];
  } catch {
    transactions = [];
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
   STORE API
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

  init() {
    loadFromStorage();
    notify();
  },

  /* =========================
     ADD - FIXED
  ========================= */
  add(transaction) {
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
      id: Date.now(),
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
    };

    console.log("🟢 New transaction to save:", newTransaction);
    console.log("🟢 Category in newTransaction:", newTransaction.category);

    transactions.push(newTransaction);
    saveToStorage();
    notify();
    
    return newTransaction;
  },

  /* =========================
     UPDATE
  ========================= */
  update(id, payload) {
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
    };

    // 3️⃣ apply baru
    applyTransaction(newTrx);

    // 4️⃣ replace
    transactions[index] = newTrx;

    saveToStorage();
    notify();
  },

  /* =========================
     REMOVE
  ========================= */
  remove(id) {
    const trx = transactions.find((t) => t.id === id);
    if (!trx) return;

    rollbackTransaction(trx);

    transactions = transactions.filter((t) => t.id !== id);
    saveToStorage();
    notify();
  },
};