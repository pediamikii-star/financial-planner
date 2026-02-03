// stores/dashboard.store.js

// IMPORT SESUAI FORMAT YANG ADA
import { accountStore } from './account.store.js';
import { creatorStore } from './creator.store.js';
import { transactionStore } from './transaction.store.js';
import { getAssets, getAssetsSync } from './asset.store.js';

// Investment store (ini zustand, jadi import khusus)
import { useInvestmentStore } from './investment.store.js';

// Goal store (ini juga zustand)
import useGoalStore from './goal.store.js';

// =================== DASHBOARD STORE ===================
export const dashboardStore = {
  
  // 1. NET WORTH = SEMUA ASSET (ASYNC VERSION)
  async getNetWorth() {
    try {
      // Accounts - gunakan async version jika ada
      let accountsTotal = 0;
      if (accountStore.getTotalBalance) {
        accountsTotal = accountStore.getTotalBalance();
      }
      
      // Investments - dari zustand store
      const investmentState = useInvestmentStore.getState();
      const investmentSummary = investmentState.getSummary ? investmentState.getSummary() : { totalCurrentValue: 0 };
      const investmentsTotal = investmentSummary.totalCurrentValue || 0;
      
      // Assets - dari asset store dengan async version
      const assets = await getAssets();
      const assetsTotal = assets.reduce((sum, asset) => sum + (Number(asset.purchasePrice) || 0), 0);
      
      // Creator earnings
      const creatorTotal = creatorStore.getTotalBalance ? creatorStore.getTotalBalance() : 0;
      
      return accountsTotal + investmentsTotal + assetsTotal + creatorTotal;
    } catch (error) {
      console.warn('Error calculating net worth:', error);
      return this.getNetWorthSync(); // Fallback ke sync version
    }
  },
  
  // 1b. NET WORTH (SYNC VERSION - for backward compatibility)
  get netWorth() {
    // Accounts
    const accountsTotal = accountStore.getTotalBalance ? accountStore.getTotalBalance() : 0;
    
    // Investments
    const investmentState = useInvestmentStore.getState();
    const investmentSummary = investmentState.getSummary ? investmentState.getSummary() : { totalCurrentValue: 0 };
    const investmentsTotal = investmentSummary.totalCurrentValue || 0;
    
    // Assets - gunakan sync version
    const assets = getAssetsSync();
    const assetsTotal = assets.reduce((sum, asset) => sum + (Number(asset.purchasePrice) || 0), 0);
    
    // Creator earnings
    const creatorTotal = creatorStore.getTotalBalance ? creatorStore.getTotalBalance() : 0;
    
    return accountsTotal + investmentsTotal + assetsTotal + creatorTotal;
  },
  
  // 1c. NET WORTH SYNC (explicit sync version)
  getNetWorthSync() {
    return this.netWorth;
  },
  
  // 2. MONTHLY CHANGE
  get monthlyChange() {
    return "+12.5%";
  },
  
  // 3. SAVINGS RATE
  get monthlySavingsRate() {
    return "0.0%";
  },
  
  get targetSavingsRate() {
    return "30%";
  },
  
  // 4. FINANCIAL SUMMARY (ASYNC VERSION)
  async getIncome() {
    try {
      const transactions = transactionStore.getAll ? transactionStore.getAll() : [];
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      return transactions
        .filter(t => {
          const date = new Date(t.date || t.createdAt);
          return date.getMonth() === currentMonth && 
                 date.getFullYear() === currentYear &&
                 (t.type === 'income' || t.type === 'topup');
        })
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    } catch (error) {
      console.warn('Error calculating income:', error);
      return 0;
    }
  },
  
  async getExpense() {
    try {
      const transactions = transactionStore.getAll ? transactionStore.getAll() : [];
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      return transactions
        .filter(t => {
          const date = new Date(t.date || t.createdAt);
          return date.getMonth() === currentMonth && 
                 date.getFullYear() === currentYear &&
                 t.type === 'expense';
        })
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    } catch (error) {
      console.warn('Error calculating expense:', error);
      return 0;
    }
  },
  
  async getSavings() {
    const income = await this.getIncome();
    const expense = await this.getExpense();
    return income - expense;
  },
  
  async getSavingsPercentage() {
    const income = await this.getIncome();
    const savings = await this.getSavings();
    return income > 0 ? 
           ((savings / income) * 100).toFixed(1) + '%' : 
           '0.0%';
  },
  
  // 4b. FINANCIAL SUMMARY (SYNC VERSION - for backward compatibility)
  get income() {
    const transactions = transactionStore.getAll ? transactionStore.getAll() : [];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return transactions
      .filter(t => {
        const date = new Date(t.date || t.createdAt);
        return date.getMonth() === currentMonth && 
               date.getFullYear() === currentYear &&
               (t.type === 'income' || t.type === 'topup');
      })
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  },
  
  get expense() {
    const transactions = transactionStore.getAll ? transactionStore.getAll() : [];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return transactions
      .filter(t => {
        const date = new Date(t.date || t.createdAt);
        return date.getMonth() === currentMonth && 
               date.getFullYear() === currentYear &&
               t.type === 'expense';
      })
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  },
  
  get savings() {
    return this.income - this.expense;
  },
  
  get savingsPercentage() {
    return this.income > 0 ? 
           ((this.savings / this.income) * 100).toFixed(1) + '%' : 
           '0.0%';
  },
  
  // 5. ACCOUNTS SNAPSHOT (ASYNC VERSION)
  async getTopAccounts() {
    try {
      if (accountStore.getAllAsync) {
        const allAccounts = await accountStore.getAllAsync();
        return [...allAccounts]
          .sort((a, b) => (Number(b.balance) || 0) - (Number(a.balance) || 0))
          .slice(0, 3);
      } else if (accountStore.getAll) {
        const allAccounts = accountStore.getAll();
        return [...allAccounts]
          .sort((a, b) => (Number(b.balance) || 0) - (Number(a.balance) || 0))
          .slice(0, 3);
      }
      
      // Fallback data
      return [
        { name: "BNI", balance: 87790003, type: "bank" },
        { name: "SeaBank", balance: 50000000, type: "digital-bank" },
        { name: "Mandiri", balance: 35000000, type: "bank" }
      ];
    } catch (error) {
      console.warn('Error getting top accounts:', error);
      return this.topAccounts; // Fallback ke sync version
    }
  },
  
  // 5b. ACCOUNTS SNAPSHOT (SYNC VERSION)
  get topAccounts() {
    if (accountStore.getAll) {
      const allAccounts = accountStore.getAll();
      return [...allAccounts]
        .sort((a, b) => (Number(b.balance) || 0) - (Number(a.balance) || 0))
        .slice(0, 3);
    }
    
    // Fallback data
    return [
      { name: "BNI", balance: 87790003, type: "bank" },
      { name: "SeaBank", balance: 50000000, type: "digital-bank" },
      { name: "Mandiri", balance: 35000000, type: "bank" }
    ];
  },
  
  // 6. INVESTMENT SUMMARY
  get investmentSummary() {
    const investmentState = useInvestmentStore.getState();
    const summary = investmentState.getSummary ? investmentState.getSummary() : null;
    
    if (summary) {
      return {
        totalValue: summary.totalCurrentValue,
        count: investmentState.investments?.length || 0,
        message: `${investmentState.investments?.length || 0} investments registered`
      };
    }
    
    // Fallback
    return {
      totalValue: 0,
      count: 0,
      message: "No investments registered"
    };
  },
  
  // 7. PORTFOLIO BREAKDOWN
  get portfolioBreakdown() {
    const investmentState = useInvestmentStore.getState();
    const investments = investmentState.investments || [];
    
    const breakdown = {
      stock: 0,
      crypto: 0,
      reksadana: 0,
      bond: 0,
      deposito: 0
    };
    
    investments.forEach(inv => {
      const type = inv.type;
      if (breakdown[type] !== undefined) {
        breakdown[type] += Number(inv.currentValue) || 0;
      }
    });
    
    return breakdown;
  },
  
  // 8. RECENT TRANSACTIONS (ASYNC VERSION)
  async getRecentTransactions() {
    try {
      const transactions = transactionStore.getAll ? transactionStore.getAll() : [];
      
      // Sort by date descending dan ambil 5 terbaru
      return [...transactions]
        .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
        .slice(0, 5)
        .map(t => ({
          description: t.notes || `Transaction ${t.id}`,
          amount: Number(t.amount) || 0,
          type: t.type || 'expense',
          date: t.date || t.createdAt
        }));
    } catch (error) {
      console.warn('Error getting recent transactions:', error);
      return this.recentTransactions; // Fallback ke sync version
    }
  },
  
  // 8b. RECENT TRANSACTIONS (SYNC VERSION)
  get recentTransactions() {
    const transactions = transactionStore.getAll ? transactionStore.getAll() : [];
    
    // Sort by date descending dan ambil 5 terbaru
    return [...transactions]
      .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
      .slice(0, 5)
      .map(t => ({
        description: t.notes || `Transaction ${t.id}`,
        amount: Number(t.amount) || 0,
        type: t.type || 'expense',
        date: t.date || t.createdAt
      }));
  },
  
  // 9. MONTHLY GOAL (ASYNC VERSION)
  async getMonthlyGoal() {
    try {
      const goalState = useGoalStore.getState();
      const goals = goalState.goals || [];
      
      if (goals.length > 0) {
        // Ambil goal pertama sebagai contoh
        const goal = goals[0];
        const percentage = Number(goal.targetAmount) > 0 ? 
          (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100 : 0;
        
        return {
          target: Number(goal.targetAmount) || 0,
          current: Number(goal.currentAmount) || 0,
          percentage: percentage
        };
      }
      
      // Fallback
      return {
        target: 5000000,
        current: 3000000,
        percentage: 60
      };
    } catch (error) {
      console.warn('Error getting monthly goal:', error);
      return this.monthlyGoal; // Fallback ke sync version
    }
  },
  
  // 9b. MONTHLY GOAL (SYNC VERSION)
  get monthlyGoal() {
    const goalState = useGoalStore.getState();
    const goals = goalState.goals || [];
    
    if (goals.length > 0) {
      // Ambil goal pertama sebagai contoh
      const goal = goals[0];
      const percentage = Number(goal.targetAmount) > 0 ? 
        (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100 : 0;
      
      return {
        target: Number(goal.targetAmount) || 0,
        current: Number(goal.currentAmount) || 0,
        percentage: percentage
      };
    }
    
    // Fallback
    return {
      target: 5000000,
      current: 3000000,
      percentage: 60
    };
  },
  
  // 10. CREATOR STATS (ASYNC VERSION)
  async getCreatorStats() {
    try {
      const creators = creatorStore.getAll ? creatorStore.getAll() : [];
      const totalEarnings = creators.reduce((sum, c) => sum + (Number(c.totalIncome) || 0), 0);
      const currentBalance = creators.reduce((sum, c) => sum + (Number(c.balance) || 0), 0);
      
      return {
        earnings: currentBalance,
        totalEarnings: totalEarnings,
        followers: creators.length,
        growth: "+5.2%"
      };
    } catch (error) {
      console.warn('Error getting creator stats:', error);
      return this.creatorStats; // Fallback ke sync version
    }
  },
  
  // 10b. CREATOR STATS (SYNC VERSION)
  get creatorStats() {
    const creators = creatorStore.getAll ? creatorStore.getAll() : [];
    const totalEarnings = creators.reduce((sum, c) => sum + (Number(c.totalIncome) || 0), 0);
    const currentBalance = creators.reduce((sum, c) => sum + (Number(c.balance) || 0), 0);
    
    return {
      earnings: currentBalance,
      totalEarnings: totalEarnings,
      followers: creators.length,
      growth: "+5.2%"
    };
  },
  
  // =================== NEW: DASHBOARD SYNC UTILITIES ===================
  
  // Refresh semua data dari cloud
  async refreshAllData() {
    console.log('🔄 Refreshing all dashboard data from cloud...');
    
    const results = {
      accounts: { success: false },
      assets: { success: false },
      creators: { success: false }
    };
    
    try {
      // Refresh accounts jika ada method refresh
      if (accountStore.refreshFromSync) {
        await accountStore.refreshFromSync();
        results.accounts.success = true;
      }
      
      // Refresh assets
      if (typeof window !== 'undefined' && window.refreshAssetsFromCloud) {
        const assetResult = await window.refreshAssetsFromCloud();
        results.assets = assetResult;
      }
      
      // Refresh creators jika ada method refresh
      if (creatorStore.refreshFromSync) {
        await creatorStore.refreshFromSync();
        results.creators.success = true;
      }
      
      console.log('✅ Dashboard refresh complete:', results);
      return results;
      
    } catch (error) {
      console.error('❌ Dashboard refresh failed:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Get sync status untuk semua data sources
  async getDashboardSyncStatus() {
    const status = {
      accounts: { synced: 0, total: 0 },
      assets: { synced: 0, total: 0 },
      creators: { synced: 0, total: 0 },
      lastUpdated: new Date().toISOString()
    };
    
    try {
      // Accounts sync status
      if (accountStore.getSyncStatus) {
        const accountStatus = accountStore.getSyncStatus();
        status.accounts = accountStatus;
      }
      
      // Assets sync status
      if (typeof window !== 'undefined' && window.getAssetSyncStatus) {
        const assetStatus = await window.getAssetSyncStatus();
        status.assets = assetStatus;
      }
      
      // Creators sync status
      if (creatorStore.getSyncStatus) {
        const creatorStatus = creatorStore.getSyncStatus();
        status.creators = creatorStatus;
      }
      
    } catch (error) {
      console.warn('Error getting sync status:', error);
    }
    
    return status;
  },
  
  // Get comprehensive dashboard data (all in one)
  async getDashboardData() {
    try {
      const [
        netWorth,
        income,
        expense,
        savings,
        topAccounts,
        recentTransactions,
        monthlyGoal,
        creatorStats,
        syncStatus
      ] = await Promise.all([
        this.getNetWorth(),
        this.getIncome(),
        this.getExpense(),
        this.getSavings(),
        this.getTopAccounts(),
        this.getRecentTransactions(),
        this.getMonthlyGoal(),
        this.getCreatorStats(),
        this.getDashboardSyncStatus()
      ]);
      
      return {
        netWorth,
        financialSummary: {
          income,
          expense,
          savings,
          savingsPercentage: income > 0 ? ((savings / income) * 100).toFixed(1) + '%' : '0.0%',
          monthlyChange: this.monthlyChange,
          monthlySavingsRate: this.monthlySavingsRate,
          targetSavingsRate: this.targetSavingsRate
        },
        topAccounts,
        investmentSummary: this.investmentSummary,
        portfolioBreakdown: this.portfolioBreakdown,
        recentTransactions,
        monthlyGoal,
        creatorStats,
        syncStatus,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      // Return sync version as fallback
      return this.getDashboardDataSync();
    }
  },
  
  // Sync version of getDashboardData (for backward compatibility)
  getDashboardDataSync() {
    return {
      netWorth: this.netWorth,
      financialSummary: {
        income: this.income,
        expense: this.expense,
        savings: this.savings,
        savingsPercentage: this.savingsPercentage,
        monthlyChange: this.monthlyChange,
        monthlySavingsRate: this.monthlySavingsRate,
        targetSavingsRate: this.targetSavingsRate
      },
      topAccounts: this.topAccounts,
      investmentSummary: this.investmentSummary,
      portfolioBreakdown: this.portfolioBreakdown,
      recentTransactions: this.recentTransactions,
      monthlyGoal: this.monthlyGoal,
      creatorStats: this.creatorStats,
      lastUpdated: new Date().toISOString()
    };
  }
};

// Inisialisasi jika perlu
if (typeof window !== 'undefined') {
  // Inisialisasi store jika ada method init
  setTimeout(async () => {
    if (accountStore.init) await accountStore.init();
    if (creatorStore.init) await creatorStore.init();
    if (transactionStore.init) transactionStore.init();
    
    // Expose dashboard utilities to window for easy access
    window.dashboardStore = dashboardStore;
  }, 100);
}