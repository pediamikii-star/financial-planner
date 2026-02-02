// stores/dashboard.store.js

// IMPORT SESUAI FORMAT YANG ADA
import { accountStore } from './account.store.js';
import { creatorStore } from './creator.store.js';
import { transactionStore } from './transaction.store.js';
import { getAssets } from './asset.store.js';

// Investment store (ini zustand, jadi import khusus)
import { useInvestmentStore } from './investment.store.js';

// Goal store (ini juga zustand)
import useGoalStore from './goal.store.js';

// =================== DASHBOARD STORE ===================
export const dashboardStore = {
  
  // 1. NET WORTH = SEMUA ASSET
  get netWorth() {
    // Accounts - PASTI ADA accountStore.getTotalBalance()
    const accountsTotal = accountStore.getTotalBalance ? accountStore.getTotalBalance() : 0;
    
    // Investments - dari zustand store
    const investmentState = useInvestmentStore.getState();
    const investmentSummary = investmentState.getSummary ? investmentState.getSummary() : { totalCurrentValue: 2950546139 };
    const investmentsTotal = investmentSummary.totalCurrentValue || 2950546139;
    
    // Assets - dari asset store (function getAssets)
    const assets = getAssets();
    const assetsTotal = assets.reduce((sum, asset) => sum + (asset.value || 0), 0);
    
    // Creator earnings
    const creatorTotal = creatorStore.getTotalBalance ? creatorStore.getTotalBalance() : 0;
    
    return accountsTotal + investmentsTotal + assetsTotal + creatorTotal;
  },
  
  // 2. MONTHLY CHANGE (hardcode dari screenshot)
  get monthlyChange() {
    return "+12.5%";
  },
  
  // 3. SAVINGS RATE (hardcode dari screenshot)
  get monthlySavingsRate() {
    return "0.0%";
  },
  
  get targetSavingsRate() {
    return "30%";
  },
  
  // 4. FINANCIAL SUMMARY
  get income() {
    // Ambil dari transaction store atau hitung manual
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
      .reduce((sum, t) => sum + (t.amount || 0), 0);
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
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  },
  
  get savings() {
    return this.income - this.expense;
  },
  
  get savingsPercentage() {
    return this.income > 0 ? 
           ((this.savings / this.income) * 100).toFixed(1) + '%' : 
           '0.0%';
  },
  
  // 5. ACCOUNTS SNAPSHOT (3 teratas)
  get topAccounts() {
    if (accountStore.getSummary) {
      const allAccounts = accountStore.getAll ? accountStore.getAll() : [];
      // Sort by balance descending dan ambil 3 teratas
      return [...allAccounts]
        .sort((a, b) => (b.balance || 0) - (a.balance || 0))
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
    
    // Fallback dari screenshot
    return {
      totalValue: 2950546139,
      count: 19,
      message: "19 investments registered"
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
        breakdown[type] += inv.currentValue || 0;
      }
    });
    
    return breakdown;
  },
  
  // 8. RECENT TRANSACTIONS
  get recentTransactions() {
    const transactions = transactionStore.getAll ? transactionStore.getAll() : [];
    
    // Sort by date descending dan ambil 5 terbaru
    return [...transactions]
      .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
      .slice(0, 5)
      .map(t => ({
        description: t.notes || `Transaction ${t.id}`,
        amount: t.amount || 0,
        type: t.type || 'expense',
        date: t.date || t.createdAt
      }));
  },
  
  // 9. MONTHLY GOAL
  get monthlyGoal() {
    const goalState = useGoalStore.getState();
    const goals = goalState.goals || [];
    
    if (goals.length > 0) {
      // Ambil goal pertama sebagai contoh
      const goal = goals[0];
      const percentage = goal.targetAmount > 0 ? 
        (goal.currentAmount / goal.targetAmount) * 100 : 0;
      
      return {
        target: goal.targetAmount || 5000000,
        current: goal.currentAmount || 3000000,
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
  
  // 10. CREATOR STATS
  get creatorStats() {
    const creators = creatorStore.getAll ? creatorStore.getAll() : [];
    const totalEarnings = creators.reduce((sum, c) => sum + (c.totalIncome || 0), 0);
    const currentBalance = creators.reduce((sum, c) => sum + (c.balance || 0), 0);
    
    return {
      earnings: currentBalance,
      totalEarnings: totalEarnings,
      followers: creators.length, // contoh aja
      growth: "+5.2%"
    };
  }
};

// Inisialisasi jika perlu
if (typeof window !== 'undefined') {
  // Inisialisasi store jika ada method init
  setTimeout(() => {
    if (accountStore.init) accountStore.init();
    if (creatorStore.init) creatorStore.init();
    if (transactionStore.init) transactionStore.init();
  }, 100);
}