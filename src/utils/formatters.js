// utils/formatters.js

/**
 * Format angka ke mata uang IDR
 * @param {number} amount - Jumlah uang
 * @returns {string} - Format Rp 1.234.567
 */
export function formatCurrency(amount) {
  if (amount === undefined || amount === null) return 'Rp 0';
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format persentase
 * @param {number} value - Nilai persentase
 * @param {number} decimals - Jumlah desimal (default: 1)
 * @returns {string} - Format 12.3%
 */
export function formatPercentage(value, decimals = 1) {
  if (value === undefined || value === null) return '0%';
  
  return value.toFixed(decimals) + '%';
}

/**
 * Format tanggal Indonesia
 * @param {string|Date} date - Tanggal
 * @param {boolean} withTime - Tampilkan waktu
 * @returns {string} - Format 30 Jan 2026
 */
export function formatDate(date, withTime = false) {
  if (!date) return '-';
  
  const d = new Date(date);
  
  if (isNaN(d.getTime())) return '-';
  
  const options = {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  };
  
  if (withTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return d.toLocaleDateString('id-ID', options);
}

/**
 * Format angka besar dengan suffix (K, M, B, T)
 * @param {number} num - Angka
 * @returns {string} - Format 1.2M
 */
export function formatNumberShort(num) {
  if (num === undefined || num === null || isNaN(num)) return '0';
  
  const absNum = Math.abs(num);
  
  if (absNum >= 1e12) {
    return (num / 1e12).toFixed(1) + 'T';
  }
  if (absNum >= 1e9) {
    return (num / 1e9).toFixed(1) + 'B';
  }
  if (absNum >= 1e6) {
    return (num / 1e6).toFixed(1) + 'M';
  }
  if (absNum >= 1e3) {
    return (num / 1e3).toFixed(1) + 'K';
  }
  
  return num.toString();
}

/**
 * Format untuk display net worth yang besar
 * @param {number} amount - Jumlah net worth
 * @returns {string} - Format Rp 4.1B
 */
export function formatNetWorth(amount) {
  if (!amount) return 'Rp 0';
  
  const formatted = formatNumberShort(amount);
  return `Rp ${formatted}`;
}

export default {
  formatCurrency,
  formatPercentage,
  formatDate,
  formatNumberShort,
  formatNetWorth
};