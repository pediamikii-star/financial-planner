// src/store/creator.store.js

// ============================================
// IMPORT SYNC FUNCTIONS DARI store.js
// ============================================
import { 
  getCreators as getCreatorsFromSync,
  saveCreator as saveCreatorToSync,
  deleteCreator as deleteCreatorFromSync,
  syncAllToCloud
} from '../services/storage.js';

const STORAGE_KEY = "creators";

/* =========================
   INTERNAL STATE
========================= */
let creators = [];
let listeners = [];

/* =========================
   INTERNAL HELPERS
========================= */
function notify() {
  listeners.forEach((cb) => cb(creators));
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(creators));
}

async function loadFromStorage() {
  try {
    // Coba load dari sync system dulu
    const syncedCreators = await getCreatorsFromSync();
    
    if (syncedCreators && syncedCreators.length > 0) {
      console.log("📥 Loaded creators from sync system:", syncedCreators.length, "items");
      
      // Normalize data dari sync
      creators = syncedCreators.map(creator => normalizeCreatorData(creator));
      
      // Simpan ke localStorage untuk cache
      saveToStorage();
      
    } else {
      // Fallback ke local storage
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        creators = JSON.parse(raw);
        
        // MIGRATION: Pastikan semua creator memiliki field yang konsisten
        creators = creators.map(creator => normalizeCreatorData(creator));
        
        console.log("📥 Loaded creators from localStorage:", creators.length, "items");
      } else {
        console.log("📭 No creators found in storage");
        creators = [];
      }
    }
    
    // Log creators yang di-load
    creators.forEach(c => console.log(`   - ${c.id}: ${c.platform} - ${c.name} - Type: ${c.type}`));
    
  } catch (error) {
    console.error("❌ Error loading creators from storage:", error);
    // Fallback ke localStorage saja
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      creators = raw ? JSON.parse(raw) : [];
    } catch {
      creators = [];
    }
  }
}

// Helper untuk normalize creator data
function normalizeCreatorData(creator) {
  return {
    id: creator.id,
    platform: creator.platform,
    name: creator.name || creator.channel || "",
    description: creator.description || "",
    type: creator.type || creator.incomeType || "",
    balance: Number(creator.balance || creator.platformBalance || creator.currentBalance || creator.amount || 0),
    totalIncome: Number(creator.totalIncome || creator.income || 0),
    totalWithdrawn: Number(creator.totalWithdrawn || creator.withdrawn || 0),
    currency: creator.currency || "IDR",
    createdAt: creator.createdAt || new Date().toISOString(),
    updatedAt: creator.updatedAt || new Date().toISOString(),
    // Sync metadata
    synced: creator.synced || false,
    synced_at: creator.synced_at || null,
    // Additional fields
    lastWithdrawal: creator.lastWithdrawal,
    lastIncome: creator.lastIncome
  };
}

// Helper untuk sync perubahan ke cloud
async function syncCreatorChange(creator, operation = 'save') {
  try {
    const creatorToSync = normalizeCreatorData(creator);
    
    if (operation === 'save') {
      await saveCreatorToSync(creatorToSync);
      return { success: true, creatorId: creator.id };
    } else if (operation === 'delete') {
      await deleteCreatorFromSync(creator.id);
      return { success: true, creatorId: creator.id };
    }
  } catch (error) {
    console.warn('⚠️ Creator sync to cloud failed (will retry later):', error.message);
    // Mark as unsynced for later retry
    creator.synced = false;
    saveToStorage();
    return { success: false, error: error.message };
  }
}

