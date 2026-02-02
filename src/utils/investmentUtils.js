/**
 * ===============================
 * Investment Utils
 * ===============================
 * NOTE:
 * - Harga sekarang (currentPrice) DIKIRIM dari luar
 * - Utils ini hanya menghitung & formatting
 */

/* ===============================
   COLORS (WAJIB UNTUK CHART)
================================ */
export const INVESTMENT_COLORS = {
  stock: "#3B82F6",      // blue-500
  crypto: "#F59E0B",     // amber-500
  reksadana: "#22C55E",  // green-500
  deposito: "#8B5CF6",   // violet-500
  other: "#9CA3AF",      // gray-400
};

/* ===============================
   LABELS (OPTIONAL, TAPI RAPI)
================================ */
export const INVESTMENT_LABELS = {
  stock: "Stock",
  crypto: "Crypto",
  reksadana: "Reksadana",
  deposito: "Bond",
  other: "Other",
};

/* ===============================
   BASIC CALCULATION
================================ */

/**
 * Hitung nilai beli (modal)
 */
export function getBuyValue(buyPrice, quantity) {
  return Number(buyPrice || 0) * Number(quantity || 0);
}

/**
 * Hitung nilai sekarang
 */
export function getCurrentValue(currentPrice, quantity) {
  if (!currentPrice) return 0;
  return Number(currentPrice) * Number(quantity || 0);
}

/**
 * Hitung profit / loss (nominal)
 */
export function getPnL(buyPrice, currentPrice, quantity) {
  const buyValue = getBuyValue(buyPrice, quantity);
  const currentValue = getCurrentValue(currentPrice, quantity);
  return currentValue - buyValue;
}

/**
 * Hitung profit / loss (%)
 */
export function getPnLPercent(buyPrice, currentPrice, quantity) {
  const buyValue = getBuyValue(buyPrice, quantity);
  if (buyValue === 0) return 0;

  const pnl = getPnL(buyPrice, currentPrice, quantity);
  return (pnl / buyValue) * 100;
}

/* ===============================
   SUMMARY (PORTFOLIO LEVEL)
================================ */
export function getInvestmentSummary(investments, priceMap = {}) {
  let totalBuyValue = 0;
  let totalCurrentValue = 0;

  investments.forEach((inv) => {
    const buyValue = getBuyValue(inv.buyPrice, inv.quantity);
    const currentPrice = priceMap[inv.symbol];
    const currentValue = getCurrentValue(
      currentPrice,
      inv.quantity
    );

    totalBuyValue += buyValue;
    totalCurrentValue += currentValue;
  });

  const totalPnL = totalCurrentValue - totalBuyValue;
  const totalPnLPercent =
    totalBuyValue === 0
      ? 0
      : (totalPnL / totalBuyValue) * 100;

  return {
    totalBuyValue,
    totalCurrentValue,
    totalPnL,
    totalPnLPercent,
  };
}

/* ===============================
   GROUPING
================================ */
/**
 * Group investment by category
 * stock | crypto | reksadana | deposito
 */
export function groupInvestmentsByCategory(investments = []) {
  return investments.reduce((acc, inv) => {
    const key = inv.category || "other";
    acc[key] = acc[key] || [];
    acc[key].push(inv);
    return acc;
  }, {});
}

/* ===============================
   UI HELPERS
================================ */
/**
 * Helper untuk status warna (UI)
 */
export function getPnLStatus(pnl) {
  if (pnl > 0) return "profit";
  if (pnl < 0) return "loss";
  return "neutral";
}
