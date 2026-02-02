import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Pencil, Trash2, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet, RefreshCw, ArrowUpRight, ArrowDownRight, Activity, Send } from "lucide-react";
import { transactionStore } from "../stores/transaction.store";
import AddTransactionModal from "../components/transactions/AddTransactionModal";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const INCOME_COLORS = [
  "#10b981",
  "#059669",
  "#3b82f6",
  "#2563eb",
  "#0ea5e9",
  "#14b8a6",
  "#34d399",
  "#60a5fa",
  "#22c55e",
];

const EXPENSE_COLORS = [
  "#ef4444",
  "#fb7185",
  "#f97316",
  "#eab308",
  "#dc2626",
  "#be123c",
  "#c2410c",
  "#a16207",
  "#7c2d12",
];

function MetricItem({ icon, label, value, trend, color = "blue" }) {
  const trendColor = trend?.startsWith('+') ? 'text-emerald-600' : trend?.startsWith('-') ? 'text-rose-600' : 'text-slate-600';
  const IconComponent = icon === 'income' ? ArrowUpRight : 
                       icon === 'expense' ? ArrowDownRight : 
                       icon === 'cashflow' ? Activity : 
                       Send;
  
  const colorMap = {
    blue: { bg: 'from-blue-500 to-cyan-400', text: 'text-blue-600' },
    emerald: { bg: 'from-emerald-500 to-green-400', text: 'text-emerald-600' },
    rose: { bg: 'from-rose-500 to-pink-400', text: 'text-rose-600' },
    amber: { bg: 'from-amber-500 to-yellow-400', text: 'text-amber-600' }
  };
  
  const colors = colorMap[color] || colorMap.blue;
  
  return (
    <div className="group relative p-4 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200/80 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300">
      <div className={`absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br ${colors.bg} rounded-full flex items-center justify-center shadow-lg z-10`}>
        <IconComponent size={14} className="text-white" />
      </div>
      
      <div className="flex flex-col">
        <span className="text-xs text-slate-500 font-medium mb-2">{label}</span>
        <div className="flex items-baseline justify-between">
          <span className="text-xl font-bold text-slate-900 truncate pr-2">{value}</span>
          {trend && (
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trendColor} ${
              trendColor === 'text-emerald-600' ? 'bg-emerald-50 border border-emerald-100' : 
              trendColor === 'text-rose-600' ? 'bg-rose-50 border border-rose-100' : 
              'bg-slate-100 border border-slate-200'
            } whitespace-nowrap`}>
              {trend}
            </span>
          )}
        </div>
      </div>
      
      {/* Decorative bottom border */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${colors.bg} rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity`}></div>
    </div>
  );
}

