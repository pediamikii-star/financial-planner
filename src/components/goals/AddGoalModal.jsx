import { useState, useEffect, useRef } from "react";
import useGoalStore from "../../stores/goal.store";
import { ChevronDown } from "lucide-react";

const AddGoalModal = ({ editingGoal, onClose }) => {
  const { addGoal, updateGoal } = useGoalStore();
  
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    targetAmount: "",
    currentAmount: "",
    category: "other",
    accountId: "",
    deadline: "",
    priority: "medium",
    notes: ""
  });

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  /* =========================
     LOAD ACCOUNTS - VERSI ROBUST
  ========================= */
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        setLoading(true);
        
        let allAccounts = [];
        
        // COBA SEMUA KEMUNGKINAN
        const possibleKeys = [
          'account-store',
          'accounts',
          'user-accounts',
          'bank-accounts',
          'account_storage',
          'account_data'
        ];
        
        for (const key of possibleKeys) {
          try {
            const saved = localStorage.getItem(key);
            if (saved) {
              const parsed = JSON.parse(saved);
              
              // Coba ekstrak accounts dari berbagai struktur
              let extractedAccounts = [];
              
              // 1. Zustand format: {state: {accounts: [...]}}
              if (parsed?.state?.accounts && Array.isArray(parsed.state.accounts)) {
                extractedAccounts = parsed.state.accounts;
              }
              // 2. Array langsung
              else if (Array.isArray(parsed)) {
                extractedAccounts = parsed;
              }
              // 3. Object dengan property accounts
              else if (parsed?.accounts && Array.isArray(parsed.accounts)) {
                extractedAccounts = parsed.accounts;
              }
              // 4. Object dengan property data
              else if (parsed?.data?.accounts && Array.isArray(parsed.data.accounts)) {
                extractedAccounts = parsed.data.accounts;
              }
              
              if (extractedAccounts.length > 0) {
                // Filter hanya bank accounts
                const bankAccounts = extractedAccounts.filter(acc => {
                  if (!acc || typeof acc !== 'object') return false;
                  
                  // Cek berbagai field untuk type
                  const type = acc.type || acc.accountType || acc.bankType || "";
                  const name = acc.name || acc.bankName || "";
                  
                  // Terima jika: bank, digital-bank, atau namanya mengandung bank
                  const isBank = 
                    type === 'bank' || 
                    type === 'digital-bank' || 
                    type === 'digital bank' ||
                    name.toLowerCase().includes('bank') ||
                    name.toLowerCase().includes('bni') ||
                    name.toLowerCase().includes('bca') ||
                    name.toLowerCase().includes('bri') ||
                    name.toLowerCase().includes('mandiri') ||
                    name.toLowerCase().includes('cimb') ||
                    name.toLowerCase().includes('danamon') ||
                    name.toLowerCase().includes('maybank');
                  
                  return isBank;
                });
                
                if (bankAccounts.length > 0) {
                  // PERBAIKAN: Gunakan accountDetail bukan detail
                  const accountsWithId = bankAccounts.map((acc, index) => ({
                    // Copy semua properti
                    ...acc,
                    id: acc.id || acc.accountId || `bank-${Date.now()}-${index}`,
                    name: acc.name || acc.bankName || `Bank Account ${index + 1}`,
                    // GUNAKAN accountDetail BUKAN detail
                    accountDetail: acc.accountDetail || acc.detail || acc.accountNumber || acc.number || ""
                  }));
                  
                  // HAPUS property 'detail' dan 'type' jika ada
                  const cleanAccounts = accountsWithId.map(acc => {
                    const cleanAcc = { ...acc };
                    delete cleanAcc.detail;
                    delete cleanAcc.type;
                    return cleanAcc;
                  });
                  
                  allAccounts = [...allAccounts, ...cleanAccounts];
                }
              }
            }
          } catch (e) {
            console.log(`Error reading ${key}:`, e);
          }
        }
        
        // Jika masih kosong, coba manual hardcode
        if (allAccounts.length === 0) {
          // Coba ambil dari window jika ada
          if (window.accountStore && window.accountStore.getState) {
            try {
              const storeState = window.accountStore.getState();
              if (storeState && storeState.accounts) {
                const storeAccounts = storeState.accounts.filter(acc => 
                  acc && (acc.type === 'bank' || acc.type === 'digital-bank')
                );
                
                // Bersihkan property yang tidak diinginkan
                const cleanStoreAccounts = storeAccounts.map(acc => {
                  const cleanAcc = { ...acc };
                  delete cleanAcc.detail;
                  delete cleanAcc.type;
                  return cleanAcc;
                });
                
                allAccounts = cleanStoreAccounts;
              }
            } catch (e) {
              console.log("Error getting from window.accountStore:", e);
            }
          }
        }
        
        // Hapus duplikat berdasarkan id/name
        const uniqueAccounts = [];
        const seen = new Set();
        
        allAccounts.forEach(acc => {
          const identifier = acc.id || acc.name;
          if (!seen.has(identifier)) {
            seen.add(identifier);
            
            // PASTIKAN struktur konsisten
            const cleanAccount = {
              id: acc.id || `acc-${Date.now()}`,
              name: acc.name || "Unknown Account",
              accountDetail: acc.accountDetail || "",
              // Hapus property yang tidak diinginkan
            };
            
            // Copy property lain yang valid
            if (acc.accountNumber) cleanAccount.accountDetail = acc.accountNumber;
            if (acc.number) cleanAccount.accountDetail = acc.number;
            
            uniqueAccounts.push(cleanAccount);
          }
        });
        
        setAccounts(uniqueAccounts);
        
      } catch (error) {
        console.error("Error loading accounts:", error);
        setAccounts([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadAccounts();
    
    // Reload saat storage berubah
    const handleStorageChange = () => {
      loadAccounts();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  /* =========================
     CLICK OUTSIDE HANDLER
  ========================= */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  /* =========================
     SET FORM DATA WHEN EDITING
  ========================= */
  useEffect(() => {
    if (editingGoal) {
      // PERBAIKAN: Ambil hanya property yang diperlukan
      setForm({
        name: editingGoal.name || "",
        targetAmount: editingGoal.targetAmount?.toString() || "",
        currentAmount: editingGoal.currentAmount?.toString() || "",
        category: editingGoal.category || "other",
        accountId: editingGoal.accountId?.toString() || "",
        deadline: editingGoal.deadline || "",
        priority: editingGoal.priority || "medium",
        notes: editingGoal.notes || ""
      });
    }
  }, [editingGoal]);

  /* =========================
     HANDLERS
  ========================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectAccount = (account) => {
    const accountId = account.id ? account.id.toString() : "";
    
    setForm(prev => ({ 
      ...prev, 
      accountId: accountId
    }));
    setDropdownOpen(false);
  };

  const handleSave = () => {
    if (!form.name || !form.targetAmount) {
      alert("Please fill required fields");
      return;
    }

    // Cari account yang dipilih
    let selectedAccount = null;
    let accountName = "";
    let accountDetail = "";
    
    if (form.accountId) {
      selectedAccount = accounts.find(acc => 
        acc && acc.id?.toString() === form.accountId?.toString()
      );
      
      if (selectedAccount) {
        accountName = selectedAccount.name || "";
        accountDetail = selectedAccount.accountDetail || "";
      }
    }

    // STRUKTUR DATA YANG BENAR UNTUK GOAL
    const goalData = {
      // ID dan nama
      id: editingGoal?.id || Date.now().toString(),
      name: form.name.trim(),
      
      // Amounts
      targetAmount: Number(form.targetAmount) || 0,
      currentAmount: Number(form.currentAmount) || 0,
      
      // Kategori dan prioritas
      category: form.category,
      priority: form.priority,
      
      // Account info (sebagai string, bukan object)
      accountId: form.accountId || "",
      accountName: accountName,
      accountDetail: accountDetail,
      
      // Deadline dan notes
      deadline: form.deadline || null,
      notes: form.notes || "",
      
      // Timestamps
      createdAt: editingGoal?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // PERBAIKAN PENTING: Bersihkan data dari property yang tidak diinginkan
    const cleanGoalData = cleanObject(goalData);

    if (editingGoal) {
      updateGoal(cleanGoalData.id, cleanGoalData);
    } else {
      addGoal(cleanGoalData);
    }

    onClose();
  };

  // FUNGSI UNTUK MEMBERSIHKAN OBJECT DARI PROPERTY YANG TIDAK DIINGINKAN
  const cleanObject = (obj) => {
    const cleanObj = { ...obj };
    
    // Hapus property yang menyebabkan error
    const unwantedProperties = ['detail', 'type', 'account', 'description'];
    
    unwantedProperties.forEach(prop => {
      if (cleanObj.hasOwnProperty(prop)) {
        delete cleanObj[prop];
      }
    });
    
    return cleanObj;
  };

  /* =========================
     CATEGORIZE ACCOUNTS
  ========================= */
  const getCategorizedAccounts = () => {
    const banks = [];
    const digitalBanks = [];
    
    accounts.forEach(account => {
      if (!account) return;
      
      const accountName = (account.name || "").toLowerCase();
      
      // Klasifikasikan berdasarkan nama
      if (accountName.includes('jago') || 
          accountName.includes('seabank') || 
          accountName.includes('blu') ||
          accountName.includes('jenius') ||
          accountName.includes('neocommerce') ||
          accountName.includes('allobank') ||
          accountName.includes('linebank')) {
        digitalBanks.push(account);
      } else {
        banks.push(account);
      }
    });
    
    // Sort by name
    const sortByName = (a, b) => {
      const nameA = (a.name || "").toLowerCase();
      const nameB = (b.name || "").toLowerCase();
      return nameA.localeCompare(nameB);
    };
    
    banks.sort(sortByName);
    digitalBanks.sort(sortByName);
    
    return { banks, digitalBanks };
  };

  const { banks, digitalBanks } = getCategorizedAccounts();

  // Cari account yang dipilih untuk display
  const selectedAccount = accounts.find(acc => 
    acc && acc.id?.toString() === form.accountId?.toString()
  );

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-xl">
        {/* HEADER */}
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-800">
            {editingGoal ? "Edit Goal" : "Add New Goal"}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {editingGoal ? "Update your financial goal" : "Create a new financial goal to track"}
          </p>
        </div>

        {/* FORM CONTENT */}
        <div className="p-6 space-y-5">
          {/* CATEGORY */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="wedding">💍 Wedding & Marriage</option>
              <option value="house">🏠 House & Property</option>
              <option value="vehicle">🚗 Vehicle</option>
              <option value="travel">✈️ Travel</option>
              <option value="gadget">💻 Gadget & Tech</option>
              <option value="emergency">🏥 Emergency Fund</option>
              <option value="education">🎓 Education</option>
              <option value="family">👶 Family & Children</option>
              <option value="investment">📈 Investment</option>
              <option value="lifestyle">🛒 Lifestyle</option>
              <option value="other">🎯 Other</option>
            </select>
          </div>

          {/* GOAL DETAILS */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Goal Name
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g., Wedding, Emergency Fund, New Car"
                className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    Rp
                  </span>
                  <input
                    type="number"
                    name="targetAmount"
                    value={form.targetAmount}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-lg p-3 pl-10 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Already Saved
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    Rp
                  </span>
                  <input
                    type="number"
                    name="currentAmount"
                    value={form.currentAmount}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-lg p-3 pl-10 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SAVE TO ACCOUNT DROPDOWN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Save to Account
            </label>
            {loading ? (
              <div className="border border-gray-300 rounded-lg p-3 bg-gray-50 text-center">
                <p className="text-gray-500">Loading accounts...</p>
              </div>
            ) : accounts.length === 0 ? (
              <div className="border border-gray-300 rounded-lg p-3 bg-yellow-50">
                <p className="text-yellow-700 text-sm">
                  No bank accounts found. 
                  <br />
                  <span className="font-medium">Please create a bank account first in the Accounts page.</span>
                </p>
              </div>
            ) : (
              <div className="relative" ref={dropdownRef}>
                {/* Trigger Button */}
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex justify-between items-center hover:border-gray-400 transition"
                >
                  <div className="flex items-center gap-2">
                    {selectedAccount ? (
                      <div className="text-left">
                        <div className="font-medium text-gray-800 truncate">
                          {selectedAccount.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {selectedAccount.accountDetail || ""}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500">Select Account</span>
                    )}
                  </div>
                  <ChevronDown 
                    size={16} 
                    className={`transition-transform ${dropdownOpen ? "rotate-180" : ""} text-gray-500`}
                  />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
                    {/* BANK KONVENSIONAL */}
                    {banks.length > 0 && (
                      <div className="border-b border-gray-200">
                        <div className="px-4 py-2 bg-gray-50">
                          <h3 className="font-medium text-gray-800">BANK</h3>
                        </div>
                        {banks.map(account => {
                          const isSelected = form.accountId === account.id?.toString();
                          return (
                            <button
                              key={account.id || account.name}
                              type="button"
                              onClick={() => handleSelectAccount(account)}
                              className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex justify-between items-center transition ${
                                isSelected 
                                  ? "bg-blue-50 border-l-4 border-l-blue-500" 
                                  : ""
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <div className={`font-medium truncate ${
                                  isSelected ? "text-blue-600" : "text-gray-700"
                                }`}>
                                  {account.name}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {typeof account.accountDetail === 'string' ? account.accountDetail : ''}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* DIGITAL BANK */}
                    {digitalBanks.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-gray-50">
                          <h3 className="font-medium text-gray-800">DIGITAL BANK</h3>
                        </div>
                        {digitalBanks.map(account => {
                          const isSelected = form.accountId === account.id?.toString();
                          return (
                            <button
                              key={account.id || account.name}
                              type="button"
                              onClick={() => handleSelectAccount(account)}
                              className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex justify-between items-center transition ${
                                isSelected 
                                  ? "bg-blue-50 border-l-4 border-l-blue-500" 
                                  : ""
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <div className={`font-medium truncate ${
                                  isSelected ? "text-blue-600" : "text-gray-700"
                                }`}>
                                  {account.name}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {account.accountDetail || ""}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              {accounts.length} bank account{accounts.length !== 1 ? 's' : ''} available
            </div>
          </div>

          {/* TIMELINE & PRIORITY */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deadline
              </label>
              <input
                type="date"
                name="deadline"
                value={form.deadline}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* NOTES */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Add specific details or notes about this goal..."
              rows="3"
              className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* ACTIONS */}
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
              onClick={handleSave}
              disabled={!form.name || !form.targetAmount}
              className="px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {editingGoal ? "Update Goal" : "Create Goal"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddGoalModal;