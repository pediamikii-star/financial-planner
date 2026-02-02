// src/utils/creatorUtils.js
import { logoMap } from "../assets/logos/logoMap";

/* =========================
   PLATFORM OPTIONS
========================= */
export const CREATOR_PLATFORM_OPTIONS = [
  "YouTube",
  "Tiktok",
  "Instagram",
  "Twitter / X",
  "Facebook",
  "Blog / Website",
  "Shopee",
  "Fiverr",
  "Upwork",
  "Lynkid",
  "Other",
];

/* =========================
   INCOME TYPES
========================= */
export const CREATOR_INCOME_TYPES = [
  "Ads Revenue",
  "Affiliate",
  "Monetization",
  "Sponsorship",
  "Subscription",
  "Donation",
  "Product Sales",
  "Other",
];

/* =========================
   SOLID COLORS (untuk fallback)
========================= */
export const CREATOR_COLORS = {
  youtube: "#ff0000",
  tiktok: "#000000",
  instagram: "#e1306c",
  twitter: "#1da1f2",
  facebook: "#1877f2",
  blog: "#6b7280",
  fiverr: "#1dbf73",
  upwork: "#6fda44",
  shopee: "#ee4d2d",
  lynkid: "#0a66c2",
  other: "#94a3b8",
};

/* =========================
   GRADIENTS (DARI PLATFORM_GRADIENTS)
========================= */
export const PLATFORM_GRADIENTS = {
  youtube: ["#FF0000", "#FF8A8A"],      // red → soft red
  tiktok: ["#000000", "#25F4EE"],       // black → cyan
  instagram: ["#833AB4", "#FD1D1D"],    // purple → red
  twitter: ["#0F172A", "#94A3B8"],      // dark gray → light gray
  facebook: ["#1877F2", "#6CA9FF"],     // blue → light blue
  blog: ["#F57C00", "#FFB74D"],         // orange → soft orange
  fiverr: ["#1DBF73", "#7AE6B8"],       // green → mint
  upwork: ["#14A800", "#7ED957"],       // green → lime
  shopee: ["#EE4D2D", "#FF9F8A"],       // orange → peach
  lynkid: ["#0F172A", "#64748B"],       // dark navy → slate
  other: ["#94A3B8", "#CBD5E1"],        // gray → light gray
};

// ALIAS untuk konsistensi
export const CREATOR_GRADIENTS = PLATFORM_GRADIENTS;

/* =========================
   HELPER: Dapatkan warna dari gradient
========================= */
export function getPlatformColor(platformKey) {
  const key = String(platformKey || '').toLowerCase().trim();
  const gradients = PLATFORM_GRADIENTS[key] || PLATFORM_GRADIENTS.other;
  return gradients[0];
}

/* =========================
   HELPER: Dapatkan semua gradient colors
========================= */
export function getPlatformGradientColors(platformKey) {
  const key = String(platformKey || '').toLowerCase().trim();
  return PLATFORM_GRADIENTS[key] || PLATFORM_GRADIENTS.other;
}

/* =========================
   LOGO HELPER
========================= */
export function getCreatorLogo(platform = "") {
  const p = platform.toLowerCase();

  // ===== MAIN PLATFORMS =====
  if (p.includes("youtube")) return logoMap.creators.youtube;
  if (p.includes("tiktok")) return logoMap.creators.tiktok;
  if (p.includes("instagram")) return logoMap.creators.instagram;

  // Twitter / X
  if (p.includes("twitter") || p === "x")
    return logoMap.creators.x || logoMap.creators.twitter;

  // Facebook
  if (p.includes("facebook") || p.includes("fb"))
    return logoMap.creators.facebook || logoMap.other.default;

  // Blog / Website
  if (p.includes("blog") || p.includes("website"))
    return logoMap.creators.blogger;

  // Fiverr
  if (p.includes("fiverr"))
    return logoMap.creators.fiverr || logoMap.other.default;

  // Upwork
  if (p.includes("upwork"))
    return logoMap.creators.upwork || logoMap.other.default;

  // Shopee
  if (p.includes("shopee"))
    return logoMap.creators.shopee || logoMap.other.default;

  // Lynkid
  if (p.includes("lynkid") || p.includes("lynk"))
    return logoMap.creators.lynkid || logoMap.other.default;

  // ===== FALLBACK =====
  return logoMap.other.default;
}