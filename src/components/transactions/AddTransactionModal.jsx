import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { accountStore } from "../../stores/account.store";
import { transactionStore } from "../../stores/transaction.store";

/* =========================
   CATEGORY OPTIONS
========================= */
const EXPENSE_CATEGORIES = [
  "Food & Beverage",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "Other",
];

const INCOME_CATEGORIES = [
  "Salary",
  "Withdraw",
  "Freelance",
  "Bonus",
  "Gift",
  "Investment",
  "Other",
];

/* =========================
   ACCOUNT HELPERS
========================= */
function isValidAccount(acc) {
  return acc && acc.type;
}

// Fungsi untuk mendapatkan accounts yang bisa digunakan sebagai FROM
function getFromAccounts(type, accounts) {
  if (type === "income") {
    // Income hanya bisa masuk ke Bank atau Digital Bank
    return accounts.filter(a => a.type === "bank" || a.type === "digital-bank");
  }

  if (type === "expense") {
    // Expense bisa dari semua jenis akun
    return accounts.filter(a =>
      ["bank", "digital-bank", "cash", "e-wallet"].includes(a.type)
    );
  }

  if (type === "transfer") {
    // Transfer hanya bisa dari: Bank, Digital Bank, Cash
    return accounts.filter(a =>
      ["bank", "digital-bank", "cash"].includes(a.type)
    );
  }

  if (type === "topup") {
    // Top up hanya bisa dari: Bank, Digital Bank, Cash
    return accounts.filter(a =>
      ["bank", "digital-bank", "cash"].includes(a.type)
    );
  }

  return [];
}

// Fungsi untuk mendapatkan accounts yang bisa digunakan sebagai TO
function getToAccounts(type, fromAccount, accounts) {
  if (!fromAccount) return [];

  if (type === "transfer") {
    // Transfer TO: Bank, Digital Bank, Cash (kecuali akun yang sama)
    return accounts.filter(
      a =>
        ["bank", "digital-bank", "cash"].includes(a.type) &&
        a.id !== fromAccount.id
    );
  }

  if (type === "topup") {
    // Top up TO: HANYA E-Wallet
    return accounts.filter(a => a.type === "e-wallet");
  }

  return [];
}

function groupAccounts(accounts) {
  return {
    bank: accounts.filter(a => a.type === "bank"),
    "digital-bank": accounts.filter(a => a.type === "digital-bank"),
    "e-wallet": accounts.filter(a => a.type === "e-wallet"),
    cash: accounts.filter(a => a.type === "cash"),
  };
}

function labelByType(type) {
  if (type === "bank") return "Bank";
  if (type === "digital-bank") return "Digital Bank";
  if (type === "e-wallet") return "E-Wallet";
  if (type === "cash") return "Cash";
  return type;
}

