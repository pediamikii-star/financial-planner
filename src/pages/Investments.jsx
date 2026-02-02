import { useState, useEffect } from "react";
import { ChevronDown, Filter, SortAsc, RefreshCw, AlertCircle, CheckCircle, Clock } from "lucide-react";
import AddInvestmentModal from "../components/investments/AddInvestmentModal";
import InvestmentCard from "../components/investments/InvestmentCard";
import InvestmentChart from "../components/investments/InvestmentChart";
import { INVESTMENT_COLORS } from "../utils/investmentUtils";
import { useInvestmentStore } from "../stores/investment.store";

/* ======================
   HELPER
====================== */
function normalizeCategory(category = "") {
  const c = category.toLowerCase();
  if (c.includes("stock")) return "stock";
  if (c.includes("crypto")) return "crypto";
  if (c.includes("reksadana")) return "reksadana";
  if (c.includes("deposito")) return "deposito";
  return "other";
}

const LABELS = {
  stock: "Stock",
  crypto: "Crypto",
  reksadana: "Reksadana",
  deposito: "Deposito",
  other: "Other"
};

/* ======================
   SORT & FILTER COMPONENTS
====================== */
function SortDropdown({ sortBy, setSortBy, isOpen, setIsOpen }) {
  const sortOptions = [
    { id: "value-high", label: "Value: High to Low" },
    { id: "value-low", label: "Value: Low to High" },
    { id: "name-asc", label: "Name: A to Z" },
    { id: "name-desc", label: "Name: Z to A" },
    { id: "date-new", label: "Date: Newest First" },
    { id: "date-old", label: "Date: Oldest First" },
    { id: "profit-high", label: "Profit: High to Low" },
    { id: "profit-low", label: "Profit: Low to High" },
  ];

  const currentLabel = sortOptions.find(opt => opt.id === sortBy)?.label || "Sort by";

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs font-medium text-slate-700 hover:text-slate-900 px-4 py-2.5 border border-slate-300 hover:border-slate-400 rounded-xl transition-all bg-white hover:bg-slate-50 shadow-sm hover:shadow"
      >
        <SortAsc size={16} className="text-slate-500" />
        {currentLabel}
        <ChevronDown size={16} className={`transition-transform ${isOpen ? "rotate-180" : ""} text-slate-500`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden">
          {sortOptions.map(option => (
            <button
              key={option.id}
              onClick={() => {
                setSortBy(option.id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 text-sm hover:bg-gradient-to-r hover:from-slate-50/80 hover:to-white transition-all ${
                sortBy === option.id 
                  ? "bg-gradient-to-r from-blue-50/80 to-blue-50/30 text-blue-600 font-medium border-l-4 border-blue-500" 
                  : "text-slate-700"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterDropdown({ filterType, setFilterType, isOpen, setIsOpen, typeOptions }) {
  const allOptions = [
    { id: "all", label: "All Types" },
    ...typeOptions
  ];

  const currentLabel = allOptions.find(opt => opt.id === filterType)?.label || "Filter";

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs font-medium text-slate-700 hover:text-slate-900 px-4 py-2.5 border border-slate-300 hover:border-slate-400 rounded-xl transition-all bg-white hover:bg-slate-50 shadow-sm hover:shadow"
      >
        <Filter size={16} className="text-slate-500" />
        {currentLabel}
        <ChevronDown size={16} className={`transition-transform ${isOpen ? "rotate-180" : ""} text-slate-500`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-72 overflow-y-auto">
          {allOptions.map(option => (
            <button
              key={option.id}
              onClick={() => {
                setFilterType(option.id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 text-sm hover:bg-gradient-to-r hover:from-slate-50/80 hover:to-white transition-all ${
                filterType === option.id 
                  ? "bg-gradient-to-r from-emerald-50/80 to-emerald-50/30 text-emerald-600 font-medium border-l-4 border-emerald-500" 
                  : "text-slate-700"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ======================
   SECTION COMPONENT
====================== */
function Section({ title, data, onEdit }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-cyan-400 rounded-full"></div>
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {data.map(investment => (
          <InvestmentCard
            key={investment.id}
            investment={investment}
            onEdit={() => onEdit(investment)}
          />
        ))}
      </div>
    </div>
  );
}

/* ======================
   SUMMARY ITEM
====================== */
function SummaryItem({ label, value, color }) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/50 transition-all group">
      <div className={`w-4 h-4 rounded-full ${color} ring-2 ring-white ring-offset-2 shadow-sm`} />
      <span className="text-sm font-medium text-slate-700 flex-1">{label}</span>
      <span className="font-bold text-slate-900 text-sm bg-white/50 px-3 py-1.5 rounded-lg">
        Rp {typeof value === 'number' ? value.toLocaleString("id-ID") : '0'}
      </span>
    </div>
  );
}

/* ======================
   METRIC ITEM (ENHANCED)
====================== */
function MetricItem({ icon, label, value, trend, tooltip }) {
  const trendColor = trend?.startsWith('+') ? 'text-emerald-600' : trend?.startsWith('-') ? 'text-rose-600' : 'text-slate-600';
  
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-white/40 border border-white/60 backdrop-blur-sm group relative" title={tooltip}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
          <span className="text-sm">{icon}</span>
        </div>
        <div>
          <span className="text-xs text-slate-600 font-medium">{label}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-slate-800">{value}</span>
            {trend && (
              <span className={`text-xs font-medium ${trendColor}`}>{trend}</span>
            )}
          </div>
        </div>
      </div>
      {tooltip && (
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
          {tooltip}
        </div>
      )}
    </div>
  );
}

/* ======================
   PRICE STATUS BADGE
====================== */
function PriceStatusBadge({ status, count }) {
  const config = {
    updated: {
      icon: <CheckCircle size={12} />,
      text: 'Updated',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200'
    },
    failed: {
      icon: <AlertCircle size={12} />,
      text: 'Failed',
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200'
    },
    pending: {
      icon: <Clock size={12} />,
      text: 'Pending',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    }
  };

  const statusConfig = config[status] || config.pending;

  return (
    <div className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${statusConfig.borderColor} ${statusConfig.bgColor} ${statusConfig.color}`}>
      {statusConfig.icon}
      <span>{statusConfig.text}:</span>
      <span className="font-bold">{count}</span>
    </div>
  );
}

export default function Investments() {
  const investments = useInvestmentStore((state) => state.investments);
  const updatePrices = useInvestmentStore((state) => state.updatePrices);
  const forceUpdatePrices = useInvestmentStore((state) => state.forceUpdatePrices);
  const getSummary = useInvestmentStore((state) => state.getSummary);
  
  const [showModal, setShowModal] = useState(false);
  const [editInvestment, setEditInvestment] = useState(null);
  
  // State untuk Sort & Filter
  const [sortBy, setSortBy] = useState("value-high");
  const [filterType, setFilterType] = useState("all");
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  
  // State untuk auto refresh
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const [lastAutoUpdate, setLastAutoUpdate] = useState(null);

  /* ======================
     AUTO UPDATE PRICES ON LOAD
  ====================== */
  useEffect(() => {
    // Check if we need to update prices on load
    const needsUpdateOnLoad = () => {
      const cryptoStocks = investments.filter(
        inv => inv.type === 'crypto' || inv.type === 'stock'
      );
      
      if (cryptoStocks.length === 0) return false;
      
      // Check if any have pending or failed status
      const needsUpdate = cryptoStocks.some(
        inv => inv.priceStatus === 'pending' || inv.priceStatus === 'failed'
      );
      
      return needsUpdate;
    };
    
    if (needsUpdateOnLoad()) {
      console.log('🔄 Auto-updating prices on page load...');
      updatePrices().then(() => {
        setLastAutoUpdate(new Date());
      });
    }
    
    // Set up auto-refresh every hour
    const hourlyInterval = setInterval(() => {
      console.log('⏰ Hourly auto-refresh triggered');
      updatePrices().then(() => {
        setLastAutoUpdate(new Date());
      });
    }, 60 * 60 * 1000); // 1 hour
    
    return () => clearInterval(hourlyInterval);
  }, [investments.length]); // Run when number of investments changes

  /* ======================
     GROUPING
  ====================== */
  const stocks = investments.filter(
    (i) => normalizeCategory(i.type) === "stock"
  );
  const cryptos = investments.filter(
    (i) => normalizeCategory(i.type) === "crypto"
  );
  const reksadanas = investments.filter(
    (i) => normalizeCategory(i.type) === "reksadana"
  );
  const depositos = investments.filter(
    (i) => normalizeCategory(i.type) === "deposito"
  );
  const others = investments.filter(
    (i) => normalizeCategory(i.type) === "other"
  );

  /* ======================
     CALCULATE CURRENT VALUE
  ====================== */
  const calculateCurrentValue = (investment) => {
    if (investment.currentValue !== undefined && investment.currentValue !== null) {
      return Number(investment.currentValue);
    }
    return Number((investment.buyPrice || investment.amount || 0) * (investment.quantity || 1));
  };

  /* ======================
     CALCULATE INVESTMENT AMOUNT
  ====================== */
  const calculateInvestmentAmount = (investment) => {
    const buyPrice = Number(investment.buyPrice || investment.amount || 0);
    const quantity = Number(investment.quantity || 1);
    return buyPrice * quantity;
  };

  /* ======================
     CALCULATE PROFIT/LOSS
  ====================== */
  const calculateProfitLoss = (investment) => {
    const currentValue = calculateCurrentValue(investment);
    const investmentAmount = calculateInvestmentAmount(investment);
    return currentValue - investmentAmount;
  };

  /* ======================
     GET PERFORMANCE DATA
  ====================== */
  const getPerformanceData = () => {
    const cryptoStocks = investments.filter(
      inv => inv.type === 'crypto' || inv.type === 'stock'
    );
    
    if (cryptoStocks.length === 0) {
      return {
        bestPerformer: null,
        worstPerformer: null,
        avgReturn: 0
      };
    }
    
    // Calculate P/L percentage for each
    const withReturns = cryptoStocks.map(inv => {
      const currentValue = calculateCurrentValue(inv);
      const investmentAmount = calculateInvestmentAmount(inv);
      const returnPercent = investmentAmount > 0 
        ? ((currentValue - investmentAmount) / investmentAmount) * 100 
        : 0;
      
      return {
        ...inv,
        returnPercent,
        profitLoss: currentValue - investmentAmount
      };
    });
    
    // Sort by return percentage
    const sortedByReturn = [...withReturns].sort((a, b) => b.returnPercent - a.returnPercent);
    
    const best = sortedByReturn[0];
    const worst = sortedByReturn[sortedByReturn.length - 1];
    
    const avgReturn = withReturns.reduce((sum, inv) => sum + inv.returnPercent, 0) / withReturns.length;
    
    return {
      bestPerformer: best,
      worstPerformer: worst,
      avgReturn
    };
  };

  /* ======================
     GET PRICE STATUS COUNTS
  ====================== */
  const getPriceStatusCounts = () => {
    const cryptoStocks = investments.filter(
      inv => inv.type === 'crypto' || inv.type === 'stock'
    );
    
    const counts = {
      updated: 0,
      failed: 0,
      pending: 0,
      static: 0
    };
    
    cryptoStocks.forEach(inv => {
      const status = inv.priceStatus || 'pending';
      if (counts[status] !== undefined) {
        counts[status]++;
      }
    });
    
    return counts;
  };

  /* ======================
     HANDLE REFRESH ALL
  ====================== */
  const handleRefreshAll = async () => {
    try {
      setIsRefreshingAll(true);
      console.log('🔄 Refreshing all prices...');
      await updatePrices();
      setLastAutoUpdate(new Date());
    } catch (error) {
      console.error('Failed to refresh all prices:', error);
    } finally {
      setIsRefreshingAll(false);
    }
  };

  /* ======================
     HANDLE FORCE REFRESH
  ====================== */
  const handleForceRefresh = async () => {
    try {
      setIsRefreshingAll(true);
      console.log('🔁 Force refreshing all prices (ignoring cache)...');
      await forceUpdatePrices();
      setLastAutoUpdate(new Date());
    } catch (error) {
      console.error('Failed to force refresh prices:', error);
    } finally {
      setIsRefreshingAll(false);
    }
  };

  /* ======================
     SORTING FUNCTION
  ====================== */
  function sortInvestments(investmentList) {
    const sorted = [...investmentList];
    
    switch(sortBy) {
      case "value-high":
        return sorted.sort((a, b) => 
          calculateCurrentValue(b) - calculateCurrentValue(a)
        );
      case "value-low":
        return sorted.sort((a, b) => 
          calculateCurrentValue(a) - calculateCurrentValue(b)
        );
      case "name-asc":
        return sorted.sort((a, b) => {
          const nameA = String(a.name || a.symbol || "").toLowerCase();
          const nameB = String(b.name || b.symbol || "").toLowerCase();
          if (nameA < nameB) return -1;
          if (nameA > nameB) return 1;
          return 0;
        });
      case "name-desc":
        return sorted.sort((a, b) => {
          const nameA = String(a.name || a.symbol || "").toLowerCase();
          const nameB = String(b.name || b.symbol || "").toLowerCase();
          if (nameA > nameB) return -1;
          if (nameA < nameB) return 1;
          return 0;
        });
      case "date-new":
        return sorted.sort((a, b) => 
          new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0)
        );
      case "date-old":
        return sorted.sort((a, b) => 
          new Date(a.date || a.createdAt || 0) - new Date(b.date || b.createdAt || 0)
        );
      case "profit-high":
        return sorted.sort((a, b) => {
          const profitA = calculateProfitLoss(a);
          const profitB = calculateProfitLoss(b);
          return profitB - profitA;
        });
      case "profit-low":
        return sorted.sort((a, b) => {
          const profitA = calculateProfitLoss(a);
          const profitB = calculateProfitLoss(b);
          return profitA - profitB;
        });
      default:
        return sorted;
    }
  }

  /* ======================
     FILTERING FUNCTION
  ====================== */
  function filterInvestments(investmentList) {
    if (filterType === "all") return investmentList;
    
    switch(filterType) {
      case "stock":
        return stocks;
      case "crypto":
        return cryptos;
      case "reksadana":
        return reksadanas;
      case "deposito":
        return depositos;
      case "other":
        return others;
      default:
        return investmentList;
    }
  }

  /* ======================
     PROCESS DATA
  ====================== */
  const allInvestments = [...investments];
  const filteredInvestments = filterInvestments(allInvestments);
  const sortedInvestments = sortInvestments(filteredInvestments);
  
  const displayStocks = filterType === "all" || filterType === "stock" ? stocks : [];
  const displayCryptos = filterType === "all" || filterType === "crypto" ? cryptos : [];
  const displayReksadanas = filterType === "all" || filterType === "reksadana" ? reksadanas : [];
  const displayDepositos = filterType === "all" || filterType === "deposito" ? depositos : [];
  const displayOthers = filterType === "all" || filterType === "other" ? others : [];

  /* ======================
     SUMMARY DATA
  ====================== */
  const chartData = [
    {
      key: "stock",
      label: "Stock",
      value: stocks.reduce((s, i) => s + calculateCurrentValue(i), 0),
    },
    {
      key: "crypto",
      label: "Crypto",
      value: cryptos.reduce((s, i) => s + calculateCurrentValue(i), 0),
    },
    {
      key: "reksadana",
      label: "Reksadana",
      value: reksadanas.reduce((s, i) => s + calculateCurrentValue(i), 0),
    },
    {
      key: "deposito",
      label: "Deposito",
      value: depositos.reduce((s, i) => s + calculateCurrentValue(i), 0),
    },
  ].filter((i) => i.value > 0);

  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);
  
  // Hitung total modal investasi
  const totalInvestmentAmount = investments.reduce((sum, investment) => {
    return sum + calculateInvestmentAmount(investment);
  }, 0);
  
  // Hitung total P/L
  const totalPL = totalValue - totalInvestmentAmount;
  const totalPLPercentage = totalInvestmentAmount > 0 
    ? ((totalPL / totalInvestmentAmount) * 100).toFixed(2)
    : 0;

  // Get performance data
  const performance = getPerformanceData();
  const priceStatusCounts = getPriceStatusCounts();
  const storeSummary = getSummary();

  // Type options untuk filter dropdown
  const typeOptions = [
    { id: "stock", label: "Stock" },
    { id: "crypto", label: "Crypto" },
    { id: "reksadana", label: "Reksadana" },
    { id: "deposito", label: "Deposito" },
    { id: "other", label: "Other" },
  ];

  const onEdit = (investment) => {
    setEditInvestment(investment);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Close dropdown saat klik di luar */}
      {(sortOpen || filterOpen) && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => {
            setSortOpen(false);
            setFilterOpen(false);
          }}
        />
      )}

      {/* ===== HEADER SECTION ===== */}
      <div className="z-30 pb-6">
        {/* ===== HEADER TITLE & BUTTONS ===== */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Investments
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">
              Your investment portfolio
              {lastAutoUpdate && (
                <span className="text-xs text-slate-400 ml-2">
                  • Last auto-update: {lastAutoUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* REFRESH ALL BUTTON */}
            <button
              onClick={handleRefreshAll}
              disabled={isRefreshingAll}
              className="group flex items-center gap-2 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 px-4 py-2.5 rounded-lg text-sm font-semibold text-blue-700 transition-all border border-blue-200 hover:border-blue-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh all prices"
            >
              <RefreshCw size={16} className={isRefreshingAll ? 'animate-spin' : ''} />
              <span>Refresh All</span>
            </button>

            {/* ADD NEW BUTTON */}
            <button
              onClick={() => {
                setEditInvestment(null);
                setShowModal(true);
              }}
              className="group relative bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"></div>
              <span className="relative flex items-center gap-2">
                <span className="text-base">+</span> Add New Investment
              </span>
            </button>
          </div>
        </div>

        {/* PRICE STATUS SUMMARY */}
        {investments.filter(inv => inv.type === 'crypto' || inv.type === 'stock').length > 0 && (
          <div className="mb-4 p-4 bg-white/70 rounded-xl border border-slate-200/70 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700">Price Update Status</h3>
              <button
                onClick={handleForceRefresh}
                disabled={isRefreshingAll}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                title="Force refresh (ignore cache)"
              >
                {isRefreshingAll ? 'Refreshing...' : 'Force Refresh'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <PriceStatusBadge status="updated" count={priceStatusCounts.updated} />
              <PriceStatusBadge status="pending" count={priceStatusCounts.pending} />
              <PriceStatusBadge status="failed" count={priceStatusCounts.failed} />
              
              {/* Cache info */}
              <div className="text-xs text-slate-500 ml-auto flex items-center gap-1">
                <Clock size={10} />
                <span>Cache: 1 hour</span>
              </div>
            </div>
          </div>
        )}

        {/* ===== DUA CARD UTAMA ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-5">
          
          {/* ===== CARD KIRI: TOTAL INVESTMENT VALUE ===== */}
          <div className="relative bg-gradient-to-br from-blue-50 via-white to-blue-100/30 rounded-2xl p-6 shadow-lg border border-blue-200/50 
            h-[480px] min-h-[480px] max-h-[480px] overflow-hidden flex flex-col">
            
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-cyan-300/10 rounded-full -translate-y-12 translate-x-12"></div>
            
            <div className="relative z-10 flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-xl text-white">📈</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Total Investment Value</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Overall investment portfolio</p>
                </div>
              </div>

              <div className="mb-5 flex-1 overflow-hidden flex flex-col">
                {/* TOTAL CURRENT VALUE */}
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
                    Rp {totalValue.toLocaleString("id-ID")}
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-full mb-4">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                    <span className="text-xs font-medium text-emerald-700">
                      {investments.length} investments registered
                    </span>
                  </div>
                </div>

                {/* MODAL INVESTASI & P/L TOTAL */}
                <div className="bg-white/50 rounded-xl p-4 border border-slate-200/50 mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Total Modal Investasi */}
                    <div>
                      <div className="text-xs text-slate-600 mb-1 font-medium">Total Investment</div>
                      <div className="text-lg font-bold text-slate-900">
                        Rp {totalInvestmentAmount.toLocaleString("id-ID")}
                      </div>
                    </div>
                    
                    {/* Total P/L */}
                    <div>
                      <div className="text-xs text-slate-600 mb-1 font-medium">Total P/L</div>
                      <div className="flex items-baseline gap-2">
                        <div className={`text-lg font-bold ${totalPL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {totalPL >= 0 ? '+' : ''}Rp {Math.abs(totalPL).toLocaleString("id-ID")}
                        </div>
                        <div className={`text-xs font-medium px-2 py-0.5 rounded-full ${totalPL >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {totalPL >= 0 ? '+' : ''}{totalPLPercentage}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ===== REAL METRICS ===== */}
                <div className="space-y-2.5 mt-4 flex-1 overflow-y-auto pr-1">
                  {/* Best Performer */}
                  <MetricItem 
                    icon="🏆"
                    label="Best Performer" 
                    value={performance.bestPerformer ? 
                      (performance.bestPerformer.symbol || performance.bestPerformer.name?.substring(0, 12) || 'N/A') : 
                      'N/A'}
                    trend={performance.bestPerformer ? 
                      `+${performance.bestPerformer.returnPercent.toFixed(1)}%` : 
                      null}
                    tooltip={performance.bestPerformer ? 
                      `${performance.bestPerformer.name || performance.bestPerformer.symbol}: +${performance.bestPerformer.returnPercent.toFixed(2)}%` : 
                      'No data'}
                  />
                  
                  {/* Worst Performer */}
                  <MetricItem 
                    icon="📉"
                    label="Worst Performer" 
                    value={performance.worstPerformer ? 
                      (performance.worstPerformer.symbol || performance.worstPerformer.name?.substring(0, 12) || 'N/A') : 
                      'N/A'}
                    trend={performance.worstPerformer ? 
                      `${performance.worstPerformer.returnPercent.toFixed(1)}%` : 
                      null}
                    tooltip={performance.worstPerformer ? 
                      `${performance.worstPerformer.name || performance.worstPerformer.symbol}: ${performance.worstPerformer.returnPercent.toFixed(2)}%` : 
                      'No data'}
                  />
                  
                  {/* Average Return */}
                  <MetricItem 
                    icon="📊"
                    label="Avg Return" 
                    value={`${performance.avgReturn.toFixed(1)}%`}
                    trend={performance.avgReturn >= 0 ? '+Good' : 'Needs work'}
                    tooltip={`Average return across all crypto & stock investments`}
                  />
                  
                  {/* Price Status Summary */}
                  <MetricItem 
                    icon="🔄"
                    label="Price Status" 
                    value={`${priceStatusCounts.updated}/${priceStatusCounts.updated + priceStatusCounts.pending + priceStatusCounts.failed}`}
                    trend={`${Math.round(priceStatusCounts.updated / (priceStatusCounts.updated + priceStatusCounts.pending + priceStatusCounts.failed) * 100)}% updated`}
                    tooltip={`${priceStatusCounts.updated} updated, ${priceStatusCounts.pending} pending, ${priceStatusCounts.failed} failed`}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200/50">
                <span className="text-xs text-slate-500">
                  {lastAutoUpdate ? `Updated: ${lastAutoUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Not updated yet'}
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                  <span className="text-xs font-medium text-slate-700">
                    {storeSummary.priceStatus ? 
                      `${storeSummary.priceStatus.updated} updated, ${storeSummary.priceStatus.failed} failed` : 
                      'All active'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ===== CARD KANAN: BREAKDOWN ===== */}
          <div className="relative bg-gradient-to-br from-emerald-50 via-white to-emerald-100/30 rounded-2xl p-6 shadow-lg border border-emerald-200/50 
            h-[480px] min-h-[480px] max-h-[480px] overflow-hidden">
            
            <div className="absolute bottom-0 right-0 w-28 h-28 bg-gradient-to-br from-emerald-300/10 to-teal-200/10 rounded-full translate-x-14 translate-y-14"></div>
            
            {/* Main content dengan overflow hidden */}
            <div className="relative z-10 h-full flex flex-col">
              
              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-xl text-white">📊</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Portfolio Breakdown</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Investment distribution by category</p>
                </div>
              </div>

              {/* Chart dan Summary */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex flex-col md:flex-row gap-4 h-full">
                  
                  {/* Chart */}
                  <div className="flex-1 bg-white/50 rounded-xl p-4 border border-slate-200/50 shadow-inner 
                    min-h-[200px] h-full overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center">
                      <InvestmentChart data={chartData} />
                    </div>
                  </div>

                  {/* Summary Items */}
                  <div className="flex-1 bg-white/30 rounded-xl p-4 border border-slate-200/50 shadow-inner 
                    min-h-[200px] h-full overflow-y-auto">
                    <div className="w-full space-y-2">
                      {chartData.map((item) => (
                        <SummaryItem 
                          key={item.key}
                          label={item.label} 
                          value={item.value} 
                          color={`bg-gradient-to-br ${INVESTMENT_COLORS[item.key]?.replace('bg-gradient-to-br', '') || 'from-blue-500 to-cyan-400'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer info */}
              <div className="pt-4 mt-3 border-t border-slate-200/50">
                <div className="text-xs text-slate-500 text-center">
                  Prices auto-refresh every hour • Click Refresh All for immediate update
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== CONTENT BELOW ===== */}
      <div className="pt-6">
        {/* ===== SECTION TITLE & ACTIVE FILTER/SORT ===== */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Investments List</h2>
            <p className="text-slate-600 text-sm font-medium mt-1">
              {sortedInvestments.length} investment{sortedInvestments.length !== 1 ? 's' : ''} registered
              {filterType !== "all" && (
                <span className="text-blue-600 font-semibold ml-2">
                  (Filtered: {LABELS[filterType] || filterType})
                </span>
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <SortDropdown 
              sortBy={sortBy}
              setSortBy={setSortBy}
              isOpen={sortOpen}
              setIsOpen={setSortOpen}
            />
            
            <FilterDropdown 
              filterType={filterType}
              setFilterType={setFilterType}
              isOpen={filterOpen}
              setIsOpen={setFilterOpen}
              typeOptions={typeOptions}
            />
          </div>
        </div>

        {/* ===== INVESTMENTS LIST ===== */}
        <div className="space-y-10">
          {displayStocks.length > 0 && (
            <Section title="Stock" data={displayStocks} onEdit={onEdit} />
          )}

          {displayCryptos.length > 0 && (
            <Section title="Crypto" data={displayCryptos} onEdit={onEdit} />
          )}

          {displayReksadanas.length > 0 && (
            <Section title="Reksadana" data={displayReksadanas} onEdit={onEdit} />
          )}

          {displayDepositos.length > 0 && (
            <Section title="Deposito" data={displayDepositos} onEdit={onEdit} />
          )}

          {displayOthers.length > 0 && (
            <Section title="Other" data={displayOthers} onEdit={onEdit} />
          )}
        </div>

        {/* Empty State */}
        {sortedInvestments.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-2xl mt-8 bg-gradient-to-b from-white to-slate-50/50">
            <div className="text-6xl mb-4 text-slate-300">📈</div>
            <h3 className="text-xl font-bold mb-3 text-slate-800">
              {investments.length === 0 ? "No Investments Yet" : "No Investments Match Your Filter"}
            </h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              {investments.length === 0 
                ? "Start your investment journey by creating your first investment" 
                : "Try adjusting your filter settings to see more results"}
            </p>
            <button
              onClick={() => {
                if (investments.length === 0) {
                  setShowModal(true);
                } else {
                  setFilterType("all");
                }
              }}
              className="group bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 px-6 py-3 rounded-lg font-semibold text-white transition-all shadow-md hover:shadow-lg hover:scale-[1.02]"
            >
              {investments.length === 0 ? "Create First Investment" : "Clear All Filters"}
            </button>
          </div>
        )}

        {/* Footer */}
        {sortedInvestments.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-300/50">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="px-3 py-1.5 bg-gradient-to-r from-slate-100 to-white rounded-lg">
                  <span className="font-bold text-slate-900">{sortedInvestments.length}</span>
                  <span className="text-slate-600 ml-1">
                    investment{sortedInvestments.length !== 1 ? 's' : ''} total
                  </span>
                  {filterType !== "all" && (
                    <span className="ml-3 px-2 py-1 bg-gradient-to-r from-blue-100 to-blue-50 text-blue-600 font-semibold text-xs rounded-md">
                      Filtered: {LABELS[filterType] || filterType}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                {stocks.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ 
                      background: INVESTMENT_COLORS.stock || 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)' 
                    }}></div>
                    <span className="text-slate-700 text-sm font-medium">Stock: {stocks.length}</span>
                  </div>
                )}
                {cryptos.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ 
                      background: INVESTMENT_COLORS.crypto || 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)' 
                    }}></div>
                    <span className="text-slate-700 text-sm font-medium">Crypto: {cryptos.length}</span>
                  </div>
                )}
                {reksadanas.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ 
                      background: INVESTMENT_COLORS.reksadana || 'linear-gradient(135deg, #10B981 0%, #34D399 100%)' 
                    }}></div>
                    <span className="text-slate-700 text-sm font-medium">Reksadana: {reksadanas.length}</span>
                  </div>
                )}
                {depositos.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ 
                      background: INVESTMENT_COLORS.deposito || 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)' 
                    }}></div>
                    <span className="text-slate-700 text-sm font-medium">Deposito: {depositos.length}</span>
                  </div>
                )}
                {others.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ 
                      background: INVESTMENT_COLORS.other || 'linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)' 
                    }}></div>
                    <span className="text-slate-700 text-sm font-medium">Other: {others.length}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showModal && (
          <AddInvestmentModal
            editInvestment={editInvestment}
            onClose={() => {
              setShowModal(false);
              setEditInvestment(null);
            }}
          />
        )}
      </div>
    </div>
  );
}