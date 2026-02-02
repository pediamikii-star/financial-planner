// src/utils/transactionUtils.js
import {
  Utensils,
  Car,
  ShoppingBag,
  Gamepad2,
  Home,
  Lightbulb,
  HeartPulse,
  GraduationCap,
  Gift,
  Briefcase,
  ArrowLeftRight,
  PlusCircle,
  TrendingUp,        // NEW - untuk Investment
  CircleDollarSign,  // NEW - untuk Other Income
  Banknote,          // NEW - untuk Withdraw
  Code2,             // NEW - untuk Freelance
  Sparkles,          // NEW - untuk Bonus (alternatif)
} from "lucide-react";

/* =========================
   TRANSACTION CATEGORIES
========================= */
export const TRANSACTION_CATEGORIES = [
  // ===== EXPENSE CATEGORIES =====
  {
    key: "food",
    label: "Food & Beverage",
    icon: Utensils,
    type: ["expense"],
  },
  {
    key: "transport",
    label: "Transport",
    icon: Car,
    type: ["expense"],
  },
  {
    key: "shopping",
    label: "Shopping",
    icon: ShoppingBag,
    type: ["expense"],
  },
  {
    key: "entertainment",
    label: "Entertainment",
    icon: Gamepad2,
    type: ["expense"],
  },
  {
    key: "housing",
    label: "Housing",
    icon: Home,
    type: ["expense"],
  },
  {
    key: "utilities",
    label: "Utilities",
    icon: Lightbulb,
    type: ["expense"],
  },
  {
    key: "health",
    label: "Health",
    icon: HeartPulse,
    type: ["expense"],
  },
  {
    key: "education",
    label: "Education",
    icon: GraduationCap,
    type: ["expense"],
  },
  {
    key: "gift",
    label: "Gift",
    icon: Gift,
    type: ["expense"], // Gift bisa expense
  },

  // ===== INCOME CATEGORIES =====
  {
    key: "salary",
    label: "Salary",
    icon: Briefcase,
    type: ["income"],
  },
  {
    key: "withdraw",
    label: "Withdraw",
    icon: Banknote, // atau ArrowLeftRight
    type: ["income"],
  },
  {
    key: "freelance",
    label: "Freelance",
    icon: Code2, // atau Laptop
    type: ["income"],
  },
  {
    key: "bonus",
    label: "Bonus",
    icon: Sparkles, // atau Gift
    type: ["income"],
  },
  {
    key: "investment",
    label: "Investment",
    icon: TrendingUp,
    type: ["income"],
  },
  {
    key: "other_income",
    label: "Other",
    icon: CircleDollarSign,
    type: ["income"],
  },

  // ===== TRANSFER & TOPUP =====
  {
    key: "transfer",
    label: "Transfer",
    icon: ArrowLeftRight,
    type: ["transfer"],
  },
  {
    key: "topup",
    label: "Top Up",
    icon: PlusCircle,
    type: ["topup"],
  },
];

/* =========================
   HELPERS
========================= */
export function getCategoryByKey(key) {
  return TRANSACTION_CATEGORIES.find(c => c.key === key);
}

export function getCategoriesByType(type) {
  return TRANSACTION_CATEGORIES.filter(c => c.type.includes(type));
}