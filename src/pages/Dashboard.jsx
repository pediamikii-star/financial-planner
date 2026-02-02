import { dashboardStore } from "../stores/dashboard.store.js";
import { transactionStore } from "../stores/transaction.store.js";

// Fungsi format
function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount || 0);
}

// Kategori mapping untuk icon
const CATEGORY_ICONS = {
  'food': '🍔',
  'transport': '🚗',
  'shopping': '🛍️',
  'entertainment': '🎬',
  'bills': '💡',
  'health': '🏥',
  'education': '📚',
  'income': '💰',
  'salary': '💼',
  'other': '📋'
};

// Warna kategori (konsisten dengan accounts page)
const CATEGORY_COLORS = {
  'food': 'bg-orange-500/10 text-orange-600',
  'transport': 'bg-blue-500/10 text-blue-600',
  'shopping': 'bg-purple-500/10 text-purple-600',
  'entertainment': 'bg-pink-500/10 text-pink-600',
  'bills': 'bg-cyan-500/10 text-cyan-600',
  'health': 'bg-red-500/10 text-red-600',
  'education': 'bg-green-500/10 text-green-600',
  'income': 'bg-emerald-500/10 text-emerald-600',
  'salary': 'bg-teal-500/10 text-teal-600',
  'other': 'bg-gray-500/10 text-gray-600'
};

// Data dummy untuk grafik (6 bulan terakhir)
const MONTHLY_DATA = [
  { month: 'Nov', income: 12500000, expense: 8900000 },
  { month: 'Dec', income: 14200000, expense: 10500000 },
  { month: 'Jan', income: 9800000, expense: 7200000 },
  { month: 'Feb', income: 15600000, expense: 11300000 },
  { month: 'Mar', income: 13800000, expense: 9600000 },
  { month: 'Apr', income: 17200000, expense: 12400000 },
];

