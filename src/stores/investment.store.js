import { create } from "zustand";
import { persist } from "zustand/middleware";

// Helper untuk delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const useInvestmentStore = create(
  persist(
    (set, get) => ({
      investments: [],
      isUpdatingPrices: false,
      lastUpdateError: null,
      updateTimeout: null, // Untuk tracking timeout

      /* =========================
         ADD INVESTMENT
      ========================= */
      addInvestment: (investment) => {
        const base = {
          id: crypto.randomUUID(),
          type: investment.type,
          createdAt: Date.now(),
          lastUpdated: null,
          currentPrice: null,
          currentValue: null,
          priceStatus: 'pending'
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

        set((state) => ({
          investments: [...state.investments, newInvestment],
          lastUpdateError: null
        }));

        // Schedule price update for crypto/stock
        if (investment.type === "crypto" || investment.type === "stock") {
          const { updateTimeout } = get();
          if (updateTimeout) clearTimeout(updateTimeout);
          
          const timeoutId = setTimeout(() => {
            get().updatePrices();
          }, 1000);
          
          set({ updateTimeout: timeoutId });
        }
      },

      /* =========================
         UPDATE INVESTMENT
      ========================= */
      updateInvestment: (updated) => {
        set((state) => ({
          investments: state.investments.map((inv) => {
            if (inv.id !== updated.id) return inv;

            const base = {
              ...inv,
              type: updated.type,
              lastUpdated: new Date().toISOString()
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
         UPDATE PRICES BATCH (FIXED VERSION)
      ========================= */
      updatePrices: async () => {
        const state = get();
        const { investments, isUpdatingPrices } = state;
        
        // Prevent concurrent updates
        if (isUpdatingPrices) {
          console.log('⚠️ Price update already in progress');
          return investments;
        }
        
        // Filter only investments that need price updates
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
          
          // Import price service
          const priceService = await import('../services/priceService');
          
          if (!priceService || !priceService.updateAllInvestmentPrices) {
            throw new Error('Price service not available');
          }
          
          // Call the price service
          const updatedInvestments = await priceService.updateAllInvestmentPrices(investments);
          
          // Update state
          set({ 
            investments: updatedInvestments,
            isUpdatingPrices: false 
          });
          
          // Log results
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
          
          // Update status to failed for pending investments
          const updatedInvestments = investments.map((inv) => {
            if ((inv.type === 'crypto' || inv.type === 'stock') && inv.priceStatus === 'pending') {
              return {
                ...inv,
                priceStatus: 'failed',
                lastUpdated: new Date().toISOString()
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
              
              return {
                ...inv,
                currentPrice: newPrice,
                currentValue: currentValue,
                lastUpdated: new Date().toISOString(),
                priceStatus: 'updated'
              };
            }
            return inv;
          }),
          lastUpdateError: null
        }));
      },

      /* =========================
         MANUAL REFRESH PRICE (FIXED VERSION)
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
                lastUpdated: new Date().toISOString()
              };
            }
            return inv;
          })
        }));
        
        try {
          // Import price service
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
            // Use the existing updateSinglePrice method
            get().updateSinglePrice(investmentId, newPrice);
            console.log(`✅ Refreshed ${investment.symbol}: Rp ${newPrice.toLocaleString()}`);
          } else {
            console.warn(`❌ Failed to refresh ${investment.symbol}`);
            
            // Mark as failed
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
         REMOVE INVESTMENT
      ========================= */
      removeInvestment: (id) => {
        const { updateTimeout } = get();
        if (updateTimeout) clearTimeout(updateTimeout);
        
        set((state) => ({
          investments: state.investments.filter((inv) => inv.id !== id),
          updateTimeout: null
        }));
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
         FORCE PRICE UPDATE (FIXED VERSION)
      ========================= */
      forceUpdatePrices: async () => {
        const state = get();
        const { isUpdatingPrices } = state;
        
        if (isUpdatingPrices) {
          console.log('⚠️ Update already in progress');
          return;
        }
        
        console.log('🔁 Forcing price update (ignoring cache)...');
        
        // Mark all crypto/stocks as pending
        set((state) => ({
          investments: state.investments.map((inv) => {
            if (inv.type === 'crypto' || inv.type === 'stock') {
              return {
                ...inv,
                priceStatus: 'pending'
              };
            }
            return inv;
          }),
          lastUpdateError: null
        }));
        
        // Wait a bit for state to update
        await delay(100);
        
        // Trigger update
        return get().updatePrices();
      },

      /* =========================
         GET UPDATE STATUS
      ========================= */
      getUpdateStatus: () => {
        const { isUpdatingPrices, lastUpdateError } = get();
        return {
          isUpdating: isUpdatingPrices,
          error: lastUpdateError,
          timestamp: new Date().toISOString()
        };
      },

      /* =========================
         RETRY FAILED UPDATES
      ========================= */
      retryFailedUpdates: () => {
        const { investments } = get();
        
        // Mark failed as pending for retry
        set((state) => ({
          investments: state.investments.map((inv) => {
            if ((inv.type === 'crypto' || inv.type === 'stock') && inv.priceStatus === 'failed') {
              return {
                ...inv,
                priceStatus: 'pending'
              };
            }
            return inv;
          }),
          lastUpdateError: null
        }));
        
        // Trigger update after a short delay
        setTimeout(() => {
          get().updatePrices();
        }, 500);
      },

      /* =========================
         DIRECT PRICE TEST (NEW)
      ========================= */
      testPriceService: async () => {
        console.log('🧪 Testing price service directly...');
        
        try {
          const priceService = await import('../services/priceService');
          
          // Test BBCA
          const bcaPrice = await priceService.fetchStockPrice('BBCA');
          console.log('BBCA Price:', bcaPrice);
          
          // Test TLKM
          const tlkmPrice = await priceService.fetchStockPrice('TLKM');
          console.log('TLKM Price:', tlkmPrice);
          
          // Test UNVR
          const unvrPrice = await priceService.fetchStockPrice('UNVR');
          console.log('UNVR Price:', unvrPrice);
          
          return { bcaPrice, tlkmPrice, unvrPrice };
        } catch (error) {
          console.error('❌ Price service test failed:', error);
          return null;
        }
      }
    }),
    {
      name: "investment-storage",
      version: 2, // Increment version
      partialize: (state) => ({
        investments: state.investments,
        // Don't persist loading/error states
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