import { useEffect, useState } from "react";
import { saveAccount, updateAccount } from "../../services/storage";

/* BANK LOGOS */
import bca from "../../assets/logos/accounts/banks/bca.png";
import bni from "../../assets/logos/accounts/banks/bni.png";
import bri from "../../assets/logos/accounts/banks/bri.png";
import mandiri from "../../assets/logos/accounts/banks/mandiri.png";
import btn from "../../assets/logos/accounts/banks/btn.png";
import cimb from "../../assets/logos/accounts/banks/cimb.png";
import danamon from "../../assets/logos/accounts/banks/danamon.png";
import maybank from "../../assets/logos/accounts/banks/maybank.png";
import ocbc from "../../assets/logos/accounts/banks/ocbc.png";
import paninbank from "../../assets/logos/accounts/banks/paninbank.png";
import permatabank from "../../assets/logos/accounts/banks/permatabank.png";

/* DIGITAL BANK LOGOS */
import jago from "../../assets/logos/accounts/digitalbank/jago.png";
import seabank from "../../assets/logos/accounts/digitalbank/seabank.png";
import bankneocommerce from "../../assets/logos/accounts/digitalbank/bankneocommerce.png";
import allobank from "../../assets/logos/accounts/digitalbank/allobank.png";
import blu from "../../assets/logos/accounts/digitalbank/blu.png";
import jenius from "../../assets/logos/accounts/digitalbank/jenius.png";
import linebank from "../../assets/logos/accounts/digitalbank/linebank.png";

/* E-WALLET LOGOS */
import ovo from "../../assets/logos/accounts/e-wallets/ovo.png";
import gopay from "../../assets/logos/accounts/e-wallets/gopay.png";
import dana from "../../assets/logos/accounts/e-wallets/dana.png";
import doku from "../../assets/logos/accounts/e-wallets/doku.png";
import isaku from "../../assets/logos/accounts/e-wallets/isaku.png";
import linkaja from "../../assets/logos/accounts/e-wallets/linkaja.png";
import paypal from "../../assets/logos/accounts/e-wallets/paypal.png";
import astrapay from "../../assets/logos/accounts/e-wallets/astrapay.png";
import shopeepay from "../../assets/logos/accounts/e-wallets/shopeepay.png";

/* LOANS */
import loans from "../../assets/logos/accounts/loans/loans.jpg";

/* ================== PROVIDER LIST ================== */

const BANKS = [
  { name: "BCA", logo: bca },
  { name: "BNI", logo: bni },
  { name: "BRI", logo: bri },
  { name: "Mandiri", logo: mandiri },
  { name: "BTN", logo: btn },
  { name: "CIMB Niaga", logo: cimb },
  { name: "Danamon", logo: danamon },
  { name: "Maybank", logo: maybank },
  { name: "OCBC", logo: ocbc },
  { name: "Panin Bank", logo: paninbank },
  { name: "Permata Bank", logo: permatabank },
];

const DIGITAL_BANKS = [
  { name: "Bank Jago", logo: jago },
  { name: "SeaBank", logo: seabank },
  { name: "Jenius", logo: jenius },
  { name: "blu", logo: blu },
  { name: "Line Bank", logo: linebank },
  { name: "Neo Commerce", logo: bankneocommerce },
  { name: "Allo Bank", logo: allobank },
];

const EWALLETS = [
  { name: "GoPay", logo: gopay },
  { name: "OVO", logo: ovo },
  { name: "DANA", logo: dana },
  { name: "ShopeePay", logo: shopeepay },
  { name: "LinkAja", logo: linkaja },
  { name: "DOKU", logo: doku },
  { name: "AstraPay", logo: astrapay },
  { name: "PayPal", logo: paypal },
  { name: "iSaku", logo: isaku },
];

const LOANS = [
  { name: "Loans", logo: loans },
];

const CASH_TYPES = [
  { name: "Wallet", value: "wallet" },
  { name: "Save Box", value: "save_box" },
];

