// src/store/asset.store.js

// ============================================
// IMPORT SYNC FUNCTIONS DARI store.js
// ============================================
import { 
  getAssets as getAssetsFromSync,
  saveAsset as saveAssetToSync,
  deleteAsset as deleteAssetFromSync,
  getAssetsSync as getLocalAssetsSync,
  triggerAssetUpdate as triggerAssetUpdateEvent
} from '../services/storage.js';

const ASSETS_KEY = "assets";

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

// Helper untuk sync perubahan ke cloud
async function syncAssetChange(asset, operation = 'save') {
  try {
    if (operation === 'save') {
      await saveAssetToSync(asset);
    } else if (operation === 'delete') {
      await deleteAssetFromSync(asset.id);
    }
  } catch (error) {
    console.warn('⚠️ Asset sync to cloud failed (will retry later):', error.message);
    // Mark as unsynced for later retry
    if (asset) {
      asset.synced = false;
      saveToLocalStorage();
    }
  }
}

// Helper untuk save ke localStorage
function saveToLocalStorage(assets) {
  localStorage.setItem(ASSETS_KEY, JSON.stringify(assets));
  triggerAssetUpdateEvent();
}

// Helper untuk load dari localStorage
function loadFromLocalStorage() {
  try {
    return JSON.parse(localStorage.getItem(ASSETS_KEY)) || [];
  } catch {
    return [];
  }
}

/* ======================
   GET ALL (WITH SYNC SUPPORT)
====================== */
export async function getAssets() {
  try {
    // Coba load dari sync system dulu
    const syncedAssets = await getAssetsFromSync();
    
    if (syncedAssets && syncedAssets.length > 0) {
      console.log('📥 Loaded assets from sync system:', syncedAssets.length);
      // Simpan ke localStorage untuk cache
      saveToLocalStorage(syncedAssets);
      return syncedAssets;
    } else {
      // Fallback ke local storage
      const localAssets = loadFromLocalStorage();
      console.log('📥 Loaded assets from localStorage:', localAssets.length);
      return localAssets;
    }
  } catch (error) {
    console.warn('⚠️ Error loading assets from sync, using localStorage:', error);
    return loadFromLocalStorage();
  }
}

/* ======================
   GET ALL SYNC (FOR BACKWARD COMPATIBILITY)
====================== */
export function getAssetsSync() {
  return loadFromLocalStorage();
}

/* ======================
   SAVE (AUTO ADD / UPDATE) WITH SYNC
====================== */
export async function saveAsset(asset) {
  // Ambil data assets terkini
  const assets = await getAssets();

  // kalau belum ada id, berarti ADD
  const assetWithId = {
    ...asset,
    id: asset.id || crypto.randomUUID(),
    createdAt: asset.createdAt || new Date().toISOString(),
    // Default currentEstimatedValue sama dengan purchasePrice jika tidak diisi
    currentEstimatedValue: asset.currentEstimatedValue || asset.purchasePrice || 0,
    // Sync metadata
    synced: false,
    synced_at: null
  };

  const exists = assets.some(a => a.id === assetWithId.id);

  const updatedAssets = exists
    ? assets.map(a =>
        a.id === assetWithId.id ? { 
          ...a, 
          ...assetWithId,
          updatedAt: new Date().toISOString()
        } : a
      )
    : [...assets, assetWithId];

  // Simpan ke localStorage dulu (instant feedback)
  saveToLocalStorage(updatedAssets);
  
  // Sync ke cloud (background)
  syncAssetChange(assetWithId, 'save');
  
  return assetWithId;
}

/* ======================
   UPDATE (OPTIONAL) WITH SYNC
====================== */
export async function updateAsset(updatedAsset) {
  const assets = await getAssets();
  
  const updatedAssets = assets.map(asset =>
    asset.id === updatedAsset.id
      ? { 
          ...asset, 
          ...updatedAsset,
          updatedAt: new Date().toISOString(),
          synced: false
        }
      : asset
  );

  saveToLocalStorage(updatedAssets);
  
  // Sync ke cloud (background)
  const assetToSync = updatedAssets.find(a => a.id === updatedAsset.id);
  if (assetToSync) {
    syncAssetChange(assetToSync, 'save');
  }
}

