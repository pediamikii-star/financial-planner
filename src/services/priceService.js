/* ======================================
   PRICE SERVICE - 100% GRATIS VERSION
   Multi-source rotation tanpa API key
====================================== */

import { IDX_STOCK_LIST } from '../data/idxStockList.js';
import { CRYPTO_LIST } from '../data/cryptoList.js';

// ========== CONFIGURATION ==========
const CONFIG = {
  cacheDuration: 15 * 60 * 1000, // 15 menit (lebih pendek untuk real-time)
  requestTimeout: 8000,
  maxRetries: 1
};

// ========== PERSISTENT CACHE ==========
let priceCache = {};

// Load cache
try {
  const savedCache = localStorage.getItem('finPlanner_priceCache');
  if (savedCache) {
    const parsed = JSON.parse(savedCache);
    const now = Date.now();
    
    Object.keys(parsed).forEach(key => {
      if (now - parsed[key].timestamp < CONFIG.cacheDuration * 2) {
        priceCache[key] = parsed[key];
      }
    });
    
    console.log(`📦 Loaded ${Object.keys(priceCache).length} cached items`);
  }
} catch (e) {
  console.warn('Failed to load cache:', e.message);
}

// Save cache
let saveCacheTimeout;
function saveCache() {
  if (saveCacheTimeout) clearTimeout(saveCacheTimeout);
  saveCacheTimeout = setTimeout(() => {
    try {
      localStorage.setItem('finPlanner_priceCache', JSON.stringify(priceCache));
    } catch (e) {
      console.warn('Failed to save cache:', e.message);
    }
  }, 1000);
}

// ========== USD TO IDR RATE ==========
let usdToIdrCache = { value: 16500, timestamp: 0 };
const RATE_CACHE_DURATION = 6 * 60 * 60 * 1000;

async function getUsdToIdrRate() {
  const now = Date.now();
  
  if (now - usdToIdrCache.timestamp < RATE_CACHE_DURATION) {
    return usdToIdrCache.value;
  }
  
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      timeout: 5000
    });
    
    if (response.ok) {
      const data = await response.json();
      const rate = data.rates?.IDR;
      
      if (rate) {
        usdToIdrCache = { value: rate, timestamp: now };
        return rate;
      }
    }
  } catch (error) {
    console.warn('Exchange rate API failed, using cached');
  }
  
  return usdToIdrCache.value;
}

