import { create } from "zustand";
import { persist } from "zustand/middleware";

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
          // UPDATE: ganti 'account' dengan 'accountId' + 'accountName'
          accountId: "",
          accountName: "",
          accountDetail: "",
          deadline: "2024-12-31",
          priority: "high",
          notes: "",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01"
        },
        {
          id: 2,
          name: "Dana Darurat",
          targetAmount: 20000000,
          currentAmount: 7500000,
          category: "emergency",
          // UPDATE: ganti 'account' dengan 'accountId' + 'accountName'
          accountId: "",
          accountName: "BCA",
          accountDetail: "1234567890",
          deadline: "2024-06-30",
          priority: "high",
          notes: "Tabungan untuk keadaan darurat",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01"
        },
        {
          id: 3,
          name: "Liburan Jepang",
          targetAmount: 30000000,
          currentAmount: 12000000,
          category: "travel",
          // UPDATE: ganti 'account' dengan 'accountId' + 'accountName'
          accountId: "",
          accountName: "Mandiri",
          accountDetail: "0987654321",
          deadline: "2024-08-15",
          priority: "medium",
          notes: "Trip ke Tokyo & Kyoto",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01"
        },
        {
          id: 4,
          name: "Beli Laptop",
          targetAmount: 18000000,
          currentAmount: 5000000,
          category: "gadget",
          // UPDATE: ganti 'account' dengan 'accountId' + 'accountName'
          accountId: "",
          accountName: "Cash",
          accountDetail: "",
          deadline: "2024-09-30",
          priority: "medium",
          notes: "MacBook Pro untuk kerja",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01"
        }
      ],

      addGoal: (goal) => {
        // NORMALIZE DATA: pastikan structure konsisten
        const normalizedGoal = {
          ...goal,
          // Pastikan account properties ada
          accountId: goal.accountId || "",
          accountName: goal.accountName || "",
          accountDetail: goal.accountDetail || "",
          // Hapus property 'account' lama jika ada
          account: undefined
        };
        
        // Remove undefined properties
        Object.keys(normalizedGoal).forEach(key => {
          if (normalizedGoal[key] === undefined) {
            delete normalizedGoal[key];
          }
        });
        
        set((state) => ({
          goals: [...state.goals, normalizedGoal]
        }));
      },

      updateGoal: (id, updates) => {
        // NORMALIZE DATA: pastikan structure konsisten
        const normalizedUpdates = {
          ...updates,
          // Pastikan account properties ada
          accountId: updates.accountId || "",
          accountName: updates.accountName || "",
          accountDetail: updates.accountDetail || "",
          // Hapus property 'account' lama jika ada
          account: undefined
        };
        
        // Remove undefined properties
        Object.keys(normalizedUpdates).forEach(key => {
          if (normalizedUpdates[key] === undefined) {
            delete normalizedUpdates[key];
          }
        });
        
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id 
              ? { 
                  ...g, 
                  ...normalizedUpdates, 
                  updatedAt: new Date().toISOString() 
                }
              : g
          )
        }));
      },

      deleteGoal: (id) =>
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id)
        })),

      // Tambah fungsi untuk add contribution
      addContribution: (id, amount) =>
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id 
              ? { 
                  ...g, 
                  currentAmount: g.currentAmount + amount,
                  updatedAt: new Date().toISOString()
                }
              : g
          )
        })),
      
      // Fungsi untuk update goal amount
      updateGoalAmount: (id, newAmount) =>
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id 
              ? { 
                  ...g, 
                  currentAmount: newAmount,
                  updatedAt: new Date().toISOString()
                }
              : g
          )
        }))
    }),
    {
      name: "goals-storage",
    }
  )
);

export default useGoalStore;