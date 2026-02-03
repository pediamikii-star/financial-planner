import { create } from "zustand";
import { persist } from "zustand/middleware";

// Import sync functions dari store.js
import { 
  getGoals as getGoalsFromSync,
  saveGoal as saveGoalToSync,
  deleteGoal as deleteGoalFromSync,
  updateGoal as updateGoalInSync
} from '../services/storage.js';

const useGoalStore = create(
  persist(
    (set, get) => ({
      goals: [
        {
          id: 1,
          name: "Married",
          targetAmount: 100000000,
          currentAmount: 0,
          category: "wedding",
          accountId: "",
          accountName: "",
          accountDetail: "",
          deadline: "2024-12-31",
          priority: "high",
          notes: "",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          synced: false,
          synced_at: null
        },
        {
          id: 2,
          name: "Dana Darurat",
          targetAmount: 20000000,
          currentAmount: 7500000,
          category: "emergency",
          accountId: "",
          accountName: "BCA",
          accountDetail: "1234567890",
          deadline: "2024-06-30",
          priority: "high",
          notes: "Tabungan untuk keadaan darurat",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          synced: false,
          synced_at: null
        },
        {
          id: 3,
          name: "Liburan Jepang",
          targetAmount: 30000000,
          currentAmount: 12000000,
          category: "travel",
          accountId: "",
          accountName: "Mandiri",
          accountDetail: "0987654321",
          deadline: "2024-08-15",
          priority: "medium",
          notes: "Trip ke Tokyo & Kyoto",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          synced: false,
          synced_at: null
        },
        {
          id: 4,
          name: "Beli Laptop",
          targetAmount: 18000000,
          currentAmount: 5000000,
          category: "gadget",
          accountId: "",
          accountName: "Cash",
          accountDetail: "",
          deadline: "2024-09-30",
          priority: "medium",
          notes: "MacBook Pro untuk kerja",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          synced: false,
          synced_at: null
        }
      ],

      // Helper untuk normalize goal data
      normalizeGoalData: (goal) => {
        const normalizedGoal = {
          ...goal,
          // Pastikan account properties ada
          accountId: goal.accountId || "",
          accountName: goal.accountName || "",
          accountDetail: goal.accountDetail || "",
          // Sync metadata
          synced: goal.synced || false,
          synced_at: goal.synced_at || null,
          // Hapus property 'account' lama jika ada
          account: undefined
        };
        
        // Remove undefined properties
        Object.keys(normalizedGoal).forEach(key => {
          if (normalizedGoal[key] === undefined) {
            delete normalizedGoal[key];
          }
        });
        
        return normalizedGoal;
      },

      // Helper untuk sync goal ke cloud
      syncGoalToCloud: async (goal, operation = 'save') => {
        try {
          const normalizedGoal = get().normalizeGoalData(goal);
          
          if (operation === 'save') {
            await saveGoalToSync(normalizedGoal);
            return { success: true, goalId: goal.id };
          } else if (operation === 'delete') {
            await deleteGoalFromSync(goal.id);
            return { success: true, goalId: goal.id };
          } else if (operation === 'update') {
            await updateGoalInSync(normalizedGoal);
            return { success: true, goalId: goal.id };
          }
        } catch (error) {
          console.warn('⚠️ Goal sync to cloud failed:', error.message);
          return { success: false, error: error.message };
        }
      },

      // Load goals dari cloud
      loadGoalsFromCloud: async () => {
        try {
          const cloudGoals = await getGoalsFromSync();
          if (cloudGoals && cloudGoals.length > 0) {
            set({ goals: cloudGoals.map(goal => get().normalizeGoalData(goal)) });
            console.log('📥 Loaded goals from cloud:', cloudGoals.length);
            return { success: true, count: cloudGoals.length };
          }
          return { success: false, error: 'No goals in cloud' };
        } catch (error) {
          console.warn('⚠️ Failed to load goals from cloud:', error);
          return { success: false, error: error.message };
        }
      },

      // Add goal dengan sync
      addGoal: async (goal) => {
        const normalizedGoal = get().normalizeGoalData({
          ...goal,
          id: goal.id || crypto.randomUUID(),
          createdAt: goal.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          synced: false,
          synced_at: null
        });

        // Update local state
        set((state) => ({
          goals: [...state.goals, normalizedGoal]
        }));

        // Sync ke cloud (background)
        get().syncGoalToCloud(normalizedGoal, 'save');
        
        return normalizedGoal;
      },

      // Update goal dengan sync
      updateGoal: async (id, updates) => {
        const normalizedUpdates = get().normalizeGoalData({
          ...updates,
          updatedAt: new Date().toISOString(),
          synced: false
        });

        // Update local state
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id 
              ? { ...g, ...normalizedUpdates }
              : g
          )
        }));

        // Find updated goal
        const updatedGoal = get().goals.find(g => g.id === id);
        if (updatedGoal) {
          // Sync ke cloud (background)
          get().syncGoalToCloud(updatedGoal, 'update');
        }
      },

      // Delete goal dengan sync
      deleteGoal: async (id) => {
        const goalToDelete = get().goals.find(g => g.id === id);
        
        if (!goalToDelete) return;

        // Update local state
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id)
        }));

        // Sync delete ke cloud (background)
        get().syncGoalToCloud(goalToDelete, 'delete');
      },

      // Add contribution dengan sync
      addContribution: async (id, amount) => {
        set((state) => {
          const updatedGoals = state.goals.map((g) => {
            if (g.id === id) {
              const updatedGoal = {
                ...g,
                currentAmount: g.currentAmount + amount,
                updatedAt: new Date().toISOString(),
                synced: false
              };
              
              // Sync ke cloud (background)
              setTimeout(() => {
                get().syncGoalToCloud(updatedGoal, 'update');
              }, 0);
              
              return updatedGoal;
            }
            return g;
          });
          
          return { goals: updatedGoals };
        });
      },
      
      // Update goal amount dengan sync
      updateGoalAmount: async (id, newAmount) => {
        set((state) => {
          const updatedGoals = state.goals.map((g) => {
            if (g.id === id) {
              const updatedGoal = {
                ...g,
                currentAmount: newAmount,
                updatedAt: new Date().toISOString(),
                synced: false
              };
              
              // Sync ke cloud (background)
              setTimeout(() => {
                get().syncGoalToCloud(updatedGoal, 'update');
              }, 0);
              
              return updatedGoal;
            }
            return g;
          });
          
          return { goals: updatedGoals };
        });
      },

      // =================== NEW: SYNC UTILITY METHODS ===================

      // Manual sync untuk goal tertentu
      syncGoal: async (goalId) => {
        const goal = get().goals.find(g => g.id === goalId);
        if (!goal) return { success: false, error: 'Goal not found' };
        
        const result = await get().syncGoalToCloud(goal, 'save');
        
        if (result.success) {
          // Update sync status
          set((state) => ({
            goals: state.goals.map((g) =>
              g.id === goalId 
                ? { ...g, synced: true, synced_at: new Date().toISOString() }
                : g
            )
          }));
        }
        
        return result;
      },

      // Sync semua goals ke cloud
      syncAllGoals: async () => {
        const { goals } = get();
        const results = [];
        
        for (const goal of goals) {
          if (!goal.synced) {
            const result = await get().syncGoalToCloud(goal, 'save');
            if (result.success) {
              results.push({ goalId: goal.id, success: true });
              
              // Update sync status
              set((state) => ({
                goals: state.goals.map((g) =>
                  g.id === goal.id 
                    ? { ...g, synced: true, synced_at: new Date().toISOString() }
                    : g
                )
              }));
            } else {
              results.push({ goalId: goal.id, success: false, error: result.error });
            }
          } else {
            results.push({ goalId: goal.id, success: true, message: 'Already synced' });
          }
        }
        
        return results;
      },

      // Get sync status
      getSyncStatus: () => {
        const { goals } = get();
        const total = goals.length;
        const synced = goals.filter(g => g.synced).length;
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
        const { goals } = get();
        const unsyncedGoals = goals.filter(g => !g.synced);
        const results = [];
        
        for (const goal of unsyncedGoals) {
          const result = await get().syncGoalToCloud(goal, 'save');
          if (result.success) {
            // Update sync status
            set((state) => ({
              goals: state.goals.map((g) =>
                g.id === goal.id 
                  ? { ...g, synced: true, synced_at: new Date().toISOString() }
                  : g
              )
            }));
            results.push({ goalId: goal.id, success: true });
          } else {
            results.push({ goalId: goal.id, success: false, error: result.error });
          }
        }
        
        return results;
      },

      // Refresh goals dari cloud
      refreshGoals: async () => {
        return await get().loadGoalsFromCloud();
      },

      // Clear semua goals
      clearGoals: async () => {
        // Hapus dari local state
        set({ goals: [] });
        
        // TODO: Hapus dari cloud? (optional)
        console.log('⚠️ Goals cleared locally');
      }
    }),
    {
      name: "goals-storage",
    }
  )
);

// =================== ADDITIONAL EXPORTS ===================

// Export individual sync functions untuk komponen yang perlu
export const syncGoalToCloud = async (goal) => {
  const store = useGoalStore.getState();
  return store.syncGoalToCloud(goal, 'save');
};

export const syncAllGoals = async () => {
  const store = useGoalStore.getState();
  return store.syncAllGoals();
};

export const getGoalsSyncStatus = () => {
  const store = useGoalStore.getState();
  return store.getSyncStatus();
};

export const refreshGoalsFromCloud = async () => {
  const store = useGoalStore.getState();
  return store.refreshGoals();
};

export default useGoalStore;