function TransactionPagination({ currentPage, totalPages, onPageChange }) {
  return (
    <div className="flex items-center justify-center gap-3 py-3 px-4 bg-white border-t border-slate-200">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
      >
        <ChevronLeft size={16} />
        Previous
      </button>
      
      <div className="flex items-center gap-2">
        <span className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-sm font-medium rounded-lg shadow-sm">
          Page {currentPage} of {totalPages}
        </span>
      </div>
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
      >
        Next
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [customMonth, setCustomMonth] = useState(new Date().getMonth());
  const [customYear, setCustomYear] = useState(new Date().getFullYear());
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);

  const [cashflowPage, setCashflowPage] = useState(1);
  const [movementsPage, setMovementsPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    const unsub = transactionStore.subscribe((data) => {
      setTransactions([...data]);
    });
    transactionStore.init();
    return unsub;
  }, []);

  const getFilteredTransactions = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let month = -1;
    let year = currentYear;

    switch (selectedPeriod) {
      case "all":
        month = -1;
        break;
      case "this-month":
        month = currentMonth;
        year = currentYear;
        break;
      case "last-month":
        month = currentMonth === 0 ? 11 : currentMonth - 1;
        year = currentMonth === 0 ? currentYear - 1 : currentYear;
        break;
      case "this-year":
        month = -1;
        year = currentYear;
        break;
      case "custom":
        month = customMonth;
        year = customYear;
        break;
      default:
        month = -1;
        year = currentYear;
    }

    return transactions
      .filter((t) => {
        if (!t.date) return false;
        const d = new Date(t.date);

        if (month === -1) {
          if (selectedPeriod === "all") return true;
          return d.getFullYear() === year;
        }

        return d.getMonth() === month && d.getFullYear() === year;
      })
      .sort((a, b) => {
        const da = new Date(a.date).getTime();
        const db = new Date(b.date).getTime();
        if (db !== da) return db - da;
        return (b.id || 0) - (a.id || 0);
      });
  }, [transactions, selectedPeriod, customMonth, customYear]);

  const filteredTransactions = getFilteredTransactions;

  const cashflow = filteredTransactions.filter(
    (t) => t.type === "income" || t.type === "expense"
  );

  const movements = filteredTransactions.filter(
    (t) => t.type === "transfer" || t.type === "topup"
  );

  const cashflowTotalPages = Math.max(1, Math.ceil(cashflow.length / itemsPerPage));
  const movementsTotalPages = Math.max(1, Math.ceil(movements.length / itemsPerPage));
  
  const paginatedCashflow = useMemo(() => {
    const startIndex = (cashflowPage - 1) * itemsPerPage;
    return cashflow.slice(startIndex, startIndex + itemsPerPage);
  }, [cashflow, cashflowPage]);

  const paginatedMovements = useMemo(() => {
    const startIndex = (movementsPage - 1) * itemsPerPage;
    return movements.slice(startIndex, startIndex + itemsPerPage);
  }, [movements, movementsPage]);

  const incomeTotal = cashflow
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount || 0), 0);

  const expenseTotal = cashflow
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount || 0), 0);

  const netCashflow = incomeTotal - expenseTotal;

  const movementTotal = movements.reduce(
    (s, t) => s + Number(t.amount || 0),
    0
  );

  function buildChart(type) {
    const map = {};
    cashflow
      .filter((t) => t.type === type && Number(t.amount || 0) > 0)
      .forEach((t) => {
        const key = t.category || t.categoryName || "Uncategorized";
        map[key] = (map[key] || 0) + Number(t.amount || 0);
      });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);
  }

  const incomeChart = buildChart("income");
  const expenseChart = buildChart("expense");

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case "all":
        return "All Time";
      case "this-month":
        return "This Month";
      case "last-month":
        return "Last Month";
      case "this-year":
        return "This Year";
      case "custom":
        const monthName = new Date(0, customMonth).toLocaleString("id-ID", { month: "long" });
        return `${monthName} ${customYear}`;
      default:
        return "Select Period";
    }
  };

  function formatDateTwoLines(d) {
    if (!d) return <div className="text-center">-</div>;
    const date = new Date(d);
    if (isNaN(date)) return <div className="text-center">-</div>;
    
    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = date.getFullYear();
    
    return (
      <div className="flex flex-col items-center justify-center text-center leading-tight">
        <div className="text-slate-600">{day} {month}</div>
        <div className="text-slate-600">{year}</div>
      </div>
    );
  }

  function amountStyle(type) {
    if (type === "income") return "text-emerald-600";
    if (type === "expense") return "text-rose-600";
    return "text-blue-600";
  }

  function handleDelete(id) {
    if (!confirm("Delete this transaction?")) return;
    transactionStore.remove(id);
  }

  function handleEdit(transaction) {
    setEditingTransaction(transaction);
    setShowModal(true);
  }

  function closeModal() {
    setEditingTransaction(null);
    setShowModal(false);
  }

  const handlePeriodSelect = (period) => {
    setSelectedPeriod(period);
    setIsPeriodDropdownOpen(false);
    setCashflowPage(1);
    setMovementsPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="z-30 pb-6">
        <div className="flex items-center justify-between mb-6 pt-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Transactions
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">
              Your transaction history
            </p>
          </div>

          <button
            onClick={() => {
              setEditingTransaction(null);
              setShowModal(true);
            }}
            className="group relative bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"></div>
            <span className="relative flex items-center gap-2">
              <span className="text-base">+</span> Add New Transaction
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-5">
  
          {/* CARD KIRI - TRANSACTION SUMMARY - DIPERBAIKI */}
          <div className="relative bg-gradient-to-br from-white via-white to-blue-50/50 rounded-2xl p-6 shadow-xl border border-slate-300/30 
            h-[480px] min-h-[480px] max-h-[480px] overflow-visible flex flex-col">
            
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-cyan-300/10 rounded-full -translate-y-8 translate-x-8"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-br from-blue-300/5 to-cyan-200/5 rounded-full -translate-x-6 translate-y-6"></div>
            
            <div className="relative z-10 flex-1 overflow-visible flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Wallet className="text-xl text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-slate-900">Transaction Summary</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{getPeriodLabel()}</p>
                </div>
                
                <div className="relative">
                  <button
                    onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
                    className="flex items-center gap-2 text-xs font-medium text-slate-700 hover:text-slate-900 px-3 py-2 border border-slate-300 hover:border-slate-400 rounded-lg transition-all bg-white hover:bg-slate-50 shadow-sm hover:shadow"
                  >
                    <span>{getPeriodLabel()}</span>
                    <ChevronDown size={14} className={`transition-transform ${isPeriodDropdownOpen ? "rotate-180" : ""} text-slate-500`} />
                  </button>

                  {isPeriodDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40"
                        onClick={() => setIsPeriodDropdownOpen(false)}
                      />
                      <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-2xl z-50">
                        <div className="py-2">
                          <button
                            onClick={() => handlePeriodSelect("all")}
                            className={`w-full text-left px-4 py-3 text-sm hover:bg-gradient-to-r hover:from-slate-50/80 hover:to-white transition-all ${
                              selectedPeriod === "all" 
                                ? "bg-gradient-to-r from-blue-50/80 to-blue-50/30 text-blue-600 font-medium border-l-4 border-blue-500" 
                                : "text-slate-700"
                            }`}
                          >
                            All Time
                          </button>
                          <button
                            onClick={() => handlePeriodSelect("this-month")}
                            className={`w-full text-left px-4 py-3 text-sm hover:bg-gradient-to-r hover:from-slate-50/80 hover:to-white transition-all ${
                              selectedPeriod === "this-month" 
                                ? "bg-gradient-to-r from-blue-50/80 to-blue-50/30 text-blue-600 font-medium border-l-4 border-blue-500" 
                                : "text-slate-700"
                            }`}
                          >
                            This Month
                          </button>
                          <button
                            onClick={() => handlePeriodSelect("last-month")}
                            className={`w-full text-left px-4 py-3 text-sm hover:bg-gradient-to-r hover:from-slate-50/80 hover:to-white transition-all ${
                              selectedPeriod === "last-month" 
                                ? "bg-gradient-to-r from-blue-50/80 to-blue-50/30 text-blue-600 font-medium border-l-4 border-blue-500" 
                                : "text-slate-700"
                            }`}
                          >
                            Last Month
                          </button>
                          <button
                            onClick={() => handlePeriodSelect("this-year")}
                            className={`w-full text-left px-4 py-3 text-sm hover:bg-gradient-to-r hover:from-slate-50/80 hover:to-white transition-all ${
                              selectedPeriod === "this-year" 
                                ? "bg-gradient-to-r from-blue-50/80 to-blue-50/30 text-blue-600 font-medium border-l-4 border-blue-500" 
                                : "text-slate-700"
                            }`}
                          >
                            This Year
                          </button>
                          
                          <div className="border-t border-slate-200 mt-2 pt-2">
                            <div className="px-4 py-2 text-xs text-slate-500 font-medium">Custom Period</div>
                            <div className="px-4 py-2">
                              <div className="grid grid-cols-2 gap-2 mb-3">
                                <select
                                  value={customMonth}
                                  onChange={(e) => setCustomMonth(+e.target.value)}
                                  className="bg-white px-3 py-2 text-sm border border-slate-300 rounded-lg hover:border-slate-400 transition-colors"
                                >
                                  {Array.from({ length: 12 }).map((_, i) => (
                                    <option key={i} value={i}>
                                      {new Date(0, i).toLocaleString("id-ID", { month: "long" })}
                                    </option>
                                  ))}
                                </select>
                                <select
                                  value={customYear}
                                  onChange={(e) => setCustomYear(+e.target.value)}
                                  className="bg-white px-3 py-2 text-sm border border-slate-300 rounded-lg hover:border-slate-400 transition-colors"
                                >
                                  {Array.from({ length: 5 }).map((_, i) => {
                                    const year = new Date().getFullYear() - 2 + i;
                                    return (
                                      <option key={year} value={year}>
                                        {year}
                                      </option>
                                    );
                                  })}
                                </select>
                              </div>
                              <button
                                onClick={() => handlePeriodSelect("custom")}
                                className={`w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                                  selectedPeriod === "custom" 
                                    ? "bg-gradient-to-r from-blue-500 to-cyan-400 text-white border border-blue-500" 
                                    : "bg-gradient-to-r from-slate-100 to-white text-slate-700 border border-slate-300 hover:border-slate-400 hover:shadow-sm"
                                }`}
                              >
                                Apply Custom Period
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Grid metrics - diperbaiki agar tidak kepotong */}
              <div className="grid grid-cols-2 gap-4 flex-1 overflow-visible">
                <MetricItem 
                  icon="income"
                  label="Income" 
                  value={`Rp ${incomeTotal.toLocaleString("id-ID")}`}
                  trend="+2.5%"
                  color="emerald"
                />
                <MetricItem 
                  icon="expense"
                  label="Expense" 
                  value={`Rp ${expenseTotal.toLocaleString("id-ID")}`}
                  trend="-1.2%"
                  color="rose"
                />
                <MetricItem 
                  icon="cashflow"
                  label="Net Cashflow" 
                  value={`Rp ${netCashflow.toLocaleString("id-ID")}`}
                  trend={netCashflow >= 0 ? "+15.3%" : "-8.7%"}
                  color={netCashflow >= 0 ? "emerald" : "rose"}
                />
                <MetricItem 
                  icon="transfer"
                  label="Transfer & Top Up" 
                  value={`Rp ${movementTotal.toLocaleString("id-ID")}`}
                  trend={`${movements.length} tx`}
                  color="amber"
                />
              </div>

              {/* Footer info - lebih compact */}
              <div className="mt-6 pt-5 border-t border-slate-200/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-slate-600 font-medium">Live updated</span>
                    </div>
                    <div className="w-px h-4 bg-slate-300"></div>
                    <div className="text-xs text-slate-500">
                      {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                      <span className="text-xs font-medium text-slate-700">{cashflow.filter(t => t.type === 'income').length} income</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                      <span className="text-xs font-medium text-slate-700">{cashflow.filter(t => t.type === 'expense').length} expense</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CARD KANAN - CATEGORY BREAKDOWN - LEBIH RAPAT */}
          <div className="relative bg-gradient-to-br from-white via-white to-emerald-50/30 rounded-2xl p-6 shadow-xl border border-slate-300/30 
            h-[480px] min-h-[480px] max-h-[480px] overflow-hidden">
            
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-300/10 to-teal-200/10 rounded-full translate-x-12 translate-y-12"></div>
            
            <div className="relative z-10 h-full flex flex-col">
              
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-xl text-white">📊</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Category Breakdown</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Income & expense distribution</p>
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                <div className="h-full bg-white/70 backdrop-blur-sm rounded-xl border border-slate-200/70">
                  <div className="grid grid-cols-3 gap-3 h-full p-3">
                    
                    {/* Income Chart - compact */}
                    <div className="flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50/70 to-white rounded-xl p-3 border border-emerald-100/70 shadow-sm">
                      <div className="h-20 w-20 mb-3">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={incomeChart}
                              dataKey="value"
                              innerRadius={18}
                              outerRadius={38}
                              paddingAngle={1}
                            >
                              {incomeChart.map((_, idx) => (
                                <Cell
                                  key={idx}
                                  fill={INCOME_COLORS[idx % INCOME_COLORS.length]}
                                  strokeWidth={0}
                                />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value) => [`Rp ${value.toLocaleString("id-ID")}`, "Amount"]}
                              contentStyle={{ 
                                background: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                fontSize: '11px'
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          <span className="text-xs font-bold text-emerald-600">Income</span>
                        </div>
                        <span className="text-sm font-bold text-slate-900">
                          Rp {incomeTotal.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>

                    {/* Expense Chart - compact */}
                    <div className="flex flex-col items-center justify-center bg-gradient-to-br from-rose-50/70 to-white rounded-xl p-3 border border-rose-100/70 shadow-sm">
                      <div className="h-20 w-20 mb-3">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={expenseChart}
                              dataKey="value"
                              innerRadius={18}
                              outerRadius={38}
                              paddingAngle={1}
                            >
                              {expenseChart.map((_, idx) => (
                                <Cell
                                  key={idx}
                                  fill={EXPENSE_COLORS[idx % EXPENSE_COLORS.length]}
                                  strokeWidth={0}
                                />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value) => [`Rp ${value.toLocaleString("id-ID")}`, "Amount"]}
                              contentStyle={{ 
                                background: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                fontSize: '11px'
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                          <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                          <span className="text-xs font-bold text-rose-600">Expense</span>
                        </div>
                        <span className="text-sm font-bold text-slate-900">
                          Rp {expenseTotal.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>

                    {/* Categories List - SUPER RAPAT */}
                    <div className="h-full bg-white/90 rounded-xl border border-slate-200 p-2 overflow-hidden">
                      <div className="h-full flex flex-col">
                        {/* Income Categories - EXTRA COMPACT */}
                        <div className="mb-2 flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-4 h-4 bg-gradient-to-br from-emerald-500 to-emerald-400 rounded-md flex items-center justify-center">
                              <TrendingUp size={8} className="text-white" />
                            </div>
                            <h3 className="text-xs font-bold text-slate-800">Income</h3>
                            <span className="text-[10px] text-slate-500 ml-auto">
                              {incomeChart.length} cats
                            </span>
                          </div>
                          <div className="space-y-1 h-[calc(100%-24px)] overflow-y-auto pr-1">
                            {incomeChart.length > 0 ? (
                              incomeChart.map((item, idx) => (
                                <div key={item.name} className="flex items-center justify-between text-[10px] py-1 px-1.5 hover:bg-emerald-50/50 rounded transition-colors">
                                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                    <span
                                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                      style={{ backgroundColor: INCOME_COLORS[idx % INCOME_COLORS.length] }}
                                    />
                                    <span className="text-slate-700 truncate text-[10px]">{item.name}</span>
                                  </div>
                                  <span className="ml-1 text-slate-900 font-bold whitespace-nowrap text-[10px]">
                                    Rp {item.value.toLocaleString("id-ID")}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-3 text-slate-400 text-[10px]">
                                No income data
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="my-1 border-t border-slate-200"></div>

                        {/* Expense Categories - EXTRA COMPACT */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-4 h-4 bg-gradient-to-br from-rose-500 to-pink-400 rounded-md flex items-center justify-center">
                              <TrendingDown size={8} className="text-white" />
                            </div>
                            <h3 className="text-xs font-bold text-slate-800">Expense</h3>
                            <span className="text-[10px] text-slate-500 ml-auto">
                              {expenseChart.length} cats
                            </span>
                          </div>
                          <div className="space-y-1 h-[calc(100%-24px)] overflow-y-auto pr-1">
                            {expenseChart.length > 0 ? (
                              expenseChart.map((item, idx) => (
                                <div key={item.name} className="flex items-center justify-between text-[10px] py-1 px-1.5 hover:bg-rose-50/50 rounded transition-colors">
                                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                    <span
                                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                      style={{ backgroundColor: EXPENSE_COLORS[idx % EXPENSE_COLORS.length] }}
                                    />
                                    <span className="text-slate-700 truncate text-[10px]">{item.name}</span>
                                  </div>
                                  <span className="ml-1 text-slate-900 font-bold whitespace-nowrap text-[10px]">
                                    Rp {item.value.toLocaleString("id-ID")}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-3 text-slate-400 text-[10px]">
                                No expense data
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABEL-TABEL TETAP ADA DI BAWAH */}
      <div className="pt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-cyan-400 rounded-full"></div>
              <h2 className="text-xl font-bold text-slate-800">Transaction History</h2>
            </div>
            <p className="text-slate-600 text-sm font-medium mt-1 ml-5">
              {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} • {getPeriodLabel()}
            </p>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-2xl mt-8 bg-gradient-to-b from-white to-slate-50/50">
            <div className="text-6xl mb-4 text-slate-300">📊</div>
            <h3 className="text-xl font-bold mb-3 text-slate-800">
              No Transactions Found
            </h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              {selectedPeriod === "all" 
                ? "Start your transaction history by adding your first transaction" 
                : `No transactions found for ${getPeriodLabel()}`
              }
            </p>
            <button
              onClick={() => {
                if (selectedPeriod === "all") {
                  setShowModal(true);
                } else {
                  setSelectedPeriod("all");
                }
              }}
              className="group bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 px-6 py-3 rounded-lg font-semibold text-white transition-all shadow-md hover:shadow-lg hover:scale-[1.02]"
            >
              {selectedPeriod === "all" ? "Create First Transaction" : "View All Transactions"}
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* INCOME & EXPENSE TABLE */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 font-bold text-slate-800 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex justify-between items-center">
                  <span>Income & Expense</span>
                  {cashflow.length > 0 && (
                    <span className="text-xs font-medium text-slate-500">
                      Showing {paginatedCashflow.length} of {cashflow.length}
                    </span>
                  )}
                </div>
                
                {/* HEADER */}
                <div className="grid grid-cols-[40px_90px_80px_80px_1fr_110px_50px] px-6 py-3 text-xs font-medium text-slate-600 border-b border-slate-200 bg-slate-50/50">
                  <div className="text-center flex items-center justify-center">Date</div>
                  <div className="text-center flex items-center justify-center">Type</div>
                  <div className="text-center flex items-center justify-center">Category</div>
                  <div className="text-center flex items-center justify-center">Account</div>
                  <div className="text-center flex items-center justify-center">Notes</div>
                  <div className="text-center flex items-center justify-center">Amount</div>
                  <div className="text-center flex items-center justify-center">Action</div>
                </div>

                <div className="min-h-[400px] max-h-[600px] overflow-y-auto">
                  {paginatedCashflow.length > 0 ? (
                    paginatedCashflow.map((t) => (
                      <div
                        key={t.id}
                        className="grid grid-cols-[40px_90px_80px_80px_1fr_130px_20px] px-6 py-3 text-sm border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                      >
                        {/* DATE */}
                        <div className="flex items-center justify-center">
                          {formatDateTwoLines(t.date)}
                        </div>
                        
                        {/* TYPE */}
                        <div className="flex items-center justify-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${t.type === 'income' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {t.type}
                          </span>
                        </div>
                        
                        {/* CATEGORY */}
                        <div className="text-slate-600 flex items-center justify-center text-center">
                          {t.category || t.categoryName || "-"}
                        </div>
                        
                        {/* ACCOUNT */}
                        <div className="text-slate-600 flex items-center justify-center text-center">
                          {t.accountName || "-"}
                        </div>
                        
                        {/* NOTES */}
                        <div className="text-slate-600 flex items-center justify-center text-left truncate pr-2" title={t.notes || "-"}>
                          {t.notes || "-"}
                        </div>
                        
                        {/* AMOUNT */}
                        <div className={`flex items-center justify-center font-normal ${amountStyle(t.type)}`}>
                          Rp {Number(t.amount).toLocaleString("id-ID")}
                        </div>
                        
                        {/* ACTION */}
                        <div className="flex flex-col gap-1 items-center justify-center">
                          <button 
                            onClick={() => handleEdit(t)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(t.id)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      No income/expense transactions
                    </div>
                  )}
                </div>

                {cashflow.length > itemsPerPage && (
                  <TransactionPagination
                    currentPage={cashflowPage}
                    totalPages={cashflowTotalPages}
                    onPageChange={setCashflowPage}
                  />
                )}
              </div>

              {/* TRANSFER & TOPUP TABLE */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 font-bold text-slate-800 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex justify-between items-center">
                  <span>Transfer & Top Up</span>
                  {movements.length > 0 && (
                    <span className="text-xs font-medium text-slate-500">
                      Showing {paginatedMovements.length} of {movements.length}
                    </span>
                  )}
                </div>
                
                {/* HEADER */}
                <div className="grid grid-cols-[40px_1fr_80px_100px_130px_70px] px-6 py-3 text-xs font-medium text-slate-600 border-b border-slate-200 bg-slate-50/50">
                  <div className="text-center flex items-center justify-center">Date</div>
                  <div className="text-center flex items-center justify-center">From → To</div>
                  <div className="text-center flex items-center justify-center">Type</div>
                  <div className="text-center flex items-center justify-center">Admin Fee</div>
                  <div className="text-center flex items-center justify-center">Amount</div>
                  <div className="text-center flex items-center justify-center">Action</div>
                </div>

                <div className="min-h-[400px] max-h-[600px] overflow-y-auto">
                  {paginatedMovements.length > 0 ? (
                    paginatedMovements.map((t) => (
                      <div
                        key={t.id}
                        className="grid grid-cols-[40px_1fr_80px_100px_130px_70px] px-6 py-3 text-sm border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                      >
                        {/* DATE */}
                        <div className="flex items-center justify-center">
                          {formatDateTwoLines(t.date)}
                        </div>
                        
                        {/* FROM → TO */}
                        <div className="text-slate-600 flex items-center justify-center text-center">
                          {t.fromAccountName} → {t.toAccountName}
                        </div>
                        
                        {/* TYPE */}
                        <div className="flex items-center justify-center">
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {t.type}
                          </span>
                        </div>
                        
                        {/* ADMIN FEE */}
                        <div className="text-slate-600 flex items-center justify-center">
                          Rp {Number(t.adminFee || 0).toLocaleString("id-ID")}
                        </div>
                        
                        {/* AMOUNT */}
                        <div className="flex items-center justify-end font-bold text-blue-600">
                          Rp {Number(t.amount).toLocaleString("id-ID")}
                        </div>
                        
                        {/* ACTION */}
                        <div className="flex flex-col gap-1 items-center justify-center">
                          <button 
                            onClick={() => handleEdit(t)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(t.id)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      No transfer/top up transactions
                    </div>
                  )}
                </div>

                {movements.length > itemsPerPage && (
                  <TransactionPagination
                    currentPage={movementsPage}
                    totalPages={movementsTotalPages}
                    onPageChange={setMovementsPage}
                  />
                )}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-300/50">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="px-3 py-1.5 bg-gradient-to-r from-slate-100 to-white rounded-lg">
                    <span className="font-bold text-slate-900">{filteredTransactions.length}</span>
                    <span className="text-slate-600 ml-1">
                      transaction{filteredTransactions.length !== 1 ? 's' : ''} total
                    </span>
                    <span className="ml-3 px-2 py-1 bg-gradient-to-r from-blue-100 to-blue-50 text-blue-600 font-semibold text-xs rounded-md">
                      {getPeriodLabel()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-gradient-to-br from-emerald-500 to-emerald-400 rounded-full shadow-sm"></div>
                    <span className="text-slate-700 text-sm font-medium">Income: {cashflow.filter(t => t.type === 'income').length}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-gradient-to-br from-rose-500 to-pink-400 rounded-full shadow-sm"></div>
                    <span className="text-slate-700 text-sm font-medium">Expense: {cashflow.filter(t => t.type === 'expense').length}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full shadow-sm"></div>
                    <span className="text-slate-700 text-sm font-medium">Movements: {movements.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {showModal && (
          <AddTransactionModal
            transaction={editingTransaction}
            onClose={closeModal}
          />
        )}
      </div>
    </div>
  );
}