export default function Dashboard() {
  const {
    netWorth,
    monthlyChange,
    monthlySavingsRate,
    targetSavingsRate,
    income,
    expense,
    savings,
    savingsPercentage,
    topAccounts,
    investmentSummary,
    portfolioBreakdown,
    recentTransactions,
    monthlyGoal,
    creatorStats
  } = dashboardStore;

  // Ambil data transaksi asli dengan kategori
  const transactions = transactionStore.getAll ? transactionStore.getAll() : [];
  const recentWithCategory = transactions
    .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
    .slice(0, 5)
    .map(tx => ({
      ...tx,
      category: tx.category || 'other'
    }));

  // Calculate averages
  const avgIncome = MONTHLY_DATA.reduce((sum, m) => sum + m.income, 0) / MONTHLY_DATA.length;
  const avgExpense = MONTHLY_DATA.reduce((sum, m) => sum + m.expense, 0) / MONTHLY_DATA.length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* HEADER SIMPLE SESUAI ACCOUNTS PAGE */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome back, <span className="font-semibold text-gray-800">Samsul</span>! Here's your financial overview.</p>
          </div>
          
          {/* DATE & TIME - SESUAI ACCOUNTS PAGE */}
          <div className="flex items-center gap-4">
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
              <p className="text-sm text-gray-500">Last updated</p>
              <p className="font-medium text-gray-800">
                {new Date().toLocaleTimeString('id-ID', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false 
                })}
              </p>
            </div>
            <div className="hidden md:block">
              <div className="flex items-center gap-2 text-gray-700">
                <span className="text-xl">🌤️</span>
                <div>
                  <p className="text-sm">30°C • Partly sunny</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TOP METRICS GRID - 4 KOLOM SEPERTI ACCOUNTS PAGE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* NET WORTH CARD */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-500 text-sm">Net Worth</p>
            <span className="text-lg">📈</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">{formatCurrency(netWorth)}</h3>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              monthlyChange.includes('+') ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`}>
              {monthlyChange.includes('+') ? '↗' : '↘'} {monthlyChange}
            </span>
            <span className="text-gray-500 text-sm">from last month</span>
          </div>
        </div>

        {/* TOTAL BALANCE CARD */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-500 text-sm">Total Balance</p>
            <span className="text-lg">💰</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">{formatCurrency(topAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0))}</h3>
          <p className="text-gray-500 text-sm">{topAccounts.length} accounts registered</p>
        </div>

        {/* MONTHLY INCOME */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-500 text-sm">Monthly Income</p>
            <span className="text-lg text-green-500">💹</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">{formatCurrency(income)}</h3>
          <div className="flex items-center gap-2">
            <span className="text-green-500 text-sm font-medium">This month</span>
          </div>
        </div>

        {/* MONTHLY SAVINGS */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-500 text-sm">Monthly Savings</p>
            <span className="text-lg text-blue-500">🏦</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">{formatCurrency(savings)}</h3>
          <div className={`flex items-center gap-2 ${savings < 0 ? 'text-red-500' : 'text-blue-500'}`}>
            <span className="text-sm font-medium">{savingsPercentage}</span>
            <span className="text-gray-500 text-sm">of income</span>
          </div>
        </div>
      </div>

      {/* FINANCIAL OVERVIEW - 2 KOLOM BESAR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* INCOME VS EXPENSE CHART */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Financial Trend</h3>
              <p className="text-gray-500 text-sm">Last 6 months performance</p>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Income</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-600">Expense</span>
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="h-64 flex items-end justify-between gap-3 pt-8">
            {MONTHLY_DATA.map((monthData, index) => {
              const maxValue = Math.max(...MONTHLY_DATA.map(m => Math.max(m.income, m.expense)));
              const incomeHeight = (monthData.income / maxValue) * 100;
              const expenseHeight = (monthData.expense / maxValue) * 100;
              
              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div className="flex items-end justify-center gap-1 w-full mb-2">
                    <div 
                      className="w-1/2 bg-blue-500 rounded-t-lg transition-all duration-300 hover:bg-blue-600"
                      style={{ height: `${incomeHeight}%` }}
                      title={`Income: ${formatCurrency(monthData.income)}`}
                    ></div>
                    <div 
                      className="w-1/2 bg-red-500 rounded-t-lg transition-all duration-300 hover:bg-red-600"
                      style={{ height: `${expenseHeight}%` }}
                      title={`Expense: ${formatCurrency(monthData.expense)}`}
                    ></div>
                  </div>
                  <span className="text-gray-500 text-sm font-medium mt-2">{monthData.month}</span>
                </div>
              );
            })}
          </div>

          {/* Averages */}
          <div className="mt-8 grid grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-500 text-sm">Avg. Monthly Income</p>
              <p className="font-bold text-gray-800 text-lg">{formatCurrency(avgIncome)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-500 text-sm">Avg. Monthly Expense</p>
              <p className="font-bold text-gray-800 text-lg">{formatCurrency(avgExpense)}</p>
            </div>
          </div>
        </div>

        {/* QUICK STATS SIDEBAR */}
        <div className="space-y-6">
          {/* SAVINGS RATE */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Savings Rate</h3>
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-700">Current</span>
                <span className="font-semibold text-blue-600">{monthlySavingsRate}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2.5 rounded-full transition-all duration-500" 
                  style={{ 
                    width: `${(parseFloat(monthlySavingsRate) / 30) * 100}%`,
                    maxWidth: '100%'
                  }}
                />
              </div>
              <p className="text-gray-500 text-xs mt-2">Target: {targetSavingsRate}</p>
            </div>
          </div>

          {/* EXPENSE BREAKDOWN */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Expense Breakdown</h3>
            <div className="space-y-4">
              {Object.entries(CATEGORY_COLORS).slice(0, 4).map(([category, colorClass]) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <span className="text-lg">{CATEGORY_ICONS[category]}</span>
                    </div>
                    <span className="text-gray-700 capitalize">{category}</span>
                  </div>
                  <span className="font-medium text-gray-800">
                    {formatCurrency(Math.floor(Math.random() * 3000000) + 500000)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION - 3 KOLOM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ACCOUNTS OVERVIEW */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Accounts Overview</h3>
              <p className="text-gray-500 text-sm">Top accounts by balance</p>
            </div>
            <span className="text-blue-600 text-sm font-medium">{topAccounts.length} accounts</span>
          </div>
          
          <div className="space-y-4">
            {topAccounts.slice(0, 3).map((account, index) => (
              <div key={index} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${getAccountColor(account.type)}`}>
                    <span className="text-xl">{getAccountIcon(account.type)}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{account.name}</h4>
                    <p className="text-gray-500 text-sm">{account.accountNumber ? `•••• ${account.accountNumber.slice(-4)}` : 'Bank Account'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-800">{formatCurrency(account.balance)}</p>
                  <p className="text-gray-500 text-xs capitalize">{account.type}</p>
                </div>
              </div>
            ))}
            
            {topAccounts.length > 3 && (
              <div className="pt-4 border-t border-gray-200">
                <button className="w-full py-2 text-center text-blue-600 hover:text-blue-700 font-medium text-sm">
                  View all accounts →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RECENT TRANSACTIONS */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Recent Transactions</h3>
              <p className="text-gray-500 text-sm">Latest financial activities</p>
            </div>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              See all
            </button>
          </div>
          
          <div className="space-y-4">
            {recentWithCategory.map((tx, index) => (
              <div key={index} className="flex items-center justify-between p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${CATEGORY_COLORS[tx.category] || CATEGORY_COLORS.other}`}>
                    <span className="text-lg">{CATEGORY_ICONS[tx.category] || CATEGORY_ICONS.other}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-800 truncate max-w-[180px]">
                        {tx.notes || tx.description || `Transaction ${tx.id}`}
                      </h4>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">
                        {tx.category}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs">
                      {new Date(tx.date || tx.createdAt).toLocaleDateString('id-ID', { 
                        day: 'numeric', 
                        month: 'short'
                      })}
                    </p>
                  </div>
                </div>
                <span className={`font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
            
            {recentWithCategory.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No transactions yet</p>
                <button className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Add your first transaction
                </button>
              </div>
            )}
          </div>
        </div>

        {/* GOALS & INVESTMENTS */}
        <div className="space-y-6">
          {/* MONTHLY GOAL */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Monthly Goal</h3>
              <span className="text-blue-600 text-sm font-medium">
                {monthlyGoal.percentage?.toFixed(1) || 0}%
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-4">Target savings for this month</p>
            
            <div className="mb-6">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(monthlyGoal.percentage || 0, 100)}%` }}
                />
              </div>
            </div>
            
            <div className="flex justify-between text-sm">
              <div>
                <p className="text-gray-500">Saved</p>
                <p className="font-bold text-gray-800">{formatCurrency(monthlyGoal.current)}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-500">Target</p>
                <p className="font-bold text-gray-800">{formatCurrency(monthlyGoal.target)}</p>
              </div>
            </div>
          </div>

          {/* INVESTMENT SUMMARY */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-bold mb-2">Investment Portfolio</h3>
            <p className="text-blue-100 text-sm mb-4">{investmentSummary.message}</p>
            
            <h2 className="text-2xl font-bold mb-6">{formatCurrency(investmentSummary.totalValue)}</h2>
            
            <div className="space-y-3">
              {Object.entries(portfolioBreakdown)
                .filter(([_, value]) => value > 0)
                .slice(0, 3)
                .map(([category, value]) => (
                  <div key={category} className="flex justify-between items-center">
                    <span className="text-blue-100 capitalize">{category}</span>
                    <span className="font-semibold">{formatCurrency(value)}</span>
                  </div>
                ))}
            </div>
            
            <button className="mt-6 w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">
              View Details
            </button>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS BAR */}
      <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <button className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors">
            <span className="text-2xl mb-2">➕</span>
            <span className="text-sm font-medium text-gray-700">Add Transaction</span>
          </button>
          <button className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors">
            <span className="text-2xl mb-2">🔄</span>
            <span className="text-sm font-medium text-gray-700">Transfer</span>
          </button>
          <button className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors">
            <span className="text-2xl mb-2">🎯</span>
            <span className="text-sm font-medium text-gray-700">Set Goal</span>
          </button>
          <button className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors">
            <span className="text-2xl mb-2">📊</span>
            <span className="text-sm font-medium text-gray-700">Reports</span>
          </button>
          <button className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors">
            <span className="text-2xl mb-2">💰</span>
            <span className="text-sm font-medium text-gray-700">Budget</span>
          </button>
          <button className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors">
            <span className="text-2xl mb-2">📈</span>
            <span className="text-sm font-medium text-gray-700">Invest</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper functions untuk account
function getAccountColor(type) {
  switch(type) {
    case 'bank': return 'bg-blue-100 text-blue-600';
    case 'digital-bank': return 'bg-teal-100 text-teal-600';
    case 'e-wallet': return 'bg-purple-100 text-purple-600';
    case 'cash': return 'bg-yellow-100 text-yellow-600';
    default: return 'bg-gray-100 text-gray-600';
  }
}

function getAccountIcon(type) {
  switch(type) {
    case 'bank': return '🏦';
    case 'digital-bank': return '📱';
    case 'e-wallet': return '💳';
    case 'cash': return '💵';
    default: return '🏦';
  }
}