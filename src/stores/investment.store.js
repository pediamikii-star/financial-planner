import { create } from "zustand";
import { persist } from "zustand/middleware";

// Import sync functions dari store.js
import { 
  getInvestments as getInvestmentsFromSync,
  saveInvestment as saveInvestmentToSync,
  deleteInvestment as deleteInvestmentFromSync
} from '../services/storage.js';

// Helper untuk delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const useInvestmentStore = create(
  persist(
    (set, get) => ({
      investments: [],
      isUpdatingPrices: false,
      lastUpdateError: null,
      updateTimeout: null,
      isSyncing: false,
      lastSyncError: null,

      // Helper untuk normalize investment data
      normalizeInvestmentData: (investment) => {
        const base = {
          ...investment,
          // Pastikan semua numeric fields jadi number
          buyPrice: Number(investment.buyPrice) || 0,
          quantity: Number(investment.quantity) || 0,
          currentPrice: Number(investment.currentPrice) || null,
          currentValue: Number(investment.currentValue) || 0,
          amount: Number(investment.amount) || 0,
          interest: Number(investment.interest) || 0,
          // Sync metadata
          synced: investment.synced || false,
          synced_at: investment.synced_at || null
        };
        
        return base;
      },

      // Helper untuk sync investment ke cloud
      syncInvestmentToCloud: async (investment, operation = 'save') => {
        try {
          const normalizedInvestment = get().normalizeInvestmentData(investment);
          
          if (operation === 'save') {
            await saveInvestmentToSync(normalizedInvestment);
            return { success: true, investmentId: investment.id };
          } else if (operation === 'delete') {
            await deleteInvestmentFromSync(investment.id);
            return { success: true, investmentId: investment.id };
          }
        } catch (error) {
          console.warn('⚠️ Investment sync to cloud failed:', error.message);
          return { success: false, error: error.message };
        }
      },

      // Load investments dari cloud
      loadInvestmentsFromCloud: async () => {
        try {
          set({ isSyncing: true, lastSyncError: null });
          
          const cloudInvestments = await getInvestmentsFromSync();
          if (cloudInvestments && cloudInvestments.length > 0) {
            const normalizedInvestments = cloudInvestments.map(inv => 
              get().normalizeInvestmentData(inv)
            );
            
            set({ 
              investments: normalizedInvestments,
              isSyncing: false 
            });
            
            console.log('📥 Loaded investments from cloud:', cloudInvestments.length);
            return { success: true, count: cloudInvestments.length };
          }
          
          set({ isSyncing: false });
          return { success: false, error: 'No investments in cloud' };
          
        } catch (error) {
          set({ isSyncing: false, lastSyncError: error.message });
          console.warn('⚠️ Failed to load investments from cloud:', error);
          return { success: false, error: error.message };
        }
      },

      /* =========================
         ADD INVESTMENT DENGAN SYNC
      ========================= */
      addInvestment: async (investment) => {
        const base = {
          id: crypto.randomUUID(),
          type: investment.type,
          createdAt: new Date().toISOString(),
          lastUpdated: null,
          currentPrice: null,
          currentValue: null,
          priceStatus: 'pending',
          // Sync metadata
          synced: false,
          synced_at: null
        };

        let newInvestment = base;

        // CRYPTO
        if (investment.type === "crypto") {
          newInvestment = {
            ...base,
            symbol: investment.symbol,
            name: investment.name,
            buyDate: investment.buyDate,
            buyPrice: Number(investment.buyPrice),
            quantity: Number(investment.quantity),
            currentValue: Number(investment.buyPrice) * Number(investment.quantity)
          };
        }
        // STOCK
        else if (investment.type === "stock") {
          newInvestment = {
            ...base,
            symbol: investment.symbol,
            name: investment.name,
            buyDate: investment.buyDate,
            buyPrice: Number(investment.buyPrice),
            quantity: Number(investment.quantity),
            currentValue: Number(investment.buyPrice) * Number(investment.quantity)
          };
        }
        // REKSADANA
        else if (investment.type === "reksadana") {
          newInvestment = {
            ...base,
            fundName: investment.fundName,
            buyDate: investment.buyDate,
            amount: Number(investment.amount),
            currentValue: Number(investment.amount),
            priceStatus: 'static'
          };
        }
        // DEPOSITO
        else if (investment.type === "deposito") {
          const principal = Number(investment.amount);
          const rate = Number(investment.interest) / 100;
          let years = 1;
          
          if (investment.tenor === "12m") years = 1;
          else if (investment.tenor === "6m") years = 0.5;
          else if (investment.tenor === "3m") years = 0.25;
          else if (investment.tenor === "1m") years = 1/12;
          
          const interestValue = principal * rate * years;
          const maturityValue = principal + interestValue;
          
          newInvestment = {
            ...base,
            bankName: investment.bankName,
            amount: principal,
            tenor: investment.tenor,
            interest: rate * 100,
            startDate: investment.startDate,
            endDate: investment.endDate,
            currentValue: maturityValue,
            priceStatus: 'static'
          };
        }

        // Update local state
        set((state) => ({
          investments: [...state.investments, newInvestment],
          lastUpdateError: null
        }));

        // Sync ke cloud (background)
        get().syncInvestmentToCloud(newInvestment, 'save');

        // Schedule price update for crypto/stock
        if (investment.type === "crypto" || investment.type === "stock") {
          const { updateTimeout } = get();
          if (updateTimeout) clearTimeout(updateTimeout);
          
          const timeoutId = setTimeout(() => {
            get().updatePrices();
          }, 1000);
          
          set({ updateTimeout: timeoutId });
        }

        return newInvestment;
      },

      /* =========================
         UPDATE INVESTMENT DENGAN SYNC
      ========================= */
      updateInvestment: async (updated) => {
        set((state) => ({
          investments: state.investments.map((inv) => {
            if (inv.id !== updated.id) return inv;

            const base = {
              ...inv,
              type: updated.type,
              lastUpdated: new Date().toISOString(),
              // Mark for sync
              synced: false
            };

            // CRYPTO
            if (updated.type === "crypto") {
              return {
                ...base,
                symbol: updated.symbol,
                name: updated.name,
                buyDate: updated.buyDate,
                buyPrice: Number(updated.buyPrice),
                quantity: Number(updated.quantity),
                currentPrice: null,
                currentValue: Number(updated.buyPrice) * Number(updated.quantity),
                priceStatus: 'pending'
              };
            }
            // STOCK
            else if (updated.type === "stock") {
              return {
                ...base,
                symbol: updated.symbol,
                name: updated.name,
                buyDate: updated.buyDate,
                buyPrice: Number(updated.buyPrice),
                quantity: Number(updated.quantity),
                currentPrice: null,
                currentValue: Number(updated.buyPrice) * Number(updated.quantity),
                priceStatus: 'pending'
              };
            }
            // REKSADANA
            else if (updated.type === "reksadana") {
              return {
                ...base,
                fundName: updated.fundName,
                buyDate: updated.buyDate,
                amount: Number(updated.amount),
                currentValue: Number(updated.amount),
                priceStatus: 'static'
              };
            }
            // DEPOSITO
            else if (updated.type === "deposito") {
              const principal = Number(updated.amount);
              const rate = Number(updated.interest) / 100;
              let years = 1;
              
              if (updated.tenor === "12m") years = 1;
              else if (updated.tenor === "6m") years = 0.5;
              else if (updated.tenor === "3m") years = 0.25;
              else if (updated.tenor === "1m") years = 1/12;
              
              const interestValue = principal * rate * years;
              const maturityValue = principal + interestValue;
              
              return {
                ...base,
                bankName: updated.bankName,
                amount: principal,
                tenor: updated.tenor,
                interest: rate * 100,
                startDate: updated.startDate,
                endDate: updated.endDate,
                currentValue: maturityValue,
                priceStatus: 'static'
              };
            }

            return inv;
          }),
          lastUpdateError: null
        }));

        // Find updated investment and sync
        const updatedInvestment = get().investments.find(inv => inv.id === updated.id);
        if (updatedInvestment) {
          get().syncInvestmentToCloud(updatedInvestment, 'save');
        }

        // Schedule update for crypto/stock
        if (updated.type === "crypto" || updated.type === "stock") {
          const { updateTimeout } = get();
          if (updateTimeout) clearTimeout(updateTimeout);
          
          const timeoutId = setTimeout(() => {
            get().updatePrices();
          }, 500);
          
          set({ updateTimeout: timeoutId });
        }
      },

      /* =========================
         UPDATE PRICES BATCH
      ========================= */
      updatePrices: async () => {
        const state = get();
        const { investments, isUpdatingPrices } = state;
        
        if (isUpdatingPrices) {
          console.log('⚠️ Price update already in progress');
          return investments;
        }
        
        const needsUpdate = investments.filter(
          inv => (inv.type === 'crypto' || inv.type === 'stock') && inv.priceStatus !== 'static'
        );
        
        if (needsUpdate.length === 0) {
          console.log('✅ No investments need price updates');
          return investments;
        }
        
        console.log(`🔄 Updating prices for ${needsUpdate.length} investments`);
        
        try {
          set({ isUpdatingPrices: true, lastUpdateError: null });
          
          const priceService = await import('../services/priceService');
          
          if (!priceService || !priceService.updateAllInvestmentPrices) {
            throw new Error('Price service not available');
          }
          
          const updatedInvestments = await priceService.updateAllInvestmentPrices(investments);
          
          // Update state
          set({ 
            investments: updatedInvestments,
            isUpdatingPrices: false 
          });
          
          // Sync updated investments to cloud
          updatedInvestments
            .filter(inv => inv.priceStatus === 'updated')
            .forEach(inv => {
              get().syncInvestmentToCloud(inv, 'save');
            });
          
          const updatedCount = updatedInvestments.filter(
            inv => inv.priceStatus === 'updated'
          ).length;
          const failedCount = updatedInvestments.filter(
            inv => inv.priceStatus === 'failed'
          ).length;
          
          console.log(`✅ Price update complete: ${updatedCount} updated, ${failedCount} failed`);
          
          return updatedInvestments;
          
        } catch (error) {
          console.error('❌ Error updating prices:', error);
          
          const updatedInvestments = investments.map((inv) => {
            if ((inv.type === 'crypto' || inv.type === 'stock') && inv.priceStatus === 'pending') {
              return {
                ...inv,
                priceStatus: 'failed',
                lastUpdated: new Date().toISOString(),
                synced: false
              };
            }
            return inv;
          });
          
          set({
            investments: updatedInvestments,
            isUpdatingPrices: false,
            lastUpdateError: error.message || 'Unknown error'
          });
          
          return investments;
        }
      },

      /* =========================
         UPDATE SINGLE INVESTMENT PRICE
      ========================= */
      updateSinglePrice: (investmentId, newPrice) => {
        if (!newPrice) return;
        
        set((state) => ({
          investments: state.investments.map((inv) => {
            if (inv.id === investmentId && (inv.type === 'stock' || inv.type === 'crypto')) {
              const currentValue = newPrice * (inv.quantity || 1);
              const updatedInvestment = {
                ...inv,
                currentPrice: newPrice,
                currentValue: currentValue,
                lastUpdated: new Date().toISOString(),
                priceStatus: 'updated',
                synced: false
              };
              
              // Sync ke cloud
              setTimeout(() => {
                get().syncInvestmentToCloud(updatedInvestment, 'save');
              }, 0);
              
              return updatedInvestment;
            }
            return inv;
          }),
          lastUpdateError: null
        }));
      },

      /* =========================
         MANUAL REFRESH PRICE
      ========================= */
      refreshPrice: async (investmentId) => {
        const state = get();
        const { investments } = state;
        const investment = investments.find(inv => inv.id === investmentId);
        
        if (!investment || !(investment.type === 'crypto' || investment.type === 'stock')) {
          console.warn('Cannot refresh price for this investment type');
          return;
        }
        
        // Optimistic update: mark as pending
        set((state) => ({
          investments: state.investments.map((inv) => {
            if (inv.id === investmentId) {
              return {
                ...inv,
                priceStatus: 'pending',
                lastUpdated: new Date().toISOString(),
                synced: false
              };
            }
            return inv;
          })
        }));
        
        try {
          const priceService = await import('../services/priceService');
          
          if (!priceService) {
            throw new Error('Price service not available');
          }
          
          let newPrice = null;
          if (investment.type === 'crypto') {
            newPrice = await priceService.fetchCryptoPrice(investment.symbol);
          } else if (investment.type === 'stock') {
            newPrice = await priceService.fetchStockPrice(investment.symbol);
          }
          
          if (newPrice) {
            get().updateSinglePrice(investmentId, newPrice);
            console.log(`✅ Refreshed ${investment.symbol}: Rp ${newPrice.toLocaleString()}`);
          } else {
            console.warn(`❌ Failed to refresh ${investment.symbol}`);
            
            set((state) => ({
              investments: state.investments.map((inv) => {
                if (inv.id === investmentId) {
                  return {
                    ...inv,
                    priceStatus: 'failed',
                    lastUpdated: new Date().toISOString()
                  };
                }
                return inv;
              })
            }));
          }
        } catch (error) {
          console.error(`Refresh error for ${investment?.symbol}:`, error);
          
          set((state) => ({
            investments: state.investments.map((inv) => {
              if (inv.id === investmentId) {
                return {
                  ...inv,
                  priceStatus: 'failed',
                  lastUpdated: new Date().toISOString()
                };
              }
              return inv;
            }),
            lastUpdateError: error.message
          }));
        }
      },

      /* =========================
         REMOVE INVESTMENT DENGAN SYNC
      ========================= */
      removeInvestment: async (id) => {
        const investmentToDelete = get().investments.find(inv => inv.id === id);
        
        if (!investmentToDelete) return;
        
        const { updateTimeout } = get();
        if (updateTimeout) clearTimeout(updateTimeout);
        
        // Update local state
        set((state) => ({
          investments: state.investments.filter((inv) => inv.id !== id),
          updateTimeout: null
        }));
        
        // Sync delete ke cloud
        get().syncInvestmentToCloud(investmentToDelete, 'delete');
      },

      /* =========================
         CLEAR ALL
      ========================= */
      clearInvestments: () => {
        const { updateTimeout } = get();
        if (updateTimeout) clearTimeout(updateTimeout);
        
        set({ 
          investments: [],
          isUpdatingPrices: false,
          lastUpdateError: null,
          updateTimeout: null
        });
      },

      /* =========================
         GET SUMMARY
      ========================= */
      getSummary: () => {
        const { investments } = get();
        
        let totalCurrentValue = 0;
        let totalBuyValue = 0;
        let updatedCount = 0;
        let failedCount = 0;
        let pendingCount = 0;
        let syncedCount = 0;
        
        investments.forEach(inv => {
          const currentValue = inv.currentValue || 0;
          totalCurrentValue += currentValue;
          
          if (inv.type === 'stock' || inv.type === 'crypto') {
            totalBuyValue += (inv.buyPrice || 0) * (inv.quantity || 1);
            
            // Track price update status
            if (inv.priceStatus === 'updated') updatedCount++;
            else if (inv.priceStatus === 'failed') failedCount++;
            else if (inv.priceStatus === 'pending') pendingCount++;
          } else {
            totalBuyValue += inv.amount || 0;
          }
          
          // Track sync status
          if (inv.synced) syncedCount++;
        });
        
        const totalPnL = totalCurrentValue - totalBuyValue;
        const totalPnLPercent = totalBuyValue > 0 ? (totalPnL / totalBuyValue) * 100 : 0;
        
        return {
          totalCurrentValue,
          totalBuyValue,
          totalPnL,
          totalPnLPercent,
          count: investments.length,
          priceStatus: {
            updated: updatedCount,
            failed: failedCount,
            pending: pendingCount,
            static: investments.length - (updatedCount + failedCount + pendingCount)
          },
          syncStatus: {
            synced: syncedCount,
            unsynced: investments.length - syncedCount,
            percentage: investments.length > 0 ? Math.round((syncedCount / investments.length) * 100) : 0
          }
        };
      },

      /* =========================
         GET BY CATEGORY
      ========================= */
      getByCategory: (category) => {
        const { investments } = get();
        return investments.filter(inv => inv.type === category);
      },

      /* =========================
         GET INVESTMENTS NEEDING UPDATE
      ========================= */
      getInvestmentsNeedingUpdate: () => {
        const { investments } = get();
        return investments.filter(
          inv => (inv.type === 'crypto' || inv.type === 'stock') && 
                (inv.priceStatus === 'pending' || inv.priceStatus === 'failed')
        );
      },

      /* =========================
         FORCE PRICE UPDATE
      ========================= */
      forceUpdatePrices: async () => {
        const state = get();
        const { isUpdatingPrices } = state;
        
        if (isUpdatingPrices) {
          console.log('⚠️ Update already in progress');
          return;
        }
        
        console.log('🔁 Forcing price update (ignoring cache)...');
        
        set((state) => ({
          investments: state.investments.map((inv) => {
            if (inv.type === 'crypto' || inv.type === 'stock') {
              return {
                ...inv,
                priceStatus: 'pending',
                synced: false
              };
            }
            return inv;
          }),
          lastUpdateError: null
        }));
        
        await delay(100);
        
        return get().updatePrices();
      },

      /* =========================
         GET UPDATE STATUS
      ========================= */
      getUpdateStatus: () => {
        const { isUpdatingPrices, lastUpdateError, isSyncing, lastSyncError } = get();
        return {
          priceUpdate: {
            isUpdating: isUpdatingPrices,
            error: lastUpdateError,
            timestamp: new Date().toISOString()
          },
          syncStatus: {
            isSyncing,
            error: lastSyncError
          }
        };
      },

      /* =========================
         RETRY FAILED UPDATES
      ========================= */
      retryFailedUpdates: () => {
        const { investments } = get();
        
        set((state) => ({
          investments: state.investments.map((inv) => {
            if ((inv.type === 'crypto' || inv.type === 'stock') && inv.priceStatus === 'failed') {
              return {
                ...inv,
                priceStatus: 'pending',
                synced: false
              };
            }
            return inv;
          }),
          lastUpdateError: null
        }));
        
        setTimeout(() => {
          get().updatePrices();
        }, 500);
      },

      /* =========================
         DIRECT PRICE TEST
      ========================= */
      testPriceService: async () => {
        console.log('🧪 Testing price service directly...');
        
        try {
          const priceService = await import('../services/priceService');
          
          const bcaPrice = await priceService.fetchStockPrice('BBCA');
          console.log('BBCA Price:', bcaPrice);
          
          const tlkmPrice = await priceService.fetchStockPrice('TLKM');
          console.log('TLKM Price:', tlkmPrice);
          
          const unvrPrice = await priceService.fetchStockPrice('UNVR');
          console.log('UNVR Price:', unvrPrice);
          
          return { bcaPrice, tlkmPrice, unvrPrice };
        } catch (error) {
          console.error('❌ Price service test failed:', error);
          return null;
        }
      },

      /* =========================
         NEW: SYNC UTILITY METHODS
      ========================= */

      // Manual sync untuk investment tertentu
      syncInvestment: async (investmentId) => {
        const investment = get().investments.find(inv => inv.id === investmentId);
        if (!investment) return { success: false, error: 'Investment not found' };
        
        const result = await get().syncInvestmentToCloud(investment, 'save');
        
        if (result.success) {
          set((state) => ({
            investments: state.investments.map((inv) =>
              inv.id === investmentId 
                ? { ...inv, synced: true, synced_at: new Date().toISOString() }
                : inv
            )
          }));
        }
        
        return result;
      },

      // Sync semua investments ke cloud
      syncAllInvestments: async () => {
        const { investments } = get();
        const results = [];
        
        set({ isSyncing: true, lastSyncError: null });
        
        for (const investment of investments) {
          if (!investment.synced) {
            const result = await get().syncInvestmentToCloud(investment, 'save');
            if (result.success) {
              results.push({ investmentId: investment.id, success: true });
              
              // Update sync status
              set((state) => ({
                investments: state.investments.map((inv) =>
                  inv.id === investment.id 
                    ? { ...inv, synced: true, synced_at: new Date().toISOString() }
                    : inv
                )
              }));
            } else {
              results.push({ investmentId: investment.id, success: false, error: result.error });
            }
          } else {
            results.push({ investmentId: investment.id, success: true, message: 'Already synced' });
          }
        }
        
        set({ isSyncing: false });
        return results;
      },

      // Get sync status untuk investments
      getSyncStatus: () => {
        const { investments } = get();
        const total = investments.length;
        const synced = investments.filter(inv => inv.synced).length;
        const unsynced = total - synced;
        
        return {
          total,
          synced,
          unsynced,
          percentage: total > 0 ? Math.round((synced / total) * 100) : 0
        };
      },

      // Retry failed syncs
      retryFailedSyncs: async () => {
        const { investments } = get();
        const unsyncedInvestments = investments.filter(inv => !inv.synced);
        const results = [];
        
        set({ isSyncing: true });
        
        for (const investment of unsyncedInvestments) {
          const result = await get().syncInvestmentToCloud(investment, 'save');
          if (result.success) {
            set((state) => ({
              investments: state.investments.map((inv) =>
                inv.id === investment.id 
                  ? { ...inv, synced: true, synced_at: new Date().toISOString() }
                  : inv
              )
            }));
            results.push({ investmentId: investment.id, success: true });
          } else {
            results.push({ investmentId: investment.id, success: false, error: result.error });
          }
        }
        
        set({ isSyncing: false });
        return results;
      },

      // Refresh investments dari cloud
      refreshInvestments: async () => {
        return await get().loadInvestmentsFromCloud();
      },

      // Initialize investments dari cloud
      initializeFromCloud: async () => {
        console.log('🔄 Initializing investments from cloud...');
        return await get().loadInvestmentsFromCloud();
      }
    }),
    {
      name: "investment-storage",
      version: 3, // Increment version untuk sync changes
      partialize: (state) => ({
        investments: state.investments,
      })
    }
  )
);

/**
 * Helper function untuk format currency
 */
export function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Helper untuk get investment by ID
 */
export function getInvestmentById(id) {
  const store = useInvestmentStore.getState();
  return store.investments.find(inv => inv.id === id);
}

// =================== ADDITIONAL EXPORTS ===================

// Export individual sync functions
export const syncInvestmentToCloud = async (investment) => {
  const store = useInvestmentStore.getState();
  return store.syncInvestmentToCloud(investment, 'save');
};

export const syncAllInvestments = async () => {
  const store = useInvestmentStore.getState();
  return store.syncAllInvestments();
};

export const getInvestmentsSyncStatus = () => {
  const store = useInvestmentStore.getState();
  return store.getSyncStatus();
};

export const refreshInvestmentsFromCloud = async () => {
  const store = useInvestmentStore.getState();
  return store.refreshInvestments();
};

export const initializeInvestmentsFromCloud = async () => {
  const store = useInvestmentStore.getState();
  return store.initializeFromCloud();
};