// ========== STOCK SOURCES (100% GRATIS) ==========
const STOCK_SOURCES = [
  // 1. Bareksa Mobile API (paling reliable)
  {
    name: 'bareksa_mobile',
    fetch: async (symbol) => {
      try {
        const response = await fetch(
          `https://mobile.bareksa.com/api/stock/${symbol}/summary`,
          {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36',
              'Referer': 'https://www.bareksa.com/'
            },
            timeout: CONFIG.requestTimeout
          }
        );
        
        if (response.status === 429) return null; // Rate limited
        
        if (!response.ok) return null;
        
        const data = await response.json();
        return data?.last || data?.data?.last;
      } catch (error) {
        console.warn(`Bareksa Mobile ${symbol}:`, error.message);
        return null;
      }
    }
  },
  
  // 2. Bareksa Web API
  {
    name: 'bareksa_web',
    fetch: async (symbol) => {
      try {
        const response = await fetch(
          `https://www.bareksa.com/api/stock/summary/${symbol}`,
          {
            headers: {
              'Accept': 'application/json',
              'Referer': 'https://www.bareksa.com/'
            },
            timeout: CONFIG.requestTimeout
          }
        );
        
        if (response.status === 429) return null;
        
        if (!response.ok) return null;
        
        const data = await response.json();
        return data?.data?.last;
      } catch (error) {
        console.warn(`Bareksa Web ${symbol}:`, error.message);
        return null;
      }
    }
  },
  
  // 3. RTI API
  {
    name: 'rti',
    fetch: async (symbol) => {
      try {
        const response = await fetch(
          `https://rti-harga.vercel.app/api/stock/${symbol}`,
          {
            headers: { 'Accept': 'application/json' },
            timeout: CONFIG.requestTimeout
          }
        );
        
        if (!response.ok) return null;
        
        const data = await response.json();
        return data?.price;
      } catch (error) {
        console.warn(`RTI ${symbol}:`, error.message);
        return null;
      }
    }
  },
  
  // 4. IDX API
  {
    name: 'idx',
    fetch: async (symbol) => {
      try {
        const response = await fetch(
          `https://iss-api.finno.id/idx/stock/${symbol}.JK`,
          {
            headers: { 'Accept': 'application/json' },
            timeout: CONFIG.requestTimeout
          }
        );
        
        if (!response.ok) return null;
        
        const data = await response.json();
        return data?.data?.last_price;
      } catch (error) {
        console.warn(`IDX ${symbol}:`, error.message);
        return null;
      }
    }
  },
  
  // 5. Yahoo Finance via CORS proxy
  {
    name: 'yahoo',
    fetch: async (symbol) => {
      try {
        const proxyUrl = 'https://api.allorigins.win/raw?url=';
        const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.JK`;
        
        const response = await fetch(
          proxyUrl + encodeURIComponent(yahooUrl),
          {
            headers: { 'Accept': 'application/json' },
            timeout: CONFIG.requestTimeout
          }
        );
        
        if (!response.ok) return null;
        
        const data = await response.json();
        const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
        
        if (price) {
          // Convert USD to IDR if needed
          const meta = data.chart.result[0].meta;
          if (meta.currency === 'USD') {
            const rate = await getUsdToIdrRate();
            return price * rate;
          }
          return price;
        }
        
        return null;
      } catch (error) {
        console.warn(`Yahoo ${symbol}:`, error.message);
        return null;
      }
    }
  }
];

// ========== MAIN STOCK PRICE FUNCTION ==========
async function fetchStockPrice(symbol) {
  const cleanSymbol = symbol.replace('.JK', '').toUpperCase();
  const cacheKey = `stock_${cleanSymbol}`;
  const now = Date.now();
  
  // Check cache first
  if (priceCache[cacheKey] && now - priceCache[cacheKey].timestamp < CONFIG.cacheDuration) {
    console.log(`📦 [CACHE] ${cleanSymbol}: Rp ${priceCache[cacheKey].price.toLocaleString()}`);
    return priceCache[cacheKey].price;
  }
  
  // Validate symbol
  if (!IDX_STOCK_LIST.find(s => s.symbol === cleanSymbol)) {
    console.warn(`Stock ${cleanSymbol} not in allowed list`);
    return null;
  }
  
  console.log(`🔍 [FREE] Fetching ${cleanSymbol}...`);
  
  let price = null;
  let source = '';
  
  try {
    // 🔄 ROTATION STRATEGY: Shuffle sources untuk distribusi load
    const shuffledSources = [...STOCK_SOURCES].sort(() => Math.random() - 0.5);
    
    for (const src of shuffledSources) {
      console.log(`   Trying ${src.name}...`);
      price = await src.fetch(cleanSymbol);
      
      if (price !== null) {
        source = src.name;
        break;
      }
    }
    
    // Save to cache if successful
    if (price !== null) {
      const roundedPrice = Math.round(price);
      
      priceCache[cacheKey] = {
        price: roundedPrice,
        timestamp: now,
        source,
        symbol: cleanSymbol,
        fetchedAt: new Date().toISOString()
      };
      saveCache();
      
      console.log(`✅ [${source}] ${cleanSymbol}: Rp ${roundedPrice.toLocaleString()}`);
    } else {
      console.warn(`⚠️ All free sources failed for ${cleanSymbol}`);
      
      // Use expired cache as last resort
      if (priceCache[cacheKey]) {
        console.log(`↩️ Using expired cache for ${cleanSymbol}`);
        price = priceCache[cacheKey].price;
        source = 'expired_cache';
      }
    }
    
    return price;
    
  } catch (error) {
    console.error(`Stock ${cleanSymbol} error:`, error.message);
    
    // Return expired cache as fallback
    if (priceCache[cacheKey]) {
      console.warn(`↩️ Using expired cache after error for ${cleanSymbol}`);
      return priceCache[cacheKey].price;
    }
    
    return null;
  }
}

// ========== CRYPTO PRICE FETCHING (FREE) ==========
const CRYPTO_SOURCES = [
  // 1. CoinGecko (paling lengkap)
  {
    name: 'coingecko',
    fetch: async (symbol) => {
      try {
        const coinId = getCoinGeckoId(symbol);
        if (!coinId) return null;
        
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=idr`,
          { timeout: CONFIG.requestTimeout }
        );
        
        if (!response.ok) return null;
        
        const data = await response.json();
        return data[coinId]?.idr;
      } catch (error) {
        console.warn(`CoinGecko ${symbol}:`, error.message);
        return null;
      }
    }
  },
  
  // 2. Binance (untuk crypto populer)
  {
    name: 'binance',
    fetch: async (symbol) => {
      try {
        const pair = `${symbol}USDT`;
        const response = await fetch(
          `https://api.binance.com/api/v3/ticker/price?symbol=${pair}`,
          { timeout: 5000 }
        );
        
        if (!response.ok) return null;
        
        const data = await response.json();
        
        if (data.price && !data.code) {
          const usdPrice = parseFloat(data.price);
          const rate = await getUsdToIdrRate();
          return usdPrice * rate;
        }
        
        return null;
      } catch (error) {
        if (!error.message.includes('404')) {
          console.warn(`Binance ${symbol}:`, error.message);
        }
        return null;
      }
    }
  },
  
  // 3. Pintu (untuk crypto Indonesia)
  {
    name: 'pintu',
    fetch: async (symbol) => {
      try {
        const response = await fetch('https://api.pintu.co.id/v2/trade/price-changes', {
          headers: { 'Accept': 'application/json' },
          timeout: CONFIG.requestTimeout
        });
        
        if (!response.ok) return null;
        
        const data = await response.json();
        
        if (data.payload && Array.isArray(data.payload)) {
          const crypto = data.payload.find(item => 
            item.currency === symbol || 
            item.name?.toUpperCase() === symbol.toUpperCase()
          );
          
          return crypto?.latestPrice;
        }
        
        return null;
      } catch (error) {
        console.warn(`Pintu ${symbol}:`, error.message);
        return null;
      }
    }
  }
];