/* =========================
   PUBLIC STORE API - DENGAN SYNC SUPPORT
========================= */
export const creatorStore = {
  /* ---------- subscribe ---------- */
  subscribe(callback) {
    listeners.push(callback);
    callback(creators);

    return () => {
      listeners = listeners.filter((l) => l !== callback);
    };
  },

  /* ---------- getters ---------- */
  getAll() {
    return creators;
  },

  async getAllAsync() {
    // Untuk komponen yang perlu async data
    await this.refreshFromSync();
    return creators;
  },

  getById(id) {
    console.log("🔍 Searching creator by ID:", id);
    
    // Cari dengan berbagai cara karena ID bisa string atau number
    let creator = creators.find((c) => c.id === id);
    
    if (!creator) {
      creator = creators.find((c) => Number(c.id) === Number(id));
    }
    
    if (!creator) {
      creator = creators.find((c) => String(c.id) === String(id));
    }
    
    if (creator) {
      console.log("✅ Found creator:", { 
        id: creator.id, 
        name: creator.name, 
        type: creator.type,
        platform: creator.platform 
      });
    } else {
      console.log("❌ Creator not found with ID:", id);
      console.log("Available IDs:", creators.map(c => c.id));
    }
    
    return creator;
  },

  getByPlatform(platform) {
    return creators.filter((creator) => creator.platform === platform);
  },

  getTotalBalance() {
    return creators.reduce((total, creator) => total + (Number(creator.balance) || 0), 0);
  },

  /* ---------- actions ---------- */
  async init() {
    await loadFromStorage();
    notify();
  },

  /* ---------- Refresh data dari cloud ---------- */
  async refreshFromSync() {
    try {
      const syncedCreators = await getCreatorsFromSync();
      if (syncedCreators && syncedCreators.length > 0) {
        creators = syncedCreators.map(creator => normalizeCreatorData(creator));
        saveToStorage();
        notify();
        console.log('🔄 Refreshed creators from cloud:', creators.length);
      }
    } catch (error) {
      console.warn('⚠️ Refresh from cloud failed:', error.message);
    }
  },

  /* ---------- Add creator dengan sync ---------- */
  async add(creator) {
    // Generate ID yang konsisten
    const id = creator.id || crypto.randomUUID();
    
    const newCreator = {
      id: id,
      platform: creator.platform,
      name: creator.name || creator.channel || "",
      description: creator.description || "",
      type: creator.type || creator.incomeType || "",
      balance: Number(creator.balance || creator.platformBalance || creator.initialBalance || 0),
      totalIncome: Number(creator.totalIncome || 0),
      totalWithdrawn: Number(creator.totalWithdrawn || 0),
      currency: creator.currency || "IDR",
      createdAt: creator.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Sync metadata
      synced: false,
      synced_at: null
    };
    
    console.log("➕ Adding new creator:", { 
      id: newCreator.id, 
      name: newCreator.name, 
      type: newCreator.type,
      platform: newCreator.platform 
    });
    
    creators.push(newCreator);
    saveToStorage();
    notify();
    
    // Sync ke cloud (background)
    syncCreatorChange(newCreator, 'save');
    
    return newCreator;
  },

  /* ---------- Update creator dengan sync ---------- */
  async update(updated) {
    console.log("🔄 Updating creator:", updated.id);
    
    creators = creators.map((creator) =>
      creator.id === updated.id
        ? { 
            ...creator, 
            ...updated,
            // Pastikan type selalu diupdate jika ada di payload
            type: updated.type !== undefined ? updated.type : creator.type,
            balance: Number(updated.balance !== undefined ? updated.balance : creator.balance),
            updatedAt: new Date().toISOString(),
            // Mark for sync
            synced: false
          }
        : creator
    );
    
    saveToStorage();
    notify();
    
    // Sync ke cloud (background)
    const updatedCreator = creators.find(c => c.id === updated.id);
    if (updatedCreator) {
      syncCreatorChange(updatedCreator, 'save');
    }
  },

  /* ---------- Remove creator dengan sync ---------- */
  async remove(id) {
    const creatorToDelete = creators.find(c => c.id === id);
    
    if (!creatorToDelete) return;
    
    creators = creators.filter((creator) => creator.id !== id);
    saveToStorage();
    notify();
    
    // Sync delete ke cloud (background)
    syncCreatorChange(creatorToDelete, 'delete');
  },

  /* ---------- WITHDRAW METHOD dengan sync ---------- */
  async withdrawFromCreator(creatorId, amount) {
    console.log("💸 withdrawFromCreator called with:", { creatorId, amount });
    
    let creator = null;
    
    // Coba semua kemungkinan matching
    creator = creators.find((c) => c.id === creatorId);
    if (!creator) creator = creators.find((c) => Number(c.id) === Number(creatorId));
    if (!creator) creator = creators.find((c) => String(c.id) === String(creatorId));
    if (!creator) creator = creators.find((c) => c.name === creatorId);
    
    if (!creator) {
      console.error("❌ Creator not found with ID:", creatorId);
      throw new Error(`Creator with ID ${creatorId} not found.`);
    }

    console.log("✅ Creator found:", { id: creator.id, name: creator.name, type: creator.type, balance: creator.balance });

    const withdrawAmount = Number(amount);
    const currentBalance = Number(creator.balance || 0);

    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      throw new Error("Invalid withdrawal amount");
    }

    if (currentBalance < withdrawAmount) {
      throw new Error(
        `Insufficient balance in ${creator.platform} - ${creator.name}. Available: Rp ${currentBalance.toLocaleString("id-ID")}`
      );
    }

    // Update creator balance
    creator.balance = currentBalance - withdrawAmount;
    creator.totalWithdrawn = (Number(creator.totalWithdrawn) || 0) + withdrawAmount;
    creator.lastWithdrawal = new Date().toISOString();
    creator.updatedAt = new Date().toISOString();
    creator.synced = false;
    
    saveToStorage();
    notify();
    
    // Sync ke cloud (background)
    syncCreatorChange(creator, 'save');
    
    const result = {
      success: true,
      creatorId: creator.id,
      creatorName: creator.name,
      platform: creator.platform,
      incomeType: creator.type,
      amountWithdrawn: withdrawAmount,
      newBalance: creator.balance,
    };
    
    console.log("✅ Withdraw successful:", result);
    return result;
  },

  /* ---------- ADD INCOME METHOD dengan sync ---------- */
  async addIncome(creatorId, amount) {
    const creator = this.getById(creatorId);
    
    if (!creator) {
      throw new Error(`Creator not found`);
    }

    const incomeAmount = Number(amount);
    
    if (isNaN(incomeAmount) || incomeAmount <= 0) {
      throw new Error("Invalid income amount");
    }

    // Update creator balance and income total
    creator.balance = (Number(creator.balance) || 0) + incomeAmount;
    creator.totalIncome = (Number(creator.totalIncome) || 0) + incomeAmount;
    creator.lastIncome = new Date().toISOString();
    creator.updatedAt = new Date().toISOString();
    creator.synced = false;
    
    saveToStorage();
    notify();
    
    // Sync ke cloud (background)
    syncCreatorChange(creator, 'save');
    
    return {
      success: true,
      creatorId: creator.id,
      creatorName: creator.name,
      platform: creator.platform,
      incomeType: creator.type,
      amountAdded: incomeAmount,
      newBalance: creator.balance,
    };
  },

  /* ---------- FIND CREATOR BY NAME AND PLATFORM ---------- */
  findCreatorByNameAndPlatform(name, platform) {
    const creator = creators.find(c => 
      c.name === name && c.platform === platform
    );
    
    if (creator) {
      console.log("🔍 Found creator by name/platform:", { 
        id: creator.id, 
        name: creator.name, 
        type: creator.type 
      });
    }
    
    return creator;
  },

  /* ---------- SEED INITIAL DATA ---------- */
  async seedInitialData() {
    console.log("🌱 Seeding initial creator data...");
    const initialData = [
      {
        id: 1,
        platform: "YouTube",
        name: "arif",
        description: "",
        type: "Ads Revenue",
        balance: 10000000,
        totalIncome: 15000000,
        totalWithdrawn: 5000000,
      },
      {
        id: 2,
        platform: "YouTube",
        name: "miki.cliper",
        description: "",
        type: "Ads Revenue",
        balance: 10000000,
        totalIncome: 12000000,
        totalWithdrawn: 2000000,
      },
      {
        id: 3,
        platform: "YouTube",
        name: "arif",
        description: "",
        type: "Affiliate",
        balance: 1000000,
        totalIncome: 3000000,
        totalWithdrawn: 2000000,
      },
    ];
    
    creators = initialData.map(creator => ({
      ...creator,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currency: "IDR",
      synced: false,
      synced_at: null
    }));
    
    saveToStorage();
    notify();
    
    // Sync initial data ke cloud
    for (const creator of creators) {
      await syncCreatorChange(creator, 'save');
    }
    
    console.log("✅ Seeded", creators.length, "initial creators");
    return creators;
  },

  /* ---------- RESET ALL ---------- */
  async resetAll() {
    creators = [];
    saveToStorage();
    notify();
  },

  /* ---------- NEW: SYNC UTILITY METHODS ---------- */
  
  // Manual sync untuk creator tertentu
  async syncCreatorToCloud(creatorId) {
    const creator = creators.find(c => c.id === creatorId);
    if (!creator) return { success: false, error: 'Creator not found' };
    
    try {
      await saveCreatorToSync(creator);
      creator.synced = true;
      creator.synced_at = new Date().toISOString();
      saveToStorage();
      notify();
      return { success: true, creatorId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Sync semua creators ke cloud
  async syncAllCreatorsToCloud() {
    const results = [];
    
    for (const creator of creators) {
      if (!creator.synced) {
        try {
          await saveCreatorToSync(creator);
          creator.synced = true;
          creator.synced_at = new Date().toISOString();
          results.push({ creatorId: creator.id, success: true });
        } catch (error) {
          results.push({ creatorId: creator.id, success: false, error: error.message });
        }
      } else {
        results.push({ creatorId: creator.id, success: true, message: 'Already synced' });
      }
    }
    
    if (results.length > 0) {
      saveToStorage();
      notify();
    }
    
    return results;
  },

  // Cek sync status untuk semua creators
  getSyncStatus() {
    const total = creators.length;
    const synced = creators.filter(c => c.synced).length;
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
    const unsyncedCreators = creators.filter(c => !c.synced);
    const results = [];
    
    for (const creator of unsyncedCreators) {
      try {
        await saveCreatorToSync(creator);
        creator.synced = true;
        creator.synced_at = new Date().toISOString();
        results.push({ creatorId: creator.id, success: true });
      } catch (error) {
        results.push({ creatorId: creator.id, success: false, error: error.message });
      }
    }
    
    if (results.length > 0) {
      saveToStorage();
      notify();
    }
    
    return results;
  }
};