import { useState, useEffect } from "react";
import { creatorStore } from "../../stores/creator.store";
import {
  CREATOR_INCOME_TYPES,
} from "../../utils/creatorUtils";

/* ======================
   PLATFORM OPTIONS (FINAL)
====================== */
const PLATFORM_OPTIONS = [
  { label: "YouTube", value: "YouTube" },
  { label: "TikTok", value: "TikTok" },
  { label: "Instagram", value: "Instagram" },
  { label: "Twitter / X", value: "Twitter / X" },
  { label: "Facebook", value: "Facebook" },
  { label: "Blog / Website", value: "Blog / Website" },
  { label: "Shopee", value: "Shopee" },
  { label: "Fiverr", value: "Fiverr" },
  { label: "Upwork", value: "Upwork" },
  { label: "Lynkid", value: "Lynkid" },
  { label: "Other", value: "Other" },
];

export default function AddCreatorModal({ editCreator, onClose }) {
  const [form, setForm] = useState({
    id: null,
    platform: "",
    incomeType: "",
    channel: "",
    platformBalance: "",
    notes: "",
  });

  useEffect(() => {
    if (editCreator) {
      setForm({
        id: editCreator.id || null,
        platform: editCreator.platform || "",
        incomeType: editCreator.type || "",
        channel: editCreator.name || editCreator.channel || "",
        platformBalance: editCreator.balance || editCreator.platformBalance || "",
        notes: editCreator.description || editCreator.notes || "",
      });
    } else {
      setForm({
        id: null,
        platform: "",
        incomeType: "",
        channel: "",
        platformBalance: "",
        notes: "",
      });
    }
  }, [editCreator]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    
    const payload = {
      id: form.id,
      platform: form.platform,
      name: form.channel,
      description: form.notes,
      type: form.incomeType,
      balance: Number(form.platformBalance || 0),
      totalIncome: editCreator?.totalIncome || 0,
      totalWithdrawn: editCreator?.totalWithdrawn || 0,
      currency: editCreator?.currency || "IDR",
    };

    if (editCreator) {
      creatorStore.update(payload);
    } else {
      creatorStore.add(payload);
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-lg rounded-xl p-6 space-y-4 shadow-xl"
      >
        <h2 className="text-xl font-bold text-gray-800">
          {editCreator ? "Edit Creator" : "Add Creator"}
        </h2>

        {/* PLATFORM */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Platform
          </label>
          <select
            name="platform"
            value={form.platform}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select Platform</option>
            {PLATFORM_OPTIONS.map(p => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* INCOME TYPE */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Income Type
          </label>
          <select
            name="incomeType"
            value={form.incomeType}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select Income Type</option>
            {CREATOR_INCOME_TYPES.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* CHANNEL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Channel / Username
          </label>
          <input
            type="text"
            name="channel"
            value={form.channel}
            onChange={handleChange}
            placeholder="e.g. @username or channel name"
            className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* BALANCE */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Available Balance
          </label>
          <input
            type="number"
            name="platformBalance"
            value={form.platformBalance}
            onChange={handleChange}
            placeholder="0"
            className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* NOTES */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (optional)
          </label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Additional notes..."
            className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
          />
        </div>

        {/* ACTION */}
        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            {editCreator ? "Update" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}