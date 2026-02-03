// src/pages/Accounts.jsx
import { useEffect, useState } from "react";
import { ChevronDown, Filter, SortAsc } from "lucide-react";
import AddAccountModal from "../components/accounts/AddAccountModal";
import AccountCard from "../components/accounts/AccountCard";
import AccountChart from "../components/accounts/AccountChart";
import { getAccounts } from "../services/storage";

/* ================= IMPORT UTILS ================= */
import {
  getMappedType,
  formatTypeTitle,
  TYPE_OPTIONS
} from "../utils/accountUtils";

/* ======================
   SORT & FILTER COMPONENTS
====================== */
function SortDropdown({ sortBy, setSortBy, isOpen, setIsOpen }) {
  const sortOptions = [
    { id: "balance-high", label: "Balance: High to Low" },
    { id: "balance-low", label: "Balance: Low to High" },
    { id: "name-asc", label: "Name: A to Z" },
    { id: "name-desc", label: "Name: Z to A" },
    { id: "date-new", label: "Date: Newest First" },
    { id: "date-old", label: "Date: Oldest First" },
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
   SECTION COMPONENT (SIMPLE TANPA COUNTER)
====================== */
function Section({ title, data, onEdit }) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-cyan-400 rounded-full"></div>
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {data.map(acc => (
          <AccountCard
            key={acc.id}
            acc={acc}
            onEdit={() => onEdit(acc)}
          />
        ))}
      </div>
    </div>
  );
}