// CoinGecko ID mapping
function getCoinGeckoId(symbol) {
  const mapping = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'BNB': 'binancecoin',
    'XRP': 'ripple',
    'ADA': 'cardano',
    'DOGE': 'dogecoin',
    'SOL': 'solana',
    'DOT': 'polkadot',
    'AVAX': 'avalanche-2',
    'MATIC': 'polygon',
    'SHIB': 'shiba-inu',
    'LINK': 'chainlink',
    'ATOM': 'cosmos',
    'UNI': 'uniswap',
    'HBAR': 'hedera-hashgraph',
    'ONDO': 'ondo-finance',
    // Tambah sesuai kebutuhan
  };
  
  return mapping[symbol.toUpperCase()];
}

async function fetchCryptoPrice(symbol) {
  const cleanSymbol = symbol.toUpperCase();
  const cacheKey = `crypto_${cleanSymbol}`;
  const now = Date.now();
  
  // Check cache first
  if (priceCache[cacheKey] && now - priceCache[cacheKey].timestamp < CONFIG.cacheDuration) {
    return priceCache[cacheKey].price;
  }
  
  // Validate symbol
  if (!CRYPTO_LIST.find(c => c.symbol === cleanSymbol)) {
    console.warn(`Crypto ${cleanSymbol} not in allowed list`);
    return null;
  }
  
  // Handle stablecoins
  if (cleanSymbol === 'IDRT') return 1;
  if (['USDT', 'USDC', 'DAI'].includes(cleanSymbol)) {
    const rate = await getUsdToIdrRate();
    return Math.round(rate);
  }
  
  console.log(`🔍 [CRYPTO] Fetching ${cleanSymbol}...`);
  
  let price = null;
  let source = '';
  
  try {
    // Try all crypto sources
    for (const src of CRYPTO_SOURCES) {
      console.log(`   Trying ${src.name}...`);
      price = await src.fetch(cleanSymbol);
      
      if (price !== null) {
        source = src.name;
        break;
      }
    }
    
    // Save to cache if successful
    if (price !== null) {
      const roundedPrice = Math.round(price);
      
      priceCache[cacheKey] = {
        price: roundedPrice,
        timestamp: now,
        source,
        symbol: cleanSymbol
      };
      saveCache();
      
      console.log(`✅ [${source}] ${cleanSymbol}: Rp ${roundedPrice.toLocaleString()}`);
    } else {
      console.warn(`⚠️ No price found for crypto ${cleanSymbol}`);
    }
    
    return price;
    
  } catch (error) {
    console.error(`Crypto ${cleanSymbol} error:`, error.message);
    
    // Return expired cache as fallback
    if (priceCache[cacheKey]) {
      console.warn(`↩️ Using expired cache for ${cleanSymbol}`);
      return priceCache[cacheKey].price;
    }
    
    return null;
  }
}