/* ======================
   DELETE WITH SYNC
====================== */
export async function deleteAsset(id) {
  const assets = await getAssets();
  const assetToDelete = assets.find(asset => asset.id === id);
  
  if (!assetToDelete) return;
  
  const filteredAssets = assets.filter(asset => asset.id !== id);
  saveToLocalStorage(filteredAssets);
  
  // Sync delete ke cloud (background)
  syncAssetChange(assetToDelete, 'delete');
}

/* ======================
   CLEAR ALL (OPTIONAL)
====================== */
export async function clearAssets() {
  // Hapus dari localStorage
  localStorage.removeItem(ASSETS_KEY);
  triggerAssetUpdateEvent();
  
  // TODO: Hapus dari cloud? (mungkin tidak perlu, biar user manual)
  console.log('⚠️ Assets cleared locally. Cloud data remains.');
}

/* ======================
   GET TOTAL PURCHASE VALUE (SYNC VERSION)
====================== */
export async function getTotalPurchaseValue() {
  const assets = await getAssets();
  return assets.reduce((total, asset) => total + (Number(asset.purchasePrice) || 0), 0);
}

/* ======================
   GET TOTAL PURCHASE VALUE SYNC (FOR BACKWARD COMPATIBILITY)
====================== */
export function getTotalPurchaseValueSync() {
  const assets = getAssetsSync();
  return assets.reduce((total, asset) => total + (Number(asset.purchasePrice) || 0), 0);
}

/* ======================
   GET TOTAL CURRENT ESTIMATED VALUE (SYNC VERSION)
====================== */
export async function getTotalCurrentValue() {
  const assets = await getAssets();
  return assets.reduce((total, asset) => 
    total + (Number(asset.currentEstimatedValue) || Number(asset.purchasePrice) || 0), 0);
}

/* ======================
   GET TOTAL CURRENT ESTIMATED VALUE SYNC (FOR BACKWARD COMPATIBILITY)
====================== */
export function getTotalCurrentValueSync() {
  const assets = getAssetsSync();
  return assets.reduce((total, asset) => 
    total + (Number(asset.currentEstimatedValue) || Number(asset.purchasePrice) || 0), 0);
}

/* ======================
   GET OVERALL PROFIT/LOSS (SYNC VERSION)
====================== */
export async function getOverallPL() {
  const purchaseTotal = await getTotalPurchaseValue();
  const currentTotal = await getTotalCurrentValue();
  const amount = currentTotal - purchaseTotal;
  const percentage = purchaseTotal > 0 ? (amount / purchaseTotal) * 100 : 0;
  
  return {
    amount,
    percentage,
    isProfit: amount >= 0
  };
}

/* ======================
   GET OVERALL PROFIT/LOSS SYNC (FOR BACKWARD COMPATIBILITY)
====================== */
export function getOverallPLSync() {
  const purchaseTotal = getTotalPurchaseValueSync();
  const currentTotal = getTotalCurrentValueSync();
  const amount = currentTotal - purchaseTotal;
  const percentage = purchaseTotal > 0 ? (amount / purchaseTotal) * 100 : 0;
  
  return {
    amount,
    percentage,
    isProfit: amount >= 0
  };
}

/* ======================
   GET ASSET COUNT (SYNC VERSION)
====================== */
export async function getAssetCount() {
  const assets = await getAssets();
  return assets.length;
}

/* ======================
   GET ASSET COUNT SYNC (FOR BACKWARD COMPATIBILITY)
====================== */
export function getAssetCountSync() {
  return getAssetsSync().length;
}

