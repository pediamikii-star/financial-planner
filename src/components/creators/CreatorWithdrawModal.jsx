import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { accountStore } from "../../stores/account.store";
import { transactionStore } from "../../stores/transaction.store";
import { creatorStore } from "../../stores/creator.store";

/* =========================
   ACCOUNT HELPERS
========================= */
function isValidAccount(acc) {
  return acc && acc.type;
}

// Fungsi untuk mendapatkan accounts yang bisa digunakan sebagai tujuan withdraw
// HANYA Bank dan Digital Bank
function getDestinationAccounts(accounts) {
  return accounts.filter(a =>
    ["bank", "digital-bank"].includes(a.type)
  );
}

function groupAccounts(accounts) {
  return {
    bank: accounts.filter(a => a.type === "bank"),
    "digital-bank": accounts.filter(a => a.type === "digital-bank"),
  };
}

function labelByType(type) {
  if (type === "bank") return "Bank";
  if (type === "digital-bank") return "Digital Bank";
  return type;
}

/* =========================
   COMPONENT
========================= */
export default function CreatorWithdrawModal({ creator, accounts, onClose, onWithdrawSubmit }) {
  const [allAccounts, setAllAccounts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    accountId: "",
    amount: "",
    useAdminFee: false,
    adminFee: "",
  });

  // Debug
  useEffect(() => {
    console.log("📱 Creator object in modal:", creator);
    console.log("💰 Creator balance:", creator?.balance);
    console.log("🆔 Creator ID:", creator?.id);
    console.log("📛 Creator name:", creator?.name);
  }, [creator]);

  // Load accounts jika tidak ada props accounts
  useEffect(() => {
    if (accounts && accounts.length > 0) {
      console.log("✅ Using props accounts:", accounts);
      setAllAccounts(accounts.filter(isValidAccount));
    } else {
      console.log("🔄 Loading accounts from store");
      accountStore.init();
      const unsubscribe = accountStore.subscribe(data => {
        console.log("📊 Accounts loaded from store:", data);
        setAllAccounts(data.filter(isValidAccount));
      });
      return unsubscribe;
    }
  }, [accounts]);

  const selectedAccount = allAccounts.find(a => a.id === Number(form.accountId));

  // Gunakan fungsi yang sudah diperbaiki untuk tujuan withdraw
  const destinationAccounts = getDestinationAccounts(allAccounts);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  /* =========================
     VALIDATION
  ========================= */
  const validateForm = () => {
    if (!creator) {
      alert("No creator selected");
      return false;
    }

    const creatorBalance = Number(creator.balance) || 0;
    console.log("🔍 Validating creator balance:", creatorBalance);

    if (!form.accountId) {
      alert("Please select destination account");
      return false;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      alert("Please enter a valid amount");
      return false;
    }

    // Validasi saldo creator cukup
    const withdrawAmount = Number(form.amount);
    if (creatorBalance < withdrawAmount) {
      alert(`Insufficient balance. Available: Rp ${creatorBalance.toLocaleString("id-ID")}`);
      return false;
    }

    return true;
  };

  /* =========================
     SUBMIT - FIXED: NO MORE accountStore.addBalance!
  ========================= */
  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      const amount = Number(form.amount);
      const adminFee = form.useAdminFee ? Number(form.adminFee) : 0;
      const netAmount = amount - adminFee;

      console.log("🧮 CALCULATION CHECK:");
      console.log("Withdraw amount:", amount);
      console.log("Admin fee:", adminFee);
      console.log("Net amount (to account):", netAmount);

      // 1. GET FRESH DATA untuk menghindari stale data
      const freshAccount = accountStore.getById(Number(form.accountId));
      if (!freshAccount) {
        throw new Error("Destination account not found");
      }

      const accountBalanceBefore = Number(freshAccount.balance || 0);
      console.log("📊 Account balance BEFORE (fresh):", accountBalanceBefore);

      // 2. Validasi balance creator cukup
      const creatorBalance = Number(creator.balance || 0);
      if (creatorBalance < amount) {
        throw new Error(`Insufficient creator balance. Available: Rp ${creatorBalance.toLocaleString("id-ID")}`);
      }

      // 3. Kurangi balance dari creator (HANYA SEKALI)
      console.log("📉 Withdrawing from creator...");
      console.log("🔴 Calling creatorStore.withdrawFromCreator...");
      const withdrawResult = creatorStore.withdrawFromCreator(creator.id, amount);
      console.log("✅ Creator withdraw result:", withdrawResult);
      
      // 4. CATAT TRANSAKSI SAJA - transactionStore.add AKAN MENANGANI PENAMBAHAN SALDO!
      console.log("📝 Recording transaction...");
      console.log("Account ID:", Number(form.accountId));
      console.log("Net amount to add:", netAmount);
      console.log("🔴 transactionStore.add AKAN memanggil accountStore.addBalance otomatis");

      const payload = {
        date: new Date().toISOString().slice(0, 10),
        type: "income",
        category: "Withdraw",
        creatorId: creator.id,
        creatorName: creator.name,
        platform: creator.platform,
        accountId: Number(form.accountId),
        accountName: selectedAccount?.name,
        fromAccountName: `${creator.platform} - ${creator.name}`,
        amount: amount,
        adminFee: adminFee,
        netAmount: netAmount,
        notes: `${creator.platform} - ${creator.name}`,
      };

      console.log("📝 Transaction payload:", payload);
      
      // INI SATU-SATUNYA TEMPAT YANG MENAMBAH SALDO!
      // transactionStore.add AKAN OTOMATIS memanggil accountStore.addBalance
      transactionStore.add(payload);

      // 5. Jika ada callback, panggil TAPI JANGAN TAMBAH SALDO LAGI!
      if (onWithdrawSubmit) {
        console.log("🔄 Calling onWithdrawSubmit callback...");
        console.log("⚠️ WARNING: Callback should NOT add balance!");
        
        const result = await onWithdrawSubmit({
          ...payload,
          success: true,
          accountBalanceBefore,
          accountBalanceAfter: accountBalanceBefore + netAmount,
          _alreadyProcessed: true,
          _processedBy: "CreatorWithdrawModal"
        });
        console.log("✅ Callback result:", result);
      }

      // TAMPILKAN SUMMARY
      console.log("📊 WITHDRAWAL SUMMARY:");
      console.log("=======================================");
      console.log("Creator:", creator.platform, creator.name);
      console.log("Amount withdrawn:", amount.toLocaleString("id-ID"));
      console.log("Admin fee:", adminFee.toLocaleString("id-ID"));
      console.log("Net to account:", netAmount.toLocaleString("id-ID"));
      console.log("Account:", freshAccount.name);
      console.log("Balance before:", accountBalanceBefore.toLocaleString("id-ID"));
      console.log("Balance after:", (accountBalanceBefore + netAmount).toLocaleString("id-ID"));
      console.log("Difference:", netAmount.toLocaleString("id-ID"));
      console.log("=======================================");
      console.log("🎯 TOTAL CALLS MADE:");
      console.log("- creatorStore.withdrawFromCreator: 1x");
      console.log("- transactionStore.add: 1x (akan handle accountStore.addBalance)");
      console.log("- accountStore.addBalance: 0x (DIHAPUS DARI MODAL!)");
      console.log("=======================================");

      onClose();
    } catch (error) {
      console.error("❌ Error processing withdrawal:", error);
      alert(error.message || "Failed to process withdrawal");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Helper untuk menampilkan accounts dengan grouping yang sesuai
  const getGroupedAccountsForDestination = () => {
    const filteredAccounts = getDestinationAccounts(allAccounts);
    return groupAccounts(filteredAccounts);
  };

  const modalTitle = "Add Withdrawal";
  const submitButtonText = "Save";

  const creatorBalance = Number(creator?.balance) || 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
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

        {/* FORM - Sekarang mencakup seluruh konten */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* FORM FIELDS - Scrollable */}
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            {/* CREATOR INFO (FIXED) */}
            {creator && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Withdraw from:</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-gray-800">{creator.platform}</p>
                      <p className="text-gray-600 font-medium">{creator.name}</p>
                      {creator.description && (
                        <p className="text-sm text-gray-500 mt-1">{creator.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Available Balance</p>
                      <p className="text-lg font-bold text-green-600">
                        Rp {creatorBalance.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 bg-blue-100/50 p-2 rounded">
                    <div className="flex justify-between">
                      <span>Creator ID:</span>
                      <span className="font-mono">{creator.id}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TO ACCOUNT */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Account
              </label>
              <select
                name="accountId"
                value={form.accountId}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Account</option>
                {Object.entries(getGroupedAccountsForDestination()).map(([type, list]) =>
                  list.length ? (
                    <optgroup key={type} label={labelByType(type)}>
                      {list.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name}
                        </option>
                      ))}
                    </optgroup>
                  ) : null
                )}
              </select>
              
              {/* ACCOUNT BALANCE */}
              {selectedAccount && (
                <p className="text-sm text-gray-500 mt-1">
                  Current Balance: Rp{" "}
                  {Number(selectedAccount.balance || 0).toLocaleString("id-ID")}
                </p>
              )}
            </div>

            {/* WITHDRAW AMOUNT */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Withdraw Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  Rp
                </span>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="0"
                  min="1"
                  max={creatorBalance}
                  className="w-full border border-gray-300 rounded-lg p-3 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Maximum: Rp {creatorBalance.toLocaleString("id-ID")}
              </p>
            </div>

            {/* ADMIN FEE */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="useAdminFee"
                  checked={form.useAdminFee}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
                />
                Use Admin Fee
              </label>

              {form.useAdminFee && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Fee
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      Rp
                    </span>
                    <input
                      type="number"
                      name="adminFee"
                      value={form.adminFee}
                      onChange={handleChange}
                      placeholder="0"
                      min="0"
                      max={form.amount}
                      className="w-full border border-gray-300 rounded-lg p-3 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* FOOTER - SEKARANG DI DALAM FORM */}
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
              type="submit"
              disabled={isSubmitting || !creator}
              className="px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Processing..." : submitButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}