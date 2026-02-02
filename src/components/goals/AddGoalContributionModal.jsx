// src/components/goals/AddGoalContributionModal.jsx
import React, { useState, useEffect } from "react";

const AddGoalContributionModal = ({ goal, onClose, onSubmit }) => {
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load accounts dari localStorage dengan cara yang lebih spesifik
  useEffect(() => {
    const loadAccounts = () => {
      try {
        setLoading(true);
        
        // Coba dari berbagai kemungkinan key di localStorage
        const possibleKeys = ['account-store', 'accounts', 'user-accounts', 'bank-accounts'];
        
        for (const key of possibleKeys) {
          try {
            const saved = localStorage.getItem(key);
            if (saved) {
              const parsed = JSON.parse(saved);
              
              // Jika ini Zustand store (punya state property)
              if (parsed && parsed.state && parsed.state.accounts) {
                const storeAccounts = parsed.state.accounts;
                if (Array.isArray(storeAccounts) && storeAccounts.length > 0) {
                  console.log(`Found accounts in Zustand store "${key}":`, storeAccounts);
                  setAccounts(storeAccounts);
                  setLoading(false);
                  return;
                }
              }
              
              // Jika langsung array of accounts
              if (Array.isArray(parsed) && parsed.length > 0) {
                // Filter hanya yang seperti account (bukan asset)
                const accountItems = parsed.filter(item => 
                  item && 
                  typeof item === 'object' &&
                  (item.type === 'bank' || 
                   item.type === 'digital-bank' || 
                   item.type === 'e-wallet' ||
                   item.type === 'cash') &&
                  item.balance !== undefined
                );
                
                if (accountItems.length > 0) {
                  console.log(`Found accounts in "${key}":`, accountItems);
                  setAccounts(accountItems);
                  setLoading(false);
                  return;
                }
              }
            }
          } catch (e) {
            console.log(`Error parsing ${key}:`, e);
          }
        }
        
        // Jika tidak ditemukan
        console.log("No accounts found");
        setAccounts([]);
        setLoading(false);
        
      } catch (error) {
        console.error("Error loading accounts:", error);
        setAccounts([]);
        setLoading(false);
      }
    };
    
    loadAccounts();
  }, []);

  // Filter hanya accounts yang punya balance > 0 dan bukan loans
  const filteredAccounts = accounts.filter(acc => 
    acc && 
    acc.type !== 'loans' &&
    acc.balance && 
    acc.balance > 0
  );

  const handleSubmit = () => {
    if (!amount || !accountId) {
      alert("Please fill amount and select account");
      return;
    }

    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Please enter valid amount");
      return;
    }

    // Cek apakah account cukup balance
    const selectedAccount = accounts.find(acc => acc.id && acc.id.toString() === accountId);
    if (selectedAccount && selectedAccount.balance < amountNum) {
      alert(`Insufficient balance in ${selectedAccount.name}. Available: Rp ${selectedAccount.balance.toLocaleString("id-ID")}`);
      return;
    }

    onSubmit({
      goalId: goal.id,
      amount: amountNum,
      accountId,
      accountName: selectedAccount?.name || ""
    });

    onClose();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-xl">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-800">
            Add Funds to "{goal.name}"
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Transfer money from your account to this goal
          </p>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-5">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                Rp
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 pl-10 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Remaining needed: {formatCurrency(goal.targetAmount - goal.currentAmount)}
            </p>
          </div>

          {/* Account */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Account
            </label>
            {loading ? (
              <div className="border border-gray-300 rounded-lg p-3 bg-gray-50 text-center">
                <p className="text-gray-500">Loading accounts...</p>
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="border border-gray-300 rounded-lg p-3 bg-yellow-50 text-center">
                <p className="text-yellow-700">No accounts with balance found</p>
              </div>
            ) : (
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select account</option>
                {filteredAccounts.map((acc) => (
                  <option key={acc.id || acc.name} value={acc.id}>
                    {acc.name}{acc.detail ? ` - ${acc.detail}` : ''} - {formatCurrency(acc.balance)}
                  </option>
                ))}
              </select>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {filteredAccounts.length} account{filteredAccounts.length !== 1 ? 's' : ''} with available balance
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!amount || !accountId || loading || filteredAccounts.length === 0}
              className="px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Add Funds
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddGoalContributionModal;