import { logoMap } from "../assets/logos/logoMap";

/* ======================
   TYPE MAPPING
====================== */
const TYPE_MAP = {
  bank: "bank",
  "digital-bank": "digital-bank",
  "e-wallet": "e-wallet",
  cash: "cash",
  loans: "loans",
};

export function getMappedType(type = "") {
  return TYPE_MAP[type] || "unknown";
}

export function formatTypeTitle(key) {
  const map = {
    "bank": "Bank",
    "digital-bank": "Digital Bank",
    "e-wallet": "E-Wallet",
    "cash": "Cash",
    "loans": "Loans",
    "unknown": "Other"
  };
  return map[key] || key.charAt(0).toUpperCase() + key.slice(1);
}

/* ======================
   NORMALIZE TYPE DAN NAME
====================== */
export function normalizeType(type = "") {
  const t = type.toLowerCase().replace(/\s|-/g, "");

  if (t.includes("digitalbank")) return "digitalbank";
  if (t.includes("ewallet")) return "ewallet";
  if (t.includes("loan")) return "loan";
  if (t.includes("bank")) return "bank";
  if (t.includes("cash")) return "cash";

  return "cash";
}

const NAME_ALIAS = {
  may: "maybank",
  permata: "permata",
  paninbank: "panin",
  btnbank: "btn",
  cimb: "cimb",
  bsi: "bsi",

  line: "linebank",
  neo: "neocommerce",
  neobank: "neocommerce",
  allo: "allobank",

  shopee: "shopeepay",
  shope: "shopeepay",
};

export function normalizeName(name = "") {
  const base = name
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");

  return NAME_ALIAS[base] || base;
}

/* ======================
   GET ACCOUNT LOGO
====================== */
export function getAccountLogo(type, accountName) {
  const typeKey = normalizeType(type);
  const nameKey = normalizeName(accountName);

  if (typeKey === "bank" && nameKey.includes("debit")) {
    const providerKey = nameKey.replace("debit", "");
    return logoMap.debit?.[providerKey] || logoMap.debit.default;
  }

  return (
    logoMap[typeKey]?.[nameKey] ||
    logoMap[typeKey]?.default ||
    logoMap.cash.default
  );
}

/* ======================
   GET DEBIT CARD LOGO
====================== */
export function getDebitCardLogo(providerName) {
  if (!providerName) return null;
  
  const providerKey = providerName.toLowerCase().replace(/\s+/g, "");
  return logoMap.debit?.[providerKey] || logoMap.debit.default;
}

/* ======================
   COLOR BY TYPE
====================== */
export function getColorByType(type = "") {
  const normalizedType = normalizeType(type);
  
  switch(normalizedType) {
    case "bank":
      return {
        bgFrom: "from-blue-50",
        bgTo: "to-white",
        border: "border-blue-100",
        textPrimary: "text-blue-900",
        textSecondary: "text-blue-700",
        textBalance: "text-blue-800",
        hoverBg: "hover:bg-blue-100",
        hoverText: "hover:text-blue-800",
        badgeBg: "bg-blue-100",
        badgeText: "text-blue-700"
      };
    case "digitalbank":
      return {
        bgFrom: "from-emerald-50",
        bgTo: "to-white",
        border: "border-emerald-100",
        textPrimary: "text-emerald-900",
        textSecondary: "text-emerald-700",
        textBalance: "text-emerald-800",
        hoverBg: "hover:bg-emerald-100",
        hoverText: "hover:text-emerald-800",
        badgeBg: "bg-emerald-100",
        badgeText: "text-emerald-700"
      };
    case "ewallet":
      return {
        bgFrom: "from-purple-50",
        bgTo: "to-white",
        border: "border-purple-100",
        textPrimary: "text-purple-900",
        textSecondary: "text-purple-700",
        textBalance: "text-purple-800",
        hoverBg: "hover:bg-purple-100",
        hoverText: "hover:text-purple-800",
        badgeBg: "bg-purple-100",
        badgeText: "text-purple-700"
      };
    case "cash":
      return {
        bgFrom: "from-amber-50",
        bgTo: "to-white",
        border: "border-amber-100",
        textPrimary: "text-amber-900",
        textSecondary: "text-amber-700",
        textBalance: "text-amber-800",
        hoverBg: "hover:bg-amber-100",
        hoverText: "hover:text-amber-800",
        badgeBg: "bg-amber-100",
        badgeText: "text-amber-700"
      };
    case "loan":
      return {
        bgFrom: "from-gray-50",
        bgTo: "to-white",
        border: "border-gray-100",
        textPrimary: "text-gray-900",
        textSecondary: "text-gray-700",
        textBalance: "text-gray-800",
        hoverBg: "hover:bg-gray-100",
        hoverText: "hover:text-gray-800",
        badgeBg: "bg-gray-100",
        badgeText: "text-gray-700"
      };
    default:
      return {
        bgFrom: "from-emerald-50",
        bgTo: "to-white",
        border: "border-emerald-100",
        textPrimary: "text-emerald-900",
        textSecondary: "text-emerald-700",
        textBalance: "text-emerald-800",
        hoverBg: "hover:bg-emerald-100",
        hoverText: "hover:text-emerald-800",
        badgeBg: "bg-emerald-100",
        badgeText: "text-emerald-700"
      };
  }
}

