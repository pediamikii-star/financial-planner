import { useEffect, useState, useRef } from "react";
import { ChevronDown, Filter, SortAsc } from "lucide-react";
import AddCreatorModal from "../components/creators/AddCreatorModal";
import CreatorCard from "../components/creators/CreatorCard";
import CreatorChart from "../components/creators/CreatorChart";
import CreatorWithdrawModal from "../components/creators/CreatorWithdrawModal";
import { creatorStore } from "../stores/creator.store";
import { withdrawService } from "../services/withdrawService";

function normalizePlatform(platform = "") {
  const p = platform.toLowerCase();
  if (p.includes("youtube")) return "youtube";
  if (p.includes("tiktok")) return "tiktok";
  if (p.includes("instagram")) return "instagram";
  if (p.includes("twitter") || p.includes("x")) return "twitter";
  if (p.includes("facebook") || p.includes("fb")) return "facebook";
  if (p.includes("blog") || p.includes("website")) return "blog";
  if (p.includes("fiverr")) return "fiverr";
  if (p.includes("upwork")) return "upwork";
  if (p.includes("shopee")) return "shopee";
  if (p.includes("lynkid") || p.includes("lynk")) return "lynkid";
  return "other";
}

function formatPlatformTitle(key) {
  const map = {
    "youtube": "YouTube",
    "tiktok": "TikTok",
    "instagram": "Instagram",
    "twitter": "Twitter / X",
    "facebook": "Facebook",
    "blog": "Blog / Website",
    "fiverr": "Fiverr",
    "upwork": "Upwork",
    "shopee": "Shopee",
    "lynkid": "Lynkid",
    "other": "Other Platforms"
  };
  return map[key] || key.charAt(0).toUpperCase() + key.slice(1);
}

// IMPORT GRADIENTS PALETTE
const PLATFORM_GRADIENTS = {
  Blogger: ["#F57C00", "#FFB74D"],
  Facebook: ["#1877F2", "#6CA9FF"],
  Fiverr: ["#1DBF73", "#7AE6B8"],
  Instagram: ["#833AB4", "#FD1D1D"],
  LynkID: ["#0F172A", "#64748B"],
  Shopee: ["#EE4D2D", "#FF9F8A"],
  Tiktok: ["#000000", "#25F4EE"],
  Upwork: ["#14A800", "#7ED957"],
  X: ["#0F172A", "#94A3B8"],
  Youtube: ["#FF0000", "#FF8A8A"],
};

function getGradientForPlatform(platformKey) {
  const platformTitle = formatPlatformTitle(platformKey);
  
  // Map untuk kesesuaian
  const gradientMap = {
    "YouTube": PLATFORM_GRADIENTS.Youtube,
    "TikTok": PLATFORM_GRADIENTS.Tiktok,
    "Instagram": PLATFORM_GRADIENTS.Instagram,
    "Twitter / X": PLATFORM_GRADIENTS.X,
    "Facebook": PLATFORM_GRADIENTS.Facebook,
    "Blog / Website": PLATFORM_GRADIENTS.Blogger,
    "Fiverr": PLATFORM_GRADIENTS.Fiverr,
    "Upwork": PLATFORM_GRADIENTS.Upwork,
    "Shopee": PLATFORM_GRADIENTS.Shopee,
    "Lynkid": PLATFORM_GRADIENTS.LynkID,
    "Other Platforms": PLATFORM_GRADIENTS.X,
  };
  
  return gradientMap[platformTitle] || PLATFORM_GRADIENTS.X;
}

/* ======================
   ALGORITMA DISTRIBUSI PLATFORM
====================== */
function distributePlatforms(groupedCreators) {
  const platforms = Object.entries(groupedCreators).map(([key, creators]) => ({
    key,
    title: formatPlatformTitle(key),
    creators,
    height: Math.ceil(creators.length / 2)
  }));

  platforms.sort((a, b) => b.height - a.height);

  const leftColumn = [];
  const rightColumn = [];
  let leftHeight = 0;
  let rightHeight = 0;

  platforms.forEach(platform => {
    if (leftHeight <= rightHeight) {
      leftColumn.push(platform);
      leftHeight += platform.height;
    } else {
      rightColumn.push(platform);
      rightHeight += platform.height;
    }
  });

  return { leftColumn, rightColumn };
}

