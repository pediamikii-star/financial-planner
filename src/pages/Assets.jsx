// src/pages/Assets.jsx
import { useEffect, useState } from "react";
import { ChevronDown, Filter, SortAsc } from "lucide-react";
import AddAssetModal from "../components/assets/AddAssetModal";
import AssetCard from "../components/assets/AssetCard";
import AssetChart from "../components/assets/AssetChart";
import { 
  getAssets as getAssetsAsync,
  getTotalPurchaseValue, 
  getTotalCurrentValue, 
  getOverallPL,
  getAssetsByCategory 
} from "../services/storage";

function normalizeCategory(category = "") {
  const c = category.toLowerCase();
  if (c.includes("property")) return "property";
  if (c.includes("vehicle")) return "vehicle";
  if (c.includes("gold")) return "gold";
  if (c.includes("land")) return "land";
  if (c.includes("gadget")) return "gadget";
  return "other";
}

function formatCategoryTitle(key) {
  const map = {
    "property": "Property",
    "vehicle": "Vehicle", 
    "gold": "Gold",
    "land": "Land",
    "gadget": "Gadget",
    "other": "Other"
  };
  return map[key] || key.charAt(0).toUpperCase() + key.slice(1);
}

function getAssetColorClass(key) {
  const colorMap = {
    property: "bg-gradient-to-br from-[#E6B89C] to-[#F8D5B9]",
    vehicle: "bg-gradient-to-br from-[#B8B0A2] to-[#D4CFC7]",
    gold: "bg-gradient-to-br from-[#F0C14B] to-[#FFD97D]",
    land: "bg-gradient-to-br from-[#D4A574] to-[#E6C9A8]",
    gadget: "bg-gradient-to-br from-[#A89F95] to-[#C7BFB5]",
  };
  return colorMap[key] || "bg-gradient-to-br from-[#D1C7B7] to-[#E8E2D9]";
}