// ========== BATCH OPERATIONS ==========
async function fetchMultiplePrices(investments) {
  const results = { stocks: {}, cryptos: {} };
  
  if (!investments?.length) {
    console.log('No investments to fetch');
    return results;
  }
  
  // Extract unique symbols
  const stockSymbols = [...new Set(
    investments
      .filter(inv => inv.type === 'stock' && inv.symbol)
      .map(inv => inv.symbol.replace('.JK', '').toUpperCase())
  )];
  
  const cryptoSymbols = [...new Set(
    investments
      .filter(inv => inv.type === 'crypto' && inv.symbol)
      .map(inv => inv.symbol.toUpperCase())
  )];
  
  console.log(`🔍 Fetching ${stockSymbols.length} stocks, ${cryptoSymbols.length} cryptos`);
  
  // Fetch dengan delay untuk hindari rate limit
  const stockPromises = stockSymbols.map((symbol, index) => 
    new Promise(resolve => {
      setTimeout(async () => {
        const price = await fetchStockPrice(symbol);
        resolve({ symbol, price });
      }, index * 500); // Delay 500ms antara setiap request
    })
  );
  
  const cryptoPromises = cryptoSymbols.map((symbol, index) => 
    new Promise(resolve => {
      setTimeout(async () => {
        const price = await fetchCryptoPrice(symbol);
        resolve({ symbol, price });
      }, index * 300); // Delay 300ms
    })
  );
  
  try {
    const [stockResults, cryptoResults] = await Promise.all([
      Promise.all(stockPromises),
      Promise.all(cryptoPromises)
    ]);
    
    // Map results
    stockResults.forEach(({ symbol, price }) => {
      if (price !== null) results.stocks[symbol] = price;
    });
    
    cryptoResults.forEach(({ symbol, price }) => {
      if (price !== null) results.cryptos[symbol] = price;
    });
    
    console.log(`✅ Fetched ${Object.keys(results.stocks).length}/${stockSymbols.length} stocks, ${Object.keys(results.cryptos).length}/${cryptoSymbols.length} cryptos`);
    
  } catch (error) {
    console.error('Batch fetch error:', error);
  }
  
  return results;
}

async function updateAllInvestmentPrices(investments) {
  if (!investments?.length) {
    console.log('No investments to update');
    return investments;
  }
  
  console.log('🔄 Starting FREE price update...');
  
  const priceMap = await fetchMultiplePrices(investments);
  
  const updated = investments.map(inv => {
    let currentPrice = null;
    let currentValue = null;
    let priceStatus = 'failed';
    
    if (inv.type === 'stock' && inv.symbol) {
      const cleanSymbol = inv.symbol.replace('.JK', '').toUpperCase();
      currentPrice = priceMap.stocks[cleanSymbol];
    } else if (inv.type === 'crypto' && inv.symbol) {
      currentPrice = priceMap.cryptos[inv.symbol.toUpperCase()];
    }
    
    // Calculate current value
    if (currentPrice !== null && inv.quantity) {
      currentValue = currentPrice * inv.quantity;
      priceStatus = 'updated';
      console.log(`   ✓ ${inv.symbol || inv.name}: Rp ${currentPrice.toLocaleString()}`);
    } else if (inv.currentPrice) {
      currentPrice = inv.currentPrice;
      if (inv.quantity) {
        currentValue = inv.currentPrice * inv.quantity;
      }
      priceStatus = 'cached';
      console.log(`   ✗ ${inv.symbol || inv.name}: Using cached price`);
    } else {
      console.log(`   ✗ ${inv.symbol || inv.name}: No price available`);
    }
    
    return {
      ...inv,
      currentPrice: currentPrice !== null ? currentPrice : inv.currentPrice,
      currentValue: currentValue !== null ? currentValue : inv.currentValue,
      lastUpdated: new Date().toISOString(),
      priceStatus
    };
  });
  
  console.log('✅ FREE price update complete');
  return updated;
}

// ========== UTILITY FUNCTIONS ==========
async function refreshInvestmentPrice(investment) {
  if (!investment?.symbol) {
    console.warn('No symbol provided for refresh');
    return null;
  }
  
  let price = null;
  
  try {
    if (investment.type === 'crypto') {
      price = await fetchCryptoPrice(investment.symbol);
    } else if (investment.type === 'stock') {
      price = await fetchStockPrice(investment.symbol);
    }
    
    if (price) {
      console.log(`✅ Refreshed ${investment.symbol}: Rp ${price.toLocaleString()}`);
    } else {
      console.warn(`❌ Failed to refresh ${investment.symbol}`);
    }
    
  } catch (error) {
    console.error(`Refresh error for ${investment.symbol}:`, error);
  }
  
  return price;
}

function clearPriceCache() {
  priceCache = {};
  localStorage.removeItem('finPlanner_priceCache');
  usdToIdrCache = { value: 16500, timestamp: 0 };
  console.log('🧹 Price cache cleared');
}

function getCacheStats() {
  const now = Date.now();
  const valid = Object.values(priceCache).filter(
    item => now - item.timestamp < CONFIG.cacheDuration
  ).length;
  
  return {
    total: Object.keys(priceCache).length,
    valid,
    expired: Object.keys(priceCache).length - valid,
    duration: '15 minutes'
  };
}

// Export all functions
export {
  fetchStockPrice,
  fetchCryptoPrice,
  fetchMultiplePrices,
  updateAllInvestmentPrices,
  refreshInvestmentPrice,
  clearPriceCache,
  getCacheStats
};

export default {
  fetchStockPrice,
  fetchCryptoPrice,
  fetchMultiplePrices,
  updateAllInvestmentPrices,
  refreshInvestmentPrice,
  clearPriceCache,
  getCacheStats
};