/* ======================
   RENDER CARD DALAM PLATFORM
====================== */
function PlatformSection({ title, creators, onEdit, onWithdraw }) {
  const chunks = [];
  for (let i = 0; i < creators.length; i += 2) {
    chunks.push(creators.slice(i, i + 2));
  }

  return (
    <div className="mb-8 last:mb-0" style={{ position: 'relative', zIndex: 40 }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-cyan-400 rounded-full"></div>
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
      </div>
      
      <div className="space-y-4">
        {chunks.map((chunk, index) => (
          <div key={index} className="flex gap-5">
            {chunk.map(creator => (
              <div className="flex-1" key={creator.id} style={{ position: 'relative', zIndex: 40 }}>
                <CreatorCard 
                  creator={creator} 
                  onEdit={() => onEdit(creator)} 
                  onWithdraw={() => onWithdraw(creator)}
                />
              </div>
            ))}
            {chunk.length === 1 && (
              <div className="flex-1 opacity-0 pointer-events-none">
                <div className="h-full"></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ======================
   METRIC ITEM
====================== */
function MetricItem({ icon, label, value, trend }) {
  const trendColor = trend?.startsWith('+') ? 'text-emerald-600' : trend?.startsWith('-') ? 'text-rose-600' : 'text-slate-600';
  
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-white/40 border border-white/60 backdrop-blur-sm">
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
    </div>
  );
}

/* ======================
   SUMMARY ITEM DENGAN GRADIENT PLATFORM - VERSI SUPER MEPET
====================== */
function SummaryItem({ label, value, platformKey }) {
  const gradient = getGradientForPlatform(platformKey);
  
  return (
    <div className="flex items-center justify-between p-1 hover:bg-white/40 transition-all rounded group">
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <div 
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ 
            background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`
          }}
        />
        <span className="text-sm font-medium text-slate-700 truncate">
          {label}
        </span>
      </div>
      <span className="font-bold text-slate-900 text-sm bg-white/60 px-1.5 py-0.5 rounded flex-shrink-0 ml-1">
        Rp {value.toLocaleString("id-ID")}
      </span>
    </div>
  );
}

/* ======================
   SORT & FILTER COMPONENTS
====================== */
function SortDropdown({ sortBy, setSortBy, isOpen, setIsOpen, isScrolled }) {
  const sortOptions = [
    { id: "balance-high", label: "Balance: High to Low" },
    { id: "balance-low", label: "Balance: Low to High" },
    { id: "name-asc", label: "Name: A to Z" },
    { id: "name-desc", label: "Name: Z to A" },
  ];

  const currentLabel = sortOptions.find(opt => opt.id === sortBy)?.label || "Sort by";

  return (
    <div className="relative" style={{ zIndex: isScrolled ? 20 : 40 }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs font-medium text-slate-700 hover:text-slate-900 px-4 py-2.5 border border-slate-300 hover:border-slate-400 rounded-xl transition-all bg-white hover:bg-slate-50 shadow-sm hover:shadow"
        style={{ position: 'relative', zIndex: isScrolled ? 20 : 40 }}
      >
        <SortAsc size={16} className="text-slate-500" />
        {currentLabel}
        <ChevronDown size={16} className={`transition-transform ${isOpen ? "rotate-180" : ""} text-slate-500`} />
      </button>

      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden"
          style={{ 
            zIndex: isScrolled ? 20 : 40,
            position: 'relative'
          }}
        >
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

function FilterDropdown({ filterPlatform, setFilterPlatform, isOpen, setIsOpen, platforms, isScrolled }) {
  const platformOptions = [
    { id: "all", label: "All Platforms" },
    ...platforms.map(p => ({ id: p.key, label: p.title }))
  ];

  const currentLabel = platformOptions.find(opt => opt.id === filterPlatform)?.label || "Filter";

  return (
    <div className="relative" style={{ zIndex: isScrolled ? 20 : 40 }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs font-medium text-slate-700 hover:text-slate-900 px-4 py-2.5 border border-slate-300 hover:border-slate-400 rounded-xl transition-all bg-white hover:bg-slate-50 shadow-sm hover:shadow"
        style={{ position: 'relative', zIndex: isScrolled ? 20 : 40 }}
      >
        <Filter size={16} className="text-slate-500" />
        {currentLabel}
        <ChevronDown size={16} className={`transition-transform ${isOpen ? "rotate-180" : ""} text-slate-500`} />
      </button>

      {isOpen && (
        <div 
          className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-72 overflow-y-auto"
          style={{ 
            zIndex: isScrolled ? 20 : 40,
            position: 'relative'
          }}
        >
          {platformOptions.map(option => (
            <button
              key={option.id}
              onClick={() => {
                setFilterPlatform(option.id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 text-sm hover:bg-gradient-to-r hover:from-slate-50/80 hover:to-white transition-all ${
                filterPlatform === option.id 
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

export default function Creators() {
  const [creators, setCreators] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editCreator, setEditCreator] = useState(null);
  
  const [sortBy, setSortBy] = useState("balance-high");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const [isScrolled, setIsScrolled] = useState(false);
  const contentRef = useRef(null);

  const [withdrawModal, setWithdrawModal] = useState({
    open: false,
    creator: null
  });

  const [bankAccounts, setBankAccounts] = useState([]);

  useEffect(() => {
    creatorStore.init();
    const unsubscribe = creatorStore.subscribe(data => {
      setCreators(data);
    });
    
    loadBankAccounts();
    
    return unsubscribe;
  }, []);

  const loadBankAccounts = async () => {
    try {
      const result = await withdrawService.getBankAccounts();
      if (result.success) {
        setBankAccounts(result.data);
      }
    } catch (error) {
      console.error("Error loading bank accounts:", error);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const scrollTop = contentRef.current.scrollTop;
        setIsScrolled(scrollTop > 50);
      }
    };

    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (contentElement) {
        contentElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  function sortCreators(creatorsList) {
    const sorted = [...creatorsList];
    
    switch(sortBy) {
      case "balance-high":
        return sorted.sort((a, b) => {
          const balanceA = Number(a.balance || a.platformBalance || 0);
          const balanceB = Number(b.balance || b.platformBalance || 0);
          return balanceB - balanceA;
        });
      case "balance-low":
        return sorted.sort((a, b) => {
          const balanceA = Number(a.balance || a.platformBalance || 0);
          const balanceB = Number(b.balance || b.platformBalance || 0);
          return balanceA - balanceB;
        });
      case "name-asc":
        return sorted.sort((a, b) => {
          const nameA = String(a.name || a.channel || "").toLowerCase();
          const nameB = String(b.name || b.channel || "").toLowerCase();
          if (nameA < nameB) return -1;
          if (nameA > nameB) return 1;
          return 0;
        });
      case "name-desc":
        return sorted.sort((a, b) => {
          const nameA = String(a.name || a.channel || "").toLowerCase();
          const nameB = String(b.name || b.channel || "").toLowerCase();
          if (nameA > nameB) return -1;
          if (nameA < nameB) return 1;
          return 0;
        });
      default:
        return sorted;
    }
  }

  function filterCreators(creatorsList) {
    if (filterPlatform === "all") return creatorsList;
    return creatorsList.filter(creator => 
      normalizePlatform(creator.platform) === filterPlatform
    );
  }

  const handleWithdrawClick = (creator) => {
    const creatorWithBalance = {
      ...creator,
      balance: Number(
        creator.balance || 
        creator.platformBalance || 
        creator.currentBalance || 
        creator.amount || 
        0
      ),
      name: creator.name || creator.channel || "Unknown",
      platform: creator.platform || "Unknown Platform",
      description: creator.description || creator.type || "",
    };
    
    setWithdrawModal({
      open: true,
      creator: creatorWithBalance
    });
  };

  const handleWithdrawSubmit = async (withdrawData) => {
    try {
      const result = await withdrawService.processWithdrawal(withdrawData);
      
      if (result.success) {
        const updatedCreators = creatorStore.getAll();
        setCreators(updatedCreators);
        
        await loadBankAccounts();
        
        return { success: true };
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Withdraw error:", error);
      return { 
        success: false, 
        message: error.message || "Withdrawal failed. Please try again." 
      };
    }
  };

  const filteredCreators = filterCreators(creators);
  const sortedCreators = sortCreators(filteredCreators);
  
  const grouped = sortedCreators.reduce((acc, creator) => {
    const platformKey = normalizePlatform(creator.platform);
    if (!acc[platformKey]) {
      acc[platformKey] = [];
    }
    acc[platformKey].push(creator);
    return acc;
  }, {});

  const { leftColumn, rightColumn } = distributePlatforms(grouped);

  const platformOptions = Object.entries(grouped).map(([key]) => ({
    key,
    title: formatPlatformTitle(key)
  }));

  const totalIncome = sortedCreators.reduce(
    (sum, c) => sum + Number(c.balance || c.platformBalance || 0),
    0
  );

  const chartData = Object.entries(grouped)
    .map(([key, list]) => ({
      key,
      label: formatPlatformTitle(key),
      value: list.reduce((s, c) => s + Number(c.balance || c.platformBalance || 0), 0),
    }))
    .filter(i => i.value > 0)
    .sort((a, b) => b.value - a.value);

  const averageIncome = sortedCreators.length > 0 
    ? Math.round(totalIncome / sortedCreators.length)
    : 0;
  
  const largestCreator = sortedCreators.length > 0 
    ? sortedCreators.reduce((max, creator) => {
        const creatorBalance = Number(creator.balance || creator.platformBalance || 0);
        const maxBalance = Number(max.balance || max.platformBalance || 0);
        return creatorBalance > maxBalance ? creator : max;
      })
    : null;

  const chartDataForDisplay = chartData.slice(0, 11);

  return (
<div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
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
    {/* ===== HEADER TITLE & BUTTON ===== */}
    <div className="flex items-center justify-between mb-6 pt-4">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          Creators
        </h1>
        <p className="text-slate-500 text-sm font-medium mt-1">
          Income sources from creator platforms
        </p>
      </div>

      <button
        onClick={() => {
          setEditCreator(null);
          setShowModal(true);
        }}
        className="group relative bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"></div>
        <span className="relative flex items-center gap-2">
          <span className="text-base">+</span> Add Creator
        </span>
      </button>
    </div>

        {/* ===== DUA CARD UTAMA ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-5">
          
          {/* ===== CARD KIRI: TOTAL CREATOR BALANCE ===== */}
          <div className="relative bg-gradient-to-br from-blue-50 via-white to-blue-100/30 rounded-2xl p-6 shadow-lg border border-blue-200/50 
            h-[480px] min-h-[480px] max-h-[480px] overflow-hidden flex flex-col">
            
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-cyan-300/10 rounded-full -translate-y-12 translate-x-12"></div>
            
            <div className="relative z-10 flex-1 flex flex-col">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-xl text-white">💰</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Total Creator Balance</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Total income from platforms</p>
                </div>
              </div>

              <div className="mb-5 flex-1 flex flex-col">
                <div className="text-center">
                  <div className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
                    Rp {totalIncome.toLocaleString("id-ID")}
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-full mb-4">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                    <span className="text-xs font-medium text-emerald-700">
                      {sortedCreators.length} creator{sortedCreators.length !== 1 ? 's' : ''} registered
                    </span>
                  </div>
                </div>

                {/* METRICS */}
                <div className="space-y-2 mt-4 flex-1">
                  <MetricItem 
                    icon="📈"
                    label="Available Balance" 
                    value="100%" 
                    trend="ready"
                  />
                  <MetricItem 
                    icon="📊"
                    label="Average Income" 
                    value={`Rp ${averageIncome.toLocaleString("id-ID")}`}
                  />
                  <MetricItem 
                    icon="👑"
                    label="Top Creator" 
                    value={largestCreator ? (largestCreator.name || largestCreator.channel || "Unknown").substring(0, 12) + (largestCreator.name?.length > 12 ? "..." : "") : "N/A"}
                    trend={largestCreator ? `Rp ${Number(largestCreator.balance || largestCreator.platformBalance || 0).toLocaleString("id-ID")}` : ""}
                  />
                  
                  <div className="flex-1"></div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200/50">
                <span className="text-xs text-slate-500">Updated just now</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                  <span className="text-xs font-medium text-slate-700">All active</span>
                </div>
              </div>
            </div>
          </div>

          {/* ===== CARD KANAN: PLATFORM BREAKDOWN ===== */}
          <div className="relative bg-gradient-to-br from-emerald-50 via-white to-emerald-100/30 rounded-2xl p-6 shadow-lg border border-emerald-200/50 
            h-[480px] min-h-[480px] max-h-[480px] overflow-hidden flex flex-col">
            
            <div className="absolute bottom-0 right-0 w-28 h-28 bg-gradient-to-br from-emerald-300/10 to-teal-200/10 rounded-full translate-x-14 translate-y-14"></div>
            
            <div className="relative z-10 flex-1 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-xl text-white">📊</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Platform Breakdown</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Income distribution per platform</p>
                </div>
              </div>

              {/* CHART & SUMMARY - VERSI SUPER MEPET */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex flex-col md:flex-row gap-3 h-full">
                  
                  {/* Chart */}
                  <div className="flex-1 bg-white/50 rounded-xl p-3 border border-slate-200/50 shadow-inner">
                    <div className="w-full h-full flex items-center justify-center">
                      <CreatorChart data={chartDataForDisplay} />
                    </div>
                  </div>

                  {/* Summary Items - VERSI SUPER MEPET */}
                  <div className="flex-1 bg-white/30 rounded-xl p-1.5 border border-slate-200/50 shadow-inner overflow-hidden">
                    <div className="space-y-[2px]">
                      {chartDataForDisplay.map(item => (
                        <SummaryItem 
                          key={item.key}
                          label={item.label} 
                          value={item.value} 
                          platformKey={item.key}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer info */}
              <div className="pt-4 mt-2 border-t border-slate-200/50">
                <div className="text-xs text-slate-500 text-center">
                  {/* TEKS DIHAPUS */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT AREA ===== */}
      <div 
        ref={contentRef}
        className="pt-6 relative overflow-y-auto"
        style={{ 
          minHeight: 'calc(100vh - 400px)',
          position: 'relative',
          zIndex: 30
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Creator List</h2>
            <p className="text-slate-600 text-sm font-medium mt-1">
              {sortedCreators.length} creator{sortedCreators.length !== 1 ? 's' : ''} registered
              {filterPlatform !== "all" && (
                <span className="text-blue-600 font-semibold ml-2">
                  (Filtered: {formatPlatformTitle(filterPlatform)})
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
              isScrolled={isScrolled}
            />
            
            <FilterDropdown 
              filterPlatform={filterPlatform}
              setFilterPlatform={setFilterPlatform}
              isOpen={filterOpen}
              setIsOpen={setFilterOpen}
              platforms={platformOptions}
              isScrolled={isScrolled}
            />
          </div>
        </div>

        {/* DUA KOLOM UTAMA */}
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* KOLOM KIRI */}
          <div 
            className="lg:w-1/2 bg-white rounded-2xl border border-slate-200 shadow-lg p-6"
            style={{ 
              position: 'relative',
              zIndex: 40,
              transform: 'translateZ(0)',
              isolation: 'isolate'
            }}
          >
            {leftColumn.map(platform => (
              <PlatformSection
                key={platform.key}
                title={platform.title}
                creators={platform.creators}
                onEdit={c => {
                  setEditCreator(c);
                  setShowModal(true);
                }}
                onWithdraw={handleWithdrawClick}
              />
            ))}
            
            {leftColumn.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                No creators in this column
              </div>
            )}
          </div>
          
          {/* KOLOM KANAN */}
          <div 
            className="lg:w-1/2 bg-white rounded-2xl border border-slate-200 shadow-lg p-6"
            style={{ 
              position: 'relative',
              zIndex: 40,
              transform: 'translateZ(0)',
              isolation: 'isolate'
            }}
          >
            {rightColumn.map(platform => (
              <PlatformSection
                key={platform.key}
                title={platform.title}
                creators={platform.creators}
                onEdit={c => {
                  setEditCreator(c);
                  setShowModal(true);
                }}
                onWithdraw={handleWithdrawClick}
              />
            ))}
            
            {rightColumn.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                No creators in this column
              </div>
            )}
          </div>
          
        </div>

        {/* EMPTY STATE */}
        {sortedCreators.length === 0 && (
          <div 
            className="text-center py-12 border-2 border-dashed border-slate-300 rounded-2xl mt-8 bg-gradient-to-b from-white to-slate-50/50"
            style={{ position: 'relative', zIndex: 40 }}
          >
            <div className="text-6xl mb-4 text-slate-300">🎬</div>
            <h3 className="text-xl font-bold mb-3 text-slate-800">
              {creators.length === 0 ? "No Creators Yet" : "No Creators Match Your Filter"}
            </h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              {creators.length === 0 
                ? "Start by adding your first creator platform" 
                : "Try adjusting your filter settings to see more results"}
            </p>
            <button
              onClick={() => {
                if (creators.length === 0) {
                  setShowModal(true);
                } else {
                  setFilterPlatform("all");
                }
              }}
              className="group bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 px-6 py-3 rounded-lg font-semibold text-white transition-all shadow-md hover:shadow-lg hover:scale-[1.02]"
            >
              {creators.length === 0 ? "Add First Creator" : "Clear All Filters"}
            </button>
          </div>
        )}

        {/* FOOTER */}
        {sortedCreators.length > 0 && (
          <div 
            className="mt-8 pt-6 border-t border-slate-300/50"
            style={{ position: 'relative', zIndex: 40 }}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="px-3 py-1.5 bg-gradient-to-r from-slate-100 to-white rounded-lg">
                  <span className="font-bold text-slate-900">{sortedCreators.length}</span>
                  <span className="text-slate-600 ml-1">
                    creator{sortedCreators.length !== 1 ? 's' : ''} total
                  </span>
                  {filterPlatform !== "all" && (
                    <span className="ml-3 px-2 py-1 bg-gradient-to-r from-blue-100 to-blue-50 text-blue-600 font-semibold text-xs rounded-md">
                      Filtered: {formatPlatformTitle(filterPlatform)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full shadow-sm"></div>
                  <span className="text-slate-700 text-sm font-medium">Platforms: {Object.keys(grouped).length}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-full shadow-sm"></div>
                  <span className="text-slate-700 text-sm font-medium">Total: Rp {totalIncome.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODALS */}
        {showModal && (
          <AddCreatorModal
            editCreator={editCreator}
            onClose={() => {
              setShowModal(false);
              setEditCreator(null);
            }}
          />
        )}

        {withdrawModal.open && (
          <CreatorWithdrawModal
            creator={withdrawModal.creator}
            accounts={bankAccounts}
            onClose={() => setWithdrawModal({ open: false, creator: null })}
            onWithdrawSubmit={handleWithdrawSubmit}
          />
        )}
      </div>
    </div>
  );
}