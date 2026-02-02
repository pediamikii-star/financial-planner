import { deleteAccount } from "../../services/storage.js";
import { Pencil, Trash2, Clock, ArrowUpRight, ArrowDownLeft, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react"; 
import { transactionStore } from "../../stores/transaction.store";

/* ================= IMPORT UTILS ================= */
import {
  normalizeType,
  normalizeName,
  getColorByType,
  formatCardNumber,
  formatDateOnly,
  getAccountLogo,
  getDebitCardLogo
} from "../../utils/accountUtils";

/* ================= MOCK TRANSACTIONS FALLBACK ================= */
const MOCK_TRANSACTIONS = {
  "BCA": { desc: "Starbucks Senayan City", amount: -85000, time: "Today, 14:30" },
  "BNI": { desc: "Salary Deposit", amount: 4500000, time: "Yesterday, 08:00" },
  "BRI": { desc: "Electricity Bill", amount: -350000, time: "Dec 10, 15:45" },
  "Mandiri": { desc: "Netflix Subscription", amount: -149000, time: "Dec 5, 19:45" },
  "BTN": { desc: "Transfer to Mom", amount: -1000000, time: "Dec 8, 11:20" },
  "CIMB Niaga": { desc: "Online Shopping", amount: -1250000, time: "Today, 10:15" },
  "Danamon": { desc: "ATM Withdrawal", amount: -500000, time: "Dec 9, 16:30" },
  "Maybank": { desc: "Dividend", amount: 250000, time: "Dec 7, 09:00" },
  "OCBC": { desc: "Grocery", amount: -325000, time: "Today, 18:45" },
  "Permata Bank": { desc: "Bonus", amount: 1500000, time: "Yesterday, 12:00" },
  "Panin Bank": { desc: "Gas Station", amount: -200000, time: "Dec 6, 17:30" },
  
  "Bank Jago": { desc: "Gojek Payment", amount: -125000, time: "Today, 09:15" },
  "SeaBank": { desc: "Top Up from BCA", amount: 5000000, time: "Yesterday, 14:20" },
  "Jenius": { desc: "Spotify", amount: -69900, time: "Dec 11, 07:00" },
  "blu": { desc: "Transfer to Friend", amount: -250000, time: "Today, 20:30" },
  "Line Bank": { desc: "Phone Credit", amount: -100000, time: "Dec 9, 13:15" },
  "Neo Commerce": { desc: "Tiket.com", amount: -750000, time: "Yesterday, 19:45" },
  "Allo Bank": { desc: "Investment", amount: 1000000, time: "Dec 8, 10:00" },
  
  "GoPay": { desc: "Food Order", amount: -89000, time: "Today, 12:30" },
  "OVO": { desc: "Shopping Mall", amount: -450000, time: "Yesterday, 16:45" },
  "DANA": { desc: "Top Up", amount: 500000, time: "Dec 10, 08:00" },
  "ShopeePay": { desc: "Shopee Purchase", amount: -320000, time: "Today, 21:15" },
  "LinkAja": { desc: "Toll Road", amount: -75000, time: "Dec 9, 07:30" },
  "iSaku": { desc: "Game Top Up", amount: -149000, time: "Yesterday, 22:00" },
  
  "Wallet": { desc: "Lunch Money", amount: -75000, time: "Today, 13:00" },
  "Save Box": { desc: "Monthly Savings", amount: 1000000, time: "Dec 1, 00:00" },
  "Loans": { desc: "Payment Received", amount: 500000, time: "Dec 10, 11:45" },
};

export default function AccountCard({ acc, onEdit }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [latestTransaction, setLatestTransaction] = useState(null);
  const [showFullCardNumber, setShowFullCardNumber] = useState(false);

  // ================= FETCH LATEST TRANSACTION =================
  useEffect(() => {
    const fetchLatestTransaction = () => {
      const allTransactions = transactionStore.getAll();
      
      if (allTransactions && allTransactions.length > 0) {
        const accountTransactions = allTransactions.filter(t => 
          t.accountId === acc.id || 
          t.accountName === acc.name ||
          t.toAccountId === acc.id ||
          (t.fromAccountName && t.fromAccountName === acc.name)
        );
        
        // PERBAIKAN: Sort berdasarkan createdAt (bukan date saja)
        accountTransactions.sort((a, b) => {
          // createdAt selalu ada (dari transaction.store)
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        const latest = accountTransactions[0];
        
        if (latest) {
          const transactionAmount = latest.amount || 0;
          const transactionType = latest.type || "";
          
          let amount = transactionAmount;
          if (transactionType === "expense") {
            amount = -Math.abs(transactionAmount);
          } else if (transactionType === "income" || transactionType === "topup") {
            amount = Math.abs(transactionAmount);
          } else if (transactionType === "transfer") {
            if (latest.toAccountId === acc.id || latest.toAccountName === acc.name) {
              amount = Math.abs(transactionAmount);
            } else {
              amount = -Math.abs(transactionAmount);
            }
          }
          
          const timestamp = latest.date || latest.createdAt;
          const formattedDate = formatDateOnly(timestamp);
          
          let finalDate = formattedDate;
          if (!finalDate && latest) {
            const now = new Date();
            const randomDaysAgo = Math.floor(Math.random() * 7);
            const randomDate = new Date(now);
            randomDate.setDate(now.getDate() - randomDaysAgo);
            finalDate = formatDateOnly(randomDate.toISOString());
          }
          
          setLatestTransaction({
            desc: latest.category || "Transaction",
            notes: latest.notes || "", // TAMBAHAN: Simpan notes
            amount: amount,
            date: finalDate,
            rawData: latest
          });
          return;
        }
      }
      
      const mockTrans = MOCK_TRANSACTIONS[acc.name];
      if (mockTrans) {
        const now = new Date();
        const randomOffset = Math.floor(Math.random() * 24 * 60 * 60 * 1000 * 3);
        const randomDate = new Date(now.getTime() - randomOffset);
        const formattedDate = formatDateOnly(randomDate.toISOString());
        
        setLatestTransaction({
          ...mockTrans,
          date: formattedDate
        });
      } else {
        setLatestTransaction({
          desc: "No recent activity",
          notes: "",
          amount: 0,
          date: ""
        });
      }
    };
    
    fetchLatestTransaction();
    
    const unsubscribe = transactionStore.subscribe(fetchLatestTransaction);
    return unsubscribe;
  }, [acc.id, acc.name]);

  function handleDelete() {
    if (showDeleteConfirm) {
      deleteAccount(acc.id);
      window.dispatchEvent(new Event("accountsUpdated"));
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => {
        setShowDeleteConfirm(false);
      }, 3000);
    }
  }

  const type = normalizeType(acc.type);
  const nameKey = normalizeName(acc.name);
  const colors = getColorByType(acc.type);

  const logo = getAccountLogo(acc.type, acc.name);
  
  const formattedCardNumber = formatCardNumber(acc.debitCardNumber, showFullCardNumber);
  
  const debitProviderLogo = getDebitCardLogo(acc.debitCardProvider);

  const isBankOrDigitalBank = type === "bank" || type === "digitalbank";

  const shouldShowEyeIcon = isBankOrDigitalBank && acc.debitCardNumber;

  const transaction = latestTransaction || {
    desc: "Loading...",
    notes: "",
    amount: 0,
    date: ""
  };

  // Warna panah berdasarkan tipe transaksi
  const arrowColor = transaction.amount >= 0 ? "text-green-500" : "text-red-500";
  const badgeBgColor = transaction.amount >= 0 ? "bg-green-100" : "bg-red-100";

  return (
    <div className={`bg-gradient-to-br ${colors.bgFrom} ${colors.bgTo} p-4 rounded-xl border ${colors.border} shadow-sm hover:shadow-md transition-shadow relative group`}>
      
      {/* ACTION BUTTONS */}
      <div className="absolute top-2 right-2 flex gap-1">
        {shouldShowEyeIcon && (
          <button 
            onClick={() => setShowFullCardNumber(!showFullCardNumber)}
            className={`p-1.5 rounded-lg border ${colors.border} ${colors.textSecondary} hover:bg-gray-50 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md`}
            title={showFullCardNumber ? "Sembunyikan nomor kartu" : "Tampilkan nomor kartu"}
          >
            {showFullCardNumber ? (
              <EyeOff size={14} strokeWidth={2} />
            ) : (
              <Eye size={14} strokeWidth={2} />
            )}
          </button>
        )}
        
        <button 
          onClick={onEdit}
          className={`p-1.5 rounded-lg ${colors.hoverBg} ${colors.textSecondary} ${colors.hoverText} transition-all duration-200 text-opacity-80 hover:text-opacity-100 border ${colors.border} hover:scale-105 active:scale-95 shadow-sm hover:shadow-md`}
          title="Edit Account"
        >
          <Pencil size={14} strokeWidth={2} />
        </button>
        
        <button 
          onClick={handleDelete}
          className={`p-1.5 rounded-lg transition-all duration-200 border ${
            showDeleteConfirm 
              ? "bg-red-600 text-white border-red-700" 
              : "hover:bg-red-50 text-red-400 hover:text-red-600 border-red-100"
          } hover:scale-105 active:scale-95 shadow-sm hover:shadow-md`}
          title={showDeleteConfirm ? "Click again to confirm delete" : "Delete Account"}
        >
          <Trash2 size={14} strokeWidth={2} />
        </button>
      </div>

      {/* HEADER - BANK NAME & LOGO */}
      <div className="flex items-center gap-4 pt-1">
        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-gray-100 shadow-sm flex-shrink-0">
          <img
            src={logo}
            alt={acc.name}
            className="w-8 h-8 object-contain"
            onError={(e) => {
              e.currentTarget.src = "/images/default-account.png";
              e.currentTarget.onerror = null;
            }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className={`font-semibold ${colors.textPrimary} leading-tight truncate`}>
            {acc.name}
          </h3>
          {acc.detail && (
            <p className={`text-xs ${colors.textSecondary} mt-0.5 truncate`}>
              {acc.detail}
            </p>
          )}
          
          {isBankOrDigitalBank && formattedCardNumber && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 flex-1">
                <span className="text-xs font-mono bg-gray-100 px-3 py-1.5 rounded-md text-gray-700">
                  {formattedCardNumber}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BALANCE SECTION */}
      <div className="flex items-center justify-between mt-4">
        <div>
          <p className={`${colors.textBalance} font-bold text-lg`}>
            Rp {Number(acc.balance || 0).toLocaleString("id-ID")}
          </p>
        </div>

        {debitProviderLogo && (
          <div className="flex flex-col items-center gap-1">
            <img 
              src={debitProviderLogo} 
              alt={acc.debitCardProvider}
              className="w-8 h-8 object-contain"
            />
            <span className="text-xs text-gray-600 font-medium">
              {acc.debitCardProvider}
            </span>
          </div>
        )}
      </div>

      {/* LATEST TRANSACTION SECTION - UPDATED */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <Clock size={12} className="text-gray-400" />
            <span className="text-xs text-gray-500 font-medium">Latest Transaction</span>
          </div>
          
          <span className={`text-xs ${transaction.date ? 'text-gray-400' : 'text-gray-300'}`}>
            {transaction.date || 'No date'}
          </span>
        </div>
        
        <div className="space-y-2">
          {/* KATEGORI DAN ARROW */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-full ${badgeBgColor}`}>
                {transaction.amount >= 0 ? (
                  <ArrowDownLeft size={14} className={arrowColor} />
                ) : (
                  <ArrowUpRight size={14} className={arrowColor} />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 truncate max-w-[140px]">
                  {transaction.desc}
                </p>
              </div>
            </div>
            
            <span className={`font-semibold text-sm ${
              transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {transaction.amount >= 0 ? '+' : ''}
              Rp {Math.abs(transaction.amount).toLocaleString()}
            </span>
          </div>

          {/* NOTES JIKA ADA */}
          {transaction.notes && (
            <div className="ml-9">
              <p className="text-xs text-gray-500 italic line-clamp-1">
                {transaction.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* NOTES ACCOUNT */}
      {acc.notes && (
        <p className={`text-xs ${colors.textSecondary} mt-2 line-clamp-2`}>
          {acc.notes}
        </p>
      )}

      {/* DELETE CONFIRMATION */}
      {showDeleteConfirm && (
        <div className="mt-3 pt-2 border-t border-red-200">
          <div className="text-xs text-red-600 font-medium flex items-center gap-1">
            <span>Click trash icon again to confirm delete</span>
          </div>
        </div>
      )}
    </div>
  );
}