/* ======================
   SUMMARY ITEM (UPDATE WARNA UNTUK MATCH CHART)
====================== */
function SummaryItem({ label, value, color }) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/50 transition-all group">
      <div className={`w-4 h-4 rounded-full ${color} ring-2 ring-white ring-offset-2 shadow-sm`} />
      <span className="text-sm font-medium text-slate-700 flex-1">{label}</span>
      <span className="font-bold text-slate-900 text-sm bg-white/50 px-3 py-1.5 rounded-lg">
        Rp {value.toLocaleString("id-ID")}
      </span>
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

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editAccount, setEditAccount] = useState(null);
  
  // State untuk Sort & Filter
  const [sortBy, setSortBy] = useState("balance-high");
  const [filterType, setFilterType] = useState("all");
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  function loadAccounts() {
    try {
      const loadedAccounts = getAccounts();
      // Validasi: pastikan selalu array
      if (Array.isArray(loadedAccounts)) {
        setAccounts(loadedAccounts);
      } else {
        console.error('getAccounts() returned non-array:', loadedAccounts);
        setAccounts([]);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
      setAccounts([]);
    }
  }

  useEffect(() => {
    loadAccounts();
    window.addEventListener("accountsUpdated", loadAccounts);
    return () =>
      window.removeEventListener("accountsUpdated", loadAccounts);
  }, []);

  /* ======================
     SORTING FUNCTION - DIPERBAIKI
  ====================== */
  function sortAccounts(accountsList) {
    // FIX: Validasi input sebelum menggunakan spread operator
    if (!accountsList || !Array.isArray(accountsList)) {
      console.warn('sortAccounts received non-array:', accountsList);
      return [];
    }
    
    // Buat salinan array untuk diurutkan
    const sorted = [...accountsList];
    
    switch(sortBy) {
      case "balance-high":
        return sorted.sort((a, b) => 
          (Number(b.balance) || 0) - (Number(a.balance) || 0)
        );
      case "balance-low":
        return sorted.sort((a, b) => 
          (Number(a.balance) || 0) - (Number(b.balance) || 0)
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
          new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
      case "date-old":
        return sorted.sort((a, b) => 
          new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
        );
      default:
        return sorted;
    }
  }

  /* ======================
     FILTERING FUNCTION - DIPERBAIKI
  ====================== */
  function filterAccounts(accountsList) {
    // FIX: Validasi input
    if (!accountsList || !Array.isArray(accountsList)) {
      return [];
    }
    
    if (filterType === "all") return accountsList;
    return accountsList.filter(account => 
      getMappedType(account.type) === filterType
    );
  }

  /* ======================
     PROCESS DATA DENGAN FILTER & SORT
  ====================== */
  // Pastikan accounts adalah array valid
  const accountsArray = Array.isArray(accounts) ? accounts : [];
  
  // 1. Filter dulu berdasarkan type
  const filteredAccounts = filterAccounts(accountsArray);
  
  // 2. Sort hasil filter
  const sortedAccounts = sortAccounts(filteredAccounts);
  
  // 3. Group berdasarkan type untuk ditampilkan
  const banks = Array.isArray(sortedAccounts) 
    ? sortedAccounts.filter(a => getMappedType(a.type) === "bank")
    : [];
    
  const digitalBanks = Array.isArray(sortedAccounts)
    ? sortedAccounts.filter(a => getMappedType(a.type) === "digital-bank")
    : [];
    
  const ewallets = Array.isArray(sortedAccounts)
    ? sortedAccounts.filter(a => getMappedType(a.type) === "e-wallet")
    : [];
    
  const cashes = Array.isArray(sortedAccounts)
    ? sortedAccounts.filter(a => getMappedType(a.type) === "cash")
    : [];
    
  const loans = Array.isArray(sortedAccounts)
    ? sortedAccounts.filter(a => getMappedType(a.type) === "loans")
    : [];

  /* ======================
     TOTALS (SEMUA POSITIF)
  ====================== */
  const totalBank = banks.reduce((s, a) => s + Number(a.balance || 0), 0);
  const totalDigitalBank = digitalBanks.reduce(
    (s, a) => s + Number(a.balance || 0),
    0
  );
  const totalEwallet = ewallets.reduce(
    (s, a) => s + Number(a.balance || 0),
    0
  );
  const totalCash = cashes.reduce(
    (s, a) => s + Number(a.balance || 0),
    0
  );
  const totalLoans = loans.reduce(
    (s, a) => s + Number(a.balance || 0),
    0
  );

  /* ======================
     TOTAL BALANCE
  ====================== */
  const totalBalance =
    totalBank +
    totalDigitalBank +
    totalEwallet +
    totalCash +
    totalLoans;

  /* ======================
     CALCULATE METRICS
  ====================== */
  const sortedAccountsLength = Array.isArray(sortedAccounts) ? sortedAccounts.length : 0;
  
  const averageBalance = sortedAccountsLength > 0 
    ? Math.round(totalBalance / sortedAccountsLength)
    : 0;
  
  const bankPercentage = totalBalance > 0 
    ? Math.round((totalBank / totalBalance) * 100)
    : 0;
  
  // Find largest account
  const largestAccount = sortedAccountsLength > 0 && Array.isArray(sortedAccounts)
    ? sortedAccounts.reduce((max, acc) => 
        Number(acc.balance || 0) > Number(max.balance || 0) ? acc : max
      )
    : null;

  // Type options untuk filter dropdown - GUNAKAN DARI UTILS
  const typeOptions = TYPE_OPTIONS;

  const onEdit = (acc) => {
    if (!acc) return;
    setEditAccount(acc);
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
        {/* ===== HEADER TITLE & BUTTON ===== */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Accounts
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">
              Your financial accounts dashboard
            </p>
          </div>

          <button
            onClick={() => {
              setEditAccount(null);
              setShowModal(true);
            }}
            className="group relative bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"></div>
            <span className="relative flex items-center gap-2">
              <span className="text-base">+</span> Add New Account
            </span>
          </button>
        </div>

        {/* ===== DUA CARD UTAMA - UKURAN FIX TIDAK BERUBAH ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-5">
          
          {/* ===== CARD KIRI: TOTAL BALANCE - PERBAIKAN: HAPUS SCROLL ===== */}
          <div className="relative bg-gradient-to-br from-blue-50 via-white to-blue-100/30 rounded-2xl p-6 shadow-lg border border-blue-200/50 
  h-[480px] min-h-[480px] max-h-[480px] overflow-hidden flex flex-col">
            
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-cyan-300/10 rounded-full -translate-y-12 translate-x-12"></div>
            
            {/* Main content TANPA overflow hidden */}
            <div className="relative z-10 flex-1 flex flex-col">
              
              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-xl text-white">💰</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Total Balance</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Overall account balance</p>
                </div>
              </div>

              {/* Balance amount */}
              <div className="mb-5">
                <div className="text-center">
                  <div className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
                    Rp {totalBalance.toLocaleString("id-ID")}
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-full mb-4">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                    <span className="text-xs font-medium text-emerald-700">
                      {sortedAccountsLength} account{sortedAccountsLength !== 1 ? 's' : ''} registered
                    </span>
                  </div>
                </div>

                {/* Metrics - PERBAIKAN: TANPA SCROLL, ATUR SPACING BIAR MUAT */}
                <div className="space-y-2.5 mt-4">
                  <MetricItem 
                    icon="📈"
                    label="Net Worth Growth" 
                    value="+2.5%" 
                    trend="this month"
                  />
                  <MetricItem 
                    icon="📊"
                    label="Average Balance" 
                    value={`Rp ${averageBalance.toLocaleString("id-ID")}`}
                  />
                  <MetricItem 
                    icon="🏦"
                    label="Largest Account" 
                    value={largestAccount ? largestAccount.name : "N/A"}
                    trend={largestAccount ? `Rp ${Number(largestAccount.balance || 0).toLocaleString("id-ID")}` : ""}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200/50 mt-auto">
                <span className="text-xs text-slate-500">Updated just now</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                  <span className="text-xs font-medium text-slate-700">All active</span>
                </div>
              </div>
            </div>
          </div>

          {/* ===== CARD KANAN: BREAKDOWN - PERBAIKAN: HAPUS SCROLL & TEKS ===== */}
          <div className="relative bg-gradient-to-br from-emerald-50 via-white to-emerald-100/30 rounded-2xl p-6 shadow-lg border border-emerald-200/50 
  h-[480px] min-h-[480px] max-h-[480px] overflow-hidden flex flex-col">
            
            {/* Background decoration */}
            <div className="absolute bottom-0 right-0 w-28 h-28 bg-gradient-to-br from-emerald-300/10 to-teal-200/10 rounded-full translate-x-14 translate-y-14"></div>
            
            {/* Main content */}
            <div className="relative z-10 flex-1 flex flex-col">
              
              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-xl text-white">📊</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Balance Breakdown</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Distribution by category</p>
                </div>
              </div>

              {/* Chart dan Summary - TINGGI FLEKSIBEL */}
              <div className="flex-1 flex flex-col">
                <div className="flex flex-col md:flex-row gap-4 h-full">
                  
                  {/* Chart */}
                  <div className="flex-1 bg-white/50 rounded-xl p-4 border border-slate-200/50 shadow-inner">
                    <div className="w-full h-full flex items-center justify-center">
                      <AccountChart
                        cash={totalCash}
                        bank={totalBank}
                        digitalbank={totalDigitalBank}
                        ewallet={totalEwallet}
                        loan={totalLoans}
                      />
                    </div>
                  </div>

                  {/* Summary Items - PERBAIKAN: TANPA SCROLL, JARAK DIPERKECIL */}
                  <div className="flex-1 bg-white/30 rounded-xl p-4 border border-slate-200/50 shadow-inner">
                    <div className="w-full space-y-1">
                      <SummaryItem 
                        label="Bank" 
                        value={totalBank} 
                        color="bg-gradient-to-br from-[#0033CC] to-[#0A5FFF]" 
                      />
                      <SummaryItem 
                        label="Digital Bank" 
                        value={totalDigitalBank} 
                        color="bg-gradient-to-br from-[#0D9488] to-[#2DD4BF]" 
                      />
                      <SummaryItem 
                        label="E-Wallet" 
                        value={totalEwallet} 
                        color="bg-gradient-to-br from-[#15803D] to-[#4ADE80]" 
                      />
                      {/* HANYA TAMPILKAN JIKA ADA SALDO CASH */}
                      {totalCash > 0 && (
                        <SummaryItem 
                          label="Cash" 
                          value={totalCash} 
                          color="bg-gradient-to-br from-[#1D4ED8] to-[#60A5FA]" 
                        />
                      )}
                      {/* HANYA TAMPILKAN JIKA ADA SALDO LOANS */}
                      {totalLoans > 0 && (
                        <SummaryItem 
                          label="Loans" 
                          value={totalLoans} 
                          color="bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6]" 
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer info - PERBAIKAN: HAPUS TEKS YANG MERUSAK ESTETIKA */}
              <div className="pt-4 mt-3 border-t border-slate-200/50">
                <div className="text-xs text-slate-500 text-center">
                  {/* Teks dihapus sesuai permintaan */}
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
            <h2 className="text-xl font-bold text-slate-800">Accounts List</h2>
            <p className="text-slate-600 text-sm font-medium mt-1">
              {sortedAccountsLength} account{sortedAccountsLength !== 1 ? 's' : ''} registered
              {filterType !== "all" && (
                <span className="text-blue-600 font-semibold ml-2">
                  (Filtered: {formatTypeTitle(filterType)})
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

        {/* ===== ACCOUNTS LIST DENGAN FILTER & SORT ===== */}
        <div className="space-y-10">
          {banks.length > 0 && (
            <Section title="Bank" data={banks} onEdit={onEdit} />
          )}

          {digitalBanks.length > 0 && (
            <Section title="Digital Bank" data={digitalBanks} onEdit={onEdit} />
          )}

          {ewallets.length > 0 && (
            <Section title="E-Wallet" data={ewallets} onEdit={onEdit} />
          )}

          {cashes.length > 0 && (
            <Section title="Cash" data={cashes} onEdit={onEdit} />
          )}

          {loans.length > 0 && (
            <Section title="Loans" data={loans} onEdit={onEdit} />
          )}
        </div>

        {/* Empty State dengan kondisi filter */}
        {sortedAccountsLength === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-2xl mt-8 bg-gradient-to-b from-white to-slate-50/50">
            <div className="text-6xl mb-4 text-slate-300">🏦</div>
            <h3 className="text-xl font-bold mb-3 text-slate-800">
              {accountsArray.length === 0 ? "No Accounts Yet" : "No Accounts Match Your Filter"}
            </h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              {accountsArray.length === 0 
                ? "Start your financial journey by creating your first account" 
                : "Try adjusting your filter settings to see more results"}
            </p>
            <button
              onClick={() => {
                if (accountsArray.length === 0) {
                  setShowModal(true);
                } else {
                  setFilterType("all");
                }
              }}
              className="group bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 px-6 py-3 rounded-lg font-semibold text-white transition-all shadow-md hover:shadow-lg hover:scale-[1.02]"
            >
              {accountsArray.length === 0 ? "Create First Account" : "Clear All Filters"}
            </button>
          </div>
        )}

        {/* Footer dengan info filtered/sorted */}
        {sortedAccountsLength > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-300/50">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="px-3 py-1.5 bg-gradient-to-r from-slate-100 to-white rounded-lg">
                  <span className="font-bold text-slate-900">{sortedAccountsLength}</span>
                  <span className="text-slate-600 ml-1">
                    account{sortedAccountsLength !== 1 ? 's' : ''} total
                  </span>
                  {filterType !== "all" && (
                    <span className="ml-3 px-2 py-1 bg-gradient-to-r from-blue-100 to-blue-50 text-blue-600 font-semibold text-xs rounded-md">
                      Filtered: {formatTypeTitle(filterType)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-gradient-to-br from-[#0033CC] to-[#0A5FFF] rounded-full shadow-sm"></div>
                  <span className="text-slate-700 text-sm font-medium">Bank: {banks.length}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-gradient-to-br from-[#0D9488] to-[#2DD4BF] rounded-full shadow-sm"></div>
                  <span className="text-slate-700 text-sm font-medium">Digital: {digitalBanks.length}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-gradient-to-br from-[#15803D] to-[#4ADE80] rounded-full shadow-sm"></div>
                  <span className="text-slate-700 text-sm font-medium">E-Wallet: {ewallets.length}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-gradient-to-br from-[#1D4ED8] to-[#60A5FA] rounded-full shadow-sm"></div>
                  <span className="text-slate-700 text-sm font-medium">Cash: {cashes.length}</span>
                </div>
                {/* HANYA TAMPILKAN JIKA ADA AKUN LOANS */}
                {loans.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] rounded-full shadow-sm"></div>
                    <span className="text-slate-700 text-sm font-medium">Loans: {loans.length}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showModal && (
          <AddAccountModal
            editAccount={editAccount}
            onClose={() => {
              setShowModal(false);
              setEditAccount(null);
            }}
          />
        )}
      </div>
    </div>
  );
}