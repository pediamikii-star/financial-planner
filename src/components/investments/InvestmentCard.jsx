import { useState } from "react";
import { Pencil, Trash2, RefreshCw, ExternalLink, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { CRYPTO_LIST } from "../../data/cryptoList";
import { IDX_STOCK_LIST } from "../../data/idxStockList";
import { useInvestmentStore } from "../../stores/investment.store";

export default function InvestmentCard({ investment, onEdit }) {
  const {
    id,
    symbol,
    type,
    quantity = 1,
    buyPrice = 0,
    currentPrice,
    currentValue,
    priceStatus = 'pending',
    buyDate,
    amount = 0,
    interest,
    tenor,
    startDate,
    endDate,
    fundName,
    bankName,
    name,
    notes,
    lastUpdated
  } = investment;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isRefreshingSingle, setIsRefreshingSingle] = useState(false);
  
  const removeInvestment = useInvestmentStore((state) => state.removeInvestment);
  const refreshPrice = useInvestmentStore((state) => state.refreshPrice);
  const updatePrices = useInvestmentStore((state) => state.updatePrices);

  const isCryptoOrStock = type === "crypto" || type === "stock";
  const isReksadana = type === "reksadana";
  const isDeposito = type === "deposito";
  // NOTE: Bond type tidak ada, hanya deposito

  /* ======================
     MANUAL REFRESH (SINGLE)
  ====================== */
  const handleManualRefresh = async () => {
    if (!isCryptoOrStock) return;
    
    try {
      setIsRefreshingSingle(true);
      await refreshPrice(id);
    } catch (error) {
      console.error("Manual refresh failed:", error);
    } finally {
      setIsRefreshingSingle(false);
    }
  };

  /* ======================
     META DATA
  ====================== */
  const meta = type === "crypto"
    ? CRYPTO_LIST.find((c) => c.symbol === symbol)
    : IDX_STOCK_LIST.find((s) => s.symbol === symbol);

  const displayName = isReksadana ? fundName || "Reksadana" :
                     isDeposito ? bankName || "Deposito" :
                     meta?.name || name || symbol || "Investment";

  /* ======================
     CALCULATION
  ====================== */
  const investedValue = isCryptoOrStock
    ? Number(buyPrice) * Number(quantity)
    : Number(amount);

  const calculatedCurrentValue = currentValue !== null && currentValue !== undefined
    ? currentValue
    : (isCryptoOrStock && currentPrice)
      ? currentPrice * Number(quantity)
      : isDeposito
        ? calculateDepositoValue()
        : Number(amount);

  function calculateDepositoValue() {
    const principal = Number(amount);
    const rate = Number(interest) / 100;
    
    let years = 1;
    if (tenor === "6m") years = 0.5;
    if (tenor === "3m") years = 0.25;
    if (tenor === "1m") years = 1 / 12;
    
    const interestValue = principal * rate * years;
    return principal + interestValue;
  }

  const pnl = calculatedCurrentValue - investedValue;
  const pnlPercent = investedValue > 0 ? (pnl / investedValue) * 100 : 0;
  const isProfit = pnl >= 0;

  /* ======================
     PRICE STATUS DISPLAY
  ====================== */
  const getPriceStatusConfig = () => {
    switch(priceStatus) {
      case 'updated':
        return {
          icon: <CheckCircle size={12} />,
          text: 'Updated',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'failed':
        return {
          icon: <AlertCircle size={12} />,
          text: 'Update Failed',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'pending':
        return {
          icon: <Clock size={12} />,
          text: 'Pending Update',
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200'
        };
      case 'static':
        return {
          icon: null,
          text: 'Fixed Value',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
      default:
        return {
          icon: <Clock size={12} />,
          text: 'Unknown',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const priceStatusConfig = getPriceStatusConfig();

  /* ======================
     FORMATTING HELPERS
  ====================== */
  const getTenorDisplay = (tenor) => {
    switch(tenor) {
      case "1m": return "1 Bulan";
      case "3m": return "3 Bulan";
      case "6m": return "6 Bulan";
      case "12m": return "12 Bulan";
      default: return tenor;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return "-";
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "Never";
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
      return `${Math.floor(diffMins / 1440)}d ago`;
    } catch {
      return "Invalid date";
    }
  };

  /* ======================
     TYPE CONFIGURATION
  ====================== */
  const getTypeConfig = () => {
    const baseConfig = {
      bgGradient: "from-gray-50 to-white",
      borderColor: "border-gray-100",
      badgeColor: "bg-gray-100 text-gray-800 border-gray-200",
      textColor: "text-gray-700",
      valueColor: "text-gray-800",
      darkTextColor: "text-gray-900",
      profitColor: "text-green-600",
      lossColor: "text-red-500",
      hoverBg: "hover:bg-gray-100",
      hoverText: "hover:text-gray-800",
      buttonBorder: "border-gray-200",
      buttonHoverBorder: "hover:border-gray-300"
    };

    const configs = {
      "stock": {
        ...baseConfig,
        display: "Stock",
        bgGradient: "from-blue-50 to-white",
        borderColor: "border-blue-100",
        badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
        textColor: "text-blue-700",
        valueColor: "text-blue-800",
        darkTextColor: "text-blue-900",
        hoverBg: "hover:bg-blue-100",
        hoverText: "hover:text-blue-800",
        buttonBorder: "border-blue-200",
        buttonHoverBorder: "hover:border-blue-300"
      },
      "crypto": {
        ...baseConfig,
        display: "Crypto",
        bgGradient: "from-purple-50 to-white",
        borderColor: "border-purple-100",
        badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
        textColor: "text-purple-700",
        valueColor: "text-purple-800",
        darkTextColor: "text-purple-900",
        hoverBg: "hover:bg-purple-100",
        hoverText: "hover:text-purple-800",
        buttonBorder: "border-purple-200",
        buttonHoverBorder: "hover:border-purple-300"
      },
      "reksadana": {
        ...baseConfig,
        display: "Reksadana",
        bgGradient: "from-green-50 to-white",
        borderColor: "border-green-100",
        badgeColor: "bg-green-100 text-green-800 border-green-200",
        textColor: "text-green-700",
        valueColor: "text-green-800",
        darkTextColor: "text-green-900",
        hoverBg: "hover:bg-green-100",
        hoverText: "hover:text-green-800",
        buttonBorder: "border-green-200",
        buttonHoverBorder: "hover:border-green-300"
      },
      "deposito": {
        ...baseConfig,
        display: "Deposito",
        bgGradient: "from-amber-50 to-white",
        borderColor: "border-amber-100",
        badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
        textColor: "text-amber-700",
        valueColor: "text-amber-800",
        darkTextColor: "text-amber-900",
        hoverBg: "hover:bg-amber-100",
        hoverText: "hover:text-amber-800",
        buttonBorder: "border-amber-200",
        buttonHoverBorder: "hover:border-amber-300"
      }
    };

    return configs[type] || configs.stock;
  };

  const typeConfig = getTypeConfig();

  /* ======================
     EXTERNAL LINKS
  ====================== */
  const getExternalLink = () => {
    if (type === "crypto") {
      return `https://www.coingecko.com/en/coins/${symbol.toLowerCase()}`;
    }
    if (type === "stock") {
      return `https://www.google.com/finance/quote/${symbol}:IDX`;
    }
    return null;
  };

  const externalLink = getExternalLink();

  /* ======================
     HANDLE DELETE
  ====================== */
  const handleDelete = () => {
    if (showDeleteConfirm) {
      removeInvestment(id);
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => {
        setShowDeleteConfirm(false);
      }, 3000);
    }
  };

  return (
    <div className={`bg-gradient-to-br ${typeConfig.bgGradient} p-4 rounded-xl border ${typeConfig.borderColor} shadow-sm hover:shadow-md transition-shadow relative group`}>
      
      {/* HEADER WITH ACTIONS */}
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className={`font-bold ${typeConfig.darkTextColor} text-lg leading-tight truncate`}>
              {displayName}
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${typeConfig.badgeColor}`}>
              {typeConfig.display}
            </span>
          </div>
          
          {/* PRICE STATUS BADGE */}
          {isCryptoOrStock && priceStatus !== 'static' && (
            <div className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${priceStatusConfig.borderColor} ${priceStatusConfig.bgColor} ${priceStatusConfig.color} mt-1`}>
              {priceStatusConfig.icon}
              <span>{priceStatusConfig.text}</span>
              {lastUpdated && priceStatus === 'updated' && (
                <span className="text-xs opacity-75 ml-1">
                  {formatTimeAgo(lastUpdated)}
                </span>
              )}
            </div>
          )}
          
          <p className={`text-xs ${typeConfig.textColor} mt-0.5 truncate`}>
            {meta?.name || symbol || "Investment"}
            {lastUpdated && priceStatus !== 'updated' && (
              <span className="text-gray-500 ml-2">
                Last: {formatDate(lastUpdated)}
              </span>
            )}
          </p>
        </div>
        
        {/* ACTION BUTTONS */}
        <div className="flex gap-1 shrink-0 ml-2">
          {externalLink && (
            <a
              href={externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-1.5 rounded-lg transition-all duration-200 border ${typeConfig.buttonBorder} ${typeConfig.textColor} hover:${typeConfig.hoverBg} hover:${typeConfig.hoverText} hover:${typeConfig.buttonHoverBorder} hover:scale-105 active:scale-95 shadow-sm hover:shadow-md`}
              title="View details"
            >
              <ExternalLink size={12} strokeWidth={2} />
            </a>
          )}
          
          {isCryptoOrStock && (
            <button 
              onClick={handleManualRefresh}
              disabled={isRefreshingSingle}
              className={`p-1.5 rounded-lg transition-all duration-200 border ${typeConfig.buttonBorder} ${typeConfig.textColor} hover:${typeConfig.hoverBg} hover:${typeConfig.hoverText} hover:${typeConfig.buttonHoverBorder} hover:scale-105 active:scale-95 shadow-sm hover:shadow-md ${isRefreshingSingle ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Refresh price"
            >
              <RefreshCw size={12} strokeWidth={2} className={isRefreshingSingle ? 'animate-spin' : ''} />
            </button>
          )}
          
          <button 
            onClick={onEdit}
            className={`p-1.5 rounded-lg transition-all duration-200 border ${
              showDeleteConfirm
                ? "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"
                : `${typeConfig.buttonBorder} ${typeConfig.textColor} hover:${typeConfig.hoverBg} hover:${typeConfig.hoverText} hover:${typeConfig.buttonHoverBorder} hover:scale-105 active:scale-95 shadow-sm hover:shadow-md`
            }`}
            title="Edit Investment"
            disabled={showDeleteConfirm}
          >
            <Pencil size={12} strokeWidth={2} />
          </button>
          
          <button 
            onClick={handleDelete}
            className={`p-1.5 rounded-lg transition-all duration-200 border ${
              showDeleteConfirm 
                ? "bg-red-600 text-white border-red-700" 
                : `border-red-200 text-red-400 hover:text-red-600 hover:bg-red-50 hover:border-red-300`
            } hover:scale-105 active:scale-95 shadow-sm hover:shadow-md`}
            title={showDeleteConfirm ? "Click again to confirm delete" : "Delete Investment"}
          >
            <Trash2 size={12} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* CURRENT VALUE */}
      <div className="mb-4">
        <p className={`font-bold ${typeConfig.valueColor} text-xl`}>
          Rp {calculatedCurrentValue.toLocaleString("id-ID")}
        </p>
        <p className={`text-sm ${typeConfig.textColor}`}>
          {isDeposito ? "Maturity Value" : 
           isReksadana ? "Current Value" : 
           "Current Value"}
          
          {/* PRICE ERROR DISPLAY */}
          {isCryptoOrStock && priceStatus === 'failed' && (
            <span className="text-red-500 text-xs ml-2">(Price update failed)</span>
          )}
        </p>
      </div>

      {/* DETAILS GRID */}
      <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
        {/* STOCK & CRYPTO DETAILS */}
        {isCryptoOrStock && (
          <>
            <div>
              <p className={`text-xs ${typeConfig.textColor} mb-1`}>Buy Price</p>
              <p className={`${typeConfig.valueColor} font-medium`}>
                Rp {Number(buyPrice).toLocaleString("id-ID")}
              </p>
            </div>

            <div>
              <p className={`text-xs ${typeConfig.textColor} mb-1 flex items-center gap-1`}>
                Current Price
                {priceStatus === 'pending' && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                )}
              </p>
              <p className={`${typeConfig.valueColor} font-medium`}>
                {currentPrice !== null && currentPrice !== undefined ? (
                  currentPrice > 0 ? (
                    `Rp ${currentPrice.toLocaleString("id-ID")}`
                  ) : (
                    <span className="text-gray-500 text-xs">Market Closed</span>
                  )
                ) : priceStatus === 'pending' ? (
                  <span className="text-gray-500 text-xs">Updating...</span>
                ) : (
                  <span className="text-gray-500 text-xs">Not available</span>
                )}
              </p>
            </div>

            <div>
              <p className={`text-xs ${typeConfig.textColor} mb-1`}>Quantity</p>
              <p className={`${typeConfig.valueColor} font-medium`}>{quantity}</p>
            </div>

            <div>
              <p className={`text-xs ${typeConfig.textColor} mb-1`}>Invest Date</p>
              <p className={`${typeConfig.valueColor} font-medium text-xs`}>
                {formatDate(buyDate)}
              </p>
            </div>
          </>
        )}

        {/* REKSADANA DETAILS */}
        {isReksadana && (
          <>
            <div className="col-span-2">
              <p className={`text-xs ${typeConfig.textColor} mb-1`}>Fund Name</p>
              <p className={`${typeConfig.valueColor} font-medium truncate`}>
                {fundName || "-"}
              </p>
            </div>

            <div>
              <p className={`text-xs ${typeConfig.textColor} mb-1`}>Amount</p>
              <p className={`${typeConfig.valueColor} font-medium`}>
                Rp {Number(amount).toLocaleString("id-ID")}
              </p>
            </div>

            <div>
              <p className={`text-xs ${typeConfig.textColor} mb-1`}>Invest Date</p>
              <p className={`${typeConfig.valueColor} font-medium text-xs`}>
                {formatDate(buyDate)}
              </p>
            </div>
          </>
        )}

        {/* DEPOSITO DETAILS */}
        {isDeposito && (
          <>
            <div className="col-span-2">
              <p className={`text-xs ${typeConfig.textColor} mb-1`}>Bank</p>
              <p className={`${typeConfig.valueColor} font-medium truncate`}>
                {bankName || "-"}
              </p>
            </div>

            <div>
              <p className={`text-xs ${typeConfig.textColor} mb-1`}>Principal</p>
              <p className={`${typeConfig.valueColor} font-medium`}>
                Rp {Number(amount).toLocaleString("id-ID")}
              </p>
            </div>

            <div>
              <p className={`text-xs ${typeConfig.textColor} mb-1`}>Interest Rate</p>
              <p className={`${typeConfig.valueColor} font-medium`}>
                {interest ? `${interest}% p.a.` : "-"}
              </p>
            </div>

            <div>
              <p className={`text-xs ${typeConfig.textColor} mb-1`}>Tenor</p>
              <p className={`${typeConfig.valueColor} font-medium`}>
                {tenor ? getTenorDisplay(tenor) : "-"}
              </p>
            </div>

            <div className="col-span-2">
              <p className={`text-xs ${typeConfig.textColor} mb-1`}>Period</p>
              <p className={`${typeConfig.valueColor} font-medium text-xs truncate`}>
                {startDate ? `${formatDate(startDate)} - ${endDate ? formatDate(endDate) : 'Now'}` : "-"}
              </p>
            </div>
          </>
        )}
      </div>

      {/* PROFIT/LOSS SECTION */}
      {(isCryptoOrStock || isDeposito) && (
        <div className="mb-3 pt-3 border-t border-gray-200">
          <div className="flex justify-between items-center mb-1">
            <span className={`text-sm ${typeConfig.textColor}`}>
              {isDeposito ? "Interest" : "P/L"}
            </span>
            <span
              className={`text-base font-bold ${
                isProfit ? typeConfig.profitColor : typeConfig.lossColor
              }`}
            >
              {isProfit ? "+" : "-"}Rp{" "}
              {Math.abs(pnl).toLocaleString("id-ID")}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className={`text-xs ${typeConfig.textColor}`}>
              {isDeposito ? "Total Return" : "Return"}
            </span>
            <span
              className={`text-sm font-semibold ${
                isProfit ? typeConfig.profitColor : typeConfig.lossColor
              }`}
            >
              {pnlPercent >= 0 ? "+" : ""}{pnlPercent.toFixed(2)}%
            </span>
          </div>
        </div>
      )}

      {/* NOTES */}
      {notes && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className={`text-xs ${typeConfig.textColor} italic line-clamp-2`}>
            📝 {notes}
          </p>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {showDeleteConfirm && (
        <div className="mt-3 pt-3 border-t border-red-200 bg-red-50 rounded p-2">
          <div className="text-xs text-red-600 font-medium text-center">
            Click trash icon again to confirm delete
          </div>
        </div>
      )}
      
      {/* REFRESHING OVERLAY */}
      {isRefreshingSingle && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-xl">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mb-2"></div>
            <span className="text-xs text-gray-600">Refreshing...</span>
          </div>
        </div>
      )}
    </div>
  );
}