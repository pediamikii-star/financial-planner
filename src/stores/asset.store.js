/* ========== ASSETS STORAGE ========== */

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

/* ======================
   GET ALL
====================== */
export function getAssets() {
  try {
    return JSON.parse(localStorage.getItem(ASSETS_KEY)) || [];
  } catch {
    return [];
  }
}

/* ======================
   SAVE (AUTO ADD / UPDATE)
====================== */
export function saveAsset(asset) {
  const assets = getAssets();

  // kalau belum ada id, berarti ADD
  const assetWithId = {
    ...asset,
    id: asset.id || crypto.randomUUID(),
    createdAt: asset.createdAt || Date.now(),
    // Default currentEstimatedValue sama dengan purchasePrice jika tidak diisi
    currentEstimatedValue: asset.currentEstimatedValue || asset.purchasePrice || 0,
  };

  const exists = assets.some(a => a.id === assetWithId.id);

  const updatedAssets = exists
    ? assets.map(a =>
        a.id === assetWithId.id ? { ...a, ...assetWithId } : a
      )
    : [...assets, assetWithId];

  localStorage.setItem(ASSETS_KEY, JSON.stringify(updatedAssets));
  window.dispatchEvent(new Event("assetsUpdated"));
}

/* ======================
   UPDATE (OPTIONAL)
====================== */
export function updateAsset(updatedAsset) {
  const assets = getAssets().map(asset =>
    asset.id === updatedAsset.id
      ? { ...asset, ...updatedAsset }
      : asset
  );

  localStorage.setItem(ASSETS_KEY, JSON.stringify(assets));
  window.dispatchEvent(new Event("assetsUpdated"));
}

/* ======================
   DELETE
====================== */
export function deleteAsset(id) {
  const assets = getAssets().filter(asset => asset.id !== id);

  localStorage.setItem(ASSETS_KEY, JSON.stringify(assets));
  window.dispatchEvent(new Event("assetsUpdated"));
}

/* ======================
   CLEAR ALL (OPTIONAL)
====================== */
export function clearAssets() {
  localStorage.removeItem(ASSETS_KEY);
  window.dispatchEvent(new Event("assetsUpdated"));
}

/* ======================
   GET TOTAL PURCHASE VALUE
====================== */
export function getTotalPurchaseValue() {
  const assets = getAssets();
  return assets.reduce((total, asset) => total + (asset.purchasePrice || 0), 0);
}

/* ======================
   GET TOTAL CURRENT ESTIMATED VALUE
====================== */
export function getTotalCurrentValue() {
  const assets = getAssets();
  return assets.reduce((total, asset) => 
    total + (asset.currentEstimatedValue || asset.purchasePrice || 0), 0);
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
    const purchasePrice = asset.purchasePrice || 0;
    const currentValue = asset.currentEstimatedValue || purchasePrice;
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
    categoryMap[normalizedCategory].totalPurchase += asset.purchasePrice || 0;
    categoryMap[normalizedCategory].totalCurrent += asset.currentEstimatedValue || asset.purchasePrice || 0;
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
   NEW: ASSET VALUE BREAKDOWN FOR DONUT / PIE CHART
   (SUM CURRENT VALUE BY CATEGORY, WITH LABEL)
================================================= */
export function getAssetValueBreakdownForChart() {
  const assets = getAssets();
  const map = {};

  assets.forEach(asset => {
    const category = normalizeCategory(asset.category || "other");
    const value = asset.currentEstimatedValue || asset.purchasePrice || 0;

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

/* ======================
   EXPORT DEFAULT
====================== */
export default {
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
  getAssetValueBreakdownForChart
};