/* ======================
   FORMAT CARD NUMBER
====================== */
export function formatCardNumber(cardNumber = "", showFull = false) {
  if (!cardNumber) return null;
  
  const clean = cardNumber.replace(/\D/g, '');
  if (clean.length !== 16) return cardNumber;
  
  if (showFull) {
    return `${clean.slice(0, 4)} ${clean.slice(4, 8)} ${clean.slice(8, 12)} ${clean.slice(12, 16)}`;
  } else {
    return `•••• ${clean.slice(4, 8)} ${clean.slice(12, 16)}`;
  }
}

/* ======================
   MASK CARD NUMBER
====================== */
export function maskCardNumber(cardNumber) {
  if (!cardNumber) return null;
  
  const clean = cardNumber.replace(/\D/g, '');
  if (clean.length !== 16) return cardNumber;
  
  return `•••• ${clean.slice(4, 8)} ${clean.slice(8, 12)} ${clean.slice(12, 16)}`;
}

/* ======================
   FORMAT DATE ONLY (BARU - untuk AccountCard)
====================== */
export function formatDateOnly(timestamp) {
  if (!timestamp) return "";
  
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      // Jika format lama "Today, 14:30", ambil tanggal sebenarnya
      if (typeof timestamp === 'string') {
        // Coba parse format lama
        const lower = timestamp.toLowerCase();
        if (lower.includes('today')) {
          return new Date().toLocaleDateString('en-US', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
          });
        }
        if (lower.includes('yesterday')) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          return yesterday.toLocaleDateString('en-US', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
          });
        }
        // Jika format "Dec 12, 14:30", ambil bagian tanggalnya
        const dateMatch = timestamp.match(/^([A-Za-z]+\s+\d+)/);
        if (dateMatch) {
          const currentYear = new Date().getFullYear();
          return `${dateMatch[1]}, ${currentYear}`;
        }
      }
      return "";
    }
    
    // Format: "12 Dec 2024"
    return date.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  } catch {
    return "";
  }
}

/* ======================
   FORMAT TIME (DEPRECATED - hanya untuk backward compatibility)
====================== */
export function formatTime(timestamp) {
  // Alias ke formatDateOnly untuk menghindari breaking change
  return formatDateOnly(timestamp);
}

/* ======================
   FORMAT TIME ONLY
====================== */
export function formatTimeOnly(timestamp) {
  if (!timestamp) return "";
  
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "";
    
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  } catch {
    return "";
  }
}

/* ======================
   ACCOUNT TYPE OPTIONS
====================== */
export const TYPE_OPTIONS = [
  { id: "bank", label: "Bank" },
  { id: "digital-bank", label: "Digital Bank" },
  { id: "e-wallet", label: "E-Wallet" },
  { id: "cash", label: "Cash" },
  { id: "loans", label: "Loans" },
];