function SortDropdown({ sortBy, setSortBy, isOpen, setIsOpen }) {
  const sortOptions = [
    { id: "value-high", label: "Value: High to Low" },
    { id: "value-low", label: "Value: Low to High" },
    { id: "name-asc", label: "Name: A to Z" },
    { id: "name-desc", label: "Name: Z to A" },
    { id: "date-new", label: "Date: Newest First" },
    { id: "date-old", label: "Date: Oldest First" },
    { id: "pl-high", label: "P/L: High to Low" },
    { id: "pl-low", label: "P/L: Low to High" },
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

function FilterDropdown({ filterCategory, setFilterCategory, isOpen, setIsOpen, categoryOptions }) {
  const allOptions = [
    { id: "all", label: "All Categories" },
    ...categoryOptions
  ];

  const currentLabel = allOptions.find(opt => opt.id === filterCategory)?.label || "Filter";

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
                setFilterCategory(option.id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 text-sm hover:bg-gradient-to-r hover:from-slate-50/80 hover:to-white transition-all ${
                filterCategory === option.id 
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

function SummaryItem({ label, value, color, plData }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/40 transition-colors group">
      <div className={`w-3 h-3 rounded-full ${color} ring-1 ring-white flex-shrink-0`} />
      <span className="text-sm font-medium text-slate-700 flex-1 truncate">{label}</span>
      <div className="text-right flex-shrink-0">
        <div className="font-semibold text-slate-900 text-sm px-1.5 py-0.5">
          Rp {value.toLocaleString("id-ID")}
        </div>
        {plData && plData.plAmount !== 0 && (
          <div className={`text-[10px] mt-0.5 font-medium ${plData.isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
            {plData.isProfit ? '+' : ''}{plData.plAmount.toLocaleString('id-ID')} 
            ({plData.isProfit ? '+' : ''}{plData.plPercentage.toFixed(1)}%)
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, data, onEdit }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-cyan-400 rounded-full"></div>
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {data.map(asset => (
          <AssetCard
            key={asset.id}
            asset={asset}
            onEdit={() => onEdit(asset)}
          />
        ))}
      </div>
    </div>
  );
}

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editAsset, setEditAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [sortBy, setSortBy] = useState("value-high");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  async function loadAssets() {
    try {
      setLoading(true);
      const loadedAssets = await getAssetsAsync();
      const categories = getAssetsByCategory();
      
      setAssets(loadedAssets || []);
      setCategoryData(categories || []);
    } catch (error) {
      console.error('Failed to load assets:', error);
      setAssets([]);
      setCategoryData([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAssets();
    
    const handleAssetsUpdated = () => {
      loadAssets();
    };
    
    window.addEventListener("assetsUpdated", handleAssetsUpdated);
    
    return () => {
      window.removeEventListener("assetsUpdated", handleAssetsUpdated);
    };
  }, []);

  const totalPurchaseValue = getTotalPurchaseValue();
  const totalCurrentValue = getTotalCurrentValue();
  const overallPL = getOverallPL();

  function sortAssets(assetsList) {
    const sorted = [...(assetsList || [])];
    
    switch(sortBy) {
      case "value-high":
        return sorted.sort((a, b) => 
          (Number(b.value) || 0) - (Number(a.value) || 0)
        );
      case "value-low":
        return sorted.sort((a, b) => 
          (Number(a.value) || 0) - (Number(b.value) || 0)
        );
      case "name-asc":
        return sorted.sort((a, b) => {
          const nameA = String(a.name || "").toLowerCase();
          const nameB = String(b.name || "").toLowerCase();
          if (nameA < nameB) return -1;
          if (nameA > nameB) return 1;
          return 0;
        });
      case "name-desc":
        return sorted.sort((a, b) => {
          const nameA = String(a.name || "").toLowerCase();
          const nameB = String(b.name || "").toLowerCase();
          if (nameA > nameB) return -1;
          if (nameA < nameB) return 1;
          return 0;
        });
      case "date-new":
        return sorted.sort((a, b) => 
          new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0)
        );
      case "date-old":
        return sorted.sort((a, b) => 
          new Date(a.created_at || a.createdAt || 0) - new Date(b.created_at || b.createdAt || 0)
        );
      default:
        return sorted;
    }
  }

  function filterAssets(assetsList) {
    if (!Array.isArray(assetsList)) return [];
    if (filterCategory === "all") return assetsList;
    return assetsList.filter(asset => 
      normalizeCategory(asset.category) === filterCategory
    );
  }

  const filteredAssets = filterAssets(assets);
  const sortedAssets = sortAssets(filteredAssets);
  
  const properties = sortedAssets.filter(a => normalizeCategory(a.category) === "property");
  const vehicles = sortedAssets.filter(a => normalizeCategory(a.category) === "vehicle");
  const golds = sortedAssets.filter(a => normalizeCategory(a.category) === "gold");
  const lands = sortedAssets.filter(a => normalizeCategory(a.category) === "land");
  const gadgets = sortedAssets.filter(a => normalizeCategory(a.category) === "gadget");

  const chartData = categoryData.map(cat => ({
    key: cat.category,
    label: formatCategoryTitle(cat.category),
    value: cat.totalCurrent,
    purchaseValue: cat.totalPurchase,
    plAmount: cat.plAmount,
    plPercentage: cat.plPercentage,
    isProfit: cat.plAmount >= 0
  })).filter(item => item.value > 0);

  const categoryOptions = [
    { id: "property", label: "Property" },
    { id: "vehicle", label: "Vehicle" },
    { id: "gold", label: "Gold" },
    { id: "land", label: "Land" },
    { id: "gadget", label: "Gadget" },
  ];

  const onEdit = (asset) => {
    setEditAsset(asset);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditAsset(null);
    setTimeout(() => loadAssets(), 100);
  };

  const averageValue = assets.length > 0 
    ? Math.round(totalCurrentValue / assets.length)
    : 0;
  
  const largestAsset = assets.length > 0 
    ? assets.reduce((max, asset) => 
        Number(asset.currentEstimatedValue || asset.value || 0) > Number(max.currentEstimatedValue || max.value || 0) ? asset : max
      )
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading assets...</p>
        </div>
      </div>
    );
  }

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

      <div className="z-30 pb-6">
        <div className="flex items-center justify-between mb-6 pt-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Assets
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">
              Overview of Your Total Assets
            </p>
          </div>

          <button
            onClick={() => {
              setEditAsset(null);
              setShowModal(true);
            }}
            className="group relative bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"></div>
            <span className="relative flex items-center gap-2">
              <span className="text-base">+</span> Add Asset
            </span>
          </button>
        </div>

        {/* ===== DUA CARD UTAMA - UKURAN FIX 480px ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-5">
          {/* ===== CARD KIRI: TOTAL ASSET VALUE - TANPA SCROLL ===== */}
          <div className="relative bg-gradient-to-br from-blue-50 via-white to-blue-100/30 rounded-2xl p-6 shadow-lg border border-blue-200/50 
            h-[480px] min-h-[480px] max-h-[480px] overflow-hidden flex flex-col">
            
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-cyan-300/10 rounded-full -translate-y-12 translate-x-12"></div>
            
            <div className="relative z-10 flex-1 overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-xl text-white">💰</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Total Asset Value</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Total value of all assets</p>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 flex flex-col">
                {/* Purchase Value */}
                <div className="mb-3">
                  <div className="text-sm text-slate-500 mb-1">Total Purchase Value</div>
                  <div className="text-2xl font-bold text-slate-700">
                    Rp {totalPurchaseValue.toLocaleString("id-ID")}
                  </div>
                </div>

                {/* Current Estimated Value */}
                <div className="mb-4">
                  <div className="text-sm text-slate-500 mb-1">Total Current Estimated Value</div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    Rp {totalCurrentValue.toLocaleString("id-ID")}
                  </div>
                </div>

                {/* Garis Pemisah */}
                <div className="border-t border-slate-300/50 my-3"></div>

                {/* Total Profit - CENTERED */}
                <div className="text-center mb-5">
                  <div className="text-sm text-slate-500 mb-1">Total Profit</div>
                  <div className="flex items-center justify-center gap-2">
                    <span className={`text-xl font-bold ${overallPL.isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {overallPL.isProfit ? '+' : ''}Rp {Math.abs(overallPL.amount).toLocaleString("id-ID")}
                    </span>
                    <span className={`text-sm font-medium ${overallPL.isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
                      ({overallPL.isProfit ? '+' : ''}{overallPL.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>

                {/* Garis Pemisah ke-2 */}
                <div className="border-t border-slate-300/50 my-3"></div>

                {/* Stats Grid - 3 Kolom */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {/* Total Assets */}
                  <div className="text-center">
                    <div className="text-xs text-slate-500 mb-1">Total Assets</div>
                    <div className="text-lg font-bold text-slate-800">{assets.length}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">registered</div>
                  </div>

                  {/* Average Value */}
                  <div className="text-center">
                    <div className="text-xs text-slate-500 mb-1">Average Value</div>
                    <div className="text-lg font-bold text-slate-800">
                      Rp {averageValue.toLocaleString("id-ID")}
                    </div>
                  </div>

                  {/* Largest Asset */}
                  <div className="text-center">
                    <div className="text-xs text-slate-500 mb-1">Largest Asset</div>
                    <div className="text-sm font-bold text-slate-800 truncate">
                      {largestAsset ? largestAsset.name : "N/A"}
                    </div>
                    <div className="text-xs text-slate-600">
                      Rp {(largestAsset?.currentEstimatedValue || largestAsset?.value || 0).toLocaleString("id-ID")}
                    </div>
                  </div>
                </div>

                {/* Space filler untuk push footer ke bawah */}
                <div className="flex-1"></div>

                {/* Footer */}
                <div className="pt-4 border-t border-slate-200/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Updated just now</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                      <span className="text-xs font-medium text-slate-700">All active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* ===== CARD KANAN: BREAKDOWN - TANPA SCROLL ===== */}
          <div className="relative bg-gradient-to-br from-emerald-50 via-white to-emerald-100/30 rounded-2xl p-6 shadow-lg border border-emerald-200/50 
            h-[480px] min-h-[480px] max-h-[480px] overflow-hidden flex flex-col">
            
            <div className="absolute bottom-0 right-0 w-28 h-28 bg-gradient-to-br from-emerald-300/10 to-teal-200/10 rounded-full translate-x-14 translate-y-14"></div>
            
            <div className="relative z-10 flex-1 flex flex-col">
              
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-xl text-white">📊</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Assets Breakdown</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Current value distribution by category</p>
                </div>
              </div>

              {/* Chart dan Summary - TANPA SCROLL */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex flex-col md:flex-row gap-3 h-full">
                  
                  {/* Chart Section */}
                  <div className="flex-1 bg-white/50 rounded-xl p-3 border border-slate-200/50 shadow-inner">
                    <div className="w-full h-full flex items-center justify-center">
                      <AssetChart data={chartData} />
                    </div>
                  </div>

                  {/* Summary Items - TANPA SCROLL, SPACING DIKECIL */}
                  <div className="flex-1 bg-white/30 rounded-xl p-3 border border-slate-200/50 shadow-inner overflow-hidden">
                    <div className="space-y-1">
                      {chartData.map(item => {
                        const categoryDataItem = categoryData.find(cat => cat.category === item.key);
                        return (
                          <SummaryItem 
                            key={item.key}
                            label={item.label} 
                            value={item.value} 
                            color={getAssetColorClass(item.key)}
                            plData={categoryDataItem ? {
                              plAmount: categoryDataItem.plAmount,
                              plPercentage: categoryDataItem.plPercentage,
                              isProfit: categoryDataItem.plAmount >= 0
                            } : null}
                          />
                        );
                      })}
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

      <div className="pt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Assets List</h2>
            <p className="text-slate-600 text-sm font-medium mt-1">
              {sortedAssets.length} asset{sortedAssets.length !== 1 ? 's' : ''} registered
              {filterCategory !== "all" && (
                <span className="text-blue-600 font-semibold ml-2">
                  (Filtered: {formatCategoryTitle(filterCategory)})
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
              filterCategory={filterCategory}
              setFilterCategory={setFilterCategory}
              isOpen={filterOpen}
              setIsOpen={setFilterOpen}
              categoryOptions={categoryOptions}
            />
          </div>
        </div>

        <div className="space-y-10">
          {properties.length > 0 && (
            <Section title="Property" data={properties} onEdit={onEdit} />
          )}

          {vehicles.length > 0 && (
            <Section title="Vehicle" data={vehicles} onEdit={onEdit} />
          )}

          {golds.length > 0 && (
            <Section title="Gold" data={golds} onEdit={onEdit} />
          )}

          {lands.length > 0 && (
            <Section title="Land" data={lands} onEdit={onEdit} />
          )}

          {gadgets.length > 0 && (
            <Section title="Gadget" data={gadgets} onEdit={onEdit} />
          )}
        </div>

        {sortedAssets.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-2xl mt-8 bg-gradient-to-b from-white to-slate-50/50">
            <div className="text-6xl mb-4 text-slate-300">🏠</div>
            <h3 className="text-xl font-bold mb-3 text-slate-800">
              {assets.length === 0 ? "No Assets Yet" : "No Assets Match Your Filter"}
            </h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              {assets.length === 0 
                ? "Start your asset management by creating your first asset" 
                : "Try adjusting your filter settings to see more results"}
            </p>
            <button
              onClick={() => {
                if (assets.length === 0) {
                  setShowModal(true);
                } else {
                  setFilterCategory("all");
                }
              }}
              className="group bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 px-6 py-3 rounded-lg font-semibold text-white transition-all shadow-md hover:shadow-lg hover:scale-[1.02]"
            >
              {assets.length === 0 ? "Create First Asset" : "Clear All Filters"}
            </button>
          </div>
        )}

        {sortedAssets.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-300/50">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="px-3 py-1.5 bg-gradient-to-r from-slate-100 to-white rounded-lg">
                  <span className="font-bold text-slate-900">{sortedAssets.length}</span>
                  <span className="text-slate-600 ml-1">
                    asset{sortedAssets.length !== 1 ? 's' : ''} total
                  </span>
                  {filterCategory !== "all" && (
                    <span className="ml-3 px-2 py-1 bg-gradient-to-r from-blue-100 to-blue-50 text-blue-600 font-semibold text-xs rounded-md">
                      Filtered: {formatCategoryTitle(filterCategory)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                {properties.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-gradient-to-br from-[#E6B89C] to-[#F8D5B9] rounded-full shadow-sm"></div>
                    <span className="text-slate-700 text-sm font-medium">Property: {properties.length}</span>
                  </div>
                )}
                {vehicles.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-gradient-to-br from-[#B8B0A2] to-[#D4CFC7] rounded-full shadow-sm"></div>
                    <span className="text-slate-700 text-sm font-medium">Vehicle: {vehicles.length}</span>
                  </div>
                )}
                {golds.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-gradient-to-br from-[#F0C14B] to-[#FFD97D] rounded-full shadow-sm"></div>
                    <span className="text-slate-700 text-sm font-medium">Gold: {golds.length}</span>
                  </div>
                )}
                {lands.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-gradient-to-br from-[#D4A574] to-[#E6C9A8] rounded-full shadow-sm"></div>
                    <span className="text-slate-700 text-sm font-medium">Land: {lands.length}</span>
                  </div>
                )}
                {gadgets.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-gradient-to-br from-[#A89F95] to-[#C7BFB5] rounded-full shadow-sm"></div>
                    <span className="text-slate-700 text-sm font-medium">Gadget: {gadgets.length}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showModal && (
          <AddAssetModal
            editAsset={editAsset}
            onClose={handleModalClose}
          />
        )}
      </div>
    </div>
  );
}