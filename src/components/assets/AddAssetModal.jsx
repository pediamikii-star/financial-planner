import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { saveAsset, updateAsset } from "../../services/storage";

const CATEGORY_OPTIONS = [
  "Property",
  "Vehicle", 
  "Gold",
  "Land",
  "Gadget",
  "Other"
];

const CONDITION_OPTIONS = [
  "New",
  "Good",
  "Fair",
  "Poor"
];

// Generate tahun untuk selector (dari 2000 sampai tahun sekarang)
const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear; year >= 2000; year--) {
    years.push(year);
  }
  return years;
};

// Mapping nama asset berdasarkan kategori
const ASSET_NAME_OPTIONS = {
  "Property": ["House", "Apartment", "Shop house"],
  "Vehicle": ["Car", "Motorcycle", "Bicycle"],
  "Gold": ["Gold bar", "Gold jewelry"],
  "Land": ["Land plot", "Farm land"],
  "Gadget": ["Smartphone", "Laptop", "Tablet", "Smartwatch", "Smart TV"],
  "Other": []
};

export default function AddAssetModal({ editAsset = null, onClose }) {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    value: "",
    currentEstimatedValue: "", // FIELD BARU
    yearOfPurchase: "",
    location: "",
    condition: "",
    quantity: "1",
    notes: ""
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentValue, setShowCurrentValue] = useState(true);
  
  const yearOptions = generateYearOptions();

  /* ======================
     PREFILL FORM (EDIT)
  ====================== */
  useEffect(() => {
    if (editAsset) {
      setFormData({
        name: editAsset.name || "",
        category: editAsset.category || "",
        value: editAsset.value?.toString() || "",
        currentEstimatedValue: editAsset.currentEstimatedValue?.toString() || editAsset.value?.toString() || "",
        yearOfPurchase: editAsset.yearOfPurchase || "",
        location: editAsset.location || "",
        condition: editAsset.condition || "",
        quantity: editAsset.quantity?.toString() || "1",
        notes: editAsset.notes || ""
      });
      setShowCurrentValue(editAsset.currentEstimatedValue !== undefined);
    }
  }, [editAsset]);

  /* ======================
     CATEGORY CHANGE
  ====================== */
  const handleCategoryChange = (e) => {
    const { value } = e.target;

    setFormData(prev => {
      const newData = {
        ...prev,
        category: value,
        name: ""
      };

      const categoryLower = value.toLowerCase();

      if (!(categoryLower.includes("property") || categoryLower.includes("land"))) {
        newData.location = "";
      }

      if (categoryLower.includes("property") || categoryLower.includes("land")) {
        newData.condition = "";
      }

      return newData;
    });

    if (errors.category || errors.name) {
      setErrors(prev => ({ ...prev, category: "", name: "" }));
    }
  };

  const handleAssetNameChange = (e) => {
    setFormData(prev => ({ ...prev, name: e.target.value }));
    if (errors.name) setErrors(prev => ({ ...prev, name: "" }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  /* ======================
     TOGGLE CURRENT VALUE FIELD
  ====================== */
  const handleToggleCurrentValue = () => {
    setShowCurrentValue(!showCurrentValue);
    if (!showCurrentValue) {
      // Jika diaktifkan, set nilai default sama dengan purchase value
      setFormData(prev => ({
        ...prev,
        currentEstimatedValue: prev.value || ""
      }));
    } else {
      // Jika dinonaktifkan, hapus nilai
      setFormData(prev => ({
        ...prev,
        currentEstimatedValue: ""
      }));
    }
  };

  /* ======================
     CALCULATE ESTIMATED VALUE
  ====================== */
  const handleAutoCalculate = () => {
    const purchaseValue = parseFloat(formData.value) || 0;
    const yearOfPurchase = parseInt(formData.yearOfPurchase) || new Date().getFullYear();
    const currentYear = new Date().getFullYear();
    const yearsDiff = Math.max(0, currentYear - yearOfPurchase);
    
    let estimatedValue = purchaseValue;
    
    if (formData.category === "Property" || formData.category === "Land") {
      // Appreciation 7% per tahun untuk properti/tanah
      const appreciationRate = 0.07;
      estimatedValue = purchaseValue * Math.pow(1 + appreciationRate, yearsDiff);
    } else if (formData.category === "Vehicle") {
      // Depresiasi 18% per tahun untuk kendaraan
      const depreciationRate = 0.18;
      estimatedValue = purchaseValue * Math.pow(1 - depreciationRate, yearsDiff);
    } else if (formData.category === "Gadget") {
      // Depresiasi cepat 25% per tahun untuk gadget
      const depreciationRate = 0.25;
      estimatedValue = purchaseValue * Math.pow(1 - depreciationRate, yearsDiff);
    } else if (formData.category === "Gold") {
      // Appreciation 5% per tahun untuk emas
      const appreciationRate = 0.05;
      estimatedValue = purchaseValue * Math.pow(1 + appreciationRate, yearsDiff);
    }
    
    // Pastikan nilai tidak negatif
    estimatedValue = Math.max(0, estimatedValue);
    
    setFormData(prev => ({
      ...prev,
      currentEstimatedValue: Math.round(estimatedValue).toString()
    }));
  };

  /* ======================
     VALIDATION
  ====================== */
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Asset name is required";
    if (!formData.category) newErrors.category = "Please select a category";
    if (!formData.value || Number(formData.value) <= 0)
      newErrors.value = "Please enter a valid value";

    // Validasi currentEstimatedValue jika diisi
    if (formData.currentEstimatedValue && Number(formData.currentEstimatedValue) < 0) {
      newErrors.currentEstimatedValue = "Current value cannot be negative";
    }

    const categoryLower = formData.category.toLowerCase();
    if (
      (categoryLower.includes("property") || categoryLower.includes("land")) &&
      !formData.location.trim()
    ) {
      newErrors.location = "Location is required for this category";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ======================
     SUBMIT
  ====================== */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const assetData = {
        name: formData.name,
        category: formData.category,
        value: Number(formData.value),
        currentEstimatedValue: showCurrentValue && formData.currentEstimatedValue 
          ? Number(formData.currentEstimatedValue) 
          : undefined,
        yearOfPurchase: formData.yearOfPurchase,
        location: formData.location,
        condition: formData.condition,
        quantity: Number(formData.quantity || 1),
        notes: formData.notes
      };

      if (editAsset) {
        // UPDATE HARUS BAWA ID
        updateAsset({
          id: editAsset.id,
          ...assetData,
          createdAt: editAsset.createdAt,
          updatedAt: new Date().toISOString()
        });
      } else {
        saveAsset({
          ...assetData,
          id: Date.now(),
          createdAt: new Date().toISOString()
        });
      }

      onClose();
    } catch (error) {
      console.error("Error saving asset:", error);
      alert("Failed to save asset");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ======================
     HELPERS
  ====================== */
  const getAssetNameOptions = () => {
    if (!formData.category) return [];
    return ASSET_NAME_OPTIONS[formData.category] || [];
  };

  const shouldShowLocation = () =>
    ["property", "land"].some(c =>
      formData.category.toLowerCase().includes(c)
    );

  const shouldShowCondition = () =>
    !["property", "land"].some(c =>
      formData.category.toLowerCase().includes(c)
    );

  const calculatePL = () => {
    const purchaseValue = parseFloat(formData.value) || 0;
    const currentValue = parseFloat(formData.currentEstimatedValue) || 0;
    
    if (!purchaseValue || !currentValue) return null;
    
    const amount = currentValue - purchaseValue;
    const percentage = purchaseValue > 0 ? (amount / purchaseValue) * 100 : 0;
    
    return {
      amount,
      percentage,
      isProfit: amount >= 0
    };
  };

  const plData = calculatePL();
  const modalTitle = editAsset ? `Edit Asset: ${editAsset.name}` : "Add New Asset";
  const submitButtonText = editAsset ? "Update Asset" : "Save Asset";
  const assetNameOptions = getAssetNameOptions();

  /* ======================
     RENDER
  ====================== */
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">{modalTitle}</h2>
          <button 
            onClick={onClose} 
            disabled={isSubmitting}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* CATEGORY */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleCategoryChange}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Category</option>
              {CATEGORY_OPTIONS.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && (
              <p className="text-red-500 text-xs mt-1">{errors.category}</p>
            )}
          </div>

          {/* ASSET NAME */}
          {formData.category && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asset Type
              </label>
              {assetNameOptions.length > 0 ? (
                <select
                  name="name"
                  value={formData.name}
                  onChange={handleAssetNameChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select {formData.category} Type</option>
                  {assetNameOptions.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                  <option value="other">Other</option>
                </select>
              ) : (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={`Enter ${formData.category.toLowerCase()} name`}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              )}
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>
          )}

          {/* PURCHASE VALUE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purchase Value (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                Rp
              </span>
              <input
                type="number"
                name="value"
                value={formData.value}
                onChange={handleChange}
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg p-3 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {errors.value && (
              <p className="text-red-500 text-xs mt-1">{errors.value}</p>
            )}
          </div>

          {/* CURRENT ESTIMATED VALUE TOGGLE */}
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showCurrentValue}
                onChange={handleToggleCurrentValue}
                className="rounded text-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Add Current Estimated Value
              </span>
            </label>
            {formData.category && formData.value && formData.yearOfPurchase && (
              <button
                type="button"
                onClick={handleAutoCalculate}
                className="text-sm text-blue-500 hover:text-blue-600 font-medium"
              >
                Auto-calculate
              </button>
            )}
          </div>

          {/* CURRENT ESTIMATED VALUE */}
          {showCurrentValue && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Estimated Value (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  Rp
                </span>
                <input
                  type="number"
                  name="currentEstimatedValue"
                  value={formData.currentEstimatedValue}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full border border-gray-300 rounded-lg p-3 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {errors.currentEstimatedValue && (
                <p className="text-red-500 text-xs mt-1">{errors.currentEstimatedValue}</p>
              )}
              
              {/* P/L INDICATOR */}
              {plData && (
                <div className={`mt-2 p-2 rounded text-sm font-medium ${
                  plData.isProfit 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {plData.isProfit ? '📈' : '📉'} 
                  {plData.isProfit ? ' Profit' : ' Loss'}: 
                  Rp {Math.abs(plData.amount).toLocaleString('id-ID')} 
                  ({plData.isProfit ? '+' : ''}{plData.percentage.toFixed(1)}%)
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-1">
                Leave empty or same as purchase value if unknown
              </p>
            </div>
          )}

          {/* YEAR OF PURCHASE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year of Purchase
            </label>
            <select
              name="yearOfPurchase"
              value={formData.yearOfPurchase}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Year</option>
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* LOCATION (hanya untuk Property dan Land) */}
          {shouldShowLocation() && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Jakarta, Bandung"
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.location && (
                <p className="text-red-500 text-xs mt-1">{errors.location}</p>
              )}
            </div>
          )}

          {/* CONDITION (tidak untuk Property dan Land) */}
          {shouldShowCondition() && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condition
              </label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Condition (Optional)</option>
                {CONDITION_OPTIONS.map(cond => (
                  <option key={cond} value={cond}>{cond}</option>
                ))}
              </select>
            </div>
          )}

          {/* QUANTITY */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* NOTES */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes about the asset"
              rows="3"
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </form>

        {/* FOOTER */}
        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : submitButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}