/* =========================
   COMPONENT
========================= */
export default function AddTransactionModal({ onClose, transaction }) {
  const isEdit = !!transaction;
  const [accounts, setAccounts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: "",
    category: "",
    accountId: "",
    toAccountId: "",
    amount: "",
    useAdminFee: false,
    adminFee: "",
    notes: "",
  });

  useEffect(() => {
    accountStore.init();
    return accountStore.subscribe(data =>
      setAccounts(data.filter(isValidAccount))
    );
  }, []);

  /* =========================
     PREFILL WHEN EDIT
  ========================= */
  useEffect(() => {
    if (!transaction) return;

    setForm({
      date: transaction.date?.slice(0, 10) || "",
      type: transaction.type || "",
      category: transaction.category || "",
      accountId: transaction.accountId
        ? String(transaction.accountId)
        : "",
      toAccountId: transaction.toAccountId
        ? String(transaction.toAccountId)
        : "",
      amount: transaction.amount || "",
      useAdminFee: Number(transaction.adminFee) > 0,
      adminFee: transaction.adminFee || "",
      notes: transaction.notes || "",
    });
  }, [transaction]);

  const selectedAccount = accounts.find(
    a => a.id === Number(form.accountId)
  );

  // Gunakan fungsi yang sudah diperbaiki
  const fromAccounts = getFromAccounts(form.type, accounts);
  const toAccounts = getToAccounts(form.type, selectedAccount, accounts);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "type" || name === "accountId" ? { 
        toAccountId: "",
        ...(name === "type" ? { category: "" } : {})
      } : {}),
    }));
  }

  /* =========================
     VALIDATION
  ========================= */
  const validateForm = () => {
    // Validasi dasar
    if (!form.type) {
      alert("Please select transaction type");
      return false;
    }

    if (!form.accountId) {
      alert("Please select from account");
      return false;
    }

    if ((form.type === "transfer" || form.type === "topup") && !form.toAccountId) {
      alert("Please select to account");
      return false;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      alert("Please enter a valid amount");
      return false;
    }

    // Validasi khusus transfer/top up
    if (form.type === "transfer" || form.type === "topup") {
      if (form.accountId === form.toAccountId) {
        alert("From account and to account cannot be the same");
        return false;
      }
    }

    return true;
  };

  /* =========================
     SUBMIT
  ========================= */
  function handleSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      const fromAccount = accounts.find(
        a => a.id === Number(form.accountId)
      );

      const toAccount = accounts.find(
        a => a.id === Number(form.toAccountId)
      );

      const payload = {
        date: form.date,
        type: form.type,
        category: form.category,
        categoryName: form.category || undefined,
        accountId: fromAccount?.id,
        accountName: fromAccount?.name,
        fromAccountName:
          form.type === "transfer" || form.type === "topup"
            ? fromAccount?.name
            : undefined,
        toAccountId:
          form.type === "transfer" || form.type === "topup"
            ? toAccount?.id
            : undefined,
        toAccountName:
          form.type === "transfer" || form.type === "topup"
            ? toAccount?.name
            : undefined,
        amount: Number(form.amount),
        adminFee: form.useAdminFee ? Number(form.adminFee) : 0,
        notes: form.notes,
      };

      if (isEdit) {
        transactionStore.update(transaction.id, payload);
      } else {
        transactionStore.add(payload);
      }

      onClose();
    } catch (error) {
      console.error("Error saving transaction:", error);
      alert("Failed to save transaction");
    } finally {
      setIsSubmitting(false);
    }
  }

  const showCategory =
    form.type === "expense" || form.type === "income";
  const showToAccount =
    form.type === "transfer" || form.type === "topup";
  const showAdminFee =
    form.type === "transfer" || form.type === "topup";

  const categoryOptions =
    form.type === "expense"
      ? EXPENSE_CATEGORIES
      : INCOME_CATEGORIES;

  const modalTitle = isEdit ? "Edit Transaction" : "Add Transaction";
  const submitButtonText = isEdit ? "Update" : "Save";

  // Helper untuk menampilkan accounts dengan grouping yang sesuai
  const getGroupedAccountsForFrom = () => {
    if (!form.type) return groupAccounts(accounts);
    
    const filteredAccounts = getFromAccounts(form.type, accounts);
    return groupAccounts(filteredAccounts);
  };

  // Helper untuk menampilkan accounts dengan grouping yang sesuai untuk TO
  const getGroupedAccountsForTo = () => {
    if (!form.type || !selectedAccount) return groupAccounts(toAccounts);
    
    return groupAccounts(toAccounts);
  };

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
          {/* DATE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* TYPE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Type</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="transfer">Transfer</option>
              <option value="topup">Top Up</option>
            </select>
          </div>

          {/* CATEGORY */}
          {showCategory && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Category</option>
                {categoryOptions.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* FROM ACCOUNT */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {form.type === "income" ? "To Account" : "From Account"}
            </label>
            <select
              name="accountId"
              value={form.accountId}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Account</option>
              {Object.entries(getGroupedAccountsForFrom()).map(([type, list]) =>
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
            
            {/* BALANCE */}
            {selectedAccount && (
              <p className="text-sm text-gray-500 mt-1">
                Balance: Rp{" "}
                {Number(selectedAccount.balance || 0).toLocaleString("id-ID")}
              </p>
            )}
          </div>

          {/* TO ACCOUNT - TRANSFER & TOP UP */}
          {showToAccount && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Account
              </label>
              <select
                name="toAccountId"
                value={form.toAccountId}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Account</option>
                
                {/* Untuk TRANSFER: Grouping berdasarkan kategori */}
                {form.type === "transfer" && (
                  <>

                    {Object.entries(getGroupedAccountsForTo()).map(([type, list]) =>
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
                  </>
                )}
                
                {/* Untuk TOP UP: Hanya E-Wallet */}
                {form.type === "topup" && (
                  <optgroup label="Top up to: E-Wallet">
                    {toAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          )}

          {/* AMOUNT */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
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
                className="w-full border border-gray-300 rounded-lg p-3 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* ADMIN FEE - Hanya untuk Transfer & Top Up */}
          {showAdminFee && (
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
                      className="w-full border border-gray-300 rounded-lg p-3 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* NOTES */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Additional notes"
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
            type="submit"
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