// DEBIT CARD PROVIDERS (untuk dropdown)
const DEBIT_PROVIDERS = [
  "Visa",
  "Mastercard",
  "GPN",
  "JCB",
  "Prima",
  "UnionPay",
];

/* ================== COMPONENT ================== */

export default function AddAccountModal({ onClose, editAccount }) {
  const isEdit = Boolean(editAccount);

  const [type, setType] = useState("");
  const [cashType, setCashType] = useState("wallet");
  const [provider, setProvider] = useState("");
  const [detail, setDetail] = useState("");
  const [balance, setBalance] = useState("");
  
  // TAMBAHAN: State untuk debit card
  const [debitCardNumber, setDebitCardNumber] = useState("");
  const [debitCardProvider, setDebitCardProvider] = useState("");

  // Helper function untuk format nomor kartu
  const formatCardNumber = (value) => {
    // Hapus semua non-digit
    const numbers = value.replace(/\D/g, '');
    
    // Format: XXXX XXXX XXXX XXXX
    let formatted = '';
    for (let i = 0; i < numbers.length; i += 4) {
      if (i > 0) formatted += ' ';
      formatted += numbers.slice(i, i + 4);
    }
    
    return formatted.trim();
  };

  // Handler untuk input nomor kartu
  const handleCardNumberChange = (e) => {
    const input = e.target.value;
    // Hapus semua non-digit untuk penyimpanan
    const numbersOnly = input.replace(/\D/g, '');
    // Simpan max 16 digit
    if (numbersOnly.length <= 16) {
      setDebitCardNumber(numbersOnly);
    }
  };

  useEffect(() => {
    if (editAccount) {
      setType(editAccount.type);
      setProvider(editAccount.name);
      setDetail(editAccount.detail || "");
      setBalance(editAccount.balance);
      
      // Jika tipe cash, cek apakah ada informasi cashType di editAccount
      if (editAccount.type === "cash" && editAccount.cashType) {
        setCashType(editAccount.cashType);
      }
      
      // TAMBAHAN: Load data debit card jika ada
      if (editAccount.debitCardNumber) {
        setDebitCardNumber(editAccount.debitCardNumber);
      }
      if (editAccount.debitCardProvider) {
        setDebitCardProvider(editAccount.debitCardProvider);
      }
    }
  }, [editAccount]);

  function handleSave() {
    if (!type) {
      alert("Please select account type");
      return;
    }
    
    if (!balance) {
      alert("Please enter balance");
      return;
    }
    
    if (type !== "cash" && type !== "loans" && !provider) {
      alert("Please select provider");
      return;
    }

    const payload = {
      id: isEdit ? editAccount.id : Date.now(),
      type,
      name:
        type === "cash"
          ? cashType === "wallet" ? "Wallet" : "Save Box"
          : type === "loans"
          ? "Loans"
          : provider,
      detail,
      balance: Number(balance),
      ...(type === "cash" && { cashType }), // Tambahkan cashType untuk tipe cash
      
      // TAMBAHAN: Simpan data debit card (jika diisi)
      ...((type === "bank" || type === "digital-bank") && {
        debitCardNumber: debitCardNumber || null,
        debitCardProvider: debitCardProvider || null,
      }),
    };

    isEdit ? updateAccount(payload) : saveAccount(payload);
    onClose();
  }

  const providers =
    type === "bank"
      ? BANKS
      : type === "digital-bank"
      ? DIGITAL_BANKS
      : type === "e-wallet"
      ? EWALLETS
      : type === "loans"
      ? LOANS
      : [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-xl flex flex-col max-h-[85vh]">
        {/* HEADER */}
        <div className="p-6 pb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {isEdit ? "Edit Account" : "Add Account"}
          </h2>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="px-6 overflow-y-auto flex-1">
          {/* ACCOUNT TYPE */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Type
            </label>
            <select
              value={type}
              disabled={isEdit}
              onChange={(e) => {
                setType(e.target.value);
                setProvider("");
                setDetail("");
                setCashType("wallet");
                // Reset debit card data ketika ganti type
                setDebitCardNumber("");
                setDebitCardProvider("");
              }}
              className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Account Type</option>
              <option value="bank">Bank</option>
              <option value="digital-bank">Digital Bank</option>
              <option value="e-wallet">E-Wallet</option>
              <option value="cash">Cash</option>
              <option value="loans">Loans</option>
            </select>
          </div>

          {/* CASH TYPE - hanya muncul jika tipe dipilih adalah cash */}
          {type === "cash" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cash Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {CASH_TYPES.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setCashType(item.value)}
                    className={`flex items-center justify-center gap-2 p-4 rounded-lg border transition
                      ${
                        cashType === item.value
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-300 hover:bg-gray-50 text-gray-700"
                      }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PROVIDER - tidak muncul untuk tipe cash */}
          {type && type !== "cash" && type !== "loans" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {type === "bank" && "Select Bank"}
                {type === "digital-bank" && "Select Digital Bank"}
                {type === "e-wallet" && "Select E-Wallet"}
              </label>

              <div className="mt-2 grid grid-cols-3 gap-3 max-h-48 overflow-y-auto p-1">
                {providers.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setProvider(item.name)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition
                      ${
                        provider === item.name
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                  >
                    <img
                      src={item.logo}
                      className="w-10 h-10 object-contain"
                      alt={item.name}
                    />
                    <span className="text-xs text-center text-gray-800">
                      {item.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* LOANS TYPE - hanya untuk tipe loans */}
          {type === "loans" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loan Type
              </label>
              <div className="mt-2">
                {LOANS.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setProvider(item.name)}
                    className={`flex items-center gap-3 p-4 w-full rounded-lg border transition
                      ${
                        provider === item.name
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                  >
                    <img
                      src={item.logo}
                      className="w-10 h-10 object-contain"
                      alt={item.name}
                    />
                    <span className="text-sm text-gray-800">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* DEBIT CARD SECTION - Hanya untuk Bank dan Digital Bank */}
          {(type === "bank" || type === "digital-bank") && (
            <div className="mb-4 pt-2 border-t border-gray-200">
              <h3 className="text-md font-medium text-gray-700 mb-3">
                Debit Card Information
              </h3>
              
              {/* DEBIT CARD INFO - SATU BARIS */}
              <div className="grid grid-cols-2 gap-4">
                {/* DEBIT CARD NUMBER */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={formatCardNumber(debitCardNumber)}
                    onChange={handleCardNumberChange}
                    maxLength={19}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono tracking-wider"
                    placeholder="XXXX XXXX XXXX XXXX"
                  />
                </div>

                {/* DEBIT CARD PROVIDER */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Card Provider
                  </label>
                  <select
                    value={debitCardProvider}
                    onChange={(e) => setDebitCardProvider(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Provider</option>
                    {DEBIT_PROVIDERS.map((provider) => (
                      <option key={provider} value={provider}>
                        {provider}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Enter 16-digit card number
              </p>
            </div>
          )}

          {/* DETAIL */}
          {type && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {type === "loans" 
                  ? "Borrower / Notes" 
                  : type === "cash"
                  ? "Description"
                  : "Account Detail"}
              </label>
              <input
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={
                  type === "loans"
                    ? "e.g. Andi, due March"
                    : type === "cash"
                    ? "Main wallet or Emergency fund"
                    : "Account number or Mobile number"
                }
              />
            </div>
          )}

          {/* BALANCE */}
          {type && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {type === "loans" ? "Loan Amount" : "Current Balance"}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  Rp
                </span>
                <input
                  type="number"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 pl-10 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
            </div>
          )}
        </div>

        {/* STICKY BUTTON FOOTER */}
        <div className="sticky bottom-0 bg-white p-6 pt-4 border-t border-gray-200">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed font-medium text-sm"
              disabled={!type || !balance || (type !== "cash" && type !== "loans" && !provider)}
            >
              {isEdit ? "Update" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}