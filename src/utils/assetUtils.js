import { logoMap } from "../assets/logos/logoMap";

/* ======================
   NORMALIZE CATEGORY
====================== */
export function normalizeCategory(category = "") {
  const c = category.toLowerCase();

  if (c.includes("property")) return "property";
  if (c.includes("vehicle")) return "vehicle";
  if (c.includes("gold")) return "gold";
  if (c.includes("land")) return "land";
  if (c.includes("gadget")) return "gadget";

  return "other";
}

/* ======================
   NORMALIZE ASSET NAME
   (Laptop → laptop, Land Plot → landplot)
====================== */
export function normalizeAssetName(name = "") {
  return name.toLowerCase().replace(/\s+/g, "");
}

/* ======================
   GET ASSET LOGO
   PRIORITY:
   1. category + asset name
   2. category default
====================== */
export function getAssetLogo(category, assetName) {
  const categoryKey = normalizeCategory(category);
  const assetKey = normalizeAssetName(assetName);

  return (
    logoMap[categoryKey]?.[assetKey] ||
    logoMap[categoryKey]?.default ||
    logoMap.other.default
  );
}

/* ======================
   ASSET COLORS (CHART)
====================== */
export const ASSET_COLORS = {
  property: "#3B82F6",
  vehicle: "#10B981",
  gold: "#F59E0B",
  land: "#F97316",
  gadget: "#8B5CF6",
  other: "#9CA3AF",
};

/* ======================
   ASSET NAME OPTIONS
====================== */
export const ASSET_NAME_OPTIONS = {
  property: ["House", "Apartment", "Retail Building"],

  vehicle: ["Car", "Motorcycle", "Bycicle"],

  gadget: ["Laptop", "Tablet", "Smartphone", "Smartwatch"],

  land: ["Land Plot", "Farm Field"],

  gold: ["Gold Bar", "Gold Jewelry"],
};
