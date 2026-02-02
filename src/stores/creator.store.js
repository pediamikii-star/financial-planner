// src/store/creator.store.js

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

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      creators = JSON.parse(raw);
      
      // MIGRATION: Pastikan semua creator memiliki field yang konsisten
      creators = creators.map(creator => ({
        id: creator.id,
        platform: creator.platform,
        name: creator.name || creator.channel,
        // PERBAIKAN: Simpan description dengan benar
        description: creator.description || "",
        // PERBAIKAN: Simpan income type dengan benar (utamakan type, kemudian incomeType)
        type: creator.type || creator.incomeType || "",
        // PASTIKAN BALANCE ADA
        balance: Number(creator.balance || creator.platformBalance || creator.currentBalance || creator.amount || 0),
        totalIncome: Number(creator.totalIncome || creator.income || 0),
        totalWithdrawn: Number(creator.totalWithdrawn || creator.withdrawn || 0),
        currency: creator.currency || "IDR",
        createdAt: creator.createdAt || new Date().toISOString(),
        updatedAt: creator.updatedAt || new Date().toISOString(),
      }));
      
      console.log("📥 Loaded creators from storage:", creators.length, "items");
      creators.forEach(c => console.log(`   - ${c.id}: ${c.platform} - ${c.name} - Type: ${c.type}`));
    } else {
      console.log("📭 No creators found in storage");
      creators = [];
    }
  } catch (error) {
    console.error("❌ Error loading creators from storage:", error);
    creators = [];
  }
}

/* =========================
   PUBLIC STORE API
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
  init() {
    loadFromStorage();
    notify();
  },

  add(creator) {
    // Generate ID yang konsisten
    const id = creator.id || Date.now();
    
    const newCreator = {
      id: id,
      platform: creator.platform,
      name: creator.name || creator.channel || "",
      description: creator.description || "",
      // PERBAIKAN: Simpan income type dengan benar
      type: creator.type || creator.incomeType || "",
      // PASTIKAN BALANCE ADA DAN NUMERIC
      balance: Number(creator.balance || creator.platformBalance || creator.initialBalance || 0),
      totalIncome: Number(creator.totalIncome || 0),
      totalWithdrawn: Number(creator.totalWithdrawn || 0),
      currency: creator.currency || "IDR",
      createdAt: creator.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
    
    return newCreator;
  },

  update(updated) {
    console.log("🔄 Updating creator:", updated.id);
    
    creators = creators.map((creator) =>
      creator.id === updated.id
        ? { 
            ...creator, 
            ...updated,
            // PERBAIKAN: Pastikan type selalu diupdate jika ada di payload
            type: updated.type !== undefined ? updated.type : creator.type,
            balance: Number(updated.balance !== undefined ? updated.balance : creator.balance),
            updatedAt: new Date().toISOString()
          }
        : creator
    );
    
    saveToStorage();
    notify();
  },

  remove(id) {
    creators = creators.filter(
      (creator) => creator.id !== id
    );
    saveToStorage();
    notify();
  },

  /* ---------- WITHDRAW METHOD ---------- */
  withdrawFromCreator(creatorId, amount) {
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
    
    saveToStorage();
    notify();
    
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

  /* ---------- ADD INCOME METHOD ---------- */
  addIncome(creatorId, amount) {
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
    
    saveToStorage();
    notify();
    
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
  seedInitialData() {
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
    
    creators = initialData;
    saveToStorage();
    notify();
    
    console.log("✅ Seeded", creators.length, "initial creators");
    return creators;
  },

  /* ---------- RESET ALL ---------- */
  resetAll() {
    creators = [];
    saveToStorage();
    notify();
  },
};