/* ======================
   GET ASSETS WITH P/L CALCULATED (SYNC VERSION)
====================== */
export async function getAssetsWithPL() {
  const assets = await getAssets();
  return assets.map(asset => {
    const purchasePrice = Number(asset.purchasePrice) || 0;
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
   GET ASSETS WITH P/L CALCULATED SYNC (FOR BACKWARD COMPATIBILITY)
====================== */
export function getAssetsWithPLSync() {
  const assets = getAssetsSync();
  return assets.map(asset => {
    const purchasePrice = Number(asset.purchasePrice) || 0;
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
   GET ASSETS BY CATEGORY WITH VALUE (SYNC VERSION)
====================== */
export async function getAssetsByCategory() {
  const assets = await getAssets();
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
    categoryMap[normalizedCategory].totalPurchase += Number(asset.purchasePrice) || 0;
    categoryMap[normalizedCategory].totalCurrent += Number(asset.currentEstimatedValue) || Number(asset.purchasePrice) || 0;
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

/* ======================
   GET ASSETS BY CATEGORY SYNC (FOR BACKWARD COMPATIBILITY)
====================== */
export function getAssetsByCategorySync() {
  const assets = getAssetsSync();
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
    categoryMap[normalizedCategory].totalPurchase += Number(asset.purchasePrice) || 0;
    categoryMap[normalizedCategory].totalCurrent += Number(asset.currentEstimatedValue) || Number(asset.purchasePrice) || 0;
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

/* =================================================
   ASSET VALUE BREAKDOWN FOR DONUT / PIE CHART (SYNC VERSION)
================================================= */
export async function getAssetValueBreakdownForChart() {
  const assets = await getAssets();
  const map = {};

  assets.forEach(asset => {
    const category = normalizeCategory(asset.category || "other");
    const value = Number(asset.currentEstimatedValue) || Number(asset.purchasePrice) || 0;

    if (!map[category]) {
      map[category] = 0;
    }

    map[category] += value;
  });

  return Object.entries(map).map(([category, value]) => ({
    name: category.charAt(0).toUpperCase() + category.slice(1),
    value
  }));
}

/* =================================================
   ASSET VALUE BREAKDOWN SYNC (FOR BACKWARD COMPATIBILITY)
================================================= */
export function getAssetValueBreakdownForChartSync() {
  const assets = getAssetsSync();
  const map = {};

  assets.forEach(asset => {
    const category = normalizeCategory(asset.category || "other");
    const value = Number(asset.currentEstimatedValue) || Number(asset.purchasePrice) || 0;

    if (!map[category]) {
      map[category] = 0;
    }

    map[category] += value;
  });

  return Object.entries(map).map(([category, value]) => ({
    name: category.charAt(0).toUpperCase() + category.slice(1),
    value
  }));
}

/* =================================================
   NEW: SYNC UTILITY FUNCTIONS
================================================= */

// Manual sync untuk asset tertentu
export async function syncAssetToCloud(assetId) {
  const assets = await getAssets();
  const asset = assets.find(a => a.id === assetId);
  
  if (!asset) return { success: false, error: 'Asset not found' };
  
  try {
    await saveAssetToSync(asset);
    
    // Update sync status
    const updatedAssets = assets.map(a => 
      a.id === assetId 
        ? { ...a, synced: true, synced_at: new Date().toISOString() }
        : a
    );
    
    saveToLocalStorage(updatedAssets);
    return { success: true, assetId };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Cek sync status untuk semua assets
export async function getAssetSyncStatus() {
  const assets = await getAssets();
  const total = assets.length;
  const synced = assets.filter(a => a.synced).length;
  const unsynced = total - synced;
  
  return {
    total,
    synced,
    unsynced,
    percentage: total > 0 ? Math.round((synced / total) * 100) : 0
  };
}

// Refresh assets dari cloud
export async function refreshAssetsFromCloud() {
  try {
    const syncedAssets = await getAssetsFromSync();
    if (syncedAssets && syncedAssets.length > 0) {
      saveToLocalStorage(syncedAssets);
      console.log('🔄 Refreshed assets from cloud:', syncedAssets.length);
      return { success: true, count: syncedAssets.length };
    }
    return { success: false, error: 'No data from cloud' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/* ======================
   EXPORT DEFAULT (FOR BACKWARD COMPATIBILITY)
====================== */
export default {
  // Async versions (new)
  getAssets,
  saveAsset,
  updateAsset,
  deleteAsset,
  clearAssets,
  getTotalPurchaseValue,
  getTotalCurrentValue,
  getOverallPL,
  getAssetCount,
  getAssetsWithPL,
  getAssetsByCategory,
  getAssetValueBreakdownForChart,
  
  // Sync versions (backward compatibility)
  getAssetsSync,
  getTotalPurchaseValueSync,
  getTotalCurrentValueSync,
  getOverallPLSync,
  getAssetCountSync,
  getAssetsWithPLSync,
  getAssetsByCategorySync,
  getAssetValueBreakdownForChartSync,
  
  // New sync utilities
  syncAssetToCloud,
  getAssetSyncStatus,
  refreshAssetsFromCloud
};