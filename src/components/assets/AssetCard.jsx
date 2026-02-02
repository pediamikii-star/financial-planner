import { deleteAsset } from "../../services/storage";
import { Pencil, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { getAssetLogo, ASSET_COLORS } from "../../utils/assetUtils";
import { useState } from "react";

/* ======================
   CATEGORY NORMALIZER
====================== */
function normalizeCategory(category = "") {
  const c = category.toLowerCase();
  if (c.includes("property")) return "property";
  if (c.includes("vehicle")) return "vehicle";
  if (c.includes("gold")) return "gold";
  if (c.includes("land")) return "land";
  if (c.includes("gadget")) return "gadget";
  return "other";
}

/* ======================
   COLOR BY CATEGORY
====================== */
function getColorByCategory(category = "") {
  const normalizedCategory = normalizeCategory(category);
  
  const assetColor = ASSET_COLORS[normalizedCategory];
  
  switch(normalizedCategory) {
    case "property":
      return {
        bgFrom: "from-blue-50",
        bgTo: "to-white",
        border: "border-blue-100",
        textPrimary: "text-blue-900",
        textSecondary: "text-blue-700",
        textValue: "text-blue-800",
        hoverBg: "hover:bg-blue-100",
        hoverText: "hover:text-blue-800",
        dotColor: "bg-blue-500",
        profitBg: "bg-green-50",
        profitText: "text-green-700",
        profitBorder: "border-green-200",
        lossBg: "bg-red-50",
        lossText: "text-red-700",
        lossBorder: "border-red-200"
      };
    case "vehicle":
      return {
        bgFrom: "from-green-50",
        bgTo: "to-white",
        border: "border-green-100",
        textPrimary: "text-green-900",
        textSecondary: "text-green-700",
        textValue: "text-green-800",
        hoverBg: "hover:bg-green-100",
        hoverText: "hover:text-green-800",
        dotColor: "bg-green-500",
        profitBg: "bg-green-50",
        profitText: "text-green-700",
        profitBorder: "border-green-200",
        lossBg: "bg-red-50",
        lossText: "text-red-700",
        lossBorder: "border-red-200"
      };
    case "gold":
      return {
        bgFrom: "from-amber-50",
        bgTo: "to-white",
        border: "border-amber-100",
        textPrimary: "text-amber-900",
        textSecondary: "text-amber-700",
        textValue: "text-amber-800",
        hoverBg: "hover:bg-amber-100",
        hoverText: "hover:text-amber-800",
        dotColor: "bg-yellow-500",
        profitBg: "bg-green-50",
        profitText: "text-green-700",
        profitBorder: "border-green-200",
        lossBg: "bg-red-50",
        lossText: "text-red-700",
        lossBorder: "border-red-200"
      };
    case "land":
      return {
        bgFrom: "from-emerald-50",
        bgTo: "to-white",
        border: "border-emerald-100",
        textPrimary: "text-emerald-900",
        textSecondary: "text-emerald-700",
        textValue: "text-emerald-800",
        hoverBg: "hover:bg-emerald-100",
        hoverText: "hover:text-emerald-800",
        dotColor: "bg-emerald-500",
        profitBg: "bg-green-50",
        profitText: "text-green-700",
        profitBorder: "border-green-200",
        lossBg: "bg-red-50",
        lossText: "text-red-700",
        lossBorder: "border-red-200"
      };
    case "gadget":
      return {
        bgFrom: "from-purple-50",
        bgTo: "to-white",
        border: "border-purple-100",
        textPrimary: "text-purple-900",
        textSecondary: "text-purple-700",
        textValue: "text-purple-800",
        hoverBg: "hover:bg-purple-100",
        hoverText: "hover:text-purple-800",
        dotColor: "bg-purple-500",
        profitBg: "bg-green-50",
        profitText: "text-green-700",
        profitBorder: "border-green-200",
        lossBg: "bg-red-50",
        lossText: "text-red-700",
        lossBorder: "border-red-200"
      };
    default:
      return {
        bgFrom: "from-gray-50",
        bgTo: "to-white",
        border: "border-gray-100",
        textPrimary: "text-gray-900",
        textSecondary: "text-gray-700",
        textValue: "text-gray-800",
        hoverBg: "hover:bg-gray-100",
        hoverText: "hover:text-gray-800",
        dotColor: "bg-gray-500",
        profitBg: "bg-green-50",
        profitText: "text-green-700",
        profitBorder: "border-green-200",
        lossBg: "bg-red-50",
        lossText: "text-red-700",
        lossBorder: "border-red-200"
      };
  }
}

/* ======================
   CALCULATE P/L FOR ASSET
====================== */
function calculatePL(asset) {
  const purchaseValue = asset.value || 0;
  const currentValue = asset.currentEstimatedValue || purchaseValue;
  const plAmount = currentValue - purchaseValue;
  const plPercentage = purchaseValue > 0 ? (plAmount / purchaseValue) * 100 : 0;
  
  return {
    purchaseValue,
    currentValue,
    plAmount,
    plPercentage,
    isProfit: plAmount >= 0,
    hasCurrentValue: asset.currentEstimatedValue !== undefined
  };
}

/* ======================
   FORMAT CURRENCY
====================== */
function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

export default function AssetCard({ asset, onEdit }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [viewMode, setViewMode] = useState('both'); // 'purchase', 'current', 'both'

  const plData = calculatePL(asset);
  const logo = getAssetLogo(asset.category, asset.name);
  const colors = getColorByCategory(asset.category);

  function handleDelete() {
    if (showDeleteConfirm) {
      deleteAsset(asset.id);
      window.dispatchEvent(new Event("assetsUpdated"));
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => {
        setShowDeleteConfirm(false);
      }, 3000);
    }
  }

  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit && typeof onEdit === 'function') {
      onEdit(asset);
    }
  };

  const toggleViewMode = (e) => {
    e.stopPropagation();
    const modes = ['current', 'purchase', 'both'];
    const currentIndex = modes.indexOf(viewMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setViewMode(modes[nextIndex]);
  };

  return (
    <div className={`bg-gradient-to-br ${colors.bgFrom} ${colors.bgTo} p-4 rounded-xl border ${colors.border} shadow-sm hover:shadow-md transition-shadow relative group`}>
      
      {/* ACTION BUTTONS */}
      <div className="absolute top-2 right-2 flex gap-1 z-10">
        {/* VIEW TOGGLE BUTTON */}
        <button 
          onClick={toggleViewMode}
          className={`p-1.5 rounded-lg ${colors.hoverBg} ${colors.textSecondary} ${colors.hoverText} transition-all duration-200 text-opacity-80 hover:text-opacity-100 border ${colors.border} hover:scale-105 active:scale-95 shadow-sm hover:shadow-md`}
          title={`View: ${viewMode === 'current' ? 'Current Value' : viewMode === 'purchase' ? 'Purchase Price' : 'Both'}`}
        >
          {viewMode === 'current' && <TrendingUp size={14} strokeWidth={2} />}
          {viewMode === 'purchase' && <TrendingDown size={14} strokeWidth={2} />}
          {viewMode === 'both' && (
            <div className="flex flex-col items-center justify-center w-3 h-3">
              <div className="w-full h-0.5 bg-current mb-0.5"></div>
              <div className="w-full h-0.5 bg-current"></div>
            </div>
          )}
        </button>
        
        {/* EDIT BUTTON */}
        <button 
          onClick={handleEdit}
          className={`p-1.5 rounded-lg ${colors.hoverBg} ${colors.textSecondary} ${colors.hoverText} transition-all duration-200 text-opacity-80 hover:text-opacity-100 border ${colors.border} hover:scale-105 active:scale-95 shadow-sm hover:shadow-md`}
          title="Edit Asset"
        >
          <Pencil size={14} strokeWidth={2} />
        </button>
        
        {/* DELETE BUTTON */}
        <button 
          onClick={handleDelete}
          className={`p-1.5 rounded-lg transition-all duration-200 border ${
            showDeleteConfirm 
              ? "bg-red-600 text-white border-red-700" 
              : "hover:bg-red-50 text-red-400 hover:text-red-600 border-red-100"
          } hover:scale-105 active:scale-95 shadow-sm hover:shadow-md`}
          title={showDeleteConfirm ? "Click again to confirm delete" : "Delete Asset"}
        >
          <Trash2 size={14} strokeWidth={2} />
        </button>
      </div>

      {/* HEADER */}
      <div className="flex items-center gap-4 pt-1">
        {/* LOGO CONTAINER */}
        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-gray-100 shadow-sm flex-shrink-0">
          <img
            src={logo}
            alt={asset.name}
            className="w-8 h-8 object-contain"
            onError={(e) => {
              e.currentTarget.src = "/images/default-asset.png";
              e.currentTarget.onerror = null;
            }}
          />
        </div>

        {/* INFO */}
        <div className="min-w-0 flex-1">
          <h3 className={`font-semibold ${colors.textPrimary} leading-tight truncate`}>
            {asset.name}
          </h3>
          
          {asset.yearOfPurchase && (
            <p className={`text-xs ${colors.textSecondary} mt-0.5`}>
              Purchase in {asset.yearOfPurchase}
            </p>
          )}
          {asset.location && (
            <p className={`text-xs ${colors.textSecondary} mt-0.5 truncate`}>
              {asset.location}
            </p>
          )}
        </div>
      </div>

      {/* VALUE DISPLAY BASED ON VIEW MODE */}
      <div className="mt-4 space-y-2">
        {viewMode === 'current' && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Current Estimated Value</p>
            <p className={`${colors.textValue} font-bold text-lg`}>
              {formatCurrency(plData.currentValue)}
            </p>
          </div>
        )}
        
        {viewMode === 'purchase' && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Purchase Price</p>
            <p className={`${colors.textValue} font-bold text-lg`}>
              {formatCurrency(plData.purchaseValue)}
            </p>
          </div>
        )}
        
        {viewMode === 'both' && (
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-500 mb-1">Purchase Price</p>
              <p className={`${colors.textValue} font-medium text-base line-through opacity-70`}>
                {formatCurrency(plData.purchaseValue)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Current Estimated Value</p>
              <p className={`${colors.textValue} font-bold text-lg`}>
                {formatCurrency(plData.currentValue)}
              </p>
            </div>
          </div>
        )}
        
        {/* P/L INDICATOR - Show always if has current value */}
        {plData.hasCurrentValue && plData.currentValue !== plData.purchaseValue && (
          <div className={`mt-2 p-2 rounded text-sm font-medium border ${
            plData.isProfit 
              ? `${colors.profitBg} ${colors.profitText} ${colors.profitBorder}` 
              : `${colors.lossBg} ${colors.lossText} ${colors.lossBorder}`
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {plData.isProfit ? (
                  <TrendingUp size={14} strokeWidth={2.5} />
                ) : (
                  <TrendingDown size={14} strokeWidth={2.5} />
                )}
                <span>{plData.isProfit ? 'Profit' : 'Loss'}</span>
              </div>
              <div className="font-semibold">
                {plData.isProfit ? '+' : ''}{formatCurrency(plData.plAmount)} 
                <span className="ml-1 text-xs">
                  ({plData.isProfit ? '+' : ''}{plData.plPercentage.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* INDICATOR IF NO CURRENT VALUE SET */}
        {!plData.hasCurrentValue && (
          <div className="mt-2 p-2 rounded text-sm font-medium bg-gray-50 text-gray-600 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span>⚡</span>
                <span>No current value set</span>
              </div>
              <button 
                onClick={handleEdit}
                className="text-xs text-blue-500 hover:text-blue-600 font-medium"
              >
                Set value
              </button>
            </div>
          </div>
        )}
      </div>

      {/* NOTES */}
      {asset.notes && (
        <p className={`text-xs ${colors.textSecondary} mt-3 pt-2 border-t border-gray-100 line-clamp-2`}>
          {asset.notes}
        </p>
      )}

      {/* ADDITIONAL INFO */}
      {(asset.condition || asset.quantity) && (
        <div className="mt-3 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs">
            {asset.condition && (
              <span className={`${colors.textSecondary}`}>
                Condition: {asset.condition}
              </span>
            )}
            {asset.quantity && (
              <span className={`${colors.textSecondary} font-medium`}>
                {asset.quantity} unit
              </span>
            )}
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MESSAGE */}
      {showDeleteConfirm && (
        <div className="mt-3 pt-2 border-t border-red-200">
          <div className="text-xs text-red-600 font-medium flex items-center gap-1">
            <span>Click trash icon again to confirm delete</span>
          </div>
        </div>
      )}
      
      {/* VIEW MODE INDICATOR */}
      <div className="mt-2 pt-1 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">
          {viewMode === 'current' ? 'Showing current value' : 
           viewMode === 'purchase' ? 'Showing purchase price' : 
           'Showing both values'}
        </p>
      </div>
    </div>
  );
}